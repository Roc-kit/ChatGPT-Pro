/** Internal diagnostics are not translatable UI labels. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadLocales, localeNames } = require('./load-locales.cjs');

const root = path.resolve(__dirname, '..');
const keys = JSON.parse(fs.readFileSync(path.join(root, 'scripts/locales/keys.json'), 'utf8'));
const source = ['scripts/local-data-store.js', 'scripts/background.js']
  .map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
const codes = [...new Set([...source.matchAll(/\bE_(?:DB|ZIP|TASK|INDEX)_[A-Z0-9_]+\b/g)]
  .map(match => match[0]))];
assert(codes.length >= 28, 'low-level operations must use stable diagnostic codes');
assert(!Object.keys(keys).some(key => /^ui\.(?:indexeddb|invalidZIP|zipChunk|taskLeaseExpired)/.test(key)),
  'internal-only errors must not re-enter the translation catalog');
const environment = { navigator: { language: 'en' }, chrome: {
  i18n: { getUILanguage: () => 'en' }
} };
environment.window = environment;
const i18n = loadLocales(environment);
const hints = {
  DB: 'ui.failedToReadLocalData',
  ZIP: 'ui.exportFailed',
  TASK: 'ui.failedToLoadTask',
  INDEX: 'ui.indexOperationFailed'
};
for (const locale of localeNames) {
  i18n.setLanguage(locale);
  const malformedIndexCode = 'E_INDEX_RESPONSE_INVALID';
  assert.equal(i18n.translateText(malformedIndexCode),
    `${i18n.t('ui.indexOperationFailed')} (${malformedIndexCode})`,
    `${locale}: malformed index response code must have a localized explanation`);
  for (const code of codes) {
    const hint = i18n.t(hints[code.split('_')[1]]);
    assert.equal(i18n.translateText(code), `${hint} (${code})`,
      `${locale}: diagnostic must remain searchable with a localized explanation`);
  }
}
assert.equal(i18n.translateText('用户自己的标题'), '用户自己的标题',
  'localization must never rewrite user-authored text');
console.log(`I18N_DIAGNOSTICS_PASS: ${codes.length} stable internal codes, 12 localized UI explanations`);
