/** Production index runner tested against controlled task state, without APIs. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');

const source = fs.readFileSync(path.join(__dirname, '../scripts/content-chatgpt.js'), 'utf8');
const schemaVersionStart = source.indexOf('  const SEARCH_INDEX_SCHEMA_VERSION =');
const schemaVersionEnd = source.indexOf('\n', schemaVersionStart);
assert(schemaVersionStart >= 0 && schemaVersionEnd > schemaVersionStart,
  'search index schema version is present');
const schemaVersionSource = source.slice(schemaVersionStart, schemaVersionEnd);
const start = source.indexOf('  const INDEX_EXECUTOR_ID =');
const end = source.indexOf('  function searchResultTime(', start);
assert(start >= 0 && end > start, 'production task runner functions are present');

const jobs = new Map();
const fetched = [];
const indexed = new Map();
const pacingWaits = [];
const failOnce = new Set();
const failWithStatus = new Map();
let allowRetryPacing = false;
let pauseAfterFirst = false;
let cooldownUntil = 0;
const accountId = 'account-A';
let consentApproved = false;
let policy = { consentAt: null, initialCompletedAt: null, initialSnapshotReady: false,
  initialSnapshotAt: null, skippedIndexIds: [] };
let strictFullScans = 0;
const initialScanItems = [
  { id: 'first-consented', title: 'Full scan item', updateTime: 11 },
  { id: 'second-consented', title: 'Second full scan item', updateTime: 12 }
];
const context = {
  console,
  Date,
  crypto: { randomUUID },
  EXPORT_GROUP_SIZE: 50,
  INDEX_REQUEST_GAP_MS: 3000,
  EXPORT_GROUP_GAP_MS: 10000,
  S: { settings: { enabled: true } },
  document: { hidden: false },
  log() {},
  window: {
    confirm: () => consentApproved,
    ChatGPTProI18n: { t: value => value },
    APIHandler: {
      getAccountId: async () => accountId,
      syncConversationList: async (full, options) => {
        assert(full && options?.requireComplete, 'first approved indexing requires a verified full directory');
        strictFullScans++;
        return initialScanItems;
      }
    },
    setInterval: () => 1,
    clearInterval: () => {}
  },
  timestampValue: v => Number(v || 0),
  fetchConversationForExport: async (record, _progress, _onProgress, options = {}) => {
    fetched.push(record.id);
    if (failWithStatus.has(record.id)) {
      const status = failWithStatus.get(record.id);
      failWithStatus.delete(record.id);
      if (status === 429) assert.equal(options.pauseOnRateLimit, true,
        'index runner delegates 429 to durable task recovery');
      throw Object.assign(Error(`mock HTTP ${status}`), { status, retryAfterMs: 2500 });
    }
    if (failOnce.delete(record.id)) throw Error('mock temporary failure');
    return { data: { id: record.id, title: record.title, mapping: {},
      ...(record.rawUpdateTime ? { update_time: record.rawUpdateTime } : {}) },
      source: record.network ? 'network' : 'cache' };
  },
  buildSearchIndexRecord: (data, record) => ({ id: record.id, updateTime: record.updateTime, messages: [] }),
  waitForExport: async ms => {
    pacingWaits.push(ms);
    if (!allowRetryPacing) throw new Error('local records should not incur network pacing');
  },
  async runtimeMessage(msg) {
    assert.equal(msg.accountId, accountId);
    const job = jobs.get(msg.id);
    switch (msg.action) {
      case 'indexPolicyGet': return { success: true, result: { ...policy,
        skippedIndexIds: [...(policy.skippedIndexIds || [])] } };
      case 'logList': return { success: true, result: [] };
      case 'detailStatus': return { success: true, result: { cooldownUntil } };
      case 'localDataStats': return { success: true, directory: 0, complete: 0, indexed: indexed.size };
      case 'indexSetupPhase': return { success: true, result: { phase: msg.phase } };
      case 'indexPolicyConsent':
        policy.consentAt ||= Date.now();
        return { success: true, result: { ...policy } };
      case 'indexPolicyDirectoryVerified':
        assert.deepEqual(msg.records.map(record => record.id), initialScanItems.map(record => record.id));
        policy.initialSnapshotReady = true;
        policy.initialSnapshotAt = Date.now();
        return { success: true, result: { total: initialScanItems.length } };
      case 'indexPolicyFinishInitial':
        policy.initialCompletedAt ||= Date.now();
        policy.initialSnapshotReady = false;
        return { success: true, result: { completed: true, remaining: 0 } };
      case 'searchIndexMetadata':
        return { success: true, records: [...indexed.entries()].map(([id, updateTime]) => ({
          id, updateTime, schemaVersion: 2
        })) };
      case 'taskList':
        return { success: true, result: [...jobs.values()].sort((a, b) =>
          Number(b.updatedAt || 0) - Number(a.updatedAt || 0)) };
      case 'taskGet':
        return { success: true, result: job || null };
      case 'taskCreate': {
        const active = [...jobs.values()].find(task => task.type === 'index'
          && ['pending', 'running', 'paused'].includes(task.status));
        if (active) {
          if (msg.options?.rejectIfActive) throw Error('E_TASK_ALREADY_ACTIVE');
          return { success: true, result: active };
        }
        const task = { id: randomUUID(), type: 'index', accountId, items: msg.items,
          nextIndex: 0, status: 'pending', successCount: 0, failureCount: 0,
          consecutiveFailures: 0, rateLimitPauseCount: 0,
          skippedCount: 0, skippedIds: [], errors: [], lease: null,
          createdAt: Date.now(), updatedAt: Date.now() };
        jobs.set(task.id, task);
        return { success: true, result: task };
      }
      case 'taskClaim':
        if (job.status === 'paused' || job.status === 'completed') return { success: true, result: { acquired: false } };
        job.status = 'running';
        job.lease = { owner: msg.owner, token: randomUUID() };
        return { success: true, result: { acquired: true, token: job.lease.token, task: job } };
      case 'taskHeartbeat':
        if (job.status !== 'running' || job.lease?.token !== msg.token) throw Error('任务租约已失效');
        return { success: true, result: { task: job } };
      case 'taskPhase':
        if (job.status !== 'running' || job.lease?.token !== msg.token) throw Error('任务租约已失效');
        job.phase = msg.phase;
        job.waitUntil = msg.waitUntil || 0;
        return { success: true, result: { task: job } };
      case 'taskControl':
        if (msg.operation === 'pause') {
          job.status = 'paused';
          job.lease = null;
          if (msg.reason === 'rate-limit') {
            job.rateLimitPauseCount = (job.rateLimitPauseCount || 0) + 1;
            job.phase = job.rateLimitPauseCount > 3 ? 'rate-limit-exhausted' : 'rate-limit';
          } else job.phase = msg.reason === 'auth-error' ? 'auth-error' : 'paused';
        } else if (msg.operation === 'resume') {
          job.status = 'pending';
          job.phase = 'pending';
          job.waitUntil = 0;
          if (msg.reason !== 'auto-rate-limit') {
            job.consecutiveFailures = 0;
            job.rateLimitPauseCount = 0;
          }
        }
        return { success: true, result: { task: job } };
      case 'localDataPutConversation':
        if (msg.record.id === 'newer-detail') {
          assert.equal(msg.record.updateTime, 1700000100,
            'detail JSON version takes precedence over a stale directory timestamp');
        }
        indexed.set(msg.record.id, msg.record.searchRecord.updateTime);
        return { success: true };
      case 'taskCheckpoint':
        if (job.status !== 'running' || job.lease?.token !== msg.token) throw Error('任务租约已失效');
        assert.equal(msg.itemIndex, job.nextIndex, 'checkpoint must be monotonic');
        job.nextIndex++;
        job.updatedAt = Date.now();
        if (msg.outcome === 'success') {
          job.successCount++;
          job.consecutiveFailures = 0;
          job.rateLimitPauseCount = 0;
        } else {
          job.failureCount++;
          job.consecutiveFailures++;
          job.errors.push({ id: job.items[msg.itemIndex].id, message: msg.error });
        }
        if (job.nextIndex === job.items.length) job.status = 'completed';
        else if (pauseAfterFirst || job.consecutiveFailures >= 3) {
          job.status = 'paused'; job.lease = null;
          job.phase = job.consecutiveFailures >= 3 ? 'consecutive-failures' : 'paused';
        }
        return { success: true, result: { task: job } };
      default: throw Error('Unexpected action: ' + msg.action);
    }
  }
};
vm.createContext(context);
vm.runInContext(`${schemaVersionSource}\n${source.slice(start, end)}\nglobalThis.runner = {
  updateFullTextIndex, runIndexTask, recoverIndexTasks, updateIndexWithConsent, maybeAutoIncrementalIndex
};`, context);
vm.runInContext('globalThis.runner.retryIndexConversation = retryIndexConversation;', context);
const managedRetryStart = source.indexOf('  async function retryManagedIndexItem(');
const managedRetryEnd = source.indexOf('\n  async function downloadManagedTaskVolumes', managedRetryStart);
assert(managedRetryStart >= 0 && managedRetryEnd > managedRetryStart,
  'Popup single-item retry handler is present');
vm.runInContext(`${source.slice(managedRetryStart, managedRetryEnd)}\n`
  + 'globalThis.retryManagedIndexItem = retryManagedIndexItem;', context);
const dashboardStart = source.indexOf('  async function getTaskDashboard() {');
const dashboardEnd = source.indexOf('\n  async function manageAccountLocalData', dashboardStart);
assert(dashboardStart >= 0 && dashboardEnd > dashboardStart, 'task dashboard summary is present');
vm.runInContext(`${source.slice(dashboardStart, dashboardEnd)}\n`
  + 'globalThis.getTaskDashboard = getTaskDashboard;', context);

async function main() {
  const records = ['a', 'b', 'c'].map((id, i) => ({ id, title: id, updateTime: i + 1 }));
  pauseAfterFirst = true;
  await assert.rejects(() => context.runner.updateFullTextIndex(records), /任务租约/);
  const job = [...jobs.values()][0];
  assert.equal(job.nextIndex, 1);
  assert.equal(job.status, 'paused');
  assert.deepEqual(fetched, ['a']);
  await context.runner.recoverIndexTasks();
  assert.deepEqual(fetched, ['a'], 'paused jobs must not auto-resume');

  pauseAfterFirst = false;
  job.status = 'pending'; // User explicitly resumed it.
  const result = await context.runner.runIndexTask(accountId, job.id);
  assert.equal(result.indexedCount, 3);
  assert.equal(job.nextIndex, 3);
  assert.equal(job.status, 'completed');
  assert.deepEqual(fetched, ['a', 'b', 'c'], 'already completed record was not reprocessed');
  const reuse = await context.runner.updateFullTextIndex(records);
  assert.equal(reuse.skippedCount, 0, 'already indexed conversations are not reported as intentionally skipped');
  assert.equal(reuse.alreadyIndexedCount, 3);
  assert.deepEqual(fetched, ['a', 'b', 'c'], 'unchanged fully indexed records require no network');

  const extra = [{ id: 'd', title: 'd', updateTime: 4 }];
  const pending = { id: randomUUID(), accountId, type: 'index', items: extra,
    nextIndex: 0, status: 'pending', lease: null, successCount: 0, failureCount: 0, errors: [] };
  jobs.set(pending.id, pending);
  await context.runner.recoverIndexTasks();
  assert.equal(pending.status, 'completed');
  assert.equal(fetched.at(-1), 'd', 'reopening a tab resumes pending work');
  const beforeConsentFetches = fetched.length;
  const beforeAuto = await context.runner.maybeAutoIncrementalIndex(initialScanItems);
  assert.equal(beforeAuto.skipped, 'initial-consent-or-index-incomplete');
  assert.equal(fetched.length, beforeConsentFetches, 'automatic index is disabled until consent and first completion');
  const denied = await context.runner.updateIndexWithConsent(initialScanItems);
  assert.equal(denied.consentDeclined, true, 'first index requires explicit user approval');
  assert.equal(strictFullScans, 0, 'declined initial index cannot scan all conversations');
  consentApproved = true;
  pauseAfterFirst = true;
  await assert.rejects(() => context.runner.updateIndexWithConsent(initialScanItems), /任务租约/,
    'interrupted first index leaves its task resumable');
  const firstTask = [...jobs.values()].find(task => task.items?.some(item => item.id === 'first-consented'));
  assert.equal(firstTask.status, 'paused');
  assert.equal(policy.initialCompletedAt, null,
    'a paused first index cannot enable automatic updates prematurely');
  await context.runner.recoverIndexTasks();
  assert.equal(firstTask.status, 'paused', 'manual pauses are not silently resumed');
  pauseAfterFirst = false;
  await context.runtimeMessage({ action: 'taskControl', accountId, id: firstTask.id, operation: 'resume' });
  await context.runner.recoverIndexTasks();
  assert.equal(firstTask.status, 'completed');
  assert.ok(policy.initialCompletedAt,
    'resuming the first index through task recovery persists its completion and unlocks auto updates');
  assert.equal(policy.initialSnapshotReady, false,
    'completed first index retires its temporary full-directory snapshot');
  assert.equal(strictFullScans, 1, 'first consent triggers exact full directory scan');
  assert.deepEqual(fetched.slice(-2), ['first-consented', 'second-consented']);
  const newRecord = [{ id: 'post-consent', title: 'Incremental item', updateTime: 12 }];
  const automatic = await context.runner.maybeAutoIncrementalIndex(newRecord);
  assert.equal(automatic.automatic, true);
  assert.equal(automatic.indexedCount, 1);
  assert.equal(fetched.at(-1), 'post-consent');
  const throttled = await context.runner.maybeAutoIncrementalIndex([
    { id: 'event-driven', title: 'Event driven item', updateTime: 13 }
  ]);
  assert.equal(throttled.skipped, 'recent');
  const eventDriven = await context.runner.maybeAutoIncrementalIndex([
    { id: 'event-driven', title: 'Event driven item', updateTime: 13 }
  ], { force: true });
  assert.equal(eventDriven.indexedCount, 1,
    'conversation/message events can bypass the maintenance poll throttle');
  assert.equal(fetched.at(-1), 'event-driven');
  const newerDetail = await context.runner.maybeAutoIncrementalIndex([
    { id: 'newer-detail', title: 'Newer detail', updateTime: 14, rawUpdateTime: 1700000100 }
  ], { force: true });
  assert.equal(newerDetail.indexedCount, 1);
  assert.equal(strictFullScans, 1, 'automatic incremental indexing never repeats first full scan');

  policy.skippedIndexIds = ['user-skipped'];
  const beforeSkipFilter = fetched.length;
  const afterSkipFilter = await context.runner.updateFullTextIndex([
    { id: 'user-skipped', title: 'User skipped', updateTime: 15 },
    { id: 'after-skip', title: 'After skip', updateTime: 16 },
    { id: 'after-skip-2', title: 'After skip 2', updateTime: 17 }
  ]);
  assert.equal(afterSkipFilter.indexedCount, 2);
  assert.equal(afterSkipFilter.skippedCount, 1,
    'one explicitly skipped conversation does not count the other queue entries as skipped');
  assert.deepEqual(fetched.slice(beforeSkipFilter), ['after-skip', 'after-skip-2'],
    'only the selected conversation is excluded; all other conversations are indexed');
  const beforeNoPending = fetched.length;
  const noPending = await context.runner.updateFullTextIndex([
    { id: 'user-skipped', title: 'User skipped', updateTime: 15 },
    { id: 'after-skip', title: 'After skip', updateTime: 16 },
    { id: 'after-skip-2', title: 'After skip 2', updateTime: 17 }
  ]);
  assert.equal(noPending.skippedCount, 1);
  assert.equal(noPending.alreadyIndexedCount, 2,
    'a no-op update distinguishes the one skipped conversation from two already indexed conversations');
  assert.equal(fetched.length, beforeNoPending, 'no-op update makes no detail requests');

  const retryRecords = [
    { id: 'retry-once', title: 'Retry once', updateTime: 17 },
    { id: 'retry-success', title: 'Keep success', updateTime: 18 }
  ];
  allowRetryPacing = true;
  const beforeNetworkPacing = pacingWaits.length;
  await context.runner.updateFullTextIndex([
    { id: 'network-paced-1', title: 'Network paced 1', updateTime: 170, network: true },
    { id: 'network-paced-2', title: 'Network paced 2', updateTime: 171, network: true }
  ]);
  assert.deepEqual(pacingWaits.slice(beforeNetworkPacing), [3000],
    'network-backed index requests wait exactly 3 seconds between conversations');

  failOnce.add('retry-once');
  const beforeFirstAttempt = fetched.length;
  const firstAttempt = await context.runner.updateFullTextIndex(retryRecords);
  assert.equal(firstAttempt.failures.length, 1, 'first task records the failed conversation');
  assert.match(firstAttempt.failures[0], /^retry-once：/);
  assert.deepEqual(fetched.slice(beforeFirstAttempt), ['retry-once', 'retry-success']);
  const failedTask = [...jobs.values()].find(task => task.items?.some(item => item.id === 'retry-once')
    && task.errors?.some(error => error.id === 'retry-once'));
  await assert.rejects(() => context.retryManagedIndexItem(failedTask.id, 'not-a-failure'),
    /E_INDEX_RETRY_FAILURE_NOT_FOUND/, 'Popup retry rejects IDs that are not failed items in the selected task');

  const beforeSingleRetry = fetched.length;
  const retried = await context.retryManagedIndexItem(failedTask.id, 'retry-once');
  assert.equal(retried.indexedCount, 1, 'single-item retry creates and completes a one-record task');
  assert.deepEqual(fetched.slice(beforeSingleRetry), ['retry-once'],
    'single-item retry does not refetch any previously successful conversation');
  const dashboardAfterRetry = await context.getTaskDashboard();
  assert.equal(dashboardAfterRetry.tasks.find(task => task.id === failedTask.id).errors.length, 0,
    'dashboard hides the original failure after the retried conversation has a current index');
  const beforeAlreadyIndexedRetry = fetched.length;
  const alreadyIndexed = await context.runner.retryIndexConversation(retryRecords[1]);
  assert.equal(alreadyIndexed.alreadyIndexed, true, 'already indexed item is treated as a no-op');
  assert.equal(fetched.length, beforeAlreadyIndexedRetry,
    'already indexed item retry makes no detail request');
  policy.skippedIndexIds = ['skipped-retry'];
  const beforeSkippedRetry = fetched.length;
  const skippedRetry = await context.runner.retryIndexConversation({
    id: 'skipped-retry', title: 'Skipped retry', updateTime: 20
  });
  assert.equal(skippedRetry.skipped, true, 'permanently skipped conversations cannot be retried');
  assert.equal(fetched.length, beforeSkippedRetry, 'skipped conversation retry makes no detail request');
  policy.skippedIndexIds = [];

  const activeBlocker = { id: randomUUID(), accountId, type: 'index',
    items: [{ id: 'active-blocker' }], nextIndex: 0, status: 'paused', lease: null };
  jobs.set(activeBlocker.id, activeBlocker);
  await assert.rejects(() => context.runner.retryIndexConversation({
    id: 'blocked-retry', title: 'Blocked retry', updateTime: 19
  }), /E_TASK_ALREADY_ACTIVE/,
    'single-item retry refuses to attach to a paused active task');
  jobs.delete(activeBlocker.id);

  const rateLimitedRecord = [{ id: 'rate-limited', title: 'Rate limited', updateTime: 21 }];
  cooldownUntil = Date.now() + 2500;
  failWithStatus.set('rate-limited', 429);
  const beforeRateLimit = fetched.length;
  const rateLimited = await context.runner.updateFullTextIndex(rateLimitedRecord);
  const rateTask = [...jobs.values()].find(task => task.items?.some(item => item.id === 'rate-limited'));
  assert.equal(rateLimited.paused, true, '429 pauses the task instead of consuming the failed item');
  assert.equal(rateLimited.pauseReason, 'rate-limit');
  assert.equal(rateTask.status, 'paused');
  assert.equal(rateTask.phase, 'rate-limit');
  assert.equal(rateTask.nextIndex, 0, '429 leaves the current conversation checkpoint untouched');
  assert.ok(rateTask.waitUntil >= cooldownUntil, 'retry time includes the persisted shared cooldown');
  await context.runner.recoverIndexTasks();
  assert.equal(fetched.length, beforeRateLimit + 1, 'recovery does not retry before the cooldown expires');
  cooldownUntil = 0;
  rateTask.waitUntil = Date.now() - 1;
  await context.runner.recoverIndexTasks();
  assert.equal(rateTask.status, 'completed', 'expired rate-limit pause resumes automatically');
  assert.equal(rateTask.nextIndex, 1);
  assert.deepEqual(fetched.slice(beforeRateLimit), ['rate-limited', 'rate-limited'],
    'automatic recovery retries only the uncheckpointed conversation');
  failWithStatus.set('auth-blocked', 403);
  await assert.rejects(() => context.runner.updateFullTextIndex([
    { id: 'auth-blocked', title: 'Permission blocked', updateTime: 22 }
  ]), /登录\/权限异常，任务已暂停/,
  '403 pauses the index task immediately for manual intervention');
  const authTask = [...jobs.values()].find(task => task.items?.some(item => item.id === 'auth-blocked'));
  assert.equal(authTask.status, 'paused');
  assert.equal(authTask.phase, 'auth-error');
  assert.equal(authTask.nextIndex, 0, 'authentication failure does not consume the current item');
  jobs.clear();
  policy = { consentAt: Date.now(), initialCompletedAt: null, initialSnapshotReady: true,
    initialSnapshotAt: Date.now() + 1000, skippedIndexIds: [] };
  const legacyCompletedTask = { id: randomUUID(), accountId, type: 'index',
    items: [{ id: 'legacy-completed-initial-item' }], nextIndex: 1,
    status: 'completed', lease: null, successCount: 1, failureCount: 0, errors: [] };
  jobs.set(legacyCompletedTask.id, legacyCompletedTask);
  const unrelatedPausedTask = { id: randomUUID(), accountId, type: 'index',
    items: [{ id: 'unrelated-item' }], nextIndex: 0,
    status: 'paused', lease: null, successCount: 0, failureCount: 0, errors: [] };
  jobs.set(unrelatedPausedTask.id, unrelatedPausedTask);
  await context.runner.recoverIndexTasks();
  assert.ok(policy.initialCompletedAt,
    'startup recovery finalizes an already-completed initial task even when another unrelated index task is paused');
  assert.equal(policy.initialSnapshotReady, false,
    'one-time reconciliation retires the stale first-index snapshot');
  console.log('S3_S4_PASS: checkpoints, pause/resume, first consent, verified full scan, auto incremental, persistent skip, single-item retry, rate-limit auto recovery, auth pause');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
