/** Browser-native IndexedDB S1 regression; no npm dependencies or real API. */
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const source = fs.readFileSync(path.join(__dirname, '../scripts/local-data-store.js'));
const background = fs.readFileSync(path.join(__dirname, '../scripts/background.js'));
const apiHandler = fs.readFileSync(path.join(__dirname, '../scripts/api-handler.js'));
const harness = `<!doctype html><meta charset="utf-8"><pre id="result">RUNNING</pre><script>
(async function () {
  const check = (ok, message) => { if (!ok) throw Error(message); };
  const req = request => new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/local-data-store.js'; s.onload = resolve; s.onerror = reject;
      document.head.append(s);
    });
    const storage = window.ChatGPTProLocalData;
    const currentDb = await storage.openDb();
    check(currentDb.version === 4 && currentDb.objectStoreNames.contains('tasks')
      && currentDb.objectStoreNames.contains('logs') && currentDb.objectStoreNames.contains('taskVolumes')
      && currentDb.objectStoreNames.contains('taskVolumeChunks')
      && !currentDb.objectStoreNames.contains('conversations'),
      'current schema contains only account-scoped full-text storage');
    currentDb.close();
    // Exercise the actual account-scoped background search path.
    window.importScripts = () => {};
    const callbacks = [];
    const localSettings = {
      chatgpt_pro_directory_v1: [{ id: 'unknown-old-owner', title: 'unassigned legacy directory' }]
    };
    window.chrome = {
      runtime: {
        onInstalled: { addListener() {} },
        onMessage: { addListener(callback) { callbacks.push(callback); } },
        sendMessage(message, respond) {
          for (const callback of callbacks) {
            if (callback(message, {}, respond) === true) return;
          }
          throw Error('No runtime listener for ' + message.action);
        }
      },
      storage: { local: {
        get(keys, respond) {
          const names = Array.isArray(keys) ? keys : [keys];
          respond(Object.fromEntries(names.filter(key => key in localSettings).map(key => [key, localSettings[key]])));
        },
        set(values, respond) { Object.assign(localSettings, values); respond?.(); },
        remove(keys, respond) { for (const key of Array.isArray(keys) ? keys : [keys]) delete localSettings[key]; respond?.(); }
      } }
    };
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/background.js'; s.onload = resolve; s.onerror = reject;
      document.head.append(s);
    });
    const rawA = { id: 'same-id', title: 'A', mapping: { m: { message: { content: 'A text' } } } };
    const rawB = { id: 'same-id', title: 'B', mapping: { m: { message: { content: 'B text' } } } };
    await storage.putConversation('acct-a', {
      id: 'same-id', raw: rawA, updateTime: 1700000000,
      searchRecord: { id: 'same-id', title: 'A', messages: [{ id: 'm', role: 'user', text: 'A text' }] }
    });
    await storage.putConversation('acct-b', {
      id: 'same-id', raw: rawB, updateTime: 1700000001000,
      searchRecord: { id: 'same-id', title: 'B', messages: [{ id: 'm', role: 'user', text: 'B text' }] }
    });
    const a = await storage.getConversation('acct-a', 'same-id', '2023-11-14T22:13:20.000Z');
    const b = await storage.getConversation('acct-b', 'same-id', 1700000001000);
    check(a.hit && b.hit && a.raw.title === 'A' && b.raw.title === 'B', 'per-account isolation and version conversion');
    const stale = await storage.getConversation('acct-a', 'same-id', 1700000100);
    check(!stale.hit && stale.stale && !('raw' in stale), 'stale response cannot leak raw');
    check(!(await storage.getConversation('acct-other', 'same-id')).hit, 'unknown account misses');

    await storage.upsertDirectory('acct-a', [
      { id: 'same-id', title: 'A', updateTime: 1700000000 },
      { id: 'another', title: 'A2', projectId: 'project-a' }
    ]);
    await storage.upsertDirectory('acct-b', [{ id: 'same-id', title: 'B' }]);
    const countA = await storage.getStats('acct-a');
    const countB = await storage.getStats('acct-b');
    check(countA.directory === 2 && countA.complete === 1 && countA.indexed === 1, 'A stats');
    check(countB.directory === 1 && countB.complete === 1 && countB.indexed === 1, 'B stats');
    check((await storage.getDirectory('acct-a')).length === 2, 'directory scoped read');
    check((await storage.getDirectory('acct-b')).length === 1, 'other account directory scoped read');
    check((await searchForAccount('acct-a', 'A text')).length === 1, 'A scoped search match');
    check((await searchForAccount('acct-b', 'A text')).length === 0, 'A search never crosses account');
    check((await searchForAccount('acct-b', 'B text')).length === 1, 'B scoped search match');
    check((await storage.getSearchMetadata('acct-a')).length === 1, 'scoped index metadata');
    const selectedMetadata = await storage.getSearchMetadata('acct-a', ['same-id', 'missing-id']);
    check(selectedMetadata.length === 1 && selectedMetadata[0].id === 'same-id',
      'failure dashboard can query index metadata only for failed conversation IDs');
    const send = message => new Promise(resolve => chrome.runtime.sendMessage(message, resolve));
    const retryGuardTask = await storage.createTask('retry-guard', 'index', [{ id: 'first' }]);
    let activeRetryRejected = false;
    try {
      await storage.createTask('retry-guard', 'index', [{ id: 'second' }], { rejectIfActive: true });
    } catch (error) { activeRetryRejected = /E_TASK_ALREADY_ACTIVE/.test(error.message); }
    check(activeRetryRejected, 'single-item retry cannot attach itself to an existing active index task');
    check((await storage.createTask('retry-guard', 'index', [{ id: 'second' }])).id === retryGuardTask.id,
      'ordinary index task creation retains the existing per-account singleton behavior');
    check((await send({ action: 'searchFullText', accountId: 'acct-a', query: 'A text' })).results.length === 1,
      'runtime search action is scoped');
    check((await send({ action: 'searchFullText', accountId: 'acct-b', query: 'A text' })).results.length === 0,
      'runtime search cannot return another account');
    check((await send({ action: 'searchFullText', query: 'A text' })).success === false,
      'runtime search without account is rejected');
    const selectedMetadataMessage = await send({ action: 'searchIndexMetadata', accountId: 'acct-a',
      ids: ['same-id', 'missing-id'] });
    check(selectedMetadataMessage.success && selectedMetadataMessage.records.length === 1,
      'background metadata action preserves the optional failed-ID filter');
    const reused = await storage.putSearchRecord('acct-b', {
      id: 'same-id', updateTime: 1700000001000, title: 'bad replacement', messages: []
    });
    check(reused.reused && (await storage.getSearchRecords('acct-b'))[0].origin === 'raw', 'complete raw index cannot be replaced');
    try {
      await storage.putConversation('acct-a', { id: 'same-id', raw: { title: 'incomplete' } });
      throw Error('invalid JSON was accepted');
    } catch (error) { check(/不完整/.test(error.message), 'reject incomplete JSON'); }
    check((await storage.getConversation('acct-a', 'same-id')).raw.title === 'A', 'rejected write preserved old data');

    await storage.putConversation('acct-a', { id: 'same-id', raw: rawA, updateTime: 1700000002000 });
    const countAfter = await storage.getStats('acct-a');
    check(countAfter.indexed === 0 && countAfter.complete === 1, 'invalidation prevents version mismatch');
    const newerThanDirectory = await storage.getConversation('acct-a', 'same-id', 1700000000);
    check(newerThanDirectory.hit && newerThanDirectory.dataVersion === 1700000002000,
      'a newer complete local version satisfies a lagging directory timestamp');
    // Exercise the real page API client and the background message handlers,
    // without network requests to ChatGPT or changing the user's browser data.
    let activeAccount = 'acct-a';
    let missingIdentity = false;
    let switchMidSync = false;
    let changedRemoteAccountA = false;
    let simulateGoneId = null;
    let simulateMissingId = null;
    let simulateInvalidJsonId = null;
    let detailRequests = 0;
    let updatedRemoteDetailB = false;
    const sentUrls = [];
    window.fetch = async (input, options) => {
      const url = String(input);
      sentUrls.push(url);
      let json;
      if (url.includes('/api/auth/session')) {
        json = { user: missingIdentity ? {} : { id: activeAccount }, accessToken: 'test-token' };
      } else if (url.includes('/backend-api/conversations')) {
        const id = switchMidSync ? 'race-old-account' : 'remote-' + activeAccount;
        const items = [{ id, title: activeAccount, update_time: 1700000003 }];
        if (changedRemoteAccountA && activeAccount === 'acct-a') {
          items.unshift({ id: 'cached-0', title: 'newly updated', update_time: 1700000004 });
        }
        json = { items, total: items.length };
        if (switchMidSync) { activeAccount = 'acct-b'; switchMidSync = false; }
      } else if (url.includes('/backend-api/gizmos/snorlax/sidebar')) {
        json = { items: [] };
      } else if (url.includes('/backend-api/conversation/')) {
        detailRequests++;
        const id = decodeURIComponent(url.split('/').pop());
        if (id === simulateInvalidJsonId) {
          return { ok: true, status: 200, json: async () => { throw new SyntaxError('invalid JSON'); },
            headers: { get() { return null; } } };
        }
        if (id === simulateGoneId || id === simulateMissingId) {
          const status = id === simulateGoneId ? 410 : 404;
          return { ok: false, status, json: async () => ({}), headers: { get() { return null; } } };
        }
        const updateTime = id === 'cached-0' &&
          ((activeAccount === 'acct-b' && updatedRemoteDetailB) ||
            (activeAccount === 'acct-a' && changedRemoteAccountA))
          ? 1700000004 : 1700000003;
        json = { id, title: 'remote-details', update_time: updateTime,
          mapping: { m: { message: { id: 'm', author: { role: 'user' }, content: { parts: ['details'] } } } } };
      } else throw Error('Unexpected request ' + url);
      return { ok: true, status: 200, json: async () => json, headers: { get() { return null; } } };
    };
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/api-handler.js'; s.onload = resolve; s.onerror = reject;
      document.head.append(s);
    });
    check((await window.APIHandler.getCachedConversationList()).every(row => row.id !== 'unknown-old-owner'),
      'legacy global directory must never enter identified account');
    const aSynced = await window.APIHandler.syncConversationList();
    check(aSynced.some(row => row.id === 'remote-acct-a'), 'session user A directory sync');
    activeAccount = 'acct-b';
    check((await window.APIHandler.getCachedConversationList()).every(row => row.id !== 'remote-acct-a'),
      'account switch never exposes A directory');
    const bSynced = await window.APIHandler.syncConversationList();
    check(bSynced.some(row => row.id === 'remote-acct-b') && bSynced.every(row => row.id !== 'remote-acct-a'),
      'account B sync only B records');
    activeAccount = 'acct-a';
    check((await window.APIHandler.getCachedConversationList()).some(row => row.id === 'remote-acct-a'),
      'switch back restores A directory');
    check(localSettings.chatgpt_pro_directory_v1[0].id === 'unknown-old-owner',
      'legacy directory remains unmodified');
    check(sentUrls.filter(url => url.includes('/api/auth/session')).length < 15,
      'no per-conversation session request amplification');
    const sessionBeforePoll = sentUrls.filter(url => url.includes('/api/auth/session')).length;
    await window.APIHandler.getCachedConversationList(false);
    await window.APIHandler.getCachedConversationList(false);
    check(sentUrls.filter(url => url.includes('/api/auth/session')).length === sessionBeforePoll,
      'status polling reuses recent identity without network calls');
    // Explicit clear must not remove raw JSON or another account.
    const cleared = await send({ action: 'searchIndexClear', accountId: 'acct-a' });
    check(cleared.success && cleared.removed === 0, 'already-invalid A search clear is idempotent');
    check((await storage.getSearchRecords('acct-b')).length === 1, 'clear must not affect B');
    check((await storage.getConversation('acct-a', 'same-id')).hit, 'clear must not touch complete raw');
    check((await send({ action: 'searchIndexClear' })).success === false, 'unscoped clear rejected');
    // A session switch partway through a network sync must not commit its
    // response to either account, even when the old token request succeeded.
    activeAccount = 'acct-a';
    switchMidSync = true;
    try { await window.APIHandler.syncConversationList(true); throw Error('cross-account sync succeeded'); }
    catch (error) { check(/登录账号已切换/.test(error.message), 'in-flight account switch aborts sync'); }
    check(!(await storage.getDirectory('acct-a')).some(row => row.id === 'race-old-account'),
      'stale response not written to A');
    check(!(await storage.getDirectory('acct-b')).some(row => row.id === 'race-old-account'),
      'stale response not written to B');

    // S2-1: all existing raw JSON must be reused by getConversation, without
    // rerequesting the detail API; same-id on different accounts stays isolated.
    activeAccount = 'acct-a';
    const cachedDirectory = [];
    for (let i = 0; i < 100; i++) {
      const id = 'cached-' + i;
      cachedDirectory.push({ id, title: id, updateTime: 1700000003 });
      await storage.putConversation('acct-a', {
        id, updateTime: 1700000003,
        raw: { id, title: 'stored-A', mapping: { m: { message: { content: 'cache' } } } }
      });
    }
    await storage.upsertDirectory('acct-a', cachedDirectory);
    await window.APIHandler.getAccountId(true);
    const cachedResults = await Promise.all(cachedDirectory.map(item => window.APIHandler.getConversation(item.id)));
    check(cachedResults.length === 100 && cachedResults.every(item => item.title === 'stored-A'), '100 complete cached chats reused');
    const sourceTagged = await window.APIHandler.getConversation('cached-0', { withSource: true });
    check(sourceTagged.source === 'cache' && sourceTagged.data.title === 'stored-A', 'cached source is identified without extra API request');
    check(detailRequests === 0, '100 cached chats generate zero detail API calls');
    activeAccount = 'acct-b';
    await window.APIHandler.getAccountId(true);
    const [first, second, third] = await Promise.all([
      window.APIHandler.getConversation('cached-0'),
      window.APIHandler.getConversation('cached-0'),
      window.APIHandler.getConversation('cached-0')
    ]);
    check(first.title === 'remote-details' && first === second && second === third,
      'simultaneous detail callers share same result');
    check((await window.APIHandler.getConversation('cached-0', { withSource: true })).source === 'cache',
      'network miss becomes a tagged cache hit');
    check(detailRequests === 1, 'same conversation request coalesced into one network call');
    check((await storage.getConversation('acct-b', 'cached-0')).hit, 'network response cached in B');
    check((await storage.getConversation('acct-a', 'cached-0')).raw.title === 'stored-A',
      'B fetch did not overwrite A cache');
    check((await window.APIHandler.getConversation('cached-0')).title === 'remote-details' && detailRequests === 1,
      'subsequent B cache hit is network-free');
    await storage.upsertDirectory('acct-b', [{ id: 'cached-0', updateTime: 1700000004 }]);
    updatedRemoteDetailB = true;
    await window.APIHandler.getConversation('cached-0');
    check(detailRequests === 2, 'directory version change triggers exactly one detail fetch');
    check((await storage.getConversation('acct-b', 'cached-0', 1700000004)).hit,
      'refreshed cache carries directory version');
    const indexedRaw = {
      id: 'atomic-index', title: 'index source', update_time: 1700000004,
      mapping: { m: { message: { id: 'm', content: { parts: ['source text'] } } } }
    };
    await storage.putConversation('acct-b', {
      id: 'atomic-index', raw: indexedRaw, updateTime: 1700000004,
      searchRecord: { id: 'atomic-index', title: 'index source',
        messages: [{ id: 'm', role: 'user', text: 'source text' }] }
    });
    const storedIndex = (await storage.getSearchRecords('acct-b')).find(record => record.id === 'atomic-index');
    check(storedIndex.origin === 'raw' && storedIndex.dataVersion === 1700000004000,
      'atomic raw + index store the exact same data version');
    const storedRaw = await storage.getConversation('acct-b', 'atomic-index', 1700000004);
    check(storedRaw.hit && storedRaw.raw.mapping.m.message.content.parts[0] === 'source text',
      'indexed record retains complete raw JSON');
    try {
      await storage.putConversation('acct-b', {
        id: 'atomic-index', raw: { ...indexedRaw, title: 'invalid update' },
        updateTime: 1700000005, searchRecord: { messages: 'bad schema' }
      });
      throw Error('malformed derived index accepted');
    } catch (error) {
      check(/搜索索引/.test(error.message), 'invalid index rejects entire atomic write');
    }
    check((await storage.getConversation('acct-b', 'atomic-index')).raw.title === 'index source',
      'bad index write cannot mutate complete JSON');
    try {
      await storage.putConversation('acct-b', {
        id: 'atomic-index', raw: { ...indexedRaw, title: 'stale data' },
        updateTime: 1700000003, searchRecord: { messages: [] }
      });
      throw Error('older revision accepted');
    } catch (error) {
      check(/已有更新版本/.test(error.message), 'old indexed snapshot cannot replace new revision');
    }
    check((await storage.getSearchRecords('acct-b')).find(record => record.id === 'atomic-index').messages[0].text === 'source text',
      'rejected stale data also preserves search index');
    try {
      await storage.putSearchRecord('acct-b', {
        id: 'cached-0', updateTime: 1700000003,
        title: 'stale', messages: [{ id: 'm', text: 'obsolete' }]
      });
      throw Error('stale search index accepted');
    } catch (error) {
      check(/索引版本/.test(error.message), 'stale search cannot overwrite newer complete JSON');
    }
    // S2-3: normally recent directory state is reused; an explicit latest
    // check bypasses that short throttle and refreshes only changed versions.
    activeAccount = 'acct-a';
    await window.APIHandler.getAccountId(true);
    const directoryRequestCount = () => sentUrls.filter(url => url.includes('/backend-api/conversations?')).length;
    const beforeNormal = directoryRequestCount();
    await window.APIHandler.syncConversationList(false);
    check(directoryRequestCount() === beforeNormal, 'default sync honors local directory throttle');
    changedRemoteAccountA = true;
    const latest = await window.APIHandler.syncConversationList(false, { checkLatest: true });
    check(directoryRequestCount() > beforeNormal, 'explicit latest-check contacts directory endpoint');
    check(latest.some(row => row.id === 'cached-0' && row.updateTime === 1700000004000),
      'changed directory version updated');
    const beforeExportDetails = detailRequests;
    await window.APIHandler.getConversation('cached-1');
    check(detailRequests === beforeExportDetails, 'unchanged full cache not refetched after latest check');
    await window.APIHandler.getConversation('cached-0');
    check(detailRequests === beforeExportDetails + 1, 'changed record alone triggers detail request');

    // S3-1: tasks are persisted in IndexedDB, claims are atomic across tabs,
    // a stale lease cannot checkpoint, and user pauses always take priority.
    const tasks = await send({ action: 'taskCreate', accountId: 'acct-a', type: 'index',
      items: [{ id: 'job-a' }, { id: 'job-b' }] });
    check(tasks.success && tasks.result.items.length === 2 && tasks.result.status === 'pending', 'task creation');
    const taskId = tasks.result.id;
    const attempts = await Promise.all([
      send({ action: 'taskClaim', accountId: 'acct-a', id: taskId, owner: 'tab-one' }),
      send({ action: 'taskClaim', accountId: 'acct-a', id: taskId, owner: 'tab-two' })
    ]);
    check(attempts.filter(result => result.result.acquired).length === 1, 'only one tab gets lease');
    const wonByOne = attempts[0].result.acquired;
    const owner = wonByOne ? 'tab-one' : 'tab-two';
    const other = wonByOne ? 'tab-two' : 'tab-one';
    const token = attempts.find(result => result.result.acquired).result.token;
    check((await send({ action: 'taskList', accountId: 'acct-b' })).result.length === 0, 'task list account isolated');
    check((await send({ action: 'taskGet', accountId: 'acct-b', id: taskId })).result === null, 'task read account isolated');
    check(!(await send({ action: 'taskClaim', accountId: 'acct-b', id: taskId, owner: other })).success,
      'other account cannot claim task');
    check((await send({ action: 'taskCheckpoint', accountId: 'acct-a', id: taskId, owner, token,
      itemIndex: 0, outcome: 'success' })).result.task.nextIndex === 1, 'durable first checkpoint');
    check(!(await send({ action: 'taskCheckpoint', accountId: 'acct-a', id: taskId, owner, token,
      itemIndex: 0, outcome: 'success' })).success, 'completed item cannot be checked twice');
    await send({ action: 'taskControl', accountId: 'acct-a', id: taskId, operation: 'pause' });
    check(!(await send({ action: 'taskClaim', accountId: 'acct-a', id: taskId, owner: other })).result.acquired,
      'explicit pause blocks every tab');
    check(!(await send({ action: 'taskCheckpoint', accountId: 'acct-a', id: taskId, owner, token,
      itemIndex: 1, outcome: 'success' })).success, 'paused task rejects stale checkpoint');
    await send({ action: 'taskControl', accountId: 'acct-a', id: taskId, operation: 'resume' });
    const takeover = await send({ action: 'taskClaim', accountId: 'acct-a', id: taskId, owner: other });
    check(takeover.result.acquired && takeover.result.token !== token, 'resume issues new lease token');
    check(!(await send({ action: 'taskCheckpoint', accountId: 'acct-a', id: taskId, owner, token,
      itemIndex: 1, outcome: 'success' })).success, 'fencing rejects original lease');
    await send({ action: 'taskHeartbeat', accountId: 'acct-a', id: taskId, owner: other, token: takeover.result.token });
    await send({ action: 'taskCheckpoint', accountId: 'acct-a', id: taskId, owner: other, token: takeover.result.token,
      itemIndex: 1, outcome: 'failed', error: 'network outage' });
    const completed = await send({ action: 'taskGet', accountId: 'acct-a', id: taskId });
    check(completed.result.status === 'completed' && completed.result.nextIndex === 2 &&
      completed.result.successCount === 1 && completed.result.failureCount === 1,
      'completed task retains progress and error counts');
    const rateLimitTask = await send({ action: 'taskCreate', accountId: 'acct-d', type: 'index',
      items: [{ id: 'before-rate-limit' }, { id: 'rate-limit-item' }] });
    let rateClaim = await send({ action: 'taskClaim', accountId: 'acct-d',
      id: rateLimitTask.result.id, owner: 'rate-limit-owner' });
    let rateToken = rateClaim.result.token;
    await send({ action: 'taskCheckpoint', accountId: 'acct-d', id: rateLimitTask.result.id,
      owner: 'rate-limit-owner', token: rateToken, itemIndex: 0, outcome: 'failed', error: 'temporary network error' });
    for (let pauseCount = 1; pauseCount <= 4; pauseCount++) {
      const retryAt = Date.now() + 5000;
      await send({ action: 'taskPhase', accountId: 'acct-d', id: rateLimitTask.result.id,
        owner: 'rate-limit-owner', token: rateToken, phase: 'rate-limit', waitUntil: retryAt });
      await send({ action: 'taskControl', accountId: 'acct-d', id: rateLimitTask.result.id,
        operation: 'pause', reason: 'rate-limit' });
      const pausedRateTask = await send({ action: 'taskGet', accountId: 'acct-d', id: rateLimitTask.result.id });
      check(pausedRateTask.result.status === 'paused' &&
        pausedRateTask.result.rateLimitPauseCount === pauseCount,
        'rate-limit pause ' + pauseCount + ' is persisted');
      check(pausedRateTask.result.phase === (pauseCount <= 3 ? 'rate-limit' : 'rate-limit-exhausted'),
        'rate-limit pause ' + pauseCount + ' has the correct automatic-recovery state');
      check(pausedRateTask.result.waitUntil === (pauseCount <= 3 ? retryAt : 0),
        'only automatically recoverable rate-limit pauses retain a cooldown deadline');
      if (pauseCount <= 3) {
        await send({ action: 'taskControl', accountId: 'acct-d', id: rateLimitTask.result.id,
          operation: 'resume', reason: 'auto-rate-limit' });
        const resumed = await send({ action: 'taskGet', accountId: 'acct-d', id: rateLimitTask.result.id });
        check(resumed.result.status === 'pending' && resumed.result.rateLimitPauseCount === pauseCount,
          'automatic resume preserves the bounded rate-limit retry count');
        check(resumed.result.consecutiveFailures === 1,
          'automatic rate-limit resume preserves the consecutive item-failure count');
        rateClaim = await send({ action: 'taskClaim', accountId: 'acct-d',
          id: rateLimitTask.result.id, owner: 'rate-limit-owner' });
        rateToken = rateClaim.result.token;
      }
    }
    await send({ action: 'taskControl', accountId: 'acct-d', id: rateLimitTask.result.id,
      operation: 'resume' });
    const manualRateResume = await send({ action: 'taskGet', accountId: 'acct-d', id: rateLimitTask.result.id });
    check(manualRateResume.result.rateLimitPauseCount === 0 && manualRateResume.result.consecutiveFailures === 0,
      'manual resume resets exhausted rate-limit and consecutive-failure counters');
    rateClaim = await send({ action: 'taskClaim', accountId: 'acct-d',
      id: rateLimitTask.result.id, owner: 'rate-limit-owner' });
    await send({ action: 'taskCheckpoint', accountId: 'acct-d', id: rateLimitTask.result.id,
      owner: 'rate-limit-owner', token: rateClaim.result.token, itemIndex: 1, outcome: 'success' });
    const rateLimitCompleted = await send({ action: 'taskGet', accountId: 'acct-d', id: rateLimitTask.result.id });
    check(rateLimitCompleted.result.status === 'completed' && rateLimitCompleted.result.failureCount === 1,
      'rate-limit recovery retries the uncheckpointed item without changing earlier outcomes');
    const authTask = await send({ action: 'taskCreate', accountId: 'acct-e', type: 'index',
      items: [{ id: 'auth-error-item' }] });
    await send({ action: 'taskClaim', accountId: 'acct-e', id: authTask.result.id, owner: 'auth-owner' });
    await send({ action: 'taskControl', accountId: 'acct-e', id: authTask.result.id,
      operation: 'pause', reason: 'auth-error' });
    const authPaused = await send({ action: 'taskGet', accountId: 'acct-e', id: authTask.result.id });
    check(authPaused.result.status === 'paused' && authPaused.result.phase === 'auth-error',
      'authentication failures remain paused for manual intervention');
    const cancellable = await send({ action: 'taskCreate', accountId: 'acct-a', type: 'export-json',
      items: [{ id: 'cancel-item' }] });
    await send({ action: 'taskControl', accountId: 'acct-a', id: cancellable.result.id, operation: 'cancel' });
    check(!(await send({ action: 'taskClaim', accountId: 'acct-a', id: cancellable.result.id, owner })).result.acquired,
      'canceled task cannot start');
    const expiring = await send({ action: 'taskCreate', accountId: 'acct-a', type: 'index',
      items: [{ id: 'expire-item' }] });
    const expiringId = expiring.result.id;
    const oldOwner = await send({ action: 'taskClaim', accountId: 'acct-a', id: expiringId, owner: 'abandoned-tab' });
    const expiryDb = await storage.openDb();
    await new Promise((resolve, reject) => {
      const tx = expiryDb.transaction('tasks', 'readwrite');
      const store = tx.objectStore('tasks');
      const get = store.get(expiringId);
      get.onsuccess = () => {
        const record = get.result;
        record.lease.expiresAt = Date.now() - 100;
        store.put(record);
      };
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    expiryDb.close();
    const reclaimed = await send({ action: 'taskClaim', accountId: 'acct-a', id: expiringId, owner: 'restarted-tab' });
    check(reclaimed.result.acquired && reclaimed.result.token !== oldOwner.result.token,
      'expired lease permits another tab to resume');
    check(!(await send({ action: 'taskHeartbeat', accountId: 'acct-a', id: expiringId,
      owner: 'abandoned-tab', token: oldOwner.result.token })).success,
      'expired executor cannot renew an old lease');
    await send({ action: 'taskControl', accountId: 'acct-a', id: expiringId, operation: 'cancel' });
    const otherTypes = await Promise.all([
      send({ action: 'taskCreate', accountId: 'acct-c', type: 'index', items: [{ id: 'c-index' }] }),
      send({ action: 'taskCreate', accountId: 'acct-c', type: 'export-md', items: [{ id: 'c-export' }] })
    ]);
    const differentTaskClaims = await Promise.all(otherTypes.map((reply, i) => send({
      action: 'taskClaim', accountId: 'acct-c', id: reply.result.id,
      owner: i === 0 ? 'index-tab' : 'export-tab'
    })));
    check(differentTaskClaims.filter(reply => reply.result.acquired).length === 1,
      'index and export cannot claim different tasks of same account simultaneously');
    const winner = differentTaskClaims[0].result.acquired ? 0 : 1;
    const loser = 1 - winner;
    check(differentTaskClaims[loser].result.reason === 'account-busy',
      'cross-type contender receives account-wide busy reason');
    await send({ action: 'taskControl', accountId: 'acct-c', id: otherTypes[winner].result.id,
      operation: 'pause' });
    const nextClaim = await send({ action: 'taskClaim', accountId: 'acct-c',
      id: otherTypes[loser].result.id, owner: loser === 0 ? 'index-tab' : 'export-tab' });
    check(nextClaim.result.acquired, 'waiting other-type task runs after current account lease ends');
    check(!(await send({ action: 'taskCheckpoint', accountId: 'acct-c', id: otherTypes[winner].result.id,
      owner: winner === 0 ? 'index-tab' : 'export-tab', token: differentTaskClaims[winner].result.token,
      itemIndex: 0, outcome: 'success' })).success,
      'paused prior type cannot commit stale work while another type runs');
    const newTaskRequests = await Promise.all([
      send({ action: 'taskCreate', accountId: 'acct-b', type: 'index', items: [{ id: 'one' }] }),
      send({ action: 'taskCreate', accountId: 'acct-b', type: 'index', items: [{ id: 'two' }] })
    ]);
    check(newTaskRequests.every(entry => entry.success), 'two tabs can request task creation');
    check(newTaskRequests[0].result.id === newTaskRequests[1].result.id,
      'atomic create prevents duplicate active tasks across tabs');
    const slotOne = await send({ action: 'detailAcquire', accountId: 'acct-a', owner: 'detail-tab-one' });
    check(slotOne.success && slotOne.result.granted, 'first detail request acquires account slot');
    const blockedSlot = await send({ action: 'detailAcquire', accountId: 'acct-a', owner: 'detail-tab-two' });
    check(!blockedSlot.result.granted && blockedSlot.result.reason === 'busy', 'other tab blocked by detail lease');
    await send({ action: 'detailHeartbeat', accountId: 'acct-a', owner: 'detail-tab-one', token: slotOne.result.token });
    const cooldown = await send({ action: 'detailRelease', accountId: 'acct-a', owner: 'detail-tab-one',
      token: slotOne.result.token, status: 429, retryAfterMs: 1400 });
    check(cooldown.result.cooldownUntil > Date.now(), '429 persists Retry-After cooldown');
    const limitedSlot = await send({ action: 'detailAcquire', accountId: 'acct-a', owner: 'detail-tab-two' });
    check(!limitedSlot.result.granted && limitedSlot.result.reason === 'cooldown',
      'shared cooldown blocks both indexing and export detail requests');
    await storage.upsertDirectory('acct-a', [{ id: 'cooldown-preserved', title: 'preserve scheduler state' }]);
    check((await send({ action: 'detailStatus', accountId: 'acct-a' })).result.cooldownUntil >= cooldown.result.cooldownUntil,
      'directory sync cannot overwrite persisted cooldown');
    check((await send({ action: 'detailStatus', accountId: 'acct-b' })).result.cooldownUntil === 0,
      'other account has independent cooldown');
    const coolDb = await storage.openDb();
    await new Promise((resolve, reject) => {
      const tx = coolDb.transaction('accounts', 'readwrite');
      const store = tx.objectStore('accounts');
      const request = store.get('acct-a');
      request.onsuccess = () => {
        const state = request.result;
        state.cooldownUntil = Date.now() - 1;
        store.put(state);
      };
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    coolDb.close();
    const resumedSlot = await send({ action: 'detailAcquire', accountId: 'acct-a', owner: 'detail-tab-two' });
    check(resumedSlot.result.granted, 'expired cooldown allows a new detail request');
    check(!(await send({ action: 'detailRelease', accountId: 'acct-a', owner: 'detail-tab-one',
      token: slotOne.result.token, status: 200 })).success, 'stale executor cannot mutate cooldown');
    await send({ action: 'detailRelease', accountId: 'acct-a', owner: 'detail-tab-two',
      token: resumedSlot.result.token, status: 200 });
    const logsBeforePrune = await send({ action: 'logList', accountId: 'acct-a' });
    check(logsBeforePrune.result.some(log => log.type === 'rate-limit' && log.code === '429'),
      '429 event is recorded in account-scoped logs');
    check(logsBeforePrune.result.some(log => log.type === 'task' && log.code === 'pause'),
      'task state changes are logged');
    check(logsBeforePrune.result.every(log => !JSON.stringify(log).includes('test-token')),
      'logs do not contain access tokens');
    check((await send({ action: 'logList', accountId: 'acct-b' })).result.length === 0,
      'log list is account isolated');
    const logDb = await storage.openDb();
    await new Promise((resolve, reject) => {
      const tx = logDb.transaction('logs', 'readwrite');
      tx.objectStore('logs').add({ accountId: 'acct-a', type: 'request', code: 'expired-test',
        createdAt: Date.now() - 31 * 86400000 });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    logDb.close();
    await storage.addLog('acct-a', { type: 'task', code: 'test', message: 'retention check' });
    check(!(await send({ action: 'logList', accountId: 'acct-a' })).result.some(log => log.code === 'expired-test'),
      'logs older than 30 days pruned by subsequent writes');

    // S3-5: ZIP blobs and their cursor/manifest metadata must commit together.
    const exportJob = await send({ action: 'taskCreate', accountId: 'acct-a', type: 'export-md',
      items: [{ id: 'zip-a' }, { id: 'zip-b' }, { id: 'zip-c' }] });
    check(exportJob.success, 'export task created');
    const exportId = exportJob.result.id;
    const exportClaim = await send({ action: 'taskClaim', accountId: 'acct-a',
      id: exportId, owner: 'zip-tab' });
    const zipToken = exportClaim.result.token;
    const partOne = new Blob(['PK test one'], { type: 'application/zip' });
    const firstZipPayload = {
      blob: partOne, filename: 'export_part001.zip', volume: 1, toIndex: 2,
      entries: [
        { id: 'zip-a', title: 'first', status: 'success', filename: 'first.md', bytes: 20 },
        { id: 'zip-b', title: 'second', status: 'failed', error: 'failed conversion' }
      ]
    };
    check(!(await send({ action: 'taskVolumeSave', accountId: 'acct-b', id: exportId,
      owner: 'zip-tab', token: zipToken, payload: firstZipPayload })).success,
      'wrong account cannot write an export ZIP');
    const firstZip = await send({ action: 'taskVolumeSave', accountId: 'acct-a', id: exportId,
      owner: 'zip-tab', token: zipToken, payload: firstZipPayload });
    check(firstZip.success && firstZip.result.nextIndex === 2, 'first ZIP and cursor persisted atomically');
    check(!(await send({ action: 'taskVolumeSave', accountId: 'acct-a', id: exportId,
      owner: 'zip-tab', token: zipToken, payload: firstZipPayload })).success,
      'duplicate ZIP checkpoint rejected');
    check((await send({ action: 'taskVolumeGet', accountId: 'acct-b', id: exportId, volume: 1 })).result === null,
      'saved ZIP hidden from other accounts');
    const restoredOne = await send({ action: 'taskVolumeGet', accountId: 'acct-a', id: exportId, volume: 1 });
    check(restoredOne.success && restoredOne.result.size === partOne.size,
      'first complete ZIP is retrievable after it leaves the page memory');
    await send({ action: 'taskControl', accountId: 'acct-a', id: exportId, operation: 'pause' });
    check(!(await send({ action: 'taskVolumeClear', accountId: 'acct-a', id: exportId })).success,
      'paused export must be canceled or completed before ZIP cleanup');
    check(!(await send({ action: 'taskVolumeSave', accountId: 'acct-a', id: exportId,
      owner: 'zip-tab', token: zipToken, payload: {
        blob: partOne, filename: 'export_part002.zip', volume: 2, toIndex: 3,
        entries: [{ id: 'zip-c', status: 'success', filename: 'third.md' }]
      } })).success, 'paused task rejects stale ZIP');
    await send({ action: 'taskControl', accountId: 'acct-a', id: exportId, operation: 'resume' });
    const resumedZip = await send({ action: 'taskClaim', accountId: 'acct-a', id: exportId, owner: 'new-zip-tab' });
    const finalZip = await send({ action: 'taskVolumeSave', accountId: 'acct-a', id: exportId,
      owner: 'new-zip-tab', token: resumedZip.result.token, payload: {
        blob: new Blob(['PK test two'], { type: 'application/zip' }),
        filename: 'export_part002.zip', volume: 2, toIndex: 3,
        entries: [{ id: 'zip-c', title: 'third', status: 'success', filename: 'third.md', bytes: 20 }]
      } });
    check(finalZip.success && finalZip.result.status === 'completed', 'final persisted ZIP completes task');
    const completedExport = (await send({ action: 'taskGet', accountId: 'acct-a', id: exportId })).result;
    check(completedExport.volumeCount === 2 && completedExport.successCount === 2 &&
      completedExport.failureCount === 1 && completedExport.exportEntries.length === 3,
      'recovery cursor, manifest and counts survived resume');
    check(!(await send({ action: 'taskVolumeClear', accountId: 'acct-b', id: exportId })).success,
      'other account cannot clear task ZIP volumes');
    const clearedVolumes = await send({ action: 'taskVolumeClear', accountId: 'acct-a', id: exportId });
    check(clearedVolumes.success && clearedVolumes.result.deleted === 2,
      'explicit cleanup deletes exactly the two completed ZIP volumes');
    check((await send({ action: 'taskVolumeGet', accountId: 'acct-a', id: exportId, volume: 1 })).result === null,
      'cleaned ZIP cannot be downloaded');
    const afterClear = (await send({ action: 'taskGet', accountId: 'acct-a', id: exportId })).result;
    check(afterClear.status === 'completed' && afterClear.exportEntries.length === 3 && afterClear.volumesClearedAt,
      'manual ZIP cleanup retains task status and manifest metadata');
    check((await storage.getConversation('acct-a', 'same-id')).hit,
      'cleaning ZIP does not delete lossless conversation raw cache');
    const chunkJob = await send({ action: 'taskCreate', accountId: 'acct-a', type: 'export-json',
      items: [{ id: 'upload-one' }, { id: 'upload-two' }] });
    const chunkClaim = await send({ action: 'taskClaim', accountId: 'acct-a',
      id: chunkJob.result.id, owner: 'upload-tab' });
    const chunkBase = { accountId: 'acct-a', id: chunkJob.result.id,
      owner: 'upload-tab', token: chunkClaim.result.token, volume: 1 };
    const chunkText = 'PK staged ZIP contents survive JSON-only messaging';
    const chunks = [chunkText.slice(0, 19), chunkText.slice(19)];
    for (let index = 0; index < chunks.length; index++) {
      check((await send({ action: 'taskVolumeChunk', ...chunkBase, index,
        base64: btoa(chunks[index]) })).success, 'upload ZIP chunk with JSON-safe encoding');
    }
    const chunkPayload = { volume: 1, filename: 'staged_part001.zip', toIndex: 2,
      chunkCount: chunks.length, entries: [
        { id: 'upload-one', status: 'success', filename: 'one.json', bytes: 42 },
        { id: 'upload-two', status: 'success', filename: 'two.json', bytes: 42 }
      ] };
    check((await send({ action: 'taskVolumeFinish', ...chunkBase, payload: chunkPayload })).success,
      'finalize chunks into atomic persisted ZIP with task cursor');
    const stagedMeta = await send({ action: 'taskVolumeGet', accountId: 'acct-a',
      id: chunkJob.result.id, volume: 1 });
    check(stagedMeta.result.size === chunkText.length && !('blob' in stagedMeta.result),
      'ZIP metadata is JSON-safe and hides raw Blob');
    const stagedBytes = await send({ action: 'taskVolumeRead', accountId: 'acct-a',
      id: chunkJob.result.id, volume: 1, offset: 0, size: 128 });
    check(atob(stagedBytes.result.base64) === chunkText, 'download chunk restores original bytes');
    check(!(await send({ action: 'taskVolumeRead', accountId: 'acct-b',
      id: chunkJob.result.id, volume: 1, offset: 0, size: 128 })).success,
      'download stream is account isolated');

    // S4: consent is account-scoped and cannot be inferred from directory or
    // existing search data. Completion is based on the strictly scanned IDs.
    const consentId = 'acct-consent';
    await storage.upsertDirectory(consentId, [
      { id: 'consent-a', updateTime: 1700000011 },
      { id: 'consent-b', updateTime: 1700000012 },
      { id: 'historical-local-only', updateTime: 1700000000 }
    ]);
    const policyBefore = await send({ action: 'indexPolicyGet', accountId: consentId });
    check(policyBefore.success && !policyBefore.result.consentAt && !policyBefore.result.initialCompletedAt,
      'new accounts do not grant initial full index consent automatically');
    check(!(await send({ action: 'indexPolicyFinishInitial', accountId: consentId })).success,
      'unconsented account cannot claim initial index completion');
    const consentGrant = await send({ action: 'indexPolicyConsent', accountId: consentId });
    check(consentGrant.success && consentGrant.result.consentAt > 0 && consentGrant.result.autoEnabled,
      'first explicit full-index consent also enables automatic updates');
    check((await send({ action: 'indexPolicyGet', accountId: consentId })).result.autoEnabled,
      'automatic updates are enabled immediately when first-index consent is granted');
    const consentAgain = await send({ action: 'indexPolicyConsent', accountId: consentId });
    check(consentAgain.result.consentAt === consentGrant.result.consentAt,
      'repeated consent request does not reset the original authorization timestamp');
    check(consentAgain.result.autoEnabled,
      'repeated consent preserves the existing automatic-update preference');
    check(!(await send({ action: 'indexPolicyFinishInitial', accountId: consentId })).success,
      'consent alone never marks full index complete');
    const snapshot = [
      { id: 'consent-a', updateTime: 1700000011 },
      { id: 'consent-b', updateTime: 1700000012 }
    ];
    check((await send({ action: 'indexPolicyDirectoryVerified', accountId: consentId,
      records: snapshot })).result.total === 2, 'only explicitly scanned remote items enter the initial snapshot');
    const snapshotPolicy = (await send({ action: 'indexPolicyGet', accountId: consentId })).result;
    check(snapshotPolicy.initialSnapshotReady && snapshotPolicy.initialSnapshotAt > 0,
      'verified first-directory snapshot is exposed for safe completion recovery');
    const unrelatedIndexTask = await send({ action: 'taskCreate', accountId: consentId,
      type: 'index', items: [{ id: 'not-in-initial-snapshot' }] });
    await send({ action: 'taskControl', accountId: consentId, id: unrelatedIndexTask.result.id,
      operation: 'pause' });
    await storage.putConversation(consentId, { id: 'consent-a', updateTime: 1700000011,
      raw: { id: 'consent-a', mapping: {} },
      searchRecord: { id: 'consent-a', messages: [] } });
    const incompleteIndex = await send({ action: 'indexPolicyFinishInitial', accountId: consentId });
    check(!incompleteIndex.result.completed && incompleteIndex.result.remaining === 1,
      'one unindexed official conversation blocks completion');
    await storage.putConversation(consentId, { id: 'consent-b', updateTime: 1700000012,
      raw: { id: 'consent-b', mapping: {} },
      searchRecord: { id: 'consent-b', messages: [] } });
    const finishedIndex = await send({ action: 'indexPolicyFinishInitial', accountId: consentId });
    check(finishedIndex.result.completed && finishedIndex.result.total === 2,
      'verified snapshot indexes complete despite an unrelated paused index task');
    const completedPolicy = (await send({ action: 'indexPolicyGet', accountId: consentId })).result;
    check(completedPolicy.initialCompletedAt > 0 && !completedPolicy.initialSnapshotReady
      && completedPolicy.autoEnabled,
      'initial completion flag persists, preserves the independent auto-update preference and retires the temporary snapshot');
    check((await send({ action: 'taskControl', accountId: consentId,
      id: unrelatedIndexTask.result.id, operation: 'cancel' })).success,
      'retire the paused first-index fixture before testing later automatic tasks');
    check(!(await send({ action: 'indexPolicyGet', accountId: 'acct-b' })).result.consentAt,
      'another account never inherits consent');
    const historical = await storage.getDirectoryRecord(consentId, 'historical-local-only');
    check(historical.remoteState === 'unverified',
      'absence from a verified full directory is unverified, not a confirmed deletion');
    await storage.putConversation('acct-a', {
      id: 'explicit-tombstone', updateTime: 1700000031,
      raw: { id: 'explicit-tombstone', title: 'kept offline', mapping: {} },
      searchRecord: { id: 'explicit-tombstone', title: 'kept offline', messages: [{ id: 'm', text: 'retained search' }] }
    });
    await storage.upsertDirectory('acct-a', [{ id: 'explicit-tombstone', updateTime: 1700000031,
      officialDeletion: true }]);
    check((await storage.getDirectoryRecord('acct-a', 'explicit-tombstone')).remoteState === 'local-only',
      'explicit official tombstone marks cached raw conversation as local-only');
    check((await searchForAccount('acct-a', 'retained search'))[0].remoteState === 'local-only',
      'search result exposes confirmed local-only state');
    check((await storage.getConversation('acct-a', 'explicit-tombstone')).raw.title === 'kept offline',
      'tombstone retains lossless JSON');
    await storage.upsertDirectory('acct-a', [{ id: 'no-local-raw', officialDeletion: true }]);
    check((await storage.getDirectoryRecord('acct-a', 'no-local-raw')).remoteState === 'unverified',
      'official deletion without any saved local JSON is not mislabeled as local-only');
    await storage.upsertDirectory('acct-a', [{ id: 'explicit-tombstone', remoteState: 'local-only' }]);
    check((await storage.getDirectoryRecord('acct-a', 'explicit-tombstone')).remoteState === 'local-only',
      'cached directory rewrite cannot silently clear tombstone status');
    await storage.putConversation('acct-a', {
      id: 'only-local-to-clean', updateTime: 1700000038,
      raw: { id: 'only-local-to-clean', title: 'cleanup local copy', mapping: {} },
      searchRecord: { id: 'only-local-to-clean', title: 'cleanup local copy', messages: [] }
    });
    await storage.upsertDirectory('acct-a', [{ id: 'only-local-to-clean', officialDeletion: true }]);
    check(!(await send({ action: 'localDataClearLocalOnly', accountId: 'acct-b',
      id: 'only-local-to-clean' })).success, 'another account cannot delete local-only data');
    check(!(await send({ action: 'localDataClearLocalOnly', accountId: 'acct-a',
      id: 'ambiguous-online' })).success, 'unknown/non-local entry cannot be cleaned');
    const cleanedLocalOnly = await send({ action: 'localDataClearLocalOnly', accountId: 'acct-a',
      id: 'only-local-to-clean' });
    check(cleanedLocalOnly.success && cleanedLocalOnly.result.cleared,
      'confirmed local-only record permits explicit cleanup');
    check(!(await storage.getConversation('acct-a', 'only-local-to-clean')).hit &&
      !(await storage.getDirectoryRecord('acct-a', 'only-local-to-clean')) &&
      !(await storage.getSearchRecords('acct-a')).some(record => record.id === 'only-local-to-clean'),
      'manual cleanup removes only selected directory/raw/search trio');
    check((await storage.getConversation('acct-a', 'explicit-tombstone')).hit,
      'other local-only records remain after cleanup');
    // Authenticated HTTP 410 is affirmative Gone evidence; HTTP 404 alone is not.
    activeAccount = 'acct-a';
    simulateGoneId = 'gone-http';
    await storage.putConversation('acct-a', { id: simulateGoneId,
      updateTime: 1700000040, raw: { id: simulateGoneId, title: 'HTTP Gone cached', mapping: {} } });
    await storage.upsertDirectory('acct-a', [{ id: simulateGoneId,
      updateTime: 1700000041, verifiedOnline: true }]);
    const beforeGoneFetch = detailRequests;
    const preservedGone = await window.APIHandler.getConversation(simulateGoneId, { withSource: true });
    check(preservedGone.source === 'cache' && preservedGone.data.title === 'HTTP Gone cached',
      'official 410 returns preserved raw JSON from cache');
    check((await storage.getDirectoryRecord('acct-a', simulateGoneId)).remoteState === 'local-only',
      'official 410 marks correct account and original ID');
    await window.APIHandler.getConversation(simulateGoneId);
    check(detailRequests === beforeGoneFetch + 1,
      'confirmed local-only conversation stops subsequent remote detail requests');
    simulateMissingId = 'ambiguous-404';
    await storage.putConversation('acct-a', { id: simulateMissingId,
      updateTime: 1700000050, raw: { id: simulateMissingId, mapping: {} } });
    await storage.upsertDirectory('acct-a', [{ id: simulateMissingId,
      updateTime: 1700000051, verifiedOnline: true }]);
    try {
      await window.APIHandler.getConversation(simulateMissingId);
      throw Error('ambiguous HTTP 404 unexpectedly succeeded');
    } catch (error) { check(/404/.test(error.message), 'ambiguous HTTP 404 does not silently succeed'); }
    check((await storage.getDirectoryRecord('acct-a', simulateMissingId)).remoteState !== 'local-only',
      'HTTP 404 alone never marks an offline-only record');

    // Batch A: account-scoped auto-index policy and independent data clearing.
    const initialPolicy = (await send({ action: 'indexPolicyGet', accountId: consentId })).result;
    check(initialPolicy.autoEnabled === true, 'successful first scan defaults auto-update to on');
    check((await send({ action: 'indexPolicySetAuto', accountId: consentId,
      enabled: false })).result.autoEnabled === false, 'auto-index can be disabled for one account');
    check((await send({ action: 'indexPolicyGet', accountId: consentId })).result.autoEnabled === false,
      'disabled setting persists');
    const automaticItem = [{ id: 'auto-one', updateTime: 1700000060 }];
    check(!(await send({ action: 'taskCreate', accountId: consentId, type: 'index',
      items: automaticItem, options: { automatic: true } })).success,
      'automatic task must not be created when the switch is off');
    check((await send({ action: 'indexPolicySetAuto', accountId: consentId,
      enabled: true })).result.autoEnabled === true, 'auto-index can be restored explicitly');
    const pendingAuto = await send({ action: 'taskCreate', accountId: consentId,
      type: 'index', items: automaticItem, options: { automatic: true } });
    check(pendingAuto.success && pendingAuto.result.status === 'pending',
      'enabled switch admits an automatic index task');
    check(!(await send({ action: 'localDataClearAccount', accountId: consentId, kind: 'index' })).success &&
      !(await send({ action: 'localDataClearAccount', accountId: consentId, kind: 'raw' })).success,
      'pending task blocks either destructive operation');
    check((await send({ action: 'taskControl', accountId: consentId,
      id: pendingAuto.result.id, operation: 'cancel' })).success,
      'user can cancel the pending task before clearing');

    const otherBefore = await storage.getStats('acct-a');
    const consentBefore = await storage.getStats(consentId);
    check(consentBefore.complete === 2 && consentBefore.indexed === 2,
      'clear test starts with both complete JSON and searchable text');
    const skipBeforeClear = await send({ action: 'taskCreate', accountId: consentId, type: 'index',
      items: [{ id: 'consent-a', updateTime: 1700000010 }] });
    const skipBeforeClearClaim = await send({ action: 'taskClaim', accountId: consentId,
      id: skipBeforeClear.result.id, owner: 'skip-before-clear-tab' });
    await send({ action: 'taskCheckpoint', accountId: consentId, id: skipBeforeClear.result.id,
      owner: 'skip-before-clear-tab', token: skipBeforeClearClaim.result.token,
      itemIndex: 0, outcome: 'failed', error: 'mock-404' });
    check((await send({ action: 'indexSkipConversation', accountId: consentId,
      taskId: skipBeforeClear.result.id, conversationId: 'consent-a' })).success &&
      (await send({ action: 'indexPolicyGet', accountId: consentId })).result.skippedIndexIds.includes('consent-a'),
      'skip list is account-scoped and available before clearing');
    const clearRaw = await send({ action: 'localDataClearAccount', accountId: consentId, kind: 'raw' });
    check(clearRaw.success && clearRaw.result.removed === 2, 'raw clear reports exact number removed');
    const afterRaw = await storage.getStats(consentId);
    check(afterRaw.directory === consentBefore.directory && afterRaw.complete === 0 && afterRaw.indexed === 2 &&
      !(await storage.getConversation(consentId, 'consent-a')).hit,
      'clear raw preserves directory and full-text search but never fakes a JSON hit');
    check((await send({ action: 'indexPolicyGet', accountId: consentId })).result.autoEnabled === true,
      'clearing JSON alone leaves auto-index policy unchanged');
    const clearIndex = await send({ action: 'localDataClearAccount', accountId: consentId, kind: 'index' });
    check(clearIndex.success && clearIndex.result.removed === 2, 'index clear reports exact number removed');
    const afterIndex = await storage.getStats(consentId);
    const clearedPolicy = (await send({ action: 'indexPolicyGet', accountId: consentId })).result;
    check(afterIndex.indexed === 0 && afterIndex.directory === consentBefore.directory &&
      clearedPolicy.consentAt === initialPolicy.consentAt && !clearedPolicy.initialCompletedAt &&
      clearedPolicy.autoEnabled === false && clearedPolicy.skippedIndexIds.length === 0,
      'clear index retains original consent, resets completion, auto-update and skipped IDs');
    check(!(await send({ action: 'taskCreate', accountId: consentId, type: 'index',
      items: automaticItem, options: { automatic: true } })).success,
      'automatic reconstruction is blocked after index clear');
    check(!(await send({ action: 'indexPolicyFinishInitial', accountId: consentId })).success,
      'stale full-scan completion cannot be reused after index clearing');
    check(JSON.stringify(await storage.getStats('acct-a')) === JSON.stringify(otherBefore),
      'other account data survives both clear operations');
    check(!(await send({ action: 'localDataClearAccount', kind: 'index' })).success,
      'unknown account cannot clear arbitrary local data');
    check((await send({ action: 'indexPolicySetAuto', accountId: 'acct-new', enabled: true })).result.autoEnabled,
      'new account can configure the independent auto-index switch before initial completion');
    check(!(await send({ action: 'taskCreate', accountId: 'acct-new', type: 'index',
      items: automaticItem, options: { automatic: true } })).success,
      'enabling the switch before initial completion does not authorize automatic harvesting');
    // Only a newly requested initial scan, not reopening a tab, re-enables auto-update.
    check((await send({ action: 'indexPolicyDirectoryVerified', accountId: consentId,
      records: snapshot })).success, 'consented account may manually scan again');
    const skipInitial = await send({ action: 'taskCreate', accountId: consentId, type: 'index',
      items: [snapshot[0]] });
    const skipInitialClaim = await send({ action: 'taskClaim', accountId: consentId,
      id: skipInitial.result.id, owner: 'skip-initial-tab' });
    await send({ action: 'taskCheckpoint', accountId: consentId, id: skipInitial.result.id,
      owner: 'skip-initial-tab', token: skipInitialClaim.result.token,
      itemIndex: 0, outcome: 'failed', error: 'mock-404' });
    check((await send({ action: 'indexSkipConversation', accountId: consentId,
      taskId: skipInitial.result.id, conversationId: snapshot[0].id })).success,
      'initial indexing can persist an explicitly skipped conversation');
    for (const item of snapshot.slice(1)) {
      await storage.putConversation(consentId, { id: item.id, updateTime: item.updateTime,
        raw: { id: item.id, mapping: {} }, searchRecord: { id: item.id, messages: [] } });
    }
    check((await send({ action: 'indexPolicyFinishInitial', accountId: consentId })).result.completed &&
      (await send({ action: 'indexPolicyGet', accountId: consentId })).result.autoEnabled === false,
      'rebuilding the index does not override the auto-update preference reset by index clearing');

    // Batch B: directory 429 and detail share the same account-scoped gate.
    const sharedCooldown = await send({ action: 'directoryRateLimited', accountId: 'batch-b-a', retryAfterMs: 120 });
    check(sharedCooldown.success && sharedCooldown.result.cooldownUntil > Date.now(),
      'directory 429 writes persistent Retry-After deadline');
    const sameAccountWait = await send({ action: 'detailAcquire', accountId: 'batch-b-a', owner: 'other-tab' });
    check(!sameAccountWait.result.granted && sameAccountWait.result.reason === 'cooldown',
      'detail in another tab shares directory cooldown');
    const otherAccountSlot = await send({ action: 'detailAcquire', accountId: 'batch-b-b', owner: 'other-user' });
    check(otherAccountSlot.result.granted, 'another account remains independent');
    await send({ action: 'detailRelease', accountId: 'batch-b-b', owner: 'other-user',
      token: otherAccountSlot.result.token, status: 200 });
    await storage.upsertDirectory('batch-b-a', [{ id: 'during-cooldown' }]);
    check((await send({ action: 'detailStatus', accountId: 'batch-b-a' })).result.cooldownUntil ===
      sharedCooldown.result.cooldownUntil, 'directory update cannot erase cooldown');
    const noRetryAfter = await send({ action: 'directoryRateLimited', accountId: 'batch-b-fallback' });
    check(noRetryAfter.result.cooldownUntil > Date.now() + 59000,
      'missing Retry-After gets durable exponential-backoff default');
    const repeated429 = await send({ action: 'directoryRateLimited', accountId: 'batch-b-fallback' });
    check(repeated429.result.cooldownUntil > noRetryAfter.result.cooldownUntil + 50000,
      'repeated 429 increases persistent fallback backoff');
    check((await send({ action: 'logList', accountId: 'batch-b-a' })).result.some(entry =>
      entry.type === 'rate-limit' && entry.code === '429'), 'directory rate limit is observable');

    // A real browser fetch path, with controlled mock HTTP status responses.
    activeAccount = 'acct-a';
    const originalFetch = window.fetch;
    let simulatedCode = 0;
    let simulatedHits = 0;
    window.fetch = async (url, opts) => {
      if (String(url).includes('/backend-api/conversations') && simulatedCode) {
        simulatedHits++;
        if (simulatedCode !== 429 || simulatedHits === 1) {
          return { ok: false, status: simulatedCode, json: async () => ({}),
            headers: { get: header => header === 'Retry-After' && simulatedCode === 429 ? '0.02' : null } };
        }
      }
      return originalFetch(url, opts);
    };
    simulatedCode = 429;
    const syncedAfter429 = await window.APIHandler.syncConversationList(true, { requireComplete: true });
    check(simulatedHits === 2 && syncedAfter429.some(item => item.id === 'remote-acct-a'),
      'directory request recovers at stored Retry-After deadline without restarting the full scan');
    check((await send({ action: 'logList', accountId: 'acct-a' })).result.some(entry =>
      entry.type === 'rate-limit' && entry.code === '429'), 'simulated directory 429 is recorded');
    simulatedCode = 403; simulatedHits = 0;
    try {
      await window.APIHandler.syncConversationList(true, { requireComplete: true });
      throw Error('403 unexpectedly succeeded');
    } catch (error) { check(error.status === 403, '403 aborts sync instead of retrying forever'); }
    check(simulatedHits === 1 && (await storage.getDirectory('acct-a')).length > 0,
      '403 performs one directory attempt and preserves local data');
    simulatedCode = 401; simulatedHits = 0;
    try {
      await window.APIHandler.syncConversationList(true, { requireComplete: true });
      throw Error('401 unexpectedly succeeded');
    } catch (error) { check(error.status === 401, 'persistent authentication failure stops sync'); }
    check(simulatedHits <= 2, '401 at most triggers one session revalidation, not unbounded retries');
    window.fetch = originalFetch;
    // Re-establish identity for the following unknown-identity test.
    await window.APIHandler.getAccountId(true);

    const failureItems = Array.from({ length: 5 }, (_, i) => ({ id: 'failure-' + i }));
    const failureTask = await send({ action: 'taskCreate', accountId: 'batch-b-fail',
      type: 'index', items: failureItems });
    const failureClaim = await send({ action: 'taskClaim', accountId: 'batch-b-fail',
      id: failureTask.result.id, owner: 'batch-b-tab' });
    check(failureClaim.result.acquired, 'failure test starts a leased task');
    for (let i = 0; i < 3; i++) {
      const outcome = await send({ action: 'taskCheckpoint', accountId: 'batch-b-fail',
        id: failureTask.result.id, owner: 'batch-b-tab', token: failureClaim.result.token,
        itemIndex: i, outcome: 'failed', error: 'mock-item-error' });
      check(outcome.success && outcome.result.task.nextIndex === i + 1,
        'each failed item is durably checkpointed');
    }
    const pausedTask = await send({ action: 'taskGet', accountId: 'batch-b-fail', id: failureTask.result.id });
    check(pausedTask.result.status === 'paused' && pausedTask.result.consecutiveFailures === 3 &&
      pausedTask.result.nextIndex === 3, 'three consecutive failures pause and retain cursor');
    const skippedFailure = await send({ action: 'indexSkipConversation', accountId: 'batch-b-fail',
      taskId: failureTask.result.id, conversationId: 'failure-0' });
    const afterSkipTask = await send({ action: 'taskGet', accountId: 'batch-b-fail', id: failureTask.result.id });
    const afterSkipPolicy = await send({ action: 'indexPolicyGet', accountId: 'batch-b-fail' });
    check(skippedFailure.success && afterSkipTask.result.errors.length === 2 &&
      afterSkipTask.result.failureCount === 2 && afterSkipTask.result.skippedCount === 1,
      'skipping a failed item removes it from the failure list and task failure count');
    check(JSON.stringify(afterSkipPolicy.result.skippedIndexIds) === JSON.stringify(['failure-0']) &&
      JSON.stringify(afterSkipTask.result.skippedIds) === JSON.stringify(['failure-0']),
      'skipping one failed item persists only that conversation ID, not the rest of the task');
    check(!(await send({ action: 'indexSkipConversation', accountId: 'batch-b-other',
      taskId: failureTask.result.id, conversationId: 'failure-1' })).success,
      'another account cannot skip an item from this task');
    check((await send({ action: 'logList', accountId: 'batch-b-fail' })).result.some(entry =>
      entry.code === 'consecutive-failures-paused'), 'automatic pause appears in structured logs');
    check(!(await send({ action: 'taskCheckpoint', accountId: 'batch-b-fail',
      id: failureTask.result.id, owner: 'batch-b-tab', token: failureClaim.result.token,
      itemIndex: 3, outcome: 'success' })).success, 'paused task rejects stale lease');
    await send({ action: 'taskControl', accountId: 'batch-b-fail', id: failureTask.result.id,
      operation: 'resume' });
    const resumedFailureClaim = await send({ action: 'taskClaim', accountId: 'batch-b-fail',
      id: failureTask.result.id, owner: 'batch-b-next-tab' });
    check(resumedFailureClaim.result.acquired, 'user can resume after troubleshooting');
    const resumedCheckpoint = await send({ action: 'taskCheckpoint', accountId: 'batch-b-fail',
      id: failureTask.result.id, owner: 'batch-b-next-tab', token: resumedFailureClaim.result.token,
      itemIndex: 3, outcome: 'success' });
    check(resumedCheckpoint.result.task.consecutiveFailures === 0 &&
      resumedCheckpoint.result.task.nextIndex === 4, 'resuming resets failure streak, preserving cursor');

    // C: stage and deadline are durable task metadata, lease-fenced per account.
    const waitUntil = Date.now() + 5000;
    const phaseUpdate = await send({ action: 'taskPhase', accountId: 'batch-b-fail',
      id: failureTask.result.id, owner: 'batch-b-next-tab', token: resumedFailureClaim.result.token,
      phase: 'waiting', waitUntil });
    check(phaseUpdate.success && phaseUpdate.result.task.phase === 'waiting' &&
      phaseUpdate.result.task.waitUntil === waitUntil, 'task stage and deadline persist across reopen');
    check(!(await send({ action: 'taskPhase', accountId: 'batch-b-fail',
      id: failureTask.result.id, owner: 'other-tab', token: 'stale',
      phase: 'fetching' })).success, 'unleased tab cannot falsify progress');
    check(!(await send({ action: 'taskPhase', accountId: 'batch-b-b',
      id: failureTask.result.id, owner: 'batch-b-next-tab', token: resumedFailureClaim.result.token,
      phase: 'fetching' })).success, 'other account cannot modify task stage');
    const setup = await send({ action: 'indexSetupPhase', accountId: consentId, phase: 'scanning' });
    check(setup.success && (await send({ action: 'indexPolicyGet', accountId: consentId })).result.setupPhase === 'scanning',
      'first directory scanning phase appears in durable index policy');
    await send({ action: 'indexSetupPhase', accountId: consentId, phase: null });
    check(!(await send({ action: 'indexPolicyGet', accountId: consentId })).result.setupPhase,
      'directory scanning progress clears after completion');

    activeAccount = 'acct-a';
    await window.APIHandler.getAccountId(true);
    simulateInvalidJsonId = 'invalid-json-detail';
    const beforeInvalidJson = detailRequests;
    let invalidJsonError = null;
    try { await window.APIHandler.getConversation(simulateInvalidJsonId); }
    catch (error) { invalidJsonError = error; }
    check(invalidJsonError?.code === 'E_API_RESPONSE_INVALID_JSON',
      'malformed HTTP 200 response is classified as a permanent JSON format error');
    check(detailRequests === beforeInvalidJson + 1,
      'malformed JSON response is not retried as a transient network error');
    simulateInvalidJsonId = null;

    missingIdentity = true;
    try { await window.APIHandler.getCachedConversationList(); throw Error('unverified identity allowed'); }
    catch (error) { check(/账号无法确认/.test(error.message), 'missing user id cannot access cache'); }
    document.getElementById('result').textContent = 'S1_PASS: account switching, scoped directory/search, JSON versions, persistent index skip';
  } catch (error) {
    document.getElementById('result').textContent = 'S1_FAIL: ' + (error.stack || error.message);
  }
})();
</script>`;

const server = http.createServer((req, res) => {
  if (req.url === '/local-data-store.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    res.end(source);
  } else if (req.url === '/background.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    res.end(background);
  } else if (req.url === '/api-handler.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    res.end(apiHandler);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(harness);
  }
});

server.listen(0, '127.0.0.1', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chatgpt-pro-idb-'));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const chrome = spawn('google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--no-first-run', '--disable-extensions', `--user-data-dir=${dir}`,
    '--remote-debugging-port=0', url
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  let ws;
  let result = 'S1_FAIL: browser did not finish';
  try {
    let port;
    for (let i = 0; i < 100; i++) {
      const file = path.join(dir, 'DevToolsActivePort');
      if (fs.existsSync(file)) { port = fs.readFileSync(file, 'utf8').split('\n')[0]; break; }
      await sleep(100);
    }
    if (!port) throw Error('Chrome debugger did not become ready');
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    const target = targets.find(t => t.type === 'page');
    if (!target) throw Error('Chrome page target not found');
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    let nextId = 0;
    const evaluate = expression => new Promise((resolve, reject) => {
      const id = ++nextId;
      const handler = event => {
        const message = JSON.parse(event.data);
        if (message.id !== id) return;
        ws.removeEventListener('message', handler);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result?.result?.value);
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
    });
    for (let i = 0; i < 100; i++) {
      const value = await evaluate('document.querySelector("#result")?.textContent');
      if (value?.startsWith('S1_')) { result = value; break; }
      await sleep(100);
    }
  } catch (error) {
    result = 'S1_FAIL: ' + error.message;
  } finally {
    ws?.close();
    chrome.kill('SIGTERM');
    server.close();
    await sleep(100);
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log(result.slice(0, 1500));
  if (!result.startsWith('S1_PASS')) process.exitCode = 1;
});
