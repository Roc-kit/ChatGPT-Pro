/** ChatGPT Pro - background service worker */

importScripts('local-data-store.js');

const DEFAULT_SETTINGS = {
  enabled: true,
  showSidebarTime: false,
  showMessageTimestamps: false,
  fontSize: 11,
  openInBackground: true,
  closeOnOutsideClick: true,
  launcherPosition: { x: 0.94, y: 0.76 },
  panelSize: { width: 580, height: 560 }
};

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
  const [records, directory] = await Promise.all([
    ChatGPTProLocalData.getSearchRecords(accountId),
    ChatGPTProLocalData.getDirectory(accountId)
  ]);
  const states = new Map(directory.map(item => [item.id, item.remoteState]));
  return matchingResults(records, query, limit).map(result => ({
    ...result, remoteState: states.get(result.conversationId) || 'unverified'
  }));
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
  // The service worker persists coordination but never owns a long-running
  // task loop: MV3 may suspend this worker between any two requests.
  const taskHandlers = {
    taskCreate: () => ChatGPTProLocalData.createTask(message.accountId, message.type, message.items, message.options),
    taskGet: () => ChatGPTProLocalData.getTask(message.accountId, message.id),
    taskList: () => ChatGPTProLocalData.listTasks(message.accountId),
    taskClaim: () => ChatGPTProLocalData.claimTask(message.accountId, message.id, message.owner),
    taskPhase: () => ChatGPTProLocalData.updateTaskPhase(message.accountId, message.id,
      message.owner, message.token, message.phase, message.waitUntil),
    taskHeartbeat: () => ChatGPTProLocalData.heartbeatTask(message.accountId, message.id, message.owner, message.token),
    taskCheckpoint: () => ChatGPTProLocalData.checkpointTask(
      message.accountId, message.id, message.owner, message.token,
      message.itemIndex, message.outcome, message.error
    ),
    taskControl: () => ChatGPTProLocalData.controlTask(message.accountId, message.id, message.operation, message.reason),
    taskVolumeSave: () => ChatGPTProLocalData.saveExportVolume(
      message.accountId, message.id, message.owner, message.token, message.payload
    ),
    taskVolumeGet: async () => {
      const saved = await ChatGPTProLocalData.getExportVolume(message.accountId, message.id, message.volume);
      return saved && { volume: saved.volume, filename: saved.filename,
        size: saved.blob.size, createdAt: saved.createdAt };
    },
    taskVolumeRead: () => ChatGPTProLocalData.readExportVolumeChunk(
      message.accountId, message.id, message.volume, message.offset, message.size
    ),
    taskVolumeClear: () => ChatGPTProLocalData.clearCompletedExportVolumes(
      message.accountId, message.id
    ),
    indexPolicyGet: () => ChatGPTProLocalData.getIndexPolicy(message.accountId),
    indexSetupPhase: () => ChatGPTProLocalData.setIndexSetupPhase(message.accountId, message.phase),
    indexPolicySetAuto: () => ChatGPTProLocalData.setAutoIndexEnabled(message.accountId, message.enabled),
    localDataClearAccount: () => ChatGPTProLocalData.clearAccountData(message.accountId, message.kind),
    indexPolicyConsent: () => ChatGPTProLocalData.grantIndexConsent(message.accountId),
    indexPolicyDirectoryVerified: () => ChatGPTProLocalData.recordFullDirectoryScan(message.accountId, message.records),
    indexPolicyFinishInitial: () => ChatGPTProLocalData.finishInitialIndex(message.accountId),
    indexSetupLog: () => ChatGPTProLocalData.addLog(message.accountId, {
      type: 'failure', code: 'initial-index-setup',
      message: String(message.message || '首次索引准备中断').slice(0, 250)
    }),
    localDataMarkOfficialGone: () => ChatGPTProLocalData.markOfficialGone(message.accountId, message.id),
    localDataHideArchived: () => ChatGPTProLocalData.hideArchivedConversation(message.accountId, message.id),
    localDataClearLocalOnly: () => ChatGPTProLocalData.clearLocalOnlyConversation(message.accountId, message.id),
    taskVolumeChunk: () => ChatGPTProLocalData.uploadExportChunk(
      message.accountId, message.id, message.owner, message.token,
      message.volume, message.index, message.base64
    ),
    taskVolumeFinish: () => ChatGPTProLocalData.finalizeExportChunks(
      message.accountId, message.id, message.owner, message.token, message.payload
    )
  };
  Object.assign(taskHandlers, {
    detailAcquire: () => ChatGPTProLocalData.acquireDetailSlot(message.accountId, message.owner),
    detailHeartbeat: () => ChatGPTProLocalData.heartbeatDetailSlot(message.accountId, message.owner, message.token),
    detailRelease: () => ChatGPTProLocalData.releaseDetailSlot(
      message.accountId, message.owner, message.token, message.status, message.retryAfterMs
    ),
    detailStatus: () => ChatGPTProLocalData.getDetailSlotStatus(message.accountId),
    directoryRateLimited: () => ChatGPTProLocalData.noteDirectoryRateLimit(message.accountId, message.retryAfterMs),
    directorySyncFailed: () => ChatGPTProLocalData.addLog(message.accountId, {
      type: 'failure', code: String(message.code || 'directory-error').slice(0, 40),
      message: '目录同步失败，请检查登录状态或冷却后重试'
    }),
    logList: () => ChatGPTProLocalData.listLogs(message.accountId, message.limit)
  });
  if (Object.hasOwn(taskHandlers, message.action)) {
    taskHandlers[message.action]()
      .then(async result => {
        // Keep logs structured and independent of conversation content.
        let event = null;
        if ((message.action === 'detailRelease' && message.status === 429) || message.action === 'directoryRateLimited') {
          event = { type: 'rate-limit', code: '429', message: '批量请求进入共享冷却', retryAt: result.cooldownUntil };
        } else if (message.action === 'taskCheckpoint' && message.outcome === 'failed') {
          event = result.task?.status === 'paused'
            ? { type: 'failure', code: 'consecutive-failures-paused', taskId: message.id,
              message: '连续失败达到阈值，索引任务已暂停' }
            : { type: 'failure', code: 'item-failed', taskId: message.id, message: '批量任务单条处理失败' };
        } else if (message.action === 'taskControl' && ['pause', 'resume', 'cancel'].includes(message.operation)) {
          event = { type: 'task', code: message.operation, taskId: message.id, message: '任务状态已修改' };
        }
        if (event) await ChatGPTProLocalData.addLog(message.accountId, event).catch(() => {});
        sendResponse({ success: true, result });
      })
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
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
  if (message.action === 'localDataGetDirectoryRecord') {
    ChatGPTProLocalData.getDirectoryRecord(message.accountId, message.id)
      .then(record => sendResponse({ success: true, record: record || null }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.action === 'localDataStats') {
    ChatGPTProLocalData.getStats(message.accountId)
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
    ChatGPTProLocalData.getSearchMetadata(message.accountId, message.ids)
      .then(records => sendResponse({ success: true, records }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.action === 'searchFullText') {
    searchForAccount(message.accountId, message.query, message.limit)
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
  if (message.action === 'pendingSearchJumpPut') {
    const pending = message.pending;
    if (!pending?.conversationId) {
      sendResponse({ success: false, error: '缺少对话 ID' });
      return false;
    }
    chrome.storage.session.set({ [`pending_search_jump_${pending.conversationId}`]: pending }, () =>
      sendResponse(chrome.runtime.lastError
        ? { success: false, error: chrome.runtime.lastError.message }
        : { success: true }));
    return true;
  }
  if (message.action === 'pendingSearchJumpTake') {
    const key = `pending_search_jump_${message.conversationId || ''}`;
    chrome.storage.session.get(key, values => {
      const pending = values[key] || null;
      chrome.storage.session.remove(key, () => sendResponse({ success: true, pending }));
    });
    return true;
  }
});

console.log('[ChatGPT Pro] Background worker ready');
