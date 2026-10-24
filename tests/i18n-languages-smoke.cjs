/** Validate offline language packs without loading any account data. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const code = fs.readFileSync(path.join(__dirname, '../scripts/i18n.js'), 'utf8');
const environment = { navigator: { language: 'es-MX' }, chrome: {
  i18n: { getUILanguage: () => 'es-MX' }
} };
environment.window = environment;
vm.runInNewContext(code, environment, { filename: 'scripts/i18n.js' });
const i18n = environment.ChatGPTProI18n;
assert.equal(i18n.language, 'es', 'browser locale automatically selects a supported language');
assert.equal(i18n.t('扩展已就绪'), 'Extensión lista');
const languages = ['zh-CN','zh-TW','en','es','hi','ar','pt-BR','bn','id','fr','ru','ja'];
assert.deepEqual(Array.from(i18n.LANGUAGES, entry => entry[0]).slice(1), languages);
for (const language of languages) {
  i18n.setLanguage(language);
  assert.equal(i18n.language, language);
  assert.notEqual(i18n.t('聊天目录'), '', `conversation UI label exists for ${language}`);
  assert.notEqual(i18n.t('打开 ChatGPT ↗'), '', `open action label exists for ${language}`);
  if (language !== 'zh-CN') {
    assert.notEqual(i18n.t('扩展已就绪'), '扩展已就绪', `ready text translated for ${language}`);
    assert.notEqual(i18n.t('功能设置'), '功能设置', `settings translated for ${language}`);
  }
}
i18n.setLanguage('auto');
assert.equal(i18n.language, 'es');
assert.equal(i18n.resolveLanguage('zh-HK'), 'zh-TW');
assert.equal(i18n.resolveLanguage('pt-PT'), 'pt-BR');
assert.equal(i18n.resolveLanguage('unknown-XX'), 'en');
i18n.setLanguage('ar');
const element = {};
i18n.setDirection(element);
assert.equal(element.dir, 'rtl');
i18n.setLanguage('en');
i18n.setDirection(element);
assert.equal(element.dir, 'ltr');
console.log('I18N_PASS: browser detection, 12 languages, translated core labels, RTL and fallback');
