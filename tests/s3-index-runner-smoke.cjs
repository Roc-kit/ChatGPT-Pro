/** Production index runner tested against controlled task state, without APIs. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');

const source = fs.readFileSync(path.join(__dirname, '../scripts/content-chatgpt.js'), 'utf8');
const start = source.indexOf('  const INDEX_EXECUTOR_ID =');
const end = source.indexOf('  function searchResultTime(', start);
assert(start >= 0 && end > start, 'production task runner functions are present');

const jobs = new Map();
const fetched = [];
const indexed = new Map();
let pauseAfterFirst = false;
const accountId = 'account-A';
let consentApproved = false;
let policy = { consentAt: null, initialCompletedAt: null };
let strictFullScans = 0;
const initialScanItems = [{ id: 'first-consented', title: 'Full scan item', updateTime: 11 }];
const context = {
  console,
  Date,
  crypto: { randomUUID },
  EXPORT_GROUP_SIZE: 50,
  EXPORT_REQUEST_GAP_MS: 900,
  EXPORT_GROUP_GAP_MS: 10000,
  S: { settings: { enabled: true } },
  document: { hidden: false },
  log() {},
  window: {
    confirm: () => consentApproved,
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
  fetchConversationForExport: async record => {
    fetched.push(record.id);
    return { data: { id: record.id, title: record.title, mapping: {} }, source: 'cache' };
  },
  buildSearchIndexRecord: (data, record) => ({ id: record.id, updateTime: record.updateTime, messages: [] }),
  waitForExport: async () => { throw new Error('local records should not incur network pacing'); },
  async runtimeMessage(msg) {
    assert.equal(msg.accountId, accountId);
    const job = jobs.get(msg.id);
    switch (msg.action) {
      case 'indexPolicyGet': return { success: true, result: { ...policy } };
      case 'indexPolicyConsent':
        policy.consentAt ||= Date.now();
        return { success: true, result: { ...policy } };
      case 'indexPolicyDirectoryVerified':
        assert.deepEqual(msg.records.map(record => record.id), initialScanItems.map(record => record.id));
        return { success: true, result: { total: initialScanItems.length } };
      case 'indexPolicyFinishInitial':
        policy.initialCompletedAt ||= Date.now();
        return { success: true, result: { completed: true, remaining: 0 } };
      case 'searchIndexMetadata':
        return { success: true, records: [...indexed.entries()].map(([id, updateTime]) => ({ id, updateTime })) };
      case 'taskList':
        return { success: true, result: [...jobs.values()] };
      case 'taskCreate': {
        const task = { id: randomUUID(), type: 'index', accountId, items: msg.items,
          nextIndex: 0, status: 'pending', successCount: 0, failureCount: 0, errors: [], lease: null };
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
      case 'localDataPutConversation':
        indexed.set(msg.record.id, msg.record.searchRecord.updateTime);
        return { success: true };
      case 'taskCheckpoint':
        if (job.status !== 'running' || job.lease?.token !== msg.token) throw Error('任务租约已失效');
        assert.equal(msg.itemIndex, job.nextIndex, 'checkpoint must be monotonic');
        job.nextIndex++;
        if (msg.outcome === 'success') job.successCount++;
        else { job.failureCount++; job.errors.push({ id: job.items[msg.itemIndex].id, message: msg.error }); }
        if (job.nextIndex === job.items.length) job.status = 'completed';
        else if (pauseAfterFirst) { job.status = 'paused'; job.lease = null; }
        return { success: true, result: { task: job } };
      default: throw Error('Unexpected action: ' + msg.action);
    }
  }
};
vm.createContext(context);
vm.runInContext(`${source.slice(start, end)}\nglobalThis.runner = {
  updateFullTextIndex, runIndexTask, recoverIndexTasks, updateIndexWithConsent, maybeAutoIncrementalIndex
};`, context);

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
  assert.equal(reuse.skippedCount, 3);
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
  const first = await context.runner.updateIndexWithConsent(initialScanItems);
  assert.equal(first.initialCompleted, true);
  assert.equal(strictFullScans, 1, 'first consent triggers exact full directory scan');
  assert.equal(fetched.at(-1), 'first-consented');
  const newRecord = [{ id: 'post-consent', title: 'Incremental item', updateTime: 12 }];
  const automatic = await context.runner.maybeAutoIncrementalIndex(newRecord);
  assert.equal(automatic.automatic, true);
  assert.equal(automatic.indexedCount, 1);
  assert.equal(fetched.at(-1), 'post-consent');
  assert.equal(strictFullScans, 1, 'automatic incremental indexing never repeats first full scan');
  console.log('S3_S4_PASS: checkpoints, pause/resume, first consent, verified full scan, auto incremental');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
