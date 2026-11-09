/** Hidden ChatGPT tabs skip reactive UI work and reconcile on activation. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../scripts/content-chatgpt.js'), 'utf8');
const observerStart = source.indexOf('  function setupObserver() {');
const observerEnd = source.indexOf('  async function loadSettings()', observerStart);
const visibilityStart = source.indexOf("    document.addEventListener('visibilitychange', () => {");
const visibilityEnd = source.indexOf("    window.setInterval(tickAutoContinue", visibilityStart);
assert(observerStart >= 0 && observerEnd > observerStart && visibilityEnd > visibilityStart);

const calls = { timestamps: 0, minimap: 0, resumeJump: 0, index: 0, sidebar: 0,
  budget: 0, recover: 0 };
const document = { hidden: true, body: {} };
const handlers = {};
const S = { observer: null };
const context = {
  S,
  document,
  AUTO_INDEX_POST_MESSAGE_DELAY_MS: 25000,
  setTimeout(callback) { callback(); return 1; },
  clearTimeout() {},
  MutationObserver: class {
    constructor(callback) { handlers.mutation = callback; }
    observe() {}
    disconnect() {}
  },
  window: { ChatGPTDomAdapter: {
    containsSidebarConversationLink: () => false,
    containsMessageNode: () => true,
    containsMessageDecorationTarget: () => false
  } },
  stampAll() { calls.sidebar++; },
  refreshMessageTimestampsForView() { calls.timestamps++; },
  scheduleMinimapSync() { calls.minimap++; },
  syncConversationMinimap() { calls.minimap++; },
  resumePendingSearchJump() { calls.resumeJump++; return Promise.resolve(); },
  scheduleAutomaticIndexRefresh() { calls.index++; },
  syncContextBudget() { calls.budget++; },
  recoverIndexTasks() { calls.recover++; return Promise.resolve(); },
  log() {}
};
document.addEventListener = (name, callback) => { handlers[name] = callback; };
vm.createContext(context);
vm.runInContext(source.slice(observerStart, observerEnd) + '\nsetupObserver();', context);
vm.runInContext(source.slice(visibilityStart, visibilityEnd), context);

const mutation = [{ type: 'childList', addedNodes: [{ nodeType: 1 }], removedNodes: [] }];
handlers.mutation(mutation);
assert.deepEqual(calls, { timestamps: 0, minimap: 0, resumeJump: 0, index: 0,
  sidebar: 0, budget: 0, recover: 0 }, 'hidden tab skips observer-derived UI work');

document.hidden = false;
handlers.visibilitychange();
assert.equal(calls.timestamps, 1, 'foreground return reconciles timestamps');
assert.equal(calls.sidebar, 1, 'foreground return reconciles sidebar badges');
assert.equal(calls.minimap, 1, 'foreground return reconciles minimap');
assert.equal(calls.budget, 1, 'foreground return reconciles context budget');
assert.equal(calls.index, 1, 'foreground return schedules one deferred index check');
assert.equal(calls.recover, 1, 'foreground return keeps index recovery');

handlers.mutation(mutation);
assert.equal(calls.timestamps, 2, 'active tab resumes reactive timestamp updates');
assert.equal(calls.minimap, 2, 'active tab resumes reactive minimap updates');
assert.equal(calls.index, 2, 'active tab resumes debounced index scheduling');

document.hidden = true;
handlers.visibilitychange();
handlers.mutation(mutation);
assert.equal(calls.timestamps, 2, 'hiding again suppresses further UI work');
assert.equal(calls.index, 2, 'hiding again suppresses new auto-index scheduling');
console.log('BACKGROUND_TAB_UI_PASS: hidden observer suppression, foreground reconciliation, resumed work');
