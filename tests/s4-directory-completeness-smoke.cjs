/** Strict first-run directory pagination must not claim partial scans as complete. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../scripts/api-handler.js'), 'utf8');
const begin = source.indexOf('  async function fetchRegularIncremental(');
const end = source.indexOf('  async function fetchProjects(', begin);
assert(begin >= 0 && end > begin);

let pageData = { items: [{ id: 'single' }], total: 3 };
const ctx = {
  URL,
  CFG: { PAGE_SIZE: 3, MAX_PAGES: 2, INTER_PAGE_MS: 0 },
  baseUrl: () => 'https://chatgpt.com/backend-api',
  recordFromItem: item => ({ id: item.id, updateTime: item.update_time || 1 }),
  sameUpdate: (cached, item) => Boolean(cached && cached.updateTime === item.updateTime),
  fetchAuthedJson: async () => pageData,
  sleep: async () => {}
};
vm.createContext(ctx);
vm.runInContext(`${source.slice(begin, end)}\nglobalThis.fetchFirstPage = fetchRegularIncremental;`, ctx);

(async () => {
  const partial = await ctx.fetchFirstPage('', new Map(), true, false);
  assert.equal(partial.length, 1, 'normal incremental path tolerates partial list');
  await assert.rejects(() => ctx.fetchFirstPage('', new Map(), true, true), /分页提前结束/,
    'strict initial scan rejects a partial page when official total exceeds returned results');
  pageData = { items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], total: 9 };
  await assert.rejects(() => ctx.fetchFirstPage('', new Map(), true, true), /分页上限/,
    'strict initial scan rejects nonterminating pagination at configured limit');
  pageData = { items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], total: 3 };
  const exact = await ctx.fetchFirstPage('', new Map(), true, true);
  assert.equal(exact.length, 3, 'exactly full final page is a valid completed scan');
  console.log('S4_DIRECTORY_PASS: partial page rejected, page cap rejected, exact total accepted');
})().catch(error => { console.error(error); process.exitCode = 1; });
