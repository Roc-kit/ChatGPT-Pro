/** S6: load the REAL MV3 extension into isolated Chrome and exercise its
 *  signed-in page, Popup, cache, index, and browser download path against
 *  deterministic mocked ChatGPT responses. Never touches the user's profile.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const CHAT_ID = 's6-fixture-conversation';
const CHAT_URL = `https://chatgpt.com/c/${CHAT_ID}`;
// Mimic the host site's checkbox reset. The extension must restore native
// checkbox paint, not merely create an invisible but clickable input.
const HOST_CSS = `<style>input[type="checkbox"] {
  appearance: none !important; -webkit-appearance: none !important;
  background: transparent !important; border: 0 !important;
  box-shadow: none !important;
}</style>`;
const BODY = '<!doctype html><html><head><meta charset="utf-8"><title>S6 isolated fixture</title>' + HOST_CSS + '</head>' +
  `<body><main><h1>Isolated ChatGPT fixture</h1><a href="/c/${CHAT_ID}">Fixture chat</a>` +
  `<section data-message-id="question" data-message-author-role="user"><p>s6 acceptance unique phrase</p></section>` +
  `<section data-message-id="answer" data-message-author-role="assistant"><p>hello from controlled fixture</p></section>` +
  `</main></body></html>`;
const CHAT = { id: CHAT_ID, title: 'Offline acceptance test', update_time: 1770000000,
  current_node: 'answer', mapping: {
    root: { id: 'root', parent: null, children: ['question'], message: null },
    question: { id: 'question', parent: 'root', children: ['answer'],
      message: { id: 'question', author: { role: 'user' }, content: { content_type: 'text', parts: ['s6 acceptance unique phrase'] }, create_time: 1770000000 } },
    answer: { id: 'answer', parent: 'question', children: [],
      message: { id: 'answer', author: { role: 'assistant' }, content: { content_type: 'text', parts: ['hello from controlled fixture'] }, create_time: 1770000001 } }
  }
};
const pad2 = value => String(value).padStart(2, '0');
const fixtureDateTime = (() => {
  const date = new Date(CHAT.update_time * 1000);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}_` +
    `${pad2(date.getHours())}-${pad2(date.getMinutes())}-${pad2(date.getSeconds())}`;
})();

class PipeCDP {
  constructor(chrome) {
    this.chrome = chrome;
    this.seq = 0;
    this.pending = new Map();
    this.listeners = new Set();
    this.buffer = '';
    chrome.stdio[4].on('data', bytes => {
      this.buffer += bytes.toString();
      let split;
      while ((split = this.buffer.indexOf('\0')) !== -1) {
        const text = this.buffer.slice(0, split);
        this.buffer = this.buffer.slice(split + 1);
        if (!text) continue;
        let message;
        try { message = JSON.parse(text); } catch { continue; }
        if (message.id && this.pending.has(message.id)) {
          const pending = this.pending.get(message.id);
          this.pending.delete(message.id);
          clearTimeout(pending.timer);
          if (message.error) pending.reject(Error(`${pending.method}: ${message.error.message}`));
          else pending.resolve(message.result);
        } else {
          for (const listener of this.listeners) listener(message);
        }
      }
    });
  }
  send(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const id = ++this.seq;
      const timer = setTimeout(() => {
        if (this.pending.delete(id)) reject(Error(`Timed out: ${method}`));
      }, 15000);
      this.pending.set(id, { method, timer, resolve, reject });
      this.chrome.stdio[3].write(JSON.stringify({ id, method, params,
        ...(sessionId ? { sessionId } : {}) }) + '\0');
    });
  }
  async eval(session, expression) {
    const reply = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true
    }, session);
    if (reply.exceptionDetails) throw Error(reply.exceptionDetails.text || 'Page exception');
    return reply.result?.value;
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function eventually(predicate, label, limitMs = 15000) {
  const start = Date.now();
  let last;
  while (Date.now() - start < limitMs) {
    try { if (await predicate()) return; } catch (e) { last = e; }
    await sleep(130);
  }
  throw Error(`Timeout: ${label}${last ? `: ${last.message}` : ''}`);
}

async function main() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'chatgpt-pro-s6-'));
  const downloadPath = path.join(profile, 'downloads');
  fs.mkdirSync(downloadPath);
  const chrome = spawn('google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--disable-background-networking', '--no-first-run',
    `--user-data-dir=${profile}`, '--enable-unsafe-extension-debugging',
    '--remote-debugging-pipe', 'about:blank'
  ], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
  const cdp = new PipeCDP(chrome);
  const requests = { session: 0, directory: 0, projectList: 0, details: 0 };
  let pageSession;
  let extensionId;
  const browserErrors = [];
  cdp.listeners.add(message => {
    if (message.method === 'Runtime.exceptionThrown') {
      const details = message.params?.exceptionDetails;
      browserErrors.push(details?.exception?.description || details?.text || 'unknown runtime exception');
    }
    if (message.method !== 'Fetch.requestPaused' || message.sessionId !== pageSession) return;
    const url = new URL(message.params.request.url);
    let response;
    if (url.pathname === '/api/auth/session') {
      requests.session++;
      response = { user: { id: 's6-isolated-account' }, accessToken: 'isolated-fixture-token' };
    } else if (url.pathname === '/backend-api/conversations') {
      requests.directory++;
      response = { items: [{ id: CHAT_ID, title: CHAT.title, create_time: CHAT.update_time,
        update_time: CHAT.update_time }], total: 1 };
    } else if (url.pathname === '/backend-api/gizmos/snorlax/sidebar') {
      requests.projectList++;
      response = { items: [] };
    } else if (url.pathname === `/backend-api/conversation/${CHAT_ID}`) {
      requests.details++;
      response = CHAT;
    }
    const isJson = Boolean(response);
    const body = isJson ? JSON.stringify(response) : BODY;
    cdp.send('Fetch.fulfillRequest', {
      requestId: message.params.requestId, responseCode: 200,
      responseHeaders: [
        { name: 'content-type', value: isJson ? 'application/json' : 'text/html; charset=utf-8' },
        { name: 'cache-control', value: 'no-store' }
      ], body: Buffer.from(body).toString('base64')
    }, pageSession).catch(error => browserErrors.push(error.message));
  });

  try {
    const extension = await cdp.send('Extensions.loadUnpacked', { path: ROOT });
    extensionId = extension.id;
    assert.match(extensionId, /^[a-p]{32}$/, 'unpacked MV3 installed');
    await cdp.send('Browser.setDownloadBehavior', {
      behavior: 'allow', downloadPath, eventsEnabled: true
    });
    const fixtureTarget = (await cdp.send('Target.createTarget', { url: 'about:blank' })).targetId;
    pageSession = (await cdp.send('Target.attachToTarget', { targetId: fixtureTarget, flatten: true })).sessionId;
    await cdp.send('Runtime.enable', {}, pageSession);
    await cdp.send('Page.enable', {}, pageSession);
    await cdp.send('Fetch.enable', { patterns: [
      { urlPattern: 'https://chatgpt.com/*', requestStage: 'Request' }
    ] }, pageSession);
    await cdp.send('Page.navigate', { url: CHAT_URL }, pageSession);
    await eventually(async () => cdp.eval(pageSession,
      `Boolean(document.querySelector('[data-chatgpt-pro-launcher]'))`),
    'real installed content script injected the launcher');
    assert.equal(await cdp.eval(pageSession, 'document.title'), 'S6 isolated fixture');

    const popupTarget = (await cdp.send('Target.createTarget', {
      url: `chrome-extension://${extensionId}/popup/popup.html`
    })).targetId;
    const popupSession = (await cdp.send('Target.attachToTarget', {
      targetId: popupTarget, flatten: true
    })).sessionId;
    await cdp.send('Runtime.enable', {}, popupSession);
    await cdp.send('Page.enable', {}, popupSession);
    await eventually(async () => cdp.eval(popupSession, `Boolean(document.querySelector('#indexStart'))`),
      'real installed popup loaded');
    // Keep the real ChatGPT fixture as the active tab while inspecting the
    // extension Popup via CDP. This is equivalent to opening its toolbar Popup.
    await cdp.send('Target.activateTarget', { targetId: fixtureTarget });
    await cdp.eval(popupSession, "document.querySelector('#taskRefresh').click()");
    await eventually(async () => cdp.eval(popupSession,
      `document.querySelector('#indexStartArea').hidden === false`),
    'popup received real content-script task dashboard');
    assert.equal(await cdp.eval(popupSession,
      `document.querySelector('#filenamePreset').value`), 'datetime_title',
    'new users default to sortable creation date and time');
    assert.match(await cdp.eval(popupSession,
      `document.querySelector('#filenamePreview').textContent`), /2026-10-24_09-47-12/);
    assert.match(await cdp.eval(popupSession,
      `document.querySelector('#indexStart').textContent`), /需授权/);

    // Denial: no directory/details request and no policy mutation.
    await cdp.eval(popupSession,
      `window.confirm = () => false; document.querySelector('#indexStart').click();`);
    await sleep(250);
    assert.equal(requests.details, 0, 'denied initial authorization must not fetch conversation body');

    // Directory export does not depend on full-text indexing or its consent.
    // Check that our checkbox style survives the host's appearance reset.
    await cdp.eval(pageSession, `document.querySelector('[data-chatgpt-pro-launcher]').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `Boolean(document.querySelector('.chatgpt-pro-row-checkbox'))`),
    'unindexed directory rendered');
    const controls = await cdp.eval(pageSession, `(() => {
      return ['.chatgpt-pro-select-all input', '.chatgpt-pro-row-checkbox',
        '.chatgpt-pro-export-check-latest', '.chatgpt-pro-legacy-search-toggle']
        .map(selector => {
          const input = document.querySelector(selector);
          const css = getComputedStyle(input);
          return { selector, appearance: css.appearance, display: css.display,
            visibility: css.visibility, opacity: css.opacity,
            width: input.getBoundingClientRect().width,
            height: input.getBoundingClientRect().height };
        });
    })()`);
    for (const control of controls) {
      assert.match(control.appearance, /^(auto|checkbox)$/, `${control.selector}: native checkbox appearance restored`);
      assert.notEqual(control.display, 'none', `${control.selector}: checkbox displayed`);
      assert.equal(control.visibility, 'visible', `${control.selector}: checkbox visible`);
      assert.equal(control.opacity, '1', `${control.selector}: checkbox opaque`);
      if (['.chatgpt-pro-select-all input', '.chatgpt-pro-row-checkbox'].includes(control.selector)) {
        assert(control.width >= 12 && control.height >= 12, `${control.selector}: checkbox has painted area`);
      }
    }
    await cdp.eval(pageSession, `document.querySelector('.chatgpt-pro-row-checkbox').click()`);
    assert.equal(await cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-select-all input').checked &&
       document.querySelector('.chatgpt-pro-batch-count').textContent.includes('1')`), true,
    'row checkbox still updates bulk selection and select-all state');
    assert.equal(await cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-export-check-latest').getBoundingClientRect().width >= 12`), true,
    'export check-latest checkbox is painted after selection reveals its toolbar');
    await cdp.eval(pageSession, `document.querySelector('.chatgpt-pro-select-all input').click()`);
    assert.equal(await cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-row-checkbox').checked`), false,
    'select-all can clear row selection');

    await cdp.eval(pageSession, `document.querySelector('.chatgpt-pro-row-export button').click()`);
    await eventually(async () => fs.existsSync(path.join(downloadPath,
      `${fixtureDateTime}_Offline acceptance test.md`)),
      'Markdown exported with sortable create timestamp and no full-text index');
    await cdp.eval(pageSession, `document.querySelectorAll('.chatgpt-pro-row-export button')[1].click()`);
    await eventually(async () => fs.existsSync(path.join(downloadPath,
      `${fixtureDateTime}_Offline acceptance test.json`)),
      'raw JSON exported with sortable create timestamp and no full-text index');
    assert.equal(requests.details, 1, 'unindexed single exports fetch uncached original JSON only once');
    await cdp.eval(pageSession, `document.querySelector('.chatgpt-pro-row-checkbox').click()`);
    await cdp.eval(pageSession, `document.querySelector('[data-batch-format="json"]').click()`);
    await eventually(async () => fs.readdirSync(downloadPath).some(name => name.endsWith('.zip')),
      'unindexed selection produced JSON ZIP', 24000);
    assert.equal(requests.details, 1, 'unindexed batch export reuses the single-export cache');
    for (const name of fs.readdirSync(downloadPath).filter(name => name.endsWith('.zip'))) {
      fs.rmSync(path.join(downloadPath, name));
    }
    await cdp.eval(pageSession, `document.querySelector('[data-chatgpt-pro-launcher]').click()`);

    // The mock user explicitly approves initial indexing. The content script
    // performs the full directory/JSON/index task, not an inline popup mock.
    await cdp.eval(popupSession,
      `window.confirm = () => true; document.querySelector('#indexStart').click();`);
    await eventually(async () => {
      await cdp.eval(popupSession, `document.querySelector('#taskRefresh').click()`);
      return (await cdp.eval(popupSession,
        `document.querySelector('#indexConsentStatus').textContent`)).includes('已完成');
    }, 'initial index completion persisted in real MV3 IndexedDB', 24000);
    assert.equal(requests.details, 1, 'first index reused the complete raw JSON cached before consent');
    assert(requests.directory > 0 && requests.projectList > 0, 'real strict scan covered normal and project listings');

    // R8 original settings: switches propagate to the real content script and
    // the message timestamp decoration uses cached full JSON, not a re-fetch.
    await cdp.eval(popupSession, `document.querySelector('#messageTimeToggle').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('[data-chatgpt-pro-message-timestamp]').length === 2`),
    'user + assistant timestamps render from persisted JSON');
    assert.equal(requests.details, 1, 'timestamp decoration reuses cached JSON');
    await cdp.eval(popupSession, `document.querySelector('#messageTimeToggle').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('[data-chatgpt-pro-message-timestamp]').length === 0`),
    'disabling message timestamps removes decorations');
    await cdp.eval(popupSession, `(() => {
      const preset = document.querySelector('#filenamePreset');
      preset.value = 'date_title';
      preset.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await eventually(async () => cdp.eval(popupSession,
      `new Promise(resolve => chrome.storage.local.get('exportFilenameTemplate',
        data => resolve(data.exportFilenameTemplate === '{created_date}_{title}')))`),
    'filename preset persists to the real extension settings');
    assert.match(await cdp.eval(popupSession,
      `document.querySelector('#filenamePreview').textContent`), /2026-10-24/);

    await cdp.eval(pageSession, `document.querySelector('[data-chatgpt-pro-launcher]').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `Boolean(document.querySelector('[data-panel-view="search"]'))`), 'directory panel opened');
    // R8 single exports: exercise both real browser downloads and filename
    // template, without a second detail request for the same cached version.
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('.chatgpt-pro-row-export button').length === 2`),
    'single conversation export controls mounted');
    await cdp.eval(pageSession, `document.querySelector('.chatgpt-pro-row-export button').click()`);
    await eventually(async () => fs.readdirSync(downloadPath).some(name =>
      name === '2026-02-02_Offline acceptance test.md'), 'single Markdown download uses saved filename template');
    await cdp.eval(pageSession, `document.querySelectorAll('.chatgpt-pro-row-export button')[1].click()`);
    await eventually(async () => fs.readdirSync(downloadPath).some(name =>
      name === '2026-02-02_Offline acceptance test.json'), 'single JSON download uses saved filename template');
    const singleMd = fs.readFileSync(path.join(downloadPath, '2026-02-02_Offline acceptance test.md'), 'utf8');
    const singleJson = JSON.parse(fs.readFileSync(path.join(downloadPath,
      '2026-02-02_Offline acceptance test.json'), 'utf8'));
    assert(singleMd.includes('s6 acceptance unique phrase') && singleMd.includes('hello from controlled fixture'),
      'Markdown contains user and assistant text');
    assert.equal(singleJson.conversation.mapping.question.message.id, 'question',
      'JSON preserves complete original conversation mapping');
    assert.equal(requests.details, 1, 'both single exports share cached full JSON');
    // Custom templates can also sort by exact update timestamp. Saved older
    // date-only presets remain valid and were covered above.
    await cdp.eval(popupSession, `(() => {
      const preset = document.querySelector('#filenamePreset');
      preset.value = 'custom';
      preset.dispatchEvent(new Event('change', { bubbles: true }));
      const template = document.querySelector('#filenameTemplate');
      template.value = '{updated_datetime}_更新_{title}';
      template.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await eventually(async () => cdp.eval(popupSession,
      `new Promise(resolve => chrome.storage.local.get('exportFilenameTemplate',
        data => resolve(data.exportFilenameTemplate === '{updated_datetime}_更新_{title}')))`),
    'custom precise update timestamp stored');
    await cdp.eval(pageSession, `document.querySelectorAll('.chatgpt-pro-row-export button')[1].click()`);
    await eventually(async () => fs.existsSync(path.join(downloadPath,
      `${fixtureDateTime}_更新_Offline acceptance test.json`)),
    'custom updated datetime export works');
    await cdp.eval(pageSession, `document.querySelector('[data-panel-view="search"]').click()`);
    await cdp.eval(pageSession, `(() => {
      const input = document.querySelector('.chatgpt-pro-fulltext-input');
      input.value = 's6 acceptance unique phrase';
      document.querySelector('.chatgpt-pro-fulltext-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }));
    })()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-search-results').textContent.includes('s6 acceptance unique phrase')`),
    'full-text query searched the actual worker index');
    assert.equal(requests.details, 1, 'searching the persisted index did not refetch JSON');

    // Input searches are debounced and still work while indexing is only
    // partial; a confirmed local-only result never fetches an online detail.
    await cdp.eval(pageSession, `(() => {
      const input = document.querySelector('.chatgpt-pro-fulltext-input');
      input.value = 'hello from controlled fixture';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-search-results').textContent.includes('hello from controlled fixture')`),
    'typing searches without explicit submit after debounce');
    assert.equal(requests.details, 1, 'debounced search does not call remote API');

    const markLocal = await cdp.eval(popupSession, `chrome.runtime.sendMessage({
      action: 'localDataMarkOfficialGone', accountId: 's6-isolated-account', id: '${CHAT_ID}'
    })`);
    assert(markLocal?.success && markLocal?.result?.marked, 'fixture is explicitly marked local-only in IDB');
    await cdp.eval(pageSession, `(() => {
      const input = document.querySelector('.chatgpt-pro-fulltext-input');
      input.value = 's6 acceptance unique phrase';
      document.querySelector('.chatgpt-pro-fulltext-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }));
    })()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-search-result-meta')?.textContent.includes('仅本地')`),
    'directory local-only transition invalidates cached search results');
    await cdp.eval(pageSession, `Array.from(document.querySelectorAll('.chatgpt-pro-search-result button'))
      .find(button => button.textContent.includes('本地完整预览')).click()`);
    await eventually(async () => cdp.eval(pageSession,
      `!document.querySelector('.chatgpt-pro-local-preview')?.hidden &&
       document.querySelector('.chatgpt-pro-local-preview')?.textContent.includes('s6 acceptance unique phrase')`),
    'confirmed local-only item offers complete raw JSON preview');
    assert.equal(requests.details, 1, 'local-only preview did not reach official conversation endpoint');

    await cdp.eval(pageSession, `document.querySelector('[data-panel-view="directory"]').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `Boolean(document.querySelector('.chatgpt-pro-row-checkbox'))`), 'directory item rendered');
    await cdp.eval(pageSession, `document.querySelector('.chatgpt-pro-row-checkbox').click()`);
    await cdp.eval(pageSession, `document.querySelector('[data-batch-format="json"]').click()`);
    await eventually(async () => fs.readdirSync(downloadPath).some(name => name.endsWith('.zip')),
      'real browser saved the cached JSON ZIP volume', 24000);
    assert.equal(requests.details, 1, 'ZIP export reused the indexed original JSON without extra details');
    const zipName = fs.readdirSync(downloadPath).find(name => name.endsWith('.zip'));
    const bytes = fs.readFileSync(path.join(downloadPath, zipName));
    assert.equal(bytes.readUInt32LE(0), 0x04034b50, 'real Chrome download is a valid ZIP container');
    assert(bytes.includes(Buffer.from('manifest.json')), 'downloaded volume contains manifest');

    // Seed complete JSON through the actual MV3 worker (not DOM mocks) to
    // exercise multiple browser downloads without 55 artificial API requests.
    const seed = await cdp.eval(popupSession, `(async () => {
      const accountId = 's6-isolated-account';
      const originals = Array.from({ length: 55 }, (_, index) => ({
        id: 's6-batch-' + index, title: 'S6 cached export ' + index,
        updateTime: 1770000000 + index + 5
      }));
      const directory = await chrome.runtime.sendMessage({ action: 'localDataUpsertDirectory',
        accountId, records: originals });
      if (!directory?.success) throw Error('directory seed failed: ' + directory?.error);
      for (const record of originals) {
        const reply = await chrome.runtime.sendMessage({ action: 'localDataPutConversation',
          accountId, record: { id: record.id, updateTime: record.updateTime,
            raw: { id: record.id, title: record.title, current_node: 'm', mapping: {
              m: { id: 'm', parent: null, children: [], message: {
                id: 'm', author: { role: 'user' }, content: {
                  content_type: 'text', parts: ['fully cached batch data']
                }, create_time: 1770000000
              } }
            } }
          }
        });
        if (!reply?.success) throw Error('raw seed failed: ' + reply?.error);
      }
      return originals.length;
    })()`);
    assert.equal(seed, 55, '55 complete cached JSON records seeded via real worker');

    // Force panel rerender after cache seeding. The original indexed fixture
    // plus these 55 rows should yield two independently downloaded ZIP parts.
    await cdp.eval(pageSession, `document.querySelector('[data-chatgpt-pro-launcher]').click()`);
    await cdp.eval(pageSession, `document.querySelector('[data-chatgpt-pro-launcher]').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('.chatgpt-pro-row-checkbox').length === 56`),
    'all locally cached conversations present in directory');
    await cdp.eval(pageSession, `document.querySelector('.chatgpt-pro-select-all input').click()`);
    await cdp.eval(pageSession, `document.querySelector('[data-batch-format="md"]').click()`);
    await eventually(async () => fs.readdirSync(downloadPath).filter(name => name.endsWith('.zip')).length >= 3,
      'both Markdown ZIP volumes downloaded independently', 24000);
    assert.equal(requests.details, 1, '56 cached records exported without further detail requests');
    const volumeFiles = fs.readdirSync(downloadPath).filter(name => name.endsWith('.zip'));
    const secondVolume = volumeFiles.find(name => name.includes('_MD_part002.zip'));
    assert(secondVolume, `second independent Markdown ZIP present: ${volumeFiles.join(', ')}`);
    const secondBytes = fs.readFileSync(path.join(downloadPath, secondVolume));
    const manifestLabel = Buffer.from('manifest.json');
    assert(secondBytes.includes(manifestLabel), 'second ZIP has manifest entry');
    assert(secondBytes.includes(Buffer.from('s6-batch-54')), 'second ZIP manifest covers final conversation');

    const projectSeed = await cdp.eval(popupSession, `chrome.runtime.sendMessage({
      action: 'localDataUpsertDirectory', accountId: 's6-isolated-account',
      records: [{ id: 'r8-project-conversation', title: 'R8 unique project fixture',
        createTime: 1770000200, updateTime: 1770000200,
        projectId: 'g-p-r8-project', projectName: 'R8 独立项目',
        href: '/g/g-p-r8-project/c/r8-project-conversation' }]
    })`);
    assert(projectSeed?.success, 'controlled project conversation added to local directory');
    await cdp.eval(pageSession, `document.querySelector('[data-chatgpt-pro-launcher]').click()`);
    await cdp.eval(pageSession, `document.querySelector('[data-chatgpt-pro-launcher]').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `Array.from(document.querySelector('.chatgpt-pro-project-filter').options)
        .some(option => option.value === 'g-p-r8-project' && option.textContent.includes('R8 独立项目'))`),
    'project filter includes cached project display name');
    await cdp.eval(pageSession, `(() => {
      const filter = document.querySelector('.chatgpt-pro-project-filter');
      filter.value = 'g-p-r8-project';
      filter.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    assert.equal(await cdp.eval(pageSession,
      `document.querySelectorAll('.chatgpt-pro-row').length`), 1,
    'project filter displays only the selected project record');
    assert.match(await cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-row-title').textContent`), /R8 unique project fixture/);
    await cdp.eval(pageSession, `(() => {
      const filter = document.querySelector('.chatgpt-pro-project-filter');
      filter.value = '__all__';
      filter.dispatchEvent(new Event('change', { bubbles: true }));
      const title = document.querySelector('.chatgpt-pro-title-filter-input');
      title.value = 'R8 unique';
      title.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    assert.equal(await cdp.eval(pageSession,
      `document.querySelectorAll('.chatgpt-pro-row').length`), 1,
    'title filter composes with project navigation');
    assert.equal(requests.details, 1, 'filtering cached directory never calls conversation detail API');
    assert(!browserErrors.some(Boolean), `Chrome runtime exceptions: ${browserErrors.join('; ')}`);
    console.log(`S6_EXTENSION_PASS: real MV3, timestamps, filename settings, single MD/JSON, project/title filter, cached index and two ZIP parts; requests=${JSON.stringify(requests)}`);
  } finally {
    chrome.kill('SIGTERM');
    await sleep(250);
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

main().catch(error => { console.error('S6_EXTENSION_FAIL:', error.message); process.exitCode = 1; });
