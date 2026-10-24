document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle');
  const sidebarTimeToggle = document.getElementById('sidebarTimeToggle');
  const messageTimeToggle = document.getElementById('messageTimeToggle');
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
  const apiStatus = document.getElementById('apiStatus');
  const apiStatusText = document.getElementById('apiStatusText');
  const taskFeedback = document.getElementById('taskFeedback');
  const taskList = document.getElementById('taskList');
  const taskLogList = document.getElementById('taskLogList');
  const taskRefresh = document.getElementById('taskRefresh');
  const indexStartArea = document.getElementById('indexStartArea');
  const indexStart = document.getElementById('indexStart');
  const indexConsentStatus = document.getElementById('indexConsentStatus');
  let taskLoading = false;
  let indexConsentGranted = false;

  function sendToActiveChatGPT(message) {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs?.[0];
        let isChatGPT = false;
        try { isChatGPT = new URL(tab?.url).hostname === 'chatgpt.com'; } catch { /* Not a ChatGPT tab. */ }
        if (!isChatGPT || !tab?.id) {
          reject(new Error('请切换到已登录的 ChatGPT 标签页'));
          return;
        }
        chrome.tabs.sendMessage(tab.id, message, response => {
          const transportError = chrome.runtime.lastError;
          if (transportError) reject(new Error(transportError.message));
          else if (!response?.success) reject(new Error(response?.error || '读取任务失败'));
          else resolve(response);
        });
      });
    });
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
    const policy = data.indexPolicy || {};
    indexConsentGranted = Boolean(policy.consentAt);
    const initialDone = Boolean(policy.initialCompletedAt);
    const unfinishedIndexTask = (data.tasks || []).find(task => task.type === 'index' &&
      ['pending', 'running', 'paused'].includes(task.status));
    indexStartArea.hidden = false;
    indexStart.disabled = Boolean(unfinishedIndexTask);
    indexStart.textContent = !policy.consentAt ? '建立全文索引（需授权）'
      : initialDone ? '立即检查新增聊天' : '继续首次全文索引';
    indexConsentStatus.textContent = unfinishedIndexTask
      ? '索引任务已创建，请使用下方任务控制和进度查看'
      : initialDone ? '首次索引已完成，之后自动检查增量变化'
        : policy.consentAt ? '已授权，首次完整索引尚未完成' : '首次扫描需确认授权；原始 JSON 仅保存在本机';
    taskList.replaceChildren();
    for (const task of data.tasks || []) {
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
        if (['completed', 'canceled', 'failed'].includes(task.status)) {
          addTaskButton(actions, '清理分卷', () => {
            if (!window.confirm('只清理扩展数据库中此任务保存的 ZIP 分卷？不会删除原始聊天缓存、全文索引、任务历史或已下载文件。')) {
              return Promise.resolve({ deleted: 0 });
            }
            return sendToActiveChatGPT({ action: 'taskClearVolumes', id: task.id });
          });
        }
      }
      card.append(meta, progress, detail, actions);
      taskList.appendChild(card);
    }
    if (!taskList.childElementCount) {
      const empty = document.createElement('div');
      empty.className = 'hint';
      empty.textContent = '当前账号暂无任务';
      taskList.appendChild(empty);
    }
    taskLogList.replaceChildren();
    for (const log of data.logs || []) {
      const entry = document.createElement('div');
      entry.textContent = `${new Date(log.createdAt).toLocaleString()} · ${log.message || log.code || log.type}`;
      taskLogList.appendChild(entry);
    }
    if (!taskLogList.childElementCount) taskLogList.textContent = '暂无记录';
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
      indexStartArea.hidden = true;
      taskList.replaceChildren();
      taskLogList.replaceChildren();
      taskFeedback.textContent = `任务不可用：${error.message}`;
    } finally {
      taskLoading = false;
    }
  }

  taskRefresh.addEventListener('click', () => loadTaskDashboard());
  indexStart.addEventListener('click', async () => {
    if (indexStart.disabled) return;
    if (!indexConsentGranted && !window.confirm(
      '首次全文索引会读取当前 ChatGPT 账号全部可读取的聊天目录，并按需获取未缓存的完整聊天正文。' +
      '本机保存原始 JSON 和搜索索引，首次完成后自动增量更新。是否授权？'
    )) return;
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

  function setSidebarControlsEnabled(on) {
    size.disabled = !on;
  }

  const filenamePresets = {
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
      title: 'NocoBase 官方 Demo 分析',
      created_date: '2026-09-05',
      updated_date: '2026-09-07',
      source: 'FlowBase',
      conversation_id: 'abc123'
    };
    const value = String(template || '{title}').replace(/\{(title|created_date|updated_date|source|conversation_id)\}/g, (_, key) => sample[key]);
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
    const value = String(template || '').trim() || '{title}';
    chrome.storage.local.set({ exportFilenameTemplate: value });
    filenamePreview.textContent = previewFilename(value);
  }

  chrome.storage.local.get(['enabled', 'showSidebarTime', 'showMessageTimestamps', 'openInBackground', 'closeOnOutsideClick', 'fontSize', 'exportFilenameTemplate'], values => {
    setToggle(toggle, values.enabled !== false);
    const showSidebarTime = values.showSidebarTime === true;
    setToggle(sidebarTimeToggle, showSidebarTime);
    setToggle(messageTimeToggle, values.showMessageTimestamps === true);
    setToggle(openInBackgroundToggle, values.openInBackground !== false);
    setToggle(outsideCloseToggle, values.closeOnOutsideClick !== false);
    setSidebarControlsEnabled(showSidebarTime);
    size.value = values.fontSize || 'small';
    updateFilenameUi(values.exportFilenameTemplate || '{title}');
  });

  function setStatus(ok, text) {
    apiStatus.className = `api-status ${ok ? 'ok' : 'err'}`;
    apiStatusText.textContent = text;
  }

  function pollStatus() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs[0];
      if (!tab?.url?.includes('chatgpt.com')) {
        count.textContent = '–';
        setStatus(false, '请打开 ChatGPT');
        return;
      }
      chrome.tabs.sendMessage(tab.id, { action: 'getStatus' }, response => {
        if (chrome.runtime.lastError || !response) {
          count.textContent = '?';
          setStatus(false, '扩展尚未就绪');
          return;
        }
        count.textContent = response.directoryCount ?? 0;
        setStatus(Boolean(response.initialized), response.initialized ? '扩展已就绪' : '正在初始化');
      });
    });
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
    setSidebarControlsEnabled(showSidebarTime);
    chrome.storage.local.set({ showSidebarTime });
  });
  messageTimeToggle.addEventListener('click', () => {
    const showMessageTimestamps = !messageTimeToggle.classList.contains('active');
    setToggle(messageTimeToggle, showMessageTimestamps);
    chrome.storage.local.set({ showMessageTimestamps });
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
  size.addEventListener('change', () => chrome.storage.local.set({ fontSize: size.value }));
  filenamePreset.addEventListener('change', () => {
    const preset = filenamePreset.value;
    customTemplateWrap.hidden = preset !== 'custom';
    if (preset === 'custom') {
      const current = filenameTemplate.value.trim() || '{created_date}_{title}';
      filenameTemplate.value = current;
      saveFilenameTemplate(current);
      filenameTemplate.focus();
      return;
    }
    saveFilenameTemplate(filenamePresets[preset] || '{title}');
  });
  filenameTemplate.addEventListener('input', () => saveFilenameTemplate(filenameTemplate.value));

  refresh.addEventListener('click', () => {
    refresh.disabled = true;
    refreshText.textContent = '正在重建本地目录…';
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs[0]) return reset();
      chrome.tabs.sendMessage(tabs[0].id, { action: 'refresh' }, response => {
        refreshText.textContent = response?.success
          ? `完成 · ${response.count ?? 0} 条聊天记录`
          : '刷新失败';
        pollStatus();
        setTimeout(reset, 1800);
      });
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
});
