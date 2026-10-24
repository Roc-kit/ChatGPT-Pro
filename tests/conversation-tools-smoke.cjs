/** Targeted tests for the new conversation mutation and image ZIP helpers. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function extract(file, start, end) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, `missing function: ${start}`);
  return source.slice(a, b);
}

const messages = [
  { id: 'u1', author: { role: 'user' }, content: { parts: [
    { content_type: 'image_asset_pointer', asset_pointer: 'file-service://file_one' }
  ] } },
  { id: 'a1', author: { role: 'assistant' }, content: { parts: [
    { content_type: 'image_asset_pointer', asset_pointer: 'file-service://file_two' },
    { content_type: 'image_asset_pointer', asset_pointer: 'file-service://file_one' }
  ] }, metadata: { attachments: [
    { id: 'file_three', mime_type: 'image/png', name: 'demo.png' }
  ] } }
];
const mapping = {
  root: { parent: null },
  user: { parent: 'root', message: messages[0] },
  assistant: { parent: 'user', message: messages[1] },
  otherBranch: { parent: 'user', message: { id: 'unused', author: { role: 'assistant' },
    content: { parts: [{ content_type: 'image_asset_pointer', asset_pointer: 'file-service://not_current' }] } } }
};
const data = { id: 'chat-1', title: 'Images', mapping, current_node: 'assistant' };

async function checkImages() {
  const downloads = [];
  const requested = [];
  const context = {
    Blob, Uint8Array, TextEncoder, Date, URL, AbortController,
    location: { origin: 'https://chatgpt.com' },
    window: {
      APIHandler: {
        getAccountId: async () => 'account-A',
        getConversation: async () => data,
        getConversationImageUrl: async (_chat, id) => {
          requested.push(id);
          if (id === 'file_two') throw new Error('404 image expired');
          return { download_url: `https://images.example.org/${id}`, mime_type: 'image/png' };
        }
      },
      setTimeout, clearTimeout
    },
    fetch: async () => ({ ok: true, headers: { get: () => 'image/png' },
      arrayBuffer: async () => Uint8Array.from([137, 80, 78, 71, 1]).buffer }),
    exportBaseFilename: () => 'images-chat',
    conversationUrl: () => 'https://chatgpt.com/c/chat-1',
    downloadBlobFile: (name, blob) => downloads.push({ name, blob }),
    sleep: async () => {}
  };
  vm.createContext(context);
  vm.runInContext([
    extract('scripts/content-chatgpt.js', '  function currentBranchMessages(data)', '  function messageText('),
    extract('scripts/content-chatgpt.js', '  function crc32(bytes)', '  function uniqueFilename('),
    'globalThis.run = exportConversationImages; globalThis.collect = collectConversationImages;'
  ].join('\n'), context);
  const found = context.collect(data);
  assert.deepEqual(Array.from(found, image => image.fileId), ['file_one', 'file_two', 'file_three']);
  const result = await context.run({ id: 'chat-1', title: 'Images' });
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { total: 3, success: 2, failures: 1, volumes: 1 });
  assert.deepEqual(requested, ['file_one', 'file_two', 'file_three']);
  assert.equal(downloads.length, 1);
  const bytes = Buffer.from(await downloads[0].blob.arrayBuffer());
  assert.equal(bytes.readUInt32LE(0), 0x04034b50);
  assert(bytes.includes(Buffer.from('manifest.json')));
  assert(bytes.includes(Buffer.from('download-errors.txt')));
  assert(bytes.includes(Buffer.from('images/001_user_1.png')));
  assert(bytes.includes(Buffer.from('images/003_assistant_2.png')));
  assert(!bytes.includes(Buffer.from('not_current')));
}

async function checkMutations() {
  const requests = [];
  const cooloffs = [];
  let onAccount = 'account-A';
  let rateLimited = true;
  const context = {
    CFG: { MAX_RETRIES: 3, TIMEOUT_MS: 1000, RETRY_BASE_MS: 1 },
    baseUrl: () => 'https://chatgpt.com/backend-api',
    getSessionIdentity: async () => ({ accountId: onAccount, token: 'token' }),
    getAccountId: async () => onAccount,
    waitForSharedCooldown: async () => {},
    localDataMessage: async msg => { cooloffs.push(msg); },
    retryAfterMs: () => 500,
    sleep: async () => {},
    AbortController, setTimeout, clearTimeout, JSON, encodeURIComponent,
    fetch: async (url, init) => {
      requests.push({ url, init });
      if (rateLimited) {
        rateLimited = false;
        return { ok: false, status: 429, headers: { get: () => '1' } };
      }
      return { ok: true, status: 200 };
    }
  };
  vm.createContext(context);
  vm.runInContext(`${extract('scripts/api-handler.js', '  async function setConversationState(', '  // Resolve file asset pointers')}
    globalThis.run = setConversationState;`, context);
  await context.run('c1', 'delete', 'account-A');
  assert.equal(requests.length, 2, '429 retried after recording shared cooldown');
  assert.equal(cooloffs[0].action, 'directoryRateLimited');
  assert.deepEqual(JSON.parse(requests[1].init.body), { is_visible: false });
  await context.run('c2', 'archive', 'account-A');
  assert.deepEqual(JSON.parse(requests[2].init.body), { is_archived: true });
  onAccount = 'account-B';
  await assert.rejects(context.run('c3', 'delete', 'account-A'), /登录账号已切换/);
  assert.equal(requests.length, 3, 'account mismatch never sent a mutation');
}

(async () => {
  await checkImages();
  await checkMutations();
  console.log('CONVERSATION_TOOLS_PASS: image extraction, ZIP, partial failures, 429 retry, account isolation');
})().catch(error => { console.error(error); process.exitCode = 1; });
