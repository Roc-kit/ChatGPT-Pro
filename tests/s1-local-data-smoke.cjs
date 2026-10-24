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
    // Simulate a genuine pre-upgrade v1 database with no account association.
    const request = indexedDB.open('ChatGPTProSearch', 1);
    request.onupgradeneeded = () => {
      const legacy = request.result.createObjectStore('conversations', { keyPath: 'id' });
      legacy.createIndex('updateTime', 'updateTime');
      legacy.createIndex('indexedAt', 'indexedAt');
    };
    const oldDb = await req(request);
    await new Promise((resolve, reject) => {
      const tx = oldDb.transaction('conversations', 'readwrite');
      tx.objectStore('conversations').put({
        id: 'old-chat', title: 'old index survives', updateTime: 1700000000000,
        indexedAt: 1700000000000, messages: [{ text: 'legacy text remains searchable' }]
      });
      tx.oncomplete = resolve;
      tx.onabort = () => reject(tx.error);
    });
    oldDb.close();
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/local-data-store.js'; s.onload = resolve; s.onerror = reject;
      document.head.append(s);
    });
    const storage = window.ChatGPTProLocalData;
    const oldStats = await storage.getLegacyMetadata();
    check(oldStats.legacyCount === 1 && oldStats.unassignedCount === 1, 'lossless v1 migration');
    const upgradeDb = await storage.openDb();
    check(upgradeDb.version === 2 && upgradeDb.objectStoreNames.contains('tasks')
      && upgradeDb.objectStoreNames.contains('logs'), 'six new stores');
    const legacyRecord = await req(upgradeDb.transaction('conversations').objectStore('conversations').get('old-chat'));
    check(legacyRecord.messages[0].text === 'legacy text remains searchable', 'v1 preserved as-is');
    upgradeDb.close();
    // Exercise the actual background search path against the upgraded DB.
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
    const oldMatches = await searchFullText('legacy');
    check(oldMatches.length === 1 && oldMatches[0].conversationId === 'old-chat', 'legacy search works after v2');
    const pruneResult = await pruneSearchIndex([]);
    check(pruneResult.removed === 0 && pruneResult.retainedUnverified === 1, 'unverified deletion never prunes');
    check((await searchFullText('legacy')).length === 1, 'prune preserved searchable data');
    check((await searchUnassignedLegacy('legacy', 10))[0].origin === 'legacy-unassigned', 'explicit legacy search');
    check((await searchForAccount('acct-a', 'legacy', 10)).length === 0, 'legacy not included in account search');

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
    const send = message => new Promise(resolve => chrome.runtime.sendMessage(message, resolve));
    check((await send({ action: 'searchFullText', accountId: 'acct-a', query: 'A text' })).results.length === 1,
      'runtime search action is scoped');
    check((await send({ action: 'searchFullText', accountId: 'acct-b', query: 'A text' })).results.length === 0,
      'runtime search cannot return another account');
    check((await send({ action: 'searchFullText', query: 'A text' })).success === false,
      'runtime search without account is rejected');
    check((await send({ action: 'searchUnassignedLegacy', query: 'legacy' })).results.length === 1,
      'runtime legacy search requires distinct action');
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
    check(!(await storage.getConversation('acct-a', 'same-id', 1700000000)).hit, 'old revision no longer matches');
    check((await storage.getLegacyMetadata()).unassignedCount === 1, 'legacy unassigned not reassigned');
    try { await storage.getConversation(storage.UNASSIGNED_ACCOUNT, 'old-chat'); throw Error('unassigned exposed'); }
    catch (error) { check(/账号 ID/.test(error.message), 'unassigned account is not active'); }

    // Exercise the real page API client and the background message handlers,
    // without network requests to ChatGPT or changing the user's browser data.
    let activeAccount = 'acct-a';
    let missingIdentity = false;
    let switchMidSync = false;
    let detailRequests = 0;
    const sentUrls = [];
    window.fetch = async (input, options) => {
      const url = String(input);
      sentUrls.push(url);
      let json;
      if (url.includes('/api/auth/session')) {
        json = { user: missingIdentity ? {} : { id: activeAccount }, accessToken: 'test-token' };
      } else if (url.includes('/backend-api/conversations')) {
        const id = switchMidSync ? 'race-old-account' : 'remote-' + activeAccount;
        json = { items: [{ id, title: activeAccount,
          update_time: 1700000003 }], total: 1 };
        if (switchMidSync) { activeAccount = 'acct-b'; switchMidSync = false; }
      } else if (url.includes('/backend-api/gizmos/snorlax/sidebar')) {
        json = { items: [] };
      } else if (url.includes('/backend-api/conversation/')) {
        detailRequests++;
        const id = decodeURIComponent(url.split('/').pop());
        json = { id, title: 'remote-details', update_time: 1700000003,
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
    // Explicit clear must not remove raw JSON, another account, or old legacy data.
    const cleared = await send({ action: 'searchIndexClear', accountId: 'acct-a' });
    check(cleared.success && cleared.removed === 0, 'already-invalid A search clear is idempotent');
    check((await storage.getSearchRecords('acct-b')).length === 1, 'clear must not affect B');
    check((await searchUnassignedLegacy('legacy')).length === 1, 'clear must not touch old index');
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
    check(detailRequests === 1, 'same conversation request coalesced into one network call');
    check((await storage.getConversation('acct-b', 'cached-0')).hit, 'network response cached in B');
    check((await storage.getConversation('acct-a', 'cached-0')).raw.title === 'stored-A',
      'B fetch did not overwrite A cache');
    check((await window.APIHandler.getConversation('cached-0')).title === 'remote-details' && detailRequests === 1,
      'subsequent B cache hit is network-free');
    await storage.upsertDirectory('acct-b', [{ id: 'cached-0', updateTime: 1700000004 }]);
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
    missingIdentity = true;
    try { await window.APIHandler.getCachedConversationList(); throw Error('unverified identity allowed'); }
    catch (error) { check(/账号无法确认/.test(error.message), 'missing user id cannot access cache'); }
    document.getElementById('result').textContent = 'S1_PASS: upgrade, legacy search, account switching, scoped directory/search, JSON versions';
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
