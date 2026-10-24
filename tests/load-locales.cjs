/** Load the same offline locale bundles as the Chrome extension into a VM. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const localeNames = ['zh-CN','en','zh-TW','es','hi','ar','pt-BR','bn','id','fr','ru','ja'];

function loadLocales(environment) {
  const root = path.join(__dirname, '..');
  const context = vm.createContext(environment);
  for (const file of ['scripts/locales/registry.js',
    ...localeNames.map(lang => `scripts/locales/${lang}.js`),
    'scripts/locales/dynamic-map.js', 'scripts/i18n.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  return environment.ChatGPTProI18n;
}

module.exports = { localeNames, loadLocales };
