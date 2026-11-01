/** Event-driven directory checks must follow stale in-flight maintenance syncs. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../scripts/api-handler.js'), 'utf8');
const start = source.indexOf('  async function syncConversationList(');
const end = source.indexOf('\n  async function getCachedConversationList(', start);
assert(start >= 0 && end > start, 'production directory sync coordinator is present');

function createHarness(runSync) {
  const context = {
    CFG: { MIN_SYNC_INTERVAL_MS: 60000 },
    K_ACCOUNT_DIRECTORY_TS: 'directory-ts-',
    getAccountId: async () => 'account-A',
    store: { get: async () => ({}) },
    readDirectory: async () => [],
    runSync,
    Date
  };
  vm.createContext(context);
  vm.runInContext(`
    let _syncPromise = null;
    let _syncAccountId = null;
    let _syncCheckLatest = false;
    let _syncRequireComplete = false;
    ${source.slice(start, end)}
    globalThis.sync = syncConversationList;
  `, context);
  return context;
}

const tick = () => new Promise(resolve => setImmediate(resolve));

async function main() {
  let resolveMaintenance;
  let maintenanceStarted;
  const maintenanceStartedPromise = new Promise(resolve => { maintenanceStarted = resolve; });
  let maintenanceCalls = 0;
  const maintenanceHarness = createHarness(() => {
    maintenanceCalls++;
    if (maintenanceCalls === 1) {
      maintenanceStarted();
      return new Promise(resolve => { resolveMaintenance = resolve; });
    }
    return Promise.resolve([{ id: 'new-conversation' }]);
  });

  const maintenance = maintenanceHarness.sync(false);
  await maintenanceStartedPromise;
  const eventCheck = maintenanceHarness.sync(false, { checkLatest: true });
  await tick();
  resolveMaintenance([{ id: 'old-directory-snapshot' }]);
  const [maintenanceResult, eventResult] = await Promise.all([maintenance, eventCheck]);
  assert.equal(maintenanceResult[0].id, 'old-directory-snapshot');
  assert.equal(maintenanceCalls, 2,
    'event-triggered latest check runs again after joining an older maintenance sync');
  assert.equal(eventResult[0].id, 'new-conversation',
    'event-triggered sync returns the directory snapshot taken after the event');

  let resolveEvent;
  let eventStarted;
  const eventStartedPromise = new Promise(resolve => { eventStarted = resolve; });
  let eventCalls = 0;
  const eventHarness = createHarness(() => {
    eventCalls++;
    eventStarted();
    return new Promise(resolve => { resolveEvent = resolve; });
  });
  const firstEvent = eventHarness.sync(false, { checkLatest: true });
  await eventStartedPromise;
  const secondEvent = eventHarness.sync(false, { checkLatest: true });
  await tick();
  resolveEvent([{ id: 'same-latest-snapshot' }]);
  const [firstResult, secondResult] = await Promise.all([firstEvent, secondEvent]);
  assert.equal(eventCalls, 1,
    'concurrent event-triggered checks share an already-current sync without a duplicate request');
  assert.equal(firstResult[0].id, 'same-latest-snapshot');
  assert.equal(secondResult[0].id, 'same-latest-snapshot');

  let resolveStrict;
  let strictStarted;
  const strictStartedPromise = new Promise(resolve => { strictStarted = resolve; });
  let strictCalls = 0;
  const strictHarness = createHarness((_forceFull, _accountId, requireComplete) => {
    strictCalls++;
    assert.equal(requireComplete, true);
    strictStarted();
    return new Promise(resolve => { resolveStrict = resolve; });
  });
  const firstStrict = strictHarness.sync(true, { requireComplete: true });
  await strictStartedPromise;
  const secondStrict = strictHarness.sync(true, { requireComplete: true });
  await tick();
  resolveStrict([{ id: 'verified-full-directory' }]);
  const [firstStrictResult, secondStrictResult] = await Promise.all([firstStrict, secondStrict]);
  assert.equal(strictCalls, 1,
    'concurrent initial-index requests share an already-running verified full scan');
  assert.equal(firstStrictResult[0].id, 'verified-full-directory');
  assert.equal(secondStrictResult[0].id, 'verified-full-directory');

  let resolvePartial;
  let partialStarted;
  const partialStartedPromise = new Promise(resolve => { partialStarted = resolve; });
  let resolveVerified;
  let verifiedStarted;
  const verifiedStartedPromise = new Promise(resolve => { verifiedStarted = resolve; });
  let upgradeCalls = 0;
  const upgradeHarness = createHarness((_forceFull, _accountId, requireComplete) => {
    upgradeCalls++;
    if (upgradeCalls === 1) {
      assert.equal(requireComplete, false);
      partialStarted();
      return new Promise(resolve => { resolvePartial = resolve; });
    }
    assert.equal(requireComplete, true);
    verifiedStarted();
    return new Promise(resolve => { resolveVerified = resolve; });
  });
  const partialSync = upgradeHarness.sync(false);
  await partialStartedPromise;
  const verifiedSync = upgradeHarness.sync(true, { requireComplete: true });
  await tick();
  resolvePartial([{ id: 'partial-directory' }]);
  await verifiedStartedPromise;
  resolveVerified([{ id: 'verified-directory' }]);
  const [partialResult, verifiedResult] = await Promise.all([partialSync, verifiedSync]);
  assert.equal(upgradeCalls, 2,
    'a strict full scan still follows an in-flight non-strict maintenance sync');
  assert.equal(partialResult[0].id, 'partial-directory');
  assert.equal(verifiedResult[0].id, 'verified-directory');

  const timestampStart = source.indexOf('  async function getConversationTimestamps(');
  const timestampEnd = source.indexOf('\n  async function scheduledConversationDetail', timestampStart);
  assert(timestampStart >= 0 && timestampEnd > timestampStart,
    'production timestamp directory fallback is present');
  const timestampContext = {
    readDirectory: async () => [],
    buildTimestampMap: records => new Map(records.map(record => [record.id, record]))
  };
  vm.createContext(timestampContext);
  vm.runInContext(`${source.slice(timestampStart, timestampEnd)}\n`
    + 'globalThis.timestamps = getConversationTimestamps;', timestampContext);
  const initialTimestamps = await timestampContext.timestamps(false);
  assert.equal(initialTimestamps.size, 0);
  assert.equal(initialTimestamps.partial, true,
    'empty local directory requests a single full sync rather than prefetching page zero separately');

  console.log('S4_DIRECTORY_SYNC_PASS: stale maintenance follow-up, event/strict sync coalescing, no duplicate initial page');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
