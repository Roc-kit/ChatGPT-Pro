/** Shared, offline UI translations for the Popup and injected ChatGPT panel.
 * Account data, exported content and API protocol strings are not translated.
 */
(function (scope) {
  'use strict';
  // Language packs are loaded before this runtime. Each UI message has a
  // stable, language-neutral key. Chinese-source lookup is retained only for
  // old literal DOM content while the extension is migrated to keyed markup.
  const PACKS = scope.ChatGPTProLocalePacks || Object.create(null);
  const ZH = PACKS['zh-CN'] || Object.create(null);
  const EN = PACKS.en || Object.create(null);
  const SOURCE_TO_KEY = new Map(Object.entries(ZH).map(([key, source]) => [source, key]));
  const DYNAMIC_KEYS = scope.ChatGPTProDynamicMessageKeys || [];
  const LANGUAGES = [
    ['auto','自动 / Browser'],['zh-CN','简体中文'],['zh-TW','繁體中文'],
    ['en','English'],['es','Español'],['hi','हिन्दी'],['ar','العربية'],
    ['pt-BR','Português (Brasil)'],['bn','বাংলা'],['id','Bahasa Indonesia'],
    ['fr','Français'],['ru','Русский'],['ja','日本語']
  ];

  const originals = new WeakMap();
  let preferred = 'auto';
  let current = 'zh-CN';
  const fallback = key => EN[key] || ZH[key] || key;
  function resolveLanguage(value) {
    const raw = String(value === 'auto' || !value
      ? (scope.chrome?.i18n?.getUILanguage?.() || scope.navigator?.language || 'zh-CN') : value);
    const short = raw.split(/[-_]/)[0].toLowerCase();
    if (short === 'zh') return /(?:tw|hk|mo|hant)/i.test(raw) ? 'zh-TW' : 'zh-CN';
    if (short === 'pt') return 'pt-BR';
    return Object.prototype.hasOwnProperty.call(PACKS, short) ? short : 'en';
  }
  function t(key) {
    const canonical = Object.prototype.hasOwnProperty.call(ZH, key) ? key : SOURCE_TO_KEY.get(key);
    if (!canonical) return key;
    return PACKS[current]?.[canonical] || fallback(canonical);
  }
  function format(key, values = {}) {
    return t(key).replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (whole, name) =>
      Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : whole);
  }
  // Explicit wildcard templates for extension-generated UI only. Do not
  // translate arbitrary ChatGPT page content or the user's chat titles.
  const DYNAMIC = [
    [/^项目 (.+) 分页游标重复$/, m => `Repeated pagination cursor for project ${m[1]}`],
    [/^项目 (.+) 分页为空但仍有后续游标$/, m => `Empty page but more cursor results for project ${m[1]}`],
    [/^ChatGPT 操作失败：HTTP (\d+)$/, m => `ChatGPT operation failed: HTTP ${m[1]}`],
    [/^无法读取本地完整内容：(.+)$/, m => `${t('无法读取本地完整内容')}: ${translateText(m[1])}`],
    [/^首次索引准备失败：(.+)$/, m => `${t('首次索引准备失败')}: ${translateText(m[1])}`],
    [/^正在重试 (\d+) \/ (\d+) · (.+)$/, m => `Retrying ${m[1]}/${m[2]} · ${translateText(m[3])}`],
    [/^正在(?:归档|永久删除) (\d+) \/ (\d+) · 成功 (\d+)、失败 (\d+)$/, m =>
      `${valueVerb(m[0])} ${m[1]}/${m[2]} · ${m[3]} succeeded, ${m[4]} failed`],
    [/^(\d+) \/ (\d+) · 第 (\d+) \/ (\d+) 组$/, m =>
      `${m[1]} / ${m[2]} · group ${m[3]} / ${m[4]}`],
    [/^(.+?) · (\d+) 条$/, m => `${translateText(m[1])} · ${m[2]} chats`],
    [/^当前账号 (\d+) 条$/, m => `${m[1]} account chats`],
    [/^(\d+)\s*\/\s*(\d+) · 成功 (\d+) · 失败 (\d+)(?: · ZIP (\d+) 卷)?$/, m =>
      `${m[1]}/${m[2]} · ${m[3]} succeeded · ${m[4]} failed${m[5] ? ` · ${m[5]} ZIP parts` : ''}`],
    [/^已发起 (\d+) 个分卷下载，请检查浏览器下载提示$/, m => `Started ${m[1]} ZIP part downloads; check browser downloads`],
    [/^已清理 (\d+) 个本地 ZIP 分卷，原始聊天缓存和任务历史仍保留$/, m => `Deleted ${m[1]} saved ZIP parts; original chat cache and task history remain`],
    [/^(.+?)操作已提交$/, m => `${translateText(m[1])} request submitted`],
    [/^任务不可用：(.+)$/, m => `Task unavailable: ${translateText(m[1])}`],
    [/^请求限流冷却中，至 (.+)$/, m => `Rate-limit cooldown until ${m[1]}`],
    [/^已从当前账号清除 (\d+) 条(.+)；其他数据保持不变$/, m =>
      `Removed ${m[1]} ${translateText(m[2])} entries from this account; other data unchanged`],
    [/^已请求开始索引；请保持 ChatGPT 标签页打开，稍后刷新进度$/, () => t('已请求开始索引；请保持 ChatGPT 标签页打开，稍后刷新进度')],
    [/^完成 · (\d+) 条聊天记录$/, m => `Completed · ${m[1]} chats`],
    [/^(.+) · 已完成后台增量同步$/, m => `${translateText(m[1])} · ${t('已完成后台增量同步')}`],
    [/^当前账号已索引 (\d+) \/ (\d+) 个$/, m => `Indexed ${m[1]} / ${m[2]} for this account`],
    [/^请求受限，(\d+) 秒后继续 · (.+)$/, m => `Rate limited · resume in ${m[1]}s · ${translateText(m[2])}`],
    [/^本组完成，(\d+) 秒后继续 · (.+)$/, m => `Batch complete · continue in ${m[1]}s · ${translateText(m[2])}`],
    [/^请求失败，(\d+) 秒后重试 · (.+)$/, m => `Request failed · retry in ${m[1]}s · ${translateText(m[2])}`],
    [/^请求受限 · (\d+) 秒后继续 · (.+)$/, m => `Rate limited · resume in ${m[1]}s · ${translateText(m[2])}`],
    [/^本组完成 · (\d+) 秒后继续 · (.+)$/, m => `Batch complete · continue in ${m[1]}s · ${translateText(m[2])}`],
    [/^请求失败 · (\d+) 秒后重试 (\d+) \/ (\d+) · (.+)$/, m =>
      `Request failed · retry in ${m[1]}s (${m[2]}/${m[3]}) · ${translateText(m[4])}`],
    [/^第 (\d+) 个 ZIP 已保存(并发起下载)? · (\d+) \/ (\d+)$/, m =>
      `ZIP part ${m[1]} saved${m[2] ? ' and download started' : ''} · ${m[3]}/${m[4]}`],
    [/^正在更新索引 (.+)$/, m => `Updating index ${translateText(m[1])}`],
    [/^新增\/更新 (\d+) 个，失败 (\d+) 个$/, m => `${m[1]} added/updated, ${m[2]} failed`],
    [/^首次索引仍有 (\d+) 条待补全，可再次继续$/, m => `${m[1]} chats remain to be indexed; resume to continue`],
    [/^索引已是最新 · 更新 (\d+) 个，跳过 (\d+) 个$/, m =>
      `Index up to date · ${m[1]} updated, ${m[2]} skipped`],
    [/^已持久化 (\d+) 卷 · 成功 (\d+) 个、失败 (\d+) 个（浏览器下载需单独确认）$/, m =>
      `${m[1]} saved ZIP parts · ${m[2]} succeeded, ${m[3]} failed (verify browser downloads)`],
    [/^已发起下载 (\d+) \/ (\d+) 卷（最近一次导出任务）$/, m =>
      `Downloading saved ZIP part ${m[1]}/${m[2]}`],
    [/^同步失败，已保留本地数据：(.+)$/, m => `Sync failed; local data retained: ${translateText(m[1])}`],
    [/^图片下载 HTTP (\d+)$/, m => `Image download HTTP ${m[1]}`],
    [/^无权写入(.+)$/, m => `Not allowed to write ${translateText(m[1])}`],
    [/^首次建立全文索引需点击授权；不会自动抓取正文。已有索引可搜索 · 当前 (\d+) 条$/, m =>
      `Authorize to build a full-text index; chat bodies are not fetched automatically. Existing index is searchable · ${m[1]} indexed`],
    [/^选择 (.+)$/, m => `${t('选择')} ${m[1]}`],
    [/^标题筛选：(.+)$/, m => `${t('按标题筛选')}: ${m[1]}`],
    [/^已选 (\d+)$/, m => `${t('选择')} ${m[1]}`],
    [/^(\d+) 条聊天记录$/, m => `${m[1]} ${t('条聊天记录')}`],
    [/^(\d+) 条 · (.+)$/, m => `${m[1]} chats · ${translateText(m[2])}`],
    [/^(导出失败|图片下载失败|清理失败|仅本地导出失败|索引更新失败|索引状态读取失败|批量导出失败|全文搜索失败|同步失败|下载已保存分卷失败)：(.+)$/, m => `${t(m[1])}: ${translateText(m[2])}`],
    [/^图片 ZIP 已生成：成功 (\d+)，失败 (\d+)；共 (\d+) 卷$/, m => `Image ZIP ready: ${m[1]} succeeded, ${m[2]} failed · ${m[3]} parts`],
    [/^正在下载图片 (\d+) \/ (\d+)$/, m => `Downloading images ${m[1]} / ${m[2]}`],
    [/^正在保存图片 ZIP (\d+) \/ (\d+)$/, m => `Saving image ZIP ${m[1]} / ${m[2]}`],
    [/^正在导出 (.+)$/, m => `Exporting ${translateText(m[1])}`],
    [/^打开 ChatGPT 失败：(.+)$/, m => `Failed to open ChatGPT: ${translateText(m[1])}`],
    [/^账号请求冷却中 · 剩余 (\d+) 秒 · 到期后可自动继续$/, m => `Request cooldown · ${m[1]}s remaining · automatic resume`],
    [/^· 还需 (\d+) 秒$/, m => `· ${m[1]}s remaining`],
    [/^· 等待结束，正在恢复$/, () => '· Resuming'],
    [/^(.+)中…$/, m => `${translateText(m[1])} in progress…`],
    [/^(?!(?:自动更新设置|索引启动)失败：)(.+)失败：(.+)$/, m => `${translateText(m[1])} failed: ${translateText(m[2])}`],
    [/^自动更新设置失败：(.+)$/, m => `Failed to update automatic indexing: ${translateText(m[1])}`],
    [/^索引启动失败：(.+)$/, m => `Index start failed: ${translateText(m[1])}`],
    [/^(.+) · ZIP (\d+) 卷$/, m => `${translateText(m[1])} · ${m[2]} ZIP parts`],
    [/^本地已有 (\d+) 条，正在增量检查最新数据…$/, m => `${m[1]} local chats · checking for updates…`],
    [/^(.+) · 已完成增量同步$/, m => `${translateText(m[1])} · ${t('已完成增量同步')}`],
    [/^(正在归档|正在永久删除) (\d+) \/ (\d+) · 成功 (\d+)、失败 (\d+)$/, m => `${m[1] === '正在归档' ? 'Archiving' : 'Deleting'} ${m[2]} / ${m[3]} · ${m[4]} succeeded, ${m[5]} failed`],
    [/^(归档|永久删除)完成：成功 (\d+)、失败 (\d+)(（点击查看失败清单）)?$/, m => `${t(m[1])} completed: ${m[2]} succeeded, ${m[3]} failed${m[4] ? ' (click for failures)' : ''}`],
    [/^(归档|永久删除)中止：(.+)$/, m => `${t(m[1])} stopped: ${translateText(m[2])}`],
    [/^(\d+)\/(\d+) · (用户|ChatGPT|消息)：(.+)$/, m => `${m[1]}/${m[2]} · ${t(m[3])}: ${m[4]}`],
    [/^(\d+)\/(\d+) · (用户|ChatGPT|消息)$/, m => `${m[1]}/${m[2]} · ${translateText(m[3])}`]
  ];
  function valueVerb(text) { return text.startsWith('正在归档') ? 'Archiving' : 'Deleting'; }
  function dynamicVariant(index, match) {
    if (index === 6) return match[0].startsWith('正在归档') ? 'archive' : 'delete';
    if (index === 59) return match[1] === '正在归档' ? 'archive' : 'delete';
    if (index === 60) return `${match[1] === '归档' ? 'archive' : 'delete'}${match[4] ? 'WithFailures' : ''}`;
    if (index === 10) return match[5] ? 'full' : 'short';
    if (index === 27) return match[2] ? 'full' : 'short';
    return 'default';
  }
  function dynamicTranslation(index, match, fallbackFormatter) {
    const key = DYNAMIC_KEYS[index]?.[dynamicVariant(index, match)];
    const template = key && (PACKS[current]?.[key] || EN[key]);
    if (!template) return fallbackFormatter(match);
    // This permission error is emitted as a fixed extension message. The
    // generic matcher captures its Chinese suffix ("该导出任务"), which is
    // not a standalone locale key, so use the already-reviewed full message.
    if (key === 'status.notAllowedToWrite' && match[0] === '无权写入该导出任务') {
      return t('ui.notAllowedToWriteThisExportTask');
    }
    return template.replace(/\{(\d+)\}/g, (whole, digit) => {
      const value = match[Number(digit)];
      if (value == null) return '';
      // Only translate a recognized extension label. Never translate a
      // conversation title or user message substituted into a status.
      if (SOURCE_TO_KEY.has(value)) return t(value);
      // A nested export/index progress message may itself be a recognized
      // extension status. Never apply this to arbitrary user-authored text.
      const suffix = value.endsWith('…') ? '…' : '';
      const nestedValue = suffix ? value.slice(0, -1) : value;
      return (translateTechnicalError(nestedValue) || DYNAMIC.some(([pattern]) => pattern.test(nestedValue)))
        ? `${translateText(nestedValue)}${suffix}` : value;
    });
  }
  // Internal storage/ZIP/scheduler failures carry stable English diagnostics.
  // The interface shows a short localized explanation, retaining the code
  // so logs and bug reports can identify the actual underlying condition.
  function diagnosticMessage(value) {
    if (!/^E_(?:DB|ZIP|TASK|INDEX)_[A-Z0-9_]+$/.test(value)) return null;
    const family = value.split('_')[1];
    const hintKey = {
      DB: 'ui.failedToReadLocalData',
      ZIP: 'ui.exportFailed',
      TASK: 'ui.failedToLoadTask',
      INDEX: 'ui.indexOperationFailed'
    }[family];
    return `${t(hintKey)} (${value})`;
  }
  function translateTechnicalError(value) {
    if (/^Could not establish connection\. Receiving end does not exist\.?$/.test(value)) {
      return t('ui.chatgptTabNotReadyReloadAndTryAgain');
    }
    if (/^(?:The message port closed before a response was received|The message channel closed before a response was received|A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received)\.?$/.test(value)) {
      return t('ui.chatgptTabConnectionInterruptedReloadAndTryAgain');
    }
    let match = value.match(/^HTTP (\d{3}): (https?:\/\/\S+)$/);
    if (match) return format('ui.httpRequestFailed', { status: match[1], url: match[2] });
    match = value.match(/^Session (\d{3})$/);
    if (match) return format('ui.sessionRequestFailed', { status: match[1] });
    if (value === '401_UNAUTHORIZED') return `${t('ui.requestUnauthorized')} (401_UNAUTHORIZED)`;
    return null;
  }
  function translateTechnicalErrorSuffix(value) {
    const match = value.match(/^(.*(?:失败|中止|不可用)(?:：|:\s*))(HTTP \d{3}: https?:\/\/\S+|Session \d{3}|401_UNAUTHORIZED|Could not establish connection\. Receiving end does not exist\.?|The message port closed before a response was received\.?|The message channel closed before a response was received\.?|A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received\.?)$/);
    if (!match) return null;
    const translated = translateTechnicalError(match[2]);
    return translated ? `${match[1]}${translated}` : null;
  }
  function translateText(source) {
    const value = source.trim();
    if (!value) return source;
    const technicalError = translateTechnicalError(value);
    if (technicalError) return source.replace(value, technicalError);
    const translatedSuffix = current === 'zh-CN' ? translateTechnicalErrorSuffix(value) : null;
    if (translatedSuffix) return source.replace(value, translatedSuffix);
    const explanation = diagnosticMessage(value);
    if (explanation) return source.replace(value, explanation);
    // Translate a known UI label before a colon while preserving the title or
    // other user-authored value that follows it (for example aria-labels).
    const mixedLabel = value.match(/^(.+?)[：:]\s*(.+)$/);
    if (mixedLabel && SOURCE_TO_KEY.has(mixedLabel[1]) &&
        !DYNAMIC.some(([pattern]) => pattern.test(value))) {
      const translatedPrefix = t(mixedLabel[1]);
      if (translatedPrefix !== mixedLabel[1]) {
        return source.replace(value, `${translatedPrefix}: ${mixedLabel[2]}`);
      }
    }
    let result = t(value);
    if (result === value) {
      if (current !== 'zh-CN' && value.includes(' · ')) {
        const parts = value.split(' · ');
        if (parts.every(part => SOURCE_TO_KEY.has(part))) {
          result = parts.map(part => t(part)).join(' · ');
        }
      }
      if (current !== 'zh-CN') for (const [index, [pattern, format]] of DYNAMIC.entries()) {
        const match = value.match(pattern);
        if (match) { result = dynamicTranslation(index, match, format); break; }
      }
    }
    if (result === value) return source;
    return source.replace(value, result);
  }
  function translateNode(node) {
    if (node.nodeType !== 3 || !node.parentElement) return;
    const parent = node.parentElement;
    if (parent.closest('script,style,.chatgpt-pro-row-title-text,.chatgpt-pro-row-project,.chatgpt-pro-local-preview,.chatgpt-pro-minimap-preview-text,#filenamePreview')) return;
    if (parent.closest('.chatgpt-pro-search-result') && !parent.closest('[data-chatgpt-pro-i18n]')) return;
    const previous = originals.get(node);
    const source = previous && previous.last === node.nodeValue ? previous.source : node.nodeValue;
    const target = translateText(source);
    originals.set(node, { source, last: target });
    if (node.nodeValue !== target) node.nodeValue = target;
  }
  function translateAttributes(element) {
    if (!element.getAttribute || element.matches('script,style')) return;
    for (const key of ['placeholder','title','aria-label']) {
      const value = element.getAttribute(key);
      if (!value) continue;
      const cache = originals.get(element) || {};
      const prev = cache[key];
      const source = prev && prev.last === value ? prev.source : value;
      const target = translateText(source);
      cache[key] = { source, last: target };
      originals.set(element, cache);
      if (target !== value) element.setAttribute(key, target);
    }
  }
  function apply(root) {
    if (!root) return;
    if (root.nodeType === 3) { translateNode(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) translateAttributes(root);
    const doc = root.ownerDocument || root;
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const item = walker.currentNode;
      if (item.nodeType === 3) translateNode(item);
      else translateAttributes(item);
    }
  }
  function watch(root) {
    apply(root);
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') apply(mutation.target);
        else if (mutation.type === 'attributes') translateAttributes(mutation.target);
        else for (const node of mutation.addedNodes) apply(node);
      }
    });
    observer.observe(root, { subtree:true, childList:true, characterData:true,
      attributes:true, attributeFilter:['title','aria-label','placeholder'] });
    return () => observer.disconnect();
  }
  function setLanguage(value) {
    preferred = LANGUAGES.some(([key]) => key === value) ? value : 'auto';
    current = resolveLanguage(preferred);
  }
  function setDirection(root) {
    if (root) { root.dir = current === 'ar' ? 'rtl' : 'ltr'; root.lang = current; }
  }
  setLanguage('auto');
  scope.ChatGPTProI18n = { t, format, translateText, apply, watch, setLanguage, setDirection, resolveLanguage,
    get language() { return current; }, get preferred() { return preferred; }, LANGUAGES };
})(window);
