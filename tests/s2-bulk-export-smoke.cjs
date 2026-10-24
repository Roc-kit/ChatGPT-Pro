/** Exercise the production ZIP writer and batch exporter without ChatGPT API. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../scripts/content-chatgpt.js'), 'utf8');
function extract(begin, end) {
  const start = source.indexOf(begin);
  const stop = source.indexOf(end, start + begin.length);
  assert(start >= 0 && stop > start, `missing production function ${begin}`);
  return source.slice(start, stop);
}

function zipEntries(blob) {
  return blob.arrayBuffer().then(arrayBuffer => {
    const bytes = Buffer.from(arrayBuffer);
    const entries = new Map();
    let pos = 0;
    while (pos + 30 <= bytes.length && bytes.readUInt32LE(pos) === 0x04034b50) {
      assert.equal(bytes.readUInt16LE(pos + 8), 0, 'stored ZIP without compression');
      const size = bytes.readUInt32LE(pos + 18);
      const nameLen = bytes.readUInt16LE(pos + 26);
      const extraLen = bytes.readUInt16LE(pos + 28);
      const name = bytes.toString('utf8', pos + 30, pos + 30 + nameLen);
      const dataPos = pos + 30 + nameLen + extraLen;
      assert(dataPos + size <= bytes.length, `truncated ZIP entry ${name}`);
      assert(!entries.has(name), `duplicate ZIP entry ${name}`);
      entries.set(name, bytes.subarray(dataPos, dataPos + size));
      pos = dataPos + size;
    }
    assert.equal(bytes.readUInt32LE(pos), 0x02014b50, 'central directory exists');
    return entries;
  });
}

function makeHarness(options = {}) {
  const downloads = [];
  const delays = [];
  let networkCalls = 0;
  const context = {
    Blob, TextEncoder, Uint8Array, Date, console,
    EXPORT_GROUP_SIZE: 50,
    EXPORT_VOLUME_MAX_FILES: 50,
    EXPORT_VOLUME_MAX_BYTES: 24 * 1024 * 1024,
    EXPORT_GROUP_GAP_MS: 10000,
    EXPORT_REQUEST_GAP_MS: 900,
    fetchConversationForExport: async rec => {
      if (rec.fail) throw new Error('controlled item failure');
      if (rec.source === 'network') networkCalls++;
      return { data: { id: rec.id, title: rec.title, payload: 'sample' }, source: rec.source || 'cache' };
    },
    exportBaseFilename: rec => rec.filename || rec.title || rec.id,
    buildConversationJson: (data, rec) => JSON.stringify({ conversation: data, id: rec.id }),
    buildConversationMarkdown: (data, rec) => `# ${rec.title}\n\n${data.payload}\n`,
    waitForExport: async (ms, progress, status) => { delays.push({ ms, status }); },
    downloadBlobFile: (filename, blob) => {
      if (options.throwAtVolume === downloads.length + 1) throw new Error('simulated download failure');
      downloads.push({ filename, blob });
    }
  };
  vm.createContext(context);
  vm.runInContext(`${extract('  function crc32(bytes)', '  const sleep =')}\n${extract('  async function exportConversationBatch(', '  function runtimeMessage(')}\nglobalThis.runBatch = exportConversationBatch;`, context);
  return { context, downloads, delays, getNetworkCalls: () => networkCalls };
}

async function main() {
  {
    const harness = makeHarness();
    const records = Array.from({ length: 100 }, (_, i) => ({ id: `id-${i}`, title: `Chat ${i}`, filename: 'same' }));
    const result = await harness.context.runBatch(records, 'json');
    assert.equal(result.successCount, 100);
    assert.equal(result.failureCount, 0);
    assert.equal(result.volumeCount, 2);
    assert.equal(harness.downloads.length, 2);
    assert.equal(harness.delays.length, 0, '100 cached conversations have zero artificial pacing');
    assert.equal(harness.getNetworkCalls(), 0, 'cached export makes zero detail API requests');
    const first = await zipEntries(harness.downloads[0].blob);
    const last = await zipEntries(harness.downloads[1].blob);
    assert.equal(first.size, 51, '50 chats plus manifest in part one');
    assert.equal(last.size, 51, '50 chats plus manifest in part two');
    const firstManifest = JSON.parse(first.get('manifest.json').toString());
    const lastManifest = JSON.parse(last.get('manifest.json').toString());
    assert.equal(firstManifest.scope, 'volume');
    assert.equal(firstManifest.conversations.length, 50);
    assert.equal(lastManifest.scope, 'complete');
    assert.equal(lastManifest.conversations.length, 100);
    assert.equal(lastManifest.conversations[0].filename, 'same.json');
    assert.equal(lastManifest.conversations[1].filename, 'same (2).json');
    assert.equal(lastManifest.conversations[99].volume, 2);
    const allNames = new Set([...first.keys(), ...last.keys()]);
    assert(allNames.has('same (100).json'), 'filenames unique across volumes');
    assert(harness.downloads[0].filename.endsWith('_part001.zip'));
    assert(harness.downloads[1].filename.endsWith('_part002.zip'));
  }
  {
    const harness = makeHarness();
    const result = await harness.context.runBatch([
      { id: 'ok', title: 'ok' }, { id: 'bad', title: 'bad', fail: true }
    ], 'md');
    assert.equal(result.successCount, 1);
    assert.equal(result.failureCount, 1);
    const zip = await zipEntries(harness.downloads[0].blob);
    assert(zip.has('ok.md'));
    assert(zip.has('导出失败.txt'));
    const manifest = JSON.parse(zip.get('manifest.json').toString());
    assert.equal(manifest.conversations[1].status, 'failed');
    assert.equal(manifest.conversations[1].filename, null);
    assert.equal(manifest.failure_count, 1);
  }
  {
    const harness = makeHarness();
    await harness.context.runBatch([{ id: 'a', title: 'a', fail: true }], 'json');
    const zip = await zipEntries(harness.downloads[0].blob);
    assert.equal(zip.size, 2, 'all-failed run still produces manifest and failure list');
  }
  {
    const harness = makeHarness();
    // One record may exceed the soft byte cap, but no two large records may
    // accumulate in one volume. Avoid generating many full-size fixtures.
    harness.context.buildConversationJson = () => 'X'.repeat(13 * 1024 * 1024);
    const result = await harness.context.runBatch([
      { id: 'large-1', title: 'First' }, { id: 'large-2', title: 'Second' }
    ], 'json');
    assert.equal(result.volumeCount, 2, '24 MiB per-volume soft limit honored');
    const partOne = await zipEntries(harness.downloads[0].blob);
    assert(partOne.has('First.json'));
    assert(!partOne.has('Second.json'));
  }
  {
    const harness = makeHarness();
    const records = [{ id: 'remote', title: 'Network', source: 'network' }, { id: 'local', title: 'Cached' }];
    await harness.context.runBatch(records, 'md');
    assert.equal(harness.getNetworkCalls(), 1);
    assert.equal(harness.delays.length, 1, 'only real network operations require pacing');
    await assert.rejects(() => harness.context.runBatch([], 'md'), /没有可导出的聊天/);
  }
  {
    const harness = makeHarness({ throwAtVolume: 2 });
    await assert.rejects(() => harness.context.runBatch(
      Array.from({ length: 100 }, (_, i) => ({ id: String(i) })), 'json'
    ), /simulated download failure/);
    assert.equal(harness.downloads.length, 1, 'previously created volume remains available');
    assert.equal((await zipEntries(harness.downloads[0].blob)).size, 51);
  }
  console.log('S2_PASS: two ZIP volumes, 100 cache hits, complete manifest, failures, partial preservation');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
