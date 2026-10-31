/** Event-driven automatic indexing waits for a completed ChatGPT reply. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../scripts/content-chatgpt.js'), 'utf8');
const start = source.indexOf('  const AUTO_INDEX_GENERATION_RECHECK_MS =');
const end = source.indexOf('  function closeTimeline(', start);
assert(start >= 0 && end > start, 'production automatic-index scheduler is present');
const adapterSource = fs.readFileSync(path.join(__dirname, '../scripts/chatgpt-dom-adapter.js'), 'utf8');

let clock = 0;
let nextTimerId = 0;
let stopControl = null;
const timers = new Map();
const calls = { sync: [], index: [] };
const records = [{ id: 'completed-reply', updateTime: 42 }];
const document = { hidden: false };
const S = { settings: { enabled: true } };

const adapterContext = {
  window: {},
  document: {
    querySelector: selector => /stop-button|Stop|停止/.test(selector) ? stopControl : null
  },
  Element: class Element {}
};
vm.createContext(adapterContext);
vm.runInContext(adapterSource, adapterContext);
const domAdapter = adapterContext.window.ChatGPTDomAdapter;
assert(domAdapter, 'production DOM adapter is available');

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
  }
  clock = target;
}

const context = {
  S,
  document,
  window: {
    setTimeout: setTimeoutFake,
    clearTimeout: clearTimeoutFake,
    ChatGPTDomAdapter: domAdapter
  },
  incrementalSyncConversationList: async (status, options) => {
    calls.sync.push({ status, options });
    return records;
  },
  maybeAutoIncrementalIndex: async (items, options) => {
    calls.index.push({ items, options });
    return { indexedCount: items.length };
  },
  log() {}
};

vm.createContext(context);
vm.runInContext(`${source.slice(start, end)}\nglobalThis.schedule = scheduleAutomaticIndexRefresh;`, context);

async function main() {
  // A burst of route/DOM events is collapsed into one refresh.
  context.schedule(20);
  context.schedule(30);
  context.schedule(5);
  assert.equal(timers.size, 1, 'only one debounce timer remains after repeated triggers');
  await advance(4);
  assert.equal(calls.sync.length, 0, 'debounce does not run early');
  await advance(1);
  assert.equal(calls.sync.length, 1, 'coalesced event performs one directory sync');
  assert.equal(calls.index.length, 1, 'coalesced event performs one incremental index check');
  assert.equal(calls.sync[0].options.checkLatest, true,
    'event-driven sync bypasses the ordinary directory freshness interval');
  assert.equal(calls.index[0].options.force, true,
    'event-driven indexing bypasses the five-minute maintenance throttle');

  // The stop button remains present during streaming. Do not index the
  // partial assistant response; retry until ChatGPT reports generation done.
  stopControl = { getClientRects: () => [{}] };
  assert.equal(domAdapter.isGenerating(), true, 'visible ChatGPT stop control means generation is active');
  context.schedule(0);
  await advance(0);
  assert.equal(calls.sync.length, 1, 'directory sync waits while ChatGPT is generating');
  assert.equal(calls.index.length, 1, 'partial assistant response is not indexed');
  const nextCheck = [...timers.values()][0];
  assert.equal(nextCheck.at - clock, 2000, 'generation state is rechecked every two seconds');
  await advance(1999);
  assert.equal(calls.sync.length, 1, 'generation wait does not poll the API');
  stopControl = { getClientRects: () => [] };
  assert.equal(domAdapter.isGenerating(), false, 'hidden ChatGPT stop control means generation is complete');
  await advance(1);
  assert.equal(calls.sync.length, 2, 'one refresh runs after the stop control disappears');
  assert.equal(calls.index.length, 2, 'the completed assistant response is indexed');

  // Hidden or disabled tabs must not start a queued request.
  document.hidden = true;
  context.schedule(0);
  assert.equal(timers.size, 0, 'hidden tabs do not schedule automatic indexing');
  document.hidden = false;
  context.schedule(10);
  S.settings.enabled = false;
  await advance(10);
  assert.equal(calls.sync.length, 2, 'disabling the extension cancels the queued refresh');
  assert.equal(calls.index.length, 2, 'disabling the extension prevents automatic indexing');

  console.log('S3_AUTO_INDEX_TRIGGER_PASS: debounce, generation wait, completion refresh, hidden/disabled guards');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
