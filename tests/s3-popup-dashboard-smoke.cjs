/** Exercise the real Popup task UI in isolated Chrome, without ChatGPT requests. */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const popupHtml = fs.readFileSync(path.join(__dirname, '../popup/popup.html'), 'utf8');
const popupJs = fs.readFileSync(path.join(__dirname, '../popup/popup.js'), 'utf8');
const i18nJs = fs.readFileSync(path.join(__dirname, '../scripts/i18n.js'), 'utf8');
const mock = `<script>
  const tasks = [
    { id: 'i', type: 'index', status: 'running', done: 20, total: 100,
      successes: 20, failures: 0, savedVolumes: 0 },
    { id: 'm', type: 'export-md', status: 'paused', done: 50, total: 55,
      successes: 50, failures: 0, savedVolumes: 1 },
    { id: 'j', type: 'export-json', status: 'completed', done: 5, total: 5,
      successes: 5, failures: 0, savedVolumes: 1 }
  ];
  const indexPolicy = { consentAt: null, initialCompletedAt: null, autoEnabled: false };
  const stats = { directory: 120, complete: 71, indexed: 43 };
  window.__testState = { tasks, calls: [], currentUrl: 'https://chatgpt.com/c/example',
    otherTabs: [], opened: [], noAuth: false, allowConsent: true, cooldownUntil: 0 };
  window.confirm = () => window.__testState.allowConsent;
  window.chrome = {
    runtime: { lastError: null },
    storage: { local: {
      get(_keys, callback) { callback({ enabled: true, uiLanguage: 'zh-CN' }); },
      set(_settings, callback) { callback?.(); }
    } },
    tabs: {
      query(_query, callback) {
        callback([{ id: 7, active: true, currentWindow: true, url: window.__testState.currentUrl },
          ...window.__testState.otherTabs]);
      },
      update(tabId, opts, callback) {
        window.__testState.opened.push({ action: 'update', tabId, ...opts });
        callback({ id: tabId });
      },
      create(opts, callback) {
        window.__testState.opened.push({ action: 'create', ...opts });
        window.__testState.otherTabs.push({ id: 19, active: false,
          currentWindow: true, url: opts.url });
        callback({ id: 19 });
      },
      sendMessage(_tabId, msg, callback) {
        window.__testState.calls.push({ ...msg });
        if (msg.action === 'getStatus') {
          callback({ initialized: true, directoryCount: 120 });
        } else if (msg.action === 'taskDashboard') {
          callback(window.__testState.noAuth ? { success: false, error: '账号无法确认' }
            : { success: true, tasks, indexPolicy: { ...indexPolicy }, stats: { ...stats },
              logs: [{ createdAt: Date.now(), type: 'rate-limit', code: '429',
                message: '请求冷却' }], cooldownUntil: window.__testState.cooldownUntil });
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
        } else if (msg.action === 'indexAutoSet') {
          if (!indexPolicy.initialCompletedAt) callback({ success: false, error: '尚未完成索引' });
          else {
            indexPolicy.autoEnabled = msg.enabled;
            callback({ success: true, autoEnabled: msg.enabled });
          }
        } else if (msg.action === 'clearAccountLocalData') {
          const key = msg.kind === 'index' ? 'indexed' : 'complete';
          const removed = stats[key];
          stats[key] = 0;
          if (msg.kind === 'index') {
            indexPolicy.initialCompletedAt = null;
            indexPolicy.autoEnabled = false;
          }
          callback({ success: true, removed });
        } else callback({ success: false, error: 'unexpected action' });
      }
    }
  };
</script>`;

const server = http.createServer((request, response) => {
  if (request.url === '/popup.js') {
    response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    response.end(popupJs);
  } else if (request.url === '/scripts/i18n.js') {
    response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    response.end(i18nJs);
  } else if (/^\/scripts\/locales\/(registry|dynamic-map|reviewed-ui|zh-CN|en|zh-TW|es|hi|ar|pt-BR|bn|id|fr|ru|ja)\.js$/.test(request.url)) {
    response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    response.end(fs.readFileSync(path.join(__dirname, '..', request.url), 'utf8'));
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
      if (await evaluate('document.querySelectorAll(".task-card").length') === 2) break;
      await sleep(50);
    }
    const result = await evaluate(`(async () => {
      const check = (ok, desc) => { if (!ok) throw Error(desc); };
      check(document.querySelectorAll('.task-card').length === 2,
        'only running and paused jobs displayed, completed history hidden');
      check(document.querySelector('[role="progressbar"]').getAttribute('aria-valuenow') === '20',
        'accessible progress shows cursor');
      check(!document.querySelector('#taskLogList') && !document.querySelector('#taskLogsWrap'),
        'event history is absent from the compact popup');
      check(!document.querySelector('#taskManager').open,
        'index and cache management starts collapsed');
      check(getComputedStyle(document.querySelector('.header')).backgroundColor === 'rgb(16, 163, 127)',
        'brand header uses the same accent green as switches');
      check(getComputedStyle(document.querySelector('#apiStatus')).color === 'rgb(255, 255, 255)',
        'ready status has readable white contrast against the green header');
      check(document.querySelector('#openChatGPT').getBoundingClientRect().top >=
        document.querySelector('.header strong').getBoundingClientRect().bottom,
        'open ChatGPT action appears on the second header row');
      document.querySelector('#taskManager summary').click();
      check(document.querySelector('#taskManager').open, 'footer management entry expands controls');
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
      check(!document.querySelector('.task-card').textContent.includes('5/5'),
        'completed JSON task never creates an extra history progress bar');
      window.__testState.tasks[0].status = 'completed';
      document.querySelector('#taskRefresh').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(document.querySelectorAll('.task-card').length === 1,
        'completed index task disappears while paused export remains actionable');
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
      check(document.querySelector('#count').textContent === '–' &&
        document.querySelector('#rawCount').textContent === '–',
        'no authenticated tab does not show old account statistics');
      document.querySelector('#openChatGPT').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(window.__testState.opened.length === 1 && window.__testState.opened[0].action === 'create',
        'open action creates ChatGPT only when absent');
      document.querySelector('#openChatGPT').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(window.__testState.opened.length === 2 && window.__testState.opened[1].action === 'update' &&
        window.__testState.opened[1].tabId === 19,
        'open action reuses and activates existing ChatGPT tab');
      document.querySelector('#taskRefresh').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(document.querySelector('#count').textContent === '120' &&
        document.querySelector('#rawCount').textContent === '71' &&
        document.querySelector('#indexedCount').textContent === '43',
        'three persisted account-scoped counts display off ChatGPT page');
      indexPolicy.initialCompletedAt = Date.now();
      indexPolicy.autoEnabled = true;
      document.querySelector('#taskRefresh').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(!document.querySelector('#autoIndexToggle').disabled &&
        document.querySelector('#autoIndexToggle').getAttribute('aria-checked') === 'true',
        'auto index switch reflects completed account policy');
      document.querySelector('#autoIndexToggle').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(indexPolicy.autoEnabled === false &&
        window.__testState.calls.some(msg => msg.action === 'indexAutoSet' && msg.enabled === false),
        'toggle off persists via authenticated tab');
      document.querySelector('#autoIndexToggle').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(indexPolicy.autoEnabled === true, 'toggle on persists');
      window.__testState.cooldownUntil = Date.now() + 10000;
      const running = tasks.find(task => task.status === 'running');
      if (running) {
        running.phase = 'waiting';
        running.waitUntil = Date.now() + 9000;
      }
      document.querySelector('#taskRefresh').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(!document.querySelector('#taskCooldownText').hidden &&
        /剩余 [0-9]+ 秒/.test(document.querySelector('#taskCooldownText').textContent),
        'Popup shows dynamic persisted-account 429 countdown: ' +
        document.querySelector('#taskCooldownText').outerHTML +
        '; feedback=' + document.querySelector('#taskFeedback').textContent);
      if (running) check(document.querySelector('.task-card').textContent.includes('等待账号限流冷却'),
        'running task explains account-wide cooldown');
      window.__testState.cooldownUntil = 0;
      if (running) running.status = 'pending';
      indexPolicy.setupPhase = 'scanning';
      document.querySelector('#taskRefresh').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(document.querySelector('#indexConsentStatus').textContent.includes('扫描完整聊天目录'),
        'initial directory scanning is exposed without inventing an index task');
      indexPolicy.setupPhase = null;
      window.__testState.allowConsent = false;
      const beforeClear = window.__testState.calls.length;
      document.querySelector('#clearIndex').click();
      await new Promise(resolve => setTimeout(resolve, 20));
      check(window.__testState.calls.length === beforeClear, 'clear requires secondary confirmation');
      window.__testState.allowConsent = true;
      document.querySelector('#clearRaw').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(stats.complete === 0 && stats.indexed === 43 &&
        document.querySelector('#taskFeedback').textContent.includes('71'),
        'clear JSON reports number deleted but preserves search index');
      document.querySelector('#clearIndex').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(stats.indexed === 0 && indexPolicy.autoEnabled === false &&
        document.querySelector('#taskFeedback').textContent.includes('43'),
        'clear search reports exact count and shuts off auto-update');
      window.__testState.noAuth = true;
      document.querySelector('#taskRefresh').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      check(document.querySelector('#count').textContent === '–' &&
        document.querySelector('#rawCount').textContent === '–' &&
        document.querySelector('#indexedCount').textContent === '–' &&
        document.querySelector('#clearIndex').disabled,
        'unknown identity cannot expose statistics or allow cleanup');
      return 'S3_POPUP_PASS: tasks, open/reuse, scoped statistics, auto policy and independent clear';
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
