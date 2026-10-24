/** Browser-native IndexedDB S1 regression; no npm dependencies or real API. */
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const source = fs.readFileSync(path.join(__dirname, '../scripts/local-data-store.js'));
const background = fs.readFileSync(path.join(__dirname, '../scripts/background.js'));
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
    window.chrome = {
      runtime: {
        onInstalled: { addListener() {} },
        onMessage: { addListener() {} }
      }
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
    document.getElementById('result').textContent = 'S1_PASS: migration, legacy preservation, isolation, versions, invalidation, validation';
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
