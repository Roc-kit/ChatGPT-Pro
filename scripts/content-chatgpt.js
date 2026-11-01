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
  const EXPORT_VOLUME_MAX_FILES = 50;
  const EXPORT_VOLUME_MAX_BYTES = 24 * 1024 * 1024;
  const EXPORT_REQUEST_GAP_MS = 900;
  const EXPORT_GROUP_GAP_MS = 10 * 1000;
  const EXPORT_RATE_LIMIT_DEFAULT_MS = 60 * 1000;
  const EXPORT_MAX_RETRIES = 3;
  const EXPORT_RETRY_DELAYS_MS = [1000, 3000, 8000];
  const MESSAGE_ROUTE_CHECK_MS = 500;
  const MESSAGE_ROUTE_RETRY_DELAYS_MS = [100, 400, 1000, 2200, 5000, 10000];
  const AUTO_CONTINUE_TASK_STATE_KEY = 'autoContinueTaskState';

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
    autoContinue: {
      mode: 'idle',
      conversationId: null,
      sentCount: 0,
      deadline: 0,
      sentAt: 0,
      checking: false,
      assistantText: '',
      reason: ''
    },
    messageConversationId: null,
    messageConversation: null,
    messageConversationPromise: null,
    messageConversationRefreshSignature: '',
    messageConversationRefreshAt: 0,
    messageVisibilityObserver: null,
    observedMessageElements: new WeakSet(),
    observedConversationId: undefined,
    observedMessageSignature: '',
    messageRouteRetryTimers: [],
    minimap: { id: null, signature: '', entries: [], allEntries: [], active: null, frame: 0, layoutSlots: 0,
      cachedId: null, cachedMessages: null, lastCacheCheck: 0, checking: false, cachePromise: null, jumpToken: 0 },
    settings: {
      enabled: true,
      showSidebarTime: false,
      showMessageTimestamps: false,
      showMinimap: true,
      autoContinueEnabled: false,
      autoContinueText: '',
      autoContinueDelaySeconds: 120,
      autoContinueMaxCount: 20,
      fontSize: 11,
      openInBackground: true,
      closeOnOutsideClick: true,
      exportFilenameTemplate: '{created_datetime}_{title}',
      launcherPosition: { x: 0.94, y: 0.76 },
      toolDockPositionX: 1,
      // Without a saved user position, size the complete tool dock to half
      // of the viewport. A dragged position is persisted as a normalized Y.
      currentExportPositionY: null,
      panelSize: { width: 580, height: 560 }
    }
  };

  const log = (...args) => console.log('[ChatGPT Pro]', ...args);

  function applyTimestampFontSize(value) {
    const legacy = { small: 11, medium: 12, large: 13 };
    const parsed = Number(legacy[value] || value);
    const fontSize = Number.isFinite(parsed) && parsed > 0
      ? Math.max(8, Math.min(24, Math.round(parsed))) : 11;
    S.settings.fontSize = fontSize;
    document.documentElement.style.setProperty('--chatgpt-pro-timestamp-font-size', `${fontSize}px`);
  }

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
    S.messageConversationRefreshSignature = '';
    S.messageConversationRefreshAt = 0;
  }

  function clearMessageRouteRetryTimers() {
    S.messageRouteRetryTimers.forEach(timer => clearTimeout(timer));
    S.messageRouteRetryTimers = [];
  }

  function createMessageTimestamp(value, role = '', target = null) {
    const text = formatMessageTime(value);
    if (!text) return null;
    const span = document.createElement('span');
    const placementClass = target?.matches?.('.turn-action-controls')
      ? 'chatgpt-pro-message-timestamp-controls'
      : role === 'assistant' ? 'chatgpt-pro-message-timestamp-assistant'
        : role === 'user' ? 'chatgpt-pro-message-timestamp-user' : '';
    span.className = [
      'chatgpt-pro-message-timestamp',
      placementClass
    ].filter(Boolean).join(' ');
    span.setAttribute('data-chatgpt-pro-message-timestamp', '1');
    span.textContent = text;
    return span;
  }

  function conversationMessageForElement(data, messageEl) {
    const ids = window.ChatGPTDomAdapter.messageIds(messageEl);
    for (const id of ids) {
      const message = data?.mapping?.[id]?.message;
      if (message?.create_time) return message;
    }
    // A fallback-turn index belongs to the rendered window, not the full
    // conversation. Never use it to infer a message timestamp when no
    // authoritative ID matches the cached conversation data.
    return null;
  }

  function stampMessageTimestampElement(messageEl) {
    if (!S.messageConversation || !(messageEl instanceof Element)) return false;
    const target = window.ChatGPTDomAdapter.timestampTarget(messageEl);
    if (!target || target.querySelector(':scope > [data-chatgpt-pro-message-timestamp]')) return false;
    const message = conversationMessageForElement(S.messageConversation, messageEl);
    if (!message?.create_time) return false;
    const timestamp = createMessageTimestamp(
      message.create_time, window.ChatGPTDomAdapter.messageRole(messageEl), target
    );
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
      const conversationPromise = S.messageConversationPromise
        || (S.messageConversationPromise = window.APIHandler.getConversation(conversationId));
      try {
        const data = await conversationPromise;
        if (currentConversationId() !== conversationId || S.messageConversationId !== conversationId) return 0;
        S.messageConversation = data;
      } catch (error) {
        log('Message timestamp data load failed:', error.message);
        return 0;
      } finally {
        if (S.messageConversationPromise === conversationPromise) S.messageConversationPromise = null;
      }
    }

    const renderedIds = renderedMessageIds();
    const renderedSignature = renderedIds.join('|');
    const hasUncachedMessage = renderedIds.some(id => !S.messageConversation?.mapping?.[id]);
    const refreshRetryElapsed = Date.now() - S.messageConversationRefreshAt >= 30000;
    if (!window.ChatGPTDomAdapter.isGenerating() && hasUncachedMessage
        && (renderedSignature !== S.messageConversationRefreshSignature || refreshRetryElapsed)) {
      // A single refresh is enough for this rendered message set. The 30s
      // retry window permits recovery from transient network failures without
      // repeating a request on every mutation or route retry timer.
      S.messageConversationRefreshSignature = renderedSignature;
      S.messageConversationRefreshAt = Date.now();
      try {
        const data = await window.APIHandler.getConversation(conversationId, { forceNetwork: true });
        if (currentConversationId() !== conversationId || S.messageConversationId !== conversationId) return 0;
        S.messageConversation = data;
      } catch (error) {
        log('Message timestamp refresh failed:', error.message);
      }
    }

    const observer = ensureMessageVisibilityObserver();
    let observed = 0;
    const messageElements = window.ChatGPTDomAdapter.messageElements();
    for (const messageEl of messageElements) {
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

      stampMessageTimestamps().catch(error => log('Message timestamp view refresh failed:', error.message));
      return;
    }

    // ChatGPT can rebuild a message body without changing its semantic IDs.
    // Restore decorations that React removed from those reused nodes. Also
    // retry one stale-cache refresh after generation has finished.
    const renderedIds = renderedMessageIds();
    const hasUncachedMessage = Boolean(S.messageConversation)
      && renderedIds.some(id => !S.messageConversation?.mapping?.[id]);
    const refreshRetryElapsed = Date.now() - S.messageConversationRefreshAt >= 30000;
    if (hasMissingRenderedTimestamps()
        || (hasUncachedMessage && !window.ChatGPTDomAdapter.isGenerating()
          && (renderedIds.join('|') !== S.messageConversationRefreshSignature || refreshRetryElapsed))) {
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

    if (!S.settings.enabled || !conversationId) return true;
    for (const delay of MESSAGE_ROUTE_RETRY_DELAYS_MS) {
      const timer = window.setTimeout(() => {
        S.messageRouteRetryTimers = S.messageRouteRetryTimers.filter(item => item !== timer);
        if (currentConversationId() !== conversationId) return;
        if (S.settings.showMessageTimestamps) {
          stampMessageTimestamps().catch(error => log('Message timestamp route refresh failed:', error.message));
        }
        resumePendingSearchJump().catch(error => log('Search result jump failed:', error.message));
      }, delay);
      S.messageRouteRetryTimers.push(timer);
    }
    scheduleAutomaticIndexRefresh(12000);
    return true;
  }

  function setupConversationRouteTracking() {
    const checkView = () => refreshMessageTimestampsForView();
    window.addEventListener('popstate', checkView);
    window.addEventListener('hashchange', checkView);
    if (window.navigation?.addEventListener) {
      window.navigation.addEventListener('navigatesuccess', checkView);
    }
    window.setInterval(checkView, MESSAGE_ROUTE_CHECK_MS);
    // Minimap reuses rendered turns and checks local raw JSON without network detail requests.
    window.setInterval(syncConversationMinimap, 3000);
    // A minimap/search jump can wait for virtualized turns for up to 45s.
    // Once the user starts navigating manually, that old async jump must not
    // regain control when its target eventually mounts and snap the view back
    // to the previous destination (most visibly, the end of a long chat).
    const cancelPendingJumpForManualNavigation = event => {
      if (event.type === 'keydown' && ![
        'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '
      ].includes(event.key)) return;
      activeSearchJumpToken++;
      S.minimap.jumpToken++;
    };
    document.addEventListener('wheel', cancelPendingJumpForManualNavigation,
      { passive: true, capture: true });
    document.addEventListener('touchmove', cancelPendingJumpForManualNavigation,
      { passive: true, capture: true });
    document.addEventListener('keydown', cancelPendingJumpForManualNavigation, true);
    const scheduleActive = () => {
      if (S.minimap.frame) return;
      S.minimap.frame = window.requestAnimationFrame(() => {
        S.minimap.frame = 0;
        updateMinimapActive();
      });
    };
    document.addEventListener('scroll', scheduleActive, { passive: true, capture: true });
    window.addEventListener('resize', scheduleActive, { passive: true });
  }

  function updateMinimapActive() {
    if (!S.minimap.entries.length) return;
    const items = S.minimap.entries.filter(item => item.target?.isConnected);
    if (!items.length) return;
    const anchor = window.innerHeight * 0.38;
    let low = 0;
    let high = items.length;
    // DOM-ordered messages permit logarithmic lookup on scroll instead of
    // measuring every message in conversations with thousands of turns.
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (items[middle].target.getBoundingClientRect().top < anchor) low = middle + 1;
      else high = middle;
    }
    const previous = items[Math.max(0, low - 1)];
    const next = items[Math.min(items.length - 1, low)];
    const active = Math.abs(previous.target.getBoundingClientRect().top - anchor)
      <= Math.abs(next.target.getBoundingClientRect().top - anchor) ? previous : next;
    if (active === S.minimap.active) return;
    S.minimap.active?.button.classList.remove('chatgpt-pro-minimap-active');
    S.minimap.active?.button.removeAttribute('aria-current');
    active.button.classList.add('chatgpt-pro-minimap-active');
    active.button.setAttribute('aria-current', 'location');
    S.minimap.active = active;
  }

  function groupMinimapMessages(entries) {
    const grouped = [];
    for (const entry of entries) {
      if (!['user', 'assistant'].includes(entry.role)) continue;
      const previous = grouped[grouped.length - 1];
      if (entry.role === 'assistant' && previous?.role === 'assistant') {
        const targets = previous.targets || (previous.target ? [previous.target] : []);
        if (entry.target && !targets.includes(entry.target)) targets.push(entry.target);
        previous.targets = targets;
        previous.messageIds ||= previous.id ? [previous.id] : [];
        if (entry.id && !previous.messageIds.includes(entry.id)) previous.messageIds.push(entry.id);
        if (!previous.target && entry.target) previous.target = entry.target;
        // Keep the first rendered node as the scroll target, but show the
        // final/last message in the assistant turn as the preview and ID.
        if (entry.channel === 'final' || previous.channel !== 'final') {
          previous.id = entry.id || previous.id;
          previous.preview = entry.preview || previous.preview;
          previous.channel = entry.channel || previous.channel;
        }
        continue;
      }
      grouped.push({
        ...entry,
        messageIds: entry.id ? [entry.id] : [],
        // A grouped assistant reply navigates to its first message part even
        // when the preview/metadata comes from the final part.
        startId: entry.startId || entry.id,
        targets: entry.target ? [entry.target] : [...(entry.targets || [])]
      });
    }
    return grouped.map((entry, index) => ({ ...entry, index }));
  }

  function minimapMessages(data, rendered) {
    const domRaw = rendered.map((target, index) => ({
      id: window.ChatGPTDomAdapter.messageIds(target)[0] || '',
      target, role: window.ChatGPTDomAdapter.messageRole(target),
      preview: String(target.innerText || target.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 180),
      index
    }));
    const domHasRoles = domRaw.some(entry => ['user', 'assistant'].includes(entry.role));
    const dom = domHasRoles
      ? groupMinimapMessages(domRaw)
      : domRaw.map((entry, index) => ({ ...entry, index, targets: entry.target ? [entry.target] : [] }));
    if (!data?.mapping) return dom;
    const byId = new Map();
    for (const entry of domRaw) if (entry.id) byId.set(entry.id, entry.target);
    const fullRaw = currentBranchMessages(data)
      .filter(isUserVisibleMessage)
      .map((message, index) => ({
        id: message.id, role: message.author.role,
        target: byId.get(message.id) || null,
        preview: messageText(message).replace(/\s+/g, ' ').trim().slice(0, 180),
        channel: message.channel, index
      }));
    const full = groupMinimapMessages(fullRaw);
    // If ChatGPT has changed its DOM IDs, retain the full first/last entries
    // but use DOM ordering when the cached branch does not match this page.
    if (full.length && !full.some(entry => entry.target) && full.length === dom.length) {
      full.forEach((entry, index) => {
        entry.target = dom[index].target;
        entry.targets = dom[index].targets || (dom[index].target ? [dom[index].target] : []);
      });
    }
    const matchedDomGroups = domHasRoles
      ? dom.filter(entry => entry.targets?.some(target => full.some(item => item.targets?.includes(target)))).length
      : 0;
    const domCoverage = dom.length ? matchedDomGroups / dom.length : 0;
    if (full.length && !domHasRoles && full.some(entry => entry.target)) return full;
    return full.length && (full.length >= dom.length || domCoverage >= 0.5) ? full : dom;
  }

  function minimapSample(messages, activeIndex) {
    const total = messages.length;
    const slots = minimapSlotCount();
    if (total <= slots) return messages;
    const inside = slots - 2;
    const start = Math.max(1, Math.min(total - inside - 1,
      Math.max(1, activeIndex) - Math.floor(inside / 2)));
    return [messages[0], ...messages.slice(start, start + inside), messages[total - 1]];
  }

  function minimapSlotCount() {
    const dock = document.querySelector('[data-chatgpt-pro-tool-dock]');
    const panel = dock?.querySelector('[data-chatgpt-pro-minimap]');
    const railHeight = panel
      ? Math.max(0, panel.clientHeight - 6)
      : Math.max(36, window.innerHeight * 0.72);
    return Math.max(3, Math.min(49, Math.floor(railHeight / 10)));
  }

  async function checkMinimapCache(id) {
    if (S.minimap.checking) {
      const pending = S.minimap.cachePromise;
      if (S.minimap.cachedId === id) return pending;
      if (pending) await pending;
      if (currentConversationId() === id) return checkMinimapCache(id);
      return;
    }
    if (S.minimap.cachedId === id &&
        (S.minimap.cachedMessages || Date.now() - S.minimap.lastCacheCheck < 20000)) return;
    if (S.minimap.cachedId !== id) S.minimap.cachedMessages = null;
    S.minimap.cachedId = id;
    S.minimap.lastCacheCheck = Date.now();
    S.minimap.checking = true;
    const pending = (async () => {
      try {
        const accountId = await window.APIHandler.getAccountId();
        const result = await runtimeMessage({ action: 'localDataGetConversation', accountId, id });
        if (currentConversationId() === id && result.hit && result.raw?.mapping) {
          S.minimap.cachedMessages = result.raw;
          S.minimap.signature = '';
          if (S.settings.enabled && S.settings.showMinimap) syncConversationMinimap();
        }
      } catch (error) {
        log('Minimap local cache unavailable:', error.message);
      } finally {
        S.minimap.checking = false;
        if (S.minimap.cachePromise === pending) S.minimap.cachePromise = null;
      }
    })();
    S.minimap.cachePromise = pending;
    return pending;
  }

  function conversationProgressSnapshot(scroller) {
    const messages = window.ChatGPTDomAdapter.messageElements();
    // Include every rendered ID: virtualized conversations can replace a
    // middle segment without changing message count or the sampled endpoints.
    const ids = messages.map((message, index) =>
      window.ChatGPTDomAdapter.messageIds(message).join(',') || `position-${index}`
    ).join('|');
    const main = document.querySelector('main');
    return `${messages.length}#${ids}#${scroller?.scrollHeight || 0}#${main?.scrollHeight || 0}`;
  }

  // Wait for actual conversation growth before trying another scroll. A
  // timeout is only a fallback signal; message/DOM progress takes priority.
  function waitForConversationProgress(scroller, isCurrentJump, resolveTarget, {
    initialWaitMs = 6000, quietMs = 1400, maxWaitMs = 12000
  } = {}) {
    return new Promise(resolve => {
      let finished = false;
      let changed = false;
      let lastChangeAt = 0;
      let signature = conversationProgressSnapshot(scroller);
      const startedAt = Date.now();
      let pollTimer = null;
      let mutationTimer = null;
      let observer = null;
      const root = document.querySelector('main') ||
        (scroller && scroller !== document.scrollingElement ? scroller : null) || document.body;
      const finish = result => {
        if (finished) return;
        finished = true;
        observer?.disconnect();
        if (pollTimer !== null) clearTimeout(pollTimer);
        if (mutationTimer !== null) clearTimeout(mutationTimer);
        resolve(result);
      };
      const check = () => {
        if (finished) return;
        if (!isCurrentJump()) return finish({ status: 'cancelled', target: null });
        const target = resolveTarget();
        if (target?.isConnected) return finish({ status: 'target', target });
        const nextSignature = conversationProgressSnapshot(scroller);
        if (nextSignature !== signature) {
          signature = nextSignature;
          changed = true;
          lastChangeAt = Date.now();
        }
        const now = Date.now();
        if (changed && (now - lastChangeAt >= quietMs || now - startedAt >= maxWaitMs)) {
          return finish({ status: 'progress', target: null });
        }
        if (!changed && now - startedAt >= initialWaitMs) {
          return finish({ status: 'idle', target: null });
        }
      };
      try {
        observer = new MutationObserver(() => {
          // ChatGPT can emit many tiny DOM mutations while rendering a turn.
          // Coalesce them; the periodic poll remains the reliable fallback.
          if (mutationTimer !== null) return;
          mutationTimer = window.setTimeout(() => {
            mutationTimer = null;
            check();
          }, 140);
        });
        observer.observe(root, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: [
            'data-message-id', 'data-chatgpt-selection-message-id',
            'data-chatgpt-search-message-ids', 'data-turn-id',
            'data-chatgpt-search-unit-key', 'data-content-search-unit-key'
          ]
        });
      } catch {
        observer?.disconnect();
        observer = null;
      }
      const poll = () => {
        check();
        if (!finished) pollTimer = window.setTimeout(poll, 300);
      };
      check();
      if (!finished) pollTimer = window.setTimeout(poll, 300);
    });
  }

  let activeSearchJumpToken = 0;

  async function jumpMinimapEntry(entry, total, preferredMessageId = '', alignmentBlock = 'start',
    navigationEntries = S.minimap.allEntries) {
    activeSearchJumpToken++;
    const jumpToken = ++S.minimap.jumpToken;
    const conversationId = currentConversationId();
    const isCurrentJump = () => jumpToken === S.minimap.jumpToken
      && conversationId === currentConversationId();
    const expectedId = preferredMessageId || entry.startId || entry.id;
    const resolveTarget = () => {
      // Reuse the DOM adapter's complete ID lookup. Modern ChatGPT layouts
      // can expose message IDs only through data-chatgpt-search-message-ids.
      const targetMatchesId = target => target?.isConnected
        && (!expectedId || window.ChatGPTDomAdapter.messageIds(target).includes(expectedId));
      if (targetMatchesId(entry.target)) return entry.target;
      return expectedId ? findMinimapTargetById(expectedId) : null;
    };
    const alignTarget = async target => {
      if (!target?.isConnected || !isCurrentJump()) return false;
      if (preferredMessageId) {
        target.scrollIntoView({ behavior: 'smooth', block: alignmentBlock });
        target.classList.add('chatgpt-pro-search-target');
        window.setTimeout(() => target.classList.remove('chatgpt-pro-search-target'), 2600);
        await sleep(350);
        return isCurrentJump() && target.isConnected;
      }
      // Keep the start of the message visible in the upper part of the
      // viewport, leaving room to read the beginning of the conversation.
      const preferredTop = Math.max(64, Math.min(150, window.innerHeight * 0.22));
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      await sleep(350);
      if (!isCurrentJump() || !target.isConnected) return false;
      const scroller = conversationScrollContainer();
      for (let attempt = 0; attempt < 3; attempt++) {
        const delta = target.getBoundingClientRect().top - preferredTop;
        if (Math.abs(delta) <= 10) break;
        const before = Math.abs(delta);
        if (scroller === document.scrollingElement) window.scrollBy({ top: delta, behavior: 'auto' });
        else scroller?.scrollBy?.({ top: delta, behavior: 'auto' });
        await sleep(80);
        if (!isCurrentJump() || !target.isConnected) return false;
        if (Math.abs(target.getBoundingClientRect().top - preferredTop) >= before - 2) {
          // Some reversed/virtualized scroll containers ignore a direct
          // scrollBy correction. Fall back to native centered visibility.
          target.scrollIntoView({ behavior: 'auto', block: 'center' });
          await sleep(80);
          break;
        }
      }
      return true;
    };
    let target = resolveTarget();
    if (target) return alignTarget(target);
    const isEdge = entry.index === 0 || entry.index === total - 1;
    if (!isEdge && expectedId) {
      refreshMinimapEntryTargets(navigationEntries);
      // Never guess from preview text when an exact ID is missing. Even if
      // most turns are rendered, wait for DOM progress and use scrolling only
      // as a fallback to make the requested ID appear.
      const deadline = Date.now() + 45000;
      let needsPosition = true;
      let fallbackStep = false;
      while (Date.now() < deadline) {
        if (!isCurrentJump()) return false;
        refreshMinimapEntryTargets(navigationEntries);
        target = resolveTarget();
        if (target) return alignTarget(target);
        const scroller = conversationScrollContainer();
        if (!scroller) {
          await sleep(350);
          continue;
        }
        const loaded = navigationEntries.filter(item => {
          const id = item.startId || item.id;
          return item.target?.isConnected && (!id || window.ChatGPTDomAdapter.messageIds(item.target).includes(id));
        });
        const nearest = loaded.reduce((best, item) =>
          !best || Math.abs(item.index - entry.index) < Math.abs(best.index - entry.index) ? item : best, null);
        const reversed = getComputedStyle(scroller).flexDirection === 'column-reverse';
        if (needsPosition && nearest) {
          nearest.target.scrollIntoView({ behavior: 'auto', block: 'center' });
          needsPosition = false;
        } else if (needsPosition) {
          const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
          const fraction = entry.index / Math.max(1, total - 1);
          const top = reversed ? -max * (1 - fraction) : max * fraction;
          scroller.scrollTo?.({ top, behavior: 'auto' });
          needsPosition = false;
        } else if (fallbackStep) {
          const towardEnd = nearest ? (entry.index > nearest.index ? 1 : -1) : 0;
          const max = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
          const targetFraction = entry.index / Math.max(1, total - 1);
          const currentFraction = reversed
            ? 1 - Math.min(1, Math.abs(scroller.scrollTop) / max)
            : Math.min(1, Math.max(0, scroller.scrollTop / max));
          const direction = (nearest ? towardEnd : (targetFraction >= currentFraction ? 1 : -1))
            * (reversed ? -1 : 1);
          const distance = Math.max(180, scroller.clientHeight * 0.65);
          if (scroller === document.scrollingElement) window.scrollBy({ top: direction * distance, behavior: 'auto' });
          else scroller.scrollBy?.({ top: direction * distance, behavior: 'auto' });
          fallbackStep = false;
        }
        const progress = await waitForConversationProgress(scroller, isCurrentJump, resolveTarget);
        if (progress.status === 'cancelled') return false;
        if (progress.target) return alignTarget(progress.target);
        target = resolveTarget();
        if (target) return alignTarget(target);
        if (progress.status === 'progress') needsPosition = true;
        else fallbackStep = true;
      }
      return false;
    }
    // ChatGPT lazily renders the ends of long conversations. Wait for actual
    // message/DOM growth at the boundary; nudging is only a fallback after an
    // entire idle window with no new content.
    if (isEdge) {
      const deadline = Date.now() + 45000;
      let fallbackNudgeNext = false;
      while (Date.now() < deadline) {
        if (!isCurrentJump()) return false;
        target = resolveTarget();
        if (target) return alignTarget(target);
        const scroller = conversationScrollContainer();
        if (!scroller) {
          await sleep(500);
          continue;
        }
        const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        const reversed = getComputedStyle(scroller).flexDirection === 'column-reverse';
        const first = entry.index === 0;
        const edgeTop = first ? (reversed ? -max : 0) : (reversed ? 0 : max);
        const inset = Math.min(80, max);
        const nudgeTop = edgeTop + (first ? inset : -inset);
        // Only nudge after the observer reports a quiet period with no growth.
        if (fallbackNudgeNext && max > 1) {
          scroller.scrollTo?.({ top: nudgeTop, behavior: 'auto' });
          await sleep(90);
          if (!isCurrentJump()) return false;
          target = resolveTarget();
          if (target) return alignTarget(target);
        }
        scroller.scrollTo?.({ top: edgeTop, behavior: 'auto' });
        fallbackNudgeNext = false;
        const progress = await waitForConversationProgress(scroller, isCurrentJump, resolveTarget);
        if (progress.status === 'cancelled') return false;
        if (progress.target) return alignTarget(progress.target);
        target = resolveTarget();
        if (target) return alignTarget(target);
        fallbackNudgeNext = progress.status === 'idle';
      }
      return false;
    }
    return false;
  }

  function syncConversationMinimap() {
    const id = S.settings.enabled && S.settings.showMinimap && currentConversationId();
    const previous = document.querySelector('[data-chatgpt-pro-minimap]');
    if (!id) {
      previous?.remove();
      document.querySelector('[data-chatgpt-pro-tool-dock]')?.classList.add('chatgpt-pro-tool-dock-minimap-hidden');
      updateMinimapDockLayout();
      S.minimap.id = null;
      S.minimap.signature = '';
      S.minimap.entries = [];
      S.minimap.allEntries = [];
      S.minimap.active = null;
      S.minimap.cachedId = null;
      S.minimap.cachedMessages = null;
      return;
    }
    const dock = ensureCurrentChatToolDock();
    dock.classList.remove('chatgpt-pro-tool-dock-minimap-hidden');
    // Do not require role attributes: some ChatGPT views expose message IDs
    // without the role, and filtering them all previously hid the minimap.
    const messages = window.ChatGPTDomAdapter.messageElements();
    checkMinimapCache(id).catch(error => log('Minimap cache lookup failed:', error.message));
    if (messages.length < 2 && !(S.minimap.cachedId === id && S.minimap.cachedMessages)) {
      previous?.remove();
      dock.classList.add('chatgpt-pro-tool-dock-minimap-hidden');
      updateMinimapDockLayout();
      S.minimap.signature = '';
      S.minimap.entries = [];
      S.minimap.allEntries = [];
      S.minimap.active = null;
      return;
    }
    const allEntries = minimapMessages(S.minimap.cachedId === id ? S.minimap.cachedMessages : null, messages);
    S.minimap.allEntries = allEntries;
    const seen = messages.findIndex(element => {
      const r = element.getBoundingClientRect();
      return r.bottom > window.innerHeight * 0.38;
    });
    const nearby = messages[Math.max(0, seen)];
    const mapped = allEntries.findIndex(entry => entry.target === nearby || entry.targets?.includes(nearby));
    const activeIndex = mapped >= 0 ? mapped
      : Math.min(allEntries.length - 1, Math.round(Math.max(0, seen) / Math.max(1, messages.length - 1) * (allEntries.length - 1)));
    const sampled = minimapSample(allEntries, activeIndex);
    const signature = `${id}:${allEntries.length}:slots=${minimapSlotCount()}:${sampled.map(item => item.index).join(',')}:${messages.map((element, index) =>
      window.ChatGPTDomAdapter.messageIds(element).join(',') || `position-${index}`).join('|')}`;
    if (previous && S.minimap.signature === signature &&
        S.minimap.entries.length === sampled.length) {
      updateMinimapDockLayout();
      updateMinimapActive();
      return;
    }
    const panel = document.createElement('nav');
    panel.className = 'chatgpt-pro-minimap';
    panel.setAttribute('data-chatgpt-pro-minimap', '1');
    panel.setAttribute('aria-label', '长对话快速导航');
    const rail = document.createElement('div');
    rail.className = 'chatgpt-pro-minimap-rail';
    rail.setAttribute('aria-label', '对话消息导航');
    rail.tabIndex = 0;
    const preview = document.createElement('div');
    preview.className = 'chatgpt-pro-minimap-preview';
    preview.hidden = true;
    preview.setAttribute('role', 'tooltip');
    const previewHeading = document.createElement('span');
    previewHeading.className = 'chatgpt-pro-minimap-preview-heading';
    const previewText = document.createElement('span');
    previewText.className = 'chatgpt-pro-minimap-preview-text';
    preview.append(previewHeading, previewText);
    const entries = [];
    rail.style.gridTemplateRows = `repeat(${sampled.length}, minmax(0, 1fr))`;
    for (const entry of sampled) {
      const { target, index, role } = entry;
      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = `chatgpt-pro-minimap-marker chatgpt-pro-minimap-${role || 'unknown'}`;
      if (entry.startId || entry.id) marker.dataset.chatgptProMinimapMessageId = entry.startId || entry.id;
      const speaker = role === 'user' ? '用户' : role === 'assistant' ? 'ChatGPT' : '消息';
      marker.title = `${index + 1}/${allEntries.length} · ${speaker}`;
      marker.setAttribute('aria-label', marker.title);
      if (index === 0) marker.classList.add('chatgpt-pro-minimap-first');
      if (index === allEntries.length - 1) marker.classList.add('chatgpt-pro-minimap-last');
      const showPreview = () => {
        previewHeading.textContent = `${index + 1}/${allEntries.length} · ${speaker}`;
        previewText.textContent = entry.preview;
        const markerTop = marker.getBoundingClientRect().top - panel.getBoundingClientRect().top;
        preview.style.top = `${Math.max(4, Math.min(panel.clientHeight - 155, markerTop - 28))}px`;
        preview.hidden = false;
      };
      marker.addEventListener('pointerenter', showPreview);
      marker.addEventListener('focus', showPreview);
      marker.addEventListener('pointerleave', () => { preview.hidden = true; });
      marker.addEventListener('blur', () => { preview.hidden = true; });
      marker.addEventListener('click', () => jumpMinimapEntry(entry, allEntries.length));
      rail.append(marker);
      entries.push({ ...entry, button: marker });
    }
    const locateRailEntry = event => {
      const rect = rail.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height)));
      return sampled[Math.min(sampled.length - 1, Math.floor(fraction * sampled.length))];
    };
    let dragStart = null;
    rail.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      dragStart = { y: event.clientY };
    });
    rail.addEventListener('pointermove', event => {
      if (!dragStart) return;
      const nearest = locateRailEntry(event);
      const marker = entries.find(item => item.index === nearest.index)?.button;
      marker?.dispatchEvent(new Event('pointerenter'));
    });
    rail.addEventListener('pointerup', event => {
      if (!dragStart) return;
      const moved = Math.abs(dragStart.y - event.clientY) > 6;
      dragStart = null;
      if (moved) jumpMinimapEntry(locateRailEntry(event), allEntries.length);
    });
    rail.addEventListener('pointercancel', () => { dragStart = null; });
    rail.addEventListener('keydown', event => {
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? sampled.length - 1
        : event.key === 'ArrowDown' ? Math.min(sampled.length - 1,
          entries.findIndex(item => item === S.minimap.active) + 1)
        : event.key === 'ArrowUp' ? Math.max(0,
          entries.findIndex(item => item === S.minimap.active) - 1) : -1;
      if (index < 0) return;
      event.preventDefault();
      jumpMinimapEntry(sampled[index], allEntries.length);
    });
    panel.append(rail, preview);
    previous?.remove();
    dock.insertBefore(panel, dock.firstChild);
    window.ChatGPTProI18n?.watch(panel);
    S.minimap.id = id;
    S.minimap.signature = signature;
    S.minimap.entries = entries;
    S.minimap.active = null;
    S.minimap.layoutSlots = minimapSlotCount();
    updateMinimapDockLayout();
    updateMinimapActive();
  }

  function makeBadge(text) {
    const badge = document.createElement('span');
    badge.setAttribute('data-chatgpt-pro', '1');
    badge.className = 'chatgpt-pro-badge';
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
    if (map?.partial) {
      window.APIHandler.syncConversationList(true)
        .then(records => applySyncedConversationRecords(records, '已完成首次目录同步'))
        .catch(error => log('Initial directory sync failed:', error.message));
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

  async function incrementalSyncConversationList(statusText = '已完成增量同步', options = {}) {
    const records = await window.APIHandler.syncConversationList(false, options);
    applySyncedConversationRecords(records, statusText);
    return records;
  }

  async function backgroundSyncConversationList() {
    if (!S.settings.enabled || document.hidden) return;
    try {
      const records = await incrementalSyncConversationList('已完成后台增量同步');
      await maybeAutoIncrementalIndex(records);
    } catch (error) {
      log('Background sync failed:', error.message);
    }
  }

  const AUTO_INDEX_GENERATION_RECHECK_MS = 2000;
  let automaticIndexRefreshTimer = null;
  function scheduleAutomaticIndexRefresh(delay = 1500) {
    if (!S.settings.enabled || document.hidden) return;
    window.clearTimeout(automaticIndexRefreshTimer);
    automaticIndexRefreshTimer = window.setTimeout(async () => {
      automaticIndexRefreshTimer = null;
      if (!S.settings.enabled || document.hidden) return;
      // The first DOM event often arrives while ChatGPT is still streaming.
      // Wait for its stop control to disappear before saving the final reply.
      if (window.ChatGPTDomAdapter.isGenerating()) {
        scheduleAutomaticIndexRefresh(AUTO_INDEX_GENERATION_RECHECK_MS);
        return;
      }
      try {
        // A newly created conversation or a freshly completed response must
        // not wait for the five-minute maintenance poll. Revalidate the first
        // directory page, then bypass only the in-page auto-check throttle;
        // updateFullTextIndex still fetches details solely for changed IDs.
        const records = await incrementalSyncConversationList('已完成新对话同步', { checkLatest: true });
        await maybeAutoIncrementalIndex(records, { force: true });
      } catch (error) {
        log('Event-driven automatic index refresh failed:', error.message);
      }
    }, delay);
  }

  function closeTimeline() {
    S.timeline?.remove();
    S.timeline = null;
    if (S.launcher) {
      S.launcher.classList.remove('chatgpt-pro-open');
      S.launcher.removeAttribute('data-panel-vertical');
      S.launcher.removeAttribute('data-panel-horizontal');
      S.launcher.setAttribute('aria-expanded', 'false');
      setLauncherIcon(false);
      S.launcher.title = launcherTitle(false);
    }
  }

  function launcherTitle(expanded) {
    const key = expanded ? 'ui.collapseConversationsDragToMove' : 'ui.conversationsDragToMove';
    return window.ChatGPTProI18n?.t(key)
      || (expanded ? 'Collapse conversations (drag to move)' : 'Conversations (drag to move)');
  }

  function setLauncherIcon(expanded) {
    if (!S.launcher) return;
    if (expanded) {
      if (S.launcher.classList.contains('chatgpt-pro-dock-launcher')) {
        S.launcher.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14"/></svg>';
      } else {
        S.launcher.textContent = '−';
      }
    } else if (S.launcher.classList.contains('chatgpt-pro-dock-launcher')) {
      S.launcher.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
    } else {
      S.launcher.textContent = '☰';
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
    if (S.launcher.closest('[data-chatgpt-pro-tool-dock]')) {
      placeCurrentChatToolDock();
      return;
    }
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
      const dock = button.closest('[data-chatgpt-pro-tool-dock]');
      startX = event.clientX;
      startY = event.clientY;
      startLeft = dock ? dock.getBoundingClientRect().left : rect.left;
      startTop = rect.top;
      button.setPointerCapture(event.pointerId);
      button.classList.add('chatgpt-pro-dragging');
    });

    button.addEventListener('pointermove', event => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 5) S.launcherMoved = true;
      const dock = button.closest('[data-chatgpt-pro-tool-dock]');
      if (dock) {
        const { minLeft, maxLeft } = toolDockPositionBounds(dock);
        const left = Math.max(minLeft, Math.min(maxLeft, startLeft + dx));
        dock.style.setProperty('left', `${left}px`, 'important');
        dock.style.setProperty('right', 'auto', 'important');
        const downloadPopover = dock.querySelector('[data-chatgpt-pro-download-popover]');
        if (downloadPopover && !downloadPopover.hidden) positionDownloadPopover(downloadPopover);
        if (S.timeline) positionTimelinePanel();
        return;
      }
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
      const dock = button.closest('[data-chatgpt-pro-tool-dock]');
      if (dock) saveCurrentChatToolDockPosition(dock.getBoundingClientRect().left, dock);
      else {
        const rect = button.getBoundingClientRect();
        saveLauncherPosition(rect.left, rect.top);
      }
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
    button.title = launcherTitle(false);
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
    window.ChatGPTProI18n?.watch(button);
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

  function ensureCurrentChatToolDock() {
    let dock = document.querySelector('[data-chatgpt-pro-tool-dock]');
    if (dock) return dock;
    dock = document.createElement('div');
    dock.className = 'chatgpt-pro-tool-dock';
    dock.setAttribute('data-chatgpt-pro-tool-dock', '1');
    document.body.appendChild(dock);
    placeCurrentChatToolDock();
    window.ChatGPTProI18n?.watch(dock);
    return dock;
  }

  function ensureCurrentChatToolActions() {
    const dock = ensureCurrentChatToolDock();
    let actions = dock.querySelector('[data-chatgpt-pro-tool-actions]');
    if (actions) return actions;
    actions = document.createElement('div');
    actions.className = 'chatgpt-pro-tool-actions';
    actions.setAttribute('data-chatgpt-pro-tool-actions', '1');
    dock.appendChild(actions);
    return actions;
  }

  function toolDockPositionBounds(dock) {
    const minLeft = VIEWPORT_MARGIN;
    const maxLeft = Math.max(minLeft, window.innerWidth - dock.offsetWidth - VIEWPORT_MARGIN);
    return { minLeft, maxLeft };
  }

  function placeCurrentChatToolDock() {
    const dock = document.querySelector('[data-chatgpt-pro-tool-dock]');
    if (!dock) return;
    const { minLeft, maxLeft } = toolDockPositionBounds(dock);
    const x = Math.max(0, Math.min(1, Number(S.settings.toolDockPositionX ?? 1)));
    const left = Math.round(minLeft + (maxLeft - minLeft) * x);
    dock.style.setProperty('left', `${left}px`, 'important');
    dock.style.setProperty('right', 'auto', 'important');
  }

  function saveCurrentChatToolDockPosition(left, dock) {
    const { minLeft, maxLeft } = toolDockPositionBounds(dock);
    const x = Math.max(0, Math.min(1, (left - minLeft) / Math.max(1, maxLeft - minLeft)));
    S.settings.toolDockPositionX = x;
    chrome.storage.local.set({ toolDockPositionX: x });
  }

  function attachLauncherToToolDock(dock) {
    if (!S.launcher?.isConnected) ensureFloatingButton();
    if (!S.launcher) return;
    const alreadyAttached = S.launcher.parentElement === dock;
    if (!alreadyAttached) dock.insertBefore(S.launcher, dock.firstChild);
    S.launcher.classList.add('chatgpt-pro-dock-launcher');
    S.launcher.style.removeProperty('left');
    S.launcher.style.removeProperty('top');
    S.launcher.title = launcherTitle(false);
    setLauncherIcon(Boolean(S.timeline));
    if (!alreadyAttached) placeCurrentChatToolDock();
    if (S.timeline) positionTimelinePanel();
  }

  function detachLauncherFromToolDock(dock) {
    if (!S.launcher || !dock?.contains(S.launcher)) return;
    closeTimeline();
    S.launcher.classList.remove('chatgpt-pro-dock-launcher');
    document.body.appendChild(S.launcher);
    S.launcher.title = launcherTitle(false);
    setLauncherIcon(false);
    placeLauncher();
  }

  function toolActionPositionBounds(actions) {
    const height = actions.offsetHeight;
    const maxTop = Math.max(VIEWPORT_MARGIN,
      window.innerHeight - height - VIEWPORT_MARGIN - 19);
    // Reserve room for the overlapping directory button and a usable minimap
    // rail. The bottom export action remains the vertical resize handle.
    const maxPanelHeight = Math.max(0,
      window.innerHeight - height - VIEWPORT_MARGIN * 2 - 38 - 26);
    const minPanelHeight = Math.min(60, maxPanelHeight);
    const minOffsetTop = 26 + minPanelHeight;
    const minTop = Math.min(maxTop, Math.max(VIEWPORT_MARGIN,
      Math.ceil((window.innerHeight - height + minOffsetTop) / 2)));
    return { minTop, maxTop };
  }

  function updateMinimapDockLayout(requestedActionTop = null) {
    const dock = document.querySelector('[data-chatgpt-pro-tool-dock]');
    const actions = dock?.querySelector('[data-chatgpt-pro-tool-actions]');
    const panel = dock?.querySelector('[data-chatgpt-pro-minimap]');
    if (!dock || !actions) return;
    const { minTop, maxTop } = toolActionPositionBounds(actions);
    const currentTop = Number.isFinite(requestedActionTop)
      ? requestedActionTop
      : actions.getBoundingClientRect().top;
    const actionTop = Math.max(minTop, Math.min(maxTop, currentTop));
    const dockTop = window.innerHeight - actionTop - actions.offsetHeight;
    const actionsOffsetTop = actionTop - dockTop;
    dock.style.setProperty('top', `${dockTop}px`, 'important');
    // The dock and the last action share the same bottom edge. The directory
    // button overlaps the dock's top edge; the minimap rail starts beneath it.
    dock.style.setProperty('height', `${Math.max(0, actionsOffsetTop + actions.offsetHeight)}px`, 'important');
    actions.style.setProperty('top', `${actionsOffsetTop}px`, 'important');
    const panelHeight = Math.max(0, actionsOffsetTop - 26);
    if (panel) panel.style.setProperty('height', `${panelHeight}px`, 'important');
    const downloadPopover = dock.querySelector('[data-chatgpt-pro-download-popover]');
    if (downloadPopover && !downloadPopover.hidden) positionDownloadPopover(downloadPopover);
  }

  function placeCurrentChatExportButton() {
    const dock = document.querySelector('[data-chatgpt-pro-tool-dock]');
    const actions = dock?.querySelector('[data-chatgpt-pro-tool-actions]');
    if (!dock || !actions) return;
    const { minTop, maxTop } = toolActionPositionBounds(actions);
    const savedY = S.settings.currentExportPositionY;
    const hasSavedPosition = savedY != null && Number.isFinite(Number(savedY));
    const defaultDockHeight = window.innerHeight * 0.5;
    const defaultActionTop = (window.innerHeight + defaultDockHeight) / 2 - actions.offsetHeight;
    const top = hasSavedPosition
      ? Math.round(minTop + (maxTop - minTop) * Math.max(0, Math.min(1, Number(savedY))))
      : Math.max(minTop, Math.min(maxTop, defaultActionTop));
    updateMinimapDockLayout(top);
  }

  function saveCurrentChatExportPosition(top, actions) {
    const { minTop, maxTop } = toolActionPositionBounds(actions);
    const y = Math.max(0, Math.min(1, (top - minTop) / Math.max(1, maxTop - minTop)));
    S.settings.currentExportPositionY = y;
    chrome.storage.local.set({ currentExportPositionY: y });
  }

  function setupCurrentChatExportDrag(button) {
    const dock = button.closest('[data-chatgpt-pro-tool-dock]');
    const actions = button.closest('[data-chatgpt-pro-tool-actions]');
    if (!dock || !actions) return;
    let dragging = false;
    let startY = 0;
    let startTop = 0;

    button.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      dragging = true;
      S.currentExportMoved = false;
      startY = event.clientY;
      startTop = actions.getBoundingClientRect().top;
      button.setPointerCapture(event.pointerId);
      button.classList.add('chatgpt-pro-dragging');
    });

    button.addEventListener('pointermove', event => {
      if (!dragging) return;
      const dy = event.clientY - startY;
      if (Math.abs(dy) > 5) S.currentExportMoved = true;
      const { minTop, maxTop } = toolActionPositionBounds(actions);
      const top = Math.max(minTop, Math.min(maxTop, startTop + dy));
      updateMinimapDockLayout(top);
      const slots = minimapSlotCount();
      if (S.minimap.layoutSlots !== slots) syncConversationMinimap();
    });

    const finish = event => {
      if (!dragging) return;
      dragging = false;
      button.classList.remove('chatgpt-pro-dragging');
      try { button.releasePointerCapture(event.pointerId); } catch (_) {}
      saveCurrentChatExportPosition(actions.getBoundingClientRect().top, actions);
    };
    button.addEventListener('pointerup', finish);
    button.addEventListener('pointercancel', finish);
  }

  function updateCurrentChatExportButtonLabel(button) {
    if (!button) return;
    const label = window.ChatGPTProI18n?.t('ui.openExportMenu') || '打开导出菜单';
    button.title = label;
    button.setAttribute('aria-label', label);
  }

  function closeToolPopovers(except = null) {
    document.querySelectorAll('.chatgpt-pro-tool-popover').forEach(element => {
      if (element !== except) element.hidden = true;
    });
  }

  function positionDownloadPopover(popover) {
    const dock = popover?.closest('[data-chatgpt-pro-tool-dock]');
    const trigger = dock?.querySelector('[data-chatgpt-pro-current-export]');
    const markdown = popover?.querySelector('[data-export-markdown]');
    const images = popover?.querySelector('[data-export-images]');
    if (!dock || !trigger || !markdown || !images || popover.hidden) return;
    const dockRect = dock.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const markdownRect = markdown.getBoundingClientRect();
    const mainRadius = Math.min(triggerRect.width, triggerRect.height) / 2;
    const childRadius = Math.min(markdownRect.width, markdownRect.height) / 2;
    const gap = 4;
    // Place the three button centers on an equilateral triangle. The two
    // smaller export buttons sit to the left of the primary download button;
    // Markdown is level with it and image export is below the pair.
    const centerDistance = mainRadius + childRadius + gap;
    const lowerOffset = Math.sqrt(Math.max(0,
      centerDistance ** 2 - (centerDistance / 2) ** 2));
    const mainCenterX = triggerRect.left + triggerRect.width / 2;
    const mainCenterY = triggerRect.top + triggerRect.height / 2;
    const upperFits = mainCenterY - lowerOffset - childRadius >= VIEWPORT_MARGIN;
    const lowerFits = mainCenterY + lowerOffset + childRadius <= window.innerHeight - VIEWPORT_MARGIN;
    const verticalDirection = lowerFits || !upperFits ? 1 : -1;

    popover.style.setProperty('left',
      `${mainCenterX - dockRect.left - dock.clientLeft}px`, 'important');
    popover.style.setProperty('top',
      `${mainCenterY - dockRect.top - dock.clientTop}px`, 'important');
    popover.style.setProperty('bottom', 'auto', 'important');
    popover.style.setProperty('right', 'auto', 'important');
    markdown.style.setProperty('left', `${-centerDistance - childRadius}px`, 'important');
    markdown.style.setProperty('top', `${-childRadius}px`, 'important');
    images.style.setProperty('left', `${-centerDistance / 2 - childRadius}px`, 'important');
    images.style.setProperty('top',
      `${verticalDirection * lowerOffset - childRadius}px`, 'important');
  }

  function ensureDownloadPopover() {
    const dock = ensureCurrentChatToolDock();
    let popover = dock.querySelector('[data-chatgpt-pro-download-popover]');
    if (popover) return popover;
    popover = document.createElement('div');
    popover.className = 'chatgpt-pro-tool-popover chatgpt-pro-download-popover';
    popover.setAttribute('data-chatgpt-pro-download-popover', '1');
    popover.hidden = true;

    const markdown = document.createElement('button');
    markdown.type = 'button';
    markdown.className = 'chatgpt-pro-download-action';
    markdown.dataset.exportMarkdown = '1';
    markdown.title = window.ChatGPTProI18n.t('ui.exportEntireChatMarkdown');
    markdown.setAttribute('aria-label', markdown.title);
    markdown.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 15h8M8 18h6"/></svg>';
    markdown.addEventListener('click', async () => {
      const rec = currentConversationRecord();
      if (!rec) return;
      markdown.disabled = true;
      try { await exportConversationMarkdown(rec); }
      finally { markdown.disabled = false; popover.hidden = true; }
    });

    const images = document.createElement('button');
    images.type = 'button';
    images.className = 'chatgpt-pro-download-action';
    images.dataset.exportImages = '1';
    images.title = window.ChatGPTProI18n.t('ui.downloadAllConversationImagesZIP');
    images.setAttribute('aria-label', images.title);
    images.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m3 17 5-5 4 4 3-3 6 5"/></svg>';
    images.addEventListener('click', async () => {
      const rec = currentConversationRecord();
      if (!rec) return;
      images.disabled = true;
      try { await exportConversationImages(rec, text => { images.title = text; }); }
      finally { images.disabled = false; popover.hidden = true; }
    });
    popover.append(markdown, images);
    dock.appendChild(popover);
    return popover;
  }

  function ensureCurrentChatExportButton() {
    const id = currentConversationId();
    const existing = document.querySelector('[data-chatgpt-pro-current-export]');
    if (!id) {
      const dock = document.querySelector('[data-chatgpt-pro-tool-dock]');
      detachLauncherFromToolDock(dock);
      dock?.remove();
      return;
    }
    ensureFloatingButton();
    const dock = ensureCurrentChatToolDock();
    attachLauncherToToolDock(dock);
    if (existing) {
      updateCurrentChatExportButtonLabel(existing);
      ensureCurrentChatToolActions().appendChild(existing);
      ensureCurrentChatImageButton();
      ensureAutoContinueButton();
      placeCurrentChatExportButton();
      return;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chatgpt-pro-current-export';
    button.setAttribute('data-chatgpt-pro-current-export', '1');
    updateCurrentChatExportButtonLabel(button);
    button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <path d="M14 2v6h6"></path>
        <path d="M12 11v6"></path>
        <path d="m9.5 14.5 2.5 2.5 2.5-2.5"></path>
      </svg>`;
    button.addEventListener('click', () => {
      if (S.currentExportMoved) {
        S.currentExportMoved = false;
        return;
      }
      const popover = ensureDownloadPopover();
      const willOpen = popover.hidden;
      closeToolPopovers(popover);
      popover.hidden = !willOpen;
      if (willOpen) positionDownloadPopover(popover);
    });
    ensureCurrentChatToolActions().appendChild(button);
    setupCurrentChatExportDrag(button);
    ensureAutoContinueButton();
    // Keep the primary download action at the bottom of the minimap dock.
    ensureCurrentChatToolActions().appendChild(button);
    placeCurrentChatExportButton();
  }

  function ensureCurrentChatImageButton() {
    document.querySelector('[data-chatgpt-pro-current-images]')?.remove();
  }

  function autoContinueSnapshot() {
    const task = S.autoContinue;
    return {
      enabled: S.settings.autoContinueEnabled,
      mode: task.mode,
      conversationId: task.conversationId,
      sentCount: task.sentCount,
      deadline: task.deadline,
      reason: task.reason,
      text: S.settings.autoContinueText,
      delaySeconds: S.settings.autoContinueDelaySeconds,
      maxCount: S.settings.autoContinueMaxCount
    };
  }

  function persistAutoContinueTask() {
    const task = S.autoContinue;
    if (!task.conversationId || task.sentCount <= 0) {
      chrome.storage.local.remove(AUTO_CONTINUE_TASK_STATE_KEY);
      return;
    }
    chrome.storage.local.set({
      [AUTO_CONTINUE_TASK_STATE_KEY]: {
        conversationId: task.conversationId,
        sentCount: task.sentCount,
        sentAt: task.sentAt,
        reason: task.reason,
        text: S.settings.autoContinueText,
        maxCount: S.settings.autoContinueMaxCount
      }
    });
  }

  async function restoreAutoContinueTask() {
    const values = await new Promise(resolve => {
      chrome.storage.local.get(AUTO_CONTINUE_TASK_STATE_KEY, data => resolve(data || {}));
    });
    const saved = values[AUTO_CONTINUE_TASK_STATE_KEY];
    if (!saved || saved.conversationId !== currentConversationId() || Number(saved.sentCount) <= 0) return;
    Object.assign(S.autoContinue, {
      mode: 'paused',
      conversationId: saved.conversationId,
      sentCount: Number(saved.sentCount),
      deadline: 0,
      sentAt: Number(saved.sentAt) || 0,
      checking: false,
      assistantText: window.ChatGPTDomAdapter.lastAssistantText(),
      reason: typeof saved.reason === 'string' ? saved.reason : ''
    });
  }

  function autoContinueStatusText() {
    const task = S.autoContinue;
    const i18n = window.ChatGPTProI18n;
    if (!S.settings.autoContinueEnabled) return i18n.t('ui.autoContinueDisabled');
    if (task.mode === 'waiting') {
      if (window.ChatGPTDomAdapter.isGenerating()) return i18n.t('ui.waitingForCurrentReply');
      const seconds = Math.max(0, Math.ceil((task.deadline - Date.now()) / 1000));
      const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
      return i18n.format('ui.runningCountdown', { time });
    }
    if (task.mode === 'paused') {
      const reason = task.reason ? i18n.t(task.reason) : '';
      return reason ? i18n.format('ui.pausedWithReason', { reason }) : i18n.t('ui.paused');
    }
    return i18n.t('ui.currentChatNotStarted');
  }

  function renderAutoContinueUi() {
    const button = document.querySelector('[data-chatgpt-pro-auto-continue]');
    if (button) {
      button.dataset.mode = S.autoContinue.mode;
      button.title = autoContinueStatusText();
      button.hidden = !S.settings.autoContinueEnabled;
      const badge = button.querySelector('.chatgpt-pro-auto-badge');
      if (badge) {
        const seconds = Math.max(0, Math.ceil((S.autoContinue.deadline - Date.now()) / 1000));
        badge.textContent = S.autoContinue.mode === 'waiting' && seconds
          ? (seconds > 99 ? `${Math.ceil(seconds / 60)}m` : String(seconds)) : '';
        badge.hidden = !badge.textContent;
      }
    }
    const popover = document.querySelector('[data-chatgpt-pro-auto-popover]');
    if (!popover) return;
    const status = popover.querySelector('[data-auto-status]');
    const count = popover.querySelector('[data-auto-count]');
    const start = popover.querySelector('[data-auto-start]');
    const pause = popover.querySelector('[data-auto-pause]');
    const textInput = popover.querySelector('[data-auto-text]');
    popover.querySelectorAll('[data-auto-i18n]').forEach(element => {
      element.textContent = window.ChatGPTProI18n.t(element.dataset.autoI18n);
    });
    if (textInput) textInput.placeholder = window.ChatGPTProI18n.t('ui.enterContinuationMessage');
    if (status) status.textContent = autoContinueStatusText();
    if (count) count.textContent = window.ChatGPTProI18n.format('ui.sentCount', {
      count: S.autoContinue.sentCount, max: S.settings.autoContinueMaxCount
    });
    if (start) start.textContent = S.autoContinue.mode === 'paused'
      ? window.ChatGPTProI18n.t('ui.resume') : window.ChatGPTProI18n.t('ui.startCurrentChat');
    if (start) start.hidden = S.autoContinue.mode === 'waiting';
    if (start) start.disabled = !String(textInput?.value || '').trim();
    if (pause) pause.hidden = S.autoContinue.mode !== 'waiting';
    if (pause) pause.textContent = window.ChatGPTProI18n.t('ui.pause');
    const stop = popover.querySelector('[data-auto-stop]');
    if (stop) stop.textContent = window.ChatGPTProI18n.t('ui.stop');
  }

  function writeComposerText(text) {
    const composer = window.ChatGPTDomAdapter.composer();
    if (!composer) throw new Error('ui.composerNotFound');
    if ('value' in composer) {
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(composer), 'value')?.set;
      if (setter) setter.call(composer, text);
      else composer.value = text;
      composer.dispatchEvent(new InputEvent('input', {
        bubbles: true, inputType: 'insertText', data: text
      }));
    } else {
      composer.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(composer);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand(text ? 'insertText' : 'delete', false, text);
      selection.removeAllRanges();
    }
  }

  async function sendAutoContinueMessage(continueTask = true) {
    if (!String(S.settings.autoContinueText || '').trim()) throw new Error('ui.enterContinuationMessage');
    if (window.ChatGPTDomAdapter.isGenerating()) throw new Error('ui.waitingForCurrentReply');
    const existingText = window.ChatGPTDomAdapter.composerText();
    if (existingText && existingText !== S.settings.autoContinueText) throw new Error('ui.composerHasContent');
    if (!existingText) writeComposerText(S.settings.autoContinueText);
    let button = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      await new Promise(resolve => window.setTimeout(resolve, 100));
      if (window.ChatGPTDomAdapter.isGenerating()) break;
      const candidate = window.ChatGPTDomAdapter.sendButton();
      if (candidate && !candidate.disabled) {
        button = candidate;
        break;
      }
    }
    if (!button) {
      if (window.ChatGPTDomAdapter.composerText() === S.settings.autoContinueText) writeComposerText('');
      throw new Error(window.ChatGPTDomAdapter.isGenerating()
        ? 'ui.waitingForCurrentReply' : 'ui.sendButtonUnavailable');
    }
    button.click();
    S.autoContinue.sentCount++;
    S.autoContinue.mode = continueTask ? 'waiting' : 'idle';
    S.autoContinue.deadline = continueTask
      ? Date.now() + S.settings.autoContinueDelaySeconds * 1000 : 0;
    S.autoContinue.sentAt = Date.now();
    S.autoContinue.assistantText = window.ChatGPTDomAdapter.lastAssistantText();
    S.autoContinue.reason = '';
    persistAutoContinueTask();
    renderAutoContinueUi();
  }

  async function startAutoContinue() {
    if (!String(S.settings.autoContinueText || '').trim()) {
      throw new Error('ui.enterContinuationMessage');
    }
    const id = currentConversationId();
    if (!id) throw new Error('ui.openChatFirst');
    const resumePrevious = S.autoContinue.mode === 'paused'
      && S.autoContinue.conversationId === id
      && S.autoContinue.reason !== 'ui.reachedContinuationLimit'
      && S.autoContinue.sentCount < S.settings.autoContinueMaxCount;
    S.autoContinue.conversationId = id;
    S.autoContinue.reason = '';
    if (!resumePrevious) S.autoContinue.sentCount = 0;
    S.autoContinue.assistantText = window.ChatGPTDomAdapter.lastAssistantText();
    S.autoContinue.mode = 'waiting';
    S.autoContinue.deadline = 0;
    await pollAutoContinue();
    renderAutoContinueUi();
  }

  function pauseAutoContinue(reason = '') {
    if (S.autoContinue.mode === 'idle') return;
    S.autoContinue.mode = 'paused';
    S.autoContinue.reason = reason;
    S.autoContinue.deadline = 0;
    persistAutoContinueTask();
    renderAutoContinueUi();
  }

  function stopAutoContinue() {
    Object.assign(S.autoContinue, {
      mode: 'idle', conversationId: null, sentCount: 0, deadline: 0,
      sentAt: 0, checking: false, assistantText: '', reason: ''
    });
    chrome.storage.local.remove(AUTO_CONTINUE_TASK_STATE_KEY);
    renderAutoContinueUi();
  }

  async function pollAutoContinue() {
    const task = S.autoContinue;
    if (task.checking || task.mode !== 'waiting') return;
    task.checking = true;
    try {
      await sendAutoContinueMessage(true);
    } catch (error) {
      if (['ui.waitingForCurrentReply', 'ui.sendButtonUnavailable'].includes(error.message)) {
        task.mode = 'waiting';
        task.deadline = Date.now() + S.settings.autoContinueDelaySeconds * 1000;
        task.reason = '';
      } else {
        pauseAutoContinue(error.message);
      }
    } finally {
      task.checking = false;
      renderAutoContinueUi();
    }
  }

  function tickAutoContinue() {
    const task = S.autoContinue;
    if (!S.settings.autoContinueEnabled || task.mode === 'idle' || task.mode === 'paused') {
      renderAutoContinueUi();
      return;
    }
    if (currentConversationId() !== task.conversationId) {
      pauseAutoContinue('ui.switchedChat');
      return;
    }
    if (task.sentCount >= S.settings.autoContinueMaxCount) {
      pauseAutoContinue('ui.reachedContinuationLimit');
      return;
    }
    if (task.mode === 'waiting' && Date.now() >= task.deadline) pollAutoContinue();
    renderAutoContinueUi();
  }

  function ensureAutoContinuePopover() {
    const dock = ensureCurrentChatToolDock();
    let popover = dock.querySelector('[data-chatgpt-pro-auto-popover]');
    if (popover) return popover;
    popover = document.createElement('div');
    popover.className = 'chatgpt-pro-tool-popover chatgpt-pro-auto-popover';
    popover.setAttribute('data-chatgpt-pro-auto-popover', '1');
    popover.hidden = true;
    const t = key => window.ChatGPTProI18n.t(key);
    popover.innerHTML = `
      <strong data-auto-i18n="ui.autoContinue">${t('ui.autoContinue')}</strong>
      <div class="chatgpt-pro-auto-status" data-auto-status></div>
      <div class="chatgpt-pro-auto-count" data-auto-count></div>
      <label class="chatgpt-pro-auto-field">
        <span data-auto-i18n="ui.continuationMessage">${t('ui.continuationMessage')}</span>
        <input type="text" data-auto-text required placeholder="${t('ui.enterContinuationMessage')}">
        <small data-auto-i18n="ui.continuationMessageHelp">${t('ui.continuationMessageHelp')}</small>
      </label>
      <label class="chatgpt-pro-auto-field">
        <span data-auto-i18n="ui.pollingInterval">${t('ui.pollingInterval')}</span>
        <input type="number" min="1" max="86400" data-auto-delay>
        <small data-auto-i18n="ui.pollingIntervalHelp">${t('ui.pollingIntervalHelp')}</small>
      </label>
      <label class="chatgpt-pro-auto-field">
        <span data-auto-i18n="ui.maximumContinuations">${t('ui.maximumContinuations')}</span>
        <input type="number" min="1" max="999" data-auto-max>
        <small data-auto-i18n="ui.maximumContinuationsHelp">${t('ui.maximumContinuationsHelp')}</small>
      </label>
      <div class="chatgpt-pro-auto-actions">
        <button type="button" data-auto-start>${t('ui.startCurrentChat')}</button>
        <button type="button" data-auto-pause hidden>${t('ui.pause')}</button>
        <button type="button" data-auto-stop>${t('ui.stop')}</button>
      </div>`;
    const textInput = popover.querySelector('[data-auto-text]');
    const delayInput = popover.querySelector('[data-auto-delay]');
    const maxInput = popover.querySelector('[data-auto-max]');
    const startButton = popover.querySelector('[data-auto-start]');
    textInput.value = S.settings.autoContinueText;
    delayInput.value = S.settings.autoContinueDelaySeconds;
    maxInput.value = S.settings.autoContinueMaxCount;
    const saveSettings = () => {
      S.settings.autoContinueText = textInput.value.trim();
      S.settings.autoContinueDelaySeconds = Math.max(1, Math.min(86400, Number(delayInput.value) || 120));
      S.settings.autoContinueMaxCount = Math.max(1, Math.min(999, Number(maxInput.value) || 20));
      textInput.value = S.settings.autoContinueText;
      delayInput.value = S.settings.autoContinueDelaySeconds;
      maxInput.value = S.settings.autoContinueMaxCount;
      chrome.storage.local.set({
        autoContinueText: S.settings.autoContinueText,
        autoContinueDelaySeconds: S.settings.autoContinueDelaySeconds,
        autoContinueMaxCount: S.settings.autoContinueMaxCount
      });
      renderAutoContinueUi();
    };
    [textInput, delayInput, maxInput].forEach(input => input.addEventListener('change', saveSettings));
    textInput.addEventListener('input', () => {
      startButton.disabled = !textInput.value.trim();
    });
    startButton.addEventListener('click', async () => {
      saveSettings();
      try { await startAutoContinue(); }
      catch (error) {
        if (error.message === 'ui.enterContinuationMessage') {
          const status = popover.querySelector('[data-auto-status]');
          if (status) status.textContent = t(error.message);
          textInput.focus();
          return;
        }
        pauseAutoContinue(error.message);
      }
    });
    popover.querySelector('[data-auto-pause]').addEventListener('click', () => pauseAutoContinue());
    popover.querySelector('[data-auto-stop]').addEventListener('click', stopAutoContinue);
    dock.appendChild(popover);
    renderAutoContinueUi();
    return popover;
  }

  function ensureAutoContinueButton() {
    const actions = ensureCurrentChatToolActions();
    let button = actions.querySelector('[data-chatgpt-pro-auto-continue]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'chatgpt-pro-current-export chatgpt-pro-auto-continue';
      button.setAttribute('data-chatgpt-pro-auto-continue', '1');
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg><span class="chatgpt-pro-auto-badge" hidden></span>';
      button.addEventListener('click', () => {
        const popover = ensureAutoContinuePopover();
        const willOpen = popover.hidden;
        closeToolPopovers(popover);
        popover.hidden = !willOpen;
        renderAutoContinueUi();
      });
      actions.appendChild(button);
    }
    renderAutoContinueUi();
    return button;
  }

  function removeFloatingButton() {
    closeTimeline();
    S.launcher?.remove();
    S.launcher = null;
    document.querySelector('[data-chatgpt-pro-tool-dock]')?.remove();
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

  function projectFilterOptionLabel(type, name, nameKey = '') {
    const i18n = window.ChatGPTProI18n;
    const displayName = nameKey ? i18n?.t(nameKey) || name : name;
    const prefix = type === 'gpt' ? 'GPT' : i18n?.t('ui.project') || '项目';
    return `${prefix} · ${displayName}`;
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
          nameKey: !rec.projectName && type !== 'gpt' ? 'ui.unnamedProject' : '',
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
        option.dataset.projectType = source.type;
        option.dataset.projectName = source.name;
        if (source.nameKey) option.dataset.projectNameKey = source.nameKey;
        option.textContent = projectFilterOptionLabel(source.type, source.name, source.nameKey);
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
      const onlyLocal = rec.remoteState === 'local-only';
      const row = document.createElement(onlyLocal ? 'div' : 'a');
      row.className = 'chatgpt-pro-row';
      if (!onlyLocal) row.href = rec.href || `/c/${rec.id}`;
      if (!onlyLocal) row.addEventListener('click', event => {
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
      if (onlyLocal || rec.remoteState === 'unverified') {
        const statusLabel = document.createElement('span');
        statusLabel.className = 'chatgpt-pro-row-status';
        statusLabel.textContent = onlyLocal ? '仅本地' : '待核实';
        title.appendChild(statusLabel);
        title.appendChild(document.createTextNode(' · '));
      }
      const titleText = document.createElement('span');
      titleText.className = 'chatgpt-pro-row-title-text';
      titleText.textContent = rec.title;
      title.appendChild(titleText);
      if (onlyLocal) row.title = '官方明确删除标记，原始数据和导出保留在本地';

      const project = document.createElement('span');
      project.className = 'chatgpt-pro-row-project';
      if (rec.projectId && !rec.projectName && conversationSourceType(rec) !== 'gpt') {
        project.dataset.fallbackNameKey = 'ui.unnamedProject';
        project.textContent = window.ChatGPTProI18n?.t('ui.unnamedProject') || '未命名项目';
      } else {
        project.textContent = conversationSourceName(rec);
      }

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
      if (onlyLocal) exportCell.append(createExportButton('清理', '清理此条仅本地对话的本地数据',
        async rec => clearLocalOnlyRecord(rec.id)));

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

  const SEARCH_INDEX_SCHEMA_VERSION = 2;

  function isUserVisibleMessage(message) {
    if (!message?.id || !['user', 'assistant'].includes(message?.author?.role)) return false;
    if (message.metadata?.is_visually_hidden_from_conversation) return false;
    if (message.recipient && message.recipient !== 'all') return false;
    if (message.channel && !['final', 'commentary'].includes(message.channel)) return false;
    const contentType = message.content?.content_type;
    return !contentType || ['text', 'multimodal_text'].includes(contentType);
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

  function filenameDate(value, withTime = false) {
    const ms = timestampValue(value);
    if (!ms) return '';
    const d = new Date(ms);
    const pad = n => String(n).padStart(2, '0');
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return withTime ? `${date}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}` : date;
  }

  function filenameSource(rec) {
    return conversationSourceType(rec) === 'regular' ? '普通聊天' : conversationSourceName(rec);
  }

  function exportBaseFilename(rec, data) {
    const created = rec?.createTime ?? data?.create_time ?? data?.created_at;
    const updated = rec?.updateTime ?? data?.update_time ?? data?.updated_at;
    const values = {
      title: data?.title || rec?.title || 'ChatGPT 聊天记录',
      created_date: filenameDate(created),
      updated_date: filenameDate(updated),
      created_datetime: filenameDate(created, true),
      updated_datetime: filenameDate(updated, true),
      source: filenameSource(rec || {}),
      conversation_id: rec?.id || data?.id || data?.conversation_id || ''
    };
    const template = String(S.settings.exportFilenameTemplate || '{created_datetime}_{title}');
    const rendered = template.replace(/\{(title|created_date|updated_date|created_datetime|updated_datetime|source|conversation_id)\}/g, (_, key) => values[key] || '');
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

  function collectConversationImages(data) {
    const seen = new Set();
    const images = [];
    const messages = currentBranchMessages(data);
    messages.forEach((message, messageIndex) => {
      const role = message?.author?.role || 'other';
      const candidates = [];
      for (const part of (Array.isArray(message?.content?.parts) ? message.content.parts : [])) {
        if (part?.content_type === 'image_asset_pointer' && part.asset_pointer) {
          candidates.push({ pointer: part.asset_pointer, name: part.file_name, mime: part.mime_type });
        }
      }
      for (const attachment of (Array.isArray(message?.metadata?.attachments) ? message.metadata.attachments : [])) {
        if (String(attachment.mime_type || '').startsWith('image/')) {
          candidates.push({ pointer: attachment.id || attachment.asset_pointer,
            name: attachment.name, mime: attachment.mime_type });
        }
      }
      for (const candidate of candidates) {
        const pointer = String(candidate.pointer || '');
        const fileId = pointer.split('://').pop();
        if (!fileId || !/^[A-Za-z0-9_.-]+$/.test(fileId) || seen.has(fileId)) continue;
        seen.add(fileId);
        images.push({ fileId, role, messageIndex: messageIndex + 1,
          messageId: message.id || '', name: candidate.name || '', mime: candidate.mime || '' });
      }
    });
    return images;
  }

  function imageExtension(type, name) {
    const mime = String(type || '').toLowerCase();
    if (mime.includes('png')) return 'png';
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
    if (mime.includes('webp')) return 'webp';
    if (mime.includes('gif')) return 'gif';
    if (mime.includes('svg')) return 'svg';
    const ext = String(name || '').match(/\.(png|jpe?g|webp|gif|svg)$/i)?.[1];
    return ext?.toLowerCase().replace('jpeg', 'jpg') || 'png';
  }

  async function exportConversationImages(rec, progress = () => {}) {
    const accountId = await window.APIHandler.getAccountId(true);
    const data = await window.APIHandler.getConversation(rec.id);
    const images = collectConversationImages(data);
    if (!images.length) throw new Error('当前对话分支没有可识别的图片资源');
    const manifest = [];
    const parts = [];
    let files = [];
    let size = 0;
    const flush = () => {
      if (files.length) { parts.push(files); files = []; size = 0; }
    };
    for (const [index, item] of images.entries()) {
      progress(`正在下载图片 ${index + 1} / ${images.length}`);
      const entry = { index: index + 1, message_index: item.messageIndex,
        message_id: item.messageId, role: item.role, file_id: item.fileId };
      try {
        if (await window.APIHandler.getAccountId(true) !== accountId) throw new Error('账号已切换');
        const info = await window.APIHandler.getConversationImageUrl(rec.id, item.fileId, accountId);
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 25000);
        let response;
        try {
          const url = new URL(info.download_url);
          response = await fetch(url.href, { credentials: url.origin === location.origin ? 'include' : 'omit', signal: controller.signal });
        } finally { window.clearTimeout(timer); }
        if (!response.ok) throw new Error(`图片下载 HTTP ${response.status}`);
        const mime = response.headers.get('Content-Type') || info.mime_type || item.mime;
        if (!String(mime).toLowerCase().startsWith('image/') &&
            !String(mime).toLowerCase().includes('octet-stream')) throw new Error('返回内容不是图片');
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (!bytes.length) throw new Error('图片内容为空');
        if (bytes.length > 80 * 1024 * 1024) throw new Error('单张图片超过 80 MiB 下载上限');
        const ext = imageExtension(mime === 'application/octet-stream' ? item.mime : mime, item.name);
        const filename = `images/${String(index + 1).padStart(3, '0')}_${item.role}_${item.messageIndex}.${ext}`;
        if (files.length && size + bytes.length > 60 * 1024 * 1024) flush();
        files.push({ name: filename, data: bytes });
        size += bytes.length;
        entry.status = 'success';
        entry.filename = filename;
        entry.bytes = bytes.length;
      } catch (error) {
        if (/账号已切换|登录账号已切换/.test(error.message)) throw error;
        entry.status = 'failed';
        entry.reason = error.message;
      }
      manifest.push(entry);
      await sleep(180);
    }
    flush();
    const failures = manifest.filter(item => item.status === 'failed');
    const base = exportBaseFilename(rec, data);
    const exportedAt = new Date().toISOString();
    const description = JSON.stringify({ conversation: conversationUrl(rec, data),
      exported_at: exportedAt, scope: 'current_branch', total: images.length, images: manifest }, null, 2);
    // Create an error-only ZIP too, so unavailable signed URLs are not silent.
    if (!parts.length) parts.push([]);
    for (let index = 0; index < parts.length; index++) {
      progress(`正在保存图片 ZIP ${index + 1} / ${parts.length}`);
      const name = `${base}_images${parts.length > 1 ? `_part-${index + 1}` : ''}.zip`;
      const content = [...parts[index], { name: 'manifest.json', text: description }];
      if (failures.length) content.push({ name: 'download-errors.txt',
        text: failures.map(item => `${item.file_id}: ${item.reason}`).join('\n') });
      downloadBlobFile(name, buildStoredZip(content));
    }
    return { total: images.length, success: images.length - failures.length, failures: failures.length, volumes: parts.length };
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

  async function fetchConversationForExport(rec, progress, onProgress, options = {}) {
    for (let retry = 0; retry <= EXPORT_MAX_RETRIES; retry++) {
      try {
        onProgress?.({ ...progress, phase: retry ? 'retrying' : 'fetching', retry });
        return await window.APIHandler.getConversation(rec.id, { withSource: true });
      } catch (error) {
        const status = Number(error?.status || 0);
        const permanentClientError = status >= 400 && status < 500
          && ![408, 425, 429].includes(status);
        const permanentLocalError = /登录账号已切换|仅本地对话没有可导出的完整原始 JSON/.test(
          String(error?.message || '')
        );
        if (error?.code === 'E_API_RESPONSE_INVALID_JSON' || permanentClientError || permanentLocalError) {
          throw error;
        }
        if (status === 429 && options.pauseOnRateLimit === true) throw error;
        if (retry >= EXPORT_MAX_RETRIES) throw error;
        const rateLimited = status === 429;
        let waitMs = EXPORT_RETRY_DELAYS_MS[Math.min(retry, EXPORT_RETRY_DELAYS_MS.length - 1)];
        if (rateLimited) {
          try {
            const accountId = await window.APIHandler.getAccountId();
            const detailStatus = await runtimeMessage({ action: 'detailStatus', accountId });
            const cooldownUntil = Number(detailStatus.result?.cooldownUntil || 0);
            const cooldownRemaining = cooldownUntil - Date.now();
            const providedRetryAfter = Number(error.retryAfterMs || 0);
            waitMs = Math.max(Number.isFinite(cooldownRemaining) ? cooldownRemaining : 0,
              Number.isFinite(providedRetryAfter) && providedRetryAfter > 0 ? providedRetryAfter : 0);
          } catch (_) {
            waitMs = 0;
          }
          if (!Number.isFinite(waitMs) || waitMs <= 0) waitMs = EXPORT_RATE_LIMIT_DEFAULT_MS;
        }
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

  async function clearLocalOnlyRecord(conversationId) {
    const confirmed = window.confirm(window.ChatGPTProI18n.t('ui.permanentlyRemoveLocalJSONSearchIndexAndDirectory'));
    if (!confirmed) return { canceled: true };
    const accountId = await window.APIHandler.getAccountId(true);
    const result = await runtimeMessage({ action: 'localDataClearLocalOnly', accountId, id: conversationId });
    if (result.result?.cleared) await openTimeline();
    return result.result;
  }

  async function uploadTaskZipVolume(session, volume, filename, blob, toIndex, entries) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const chunkSize = 256 * 1024;
    let count = 0;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      const chunk = bytes.subarray(offset, offset + chunkSize);
      let binary = '';
      for (let index = 0; index < chunk.length; index += 32768) {
        binary += String.fromCharCode(...chunk.subarray(index, index + 32768));
      }
      await runtimeMessage({
        action: 'taskVolumeChunk', accountId: session.accountId,
        id: session.taskId, owner: session.owner, token: session.token,
        volume, index: count, base64: btoa(binary)
      });
      count++;
    }
    await runtimeMessage({
      action: 'taskVolumeFinish', accountId: session.accountId,
      id: session.taskId, owner: session.owner, token: session.token,
      payload: { volume, filename, toIndex, entries, chunkCount: count }
    });
  }

  async function downloadTaskZipVolume(accountId, taskId, volume) {
    const info = (await runtimeMessage({ action: 'taskVolumeGet', accountId, id: taskId, volume })).result;
    if (!info) throw new Error('找不到已保存的 ZIP 分卷');
    const parts = [];
    for (let offset = 0; offset < info.size; offset += 256 * 1024) {
      const reply = (await runtimeMessage({
        action: 'taskVolumeRead', accountId, id: taskId, volume, offset, size: 256 * 1024
      })).result;
      const decoded = atob(reply.base64);
      const bytes = new Uint8Array(decoded.length);
      for (let index = 0; index < decoded.length; index++) bytes[index] = decoded.charCodeAt(index);
      parts.push(bytes);
    }
    downloadBlobFile(info.filename, new Blob(parts, { type: 'application/zip' }));
    return info.filename;
  }

  async function exportConversationBatch(records, format, onProgress, session = null) {
    if (!records.length) throw new Error('没有可导出的聊天');
    const encoder = new TextEncoder();
    const manifestEntries = [...(session?.task.exportEntries || [])];
    const failures = manifestEntries.filter(entry => entry.status === 'failed');
    const used = new Set(['manifest.json', '导出失败.txt',
      ...manifestEntries.map(entry => entry.filename).filter(Boolean)]);
    let volumeFiles = [];
    let volumeEntries = [];
    let volumeBytes = 0;
    let volumeNumber = (session?.task.volumeCount || 0) + 1;
    let volumeStartIndex = session?.task.nextIndex || 0;
    let startedVolumes = session?.task.volumeCount || 0;
    let successCount = session?.task.successCount || 0;
    let consecutiveFailures = session?.task.consecutiveFailures || 0;
    const now = new Date(session?.task.createdAt || Date.now());
    const startedAt = now.toISOString();
    const pad = n => String(n).padStart(2, '0');
    const prefix = `ChatGPT-Pro_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}_${format.toUpperCase()}`;

    const flushVolume = async (isFinal = false, endIndex = records.length) => {
      if (!volumeEntries.length) return;
      const displayedEntries = isFinal ? manifestEntries : volumeEntries;
      const manifest = {
        schema_version: 1,
        format,
        started_at: startedAt,
        volume: volumeNumber,
        scope: isFinal ? 'complete' : 'volume',
        total_requested: records.length,
        processed: manifestEntries.length,
        success_count: manifestEntries.filter(entry => entry.status === 'success').length,
        failure_count: manifestEntries.filter(entry => entry.status === 'failed').length,
        // Final volume gives the full cross-volume file map. Earlier volumes
        // are self-describing and usable independently if a task is interrupted.
        conversations: displayedEntries
      };
      const entries = [...volumeFiles, {
        name: 'manifest.json', data: encoder.encode(`${JSON.stringify(manifest, null, 2)}\n`)
      }];
      const errors = isFinal ? failures : volumeEntries.filter(entry => entry.status === 'failed');
      if (errors.length) {
        entries.push({
          name: '导出失败.txt',
          data: encoder.encode(errors.map(entry => `${entry.title} (${entry.id})：${entry.error}`).join('\n') + '\n')
        });
      }
      const filename = `${prefix}_part${String(volumeNumber).padStart(3, '0')}.zip`;
      const zipBlob = buildStoredZip(entries);
      if (session) {
        await runtimeMessage({ action: 'taskPhase', accountId: session.accountId,
          id: session.taskId, owner: session.owner, token: session.token, phase: 'volume' });
        // Never move the durable task cursor before the exact ZIP bytes are
        // stored successfully. Chrome may block the subsequent download.
        await uploadTaskZipVolume(session, volumeNumber, filename, zipBlob, endIndex, volumeEntries);
      }
      if (!session?.automatic) downloadBlobFile(filename, zipBlob);
      startedVolumes++;
      onProgress?.({ phase: 'volume-ready', volume: volumeNumber,
        downloadInitiated: !session?.automatic, done: manifestEntries.length,
        total: records.length, successes: successCount, failures: failures.length });
      volumeNumber++;
      volumeStartIndex = endIndex;
      volumeFiles = [];
      volumeEntries = [];
      volumeBytes = 0;
    };

    const totalGroups = Math.ceil(records.length / EXPORT_GROUP_SIZE);
    for (let index = volumeStartIndex; index < records.length; index++) {
      if (volumeEntries.length >= EXPORT_VOLUME_MAX_FILES) await flushVolume(false, index);
      const rec = records[index];
      const progress = {
        done: index,
        total: records.length,
        group: Math.floor(index / EXPORT_GROUP_SIZE) + 1,
        totalGroups,
        title: rec.title || rec.id
      };
      let usedNetwork = false;
      let fetched = false;
      let prepared = null;
      if (session) {
        await runtimeMessage({ action: 'taskHeartbeat', accountId: session.accountId,
          id: session.taskId, owner: session.owner, token: session.token });
        await runtimeMessage({ action: 'taskPhase', accountId: session.accountId,
          id: session.taskId, owner: session.owner, token: session.token, phase: 'fetching' });
        if (await window.APIHandler.getAccountId() !== session.accountId) {
          throw new Error('登录账号已切换，导出任务已停止');
        }
      }
      try {
        const { data, source } = await fetchConversationForExport(rec, progress, onProgress);
        fetched = true;
        usedNetwork = source === 'network';
        const base = exportBaseFilename(rec, data);
        const filename = uniqueFilename(`${base}.${format === 'json' ? 'json' : 'md'}`, used);
        const body = format === 'json' ? buildConversationJson(data, rec) : buildConversationMarkdown(data, rec);
        const bytes = encoder.encode(body);
        prepared = { bytes, filename, title: rec.title || data?.title || '' };
      } catch (error) {
        if (session && (/任务租约|登录账号已切换/.test(error.message))) throw error;
        if (session && (error.status === 401 || error.status === 403)) {
          await runtimeMessage({ action: 'taskControl', accountId: session.accountId,
            id: session.taskId, operation: 'pause', reason: 'auth-error' });
          throw new Error('登录/权限异常，导出任务已暂停；本地分卷与检查点仍保留');
        }
        const entry = { id: rec.id, title: rec.title || rec.id, status: 'failed',
          filename: null, volume: volumeNumber, error: error.message || String(error) };
        failures.push(entry);
        volumeEntries.push(entry);
        manifestEntries.push(entry);
        consecutiveFailures++;
        if (!fetched) usedNetwork = true;
      }
      if (prepared) {
        consecutiveFailures = 0;
        if (volumeEntries.length && volumeBytes + prepared.bytes.byteLength > EXPORT_VOLUME_MAX_BYTES) {
          // Save errors must abort this task, never turn a successfully
          // converted conversation into an unrelated item failure.
          await flushVolume(false, index);
        }
        volumeFiles.push({ name: prepared.filename, data: prepared.bytes });
        volumeBytes += prepared.bytes.byteLength;
        const entry = { id: rec.id, title: prepared.title, status: 'success',
          filename: prepared.filename, volume: volumeNumber, bytes: prepared.bytes.byteLength };
        volumeEntries.push(entry);
        manifestEntries.push(entry);
        successCount++;
      }
      onProgress?.({ ...progress, phase: 'completed', done: index + 1, failures: failures.length });

      if (session && consecutiveFailures >= 3 && index < records.length - 1) {
        // Persist the partial volume/checkpoint before pausing. Otherwise a
        // browser restart would lose its progress and saved failed entries.
        await flushVolume(false, index + 1);
        await runtimeMessage({ action: 'taskControl', accountId: session.accountId,
          id: session.taskId, operation: 'pause' });
        onProgress?.({ ...progress, phase: 'paused', reason: 'consecutive-failures' });
        throw new Error('连续 3 条处理失败，导出任务已暂停；可检查日志后手动继续');
      }

      const isLast = index === records.length - 1;
      const isGroupEnd = (index + 1) % EXPORT_GROUP_SIZE === 0;
      if (!isLast && usedNetwork && isGroupEnd) {
        if (session) await runtimeMessage({ action: 'taskPhase', accountId: session.accountId,
          id: session.taskId, owner: session.owner, token: session.token,
          phase: 'waiting', waitUntil: Date.now() + EXPORT_GROUP_GAP_MS });
        await waitForExport(EXPORT_GROUP_GAP_MS, onProgress, {
          ...progress, phase: 'group-wait', done: index + 1, failures: failures.length
        });
      } else if (!isLast && usedNetwork) {
        if (session) await runtimeMessage({ action: 'taskPhase', accountId: session.accountId,
          id: session.taskId, owner: session.owner, token: session.token,
          phase: 'waiting', waitUntil: Date.now() + EXPORT_REQUEST_GAP_MS });
        await waitForExport(EXPORT_REQUEST_GAP_MS, onProgress, {
          ...progress, phase: 'pacing', done: index + 1, failures: failures.length
        });
      }
    }
    await flushVolume(true, records.length);
    return { successCount, failureCount: failures.length, volumeCount: startedVolumes };
  }

  const EXPORT_EXECUTOR_ID = crypto.randomUUID();
  const exportRunners = new Set();

  async function runExportTask(accountId, taskId, onProgress, automatic = false) {
    if (exportRunners.has(taskId)) return { busy: true };
    exportRunners.add(taskId);
    let heartbeat;
    try {
      const response = await runtimeMessage({ action: 'taskClaim', accountId,
        id: taskId, owner: EXPORT_EXECUTOR_ID });
      const claim = response.result;
      if (!claim.acquired) return { busy: true, busyReason: claim.reason || 'task-busy' };
      const { task, token } = claim;
      const format = task.type === 'export-json' ? 'json' : 'md';
      const session = { accountId, taskId, owner: EXPORT_EXECUTOR_ID, token, task, automatic };
      heartbeat = window.setInterval(() => {
        runtimeMessage({ action: 'taskHeartbeat', accountId,
          id: taskId, owner: EXPORT_EXECUTOR_ID, token }).catch(() => {});
      }, 10000);
      return exportConversationBatch(task.items, format, onProgress, session);
    } finally {
      if (heartbeat) window.clearInterval(heartbeat);
      exportRunners.delete(taskId);
    }
  }

  async function startExportTask(records, format, onProgress) {
    const accountId = await window.APIHandler.getAccountId();
    const response = await runtimeMessage({ action: 'taskCreate', accountId,
      type: format === 'json' ? 'export-json' : 'export-md', items: records });
    if (response.result.status === 'paused') return { paused: true };
    const result = await runExportTask(accountId, response.result.id, onProgress);
    return { ...result, taskId: response.result.id };
  }

  let recoveringExportTasks = false;
  async function recoverExportTasks() {
    if (recoveringExportTasks || !S.settings.enabled) return;
    recoveringExportTasks = true;
    try {
      const accountId = await window.APIHandler.getAccountId();
      const response = await runtimeMessage({ action: 'taskList', accountId });
      for (const task of response.result || []) {
        if (!task.type.startsWith('export-') || !['pending', 'running'].includes(task.status)) continue;
        if (task.status === 'running' && task.lease?.expiresAt > Date.now()) continue;
        // Auto-recovery prepares ZIPs but never initiates downloads without
        // an explicit user action. Saved volumes stay available locally.
        await runExportTask(accountId, task.id, null, true)
          .catch(error => log('Export recovery skipped:', error.message));
      }
    } finally {
      recoveringExportTasks = false;
    }
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
    if (!data || typeof data !== 'object' || !data.mapping ||
        typeof data.mapping !== 'object' || Array.isArray(data.mapping)) {
      const error = new Error('E_INDEX_RESPONSE_INVALID');
      error.code = 'E_INDEX_RESPONSE_INVALID';
      throw error;
    }
    const seen = new Set();
    const messages = currentBranchMessages(data)
      .filter(isUserVisibleMessage)
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
      schemaVersion: SEARCH_INDEX_SCHEMA_VERSION,
      // The directory can lag behind a detail response. Prefer the complete
      // JSON's own version so indexing never attempts to roll newer cached
      // data back to the older directory timestamp.
      updateTime: timestampValue(data?.update_time ?? data?.updated_at ?? rec.updateTime),
      messages
    };
  }

  const INDEX_EXECUTOR_ID = crypto.randomUUID();
  const indexRunners = new Set();

  async function indexTaskMessage(action, accountId, fields = {}) {
    const response = await runtimeMessage({ action, accountId, ...fields });
    return response.result;
  }

  async function runIndexTask(accountId, taskId, onProgress) {
    if (indexRunners.has(taskId)) return { busy: true };
    indexRunners.add(taskId);
    let heartbeat;
    try {
      const claim = await indexTaskMessage('taskClaim', accountId, { id: taskId, owner: INDEX_EXECUTOR_ID });
      if (!claim.acquired) {
        onProgress?.({ phase: 'running-elsewhere', busyReason: claim.reason });
        return { busy: true, busyReason: claim.reason || 'task-busy' };
      }
      const token = claim.token;
      const initial = claim.task;
      const total = initial.items.length;
      // Keep a lease alive during network cooldowns; the worker can restart
      // freely because all authoritative state is in IndexedDB.
      heartbeat = window.setInterval(() => {
        indexTaskMessage('taskHeartbeat', accountId, {
          id: taskId, owner: INDEX_EXECUTOR_ID, token
        }).catch(() => {});
      }, 10000);
      let latest = initial;
      for (let index = initial.nextIndex; index < total; index++) {
        const rec = initial.items[index];
        const progress = {
          done: index, total, title: rec.title || rec.id,
          group: Math.floor(index / EXPORT_GROUP_SIZE) + 1,
          totalGroups: Math.ceil(total / EXPORT_GROUP_SIZE)
        };
        // A pause or canceled lease aborts before any next request.
        await indexTaskMessage('taskHeartbeat', accountId, { id: taskId, owner: INDEX_EXECUTOR_ID, token });
        await indexTaskMessage('taskPhase', accountId, {
          id: taskId, owner: INDEX_EXECUTOR_ID, token, phase: 'fetching'
        });
        if (await window.APIHandler.getAccountId() !== accountId) throw new Error('登录账号已切换，索引任务已停止');
        let usedNetwork = false;
        let outcome = 'success';
        let errorText = '';
        try {
          const { data, source } = await fetchConversationForExport(rec, progress, onProgress,
            { pauseOnRateLimit: true });
          usedNetwork = source === 'network';
          await indexTaskMessage('taskHeartbeat', accountId, { id: taskId, owner: INDEX_EXECUTOR_ID, token });
          await runtimeMessage({
            action: 'localDataPutConversation', accountId,
            record: {
              id: rec.id, raw: data,
              updateTime: data?.update_time ?? data?.updated_at ?? rec.updateTime,
              searchRecord: buildSearchIndexRecord(data, rec)
            }
          });
        } catch (error) {
          if (/任务租约|登录账号已切换|E_TASK_LEASE_EXPIRED/.test(error.message)) throw error;
          if (error?.status === 401 || error?.status === 403) {
            await indexTaskMessage('taskControl', accountId, {
              id: taskId, operation: 'pause', reason: 'auth-error'
            });
            throw new Error('登录/权限异常，任务已暂停');
          }
          if (error?.status === 429) {
            let cooldownUntil = 0;
            try {
              const detailStatus = await runtimeMessage({ action: 'detailStatus', accountId });
              cooldownUntil = Number(detailStatus.result?.cooldownUntil || 0);
            } catch (_) {}
            if (!Number.isFinite(cooldownUntil)) cooldownUntil = 0;
            const providedRetryAfter = Number(error.retryAfterMs || 0);
            const retryDelay = Number.isFinite(providedRetryAfter) && providedRetryAfter > 0
              ? providedRetryAfter : EXPORT_RATE_LIMIT_DEFAULT_MS;
            const retryAt = Math.max(cooldownUntil, Date.now() + retryDelay);
            await indexTaskMessage('taskPhase', accountId, {
              id: taskId, owner: INDEX_EXECUTOR_ID, token, phase: 'rate-limit', waitUntil: retryAt
            });
            const paused = await indexTaskMessage('taskControl', accountId, {
              id: taskId, operation: 'pause', reason: 'rate-limit'
            });
            const pauseReason = ['rate-limit', 'rate-limit-exhausted'].includes(paused.task?.phase)
              ? paused.task.phase : paused.task?.phase || 'paused';
            onProgress?.({ ...progress, phase: 'paused', reason: pauseReason, retryAt });
            return { paused: true, pauseReason, retryAt,
              indexedCount: latest.successCount, failures: latest.errors };
          }
          outcome = 'failed';
          errorText = error.message || String(error);
          usedNetwork = true;
        }
        const checkpoint = await indexTaskMessage('taskCheckpoint', accountId, {
          id: taskId, owner: INDEX_EXECUTOR_ID, token, itemIndex: index, outcome, error: errorText
        });
        latest = checkpoint.task;
        onProgress?.({ ...progress, phase: 'completed', done: index + 1, failures: latest.failureCount });
        if (latest.status === 'paused' && latest.consecutiveFailures >= 3) {
          onProgress?.({ ...progress, phase: 'paused', reason: 'consecutive-failures' });
          return { paused: true, indexedCount: latest.successCount, failures: latest.errors };
        }
        const isLast = index === total - 1;
        const groupEnd = (index + 1) % EXPORT_GROUP_SIZE === 0;
        if (!isLast && usedNetwork) {
          const delay = groupEnd ? EXPORT_GROUP_GAP_MS : EXPORT_REQUEST_GAP_MS;
          await indexTaskMessage('taskPhase', accountId, {
            id: taskId, owner: INDEX_EXECUTOR_ID, token,
            phase: 'waiting', waitUntil: Date.now() + delay
          });
          await waitForExport(delay,
            onProgress, { ...progress, phase: groupEnd ? 'group-wait' : 'pacing', done: index + 1 });
        }
      }
      return {
        indexedCount: latest.successCount,
        skippedCount: latest.skippedCount || 0,
        failures: latest.errors.map(error => `${error.id}：${error.message}`)
      };
    } finally {
      if (heartbeat) window.clearInterval(heartbeat);
      indexRunners.delete(taskId);
    }
  }

  async function updateFullTextIndex(records, onProgress, options = {}) {
    const accountId = await window.APIHandler.getAccountId();
    const jobs = await indexTaskMessage('taskList', accountId);
    const existing = jobs.find(task => task.type === 'index' && ['pending', 'running', 'paused'].includes(task.status));
    if (existing?.status === 'paused') {
      const reason = existing.phase === 'consecutive-failures' ? 'consecutive-failures'
        : existing.phase === 'auth-error' ? 'auth-error'
          : existing.phase === 'rate-limit' ? 'rate-limit'
            : existing.phase === 'rate-limit-exhausted' ? 'rate-limit-exhausted' : 'manual';
      onProgress?.({ phase: 'paused', reason });
      return { paused: true, pauseReason: reason };
    }
    if (existing) return runIndexTask(accountId, existing.id, onProgress);

    const policy = await runtimeMessage({ action: 'indexPolicyGet', accountId });
    const skippedIds = new Set(policy.result?.skippedIndexIds || []);
    const metadata = await runtimeMessage({ action: 'searchIndexMetadata', accountId });
    const indexed = new Map((metadata.records || []).map(record => [record.id, record]));
    const skippedCount = records.filter(record => skippedIds.has(record.id)).length;
    const pending = records.filter(record => {
      if (skippedIds.has(record.id)) return false;
      const existing = indexed.get(record.id);
      return !existing || existing.schemaVersion !== SEARCH_INDEX_SCHEMA_VERSION
        || Number(existing.updateTime || 0) < timestampValue(record.updateTime);
    });
    if (!pending.length) return {
      indexedCount: 0, skippedCount,
      alreadyIndexedCount: records.length - skippedCount, failures: []
    };
    const task = await indexTaskMessage('taskCreate', accountId, {
      type: 'index', items: pending, options: { automatic: options.automatic === true }
    });
    if (task.status === 'paused') return { paused: true };
    const result = await runIndexTask(accountId, task.id, onProgress);
    return {
      ...result,
      skippedCount: skippedCount + Number(result.skippedCount || 0),
      alreadyIndexedCount: records.length - pending.length - skippedCount
    };
  }
  async function retryIndexConversation(record, onProgress) {
    if (!record?.id) throw new Error('E_INDEX_RETRY_RECORD_INVALID');
    const accountId = await window.APIHandler.getAccountId(true);
    const policy = await runtimeMessage({ action: 'indexPolicyGet', accountId });
    if (policy.result?.skippedIndexIds?.includes(record.id)) return { skipped: true };
    const metadata = await runtimeMessage({ action: 'searchIndexMetadata', accountId, ids: [record.id] });
    const existing = (metadata.records || []).find(item => item.id === record.id);
    if (existing && existing.schemaVersion === SEARCH_INDEX_SCHEMA_VERSION
        && Number(existing.updateTime || 0) >= timestampValue(record.updateTime)) {
      return { indexedCount: 0, skippedCount: 0, alreadyIndexedCount: 1,
        failures: [], alreadyIndexed: true };
    }
    // Unlike ordinary task creation, a per-item retry must never silently
    // attach itself to another active queue returned by the singleton guard.
    const task = await indexTaskMessage('taskCreate', accountId, {
      type: 'index', items: [record], options: { rejectIfActive: true }
    });
    if (task.items?.length !== 1 || task.items[0].id !== record.id) {
      throw new Error('E_INDEX_RETRY_TASK_MISMATCH');
    }
    return runIndexTask(accountId, task.id, onProgress);
  }

  async function updateIndexWithConsent(records, onProgress, consentConfirmedInPopup = false) {
    const accountId = await window.APIHandler.getAccountId(true);
    let policy = (await runtimeMessage({ action: 'indexPolicyGet', accountId })).result;
    if (!policy.consentAt) {
      const accepted = consentConfirmedInPopup || window.confirm(window.ChatGPTProI18n.t(
        'ui.theFirstIndexScansAllAccessibleChatsAnd'));
      if (!accepted) return { consentDeclined: true };
      policy = (await runtimeMessage({ action: 'indexPolicyConsent', accountId })).result;
    }
    let targetRecords = records;
    if (!policy.initialCompletedAt) {
      onProgress?.({ phase: 'initial-directory' });
      await runtimeMessage({ action: 'indexSetupPhase', accountId, phase: 'scanning' });
      try {
        targetRecords = await window.APIHandler.syncConversationList(true, { requireComplete: true });
        if (await window.APIHandler.getAccountId(true) !== accountId) {
          throw new Error('登录账号已切换，首次索引已停止');
        }
        await runtimeMessage({ action: 'indexPolicyDirectoryVerified', accountId, records: targetRecords });
      } finally {
        await runtimeMessage({ action: 'indexSetupPhase', accountId, phase: null }).catch(() => {});
      }
    }
    const result = await updateFullTextIndex(targetRecords, onProgress);
    if (!policy.initialCompletedAt && !result.paused && !result.busy) {
      const finished = (await runtimeMessage({ action: 'indexPolicyFinishInitial', accountId })).result;
      result.initialCompleted = finished.completed;
      result.initialRemaining = finished.remaining || 0;
    }
    return result;
  }

  const autoIndexLastCheckedByAccount = new Map();
  const AUTO_INDEX_MIN_CHECK_MS = 5 * 60 * 1000;
  async function maybeAutoIncrementalIndex(records, options = {}) {
    if (!S.settings.enabled || document.hidden || !records?.length) return { skipped: 'inactive' };
    const accountId = await window.APIHandler.getAccountId();
    if (!options.force && Date.now() - (autoIndexLastCheckedByAccount.get(accountId) || 0) < AUTO_INDEX_MIN_CHECK_MS) {
      return { skipped: 'recent' };
    }
    const policy = (await runtimeMessage({ action: 'indexPolicyGet', accountId })).result;
    if (!policy?.initialCompletedAt) return { skipped: 'initial-consent-or-index-incomplete' };
    if (policy.autoEnabled === false) return { skipped: 'auto-disabled' };
    autoIndexLastCheckedByAccount.set(accountId, Date.now());
    const result = await updateFullTextIndex(records, null, { automatic: true });
    return { ...result, automatic: true };
  }

  let recoveringIndexTasks = false;
  async function recoverIndexTasks() {
    if (recoveringIndexTasks || !S.settings.enabled) return;
    recoveringIndexTasks = true;
    try {
      const accountId = await window.APIHandler.getAccountId();
      const tasks = await indexTaskMessage('taskList', accountId);
      const hasRateLimitPause = tasks.some(task => task.type === 'index'
        && task.status === 'paused' && task.phase === 'rate-limit');
      const cooldownUntil = hasRateLimitPause
        ? Number((await runtimeMessage({ action: 'detailStatus', accountId })).result?.cooldownUntil || 0)
        : 0;
      for (const task of tasks) {
        if (task.type !== 'index') continue;
        if (task.status === 'paused' && task.phase === 'rate-limit') {
          const retryAt = Math.max(Number(task.waitUntil || 0), cooldownUntil);
          if (retryAt > Date.now()) continue;
          await indexTaskMessage('taskControl', accountId, {
            id: task.id, operation: 'resume', reason: 'auto-rate-limit'
          });
          await runIndexTask(accountId, task.id)
            .catch(error => log('Rate-limit recovery skipped:', error.message));
          continue;
        }
        if (!['running', 'pending'].includes(task.status)) continue;
        if (task.status === 'running' && task.lease?.expiresAt > Date.now()) continue;
        // The lease is acquired atomically. Another active tab wins safely.
        await runIndexTask(accountId, task.id).catch(error => log('Index recovery skipped:', error.message));
      }
    } finally {
      recoveringIndexTasks = false;
    }
  }

  // Popup is an extension page and cannot read the ChatGPT login session.
  // Its task controls must go through this authenticated content script.
  async function getTaskDashboard() {
    const accountId = await window.APIHandler.getAccountId();
    const [tasksResult, logsResult, cooldownResult, indexPolicyResult, statsResult] = await Promise.all([
      runtimeMessage({ action: 'taskList', accountId }),
      runtimeMessage({ action: 'logList', accountId, limit: 12 }),
      runtimeMessage({ action: 'detailStatus', accountId }),
      runtimeMessage({ action: 'indexPolicyGet', accountId }),
      runtimeMessage({ action: 'localDataStats', accountId })
    ]);
    const allTasks = tasksResult.result || [];
    const visibleTasks = allTasks.slice(0, 15);
    const failureIds = [];
    const seenFailureIds = new Set();
    for (const task of visibleTasks) {
      if (task.type !== 'index') continue;
      for (const error of task.errors || []) {
        if (error?.id && !seenFailureIds.has(error.id) && failureIds.length < 100) {
          seenFailureIds.add(error.id);
          failureIds.push(error.id);
        }
      }
    }
    const indexMetadataResult = failureIds.length
      ? await runtimeMessage({ action: 'searchIndexMetadata', accountId, ids: failureIds })
      : { records: [] };
    if (await window.APIHandler.getAccountId() !== accountId) {
      throw new Error('登录账号已切换，请重新打开任务管理');
    }
    const indexedById = new Map((indexMetadataResult.records || []).map(record => [record.id, record]));
    const skippedIds = new Set(indexPolicyResult.result?.skippedIndexIds || []);
    const latestFailureIds = new Set();
    const failuresByTask = new Map();
    for (const task of visibleTasks) {
      if (task.type !== 'index') continue;
      for (const error of task.errors || []) {
        const id = String(error?.id || '');
        if (!id || latestFailureIds.has(id)) continue;
        latestFailureIds.add(id);
        if (skippedIds.has(id)) continue;
        const item = (task.items || []).find(record => record.id === id);
        const indexed = indexedById.get(id);
        if (indexed && indexed.schemaVersion === SEARCH_INDEX_SCHEMA_VERSION
            && Number(indexed.updateTime || 0) >= timestampValue(item?.updateTime)) continue;
        if (!failuresByTask.has(task.id)) failuresByTask.set(task.id, []);
        failuresByTask.get(task.id).push({
          id, title: item?.title || id, message: String(error.message || '未知错误'),
          updateTime: item?.updateTime ?? null, href: item?.href || `/c/${id}`
        });
      }
    }
    return {
      tasks: visibleTasks.map(task => ({
        id: task.id, type: task.type, status: task.status,
        total: task.items?.length || 0, done: task.nextIndex || 0,
        successes: task.successCount || 0, failures: task.failureCount || 0,
        errors: failuresByTask.get(task.id) || [],
        skipped: task.skippedCount || 0,
        savedVolumes: task.volumesClearedAt ? 0 : (task.volumeCount || 0),
        phase: task.phase || null, waitUntil: task.waitUntil || 0,
        updatedAt: task.updatedAt, createdAt: task.createdAt,
        recoveryPending: task.status === 'running' && task.lease?.expiresAt <= Date.now()
      })),
      logs: (logsResult.result || []).map(log => ({
        id: log.id, type: log.type, code: log.code,
        createdAt: log.createdAt, message: log.message
      })),
      cooldownUntil: cooldownResult.result?.cooldownUntil || 0,
      indexPolicy: indexPolicyResult.result,
      stats: { directory: statsResult.directory, complete: statsResult.complete, indexed: statsResult.indexed }
    };
  }

  async function manageAccountLocalData(action, values = {}) {
    const accountId = await window.APIHandler.getAccountId(true);
    if (await window.APIHandler.getAccountId(true) !== accountId) {
      throw new Error('登录账号发生变化，请重试');
    }
    const response = await runtimeMessage({ action, accountId, ...values });
    return response.result;
  }

  let popupIndexRequest = null;
  async function beginIndexFromPopup(userConfirmedConsent) {
    if (!S.settings.enabled) throw new Error('请先启用扩展');
    const accountId = await window.APIHandler.getAccountId(true);
    const policy = (await runtimeMessage({ action: 'indexPolicyGet', accountId })).result;
    if (!policy?.consentAt && userConfirmedConsent !== true) {
      throw new Error('首次全文索引必须由用户明确授权');
    }
    if (popupIndexRequest) return { queued: true, alreadyStarting: true };
    // Finish quickly, without tying a long-running scan to Popup lifetime.
    // The actual run stays in this ChatGPT content script and later uses the
    // durable S3 queue/checkpoints. A canceled initial scan can be retried.
    popupIndexRequest = Promise.resolve().then(async () => {
      const records = policy.initialCompletedAt
        ? await window.APIHandler.syncConversationList(false, { checkLatest: true })
        : await window.APIHandler.getCachedConversationList();
      return updateIndexWithConsent(records, null, userConfirmedConsent === true);
    }).catch(async error => {
      log('Popup index setup failed:', error.message);
      await runtimeMessage({ action: 'indexSetupLog', accountId,
        message: `首次索引准备失败：${error.message}` }).catch(() => {});
    })
      .finally(() => { popupIndexRequest = null; });
    return { queued: true };
  }

  async function controlManagedTask(taskId, operation) {
    if (!['pause', 'resume', 'cancel'].includes(operation)) throw new Error('任务操作无效');
    const accountId = await window.APIHandler.getAccountId(true);
    const taskReply = await runtimeMessage({ action: 'taskGet', accountId, id: taskId });
    if (!taskReply.result) throw new Error('当前账号下找不到该任务');
    const reply = await runtimeMessage({ action: 'taskControl', accountId, id: taskId, operation });
    if (operation === 'resume' && reply.result.task?.status === 'pending') {
      // The popup may close immediately. Schedule recovery on the page rather
      // than depending on the popup lifetime or the MV3 worker staying awake.
      window.setTimeout(() => {
        const recover = taskReply.result.type === 'index' ? recoverIndexTasks : recoverExportTasks;
        recover().catch(error => log('Task resume failed:', error.message));
      }, 0);
    }
    return { status: reply.result.task.status, done: reply.result.task.nextIndex };
  }
  async function retryManagedIndexItem(taskId, conversationId) {
    const accountId = await window.APIHandler.getAccountId(true);
    const reply = await runtimeMessage({ action: 'taskGet', accountId, id: taskId });
    const task = reply.result;
    if (!task || task.type !== 'index' || !['completed', 'failed'].includes(task.status)) {
      throw new Error('E_INDEX_RETRY_TASK_NOT_FINISHED');
    }
    if (!(task.errors || []).some(error => error?.id === conversationId)) {
      throw new Error('E_INDEX_RETRY_FAILURE_NOT_FOUND');
    }
    const record = (task.items || []).find(item => item.id === conversationId);
    if (!record) throw new Error('E_INDEX_RETRY_RECORD_NOT_FOUND');
    return retryIndexConversation(record);
  }

  async function downloadManagedTaskVolumes(taskId) {
    const accountId = await window.APIHandler.getAccountId(true);
    const reply = await runtimeMessage({ action: 'taskGet', accountId, id: taskId });
    const task = reply.result;
    if (!task || !task.type.startsWith('export-') || !(task.volumeCount > 0)) {
      throw new Error('当前账号下没有此任务的已保存分卷');
    }
    let initiated = 0;
    for (let part = 1; part <= task.volumeCount; part++) {
      if (await window.APIHandler.getAccountId() !== accountId) throw new Error('下载期间账号发生变化');
      await downloadTaskZipVolume(accountId, taskId, part);
      initiated++;
    }
    return { initiated };
  }

  async function clearManagedTaskVolumes(taskId) {
    const accountId = await window.APIHandler.getAccountId(true);
    const reply = await runtimeMessage({ action: 'taskVolumeClear', accountId, id: taskId });
    return { deleted: reply.result.deleted };
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

  function findMinimapTargetById(messageId) {
    if (!messageId) return null;
    // messageElements() filters to currently rendered message units, while
    // messageIds() understands both legacy attributes and modern search IDs.
    return window.ChatGPTDomAdapter.messageElements().find(element =>
      element.isConnected && window.ChatGPTDomAdapter.messageIds(element).includes(messageId)
    ) || null;
  }

  function refreshMinimapEntryTargets(allEntries = S.minimap.allEntries) {
    if (!allEntries.length) return;
    const byId = new Map();
    for (const target of window.ChatGPTDomAdapter.messageElements()) {
      for (const id of window.ChatGPTDomAdapter.messageIds(target)) {
        if (!byId.has(id)) byId.set(id, target);
      }
    }
    for (const entry of allEntries) {
      const id = entry.startId || entry.id;
      if (!id) continue;
      if (entry.target?.isConnected && window.ChatGPTDomAdapter.messageIds(entry.target).includes(id)) continue;
      entry.target = byId.get(id) || null;
      entry.targets = entry.target ? [entry.target] : [];
    }
  }

  function conversationScrollContainer() {
    const firstMessage = window.ChatGPTDomAdapter.messageElements()[0];
    for (let element = firstMessage?.parentElement; element && element !== document.body; element = element.parentElement) {
      const style = getComputedStyle(element);
      if (/(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight) return element;
    }
    return document.scrollingElement;
  }

  async function jumpToSearchMessage(messageId, excerpt = '', block = 'center') {
    if (!messageId && !excerpt) return false;
    const jumpToken = ++activeSearchJumpToken;
    const minimapToken = ++S.minimap.jumpToken;
    const conversationId = currentConversationId();
    const isCurrentJump = () => jumpToken === activeSearchJumpToken
      && minimapToken === S.minimap.jumpToken
      && conversationId === currentConversationId();
    const resolveTarget = () => messageId
      ? window.ChatGPTDomAdapter.findMessage(messageId)
      : findSearchResultFallback(excerpt);
    const alignTarget = target => {
      if (!target?.isConnected || !isCurrentJump()) return false;
      target.scrollIntoView({ behavior: 'smooth', block });
      target.classList.add('chatgpt-pro-search-target');
      window.setTimeout(() => target.classList.remove('chatgpt-pro-search-target'), 2600);
      return true;
    };
    let target = resolveTarget();
    if (target) return alignTarget(target);

    // A full-text result is backed by the local conversation JSON. Use its
    // logical turn index to share the minimap's multi-load navigation path,
    // including searches for a non-first part of a grouped assistant reply.
    if (messageId && conversationId) {
      await checkMinimapCache(conversationId);
      if (!isCurrentJump()) return false;
      const navigationEntries = S.minimap.cachedId === conversationId && S.minimap.cachedMessages?.mapping
        ? minimapMessages(S.minimap.cachedMessages, window.ChatGPTDomAdapter.messageElements())
        : (S.minimap.id === conversationId ? S.minimap.allEntries : []);
      refreshMinimapEntryTargets(navigationEntries);
      const entry = navigationEntries.find(item =>
        item.messageIds?.includes(messageId) || item.startId === messageId || item.id === messageId
      );
      if (entry) return jumpMinimapEntry(entry, navigationEntries.length, messageId, block, navigationEntries);
    }

    const deadline = Date.now() + 45000;
    let fallbackNudgeNext = false;
    while (Date.now() < deadline) {
      if (!isCurrentJump()) return false;
      target = resolveTarget();
      if (target) {
        return alignTarget(target);
      }
      const scroller = conversationScrollContainer();
      if (!scroller) {
        await sleep(300);
        continue;
      }
      const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      if (fallbackNudgeNext && max > 1) {
        scroller.scrollTo?.({ top: Math.min(80, max), behavior: 'auto' });
        await sleep(90);
        if (!isCurrentJump()) return false;
        const loadedTarget = resolveTarget();
        if (loadedTarget) return alignTarget(loadedTarget);
      }
      scroller.scrollTo?.({ top: 0, behavior: 'auto' });
      fallbackNudgeNext = false;
      const progress = await waitForConversationProgress(scroller, isCurrentJump, resolveTarget);
      if (progress.status === 'cancelled') return false;
      if (progress.target) return alignTarget(progress.target);
      const loadedTarget = resolveTarget();
      if (loadedTarget) return alignTarget(loadedTarget);
      fallbackNudgeNext = progress.status === 'idle';
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
    const conversationId = currentConversationId();
    if (!pending || pending.conversationId !== conversationId) {
      try {
        const reply = await runtimeMessage({ action: 'pendingSearchJumpTake', conversationId });
        pending = reply.pending;
      } catch (_) {}
    }
    if (!pending || pending.conversationId !== conversationId) return;
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
    if (result.remoteState === 'local-only') return;
    if (result.conversationId === currentConversationId()) {
      if (result.messageId) await jumpToSearchMessage(result.messageId, result.snippet);
      return;
    }
    const pending = result.messageId ? {
        conversationId: result.conversationId,
        messageId: result.messageId,
        snippet: result.snippet
      } : null;
    const targetUrl = new URL(result.href || `/c/${result.conversationId}`, location.origin).href;
    if (S.settings.openInBackground) {
      if (pending) await runtimeMessage({ action: 'pendingSearchJumpPut', pending });
      await runtimeMessage({ action: 'openInBackground', url: targetUrl });
      return;
    }
    if (pending) sessionStorage.setItem('chatgpt-pro-pending-search-jump', JSON.stringify(pending));
    window.location.href = targetUrl;
  }

  function appendHighlightedSearchText(element, value, query) {
    const source = String(value || '');
    const tokens = [...new Set(String(query || '').trim().split(/\s+/).filter(Boolean))]
      .sort((a, b) => b.length - a.length);
    if (!tokens.length) {
      element.textContent = source;
      return;
    }
    const escaped = tokens.map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const matcher = new RegExp(`(${escaped.join('|')})`, 'giu');
    let offset = 0;
    for (const match of source.matchAll(matcher)) {
      if (match.index > offset) element.appendChild(document.createTextNode(source.slice(offset, match.index)));
      const mark = document.createElement('mark');
      mark.className = 'chatgpt-pro-search-highlight';
      mark.textContent = match[0];
      element.appendChild(mark);
      offset = match.index + match[0].length;
    }
    if (offset < source.length) element.appendChild(document.createTextNode(source.slice(offset)));
  }

  function renderFullTextResults(container, results, query = '') {
    container.replaceChildren();
    if (!results.length) {
      const empty = document.createElement('p');
      empty.className = 'chatgpt-pro-search-empty';
      empty.textContent = '没有找到匹配内容';
      container.appendChild(empty);
      return;
    }
    for (const result of results) {
      const localOnly = result.remoteState === 'local-only';
      const i18n = window.ChatGPTProI18n;
      const button = document.createElement(localOnly ? 'div' : 'button');
      button.type = 'button';
      button.className = 'chatgpt-pro-search-result';
      const title = document.createElement('strong');
      appendHighlightedSearchText(title, result.title, query);
      const meta = document.createElement('span');
      meta.className = 'chatgpt-pro-search-result-meta';
      const stateLabel = localOnly ? '仅本地 · 已确认官方删除'
          : result.remoteState === 'unverified' ? '远端状态待核实' : '';
      const roleLabel = result.role === 'user' ? '用户' : (result.role === 'assistant' ? 'ChatGPT' : '');
      const metaParts = [
        { value: stateLabel, translate: Boolean(stateLabel) },
        { value: roleLabel, translate: result.role === 'user' },
        { value: searchResultTime(result), translate: false }
      ].filter(part => part.value);
      for (const [index, part] of metaParts.entries()) {
        if (index) meta.appendChild(document.createTextNode(' · '));
        const item = document.createElement('span');
        item.textContent = part.value;
        if (part.translate) item.setAttribute('data-chatgpt-pro-i18n', '');
        meta.appendChild(item);
      }
      const snippet = document.createElement('span');
      snippet.className = 'chatgpt-pro-search-result-snippet';
      appendHighlightedSearchText(snippet, result.snippet, query);
      // This is extension-generated UI copy, unlike a normal message excerpt.
      // Opt only the title-only fallback into translation; preserve all chat text.
      if (!result.messageId && result.snippet === '标题匹配') {
        snippet.setAttribute('data-chatgpt-pro-i18n', '');
      }
      button.append(title, meta, snippet);
      if (localOnly) {
        const previewButton = document.createElement('button');
        previewButton.type = 'button';
        previewButton.className = 'chatgpt-pro-export-button';
        previewButton.setAttribute('data-chatgpt-pro-i18n', '');
        previewButton.textContent = '本地完整预览';
        const preview = document.createElement('pre');
        preview.hidden = true;
        preview.className = 'chatgpt-pro-local-preview';
        preview.style.cssText = 'max-height:260px;overflow:auto;white-space:pre-wrap;word-break:break-word;text-align:left;'
          + 'padding:9px;background:rgba(128,128,128,.08);border-radius:6px;font-size:11px;';
        previewButton.addEventListener('click', async () => {
          if (!preview.hidden) {
            preview.hidden = true;
            previewButton.textContent = '本地完整预览';
            return;
          }
          previewButton.disabled = true;
          try {
            // A confirmed deleted conversation MUST NOT fall back to any
            // official API. Read only this signed-in account's stored JSON.
            const accountId = await window.APIHandler.getAccountId(true);
            const reply = await runtimeMessage({ action: 'localDataGetConversation',
              accountId, id: result.conversationId });
            if (await window.APIHandler.getAccountId(true) !== accountId) {
              throw new Error(i18n.t('ui.accountSwitchedCannotPreviewPreviousAccountData'));
            }
            preview.textContent = reply.hit && reply.raw
              ? JSON.stringify(reply.raw, null, 2)
              : i18n.t('ui.completeJSONNotStoredLocallyOnlyASearch');
            preview.hidden = false;
            previewButton.textContent = '收起本地预览';
          } catch (error) {
            preview.textContent = `${i18n.t('ui.unableToReadCompleteLocalContent')}: ${error.message}`;
            preview.hidden = false;
          } finally { previewButton.disabled = false; }
        });
        button.append(previewButton, preview);
        const exports = document.createElement('span');
        exports.className = 'chatgpt-pro-row-export';
        for (const [label, action] of [['MD', exportConversationMarkdown], ['JSON', exportConversationJson]]) {
          const exportButton = document.createElement('button');
          exportButton.type = 'button';
          exportButton.className = 'chatgpt-pro-export-button';
          exportButton.textContent = label;
          exportButton.addEventListener('click', async () => {
            exportButton.disabled = true;
            try {
              await action({ id: result.conversationId, title: result.title, href: result.href,
                updateTime: result.updateTime });
            } catch (error) {
              exportButton.title = `${i18n.t('ui.localExportFailed')}: ${error.message}`;
            } finally { exportButton.disabled = false; }
          });
          exports.appendChild(exportButton);
        }
        button.append(exports);
        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'chatgpt-pro-export-button';
        clear.setAttribute('data-chatgpt-pro-i18n', '');
        clear.textContent = '清理本地';
        clear.title = '只清理此对话的扩展本地原始 JSON、全文索引和目录';
        clear.addEventListener('click', async () => {
          clear.disabled = true;
          try { await clearLocalOnlyRecord(result.conversationId); }
          catch (error) { clear.title = `${i18n.t('ui.cleanupFailed')}: ${error.message}`; }
          finally { clear.disabled = false; }
        });
        button.append(clear);
      }
      if (!localOnly) button.addEventListener('click', () => openFullTextSearchResult(result));
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
        <div class="chatgpt-pro-panel-topline">
          <div class="chatgpt-pro-panel-tabs" role="tablist" aria-label="聊天工具">
            <button type="button" class="chatgpt-pro-panel-tab chatgpt-pro-panel-tab-active" role="tab" aria-selected="true" data-panel-view="directory">聊天目录</button>
            <button type="button" class="chatgpt-pro-panel-tab" role="tab" aria-selected="false" data-panel-view="search">全文搜索</button>
          </div>
          <span class="chatgpt-pro-panel-status">正在读取本地目录…</span>
        </div>
        <div class="chatgpt-pro-panel-actions">
          <div class="chatgpt-pro-batch-actions" hidden>
            <span class="chatgpt-pro-batch-count">已选 0</span>
            <label title="导出前增量检查聊天目录；仅更新有变化的完整缓存" style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap;font-size:11px">
              <input class="chatgpt-pro-export-check-latest" type="checkbox" style="width:auto;margin:0">
              检查更新
            </label>
            <button type="button" data-batch-format="md">导出 MD</button>
            <button type="button" data-batch-format="json">导出 JSON</button>
            <button type="button" data-batch-action="archive">归档</button>
            <button type="button" data-batch-action="delete">删除</button>
          </div>
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
        <div class="chatgpt-pro-search-index-bar">
          <span class="chatgpt-pro-search-index-status">正在读取索引状态…</span>
          <button type="button" class="chatgpt-pro-search-index-update">更新索引</button>
        </div>
        <details class="chatgpt-pro-search-index-detail" hidden>
          <summary>索引失败日志 <span class="chatgpt-pro-search-index-error-count"></span></summary>
          <div class="chatgpt-pro-search-index-error-list"></div>
        </details>
        <div class="chatgpt-pro-search-results" aria-live="polite"></div>
      </section>`;

    document.body.appendChild(panel);
    S.timeline = panel;
    // Translate only extension-owned UI. Never change ChatGPT's document
    // language/direction or user conversation text.
    window.ChatGPTProI18n?.setDirection(panel);
    window.ChatGPTProI18n?.watch(panel);
    S.launcher.classList.add('chatgpt-pro-open');
    S.launcher.setAttribute('aria-expanded', 'true');
    setLauncherIcon(true);
    S.launcher.title = launcherTitle(true);
    applyPanelSize(panel);
    setupPanelResize(panel);
    const status = panel.querySelector('.chatgpt-pro-panel-status');
    const panelTabs = Array.from(panel.querySelectorAll('[data-panel-view]'));
    const directoryView = panel.querySelector('[data-panel-content="directory"]');
    const searchView = panel.querySelector('[data-panel-content="search"]');
    const fullTextForm = panel.querySelector('.chatgpt-pro-fulltext-form');
    const fullTextInput = panel.querySelector('.chatgpt-pro-fulltext-input');
    const searchIndexStatus = panel.querySelector('.chatgpt-pro-search-index-status');
    const searchIndexUpdate = panel.querySelector('.chatgpt-pro-search-index-update');
    const searchIndexDetail = panel.querySelector('.chatgpt-pro-search-index-detail');
    const searchIndexErrorCount = panel.querySelector('.chatgpt-pro-search-index-error-count');
    const searchIndexErrorList = panel.querySelector('.chatgpt-pro-search-index-error-list');
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
    const panelActions = panel.querySelector('.chatgpt-pro-panel-actions');
    const exportCheckLatest = panel.querySelector('.chatgpt-pro-export-check-latest');
    const batchCount = panel.querySelector('.chatgpt-pro-batch-count');
    const batchButtons = Array.from(panel.querySelectorAll('[data-batch-format]'));
    const mutationButtons = Array.from(panel.querySelectorAll('[data-batch-action]'));
    let activeView = 'directory';
    let sortDirection = 'newest';
    let currentRecords = [];
    let searchTimer = null;
    let searchRequestId = 0;
    let searchCacheRevision = '';
    const searchCache = new Map();
    const initialSearchTitle = document.createElement('strong');
    initialSearchTitle.textContent = '搜索所有聊天内容';
    const initialSearchHint = document.createElement('span');
    initialSearchHint.textContent = '输入关键词以搜索已有的本地索引';
    const initialSearchState = document.createElement('div');
    initialSearchState.className = 'chatgpt-pro-search-initial';
    initialSearchState.append(initialSearchTitle, initialSearchHint);
    searchResults.appendChild(initialSearchState);
    const clearRecentSearches = () => {
      searchCacheRevision = '';
      searchCache.clear();
      searchRequestId++;
    };
    const onSearchAccountChanged = () => {
      if (!panel.isConnected) {
        window.removeEventListener('chatgpt-pro-account-changed', onSearchAccountChanged);
        return;
      }
      clearRecentSearches();
      window.clearTimeout(searchTimer);
      searchResults.replaceChildren();
      searchIndexStatus.textContent = '账号已变化；请重新授权或搜索当前账号';
      status.textContent = '登录账号已变化，本地搜索结果已清空';
    };
    window.addEventListener('chatgpt-pro-account-changed', onSearchAccountChanged);
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
      panelActions.hidden = activeView !== 'directory';
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

    const indexFailureHint = text => {
      if (/\b410\b|\bgone\b/i.test(text)) return '官方已明确返回删除状态。';
      if (/\b404\b|not found/i.test(text)) return '可能不存在或无权访问，不能据此确认已删除。';
      if (/\b401\b|\b403\b|登录|权限/.test(text)) return '请确认当前 ChatGPT 账号与访问权限。';
      if (/更新版本|拒绝覆盖/.test(text)) return '本地已有更新完整 JSON，重建索引时会优先使用新版本。';
      return '';
    };

    const renderIndexFailures = (failures, tasks = [], failureTask = null, skippedIds = new Set()) => {
      const itemById = new Map(currentRecords.map(record => [record.id, record]));
      for (const task of tasks) for (const item of task.items || []) {
        if (!itemById.has(item.id)) itemById.set(item.id, item);
      }
      const normalized = (failures || []).map(failure => {
        if (typeof failure !== 'string') return {
          id: String(failure?.id || ''), message: String(failure?.message || '未知错误')
        };
        const match = failure.match(/^([^:：]+)[:：]\s*([\s\S]*)$/);
        return { id: match?.[1] || '', message: match?.[2] || failure };
      }).filter(failure => !failure.id || !skippedIds.has(failure.id));
      const wasHidden = searchIndexDetail.hidden;
      searchIndexDetail.hidden = normalized.length === 0;
      if (!normalized.length) {
        searchIndexErrorList.replaceChildren();
        return;
      }
      if (wasHidden) searchIndexDetail.open = false;
      searchIndexErrorCount.textContent = `(${normalized.length})`;
      searchIndexErrorList.replaceChildren();
      for (const failure of normalized.slice(-10)) {
        const item = itemById.get(failure.id) || {};
        const entry = document.createElement('div');
        entry.className = 'chatgpt-pro-search-index-error';
        const heading = document.createElement('div');
        heading.className = 'chatgpt-pro-search-index-error-title';
        const title = document.createElement('strong');
        title.textContent = item.title || failure.id || '未知对话';
        const link = document.createElement('a');
        link.href = item.href || (failure.id ? `/c/${failure.id}` : '#');
        link.textContent = '打开对话';
        if (!failure.id) link.hidden = true;
        link.addEventListener('click', event => {
          if (!S.settings.openInBackground || event.button !== 0
              || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          runtimeMessage({ action: 'openInBackground', url: link.href }).catch(() => {});
        });
        const actions = document.createElement('div');
        actions.className = 'chatgpt-pro-search-index-error-actions';
        if (failure.id && failureTask?.id) {
          const skip = document.createElement('button');
          skip.type = 'button';
          skip.className = 'chatgpt-pro-search-index-error-skip';
          skip.textContent = '跳过';
          skip.addEventListener('click', async () => {
            const confirmText = window.ChatGPTProI18n?.t('ui.skipIndexConversationConfirm')
              || '跳过此对话？跳过后，此对话将不再自动参与全文索引；清空全文索引后可重新纳入。';
            if (!window.confirm(confirmText)) return;
            skip.disabled = true;
            try {
              const accountId = await window.APIHandler.getAccountId(true);
              await runtimeMessage({ action: 'indexSkipConversation', accountId,
                taskId: failureTask.id, conversationId: failure.id });
              await runtimeMessage({ action: 'indexPolicyFinishInitial', accountId }).catch(() => {});
              await refreshSearchIndexStatus();
            } catch (error) {
              skip.disabled = false;
              searchIndexStatus.textContent = `索引操作失败：${error.message}`;
            }
          });
          actions.appendChild(skip);
        }
        actions.appendChild(link);
        heading.append(title, actions);
        const id = document.createElement('div');
        id.textContent = `ID: ${failure.id || '未知'}`;
        const message = document.createElement('div');
        message.className = 'chatgpt-pro-search-index-error-message';
        message.textContent = `错误：${failure.message}`;
        entry.append(heading, id, message);
        const hintText = indexFailureHint(failure.message);
        if (hintText) {
          const hint = document.createElement('div');
          hint.className = 'chatgpt-pro-search-index-error-hint';
          const hintLabel = document.createElement('span');
          hintLabel.textContent = '判断';
          const hintValue = document.createElement('span');
          hintValue.textContent = hintText;
          hint.append(hintLabel, document.createTextNode(': '), hintValue);
          entry.appendChild(hint);
        }
        searchIndexErrorList.appendChild(entry);
      }
    };

    const indexPauseReason = phase => phase === 'consecutive-failures'
      ? '连续失败，等待人工继续'
      : phase === 'auth-error' ? '登录或权限异常'
        : phase === 'paused' ? '已手动暂停' : '未记录原因';

    const setIndexStatusParts = parts => {
      searchIndexStatus.replaceChildren();
      const visible = parts.filter(part => part !== null && part !== undefined && part !== '');
      visible.forEach((part, index) => {
        if (index) searchIndexStatus.appendChild(document.createTextNode(' · '));
        const item = document.createElement('span');
        item.textContent = String(part);
        searchIndexStatus.appendChild(item);
      });
    };

    const refreshSearchIndexStatus = async () => {
      try {
        const accountId = await window.APIHandler.getAccountId();
        const [response, policy, taskReply] = await Promise.all([
          runtimeMessage({ action: 'searchIndexMetadata', accountId }),
          runtimeMessage({ action: 'indexPolicyGet', accountId }),
          runtimeMessage({ action: 'taskList', accountId })
        ]);
        const indexTasks = (taskReply.result || []).filter(task => task.type === 'index')
          .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
        const activeTask = indexTasks.find(task => ['pending', 'running', 'paused'].includes(task.status));
        const latestFinishedTask = indexTasks.find(task => ['completed', 'failed', 'paused'].includes(task.status));
        // Prefer the active task even before it has failures. Showing an older
        // task's errors while a newer queue is running could offer a skip
        // action for an item that is already waiting in that newer queue.
        const failureTask = activeTask || latestFinishedTask;
        const latestFailures = failureTask?.errors || [];
        const skippedIds = new Set(policy.result?.skippedIndexIds || []);
        const indexedIds = new Set((response.records || []).map(record => record.id));
        const skippedCount = currentRecords.filter(record => skippedIds.has(record.id)).length;
        const remaining = currentRecords.filter(record => !indexedIds.has(record.id)
          && !skippedIds.has(record.id)).length;
        const outdated = (response.records || []).filter(
          record => record.schemaVersion !== SEARCH_INDEX_SCHEMA_VERSION
        ).length;
        delete searchIndexUpdate.dataset.resumeTaskId;
        searchIndexUpdate.disabled = Boolean(activeTask && activeTask.status !== 'paused');
        searchIndexUpdate.textContent = !policy.result?.consentAt
          ? '首次索引（需授权）'
            : activeTask?.status === 'paused' ? '继续'
              : activeTask ? '执行中'
          : outdated ? `刷新索引规则（${outdated} 个）`
            : remaining ? `补齐剩余 ${remaining} 个`
            : policy.result.initialCompletedAt ? '更新索引' : '继续首次索引';
        if (activeTask?.status === 'paused') searchIndexUpdate.dataset.resumeTaskId = activeTask.id;
        const statusParts = !policy.result?.consentAt
          ? [`首次建立全文索引需点击授权；不会自动抓取正文。已有索引可搜索 · 当前 ${response.records?.length || 0} 条`]
          : [
            `当前账号已索引 ${response.records?.length || 0} / ${currentRecords.length} 个`,
            remaining ? `剩余 ${remaining} 个需要补齐` : '',
            skippedCount ? `已跳过 ${skippedCount} 个` : '',
            outdated ? `${outdated} 个需按新规则重建` : ''
          ];
        if (activeTask?.status === 'paused') statusParts.push(indexPauseReason(activeTask.phase));
        else if (activeTask) {
          statusParts.push(activeTask.status === 'running' ? '执行中' : '等待执行');
          statusParts.push(`${activeTask.nextIndex || 0}/${activeTask.items?.length || 0}`);
        }
        setIndexStatusParts(statusParts);
        renderIndexFailures(latestFailures, indexTasks, failureTask, skippedIds);
      } catch (error) {
        searchIndexStatus.textContent = `索引状态读取失败：${error.message}`;
        renderIndexFailures([]);
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
        panelActions.hidden = true;
        batchActions.hidden = true;
        status.textContent = '';
        refreshSearchIndexStatus();
        window.setTimeout(() => fullTextInput.focus(), 0);
      } else {
        updateSelectionUi();
        status.textContent = `${currentRecords.length} 条聊天记录`;
      }
    };

    panelTabs.forEach(tab => tab.addEventListener('click', () => setActiveView(tab.dataset.panelView)));
    const runFullTextSearch = async () => {
      const requestId = ++searchRequestId;
      const query = fullTextInput.value.trim();
      if (!query) {
        searchResults.replaceChildren(initialSearchState);
        status.textContent = '';
        return;
      }
      status.textContent = '正在搜索本地索引…';
      try {
        const accountId = await window.APIHandler.getAccountId();
        // Cheap version metadata invalidates the small recent-query cache
        // after an index write, account switch or manual index deletion.
        const [metadata, directoryState] = await Promise.all([
          runtimeMessage({ action: 'searchIndexMetadata', accountId }),
          runtimeMessage({ action: 'localDataGetDirectory', accountId })
        ]);
        if (requestId !== searchRequestId) return;
        const revision = accountId + ':' + (metadata.records || []).map(entry =>
          `${entry.id}:${entry.updateTime}:${entry.indexedAt}`).join('|') + ':'
          + (directoryState.records || []).map(entry =>
            `${entry.id}:${entry.updateTime}:${entry.remoteState}`).join('|');
        if (revision !== searchCacheRevision) {
          searchCache.clear();
          searchCacheRevision = revision;
        }
        const cacheKey = JSON.stringify([accountId, query]);
        let cached = searchCache.get(cacheKey);
        if (!cached) {
          const response = await runtimeMessage({ action: 'searchFullText', accountId, query, limit: 200 });
          cached = response.results || [];
          searchCache.set(cacheKey, cached);
          if (searchCache.size > 8) searchCache.delete(searchCache.keys().next().value);
        }
        if (requestId !== searchRequestId) return;
        if (await window.APIHandler.getAccountId(true) !== accountId) {
          clearRecentSearches();
          throw new Error('登录账号已切换，请重新搜索');
        }
        renderFullTextResults(searchResults, cached, query);
        status.textContent = `当前账号 ${cached.length} 条`;
      } catch (error) {
        if (requestId === searchRequestId) status.textContent = `全文搜索失败：${error.message}`;
      }
    };
    fullTextForm.addEventListener('submit', event => {
      event.preventDefault();
      window.clearTimeout(searchTimer);
      runFullTextSearch();
    });
    fullTextInput.addEventListener('input', () => {
      // Invalidate an older async result immediately, not 300 ms later.
      searchRequestId++;
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(runFullTextSearch, 300);
    });
    searchIndexUpdate.addEventListener('click', async () => {
      if (searchIndexUpdate.disabled) return;
      searchIndexUpdate.disabled = true;
      try {
        const resumeTaskId = searchIndexUpdate.dataset.resumeTaskId;
        if (resumeTaskId) {
          const accountId = await window.APIHandler.getAccountId(true);
          await indexTaskMessage('taskControl', accountId, { id: resumeTaskId, operation: 'resume' });
          searchIndexStatus.textContent = '执行中';
          delete searchIndexUpdate.dataset.resumeTaskId;
          await runIndexTask(accountId, resumeTaskId);
          await runtimeMessage({ action: 'indexPolicyFinishInitial', accountId }).catch(() => {});
          await refreshSearchIndexStatus();
          return;
        }
        const result = await updateIndexWithConsent(currentRecords, progress => {
          const base = `${progress.done} / ${progress.total}`;
          if (progress.phase === 'initial-directory') {
            searchIndexStatus.textContent = '正在核实完整聊天目录（项目和分页）…';
          } else if (progress.phase === 'paused') {
            searchIndexStatus.textContent = progress.reason === 'consecutive-failures'
              ? '索引已自动暂停：连续 3 个对话处理失败；请查看任务日志后手动继续'
              : progress.reason === 'auth-error'
                ? '索引已暂停：登录或权限异常；请确认 ChatGPT 登录状态后继续'
                : '索引已手动暂停，请在任务管理中继续';
          } else if (progress.phase === 'running-elsewhere') {
            searchIndexStatus.textContent = progress.busyReason === 'account-busy'
              ? '同账号已有其他任务在执行，索引任务将排队'
              : '索引任务正在其他标签页运行';
          } else if (progress.phase === 'rate-limit') {
            searchIndexStatus.textContent = `请求受限，${progress.remainingSeconds} 秒后继续 · ${base}`;
          } else if (progress.phase === 'group-wait') {
            searchIndexStatus.textContent = `本组完成，${progress.remainingSeconds} 秒后继续 · ${base}`;
          } else if (progress.phase === 'retry-wait') {
            searchIndexStatus.textContent = `请求失败，${progress.remainingSeconds} 秒后重试 · ${base}`;
          } else if (progress.phase !== 'pacing') {
            searchIndexStatus.textContent = `正在更新索引 ${base}`;
          }
        });
        if (result.consentDeclined) searchIndexStatus.textContent = '未授权，未开始首次全量索引';
        else await refreshSearchIndexStatus();
      } catch (error) {
        searchIndexStatus.textContent = `索引更新失败：${error.message}`;
      } finally {
        clearRecentSearches();
        searchIndexUpdate.disabled = false;
        refreshSearchIndexStatus().catch(() => {});
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
        let selected = currentVisibleRecords()
          .filter(rec => selectedIds.has(rec.id));
        if (!selected.length) return;
        batchButtons.forEach(item => { item.disabled = true; });
        exportCheckLatest.disabled = true;
        try {
          if (exportCheckLatest.checked) {
            status.textContent = '正在检查所选聊天的目录版本…';
            // Bypass the short directory sync throttle, but do not force a
            // full historical rescan. Changed conversations move to the top.
            const fresh = await window.APIHandler.syncConversationList(false, { checkLatest: true });
            const freshById = new Map(fresh.map(record => [record.id, record]));
            selected = selected.map(record => freshById.get(record.id) || record);
          }
          const result = await startExportTask(selected, format, progress => {
            const base = `${progress.done} / ${progress.total} · 第 ${progress.group} / ${progress.totalGroups} 组`;
            if (progress.phase === 'rate-limit') {
              status.textContent = `请求受限 · ${progress.remainingSeconds} 秒后继续 · ${base}`;
            } else if (progress.phase === 'group-wait') {
              status.textContent = `本组完成 · ${progress.remainingSeconds} 秒后继续 · ${base}`;
            } else if (progress.phase === 'retry-wait') {
              status.textContent = `请求失败 · ${progress.remainingSeconds} 秒后重试 ${progress.retry} / ${EXPORT_MAX_RETRIES} · ${base}`;
            } else if (progress.phase === 'retrying') {
              status.textContent = `正在重试 ${progress.retry} / ${EXPORT_MAX_RETRIES} · ${base}`;
            } else if (progress.phase === 'volume-ready') {
              status.textContent = `第 ${progress.volume} 个 ZIP 已保存${progress.downloadInitiated ? '并发起下载' : ''} · ${progress.done} / ${progress.total}`;
            } else if (progress.phase !== 'pacing') {
              status.textContent = `正在导出 ${base}…`;
            }
          });
          if (result.paused) status.textContent = '已有同类型的暂停任务，请在任务管理中继续';
          else if (result.busy) status.textContent = result.busyReason === 'account-busy'
            ? '同账号已有其他任务执行，导出任务将排队'
            : '同账号的导出任务正在其他标签页执行';
          else status.textContent = `已持久化 ${result.volumeCount} 卷 · 成功 ${result.successCount} 个、失败 ${result.failureCount} 个（浏览器下载需单独确认）`;
          selectedIds.clear();
          renderCurrent();
        } catch (error) {
          status.textContent = `批量导出失败：${error.message}`;
        } finally {
          batchButtons.forEach(item => { item.disabled = false; });
          exportCheckLatest.disabled = false;
        }
      });
    }
    for (const button of mutationButtons) {
      button.addEventListener('click', async () => {
        const action = button.dataset.batchAction;
        const chosen = currentVisibleRecords().filter(rec => selectedIds.has(rec.id));
        const selected = chosen.filter(rec => rec.remoteState !== 'local-only');
        if (!selected.length) {
          status.textContent = '所选记录已是仅本地状态，无法操作云端';
          return;
        }
        const verb = action === 'delete' ? '永久删除' : '归档';
        const explanation = action === 'delete'
          ? '删除 ChatGPT 云端对话不可撤销。扩展会先验证完整 JSON 已保存到本地，删除后保留本地索引和原文。'
          : '归档只影响 ChatGPT 云端的对话列表，不会清理扩展本地数据。';
        if (!window.confirm(window.ChatGPTProI18n.format(
          'ui.variableVariableSelectedConversationsVariableThisMayTake',
          { action: window.ChatGPTProI18n.t(action === 'delete' ? 'ui.deletePermanently' : 'ui.archive'),
            count: selected.length, detail: window.ChatGPTProI18n.t(action === 'delete'
              ? 'ui.deletingConversationsInChatGPTCannotBeUndoneThe'
              : 'ui.archivingRemovesChatsFromTheRemoteListWithout') }))) return;
        mutationButtons.concat(batchButtons).forEach(item => { item.disabled = true; });
        let success = 0;
        const failed = [];
        try {
          const accountId = await window.APIHandler.getAccountId(true);
          for (const rec of selected) {
            status.textContent = `正在${verb} ${success + failed.length + 1} / ${selected.length} · 成功 ${success}、失败 ${failed.length}`;
            try {
              if (action === 'delete') {
                // A fulfilled network fetch is not enough: require the durable
                // IndexedDB raw copy before requesting irreversible deletion.
                await window.APIHandler.getConversation(rec.id);
                const cached = await runtimeMessage({ action: 'localDataGetConversation',
                  accountId, id: rec.id });
                if (!cached.hit) throw new Error('完整原文尚未保存到本地，未执行云端删除');
              }
              await window.APIHandler.setConversationState(rec.id, action, accountId);
              if (action === 'delete') {
                const result = await runtimeMessage({ action: 'localDataMarkOfficialGone', accountId, id: rec.id });
                if (!result.result?.marked) throw new Error('云端已删除，但本地状态标记失败，请检查缓存');
                currentRecords = currentRecords.map(item => item.id === rec.id
                  ? { ...item, remoteState: 'local-only' } : item);
              } else {
                await runtimeMessage({ action: 'localDataHideArchived', accountId, id: rec.id });
                currentRecords = currentRecords.filter(item => item.id !== rec.id);
              }
              selectedIds.delete(rec.id);
              success++;
              renderCurrent();
            } catch (error) {
              // Translate only the generated error detail. Conversation titles
              // are user-authored content and must remain exactly as stored.
              const errorMessage = window.ChatGPTProI18n?.translateText(error.message) || error.message;
              failed.push(`${rec.title}: ${errorMessage}`);
              if (/登录账号已切换|HTTP 401|HTTP 403/.test(error.message)) break;
            }
            // Keep mutations sequential to avoid spiking ChatGPT's API.
            if (success + failed.length < selected.length) await sleep(750);
          }
          status.textContent = `${verb}完成：成功 ${success}、失败 ${failed.length}${failed.length ? '（点击查看失败清单）' : ''}`;
          if (failed.length) {
            status.title = failed.join('\n');
            status.style.cursor = 'pointer';
            status.onclick = () => window.alert(window.ChatGPTProI18n.format(
              'ui.failedItemsVariable', { items: failed.join('\n') }));
          } else {
            status.removeAttribute('title');
            status.style.cursor = '';
            status.onclick = null;
          }
        } catch (error) {
          status.textContent = `${verb}中止：${error.message}`;
        } finally {
          mutationButtons.concat(batchButtons).forEach(item => { item.disabled = false; });
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

      const messageRelevant = mutations.some(mutation =>
        (mutation.type === 'attributes' && [
          'data-chatgpt-selection-message-id',
          'data-chatgpt-search-message-ids',
          'data-message-id',
          'data-chatgpt-search-unit-key',
          'data-content-search-unit-key'
        ].includes(mutation.attributeName)) ||
        Array.from(mutation.addedNodes).some(node =>
          node.nodeType === 1 && (
            window.ChatGPTDomAdapter.containsMessageNode(node) ||
            window.ChatGPTDomAdapter.containsMessageDecorationTarget?.(node)
          )
        )
      );
      if (messageRelevant) {
        clearTimeout(messageTimer);
        messageTimer = setTimeout(() => {
          if (S.settings.showMessageTimestamps) {
            stampMessageTimestamps().catch(error => log('Message timestamp refresh failed:', error.message));
          }
          resumePendingSearchJump().catch(error => log('Search result jump failed:', error.message));
        }, 100);
        scheduleAutomaticIndexRefresh(12000);
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
        ['enabled', 'showSidebarTime', 'showMessageTimestamps', 'showMinimap', 'fontSize', 'openInBackground', 'closeOnOutsideClick', 'exportFilenameTemplate', 'launcherPosition', 'toolDockPositionX', 'currentExportPositionY', 'panelSize', 'uiLanguage', 'autoContinueEnabled', 'autoContinueText', 'autoContinueDelaySeconds', 'autoContinueMaxCount'],
        data => resolve(data || {})
      );
    });
    if (values.enabled !== undefined) S.settings.enabled = values.enabled;
    if (values.showSidebarTime !== undefined) S.settings.showSidebarTime = values.showSidebarTime;
    if (values.showMessageTimestamps !== undefined) S.settings.showMessageTimestamps = values.showMessageTimestamps;
    S.settings.showMinimap = values.showMinimap !== false;
    S.settings.autoContinueEnabled = values.autoContinueEnabled === true;
    if (typeof values.autoContinueText === 'string') {
      if (values.autoContinueText.trim() === '继续') {
        // The previous release supplied this as a built-in default. Remove
        // that legacy value so the message field starts empty after upgrade.
        S.settings.autoContinueText = '';
        chrome.storage.local.remove('autoContinueText');
      } else S.settings.autoContinueText = values.autoContinueText;
    }
    if (values.autoContinueDelaySeconds) S.settings.autoContinueDelaySeconds = Number(values.autoContinueDelaySeconds) || 120;
    if (values.autoContinueMaxCount) S.settings.autoContinueMaxCount = Number(values.autoContinueMaxCount) || 20;
    applyTimestampFontSize(values.fontSize);
    if (values.openInBackground !== undefined) S.settings.openInBackground = values.openInBackground;
    if (values.closeOnOutsideClick !== undefined) S.settings.closeOnOutsideClick = values.closeOnOutsideClick;
    if (values.exportFilenameTemplate) S.settings.exportFilenameTemplate = values.exportFilenameTemplate;
    window.ChatGPTProI18n?.setLanguage(values.uiLanguage || 'auto');
    if (values.launcherPosition?.x != null && values.launcherPosition?.y != null) {
      S.settings.launcherPosition = values.launcherPosition;
    }
    if (values.toolDockPositionX != null) {
      const x = Number(values.toolDockPositionX);
      if (Number.isFinite(x)) S.settings.toolDockPositionX = Math.max(0, Math.min(1, x));
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
            apiSize: S.apiData.size,
            autoContinue: autoContinueSnapshot()
          });
        })().catch(() => respond({
          platform: 'chatgpt',
          initialized: S.ready,
          directoryCount: 0,
          enabled: S.settings.enabled
        }));
        return true;
      }
      if (msg.action === 'taskDashboard') {
        getTaskDashboard()
          .then(result => respond({ success: true, ...result }))
          .catch(error => respond({ success: false, error: error.message }));
        return true;
      }
      if (msg.action === 'indexAutoSet') {
        manageAccountLocalData('indexPolicySetAuto', { enabled: msg.enabled })
          .then(result => respond({ success: true, ...result }))
          .catch(error => respond({ success: false, error: error.message }));
        return true;
      }
      if (msg.action === 'clearAccountLocalData') {
        manageAccountLocalData('localDataClearAccount', { kind: msg.kind })
          .then(result => respond({ success: true, ...result }))
          .catch(error => respond({ success: false, error: error.message }));
        return true;
      }
      if (msg.action === 'indexBegin') {
        beginIndexFromPopup(msg.userConfirmedConsent === true)
          .then(result => respond({ success: true, ...result }))
          .catch(error => respond({ success: false, error: error.message }));
        return true;
      }
      if (msg.action === 'taskManage') {
        controlManagedTask(msg.id, msg.operation)
          .then(result => respond({ success: true, ...result }))
          .catch(error => respond({ success: false, error: error.message }));
        return true;
      }
      if (msg.action === 'taskRetryIndexItem') {
        retryManagedIndexItem(msg.id, msg.conversationId)
          .then(result => respond({ success: true, ...result }))
          .catch(error => respond({ success: false, error: error.message }));
        return true;
      }
      if (msg.action === 'taskDownloadVolumes') {
        downloadManagedTaskVolumes(msg.id)
          .then(result => respond({ success: true, ...result }))
          .catch(error => respond({ success: false, error: error.message }));
        return true;
      }
      if (msg.action === 'autoContinueControl') {
        (async () => {
          if (typeof msg.text === 'string' && msg.text.trim()) S.settings.autoContinueText = msg.text.trim();
          if (Number(msg.delaySeconds) > 0) S.settings.autoContinueDelaySeconds = Number(msg.delaySeconds);
          if (Number(msg.maxCount) > 0) S.settings.autoContinueMaxCount = Number(msg.maxCount);
          if (msg.operation === 'start') await startAutoContinue();
          else if (msg.operation === 'pause') pauseAutoContinue();
          else if (msg.operation === 'stop') stopAutoContinue();
          else throw new Error('ui.unknownAutoContinueOperation');
          respond({ success: true, autoContinue: autoContinueSnapshot() });
        })().catch(error => respond({ success: false,
          error: window.ChatGPTProI18n.t(error.message), autoContinue: autoContinueSnapshot() }));
        return true;
      }
      if (msg.action === 'taskClearVolumes') {
        clearManagedTaskVolumes(msg.id)
          .then(result => respond({ success: true, ...result }))
          .catch(error => respond({ success: false, error: error.message }));
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
          stopAutoContinue();
          clearMessageRouteRetryTimers();
          removeAllBadges();
          removeMessageTimestamps();
          removeFloatingButton();
        }
      }
      if (changes.fontSize) applyTimestampFontSize(changes.fontSize.newValue);
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
      if (changes.showMinimap) {
        S.settings.showMinimap = changes.showMinimap.newValue !== false;
        syncConversationMinimap();
      }
      if (changes.autoContinueEnabled) {
        S.settings.autoContinueEnabled = changes.autoContinueEnabled.newValue === true;
        if (!S.settings.autoContinueEnabled) stopAutoContinue();
        if (S.settings.enabled) ensureAutoContinueButton();
        renderAutoContinueUi();
        placeCurrentChatExportButton();
      }
      if (changes.autoContinueText) {
        const value = typeof changes.autoContinueText.newValue === 'string'
          ? changes.autoContinueText.newValue : '';
        S.settings.autoContinueText = value.trim() === '继续' ? '' : value;
        if (value.trim() === '继续') chrome.storage.local.remove('autoContinueText');
        const textInput = document.querySelector('[data-chatgpt-pro-auto-popover] [data-auto-text]');
        if (textInput && document.activeElement !== textInput) textInput.value = S.settings.autoContinueText;
        renderAutoContinueUi();
      }
      if (changes.autoContinueDelaySeconds) S.settings.autoContinueDelaySeconds = Number(changes.autoContinueDelaySeconds.newValue) || 120;
      if (changes.autoContinueMaxCount) S.settings.autoContinueMaxCount = Number(changes.autoContinueMaxCount.newValue) || 20;
      if (changes.openInBackground) S.settings.openInBackground = changes.openInBackground.newValue;
      if (changes.closeOnOutsideClick) S.settings.closeOnOutsideClick = changes.closeOnOutsideClick.newValue;
      if (changes.exportFilenameTemplate) S.settings.exportFilenameTemplate = changes.exportFilenameTemplate.newValue || '{created_datetime}_{title}';
      if (changes.uiLanguage) {
        window.ChatGPTProI18n?.setLanguage(changes.uiLanguage.newValue || 'auto');
        updateCurrentChatExportButtonLabel(
          document.querySelector('[data-chatgpt-pro-current-export]')
        );
        document.querySelector('[data-chatgpt-pro-auto-popover]')?.remove();
        document.querySelector('[data-chatgpt-pro-download-popover]')?.remove();
        window.ChatGPTProI18n?.setDirection(S.timeline);
        window.ChatGPTProI18n?.apply(S.timeline);
        S.timeline?.querySelectorAll('.chatgpt-pro-project-filter option[data-project-type]').forEach(option => {
          option.textContent = projectFilterOptionLabel(
            option.dataset.projectType, option.dataset.projectName, option.dataset.projectNameKey || '');
        });
        S.timeline?.querySelectorAll('.chatgpt-pro-row-project[data-fallback-name-key]').forEach(project => {
          project.textContent = window.ChatGPTProI18n?.t(project.dataset.fallbackNameKey) || '未命名项目';
        });
        window.ChatGPTProI18n?.apply(S.launcher);
        window.ChatGPTProI18n?.apply(document.querySelector('[data-chatgpt-pro-current-export]'));
        window.ChatGPTProI18n?.apply(document.querySelector('[data-chatgpt-pro-current-images]'));
        window.ChatGPTProI18n?.apply(document.querySelector('[data-chatgpt-pro-minimap]'));
        renderAutoContinueUi();
      }
      if (changes.panelSize?.newValue) S.settings.panelSize = changes.panelSize.newValue;
      if (restamp && S.settings.enabled) {
        removeAllBadges();
        stampAll();
      }
    });
  }

  async function init() {
    await loadSettings();
    await restoreAutoContinueTask();
    setupOutsideClose();
    setupObserver();
    setupConversationRouteTracking();
    if (S.settings.enabled) ensureFloatingButton();
    if (S.settings.enabled && S.settings.showSidebarTime) {
      try {
        await reloadTimestampMap(false);
      } catch (e) {
        log('Initial timestamp load failed:', e.message);
      }
    }
    if (S.settings.enabled && S.settings.showMessageTimestamps) {
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
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) scheduleAutomaticIndexRefresh(1200);
    });
    window.setInterval(tickAutoContinue, 1000);
    // Resume ordinary incremental indexing automatically only AFTER the user
    // authorized and completed the first full index. Never auto-consent.
    window.setTimeout(() => backgroundSyncConversationList(), 3000);
    // On tab restart, expired running leases and elapsed rate-limit pauses can
    // be reclaimed. Manual, authentication, and consecutive-failure pauses stay paused.
    window.setInterval(() => recoverIndexTasks().catch(error => log('Index recovery failed:', error.message)), 15000);
    recoverIndexTasks().catch(error => log('Initial index recovery failed:', error.message));
    window.setInterval(() => recoverExportTasks().catch(error => log('Export recovery failed:', error.message)), 15000);
    recoverExportTasks().catch(error => log('Initial export recovery failed:', error.message));
    window.addEventListener('resize', () => {
      placeLauncher();
      placeCurrentChatExportButton();
      positionTimelinePanel();
      syncConversationMinimap();
    });
    S.ready = true;
    ensureCurrentChatExportButton();
    syncConversationMinimap();
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
