/** Index detail retry classification; no network requests or browser APIs. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../scripts/content-chatgpt.js'), 'utf8');
const popupSource = fs.readFileSync(path.join(__dirname, '../popup/popup.js'), 'utf8');
const fetchStart = source.indexOf('  async function fetchConversationForExport(');
const fetchEnd = source.indexOf('\n  async function exportConversationMarkdown', fetchStart);
const builderStart = source.indexOf('  function buildSearchIndexRecord(');
const builderEnd = source.indexOf('\n  const INDEX_EXECUTOR_ID', builderStart);
assert(fetchStart >= 0 && fetchEnd > fetchStart, 'production detail retry helper exists');
assert(builderStart >= 0 && builderEnd > builderStart, 'production search record builder exists');

const waits = [];
let attempts = 0;
let errors = [];
let cooldownUntil = 0;
const context = {
  Date,
  EXPORT_MAX_RETRIES: 3,
  EXPORT_RATE_LIMIT_DEFAULT_MS: 60000,
  EXPORT_RETRY_DELAYS_MS: [1000, 3000, 8000],
  SEARCH_INDEX_SCHEMA_VERSION: 2,
  timestampValue: value => Number(value || 0),
  currentBranchMessages: () => [],
  isUserVisibleMessage: () => true,
  messageText: () => '',
  waitForExport: async ms => { waits.push(ms); },
  runtimeMessage: async message => {
    assert.equal(message.action, 'detailStatus');
    return { success: true, result: { cooldownUntil } };
  },
  window: {
    APIHandler: {
      getAccountId: async () => 'account-A',
      getConversation: async () => {
        attempts++;
        const next = errors.shift();
        if (next) throw next;
        return { data: { id: 'conversation', mapping: {} }, source: 'network' };
      }
    }
  }
};

vm.createContext(context);
vm.runInContext(`${source.slice(fetchStart, fetchEnd)}\n`
  + `${source.slice(builderStart, builderEnd)}\n`
  + 'globalThis.retryPolicy = { fetchConversationForExport, buildSearchIndexRecord };', context);

function httpError(status, extra = {}) {
  return Object.assign(new Error(`HTTP ${status}`), { status, ...extra });
}

async function expectNoRetry(error, label) {
  attempts = 0;
  errors = [error];
  waits.length = 0;
  await assert.rejects(() => context.retryPolicy.fetchConversationForExport({ id: 'conversation' }),
    caught => caught === error, label);
  assert.equal(attempts, 1, `${label}: only one request`);
  assert.equal(waits.length, 0, `${label}: no retry delay`);
}

async function main() {
  for (const status of [400, 401, 403, 404, 410, 422]) {
    await expectNoRetry(httpError(status), `HTTP ${status} is not retried`);
  }
  const invalidJson = Object.assign(new Error('E_API_RESPONSE_INVALID_JSON'), {
    code: 'E_API_RESPONSE_INVALID_JSON'
  });
  await expectNoRetry(invalidJson, 'invalid JSON is not retried');

  attempts = 0;
  waits.length = 0;
  errors = [httpError(500), httpError(502), new TypeError('network timeout')];
  const transient = await context.retryPolicy.fetchConversationForExport({ id: 'conversation' });
  assert.equal(transient.source, 'network');
  assert.equal(attempts, 4, 'transient HTTP and network errors receive bounded retries');
  assert.deepEqual(waits, [1000, 3000, 8000], 'transient retries use bounded backoff');

  attempts = 0;
  waits.length = 0;
  errors = [httpError(429, { retryAfterMs: 2500 })];
  cooldownUntil = Date.now() + 4000;
  await context.retryPolicy.fetchConversationForExport({ id: 'conversation' });
  assert.equal(attempts, 2, 'export retries a 429 after the shared cooldown');
  assert.ok(waits[0] >= 3900 && waits[0] <= 4000,
    '429 wait follows the persisted account-wide cooldown, not a fixed delay');

  attempts = 0;
  waits.length = 0;
  errors = [httpError(429, { retryAfterMs: 2500 })];
  await assert.rejects(() => context.retryPolicy.fetchConversationForExport(
    { id: 'conversation' }, null, null, { pauseOnRateLimit: true }),
  error => error.status === 429, 'index runner receives 429 to pause at the current checkpoint');
  assert.equal(attempts, 1, 'index rate limit does not retry the same item in a tight loop');
  assert.equal(waits.length, 0, 'index rate limit is delegated to durable task recovery');

  assert.throws(() => context.retryPolicy.buildSearchIndexRecord({ id: 'bad' }, { id: 'bad' }),
    error => error.code === 'E_INDEX_RESPONSE_INVALID', 'missing mapping is recorded as malformed detail data');
  assert.throws(() => context.retryPolicy.buildSearchIndexRecord({ mapping: [] }, { id: 'bad' }),
    error => error.code === 'E_INDEX_RESPONSE_INVALID', 'array mapping is rejected');
  assert.match(popupSource, /限流冷却中：到期后自动继续/,
    'Popup distinguishes automatic rate-limit recovery from a manual pause');
  assert.match(popupSource, /已暂停：连续触发限流，请手动继续/,
    'Popup explains when automatic rate-limit recovery has been exhausted');
  assert.match(popupSource, /\['running', 'paused'\]\.includes\(task\.status\).*task\.waitUntil/s,
    'Popup displays the cooldown countdown while the task is paused');
  console.log('S3_INDEX_RETRY_POLICY_PASS: permanent errors, bounded transient retry, shared 429 cooldown, index pause, malformed data');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
