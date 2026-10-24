/** Isolated Chrome R7 performance baseline: real IDB + production cached exporters. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts/content-chatgpt.js'), 'utf8');
const localDataSource = fs.readFileSync(path.join(root, 'scripts/local-data-store.js'));
function extract(start, stop) {
  const from = source.indexOf(start);
  const to = source.indexOf(stop, from + start.length);
  assert(from >= 0 && to > from, `Missing production exporter segment: ${start}`);
  return source.slice(from, to);
}

// Use production export formatting, CRC32, ZIP volumes and batch accounting.
// The two test-only adapters simulate cache reads and a successful download
// handoff. No network API is mocked as a cache hit or actually requested.
const exporterSource = `(() => {
  'use strict';
  const EXPORT_GROUP_SIZE = 50;
  const EXPORT_VOLUME_MAX_FILES = 50;
  const EXPORT_VOLUME_MAX_BYTES = 24 * 1024 * 1024;
  const EXPORT_REQUEST_GAP_MS = 900;
  const EXPORT_GROUP_GAP_MS = 10000;
  const S = { settings: { exportFilenameTemplate: '{title}' } };
  const timestampValue = value => !value ? 0 : typeof value === 'number'
    ? value < 1e10 ? value * 1000 : value : Date.parse(value) || 0;
  ${extract('  function conversationSourceType(rec)', '  function populateProjectFilter(')}
  ${extract('  function currentBranchMessages(data)', '  function downloadBlobFile(')}
  ${extract('  function crc32(bytes)', '  const sleep =')}
  ${extract('  async function exportConversationBatch(', '  function runtimeMessage(')}
  let cacheHits = 0;
  let detailRequests = 0;
  let files = 0;
  let zipBytes = 0;
  let peakHeap = 0;
  const sampleHeap = () => {
    peakHeap = Math.max(peakHeap, performance.memory?.usedJSHeapSize || 0);
  };
  window.fetch = input => {
    if (String(input).includes('/backend-api/conversation/')) detailRequests++;
    throw Error('Synthetic benchmark forbids HTTP API fetches');
  };
  const fetchConversationForExport = async record => {
    const response = await ChatGPTProLocalData.getConversation('r7-synthetic', record.id, record.updateTime);
    if (!response.hit) throw Error('synthetic cache miss: ' + record.id);
    cacheHits++;
    if (cacheHits % 20 === 0) sampleHeap();
    return { data: response.raw, source: 'cache' };
  };
  const downloadBlobFile = (_name, blob) => {
    files++;
    zipBytes += blob.size;
    sampleHeap();
  };
  const waitForExport = () => { throw Error('cached exports must never wait for network pacing'); };

  window.runR7Export = async (records, format) => {
    cacheHits = detailRequests = files = zipBytes = peakHeap = 0;
    sampleHeap();
    const started = performance.now();
    const result = await exportConversationBatch(records, format);
    sampleHeap();
    return { format, durationMs: performance.now() - started,
      cached: cacheHits, detailRequests, volumes: files, zipBytes,
      successes: result.successCount, failures: result.failureCount, peakHeapBytes: peakHeap };
  };
})();`;

const browserPage = `<!doctype html><meta charset="utf-8"><pre id="result">RUNNING</pre>
<script src="/local-data-store.js"></script>
<script src="/bench-export.js"></script>
<script>
(async () => {
  const storage = window.ChatGPTProLocalData;
  const accountId = 'r7-synthetic';
  const result = [];
  const records = [];
  let peakHeap = 0;
  const sample = () => { peakHeap = Math.max(peakHeap, performance.memory?.usedJSHeapSize || 0); };
  const makeRaw = i => {
    const mapping = {};
    const text = '测试数据 / sample payload ' + String(i).padStart(5, '0') + ' ' + 'value '.repeat(240);
    for (let j = 0; j < 6; j++) {
      const id = 'message-' + j;
      const previous = j ? 'message-' + (j - 1) : null;
      mapping[id] = { id, parent: previous, children: [], message: {
        id, author: { role: j % 2 ? 'assistant' : 'user' },
        create_time: 1770000000 + j, content: { content_type: 'text', parts: [text] }
      } };
      if (previous) mapping[previous].children.push(id);
    }
    return { id: 'perf-' + i, title: '合成对话 ' + i, create_time: 1770000000,
      update_time: 1770000000 + i, current_node: 'message-5', mapping };
  };
  try {
    for (const count of [100, 500, 1000]) {
      const start = performance.now();
      const newlyAdded = [];
      for (let i = records.length; i < count; i++) {
        const raw = makeRaw(i);
        const record = { id: raw.id, title: raw.title, updateTime: raw.update_time,
          createTime: raw.create_time, href: '/c/' + raw.id };
        const messages = Object.values(raw.mapping).map(node => ({
          id: node.message.id, role: node.message.author.role,
          text: node.message.content.parts[0], createTime: node.message.create_time
        }));
        await storage.putConversation(accountId, { id: raw.id, updateTime: record.updateTime, raw,
          searchRecord: { id: raw.id, title: raw.title, updateTime: record.updateTime, messages } });
        records.push(record);
        newlyAdded.push(record);
        if (i % 25 === 0) sample();
      }
      await storage.upsertDirectory(accountId, newlyAdded);
      const seedDurationMs = performance.now() - start;
      const stats = await storage.getStats(accountId);
      if (stats.directory !== count || stats.complete !== count || stats.indexed !== count) {
        throw Error('IDB mismatch ' + count + ': ' + JSON.stringify(stats));
      }
      const json = await window.runR7Export(records, 'json');
      const md = await window.runR7Export(records, 'md');
      const usageBytes = (await navigator.storage.estimate()).usage;
      sample();
      result.push({ count, seedDurationMs,
        totalDurationMs: seedDurationMs + json.durationMs + md.durationMs,
        indexedDb: stats, storageUsageBytes: usageBytes,
        peakHeapBytes: Math.max(peakHeap, json.peakHeapBytes, md.peakHeapBytes), json, md });
    }
    document.getElementById('result').textContent = JSON.stringify({ success: true, result });
  } catch (error) {
    document.getElementById('result').textContent = JSON.stringify({ success: false,
      error: error.stack || error.message });
  }
})();
</script>`;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/' ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8');
  if (req.url === '/local-data-store.js') res.end(localDataSource);
  else if (req.url === '/bench-export.js') res.end(exporterSource);
  else if (req.url === '/') res.end(browserPage);
  else { res.statusCode = 404; res.end('Not found'); }
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function main() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'chatgpt-pro-r7-'));
  const browser = spawn('google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--disable-background-networking', '--no-first-run', '--disable-extensions',
    '--enable-precise-memory-info', `--user-data-dir=${profile}`, '--remote-debugging-port=0',
    `http://127.0.0.1:${server.address().port}/`
  ], { stdio: 'ignore' });
  let ws;
  try {
    let port;
    for (let i = 0; i < 100; i++) {
      const file = path.join(profile, 'DevToolsActivePort');
      if (fs.existsSync(file)) { port = fs.readFileSync(file, 'utf8').split('\n')[0]; break; }
      if (browser.exitCode !== null) throw Error('Chrome exited before DevTools initialization');
      await sleep(100);
    }
    if (!port) throw Error('Chrome did not start DevTools');
    const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    const page = pages.find(item => item.type === 'page');
    if (!page) throw Error('Chrome page target unavailable');
    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    let sequence = 0;
    const evaluate = expression => new Promise((resolve, reject) => {
      const id = ++sequence;
      const callback = event => {
        const message = JSON.parse(event.data);
        if (message.id !== id) return;
        ws.removeEventListener('message', callback);
        if (message.error) reject(Error(message.error.message));
        else resolve(message.result?.result?.value);
      };
      ws.addEventListener('message', callback);
      ws.send(JSON.stringify({ id, method: 'Runtime.evaluate',
        params: { expression, returnByValue: true } }));
    });
    let report;
    for (let i = 0; i < 900; i++) {
      const message = await evaluate('document.querySelector("#result")?.textContent');
      if (message && message !== 'RUNNING') { report = JSON.parse(message); break; }
      await sleep(100);
    }
    assert(report, 'R7 browser benchmark timed out');
    assert.equal(report.success, true, report.error);
    for (const row of report.result) {
      for (const exportRun of [row.json, row.md]) {
        assert.equal(exportRun.cached, row.count);
        assert.equal(exportRun.detailRequests, 0, 'complete cache makes zero detail API requests');
        assert.equal(exportRun.failures, 0);
        assert.equal(exportRun.successes, row.count);
        assert.equal(exportRun.volumes, Math.ceil(row.count / 50));
      }
    }
    const mb = value => (value / 1024 / 1024).toFixed(2);
    console.log('R7_PASS: isolated Chrome IndexedDB + production MD/JSON exporters; no ChatGPT requests');
    console.log('Size | Seed + exports ms | Index seed ms | JSON export ms | MD export ms | Peak sampled JS heap MiB | storage estimate MiB | API details | ZIP (JSON/MD) | Failed');
    for (const row of report.result) {
      console.log(`${row.count} | ${row.totalDurationMs.toFixed(0)} | ${row.seedDurationMs.toFixed(0)} | ${row.json.durationMs.toFixed(0)} | ${row.md.durationMs.toFixed(0)} | ${mb(row.peakHeapBytes)} | ${mb(row.storageUsageBytes)} | 0 | ${row.json.volumes}/${row.md.volumes} | 0`);
    }
    if (process.env.R7_JSON === '1') console.log(JSON.stringify(report.result, null, 2));
  } finally {
    ws?.close();
    browser.kill('SIGTERM');
    server.close();
    await sleep(200);
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

server.listen(0, '127.0.0.1', () => {
  main().catch(error => { console.error('R7_FAIL:', error.stack || error.message); process.exitCode = 1; });
});
