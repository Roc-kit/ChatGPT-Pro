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
assert(stableKeys.length >= 300, 'the existing UI and error catalog must not be lost');

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
console.log(`I18N_COVERAGE_PASS: ${localeNames.length} locale bundles × ${stableKeys.length} stable keys, complete placeholders, offline runtime`);
