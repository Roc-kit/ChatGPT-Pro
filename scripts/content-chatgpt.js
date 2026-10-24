/** ChatGPT Pro – ChatGPT page integration */

(function () {
  'use strict';

  const INIT_DELAY_MS = 900;
  const RECHECK_MS = 30 * 1000;
  const BACKGROUND_SYNC_MS = 5 * 60 * 1000;
  const PANEL_OVERLAP = 8;
  const VIEWPORT_MARGIN = 10;
  const PANEL_MIN_WIDTH = 390;
  const PANEL_MIN_HEIGHT = 280;
  const PANEL_COMPACT_WIDTH = 500;
  const EXPORT_GROUP_SIZE = 50;
  const EXPORT_REQUEST_GAP_MS = 900;
  const EXPORT_GROUP_GAP_MS = 10 * 1000;
  const EXPORT_RATE_LIMIT_DEFAULT_MS = 60 * 1000;
  const EXPORT_MAX_RETRIES = 3;
  const EXPORT_RETRY_DELAYS_MS = [1000, 3000, 8000];
  const MESSAGE_ROUTE_CHECK_MS = 500;
  const MESSAGE_ROUTE_RETRY_DELAYS_MS = [100, 400, 1000, 2200, 5000, 10000];

  const S = {
    ready: false,
    apiData: new Map(),
    apiLoaded: false,
    stamped: new WeakSet(),
    observer: null,
    timeline: null,
    launcher: null,
    launcherMoved: false,
    currentExportMoved: false,
    messageConversationId: null,
    messageConversation: null,
    messageConversationPromise: null,
    messageVisibilityObserver: null,
    observedMessageElements: new WeakSet(),
    observedConversationId: undefined,
    observedMessageSignature: '',
    messageRouteRetryTimers: [],
    settings: {
      enabled: true,
      showSidebarTime: false,
      showMessageTimestamps: false,
      fontSize: 'small',
      openInBackground: true,
      closeOnOutsideClick: true,
      exportFilenameTemplate: '{title}',
      launcherPosition: { x: 0.94, y: 0.76 },
      currentExportPositionY: 0.82,
      panelSize: { width: 580, height: 560 }
    }
  };

  const log = (...args) => console.log('[ChatGPT Pro]', ...args);

  function timestampValue(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value < 1e10 ? value * 1000 : value;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function formatTime(value) {
    const ms = timestampValue(value);
    if (!ms) return '时间未知';
    const d = new Date(ms);
    const pad = n => String(n).padStart(2, '0');
    const dayNumber = d.getDay() === 0 ? 7 : d.getDay();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())} D${dayNumber}`;
  }

  function formatMessageTime(value) {
    const ms = timestampValue(value);
    if (!ms) return '';
    const d = new Date(ms);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function allConvLinks() {
    return window.ChatGPTDomAdapter.sidebarConversationLinks();
  }

  function extractId(a) {
    return window.ChatGPTDomAdapter.conversationIdFromHref(a?.href || a?.getAttribute?.('href'));
  }

  function removeMessageTimestamps() {
    document.querySelectorAll('[data-chatgpt-pro-message-timestamp]').forEach(el => el.remove());
    S.messageVisibilityObserver?.disconnect();
    S.messageVisibilityObserver = null;
    S.observedMessageElements = new WeakSet();
    S.messageConversationId = null;
    S.messageConversation = null;
    S.messageConversationPromise = null;
  }

  function clearMessageRouteRetryTimers() {
    S.messageRouteRetryTimers.forEach(timer => clearTimeout(timer));
    S.messageRouteRetryTimers = [];
  }

  function createMessageTimestamp(value, role = '') {
    const text = formatMessageTime(value);
    if (!text) return null;
    const span = document.createElement('span');
    span.className = [
      'chatgpt-pro-message-timestamp',
      role === 'assistant' ? 'chatgpt-pro-message-timestamp-assistant' : '',
      role === 'user' ? 'chatgpt-pro-message-timestamp-user' : ''
    ].filter(Boolean).join(' ');
    span.setAttribute('data-chatgpt-pro-message-timestamp', '1');
    span.textContent = text;
    return span;
  }

  function conversationMessageForElement(data, messageEl) {
    for (const id of window.ChatGPTDomAdapter.messageIds(messageEl)) {
      const message = data?.mapping?.[id]?.message;
      if (message?.create_time) return message;
    }
    return null;
  }

  function stampMessageTimestampElement(messageEl) {
    if (!S.messageConversation || !(messageEl instanceof Element)) return false;
    const target = window.ChatGPTDomAdapter.timestampTarget(messageEl);
    if (!target || target.querySelector(':scope > [data-chatgpt-pro-message-timestamp]')) return false;
    const message = conversationMessageForElement(S.messageConversation, messageEl);
    if (!message?.create_time) return false;
    const timestamp = createMessageTimestamp(message.create_time, window.ChatGPTDomAdapter.messageRole(messageEl));
    if (!timestamp) return false;
    target.insertBefore(timestamp, target.firstChild);
    return true;
  }

  function ensureMessageVisibilityObserver() {
    if (S.messageVisibilityObserver) return S.messageVisibilityObserver;
    S.messageVisibilityObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const stamped = stampMessageTimestampElement(entry.target);
        S.messageVisibilityObserver?.unobserve(entry.target);
        if (!stamped) S.observedMessageElements.delete(entry.target);
      }
    }, { root: null, threshold: 0 });
    return S.messageVisibilityObserver;
  }

  async function stampMessageTimestamps() {
    if (!S.settings.enabled || !S.settings.showMessageTimestamps) {
      removeMessageTimestamps();
      return 0;
    }
    const conversationId = currentConversationId();
    if (!conversationId) return 0;
    if (S.messageConversationId !== conversationId) {
      removeMessageTimestamps();
      S.messageConversationId = conversationId;
    }
    if (!S.messageConversation) {
      S.messageConversationPromise ||= window.APIHandler.getConversation(conversationId);
      try {
        const data = await S.messageConversationPromise;
        if (currentConversationId() !== conversationId || S.messageConversationId !== conversationId) return 0;
        S.messageConversation = data;
      } catch (error) {
        log('Message timestamp data load failed:', error.message);
        S.messageConversationPromise = null;
        return 0;
      }
    }

    const observer = ensureMessageVisibilityObserver();
    let observed = 0;
    for (const messageEl of window.ChatGPTDomAdapter.messageElements()) {
      if (messageEl.closest('.chatgpt-pro-panel')) continue;
      const target = window.ChatGPTDomAdapter.timestampTarget(messageEl);
      if (!target) continue;
      if (target.querySelector(':scope > [data-chatgpt-pro-message-timestamp]')) continue;
      if (stampMessageTimestampElement(messageEl)) {
        S.observedMessageElements.add(messageEl);
        continue;
      }
      if (S.observedMessageElements.has(messageEl)) continue;
      S.observedMessageElements.add(messageEl);
      observer.observe(messageEl);
      observed++;
    }
    return observed;
  }

  function renderedMessageIds() {
    const ids = new Set();
    for (const messageEl of window.ChatGPTDomAdapter.messageElements()) {
      window.ChatGPTDomAdapter.messageIds(messageEl).forEach(id => ids.add(id));
    }
    return [...ids];
  }

  function renderedMessageSignature() {
    return renderedMessageIds().join('|');
  }

  function hasMissingRenderedTimestamps() {
    if (!S.messageConversation) return false;
    return window.ChatGPTDomAdapter.messageElements().some(messageEl => {
      const target = window.ChatGPTDomAdapter.timestampTarget(messageEl);
      if (!target || target.querySelector(':scope > [data-chatgpt-pro-message-timestamp]')) return false;
      return Boolean(conversationMessageForElement(S.messageConversation, messageEl)?.create_time);
    });
  }

  function refreshMessageTimestampsForView() {
    if (refreshMessageTimestampsForRoute(false)) return;
    if (!S.settings.enabled || !S.settings.showMessageTimestamps || !S.observedConversationId) return;

    const signature = renderedMessageSignature();
    if (signature && signature !== S.observedMessageSignature) {
      S.observedMessageSignature = signature;
      S.messageVisibilityObserver?.disconnect();
      S.messageVisibilityObserver = null;
      S.observedMessageElements = new WeakSet();

      const ids = renderedMessageIds();
      if (S.messageConversation && ids.some(id => !S.messageConversation?.mapping?.[id])) {
        S.messageConversation = null;
        S.messageConversationPromise = null;
      }
      stampMessageTimestamps().catch(error => log('Message timestamp view refresh failed:', error.message));
      return;
    }

    // ChatGPT can rebuild a message body without changing its semantic IDs.
    // Restore decorations that React removed from those reused nodes.
    if (hasMissingRenderedTimestamps()) {
      stampMessageTimestamps().catch(error => log('Message timestamp repair failed:', error.message));
    }
  }

  function refreshMessageTimestampsForRoute(force = false) {
    const conversationId = currentConversationId();
    if (!force && conversationId === S.observedConversationId) return false;

    S.observedConversationId = conversationId;
    S.observedMessageSignature = renderedMessageSignature();
    clearMessageRouteRetryTimers();
    removeMessageTimestamps();
    if (S.settings.enabled) ensureCurrentChatExportButton();

    if (!S.settings.enabled || !S.settings.showMessageTimestamps || !conversationId) return true;
    for (const delay of MESSAGE_ROUTE_RETRY_DELAYS_MS) {
      const timer = window.setTimeout(() => {
        S.messageRouteRetryTimers = S.messageRouteRetryTimers.filter(item => item !== timer);
        if (currentConversationId() !== conversationId) return;
        stampMessageTimestamps().catch(error => log('Message timestamp route refresh failed:', error.message));
        resumePendingSearchJump().catch(error => log('Search result jump failed:', error.message));
      }, delay);
      S.messageRouteRetryTimers.push(timer);
    }
    return true;
  }

  function setupConversationRouteTracking() {
    const checkView = () => refreshMessageTimestampsForView();
    window.addEventListener('popstate', checkView);
    window.addEventListener('hashchange', checkView);
    window.setInterval(checkView, MESSAGE_ROUTE_CHECK_MS);
  }

  function makeBadge(text) {
    const badge = document.createElement('span');
    badge.setAttribute('data-chatgpt-pro', '1');
    badge.className = [
      'chatgpt-pro-badge',
      `chatgpt-pro-${S.settings.fontSize}`
    ].filter(Boolean).join(' ');
    badge.textContent = text;
    return badge;
  }

  function getSidebarTitleHost(link) {
    const semanticHost = link.querySelector('[data-thread-title]');
    if (semanticHost) return semanticHost;
    const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentElement?.closest('[data-chatgpt-pro-holder]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    return walker.nextNode()?.parentElement || link;
  }

  function injectBadges(link, rec) {
    if (link.querySelector('[data-chatgpt-pro-holder]')) return false;
    const holder = document.createElement('span');
    holder.className = 'chatgpt-pro-holder';
    holder.setAttribute('data-chatgpt-pro-holder', '1');

    if (rec.createTime) holder.appendChild(makeBadge(formatTime(rec.createTime)));

    if (!holder.childElementCount) return false;
    const titleHost = getSidebarTitleHost(link);
    link.classList.add('chatgpt-pro-decorated');
    titleHost.classList.add('chatgpt-pro-sidebar-title-host');
    titleHost.appendChild(holder);
    return true;
  }

  function removeAllBadges() {
    document.querySelectorAll('[data-chatgpt-pro-holder]').forEach(el => el.remove());
    document.querySelectorAll('.chatgpt-pro-decorated').forEach(el =>
      {
        el.classList.remove('chatgpt-pro-decorated');
        el.querySelectorAll('.chatgpt-pro-sidebar-title-host').forEach(host => host.classList.remove('chatgpt-pro-sidebar-title-host'));
      }
    );
    S.stamped = new WeakSet();
  }

  function stampAll() {
    if (!S.settings.enabled || !S.settings.showSidebarTime || !S.apiData.size) return 0;
    let count = 0;
    for (const link of allConvLinks()) {
      if (S.stamped.has(link) && link.querySelector('[data-chatgpt-pro-holder]')) continue;
      const id = extractId(link);
      if (!id) continue;
      const rec = S.apiData.get(id) || S.apiData.get(id.slice(0, 8));
      if (!rec) continue;
      if (injectBadges(link, rec)) {
        S.stamped.add(link);
        count++;
      }
    }
    return count;
  }

  async function reloadTimestampMap(forceFull = false) {
    const map = await window.APIHandler.getConversationTimestamps(forceFull);
    if (map?.size) {
      S.apiData = map;
      S.apiLoaded = true;
      removeAllBadges();
      if (S.settings.showSidebarTime) stampAll();
    }
    return map;
  }

  function applySyncedConversationRecords(records, statusText = '已完成后台增量同步') {
    S.apiData = new Map();
    for (const rec of records) {
      S.apiData.set(rec.id, rec);
      if (rec.id?.length > 8) S.apiData.set(rec.id.slice(0, 8), rec);
    }
    S.apiLoaded = true;

    if (S.settings.showSidebarTime) {
      removeAllBadges();
      stampAll();
    }

    if (S.timeline?.isConnected) {
      const list = S.timeline.querySelector('.chatgpt-pro-rows');
      const projectFilter = S.timeline.querySelector('.chatgpt-pro-project-filter');
      const createdSort = S.timeline.querySelector('.chatgpt-pro-created-sort');
      const titleFilterInput = S.timeline.querySelector('.chatgpt-pro-title-filter-input');
      const status = S.timeline.querySelector('.chatgpt-pro-panel-status');
      const direction = createdSort?.getAttribute('aria-sort') === 'ascending' ? 'oldest' : 'newest';
      if (projectFilter) populateProjectFilter(projectFilter, records);
      if (list && projectFilter) renderTimelineRows(list, records, direction, projectFilter.value, null, titleFilterInput?.value || '');
      const searchView = S.timeline.querySelector('[data-panel-content="search"]');
      if (status && searchView?.hidden !== false) status.textContent = `${records.length} 条 · ${statusText}`;
    }
  }

  async function incrementalSyncConversationList(statusText = '已完成增量同步') {
    const records = await window.APIHandler.syncConversationList(false);
    applySyncedConversationRecords(records, statusText);
    return records;
  }

  async function backgroundSyncConversationList() {
    if (!S.settings.enabled || document.hidden) return;
    try {
      await incrementalSyncConversationList('已完成后台增量同步');
    } catch (error) {
      log('Background sync failed:', error.message);
    }
  }

  function closeTimeline() {
    S.timeline?.remove();
    S.timeline = null;
    if (S.launcher) {
      S.launcher.classList.remove('chatgpt-pro-open');
      S.launcher.removeAttribute('data-panel-vertical');
      S.launcher.removeAttribute('data-panel-horizontal');
      S.launcher.setAttribute('aria-expanded', 'false');
      S.launcher.textContent = '☰';
      S.launcher.title = '聊天目录（可拖动）';
    }
  }

  function setupOutsideClose() {
    document.addEventListener('pointerdown', event => {
      if (!S.timeline || !S.settings.closeOnOutsideClick) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (S.timeline.contains(target) || S.launcher?.contains(target)) return;
      closeTimeline();
    });
  }

  function getLauncherPixelPosition() {
    const button = S.launcher;
    if (!button) return { left: 20, top: 80 };
    const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - button.offsetWidth - VIEWPORT_MARGIN);
    const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - button.offsetHeight - VIEWPORT_MARGIN);
    return {
      left: Math.round(VIEWPORT_MARGIN + (maxLeft - VIEWPORT_MARGIN) * S.settings.launcherPosition.x),
      top: Math.round(VIEWPORT_MARGIN + (maxTop - VIEWPORT_MARGIN) * S.settings.launcherPosition.y)
    };
  }

  function placeLauncher() {
    if (!S.launcher) return;
    const { left, top } = getLauncherPixelPosition();
    S.launcher.style.left = `${left}px`;
    S.launcher.style.top = `${top}px`;
  }

  function saveLauncherPosition(left, top) {
    if (!S.launcher) return;
    const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - S.launcher.offsetWidth - VIEWPORT_MARGIN);
    const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - S.launcher.offsetHeight - VIEWPORT_MARGIN);
    const x = Math.max(0, Math.min(1, (left - VIEWPORT_MARGIN) / Math.max(1, maxLeft - VIEWPORT_MARGIN)));
    const y = Math.max(0, Math.min(1, (top - VIEWPORT_MARGIN) / Math.max(1, maxTop - VIEWPORT_MARGIN)));
    S.settings.launcherPosition = { x, y };
    chrome.storage.local.set({ launcherPosition: S.settings.launcherPosition });
  }

  function setupLauncherDrag(button) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    button.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      dragging = true;
      S.launcherMoved = false;
      const rect = button.getBoundingClientRect();
      startX = event.clientX;
      startY = event.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      button.setPointerCapture(event.pointerId);
      button.classList.add('chatgpt-pro-dragging');
    });

    button.addEventListener('pointermove', event => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 5) S.launcherMoved = true;
      const maxLeft = window.innerWidth - button.offsetWidth - VIEWPORT_MARGIN;
      const maxTop = window.innerHeight - button.offsetHeight - VIEWPORT_MARGIN;
      const left = Math.max(VIEWPORT_MARGIN, Math.min(maxLeft, startLeft + dx));
      const top = Math.max(VIEWPORT_MARGIN, Math.min(maxTop, startTop + dy));
      button.style.left = `${left}px`;
      button.style.top = `${top}px`;
      if (S.timeline) positionTimelinePanel();
    });

    const finish = event => {
      if (!dragging) return;
      dragging = false;
      button.classList.remove('chatgpt-pro-dragging');
      try { button.releasePointerCapture(event.pointerId); } catch (_) {}
      const rect = button.getBoundingClientRect();
      saveLauncherPosition(rect.left, rect.top);
      if (S.timeline) positionTimelinePanel();
    };
    button.addEventListener('pointerup', finish);
    button.addEventListener('pointercancel', finish);
  }

  function ensureFloatingButton() {
    if (S.launcher?.isConnected) return;
    const existing = document.querySelector('[data-chatgpt-pro-launcher]');
    if (existing) {
      S.launcher = existing;
      return;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chatgpt-pro-launcher';
    button.setAttribute('data-chatgpt-pro-launcher', '1');
    button.setAttribute('aria-label', '打开聊天目录');
    button.setAttribute('aria-expanded', 'false');
    button.title = '聊天目录（可拖动）';
    button.textContent = '☰';
    button.addEventListener('click', event => {
      if (S.launcherMoved) {
        S.launcherMoved = false;
        event.preventDefault();
        return;
      }
      S.timeline ? closeTimeline() : openTimeline();
    });
    document.body.appendChild(button);
    S.launcher = button;
    placeLauncher();
    setupLauncherDrag(button);
  }

  function currentConversationId() {
    const match = window.location.pathname.match(/\/c\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  }

  function currentConversationRecord() {
    const id = currentConversationId();
    if (!id) return null;
    const cached = [...S.apiData.values()].find(item => item?.id === id);
    return cached || { id, title: document.title.replace(/\s*[|·-]\s*ChatGPT.*$/i, '').trim() || 'ChatGPT 聊天记录' };
  }

  function placeCurrentChatExportButton(button = document.querySelector('[data-chatgpt-pro-current-export]')) {
    if (!button) return;
    const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - button.offsetHeight - VIEWPORT_MARGIN);
    const y = Math.max(0, Math.min(1, Number(S.settings.currentExportPositionY) || 0));
    const top = Math.round(VIEWPORT_MARGIN + (maxTop - VIEWPORT_MARGIN) * y);
    button.style.top = `${top}px`;
  }

  function saveCurrentChatExportPosition(top, button) {
    const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - button.offsetHeight - VIEWPORT_MARGIN);
    const y = Math.max(0, Math.min(1, (top - VIEWPORT_MARGIN) / Math.max(1, maxTop - VIEWPORT_MARGIN)));
    S.settings.currentExportPositionY = y;
    chrome.storage.local.set({ currentExportPositionY: y });
  }

  function setupCurrentChatExportDrag(button) {
    let dragging = false;
    let startY = 0;
    let startTop = 0;

    button.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      dragging = true;
      S.currentExportMoved = false;
      const rect = button.getBoundingClientRect();
      startY = event.clientY;
      startTop = rect.top;
      button.setPointerCapture(event.pointerId);
      button.classList.add('chatgpt-pro-dragging');
    });

    button.addEventListener('pointermove', event => {
      if (!dragging) return;
      const dy = event.clientY - startY;
      if (Math.abs(dy) > 5) S.currentExportMoved = true;
      const maxTop = window.innerHeight - button.offsetHeight - VIEWPORT_MARGIN;
      const top = Math.max(VIEWPORT_MARGIN, Math.min(maxTop, startTop + dy));
      button.style.top = `${top}px`;
    });

    const finish = event => {
      if (!dragging) return;
      dragging = false;
      button.classList.remove('chatgpt-pro-dragging');
      try { button.releasePointerCapture(event.pointerId); } catch (_) {}
      saveCurrentChatExportPosition(button.getBoundingClientRect().top, button);
    };
    button.addEventListener('pointerup', finish);
    button.addEventListener('pointercancel', finish);
  }

  function ensureCurrentChatExportButton() {
    const id = currentConversationId();
    const existing = document.querySelector('[data-chatgpt-pro-current-export]');
    if (!id) {
      existing?.remove();
      return;
    }
    if (existing) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chatgpt-pro-current-export';
    button.setAttribute('data-chatgpt-pro-current-export', '1');
    button.setAttribute('aria-label', '导出整个对话（Markdown）');
    button.title = '导出整个对话（Markdown）';
    button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <path d="M14 2v6h6"></path>
        <path d="M12 11v6"></path>
        <path d="m9.5 14.5 2.5 2.5 2.5-2.5"></path>
      </svg>`;
    button.addEventListener('click', async () => {
      if (S.currentExportMoved) {
        S.currentExportMoved = false;
        return;
      }
      if (button.disabled) return;
      const rec = currentConversationRecord();
      if (!rec) return;
      button.disabled = true;
      button.title = '正在导出整个对话…';
      try {
        await exportConversationMarkdown(rec);
        button.title = '已导出整个对话';
        window.setTimeout(() => {
          if (button.isConnected) button.title = '导出整个对话（Markdown）';
        }, 1000);
      } catch (error) {
        button.title = `导出失败：${error.message}`;
        window.setTimeout(() => {
          if (button.isConnected) {
            button.title = '导出整个对话（Markdown）';
          }
        }, 1600);
      } finally {
        button.disabled = false;
      }
    });
    document.body.appendChild(button);
    placeCurrentChatExportButton(button);
    setupCurrentChatExportDrag(button);
  }

  function removeFloatingButton() {
    closeTimeline();
    S.launcher?.remove();
    S.launcher = null;
    document.querySelector('[data-chatgpt-pro-current-export]')?.remove();
  }

  function positionTimelinePanel() {
    if (!S.timeline || !S.launcher) return;
    const panel = S.timeline;
    const buttonRect = S.launcher.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();

    const buttonCenterY = buttonRect.top + buttonRect.height / 2;
    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
    const vertical = buttonCenterY > window.innerHeight / 2 ? 'up' : 'down';
    const horizontal = buttonCenterX > window.innerWidth / 2 ? 'left' : 'right';

    // The launcher doubles as the panel's collapse handle. Make it fully
    // overlap the nearest panel corner so launcher + panel read as one UI.
    let top = vertical === 'up'
      ? buttonRect.bottom - panelRect.height
      : buttonRect.top;

    let left = horizontal === 'left'
      ? buttonRect.right - panelRect.width
      : buttonRect.left;

    top = Math.max(VIEWPORT_MARGIN, Math.min(window.innerHeight - panelRect.height - VIEWPORT_MARGIN, top));
    left = Math.max(VIEWPORT_MARGIN, Math.min(window.innerWidth - panelRect.width - VIEWPORT_MARGIN, left));
    panel.style.top = `${Math.round(top)}px`;
    panel.style.left = `${Math.round(left)}px`;
    panel.dataset.vertical = vertical;
    panel.dataset.horizontal = horizontal;
    S.launcher.dataset.panelVertical = vertical;
    S.launcher.dataset.panelHorizontal = horizontal;
  }

  function applyPanelSize(panel) {
    const maxWidth = Math.max(240, window.innerWidth - VIEWPORT_MARGIN * 2);
    const maxHeight = Math.max(220, window.innerHeight - VIEWPORT_MARGIN * 2);
    const minWidth = Math.min(PANEL_MIN_WIDTH, maxWidth);
    const minHeight = Math.min(PANEL_MIN_HEIGHT, maxHeight);
    const width = Math.max(minWidth, Math.min(maxWidth, Number(S.settings.panelSize?.width) || 580));
    const height = Math.max(minHeight, Math.min(maxHeight, Number(S.settings.panelSize?.height) || 560));
    panel.style.setProperty('width', `${Math.round(width)}px`, 'important');
    panel.style.setProperty('height', `${Math.round(height)}px`, 'important');
    panel.classList.toggle('chatgpt-pro-compact', width < PANEL_COMPACT_WIDTH);
  }

  function setupPanelResize(panel) {
    const directions = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'];
    for (const direction of directions) {
      const handle = document.createElement('div');
      handle.className = `chatgpt-pro-resize-handle chatgpt-pro-resize-${direction}`;
      handle.dataset.resizeDirection = direction;
      panel.appendChild(handle);

      handle.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        const startX = event.clientX;
        const startY = event.clientY;
        const startRect = panel.getBoundingClientRect();
        handle.setPointerCapture(event.pointerId);
        panel.classList.add('chatgpt-pro-resizing');

        const move = moveEvent => {
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;
          let width = startRect.width;
          let height = startRect.height;
          if (direction.includes('e')) width = startRect.width + dx;
          if (direction.includes('w')) width = startRect.width - dx;
          if (direction.includes('s')) height = startRect.height + dy;
          if (direction.includes('n')) height = startRect.height - dy;

          const maxWidth = Math.max(240, window.innerWidth - VIEWPORT_MARGIN * 2);
          const maxHeight = Math.max(220, window.innerHeight - VIEWPORT_MARGIN * 2);
          const minWidth = Math.min(PANEL_MIN_WIDTH, maxWidth);
          const minHeight = Math.min(PANEL_MIN_HEIGHT, maxHeight);
          width = Math.max(minWidth, Math.min(maxWidth, width));
          height = Math.max(minHeight, Math.min(maxHeight, height));
          panel.style.setProperty('width', `${Math.round(width)}px`, 'important');
          panel.style.setProperty('height', `${Math.round(height)}px`, 'important');
          panel.classList.toggle('chatgpt-pro-compact', width < PANEL_COMPACT_WIDTH);
          positionTimelinePanel();
        };

        const finish = finishEvent => {
          handle.removeEventListener('pointermove', move);
          handle.removeEventListener('pointerup', finish);
          handle.removeEventListener('pointercancel', finish);
          panel.classList.remove('chatgpt-pro-resizing');
          try { handle.releasePointerCapture(finishEvent.pointerId); } catch (_) {}
          const rect = panel.getBoundingClientRect();
          S.settings.panelSize = { width: Math.round(rect.width), height: Math.round(rect.height) };
          chrome.storage.local.set({ panelSize: S.settings.panelSize });
        };

        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', finish);
        handle.addEventListener('pointercancel', finish);
      });
    }
  }

  function projectFilterKey(rec) {
    return rec.projectId || '__regular__';
  }

  function conversationSourceType(rec) {
    if (!rec.projectId) return 'regular';
    return String(rec.projectId).startsWith('g-p-') ? 'project' : 'gpt';
  }

  function conversationSourceName(rec) {
    const type = conversationSourceType(rec);
    if (type === 'regular') return '—';
    if (rec.projectName) return rec.projectName;
    return type === 'gpt' ? 'GPT' : '未命名项目';
  }

  function populateProjectFilter(select, records) {
    const selected = select.value || '__all__';
    const projects = new Map();
    let hasRegular = false;
    for (const rec of records) {
      if (rec.projectId) {
        const type = conversationSourceType(rec);
        const name = conversationSourceName(rec);
        projects.set(rec.projectId, {
          type,
          name,
          label: type === 'gpt' ? `GPT · ${name}` : `项目 · ${name}`
        });
      }
      else hasRegular = true;
    }
    select.replaceChildren();
    const all = document.createElement('option');
    all.value = '__all__';
    all.textContent = '来源 · 全部';
    select.appendChild(all);
    if (hasRegular) {
      const regular = document.createElement('option');
      regular.value = '__regular__';
      regular.textContent = '— · 普通聊天';
      select.appendChild(regular);
    }
    [...projects.entries()]
      .sort((a, b) => a[1].label.localeCompare(b[1].label, 'zh-CN'))
      .forEach(([id, source]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = source.label;
        select.appendChild(option);
    });
    select.value = [...select.options].some(option => option.value === selected) ? selected : '__all__';
  }

  function normalizedSearchText(value) {
    return String(value || '').normalize('NFKC').toLocaleLowerCase('zh-CN').trim();
  }

  function visibleTimelineRecords(records, direction = 'newest', projectFilter = '__all__', titleQuery = '') {
    const factor = direction === 'oldest' ? 1 : -1;
    const sourceFiltered = projectFilter === '__all__'
      ? records
      : records.filter(rec => projectFilterKey(rec) === projectFilter);
    const query = normalizedSearchText(titleQuery);
    const filtered = query
      ? sourceFiltered.filter(rec => normalizedSearchText(rec.title).includes(query))
      : sourceFiltered;
    return [...filtered].sort((a, b) => factor * (timestampValue(a.createTime) - timestampValue(b.createTime)));
  }

  function renderTimelineRows(container, records, direction = 'newest', projectFilter = '__all__', selection = null, titleQuery = '') {
    const sorted = visibleTimelineRecords(records, direction, projectFilter, titleQuery);

    container.replaceChildren();
    for (const rec of sorted) {
      const row = document.createElement('a');
      row.className = 'chatgpt-pro-row';
      row.href = rec.href || `/c/${rec.id}`;
      row.addEventListener('click', event => {
        if (!S.settings.openInBackground) return;
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        chrome.runtime.sendMessage({ action: 'openInBackground', url: row.href });
      });

      const selectCell = document.createElement('span');
      selectCell.className = 'chatgpt-pro-row-select';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'chatgpt-pro-row-checkbox';
      checkbox.checked = Boolean(selection?.ids?.has(rec.id));
      checkbox.setAttribute('aria-label', `选择 ${rec.title}`);
      checkbox.addEventListener('click', event => event.stopPropagation());
      checkbox.addEventListener('change', event => {
        event.stopPropagation();
        if (!selection?.ids) return;
        if (checkbox.checked) selection.ids.add(rec.id);
        else selection.ids.delete(rec.id);
        selection.onChange?.(sorted);
      });
      selectCell.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
      });
      selectCell.appendChild(checkbox);

      const date = document.createElement('span');
      date.className = 'chatgpt-pro-row-date';
      date.textContent = formatTime(rec.createTime);

      const title = document.createElement('span');
      title.className = 'chatgpt-pro-row-title';
      title.textContent = rec.title;

      const project = document.createElement('span');
      project.className = 'chatgpt-pro-row-project';
      project.textContent = conversationSourceName(rec);

      const exportCell = document.createElement('span');
      exportCell.className = 'chatgpt-pro-row-export';

      const createExportButton = (label, titleText, action) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chatgpt-pro-export-button';
        button.textContent = label;
        button.title = titleText;
        button.setAttribute('aria-label', `${titleText}：${rec.title}`);
        button.addEventListener('click', async event => {
          event.preventDefault();
          event.stopPropagation();
          if (button.disabled) return;
          const oldText = button.textContent;
          button.disabled = true;
          button.textContent = '…';
          try {
            await action(rec);
            button.textContent = '✓';
            window.setTimeout(() => {
              if (button.isConnected) button.textContent = oldText;
            }, 900);
          } catch (error) {
            button.textContent = '!';
            button.title = `导出失败：${error.message}`;
            window.setTimeout(() => {
              if (button.isConnected) {
                button.textContent = oldText;
                button.title = titleText;
              }
            }, 1600);
          } finally {
            button.disabled = false;
          }
        });
        return button;
      };

      const mdButton = createExportButton('MD', '导出该聊天为 Markdown', exportConversationMarkdown);
      const jsonButton = createExportButton('JSON', '导出该聊天原始 JSON', exportConversationJson);
      exportCell.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
      });
      exportCell.append(mdButton, jsonButton);

      row.append(selectCell, date, title, project, exportCell);
      container.appendChild(row);
    }
    return sorted;
  }

  function currentBranchMessages(data) {
    const mapping = data?.mapping;
    if (!mapping || typeof mapping !== 'object') return [];

    let nodeId = data.current_node;
    if (!nodeId || !mapping[nodeId]) {
      const candidates = Object.values(mapping)
        .filter(node => node?.message)
        .sort((a, b) => timestampValue(a.message?.create_time) - timestampValue(b.message?.create_time));
      return candidates.map(node => node.message);
    }

    const messages = [];
    const seen = new Set();
    while (nodeId && mapping[nodeId] && !seen.has(nodeId)) {
      seen.add(nodeId);
      const node = mapping[nodeId];
      if (node.message) messages.push(node.message);
      nodeId = node.parent || null;
    }
    return messages.reverse();
  }

  function messageText(message) {
    const content = message?.content;
    if (!content) return '';
    if (typeof content.text === 'string') return content.text;
    const parts = Array.isArray(content.parts) ? content.parts : [];
    const chunks = [];
    for (const part of parts) {
      if (typeof part === 'string') {
        chunks.push(part);
        continue;
      }
      if (!part || typeof part !== 'object') continue;
      if (typeof part.text === 'string') chunks.push(part.text);
      else if (typeof part.content === 'string') chunks.push(part.content);
      else if (part.content_type === 'image_asset_pointer') chunks.push('[图片]');
      else if (part.content_type === 'audio_asset_pointer') chunks.push('[音频]');
    }
    return chunks.join('\n\n').trim();
  }

  function toolNameFromPath(path) {
    const value = String(path || '').trim();
    if (!value) return 'tool';
    const parts = value.split('/').filter(Boolean);
    return parts[parts.length - 1] || 'tool';
  }

  function fenceForText(text, preferred = '') {
    const value = String(text || '');
    let fence = '```';
    while (value.includes(fence)) fence += '`';
    return `${fence}${preferred}\n${value}\n${fence}`;
  }

  function normalizeAssistantExportText(text) {
    const source = String(text || '').trim();
    if (!source || source[0] !== '{' || source[source.length - 1] !== '}') return source;

    let payload;
    try {
      payload = JSON.parse(source);
    } catch (_) {
      return source;
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return source;
    if (typeof payload.path !== 'string' || !payload.args || typeof payload.args !== 'object') return source;

    const name = toolNameFromPath(payload.path);
    const args = payload.args;
    const sections = [`**工具调用：${name}**`];

    if (typeof args.patch === 'string' && args.patch.trim()) {
      sections.push(fenceForText(args.patch.trim(), 'diff'));
      return sections.join('\n\n');
    }

    const command = typeof args.cmd === 'string'
      ? args.cmd
      : (typeof args.command === 'string' ? args.command : '');
    if (command.trim()) {
      sections.push(fenceForText(command.trim(), 'bash'));
      return sections.join('\n\n');
    }

    const readableArgs = { ...args };
    delete readableArgs.workspaceId;
    if (Object.keys(readableArgs).length) {
      sections.push(fenceForText(JSON.stringify(readableArgs, null, 2), 'json'));
    }
    return sections.join('\n\n');
  }

  function roleHeading(role) {
    if (role === 'user') return '用户';
    if (role === 'assistant') return 'ChatGPT';
    if (role === 'system') return 'System';
    if (role === 'tool') return 'Tool';
    return role || '消息';
  }

  function sanitizeFilename(name) {
    const cleaned = String(name || 'ChatGPT 聊天记录')
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[. ]+$/g, '');
    return (cleaned || 'ChatGPT 聊天记录').slice(0, 120);
  }

  function filenameDate(value) {
    const ms = timestampValue(value);
    if (!ms) return '';
    const d = new Date(ms);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function filenameSource(rec) {
    return conversationSourceType(rec) === 'regular' ? '普通聊天' : conversationSourceName(rec);
  }

  function exportBaseFilename(rec, data) {
    const values = {
      title: data?.title || rec?.title || 'ChatGPT 聊天记录',
      created_date: filenameDate(rec?.createTime ?? data?.create_time ?? data?.created_at),
      updated_date: filenameDate(rec?.updateTime ?? data?.update_time ?? data?.updated_at),
      source: filenameSource(rec || {}),
      conversation_id: rec?.id || data?.id || data?.conversation_id || ''
    };
    const template = String(S.settings.exportFilenameTemplate || '{title}');
    const rendered = template.replace(/\{(title|created_date|updated_date|source|conversation_id)\}/g, (_, key) => values[key] || '');
    return sanitizeFilename(rendered.replace(/_+/g, '_').replace(/^[_\s]+|[_\s]+$/g, '') || values.title);
  }

  function yamlString(value) {
    return JSON.stringify(String(value ?? ''));
  }

  function isoTimestamp(value) {
    const ms = timestampValue(value);
    return ms ? new Date(ms).toISOString() : '';
  }

  function conversationUrl(rec, data) {
    const id = rec?.id || data?.id || data?.conversation_id;
    const href = rec?.href || (id ? `/c/${id}` : '');
    if (!href) return '';
    try {
      return new URL(href, location.origin).href;
    } catch {
      return href;
    }
  }

  function buildConversationMarkdown(data, rec = {}) {
    const title = data?.title || rec.title || 'ChatGPT 聊天记录';
    const messages = currentBranchMessages(data)
      .filter(message => ['user', 'assistant'].includes(message?.author?.role))
      .map(message => ({
        role: message.author.role,
        text: message.author.role === 'assistant'
          ? normalizeAssistantExportText(messageText(message))
          : messageText(message)
      }))
      .filter(item => item.text);

    if (!messages.length) throw new Error('没有找到可导出的用户/助手消息');

    const id = rec.id || data?.id || data?.conversation_id || '';
    const sourceUrl = conversationUrl(rec, data);
    const createdAt = isoTimestamp(rec.createTime ?? data?.create_time ?? data?.created_at);
    const updatedAt = isoTimestamp(rec.updateTime ?? data?.update_time ?? data?.updated_at);
    const sourceType = conversationSourceType(rec);
    const sourceName = sourceType === 'regular' ? '' : conversationSourceName(rec);
    const metadata = [
      '---',
      `title: ${yamlString(title)}`,
      sourceUrl ? `source: ${yamlString(sourceUrl)}` : '',
      id ? `conversation_id: ${yamlString(id)}` : '',
      createdAt ? `created_at: ${yamlString(createdAt)}` : '',
      updatedAt ? `updated_at: ${yamlString(updatedAt)}` : '',
      `exported_at: ${yamlString(new Date().toISOString())}`,
      `message_count: ${messages.length}`,
      'export_scope: "current_branch"',
      `source_type: ${yamlString(sourceType)}`,
      sourceName ? `source_name: ${yamlString(sourceName)}` : '',
      '---'
    ].filter(Boolean).join('\n');

    const body = messages.map(item => `## ${roleHeading(item.role)}\n\n${item.text}`).join('\n\n---\n\n');
    return `${metadata}\n\n# ${title}\n\n${body}\n`;
  }

  function buildConversationJson(data, rec = {}) {
    const sourceType = conversationSourceType(rec);
    const payload = {
      chatgpt_pro: {
        title: data?.title || rec.title || 'ChatGPT 聊天记录',
        source: conversationUrl(rec, data),
        conversation_id: rec.id || data?.id || data?.conversation_id || '',
        created_at: isoTimestamp(rec.createTime ?? data?.create_time ?? data?.created_at),
        updated_at: isoTimestamp(rec.updateTime ?? data?.update_time ?? data?.updated_at),
        exported_at: new Date().toISOString(),
        source_type: sourceType,
        source_name: sourceType === 'regular' ? '' : conversationSourceName(rec)
      },
      conversation: data
    };
    return `${JSON.stringify(payload, null, 2)}\n`;
  }

  function downloadBlobFile(filename, blob) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadTextFile(filename, text, type = 'text/plain;charset=utf-8') {
    downloadBlobFile(filename, new Blob([text], { type }));
  }

  function crc32(bytes) {
    const table = crc32.table || (crc32.table = Array.from({ length: 256 }, (_, value) => {
      let entry = value;
      for (let bit = 0; bit < 8; bit++) entry = (entry >>> 1) ^ (0xedb88320 & -(entry & 1));
      return entry >>> 0;
    }));
    let crc = 0xffffffff;
    for (const byte of bytes) crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
    return (crc ^ 0xffffffff) >>> 0;
  }

  function pushU16(target, value) {
    target.push(value & 0xff, (value >>> 8) & 0xff);
  }

  function pushU32(target, value) {
    target.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
  }

  function dosDateTime(date = new Date()) {
    const year = Math.max(1980, date.getFullYear());
    return {
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
      date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
    };
  }

  function buildStoredZip(files) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const stamp = dosDateTime();

    for (const file of files) {
      const name = encoder.encode(file.name);
      const data = typeof file.text === 'string' ? encoder.encode(file.text) : file.data;
      const crc = crc32(data);
      const local = [];
      pushU32(local, 0x04034b50);
      pushU16(local, 20);
      pushU16(local, 0x0800);
      pushU16(local, 0);
      pushU16(local, stamp.time);
      pushU16(local, stamp.date);
      pushU32(local, crc);
      pushU32(local, data.length);
      pushU32(local, data.length);
      pushU16(local, name.length);
      pushU16(local, 0);
      const localHeader = Uint8Array.from(local);
      localParts.push(localHeader, name, data);

      const central = [];
      pushU32(central, 0x02014b50);
      pushU16(central, 20);
      pushU16(central, 20);
      pushU16(central, 0x0800);
      pushU16(central, 0);
      pushU16(central, stamp.time);
      pushU16(central, stamp.date);
      pushU32(central, crc);
      pushU32(central, data.length);
      pushU32(central, data.length);
      pushU16(central, name.length);
      pushU16(central, 0);
      pushU16(central, 0);
      pushU16(central, 0);
      pushU16(central, 0);
      pushU32(central, 0);
      pushU32(central, offset);
      centralParts.push(Uint8Array.from(central), name);
      offset += localHeader.length + name.length + data.length;
    }

    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const end = [];
    pushU32(end, 0x06054b50);
    pushU16(end, 0);
    pushU16(end, 0);
    pushU16(end, files.length);
    pushU16(end, files.length);
    pushU32(end, centralSize);
    pushU32(end, offset);
    pushU16(end, 0);
    return new Blob([...localParts, ...centralParts, Uint8Array.from(end)], { type: 'application/zip' });
  }

  function uniqueFilename(filename, used) {
    if (!used.has(filename)) {
      used.add(filename);
      return filename;
    }
    const match = filename.match(/^(.*?)(\.[^.]+)?$/);
    const base = match?.[1] || filename;
    const ext = match?.[2] || '';
    let index = 2;
    let candidate = `${base} (${index})${ext}`;
    while (used.has(candidate)) candidate = `${base} (${++index})${ext}`;
    used.add(candidate);
    return candidate;
  }

  const sleep = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  async function waitForExport(ms, onProgress, progress) {
    const deadline = Date.now() + ms;
    do {
      const remainingMs = Math.max(0, deadline - Date.now());
      onProgress?.({ ...progress, remainingSeconds: Math.ceil(remainingMs / 1000) });
      if (!remainingMs) break;
      await sleep(Math.min(1000, remainingMs));
    } while (Date.now() < deadline);
  }

  async function fetchConversationForExport(rec, progress, onProgress) {
    for (let retry = 0; retry <= EXPORT_MAX_RETRIES; retry++) {
      try {
        onProgress?.({ ...progress, phase: retry ? 'retrying' : 'fetching', retry });
        return await window.APIHandler.getConversation(rec.id);
      } catch (error) {
        if (retry >= EXPORT_MAX_RETRIES) throw error;
        const rateLimited = error?.status === 429;
        const waitMs = rateLimited
          ? Math.max(1000, error.retryAfterMs || EXPORT_RATE_LIMIT_DEFAULT_MS)
          : EXPORT_RETRY_DELAYS_MS[Math.min(retry, EXPORT_RETRY_DELAYS_MS.length - 1)];
        await waitForExport(waitMs, onProgress, {
          ...progress,
          phase: rateLimited ? 'rate-limit' : 'retry-wait',
          retry: retry + 1,
          error: error?.message || String(error)
        });
      }
    }
    throw new Error('导出重试次数已用尽');
  }

  async function exportConversationMarkdown(rec) {
    const data = await window.APIHandler.getConversation(rec.id);
    const markdown = buildConversationMarkdown(data, rec);
    downloadTextFile(`${exportBaseFilename(rec, data)}.md`, markdown, 'text/markdown;charset=utf-8');
  }

  async function exportConversationJson(rec) {
    const data = await window.APIHandler.getConversation(rec.id);
    downloadTextFile(`${exportBaseFilename(rec, data)}.json`, buildConversationJson(data, rec), 'application/json;charset=utf-8');
  }

  async function exportConversationBatch(records, format, onProgress) {
    const files = [];
    const used = new Set();
    const failures = [];
    const totalGroups = Math.ceil(records.length / EXPORT_GROUP_SIZE);
    for (let index = 0; index < records.length; index++) {
      const rec = records[index];
      const progress = {
        done: index,
        total: records.length,
        group: Math.floor(index / EXPORT_GROUP_SIZE) + 1,
        totalGroups,
        title: rec.title || rec.id
      };
      try {
        const data = await fetchConversationForExport(rec, progress, onProgress);
        const base = exportBaseFilename(rec, data);
        if (format === 'json') {
          files.push({ name: uniqueFilename(`${base}.json`, used), text: buildConversationJson(data, rec) });
        } else {
          files.push({ name: uniqueFilename(`${base}.md`, used), text: buildConversationMarkdown(data, rec) });
        }
      } catch (error) {
        failures.push(`${rec.title || rec.id} (${rec.id})：${error.message}`);
      }
      onProgress?.({ ...progress, phase: 'completed', done: index + 1, failures: failures.length });

      const isLast = index === records.length - 1;
      const isGroupEnd = (index + 1) % EXPORT_GROUP_SIZE === 0;
      if (!isLast && isGroupEnd) {
        await waitForExport(EXPORT_GROUP_GAP_MS, onProgress, {
          ...progress,
          phase: 'group-wait',
          done: index + 1,
          failures: failures.length
        });
      } else if (!isLast) {
        await waitForExport(EXPORT_REQUEST_GAP_MS, onProgress, {
          ...progress,
          phase: 'pacing',
          done: index + 1,
          failures: failures.length
        });
      }
    }
    if (!files.length) throw new Error(failures[0] || '没有可导出的聊天');
    if (failures.length) {
      files.push({
        name: '导出失败.txt',
        text: `以下 ${failures.length} 个聊天未能导出：\n\n${failures.join('\n')}\n`
      });
    }
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const zipName = `ChatGPT-Pro_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}_${format.toUpperCase()}.zip`;
    downloadBlobFile(zipName, buildStoredZip(files));
    return { successCount: records.length - failures.length, failureCount: failures.length };
  }

  function runtimeMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, response => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response?.success) {
          reject(new Error(response?.error || '扩展后台操作失败'));
          return;
        }
        resolve(response);
      });
    });
  }

  function buildSearchIndexRecord(data, rec) {
    const seen = new Set();
    const messages = Object.values(data?.mapping || {})
      .map(node => node?.message)
      .filter(message => message?.id && ['user', 'assistant'].includes(message?.author?.role))
      .sort((a, b) => timestampValue(a.create_time) - timestampValue(b.create_time))
      .filter(message => {
        if (seen.has(message.id)) return false;
        seen.add(message.id);
        return true;
      })
      .map(message => ({
        id: message.id,
        role: message.author.role,
        text: messageText(message),
        createTime: timestampValue(message.create_time)
      }))
      .filter(message => message.text);
    return {
      id: rec.id,
      title: data?.title || rec.title || 'Untitled conversation',
      href: rec.href || `/c/${rec.id}`,
      updateTime: timestampValue(rec.updateTime ?? data?.update_time ?? data?.updated_at),
      messages
    };
  }

  async function updateFullTextIndex(records, onProgress) {
    const accountId = await window.APIHandler.getAccountId();
    const metadata = await runtimeMessage({ action: 'searchIndexMetadata', accountId });
    const indexed = new Map((metadata.records || []).map(record => [record.id, Number(record.updateTime || 0)]));
    const pending = records.filter(record => indexed.get(record.id) !== timestampValue(record.updateTime));
    const failures = [];
    const totalGroups = Math.max(1, Math.ceil(pending.length / EXPORT_GROUP_SIZE));

    for (let index = 0; index < pending.length; index++) {
      const rec = pending[index];
      const progress = {
        done: index,
        total: pending.length,
        group: Math.floor(index / EXPORT_GROUP_SIZE) + 1,
        totalGroups,
        title: rec.title || rec.id
      };
      try {
        const data = await fetchConversationForExport(rec, progress, onProgress);
        if (await window.APIHandler.getAccountId() !== accountId) throw new Error('登录账号已切换，索引任务已停止');
        await runtimeMessage({ action: 'searchIndexUpsert', accountId, record: buildSearchIndexRecord(data, rec) });
      } catch (error) {
        if (error.message.includes('登录账号已切换')) throw error;
        failures.push(`${rec.title || rec.id}：${error.message}`);
      }
      onProgress?.({ ...progress, phase: 'completed', done: index + 1, failures: failures.length });
      const isLast = index === pending.length - 1;
      const isGroupEnd = (index + 1) % EXPORT_GROUP_SIZE === 0;
      if (!isLast && isGroupEnd) {
        await waitForExport(EXPORT_GROUP_GAP_MS, onProgress, { ...progress, phase: 'group-wait', done: index + 1 });
      } else if (!isLast) {
        await waitForExport(EXPORT_REQUEST_GAP_MS, onProgress, { ...progress, phase: 'pacing', done: index + 1 });
      }
    }
    return { indexedCount: pending.length - failures.length, skippedCount: records.length - pending.length, failures };
  }

  function searchResultTime(result) {
    const value = result.createTime || result.updateTime;
    return value ? formatMessageTime(value) : '';
  }

  function findSearchResultFallback(excerpt) {
    const needle = normalizedSearchText(String(excerpt || '').replace(/^…|…$/g, '').slice(0, 48));
    if (!needle) return null;
    return window.ChatGPTDomAdapter.messageElements().find(element =>
      normalizedSearchText(element.innerText || element.textContent).includes(needle)
    ) || null;
  }

  function conversationScrollContainer() {
    const firstMessage = window.ChatGPTDomAdapter.messageElements()[0];
    for (let element = firstMessage?.parentElement; element && element !== document.body; element = element.parentElement) {
      const style = getComputedStyle(element);
      if (/(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight) return element;
    }
    return document.scrollingElement;
  }

  async function jumpToSearchMessage(messageId, excerpt = '') {
    if (!messageId && !excerpt) return false;
    let previousHeight = -1;
    for (let round = 0; round < 24; round++) {
      const target = window.ChatGPTDomAdapter.findMessage(messageId) || findSearchResultFallback(excerpt);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('chatgpt-pro-search-target');
        window.setTimeout(() => target.classList.remove('chatgpt-pro-search-target'), 2600);
        return true;
      }
      const scroller = conversationScrollContainer();
      if (!scroller) break;
      const height = scroller.scrollHeight;
      scroller.scrollTo?.({ top: 0, behavior: 'auto' });
      if (round > 2 && height === previousHeight && scroller.scrollTop === 0) break;
      previousHeight = height;
      await sleep(350);
    }
    return false;
  }

  let pendingSearchJumpInFlight = false;
  async function resumePendingSearchJump() {
    if (pendingSearchJumpInFlight) return;
    let pending;
    try {
      pending = JSON.parse(sessionStorage.getItem('chatgpt-pro-pending-search-jump') || 'null');
    } catch {
      sessionStorage.removeItem('chatgpt-pro-pending-search-jump');
      return;
    }
    if (!pending || pending.conversationId !== currentConversationId()) return;
    pendingSearchJumpInFlight = true;
    try {
      if (await jumpToSearchMessage(pending.messageId, pending.snippet)) {
        sessionStorage.removeItem('chatgpt-pro-pending-search-jump');
      }
    } finally {
      pendingSearchJumpInFlight = false;
    }
  }

  async function openFullTextSearchResult(result) {
    if (result.origin === 'legacy-unassigned') return;
    if (result.conversationId === currentConversationId()) {
      if (result.messageId) await jumpToSearchMessage(result.messageId, result.snippet);
      return;
    }
    if (result.messageId) {
      sessionStorage.setItem('chatgpt-pro-pending-search-jump', JSON.stringify({
        conversationId: result.conversationId,
        messageId: result.messageId,
        snippet: result.snippet
      }));
    }
    window.location.href = new URL(result.href || `/c/${result.conversationId}`, location.origin).href;
  }

  function renderFullTextResults(container, results) {
    container.replaceChildren();
    if (!results.length) {
      const empty = document.createElement('p');
      empty.className = 'chatgpt-pro-search-empty';
      empty.textContent = '没有找到匹配内容';
      container.appendChild(empty);
      return;
    }
    for (const result of results) {
      const legacy = result.origin === 'legacy-unassigned';
      const button = document.createElement(legacy ? 'div' : 'button');
      button.type = 'button';
      button.className = 'chatgpt-pro-search-result';
      const title = document.createElement('strong');
      title.textContent = result.title;
      const meta = document.createElement('span');
      meta.className = 'chatgpt-pro-search-result-meta';
      meta.textContent = [legacy ? '未归属历史索引 · 不可确认在线链接或完整导出' : '', result.role === 'user' ? '用户' : (result.role === 'assistant' ? 'ChatGPT' : ''), searchResultTime(result)].filter(Boolean).join(' · ');
      const snippet = document.createElement('span');
      snippet.className = 'chatgpt-pro-search-result-snippet';
      snippet.textContent = result.snippet;
      button.append(title, meta, snippet);
      if (!legacy) button.addEventListener('click', () => openFullTextSearchResult(result));
      container.appendChild(button);
    }
  }

  async function openTimeline() {
    closeTimeline();
    const panel = document.createElement('section');
    panel.className = 'chatgpt-pro-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', '聊天目录');
    panel.innerHTML = `
      <div class="chatgpt-pro-panel-header">
        <div class="chatgpt-pro-panel-tabs" role="tablist" aria-label="聊天工具">
          <button type="button" class="chatgpt-pro-panel-tab chatgpt-pro-panel-tab-active" role="tab" aria-selected="true" data-panel-view="directory">聊天目录</button>
          <button type="button" class="chatgpt-pro-panel-tab" role="tab" aria-selected="false" data-panel-view="search">全文搜索</button>
        </div>
        <span class="chatgpt-pro-panel-status">正在读取本地目录…</span>
        <div class="chatgpt-pro-batch-actions" hidden>
          <span class="chatgpt-pro-batch-count">已选 0</span>
          <button type="button" data-batch-format="md">导出 MD</button>
          <button type="button" data-batch-format="json">导出 JSON</button>
        </div>
      </div>
      <div class="chatgpt-pro-panel-list" data-panel-content="directory">
        <div class="chatgpt-pro-columns">
          <label class="chatgpt-pro-select-all" title="全选当前筛选结果">
            <input type="checkbox" aria-label="全选当前筛选结果">
          </label>
          <button type="button" class="chatgpt-pro-created-sort" aria-label="按创建时间排序" aria-sort="descending">
            <span>创建时间</span><span class="chatgpt-pro-created-sort-icon">↓</span>
          </button>
          <div class="chatgpt-pro-title-filter">
            <button type="button" class="chatgpt-pro-title-filter-button" aria-haspopup="dialog" aria-expanded="false">
              <span>标题</span><span class="chatgpt-pro-title-filter-icon" aria-hidden="true">▾</span>
            </button>
            <div class="chatgpt-pro-title-filter-menu" role="dialog" aria-label="按标题筛选" hidden>
              <label for="chatgpt-pro-title-filter-input">搜索标题</label>
              <input id="chatgpt-pro-title-filter-input" class="chatgpt-pro-title-filter-input" type="search" autocomplete="off" placeholder="输入标题关键词">
              <div class="chatgpt-pro-title-filter-actions">
                <button type="button" class="chatgpt-pro-title-filter-clear">清除</button>
                <button type="button" class="chatgpt-pro-title-filter-apply">确定</button>
              </div>
            </div>
          </div>
          <select class="chatgpt-pro-project-filter" aria-label="按项目筛选">
            <option value="__all__">项目名称 · 全部</option>
          </select>
          <span class="chatgpt-pro-export-column-title">导出</span>
        </div>
        <div class="chatgpt-pro-rows"></div>
      </div>
      <section class="chatgpt-pro-fulltext" data-panel-content="search" hidden>
        <form class="chatgpt-pro-fulltext-form">
          <input class="chatgpt-pro-fulltext-input" type="search" autocomplete="off" placeholder="搜索所有聊天内容" aria-label="全文搜索关键词">
          <button type="submit">搜索</button>
        </form>
        <label class="chatgpt-pro-legacy-search-option" style="display:block;font-size:12px;margin:8px 0">
          <input type="checkbox" class="chatgpt-pro-legacy-search-toggle">
          另查未归属的旧版全文索引（不归入当前账号）
        </label>
        <div class="chatgpt-pro-search-index-bar">
          <span class="chatgpt-pro-search-index-status">正在读取索引状态…</span>
          <button type="button" class="chatgpt-pro-search-index-update">更新索引</button>
        </div>
        <div class="chatgpt-pro-search-results" aria-live="polite"></div>
      </section>`;

    document.body.appendChild(panel);
    S.timeline = panel;
    S.launcher.classList.add('chatgpt-pro-open');
    S.launcher.setAttribute('aria-expanded', 'true');
    S.launcher.textContent = '−';
    S.launcher.title = '收起聊天目录（可拖动）';
    applyPanelSize(panel);
    setupPanelResize(panel);
    const status = panel.querySelector('.chatgpt-pro-panel-status');
    const panelTabs = Array.from(panel.querySelectorAll('[data-panel-view]'));
    const directoryView = panel.querySelector('[data-panel-content="directory"]');
    const searchView = panel.querySelector('[data-panel-content="search"]');
    const fullTextForm = panel.querySelector('.chatgpt-pro-fulltext-form');
    const fullTextInput = panel.querySelector('.chatgpt-pro-fulltext-input');
    const legacySearchToggle = panel.querySelector('.chatgpt-pro-legacy-search-toggle');
    const searchIndexStatus = panel.querySelector('.chatgpt-pro-search-index-status');
    const searchIndexUpdate = panel.querySelector('.chatgpt-pro-search-index-update');
    const searchResults = panel.querySelector('.chatgpt-pro-search-results');
    const list = panel.querySelector('.chatgpt-pro-rows');
    const createdSort = panel.querySelector('.chatgpt-pro-created-sort');
    const createdSortIcon = panel.querySelector('.chatgpt-pro-created-sort-icon');
    const titleFilter = panel.querySelector('.chatgpt-pro-title-filter');
    const titleFilterButton = panel.querySelector('.chatgpt-pro-title-filter-button');
    const titleFilterMenu = panel.querySelector('.chatgpt-pro-title-filter-menu');
    const titleFilterInput = panel.querySelector('.chatgpt-pro-title-filter-input');
    const titleFilterClear = panel.querySelector('.chatgpt-pro-title-filter-clear');
    const titleFilterApply = panel.querySelector('.chatgpt-pro-title-filter-apply');
    const projectFilter = panel.querySelector('.chatgpt-pro-project-filter');
    const selectAll = panel.querySelector('.chatgpt-pro-select-all input');
    const batchActions = panel.querySelector('.chatgpt-pro-batch-actions');
    const batchCount = panel.querySelector('.chatgpt-pro-batch-count');
    const batchButtons = Array.from(panel.querySelectorAll('[data-batch-format]'));
    let activeView = 'directory';
    let sortDirection = 'newest';
    let currentRecords = [];
    const selectedIds = new Set();

    const currentVisibleRecords = () => visibleTimelineRecords(
      currentRecords,
      sortDirection,
      projectFilter.value,
      titleFilterInput.value
    );

    const updateSelectionUi = (visible = currentVisibleRecords()) => {
      const selectedVisible = visible.filter(rec => selectedIds.has(rec.id)).length;
      selectAll.disabled = visible.length === 0;
      selectAll.checked = visible.length > 0 && selectedVisible === visible.length;
      selectAll.indeterminate = selectedVisible > 0 && selectedVisible < visible.length;
      batchActions.hidden = activeView !== 'directory' || selectedIds.size === 0;
      batchCount.textContent = `已选 ${selectedIds.size}`;
    };

    const selection = { ids: selectedIds, onChange: updateSelectionUi };
    const renderCurrent = () => {
      const query = titleFilterInput.value;
      titleFilterButton.classList.toggle('chatgpt-pro-filter-active', Boolean(normalizedSearchText(query)));
      titleFilterButton.setAttribute('aria-label', query ? `标题筛选：${query}` : '按标题筛选');
      const visible = renderTimelineRows(list, currentRecords, sortDirection, projectFilter.value, selection, query);
      updateSelectionUi(visible);
    };

    const setTitleFilterOpen = open => {
      titleFilterMenu.hidden = !open;
      titleFilterButton.setAttribute('aria-expanded', String(open));
      if (open) window.setTimeout(() => titleFilterInput.focus(), 0);
    };

    const refreshSearchIndexStatus = async () => {
      try {
        const accountId = await window.APIHandler.getAccountId();
        const [response, legacy] = await Promise.all([
          runtimeMessage({ action: 'searchIndexMetadata', accountId }),
          runtimeMessage({ action: 'localDataLegacyStats' })
        ]);
        searchIndexStatus.textContent = `当前账号已索引 ${response.records?.length || 0} / ${currentRecords.length} 个 · 未归属旧索引 ${legacy.legacyCount || 0} 个`;
      } catch (error) {
        searchIndexStatus.textContent = `索引状态读取失败：${error.message}`;
      }
    };

    const setActiveView = view => {
      activeView = view === 'search' ? 'search' : 'directory';
      directoryView.hidden = activeView !== 'directory';
      searchView.hidden = activeView !== 'search';
      panelTabs.forEach(tab => {
        const active = tab.dataset.panelView === activeView;
        tab.classList.toggle('chatgpt-pro-panel-tab-active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      if (activeView === 'search') {
        batchActions.hidden = true;
        status.textContent = '本地全文搜索';
        refreshSearchIndexStatus();
        window.setTimeout(() => fullTextInput.focus(), 0);
      } else {
        updateSelectionUi();
        status.textContent = `${currentRecords.length} 条聊天记录`;
      }
    };

    panelTabs.forEach(tab => tab.addEventListener('click', () => setActiveView(tab.dataset.panelView)));
    fullTextForm.addEventListener('submit', async event => {
      event.preventDefault();
      const query = fullTextInput.value.trim();
      if (!query) {
        searchResults.replaceChildren();
        return;
      }
      status.textContent = '正在搜索本地索引…';
      try {
        const accountId = await window.APIHandler.getAccountId();
        const [response, legacy] = await Promise.all([
          runtimeMessage({ action: 'searchFullText', accountId, query, limit: 200 }),
          legacySearchToggle.checked
            ? runtimeMessage({ action: 'searchUnassignedLegacy', query, limit: 200 })
            : Promise.resolve({ results: [] })
        ]);
        if (await window.APIHandler.getAccountId(true) !== accountId) throw new Error('登录账号已切换，请重新搜索');
        const results = [...(response.results || []), ...(legacy.results || [])];
        renderFullTextResults(searchResults, results);
        status.textContent = `当前账号 ${response.results?.length || 0} 条${legacySearchToggle.checked ? ` · 未归属旧索引 ${legacy.results?.length || 0} 条` : ''}`;
      } catch (error) {
        status.textContent = `全文搜索失败：${error.message}`;
      }
    });
    searchIndexUpdate.addEventListener('click', async () => {
      if (searchIndexUpdate.disabled) return;
      searchIndexUpdate.disabled = true;
      try {
        const result = await updateFullTextIndex(currentRecords, progress => {
          const base = `${progress.done} / ${progress.total}`;
          if (progress.phase === 'rate-limit') {
            searchIndexStatus.textContent = `请求受限，${progress.remainingSeconds} 秒后继续 · ${base}`;
          } else if (progress.phase === 'group-wait') {
            searchIndexStatus.textContent = `本组完成，${progress.remainingSeconds} 秒后继续 · ${base}`;
          } else if (progress.phase === 'retry-wait') {
            searchIndexStatus.textContent = `请求失败，${progress.remainingSeconds} 秒后重试 · ${base}`;
          } else if (progress.phase !== 'pacing') {
            searchIndexStatus.textContent = `正在更新索引 ${base}`;
          }
        });
        searchIndexStatus.textContent = result.failures.length
          ? `新增/更新 ${result.indexedCount} 个，失败 ${result.failures.length} 个`
          : `索引已是最新 · 更新 ${result.indexedCount} 个，跳过 ${result.skippedCount} 个`;
      } catch (error) {
        searchIndexStatus.textContent = `索引更新失败：${error.message}`;
      } finally {
        searchIndexUpdate.disabled = false;
      }
    });

    createdSort.addEventListener('click', async () => {
      sortDirection = sortDirection === 'newest' ? 'oldest' : 'newest';
      createdSortIcon.textContent = sortDirection === 'newest' ? '↓' : '↑';
      createdSort.setAttribute('aria-sort', sortDirection === 'newest' ? 'descending' : 'ascending');
      renderCurrent();
    });
    projectFilter.addEventListener('change', () => {
      selectedIds.clear();
      renderCurrent();
    });
    titleFilterButton.addEventListener('click', () => {
      setTitleFilterOpen(titleFilterMenu.hidden);
    });
    titleFilterInput.addEventListener('input', () => {
      selectedIds.clear();
      renderCurrent();
    });
    titleFilterInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        setTitleFilterOpen(false);
        titleFilterButton.focus();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setTitleFilterOpen(false);
        titleFilterButton.focus();
      }
    });
    titleFilterClear.addEventListener('click', () => {
      titleFilterInput.value = '';
      selectedIds.clear();
      renderCurrent();
      titleFilterInput.focus();
    });
    titleFilterApply.addEventListener('click', () => {
      setTitleFilterOpen(false);
      titleFilterButton.focus();
    });
    panel.addEventListener('pointerdown', event => {
      if (!titleFilterMenu.hidden && !titleFilter.contains(event.target)) setTitleFilterOpen(false);
    });
    selectAll.addEventListener('change', () => {
      const visible = currentVisibleRecords();
      for (const rec of visible) {
        if (selectAll.checked) selectedIds.add(rec.id);
        else selectedIds.delete(rec.id);
      }
      renderCurrent();
    });
    for (const button of batchButtons) {
      button.addEventListener('click', async () => {
        if (!selectedIds.size || button.disabled) return;
        const format = button.dataset.batchFormat === 'json' ? 'json' : 'md';
        const selected = currentVisibleRecords()
          .filter(rec => selectedIds.has(rec.id));
        if (!selected.length) return;
        batchButtons.forEach(item => { item.disabled = true; });
        try {
          const result = await exportConversationBatch(selected, format, progress => {
            const base = `${progress.done} / ${progress.total} · 第 ${progress.group} / ${progress.totalGroups} 组`;
            if (progress.phase === 'rate-limit') {
              status.textContent = `请求受限 · ${progress.remainingSeconds} 秒后继续 · ${base}`;
            } else if (progress.phase === 'group-wait') {
              status.textContent = `本组完成 · ${progress.remainingSeconds} 秒后继续 · ${base}`;
            } else if (progress.phase === 'retry-wait') {
              status.textContent = `请求失败 · ${progress.remainingSeconds} 秒后重试 ${progress.retry} / ${EXPORT_MAX_RETRIES} · ${base}`;
            } else if (progress.phase === 'retrying') {
              status.textContent = `正在重试 ${progress.retry} / ${EXPORT_MAX_RETRIES} · ${base}`;
            } else if (progress.phase !== 'pacing') {
              status.textContent = `正在导出 ${base}…`;
            }
          });
          status.textContent = result.failureCount
            ? `已导出 ${result.successCount} 个，失败 ${result.failureCount} 个 · ZIP 已生成`
            : `已导出 ${result.successCount} 个 ${format.toUpperCase()} · ZIP 已生成`;
          selectedIds.clear();
          renderCurrent();
        } catch (error) {
          status.textContent = `批量导出失败：${error.message}`;
        } finally {
          batchButtons.forEach(item => { item.disabled = false; });
        }
      });
    }

    requestAnimationFrame(positionTimelinePanel);

    try {
      const cached = await window.APIHandler.getCachedConversationList();
      currentRecords = cached;
      if (cached.length) {
        populateProjectFilter(projectFilter, cached);
        renderCurrent();
        if (activeView === 'directory') status.textContent = `本地已有 ${cached.length} 条，正在增量检查最新数据…`;
        requestAnimationFrame(positionTimelinePanel);
      } else {
        if (activeView === 'directory') status.textContent = '首次使用，正在建立本地目录…';
      }

      const fresh = await window.APIHandler.syncConversationList(false);
      if (!S.timeline || S.timeline !== panel) return;
      currentRecords = fresh;
      populateProjectFilter(projectFilter, fresh);
      renderCurrent();
      status.textContent = activeView === 'directory' ? `${fresh.length} 条 · 已完成增量同步` : '本地全文搜索';
      requestAnimationFrame(positionTimelinePanel);
      if (S.settings.showSidebarTime) await reloadTimestampMap(false);
    } catch (e) {
      if (S.timeline === panel && activeView === 'directory') status.textContent = `同步失败，已保留本地数据：${e.message}`;
    }
  }

  function setupObserver() {
    S.observer?.disconnect();
    let sidebarTimer = null;
    let messageTimer = null;
    S.observer = new MutationObserver(mutations => {
      refreshMessageTimestampsForView();
      const sidebarRelevant = mutations.some(mutation =>
        Array.from(mutation.addedNodes).some(node =>
          node.nodeType === 1 && window.ChatGPTDomAdapter.containsSidebarConversationLink(node)
        )
      );
      if (sidebarRelevant) {
        clearTimeout(sidebarTimer);
        sidebarTimer = setTimeout(() => {
          stampAll();
          ensureCurrentChatExportButton();
        }, 300);
      }

      if (S.settings.showMessageTimestamps) {
        const messageRelevant = mutations.some(mutation =>
          (mutation.type === 'attributes' && [
            'data-chatgpt-selection-message-id',
            'data-chatgpt-search-message-ids',
            'data-message-id',
            'data-chatgpt-search-unit-key',
            'data-content-search-unit-key'
          ].includes(mutation.attributeName)) ||
          Array.from(mutation.addedNodes).some(node =>
            node.nodeType === 1 && window.ChatGPTDomAdapter.containsMessageNode(node)
          )
        );
        if (messageRelevant) {
          clearTimeout(messageTimer);
          messageTimer = setTimeout(() => {
            stampMessageTimestamps().catch(error => log('Message timestamp refresh failed:', error.message));
            resumePendingSearchJump().catch(error => log('Search result jump failed:', error.message));
          }, 100);
        }
      }
    });
    S.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'data-chatgpt-selection-message-id',
        'data-chatgpt-search-message-ids',
        'data-message-id',
        'data-chatgpt-search-unit-key',
        'data-content-search-unit-key'
      ]
    });
  }

  async function loadSettings() {
    const values = await new Promise(resolve => {
      chrome.storage.local.get(
        ['enabled', 'showSidebarTime', 'showMessageTimestamps', 'fontSize', 'openInBackground', 'closeOnOutsideClick', 'exportFilenameTemplate', 'launcherPosition', 'currentExportPositionY', 'panelSize'],
        data => resolve(data || {})
      );
    });
    if (values.enabled !== undefined) S.settings.enabled = values.enabled;
    if (values.showSidebarTime !== undefined) S.settings.showSidebarTime = values.showSidebarTime;
    if (values.showMessageTimestamps !== undefined) S.settings.showMessageTimestamps = values.showMessageTimestamps;
    if (values.fontSize) S.settings.fontSize = values.fontSize;
    if (values.openInBackground !== undefined) S.settings.openInBackground = values.openInBackground;
    if (values.closeOnOutsideClick !== undefined) S.settings.closeOnOutsideClick = values.closeOnOutsideClick;
    if (values.exportFilenameTemplate) S.settings.exportFilenameTemplate = values.exportFilenameTemplate;
    if (values.launcherPosition?.x != null && values.launcherPosition?.y != null) {
      S.settings.launcherPosition = values.launcherPosition;
    }
    if (values.currentExportPositionY != null) S.settings.currentExportPositionY = values.currentExportPositionY;
    if (values.panelSize?.width && values.panelSize?.height) S.settings.panelSize = values.panelSize;
  }

  function setupMessages() {
    chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
      if (msg.action === 'refresh') {
        (async () => {
          await window.APIHandler.clearCache();
          const records = await window.APIHandler.syncConversationList(true);
          await reloadTimestampMap(false);
          respond({ success: true, count: records.length });
        })().catch(error => respond({ success: false, error: error.message }));
        return true;
      }
      if (msg.action === 'getStatus') {
        (async () => {
          // Popup polls every three seconds; do not refetch /auth/session
          // each time. Account identity TTL and tab focus still revalidate it.
          const cached = await window.APIHandler.getCachedConversationList(false);
          respond({
            platform: 'chatgpt',
            initialized: S.ready,
            directoryCount: cached.length,
            badgeCount: document.querySelectorAll('[data-chatgpt-pro]').length,
            enabled: S.settings.enabled,
            apiLoaded: S.apiLoaded,
            apiSize: S.apiData.size
          });
        })().catch(() => respond({
          platform: 'chatgpt',
          initialized: S.ready,
          directoryCount: 0,
          enabled: S.settings.enabled
        }));
        return true;
      }
      if (msg.action === 'openTimeline') {
        openTimeline().then(() => respond({ success: true }));
        return true;
      }
      if (msg.action === 'incrementalSync') {
        incrementalSyncConversationList('已完成增量同步')
          .then(records => respond({ success: true, count: records.length }))
          .catch(error => respond({ success: false, error: error.message }));
        return true;
      }
      return false;
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      let restamp = false;
      if (changes.enabled) {
        S.settings.enabled = changes.enabled.newValue;
        if (S.settings.enabled) {
          ensureFloatingButton();
          restamp = true;
        } else {
          clearMessageRouteRetryTimers();
          removeAllBadges();
          removeMessageTimestamps();
          removeFloatingButton();
        }
      }
      if (changes.fontSize) { S.settings.fontSize = changes.fontSize.newValue; restamp = true; }
      if (changes.showSidebarTime) {
        S.settings.showSidebarTime = changes.showSidebarTime.newValue;
        if (S.settings.showSidebarTime) {
          reloadTimestampMap(false).catch(error => log('Sidebar timestamp load failed:', error.message));
          restamp = true;
        } else {
          removeAllBadges();
        }
      }
      if (changes.showMessageTimestamps) {
        S.settings.showMessageTimestamps = changes.showMessageTimestamps.newValue;
        if (S.settings.showMessageTimestamps) {
          refreshMessageTimestampsForRoute(true);
        } else {
          clearMessageRouteRetryTimers();
          removeMessageTimestamps();
        }
      }
      if (changes.openInBackground) S.settings.openInBackground = changes.openInBackground.newValue;
      if (changes.closeOnOutsideClick) S.settings.closeOnOutsideClick = changes.closeOnOutsideClick.newValue;
      if (changes.exportFilenameTemplate) S.settings.exportFilenameTemplate = changes.exportFilenameTemplate.newValue || '{title}';
      if (changes.panelSize?.newValue) S.settings.panelSize = changes.panelSize.newValue;
      if (restamp && S.settings.enabled) {
        removeAllBadges();
        stampAll();
      }
    });
  }

  async function init() {
    await loadSettings();
    if (!S.settings.enabled) { S.ready = true; return; }
    ensureFloatingButton();
    setupOutsideClose();
    setupObserver();
    setupConversationRouteTracking();
    if (S.settings.showSidebarTime) {
      try {
        await reloadTimestampMap(false);
      } catch (e) {
        log('Initial timestamp load failed:', e.message);
      }
    }
    if (S.settings.showMessageTimestamps) {
      refreshMessageTimestampsForRoute(true);
    } else {
      S.observedConversationId = currentConversationId();
    }
    setInterval(() => {
      if (!S.settings.enabled) return;
      ensureFloatingButton();
      ensureCurrentChatExportButton();
      stampAll();
      if (S.settings.showMessageTimestamps) {
        stampMessageTimestamps().catch(error => log('Message timestamp refresh failed:', error.message));
      }
    }, RECHECK_MS);
    setInterval(backgroundSyncConversationList, BACKGROUND_SYNC_MS);
    window.addEventListener('resize', () => {
      placeLauncher();
      placeCurrentChatExportButton();
      positionTimelinePanel();
    });
    S.ready = true;
    ensureCurrentChatExportButton();
    window.setTimeout(() => resumePendingSearchJump().catch(error => log('Search result jump failed:', error.message)), 600);
  }

  setupMessages();
  window.addEventListener('chatgpt-pro-account-changed', () => {
    // Never leave the old signed-in user's directory or timestamps visible.
    S.apiData.clear();
    S.apiLoaded = false;
    removeAllBadges();
    removeMessageTimestamps();
    closeTimeline();
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, INIT_DELAY_MS));
  } else {
    setTimeout(init, INIT_DELAY_MS);
  }
})();
