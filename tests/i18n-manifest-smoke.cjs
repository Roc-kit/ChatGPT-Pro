/** Chrome-managed extension metadata is localized independently of the Popup. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const keys = ['extensionName', 'extensionDescription', 'extensionActionTitle'];
const chromeLocales = ['en', 'zh_CN', 'zh_TW', 'es', 'hi', 'ar', 'pt_BR', 'bn', 'id', 'fr', 'ru', 'ja'];
assert.equal(manifest.default_locale, 'en', 'English is the default fallback for Chrome metadata');
assert.equal(manifest.name, '__MSG_extensionName__');
assert.equal(manifest.description, '__MSG_extensionDescription__');
assert.equal(manifest.action.default_title, '__MSG_extensionActionTitle__');

const actualLocales = fs.readdirSync(path.join(root, '_locales')).sort();
assert.deepEqual(actualLocales, [...chromeLocales].sort(), 'Chrome metadata matches the 12 UI languages');
const messagesByLocale = {};
for (const locale of chromeLocales) {
  const filename = path.join(root, '_locales', locale, 'messages.json');
  const messages = JSON.parse(fs.readFileSync(filename, 'utf8'));
  assert.deepEqual(Object.keys(messages).sort(), [...keys].sort(), `${locale}: expected metadata fields`);
  for (const key of keys) {
    const message = messages[key]?.message;
    assert.equal(typeof message, 'string', `${locale}/${key}: nonempty localized message required`);
    assert(message.trim() === message && message.length > 0, `${locale}/${key}: nonempty trimmed message`);
    assert(!message.includes('__MSG_'), `${locale}/${key}: must not contain unresolved references`);
  }
  assert(messages.extensionName.message.length <= 75, `${locale}: Chrome extension name length`);
  assert(messages.extensionDescription.message.length <= 132, `${locale}: Chrome extension description length`);
  assert(messages.extensionName.message.startsWith('ChatGPT Pro'), `${locale}: retain product branding`);
  messagesByLocale[locale] = messages;
}
assert.equal(messagesByLocale.en.extensionName.message,
  'ChatGPT Pro: Timeline, Search, Timestamps & Bulk Export',
  'retain the existing pending English name change');
assert.equal(messagesByLocale.zh_CN.extensionDescription.message,
  '为 ChatGPT 增加聊天时间线、全文搜索、侧边栏与消息时间戳，以及 Markdown/JSON 批量导出。',
  'retain the existing pending Chinese description change');

console.log(`I18N_MANIFEST_PASS: ${chromeLocales.length} Chrome locales, all metadata keys and length limits valid`);
