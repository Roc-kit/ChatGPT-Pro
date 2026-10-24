/** ChatGPT Pro - background service worker */

// S1: upgrade the existing IndexedDB in-place. The version-1 search store is
// deliberately retained until its unassigned records can be reconciled.
importScripts('local-data-store.js');

const DEFAULT_SETTINGS = {
  enabled: true,
  showSidebarTime: false,
  showMessageTimestamps: false,
  fontSize: 'small',
  openInBackground: true,
  closeOnOutsideClick: true,
  launcherPosition: { x: 0.94, y: 0.76 },
  panelSize: { width: 580, height: 560 }
};

const SEARCH_STORE = 'conversations';

function openSearchDb() {
  return ChatGPTProLocalData.openDb();
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('索引操作失败'));
  });
}

async function withSearchStore(mode, operation) {
  const db = await openSearchDb();
  try {
    const transaction = db.transaction(SEARCH_STORE, mode);
    const store = transaction.objectStore(SEARCH_STORE);
    const done = new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(transaction.error || new Error('索引事务已中止'));
      transaction.onerror = () => reject(transaction.error || new Error('索引事务失败'));
    });
    const result = await operation(store);
    await done;
    return result;
  } finally {
    db.close();
  }
}

function normalizeSearchText(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase('zh-CN');
}

function searchSnippet(text, tokens, radius = 70) {
  const source = String(text || '').replace(/\s+/g, ' ').trim();
  const normalized = normalizeSearchText(source);
  const positions = tokens.map(token => normalized.indexOf(token)).filter(position => position >= 0);
  const position = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, position - radius);
  const end = Math.min(source.length, position + Math.max(...tokens.map(token => token.length), 1) + radius);
  return `${start ? '…' : ''}${source.slice(start, end)}${end < source.length ? '…' : ''}`;
}

async function upsertSearchRecord(record) {
  const clean = {
    id: String(record?.id || ''),
    title: String(record?.title || 'Untitled conversation'),
    href: String(record?.href || `/c/${record?.id || ''}`),
    updateTime: Number(record?.updateTime || 0),
    indexedAt: Date.now(),
    messages: Array.isArray(record?.messages) ? record.messages.map(message => ({
      id: String(message?.id || ''),
      role: String(message?.role || ''),
      text: String(message?.text || ''),
      createTime: Number(message?.createTime || 0)
    })).filter(message => message.text) : []
  };
  if (!clean.id) throw new Error('索引记录缺少 conversation id');
  await withSearchStore('readwrite', store => requestResult(store.put(clean)));
  return { success: true, indexedAt: clean.indexedAt };
}

async function searchIndexMetadata() {
  return withSearchStore('readonly', store => new Promise((resolve, reject) => {
    const records = [];
    const request = store.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(records);
        return;
      }
      records.push({ id: cursor.value.id, updateTime: cursor.value.updateTime, indexedAt: cursor.value.indexedAt });
      cursor.continue();
    };
    request.onerror = () => reject(request.error || new Error('无法读取索引状态'));
  }));
}

async function pruneSearchIndex(keepIds) {
  // Absence from a partial/failed remote directory is NOT proof of deletion.
  // Previous behavior irreversibly removed local full-text results. Until S4
  // implements verified account-scoped deletion detection, retain them.
  const keep = new Set((keepIds || []).map(String));
  const retainedUnverified = await withSearchStore('readonly', store => new Promise((resolve, reject) => {
    let count = 0;
    const request = store.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(count);
        return;
      }
      if (!keep.has(String(cursor.key))) count++;
      cursor.continue();
    };
    request.onerror = () => reject(request.error || new Error('无法清理旧索引'));
  }));
  return { success: true, removed: 0, retainedUnverified };
}

async function searchFullText(query, limit = 200) {
  const tokens = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const maxResults = Math.max(1, Math.min(500, Number(limit) || 200));
  return withSearchStore('readonly', store => new Promise((resolve, reject) => {
    const results = [];
    const request = store.index('updateTime').openCursor(null, 'prev');
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor || results.length >= maxResults) {
        resolve(results);
        return;
      }
      const record = cursor.value;
      let conversationMatched = false;
      for (const message of record.messages || []) {
        const normalized = normalizeSearchText(message.text);
        if (!tokens.every(token => normalized.includes(token))) continue;
        conversationMatched = true;
        results.push({
          conversationId: record.id,
          title: record.title,
          href: record.href,
          updateTime: record.updateTime,
          messageId: message.id,
          role: message.role,
          createTime: message.createTime,
          snippet: searchSnippet(message.text, tokens)
        });
        if (results.length >= maxResults) break;
      }
      if (!conversationMatched && tokens.every(token => normalizeSearchText(record.title).includes(token))) {
        results.push({
          conversationId: record.id,
          title: record.title,
          href: record.href,
          updateTime: record.updateTime,
          messageId: '',
          role: '',
          createTime: 0,
          snippet: '标题匹配'
        });
      }
      cursor.continue();
    };
    request.onerror = () => reject(request.error || new Error('全文搜索失败'));
  }));
}

function matchingResults(records, query, limit = 200, origin = 'account') {
  const tokens = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const maxResults = Math.max(1, Math.min(500, Number(limit) || 200));
  const results = [];
  const sorted = [...records].sort((a, b) => (b.updateTime || 0) - (a.updateTime || 0));
  for (const record of sorted) {
    let conversationMatched = false;
    for (const message of record.messages || []) {
      if (!tokens.every(token => normalizeSearchText(message.text).includes(token))) continue;
      conversationMatched = true;
      results.push({
        conversationId: record.id, title: record.title, href: record.href,
        updateTime: record.updateTime, messageId: message.id, role: message.role,
        createTime: message.createTime, snippet: searchSnippet(message.text, tokens), origin
      });
      if (results.length >= maxResults) return results;
    }
    if (!conversationMatched && tokens.every(token => normalizeSearchText(record.title).includes(token))) {
      results.push({
        conversationId: record.id, title: record.title, href: record.href,
        updateTime: record.updateTime, messageId: '', role: '', createTime: 0,
        snippet: '标题匹配', origin
      });
      if (results.length >= maxResults) return results;
    }
  }
  return results;
}

async function searchForAccount(accountId, query, limit) {
  const records = await ChatGPTProLocalData.getSearchRecords(accountId);
  return matchingResults(records, query, limit);
}

async function searchUnassignedLegacy(query, limit) {
  // This is deliberately a separate, explicit query. It must never be merged
  // into a signed-in account's ordinary search result set.
  const records = await withSearchStore('readonly', store => requestResult(store.getAll()));
  return matchingResults(records, query, limit, 'legacy-unassigned');
}

async function clearSearchIndex() {
  await withSearchStore('readwrite', store => requestResult(store.clear()));
  return { success: true };
}

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[ChatGPT Pro] Installed:', details.reason);
  if (details.reason === 'install') {
    chrome.storage.local.set(DEFAULT_SETTINGS);
  } else {
    chrome.storage.local.get(null, values => {
      const updates = {};
      for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        if (values[key] === undefined) updates[key] = value;
      }
      if (Object.keys(updates).length) chrome.storage.local.set(updates);
    });
  }
  chrome.storage.local.remove([
    'ct_data',
    'ct_ts',
    'conversationCache',
    'cacheTime',
    'dateFormat',
    'dateType',
    'openInNewTab'
  ]);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'localDataPutConversation') {
    ChatGPTProLocalData.putConversation(message.accountId, message.record)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.action === 'localDataGetConversation') {
    ChatGPTProLocalData.getConversation(message.accountId, message.id, message.updateTime)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.action === 'localDataUpsertDirectory') {
    ChatGPTProLocalData.upsertDirectory(message.accountId, message.records)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.action === 'localDataGetDirectory') {
    ChatGPTProLocalData.getDirectory(message.accountId)
      .then(records => sendResponse({ success: true, records }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.action === 'localDataStats') {
    ChatGPTProLocalData.getStats(message.accountId)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.action === 'localDataLegacyStats') {
    ChatGPTProLocalData.getLegacyMetadata()
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.action === 'searchIndexUpsert') {
    ChatGPTProLocalData.putSearchRecord(message.accountId, message.record)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.action === 'searchIndexMetadata') {
    ChatGPTProLocalData.getSearchMetadata(message.accountId)
      .then(records => sendResponse({ success: true, records }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.action === 'searchIndexPrune') {
    pruneSearchIndex(message.keepIds).then(sendResponse).catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.action === 'searchFullText') {
    searchForAccount(message.accountId, message.query, message.limit)
      .then(results => sendResponse({ success: true, results }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.action === 'searchUnassignedLegacy') {
    searchUnassignedLegacy(message.query, message.limit)
      .then(results => sendResponse({ success: true, results }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.action === 'searchIndexClear') {
    ChatGPTProLocalData.clearSearchIndex(message.accountId)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.action === 'getSettings') {
    chrome.storage.local.get(DEFAULT_SETTINGS, sendResponse);
    return true;
  }
  if (message.action === 'saveSettings') {
    chrome.storage.local.set(message.settings, () => sendResponse({ success: true }));
    return true;
  }
  if (message.action === 'openInBackground') {
    try {
      const url = new URL(message.url);
      if (url.origin !== 'https://chatgpt.com') throw new Error('Unsupported URL');
      chrome.tabs.create({ url: url.href, active: false }, tab => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true, tabId: tab?.id ?? null });
        }
      });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
});

console.log('[ChatGPT Pro] Background worker ready');
