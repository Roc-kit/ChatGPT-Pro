'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../scripts/content-chatgpt.js'), 'utf8');
const storageSource = fs.readFileSync(path.join(__dirname, '../scripts/local-data-store.js'), 'utf8');

function extract(text, start, end) {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert(from >= 0 && to > from, `missing source section: ${start}`);
  return text.slice(from, to);
}

const branchAndVisibility = extract(source,
  '  function currentBranchMessages(data) {', '  function messageText(message) {');
const messageText = extract(source,
  '  function messageText(message) {', '  function toolNameFromPath(');
const buildIndex = extract(source,
  '  function buildSearchIndexRecord(data, rec) {', '  const INDEX_EXECUTOR_ID =');
const updateIndex = extract(source,
  '  async function updateFullTextIndex(records, onProgress, options = {}) {',
  '  async function updateIndexWithConsent(');

const timestampValue = value => {
  const number = Number(value || 0);
  return number && number < 1e10 ? number * 1000 : number;
};

let metadataRecords = [];
const indexCalls = [];
const indexContext = {
  timestampValue,
  window: { APIHandler: { getAccountId: async () => 'account-A' } },
  runtimeMessage: async message => {
    if (message.action === 'indexPolicyGet') return { result: { skippedIndexIds: [] } };
    if (message.action === 'searchIndexMetadata') return { records: metadataRecords };
    throw new Error(`unexpected runtime message: ${message.action}`);
  },
  indexTaskMessage: async (action, accountId, fields = {}) => {
    indexCalls.push({ action, accountId, ...fields });
    if (action === 'taskList') return [];
    if (action === 'taskCreate') return { id: 'index-task-1', status: 'pending' };
    throw new Error(`unexpected task action: ${action}`);
  },
  runIndexTask: async () => ({ indexedCount: 1, failures: [] })
};
vm.createContext(indexContext);
vm.runInContext(`${branchAndVisibility}\n${messageText}\n${buildIndex}\n${updateIndex}\n`
  + 'globalThis.build = buildSearchIndexRecord;\n'
  + 'globalThis.visible = isUserVisibleMessage;\n'
  + 'globalThis.update = updateFullTextIndex;', indexContext);

const message = (id, role, text, extra = {}) => ({
  id, author: { role }, create_time: extra.time || 1,
  content: { content_type: 'text', parts: [text] }, ...extra
});

const data = {
  id: 'chat-1', title: 'Visible conversation', current_node: 'final', update_time: 20,
  mapping: {
    multimodal: { parent: null, message: message('multimodal', 'user', 'image question', {
      content: { content_type: 'multimodal_text', parts: [
        'image question', { content_type: 'image_asset_pointer', asset_pointer: 'file-service://image' }
      ] }
    }) },
    user: { parent: 'multimodal', message: message('user', 'user', 'visible user question') },
    toolCall: { parent: 'user', message: message('tool-call', 'assistant',
      'internal tool command containing minimap', { recipient: 'python', channel: 'analysis', time: 2 }) },
    toolResult: { parent: 'toolCall', message: message('tool-result', 'tool',
      'internal tool output containing minimap', { time: 3 }) },
    hiddenCode: { parent: 'toolResult', message: message('hidden-code', 'assistant',
      'internal code payload containing minimap', {
        recipient: 'all', channel: 'commentary', time: 3.5,
        content: { content_type: 'code', parts: ['internal code payload containing minimap'] }
      }) },
    hiddenMetadata: { parent: 'hiddenCode', message: message('hidden-metadata', 'assistant',
      'visually hidden internal content', { metadata: { is_visually_hidden_from_conversation: true } }) },
    commentary: { parent: 'hiddenMetadata', message: message('commentary', 'assistant',
      'visible commentary response', { recipient: 'all', channel: 'commentary', time: 4 }) },
    final: { parent: 'commentary', message: message('final', 'assistant',
      'visible final answer', { recipient: 'all', channel: 'final', time: 5 }) },
    otherBranch: { parent: 'user', message: message('other', 'assistant',
      'abandoned branch minimap text', { recipient: 'all', channel: 'final', time: 6 }) }
  }
};

const record = indexContext.build(data, { id: 'chat-1', updateTime: 10 });
assert.equal(record.schemaVersion, 2, 'new content rules receive a new index schema version');
assert.equal(record.updateTime, 20000, 'detail JSON version wins over a stale directory version');
assert.deepEqual(JSON.parse(JSON.stringify(record.messages.map(item => item.id))),
  ['multimodal', 'user', 'commentary', 'final'],
  'index contains only visible user/assistant messages on the current branch');
assert.equal(record.messages[0].text, 'image question\n\n[图片]',
  'visible multimodal text and image placeholders remain searchable');
assert(!record.messages.some(item => /tool command|tool output|internal code|visually hidden|abandoned branch/.test(item.text)));

const hiddenSamples = [
  message('tool', 'tool', 'tool result'),
  message('tool-call', 'assistant', 'tool call', { recipient: 'python', channel: 'analysis' }),
  message('analysis', 'assistant', 'private reasoning', { channel: 'analysis' }),
  message('hidden', 'assistant', 'hidden message', {
    metadata: { is_visually_hidden_from_conversation: true }
  }),
  message('code', 'assistant', 'code payload', {
    content: { content_type: 'code', parts: ['code payload'] }
  })
];
assert(hiddenSamples.every(sample => !indexContext.visible(sample)),
  'tool, analysis, visually hidden and non-text messages are excluded');
assert(indexContext.visible(message('commentary', 'assistant', 'visible', { channel: 'commentary' })));
assert(indexContext.visible(message('multimodal', 'user', 'visible', {
  content: { content_type: 'multimodal_text', parts: ['visible'] }
})));

const minimapStart = source.indexOf('  function minimapMessages(data, rendered) {');
const minimapEnd = source.indexOf('\n  function minimapSample(', minimapStart + 1);
assert(minimapStart >= 0 && minimapEnd > minimapStart);
assert(source.slice(minimapStart, minimapEnd).includes('.filter(isUserVisibleMessage)'),
  'minimap and full-text indexing share the same user-visible message filter');

async function checkIndexSchemaRefresh() {
  const records = [{ id: 'chat-1', updateTime: 20 }];
  metadataRecords = [{ id: 'chat-1', updateTime: 20000, schemaVersion: 1 }];
  indexCalls.length = 0;
  await indexContext.update(records);
  const created = indexCalls.find(call => call.action === 'taskCreate');
  assert(created, 'an old schema is reindexed even when its conversation timestamp is unchanged');
  assert.equal(created.items.length, 1);

  metadataRecords = [{ id: 'chat-1', updateTime: 25000, schemaVersion: 2 }];
  indexCalls.length = 0;
  const unchanged = await indexContext.update(records);
  assert.equal(unchanged.skippedCount, 1,
    'current schema ahead of a lagging directory timestamp skips redundant indexing');
  assert(!indexCalls.some(call => call.action === 'taskCreate'));

  metadataRecords = [{ id: 'chat-1', updateTime: 10000, schemaVersion: 2 }];
  indexCalls.length = 0;
  await indexContext.update(records);
  assert(indexCalls.some(call => call.action === 'taskCreate'),
    'a changed conversation version still triggers reindexing');
}

const cleanSearchRecord = extract(storageSource,
  '  function cleanSearchRecord(accountId, record, origin = \'text-only\') {',
  '  async function putSearchRecord(');
const getSearchMetadata = extract(storageSource,
  '  async function getSearchMetadata(accountId) {', '  async function getSearchRecords(');
const storageContext = {
  STORES: { search: 'search' },
  IDBKeyRange: { only: value => value },
  validateAccount: value => value,
  validateId: value => value,
  normalizeTime: timestampValue,
  requested: value => value,
  storedRecords: [
    { id: 'chat-1', updateTime: 20000, indexedAt: 123, schemaVersion: 2 },
    { id: 'legacy', updateTime: 10000, indexedAt: 100, schemaVersion: undefined }
  ],
  transaction: async (_stores, _mode, callback) => callback({
    search: { index: () => ({ getAll: () => Promise.resolve(storageContext.storedRecords) }) }
  })
};
vm.createContext(storageContext);
vm.runInContext(`${cleanSearchRecord}\n${getSearchMetadata}\n`
  + 'globalThis.clean = cleanSearchRecord;\n'
  + 'globalThis.metadata = getSearchMetadata;', storageContext);

const storedRecord = storageContext.clean('account-A', {
  id: 'chat-1', updateTime: 20, schemaVersion: 2,
  messages: [{ id: 'message-1', role: 'user', text: 'visible text' }]
});
assert.equal(storedRecord.schemaVersion, 2, 'storage preserves the search schema version');

async function checkStorageMetadata() {
  const metadata = await storageContext.metadata('account-A');
  assert.equal(metadata.find(item => item.id === 'chat-1').schemaVersion, 2);
  assert.equal(metadata.find(item => item.id === 'legacy').schemaVersion, 0,
    'existing records without a schema version are recognized as outdated');
}

(async () => {
  await checkIndexSchemaRefresh();
  await checkStorageMetadata();
  console.log('SEARCH_INDEX_CONTENT_PASS: visible current-branch messages, shared minimap filter and schema rebuild');
})().catch(error => { console.error(error); process.exitCode = 1; });
