/** A cached detail/index newer than a lagging directory remains current. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../scripts/local-data-store.js'), 'utf8');

function extract(start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert(from >= 0 && to > from, `missing production function: ${start}`);
  return source.slice(from, to);
}

const normalizeTime = extract('  function normalizeTime(value) {', '\n  function validateRaw(');
const getConversation = extract('  async function getConversation(', '\n  async function getStats(');
const finishInitialIndex = extract('  async function finishInitialIndex(', '\n  const TASK_LEASE_MS');

function createHarness({ raw, indexedRecords, account }) {
  const state = { raw, indexedRecords, account, tasks: [] };
  const stores = {
    conversations: {
      get: key => Promise.resolve(state.raw?.[`${key[0]}:${key[1]}`] || null)
    },
    accounts: {
      get: () => Promise.resolve(state.account),
      put: value => { state.account = value; return Promise.resolve(); }
    },
    search: {
      index: () => ({ getAll: () => Promise.resolve(state.indexedRecords) })
    },
    tasks: {
      index: () => ({ getAll: () => Promise.resolve(state.tasks) })
    }
  };
  const context = {
    STORES: { conversations: 'conversations', accounts: 'accounts', search: 'search', tasks: 'tasks' },
    IDBKeyRange: { only: value => value },
    normalizeTime,
    validateAccount: value => { if (!value) throw new Error('invalid account'); },
    validateId: value => { if (!value) throw new Error('invalid id'); return value; },
    requested: request => Promise.resolve(request),
    transaction: async (_names, _mode, operation) => operation(stores)
  };
  vm.createContext(context);
  vm.runInContext(`${normalizeTime}\n${getConversation}\n${finishInitialIndex}\n`
    + 'globalThis.readConversation = getConversation;\n'
    + 'globalThis.finishInitial = finishInitialIndex;', context);
  return { context, state };
}

async function main() {
  const directoryVersion = 1700000000;
  const newerDetailVersion = 1700000005000;
  const olderDetailVersion = 1699999999000;
  const raw = { 'account-A:chat-1': {
    accountId: 'account-A', id: 'chat-1', complete: true,
    dataVersion: newerDetailVersion, raw: { id: 'chat-1', mapping: {} }, savedAt: 1
  } };

  const cacheHarness = createHarness({ raw, indexedRecords: [], account: null });
  const newerCache = await cacheHarness.context.readConversation('account-A', 'chat-1', directoryVersion);
  assert.equal(newerCache.hit, true,
    'a complete local JSON newer than the directory snapshot is a valid cache hit');
  assert.equal(newerCache.dataVersion, newerDetailVersion);
  assert.equal(newerCache.raw.id, 'chat-1');

  cacheHarness.state.raw['account-A:chat-1'].dataVersion = olderDetailVersion;
  const staleCache = await cacheHarness.context.readConversation('account-A', 'chat-1', directoryVersion);
  assert.equal(staleCache.hit, false, 'a local JSON older than the directory remains stale');
  assert.equal(staleCache.stale, true);
  assert.equal(Object.hasOwn(staleCache, 'raw'), false, 'stale raw content is never returned');

  const snapshot = [{ id: 'chat-1', updateTime: directoryVersion }];
  const initialHarness = createHarness({
    raw: {},
    indexedRecords: [{ id: 'chat-1', dataVersion: newerDetailVersion, schemaVersion: 2 }],
    account: {
      fullIndexConsentAt: 100,
      fullDirectoryScannedAt: 200,
      firstIndexSnapshot: snapshot,
      skippedIndexIds: [],
      initialIndexCompletedAt: null
    }
  });
  const initialResult = await initialHarness.context.finishInitial('account-A');
  assert.equal(initialResult.completed, true,
    'a newer indexed detail satisfies the older verified first-scan directory version');
  assert.equal(initialResult.remaining, 0);
  assert.equal(initialHarness.state.account.autoIncrementalIndex, true,
    'successful initial completion still enables automatic incremental indexing');
  assert.equal(initialHarness.state.account.firstIndexSnapshot, undefined,
    'the verified snapshot is cleared after successful completion');

  const behindHarness = createHarness({
    raw: {},
    indexedRecords: [{ id: 'chat-1', dataVersion: olderDetailVersion, schemaVersion: 2 }],
    account: {
      fullIndexConsentAt: 100,
      fullDirectoryScannedAt: 200,
      firstIndexSnapshot: snapshot,
      skippedIndexIds: [],
      initialIndexCompletedAt: null
    }
  });
  const behindResult = await behindHarness.context.finishInitial('account-A');
  assert.equal(behindResult.completed, false, 'an index behind the directory cannot finish initial indexing');
  assert.equal(behindResult.remaining, 1);
  assert.equal(behindHarness.state.account.initialIndexCompletedAt, null);

  const unknownVersionHarness = createHarness({
    raw: {},
    indexedRecords: [{ id: 'chat-1', dataVersion: null, schemaVersion: 2 }],
    account: {
      fullIndexConsentAt: 100,
      fullDirectoryScannedAt: 200,
      firstIndexSnapshot: [{ id: 'chat-1', updateTime: null }],
      skippedIndexIds: [],
      initialIndexCompletedAt: null
    }
  });
  assert.equal((await unknownVersionHarness.context.finishInitial('account-A')).completed, true,
    'records without a directory timestamp preserve the existing null-version completion rule');

  console.log('S1_CACHE_VERSION_PASS: newer cache hit, older cache rejected, initial-index monotonic version check');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
