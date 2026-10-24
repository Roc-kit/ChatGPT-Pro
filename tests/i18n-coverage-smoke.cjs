/** Offline localization coverage: no locale may silently omit a message key. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { localeNames, loadLocales } = require('./load-locales.cjs');

const root = path.join(__dirname, '..');
const keys = JSON.parse(fs.readFileSync(path.join(root, 'scripts/locales/keys.json'), 'utf8'));
const environment = { navigator: { language: 'en' }, chrome: { i18n: { getUILanguage: () => 'en' } } };
environment.window = environment;
const i18n = loadLocales(environment);
const packs = environment.ChatGPTProLocalePacks;
const stableKeys = Object.keys(keys);
assert(stableKeys.length >= 400, 'static and dynamic UI/status keys must be preserved');
const dynamicKeys = environment.ChatGPTProDynamicMessageKeys;
assert.equal(dynamicKeys.length, 63, 'dynamic UI templates must have no redundant rules');
for (const variants of dynamicKeys) {
  for (const key of Object.values(variants)) {
    assert(Object.prototype.hasOwnProperty.call(keys, key), `missing dynamic catalog key ${key}`);
  }
}

const placeholders = value => [...String(value).matchAll(/\{([a-z][a-z0-9_]*)\}/gi)]
  .map(match => match[1]).sort();
for (const locale of localeNames) {
  const values = packs[locale];
  assert(values, `missing language bundle ${locale}`);
  assert.deepEqual(Object.keys(values).sort(), stableKeys.slice().sort(),
    `${locale}: language bundle has missing or extra keys`);
  i18n.setLanguage(locale);
  for (const key of stableKeys) {
    assert.equal(typeof values[key], 'string', `${locale}/${key} must be a string`);
    assert(values[key].trim(), `${locale}/${key} cannot be blank`);
    assert.deepEqual(placeholders(values[key]), placeholders(keys[key]),
      `${locale}/${key}: interpolation placeholders differ from original`);
    assert.equal(i18n.t(key), values[key], `${locale}/${key} returned the wrong locale`);
  }
}
for (const locale of ['en','es','hi','ar','pt-BR','bn','id','fr','ru','ja','zh-TW']) {
  i18n.setLanguage(locale);
  assert.notEqual(i18n.t('ui.openChatGPT'), keys['ui.openChatGPT'],
    `${locale}: stable keys must resolve to native UI copy`);
}
assert.equal(i18n.t('ui.thisKeyDoesNotExist'), 'ui.thisKeyDoesNotExist',
  'unknown keys remain visible for future audit tooling');
const indexed = '当前账号已索引 119 / 119 个 · 未归属旧索引 104 个';
const downloading = '正在下载图片 2 / 12';
const confirmations = '确定{action}选中的 {count} 条对话？\n\n{detail}\n\n操作可能持续一段时间，失败的条目会保留供重试。';
for (const locale of localeNames.filter(locale => locale !== 'zh-CN')) {
  i18n.setLanguage(locale);
  const expectedCount = packs[locale]['status.indexedForThisAccountUnassignedLegacyEntries']
    .replace('{1}', '119').replace('{2}', '119').replace('{3}', '104');
  const expectedDownload = packs[locale]['status.downloadingImages']
    .replace('{1}', '2').replace('{2}', '12');
  assert.equal(i18n.translateText(indexed), expectedCount, `${locale}: native index status missing`);
  assert.equal(i18n.translateText(downloading), expectedDownload, `${locale}: native download progress missing`);
  assert.notEqual(i18n.translateText(indexed), indexed, `${locale}: index status not translated`);
  assert.equal(i18n.format('ui.variableVariableSelectedConversationsVariableThisMayTake',
    { action: i18n.t('ui.archive'), count: 2, detail: i18n.t('ui.archivingRemovesChatsFromTheRemoteListWithout') })
    .includes('{count}'), false, `${locale}: untranslated confirmation variable`);
}
assert.equal(keys['ui.variableVariableSelectedConversationsVariableThisMayTake'], confirmations,
  'named-variable confirmation source has not changed accidentally');
console.log(`I18N_COVERAGE_PASS: ${localeNames.length} locale bundles × ${stableKeys.length} stable keys, complete placeholders, offline runtime`);
