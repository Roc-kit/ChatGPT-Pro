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

  console.log('S4_DIRECTORY_SYNC_PASS: stale maintenance follow-up, current event sync coalescing');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
