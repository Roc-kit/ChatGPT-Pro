/** Verify independently authored translations for the most-used interface controls. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadLocales, localeNames } = require('./load-locales.cjs');

const environment = { navigator: { language: 'en' }, chrome: {
  i18n: { getUILanguage: () => 'en' }
} };
environment.window = environment;
const i18n = loadLocales(environment);
const keys = environment.ChatGPTProReviewedLocaleKeys;
const packs = environment.ChatGPTProLocalePacks;
const sources = JSON.parse(fs.readFileSync(path.join(__dirname, '../scripts/locales/keys.json'), 'utf8'));

assert.equal(new Set(keys).size, keys.length, 'reviewed keys cannot contain duplicates');
const inactiveLegacyKeys = [
  'ui.initializing_51a08fb',
  'ui.settings',
  'ui.timestampSize',
  'ui.small',
  'ui.medium',
  'ui.large',
  'ui.refresh',
  'ui.checkingForUpdates',
  'ui.startingImageDownloads',
  'ui.noTasksForThisAccount',
  'ui.allProjects',
  'ui.permanentlyRemoveThisLocalOnlyChatFromJSON',
  'ui.initialIndexingPreparationInterrupted',
  'ui.directorySyncFailedCheckSignInOrTry',
  'ui.indexPausedAfterRepeatedFailures',
  'ui.bulkRequestsEnteredSharedCooldown',
  'ui.bulkTaskItemFailed',
  'ui.taskStatusChanged',
  'ui.cannotClearLegacyIndex',
  'ui.cannotClearCurrentAccountIndex'
];
for (const key of inactiveLegacyKeys) {
  assert(!keys.includes(key), `${key} is not an active user-facing UI string`);
  assert(!Object.hasOwn(sources, key), `${key} is excluded from the canonical locale catalog`);
  for (const [locale, pack] of Object.entries(packs)) {
    assert(!Object.hasOwn(pack, key), `${key} is excluded from the ${locale} locale pack`);
  }
}

// Every key explicitly referenced by runtime code or a dynamic UI template
// must remain in the reviewed set. Catalog coverage alone is not enough.
const runtimeFiles = [
  'popup/popup.html', 'popup/popup.js', 'scripts/i18n.js',
  'scripts/content-chatgpt.js', 'scripts/api-handler.js',
  'scripts/chatgpt-dom-adapter.js', 'scripts/background.js',
  'scripts/local-data-store.js'
];
const runtimeKeyReferences = new Set();
for (const file of runtimeFiles) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  for (const key of Object.keys(sources)) {
    if (source.includes(key)) runtimeKeyReferences.add(key);
  }
}
for (const variants of environment.ChatGPTProDynamicMessageKeys) {
  for (const key of Object.values(variants)) runtimeKeyReferences.add(key);
}
for (const key of runtimeKeyReferences) {
  assert(keys.includes(key), `runtime-referenced key is not reviewed: ${key}`);
}
const placeholders = text => [...text.matchAll(/\{[a-z][a-z0-9_]*\}/gi)].map(m => m[0]).sort();

for (const locale of localeNames.filter(locale => !['zh-CN', 'en'].includes(locale))) {
  i18n.setLanguage(locale);
  for (const key of keys) {
    assert(sources[key], `reviewed key has no canonical source: ${key}`);
    assert.equal(typeof packs[locale][key], 'string', `${locale}/${key} missing`);
    assert(packs[locale][key].trim(), `${locale}/${key} is empty`);
    assert.deepEqual(placeholders(packs[locale][key]), placeholders(sources[key]),
      `${locale}/${key} has broken interpolation`);
    assert.equal(i18n.t(key), packs[locale][key], `${locale}/${key} not applied`);
  }
}
const samples = [
  ['ja', 'ui.collapseMinimap', 'ナビゲーションを折りたたむ'],
  ['ja', 'ui.pausedAfterRepeatedFailures', '連続エラーで一時停止中。手動で再開してください'],
  ['es', 'ui.downloadAllConversationImagesZIP', 'Descargar todas las imágenes de esta conversación (ZIP)'],
  ['fr', 'ui.indexDataManagement', 'Gestion de l’index et des données'],
  ['pt-BR', 'ui.archive', 'Arquivar'],
  ['ru', 'ui.conversations', 'Список чатов'],
  ['ar', 'ui.collapseMinimap', 'طي شريط التنقل'],
  ['id', 'ui.fullTextSearch', 'Pencarian teks lengkap'],
  ['hi', 'ui.delete', 'मिटाएँ'],
  ['bn', 'ui.fullTextSearch', 'সম্পূর্ণ টেক্সটে খুঁজুন'],
  ['zh-TW', 'ui.indexDataManagement', '索引與資料管理'],
  ['es', 'ui.fullTextIndexCache', 'Índice de texto completo y caché'],
  ['ja', 'ui.initialIndexingConsentRequired', '初回インデックス（許可が必要）'],
  ['fr', 'ui.downloadPreviouslySavedZIPPartsAgain', 'Retélécharger les dernières parties ZIP enregistrées'],
  ['pt-BR', 'ui.localDataCountForThisAccount', 'Dados locais da conta atual'],
  ['es', 'ui.localOnlyConfirmedRemoteDeletion', 'Solo local · eliminación oficial confirmada'],
  ['fr', 'ui.exportThisConversationAsMarkdown', 'Exporter ce chat au format Markdown'],
  ['zh-TW', 'ui.remoteStatusNotVerified', '遠端狀態待核實'],
  ['id', 'ui.failedToDownloadSavedZIPParts', 'Gagal mengunduh bagian ZIP yang tersimpan'],
  ['ja', 'ui.accountSwitchedSearchAgain', 'アカウントが切り替わりました。もう一度検索してください'],
  ['es', 'ui.fullLocalPreview', 'Vista previa local completa'],
  ['fr', 'ui.hideLocalPreview', 'Masquer l’aperçu local'],
  ['ja', 'ui.deleteLocalCopy', 'ローカルコピーを削除'],
  ['hi', 'ui.noMatchingResults', 'कोई परिणाम नहीं मिला'],
  ['ja', 'ui.conversationMinimap_0e4e39b', '長いチャットをすばやく移動（Minimap）'],
  ['es', 'ui.collapseConversationsDragToMove', 'Contraer lista de chats (arrastrable)'],
  ['fr', 'ui.titleMatch', 'Correspondance dans le titre'],
  ['ar', 'ui.unnamedProject', 'مشروع بلا اسم'],
  ['id', 'ui.locallyStored', 'Sudah tersimpan secara lokal'],
  ['ja', 'ui.returnedDataIsNotAnImage', '取得したデータは画像ではありません'],
  ['es', 'ui.noAccessibleImagesInTheCurrentConversationBranch',
    'No se encontraron imágenes accesibles en esta rama de la conversación'],
  ['fr', 'ui.imageExceeds80MiBLimit', 'Une image dépasse la limite de téléchargement de 80 MiB'],
  ['id', 'ui.chatgptDidNotProvideADownloadableImageURL',
    'ChatGPT tidak menyediakan tautan untuk mengunduh gambar'],
  ['ja', 'ui.accountChangedVerifyTheRemoteOperationResult',
    'ログイン中のアカウントが切り替わりました。リモート側の操作結果を確認してください'],
  ['es', 'ui.accountChangedDetailCacheWriteCanceled',
    'Ha cambiado la cuenta; se ha cancelado la escritura de detalles en caché'],
  ['fr', 'ui.unableToVerifyChatGPTAccountStoppedReadingAccount',
    'Impossible de vérifier le compte ChatGPT connecté ; la lecture de son cache a été arrêtée'],
  ['pt-BR', 'ui.authenticationErrorTaskPaused',
    'Problema de login ou permissão; tarefa pausada'],
  ['ja', 'ui.initialDirectoryEndedEarlyCompletenessCannotBeVerified',
    '初回のチャット一覧のページ取得が途中で終了したため、一覧の完全性を確認できません'],
  ['es', 'ui.initialIndexingRequiresExplicitConsent',
    'La primera indexación de texto completo requiere tu autorización expresa'],
  ['fr', 'ui.repeatedProjectCursorStoppedToPreventALoop',
    'Le curseur de pagination du projet se répète ; opération arrêtée pour éviter une boucle'],
  ['zh-TW', 'ui.completeInitialIndexingFirst', '請先完成首次全文索引'],
  ['es', 'ui.bulkExportFailed', 'Error en la exportación por lotes'],
  ['fr', 'ui.cancelOrFinishTheTaskBeforeClearingSaved',
    'Annulez ou terminez la tâche avant de supprimer les parties ZIP enregistrées'],
  ['ja', 'ui.failedItemsVariable', '失敗した項目：\n{items}'],
  ['pt-BR', 'ui.noSavedZIPPartsForThisTask', 'Não há partes ZIP salvas para esta tarefa'],
  ['ja', 'ui.conversationJSONIncompleteNotCached',
    '会話の JSON が不完全なため、キャッシュに保存されませんでした'],
  ['es', 'ui.indexVersionDoesNotMatchFullJSONRebuild',
    'La versión del índice de texto completo no coincide con el JSON completo. Reconstruye el índice.'],
  ['fr', 'ui.activeOrPendingTasksExistPauseOrCancel',
    'Des tâches sont en cours ou en attente pour ce compte. Mettez-les en pause ou annulez-les avant le nettoyage.'],
  ['id', 'ui.newerFullJSONExistsRefusingToOverwriteWith',
    'JSON lengkap yang lebih baru sudah tersedia. Data lama tidak digunakan untuk menimpanya.'],
  ['ar', 'ui.anExplicitAccountIDIsRequiredLegacyIndex',
    'يلزم تحديد معرّف الحساب صراحةً؛ لا يمكن إسناد إدخالات الفهرس القديم إلى الحساب الحالي تلقائيًا.'],
  ['pt-BR', 'ui.automaticIndexingNotEnabledForThisAccount',
    'A indexação automática de texto completo não está ativada para esta conta'],
  ['zh-TW', 'ui.fullTextSearchFailed', '全文搜尋失敗'],
  ['ja', 'status.chatgptOperationFailedHTTP', 'ChatGPT の操作に失敗しました：HTTP {1}'],
  ['es', 'status.completedChats', 'Completado · {1} conversaciones'],
  ['fr', 'status.syncFailedLocalDataRetained',
    'Échec de la synchronisation ; les données locales sont conservées : {1}'],
  ['es', 'status.archiveCompletedSucceededFailedClickForFailures',
    'Archivado completado: {2} correctos, {3} fallidos (haz clic para ver los errores)'],
  ['ja', 'status.deletePermanentlyCompletedSucceededFailed',
    '完全削除完了：成功 {2} 件、失敗 {3} 件'],
  ['es', 'ui.completeJSONNotStoredLocallyOnlyASearch',
    'El JSON original completo no está guardado localmente; solo hay fragmentos de búsqueda y no se puede mostrar la vista previa completa.'],
  ['fr', 'ui.unableToReadCompleteLocalContent', 'Impossible de lire le contenu local complet'],
  ['ja', 'ui.completeJSONNotSavedLocallyRemoteDeletionCanceled',
    '完全な JSON がローカルに保存されていないため、クラウド上のチャットは削除していません。'],
  ['ja', 'ui.indexingIsRunningInAnotherTab', '別のタブでインデックス作成が実行中です。'],
  ['es', 'ui.indexPausedResumeItInTaskManager', 'La indexación está en pausa. Reanúdala desde el gestor de tareas.'],
  ['id', 'ui.succeeded', 'Berhasil'],
  ['ru', 'ui.taskNotFoundForCurrentAccount_3826111', 'Задача для текущей учётной записи не найдена'],
  ['ja', 'ui.invalidTaskOperation_d3e0539', '無効なタスク操作です']
];

// Bulk archive/delete templates have both progress and completion variants.
// Check all placeholder slots, including legacy variants with capture group 1
// reserved for the operation name.
const archiveDeleteTemplates = [
  ['status.archivingSucceededFailed', [1, 2, 3, 4]],
  ['status.deletingSucceededFailed', [1, 2, 3, 4]],
  ['status.archivingSucceededFailed_65', [2, 3, 4, 5]],
  ['status.deletingSucceededFailed_65', [2, 3, 4, 5]],
  ['status.archiveCompletedSucceededFailed', [2, 3]],
  ['status.archiveCompletedSucceededFailedClickForFailures', [2, 3]],
  ['status.deletePermanentlyCompletedSucceededFailed', [2, 3]],
  ['status.deletePermanentlyCompletedSucceededFailedClickFor', [2, 3]],
  ['status.stopped', [1, 2]],
  ['status.status_68', [1, 2, 3, 4]]
];
for (const locale of localeNames.filter(locale => !['zh-CN', 'en'].includes(locale))) {
  i18n.setLanguage(locale);
  for (const [key, expectedSlots] of archiveDeleteTemplates) {
    const slots = [...packs[locale][key].matchAll(/\{(\d+)\}/g)]
      .map(match => Number(match[1])).sort((a, b) => a - b);
    assert.deepEqual(slots, expectedSlots,
      `${locale}/${key}: archive/delete placeholders changed`);
  }
}
const archiveDeleteStatuses = [
  ['status.archivingSucceededFailed', '正在归档 3 / 10 · 成功 2、失败 1',
    { 1: '3', 2: '10', 3: '2', 4: '1' }],
  ['status.deletingSucceededFailed', '正在永久删除 3 / 10 · 成功 2、失败 1',
    { 1: '3', 2: '10', 3: '2', 4: '1' }],
  ['status.archiveCompletedSucceededFailed', '归档完成：成功 2、失败 1', { 2: '2', 3: '1' }],
  ['status.archiveCompletedSucceededFailedClickForFailures',
    '归档完成：成功 2、失败 1（点击查看失败清单）', { 2: '2', 3: '1' }],
  ['status.deletePermanentlyCompletedSucceededFailed',
    '永久删除完成：成功 2、失败 1', { 2: '2', 3: '1' }],
  ['status.deletePermanentlyCompletedSucceededFailedClickFor',
    '永久删除完成：成功 2、失败 1（点击查看失败清单）', { 2: '2', 3: '1' }],
  ['status.stopped', '归档中止：reason-42', { 1: '归档', 2: 'reason-42' }],
  ['status.status_68', '2/5 · 用户：reason-42',
    { 1: '2', 2: '5', 3: '用户', 4: 'reason-42' }]
];
for (const locale of localeNames.filter(locale => !['zh-CN', 'en'].includes(locale))) {
  i18n.setLanguage(locale);
  for (const [key, source, values] of archiveDeleteStatuses) {
    const template = packs[locale][key];
    const expected = template.replace(/\{(\d+)\}/g, (_, index) => i18n.t(values[index]));
    assert.equal(i18n.translateText(source), expected,
      `${locale}/${key}: archive/delete status did not use its reviewed translation`);
  }
}

// Dynamic directory/index/task statuses are matched against Chinese source
// text at runtime. Verify their translated templates and capture placeholders.
const dynamicIndexTaskStatuses = [
  ['status.repeatedPaginationCursorForProject', '项目 Project-A 分页游标重复', { 1: 'Project-A' }],
  ['status.emptyPageButMoreCursorResultsFor', '项目 Project-B 分页为空但仍有后续游标', { 1: 'Project-B' }],
  ['status.chatgptOperationFailedHTTP', 'ChatGPT 操作失败：HTTP 429', { 1: '429' }],
  ['status.unableToReadCompleteLocalContent', '无法读取本地完整内容：local file unavailable', { 1: 'local file unavailable' }],
  ['status.failedToPrepareInitialIndex', '首次索引准备失败：network timeout', { 1: 'network timeout' }],
  ['status.group', '3 / 10 · 第 1 / 2 组', { 1: '3', 2: '10', 3: '1', 4: '2' }],
  ['status.chats', 'Label-X · 4 条', { 1: 'Label-X', 2: '4' }],
  ['status.accountChatsUnassignedLegacyEntries', '当前账号 119 条 · 未归属旧索引 104 条', { 1: '119', 2: '104' }],
  ['status.accountChats', '当前账号 119 条', { 1: '119' }],
  ['status.requestSubmitted', 'Action-X操作已提交', { 1: 'Action-X' }],
  ['status.taskUnavailable', '任务不可用：network unavailable', { 1: 'network unavailable' }],
  ['status.removedEntriesFromThisAccountOtherData', '已从当前账号清除 3 条record；其他数据保持不变', { 1: '3', 2: 'record' }],
  ['status.indexingRequestedKeepChatGPTOpenAndCheck', '已请求开始索引；请保持 ChatGPT 标签页打开，稍后刷新进度', {}],
  ['status.completedChats', '完成 · 4 条聊天记录', { 1: '4' }],
  ['status.backgroundSyncComplete', 'Label-X · 已完成后台增量同步', { 1: 'Label-X' }],
  ['status.syncFailedLocalDataRetained', '同步失败，已保留本地数据：network timeout', { 1: 'network timeout' }]
];
for (const locale of localeNames.filter(locale => !['zh-CN', 'en'].includes(locale))) {
  i18n.setLanguage(locale);
  for (const [key, source, values] of dynamicIndexTaskStatuses) {
    const template = packs[locale][key];
    const slots = [...template.matchAll(/\{(\d+)\}/g)].map(match => Number(match[1]));
    assert.deepEqual(slots.sort((a, b) => a - b),
      Object.keys(values).map(Number).sort((a, b) => a - b),
      `${locale}/${key}: dynamic status placeholders changed`);
    const expected = template.replace(/\{(\d+)\}/g, (_, index) => values[index]);
    const actual = key === 'status.indexingRequestedKeepChatGPTOpenAndCheck'
      ? i18n.t(key) : i18n.translateText(source);
    assert.equal(actual, expected,
      `${locale}/${key}: dynamic task status does not use its reviewed translation`);
  }
}
for (const [locale, key, expected] of samples) {
  i18n.setLanguage(locale);
  assert.equal(i18n.t(key), expected, `${locale}/${key} lost its reviewed UI translation`);
}
for (const locale of localeNames.filter(locale => !['zh-CN', 'en'].includes(locale))) {
  i18n.setLanguage(locale);
  const confirmation = i18n.format('ui.variableVariableSelectedConversationsVariableThisMayTake',
    { action: i18n.t('ui.delete'), count: 3,
      detail: i18n.t('ui.deletingConversationsInChatGPTCannotBeUndoneThe') });
  assert(confirmation.includes('3') && !confirmation.includes('{count}') && !confirmation.includes('⏎'),
    `${locale}: delete confirmation is not properly interpolated`);
  assert(confirmation.includes('\n\n'), `${locale}: delete warning lost its paragraph separation`);
}
// These six indexing statuses are generated dynamically from Chinese source
// templates. Confirm the actual runtime translation, not just catalog coverage.
const indexStatuses = [
  ['status.indexedForThisAccountUnassignedLegacyEntries',
    '当前账号已索引 119 / 119 个 · 未归属旧索引 104 个', ['119', '119', '104']],
  ['status.updatingIndex', '正在更新索引 7/12', ['7/12']],
  ['status.addedUpdatedFailed', '新增/更新 7 个，失败 2 个', ['7', '2']],
  ['status.chatsRemainToBeIndexedResumeTo', '首次索引仍有 5 条待补全，可再次继续', ['5']],
  ['status.indexUpToDateUpdatedSkipped', '索引已是最新 · 更新 7 个，跳过 20 个', ['7', '20']],
  ['status.localChatsCheckingForUpdates', '本地已有 119 条，正在增量检查最新数据…', ['119']]
];
for (const locale of localeNames.filter(locale => !['zh-CN', 'en'].includes(locale))) {
  i18n.setLanguage(locale);
  for (const [key, source, values] of indexStatuses) {
    const template = packs[locale][key];
    const captures = [...template.matchAll(/\{(\d+)\}/g)].map(match => Number(match[1]));
    assert.deepEqual(captures.slice().sort((a, b) => a - b),
      values.map((_, index) => index + 1),
      `${locale}/${key}: numbered variables were lost or duplicated`);
    const rendered = template.replace(/\{(\d+)\}/g, (_, number) => values[Number(number) - 1]);
    assert.equal(i18n.translateText(source), rendered,
      `${locale}/${key}: actual dynamic index status differs from reviewed translation`);
  }
}
// ZIP parts are saved locally before Chrome downloads complete. Confirm both
// optional message variants and the exact runtime-facing Chinese source text.
const zipStatuses = [
  ['status.succeededFailedZIPParts', '3 / 10 · 成功 2 · 失败 1 · ZIP 4 卷',
    { 1: '3', 2: '10', 3: '2', 4: '1', 5: '4' }],
  ['status.succeededFailed', '3 / 10 · 成功 2 · 失败 1',
    { 1: '3', 2: '10', 3: '2', 4: '1' }],
  ['status.succeededFailedZIPParts', '3/10 · 成功 2 · 失败 1 · ZIP 4 卷',
    { 1: '3', 2: '10', 3: '2', 4: '1', 5: '4' }],
  ['status.succeededFailed', '3/10 · 成功 2 · 失败 1',
    { 1: '3', 2: '10', 3: '2', 4: '1' }],
  ['status.startedZIPPartDownloadsCheckBrowserDownloads',
    '已发起 4 个分卷下载，请检查浏览器下载提示', { 1: '4' }],
  ['status.deletedSavedZIPPartsOriginalChatCache',
    '已清理 4 个本地 ZIP 分卷，原始聊天缓存和任务历史仍保留', { 1: '4' }],
  ['status.zipPartSavedAndDownloadStarted', '第 2 个 ZIP 已保存并发起下载 · 8 / 20',
    { 1: '2', 3: '8', 4: '20' }],
  ['status.zipPartSaved', '第 2 个 ZIP 已保存 · 8 / 20',
    { 1: '2', 3: '8', 4: '20' }],
  ['status.savedZIPPartsSucceededFailedVerifyBrowser',
    '已持久化 4 卷 · 成功 2 个、失败 1 个（浏览器下载需单独确认）',
    { 1: '4', 2: '2', 3: '1' }],
  ['status.downloadingSavedZIPPart',
    '已发起下载 2 / 4 卷（最近一次导出任务）', { 1: '2', 2: '4' }],
  ['status.zipParts', '导出任务 2 · ZIP 4 卷', { 1: '导出任务 2', 2: '4' }],
  ['status.exporting', '正在导出 report.csv', { 1: 'report.csv' }]
];
for (const locale of localeNames.filter(locale => !['zh-CN', 'en'].includes(locale))) {
  i18n.setLanguage(locale);
  for (const [key, source, args] of zipStatuses) {
    const template = packs[locale][key];
    const slots = [...template.matchAll(/\{(\d+)\}/g)].map(match => Number(match[1]));
    assert.deepEqual(slots.sort((a, b) => a - b),
      Object.keys(args).map(Number).sort((a, b) => a - b),
      `${locale}/${key}: ZIP status placeholders missing, duplicated, or changed`);
    const rendered = template.replace(/\{(\d+)\}/g, (_, index) => args[index]);
    assert.equal(i18n.translateText(source), rendered,
      `${locale}/${key}: ZIP status does not use its reviewed translation`);
  }
}
// Shared cooldown and retry statuses used by both indexing and bulk export.
// Nested progress summaries must be translated without changing their counts.
const retryStatuses = [
  ['status.retrying', '正在重试 2 / 5 · 3 / 10 · 第 1 / 2 组',
    { 1: '2', 2: '5', 3: '3 / 10 · 第 1 / 2 组' }, true],
  ['status.rateLimitCooldownUntil', '请求限流冷却中，至 10:30:00',
    { 1: '10:30:00' }],
  ['status.rateLimitedResumeInS', '请求受限，15 秒后继续 · 3 / 10 · 第 1 / 2 组',
    { 1: '15', 2: '3 / 10 · 第 1 / 2 组' }, true],
  ['status.batchCompleteContinueInS', '本组完成，15 秒后继续 · 3 / 10 · 第 1 / 2 组',
    { 1: '15', 2: '3 / 10 · 第 1 / 2 组' }, true],
  ['status.requestFailedRetryInS', '请求失败，15 秒后重试 · 3 / 10 · 第 1 / 2 组',
    { 1: '15', 2: '3 / 10 · 第 1 / 2 组' }, true],
  ['status.rateLimitedResumeInS_24', '请求受限 · 15 秒后继续 · 3 / 10 · 第 1 / 2 组',
    { 1: '15', 2: '3 / 10 · 第 1 / 2 组' }, true],
  ['status.batchCompleteContinueInS_25', '本组完成 · 15 秒后继续 · 3 / 10 · 第 1 / 2 组',
    { 1: '15', 2: '3 / 10 · 第 1 / 2 组' }, true],
  ['status.requestFailedRetryInS_26', '请求失败 · 15 秒后重试 2 / 3 · 3 / 10 · 第 1 / 2 组',
    { 1: '15', 2: '2', 3: '3', 4: '3 / 10 · 第 1 / 2 组' }, true],
  ['status.requestCooldownSRemainingAutomaticResume',
    '账号请求冷却中 · 剩余 15 秒 · 到期后可自动继续', { 1: '15' }],
  ['status.sRemaining', ' · 还需 15 秒', { 1: '15' }]
];
for (const locale of localeNames.filter(locale => !['zh-CN', 'en'].includes(locale))) {
  i18n.setLanguage(locale);
  for (const [key, source, args, hasNestedProgress] of retryStatuses) {
    const values = { ...args };
    const template = packs[locale][key];
    const slots = [...template.matchAll(/\{(\d+)\}/g)].map(match => Number(match[1]));
    assert.deepEqual(slots.slice().sort((a, b) => a - b),
      Object.keys(args).map(Number).sort((a, b) => a - b),
      `${locale}/${key}: retry/cooldown placeholders changed`);
    if (hasNestedProgress) {
      const nestedKey = key === 'status.retrying' ? 3
        : key === 'status.requestFailedRetryInS_26' ? 4 : 2;
      values[nestedKey] = i18n.translateText(args[nestedKey]);
    }
    const rendered = template.replace(/\{(\d+)\}/g, (_, index) => values[index] ?? '');
    // These two fragments are appended to an existing status line; the
    // leading space belongs to the caller, not to the translated fragment.
    const expected = ['status.sRemaining', 'status.resuming'].includes(key)
      ? ` ${rendered}` : rendered;
    assert.equal(i18n.translateText(source), expected,
      `${locale}/${key}: actual retry/cooldown status differs from reviewed translation`);
  }
}
// These literal fragments resolve through their own stable keys before the
// dynamic matcher runs. Check the exact source text that the UI appends.
const cooldownFragments = [
  [' · 等待账号限流冷却', 'ui.waitingForAccountRateLimitCooldown_4cb2540'],
  [' · 等待结束，正在恢复', 'ui.resumingAfterWait_586dda0']
];
for (const locale of localeNames.filter(locale => !['zh-CN', 'en'].includes(locale))) {
  i18n.setLanguage(locale);
  for (const [source, key] of cooldownFragments) {
    assert.equal(i18n.translateText(source), ` ${packs[locale][key]}`,
      `${locale}/${key}: appended cooldown fragment did not use the reviewed translation`);
  }
}
// Image-download status text is generated dynamically. Verify actual
// translation and numeric placeholders, not just the language bundle rows.
const imageStatuses = [
  ['status.imageDownloadHTTP', '图片下载 HTTP 403', { 1: '403' }],
  ['status.imageZIPReadySucceededFailedParts',
    '图片 ZIP 已生成：成功 3，失败 1；共 2 卷', { 1: '3', 2: '1', 3: '2' }],
  ['status.downloadingImages', '正在下载图片 2 / 5', { 1: '2', 2: '5' }],
  ['status.savingImageZIP', '正在保存图片 ZIP 1 / 2', { 1: '1', 2: '2' }]
];
for (const locale of localeNames.filter(locale => !['zh-CN', 'en'].includes(locale))) {
  i18n.setLanguage(locale);
  for (const [key, original, args] of imageStatuses) {
    const template = packs[locale][key];
    const captures = [...template.matchAll(/\{(\d+)\}/g)].map(match => Number(match[1]));
    assert.deepEqual(captures.sort((a, b) => a - b),
      Object.keys(args).map(Number).sort((a, b) => a - b),
      `${locale}/${key}: image progress variables changed`);
    const expected = template.replace(/\{(\d+)\}/g, (_, index) => args[index]);
    assert.equal(i18n.translateText(original), expected,
      `${locale}/${key}: image download status does not use reviewed translation`);
  }
}

// Final dynamic status templates use the exact wildcard matches from i18n.js.
const finalDynamicStatuses = [
  ['status.authorizeToBuildAFullTextIndex',
    '首次建立全文索引需点击授权；不会自动抓取正文。已有索引可搜索 · 当前 119 条', { 1: '119' }],
  ['status.select', '选择 导出', { 1: '导出' }],
  ['status.filterByTitle', '标题筛选：example title', { 1: 'example title' }],
  ['status.select_41', '已选 4', { 1: '4' }],
  ['status.chats_42', '4 条聊天记录', { 1: '4' }],
  ['status.chats_43', '4 条 · 导出', { 1: '4', 2: '导出' }],
  ['status.status', '导出失败：network timeout',
    { 1: '导出失败', 2: 'network timeout' }],
  ['status.failedToOpenChatGPT', '打开 ChatGPT 失败：network timeout',
    { 1: 'network timeout' }],
  ['status.inProgress', '导出中…', { 1: '导出' }],
  ['status.failed', '全文索引失败：network timeout',
    { 1: '全文索引', 2: 'network timeout' }],
  ['status.failedToUpdateAutomaticIndexing', '自动更新设置失败：network timeout',
    { 1: 'network timeout' }],
  ['status.indexStartFailed', '索引启动失败：network timeout', { 1: 'network timeout' }],
  ['status.incrementalSyncComplete', 'Batch-A · 已完成增量同步', { 1: 'Batch-A' }]
];
const sourceKeyByValue = new Map(Object.entries(sources).map(([key, value]) => [value, key]));
for (const locale of localeNames.filter(locale => !['zh-CN', 'en'].includes(locale))) {
  i18n.setLanguage(locale);
  for (const [key, source, values] of finalDynamicStatuses) {
    const template = packs[locale][key];
    const slots = [...template.matchAll(/\{(\d+)\}/g)].map(match => Number(match[1]));
    assert.deepEqual(slots.sort((a, b) => a - b),
      Object.keys(values).map(Number).sort((a, b) => a - b),
      `${locale}/${key}: final status placeholders changed`);
    const expected = template.replace(/\{(\d+)\}/g, (_, index) => {
      const value = values[index];
      const sourceKey = sourceKeyByValue.get(value);
      return sourceKey ? i18n.t(sourceKey) : value;
    });
    assert.equal(i18n.translateText(source), expected,
      `${locale}/${key}: final dynamic status does not use its reviewed translation`);
  }
  assert.equal(i18n.translateText('无权写入该导出任务'),
    packs[locale]['ui.notAllowedToWriteThisExportTask'],
    `${locale}/status.notAllowedToWrite: fixed export-task permission error was not translated`);
  assert.deepEqual([...packs[locale]['status.notAllowedToWrite'].matchAll(/\{(\d+)\}/g)]
    .map(match => Number(match[1])), [1],
  `${locale}/status.notAllowedToWrite: status template placeholder changed`);
}
// Low-level request failures must retain diagnostic status, endpoint and code.
const diagnosticURL = 'https://chatgpt.com/backend-api/conversations?offset=0&limit=100';
for (const locale of localeNames) {
  i18n.setLanguage(locale);
  assert.equal(i18n.translateText(`HTTP 429: ${diagnosticURL}`),
    packs[locale]['ui.httpRequestFailed'].replace('{status}', '429').replace('{url}', diagnosticURL),
    `${locale}: HTTP failures must be translated without losing the endpoint`);
  assert.equal(i18n.translateText('Session 403'),
    packs[locale]['ui.sessionRequestFailed'].replace('{status}', '403'),
    `${locale}: session HTTP status must be translated`);
  assert.equal(i18n.translateText('401_UNAUTHORIZED'),
    `${packs[locale]['ui.requestUnauthorized']} (401_UNAUTHORIZED)`,
    `${locale}: authorization diagnostic code must be retained`);
  const translatedHttp = packs[locale]['ui.httpRequestFailed']
    .replace('{status}', '429').replace('{url}', diagnosticURL);
  const nestedHttp = i18n.translateText(`索引启动失败：HTTP 429: ${diagnosticURL}`);
  const expectedNestedHttp = locale === 'zh-CN'
    ? `索引启动失败：${translatedHttp}`
    : packs[locale]['status.indexStartFailed'].replace('{1}', translatedHttp);
  assert.equal(nestedHttp, expectedNestedHttp,
    `${locale}: nested HTTP errors must translate while preserving endpoint details`);
  const translatedSession = packs[locale]['ui.sessionRequestFailed'].replace('{status}', '403');
  const nestedSession = i18n.translateText('打开 ChatGPT 失败：Session 403');
  const expectedNestedSession = locale === 'zh-CN'
    ? `打开 ChatGPT 失败：${translatedSession}`
    : packs[locale]['status.failedToOpenChatGPT'].replace('{1}', translatedSession);
  assert.equal(nestedSession, expectedNestedSession,
    `${locale}: nested session errors must be translated`);
  const translatedUnauthorized = `${packs[locale]['ui.requestUnauthorized']} (401_UNAUTHORIZED)`;
  const nestedUnauthorized = i18n.translateText('索引启动失败：401_UNAUTHORIZED');
  const expectedNestedUnauthorized = locale === 'zh-CN'
    ? `索引启动失败：${translatedUnauthorized}`
    : packs[locale]['status.indexStartFailed'].replace('{1}', translatedUnauthorized);
  assert.equal(nestedUnauthorized, expectedNestedUnauthorized,
    `${locale}: nested authorization errors must be translated without dropping the code`);
}
const tabNotReady = 'Could not establish connection. Receiving end does not exist.';
const channelClosed = 'The message port closed before a response was received.';
const asyncChannelClosed = 'A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received';
for (const locale of localeNames) {
  i18n.setLanguage(locale);
  const notReadyTranslation = packs[locale]['ui.chatgptTabNotReadyReloadAndTryAgain'];
  const interruptedTranslation = packs[locale]['ui.chatgptTabConnectionInterruptedReloadAndTryAgain'];
  assert.equal(i18n.translateText(tabNotReady), notReadyTranslation,
    `${locale}: Chrome missing-receiver errors should become actionable UI copy`);
  assert.equal(i18n.translateText(channelClosed), interruptedTranslation,
    `${locale}: closed message ports should be translated`);
  assert.equal(i18n.translateText(asyncChannelClosed), interruptedTranslation,
    `${locale}: asynchronous message-channel errors should be translated`);
  const wrapped = i18n.translateText(`任务不可用：${tabNotReady}`);
  const expectedWrapped = locale === 'zh-CN'
    ? `任务不可用：${notReadyTranslation}`
    : packs[locale]['status.taskUnavailable'].replace('{1}', notReadyTranslation);
  assert.equal(wrapped, expectedWrapped,
    `${locale}: wrapped Popup connection errors should also be translated`);
}
console.log(`I18N_REVIEWED_PASS: ${keys.length} reviewed UI keys × 10 locales; runtime references covered`);
