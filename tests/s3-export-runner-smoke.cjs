/** Real export code over JSON-serialized extension messages, with a simulated tab restart. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');

const source = fs.readFileSync(path.join(__dirname, '../scripts/content-chatgpt.js'), 'utf8');
const extract = (start, end) => {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, `missing production function: ${start}`);
  return source.slice(a, b);
};

const items = Array.from({ length: 55 }, (_, index) => ({
  id: `chat-${index}`, title: `Chat ${index}`, updateTime: 1700000000000 + index
}));
const taskId = randomUUID();
const job = {
  id: taskId, accountId: 'account-A', type: 'export-json', items,
  nextIndex: 0, volumeCount: 0, exportEntries: [], status: 'pending',
  successCount: 0, failureCount: 0, errors: [], createdAt: Date.now(), lease: null
};
const saved = new Map();
const staging = new Map();
const fetched = [];
const downloaded = [];
let crashBeforeFirstDownload = true;
let rejectWithAuth = false;
let forceItemError = false;
let largeBody = false;
let chunkCalls = 0;

function getEntries(bytes) {
  const result = new Map();
  let at = 0;
  while (at + 30 <= bytes.length && bytes.readUInt32LE(at) === 0x04034b50) {
    const size = bytes.readUInt32LE(at + 18);
    const n = bytes.readUInt16LE(at + 26);
    const name = bytes.toString('utf8', at + 30, at + 30 + n);
    const from = at + 30 + n;
    result.set(name, bytes.subarray(from, from + size));
    at = from + size;
  }
  assert.equal(bytes.readUInt32LE(at), 0x02014b50, 'saved ZIP has central directory');
  return result;
}

async function runtimeMessage(original) {
  // Chrome uses JSON serialization, not structured clone, for messages.
  const msg = JSON.parse(JSON.stringify(original));
  const deny = () => { throw new Error('任务租约已失效'); };
  const validateLease = () => {
    if (job.status !== 'running' || job.lease?.token !== msg.token || job.lease?.owner !== msg.owner) deny();
  };
  switch (msg.action) {
    case 'taskClaim': {
      if (job.status === 'completed' || (job.lease?.expiresAt || 0) > Date.now()) {
        return { success: true, result: { acquired: false } };
      }
      job.status = 'running';
      job.lease = { owner: msg.owner, token: randomUUID(), expiresAt: Date.now() + 30000 };
      return { success: true, result: { acquired: true, token: job.lease.token,
        task: JSON.parse(JSON.stringify(job)) } };
    }
    case 'taskHeartbeat':
      validateLease();
      job.lease.expiresAt = Date.now() + 30000;
      return { success: true, result: {} };
    case 'taskControl':
      assert.equal(msg.operation, 'pause');
      job.status = 'paused';
      job.lease = null;
      return { success: true, result: { task: job } };
    case 'taskVolumeChunk':
      validateLease();
      chunkCalls++;
      staging.set(`${msg.volume}:${msg.index}`, { token: msg.token, base64: msg.base64 });
      return { success: true, result: { uploaded: true } };
    case 'taskVolumeFinish': {
      validateLease();
      const p = msg.payload;
      assert.equal(p.volume, job.volumeCount + 1);
      assert.equal(p.entries.length, p.toIndex - job.nextIndex);
      for (let i = 0; i < p.entries.length; i++) {
        assert.equal(p.entries[i].id, job.items[job.nextIndex + i].id);
      }
      const parts = [];
      for (let index = 0; index < p.chunkCount; index++) {
        const chunk = staging.get(`${p.volume}:${index}`);
        assert(chunk && chunk.token === msg.token);
        parts.push(Buffer.from(chunk.base64, 'base64'));
        staging.delete(`${p.volume}:${index}`);
      }
      saved.set(p.volume, { filename: p.filename, bytes: Buffer.concat(parts) });
      job.nextIndex = p.toIndex;
      job.volumeCount = p.volume;
      job.exportEntries.push(...p.entries);
      job.successCount += p.entries.filter(entry => entry.status === 'success').length;
      job.failureCount += p.entries.filter(entry => entry.status === 'failed').length;
      if (job.nextIndex === job.items.length) { job.status = 'completed'; job.lease = null; }
      return { success: true, result: { nextIndex: job.nextIndex, volumeCount: job.volumeCount } };
    }
    case 'taskVolumeGet': {
      const volume = saved.get(msg.volume);
      return { success: true, result: volume && { filename: volume.filename, size: volume.bytes.length } };
    }
    case 'taskVolumeRead': {
      const volume = saved.get(msg.volume);
      const slice = volume.bytes.subarray(msg.offset, msg.offset + msg.size);
      return { success: true, result: { base64: slice.toString('base64'), size: volume.bytes.length } };
    }
    default: throw Error('Unexpected runtime message: ' + msg.action);
  }
}

function buildContext() {
  const context = {
    Blob, Uint8Array, TextEncoder, Date, console, atob, btoa,
    crypto: { randomUUID },
    EXPORT_GROUP_SIZE: 50, EXPORT_VOLUME_MAX_FILES: 50,
    EXPORT_VOLUME_MAX_BYTES: 24 * 1024 * 1024,
    EXPORT_GROUP_GAP_MS: 10000, EXPORT_REQUEST_GAP_MS: 900,
    S: { settings: { enabled: true } },
    log() {}, runtimeMessage,
    window: {
      APIHandler: { getAccountId: async () => 'account-A' },
      setInterval: () => 1, clearInterval() {}
    },
    async fetchConversationForExport(record) {
      if (forceItemError) throw new Error('temporary mocked item failure');
      if (rejectWithAuth) {
        const error = new Error('Unauthorized');
        error.status = 401;
        throw error;
      }
      fetched.push(record.id);
      return { data: { id: record.id, title: record.title, mapping: {} }, source: 'cache' };
    },
    exportBaseFilename: () => 'duplicate',
    buildConversationJson: (_data, record) => JSON.stringify({ id: record.id,
      text: largeBody ? 'X'.repeat(650000) : 'cached full JSON' }),
    buildConversationMarkdown: (_data, record) => `# ${record.id}\n`,
    async waitForExport() {
      if (forceItemError) return;
      throw Error('cached ZIP export should never pace network');
    },
    downloadBlobFile(filename, blob) {
      if (crashBeforeFirstDownload) {
        crashBeforeFirstDownload = false;
        throw Error('simulated page destruction after first durable volume');
      }
      downloaded.push({ filename, blob });
    }
  };
  vm.createContext(context);
  vm.runInContext(`${extract('  function crc32(bytes)', '  const sleep =')}\n${extract('  async function uploadTaskZipVolume(', '  function runtimeMessage(')}\nglobalThis.exportTest = { runExportTask, downloadTaskZipVolume };`, context);
  return context;
}

async function main() {
  const firstTab = buildContext();
  await assert.rejects(() => firstTab.exportTest.runExportTask('account-A', taskId),
    /simulated page destruction/);
  assert.equal(job.nextIndex, 50, 'task cursor moved only after ZIP was durable');
  assert.equal(job.volumeCount, 1);
  assert.equal(saved.size, 1, 'first ZIP still exists after page destruction');
  assert.equal(fetched.length, 50);
  assert.equal(downloaded.length, 0, 'download was never claimed as saved');

  job.lease.expiresAt = Date.now() - 100;
  const secondTab = buildContext();
  const result = await secondTab.exportTest.runExportTask('account-A', taskId, null, true);
  assert.equal(result.successCount, 55);
  assert.equal(result.volumeCount, 2);
  assert.equal(job.status, 'completed');
  assert.equal(saved.size, 2, 'both ZIP volumes persisted after recovery');
  assert.deepEqual(fetched, items.map(row => row.id), 'no already checkpointed conversation refetched');
  assert.equal(downloaded.length, 0, 'automatic recovery does not trigger downloads');

  const first = getEntries(saved.get(1).bytes);
  const last = getEntries(saved.get(2).bytes);
  assert.equal(first.size, 51);
  assert.equal(last.size, 6);
  const manifest = JSON.parse(last.get('manifest.json').toString());
  assert.equal(manifest.conversations.length, 55);
  assert.equal(manifest.conversations[50].volume, 2);
  assert(last.has('duplicate (55).json'), 'deduped filenames preserved across page reload');
  await secondTab.exportTest.downloadTaskZipVolume('account-A', taskId, 1);
  assert.equal(downloaded.length, 1, 'stored volume can be re-downloaded on request');
  assert(Buffer.from(await downloaded[0].blob.arrayBuffer()).equals(saved.get(1).bytes),
    'downloaded ZIP bytes match persisted ZIP exactly');
  // An auth failure must leave the task paused instead of checkpointing the
  // conversation as an ordinary export failure.
  job.items = [{ id: 'auth-required', title: 'Auth required' }];
  job.nextIndex = 0;
  job.volumeCount = 0;
  job.exportEntries = [];
  job.status = 'pending';
  job.lease = null;
  job.successCount = 0;
  job.failureCount = 0;
  rejectWithAuth = true;
  const authTab = buildContext();
  await assert.rejects(() => authTab.exportTest.runExportTask('account-A', taskId), /导出任务已暂停/);
  assert.equal(job.status, 'paused');
  assert.equal(job.nextIndex, 0, 'auth failure cannot skip uncached conversation');

  rejectWithAuth = false;
  largeBody = true;
  job.status = 'pending';
  job.lease = null;
  const beforeChunkCount = chunkCalls;
  const largeTab = buildContext();
  await largeTab.exportTest.runExportTask('account-A', taskId);
  assert(chunkCalls - beforeChunkCount >= 3, 'large ZIP crosses the JSON-safe upload chunk boundary');
  assert.equal(staging.size, 0, 'committed upload staging chunks are fully consumed');
  assert(getEntries(saved.get(1).bytes).get('duplicate.json').length > 650000);

  // B: stop after three consecutive item failures, but persist the partial
  // ZIP manifest and cursor so an explicitly resumed job starts at item 4.
  job.items = ['fail-1', 'fail-2', 'fail-3', 'recover-4'].map(id => ({ id, title: id }));
  job.nextIndex = 0;
  job.volumeCount = 0;
  job.exportEntries = [];
  job.status = 'pending';
  job.lease = null;
  job.successCount = 0;
  job.failureCount = 0;
  job.consecutiveFailures = 0;
  forceItemError = true;
  largeBody = false;
  saved.clear();
  const failedTab = buildContext();
  await assert.rejects(() => failedTab.exportTest.runExportTask('account-A', taskId, null, true),
    /连续 3 条处理失败/);
  assert.equal(job.status, 'paused');
  assert.equal(job.nextIndex, 3, 'failed items persisted before pausing');
  assert.equal(job.volumeCount, 1);
  const failedManifest = JSON.parse(getEntries(saved.get(1).bytes).get('manifest.json').toString());
  assert.equal(failedManifest.conversations.length, 3, 'failure volume retained for export on demand');
  assert(failedManifest.conversations.every(entry => entry.status === 'failed'));
  forceItemError = false;
  job.status = 'pending'; // Explicit user resume.
  job.lease = null;
  job.consecutiveFailures = 0;
  const resumedTab = buildContext();
  const recovered = await resumedTab.exportTest.runExportTask('account-A', taskId, null, true);
  assert.equal(recovered.successCount, 1);
  assert.equal(job.status, 'completed');
  assert.equal(job.nextIndex, 4);
  assert.equal(saved.size, 2, 'partial failed ZIP and resumed successful ZIP remain separate');
  console.log('S3_EXPORT_PASS: atomic durable ZIP, page restart, 55 files, JSON-safe chunks, manual redownload');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
