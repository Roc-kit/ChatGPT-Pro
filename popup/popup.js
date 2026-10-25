document.addEventListener('DOMContentLoaded', () => {
  const i18n = window.ChatGPTProI18n;
  const languageSelect = document.getElementById('languageSelect');
  i18n.watch(document.body);
  languageSelect.addEventListener('change', () => {
    const value = languageSelect.value;
    chrome.storage.local.set({ uiLanguage: value });
    i18n.setLanguage(value);
    i18n.setDirection(document.documentElement);
    i18n.apply(document.body);
    const currentTemplate = filenamePreset.value === 'custom'
      ? filenameTemplate.value || '{created_datetime}_{title}'
      : filenamePresets[filenamePreset.value] || '{created_datetime}_{title}';
    updateFilenameUi(currentTemplate);
  });
  const toggle = document.getElementById('toggle');
  const sidebarTimeToggle = document.getElementById('sidebarTimeToggle');
  const messageTimeToggle = document.getElementById('messageTimeToggle');
  const minimapToggle = document.getElementById('minimapToggle');
  const openInBackgroundToggle = document.getElementById('openInBackgroundToggle');
  const outsideCloseToggle = document.getElementById('outsideCloseToggle');
  const size = document.getElementById('size');
  const filenamePreset = document.getElementById('filenamePreset');
  const customTemplateWrap = document.getElementById('customTemplateWrap');
  const filenameTemplate = document.getElementById('filenameTemplate');
  const filenamePreview = document.getElementById('filenamePreview');
  const refresh = document.getElementById('refresh');
  const refreshText = document.getElementById('refreshText');
  const count = document.getElementById('count');
  const rawCount = document.getElementById('rawCount');
  const indexedCount = document.getElementById('indexedCount');
  const openChatGPT = document.getElementById('openChatGPT');
  const autoIndexToggle = document.getElementById('autoIndexToggle');
  const clearIndex = document.getElementById('clearIndex');
  const clearRaw = document.getElementById('clearRaw');
  const apiStatus = document.getElementById('apiStatus');
  const apiStatusText = document.getElementById('apiStatusText');
  const taskFeedback = document.getElementById('taskFeedback');
  const taskCooldownText = document.getElementById('taskCooldownText');
  const taskList = document.getElementById('taskList');
  const taskOverview = document.getElementById('taskOverview');
  const taskStatusText = document.getElementById('taskStatusText');
  const taskRefresh = document.getElementById('taskRefresh');
  const indexStartArea = document.getElementById('indexStartArea');
  const indexStart = document.getElementById('indexStart');
  const indexConsentStatus = document.getElementById('indexConsentStatus');
  let taskLoading = false;
  let indexConsentGranted = false;
  let dashboardStats = null;
  let cooldownDeadline = 0;
  const taskPhases = {
    fetching: '抓取 / 处理对话', volume: '生成并保存 ZIP 分卷',
    waiting: '请求间隔等待', 'rate-limit': '限流冷却',
    'consecutive-failures': '连续失败，等待人工继续',
    paused: '已暂停', pending: '等待执行', completed: '已完成', canceled: '已取消'
  };

  function updateTaskCountdowns() {
    const remaining = Math.max(0, Math.ceil((cooldownDeadline - Date.now()) / 1000));
    taskCooldownText.hidden = remaining === 0;
    if (remaining) taskCooldownText.textContent = `账号请求冷却中 · 剩余 ${remaining} 秒 · 到期后可自动继续`;
    document.querySelectorAll('.task-waiting-remainder').forEach(element => {
      const until = Number(element.dataset.until || 0);
      const waiting = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      element.textContent = waiting ? ` · 还需 ${waiting} 秒` : ' · 等待结束，正在恢复';
    });
  }

  document.getElementById('extensionVersion').textContent = `v${chrome.runtime.getManifest?.().version || '3.0.0'}`;

  function findChatGPTTab() {
    return new Promise(resolve => {
      chrome.tabs.query({ active: true, currentWindow: true }, currentTabs => {
        chrome.tabs.query({ url: 'https://chatgpt.com/*' }, tabs => {
          const eligible = (tabs || []).filter(tab => {
            try { return new URL(tab.url).hostname === 'chatgpt.com'; } catch { return false; }
          });
          const activeId = currentTabs?.[0]?.id;
          resolve(eligible.find(tab => tab.id === activeId) || eligible.find(tab => tab.active) || eligible[0] || null);
        });
      });
    });
  }

  openChatGPT.addEventListener('click', async () => {
    openChatGPT.disabled = true;
    try {
      const tab = await findChatGPTTab();
      await new Promise((resolve, reject) => {
        const callback = () => chrome.runtime.lastError
          ? reject(new Error(chrome.runtime.lastError.message)) : resolve();
        if (tab?.id) chrome.tabs.update(tab.id, { active: true }, callback);
        else chrome.tabs.create({ url: 'https://chatgpt.com/', active: true }, callback);
      });
      if (tab?.windowId && chrome.windows?.update) chrome.windows.update(tab.windowId, { focused: true });
    } catch (error) {
      taskFeedback.textContent = `打开 ChatGPT 失败：${error.message}`;
    } finally {
      openChatGPT.disabled = false;
    }
  });

  function sendToActiveChatGPT(message) {
    return findChatGPTTab().then(tab => new Promise((resolve, reject) => {
        if (!tab?.id) return reject(new Error('请切换到已登录的 ChatGPT 标签页，或点击“打开 ChatGPT”'));
        chrome.tabs.sendMessage(tab.id, message, response => {
          const transportError = chrome.runtime.lastError;
          if (transportError) reject(new Error(transportError.message));
          else if (!response || (message.action !== 'getStatus' && !response.success)) {
            reject(new Error(response?.error || '读取任务失败'));
          }
          else resolve(response);
        });
    }));
  }

  function resetAccountPresentation() {
    dashboardStats = null;
    count.textContent = rawCount.textContent = indexedCount.textContent = '–';
    autoIndexToggle.disabled = true;
    cooldownDeadline = 0;
    taskCooldownText.hidden = true;
    setToggle(autoIndexToggle, false);
    clearIndex.disabled = clearRaw.disabled = true;
    taskStatusText.textContent = '请打开 ChatGPT';
    taskOverview.hidden = true;
  }

  const taskNames = { index: '全文索引', 'export-md': 'Markdown 导出', 'export-json': 'JSON 导出' };
  const taskStates = {
    pending: '待执行', running: '执行中', paused: '已暂停',
    completed: '已完成', failed: '失败', canceled: '已取消'
  };

  function addTaskButton(container, label, handler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', async () => {
      button.disabled = true;
      taskFeedback.textContent = `${label}中…`;
      try {
        const result = await handler();
        taskFeedback.textContent = result?.initiated
          ? `已发起 ${result.initiated} 个分卷下载，请检查浏览器下载提示`
          : Number.isInteger(result?.deleted)
            ? `已清理 ${result.deleted} 个本地 ZIP 分卷，原始聊天缓存和任务历史仍保留`
          : `${label}操作已提交`;
      } catch (error) {
        taskFeedback.textContent = `${label}失败：${error.message}`;
      } finally {
        await loadTaskDashboard(true);
        button.disabled = false;
      }
    });
    container.appendChild(button);
  }

  function renderTaskDashboard(data) {
    cooldownDeadline = Number(data.cooldownUntil || 0);
    updateTaskCountdowns();
    const policy = data.indexPolicy || {};
    indexConsentGranted = Boolean(policy.consentAt);
    const initialDone = Boolean(policy.initialCompletedAt);
    dashboardStats = data.stats || null;
    count.textContent = Number.isInteger(data.stats?.directory) ? data.stats.directory : '–';
    rawCount.textContent = Number.isInteger(data.stats?.complete) ? data.stats.complete : '–';
    indexedCount.textContent = Number.isInteger(data.stats?.indexed) ? data.stats.indexed : '–';
    autoIndexToggle.disabled = !initialDone;
    setToggle(autoIndexToggle, initialDone && policy.autoEnabled !== false);
    clearIndex.disabled = clearRaw.disabled = false;
    const unfinishedIndexTask = (data.tasks || []).find(task => task.type === 'index' &&
      ['pending', 'running', 'paused'].includes(task.status));
    indexStartArea.hidden = false;
    indexStart.disabled = Boolean(unfinishedIndexTask);
    indexStart.textContent = !policy.consentAt ? '建立全文索引（需授权）'
      : initialDone ? '立即检查新增聊天' : '继续首次全文索引';
    indexConsentStatus.textContent = policy.setupPhase === 'scanning'
      ? '正在扫描完整聊天目录，包括项目与分页；索引任务准备中'
      : unfinishedIndexTask
      ? '索引任务已创建，请使用下方任务控制和进度查看'
      : initialDone ? (policy.autoEnabled === false ? '首次索引已完成，自动更新已关闭' : '首次索引已完成，之后自动检查增量变化')
        : policy.consentAt ? '已授权，首次完整索引尚未完成' : '首次扫描需确认授权；原始 JSON 仅保存在本机';
    // Only unfinished work belongs in the small Popup. Completed/canceled
    // jobs and their events remain in persistent task storage, not this UI.
    const activeTasks = (data.tasks || []).filter(task =>
      ['pending', 'running', 'paused'].includes(task.status));
    taskStatusText.textContent = activeTasks.length
      ? activeTasks.map(task => `${taskNames[task.type] || '本地任务'} · ${taskStates[task.status]}`).join(' / ')
      : '当前没有运行中的任务';
    taskOverview.hidden = activeTasks.length === 0 && cooldownDeadline <= Date.now();
    taskList.replaceChildren();
    for (const task of activeTasks) {
      const card = document.createElement('div');
      card.className = 'task-card';
      const meta = document.createElement('div');
      meta.className = 'task-meta';
      const name = document.createElement('strong');
      name.textContent = taskNames[task.type] || '本地任务';
      const state = document.createElement('small');
      state.textContent = task.recoveryPending ? '等待恢复' : (taskStates[task.status] || task.status);
      meta.append(name, state);

      const progress = document.createElement('div');
      progress.className = 'task-progress';
      progress.setAttribute('role', 'progressbar');
      progress.setAttribute('aria-valuemin', '0');
      progress.setAttribute('aria-valuemax', String(task.total));
      progress.setAttribute('aria-valuenow', String(task.done));
      const fill = document.createElement('span');
      fill.style.width = `${task.total ? Math.min(100, task.done / task.total * 100) : 0}%`;
      progress.appendChild(fill);

      const detail = document.createElement('div');
      detail.className = 'hint';
      const description = `${task.done}/${task.total} · 成功 ${task.successes} · 失败 ${task.failures}`;
      detail.textContent = task.savedVolumes ? `${description} · ZIP ${task.savedVolumes} 卷` : description;
      if (task.status === 'running' && cooldownDeadline > Date.now()) {
        detail.append(' · 等待账号限流冷却');
      } else if (task.phase) {
        detail.append(` · ${taskPhases[task.phase] || task.phase}`);
      }
      if (task.status === 'running' && task.waitUntil > Date.now()) {
        const waiting = document.createElement('span');
        waiting.className = 'task-waiting-remainder';
        waiting.dataset.until = String(task.waitUntil);
        detail.appendChild(waiting);
      }

      const actions = document.createElement('div');
      actions.className = 'task-actions';
      if (['pending', 'running'].includes(task.status)) {
        addTaskButton(actions, '暂停', () => sendToActiveChatGPT({ action: 'taskManage', id: task.id, operation: 'pause' }));
        addTaskButton(actions, '取消', () => sendToActiveChatGPT({ action: 'taskManage', id: task.id, operation: 'cancel' }));
      } else if (task.status === 'paused') {
        addTaskButton(actions, '继续', () => sendToActiveChatGPT({ action: 'taskManage', id: task.id, operation: 'resume' }));
        addTaskButton(actions, '取消', () => sendToActiveChatGPT({ action: 'taskManage', id: task.id, operation: 'cancel' }));
      }
      if (task.savedVolumes > 0 && task.type.startsWith('export-')) {
        addTaskButton(actions, '下载分卷', () => sendToActiveChatGPT({ action: 'taskDownloadVolumes', id: task.id }));
      }
      card.append(meta, progress, detail, actions);
      taskList.appendChild(card);
    }
    updateTaskCountdowns();
  }

  async function loadTaskDashboard(keepFeedback = false) {
    if (taskLoading) return;
    taskLoading = true;
    try {
      const data = await sendToActiveChatGPT({ action: 'taskDashboard' });
      renderTaskDashboard(data);
      if (!keepFeedback) {
        taskFeedback.textContent = data.cooldownUntil > Date.now()
          ? `请求限流冷却中，至 ${new Date(data.cooldownUntil).toLocaleTimeString()}`
          : '任务进度保存在本地，刷新标签页不会清空';
      }
    } catch (error) {
      resetAccountPresentation();
      indexStartArea.hidden = true;
      taskList.replaceChildren();
      taskFeedback.textContent = `任务不可用：${error.message}`;
    } finally {
      taskLoading = false;
    }
  }

  autoIndexToggle.addEventListener('click', async () => {
    if (autoIndexToggle.disabled) return;
    autoIndexToggle.disabled = true;
    const enabled = autoIndexToggle.getAttribute('aria-checked') !== 'true';
    try {
      await sendToActiveChatGPT({ action: 'indexAutoSet', enabled });
      taskFeedback.textContent = enabled ? '自动增量索引已开启' : '自动增量索引已关闭；已有任务不受影响';
    } catch (error) {
      taskFeedback.textContent = `自动更新设置失败：${error.message}`;
    } finally {
      autoIndexToggle.disabled = false;
      await loadTaskDashboard(true);
    }
  });

  async function clearLocalData(kind, button) {
    if (button.disabled) return;
    const label = kind === 'index' ? '全文搜索索引' : '完整 JSON 缓存';
    const estimated = dashboardStats?.[kind === 'index' ? 'indexed' : 'complete'];
    const detail = kind === 'index' ? '不会删除完整 JSON；自动更新会关闭，须手动重新建立索引。'
      : '不会删除全文搜索索引；后续需要正文时将按需重新获取。';
    if (!window.confirm(i18n.format('ui.clearVariableVariableRecordsForTheVerifiedAccount', {
      label: i18n.t(kind === 'index' ? 'ui.fullTextSearchIndex' : 'ui.fullJSONCache'),
      count: estimated ?? '—',
      detail: i18n.t(kind === 'index'
        ? 'ui.fullJSONIsRetainedAutomaticIndexingWillBe'
        : 'ui.fullTextIndexIsRetainedChatContentWill')
    }))) return;
    button.disabled = true;
    try {
      const result = await sendToActiveChatGPT({ action: 'clearAccountLocalData', kind });
      taskFeedback.textContent = `已从当前账号清除 ${result.removed} 条${label}；其他数据保持不变`;
    } catch (error) {
      taskFeedback.textContent = `清除失败：${error.message}`;
    } finally {
      button.disabled = false;
      await loadTaskDashboard(true);
    }
  }
  clearIndex.addEventListener('click', () => clearLocalData('index', clearIndex));
  clearRaw.addEventListener('click', () => clearLocalData('raw', clearRaw));

  taskRefresh.addEventListener('click', () => loadTaskDashboard());
  indexStart.addEventListener('click', async () => {
    if (indexStart.disabled) return;
    if (!indexConsentGranted && !window.confirm(i18n.t('ui.theFirstIndexReadsAllAccessibleChatsFrom'))) return;
    indexStart.disabled = true;
    try {
      const response = await sendToActiveChatGPT({ action: 'indexBegin', userConfirmedConsent: true });
      taskFeedback.textContent = response.alreadyStarting
        ? '索引任务正在当前标签页准备中'
        : '已请求开始索引；请保持 ChatGPT 标签页打开，稍后刷新进度';
    } catch (error) {
      taskFeedback.textContent = `索引启动失败：${error.message}`;
    } finally {
      await loadTaskDashboard(true);
    }
  });

  function setToggle(el, on) {
    el.classList.toggle('active', on);
    el.setAttribute('aria-checked', String(on));
  }

  const filenamePresets = {
    datetime_title: '{created_datetime}_{title}',
    datetime_source_title: '{created_datetime}_{source}_{title}',
    title: '{title}',
    date_title: '{created_date}_{title}',
    source_title: '{source}_{title}',
    date_source_title: '{created_date}_{source}_{title}'
  };

  function presetForTemplate(template) {
    const match = Object.entries(filenamePresets).find(([, value]) => value === template);
    return match?.[0] || 'custom';
  }

  function previewFilename(template) {
    const sample = {
      title: i18n.t('ui.filenamePreviewSampleTitle'),
      created_date: '2026-10-24',
      updated_date: '2026-10-25',
      created_datetime: '2026-10-24_09-47-12',
      updated_datetime: '2026-10-25_13-21-05',
      source: 'FlowBase',
      conversation_id: 'abc123'
    };
    const value = String(template || '{created_datetime}_{title}')
      .replace(/\{(title|created_date|updated_date|created_datetime|updated_datetime|source|conversation_id)\}/g, (_, key) => sample[key]);
    return `${value || sample.title}.md`;
  }

  function updateFilenameUi(template) {
    const preset = presetForTemplate(template);
    filenamePreset.value = preset;
    customTemplateWrap.hidden = preset !== 'custom';
    filenameTemplate.value = preset === 'custom' ? template : '';
    filenamePreview.textContent = previewFilename(template);
  }

  function saveFilenameTemplate(template) {
    const value = String(template || '').trim() || '{created_datetime}_{title}';
    chrome.storage.local.set({ exportFilenameTemplate: value });
    filenamePreview.textContent = previewFilename(value);
  }

  chrome.storage.local.get(['enabled', 'showSidebarTime', 'showMessageTimestamps', 'showMinimap', 'openInBackground', 'closeOnOutsideClick', 'fontSize', 'exportFilenameTemplate', 'uiLanguage'], values => {
    languageSelect.value = values.uiLanguage || 'auto';
    i18n.setLanguage(languageSelect.value);
    i18n.setDirection(document.documentElement);
    i18n.apply(document.body);
    setToggle(toggle, values.enabled !== false);
    const showSidebarTime = values.showSidebarTime === true;
    setToggle(sidebarTimeToggle, showSidebarTime);
    setToggle(messageTimeToggle, values.showMessageTimestamps === true);
    setToggle(minimapToggle, values.showMinimap !== false);
    setToggle(openInBackgroundToggle, values.openInBackground !== false);
    setToggle(outsideCloseToggle, values.closeOnOutsideClick !== false);
    size.value = normalizeTimestampFontSize(values.fontSize);
    updateFilenameUi(values.exportFilenameTemplate || '{created_datetime}_{title}');
  });

  function setStatus(ok, text) {
    apiStatus.className = `api-status ${ok ? 'ok' : 'err'}`;
    apiStatusText.textContent = text;
  }

  async function pollStatus() {
    try {
      const response = await sendToActiveChatGPT({ action: 'getStatus' });
      setStatus(Boolean(response.initialized), response.initialized ? '扩展已就绪' : '正在初始化');
    } catch {
      setStatus(false, '请打开 ChatGPT');
    }
  }

  function syncOnPopupOpen() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs[0];
      if (!tab?.id || !tab.url?.includes('chatgpt.com')) return;
      chrome.tabs.sendMessage(tab.id, { action: 'incrementalSync' }, response => {
        if (chrome.runtime.lastError || !response?.success) return;
        count.textContent = response.count ?? count.textContent;
      });
    });
  }

  toggle.addEventListener('click', () => {
    const enabled = !toggle.classList.contains('active');
    setToggle(toggle, enabled);
    chrome.storage.local.set({ enabled });
  });
  sidebarTimeToggle.addEventListener('click', () => {
    const showSidebarTime = !sidebarTimeToggle.classList.contains('active');
    setToggle(sidebarTimeToggle, showSidebarTime);
    chrome.storage.local.set({ showSidebarTime });
  });
  messageTimeToggle.addEventListener('click', () => {
    const showMessageTimestamps = !messageTimeToggle.classList.contains('active');
    setToggle(messageTimeToggle, showMessageTimestamps);
    chrome.storage.local.set({ showMessageTimestamps });
  });
  minimapToggle.addEventListener('click', () => {
    const showMinimap = !minimapToggle.classList.contains('active');
    setToggle(minimapToggle, showMinimap);
    chrome.storage.local.set({ showMinimap });
  });
  minimapToggle.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      minimapToggle.click();
    }
  });
  openInBackgroundToggle.addEventListener('click', () => {
    const openInBackground = !openInBackgroundToggle.classList.contains('active');
    setToggle(openInBackgroundToggle, openInBackground);
    chrome.storage.local.set({ openInBackground });
  });
  outsideCloseToggle.addEventListener('click', () => {
    const closeOnOutsideClick = !outsideCloseToggle.classList.contains('active');
    setToggle(outsideCloseToggle, closeOnOutsideClick);
    chrome.storage.local.set({ closeOnOutsideClick });
  });
  function normalizeTimestampFontSize(value) {
    const legacy = { small: 11, medium: 12, large: 13 };
    const parsed = Number(legacy[value] || value);
    return Number.isFinite(parsed) && parsed > 0
      ? Math.max(8, Math.min(24, Math.round(parsed))) : 11;
  }
  size.addEventListener('change', () => {
    const fontSize = normalizeTimestampFontSize(size.value);
    size.value = fontSize;
    chrome.storage.local.set({ fontSize });
  });
  filenamePreset.addEventListener('change', () => {
    const preset = filenamePreset.value;
    customTemplateWrap.hidden = preset !== 'custom';
    if (preset === 'custom') {
      const current = filenameTemplate.value.trim() || '{created_datetime}_{title}';
      filenameTemplate.value = current;
      saveFilenameTemplate(current);
      filenameTemplate.focus();
      return;
    }
    saveFilenameTemplate(filenamePresets[preset] || '{created_datetime}_{title}');
  });
  filenameTemplate.addEventListener('input', () => saveFilenameTemplate(filenameTemplate.value));

  refresh.addEventListener('click', () => {
    refresh.disabled = true;
    refreshText.textContent = '正在重建本地目录…';
    sendToActiveChatGPT({ action: 'refresh' })
      .then(response => { refreshText.textContent = `完成 · ${response.count ?? 0} 条聊天记录`; })
      .catch(() => { refreshText.textContent = '刷新失败'; })
      .finally(() => {
        pollStatus();
        setTimeout(reset, 1800);
      });
  });

  function reset() {
    refresh.disabled = false;
    refreshText.textContent = '完整刷新 / 重建缓存';
  }

  syncOnPopupOpen();
  pollStatus();
  setInterval(pollStatus, 3000);
  loadTaskDashboard();
  setInterval(() => loadTaskDashboard(), 6000);
  setInterval(updateTaskCountdowns, 1000);
});
