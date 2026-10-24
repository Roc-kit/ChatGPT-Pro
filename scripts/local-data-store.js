/** ChatGPT Pro – account-scoped, lossless IndexedDB storage (MV3 worker). */
globalThis.ChatGPTProLocalData = (() => {
  'use strict';

  const DB_NAME = 'ChatGPTProSearch';
  const DB_VERSION = 2;
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
        const logs = db.objectStoreNames.contains(STORES.logs)
          ? tx.objectStore(STORES.logs)
          : db.createObjectStore(STORES.logs, { keyPath: 'id', autoIncrement: true });
        ensureIndex(logs, 'createdAt', 'createdAt');
        ensureIndex(logs, 'byAccount', 'accountId');

        // Copy before leaving the upgrade transaction. Legacy records remain
        // readable even if a future migration or consumer fails.
        if (event.oldVersion < DB_VERSION) {
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
      const writes = [requested(stores[STORES.accounts].put({ id: accountId, lastSeenAt: Date.now() }))];
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
      if (raw?.complete && raw.dataVersion === entry.dataVersion) {
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
    // or neither. Missing derived index invalidates any older one.
    return transaction([STORES.conversations, STORES.search], 'readwrite', async stores => {
      const writes = [requested(stores[STORES.conversations].put(record))];
      writes.push(requested(search
        ? stores[STORES.search].put(search)
        : stores[STORES.search].delete([accountId, id])));
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

  async function getLegacyMetadata() {
    return transaction([LEGACY_SEARCH, STORES.search], 'readonly', async stores => {
      const [legacyCount, unassignedCount] = await Promise.all([
        requested(stores[LEGACY_SEARCH].count()),
        requested(stores[STORES.search].index('byAccount').count(IDBKeyRange.only(UNASSIGNED_ACCOUNT)))
      ]);
      return { legacyCount, unassignedCount };
    });
  }

  return Object.freeze({
    openDb, upsertDirectory, getDirectory, putSearchRecord, getSearchMetadata, getSearchRecords, clearSearchIndex,
    putConversation, getConversation, getStats, getLegacyMetadata,
    DB_NAME, DB_VERSION, LEGACY_SEARCH, UNASSIGNED_ACCOUNT, STORES
  });
})();
