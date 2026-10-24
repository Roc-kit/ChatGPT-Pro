/** ChatGPT Pro – ChatGPT API and persistent directory cache */

const APIHandler = (function () {
  'use strict';

  const CFG = {
    TIMEOUT_MS: 12000,
    MAX_RETRIES: 3,
    RETRY_BASE_MS: 1500,
    PAGE_SIZE: 100,
    MAX_PAGES: 30,
    MAX_PROJECT_PAGES: 50,
    MAX_PROJECTS: 100,
    INTER_PAGE_MS: 250,
    // Revalidate identity regularly: a ChatGPT tab may change signed-in users.
    TOKEN_TTL_MS: 20 * 1000,
    FETCH_LOCK_MS: 90 * 1000,
    MIN_SYNC_INTERVAL_MS: 60 * 1000
  };

  const K_DIRECTORY = 'chatgpt_pro_directory_v1';
  const K_DIRECTORY_TS = 'chatgpt_pro_directory_ts';
  const K_LOCK = 'chatgpt_pro_fetch_lock';
  const LEGACY_DIRECTORY = 'ct_directory_v2';
  const LEGACY_DIRECTORY_TS = 'ct_directory_ts';
  const LEGACY_LOCK = 'ct_fetch_lock';
  const K_ACCOUNT_DIRECTORY_TS = 'chatgpt_pro_directory_ts_account_';

  let _token = null;
  let _tokenFetchedAt = 0;
  let _accountId = null;
  let _sessionPromise = null;
  let _syncPromise = null;
  let _syncAccountId = null;
  const _conversationPromises = new Map();

  // Revalidate when a previously backgrounded tab comes back into focus.
  window.addEventListener('focus', () => { _tokenFetchedAt = 0; });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) _tokenFetchedAt = 0;
  });

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function retryAfterMs(value) {
    if (!value) return 0;
    const seconds = Number(value);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
    const date = Date.parse(value);
    return Number.isNaN(date) ? 0 : Math.max(0, date - Date.now());
  }

  const store = {
    get: keys => new Promise(resolve => {
      if (!chrome?.storage?.local) { resolve({}); return; }
      chrome.storage.local.get(keys, data => resolve(chrome.runtime.lastError ? {} : data));
    }),
    set: value => new Promise(resolve => {
      if (!chrome?.storage?.local) { resolve(); return; }
      chrome.storage.local.set(value, () => resolve());
    }),
    del: keys => new Promise(resolve => {
      if (!chrome?.storage?.local) { resolve(); return; }
      chrome.storage.local.remove(keys, () => resolve());
    })
  };

  function baseUrl() {
    return 'https://chatgpt.com/backend-api';
  }

  function timestampValue(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value < 1e10 ? value * 1000 : value;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function sameUpdate(a, b) {
    return Boolean(a && b) && timestampValue(a.updateTime) === timestampValue(b.updateTime);
  }

  async function getSessionIdentity(force = false) {
    if (!force && _token && _accountId && Date.now() - _tokenFetchedAt < CFG.TOKEN_TTL_MS) {
      return { token: _token, accountId: _accountId };
    }
    if (_sessionPromise) return _sessionPromise;
    _sessionPromise = (async () => {
      // Never fall back to email, display name or a previously cached user:
      // these are not authoritative account identifiers.
      const resp = await fetch('https://chatgpt.com/api/auth/session', {
        method: 'GET', credentials: 'include', headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      if (!resp.ok) throw new Error(`Session ${resp.status}`);
      const data = await resp.json();
      const accountId = data?.user?.id;
      const token = data?.accessToken || data?.access_token;
      if (typeof accountId !== 'string' || !accountId.trim() || !token) {
        throw new Error('ChatGPT 登录账号无法确认，已停止读取账号缓存');
      }
      const changed = _accountId && _accountId !== accountId;
      _accountId = accountId;
      _token = token;
      _tokenFetchedAt = Date.now();
      if (changed) window.dispatchEvent(new CustomEvent('chatgpt-pro-account-changed'));
      return { accountId, token };
    })();
    try { return await _sessionPromise; }
    catch (error) {
      if (_accountId) window.dispatchEvent(new CustomEvent('chatgpt-pro-account-changed'));
      _token = null;
      _accountId = null;
      _tokenFetchedAt = 0;
      throw error;
    } finally { _sessionPromise = null; }
  }

  async function getAccountId(force = false) {
    return (await getSessionIdentity(force)).accountId;
  }

  async function getToken() {
    return (await getSessionIdentity()).token;
  }

  async function fetchAuthedJson(token, url) {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), CFG.TIMEOUT_MS);
    try {
      const resp = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        signal: ctrl.signal
      });
      if (resp.status === 401) {
        if (_accountId) window.dispatchEvent(new CustomEvent('chatgpt-pro-account-changed'));
        _token = null;
        _accountId = null;
        _tokenFetchedAt = 0;
        const error = new Error('401_UNAUTHORIZED');
        error.status = 401;
        throw error;
      }
      if (!resp.ok) {
        const error = new Error(`HTTP ${resp.status}: ${url}`);
        error.status = resp.status;
        error.retryAfterMs = retryAfterMs(resp.headers.get('Retry-After'));
        throw error;
      }
      return resp.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  function projectNameFromSidebarItem(item, gizmo) {
    return gizmo?.display?.name
      || gizmo?.name
      || item?.gizmo?.display?.name
      || item?.gizmo?.name
      || item?.display?.name
      || item?.name
      || item?.title
      || '未命名项目';
  }

  function isProjectGizmoId(id) {
    return typeof id === 'string' && id.startsWith('g-p-');
  }

  function isCustomGptId(id) {
    return typeof id === 'string' && id.startsWith('g-') && !isProjectGizmoId(id);
  }

  function gizmoMetadata(data, fallbackId) {
    const gizmo = data?.gizmo?.gizmo ?? data?.gizmo ?? data;
    const id = String(gizmo?.id || fallbackId || '');
    if (!id) return null;
    return {
      id,
      shortUrl: String(gizmo?.short_url || id),
      name: String(gizmo?.display?.name || gizmo?.name || '').trim()
    };
  }

  async function fetchCustomGptMetadata(token, gizmoId) {
    const data = await fetchAuthedJson(token, `${baseUrl()}/gizmos/${encodeURIComponent(gizmoId)}`);
    return gizmoMetadata(data, gizmoId);
  }

  function recordFromItem(item, project = null) {
    const id = item?.id;
    if (!id) return null;
    const projectId = project?.id || item.gizmo_id || null;
    const shortUrl = project?.shortUrl || projectId;
    const officialDeletion = item.is_deleted === true || item.deleted === true ||
      item.status === 'deleted' || (typeof item.deleted_at === 'string' && Boolean(item.deleted_at.trim()));
    return {
      id,
      title: item.title || 'Untitled conversation',
      createTime: item.create_time ?? item.created_at ?? item.createTime ?? null,
      updateTime: item.update_time ?? item.updated_at ?? item.updateTime ?? null,
      href: projectId ? `/g/${shortUrl}/c/${id}` : `/c/${id}`,
      projectId,
      projectName: project?.name || item._chatgptProProjectName || item._chatTimelineProjectName || '',
      officialDeletion, verifiedOnline: !officialDeletion
    };
  }

  function sanitizeStoredRecord(item) {
    if (!item?.id) return null;
    return {
      id: String(item.id),
      title: String(item.title || 'Untitled conversation'),
      createTime: item.createTime ?? null,
      updateTime: item.updateTime ?? null,
      href: String(item.href || `/c/${item.id}`),
      projectId: item.projectId ? String(item.projectId) : null,
      projectName: String(item.projectName || ''),
      remoteState: item.remoteState || 'online',
      remoteStateReason: item.remoteStateReason || null,
      officialDeletion: item.officialDeletion === true,
      verifiedOnline: item.verifiedOnline === true,
      checkedAt: item.checkedAt || null
    };
  }

  async function localDataMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, response => {
        if (chrome.runtime.lastError || !response?.success) {
          reject(new Error(chrome.runtime.lastError?.message || response?.error || '本地数据读取失败'));
          return;
        }
        resolve(response);
      });
    });
  }

  async function readDirectory(accountId = null) {
    accountId ||= await getAccountId(true);
    const response = await localDataMessage({ action: 'localDataGetDirectory', accountId });
    return response.records.map(sanitizeStoredRecord).filter(Boolean);
  }

  async function writeDirectory(records, accountId = null, syncedOnly = false) {
    accountId ||= await getAccountId();
    const clean = records.map(sanitizeStoredRecord).filter(Boolean);
    clean.sort((a, b) => timestampValue(b.updateTime) - timestampValue(a.updateTime));
    // A logout/account switch during a slow sync must never attribute the
    // previous account's response to the new session.
    if (await getAccountId(true) !== accountId) throw new Error('登录账号已切换，请重新同步');
    await localDataMessage({ action: 'localDataUpsertDirectory', accountId, records: clean });
    await store.set({ [`${K_ACCOUNT_DIRECTORY_TS}${accountId}`]: Date.now() });
    // A verified initial scan must use only the IDs seen in that exhaustive
    // response, not the union of older local directory records.
    return syncedOnly ? clean : readDirectory(accountId);
  }

  function buildTimestampMap(records) {
    const map = new Map();
    for (const item of records) {
      const rec = {
        id: item.id,
        createTime: item.createTime,
        updateTime: item.updateTime,
        timestamp: item.createTime ?? item.updateTime
      };
      map.set(item.id, rec);
      if (item.id.length > 8) map.set(item.id.slice(0, 8), rec);
    }
    return map;
  }

  async function fetchRegularIncremental(token, cachedMap, forceFull, strictFull = false) {
    const changed = [];
    let offset = 0;
    let total = Infinity;
    const seenPages = strictFull ? new Set() : null;

    for (let page = 0; (strictFull || page < CFG.MAX_PAGES) && offset < total; page++) {
      const url = new URL(`${baseUrl()}/conversations`);
      url.searchParams.set('offset', String(offset));
      url.searchParams.set('limit', String(CFG.PAGE_SIZE));
      url.searchParams.set('order', 'updated');
      const data = await fetchAuthedJson(token, url.toString());
      const items = Array.isArray(data) ? data : (data.items || data.conversations || []);
      if (page === 0 && Number.isFinite(data?.total)) total = data.total;
      if (strictFull && items.length) {
        const signature = items.map(item => item.id).join('|');
        if (seenPages.has(signature)) throw new Error('完整目录出现重复分页，已停止以避免循环');
        seenPages.add(signature);
      }

      let reachedKnownBoundary = false;
      for (const item of items) {
        const rec = recordFromItem(item);
        if (!rec) continue;
        const cached = cachedMap.get(rec.id);
        if (!forceFull && sameUpdate(cached, rec) &&
            cached?.remoteState === (rec.officialDeletion ? 'local-only' : 'online')) {
          reachedKnownBoundary = true;
          break;
        }
        changed.push(rec);
      }

      if (reachedKnownBoundary) break;
      if (items.length < CFG.PAGE_SIZE) {
        if (strictFull && total !== Infinity && offset + items.length < total) {
          throw new Error('首次全量目录分页提前结束，不能确认完整');
        }
        break;
      }
      offset += CFG.PAGE_SIZE;
      await sleep(CFG.INTER_PAGE_MS);
    }
    return changed;
  }

  async function fetchProjects(token, strictFull = false) {
    const projects = [];
    let cursor = null;
    const seenCursors = strictFull ? new Set() : null;

    for (let page = 0; strictFull || page < CFG.MAX_PROJECT_PAGES; page++) {
      if (strictFull) {
        const cursorKey = cursor ?? '__start__';
        if (seenCursors.has(cursorKey)) throw new Error('项目分页游标重复，已停止以避免循环');
        seenCursors.add(cursorKey);
      }
      const url = new URL(`${baseUrl()}/gizmos/snorlax/sidebar`);
      url.searchParams.set('owned_only', 'true');
      url.searchParams.set('conversations_per_gizmo', '0');
      if (cursor) url.searchParams.set('cursor', cursor);
      const data = await fetchAuthedJson(token, url.toString());
      const items = Array.isArray(data?.items) ? data.items : [];

      for (const item of items) {
        const gizmo = item?.gizmo?.gizmo ?? item?.gizmo ?? item;
        if (!gizmo?.id || !String(gizmo.id).startsWith('g-p-')) continue;
        projects.push({
          id: String(gizmo.id),
          shortUrl: String(gizmo.short_url || item?.gizmo?.short_url || item?.short_url || gizmo.id),
          name: projectNameFromSidebarItem(item, gizmo)
        });
        if (!strictFull && projects.length >= CFG.MAX_PROJECTS) break;
      }

      cursor = data?.cursor || null;
      if (!cursor || (!strictFull && projects.length >= CFG.MAX_PROJECTS)) break;
      await sleep(CFG.INTER_PAGE_MS);
    }
    return projects;
  }

  async function fetchProjectIncremental(token, project, cachedMap, forceFull, strictFull = false) {
    const changed = [];
    let cursor = '0';
    const seenCursors = strictFull ? new Set() : null;

    for (let page = 0; strictFull || page < CFG.MAX_PROJECT_PAGES; page++) {
      if (strictFull) {
        if (seenCursors.has(cursor)) throw new Error(`项目 ${project.id} 分页游标重复`);
        seenCursors.add(cursor);
      }
      const url = new URL(`${baseUrl()}/gizmos/${encodeURIComponent(project.id)}/conversations`);
      url.searchParams.set('cursor', cursor);
      const data = await fetchAuthedJson(token, url.toString());
      const items = Array.isArray(data?.items) ? data.items : [];

      let reachedKnownBoundary = false;
      for (const item of items) {
        const rec = recordFromItem(item, project);
        if (!rec) continue;
        const cached = cachedMap.get(rec.id);
        if (!forceFull && sameUpdate(cached, rec) &&
            cached?.remoteState === (rec.officialDeletion ? 'local-only' : 'online')) {
          reachedKnownBoundary = true;
          break;
        }
        changed.push(rec);
      }

      const next = data?.cursor;
      if (strictFull && next && items.length === 0) {
        throw new Error(`项目 ${project.id} 分页为空但仍有后续游标`);
      }
      if (reachedKnownBoundary || !next || items.length === 0) break;
      cursor = String(next);
      await sleep(CFG.INTER_PAGE_MS);
    }
    return changed;
  }

  async function acquireFetchLock(accountId) {
    const owner = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const key = `${K_LOCK}:${accountId}`;
    const current = await store.get([key]);
    const lock = current[key];
    if (lock?.at && Date.now() - lock.at < CFG.FETCH_LOCK_MS) return null;
    await store.set({ [key]: { owner, at: Date.now() } });
    const verify = await store.get([key]);
    return verify[key]?.owner === owner ? owner : null;
  }

  async function releaseFetchLock(owner, accountId) {
    const key = `${K_LOCK}:${accountId}`;
    const current = await store.get([key]);
    if (current[key]?.owner === owner) await store.del([key]);
  }

  async function waitForOtherTabSync(previousTs, accountId) {
    const key = `${K_ACCOUNT_DIRECTORY_TS}${accountId}`;
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      const current = await store.get([key]);
      if ((current[key] || 0) > previousTs) return readDirectory(accountId);
    }
    return null;
  }

  async function runSync(forceFull, accountId, strictFull = false) {
    const key = `${K_ACCOUNT_DIRECTORY_TS}${accountId}`;
    const before = await store.get([key]);
    const previousTs = before[key] || 0;
    let lockOwner = await acquireFetchLock(accountId);

    if (!lockOwner) {
      const otherResult = await waitForOtherTabSync(previousTs, accountId);
      if (otherResult && !strictFull) return otherResult;
      lockOwner = await acquireFetchLock(accountId);
      if (!lockOwner && strictFull) throw new Error('另一个标签正在同步目录，无法确认首次全量扫描');
    }

    try {
      const existing = forceFull ? [] : await readDirectory(accountId);
      const cachedMap = new Map(existing.map(item => [item.id, item]));
      const resultMap = new Map(existing.map(item => [item.id, item]));

      let token = await getToken();
      for (let attempt = 0; attempt <= CFG.MAX_RETRIES; attempt++) {
        try {
          if (strictFull && attempt > 0) resultMap.clear();
          const regular = await fetchRegularIncremental(token, cachedMap, forceFull, strictFull);
          for (const rec of regular) resultMap.set(rec.id, rec);

          // /conversations exposes custom GPT conversations through gizmo_id,
          // but does not include the GPT display name. Resolve each distinct GPT
          // once and reuse that metadata for every matching conversation.
          const gptIds = new Set();
          for (const rec of regular) {
            if (isCustomGptId(rec.projectId)) gptIds.add(rec.projectId);
          }
          for (const rec of resultMap.values()) {
            if (isCustomGptId(rec.projectId) && !rec.projectName) gptIds.add(rec.projectId);
          }
          for (const gizmoId of gptIds) {
            try {
              const metadata = await fetchCustomGptMetadata(token, gizmoId);
              if (!metadata) continue;
              for (const [id, rec] of resultMap) {
                if (rec.projectId !== gizmoId) continue;
                resultMap.set(id, {
                  ...rec,
                  projectName: metadata.name || rec.projectName || 'GPT',
                  href: `/g/${metadata.shortUrl || gizmoId}/c/${id}`
                });
              }
            } catch (e) {
              console.warn(`[ChatGPT Pro] GPT ${gizmoId} metadata skipped:`, e.message);
            }
            await sleep(CFG.INTER_PAGE_MS);
          }

          const projects = await fetchProjects(token, strictFull);
          for (const project of projects) {
            try {
              const changed = await fetchProjectIncremental(token, project, cachedMap, forceFull, strictFull);
              for (const rec of changed) resultMap.set(rec.id, rec);

              // Project names can change even if conversation update_time does not.
              for (const [id, rec] of resultMap) {
                if (rec.projectId === project.id && rec.projectName !== project.name) {
                  resultMap.set(id, { ...rec, projectName: project.name, href: `/g/${project.shortUrl}/c/${id}` });
                }
              }
            } catch (e) {
              if (strictFull) throw e;
              console.warn(`[ChatGPT Pro] project ${project.id} sync skipped:`, e.message);
            }
            await sleep(CFG.INTER_PAGE_MS);
          }

          return writeDirectory([...resultMap.values()], accountId, strictFull);
        } catch (e) {
          if (e.message?.includes('登录账号已切换')) throw e;
          if (e.message === '401_UNAUTHORIZED' && attempt === 0) {
            token = await getToken();
            continue;
          }
          if (attempt >= CFG.MAX_RETRIES) throw e;
          await sleep(CFG.RETRY_BASE_MS * Math.pow(2, attempt));
        }
      }
      return writeDirectory([...resultMap.values()], accountId);
    } finally {
      if (lockOwner) await releaseFetchLock(lockOwner, accountId);
    }
  }

  async function syncConversationList(forceFull = false, options = {}) {
    // Do not return an earlier account's in-flight result after switching users.
    const expectedAccountId = await getAccountId(true);
    if (_syncPromise) {
      if (_syncAccountId !== expectedAccountId) {
        await _syncPromise.catch(() => {});
        return syncConversationList(forceFull, options);
      }
      const result = await _syncPromise;
      if (await getAccountId(true) !== expectedAccountId) throw new Error('登录账号已切换，请重新同步');
      if (options.requireComplete === true) return syncConversationList(true, options);
      return result;
    }
    if (!forceFull && options.checkLatest !== true) {
      const accountId = expectedAccountId;
      const key = `${K_ACCOUNT_DIRECTORY_TS}${accountId}`;
      const state = await store.get([key]);
      const cached = await readDirectory(accountId);
      const hasDirectory = cached.length > 0;
      const age = Date.now() - (state[key] || 0);
      if (hasDirectory && age >= 0 && age < CFG.MIN_SYNC_INTERVAL_MS) {
        return cached;
      }
    }
    _syncAccountId = expectedAccountId;
    _syncPromise = runSync(forceFull, expectedAccountId, options.requireComplete === true);
    try {
      return await _syncPromise;
    } finally {
      _syncPromise = null;
      _syncAccountId = null;
    }
  }

  async function getCachedConversationList(verifyIdentity = true) {
    return readDirectory(await getAccountId(verifyIdentity));
  }

  async function getConversationList(forceFull = false) {
    return syncConversationList(forceFull);
  }

  async function getConversationTimestamps(forceFull = false) {
    if (!forceFull) {
      const cached = await readDirectory();
      if (cached.length) return buildTimestampMap(cached);
      const initial = buildTimestampMap(await fetchInitialRegularPage());
      initial.partial = true;
      return initial;
    }
    const records = await syncConversationList(forceFull);
    return buildTimestampMap(records);
  }

  async function scheduledConversationDetail(accountId, conversationId, updateTime) {
    // Account-wide IndexedDB lease: one in-flight detail request across tabs,
    // indexing and export. A shared 429 cooldown survives page/worker restarts.
    const owner = crypto.randomUUID();
    let token;
    for (;;) {
      if (await getAccountId() !== accountId) throw new Error('登录账号已切换，详情任务已停止');
      const attempt = await localDataMessage({ action: 'detailAcquire', accountId, owner });
      if (attempt.result.granted) {
        token = attempt.result.token;
        break;
      }
      await sleep(Math.min(1500, Math.max(200, attempt.result.waitMs || 1000)));
    }
    let heartbeat;
    let status = 0;
    try {
      heartbeat = window.setInterval(() => {
        localDataMessage({ action: 'detailHeartbeat', accountId, owner, token }).catch(() => {});
      }, 10000);
      // Another tab may have populated the exact version while we waited.
      const cached = await localDataMessage({
        action: 'localDataGetConversation', accountId, id: conversationId, updateTime
      });
      if (cached.hit) return { data: cached.raw, source: 'cache' };

      const accessToken = await getToken();
      const raw = await fetchAuthedJson(accessToken, `${baseUrl()}/conversation/${encodeURIComponent(conversationId)}`);
      if (await getAccountId() !== accountId) throw new Error('登录账号已切换，已取消详情缓存写入');
      status = 200;
      try {
        await localDataMessage({ action: 'localDataPutConversation', accountId,
          record: { id: conversationId, raw, updateTime: updateTime ?? raw.update_time ?? raw.updated_at }
        });
      } catch (error) {
        console.warn('[ChatGPT Pro] Detail cache write skipped:', error.message);
      }
      return { data: raw, source: 'network' };
    } catch (error) {
      status = error?.status || 0;
      if (status === 410) {
        // Official 410 Gone is affirmative disappearance evidence. A 404 or
        // missing sidebar item is NOT sufficient (could be access/visibility).
        try {
          const result = await localDataMessage({ action: 'localDataMarkOfficialGone',
            accountId, id: conversationId });
          if (result.result?.marked) {
            const cached = await localDataMessage({ action: 'localDataGetConversation',
              accountId, id: conversationId });
            if (cached.hit) return { data: cached.raw, source: 'cache' };
          }
        } catch (markError) {
          console.warn('[ChatGPT Pro] Official 410 local retention failed:', markError.message);
        }
      }
      if (status === 429) {
        try {
          await localDataMessage({ action: 'detailRelease', accountId, owner, token,
            status, retryAfterMs: error.retryAfterMs });
          token = null;
        } catch (releaseError) {
          console.warn('[ChatGPT Pro] Cooldown persist failed:', releaseError.message);
        }
      }
      throw error;
    } finally {
      if (heartbeat) window.clearInterval(heartbeat);
      if (token) {
        await localDataMessage({ action: 'detailRelease', accountId, owner, token, status })
          .catch(error => console.warn('[ChatGPT Pro] Detail lease release failed:', error.message));
      }
    }
  }

  async function getConversation(conversationId, options = {}) {
    if (!conversationId) throw new Error('Missing conversation id');
    const accountId = await getAccountId();
    const key = JSON.stringify([accountId, conversationId]);
    let promise = _conversationPromises.get(key);
    if (!promise) {
      promise = (async () => {
      // A single-record version lookup avoids scanning the entire directory
      // once per exported conversation.
      let updateTime;
      let localOnly = false;
      try {
        const directory = await localDataMessage({
          action: 'localDataGetDirectoryRecord', accountId, id: conversationId
        });
        updateTime = directory.record?.updateTime ?? undefined;
        localOnly = directory.record?.remoteState === 'local-only';
        const cached = await localDataMessage({
          action: 'localDataGetConversation', accountId, id: conversationId,
          ...(!localOnly ? { updateTime } : {})
        });
        if (cached.hit) return { data: cached.raw, source: 'cache' };
        if (localOnly) throw new Error('仅本地对话没有可导出的完整原始 JSON');
      } catch (error) {
        if (localOnly) throw error;
        // Temporary IDB failures must not make a valid online conversation
        // impossible to export. The raw data is still fetched from ChatGPT.
        console.warn('[ChatGPT Pro] Detail cache read skipped:', error.message);
      }

      return scheduledConversationDetail(accountId, conversationId, updateTime);
      })();
      _conversationPromises.set(key, promise);
      // Removing a failed promise is important: a later retry must be able
      // to fetch afresh. Attach a handler to avoid an unhandled rejection.
      promise.then(() => {
        if (_conversationPromises.get(key) === promise) _conversationPromises.delete(key);
      }, () => {
        if (_conversationPromises.get(key) === promise) _conversationPromises.delete(key);
      });
    }
    const result = await promise;
    return options.withSource === true ? result : result.data;
  }

  async function clearCache() {
    // Force the next directory revalidation, not a destructive deletion of
    // another account's or an unassigned legacy directory.
    const accountId = await getAccountId();
    await store.del([`${K_ACCOUNT_DIRECTORY_TS}${accountId}`]);
  }

  return {
    getCachedConversationList,
    syncConversationList,
    getConversationList,
    getConversationTimestamps,
    getAccountId,
    getConversation,
    clearCache
  };
})();

if (typeof window !== 'undefined') window.APIHandler = APIHandler;
