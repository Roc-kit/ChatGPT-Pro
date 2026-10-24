/** ChatGPT Pro – account-scoped, lossless IndexedDB storage (MV3 worker). */
globalThis.ChatGPTProLocalData = (() => {
  'use strict';

  const DB_NAME = 'ChatGPTProSearch';
  const DB_VERSION = 4;
  // Version 1 stored full-text results here without an account identifier.
  // Keep it intact; never infer the owner of these records from the current login.
  const LEGACY_SEARCH = 'conversations';
  const UNASSIGNED_ACCOUNT = '__legacy_unassigned__';
  const STORES = Object.freeze({
    accounts: 'accounts',
    directory: 'directory',
    conversations: 'conversationData',
    search: 'searchIndex',
    tasks: 'tasks',
    taskVolumes: 'taskVolumes',
    taskVolumeChunks: 'taskVolumeChunks',
    logs: 'logs'
  });

  function ensureIndex(store, name, keyPath, options) {
    if (!store.indexNames.contains(name)) store.createIndex(name, keyPath, options);
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = event => {
        const db = request.result;
        const tx = request.transaction;
        const legacy = db.objectStoreNames.contains(LEGACY_SEARCH)
          ? tx.objectStore(LEGACY_SEARCH)
          : db.createObjectStore(LEGACY_SEARCH, { keyPath: 'id' });
        ensureIndex(legacy, 'updateTime', 'updateTime');
        ensureIndex(legacy, 'indexedAt', 'indexedAt');

        if (!db.objectStoreNames.contains(STORES.accounts)) {
          db.createObjectStore(STORES.accounts, { keyPath: 'id' });
        }
        for (const name of [STORES.directory, STORES.conversations, STORES.search]) {
          const store = db.objectStoreNames.contains(name)
            ? tx.objectStore(name)
            : db.createObjectStore(name, { keyPath: ['accountId', 'id'] });
          ensureIndex(store, 'byAccount', 'accountId');
          ensureIndex(store, 'byAccountUpdateTime', ['accountId', 'updateTime']);
          if (name === STORES.directory) ensureIndex(store, 'byAccountRemoteState', ['accountId', 'remoteState']);
        }
        const tasks = db.objectStoreNames.contains(STORES.tasks)
          ? tx.objectStore(STORES.tasks)
          : db.createObjectStore(STORES.tasks, { keyPath: 'id' });
        ensureIndex(tasks, 'byAccount', 'accountId');
        ensureIndex(tasks, 'byAccountStatus', ['accountId', 'status']);
        const volumes = db.objectStoreNames.contains(STORES.taskVolumes)
          ? tx.objectStore(STORES.taskVolumes)
          : db.createObjectStore(STORES.taskVolumes, { keyPath: ['taskId', 'volume'] });
        ensureIndex(volumes, 'byAccount', 'accountId');
        if (!db.objectStoreNames.contains(STORES.taskVolumeChunks)) {
          db.createObjectStore(STORES.taskVolumeChunks, { keyPath: ['taskId', 'volume', 'index'] });
        }
        const logs = db.objectStoreNames.contains(STORES.logs)
          ? tx.objectStore(STORES.logs)
          : db.createObjectStore(STORES.logs, { keyPath: 'id', autoIncrement: true });
        ensureIndex(logs, 'createdAt', 'createdAt');
        ensureIndex(logs, 'byAccount', 'accountId');

        // Copy before leaving the upgrade transaction. Legacy records remain
        // readable even if a future migration or consumer fails.
        // The legacy search copy belongs specifically to v1 -> v2. Later
        // schema upgrades must not overwrite previously reviewed unassigned
        // records with another copy of the original legacy search.
        if (event.oldVersion < 2) {
          const destination = tx.objectStore(STORES.search);
          const cursorRequest = legacy.openCursor();
          cursorRequest.onsuccess = () => {
            const cursor = cursorRequest.result;
            if (!cursor) return;
            const source = cursor.value;
            if (source?.id) {
              destination.put({
                ...source,
                accountId: UNASSIGNED_ACCOUNT,
                id: String(source.id),
                dataVersion: normalizeTime(source.updateTime),
                origin: 'legacy-unassigned'
              });
            }
            cursor.continue();
          };
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };
      request.onerror = () => reject(request.error || new Error('无法打开本地数据缓存'));
      request.onblocked = () => reject(new Error('旧版数据库连接仍在使用，请重新打开 ChatGPT 标签页'));
    });
  }

  function requested(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB 请求失败'));
    });
  }

  async function transaction(storeNames, mode, operation) {
    const db = await openDb();
    try {
      const tx = db.transaction(storeNames, mode);
      const stores = Object.fromEntries(storeNames.map(name => [name, tx.objectStore(name)]));
      const done = new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onabort = () => reject(tx.error || new Error('IndexedDB 事务已中止'));
        tx.onerror = () => reject(tx.error || new Error('IndexedDB 事务失败'));
      });
      const result = await operation(stores);
      await done;
      return result;
    } finally {
      db.close();
    }
  }

  function validateAccount(accountId) {
    if (typeof accountId !== 'string' || !accountId.trim() || accountId === UNASSIGNED_ACCOUNT) {
      throw new Error('必须提供明确的账号 ID；旧索引不能自动归属给当前账号');
    }
    return accountId;
  }

  function validateId(id) {
    if (typeof id !== 'string' || !id.trim()) throw new Error('缺少对话 ID');
    return id;
  }

  function normalizeTime(value) {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) return Math.round(num < 1e10 ? num * 1000 : num);
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function validateRaw(raw, id) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)
        || !raw.mapping || typeof raw.mapping !== 'object' || Array.isArray(raw.mapping)) {
      throw new Error('对话 JSON 不完整，未写入缓存');
    }
    if (raw.id && raw.id !== id && raw.conversation_id !== id) {
      throw new Error('原始 JSON 与请求的对话 ID 不一致');
    }
  }

  async function upsertDirectory(accountId, items) {
    validateAccount(accountId);
    if (!Array.isArray(items)) throw new Error('目录应为数组');
    const clean = items.map(item => {
      const id = validateId(item?.id);
      return {
        accountId, id,
        title: String(item.title || 'Untitled conversation'),
        createTime: item.createTime ?? null,
        updateTime: normalizeTime(item.updateTime),
        href: String(item.href || `/c/${id}`),
        projectId: item.projectId || null,
        projectName: String(item.projectName || ''),
        remoteState: 'online',
        checkedAt: Date.now()
      };
    });
    return transaction([STORES.accounts, STORES.directory], 'readwrite', async stores => {
      const account = await requested(stores[STORES.accounts].get(accountId));
      const writes = [requested(stores[STORES.accounts].put({
        ...account, id: accountId, lastSeenAt: Date.now()
      }))];
      for (const entry of clean) writes.push(requested(stores[STORES.directory].put(entry)));
      await Promise.all(writes);
      return { saved: clean.length };
    });
  }

  async function getDirectory(accountId) {
    validateAccount(accountId);
    const records = await transaction([STORES.directory], 'readonly', stores =>
      requested(stores[STORES.directory].index('byAccount').getAll(IDBKeyRange.only(accountId))));
    return records.sort((a, b) => (b.updateTime || 0) - (a.updateTime || 0));
  }

  async function getDirectoryRecord(accountId, id) {
    validateAccount(accountId);
    validateId(id);
    return transaction([STORES.directory], 'readonly', stores =>
      requested(stores[STORES.directory].get([accountId, id])));
  }

  function cleanSearchRecord(accountId, record, origin = 'text-only') {
    validateAccount(accountId);
    const id = validateId(record?.id);
    if (!Array.isArray(record.messages)) throw new Error('索引记录缺少消息数组');
    const updateTime = normalizeTime(record.updateTime);
    return {
      accountId, id, updateTime, dataVersion: updateTime,
      origin, indexedAt: Date.now(),
      title: String(record.title || 'Untitled conversation'),
      href: String(record.href || `/c/${id}`),
      messages: record.messages.map(message => ({
        id: String(message?.id || ''), role: String(message?.role || ''),
        text: String(message?.text || ''), createTime: normalizeTime(message?.createTime) || 0
      })).filter(message => message.text)
    };
  }

  async function putSearchRecord(accountId, record) {
    const entry = cleanSearchRecord(accountId, record);
    // Prevent a later text-only write from overwriting a newer raw-derived index.
    return transaction([STORES.conversations, STORES.search], 'readwrite', async stores => {
      const raw = await requested(stores[STORES.conversations].get([accountId, entry.id]));
      if (raw?.complete && raw.dataVersion !== entry.dataVersion) {
        throw new Error('全文索引版本与完整 JSON 不一致，请重新索引');
      }
      if (raw?.complete) {
        const existing = await requested(stores[STORES.search].get([accountId, entry.id]));
        if (existing?.origin === 'raw') return { indexedAt: existing.indexedAt, reused: true };
      }
      await requested(stores[STORES.search].put(entry));
      return { indexedAt: entry.indexedAt, reused: false };
    });
  }

  async function getSearchMetadata(accountId) {
    validateAccount(accountId);
    const records = await transaction([STORES.search], 'readonly', stores =>
      requested(stores[STORES.search].index('byAccount').getAll(IDBKeyRange.only(accountId))));
    return records.map(record => ({ id: record.id, updateTime: record.updateTime, indexedAt: record.indexedAt }));
  }

  async function getSearchRecords(accountId) {
    validateAccount(accountId);
    return transaction([STORES.search], 'readonly', stores =>
      requested(stores[STORES.search].index('byAccount').getAll(IDBKeyRange.only(accountId))));
  }

  async function clearSearchIndex(accountId) {
    validateAccount(accountId);
    return transaction([STORES.search], 'readwrite', stores => new Promise((resolve, reject) => {
      let removed = 0;
      const cursorRequest = stores[STORES.search].index('byAccount').openCursor(IDBKeyRange.only(accountId));
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (!cursor) { resolve({ removed }); return; }
        cursor.delete();
        removed++;
        cursor.continue();
      };
      cursorRequest.onerror = () => reject(cursorRequest.error || new Error('无法清理当前账号索引'));
    }));
  }

  async function putConversation(accountId, { id, raw, updateTime, searchRecord = null }) {
    validateAccount(accountId);
    validateId(id);
    validateRaw(raw, id);
    const dataVersion = normalizeTime(updateTime ?? raw.update_time ?? raw.updated_at);
    if (searchRecord && (!Array.isArray(searchRecord.messages) || (searchRecord.id && searchRecord.id !== id))) {
      throw new Error('搜索索引与原始对话不一致');
    }
    const savedAt = Date.now();
    const record = { accountId, id, raw, updateTime: dataVersion, dataVersion, savedAt, complete: true };
    const search = searchRecord && {
      ...cleanSearchRecord(accountId, { ...searchRecord, id, updateTime: dataVersion }),
      origin: 'raw', indexedAt: savedAt
    };
    // A single transaction either commits raw JSON and its matching index,
    // or neither. Preserve an existing text-only index only when its version
    // exactly matches this raw record; otherwise remove the stale version.
    return transaction([STORES.conversations, STORES.search], 'readwrite', async stores => {
      const previousRaw = await requested(stores[STORES.conversations].get([accountId, id]));
      // Indexing can finish after another tab has saved a newer revision.
      // Never roll either the complete JSON or its derived index backward.
      if (previousRaw?.complete && previousRaw.dataVersion != null &&
          (dataVersion == null || previousRaw.dataVersion > dataVersion)) {
        throw new Error('已有更新版本的完整 JSON，拒绝覆盖旧数据');
      }
      const previousIndex = search ? null : await requested(stores[STORES.search].get([accountId, id]));
      const writes = [requested(stores[STORES.conversations].put(record))];
      if (search) writes.push(requested(stores[STORES.search].put(search)));
      else if (!previousIndex || previousIndex.dataVersion !== dataVersion || dataVersion === null) {
        writes.push(requested(stores[STORES.search].delete([accountId, id])));
      }
      await Promise.all(writes);
      return { saved: true, dataVersion, indexed: Boolean(search) };
    });
  }

  async function getConversation(accountId, id, expectedUpdateTime) {
    validateAccount(accountId);
    validateId(id);
    const item = await transaction([STORES.conversations], 'readonly', stores =>
      requested(stores[STORES.conversations].get([accountId, id])));
    const expected = normalizeTime(expectedUpdateTime);
    const versionMatches = expectedUpdateTime === undefined || (expected !== null && item?.dataVersion === expected);
    if (!item?.complete || !versionMatches) {
      return { hit: false, stale: Boolean(item), dataVersion: item?.dataVersion ?? null };
    }
    return { hit: true, stale: false, dataVersion: item.dataVersion, raw: item.raw, savedAt: item.savedAt };
  }

  async function getStats(accountId) {
    validateAccount(accountId);
    return transaction([STORES.directory, STORES.conversations, STORES.search], 'readonly', async stores => {
      const range = IDBKeyRange.only(accountId);
      const [directory, complete, indexed] = await Promise.all([
        requested(stores[STORES.directory].index('byAccount').count(range)),
        requested(stores[STORES.conversations].index('byAccount').count(range)),
        requested(stores[STORES.search].index('byAccount').count(range))
      ]);
      return { directory, complete, indexed };
    });
  }

  async function getIndexPolicy(accountId) {
    validateAccount(accountId);
    const account = await transaction([STORES.accounts], 'readonly', stores =>
      requested(stores[STORES.accounts].get(accountId)));
    return {
      consentAt: account?.fullIndexConsentAt || null,
      initialCompletedAt: account?.initialIndexCompletedAt || null
    };
  }

  async function grantIndexConsent(accountId) {
    validateAccount(accountId);
    return transaction([STORES.accounts], 'readwrite', async stores => {
      const store = stores[STORES.accounts];
      const account = await requested(store.get(accountId)) || { id: accountId };
      account.fullIndexConsentAt ||= Date.now();
      await requested(store.put(account));
      return { consentAt: account.fullIndexConsentAt,
        initialCompletedAt: account.initialIndexCompletedAt || null };
    });
  }

  async function recordFullDirectoryScan(accountId, records) {
    validateAccount(accountId);
    if (!Array.isArray(records)) throw new Error('首次全量目录快照必须是数组');
    const snapshot = records.map(item => ({
      id: validateId(item?.id), updateTime: normalizeTime(item.updateTime)
    }));
    if (new Set(snapshot.map(item => item.id)).size !== snapshot.length) {
      throw new Error('首次全量目录快照含重复 ID');
    }
    return transaction([STORES.accounts], 'readwrite', async stores => {
      const store = stores[STORES.accounts];
      const account = await requested(store.get(accountId));
      if (!account?.fullIndexConsentAt) throw new Error('未授权首次全量索引');
      account.fullDirectoryScannedAt = Date.now();
      account.firstIndexSnapshot = snapshot;
      await requested(store.put(account));
      return { fullDirectoryScannedAt: account.fullDirectoryScannedAt, total: snapshot.length };
    });
  }

  async function finishInitialIndex(accountId) {
    validateAccount(accountId);
    return transaction([STORES.accounts, STORES.search, STORES.tasks], 'readwrite', async stores => {
      const accountStore = stores[STORES.accounts];
      const account = await requested(accountStore.get(accountId));
      if (!account?.fullIndexConsentAt) throw new Error('尚未授权首次全量索引');
      if (!account?.fullDirectoryScannedAt || account.fullDirectoryScannedAt < account.fullIndexConsentAt) {
        throw new Error('尚未完成可验证的首次全量目录扫描');
      }
      if (!Array.isArray(account.firstIndexSnapshot)) throw new Error('缺少已核实的全量目录快照');
      const directory = account.firstIndexSnapshot;
      const indexed = await requested(stores[STORES.search].index('byAccount').getAll(IDBKeyRange.only(accountId)));
      const byId = new Map(indexed.map(entry => [entry.id, entry]));
      const missing = directory.filter(record => {
        const entry = byId.get(record.id);
        return !entry || entry.dataVersion !== normalizeTime(record.updateTime);
      });
      const openTasks = await requested(stores[STORES.tasks].index('byAccount').getAll(IDBKeyRange.only(accountId)));
      if (openTasks.some(task => task.type === 'index' && ['pending', 'running', 'paused'].includes(task.status))) {
        throw new Error('首次索引任务仍在执行或暂停');
      }
      if (missing.length) return { completed: false, remaining: missing.length, total: directory.length };
      account.initialIndexCompletedAt ||= Date.now();
      delete account.firstIndexSnapshot;
      await requested(accountStore.put(account));
      return { completed: true, remaining: 0, total: directory.length,
        initialCompletedAt: account.initialIndexCompletedAt };
    });
  }

  async function getLegacyMetadata() {
    return transaction([LEGACY_SEARCH, STORES.search], 'readonly', async stores => {
      const [legacyCount, unassignedCount] = await Promise.all([
        requested(stores[LEGACY_SEARCH].count()),
        requested(stores[STORES.search].index('byAccount').count(IDBKeyRange.only(UNASSIGNED_ACCOUNT)))
      ]);
      return { legacyCount, unassignedCount };
    });
  }

  const TASK_LEASE_MS = 30 * 1000;
  const TASK_TYPES = new Set(['index', 'export-md', 'export-json']);

  function cleanTaskItems(items) {
    if (!Array.isArray(items) || !items.length) throw new Error('任务内容不能为空');
    const seen = new Set();
    return items.map(item => {
      const id = validateId(item?.id);
      if (seen.has(id)) throw new Error('任务存在重复的对话 ID');
      seen.add(id);
      return {
        id, title: String(item.title || '').slice(0, 300),
        updateTime: normalizeTime(item.updateTime),
        href: String(item.href || `/c/${id}`),
        projectId: item.projectId || null, projectName: String(item.projectName || '')
      };
    });
  }

  async function createTask(accountId, type, items, options = {}) {
    validateAccount(accountId);
    if (!TASK_TYPES.has(type)) throw new Error('不支持的任务类型');
    const records = cleanTaskItems(items);
    const now = Date.now();
    const task = {
      id: crypto.randomUUID(), accountId, type, items: records,
      status: 'pending', nextIndex: 0, successCount: 0, failureCount: 0,
      errors: [], createdAt: now, updatedAt: now, lease: null, generation: 0,
      options: { checkLatest: options.checkLatest === true }
    };
    // A per-account type singleton prevents two tabs from each creating a
    // different active task before either can observe the other's taskList.
    return transaction([STORES.tasks], 'readwrite', async stores => {
      const store = stores[STORES.tasks];
      const existing = await requested(store.index('byAccount').getAll(IDBKeyRange.only(accountId)));
      const current = existing.find(item => item.type === type &&
        ['pending', 'running', 'paused'].includes(item.status));
      if (current) return current;
      await requested(store.add(task));
      return task;
    });
  }

  async function getTask(accountId, id) {
    validateAccount(accountId);
    validateId(id);
    const task = await transaction([STORES.tasks], 'readonly', stores => requested(stores[STORES.tasks].get(id)));
    return task?.accountId === accountId ? task : null;
  }

  async function listTasks(accountId) {
    validateAccount(accountId);
    const items = await transaction([STORES.tasks], 'readonly', stores =>
      requested(stores[STORES.tasks].index('byAccount').getAll(IDBKeyRange.only(accountId))));
    return items.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  function ensureLease(task, owner, token, now) {
    if (!task || task.status !== 'running' || !task.lease ||
        task.lease.owner !== owner || task.lease.token !== token || task.lease.expiresAt <= now) {
      throw new Error('任务租约已失效，拒绝旧执行器写入');
    }
  }

  async function mutateTask(accountId, id, handler) {
    validateAccount(accountId);
    validateId(id);
    return transaction([STORES.tasks], 'readwrite', async stores => {
      const store = stores[STORES.tasks];
      const task = await requested(store.get(id));
      if (!task || task.accountId !== accountId) throw new Error('找不到当前账号任务');
      const result = await handler(task, Date.now(), store);
      if (result?.changed) {
        task.updatedAt = Date.now();
        await requested(store.put(task));
      }
      return { task, ...result, changed: undefined };
    });
  }

  async function claimTask(accountId, id, owner) {
    validateId(owner);
    return mutateTask(accountId, id, async (task, now, store) => {
      if (['paused', 'completed', 'failed', 'canceled'].includes(task.status)) return { acquired: false };
      if (task.lease && task.lease.expiresAt > now && task.lease.owner !== owner) return { acquired: false };
      // An account may have several queued task types but only one active
      // executor. The compound status index and claim share the same IDB
      // readwrite transaction, so competing tabs cannot both acquire work.
      const running = await requested(store.index('byAccountStatus').getAll(
        IDBKeyRange.only([accountId, 'running'])
      ));
      if (running.some(other => other.id !== id && other.lease?.expiresAt > now)) {
        return { acquired: false, reason: 'account-busy' };
      }
      if (task.lease?.owner === owner && task.lease.expiresAt > now) {
        task.lease.expiresAt = now + TASK_LEASE_MS;
        return { acquired: true, token: task.lease.token, changed: true };
      }
      task.generation++;
      task.lease = { owner, token: crypto.randomUUID(), expiresAt: now + TASK_LEASE_MS };
      task.status = 'running';
      return { acquired: true, token: task.lease.token, changed: true };
    });
  }

  async function heartbeatTask(accountId, id, owner, token) {
    return mutateTask(accountId, id, (task, now) => {
      ensureLease(task, owner, token, now);
      task.lease.expiresAt = now + TASK_LEASE_MS;
      return { changed: true };
    });
  }

  async function checkpointTask(accountId, id, owner, token, itemIndex, outcome, error = '') {
    if (!['success', 'failed'].includes(outcome)) throw new Error('无效的任务结果');
    return mutateTask(accountId, id, (task, now) => {
      ensureLease(task, owner, token, now);
      if (itemIndex !== task.nextIndex || itemIndex >= task.items.length) throw new Error('任务检查点顺序不正确');
      task.nextIndex++;
      if (outcome === 'success') task.successCount++;
      else {
        task.failureCount++;
        task.errors.push({ id: task.items[itemIndex].id, message: String(error).slice(0, 500) });
      }
      if (task.nextIndex === task.items.length) {
        task.status = 'completed';
        task.lease = null;
      }
      return { changed: true };
    });
  }

  async function controlTask(accountId, id, action) {
    if (!['pause', 'resume', 'cancel'].includes(action)) throw new Error('无效的任务操作');
    return mutateTask(accountId, id, task => {
      if (['completed', 'failed', 'canceled'].includes(task.status)) return { changed: false };
      if (action === 'pause' && ['running', 'pending'].includes(task.status)) task.status = 'paused';
      else if (action === 'resume' && task.status === 'paused') task.status = 'pending';
      else if (action === 'cancel') task.status = 'canceled';
      else return { changed: false };
      task.lease = null;
      task.generation++;
      return { changed: true };
    });
  }

  /** Persist the ZIP blob and its end-of-volume checkpoint atomically.
   *  The task can resume without claiming an already prepared/downloaded part;
   *  a browser download is not proof that Chrome actually saved the file.
   */
  async function saveExportVolume(accountId, id, owner, token, payload) {
    validateAccount(accountId);
    validateId(id);
    if (!(payload?.blob instanceof Blob) || payload.blob.size === 0) throw new Error('分卷 ZIP 内容为空');
    if (typeof payload.filename !== 'string' || !payload.filename.endsWith('.zip')) throw new Error('分卷文件名无效');
    if (!Array.isArray(payload.entries) || !payload.entries.length) throw new Error('分卷清单不能为空');
    return transaction([STORES.tasks, STORES.taskVolumes], 'readwrite', async stores => {
      const taskStore = stores[STORES.tasks];
      const task = await requested(taskStore.get(id));
      if (!task || task.accountId !== accountId || !task.type.startsWith('export-')) {
        throw new Error('无权写入该导出任务');
      }
      ensureLease(task, owner, token, Date.now());
      const from = task.nextIndex;
      const to = payload.toIndex;
      if (!Number.isInteger(to) || to <= from || to > task.items.length ||
          payload.entries.length !== to - from || payload.volume !== (task.volumeCount || 0) + 1) {
        throw new Error('分卷进度或编号不正确');
      }
      for (let index = 0; index < payload.entries.length; index++) {
        const entry = payload.entries[index];
        if (entry.id !== task.items[from + index].id || !['success', 'failed'].includes(entry.status)) {
          throw new Error('分卷清单与任务快照不符');
        }
      }
      const key = [id, payload.volume];
      if (await requested(stores[STORES.taskVolumes].get(key))) throw new Error('已有同编号分卷');
      const record = {
        accountId, taskId: id, volume: payload.volume, filename: payload.filename,
        blob: payload.blob, createdAt: Date.now(), fromIndex: from, toIndex: to
      };
      await requested(stores[STORES.taskVolumes].add(record));
      task.exportEntries ||= [];
      for (const entry of payload.entries) {
        const safe = {
          id: entry.id, title: String(entry.title || '').slice(0, 300),
          status: entry.status, volume: payload.volume,
          filename: entry.status === 'success' ? String(entry.filename || '') : null,
          bytes: entry.status === 'success' ? Number(entry.bytes || 0) : 0,
          ...(entry.status === 'failed' ? { error: String(entry.error || '').slice(0, 500) } : {})
        };
        task.exportEntries.push(safe);
        if (safe.status === 'success') task.successCount++;
        else {
          task.failureCount++;
          task.errors.push({ id: safe.id, message: safe.error });
        }
      }
      task.volumeCount = payload.volume;
      task.nextIndex = to;
      task.updatedAt = Date.now();
      if (to === task.items.length) { task.status = 'completed'; task.lease = null; }
      await requested(taskStore.put(task));
      return { nextIndex: task.nextIndex, volumeCount: task.volumeCount, status: task.status };
    });
  }

  async function getExportVolume(accountId, taskId, volume) {
    validateAccount(accountId);
    validateId(taskId);
    if (!Number.isInteger(volume) || volume < 1) throw new Error('无效的分卷编号');
    const record = await transaction([STORES.taskVolumes], 'readonly', stores =>
      requested(stores[STORES.taskVolumes].get([taskId, volume])));
    return record?.accountId === accountId ? record : null;
  }

  async function clearCompletedExportVolumes(accountId, id) {
    validateAccount(accountId);
    validateId(id);
    return transaction([STORES.tasks, STORES.taskVolumes, STORES.taskVolumeChunks], 'readwrite', async stores => {
      const taskStore = stores[STORES.tasks];
      const task = await requested(taskStore.get(id));
      if (!task || task.accountId !== accountId || !task.type.startsWith('export-')) {
        throw new Error('当前账号下没有该导出任务');
      }
      if (!['completed', 'canceled', 'failed'].includes(task.status)) {
        throw new Error('请先取消或结束任务，再清理已保存的 ZIP 分卷');
      }
      let deleted = 0;
      const eraseRange = (store, range, count) => new Promise((resolve, reject) => {
        const cursorRequest = store.openCursor(range);
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) return resolve();
          if (count) deleted++;
          cursor.delete();
          cursor.continue();
        };
        cursorRequest.onerror = () => reject(cursorRequest.error || new Error('ZIP 清理失败'));
      });
      await eraseRange(stores[STORES.taskVolumes],
        IDBKeyRange.bound([id, 1], [id, Number.MAX_SAFE_INTEGER]), true);
      await eraseRange(stores[STORES.taskVolumeChunks],
        IDBKeyRange.bound([id, 1, 0], [id, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]), false);
      task.volumesClearedAt = Date.now();
      task.updatedAt = Date.now();
      await requested(taskStore.put(task));
      return { deleted, volumesClearedAt: task.volumesClearedAt };
    });
  }

  async function readExportVolumeChunk(accountId, taskId, volume, offset, size = 256 * 1024) {
    if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(size) || size < 1 || size > 512 * 1024) {
      throw new Error('ZIP 下载区间无效');
    }
    const record = await getExportVolume(accountId, taskId, volume);
    if (!record) throw new Error('找不到已保存的分卷');
    const bytes = new Uint8Array(await record.blob.slice(offset, offset + size).arrayBuffer());
    let binary = '';
    for (let at = 0; at < bytes.length; at += 32768) {
      binary += String.fromCharCode(...bytes.subarray(at, at + 32768));
    }
    return { base64: btoa(binary), size: record.blob.size, offset, read: bytes.length,
      filename: record.filename };
  }

  async function uploadExportChunk(accountId, id, owner, token, volume, index, base64) {
    validateAccount(accountId);
    if (!Number.isInteger(volume) || volume < 1 || !Number.isInteger(index) || index < 0) {
      throw new Error('分卷上传索引无效');
    }
    if (typeof base64 !== 'string' || base64.length > 1024 * 1024 ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(base64) || !base64.length) {
      throw new Error('ZIP 分块编码无效');
    }
    return transaction([STORES.tasks, STORES.taskVolumeChunks], 'readwrite', async stores => {
      const task = await requested(stores[STORES.tasks].get(id));
      if (!task || task.accountId !== accountId || !task.type.startsWith('export-')) throw new Error('无权上传分卷');
      ensureLease(task, owner, token, Date.now());
      if (volume !== (task.volumeCount || 0) + 1) throw new Error('分卷上传序号错误');
      await requested(stores[STORES.taskVolumeChunks].put({ taskId: id, volume, index, token, base64 }));
      return { uploaded: true };
    });
  }

  async function finalizeExportChunks(accountId, id, owner, token, payload) {
    validateAccount(accountId);
    if (!Number.isInteger(payload?.chunkCount) || payload.chunkCount < 1 || payload.chunkCount > 8192) {
      throw new Error('ZIP 分块数无效');
    }
    // Read all staged chunks in order. Each chunk has been serialized as a
    // bounded JSON string; finalizing does not depend on the MV3 worker
    // remaining alive between upload messages.
    const bytes = await transaction([STORES.tasks, STORES.taskVolumeChunks], 'readonly', async stores => {
      const task = await requested(stores[STORES.tasks].get(id));
      if (!task || task.accountId !== accountId) throw new Error('无法读取导出任务');
      ensureLease(task, owner, token, Date.now());
      const parts = [];
      for (let index = 0; index < payload.chunkCount; index++) {
        const chunk = await requested(stores[STORES.taskVolumeChunks].get([id, payload.volume, index]));
        if (!chunk || chunk.token !== token) throw new Error('ZIP 分块未完整上传');
        const decoded = atob(chunk.base64);
        const bytes = new Uint8Array(decoded.length);
        for (let at = 0; at < decoded.length; at++) bytes[at] = decoded.charCodeAt(at);
        parts.push(bytes);
      }
      return parts;
    });
    const result = await saveExportVolume(accountId, id, owner, token, {
      ...payload, blob: new Blob(bytes, { type: 'application/zip' })
    });
    // Staging is not authoritative after the ZIP/cursor transaction committed.
    // A cleanup failure can leave harmless partial chunks but cannot roll back
    // a successfully persisted ZIP.
    await transaction([STORES.taskVolumeChunks], 'readwrite', stores => new Promise((resolve, reject) => {
      const range = IDBKeyRange.bound([id, payload.volume, 0], [id, payload.volume, Number.MAX_SAFE_INTEGER]);
      const request = stores[STORES.taskVolumeChunks].openCursor(range);
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return resolve();
        cursor.delete();
        cursor.continue();
      };
      request.onerror = () => reject(request.error || new Error('ZIP 上传暂存清理失败'));
    })).catch(() => {});
    return result;
  }

  const DETAIL_LEASE_MS = 45000;

  async function changeRequestState(accountId, handler) {
    validateAccount(accountId);
    return transaction([STORES.accounts], 'readwrite', async stores => {
      const store = stores[STORES.accounts];
      const state = await requested(store.get(accountId)) || { id: accountId };
      const outcome = handler(state, Date.now());
      if (outcome.changed) await requested(store.put(state));
      return { ...outcome, changed: undefined };
    });
  }

  async function acquireDetailSlot(accountId, owner) {
    validateId(owner);
    return changeRequestState(accountId, (state, now) => {
      const until = Number(state.cooldownUntil || 0);
      if (until > now) return { granted: false, reason: 'cooldown', waitMs: until - now, cooldownUntil: until };
      const lease = state.detailLease;
      if (lease?.expiresAt > now) {
        return { granted: false, reason: 'busy', waitMs: Math.min(1500, lease.expiresAt - now) };
      }
      const token = crypto.randomUUID();
      state.detailLease = { owner, token, expiresAt: now + DETAIL_LEASE_MS };
      return { granted: true, token, changed: true };
    });
  }

  async function heartbeatDetailSlot(accountId, owner, token) {
    return changeRequestState(accountId, (state, now) => {
      if (state.detailLease?.owner !== owner || state.detailLease?.token !== token ||
          state.detailLease.expiresAt <= now) throw new Error('详情请求租约已失效');
      state.detailLease.expiresAt = now + DETAIL_LEASE_MS;
      return { renewed: true, changed: true };
    });
  }

  async function releaseDetailSlot(accountId, owner, token, status, retryAfterMs) {
    return changeRequestState(accountId, (state, now) => {
      if (state.detailLease?.owner !== owner || state.detailLease?.token !== token) {
        throw new Error('详情请求租约已失效，拒绝修改共享冷却');
      }
      state.detailLease = null;
      if (status === 429) {
        const failures = Math.min(8, Number(state.rateLimitStreak || 0) + 1);
        state.rateLimitStreak = failures;
        const provided = Number(retryAfterMs);
        const delay = Number.isFinite(provided) && provided > 0
          ? Math.min(provided, 24 * 60 * 60 * 1000)
          : Math.min(5 * 60 * 1000, 60000 * 2 ** (failures - 1));
        state.cooldownUntil = Math.max(state.cooldownUntil || 0, now + delay);
      } else if (status === 200) {
        state.rateLimitStreak = 0;
      }
      return { released: true, cooldownUntil: state.cooldownUntil || 0, changed: true };
    });
  }

  async function getDetailSlotStatus(accountId) {
    validateAccount(accountId);
    const state = await transaction([STORES.accounts], 'readonly', stores =>
      requested(stores[STORES.accounts].get(accountId)));
    return { cooldownUntil: state?.cooldownUntil || 0, busyUntil: state?.detailLease?.expiresAt || 0 };
  }

  const LOG_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
  const LOG_TYPES = new Set(['task', 'request', 'rate-limit', 'retry', 'failure']);

  async function addLog(accountId, entry) {
    validateAccount(accountId);
    if (!LOG_TYPES.has(entry?.type)) throw new Error('不支持的日志类型');
    const createdAt = Date.now();
    const log = {
      accountId, createdAt, type: entry.type,
      taskId: typeof entry.taskId === 'string' ? entry.taskId.slice(0, 100) : null,
      code: typeof entry.code === 'string' ? entry.code.slice(0, 40) : null,
      message: typeof entry.message === 'string' ? entry.message.slice(0, 300) : '',
      retryAt: Number.isFinite(entry.retryAt) ? entry.retryAt : null
    };
    return transaction([STORES.logs], 'readwrite', async stores => {
      const store = stores[STORES.logs];
      const id = await requested(store.add(log));
      const expired = store.index('createdAt').openCursor(IDBKeyRange.upperBound(createdAt - LOG_RETENTION_MS, true));
      await new Promise((resolve, reject) => {
        expired.onsuccess = () => {
          const cursor = expired.result;
          if (!cursor) return resolve();
          cursor.delete();
          cursor.continue();
        };
        expired.onerror = () => reject(expired.error || new Error('日志保留期清理失败'));
      });
      return { id, createdAt };
    });
  }

  async function listLogs(accountId, limit = 100) {
    validateAccount(accountId);
    const bounded = Math.max(1, Math.min(500, Number(limit) || 100));
    const logs = await transaction([STORES.logs], 'readonly', stores =>
      requested(stores[STORES.logs].index('byAccount').getAll(IDBKeyRange.only(accountId))));
    return logs.sort((a, b) => b.createdAt - a.createdAt || b.id - a.id).slice(0, bounded);
  }

  return Object.freeze({
    openDb, upsertDirectory, getDirectory, getDirectoryRecord,
    putSearchRecord, getSearchMetadata, getSearchRecords, clearSearchIndex,
    putConversation, getConversation, getStats, getLegacyMetadata,
    getIndexPolicy, grantIndexConsent, recordFullDirectoryScan, finishInitialIndex,
    createTask, getTask, listTasks, claimTask, heartbeatTask, checkpointTask, controlTask,
    saveExportVolume, getExportVolume,
    clearCompletedExportVolumes,
    readExportVolumeChunk, uploadExportChunk, finalizeExportChunks,
    acquireDetailSlot, heartbeatDetailSlot, releaseDetailSlot, getDetailSlotStatus,
    addLog, listLogs,
    DB_NAME, DB_VERSION, LEGACY_SEARCH, UNASSIGNED_ACCOUNT, STORES
  });
})();
