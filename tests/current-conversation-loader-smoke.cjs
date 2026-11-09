/** Current-page conversation consumers share one delayed detail loader. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../scripts/content-chatgpt.js'), 'utf8');
const start = source.indexOf('  function resetCurrentConversationLoader(');
const end = source.indexOf('  function currentConversationRecord()', start);
assert(start >= 0 && end > start, 'production current-conversation loader is present');

let clock = 100000;
let nextTimerId = 0;
const timers = new Map();
let currentId = 'chat-a';
let generating = false;
let detailRequests = 0;
const requestOptions = [];

function setTimeoutFake(callback, delay = 0) {
  const id = ++nextTimerId;
  timers.set(id, { at: clock + Math.max(0, Number(delay) || 0), callback });
  return id;
}

function clearTimeoutFake(id) {
  timers.delete(id);
}

async function advance(ms) {
  const target = clock + ms;
  for (;;) {
    const due = [...timers.entries()]
      .filter(([, timer]) => timer.at <= target)
      .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
    if (!due) break;
    const [id, timer] = due;
    timers.delete(id);
    clock = timer.at;
    await timer.callback();
    await Promise.resolve();
  }
  clock = target;
  await Promise.resolve();
}

const S = {
  conversationLoadId: null,
  conversationLoadPromise: null,
  conversationLoadData: null,
  conversationReadyId: null,
  conversationReadyPromise: null,
  conversationForceRefreshAt: 0,
  messageConversationId: null,
  messageConversation: null
};

const context = {
  S,
  Date: { now: () => clock },
  CONVERSATION_INITIAL_QUIET_MS: 3000,
  CONVERSATION_INITIAL_MAX_WAIT_MS: 10000,
  CONVERSATION_READY_POLL_MS: 250,
  CONVERSATION_FORCE_REFRESH_COOLDOWN_MS: 30000,
  document: {
    scrollingElement: {},
    querySelector: selector => selector === 'main' ? {} : null
  },
  window: {
    setTimeout: setTimeoutFake,
    clearTimeout: clearTimeoutFake,
    ChatGPTDomAdapter: {
      messageElements: () => [{}],
      isGenerating: () => generating
    },
    APIHandler: {
      getConversation: async (id, options) => {
        detailRequests++;
        requestOptions.push(options || {});
        return { id, update_time: detailRequests, mapping: { m: { message: { id: 'm' } } } };
      }
    }
  },
  currentConversationId: () => currentId,
  conversationProgressSnapshot: () => 'stable-dom',
  isConversationSnapshotNewer: (candidate, current) =>
    !current || Number(candidate?.update_time || 0) >= Number(current?.update_time || 0)
};

vm.createContext(context);
vm.runInContext(`${source.slice(start, end)}\n`
  + 'globalThis.loadConversation = loadCurrentConversation;\n'
  + 'globalThis.resetLoader = resetCurrentConversationLoader;', context);

async function main() {
  const first = context.loadConversation('chat-a');
  const second = context.loadConversation('chat-a');
  assert.equal(detailRequests, 0, 'page entry does not immediately request conversation details');
  await advance(2999);
  assert.equal(detailRequests, 0, 'detail request waits for about three seconds of DOM quiet');
  await advance(1);
  const [firstData, secondData] = await Promise.all([first, second]);
  assert.equal(detailRequests, 1, 'concurrent timestamp/minimap/budget consumers share one request');
  assert.equal(firstData, secondData, 'coalesced consumers receive the same snapshot');
  assert.equal(requestOptions[0].forceNetwork, undefined, 'ordinary load keeps normal cache semantics');

  const cached = await context.loadConversation('chat-a');
  assert.equal(cached, firstData, 'short-window consumers reuse the already loaded page snapshot');
  assert.equal(detailRequests, 1, 'snapshot reuse is network-free');

  const forced = await context.loadConversation('chat-a', { forceNetwork: true });
  assert.equal(detailRequests, 2, 'first forced refresh performs one network refresh');
  assert.equal(requestOptions[1].forceNetwork, true, 'forced refresh reaches the API as forced network');
  const cooled = context.loadConversation('chat-a', { forceNetwork: true });
  assert.equal(detailRequests, 2, '30-second force-refresh cooldown prevents duplicate network calls');
  await advance(29999);
  assert.equal(detailRequests, 2, 'deferred forced refresh stays network-free before cooldown expiry');
  await advance(1);
  const cooledData = await cooled;
  assert.equal(detailRequests, 3, 'deferred forced refresh runs automatically when cooldown expires');
  assert.notEqual(cooledData, forced, 'deferred forced refresh adopts the newer snapshot');

  currentId = 'chat-b';
  generating = true;
  const nextRoute = context.loadConversation('chat-b');
  await advance(9999);
  assert.equal(detailRequests, 3, 'generation/loading state keeps the new route deferred');
  await advance(1);
  await nextRoute;
  assert.equal(detailRequests, 4, '10-second maximum wait prevents a permanently blocked loader');

  console.log('CURRENT_CONVERSATION_LOADER_PASS: stable-page delay, shared load, force cooldown, max wait');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
