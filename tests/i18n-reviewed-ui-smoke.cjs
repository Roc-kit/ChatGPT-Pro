/** Verify independently authored translations for the most-used interface controls. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadLocales, localeNames } = require('./load-locales.cjs');

const environment = { navigator: { language: 'en' }, chrome: {
  i18n: { getUILanguage: () => 'en' }
} };
environment.window = environment;
const i18n = loadLocales(environment);
const keys = environment.ChatGPTProReviewedLocaleKeys;
const packs = environment.ChatGPTProLocalePacks;
const sources = JSON.parse(fs.readFileSync(path.join(__dirname, '../scripts/locales/keys.json'), 'utf8'));

assert.equal(keys.length, 138, 'reviewed interface, safety, indexing and diagnostic hints include 138 strings');
assert.equal(new Set(keys).size, keys.length, 'reviewed keys cannot contain duplicates');
const placeholders = text => [...text.matchAll(/\{[a-z][a-z0-9_]*\}/gi)].map(m => m[0]).sort();

for (const locale of localeNames.filter(locale => !['zh-CN', 'en'].includes(locale))) {
  i18n.setLanguage(locale);
  for (const key of keys) {
    assert(sources[key], `reviewed key has no canonical source: ${key}`);
    assert.equal(typeof packs[locale][key], 'string', `${locale}/${key} missing`);
    assert(packs[locale][key].trim(), `${locale}/${key} is empty`);
    assert.deepEqual(placeholders(packs[locale][key]), placeholders(sources[key]),
      `${locale}/${key} has broken interpolation`);
    assert.equal(i18n.t(key), packs[locale][key], `${locale}/${key} not applied`);
  }
}
const samples = [
  ['ja', 'ui.collapseMinimap', 'ナビゲーションを折りたたむ'],
  ['ja', 'ui.pausedAfterRepeatedFailures', '連続エラーで一時停止中。手動で再開してください'],
  ['es', 'ui.downloadAllConversationImagesZIP', 'Descargar todas las imágenes de esta conversación (ZIP)'],
  ['fr', 'ui.indexDataManagement', 'Gestion de l’index et des données'],
  ['pt-BR', 'ui.archive', 'Arquivar'],
  ['ru', 'ui.conversations', 'Список чатов'],
  ['ar', 'ui.collapseMinimap', 'طي شريط التنقل'],
  ['id', 'ui.fullTextSearch', 'Pencarian teks lengkap'],
  ['hi', 'ui.delete', 'मिटाएँ'],
  ['bn', 'ui.fullTextSearch', 'সম্পূর্ণ টেক্সটে খুঁজুন'],
  ['zh-TW', 'ui.indexDataManagement', '索引與資料管理'],
  ['ja', 'ui.completeJSONNotSavedLocallyRemoteDeletionCanceled',
    '完全な JSON がローカルに保存されていないため、クラウド上のチャットは削除していません。'],
  ['ja', 'ui.indexingIsRunningInAnotherTab', '別のタブでインデックス作成が実行中です。'],
  ['es', 'ui.indexPausedResumeItInTaskManager', 'La indexación está en pausa. Reanúdala desde el gestor de tareas.']
];
for (const [locale, key, expected] of samples) {
  i18n.setLanguage(locale);
  assert.equal(i18n.t(key), expected, `${locale}/${key} lost its reviewed UI translation`);
}
for (const locale of localeNames.filter(locale => !['zh-CN', 'en'].includes(locale))) {
  i18n.setLanguage(locale);
  const confirmation = i18n.format('ui.variableVariableSelectedConversationsVariableThisMayTake',
    { action: i18n.t('ui.delete'), count: 3,
      detail: i18n.t('ui.deletingConversationsInChatGPTCannotBeUndoneThe') });
  assert(confirmation.includes('3') && !confirmation.includes('{count}') && !confirmation.includes('⏎'),
    `${locale}: delete confirmation is not properly interpolated`);
  assert(confirmation.includes('\n\n'), `${locale}: delete warning lost its paragraph separation`);
}
// These six indexing statuses are generated dynamically from Chinese source
// templates. Confirm the actual runtime translation, not just catalog coverage.
const indexStatuses = [
  ['status.indexedForThisAccountUnassignedLegacyEntries',
    '当前账号已索引 119 / 119 个 · 未归属旧索引 104 个', ['119', '119', '104']],
  ['status.updatingIndex', '正在更新索引 7/12', ['7/12']],
  ['status.addedUpdatedFailed', '新增/更新 7 个，失败 2 个', ['7', '2']],
  ['status.chatsRemainToBeIndexedResumeTo', '首次索引仍有 5 条待补全，可再次继续', ['5']],
  ['status.indexUpToDateUpdatedSkipped', '索引已是最新 · 更新 7 个，跳过 20 个', ['7', '20']],
  ['status.localChatsCheckingForUpdates', '本地已有 119 条，正在增量检查最新数据…', ['119']]
];
for (const locale of localeNames.filter(locale => !['zh-CN', 'en'].includes(locale))) {
  i18n.setLanguage(locale);
  for (const [key, source, values] of indexStatuses) {
    const template = packs[locale][key];
    const captures = [...template.matchAll(/\{(\d+)\}/g)].map(match => Number(match[1]));
    assert.deepEqual(captures.slice().sort((a, b) => a - b),
      values.map((_, index) => index + 1),
      `${locale}/${key}: numbered variables were lost or duplicated`);
    const rendered = template.replace(/\{(\d+)\}/g, (_, number) => values[Number(number) - 1]);
    assert.equal(i18n.translateText(source), rendered,
      `${locale}/${key}: actual dynamic index status differs from reviewed translation`);
  }
}
console.log(`I18N_REVIEWED_PASS: ${keys.length} reviewed keys × 10 locales, six live indexing statuses and placeholders`);
