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

assert.equal(keys.length, 341, 'reviewed interface, cache integrity, directory synchronization and ZIP export tasks include 341 strings');
assert.equal(new Set(keys).size, keys.length, 'reviewed keys cannot contain duplicates');
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
  ['id', 'ui.noTasksForThisAccount', 'Tidak ada tugas untuk akun ini'],
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
  ['pt-BR', 'ui.directorySyncFailedCheckSignInOrTry',
    'Falha na sincronização do diretório; confira o login ou tente novamente após a pausa'],
  ['id', 'ui.indexPausedAfterRepeatedFailures',
    'Batas kegagalan berturut-turut tercapai; tugas pengindeksan dijeda'],
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
  ['es', 'ui.completeJSONNotStoredLocallyOnlyASearch',
    'El JSON original completo no está guardado localmente; solo hay fragmentos de búsqueda y no se puede mostrar la vista previa completa.'],
  ['fr', 'ui.unableToReadCompleteLocalContent', 'Impossible de lire le contenu local complet'],
  ['ja', 'ui.completeJSONNotSavedLocallyRemoteDeletionCanceled',
    '完全な JSON がローカルに保存されていないため、クラウド上のチャットは削除していません。'],
  ['ja', 'ui.indexingIsRunningInAnotherTab', '別のタブでインデックス作成が実行中です。'],
  ['es', 'ui.indexPausedResumeItInTaskManager', 'La indexación está en pausa. Reanúdala desde el gestor de tareas.']
];
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
console.log(`I18N_REVIEWED_PASS: ${keys.length} reviewed keys × 10 locales, including cache integrity, index validation and export tasks`);
