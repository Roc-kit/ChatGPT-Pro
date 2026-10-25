/** Validate offline language packs without loading any account data. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadLocales } = require('./load-locales.cjs');

const code = fs.readFileSync(path.join(__dirname, '../scripts/i18n.js'), 'utf8');
const environment = { navigator: { language: 'es-MX' }, chrome: {
  i18n: { getUILanguage: () => 'es-MX' }
} };
environment.window = environment;
const i18n = loadLocales(environment);
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
    for (const value of [
      '长对话快速导航（Minimap）', '导出整个对话（Markdown）', '下载当前对话所有图片 ZIP',
      '正在导出整个对话…', '已导出整个对话', '归档', '删除',
      '导出失败：HTTP 429', '图片下载失败：HTTP 404',
      '图片 ZIP 已生成：成功 4，失败 1；共 2 卷',
      '正在下载图片 2 / 12', '正在保存图片 ZIP 1 / 2',
      '常用显示设置', '高级设置', '后台打开、弹窗行为、导出文件名',
      '时间戳字号', '时间戳字号（侧边栏及消息）',
      '当前账号已索引 119 / 119 个 · 未归属旧索引 104 个',
      '当前账号已索引 0 / 36 个 · 未归属旧索引 4 个',
      '首次建立全文索引需点击授权；不会自动抓取正文。已有索引可搜索 · 当前 119 条'
    ]) {
      const translated = i18n.translateText(value);
      assert.notEqual(translated, value,
        `language ${language} leaves source UI unchanged: ${value}`);
      if (language !== 'zh-TW' && language !== 'ja') {
        assert(!/[\u3400-\u9fff]/u.test(translated),
          `${language} unexpectedly contains Chinese UI text: ${value}`);
      }
    }
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
// User-generated titles and message preview content are not translated.
assert.equal(i18n.translateText('用户自定义标题'), '用户自定义标题');
assert.equal(i18n.translateText('2/10 · 用户：用户自定义标题'), '2/10 · User: 用户自定义标题');
console.log('I18N_PASS: browser detection, 12 languages, translated core labels, RTL and fallback');
