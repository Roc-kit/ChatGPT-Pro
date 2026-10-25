/** Source audit: detect Chinese literals with a wildcard, not a runtime
 * wildcard replacement that would corrupt conversations and exported data.
 * Keep the English catalog complete for every static UI/error literal.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadLocales } = require('./load-locales.cjs');

const root = path.resolve(__dirname, '..');
const host = { navigator: { language: 'en' }, chrome: { i18n: { getUILanguage: () => 'en' } } };
host.window = host;
const i18n = loadLocales(host);
const files = ['popup/popup.html', 'popup/popup.js', 'scripts/content-chatgpt.js',
  'scripts/api-handler.js', 'scripts/background.js', 'scripts/local-data-store.js'];
// Exported Markdown markers and deliberate demo fixture text aren't UI.
const contentExceptions = new Set(['[图片]', '[音频]', 'NocoBase 官方 Demo 分析']);
const uncovered = [];
let staticCount = 0;
let dynamicCount = 0;
for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  // Scan quote/backtick literals containing any CJK character. Interpolated
  // literals require explicit named-template tests rather than guesswork.
  for (const match of source.matchAll(/(['"`])((?:\\.|(?!\1)[^\n])*?[\u3400-\u9fff](?:\\.|(?!\1)[^\n])*?)\1/g)) {
    const value = match[2];
    const line = source.slice(0, match.index).split('\n').length;
    if (value.includes('${') || value.includes('<') || value.length > 140 || value.includes('\\')) {
      dynamicCount++;
      continue;
    }
    staticCount++;
    if (contentExceptions.has(value)) continue;
    const translated = i18n.translateText(value);
    if (/[\u3400-\u9fff]/u.test(translated)) uncovered.push(`${file}:${line}: ${value}`);
  }
}
assert.deepEqual(uncovered, [], `Untranslated hardcoded UI literals:\n${uncovered.join('\n')}`);

for (const language of ['en', 'es', 'hi', 'ar', 'pt-BR', 'bn', 'id', 'fr', 'ru', 'ja']) {
  i18n.setLanguage(language);
  const dynamicCases = [
    '当前账号已索引 119 / 119 个 · 未归属旧索引 104 个',
    '正在归档 8 / 30 · 成功 6、失败 1',
    '3/10 · 成功 2 · 失败 1',
    '3/10 · 成功 2 · 失败 1 · ZIP 4 卷',
    '第 2 个 ZIP 已保存并发起下载 · 10 / 20',
    '请求失败 · 18 秒后重试 2 / 3 · 10 / 20 · 第 1 / 2 组',
    '已从当前账号清除 119 条全文搜索索引；其他数据保持不变',
    '账号请求冷却中 · 剩余 15 秒 · 到期后可自动继续',
    ' · 等待账号限流冷却',
    ' · 等待结束，正在恢复'
  ];
  for (const value of dynamicCases) {
    const converted = i18n.translateText(value);
    assert.notEqual(converted, value, `${language}: ${value} -> ${converted}`);
    if (language !== 'ja') {
      assert(!/[\u3400-\u9fff]/u.test(converted), `${language}: ${value} -> ${converted}`);
    }
  }
  const confirmation = i18n.format('确定{action}选中的 {count} 条对话？\n\n{detail}\n\n操作可能持续一段时间，失败的条目会保留供重试。',
    { action: i18n.t('永久删除'), count: 3, detail: i18n.t('归档只影响 ChatGPT 云端的对话列表，不会清理扩展本地数据。') });
  assert.notEqual(confirmation, '确定永久删除选中的 3 条对话？', `${language}: untranslated confirmation`);
  if (language !== 'ja') assert(!/[\u3400-\u9fff]/u.test(confirmation), `${language}: untranslated confirmation`);
}
console.log(`I18N_SOURCE_PASS: scanned ${files.length} files, ${staticCount} static and ${dynamicCount} dynamic/non-UI literals; no uncovered static UI strings`);
