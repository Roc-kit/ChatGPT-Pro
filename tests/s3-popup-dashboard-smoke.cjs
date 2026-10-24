/** Exercise the real Popup task UI in isolated Chrome, without ChatGPT requests. */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const popupHtml = fs.readFileSync(path.join(__dirname, '../popup/popup.html'), 'utf8');
const popupJs = fs.readFileSync(path.join(__dirname, '../popup/popup.js'), 'utf8');
const mock = `<script>
  const tasks = [
    { id: 'i', type: 'index', status: 'running', done: 20, total: 100,
      successes: 20, failures: 0, savedVolumes: 0 },
    { id: 'm', type: 'export-md', status: 'paused', done: 50, total: 55,
      successes: 50, failures: 0, savedVolumes: 1 },
    { id: 'j', type: 'export-json', status: 'completed', done: 5, total: 5,
      successes: 5, failures: 0, savedVolumes: 1 }
  ];
  const indexPolicy = { consentAt: null, initialCompletedAt: null };
  window.__testState = { tasks, calls: [], currentUrl: 'https://chatgpt.com/c/example', allowConsent: true };
  window.confirm = () => window.__testState.allowConsent;
  window.chrome = {
    runtime: { lastError: null },
    storage: { local: {
      get(_keys, callback) { callback({ enabled: true }); },
      set(_settings, callback) { callback?.(); }
    } },
    tabs: {
      query(_query, callback) {
        callback([{ id: 7, url: window.__testState.currentUrl }]);
      },
      sendMessage(_tabId, msg, callback) {
        window.__testState.calls.push({ ...msg });
        if (msg.action === 'getStatus') {
          callback({ initialized: true, directoryCount: 120 });
        } else if (msg.action === 'taskDashboard') {
          callback({ success: true, tasks, indexPolicy: { ...indexPolicy }, logs: [{ createdAt: Date.now(), type: 'rate-limit',
            code: '429', message: '请求冷却' }], cooldownUntil: 0 });
        } else if (msg.action === 'indexBegin') {
          if (msg.userConfirmedConsent) indexPolicy.consentAt = Date.now();
          callback({ success: true, queued: true });
        } else if (msg.action === 'taskManage') {
          const job = tasks.find(item => item.id === msg.id);
          if (msg.operation === 'pause') job.status = 'paused';
          else if (msg.operation === 'resume') job.status = 'pending';
          else if (msg.operation === 'cancel') job.status = 'canceled';
          callback({ success: true, status: job.status });
        } else if (msg.action === 'taskDownloadVolumes') {
          callback({ success: true, initiated: 1 });
        } else if (msg.action === 'taskClearVolumes') {
          tasks.find(item => item.id === msg.id).savedVolumes = 0;
          callback({ success: true, deleted: 1 });
        } else callback({ success: false, error: 'unexpected action' });
      }
    }
  };
</script>`;

const server = http.createServer((request, response) => {
  if (request.url === '/popup.js') {
    response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    response.end(popupJs);
  } else {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(popupHtml.replace('<script src="popup.js"></script>', mock + '<script src="popup.js"></script>'));
  }
});

server.listen(0, '127.0.0.1', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chatgpt-pro-popup-'));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const chrome = spawn('google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--no-first-run', '--disable-extensions', `--user-data-dir=${dir}`,
    '--remote-debugging-port=0', url
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  let ws;
  let output = 'S3_POPUP_FAIL: browser never initialized';
  try {
    let port;
    for (let i = 0; i < 100; i++) {
      const file = path.join(dir, 'DevToolsActivePort');
      if (fs.existsSync(file)) { port = fs.readFileSync(file, 'utf8').split('\n')[0]; break; }
      await sleep(100);
    }
    if (!port) throw Error('Chrome DevTools unavailable');
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    const page = targets.find(target => target.type === 'page');
    if (!page) throw Error('No Popup page');
    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    let nextId = 0;
    const evaluate = expression => new Promise((resolve, reject) => {
      const id = ++nextId;
      const onMessage = event => {
        const msg = JSON.parse(event.data);
        if (msg.id !== id) return;
        ws.removeEventListener('message', onMessage);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result?.result?.value);
      };
      ws.addEventListener('message', onMessage);
      ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: {
        expression, returnByValue: true, awaitPromise: true
      } }));
    });
    for (let i = 0; i < 60; i++) {
      if (await evaluate('document.querySelectorAll(".task-card").length') === 3) break;
      await sleep(50);
    }
    const result = await evaluate(`(async () => {
      const check = (ok, desc) => { if (!ok) throw Error(desc); };
      check(document.querySelectorAll('.task-card').length === 3, 'all three tasks displayed');
      check(document.querySelector('[role="progressbar"]').getAttribute('aria-valuenow') === '20',
        'accessible progress shows cursor');
      check(document.querySelector('#taskLogList').textContent.includes('请求冷却'), 'event log shown');
      const selectAction = (index, label) => [...document.querySelectorAll('.task-card')[index]
        .querySelectorAll('button')].find(button => button.textContent === label);
      selectAction(0, '暂停').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(window.__testState.tasks[0].status === 'paused', 'pause sent to page');
      selectAction(0, '继续').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(window.__testState.tasks[0].status === 'pending', 'resume sent to page');
      selectAction(1, '下载分卷').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(window.__testState.calls.some(msg => msg.action === 'taskDownloadVolumes' && msg.id === 'm'),
        'download targets the specific persisted task');
      check(document.querySelector('#taskFeedback').textContent.includes('下载'), 'download feedback visible');
      selectAction(2, '清理分卷').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(window.__testState.calls.some(msg => msg.action === 'taskClearVolumes' && msg.id === 'j'),
        'manual cleanup targets the completed task');
      check(!selectAction(2, '下载分卷'), 'cleaned ZIP no longer offers download button');
      window.__testState.tasks[0].status = 'completed';
      document.querySelector('#taskRefresh').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(!document.querySelector('#indexStart').disabled &&
        document.querySelector('#indexStart').textContent.includes('需授权'),
        'first index CTA requires consent and no active index job');
      window.__testState.allowConsent = false;
      const callsBeforeDenial = window.__testState.calls.length;
      document.querySelector('#indexStart').click();
      await new Promise(resolve => setTimeout(resolve, 20));
      check(window.__testState.calls.length === callsBeforeDenial,
        'rejecting popup consent cannot send index request');
      window.__testState.allowConsent = true;
      document.querySelector('#indexStart').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(window.__testState.calls.some(msg => msg.action === 'indexBegin' && msg.userConfirmedConsent),
        'explicitly approved popup consent is passed to signed-in tab');
      check(document.querySelector('#indexStart').textContent === '继续首次全文索引',
        'after consent popup offers to continue incomplete initial indexing');
      window.__testState.currentUrl = 'https://example.org/';
      document.querySelector('#taskRefresh').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(document.querySelector('#taskFeedback').textContent.includes('请切换到已登录'),
        'task management requires active ChatGPT tab');
      check(!document.querySelector('.task-card'), 'switching away clears old account task view');
      return 'S3_POPUP_PASS: progress, pause/resume, download, logs and account-tab boundary';
    })().catch(error => 'S3_POPUP_FAIL: ' + error.message)`);
    output = result;
  } catch (error) {
    output = 'S3_POPUP_FAIL: ' + error.message;
  } finally {
    ws?.close();
    chrome.kill('SIGTERM');
    server.close();
    await sleep(100);
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log(output);
  if (!output.startsWith('S3_POPUP_PASS')) process.exitCode = 1;
});
