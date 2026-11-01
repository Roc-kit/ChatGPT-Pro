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
  `<div id="fallback-assistant-wrapper" style="display:none">` +
  `<div data-chatgpt-selection-message-id="fallback-assistant" data-message-author-role="assistant"><p>legacy assistant fixture</p></div>` +
  `<div class="turn-action-controls"><button type="button">Copy</button></div></div>` +
  `</main></body></html>`;
const CHAT = { id: CHAT_ID, title: 'Offline acceptance test', update_time: 1770000000,
  current_node: 'answer', mapping: {
    root: { id: 'root', parent: null, children: ['question'], message: null },
    question: { id: 'question', parent: 'root', children: ['answer'],
      message: { id: 'question', author: { role: 'user' }, content: { content_type: 'text', parts: ['s6 acceptance unique phrase'] }, create_time: 1770000000 } },
    answer: { id: 'answer', parent: 'question', children: [],
      message: { id: 'answer', author: { role: 'assistant' }, content: { content_type: 'text', parts: ['hello from controlled fixture'] }, create_time: 1770000001 } },
    'fallback-assistant': { id: 'fallback-assistant', parent: 'answer', children: [],
      message: { id: 'fallback-assistant', author: { role: 'assistant' },
        content: { content_type: 'text', parts: ['legacy assistant fixture'] }, create_time: 1770000002 } }
  }
};
let detailResponse = CHAT;
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
    if (reply.exceptionDetails) throw Error(reply.exceptionDetails.exception?.description
      || reply.exceptionDetails.text || 'Page exception');
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
      response = detailResponse;
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
    const collapsedLayout = await cdp.eval(popupSession, `(() => {
      const advanced = document.querySelector('#advancedSettings');
      const manager = document.querySelector('#taskManager');
      return { advancedOpen: advanced.open, managerOpen: manager.open,
        exportVisible: document.querySelector('#filenamePreset').checkVisibility(),
        togglePresent: !!advanced.querySelector('#toggle'),
        taskPresent: !!manager.querySelector('#taskList') };
    })()`);
    assert.deepEqual(collapsedLayout, { advancedOpen: false, managerOpen: false,
      exportVisible: false, togglePresent: true, taskPresent: true },
    'compact Popup keeps advanced settings and tasks in separate collapsed sections');
    await cdp.eval(popupSession, `document.querySelector('#advancedSettings summary').click()`);
    assert.equal(await cdp.eval(popupSession,
      `document.querySelector('#advancedSettings').open && document.querySelector('#filenamePreset').getClientRects().length > 0`),
      true, 'advanced disclosure reveals export naming and behavior controls');
    await cdp.eval(popupSession, `document.querySelector('#advancedSettings summary').click()`);
    await cdp.eval(popupSession, `document.querySelector('#taskManager summary').click()`);
    const indexControls = await cdp.eval(popupSession, `(() => ({
      managerOpen: document.querySelector('#taskManager').open,
      internalRefreshHidden: !document.querySelector('#taskRefresh').checkVisibility(),
      autoIndexVisible: document.querySelector('#autoIndexToggle').checkVisibility(),
      clearIndexVisible: document.querySelector('#clearIndex').checkVisibility(),
      clearRawVisible: document.querySelector('#clearRaw').checkVisibility()
    }))()`);
    assert.deepEqual(indexControls, { managerOpen: true, internalRefreshHidden: true,
      autoIndexVisible: true, clearIndexVisible: true, clearRawVisible: true },
    'index disclosure hides internal task actions but retains visible cache and index controls');
    if (process.argv.includes('--popup-layout-only')) {
      await cdp.eval(popupSession, `(() => {
        const select = document.querySelector('#languageSelect');
        select.value = 'en'; select.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
      await eventually(async () => cdp.eval(popupSession,
        `document.querySelector('#advancedSettings .summary-copy strong').textContent === 'Advanced settings'`),
      'new advanced settings heading translates to English');
      assert.equal(await cdp.eval(popupSession,
        `document.querySelector('.section .label').textContent`), 'Local data');
      assert.equal(await cdp.eval(popupSession,
        `document.querySelector('#advancedSettings .summary-hint').textContent`),
        'Background tabs, panel behavior, export filenames');
      assert.equal(await cdp.eval(popupSession, `document.querySelector('#size').disabled`), false,
        'timestamp size remains editable independently of timestamp toggles');
      await cdp.eval(popupSession, `(() => {
        const select = document.querySelector('#languageSelect');
        select.value = 'ja'; select.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
      await eventually(async () => cdp.eval(popupSession,
        `document.querySelector('#advancedSettings .summary-copy strong').textContent === '詳細設定'`),
      'Japanese Popup renders model-reviewed advanced settings text');
      assert.equal(await cdp.eval(popupSession,
        `document.querySelector('.section .label').textContent`), 'ローカルデータ');
      await cdp.eval(popupSession, `(() => {
        const select = document.querySelector('#languageSelect');
        select.value = 'ar'; select.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
      await eventually(async () => cdp.eval(popupSession,
        `document.querySelector('#advancedSettings .summary-copy strong').textContent === 'الإعدادات المتقدمة'`),
      'Arabic Popup renders model-reviewed advanced settings text');
      assert.equal(await cdp.eval(popupSession, `document.documentElement.dir`), 'rtl',
        'Arabic uses RTL layout after language switch');
      console.log('POPUP_LAYOUT_PASS: compact defaults, collapsible advanced/index sections, English/Japanese/Arabic labels, numeric timestamp control');
      return;
    }
    // Keep the real ChatGPT fixture as the active tab while inspecting the
    // extension Popup via CDP. This is equivalent to opening its toolbar Popup.
    await cdp.send('Target.activateTarget', { targetId: fixtureTarget });
    await cdp.eval(popupSession, "document.querySelector('#taskRefresh').click()");
    await eventually(async () => cdp.eval(popupSession,
      `document.querySelector('#indexStartArea').hidden === false`),
    'popup received real content-script task dashboard');
    // Even a short chat with two rendered messages has a minimap when enabled.
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('.chatgpt-pro-minimap-marker').length === 2`),
    'minimap visible without requiring eight messages');
    const minimapSize = await cdp.eval(pageSession, `(() => {
      const el = document.querySelector('.chatgpt-pro-minimap');
      return { height: el.getBoundingClientRect().height,
        width: el.getBoundingClientRect().width,
        rail: el.querySelector('.chatgpt-pro-minimap-rail').getBoundingClientRect().height,
        viewport: innerHeight, viewportWidth: innerWidth };
    })()`);
    assert(minimapSize.height >= minimapSize.viewport * 0.58,
      'minimap occupies the available height above the movable export actions');
    assert(minimapSize.width >= 24 && minimapSize.rail > minimapSize.height * 0.85,
      'minimap shares a compact, continuous toolbar with the export actions');
    assert.equal(await cdp.eval(popupSession,
      `document.querySelector('#minimapToggle').getAttribute('aria-checked')`), 'true');
    await cdp.eval(popupSession, `document.querySelector('#minimapToggle').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `!document.querySelector('[data-chatgpt-pro-minimap]')`), 'minimap switch hides navigation');
    await cdp.eval(popupSession, `document.querySelector('#minimapToggle').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('.chatgpt-pro-minimap-marker').length === 2`),
    'minimap switch immediately restores navigation');
    await cdp.eval(pageSession, `(() => {
      const main = document.querySelector('main');
      const answer = document.querySelector('[data-message-id="answer"]');
      const lastMarker = document.querySelector('.chatgpt-pro-minimap-last');
      answer.style.minHeight = '1500px';
      window.__manualScrollTargetCalls = 0;
      const nativeScrollIntoView = answer.scrollIntoView.bind(answer);
      answer.scrollIntoView = (...args) => {
        window.__manualScrollTargetCalls++;
        return nativeScrollIntoView(...args);
      };
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' });
      answer.remove();
      lastMarker.click();
      document.dispatchEvent(new WheelEvent('wheel', { deltaY: -200, bubbles: true }));
      window.scrollTo({ top: Math.max(100, document.documentElement.scrollHeight * 0.45), behavior: 'auto' });
      window.__manualScrollPosition = window.scrollY;
      window.setTimeout(() => main.append(answer), 500);
    })()`);
    await sleep(900);
    assert.equal(await cdp.eval(pageSession, 'window.__manualScrollTargetCalls'), 0,
    'manual wheel navigation cancels a pending minimap jump instead of snapping back when its target mounts');
    await cdp.eval(pageSession, `(() => {
      delete window.__manualScrollPosition;
      delete window.__manualScrollTargetCalls;
      document.querySelector('[data-message-id="answer"]').style.minHeight = '';
      window.scrollTo({ top: 0, behavior: 'auto' });
    })()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('.chatgpt-pro-minimap-marker').length === 2`),
    'minimap restored after manual-scroll cancellation test');
    await cdp.eval(pageSession, `(() => {
      const answer = document.querySelector('[data-message-id="answer"]');
      answer.style.minHeight = '1500px';
      document.querySelector('.chatgpt-pro-minimap-assistant').click();
    })()`);
    await eventually(async () => cdp.eval(pageSession, `(() => {
      const top = document.querySelector('[data-message-id="answer"]').getBoundingClientRect().top;
      const preferred = Math.max(64, Math.min(150, innerHeight * 0.22));
      return Math.abs(top - preferred) <= 12;
    })()`), 'minimap navigation places the start of a long assistant reply in the upper viewport');
    await cdp.eval(pageSession, `(() => {
      document.querySelector('[data-message-id="answer"]').style.minHeight = '';
      window.scrollTo({ top: 0, behavior: 'auto' });
    })()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('.chatgpt-pro-minimap-marker').length === 2`),
    'minimap ready for delayed last-message test');
    await cdp.eval(pageSession, `(() => {
      const main = document.querySelector('main');
      const question = document.querySelector('[data-message-id="question"]');
      const answer = document.querySelector('[data-message-id="answer"]');
      const lastMarker = [...document.querySelectorAll('.chatgpt-pro-minimap-marker')].at(-1);
      question.style.minHeight = '1500px';
      answer.style.minHeight = '1500px';
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' });
      answer.remove();
      lastMarker.click();
      window.setTimeout(() => main.append(answer), 5000);
    })()`);
    await eventually(async () => cdp.eval(pageSession,
      `(() => { const target = document.querySelector('[data-message-id="answer"]');
        const anchor = target?.closest('[data-chatgpt-search-unit-key], [data-content-search-unit-key], [data-turn-key], section[data-turn-id]') || target;
        const preferred = Math.max(64, Math.min(150, innerHeight * 0.22));
        return Boolean(anchor && Math.abs(anchor.getBoundingClientRect().top - preferred) <= 12); })()`),
    'clicking an unloaded last message keeps retrying through a 5-second delay and aligns it automatically', 15000);
    await cdp.eval(pageSession, `(() => {
      document.querySelector('[data-message-id="question"]').style.minHeight = '';
      document.querySelector('[data-message-id="answer"]').style.minHeight = '';
      window.scrollTo({ top: 0, behavior: 'auto' });
    })()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('.chatgpt-pro-minimap-marker').length === 2`),
    'minimap restored after delayed last-message load');
    await cdp.eval(pageSession, `(() => {
      const main = document.querySelector('main');
      const question = document.querySelector('[data-message-id="question"]');
      const next = question.nextSibling;
      question.removeAttribute('data-message-id');
      question.setAttribute('data-chatgpt-search-message-ids', 'question');
      const firstMarker = document.querySelector('.chatgpt-pro-minimap-marker');
      window.__minimapEdgePreloadScrollEvents = 0;
      window.__minimapEdgePreloadScrollListener = () => {
        if (!document.querySelector('[data-chatgpt-search-message-ids="question"]')) {
          window.__minimapEdgePreloadScrollEvents++;
        }
      };
      window.addEventListener('scroll', window.__minimapEdgePreloadScrollListener, true);
      document.querySelector('[data-message-id="answer"]').style.minHeight = '1500px';
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' });
      question.remove();
      firstMarker.click();
      window.setTimeout(() => {
        main.insertBefore(question, next);
      }, 5000);
    })()`);
    await eventually(async () => cdp.eval(pageSession,
      `(() => { const target = document.querySelector('[data-chatgpt-search-message-ids="question"]');
        const anchor = target?.closest('[data-chatgpt-search-unit-key], [data-content-search-unit-key], [data-turn-key], section[data-turn-id]') || target;
        const preferred = Math.max(64, Math.min(150, innerHeight * 0.22));
        return Boolean(anchor && Math.abs(anchor.getBoundingClientRect().top - preferred) <= 12); })()`),
    'clicking an unloaded first message stops retrying as soon as its modern search-ID target loads', 15000);
    const delayedFirstScrollCalls = await cdp.eval(pageSession, `(() => {
      const count = window.__minimapEdgePreloadScrollEvents;
      window.removeEventListener('scroll', window.__minimapEdgePreloadScrollListener, true);
      delete window.__minimapEdgePreloadScrollListener;
      delete window.__minimapEdgePreloadScrollEvents;
      return count;
    })()`);
    assert(delayedFirstScrollCalls <= 2,
      'first-message navigation waits for delayed DOM growth instead of repeatedly nudging the scroll boundary');
    await cdp.eval(pageSession, `(() => {
      const question = document.querySelector('[data-chatgpt-search-message-ids="question"]');
      question.removeAttribute('data-chatgpt-search-message-ids');
      question.setAttribute('data-message-id', 'question');
      document.querySelector('[data-message-id="answer"]').style.minHeight = '';
      window.scrollTo({ top: 0, behavior: 'auto' });
    })()`);
    await cdp.eval(pageSession, `(() => {
      const main = document.querySelector('main');
      main.querySelectorAll('[data-message-id]').forEach(node => node.remove());
      const fragment = document.createDocumentFragment();
      for (let turn = 1; turn <= 6; turn++) {
        const user = document.createElement('section');
        user.setAttribute('data-message-id', 'logical-user-' + turn);
        user.setAttribute('data-message-author-role', 'user');
        user.setAttribute('data-minimap-logical-test', '1');
        user.textContent = 'User message ' + turn;
        fragment.append(user);
        for (let part = 1; part <= 3; part++) {
          const assistant = document.createElement('section');
          assistant.setAttribute('data-message-id', 'logical-assistant-' + turn + '-' + part);
          assistant.setAttribute('data-message-author-role', 'assistant');
          assistant.setAttribute('data-minimap-logical-test', '1');
          assistant.textContent = part === 3
            ? 'Final assistant reply ' + turn
            : 'Intermediate assistant part ' + turn + '-' + part;
          fragment.append(assistant);
        }
      }
      main.append(fragment);
    })()`);
    await eventually(async () => cdp.eval(pageSession, `(() => {
      const markers = [...document.querySelectorAll('.chatgpt-pro-minimap-marker')];
      return markers.length === 12 && markers[0]?.title.startsWith('1/12') &&
        markers.at(-1)?.title.startsWith('12/12');
    })()`), 'six user messages and six multi-part assistant replies are grouped into 12 logical entries');
    const logicalCounts = await cdp.eval(pageSession, `(() => {
      const markers = [...document.querySelectorAll('.chatgpt-pro-minimap-marker')];
      return { total: markers.length,
        users: markers.filter(marker => marker.classList.contains('chatgpt-pro-minimap-user')).length,
        assistants: markers.filter(marker => marker.classList.contains('chatgpt-pro-minimap-assistant')).length,
        assistantTitle: markers[1]?.title };
    })()`);
    assert.deepEqual(logicalCounts, {
      total: 12, users: 6, assistants: 6, assistantTitle: '2/12 · ChatGPT'
    }, 'minimap counts one assistant reply even when its DOM is split into multiple parts');
    await cdp.eval(pageSession, `(() => {
      document.querySelector('[data-message-id="logical-assistant-1-1"]').style.minHeight = '1500px';
      document.querySelectorAll('.chatgpt-pro-minimap-marker')[1].click();
    })()`);
    await eventually(async () => cdp.eval(pageSession, `(() => {
      const top = document.querySelector('[data-message-id="logical-assistant-1-1"]').getBoundingClientRect().top;
      const preferred = Math.max(64, Math.min(150, innerHeight * 0.22));
      return Math.abs(top - preferred) <= 12;
    })()`), 'grouped assistant navigation aligns the first part of a long reply in the upper viewport');
    await cdp.eval(pageSession,
      `document.querySelector('[data-message-id="logical-assistant-1-1"]').style.minHeight = '';`);
    await cdp.eval(pageSession,
      `document.querySelectorAll('.chatgpt-pro-minimap-marker')[1].dispatchEvent(new Event('pointerenter'))`);
    assert.equal(await cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-minimap-preview-text').textContent`),
    'Final assistant reply 1', 'grouped assistant preview uses the final reply, not an intermediate chunk');
    await cdp.eval(pageSession, `document.querySelectorAll('[data-minimap-logical-test]').forEach(node => node.remove());
      const main = document.querySelector('main');
      const question = document.createElement('section');
      question.setAttribute('data-message-id', 'question');
      question.setAttribute('data-message-author-role', 'user');
      question.textContent = 's6 acceptance unique phrase';
      const answer = document.createElement('section');
      answer.setAttribute('data-message-id', 'answer');
      answer.setAttribute('data-message-author-role', 'assistant');
      answer.textContent = 'hello from controlled fixture';
      main.append(question, answer);`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('.chatgpt-pro-minimap-marker').length === 2`),
    'short fixture restored after logical-turn grouping test');
    await cdp.eval(pageSession, `(() => {
      const main = document.querySelector('main');
      for (let index = 0; index < 120; index++) {
        const section = document.createElement('section');
        section.setAttribute('data-message-id', 'minimap-test-' + index);
        section.setAttribute('data-message-author-role', index % 2 ? 'assistant' : 'user');
        section.setAttribute('data-minimap-test', '1');
        section.textContent = 'Message number ' + index;
        main.append(section);
      }
    })()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('.chatgpt-pro-minimap-marker').length >= 20`),
    'long conversation renders a bounded navigation window');
    const minimapAnchors = await cdp.eval(pageSession, `(() => {
      const markers = [...document.querySelectorAll('.chatgpt-pro-minimap-marker')];
      return { count: markers.length, first: markers[0].title,
        last: markers.at(-1).title, top: document.querySelector('.chatgpt-pro-minimap').getBoundingClientRect().top };
    })()`);
    assert(minimapAnchors.count <= 49 && minimapAnchors.first.startsWith('1/122') &&
      minimapAnchors.last.startsWith('122/122'), 'first and last chat messages remain pinned on a long rail');
    const delayedMiddleTarget = await cdp.eval(pageSession, `(() => {
      const main = document.querySelector('main');
      const nodes = [...document.querySelectorAll('[data-minimap-test]')];
      const markers = [...document.querySelectorAll('.chatgpt-pro-minimap-marker')];
      const marker = markers[Math.floor(markers.length / 2)];
      const expectedId = marker.dataset.chatgptProMinimapMessageId;
      const targetIndex = nodes.findIndex(node => node.getAttribute('data-message-id') === expectedId);
      if (targetIndex < 0) throw Error('middle marker must identify its exact message ID');
      const from = Math.max(0, targetIndex - 5);
      const removed = nodes.slice(from, Math.min(nodes.length, targetIndex + 6));
      const anchor = removed.at(-1).nextSibling;
      const parent = removed[0].parentNode;
      window.__middleJumpPreloadScrollEvents = 0;
      window.__middleJumpPreloadScrollListener = () => {
        if (!document.querySelector('[data-message-id="' + expectedId + '"]')) {
          window.__middleJumpPreloadScrollEvents++;
        }
      };
      window.addEventListener('scroll', window.__middleJumpPreloadScrollListener, true);
      removed.forEach(node => node.remove());
      marker.click();
      window.setTimeout(() => {
        const fragment = document.createDocumentFragment();
        removed.forEach(node => fragment.append(node));
        parent.insertBefore(fragment, anchor);
      }, 5000);
      return { expectedId, targetIndex };
    })()`);
    await eventually(async () => cdp.eval(pageSession, `(() => {
      const target = document.querySelector('[data-message-id="${delayedMiddleTarget.expectedId}"]');
      const preferred = Math.max(64, Math.min(150, innerHeight * 0.22));
      return Boolean(target && Math.abs(target.getBoundingClientRect().top - preferred) <= 12);
    })()`), 'middle-message navigation waits for delayed content instead of repeatedly scrolling', 15000);
    const middleFallbackScrolls = await cdp.eval(pageSession, `(() => {
      const count = window.__middleJumpPreloadScrollEvents;
      window.removeEventListener('scroll', window.__middleJumpPreloadScrollListener, true);
      delete window.__middleJumpPreloadScrollListener;
      delete window.__middleJumpPreloadScrollEvents;
      return count;
    })()`);
    assert(middleFallbackScrolls <= 4,
      'middle-message navigation uses the scroll fallback only when content does not load');
    const beforeMiddleJump = await cdp.eval(pageSession, `(() => {
      const nodes = [...document.querySelectorAll('[data-minimap-test]')];
      nodes[0].textContent = Array.from({ length: nodes.length }, (_, index) => 'Message number ' + index).join(' ');
      const markers = [...document.querySelectorAll('.chatgpt-pro-minimap-marker')];
      const marker = markers[Math.floor(markers.length / 2)];
      const expectedId = marker.dataset.chatgptProMinimapMessageId;
      const targetIndex = nodes.findIndex(node => node.getAttribute('data-message-id') === expectedId);
      if (targetIndex < 0) throw Error('middle marker must identify its exact message ID');
      const scroller = (() => {
        for (let element = nodes[0].parentElement; element && element !== document.body; element = element.parentElement) {
          const style = getComputedStyle(element);
          if (/(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight) return element;
        }
        return document.scrollingElement;
      })();
      const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      if (max < 100) throw Error('fixture must have a scrollable conversation');
      scroller.scrollTo({ top: max * 0.4, behavior: 'auto' });
      const before = scroller === document.scrollingElement ? window.scrollY : scroller.scrollTop;
      nodes[targetIndex].setAttribute('data-message-id', 'minimap-missing-target');
      marker.click();
      return { before, targetIndex, expectedId, isDocument: scroller === document.scrollingElement };
    })()`);
    await sleep(250);
    const firstMessageTopAfterMiddleJump = await cdp.eval(pageSession, `(() => {
      const nodes = [...document.querySelectorAll('[data-minimap-test]')];
      return nodes[0].getBoundingClientRect().top;
    })()`);
    const firstMessagePreferredTop = await cdp.eval(pageSession,
      'Math.max(64, Math.min(150, innerHeight * 0.22))');
    assert(Math.abs(firstMessageTopAfterMiddleJump - firstMessagePreferredTop) > 100,
      'middle-message navigation never falls back to a first message with matching preview text');
    await cdp.eval(pageSession, `(() => {
      const nodes = [...document.querySelectorAll('[data-minimap-test]')];
      nodes[${beforeMiddleJump.targetIndex}].setAttribute('data-message-id', ${JSON.stringify(beforeMiddleJump.expectedId)});
      nodes.forEach((node, index) => { if (index > 0) node.textContent = 'Message number ' + index; });
      nodes[0].textContent = 'Message number 0';
    })()`);
    await eventually(async () => cdp.eval(pageSession, `(() => {
      const target = document.querySelector('[data-message-id="${beforeMiddleJump.expectedId}"]');
      const preferred = Math.max(64, Math.min(150, innerHeight * 0.22));
      return Boolean(target && Math.abs(target.getBoundingClientRect().top - preferred) <= 12);
    })()`), 'middle-message navigation resolves when its exact ID returns to the DOM', 5000);
    await cdp.eval(pageSession, 'window.scrollTo({ top: 0, behavior: "auto" })');
    await cdp.eval(pageSession, `document.querySelector('.chatgpt-pro-minimap-first').dispatchEvent(new Event('pointerenter'))`);
    assert.equal(await cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-minimap-preview').hidden`), false,
    'message navigation offers hover preview');
    assert.equal(await cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-minimap-toggle') === null`), true,
    'minimap has no redundant in-page collapse control');
    const beforeDrag = await cdp.eval(pageSession, `(() => {
      const dock = document.querySelector('[data-chatgpt-pro-tool-dock]');
      const dockRect = dock.getBoundingClientRect();
      const panel = dock.querySelector('.chatgpt-pro-minimap');
      const actions = dock.querySelector('[data-chatgpt-pro-tool-actions]');
      const exportButton = actions.querySelector('[data-chatgpt-pro-current-export]');
      const autoButton = actions.querySelector('[data-chatgpt-pro-auto-continue]');
      const first = panel.querySelector('.chatgpt-pro-minimap-first');
      return { actionTop: actions.getBoundingClientRect().top,
        dockTop: dockRect.top, dockBottom: dockRect.bottom,
        dockCenter: (dockRect.top + dockRect.bottom) / 2,
        dockRadius: parseFloat(getComputedStyle(dock).borderTopLeftRadius),
        exportCursor: getComputedStyle(exportButton).cursor,
        autoCursor: getComputedStyle(autoButton).cursor,
        exportWidth: exportButton.getBoundingClientRect().width,
        autoWidth: autoButton.getBoundingClientRect().width,
        exportHeight: exportButton.getBoundingClientRect().height,
        autoHeight: autoButton.getBoundingClientRect().height,
        actionWidth: actions.getBoundingClientRect().width,
        panelHeight: panel.getBoundingClientRect().height,
        dockHeight: dock.getBoundingClientRect().height,
        firstHitHeight: first.getBoundingClientRect().height,
        firstMarkHeight: parseFloat(getComputedStyle(first, '::before').height),
        actionsCount: actions.querySelectorAll(':scope > button:not([hidden])').length,
        autoHidden: autoButton.hidden };
    })()`);
    assert(beforeDrag.firstHitHeight >= 9 && beforeDrag.firstMarkHeight >= 9,
      'first and last minimap messages have enlarged visible marks and click targets');
    assert(Math.abs(beforeDrag.dockCenter - minimapSize.viewport / 2) <= 2,
      'outer toolbar is vertically centered in the viewport');
    assert(beforeDrag.dockRadius >= 12, 'outer toolbar uses a rounded rectangle');
    assert.equal(beforeDrag.exportCursor, 'pointer', 'export icons use the pointer cursor when hovered');
    assert.equal(beforeDrag.autoCursor, 'pointer', 'auto continuation control uses the pointer cursor');
    assert.equal(beforeDrag.autoHidden, true, 'auto continuation control stays hidden until enabled');
    assert.equal(beforeDrag.exportWidth, beforeDrag.actionWidth,
      'export buttons fill the same available toolbar width without overflowing');
    assert.equal(beforeDrag.actionsCount, 1, 'downloads share one compact movable toolbar action');
    const mergedLauncherLayout = await cdp.eval(pageSession, `(() => {
      const dock = document.querySelector('[data-chatgpt-pro-tool-dock]');
      const launcher = document.querySelector('[data-chatgpt-pro-launcher]');
      const outer = dock.getBoundingClientRect();
      const button = launcher.getBoundingClientRect();
      const panel = dock.querySelector('[data-chatgpt-pro-minimap]').getBoundingClientRect();
      return { inDock: launcher.parentElement === dock,
        className: launcher.className,
        centerX: button.left + button.width / 2,
        centerY: button.top + button.height / 2,
        dockLeft: outer.left, dockTop: outer.top, dockWidth: outer.width,
        buttonWidth: button.width, buttonHeight: button.height,
        buttonRadius: parseFloat(getComputedStyle(launcher).borderTopLeftRadius),
        panelTop: panel.top, buttonBottom: button.bottom };
    })()`);
    assert(mergedLauncherLayout.inDock && mergedLauncherLayout.className.includes('chatgpt-pro-dock-launcher'),
      'directory/search launcher is mounted inside the minimap dock');
    assert(Math.abs(mergedLauncherLayout.centerX -
      (mergedLauncherLayout.dockLeft + mergedLauncherLayout.dockWidth / 2)) <= 1 &&
      Math.abs(mergedLauncherLayout.centerY - mergedLauncherLayout.dockTop) <= 1 &&
      mergedLauncherLayout.panelTop >= mergedLauncherLayout.buttonBottom - 1 &&
      mergedLauncherLayout.buttonWidth === mergedLauncherLayout.buttonHeight &&
      mergedLauncherLayout.buttonRadius >= 10 && mergedLauncherLayout.buttonRadius <= 14,
    `directory launcher overlaps the minimap top edge as a matching rounded-rectangle control: ${JSON.stringify(mergedLauncherLayout)}`);

    const horizontalDragPoint = await cdp.eval(pageSession, `(() => {
      const launcher = document.querySelector('[data-chatgpt-pro-launcher]');
      const dock = document.querySelector('[data-chatgpt-pro-tool-dock]');
      const button = launcher.getBoundingClientRect();
      return { x: button.left + button.width / 2, y: button.top + button.height / 2,
        dockLeft: dock.getBoundingClientRect().left };
    })()`);
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mousePressed', x: horizontalDragPoint.x, y: horizontalDragPoint.y,
      button: 'left', clickCount: 1
    }, pageSession);
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved', x: horizontalDragPoint.x - 120, y: horizontalDragPoint.y,
      button: 'left', buttons: 1
    }, pageSession);
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased', x: horizontalDragPoint.x - 120, y: horizontalDragPoint.y,
      button: 'left'
    }, pageSession);
    const movedDock = await cdp.eval(pageSession, `(() => {
      const dock = document.querySelector('[data-chatgpt-pro-tool-dock]');
      const launcher = document.querySelector('[data-chatgpt-pro-launcher]').getBoundingClientRect();
      const outer = dock.getBoundingClientRect();
      return { left: outer.left, right: outer.right, width: outer.width,
        launcherCenterX: launcher.left + launcher.width / 2,
        dockCenterX: outer.left + outer.width / 2 };
    })()`);
    assert(movedDock.left < horizontalDragPoint.dockLeft - 100 && movedDock.left >= 0 &&
      movedDock.right <= minimapSize.viewportWidth &&
      Math.abs(movedDock.launcherCenterX - movedDock.dockCenterX) <= 1,
    `dragging the directory launcher moves the entire dock horizontally within the viewport: ${JSON.stringify(movedDock)}`);
    const persistedDockX = await cdp.eval(popupSession, `new Promise(resolve =>
      chrome.storage.local.get('toolDockPositionX', data => resolve(data.toolDockPositionX)))`);
    assert(Number.isFinite(persistedDockX) && persistedDockX < 1,
      `horizontal dock position is persisted independently: ${persistedDockX}`);
    const dragPoint = await cdp.eval(pageSession, `(() => {
      const button = document.querySelector('[data-chatgpt-pro-current-export]');
      const r = button.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`);
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mousePressed', x: dragPoint.x, y: dragPoint.y, button: 'left', clickCount: 1
    }, pageSession);
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved', x: dragPoint.x, y: dragPoint.y - 140, button: 'left', buttons: 1
    }, pageSession);
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased', x: dragPoint.x, y: dragPoint.y - 140, button: 'left'
    }, pageSession);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelector('[data-chatgpt-pro-tool-actions]').getBoundingClientRect().top < ${beforeDrag.actionTop - 100}`),
    'export actions can be moved upward to avoid covering page content');
    const afterDrag = await cdp.eval(pageSession, `(() => {
      const dock = document.querySelector('[data-chatgpt-pro-tool-dock]');
      const rect = dock.getBoundingClientRect();
      return { actionTop: dock.querySelector('[data-chatgpt-pro-tool-actions]').getBoundingClientRect().top,
        dockTop: rect.top, dockBottom: rect.bottom, dockCenter: (rect.top + rect.bottom) / 2,
        panelHeight: dock.querySelector('.chatgpt-pro-minimap').getBoundingClientRect().height,
        dockHeight: dock.getBoundingClientRect().height };
    })()`);
    assert(afterDrag.panelHeight < beforeDrag.panelHeight - 100 &&
      afterDrag.dockHeight < beforeDrag.dockHeight - 100,
    `moving export actions upward automatically shortens minimap and dock: before=${JSON.stringify(beforeDrag)}, after=${JSON.stringify(afterDrag)}`);
    assert(Math.abs(afterDrag.dockCenter - minimapSize.viewport / 2) <= 2,
      'outer toolbar stays vertically centered as its height shrinks');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 640, height: 600, deviceScaleFactor: 1, mobile: false
    }, pageSession);
    await eventually(async () => cdp.eval(pageSession,
      `innerWidth === 640 && innerHeight === 600 && (() => {
        const rect = document.querySelector('[data-chatgpt-pro-tool-dock]').getBoundingClientRect();
        return Math.abs((rect.top + rect.bottom) / 2 - innerHeight / 2) <= 2;
      })()`), 'narrow viewport applied and toolbar recentered');
    const narrowLayout = await cdp.eval(pageSession, `(() => {
      const dock = document.querySelector('[data-chatgpt-pro-tool-dock]');
      const panel = dock.querySelector('.chatgpt-pro-minimap').getBoundingClientRect();
      const actions = dock.querySelector('[data-chatgpt-pro-tool-actions]').getBoundingClientRect();
      const outer = dock.getBoundingClientRect();
      return { width: innerWidth, height: innerHeight, left: outer.left, right: outer.right,
        dockHeight: outer.height, panelBottom: panel.bottom, actionsTop: actions.top,
        actionsBottom: actions.bottom, dockCenter: (outer.top + outer.bottom) / 2 };
    })()`);
    assert(narrowLayout.left >= 0 && narrowLayout.right <= narrowLayout.width &&
      narrowLayout.actionsBottom <= narrowLayout.height &&
      narrowLayout.panelBottom <= narrowLayout.actionsTop + 1 &&
      narrowLayout.dockHeight < narrowLayout.height &&
      Math.abs(narrowLayout.dockCenter - narrowLayout.height / 2) <= 2,
    `narrow viewport keeps the movable dock inside the viewport without overlap: ${JSON.stringify(narrowLayout)}`);
    await cdp.send('Emulation.clearDeviceMetricsOverride', {}, pageSession);
    await eventually(async () => cdp.eval(pageSession,
      `innerWidth === ${minimapSize.viewportWidth} && innerHeight === ${minimapSize.viewport}`),
    'original viewport restored');
    await cdp.eval(pageSession, `document.querySelectorAll('[data-minimap-test]').forEach(item => item.remove())`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('.chatgpt-pro-minimap-marker').length === 2`),
    'minimap restores compact message count after DOM changes');
    if (process.argv.includes('--minimap-only')) {
      console.log('MINIMAP_PASS: bounded window, pinned and clickable first/last, hover preview, draggable auto-shrinking dock');
      return;
    }
    // Hover tooltips are not in the Popup's DOM, and dynamic updates must
    // still be translated after switching locale.
    await cdp.eval(popupSession, `(() => {
      const select = document.querySelector('#languageSelect');
      select.value = 'en'; select.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await cdp.eval(pageSession,
      `document.querySelector('[data-chatgpt-pro-current-export]').click()`);
    await eventually(async () => cdp.eval(pageSession, `(() => {
      const buttons = [...document.querySelectorAll('[data-chatgpt-pro-download-popover] button')];
      const popover = document.querySelector('[data-chatgpt-pro-download-popover]');
      const trigger = document.querySelector('[data-chatgpt-pro-current-export]');
      const style = getComputedStyle(popover);
      const triggerRect = trigger.getBoundingClientRect();
      const triggerRadius = parseFloat(getComputedStyle(trigger).borderTopLeftRadius);
      const centers = buttons.map(button => {
        const rect = button.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2,
          radius: parseFloat(getComputedStyle(button).borderTopLeftRadius),
          width: rect.width, height: rect.height };
      });
      const triggerCenter = { x: triggerRect.left + triggerRect.width / 2,
        y: triggerRect.top + triggerRect.height / 2 };
      const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      const mainRadius = Math.min(triggerRect.width, triggerRect.height) / 2;
      const childRadius = centers[0]?.width / 2;
      const expectedDistance = mainRadius + childRadius + 4;
      return buttons.length === 2 && buttons[0].title === 'Export entire chat (Markdown)' &&
        buttons[1].title === 'Download all conversation images (ZIP)' &&
        buttons.every(button => button.querySelector('svg')) &&
        triggerRadius >= triggerRect.width / 2 - 1 &&
        centers.every(point => Math.abs(point.width - point.height) <= 1 && point.radius >= point.width / 2 - 1) &&
        centers.every(point => point.width < triggerRect.width) &&
        Math.abs(distance(centers[0], triggerCenter) - expectedDistance) <= 1 &&
        Math.abs(distance(centers[1], triggerCenter) - expectedDistance) <= 1 &&
        Math.abs(distance(centers[0], centers[1]) - expectedDistance) <= 1 &&
        Math.abs(centers[0].y - triggerCenter.y) <= 1 &&
        centers[0].x < triggerCenter.x && centers[1].x < triggerCenter.x &&
        centers[1].y > triggerCenter.y &&
        Math.abs(centers[1].x - (centers[0].x + triggerCenter.x) / 2) <= 1 &&
        style.backgroundColor === 'rgba(0, 0, 0, 0)' && style.borderTopWidth === '0px' &&
        style.boxShadow === 'none' && style.pointerEvents === 'none' &&
        popover.getBoundingClientRect().width === 0 && popover.getBoundingClientRect().height === 0;
    })()`), 'combined download menu exposes both translated actions');
    const lowerDragPoint = await cdp.eval(pageSession, `(() => {
      const rect = document.querySelector('[data-chatgpt-pro-current-export]').getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, viewportHeight: innerHeight };
    })()`);
    const lowerDragY = lowerDragPoint.viewportHeight - 2;
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mousePressed', x: lowerDragPoint.x, y: lowerDragPoint.y, button: 'left', clickCount: 1
    }, pageSession);
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved', x: lowerDragPoint.x, y: lowerDragY, button: 'left', buttons: 1
    }, pageSession);
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased', x: lowerDragPoint.x, y: lowerDragY, button: 'left'
    }, pageSession);
    const lowerMenuBounds = await cdp.eval(pageSession, `(() => {
      const buttons = [...document.querySelectorAll('[data-chatgpt-pro-download-popover] button')];
      const rects = buttons.map(button => button.getBoundingClientRect());
      return { top: Math.min(...rects.map(rect => rect.top)),
        bottom: Math.max(...rects.map(rect => rect.bottom)), viewportHeight: innerHeight };
    })()`);
    assert(lowerMenuBounds.top >= 8 && lowerMenuBounds.bottom <= lowerMenuBounds.viewportHeight - 8,
      `radial export actions stay within the viewport when the trigger is dragged to the bottom: ${JSON.stringify(lowerMenuBounds)}`);
    await cdp.eval(pageSession,
      `document.querySelector('[data-chatgpt-pro-current-export]').click()`);
    await cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-minimap-user')?.dispatchEvent(new Event('pointerenter'))`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-minimap-user')?.title === '1/2 · User' &&
       document.querySelector('.chatgpt-pro-minimap-preview-heading')?.textContent === '1/2 · User'`),
    'minimap marker and hover heading speaker labels translated');
    const minimapPreviewTextBeforeLocaleChange = await cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-minimap-preview-text')?.textContent || ''`);
    assert(minimapPreviewTextBeforeLocaleChange,
      'minimap hover preview retains the original message text in a separate node');
    assert.equal(await cdp.eval(popupSession,
      `document.querySelector('label[for="size"]')?.textContent || document.querySelector('#size').type`), 'number');
    await cdp.eval(pageSession, `document.querySelector('[data-chatgpt-pro-launcher]').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `Boolean(document.querySelector('.chatgpt-pro-panel'))`), 'English panel opened');
    const untranslated = await cdp.eval(pageSession, `(() => {
      const root = document.querySelector('.chatgpt-pro-panel');
      return [...root.querySelectorAll('button, label, option, [role="tab"], [title], [aria-label]')]
        .flatMap(el => [el.getAttribute('title'), el.getAttribute('aria-label'),
          el.children.length ? '' : el.textContent])
        .filter(Boolean).filter(text => /[\\u3400-\\u9fff]/u.test(text));
    })()`);
    assert.deepEqual(untranslated, [], 'static conversation controls have no untranslated Chinese in English mode');
    assert.equal(await cdp.eval(pageSession,
      `document.querySelector('[data-chatgpt-pro-current-export]')?.title`),
    'Open export menu', 'minimap export trigger tooltip describes opening the menu');
    assert.equal(await cdp.eval(pageSession,
      `document.querySelector('[data-chatgpt-pro-current-export]')?.getAttribute('aria-label')`),
    'Open export menu', 'minimap export trigger accessible label matches its localized tooltip');
    await cdp.eval(pageSession, `document.querySelector('[data-panel-view="search"]').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-search-index-status')?.textContent.includes('Authorize to build a full-text index')`),
    'full-text search status uses wildcard translation for changing counts');
    await cdp.eval(pageSession, `document.querySelector('[data-panel-view="directory"]').click()`);
    await cdp.eval(pageSession, `document.querySelector('[data-chatgpt-pro-launcher]').click()`);
    // Set a deterministic test language; production defaults to browser locale.
    await cdp.eval(popupSession, `(() => {
      const select = document.querySelector('#languageSelect');
      select.value = 'zh-CN'; select.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await eventually(async () => cdp.eval(popupSession,
      `document.querySelector('#indexStart').textContent.includes('需授权')`),
    'language switch restores original Simplified Chinese copy');
    assert.equal(await cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-minimap-preview-text')?.textContent || ''`),
    minimapPreviewTextBeforeLocaleChange,
    'switching interface language never translates the user-authored minimap message preview');
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
        '.chatgpt-pro-export-check-latest']
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
    await cdp.eval(pageSession, `(() => {
      for (const [id, key] of [
        ['question', 'fallback-turn-0:0:user'],
        ['answer', 'fallback-turn-0:2:assistant']
      ]) {
        const message = document.querySelector('[data-message-id="' + id + '"]');
        const unit = document.createElement('div');
        unit.setAttribute('data-chatgpt-search-unit-key', key);
        message.parentNode.insertBefore(unit, message);
        unit.appendChild(message);
      }
    })()`);
    await cdp.eval(popupSession, `document.querySelector('#messageTimeToggle').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('[data-chatgpt-pro-message-timestamp]').length === 2`),
    'user + assistant timestamps render from persisted JSON');
    assert.deepEqual(await cdp.eval(pageSession, `(() => {
      const unit = document.querySelector('[data-chatgpt-search-unit-key$=":assistant"]');
      const timestamp = unit?.querySelector(':scope > [data-chatgpt-pro-message-timestamp]');
      const answer = unit?.querySelector('[data-message-id="answer"]');
      return { directChild: timestamp?.parentElement === unit,
        aboveResponse: timestamp?.nextElementSibling === answer,
        placementClass: timestamp?.classList.contains('chatgpt-pro-message-timestamp-assistant') };
    })()`), { directChild: true, aboveResponse: true, placementClass: true },
    'assistant timestamp is inserted at the top of its stable response unit, before the answer body');
    await cdp.eval(popupSession, `(() => {
      const size = document.querySelector('#size');
      size.value = '17'; size.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await eventually(async () => cdp.eval(pageSession,
      `getComputedStyle(document.querySelector('[data-chatgpt-pro-message-timestamp]')).fontSize === '17px'`),
    'numeric font size immediately applies to in-chat timestamps');
    assert.equal(await cdp.eval(pageSession, `(() => {
      const sample = document.createElement('span'); sample.className = 'chatgpt-pro-badge';
      document.body.append(sample);
      const actual = getComputedStyle(sample).fontSize;
      sample.remove(); return actual;
    })()`), '17px', 'sidebar badges use exactly the same font size');
    await cdp.eval(popupSession, `(() => {
      const size = document.querySelector('#size');
      size.value = '99'; size.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    assert.equal(await cdp.eval(popupSession, `document.querySelector('#size').value`), '24',
      'custom font size remains within the supported range');
    assert.equal(requests.details, 1, 'timestamp decoration reuses cached JSON');
    await cdp.eval(popupSession, `document.querySelector('#messageTimeToggle').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('[data-chatgpt-pro-message-timestamp]').length === 0`),
    'disabling message timestamps removes decorations');
    await cdp.eval(pageSession, `(() => {
      document.querySelectorAll('[data-chatgpt-search-unit-key]').forEach(unit => {
        const message = unit.querySelector('[data-message-id]');
        if (message) unit.replaceWith(message);
      });
    })()`);
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
    await cdp.eval(popupSession, `new Promise(resolve =>
      chrome.storage.local.set({ showMinimap: false }, resolve))`);
    await eventually(async () => cdp.eval(pageSession,
      `!document.querySelector('[data-chatgpt-pro-minimap]')`),
    'minimap can be hidden while full-text search remains available');
    await cdp.eval(pageSession, `(() => {
      const main = document.querySelector('main');
      const question = document.querySelector('[data-message-id="question"]');
      const anchor = question.nextSibling;
      const placeholder = question.cloneNode(false);
      placeholder.setAttribute('data-message-id', 'loading-search-question');
      placeholder.textContent = 'Loading placeholder';
      const result = [...document.querySelectorAll('.chatgpt-pro-search-result')]
        .find(button => button.textContent.includes('s6 acceptance unique phrase'));
      window.__searchPreloadScrollEvents = 0;
      window.__searchPreloadScrollListener = () => {
        if (!document.querySelector('[data-message-id="question"]')) window.__searchPreloadScrollEvents++;
      };
      window.addEventListener('scroll', window.__searchPreloadScrollListener, true);
      document.querySelector('[data-message-id="answer"]').style.minHeight = '1500px';
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' });
      question.remove();
      main.insertBefore(placeholder, anchor);
      result.click();
      window.setTimeout(() => {
        placeholder.remove();
        main.insertBefore(question, anchor);
      }, 5000);
    })()`);
    await eventually(async () => cdp.eval(pageSession, `(() => {
      const target = document.querySelector('[data-message-id="question"]');
      return Boolean(target?.classList.contains('chatgpt-pro-search-target') &&
        target.getBoundingClientRect().top >= 0 && target.getBoundingClientRect().top < innerHeight);
    })()`), 'full-text search waits for delayed target content before using scroll fallback', 15000);
    const searchJumpScrollCalls = await cdp.eval(pageSession, `(() => {
      const count = window.__searchPreloadScrollEvents;
      window.removeEventListener('scroll', window.__searchPreloadScrollListener, true);
      delete window.__searchPreloadScrollListener;
      delete window.__searchPreloadScrollEvents;
      document.querySelector('[data-message-id="answer"]').style.minHeight = '';
      window.scrollTo({ top: 0, behavior: 'auto' });
      return count;
    })()`);
    assert(searchJumpScrollCalls <= 1,
      'full-text search navigation does not repeatedly scroll while the target is loading');
    await cdp.eval(popupSession, `new Promise(resolve =>
      chrome.storage.local.set({ showMinimap: true }, resolve))`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('.chatgpt-pro-minimap-marker').length === 2`),
    'minimap restores after a delayed full-text target is restored');
    assert.equal(requests.details, 1, 'searching the persisted index did not refetch JSON');

    await cdp.eval(popupSession, `document.querySelector('#messageTimeToggle').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('[data-chatgpt-pro-message-timestamp]').length === 2`),
    'message timestamps re-enabled for stale-cache regression');
    // A newly rendered message can be newer than the locally cached raw
    // conversation. Its real DOM ID must win over fallback-turn-N, and one
    // forced network refresh must replace the stale cache without request loops.
    const freshMessageTime = 1770004321;
    detailResponse = {
      ...CHAT,
      update_time: freshMessageTime,
      current_node: 'fresh-user',
      mapping: {
        ...CHAT.mapping,
        'fresh-user': {
          id: 'fresh-user', parent: 'answer', children: [],
          message: { id: 'fresh-user', author: { role: 'user' },
            content: { content_type: 'text', parts: ['fresh message fixture'] },
            create_time: freshMessageTime }
        }
      }
    };
    await cdp.eval(pageSession, `(() => {
      document.querySelector('[data-message-id="question"]')
        .setAttribute('data-chatgpt-search-unit-key', 'fallback-turn-0:0:user');
      document.querySelector('[data-message-id="answer"]')
        .setAttribute('data-chatgpt-search-unit-key', 'fallback-turn-0:2:assistant');
      const message = document.createElement('section');
      message.setAttribute('data-message-id', 'fresh-user');
      message.setAttribute('data-message-author-role', 'user');
      message.setAttribute('data-chatgpt-search-unit-key', 'fallback-turn-0:0:user');
      message.innerHTML = '<p>fresh message fixture</p>';
      document.querySelector('main').append(message);
    })()`);
    await eventually(async () => cdp.eval(pageSession, `(() => {
      const date = new Date(${freshMessageTime} * 1000);
      const pad = value => String(value).padStart(2, '0');
      const expected = date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' +
        pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' +
        pad(date.getSeconds());
      return document.querySelector('[data-message-id="fresh-user"] > [data-chatgpt-pro-message-timestamp]')?.textContent === expected;
    })()`), 'fresh real message ID resolves to its own server timestamp');
    await sleep(1200);
    assert.equal(requests.details, 2,
      'a stale cached conversation triggers exactly one forced refresh for the new rendered message set');
    await cdp.eval(popupSession, `document.querySelector('#messageTimeToggle').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('[data-chatgpt-pro-message-timestamp]').length === 0`),
    'message timestamps disabled after stale-cache regression');
    await cdp.eval(pageSession, `(() => {
      document.querySelector('[data-message-id="fresh-user"]')?.remove();
      document.querySelector('[data-message-id="question"]')?.removeAttribute('data-chatgpt-search-unit-key');
      document.querySelector('[data-message-id="answer"]')?.removeAttribute('data-chatgpt-search-unit-key');
    })()`);

    await cdp.eval(pageSession,
      `document.querySelector('#fallback-assistant-wrapper').style.display = 'block'`);
    await cdp.eval(popupSession, `document.querySelector('#messageTimeToggle').click()`);
    await eventually(async () => cdp.eval(pageSession, `(() => {
      const controls = document.querySelector('#fallback-assistant-wrapper .turn-action-controls');
      const timestamp = controls?.querySelector(':scope > [data-chatgpt-pro-message-timestamp]');
      return Boolean(timestamp && timestamp.classList.contains('chatgpt-pro-message-timestamp-controls')
        && timestamp.nextElementSibling === controls.querySelector('button')
        && getComputedStyle(timestamp).display === 'inline-flex');
    })()`), 'legacy assistant timestamp uses compact inline styling inside its action-controls fallback');
    assert.equal(requests.details, 2,
      'legacy timestamp placement reuses the already cached conversation JSON');
    await cdp.eval(popupSession, `document.querySelector('#messageTimeToggle').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelectorAll('[data-chatgpt-pro-message-timestamp]').length === 0`),
    'legacy assistant timestamp is removed when message timestamps are disabled');
    await cdp.eval(pageSession,
      `document.querySelector('#fallback-assistant-wrapper').remove()`);

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
    assert.equal(requests.details, 2, 'debounced search does not call remote API');

    const markLocal = await cdp.eval(popupSession, `chrome.runtime.sendMessage({
      action: 'localDataMarkOfficialGone', accountId: 's6-isolated-account', id: '${CHAT_ID}'
    })`);
    assert(markLocal?.success && markLocal?.result?.marked, 'fixture is explicitly marked local-only in IDB');
    await cdp.eval(popupSession, `new Promise(resolve =>
      chrome.storage.local.set({ uiLanguage: 'es' }, resolve))`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelector('[data-chatgpt-pro-current-export]')?.title === 'Abrir menú de exportación'`),
    'minimap export-menu tooltip follows a runtime language change');
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelector('[data-panel-view="search"]')?.textContent.includes('texto')`),
    'search panel reacts to the saved Spanish interface language');
    await cdp.eval(pageSession, `(() => {
      const input = document.querySelector('.chatgpt-pro-fulltext-input');
      input.value = 's6 acceptance unique phrase';
      document.querySelector('.chatgpt-pro-fulltext-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }));
    })()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-search-result-meta')?.textContent.includes('Solo local') &&
       document.querySelector('.chatgpt-pro-search-result-meta')?.textContent.includes('Usuario')`),
    'search result provenance and user role are localized without changing the indexed snippet');
    assert.equal(await cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-search-result-snippet')?.textContent`),
    's6 acceptance unique phrase',
    'user-authored search snippets remain unchanged in Spanish');
    await cdp.eval(pageSession, `(() => {
      const input = document.querySelector('.chatgpt-pro-fulltext-input');
      input.value = 'Offline acceptance test';
      document.querySelector('.chatgpt-pro-fulltext-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }));
    })()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-search-result-snippet')?.textContent === 'Coincidencia en el título'`),
    'extension-generated title-only search snippet is translated in Spanish');
    assert.equal(await cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-search-result strong')?.textContent`),
    'Offline acceptance test',
    'title-only search translation does not modify the original conversation title');
    await cdp.eval(pageSession, `Array.from(document.querySelectorAll('.chatgpt-pro-search-result button'))
      .find(button => button.textContent.includes('Vista previa local completa')).click()`);
    await eventually(async () => cdp.eval(pageSession,
      `!document.querySelector('.chatgpt-pro-local-preview')?.hidden &&
       document.querySelector('.chatgpt-pro-local-preview')?.textContent.includes('s6 acceptance unique phrase')`),
    'confirmed local-only item offers complete raw JSON preview');
    await eventually(async () => cdp.eval(pageSession,
      `Array.from(document.querySelectorAll('.chatgpt-pro-search-result button'))
        .some(button => button.textContent.includes('Ocultar vista previa local'))`),
    'local preview toggle label is translated in the active locale');
    assert(await cdp.eval(pageSession,
      `Array.from(document.querySelectorAll('.chatgpt-pro-search-result button'))
        .some(button => button.textContent.includes('Eliminar copia local'))`),
    'local-only cleanup action uses the active locale');
    assert.equal(requests.details, 2, 'local-only preview did not reach official conversation endpoint');
    await cdp.eval(popupSession, `new Promise(resolve =>
      chrome.storage.local.set({ uiLanguage: 'zh-CN' }, resolve))`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-search-result-meta')?.textContent.includes('仅本地')`),
    'existing search result labels update when the interface language changes again');

    await cdp.eval(pageSession, `document.querySelector('[data-panel-view="directory"]').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `Boolean(document.querySelector('.chatgpt-pro-row-checkbox'))`), 'directory item rendered');
    await cdp.eval(pageSession, `document.querySelector('.chatgpt-pro-row-checkbox').click()`);
    await cdp.eval(pageSession, `document.querySelector('[data-batch-format="json"]').click()`);
    await eventually(async () => fs.readdirSync(downloadPath).some(name => name.endsWith('.zip')),
      'real browser saved the cached JSON ZIP volume', 24000);
    assert.equal(requests.details, 2, 'ZIP export reused the indexed original JSON without extra details');
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
    assert.equal(requests.details, 2, '56 cached records exported without further detail requests');
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
    assert.equal(requests.details, 2, 'filtering cached directory never calls conversation detail API');
    const unverifiedSeed = await cdp.eval(popupSession, `chrome.runtime.sendMessage({
      action: 'localDataUpsertDirectory', accountId: 's6-isolated-account',
      records: [{ id: 'r8-unverified-status', title: 'Unverified status fixture',
        createTime: 1770000300, updateTime: 1770000300, remoteState: 'unverified' },
      { id: 'r8-unnamed-project', title: 'Unnamed project fixture',
        createTime: 1770000310, updateTime: 1770000310, projectId: 'g-p-r8-unnamed' }]
    })`);
    assert(unverifiedSeed?.success, 'controlled unverified and unnamed-project conversations added to local directory');
    await cdp.eval(pageSession, `document.querySelector('[data-chatgpt-pro-launcher]').click()`);
    await cdp.eval(pageSession, `document.querySelector('[data-chatgpt-pro-launcher]').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `Array.from(document.querySelectorAll('.chatgpt-pro-row-title'))
        .some(el => el.textContent.includes('Unverified status fixture')) &&
       Array.from(document.querySelectorAll('.chatgpt-pro-row-title'))
        .some(el => el.textContent.includes('Unnamed project fixture'))`),
    'directory renders controlled unverified-status and unnamed-project records');
    // Language choice is shared with the real content script, remains scoped
    // to extension elements, and supports RTL without changing ChatGPT itself.
    await cdp.eval(popupSession, `(() => {
      const select = document.querySelector('#languageSelect');
      select.value = 'es'; select.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await eventually(async () => cdp.eval(popupSession,
      `document.querySelector('.local-stats').textContent.toLocaleLowerCase('es').includes('conversaciones')`),
    'Spanish Popup translation applied');
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelector('[data-panel-view="directory"]').textContent.toLocaleLowerCase('es').includes('conversaciones')`),
    'Spanish conversation panel translated without remounting');
    assert.equal(await cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-minimap-user')?.title`), '1/2 · Usuario',
    'Spanish minimap speaker tooltip translates after a live language change');
    assert.equal(await cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-project-filter option[value="g-p-r8-project"]')?.textContent`),
    'Proyecto · R8 独立项目',
    'Spanish project filter translates its generated prefix without translating the project name');
    assert.equal(await cdp.eval(pageSession, `(() => {
      const row = Array.from(document.querySelectorAll('.chatgpt-pro-row'))
        .find(item => item.querySelector('.chatgpt-pro-row-title-text')?.textContent === 'Unnamed project fixture');
      const option = document.querySelector('.chatgpt-pro-project-filter option[value="g-p-r8-unnamed"]');
      return JSON.stringify({ row: row?.querySelector('.chatgpt-pro-row-project')?.textContent,
        option: option?.textContent });
    })()`), JSON.stringify({ row: 'Proyecto sin nombre', option: 'Proyecto · Proyecto sin nombre' }),
    'Spanish unnamed-project fallback is translated in both the row and project filter');
    const spanishDirectoryLabels = await cdp.eval(pageSession, `(() => {
      const titles = Array.from(document.querySelectorAll('.chatgpt-pro-row-title'));
      const local = titles.find(el => el.textContent.includes('Offline acceptance test'));
      const unverified = titles.find(el => el.textContent.includes('Unverified status fixture'));
      const mdLabel = local?.closest('.chatgpt-pro-row')?.querySelector('.chatgpt-pro-row-export button')?.getAttribute('aria-label');
      return { localText: local?.textContent, unverifiedText: unverified?.textContent, mdLabel,
        localTitle: local?.querySelector('.chatgpt-pro-row-title-text')?.textContent,
        unverifiedTitle: unverified?.querySelector('.chatgpt-pro-row-title-text')?.textContent };
    })()`);
    assert(spanishDirectoryLabels.localText?.includes('Solo local') &&
      spanishDirectoryLabels.unverifiedText?.includes('Sin verificar') &&
      spanishDirectoryLabels.mdLabel === 'Exportar este chat como Markdown: Offline acceptance test' &&
      spanishDirectoryLabels.localTitle === 'Offline acceptance test' &&
      spanishDirectoryLabels.unverifiedTitle === 'Unverified status fixture',
    `Spanish directory status and accessibility labels translate while user-authored titles remain unchanged: ${JSON.stringify(spanishDirectoryLabels)}`);
    await cdp.eval(popupSession, `(() => {
      const select = document.querySelector('#languageSelect');
      select.value = 'ar'; select.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-panel')?.dir === 'rtl' &&
       document.querySelector('[data-panel-view="search"]').textContent.includes('البحث')`),
    'Arabic RTL panel and UI labels applied');
    assert.equal(await cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-minimap-user')?.title`), '1/2 · المستخدم',
    'Arabic minimap speaker tooltip translates after a live language change');
    assert.equal(await cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-project-filter option[value="g-p-r8-project"]')?.textContent`),
    'مشروع · R8 独立项目',
    'Arabic project filter translates its generated prefix without translating the project name');
    assert.equal(await cdp.eval(pageSession, `(() => {
      const row = Array.from(document.querySelectorAll('.chatgpt-pro-row'))
        .find(item => item.querySelector('.chatgpt-pro-row-title-text')?.textContent === 'Unnamed project fixture');
      const option = document.querySelector('.chatgpt-pro-project-filter option[value="g-p-r8-unnamed"]');
      return JSON.stringify({ row: row?.querySelector('.chatgpt-pro-row-project')?.textContent,
        option: option?.textContent });
    })()`), JSON.stringify({ row: 'مشروع بلا اسم', option: 'مشروع · مشروع بلا اسم' }),
    'Arabic unnamed-project fallback is translated in both the row and project filter');
    assert.equal(await cdp.eval(pageSession, `document.documentElement.getAttribute('dir')`), null,
      'localization does not alter ChatGPT document direction');
    assert.equal(await cdp.eval(pageSession, `(() => {
      const titles = Array.from(document.querySelectorAll('.chatgpt-pro-row-title'));
      const local = titles.find(el => el.textContent.includes('Offline acceptance test'));
      const unverified = titles.find(el => el.textContent.includes('Unverified status fixture'));
      const project = titles.find(el => el.textContent.includes('R8 unique project fixture'));
      const mdLabel = local?.closest('.chatgpt-pro-row')?.querySelector('.chatgpt-pro-row-export button')?.getAttribute('aria-label');
      return Boolean(local?.textContent.includes('محلي فقط') &&
        unverified?.textContent.includes('غير متحقق منه') &&
        mdLabel === 'تصدير هذه المحادثة بصيغة Markdown: Offline acceptance test' &&
        local.querySelector('.chatgpt-pro-row-title-text')?.textContent === 'Offline acceptance test' &&
        unverified.querySelector('.chatgpt-pro-row-title-text')?.textContent === 'Unverified status fixture' &&
        project.querySelector('.chatgpt-pro-row-title-text')?.textContent === 'R8 unique project fixture');
    })()`), true,
    'Arabic status labels translate while all user-authored conversation titles remain unchanged');

    await cdp.eval(popupSession, `new Promise(resolve => chrome.storage.local.set({
      uiLanguage: 'en', autoContinueEnabled: true, autoContinueText: '继续'
    }, resolve))`);
    await eventually(async () => cdp.eval(pageSession,
      `Boolean(document.querySelector('[data-chatgpt-pro-auto-continue]'))`),
    'auto-continue control appears when enabled');
    await eventually(async () => cdp.eval(popupSession, `new Promise(resolve =>
      chrome.storage.local.get('autoContinueText', values => resolve(!Object.hasOwn(values, 'autoContinueText'))))`),
    'legacy built-in Chinese continuation text is removed from stored settings');
    await cdp.eval(pageSession,
      `document.querySelector('[data-chatgpt-pro-auto-continue]').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `!document.querySelector('[data-chatgpt-pro-auto-popover]')?.hidden`),
    'auto-continue settings popover opens');
    const autoContinueDefaults = await cdp.eval(pageSession, `(() => {
      const input = document.querySelector('[data-chatgpt-pro-auto-popover] [data-auto-text]');
      const start = document.querySelector('[data-chatgpt-pro-auto-popover] [data-auto-start]');
      return { value: input?.value, placeholder: input?.placeholder, startDisabled: start?.disabled };
    })()`);
    assert.deepEqual(autoContinueDefaults, {
      value: '', placeholder: 'Enter a message to send', startDisabled: true
    }, 'auto-continue starts with an empty message and cannot send until the user enters one');
    await cdp.eval(pageSession, `(() => {
      const input = document.querySelector('[data-chatgpt-pro-auto-popover] [data-auto-text]');
      input.value = 'Continue'; input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    assert.equal(await cdp.eval(pageSession,
      `document.querySelector('[data-chatgpt-pro-auto-popover] [data-auto-start]')?.disabled`), false,
    'entering a custom continuation message enables Start');
    await cdp.eval(popupSession, `new Promise(resolve =>
      chrome.storage.local.set({ autoContinueEnabled: false }, resolve))`);

    await cdp.eval(pageSession, `(() => {
      const status = document.querySelector('.chatgpt-pro-search-index-status');
      const parts = [
        '当前账号已索引 185 / 187 个', '剩余 2 个需要补齐', '已跳过 1 个',
        '2 个需按新规则重建', '补齐剩余 2 个', '刷新索引规则（2 个）'
      ];
      status.replaceChildren();
      parts.forEach((value, index) => {
        if (index) status.append(document.createTextNode(' · '));
        const part = document.createElement('span'); part.textContent = value; status.append(part);
      });
    })()`);
    await eventually(async () => cdp.eval(pageSession, `(() => {
      const text = document.querySelector('.chatgpt-pro-search-index-status')?.textContent || '';
      return text.includes('Indexed 185 / 187 for this account') &&
        text.includes('2 remaining to index') && text.includes('Skipped 1') &&
        text.includes('2 need rebuilding under the latest rules') &&
        text.includes('Complete remaining 2') && text.includes('Refresh index rules (2)');
    })()`), 'full-text indexing counts and action labels use reviewed English dynamic translations');

    const skipTask = await cdp.eval(popupSession, `chrome.runtime.sendMessage({
      action: 'taskCreate', accountId: 's6-isolated-account', type: 'index', items: [
        { id: 's6-skip-target', title: 'S6 one skipped conversation', updateTime: 1770000400 },
        { id: 's6-keep-one', title: 'S6 keep one', updateTime: 1770000401 },
        { id: 's6-keep-two', title: 'S6 keep two', updateTime: 1770000402 }
      ] })`);
    assert(skipTask?.success, `skip test task create failed: ${skipTask?.error}`);
    const skipTaskId = skipTask.result.id;
    const skipOwner = 's6-skip-test-owner';
    const skipClaim = await cdp.eval(popupSession, `chrome.runtime.sendMessage({
      action: 'taskClaim', accountId: 's6-isolated-account', id: '${skipTask.result.id}',
      owner: '${skipOwner}' })`);
    assert(skipClaim?.success && skipClaim.result?.acquired, 'skip test task claim succeeds');
    for (const [itemIndex, outcome] of [[0, 'failed'], [1, 'success'], [2, 'success']]) {
      const checkpoint = await cdp.eval(popupSession, `chrome.runtime.sendMessage({
        action: 'taskCheckpoint', accountId: 's6-isolated-account', id: '${skipTask.result.id}',
        owner: '${skipOwner}', token: '${skipClaim.result.token}', itemIndex: ${itemIndex},
        outcome: '${outcome}', error: '${outcome === 'failed' ? 'HTTP 404: https://chatgpt.com/backend-api/conversation/s6-skip-target' : ''}' })`);
      assert(checkpoint?.success, `skip test checkpoint ${itemIndex} succeeds: ${checkpoint?.error}`);
    }
    await cdp.eval(pageSession, `document.querySelector('[data-panel-view="search"]').click()`);
    await eventually(async () => cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-search-index-error-skip')?.isConnected`),
    'one failed conversation exposes its own skip action');
    const englishFailureLabels = await cdp.eval(pageSession, `(() => {
      const root = document.querySelector('.chatgpt-pro-search-index-detail');
      return {
        summary: root?.querySelector('summary')?.textContent,
        skip: root?.querySelector('.chatgpt-pro-search-index-error-skip')?.textContent,
        open: root?.querySelector('.chatgpt-pro-search-index-error-title a')?.textContent,
        id: root?.querySelector('.chatgpt-pro-search-index-error > div:nth-child(2)')?.textContent,
        error: root?.querySelector('.chatgpt-pro-search-index-error-message')?.textContent,
        assessment: root?.querySelector('.chatgpt-pro-search-index-error-hint')?.textContent
      };
    })()`);
    assert(englishFailureLabels.summary?.includes('Index failures') &&
      englishFailureLabels.summary.includes('(1)') &&
      englishFailureLabels.skip === 'Skip' && englishFailureLabels.open === 'Open conversation' &&
      englishFailureLabels.id.startsWith('ID:') && englishFailureLabels.error.startsWith('Error:') &&
      englishFailureLabels.error.includes('HTTP 404') &&
      englishFailureLabels.assessment.startsWith('Assessment:') &&
      englishFailureLabels.assessment.includes('may be missing or inaccessible'),
    `full-text failure log labels and explanation use English translations: ${JSON.stringify(englishFailureLabels)}`);
    await cdp.send('Page.enable', {}, pageSession);
    const acceptSkipConfirmation = message => {
      if (message.method === 'Page.javascriptDialogOpening' && message.sessionId === pageSession) {
        cdp.send('Page.handleJavaScriptDialog', { accept: true }, pageSession).catch(() => {});
      }
    };
    cdp.listeners.add(acceptSkipConfirmation);
    await cdp.eval(pageSession,
      `document.querySelector('.chatgpt-pro-search-index-error-skip').click()`);
    cdp.listeners.delete(acceptSkipConfirmation);
    await eventually(async () => cdp.eval(popupSession, `(async () => {
      const task = await chrome.runtime.sendMessage({ action: 'taskGet',
        accountId: 's6-isolated-account', id: '${skipTaskId}' });
      const policy = await chrome.runtime.sendMessage({ action: 'indexPolicyGet',
        accountId: 's6-isolated-account' });
      return task?.success && policy?.success && task.result.skippedCount === 1 &&
        task.result.skippedIds?.length === 1 && task.result.skippedIds[0] === 's6-skip-target' &&
        task.result.errors?.length === 0 &&
        JSON.stringify(policy.result.skippedIndexIds) === JSON.stringify(['s6-skip-target']);
    })()`), 'skip action persists only the selected conversation ID');
    await cdp.eval(pageSession, `(() => {
      history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    })()`);
    await eventually(async () => cdp.eval(pageSession, `(() => {
      const launcher = document.querySelector('[data-chatgpt-pro-launcher]');
      return Boolean(launcher && launcher.parentElement === document.body &&
        !document.querySelector('[data-chatgpt-pro-tool-dock]'));
    })()`), 'leaving a conversation restores the standalone draggable directory launcher');
    await cdp.eval(pageSession, `(() => {
      history.pushState({}, '', ${JSON.stringify(CHAT_URL)});
      window.dispatchEvent(new PopStateEvent('popstate'));
    })()`);
    await eventually(async () => cdp.eval(pageSession, `(() => {
      const dock = document.querySelector('[data-chatgpt-pro-tool-dock]');
      const launcher = document.querySelector('[data-chatgpt-pro-launcher]');
      return Boolean(dock && launcher && launcher.parentElement === dock);
    })()`), 'returning to a conversation reattaches the directory launcher to the minimap dock');
    assert(!browserErrors.some(Boolean), `Chrome runtime exceptions: ${browserErrors.join('; ')}`);
    console.log(`S6_EXTENSION_PASS: real MV3, timestamps, filename settings, single MD/JSON, project/title filter, cached index and two ZIP parts; requests=${JSON.stringify(requests)}`);
  } finally {
    chrome.kill('SIGTERM');
    await sleep(250);
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

main().catch(error => { console.error('S6_EXTENSION_FAIL:', error.message); process.exitCode = 1; });
