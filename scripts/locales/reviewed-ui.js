/**
 * Model-authored interface copy, reviewed by meaning and interaction context.
 * This overlay takes precedence over earlier draft translations. No remote
 * translation requests are made by the extension.
 *
 * Values are aligned line-for-line with the stable keys in each block. Keep
 * each user-facing message on one line; tests enforce equal row counts.
 */
(function (scope) {
  'use strict';
  // These retired entries have no active runtime UI reference and have been
  // removed from the canonical locale packs. Their old translation rows are
  // still present in this line-aligned overlay, so skip them until that legacy
  // block data is regenerated; never apply them or expose them as reviewed UI.
  const inactiveLegacyKeys = new Set([
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
    'ui.unverified',
    // Backend-only logs and obsolete maintenance paths; no current UI renders them.
    'ui.initialIndexingPreparationInterrupted',
    'ui.directorySyncFailedCheckSignInOrTry',
    'ui.indexPausedAfterRepeatedFailures',
    'ui.bulkRequestsEnteredSharedCooldown',
    'ui.bulkTaskItemFailed',
    'ui.taskStatusChanged',
    'ui.cannotClearLegacyIndex',
    'ui.cannotClearCurrentAccountIndex',
    'ui.indexTaskCreatedViewTaskControlsForProgress',
    'ui.noSavedZIPPartsForTheCurrentAccount',
    'ui.indexPausedResumeItInTaskManager',
    'ui.downloadPreviouslySavedZIPPartsAgain',
    'ui.exportingEntireConversation',
    'ui.conversationExported',
    'ui.legacyIndexOnlineLinkAndCompleteExportUnverified',
    'ui.cannotReadIndexStatus',
    'ui.anExplicitAccountIDIsRequiredLegacyIndex',

    'ui.expandMinimap',
    'ui.collapseMinimap'
  ]);
  const blocks = [
    {
      keys: `ui.openChatGPT
ui.initializing
ui.extensionReady
ui.localData
ui.directory
ui.fullJSON
ui.indexed
ui.settings
ui.enableExtension
ui.sidebarTimestamps
ui.messageTimestamps
ui.openInBackgroundTab
ui.closePanelOnOutsideClick
ui.timestampFontSize
ui.interfaceLanguage
ui.displaySettings
ui.advancedSettings
ui.backgroundTabsPanelBehaviorExportFilenames
ui.exportFilenames
ui.createdTimeTitle
ui.createdTimeSourceTitle
ui.conversationTitle
ui.sourceTitle
ui.dateOnlyTitle
ui.dateOnlySourceTitle
ui.customTemplate
ui.filenamePreview
ui.indexDataManagement
ui.noActiveTasks
ui.timestampFontSizeSidebarAndMessages`.split('\n'),
      translations: {
        'zh-TW': `開啟 ChatGPT ↗
正在初始化
擴充功能已就緒
本機資料
對話目錄
完整 JSON
已建立索引
功能設定
啟用擴充功能
側邊欄時間戳記
訊息時間戳記
在背景分頁開啟
點擊面板外即可關閉
時間戳記字體大小
介面語言
常用顯示設定
進階設定
背景分頁、面板行為、匯出檔名
匯出檔名
建立時間 + 對話標題
建立時間 + 來源 + 對話標題
對話標題
來源 + 對話標題
僅日期 + 對話標題
僅日期 + 來源 + 對話標題
自訂範本
檔名預覽：
索引與資料管理
目前沒有執行中的工作
時間戳記字體大小（側邊欄與訊息）`.split('\n'),
        es: `Abrir ChatGPT ↗
Inicializando
Extensión lista
Datos locales
Lista de conversaciones
JSON completo
Indexadas
Configuración
Activar la extensión
Marcas de tiempo en la barra lateral
Marcas de tiempo en los mensajes
Abrir en una pestaña en segundo plano
Cerrar el panel al hacer clic fuera
Tamaño de las marcas de tiempo
Idioma de la interfaz
Ajustes de visualización
Configuración avanzada
Pestañas en segundo plano, panel y nombres de archivo
Nombres de archivos exportados
Fecha de creación + título
Fecha de creación + origen + título
Título de la conversación
Origen + título
Solo fecha + título
Solo fecha + origen + título
Plantilla personalizada
Vista previa del nombre de archivo:
Gestión del índice y los datos
No hay tareas en ejecución
Tamaño de las marcas de tiempo (barra lateral y mensajes)`.split('\n'),
        hi: `ChatGPT खोलें ↗
शुरू किया जा रहा है
एक्सटेंशन तैयार है
स्थानीय डेटा
चैट सूची
पूरा JSON
इंडेक्स की गई
सेटिंग्स
एक्सटेंशन चालू करें
साइडबार में समय दिखाएँ
संदेशों में समय दिखाएँ
बैकग्राउंड टैब में खोलें
बाहर क्लिक करने पर पैनल बंद करें
समय के टेक्स्ट का आकार
इंटरफ़ेस की भाषा
डिस्प्ले सेटिंग्स
उन्नत सेटिंग्स
बैकग्राउंड टैब, पैनल और एक्सपोर्ट फ़ाइल नाम
एक्सपोर्ट फ़ाइल के नाम
बनाने का समय + शीर्षक
बनाने का समय + स्रोत + शीर्षक
चैट का शीर्षक
स्रोत + शीर्षक
केवल तारीख + शीर्षक
केवल तारीख + स्रोत + शीर्षक
अपना टेम्पलेट
फ़ाइल नाम का पूर्वावलोकन:
इंडेक्स और डेटा प्रबंधन
अभी कोई कार्य नहीं चल रहा
समय के टेक्स्ट का आकार (साइडबार और संदेश)`.split('\n'),
        ar: `فتح ChatGPT ↗
جارٍ التهيئة
الإضافة جاهزة
البيانات المحلية
قائمة المحادثات
ملف JSON الكامل
تمت فهرستها
الإعدادات
تفعيل الإضافة
الطوابع الزمنية في الشريط الجانبي
الطوابع الزمنية للرسائل
الفتح في علامة تبويب بالخلفية
إغلاق اللوحة عند النقر خارجها
حجم خط الطوابع الزمنية
لغة الواجهة
إعدادات العرض
الإعدادات المتقدمة
علامات تبويب الخلفية وسلوك اللوحة وأسماء الملفات
أسماء الملفات المصدّرة
وقت الإنشاء + العنوان
وقت الإنشاء + المصدر + العنوان
عنوان المحادثة
المصدر + العنوان
التاريخ فقط + العنوان
التاريخ فقط + المصدر + العنوان
قالب مخصص
معاينة اسم الملف:
إدارة الفهرس والبيانات
لا توجد مهام قيد التشغيل
حجم خط الطوابع الزمنية (الشريط الجانبي والرسائل)`.split('\n'),
        'pt-BR': `Abrir ChatGPT ↗
Inicializando
Extensão pronta
Dados locais
Lista de conversas
JSON completo
Indexadas
Configurações
Ativar extensão
Horários na barra lateral
Horários nas mensagens
Abrir em aba em segundo plano
Fechar o painel ao clicar fora
Tamanho da fonte dos horários
Idioma da interface
Configurações de exibição
Configurações avançadas
Abas em segundo plano, painel e nomes de arquivos
Nomes dos arquivos exportados
Data de criação + título
Data de criação + origem + título
Título da conversa
Origem + título
Apenas data + título
Apenas data + origem + título
Modelo personalizado
Prévia do nome do arquivo:
Gerenciamento do índice e dos dados
Nenhuma tarefa em execução
Tamanho da fonte dos horários (barra lateral e mensagens)`.split('\n'),
        bn: `ChatGPT খুলুন ↗
চালু করা হচ্ছে
এক্সটেনশন প্রস্তুত
স্থানীয় ডেটা
চ্যাটের তালিকা
সম্পূর্ণ JSON
ইনডেক্স করা হয়েছে
সেটিংস
এক্সটেনশন চালু করুন
সাইডবারে সময় দেখান
বার্তায় সময় দেখান
ব্যাকগ্রাউন্ড ট্যাবে খুলুন
বাইরে ক্লিক করলে প্যানেল বন্ধ করুন
সময়ের লেখার আকার
ইন্টারফেসের ভাষা
প্রদর্শন সেটিংস
উন্নত সেটিংস
ব্যাকগ্রাউন্ড ট্যাব, প্যানেল ও ফাইলের নাম
এক্সপোর্ট করা ফাইলের নাম
তৈরির সময় + শিরোনাম
তৈরির সময় + উৎস + শিরোনাম
চ্যাটের শিরোনাম
উৎস + শিরোনাম
শুধু তারিখ + শিরোনাম
শুধু তারিখ + উৎস + শিরোনাম
নিজস্ব টেমপ্লেট
ফাইলের নামের পূর্বরূপ:
ইনডেক্স ও ডেটা ব্যবস্থাপনা
এখন কোনো কাজ চলছে না
সময়ের লেখার আকার (সাইডবার ও বার্তা)`.split('\n'),
        id: `Buka ChatGPT ↗
Menginisialisasi
Ekstensi siap digunakan
Data lokal
Daftar percakapan
JSON lengkap
Terindeks
Pengaturan
Aktifkan ekstensi
Stempel waktu di bilah samping
Stempel waktu pada pesan
Buka di tab latar belakang
Tutup panel saat mengeklik di luar
Ukuran font stempel waktu
Bahasa antarmuka
Pengaturan tampilan
Pengaturan lanjutan
Tab latar belakang, perilaku panel, dan nama berkas
Nama berkas ekspor
Waktu dibuat + judul
Waktu dibuat + sumber + judul
Judul percakapan
Sumber + judul
Hanya tanggal + judul
Hanya tanggal + sumber + judul
Templat khusus
Pratinjau nama berkas:
Pengelolaan indeks dan data
Tidak ada tugas yang berjalan
Ukuran font stempel waktu (bilah samping dan pesan)`.split('\n'),
        fr: `Ouvrir ChatGPT ↗
Initialisation
Extension prête
Données locales
Liste des conversations
JSON complet
Indexées
Paramètres
Activer l’extension
Horodatage dans la barre latérale
Horodatage des messages
Ouvrir dans un onglet en arrière-plan
Fermer le panneau en cliquant à l’extérieur
Taille du texte des horodatages
Langue de l’interface
Paramètres d’affichage
Paramètres avancés
Onglets en arrière-plan, panneau et noms de fichiers
Noms des fichiers exportés
Date de création + titre
Date de création + source + titre
Titre de la conversation
Source + titre
Date uniquement + titre
Date uniquement + source + titre
Modèle personnalisé
Aperçu du nom de fichier :
Gestion de l’index et des données
Aucune tâche en cours
Taille du texte des horodatages (barre latérale et messages)`.split('\n'),
        ru: `Открыть ChatGPT ↗
Инициализация
Расширение готово
Локальные данные
Список чатов
Полный JSON
Проиндексировано
Настройки
Включить расширение
Время в боковой панели
Время сообщений
Открывать во фоновой вкладке
Закрывать панель по клику вне её
Размер шрифта временных меток
Язык интерфейса
Настройки отображения
Дополнительные настройки
Фоновые вкладки, поведение панели и имена файлов
Имена файлов при экспорте
Дата создания + название
Дата создания + источник + название
Название чата
Источник + название
Только дата + название
Только дата + источник + название
Свой шаблон
Предпросмотр имени файла:
Управление индексом и данными
Нет выполняемых задач
Размер шрифта времени (боковая панель и сообщения)`.split('\n'),
        ja: `ChatGPT を開く ↗
初期化しています
拡張機能を使用できます
ローカルデータ
チャット一覧
完全な JSON
インデックス済み
設定
拡張機能を有効にする
サイドバーに日時を表示
メッセージに日時を表示
バックグラウンドのタブで開く
パネルの外側をクリックしたら閉じる
日時表示の文字サイズ
表示言語
表示設定
詳細設定
バックグラウンドタブ・パネルの動作・ファイル名
エクスポート時のファイル名
作成日時 + タイトル
作成日時 + 出典 + タイトル
チャットのタイトル
出典 + タイトル
日付のみ + タイトル
日付のみ + 出典 + タイトル
カスタムテンプレート
ファイル名のプレビュー：
インデックスとデータの管理
実行中のタスクはありません
日時表示の文字サイズ（サイドバーとメッセージ）`.split('\n')
      }
    },
    {
      keys: `ui.refreshStatus
ui.buildIndexConsentRequired
ui.automaticallyUpdateIndex
ui.clearIndex
ui.clearFullJSON
ui.loadingTasks
ui.fullRefreshRebuildCache
ui.refresh
ui.pause
ui.resume
ui.cancel
ui.downloadZIPParts
ui.pending
ui.running
ui.paused
ui.completed
ui.failed
ui.canceled
ui.fullTextIndex
ui.markdownExport
ui.jsonExport
ui.fetchingConversations
ui.savingZIPParts
ui.waitingBetweenRequests
ui.rateLimitCooldown
ui.pausedAfterRepeatedFailures
ui.waiting
ui.loadingLocalDirectory
ui.conversations
ui.fullTextSearch
ui.savedZIPParts
ui.checkUpdates
ui.exportMD
ui.exportJSON
ui.archive
ui.delete
ui.downloadAllConversationImagesZIP
ui.conversationMinimap
ui.expandMinimap
ui.collapseMinimap`.split('\n'),
      translations: {
        'zh-TW': `重新整理狀態
建立全文索引（需授權）
自動更新索引
清除索引
清除完整 JSON
正在載入工作…
完整重新整理／重建快取
重新整理
暫停
繼續
取消
下載 ZIP 分卷
等待執行
執行中
已暫停
已完成
失敗
已取消
全文索引
匯出 Markdown
匯出 JSON
正在擷取對話
正在儲存 ZIP 分卷
等待下一次請求
請求限流冷卻中
連續失敗，已暫停並等待手動繼續
等待中
正在載入本機對話目錄…
對話目錄
全文搜尋
已儲存的 ZIP 分卷
檢查更新
匯出 MD
匯出 JSON
封存
刪除
下載此對話的所有圖片（ZIP）
對話快速導覽
展開導覽
收合導覽`.split('\n'),
        es: `Actualizar estado
Crear índice de texto completo (requiere autorización)
Actualizar el índice automáticamente
Borrar el índice
Borrar el JSON completo
Cargando tareas…
Actualización completa / reconstruir caché
Actualizar
Pausar
Reanudar
Cancelar
Descargar partes ZIP
Pendiente
En ejecución
En pausa
Completado
Error
Cancelado
Índice de texto completo
Exportación Markdown
Exportación JSON
Obteniendo conversaciones
Guardando partes ZIP
Esperando entre solicitudes
Pausa por límite de solicitudes
En pausa por errores consecutivos; requiere intervención
En espera
Cargando la lista de conversaciones locales…
Lista de conversaciones
Búsqueda de texto completo
Partes ZIP guardadas
Buscar actualizaciones
Exportar MD
Exportar JSON
Archivar
Eliminar
Descargar todas las imágenes de esta conversación (ZIP)
Navegación por la conversación
Expandir navegación
Contraer navegación`.split('\n'),
        hi: `स्थिति अपडेट करें
पूरा टेक्स्ट इंडेक्स बनाएँ (अनुमति ज़रूरी)
इंडेक्स अपने-आप अपडेट करें
इंडेक्स मिटाएँ
पूरा JSON मिटाएँ
कार्य लोड हो रहे हैं…
पूरा रीफ़्रेश / कैश दोबारा बनाएँ
रीफ़्रेश
रोकें
फिर शुरू करें
रद्द करें
ZIP के हिस्से डाउनलोड करें
बाकी है
चल रहा है
रुका हुआ है
पूरा हुआ
विफल
रद्द किया गया
पूरा टेक्स्ट इंडेक्स
Markdown एक्सपोर्ट
JSON एक्सपोर्ट
चैट प्राप्त की जा रही हैं
ZIP के हिस्से सेव हो रहे हैं
अनुरोधों के बीच प्रतीक्षा
अनुरोध सीमा के कारण प्रतीक्षा
बार-बार विफल होने पर रुका; मैन्युअल रूप से फिर शुरू करें
प्रतीक्षा में
स्थानीय चैट सूची लोड हो रही है…
चैट सूची
पूरा टेक्स्ट खोजें
सेव किए गए ZIP हिस्से
अपडेट जाँचें
MD एक्सपोर्ट करें
JSON एक्सपोर्ट करें
संग्रहित करें
मिटाएँ
इस चैट की सभी तस्वीरें डाउनलोड करें (ZIP)
चैट नेविगेशन
नेविगेशन खोलें
नेविगेशन समेटें`.split('\n'),
        ar: `تحديث الحالة
إنشاء فهرس بحث شامل (يتطلب الإذن)
تحديث الفهرس تلقائيًا
مسح الفهرس
مسح ملف JSON الكامل
جارٍ تحميل المهام…
تحديث شامل / إعادة بناء ذاكرة التخزين المؤقت
تحديث
إيقاف مؤقت
استئناف
إلغاء
تنزيل أجزاء ZIP
قيد الانتظار
قيد التنفيذ
متوقف مؤقتًا
مكتمل
فشل
ملغى
فهرس البحث الشامل
تصدير Markdown
تصدير JSON
جارٍ جلب المحادثات
جارٍ حفظ أجزاء ZIP
انتظار بين الطلبات
انتظار بسبب حد الطلبات
توقف بعد تكرار الأخطاء؛ يُرجى الاستئناف يدويًا
في الانتظار
جارٍ تحميل قائمة المحادثات المحلية…
قائمة المحادثات
البحث في النص الكامل
أجزاء ZIP المحفوظة
التحقق من التحديثات
تصدير MD
تصدير JSON
أرشفة
حذف
تنزيل جميع صور هذه المحادثة (ZIP)
التنقل بين الرسائل
توسيع شريط التنقل
طي شريط التنقل`.split('\n'),
        'pt-BR': `Atualizar status
Criar índice de texto completo (requer autorização)
Atualizar índice automaticamente
Limpar índice
Limpar JSON completo
Carregando tarefas…
Atualização completa / reconstruir cache
Atualizar
Pausar
Retomar
Cancelar
Baixar partes do ZIP
Pendente
Em execução
Pausado
Concluído
Falhou
Cancelado
Índice de texto completo
Exportação Markdown
Exportação JSON
Buscando conversas
Salvando partes do ZIP
Aguardando entre requisições
Pausa por limite de requisições
Pausado após falhas consecutivas; retome manualmente
Aguardando
Carregando lista local de conversas…
Lista de conversas
Busca em texto completo
Partes do ZIP salvas
Verificar atualizações
Exportar MD
Exportar JSON
Arquivar
Excluir
Baixar todas as imagens desta conversa (ZIP)
Navegação pela conversa
Expandir navegação
Recolher navegação`.split('\n'),
        bn: `অবস্থা হালনাগাদ করুন
সম্পূর্ণ টেক্সট ইনডেক্স তৈরি করুন (অনুমতি প্রয়োজন)
ইনডেক্স স্বয়ংক্রিয়ভাবে হালনাগাদ করুন
ইনডেক্স মুছুন
সম্পূর্ণ JSON মুছুন
কাজগুলো লোড হচ্ছে…
সম্পূর্ণ রিফ্রেশ / ক্যাশ পুনর্গঠন
রিফ্রেশ
বিরতি দিন
আবার শুরু করুন
বাতিল করুন
ZIP-এর অংশগুলো ডাউনলোড করুন
অপেক্ষমাণ
চলছে
বিরতিতে আছে
সম্পন্ন
ব্যর্থ
বাতিল হয়েছে
সম্পূর্ণ টেক্সট ইনডেক্স
Markdown এক্সপোর্ট
JSON এক্সপোর্ট
চ্যাট আনা হচ্ছে
ZIP-এর অংশগুলো সংরক্ষণ হচ্ছে
অনুরোধের মাঝে অপেক্ষা
অনুরোধের সীমার কারণে বিরতি
বারবার ব্যর্থ হওয়ায় বিরতি; নিজে আবার শুরু করুন
অপেক্ষা করছে
স্থানীয় চ্যাটের তালিকা লোড হচ্ছে…
চ্যাটের তালিকা
সম্পূর্ণ টেক্সটে খুঁজুন
সংরক্ষিত ZIP অংশ
হালনাগাদ পরীক্ষা করুন
MD এক্সপোর্ট করুন
JSON এক্সপোর্ট করুন
আর্কাইভ করুন
মুছুন
এই চ্যাটের সব ছবি ডাউনলোড করুন (ZIP)
চ্যাট নেভিগেশন
নেভিগেশন খুলুন
নেভিগেশন গুটিয়ে নিন`.split('\n'),
        id: `Perbarui status
Buat indeks teks lengkap (perlu izin)
Perbarui indeks secara otomatis
Hapus indeks
Hapus JSON lengkap
Memuat tugas…
Segarkan penuh / bangun ulang cache
Segarkan
Jeda
Lanjutkan
Batalkan
Unduh bagian ZIP
Menunggu
Berjalan
Dijeda
Selesai
Gagal
Dibatalkan
Indeks teks lengkap
Ekspor Markdown
Ekspor JSON
Mengambil percakapan
Menyimpan bagian ZIP
Menunggu antarpermintaan
Jeda akibat batas permintaan
Dijeda setelah beberapa kegagalan; lanjutkan secara manual
Menunggu
Memuat daftar percakapan lokal…
Daftar percakapan
Pencarian teks lengkap
Bagian ZIP tersimpan
Periksa pembaruan
Ekspor MD
Ekspor JSON
Arsipkan
Hapus
Unduh semua gambar dalam percakapan ini (ZIP)
Navigasi percakapan
Perluas navigasi
Ciutkan navigasi`.split('\n'),
        fr: `Actualiser l’état
Créer l’index de recherche intégrale (autorisation requise)
Mettre à jour l’index automatiquement
Effacer l’index
Effacer le JSON complet
Chargement des tâches…
Actualisation complète / reconstruire le cache
Actualiser
Mettre en pause
Reprendre
Annuler
Télécharger les parties ZIP
En attente
En cours
En pause
Terminé
Échec
Annulé
Index de recherche intégrale
Exportation Markdown
Exportation JSON
Récupération des conversations
Enregistrement des parties ZIP
Attente entre les requêtes
Pause due à la limite de requêtes
En pause après plusieurs échecs ; reprise manuelle nécessaire
En attente
Chargement de la liste locale des conversations…
Liste des conversations
Recherche en texte intégral
Parties ZIP enregistrées
Vérifier les mises à jour
Exporter en MD
Exporter en JSON
Archiver
Supprimer
Télécharger toutes les images de cette conversation (ZIP)
Navigation dans la conversation
Développer la navigation
Réduire la navigation`.split('\n'),
        ru: `Обновить состояние
Создать полнотекстовый индекс (требуется разрешение)
Автоматически обновлять индекс
Очистить индекс
Удалить полный JSON
Загрузка задач…
Полное обновление / пересоздать кэш
Обновить
Приостановить
Продолжить
Отменить
Скачать части ZIP
Ожидает
Выполняется
Приостановлено
Завершено
Ошибка
Отменено
Полнотекстовый индекс
Экспорт Markdown
Экспорт JSON
Получение чатов
Сохранение частей ZIP
Ожидание между запросами
Пауза из-за ограничения запросов
Приостановлено после повторных ошибок; продолжите вручную
Ожидание
Загрузка локального списка чатов…
Список чатов
Полнотекстовый поиск
Сохранённые части ZIP
Проверить обновления
Экспортировать MD
Экспортировать JSON
Архивировать
Удалить
Скачать все изображения из этого чата (ZIP)
Навигация по чату
Развернуть навигацию
Свернуть навигацию`.split('\n'),
        ja: `状態を更新
全文検索インデックスを作成（許可が必要）
インデックスを自動更新
インデックスを削除
完全な JSON を削除
タスクを読み込み中…
すべて更新／キャッシュを再構築
更新
一時停止
再開
キャンセル
ZIP 分割ファイルをダウンロード
実行待ち
実行中
一時停止中
完了
失敗
キャンセル済み
全文検索インデックス
Markdown エクスポート
JSON エクスポート
チャットを取得中
ZIP 分割ファイルを保存中
リクエスト間の待機
リクエスト制限による待機
連続エラーで一時停止中。手動で再開してください
待機中
ローカルのチャット一覧を読み込み中…
チャット一覧
全文検索
保存済み ZIP 分割ファイル
更新を確認
MD をエクスポート
JSON をエクスポート
アーカイブ
削除
このチャットの画像をすべてダウンロード（ZIP）
チャット内ナビゲーション
ナビゲーションを展開
ナビゲーションを折りたたむ`.split('\n')
      }
    },
    {
      keys: `ui.created
ui.title
ui.searchTitles
ui.filterByTitle
ui.clear
ui.apply
ui.projectsAll
ui.allSources
ui.export
ui.searchAllConversations
ui.searchQuery
ui.search
ui.loadingIndexStatus
ui.updateIndex
ui.selectAllCurrentFilteredConversations
ui.sortByCreationTime
ui.chatTools
ui.localFullTextSearch
ui.noMatchingResults
ui.fullLocalPreview
ui.hideLocalPreview
ui.deleteLocalCopy
ui.localOnly
ui.user
ui.standardChat
ui.filterByProject
ui.openConversations
ui.exportEntireChatMarkdown
ui.exportingEntireConversation
ui.conversationExported`.split('\n'),
      translations: {
        'zh-TW': `建立時間
標題
搜尋標題
依標題篩選
清除
套用
所有專案
所有來源
匯出
搜尋所有對話內容
全文搜尋關鍵字
搜尋
正在讀取索引狀態…
更新索引
全選目前篩選結果
依建立時間排序
對話工具
本機全文搜尋
找不到符合條件的內容
本機完整預覽
收起本機預覽
刪除本機副本
僅保留在本機
使用者
一般對話
依專案篩選
開啟對話目錄
匯出整段對話（Markdown）
正在匯出整段對話…
對話匯出完成`.split('\n'),
        es: `Fecha de creación
Título
Buscar títulos
Filtrar por título
Borrar
Aplicar
Todos los proyectos
Todos los orígenes
Exportar
Buscar en todas las conversaciones
Palabras clave de búsqueda
Buscar
Cargando estado del índice…
Actualizar índice
Seleccionar todos los resultados filtrados
Ordenar por fecha de creación
Herramientas de chat
Búsqueda local de texto completo
No se encontraron resultados
Vista previa local completa
Ocultar vista previa local
Eliminar copia local
Solo local
Usuario
Conversación normal
Filtrar por proyecto
Abrir lista de conversaciones
Exportar toda la conversación (Markdown)
Exportando toda la conversación…
Conversación exportada`.split('\n'),
        hi: `बनाने की तारीख
शीर्षक
शीर्षक खोजें
शीर्षक से छाँटें
साफ़ करें
लागू करें
सभी प्रोजेक्ट
सभी स्रोत
एक्सपोर्ट करें
सभी चैट में खोजें
खोजने के शब्द
खोजें
इंडेक्स की स्थिति लोड हो रही है…
इंडेक्स अपडेट करें
फ़िल्टर किए गए सभी परिणाम चुनें
बनाने की तारीख के अनुसार क्रमबद्ध करें
चैट के टूल
स्थानीय पूरा टेक्स्ट खोजें
कोई परिणाम नहीं मिला
पूरा स्थानीय पूर्वावलोकन
स्थानीय पूर्वावलोकन छिपाएँ
स्थानीय कॉपी मिटाएँ
केवल स्थानीय
उपयोगकर्ता
सामान्य चैट
प्रोजेक्ट से छाँटें
चैट सूची खोलें
पूरी चैट एक्सपोर्ट करें (Markdown)
पूरी चैट एक्सपोर्ट हो रही है…
चैट एक्सपोर्ट हो गई`.split('\n'),
        ar: `تاريخ الإنشاء
العنوان
البحث في العناوين
تصفية حسب العنوان
مسح
تطبيق
جميع المشاريع
جميع المصادر
تصدير
البحث في جميع المحادثات
كلمات البحث
بحث
جارٍ تحميل حالة الفهرس…
تحديث الفهرس
تحديد جميع النتائج المصفاة
الترتيب حسب تاريخ الإنشاء
أدوات المحادثة
البحث المحلي في النص الكامل
لم يتم العثور على نتائج
معاينة محلية كاملة
إخفاء المعاينة المحلية
حذف النسخة المحلية
محلي فقط
المستخدم
محادثة عادية
تصفية حسب المشروع
فتح قائمة المحادثات
تصدير المحادثة كاملة (Markdown)
جارٍ تصدير المحادثة كاملة…
تم تصدير المحادثة`.split('\n'),
        'pt-BR': `Data de criação
Título
Pesquisar títulos
Filtrar por título
Limpar
Aplicar
Todos os projetos
Todas as origens
Exportar
Pesquisar em todas as conversas
Termos da pesquisa
Pesquisar
Carregando status do índice…
Atualizar índice
Selecionar todos os resultados filtrados
Ordenar por data de criação
Ferramentas de conversa
Busca local em texto completo
Nenhum resultado encontrado
Prévia local completa
Ocultar prévia local
Excluir cópia local
Somente local
Usuário
Conversa comum
Filtrar por projeto
Abrir lista de conversas
Exportar conversa inteira (Markdown)
Exportando a conversa inteira…
Conversa exportada`.split('\n'),
        bn: `তৈরির তারিখ
শিরোনাম
শিরোনাম খুঁজুন
শিরোনাম দিয়ে বাছাই করুন
মুছুন
প্রয়োগ করুন
সব প্রজেক্ট
সব উৎস
এক্সপোর্ট করুন
সব চ্যাটে খুঁজুন
অনুসন্ধানের শব্দ
খুঁজুন
ইনডেক্সের অবস্থা লোড হচ্ছে…
ইনডেক্স হালনাগাদ করুন
বাছাই করা সব ফলাফল নির্বাচন করুন
তৈরির তারিখ অনুযায়ী সাজান
চ্যাটের টুল
স্থানীয় সম্পূর্ণ টেক্সটে খুঁজুন
কোনো ফল পাওয়া যায়নি
সম্পূর্ণ স্থানীয় পূর্বরূপ
স্থানীয় পূর্বরূপ লুকান
স্থানীয় কপি মুছুন
শুধু স্থানীয়
ব্যবহারকারী
সাধারণ চ্যাট
প্রজেক্ট দিয়ে বাছাই করুন
চ্যাটের তালিকা খুলুন
পুরো চ্যাট এক্সপোর্ট করুন (Markdown)
পুরো চ্যাট এক্সপোর্ট হচ্ছে…
চ্যাট এক্সপোর্ট হয়েছে`.split('\n'),
        id: `Tanggal dibuat
Judul
Cari judul
Filter berdasarkan judul
Bersihkan
Terapkan
Semua proyek
Semua sumber
Ekspor
Cari di semua percakapan
Kata kunci pencarian
Cari
Memuat status indeks…
Perbarui indeks
Pilih semua hasil yang difilter
Urutkan berdasarkan tanggal dibuat
Alat percakapan
Pencarian teks lengkap lokal
Tidak ada hasil yang cocok
Pratinjau lokal lengkap
Sembunyikan pratinjau lokal
Hapus salinan lokal
Hanya lokal
Pengguna
Percakapan biasa
Filter berdasarkan proyek
Buka daftar percakapan
Ekspor seluruh percakapan (Markdown)
Mengekspor seluruh percakapan…
Percakapan berhasil diekspor`.split('\n'),
        fr: `Date de création
Titre
Rechercher dans les titres
Filtrer par titre
Effacer
Appliquer
Tous les projets
Toutes les sources
Exporter
Rechercher dans toutes les conversations
Mots-clés de recherche
Rechercher
Chargement de l’état de l’index…
Mettre à jour l’index
Sélectionner tous les résultats filtrés
Trier par date de création
Outils de conversation
Recherche locale en texte intégral
Aucun résultat trouvé
Aperçu local complet
Masquer l’aperçu local
Supprimer la copie locale
Local uniquement
Utilisateur
Conversation ordinaire
Filtrer par projet
Ouvrir la liste des conversations
Exporter toute la conversation (Markdown)
Exportation de la conversation complète…
Conversation exportée`.split('\n'),
        ru: `Дата создания
Название
Поиск по названиям
Фильтр по названию
Очистить
Применить
Все проекты
Все источники
Экспорт
Поиск по всем чатам
Поисковые слова
Искать
Загрузка состояния индекса…
Обновить индекс
Выбрать все результаты фильтрации
Сортировать по дате создания
Инструменты чата
Локальный полнотекстовый поиск
Ничего не найдено
Полный локальный просмотр
Скрыть локальный просмотр
Удалить локальную копию
Только локально
Пользователь
Обычный чат
Фильтр по проекту
Открыть список чатов
Экспортировать весь чат (Markdown)
Экспорт всего чата…
Чат экспортирован`.split('\n'),
        ja: `作成日時
タイトル
タイトルを検索
タイトルで絞り込む
クリア
適用
すべてのプロジェクト
すべての取得元
エクスポート
すべてのチャットを検索
検索キーワード
検索
インデックスの状態を読み込み中…
インデックスを更新
絞り込み結果をすべて選択
作成日時で並べ替え
チャットツール
ローカル全文検索
一致する結果がありません
ローカルの全文プレビュー
ローカルプレビューを閉じる
ローカルコピーを削除
ローカルのみ
ユーザー
通常のチャット
プロジェクトで絞り込む
チャット一覧を開く
チャット全体をエクスポート（Markdown）
チャット全体をエクスポート中…
チャットをエクスポートしました`.split('\n')
      }
    },
    {
      keys: `ui.deletingConversationsInChatGPTCannotBeUndoneThe
ui.archivingRemovesChatsFromTheRemoteListWithout
ui.variableVariableSelectedConversationsVariableThisMayTake
ui.clearVariableVariableRecordsForTheVerifiedAccount
ui.permanentlyRemoveLocalJSONSearchIndexAndDirectory
ui.completeJSONNotSavedLocallyRemoteDeletionCanceled
ui.theFirstIndexReadsAllAccessibleChatsFrom
ui.theFirstIndexScansAllAccessibleChatsAnd`.split('\n'),
      translations: {
        'zh-TW': `刪除 ChatGPT 雲端對話後無法復原。擴充功能會先確認完整 JSON 已儲存在本機；刪除後仍保留本機索引與原始內容。
封存只會將對話從 ChatGPT 雲端對話清單移除，不會刪除擴充功能中的本機資料。
確定要對選取的 {count} 段對話執行「{action}」？⏎⏎{detail}⏎⏎操作可能需要一些時間；失敗的項目仍會保留選取狀態，以便重試。
確定只清除目前已驗證帳號的 {count} 筆「{label}」記錄？⏎{detail}⏎已下載的檔案、ZIP 分卷、其他帳號及未歸屬的舊索引均不受影響。
永久刪除這段僅保存在本機的對話之 JSON、全文索引與目錄記錄？此操作無法復原；不會刪除 ChatGPT 雲端對話或已下載的檔案。
完整 JSON 尚未儲存在本機，因此未執行雲端刪除。
首次建立全文索引時，將讀取此 ChatGPT 帳號可存取的所有對話清單，並依需要取得尚未快取的完整對話內容。原始 JSON 與搜尋索引只儲存在此裝置。首次完成後會自動增量更新。是否授權？
首次索引將掃描此帳號可存取的完整對話清單，並依需要取得未快取的對話內容。原始 JSON 與搜尋索引只儲存在本機；首次完成後會自動增量更新。是否授權開始？`.split('\n'),
        es: `Eliminar conversaciones de ChatGPT en la nube es irreversible. Antes de eliminarlas, la extensión comprueba que el JSON completo esté guardado localmente y conserva después el índice y los datos originales.
Archivar solo quita las conversaciones de la lista de ChatGPT en la nube; no elimina los datos guardados por la extensión en este dispositivo.
¿Quieres {action} las {count} conversaciones seleccionadas?⏎⏎{detail}⏎⏎La operación puede tardar. Los elementos fallidos permanecerán seleccionados para que puedas reintentarlo.
¿Borrar únicamente los {count} registros de «{label}» de la cuenta verificada?⏎{detail}⏎No se verán afectados los archivos descargados, las partes ZIP, otras cuentas ni los índices antiguos sin asignar.
¿Eliminar definitivamente el JSON, el índice de búsqueda y la entrada de esta conversación que solo está guardada localmente? No se puede deshacer. No se eliminarán conversaciones de ChatGPT en la nube ni archivos descargados.
No se ha eliminado la conversación de la nube porque todavía no se ha guardado localmente el JSON completo.
La primera indexación leerá la lista de todas las conversaciones accesibles de esta cuenta de ChatGPT y obtendrá el contenido completo que aún no esté en caché. El JSON original y el índice de búsqueda se guardarán solo en este dispositivo. Después se actualizarán automáticamente los cambios. ¿Autorizas esta operación?
La indexación inicial recorrerá todas las conversaciones accesibles de esta cuenta y recuperará las que falten en la caché. El JSON original y el índice de búsqueda permanecerán en este dispositivo. Después se actualizarán automáticamente. ¿Autorizas el inicio?`.split('\n'),
        hi: `ChatGPT से क्लाउड चैट मिटाने के बाद उन्हें वापस नहीं लाया जा सकता। एक्सटेंशन पहले जाँचता है कि पूरा JSON स्थानीय रूप से सेव है; मिटाने के बाद स्थानीय इंडेक्स और मूल डेटा सुरक्षित रहते हैं।
संग्रहित करने से चैट केवल ChatGPT की क्लाउड सूची से हटती हैं। एक्सटेंशन में सेव स्थानीय डेटा नहीं मिटता।
क्या आप चुनी गई {count} चैट पर यह कार्रवाई करना चाहते हैं: {action}?⏎⏎{detail}⏎⏎इसमें कुछ समय लग सकता है। जिन चैट पर कार्रवाई विफल होगी, वे दोबारा कोशिश के लिए चुनी रहेंगी।
क्या पुष्टि किए गए खाते से केवल {label} के {count} रिकॉर्ड मिटाएँ?⏎{detail}⏎डाउनलोड की गई फ़ाइलें, ZIP के हिस्से, अन्य खाते और उनसे अलग पुराने इंडेक्स सुरक्षित रहेंगे।
क्या केवल इस डिवाइस पर सेव चैट का JSON, खोज इंडेक्स और सूची रिकॉर्ड हमेशा के लिए मिटाएँ? यह कार्रवाई वापस नहीं की जा सकती। ChatGPT की क्लाउड चैट और डाउनलोड की गई फ़ाइलें नहीं मिटेंगी।
पूरा JSON अभी स्थानीय रूप से सेव नहीं है, इसलिए क्लाउड चैट नहीं मिटाई गई।
पहली बार इंडेक्स बनाने पर ChatGPT खाते की उपलब्ध सभी चैट की सूची पढ़ी जाएगी और जो चैट कैश में नहीं हैं उनका पूरा डेटा लिया जाएगा। मूल JSON और खोज इंडेक्स सिर्फ़ इस डिवाइस पर सेव होंगे। इसके बाद बदली हुई चैट अपने-आप अपडेट होंगी। क्या आप अनुमति देते हैं?
शुरुआती इंडेक्स बनाने के लिए खाते की उपलब्ध सभी चैट जाँची जाएँगी और कैश में न मौजूद चैट का डेटा लिया जाएगा। मूल JSON और खोज इंडेक्स इसी डिवाइस पर रहेंगे; बाद में बदलाव अपने-आप अपडेट होंगे। क्या शुरू करने की अनुमति है?`.split('\n'),
        ar: `لا يمكن التراجع عن حذف محادثات ChatGPT من السحابة. تتحقق الإضافة أولًا من حفظ ملف JSON الكامل على الجهاز، وتحتفظ بعد الحذف بالفهرس والبيانات الأصلية محليًا.
تزيل الأرشفة المحادثات من قائمة ChatGPT السحابية فقط، ولا تحذف البيانات المحلية التي تحفظها الإضافة.
هل تريد تنفيذ «{action}» على {count} من المحادثات المحددة؟⏎⏎{detail}⏎⏎قد تستغرق العملية بعض الوقت. ستظل العناصر التي فشلت محددة لإعادة المحاولة.
هل تريد مسح {count} سجلًا من «{label}» للحساب الذي تم التحقق منه فقط؟⏎{detail}⏎لن تتأثر الملفات المنزّلة أو أجزاء ZIP أو الحسابات الأخرى أو الفهارس القديمة غير المرتبطة.
هل تريد حذف JSON وفهرس البحث وسجل القائمة لهذه المحادثة المحلية نهائيًا؟ لا يمكن التراجع عن ذلك. لن تُحذف محادثات ChatGPT السحابية أو الملفات المنزّلة.
لم تُحذف المحادثة من السحابة لأن ملف JSON الكامل لم يُحفظ محليًا بعد.
عند إنشاء الفهرس أول مرة، ستُقرأ قائمة جميع المحادثات المتاحة لهذا الحساب وسيُجلب المحتوى الكامل غير المخزن مؤقتًا. سيبقى JSON الأصلي وفهرس البحث على هذا الجهاز فقط. بعد الانتهاء، ستُحدَّث التغييرات تلقائيًا. هل تسمح بذلك؟
سيفحص إنشاء الفهرس الأولي كل المحادثات المتاحة لهذا الحساب ويجلب ما لم يُحفظ في ذاكرة التخزين المؤقت. سيبقى JSON الأصلي وفهرس البحث على هذا الجهاز، ثم تُحدَّث التغييرات تلقائيًا. هل تأذن بالبدء؟`.split('\n'),
        'pt-BR': `A exclusão de conversas na nuvem do ChatGPT é irreversível. Antes de excluir, a extensão confirma que o JSON completo está salvo localmente e mantém o índice e os dados originais neste dispositivo.
Arquivar remove as conversas apenas da lista na nuvem do ChatGPT; os dados locais da extensão não são apagados.
Deseja {action} as {count} conversas selecionadas?⏎⏎{detail}⏎⏎A operação pode demorar. Os itens com falha continuarão selecionados para que você tente novamente.
Limpar apenas os {count} registros de “{label}” da conta verificada?⏎{detail}⏎Arquivos baixados, partes ZIP, outras contas e índices antigos não vinculados não serão afetados.
Excluir permanentemente o JSON, o índice de busca e o registro desta conversa que existe apenas localmente? Esta ação não pode ser desfeita. Conversas na nuvem do ChatGPT e arquivos baixados não serão excluídos.
A conversa não foi excluída da nuvem porque o JSON completo ainda não foi salvo localmente.
Na primeira indexação, a extensão lerá a lista de todas as conversas acessíveis desta conta e buscará o conteúdo completo que não estiver no cache. O JSON original e o índice de busca ficarão apenas neste dispositivo. Depois, as alterações serão atualizadas automaticamente. Você autoriza?
A indexação inicial verificará todas as conversas acessíveis desta conta e buscará as que ainda não estão no cache. O JSON original e o índice de busca permanecerão neste dispositivo; as alterações posteriores serão atualizadas automaticamente. Autorizar o início?`.split('\n'),
        bn: `ChatGPT-এর ক্লাউড থেকে চ্যাট মুছে ফেললে তা ফেরানো যায় না। মুছে ফেলার আগে এক্সটেনশন নিশ্চিত করে যে সম্পূর্ণ JSON এই ডিভাইসে সংরক্ষিত আছে। এরপরও স্থানীয় ইনডেক্স ও মূল ডেটা রাখা হয়।
আর্কাইভ করলে চ্যাট শুধু ChatGPT-এর ক্লাউড তালিকা থেকে সরে যায়। এক্সটেনশনে রাখা স্থানীয় ডেটা মুছে যায় না।
নির্বাচিত {count}টি চ্যাটে “{action}” করতে চান?⏎⏎{detail}⏎⏎কিছু সময় লাগতে পারে। ব্যর্থ হওয়া চ্যাটগুলো আবার চেষ্টা করার জন্য নির্বাচিত থাকবে।
শুধু যাচাই করা অ্যাকাউন্টের “{label}” বিভাগের {count}টি রেকর্ড মুছবেন?⏎{detail}⏎ডাউনলোড করা ফাইল, ZIP-এর অংশ, অন্য অ্যাকাউন্ট ও সংযুক্ত নয় এমন পুরোনো ইনডেক্স অক্ষত থাকবে।
শুধু এই ডিভাইসে থাকা চ্যাটের JSON, অনুসন্ধান ইনডেক্স ও তালিকার রেকর্ড স্থায়ীভাবে মুছবেন? এটি ফিরিয়ে আনা যাবে না। ChatGPT-এর ক্লাউড চ্যাট বা ডাউনলোড করা ফাইল মুছবে না।
সম্পূর্ণ JSON এখনও স্থানীয়ভাবে সংরক্ষিত নেই, তাই ক্লাউড চ্যাট মোছা হয়নি।
প্রথমবার ইনডেক্স তৈরির সময় এই ChatGPT অ্যাকাউন্টে ব্যবহারযোগ্য সব চ্যাটের তালিকা পড়া হবে এবং ক্যাশে নেই এমন চ্যাটের সম্পূর্ণ তথ্য আনা হবে। মূল JSON ও অনুসন্ধান ইনডেক্স শুধু এই ডিভাইসে থাকবে। এরপর পরিবর্তন স্বয়ংক্রিয়ভাবে হালনাগাদ হবে। অনুমতি দেবেন?
প্রথম ইনডেক্স তৈরি করতে এই অ্যাকাউন্টের সব ব্যবহারযোগ্য চ্যাট পরীক্ষা করা হবে এবং ক্যাশে না থাকা তথ্য আনা হবে। মূল JSON ও অনুসন্ধান ইনডেক্স এই ডিভাইসেই থাকবে, পরে পরিবর্তন স্বয়ংক্রিয়ভাবে হালনাগাদ হবে। শুরু করার অনুমতি দেবেন?`.split('\n'),
        id: `Menghapus percakapan dari cloud ChatGPT tidak dapat dibatalkan. Sebelum menghapus, ekstensi memeriksa apakah JSON lengkap sudah disimpan secara lokal. Indeks dan data asli tetap disimpan di perangkat ini.
Mengarsipkan hanya menghapus percakapan dari daftar cloud ChatGPT, bukan data lokal yang disimpan ekstensi.
Yakin ingin melakukan “{action}” pada {count} percakapan yang dipilih?⏎⏎{detail}⏎⏎Proses ini mungkin memerlukan waktu. Item yang gagal akan tetap dipilih agar dapat dicoba lagi.
Hapus hanya {count} catatan “{label}” dari akun yang telah diverifikasi?⏎{detail}⏎Berkas unduhan, bagian ZIP, akun lain, dan indeks lama yang belum ditetapkan tidak terpengaruh.
Hapus secara permanen JSON, indeks pencarian, dan entri daftar percakapan yang hanya tersimpan secara lokal ini? Tindakan ini tidak dapat dibatalkan. Percakapan di cloud ChatGPT dan berkas unduhan tidak akan dihapus.
Percakapan cloud tidak dihapus karena JSON lengkap belum tersimpan secara lokal.
Saat pengindeksan pertama, ekstensi membaca daftar semua percakapan yang dapat diakses akun ChatGPT ini dan mengambil konten lengkap yang belum ada di cache. JSON asli dan indeks pencarian hanya disimpan di perangkat ini. Perubahan selanjutnya diperbarui otomatis. Berikan izin?
Pengindeksan awal akan memeriksa semua percakapan yang dapat diakses akun ini dan mengambil data yang belum ada di cache. JSON asli dan indeks pencarian tetap di perangkat ini; perubahan berikutnya diperbarui otomatis. Izinkan untuk mulai?`.split('\n'),
        fr: `La suppression de conversations du cloud ChatGPT est irréversible. Avant toute suppression, l’extension vérifie que le JSON complet est enregistré localement. L’index et les données d’origine restent ensuite sur cet appareil.
L’archivage retire uniquement les conversations de la liste du cloud ChatGPT, sans supprimer les données locales conservées par l’extension.
Voulez-vous appliquer « {action} » aux {count} conversations sélectionnées ?⏎⏎{detail}⏎⏎L’opération peut prendre du temps. Les éléments en échec resteront sélectionnés pour une nouvelle tentative.
Effacer uniquement les {count} enregistrements de « {label} » du compte vérifié ?⏎{detail}⏎Les fichiers téléchargés, les parties ZIP, les autres comptes et les anciens index non attribués ne seront pas modifiés.
Supprimer définitivement le JSON, l’index de recherche et l’entrée de cette conversation conservée uniquement en local ? Cette opération est irréversible. Les conversations du cloud ChatGPT et les fichiers téléchargés ne seront pas supprimés.
La conversation n’a pas été supprimée du cloud, car le JSON complet n’a pas encore été enregistré localement.
Lors de la première indexation, l’extension lira la liste de toutes les conversations accessibles de ce compte et récupérera le contenu complet absent du cache. Le JSON d’origine et l’index de recherche resteront uniquement sur cet appareil. Les changements seront ensuite synchronisés automatiquement. Autorisez-vous cette opération ?
L’indexation initiale parcourra toutes les conversations accessibles de ce compte et récupérera celles qui ne figurent pas encore dans le cache. Le JSON d’origine et l’index de recherche resteront sur cet appareil ; les changements seront ensuite mis à jour automatiquement. Autoriser le démarrage ?`.split('\n'),
        ru: `Удаление чатов из облака ChatGPT нельзя отменить. Перед удалением расширение проверяет, что полный JSON сохранён на устройстве; локальный индекс и исходные данные остаются доступными после удаления.
Архивация убирает чаты только из облачного списка ChatGPT и не удаляет локальные данные расширения.
Выполнить действие «{action}» для выбранных чатов ({count})?⏎⏎{detail}⏎⏎Это может занять некоторое время. Необработанные из-за ошибок чаты останутся выбранными для повторной попытки.
Очистить только записи «{label}» проверенной учётной записи ({count})?⏎{detail}⏎Скачанные файлы, части ZIP, другие учётные записи и старые непривязанные индексы не затрагиваются.
Навсегда удалить JSON, поисковый индекс и запись этого чата, который хранится только локально? Действие необратимо. Облачные чаты ChatGPT и скачанные файлы не будут удалены.
Облачный чат не удалён: полный JSON ещё не сохранён на этом устройстве.
При первой индексации расширение прочитает список всех доступных чатов этого аккаунта и загрузит полное содержимое отсутствующих в кэше чатов. Исходный JSON и поисковый индекс сохранятся только на этом устройстве. Дальнейшие изменения будут обновляться автоматически. Разрешить?
Первичная индексация проверит все доступные чаты этой учётной записи и получит отсутствующие в кэше данные. Исходный JSON и поисковый индекс останутся на этом устройстве, а изменения будут обновляться автоматически. Разрешить запуск?`.split('\n'),
        ja: `ChatGPT のクラウド上のチャットを削除すると元に戻せません。拡張機能は削除前に完全な JSON がローカルに保存済みであることを確認し、削除後もローカルのインデックスと元データを保持します。
アーカイブするとチャットは ChatGPT のクラウド上の一覧からのみ取り除かれます。拡張機能に保存されたローカルデータは削除されません。
選択した {count} 件のチャットに「{action}」を実行しますか？⏎⏎{detail}⏎⏎処理には時間がかかる場合があります。失敗した項目は再試行できるよう選択状態のまま残ります。
確認済みアカウントの「{label}」{count} 件だけを消去しますか？⏎{detail}⏎ダウンロード済みファイル、ZIP 分割ファイル、他のアカウント、未割り当ての旧インデックスには影響しません。
ローカルにのみ保存されたこのチャットの JSON、検索インデックス、一覧の記録を完全に削除しますか？取り消しはできません。ChatGPT のクラウド上のチャットやダウンロード済みファイルは削除されません。
完全な JSON がローカルに保存されていないため、クラウド上のチャットは削除していません。
初回のインデックス作成では、この ChatGPT アカウントからアクセスできるすべてのチャット一覧を取得し、キャッシュにないチャットの全文を必要に応じて読み込みます。元の JSON と検索インデックスはこの端末にのみ保存され、以降は変更分を自動更新します。許可しますか？
初回のインデックス作成では、アカウントからアクセスできるチャットをすべて確認し、キャッシュにない内容を取得します。元の JSON と検索インデックスはこの端末にのみ保存され、以降の変更は自動更新されます。開始を許可しますか？`.split('\n')
      }
    },
    {
      keys: `ui.firstScanRequiresYourConsentIncrementalUpdatesFollow
ui.usuallyUnnecessaryTheLocalDirectoryChecksOnlyNew
ui.initialScanRequiresConsentOriginalJSONStaysLocal
ui.initialIndexCompleteCheckingChangesAutomatically
ui.initialIndexCompletedAutomaticUpdatesDisabled
ui.consentGrantedInitialIndexingIncomplete
ui.indexTaskCreatedViewTaskControlsForProgress
ui.scanningAllChatsAndProjectsForIndexing
ui.searchingLocalIndex
ui.enterKeywordsToSearchTheLocalIndex
ui.buildingInitialLocalDirectory
ui.checkingSelectedChatVersions
ui.noSavedZIPPartsForTheCurrentAccount
ui.consentNotGrantedInitialIndexingNotStarted
ui.indexPausedResumeItInTaskManager
ui.indexingIsRunningInAnotherTab
ui.anotherTaskIsRunningIndexingIsQueued
ui.automaticIncrementalIndexingEnabled
ui.automaticIndexingDisabledRunningTasksUnaffected
ui.indexingRequestedKeepChatGPTOpenAndCheckTask`.split('\n'),
      translations: {
        'zh-TW': `首次掃描需要你的授權；完成後會自動更新新增或變更的對話。
通常不需要使用：對話目錄已保存在本機，平時只檢查新增或變更的對話。
首次掃描需取得授權；原始 JSON 只會儲存在本機。
首次索引已完成，之後會自動檢查增量變更。
首次索引已完成，但自動更新已關閉。
已授權，但首次完整索引尚未完成。
索引工作已建立；請在下方查看進度及操作選項。
正在掃描所有對話與專案（包含分頁），準備建立索引…
正在搜尋本機索引…
輸入關鍵字以搜尋已儲存的本機索引。
首次使用，正在建立本機對話目錄…
正在核對所選對話的目錄版本…
目前帳號沒有已儲存的 ZIP 分卷。
尚未授權，因此沒有開始首次完整索引。
索引工作已暫停；請到工作管理中繼續。
索引工作正在另一個分頁執行。
此帳號已有其他工作正在執行；索引工作將排入佇列。
自動增量索引已開啟。
自動增量索引已關閉；正在執行的工作不受影響。
已送出建立索引的請求。請保持 ChatGPT 分頁開啟，稍後重新整理進度。`.split('\n'),
        es: `La primera exploración requiere tu autorización. Después, las conversaciones nuevas o modificadas se actualizarán automáticamente.
Normalmente no es necesario: la lista de conversaciones se guarda en este dispositivo y solo se comprueban los cambios.
La primera exploración requiere autorización. El JSON original solo se guarda en este dispositivo.
La indexación inicial ha terminado. A partir de ahora se comprobarán los cambios automáticamente.
La indexación inicial ha terminado, pero las actualizaciones automáticas están desactivadas.
Autorización concedida; la indexación inicial todavía no ha terminado.
Tarea de indexación creada. Consulta el progreso y los controles más abajo.
Explorando conversaciones y proyectos, incluidas sus páginas, para preparar el índice…
Buscando en el índice local…
Escribe palabras clave para buscar en el índice guardado en este dispositivo.
Primer uso: creando la lista local de conversaciones…
Comprobando la versión de las conversaciones seleccionadas…
Esta cuenta no tiene partes ZIP guardadas.
No se ha iniciado la primera indexación completa porque todavía no se ha autorizado.
La indexación está en pausa. Reanúdala desde el gestor de tareas.
La indexación se está ejecutando en otra pestaña.
Esta cuenta ya tiene otra tarea activa; la indexación quedará en cola.
La indexación incremental automática está activada.
La indexación automática está desactivada; las tareas en curso no se verán afectadas.
Se ha solicitado el inicio de la indexación. Mantén abierta la pestaña de ChatGPT y vuelve a consultar el progreso más tarde.`.split('\n'),
        hi: `पहली बार चैट स्कैन करने के लिए आपकी अनुमति चाहिए। उसके बाद नई या बदली हुई चैट अपने-आप अपडेट होंगी।
आम तौर पर इसकी ज़रूरत नहीं है: चैट सूची इस डिवाइस पर सेव रहती है और केवल नई या बदली हुई चैट जाँची जाती हैं।
पहले स्कैन के लिए अनुमति ज़रूरी है। मूल JSON केवल इस डिवाइस पर सेव होगा।
पहली इंडेक्सिंग पूरी हो गई है। आगे से बदलाव अपने-आप जाँचे जाएँगे।
पहली इंडेक्सिंग पूरी हो गई है, लेकिन अपने-आप अपडेट होना बंद है।
अनुमति मिल गई है, पर पहली पूरी इंडेक्सिंग अभी बाकी है।
इंडेक्सिंग का कार्य बन गया है। नीचे से प्रगति देखें और कार्य नियंत्रित करें।
इंडेक्सिंग की तैयारी के लिए सभी चैट और प्रोजेक्ट, उनके पेज सहित, स्कैन किए जा रहे हैं…
स्थानीय इंडेक्स में खोज जारी है…
इस डिवाइस पर सेव इंडेक्स में खोजने के लिए शब्द लिखें।
पहली बार उपयोग: स्थानीय चैट सूची बनाई जा रही है…
चुनी गई चैट के सूची संस्करण जाँचे जा रहे हैं…
इस खाते में ZIP के कोई सेव किए हुए हिस्से नहीं हैं।
अनुमति न मिलने से पहली पूरी इंडेक्सिंग शुरू नहीं हुई।
इंडेक्सिंग रुकी हुई है। कार्य प्रबंधक से दोबारा शुरू करें।
इंडेक्सिंग किसी दूसरे टैब में चल रही है।
इस खाते में एक और कार्य चल रहा है; इंडेक्सिंग कतार में रहेगी।
अपने-आप होने वाली क्रमिक इंडेक्सिंग चालू है।
अपने-आप इंडेक्स अपडेट होना बंद है; चल रहे कार्यों पर असर नहीं पड़ेगा।
इंडेक्सिंग शुरू करने का अनुरोध भेज दिया गया है। ChatGPT टैब खुला रखें और कुछ देर बाद प्रगति फिर देखें।`.split('\n'),
        ar: `يتطلب الفحص الأول موافقتك. وبعد اكتماله، ستُحدَّث المحادثات الجديدة أو المعدّلة تلقائيًا.
غالبًا لا حاجة لهذا الخيار؛ فقائمة المحادثات محفوظة على الجهاز، وتُفحص المحادثات الجديدة أو المعدّلة فقط.
يلزم الإذن لإجراء الفحص الأول، وسيُحفظ ملف JSON الأصلي على هذا الجهاز فقط.
اكتملت الفهرسة الأولى، وسيجري التحقق من التغييرات تلقائيًا لاحقًا.
اكتملت الفهرسة الأولى، لكن التحديث التلقائي متوقف.
تم منح الإذن، ولم تكتمل الفهرسة الأولى بعد.
تم إنشاء مهمة الفهرسة. يمكنك متابعة التقدم والتحكم بالمهمة أدناه.
جارٍ فحص جميع المحادثات والمشاريع وصفحاتها لإعداد الفهرس…
جارٍ البحث في الفهرس المحلي…
أدخل كلمات للبحث في الفهرس المحفوظ على هذا الجهاز.
هذه أول مرة للاستخدام؛ جارٍ إنشاء قائمة المحادثات المحلية…
جارٍ التحقق من إصدارات المحادثات المحددة…
لا توجد أجزاء ZIP محفوظة لهذا الحساب.
لم تبدأ الفهرسة الكاملة الأولى لعدم منح الإذن.
مهمة الفهرسة متوقفة مؤقتًا؛ استأنفها من إدارة المهام.
تعمل مهمة الفهرسة في علامة تبويب أخرى.
توجد مهمة أخرى قيد التنفيذ لهذا الحساب؛ ستنتظر الفهرسة في قائمة الانتظار.
تم تفعيل الفهرسة التزايدية التلقائية.
تم إيقاف التحديث التلقائي للفهرس؛ لن تتأثر المهام الجارية.
تم إرسال طلب بدء الفهرسة. أبقِ علامة تبويب ChatGPT مفتوحة وتحقق من التقدم لاحقًا.`.split('\n'),
        'pt-BR': `A primeira verificação exige sua autorização. Depois, conversas novas ou alteradas serão atualizadas automaticamente.
Normalmente não é necessário: a lista de conversas fica salva neste dispositivo, e apenas novidades ou alterações são verificadas.
A primeira verificação exige autorização. O JSON original permanece somente neste dispositivo.
A indexação inicial foi concluída. As alterações serão verificadas automaticamente daqui em diante.
A indexação inicial foi concluída, mas a atualização automática está desativada.
Autorização concedida; a indexação inicial ainda não terminou.
A tarefa de indexação foi criada. Acompanhe o progresso e os controles abaixo.
Verificando todas as conversas e projetos, incluindo as páginas, para preparar o índice…
Pesquisando no índice local…
Digite palavras-chave para pesquisar no índice salvo neste dispositivo.
Primeiro uso: criando a lista local de conversas…
Verificando as versões das conversas selecionadas…
Esta conta não possui partes ZIP salvas.
A primeira indexação completa não foi iniciada porque ainda não houve autorização.
A indexação está pausada. Retome pelo gerenciador de tarefas.
A indexação está em execução em outra aba.
Outra tarefa já está em execução nesta conta; a indexação ficará na fila.
A indexação incremental automática está ativada.
A atualização automática do índice está desativada; tarefas em andamento não serão afetadas.
A solicitação para iniciar a indexação foi enviada. Mantenha a aba do ChatGPT aberta e verifique o progresso mais tarde.`.split('\n'),
        bn: `প্রথমবার স্ক্যান করতে আপনার অনুমতি লাগবে। এরপর নতুন বা পরিবর্তিত চ্যাট স্বয়ংক্রিয়ভাবে হালনাগাদ হবে।
সাধারণত এটির দরকার হয় না: চ্যাটের তালিকা এই ডিভাইসে সংরক্ষিত থাকে, শুধু নতুন বা পরিবর্তিত চ্যাট পরীক্ষা করা হয়।
প্রথম স্ক্যানের জন্য অনুমতি প্রয়োজন। মূল JSON শুধু এই ডিভাইসে সংরক্ষিত থাকবে।
প্রথম ইনডেক্স তৈরি সম্পন্ন হয়েছে। এরপর পরিবর্তন স্বয়ংক্রিয়ভাবে পরীক্ষা করা হবে।
প্রথম ইনডেক্স তৈরি সম্পন্ন হয়েছে, তবে স্বয়ংক্রিয় হালনাগাদ বন্ধ আছে।
অনুমতি দেওয়া হয়েছে, কিন্তু প্রথম পূর্ণ ইনডেক্স এখনও সম্পন্ন হয়নি।
ইনডেক্স তৈরির কাজ শুরু করা হয়েছে। নিচে অগ্রগতি দেখুন ও কাজ নিয়ন্ত্রণ করুন।
ইনডেক্স তৈরির প্রস্তুতির জন্য সব চ্যাট ও প্রজেক্টের পৃষ্ঠা পরীক্ষা করা হচ্ছে…
স্থানীয় ইনডেক্সে খোঁজা হচ্ছে…
এই ডিভাইসে সংরক্ষিত ইনডেক্সে খুঁজতে শব্দ লিখুন।
প্রথম ব্যবহার: স্থানীয় চ্যাটের তালিকা তৈরি হচ্ছে…
নির্বাচিত চ্যাটের তালিকার সংস্করণ পরীক্ষা করা হচ্ছে…
এই অ্যাকাউন্টে কোনো সংরক্ষিত ZIP অংশ নেই।
অনুমতি দেওয়া হয়নি, তাই প্রথম পূর্ণ ইনডেক্স তৈরি শুরু হয়নি।
ইনডেক্স তৈরির কাজ বিরতিতে আছে; কাজ ব্যবস্থাপনা থেকে আবার শুরু করুন।
ইনডেক্স তৈরির কাজ অন্য একটি ট্যাবে চলছে।
এই অ্যাকাউন্টে আরেকটি কাজ চলছে; ইনডেক্স তৈরির কাজ সারিতে অপেক্ষা করবে।
স্বয়ংক্রিয়ভাবে পরিবর্তিত তথ্য ইনডেক্স করার ব্যবস্থা চালু আছে।
স্বয়ংক্রিয় ইনডেক্স হালনাগাদ বন্ধ আছে; চলমান কাজের ওপর প্রভাব পড়বে না।
ইনডেক্স তৈরি শুরুর অনুরোধ পাঠানো হয়েছে। ChatGPT ট্যাব খোলা রাখুন এবং কিছুক্ষণ পরে অগ্রগতি দেখুন।`.split('\n'),
        id: `Pemindaian pertama memerlukan izin Anda. Setelah selesai, percakapan baru atau yang berubah akan diperbarui otomatis.
Biasanya tidak diperlukan: daftar percakapan sudah tersimpan di perangkat ini, dan hanya percakapan baru atau yang berubah yang diperiksa.
Pemindaian pertama memerlukan izin. JSON asli hanya disimpan di perangkat ini.
Pengindeksan awal selesai. Perubahan berikutnya akan diperiksa secara otomatis.
Pengindeksan awal selesai, tetapi pembaruan otomatis dinonaktifkan.
Izin telah diberikan, tetapi pengindeksan awal belum selesai.
Tugas pengindeksan dibuat. Lihat progres dan kontrolnya di bawah.
Memindai semua percakapan dan proyek beserta halamannya untuk menyiapkan indeks…
Mencari dalam indeks lokal…
Masukkan kata kunci untuk mencari dalam indeks yang tersimpan di perangkat ini.
Penggunaan pertama: membuat daftar percakapan lokal…
Memeriksa versi daftar percakapan yang dipilih…
Akun ini tidak memiliki bagian ZIP yang tersimpan.
Pengindeksan lengkap pertama belum dimulai karena izin belum diberikan.
Pengindeksan dijeda. Lanjutkan melalui Pengelola Tugas.
Pengindeksan sedang berjalan di tab lain.
Ada tugas lain yang berjalan di akun ini; pengindeksan akan masuk antrean.
Pengindeksan bertahap otomatis telah diaktifkan.
Pembaruan indeks otomatis dinonaktifkan; tugas yang sedang berjalan tidak terpengaruh.
Permintaan memulai pengindeksan telah dikirim. Biarkan tab ChatGPT terbuka dan periksa progres nanti.`.split('\n'),
        fr: `La première analyse nécessite votre autorisation. Ensuite, les conversations nouvelles ou modifiées seront mises à jour automatiquement.
Normalement inutile : la liste des conversations est enregistrée sur cet appareil et seuls les ajouts ou changements sont vérifiés.
La première analyse nécessite une autorisation. Le JSON d’origine reste uniquement sur cet appareil.
L’indexation initiale est terminée. Les changements seront désormais vérifiés automatiquement.
L’indexation initiale est terminée, mais les mises à jour automatiques sont désactivées.
L’autorisation a été accordée, mais l’indexation initiale n’est pas encore terminée.
La tâche d’indexation a été créée. Consultez sa progression et ses commandes ci-dessous.
Analyse de toutes les conversations et de tous les projets, pages comprises, pour préparer l’index…
Recherche dans l’index local…
Saisissez des mots-clés pour rechercher dans l’index conservé sur cet appareil.
Première utilisation : création de la liste locale des conversations…
Vérification des versions des conversations sélectionnées…
Aucune partie ZIP enregistrée pour ce compte.
La première indexation complète n’a pas commencé, faute d’autorisation.
L’indexation est en pause. Reprenez-la dans le gestionnaire des tâches.
L’indexation est en cours dans un autre onglet.
Une autre tâche est active pour ce compte ; l’indexation sera mise en file d’attente.
L’indexation incrémentielle automatique est activée.
La mise à jour automatique de l’index est désactivée ; les tâches en cours ne sont pas affectées.
La demande de démarrage de l’indexation a été envoyée. Gardez l’onglet ChatGPT ouvert et vérifiez la progression plus tard.`.split('\n'),
        ru: `Для первого сканирования требуется ваше разрешение. После него новые и изменённые чаты будут обновляться автоматически.
Обычно это не требуется: список чатов хранится на устройстве, поэтому проверяются только новые и изменённые чаты.
Для первого сканирования нужно разрешение. Исходный JSON сохраняется только на этом устройстве.
Первичная индексация завершена. Теперь изменения будут проверяться автоматически.
Первичная индексация завершена, но автоматическое обновление выключено.
Разрешение получено, но первичная индексация ещё не завершена.
Задача индексации создана. Её ход и элементы управления доступны ниже.
Проверка всех чатов и проектов, включая страницы, для подготовки индекса…
Поиск по локальному индексу…
Введите ключевые слова для поиска по индексу, сохранённому на этом устройстве.
Первый запуск: создаётся локальный список чатов…
Проверка версий выбранных чатов…
Для этой учётной записи нет сохранённых частей ZIP.
Первичная полная индексация не началась, так как разрешение ещё не получено.
Индексация приостановлена. Продолжите её в управлении задачами.
Индексация выполняется в другой вкладке.
Для этой учётной записи уже выполняется другая задача; индексация будет ждать в очереди.
Автоматическая индексация изменений включена.
Автоматическое обновление индекса выключено; выполняемые задачи не затронуты.
Запрос на запуск индексации отправлен. Оставьте вкладку ChatGPT открытой и проверьте ход выполнения позже.`.split('\n'),
        ja: `初回のスキャンには許可が必要です。完了後は、新規または変更されたチャットを自動更新します。
通常は不要です。チャット一覧は端末に保存され、普段は新規または変更されたチャットだけを確認します。
初回スキャンには許可が必要です。元の JSON はこの端末にのみ保存されます。
初回のインデックス作成が完了しました。以降は変更分を自動確認します。
初回のインデックス作成は完了しましたが、自動更新は無効です。
許可されていますが、初回のインデックス作成はまだ完了していません。
インデックス作成タスクを登録しました。進行状況と操作ボタンは下で確認できます。
インデックス作成の準備として、すべてのチャットとプロジェクトをページ単位で確認中…
ローカルインデックスを検索中…
端末に保存されたインデックスを検索するキーワードを入力してください。
初回利用のため、ローカルのチャット一覧を作成中…
選択したチャットの一覧データのバージョンを確認中…
このアカウントには保存済みの ZIP 分割ファイルがありません。
許可されていないため、初回の全件インデックス作成は開始していません。
インデックス作成が一時停止中です。タスク管理から再開してください。
別のタブでインデックス作成が実行中です。
このアカウントでは別のタスクが実行中のため、インデックス作成は順番待ちになります。
差分の自動インデックス作成が有効になりました。
インデックスの自動更新を無効にしました。実行中のタスクには影響しません。
インデックス作成の開始を要求しました。ChatGPT のタブを開いたままにして、後ほど進行状況を更新してください。`.split('\n')
      }
    }
    ,
    {
      keys: ['ui.failedToReadLocalData', 'ui.exportFailed',
        'ui.failedToLoadTask', 'ui.indexOperationFailed'],
      translations: {
        'zh-TW': ['本機資料讀取失敗', '匯出失敗', '工作讀取失敗', '索引操作失敗'],
        es: ['No se pudieron leer los datos locales', 'Error al exportar',
          'No se pudo cargar la tarea', 'Error al procesar el índice'],
        hi: ['स्थानीय डेटा नहीं पढ़ा जा सका', 'एक्सपोर्ट विफल रहा',
          'कार्य लोड नहीं हो सका', 'इंडेक्स प्रक्रिया विफल रही'],
        ar: ['تعذرت قراءة البيانات المحلية', 'فشل التصدير',
          'تعذر تحميل المهمة', 'فشلت عملية الفهرسة'],
        'pt-BR': ['Falha ao ler dados locais', 'Falha na exportação',
          'Falha ao carregar tarefa', 'Falha na operação de indexação'],
        bn: ['স্থানীয় ডেটা পড়া যায়নি', 'এক্সপোর্ট ব্যর্থ হয়েছে',
          'কাজ লোড করা যায়নি', 'ইনডেক্স প্রক্রিয়া ব্যর্থ হয়েছে'],
        id: ['Gagal membaca data lokal', 'Ekspor gagal',
          'Gagal memuat tugas', 'Operasi indeks gagal'],
        fr: ['Impossible de lire les données locales', 'Échec de l’exportation',
          'Impossible de charger la tâche', 'Échec de l’opération d’indexation'],
        ru: ['Не удалось прочитать локальные данные', 'Ошибка экспорта',
          'Не удалось загрузить задачу', 'Ошибка работы с индексом'],
        ja: ['ローカルデータの読み込みに失敗しました', 'エクスポートに失敗しました',
          'タスクの読み込みに失敗しました', 'インデックスの処理に失敗しました']
      }
    },
    {
      // Full-text indexing progress only; export and task-scheduler statuses
      // are intentionally outside this review batch.
      keys: [
        'status.indexedForThisAccount',
        'status.updatingIndex',
        'status.addedUpdatedFailed',
        'status.chatsRemainToBeIndexedResumeTo',
        'status.indexUpToDateUpdatedSkipped',
        'status.localChatsCheckingForUpdates'
      ],
      translations: {
        'zh-TW': [
          '此帳號已索引 {1}/{2} 段對話',
          '正在更新索引：{1}',
          '新增或更新 {1} 筆，失敗 {2} 筆',
          '首次索引尚有 {1} 段對話未完成，可繼續執行',
          '索引已是最新狀態 · 更新 {1} 筆、略過 {2} 筆',
          '本機已有 {1} 段對話，正在檢查最新變更…'
        ],
        es: [
          'Indexadas {1} de {2} conversaciones de esta cuenta',
          'Actualizando el índice: {1}',
          '{1} registros añadidos o actualizados; {2} fallidos',
          'Quedan {1} conversaciones por indexar inicialmente; puedes reanudar la tarea',
          'Índice al día · {1} registros actualizados, {2} omitidos',
          'Hay {1} conversaciones guardadas localmente; comprobando cambios…'
        ],
        hi: [
          'इस खाते की {1}/{2} चैट इंडेक्स हो चुकी हैं',
          'इंडेक्स अपडेट हो रहा है: {1}',
          '{1} रिकॉर्ड जोड़े या अपडेट किए गए; {2} विफल रहे',
          'पहली इंडेक्सिंग में {1} चैट अभी बाकी हैं; कार्य फिर शुरू किया जा सकता है',
          'इंडेक्स अपडेट है · {1} रिकॉर्ड अपडेट हुए, {2} छोड़े गए',
          'इस डिवाइस पर {1} चैट सेव हैं; नए बदलाव जाँचे जा रहे हैं…'
        ],
        ar: [
          'تمت فهرسة {1} من أصل {2} محادثة لهذا الحساب',
          'جارٍ تحديث الفهرس: {1}',
          'تمت إضافة أو تحديث {1} سجل؛ وفشل {2}',
          'تبقت {1} محادثة لإكمال الفهرسة الأولى؛ يمكنك استئناف المهمة',
          'الفهرس محدّث · تم تحديث {1} سجل وتخطي {2}',
          'توجد {1} محادثة محفوظة محليًا؛ جارٍ التحقق من التغييرات…'
        ],
        'pt-BR': [
          'Indexadas {1} de {2} conversas desta conta',
          'Atualizando o índice: {1}',
          '{1} registros adicionados ou atualizados; {2} com falha',
          'Ainda faltam {1} conversas na indexação inicial; você pode retomar a tarefa',
          'Índice atualizado · {1} registros atualizados, {2} ignorados',
          'Há {1} conversas salvas localmente; verificando alterações…'
        ],
        bn: [
          'এই অ্যাকাউন্টের {1}/{2}টি চ্যাট ইনডেক্স করা হয়েছে',
          'ইনডেক্স হালনাগাদ হচ্ছে: {1}',
          '{1}টি রেকর্ড যোগ বা হালনাগাদ হয়েছে; {2}টি ব্যর্থ হয়েছে',
          'প্রথম ইনডেক্স তৈরিতে এখনও {1}টি চ্যাট বাকি; কাজটি আবার শুরু করা যাবে',
          'ইনডেক্স হালনাগাদ আছে · {1}টি রেকর্ড হালনাগাদ, {2}টি এড়িয়ে যাওয়া হয়েছে',
          'এই ডিভাইসে {1}টি চ্যাট সংরক্ষিত আছে; পরিবর্তন পরীক্ষা করা হচ্ছে…'
        ],
        id: [
          '{1} dari {2} percakapan akun ini telah diindeks',
          'Memperbarui indeks: {1}',
          '{1} entri ditambahkan atau diperbarui; {2} gagal',
          'Masih ada {1} percakapan dalam pengindeksan awal; tugas dapat dilanjutkan',
          'Indeks sudah terbaru · {1} entri diperbarui, {2} dilewati',
          'Ada {1} percakapan tersimpan secara lokal; memeriksa perubahan…'
        ],
        fr: [
          '{1} conversations indexées sur {2} pour ce compte',
          'Mise à jour de l’index : {1}',
          '{1} entrées ajoutées ou mises à jour ; {2} échecs',
          'Il reste {1} conversations à indexer lors du premier passage ; vous pouvez reprendre la tâche',
          'Index à jour · {1} entrées mises à jour, {2} ignorées',
          '{1} conversations enregistrées localement ; recherche des modifications…'
        ],
        ru: [
          'Проиндексировано {1} из {2} чатов этой учётной записи',
          'Обновление индекса: {1}',
          'Добавлено или обновлено записей: {1}; ошибок: {2}',
          'В первичной индексации осталось {1} чатов; задачу можно продолжить',
          'Индекс актуален · обновлено {1}, пропущено {2}',
          'Локально сохранено {1} чатов; проверка изменений…'
        ],
        ja: [
          'このアカウントのチャット {1}/{2} 件をインデックス済み',
          'インデックスを更新中：{1}',
          '{1} 件を追加・更新、{2} 件が失敗',
          '初回のインデックス作成が残り {1} 件です。タスクを再開して続行できます',
          'インデックスは最新です · 更新 {1} 件、スキップ {2} 件',
          'ローカルに {1} 件のチャットを保存済み。変更を確認中…'
        ]
      }
    },
    {
      // Bulk conversation export: distinguish saved ZIP parts from downloads
      // that have merely been initiated by the browser.
      keys: [
        'status.succeededFailedZIPParts',
        'status.succeededFailed',
        'status.startedZIPPartDownloadsCheckBrowserDownloads',
        'status.deletedSavedZIPPartsOriginalChatCache',
        'status.zipPartSavedAndDownloadStarted',
        'status.zipPartSaved',
        'status.savedZIPPartsSucceededFailedVerifyBrowser',
        'status.downloadingSavedZIPPart'
      ],
      translations: {
        'zh-TW': [
          '{1}/{2} · 成功 {3} 筆 · 失敗 {4} 筆 · ZIP 分卷 {5} 個',
          '{1}/{2} · 成功 {3} 筆 · 失敗 {4} 筆',
          '已發起 {1} 個 ZIP 分卷的下載，請確認瀏覽器下載狀態',
          '已清除 {1} 個本機 ZIP 分卷；原始對話快取及工作記錄仍保留',
          '第 {1} 個 ZIP 分卷已儲存並發起下載 · {3}/{4}',
          '第 {1} 個 ZIP 分卷已儲存 · {3}/{4}',
          '已儲存 {1} 個 ZIP 分卷 · 成功 {2} 筆、失敗 {3} 筆（請另外確認瀏覽器是否下載完成）',
          '已發起下載已儲存的 ZIP 分卷 {1}/{2}'
        ],
        es: [
          '{1}/{2} · {3} correctas · {4} fallidas · {5} partes ZIP',
          '{1}/{2} · {3} correctas · {4} fallidas',
          'Se ha iniciado la descarga de {1} partes ZIP. Comprueba las descargas del navegador',
          'Se han eliminado {1} partes ZIP locales; se conservan la caché de conversaciones y el historial de tareas',
          'Parte ZIP {1} guardada; descarga iniciada · {3}/{4}',
          'Parte ZIP {1} guardada · {3}/{4}',
          '{1} partes ZIP guardadas · {2} correctas, {3} fallidas (comprueba por separado las descargas del navegador)',
          'Descarga iniciada de la parte ZIP guardada {1}/{2}'
        ],
        hi: [
          '{1}/{2} · {3} सफल · {4} विफल · ZIP के {5} हिस्से',
          '{1}/{2} · {3} सफल · {4} विफल',
          'ZIP के {1} हिस्सों का डाउनलोड शुरू किया गया है। ब्राउज़र में डाउनलोड की स्थिति जाँचें',
          'स्थानीय ZIP के {1} हिस्से हटा दिए गए हैं; मूल चैट कैश और कार्य इतिहास सुरक्षित हैं',
          'ZIP का हिस्सा {1} सेव हो गया है और डाउनलोड शुरू कर दिया गया है · {3}/{4}',
          'ZIP का हिस्सा {1} सेव हो गया है · {3}/{4}',
          'ZIP के {1} हिस्से सेव हुए · {2} सफल, {3} विफल (ब्राउज़र में डाउनलोड पूरा होने की अलग से जाँच करें)',
          'सेव किए गए ZIP हिस्से {1}/{2} का डाउनलोड शुरू किया गया है'
        ],
        ar: [
          '{1}/{2} · نجح {3} · فشل {4} · {5} أجزاء ZIP',
          '{1}/{2} · نجح {3} · فشل {4}',
          'بدأ تنزيل {1} من أجزاء ZIP. تحقّق من حالة التنزيلات في المتصفح',
          'حُذف {1} من أجزاء ZIP المحلية؛ ولا تزال ذاكرة المحادثات الأصلية وسجل المهام محفوظين',
          'حُفظ جزء ZIP رقم {1} وبدأ تنزيله · {3}/{4}',
          'حُفظ جزء ZIP رقم {1} · {3}/{4}',
          'تم حفظ {1} من أجزاء ZIP · نجح {2} وفشل {3} (تحقّق بشكل منفصل من اكتمال التنزيل في المتصفح)',
          'بدأ تنزيل جزء ZIP المحفوظ رقم {1} من أصل {2}'
        ],
        'pt-BR': [
          '{1}/{2} · {3} com sucesso · {4} com falha · {5} partes ZIP',
          '{1}/{2} · {3} com sucesso · {4} com falha',
          'O download de {1} partes ZIP foi iniciado. Confira os downloads no navegador',
          '{1} partes ZIP locais foram removidas; o cache original das conversas e o histórico das tarefas foram mantidos',
          'Parte ZIP {1} salva e download iniciado · {3}/{4}',
          'Parte ZIP {1} salva · {3}/{4}',
          '{1} partes ZIP salvas · {2} com sucesso, {3} com falha (confira separadamente os downloads no navegador)',
          'Download iniciado da parte ZIP salva {1}/{2}'
        ],
        bn: [
          '{1}/{2} · {3}টি সফল · {4}টি ব্যর্থ · ZIP-এর {5}টি অংশ',
          '{1}/{2} · {3}টি সফল · {4}টি ব্যর্থ',
          'ZIP-এর {1}টি অংশ ডাউনলোড শুরু হয়েছে। ব্রাউজারের ডাউনলোডের অবস্থা পরীক্ষা করুন',
          'স্থানীয় ZIP-এর {1}টি অংশ সরানো হয়েছে; মূল চ্যাট ক্যাশ ও কাজের ইতিহাস অক্ষত আছে',
          'ZIP-এর {1} নম্বর অংশ সংরক্ষিত হয়েছে এবং ডাউনলোড শুরু হয়েছে · {3}/{4}',
          'ZIP-এর {1} নম্বর অংশ সংরক্ষিত হয়েছে · {3}/{4}',
          'ZIP-এর {1}টি অংশ সংরক্ষিত · {2}টি সফল, {3}টি ব্যর্থ (ব্রাউজারে ডাউনলোড শেষ হয়েছে কি না আলাদাভাবে দেখুন)',
          'সংরক্ষিত ZIP-এর {1}/{2} নম্বর অংশ ডাউনলোড শুরু হয়েছে'
        ],
        id: [
          '{1}/{2} · {3} berhasil · {4} gagal · {5} bagian ZIP',
          '{1}/{2} · {3} berhasil · {4} gagal',
          'Pengunduhan {1} bagian ZIP telah dimulai. Periksa status unduhan di browser',
          '{1} bagian ZIP lokal dihapus; cache percakapan asli dan riwayat tugas tetap disimpan',
          'Bagian ZIP {1} tersimpan dan pengunduhan dimulai · {3}/{4}',
          'Bagian ZIP {1} tersimpan · {3}/{4}',
          '{1} bagian ZIP tersimpan · {2} berhasil, {3} gagal (periksa penyelesaian unduhan di browser secara terpisah)',
          'Pengunduhan bagian ZIP tersimpan {1}/{2} telah dimulai'
        ],
        fr: [
          '{1}/{2} · {3} réussites · {4} échecs · {5} parties ZIP',
          '{1}/{2} · {3} réussites · {4} échecs',
          'Le téléchargement de {1} parties ZIP a été lancé. Vérifiez les téléchargements du navigateur',
          '{1} parties ZIP locales supprimées ; le cache des conversations d’origine et l’historique des tâches sont conservés',
          'Partie ZIP {1} enregistrée et téléchargement lancé · {3}/{4}',
          'Partie ZIP {1} enregistrée · {3}/{4}',
          '{1} parties ZIP enregistrées · {2} réussites, {3} échecs (vérifiez séparément les téléchargements du navigateur)',
          'Téléchargement lancé pour la partie ZIP enregistrée {1}/{2}'
        ],
        ru: [
          '{1}/{2} · успешно: {3} · ошибок: {4} · частей ZIP: {5}',
          '{1}/{2} · успешно: {3} · ошибок: {4}',
          'Запущена загрузка {1} частей ZIP. Проверьте загрузки в браузере',
          'Удалено локальных частей ZIP: {1}; исходный кэш чатов и история задач сохранены',
          'Часть ZIP № {1} сохранена, загрузка запущена · {3}/{4}',
          'Часть ZIP № {1} сохранена · {3}/{4}',
          'Сохранено частей ZIP: {1} · успешно: {2}, ошибок: {3} (завершение загрузок в браузере проверяется отдельно)',
          'Запущена загрузка сохранённой части ZIP {1}/{2}'
        ],
        ja: [
          '{1}/{2} · 成功 {3} 件 · 失敗 {4} 件 · ZIP 分割ファイル {5} 個',
          '{1}/{2} · 成功 {3} 件 · 失敗 {4} 件',
          'ZIP 分割ファイル {1} 個のダウンロードを開始しました。ブラウザのダウンロード状況を確認してください',
          'ローカルの ZIP 分割ファイル {1} 個を削除しました。元のチャットキャッシュとタスク履歴は残ります',
          'ZIP 分割ファイル {1} を保存し、ダウンロードを開始しました · {3}/{4}',
          'ZIP 分割ファイル {1} を保存しました · {3}/{4}',
          'ZIP 分割ファイル {1} 個を保存 · 成功 {2} 件、失敗 {3} 件（ブラウザでのダウンロード完了は別途確認してください）',
          '保存済み ZIP 分割ファイル {1}/{2} のダウンロードを開始しました'
        ]
      }
    },
    {
      keys: [
        'status.retrying',
        'status.rateLimitCooldownUntil',
        'status.rateLimitedResumeInS',
        'status.batchCompleteContinueInS',
        'status.requestFailedRetryInS',
        'status.rateLimitedResumeInS_24',
        'status.batchCompleteContinueInS_25',
        'status.requestFailedRetryInS_26',
        'status.requestCooldownSRemainingAutomaticResume',
        'status.sRemaining',
        'status.resuming'
      ],
      translations: {
        'zh-TW': [
          '正在重試 {1}/{2} · {3}',
          '請求限流冷卻中，預計至 {1}',
          '請求受限 · {1} 秒後繼續 · {2}',
          '本批次已完成 · {1} 秒後繼續 · {2}',
          '請求失敗 · {1} 秒後重試 · {2}',
          '請求受限 · {1} 秒後繼續 · {2}',
          '本批次已完成 · {1} 秒後繼續 · {2}',
          '請求失敗 · {1} 秒後重試（第 {2}/{3} 次）· {4}',
          '請求冷卻中 · 剩餘 {1} 秒 · 到期後自動恢復',
          '· 還需 {1} 秒',
          '· 等待結束，正在恢復'
        ],
        es: [
          'Reintentando {1}/{2} · {3}',
          'Límite de solicitudes: espera hasta {1}',
          'Límite de solicitudes · se reanuda en {1} s · {2}',
          'Lote completado · continúa en {1} s · {2}',
          'Solicitud fallida · nuevo intento en {1} s · {2}',
          'Límite de solicitudes · se reanuda en {1} s · {2}',
          'Lote completado · continúa en {1} s · {2}',
          'Solicitud fallida · nuevo intento en {1} s ({2}/{3}) · {4}',
          'En espera por límite de solicitudes · quedan {1} s · reanudación automática',
          '· quedan {1} s',
          '· Fin de la espera; reanudando'
        ],
        hi: [
          'पुनः प्रयास {1}/{2} · {3}',
          'अनुरोध सीमा के कारण प्रतीक्षा, समय: {1}',
          'अनुरोध सीमा लागू · {1} सेकंड बाद जारी होगा · {2}',
          'बैच पूरा · {1} सेकंड बाद जारी रहेगा · {2}',
          'अनुरोध विफल · {1} सेकंड बाद पुनः प्रयास · {2}',
          'अनुरोध सीमा लागू · {1} सेकंड बाद जारी होगा · {2}',
          'बैच पूरा · {1} सेकंड बाद जारी रहेगा · {2}',
          'अनुरोध विफल · {1} सेकंड बाद पुनः प्रयास ({2}/{3}) · {4}',
          'अनुरोध सीमा के कारण प्रतीक्षा · {1} सेकंड शेष · अपने-आप फिर शुरू होगा',
          '· {1} सेकंड बाकी',
          '· प्रतीक्षा समाप्त, फिर से शुरू हो रहा है'
        ],
        ar: [
          'جارٍ إعادة المحاولة {1}/{2} · {3}',
          'انتظار بسبب حد الطلبات حتى {1}',
          'تم تقييد الطلبات · المتابعة بعد {1} ثانية · {2}',
          'اكتملت الدفعة · المتابعة بعد {1} ثانية · {2}',
          'فشل الطلب · إعادة المحاولة بعد {1} ثانية · {2}',
          'تم تقييد الطلبات · المتابعة بعد {1} ثانية · {2}',
          'اكتملت الدفعة · المتابعة بعد {1} ثانية · {2}',
          'فشل الطلب · إعادة المحاولة بعد {1} ثانية ({2}/{3}) · {4}',
          'انتظار بسبب حد الطلبات · تبقى {1} ثانية · استئناف تلقائي',
          '· تبقى {1} ثانية',
          '· انتهى الانتظار، جارٍ الاستئناف'
        ],
        'pt-BR': [
          'Tentando novamente {1}/{2} · {3}',
          'Limite de requisições: pausa até {1}',
          'Limite de requisições · retomada em {1} s · {2}',
          'Lote concluído · continua em {1} s · {2}',
          'Falha na solicitação · nova tentativa em {1} s · {2}',
          'Limite de requisições · retomada em {1} s · {2}',
          'Lote concluído · continua em {1} s · {2}',
          'Falha na solicitação · nova tentativa em {1} s ({2}/{3}) · {4}',
          'Aguardando por limite de requisições · restam {1} s · retomada automática',
          '· faltam {1} s',
          '· A espera terminou; retomando'
        ],
        bn: [
          'আবার চেষ্টা করা হচ্ছে {1}/{2} · {3}',
          'অনুরোধের সীমার কারণে অপেক্ষা, শেষ হবে {1}',
          'অনুরোধের সীমা প্রয়োগ হয়েছে · {1} সেকেন্ড পরে চলবে · {2}',
          'ব্যাচ সম্পন্ন · {1} সেকেন্ড পরে চলবে · {2}',
          'অনুরোধ ব্যর্থ · {1} সেকেন্ড পরে আবার চেষ্টা · {2}',
          'অনুরোধের সীমা প্রয়োগ হয়েছে · {1} সেকেন্ড পরে চলবে · {2}',
          'ব্যাচ সম্পন্ন · {1} সেকেন্ড পরে চলবে · {2}',
          'অনুরোধ ব্যর্থ · {1} সেকেন্ড পরে আবার চেষ্টা ({2}/{3}) · {4}',
          'অনুরোধের সীমার কারণে অপেক্ষা · {1} সেকেন্ড বাকি · স্বয়ংক্রিয়ভাবে আবার শুরু হবে',
          '· আরও {1} সেকেন্ড বাকি',
          '· অপেক্ষা শেষ, আবার শুরু হচ্ছে'
        ],
        id: [
          'Mencoba lagi {1}/{2} · {3}',
          'Jeda batas permintaan hingga {1}',
          'Permintaan dibatasi · lanjut dalam {1} dtk · {2}',
          'Batch selesai · lanjut dalam {1} dtk · {2}',
          'Permintaan gagal · coba lagi dalam {1} dtk · {2}',
          'Permintaan dibatasi · lanjut dalam {1} dtk · {2}',
          'Batch selesai · lanjut dalam {1} dtk · {2}',
          'Permintaan gagal · coba lagi dalam {1} dtk ({2}/{3}) · {4}',
          'Jeda karena batas permintaan · tersisa {1} detik · lanjut otomatis',
          '· tersisa {1} detik',
          '· Waktu tunggu selesai, melanjutkan'
        ],
        fr: [
          'Nouvelle tentative {1}/{2} · {3}',
          'Limitation des requêtes : attente jusqu’à {1}',
          'Requêtes limitées · reprise dans {1} s · {2}',
          'Lot terminé · reprise dans {1} s · {2}',
          'Échec de la requête · nouvelle tentative dans {1} s · {2}',
          'Requêtes limitées · reprise dans {1} s · {2}',
          'Lot terminé · reprise dans {1} s · {2}',
          'Échec de la requête · nouvelle tentative dans {1} s ({2}/{3}) · {4}',
          'En attente à cause de la limite de requêtes · encore {1} s · reprise automatique',
          '· encore {1} s',
          '· Fin de l’attente, reprise en cours'
        ],
        ru: [
          'Повторная попытка {1}/{2} · {3}',
          'Ожидание из-за лимита запросов до {1}',
          'Достигнут лимит запросов · продолжение через {1} с · {2}',
          'Пакет завершён · продолжение через {1} с · {2}',
          'Ошибка запроса · повтор через {1} с · {2}',
          'Достигнут лимит запросов · продолжение через {1} с · {2}',
          'Пакет завершён · продолжение через {1} с · {2}',
          'Ошибка запроса · повтор через {1} с ({2}/{3}) · {4}',
          'Ожидание из-за лимита запросов · осталось {1} с · автоматическое продолжение',
          '· осталось {1} с',
          '· Ожидание завершено, возобновление'
        ],
        ja: [
          '再試行中 {1}/{2} · {3}',
          'リクエスト制限による待機終了予定：{1}',
          'リクエスト制限中 · {1} 秒後に再開 · {2}',
          'バッチ完了 · {1} 秒後に続行 · {2}',
          'リクエスト失敗 · {1} 秒後に再試行 · {2}',
          'リクエスト制限中 · {1} 秒後に再開 · {2}',
          'バッチ完了 · {1} 秒後に続行 · {2}',
          'リクエスト失敗 · {1} 秒後に再試行（{2}/{3}）· {4}',
          'リクエスト制限で待機中 · 残り {1} 秒 · 自動再開',
          '· 残り {1} 秒',
          '· 待機終了、再開中'
        ]
      }
    },
    {
      // Literal wait/resume fragments are matched before dynamic templates
      // because they are also standalone locale keys.
      keys: [
        'ui.waitingForAccountRateLimitCooldown',
        'ui.waitingForAccountRateLimitCooldown_4cb2540',
        'ui.resumingAfterWait',
        'ui.resumingAfterWait_586dda0'
      ],
      translations: {
        'zh-TW': [
          ' · 等待帳號限流冷卻',
          '· 等待帳號限流冷卻',
          ' · 等待結束，正在恢復',
          '· 等待結束，正在恢復'
        ],
        es: [
          ' · Esperando a que termine la pausa por límite de solicitudes de la cuenta',
          '· Esperando a que termine la pausa por límite de solicitudes de la cuenta',
          ' · Fin de la espera; reanudando',
          '· Fin de la espera; reanudando'
        ],
        hi: [
          ' · खाते की अनुरोध-सीमा के कारण लगी रोक समाप्त होने की प्रतीक्षा',
          '· खाते की अनुरोध-सीमा के कारण लगी रोक समाप्त होने की प्रतीक्षा',
          ' · प्रतीक्षा समाप्त, फिर से शुरू हो रहा है',
          '· प्रतीक्षा समाप्त, फिर से शुरू हो रहा है'
        ],
        ar: [
          ' · انتظار انتهاء فترة تقييد الطلبات للحساب',
          '· انتظار انتهاء فترة تقييد الطلبات للحساب',
          ' · انتهى الانتظار، جارٍ الاستئناف',
          '· انتهى الانتظار، جارٍ الاستئناف'
        ],
        'pt-BR': [
          ' · Aguardando o fim da pausa por limite de requisições da conta',
          '· Aguardando o fim da pausa por limite de requisições da conta',
          ' · Fim da espera; retomando',
          '· Fim da espera; retomando'
        ],
        bn: [
          ' · অ্যাকাউন্টের অনুরোধ-সীমার বিরতি শেষ হওয়ার অপেক্ষায়',
          '· অ্যাকাউন্টের অনুরোধ-সীমার বিরতি শেষ হওয়ার অপেক্ষায়',
          ' · অপেক্ষা শেষ, আবার শুরু হচ্ছে',
          '· অপেক্ষা শেষ, আবার শুরু হচ্ছে'
        ],
        id: [
          ' · Menunggu jeda batas permintaan akun berakhir',
          '· Menunggu jeda batas permintaan akun berakhir',
          ' · Waktu tunggu selesai, melanjutkan',
          '· Waktu tunggu selesai, melanjutkan'
        ],
        fr: [
          ' · En attente de la fin de la pause liée à la limite de requêtes du compte',
          '· En attente de la fin de la pause liée à la limite de requêtes du compte',
          ' · Fin de l’attente, reprise en cours',
          '· Fin de l’attente, reprise en cours'
        ],
        ru: [
          ' · Ожидание окончания паузы из-за лимита запросов аккаунта',
          '· Ожидание окончания паузы из-за лимита запросов аккаунта',
          ' · Ожидание завершено, возобновление',
          '· Ожидание завершено, возобновление'
        ],
        ja: [
          ' · アカウントのリクエスト制限による待機中',
          '· アカウントのリクエスト制限による待機中',
          ' · 待機終了、再開中',
          '· 待機終了、再開中'
        ]
      }
    },
    {
      // Popup indexing/cache controls and their high-frequency task messages.
      keys: [
        'ui.openChatGPT_cea77b8',
        'ui.initializing_51a08fb',
        'ui.fullTextIndexCache',
        'ui.dateAndTimeToTheSecondVariableVariable',
        'ui.initialIndexingConsentRequired',
        'ui.continueFirstIndex',
        'ui.checkForNewChats',
        'ui.continueFirstIndex_84f02f2',
        'ui.downloadPreviouslySavedZIPPartsAgain',
        'ui.checkingForUpdates',
        'ui.checkForUpdatedConversationsBeforeExportingReuseUnchanged',
        'ui.backgroundSyncComplete',
        'ui.verifyingCompleteChatDirectoryAndProjects',
        'ui.fullTextSearchIndex',
        'ui.fullJSONCache',
        'ui.localDataCountForThisAccount',
        'ui.fullJSONIsRetainedAutomaticIndexingWillBe',
        'ui.fullTextIndexIsRetainedChatContentWill',
        'ui.noTasksForThisAccount',
        'ui.switchToASignedInChatGPTTabOr',
        'ui.taskProgressIsSavedLocallyAndSurvivesPage',
        'ui.indexIsStartingInTheCurrentTab',
        'ui.accountSwitchedExportStopped',
        'ui.authenticationErrorExportPausedSavedPartsAndCheckpoints',
        'ui.threeConsecutiveFailuresExportPausedReviewLogsBefore',
        'ui.aBulkExportIsAlreadyRunningInAnother',
        'ui.anotherAccountTaskIsRunningExportIsQueued',
        'ui.aMatchingTaskIsPausedResumeItFrom',
        'ui.completed_33246f6',
        'ui.remaining',
        'ui.chats'
      ],
      translations: {
        'zh-TW': [
          '請開啟 ChatGPT',
          '正在初始化…',
          '全文索引與快取',
          '支援建立/更新時間（精確到秒）：{created_datetime}、{updated_datetime}；也支援 {title}、{created_date}、{updated_date}、{source}、{conversation_id}。MD 與 JSON 共用此規則。',
          '首次索引（需授權）',
          '繼續首次索引',
          '立即檢查新增聊天',
          '繼續首次全文索引',
          '重新下載最近一次已保存的批次 ZIP 分卷',
          '正在檢查更新…',
          '匯出前增量檢查聊天目錄；只更新有變更的完整快取',
          '已完成背景增量同步',
          '正在核實完整聊天目錄（專案與分頁）…',
          '全文搜尋索引',
          '完整 JSON 快取',
          '目前帳號的本機資料數量',
          '不會刪除完整 JSON；自動更新會關閉，需手動重新建立索引。',
          '不會刪除全文搜尋索引；之後需要正文時會按需重新擷取。',
          '目前帳號沒有任務',
          '請切換至已登入的 ChatGPT 分頁，或點擊「開啟 ChatGPT」',
          '任務進度會保存在本機，重新整理分頁後仍可繼續',
          '索引任務正在目前分頁準備中',
          '登入帳號已切換，匯出任務已停止',
          '登入/權限錯誤，匯出任務已暫停；已保存分卷與檢查點仍保留',
          '連續 3 筆處理失敗，匯出已暫停；檢查記錄後可手動繼續',
          '同帳號的匯出任務正在其他分頁執行',
          '同帳號已有其他任務執行，匯出任務將排隊',
          '已有同類型暫停任務，請在任務管理中繼續',
          '已完成',
          '剩餘',
          '則聊天記錄'
        ],
        es: [
          'Abre ChatGPT',
          'Inicializando…',
          'Índice de texto completo y caché',
          'Admite fechas de creación y actualización con precisión de segundos: {created_datetime} y {updated_datetime}; también {title}, {created_date}, {updated_date}, {source} y {conversation_id}. MD y JSON usan la misma regla.',
          'Índice inicial (requiere autorización)',
          'Continuar índice inicial',
          'Buscar chats nuevos ahora',
          'Continuar índice de texto completo inicial',
          'Volver a descargar las partes ZIP guardadas más recientemente',
          'Comprobando actualizaciones…',
          'Comprobar el directorio de chats antes de exportar; actualizar solo las cachés completas que hayan cambiado',
          'Sincronización incremental en segundo plano completada',
          'Verificando el directorio completo de chats (proyectos y páginas)…',
          'Índice de búsqueda de texto completo',
          'Caché JSON completa',
          'Datos locales de la cuenta actual',
          'No se eliminará el JSON completo; se desactivarán las actualizaciones automáticas y tendrás que reconstruir el índice manualmente.',
          'No se eliminará el índice de texto completo; el contenido se recuperará cuando sea necesario.',
          'No hay tareas para esta cuenta',
          'Cambia a una pestaña de ChatGPT con sesión iniciada o haz clic en «Abrir ChatGPT».',
          'El progreso se guarda localmente y se conserva al actualizar la pestaña.',
          'El índice se está preparando en esta pestaña',
          'La cuenta ha cambiado; se detuvo la exportación',
          'Error de autenticación o permisos; exportación en pausa. Se conservan las partes guardadas y los puntos de control.',
          'Tres elementos consecutivos fallaron; exportación en pausa. Revisa los registros y reanuda manualmente.',
          'Ya hay una exportación de esta cuenta en otra pestaña',
          'Hay otra tarea activa para esta cuenta; la exportación quedará en cola',
          'Hay una tarea del mismo tipo en pausa; continúa desde el administrador de tareas',
          'Completado',
          'Restantes',
          'chats'
        ],
        hi: [
          'ChatGPT खोलें',
          'शुरू हो रहा है…',
          'पूर्ण-पाठ इंडेक्स और कैश',
          'निर्माण/अपडेट समय सेकंड तक समर्थित है: {created_datetime} और {updated_datetime}; साथ ही {title}, {created_date}, {updated_date}, {source} और {conversation_id}। MD और JSON एक ही नियम इस्तेमाल करते हैं।',
          'प्रारंभिक इंडेक्स (अनुमति आवश्यक)',
          'प्रारंभिक इंडेक्स जारी रखें',
          'नई चैट अभी जाँचें',
          'प्रारंभिक पूर्ण-पाठ इंडेक्स जारी रखें',
          'हाल ही में सहेजे गए ZIP भाग फिर डाउनलोड करें',
          'अपडेट जाँचे जा रहे हैं…',
          'निर्यात से पहले चैट निर्देशिका में बदलाव जाँचें; केवल बदला हुआ पूरा कैश अपडेट करें',
          'पृष्ठभूमि में इंक्रीमेंटल सिंक पूरा',
          'पूरी चैट निर्देशिका (प्रोजेक्ट और पृष्ठ) सत्यापित हो रही है…',
          'पूर्ण-पाठ खोज इंडेक्स',
          'पूरा JSON कैश',
          'वर्तमान खाते का स्थानीय डेटा',
          'पूरा JSON नहीं हटेगा; स्वचालित अपडेट बंद हो जाएगा और इंडेक्स फिर से मैन्युअल बनाना होगा।',
          'पूर्ण-पाठ इंडेक्स नहीं हटेगा; सामग्री ज़रूरत पड़ने पर प्राप्त होगी।',
          'इस खाते के लिए कोई कार्य नहीं',
          'लॉग-इन ChatGPT टैब पर जाएँ या “ChatGPT खोलें” पर क्लिक करें।',
          'कार्य की प्रगति स्थानीय रूप से सहेजी जाती है और टैब रीफ़्रेश होने पर भी बनी रहती है।',
          'इस टैब में इंडेक्स तैयार हो रहा है',
          'खाता बदल गया; निर्यात रोक दिया गया',
          'प्रमाणीकरण/अनुमति त्रुटि; निर्यात रुका है। सहेजे गए भाग और चेकपॉइंट सुरक्षित हैं।',
          'लगातार 3 आइटम विफल; निर्यात रोक दिया गया। लॉग देखें और मैन्युअल रूप से जारी करें।',
          'इस खाते का निर्यात दूसरे टैब में चल रहा है',
          'इस खाते का एक और कार्य चल रहा है; निर्यात कतार में रहेगा',
          'इसी प्रकार का कार्य रुका है; कार्य प्रबंधक से जारी करें',
          'पूरा हुआ',
          'शेष',
          'चैट'
        ],
        ar: [
          'فتح ChatGPT',
          'جارٍ التهيئة…',
          'فهرس البحث الكامل وذاكرة التخزين المؤقت',
          'يدعم وقت الإنشاء والتحديث بدقة ثانية: {created_datetime} و{updated_datetime}؛ وكذلك {title} و{created_date} و{updated_date} و{source} و{conversation_id}. يستخدم MD وJSON القاعدة نفسها.',
          'الفهرسة الأولية (تتطلب إذنًا)',
          'متابعة الفهرسة الأولية',
          'تحقق من المحادثات الجديدة الآن',
          'متابعة الفهرسة النصية الأولية',
          'إعادة تنزيل أجزاء ZIP المحفوظة مؤخرًا',
          'جارٍ التحقق من التحديثات…',
          'تحقق من تغييرات دليل المحادثات قبل التصدير؛ حدّث ذاكرة JSON الكاملة التي تغيّرت فقط',
          'اكتمل التزامن التزايدي في الخلفية',
          'جارٍ التحقق من اكتمال دليل المحادثات (المشاريع والصفحات)…',
          'فهرس البحث الكامل',
          'ذاكرة JSON الكاملة',
          'البيانات المحلية للحساب الحالي',
          'لن تُحذف بيانات JSON الكاملة؛ سيتم إيقاف التحديث التلقائي ويلزم إعادة بناء الفهرس يدويًا.',
          'لن يُحذف فهرس البحث الكامل؛ سيتم جلب المحتوى عند الحاجة.',
          'لا توجد مهام لهذا الحساب',
          'انتقل إلى علامة تبويب ChatGPT مسجّل الدخول فيها أو انقر على «فتح ChatGPT».',
          'يُحفظ تقدم المهمة محليًا ويظل محفوظًا بعد تحديث علامة التبويب.',
          'جارٍ إعداد الفهرس في علامة التبويب الحالية',
          'تم تغيير الحساب؛ تم إيقاف التصدير',
          'خطأ في المصادقة أو الأذونات؛ تم إيقاف التصدير مؤقتًا. الأجزاء المحفوظة ونقاط التحقق محفوظة.',
          'فشلت 3 عناصر متتالية؛ تم إيقاف التصدير مؤقتًا. راجع السجلات ثم استأنف يدويًا.',
          'تصدير هذا الحساب قيد التشغيل في علامة تبويب أخرى',
          'توجد مهمة أخرى لهذا الحساب؛ سيُضاف التصدير إلى قائمة الانتظار',
          'توجد مهمة متوقفة من النوع نفسه؛ استأنفها من مدير المهام',
          'اكتمل',
          'متبقٍ',
          'محادثات'
        ],
        'pt-BR': [
          'Abrir ChatGPT',
          'Inicializando…',
          'Índice de texto completo e cache',
          'Suporta datas de criação e atualização até os segundos: {created_datetime} e {updated_datetime}; também {title}, {created_date}, {updated_date}, {source} e {conversation_id}. MD e JSON usam a mesma regra.',
          'Índice inicial (requer autorização)',
          'Continuar índice inicial',
          'Verificar novas conversas agora',
          'Continuar índice de texto completo inicial',
          'Baixar novamente as partes ZIP salvas mais recentemente',
          'Verificando atualizações…',
          'Verificar alterações no diretório antes de exportar; atualizar apenas o cache completo que mudou',
          'Sincronização incremental em segundo plano concluída',
          'Verificando o diretório completo de conversas (projetos e páginas)…',
          'Índice de pesquisa de texto completo',
          'Cache JSON completo',
          'Dados locais da conta atual',
          'O JSON completo não será excluído; as atualizações automáticas serão desativadas e o índice precisará ser recriado manualmente.',
          'O índice de pesquisa não será excluído; o conteúdo será obtido sob demanda.',
          'Nenhuma tarefa para esta conta',
          'Mude para uma aba do ChatGPT conectada ou clique em “Abrir ChatGPT”.',
          'O progresso da tarefa é salvo localmente e permanece após atualizar a aba.',
          'O índice está sendo preparado nesta aba',
          'A conta mudou; a exportação foi interrompida',
          'Erro de autenticação/permissão; exportação pausada. As partes salvas e os pontos de controle foram mantidos.',
          'Três falhas consecutivas; exportação pausada. Verifique os registros e retome manualmente.',
          'A exportação desta conta já está em execução em outra aba',
          'Há outra tarefa ativa nesta conta; a exportação ficará na fila',
          'Há uma tarefa do mesmo tipo pausada; continue no gerenciador de tarefas',
          'Concluído',
          'Restantes',
          'conversas'
        ],
        bn: [
          'ChatGPT খুলুন',
          'শুরু হচ্ছে…',
          'সম্পূর্ণ টেক্সট ইনডেক্স ও ক্যাশে',
          'তৈরি ও আপডেটের সময় সেকেন্ড পর্যন্ত সমর্থিত: {created_datetime} এবং {updated_datetime}; এছাড়াও {title}, {created_date}, {updated_date}, {source} ও {conversation_id}। MD ও JSON একই নিয়ম ব্যবহার করে।',
          'প্রাথমিক ইনডেক্স (অনুমতি প্রয়োজন)',
          'প্রাথমিক ইনডেক্স চালিয়ে যান',
          'নতুন চ্যাট এখন পরীক্ষা করুন',
          'প্রাথমিক সম্পূর্ণ-টেক্সট ইনডেক্স চালিয়ে যান',
          'সাম্প্রতিক সংরক্ষিত ZIP অংশগুলো আবার ডাউনলোড করুন',
          'আপডেট পরীক্ষা হচ্ছে…',
          'এক্সপোর্টের আগে চ্যাট ডিরেক্টরির পরিবর্তন পরীক্ষা করুন; শুধু পরিবর্তিত সম্পূর্ণ ক্যাশে আপডেট করুন',
          'ব্যাকগ্রাউন্ডের ইনক্রিমেন্টাল সিঙ্ক সম্পন্ন',
          'সম্পূর্ণ চ্যাট ডিরেক্টরি (প্রজেক্ট ও পৃষ্ঠা) যাচাই হচ্ছে…',
          'সম্পূর্ণ-টেক্সট অনুসন্ধান ইনডেক্স',
          'সম্পূর্ণ JSON ক্যাশে',
          'বর্তমান অ্যাকাউন্টের স্থানীয় ডেটা',
          'সম্পূর্ণ JSON মুছে যাবে না; স্বয়ংক্রিয় আপডেট বন্ধ হবে এবং হাতে করে ইনডেক্স তৈরি করতে হবে।',
          'সম্পূর্ণ-টেক্সট ইনডেক্স মুছে যাবে না; প্রয়োজন হলে বিষয়বস্তু আনা হবে।',
          'এই অ্যাকাউন্টে কোনো কাজ নেই',
          'লগ-ইন করা ChatGPT ট্যাবে যান অথবা “ChatGPT খুলুন” চাপুন।',
          'কাজের অগ্রগতি স্থানীয়ভাবে সংরক্ষিত থাকে এবং ট্যাব রিফ্রেশ করলেও থাকে।',
          'এই ট্যাবে ইনডেক্স প্রস্তুত হচ্ছে',
          'অ্যাকাউন্ট বদলেছে; এক্সপোর্ট বন্ধ করা হয়েছে',
          'প্রমাণীকরণ/অনুমতির ত্রুটি; এক্সপোর্ট বিরতিতে। সংরক্ষিত অংশ ও চেকপয়েন্ট রাখা হয়েছে।',
          'পরপর ৩টি আইটেম ব্যর্থ; এক্সপোর্ট বিরতিতে। লগ দেখে হাতে করে চালিয়ে যান।',
          'এই অ্যাকাউন্টের এক্সপোর্ট অন্য ট্যাবে চলছে',
          'এই অ্যাকাউন্টে অন্য কাজ চলছে; এক্সপোর্ট সারিতে থাকবে',
          'একই ধরনের একটি কাজ বিরতিতে আছে; টাস্ক ম্যানেজার থেকে চালিয়ে যান',
          'সম্পন্ন',
          'বাকি',
          'চ্যাট'
        ],
        id: [
          'Buka ChatGPT',
          'Memulai…',
          'Indeks teks lengkap dan cache',
          'Mendukung waktu pembuatan dan pembaruan hingga detik: {created_datetime} dan {updated_datetime}; juga {title}, {created_date}, {updated_date}, {source}, dan {conversation_id}. MD dan JSON memakai aturan yang sama.',
          'Indeks awal (perlu izin)',
          'Lanjutkan indeks awal',
          'Periksa chat baru sekarang',
          'Lanjutkan indeks teks lengkap awal',
          'Unduh ulang bagian ZIP yang terakhir disimpan',
          'Memeriksa pembaruan…',
          'Periksa perubahan direktori chat sebelum ekspor; hanya perbarui cache lengkap yang berubah',
          'Sinkronisasi inkremental latar belakang selesai',
          'Memverifikasi direktori chat lengkap (proyek dan halaman)…',
          'Indeks pencarian teks lengkap',
          'Cache JSON lengkap',
          'Data lokal akun saat ini',
          'JSON lengkap tidak dihapus; pembaruan otomatis dimatikan dan indeks perlu dibuat ulang secara manual.',
          'Indeks pencarian tidak dihapus; konten akan diambil sesuai kebutuhan.',
          'Tidak ada tugas untuk akun ini',
          'Beralih ke tab ChatGPT yang sudah login atau klik “Buka ChatGPT”.',
          'Progres tugas disimpan secara lokal dan tetap ada setelah tab dimuat ulang.',
          'Indeks sedang disiapkan di tab ini',
          'Akun berubah; ekspor dihentikan',
          'Kesalahan autentikasi/izin; ekspor dijeda. Bagian tersimpan dan titik pemeriksaan tetap ada.',
          'Tiga item gagal berturut-turut; ekspor dijeda. Periksa log lalu lanjutkan secara manual.',
          'Ekspor akun ini sedang berjalan di tab lain',
          'Ada tugas lain untuk akun ini; ekspor akan mengantre',
          'Ada tugas sejenis yang dijeda; lanjutkan dari pengelola tugas',
          'Selesai',
          'Tersisa',
          'chat'
        ],
        fr: [
          'Ouvrir ChatGPT',
          'Initialisation…',
          'Index de texte intégral et cache',
          'Prise en charge des dates de création et de mise à jour à la seconde : {created_datetime} et {updated_datetime} ; aussi {title}, {created_date}, {updated_date}, {source} et {conversation_id}. MD et JSON utilisent la même règle.',
          'Index initial (autorisation requise)',
          'Continuer l’index initial',
          'Rechercher les nouvelles conversations',
          'Continuer l’indexation initiale complète',
          'Retélécharger les dernières parties ZIP enregistrées',
          'Vérification des mises à jour…',
          'Vérifier les changements du répertoire avant l’export ; ne mettre à jour que les caches complets modifiés',
          'Synchronisation incrémentielle en arrière-plan terminée',
          'Vérification du répertoire complet des conversations (projets et pages)…',
          'Index de recherche en texte intégral',
          'Cache JSON complet',
          'Données locales du compte actuel',
          'Le JSON complet ne sera pas supprimé ; les mises à jour automatiques seront désactivées et l’index devra être recréé manuellement.',
          'L’index de recherche ne sera pas supprimé ; le contenu sera récupéré à la demande.',
          'Aucune tâche pour ce compte',
          'Passez à un onglet ChatGPT connecté ou cliquez sur « Ouvrir ChatGPT ».',
          'La progression est enregistrée localement et conservée après actualisation de l’onglet.',
          'L’index est en cours de préparation dans cet onglet',
          'Le compte a changé ; l’export a été arrêté',
          'Erreur d’authentification ou d’autorisation ; export en pause. Les parties enregistrées et les points de reprise sont conservés.',
          'Trois échecs consécutifs ; export en pause. Consultez les journaux puis reprenez manuellement.',
          'L’export de ce compte est déjà en cours dans un autre onglet',
          'Une autre tâche est en cours pour ce compte ; l’export sera mis en attente',
          'Une tâche du même type est en pause ; reprenez-la dans le gestionnaire de tâches',
          'Terminé',
          'Restant',
          'conversations'
        ],
        ru: [
          'Открыть ChatGPT',
          'Инициализация…',
          'Полнотекстовый индекс и кэш',
          'Поддерживаются дата и время создания/обновления с точностью до секунды: {created_datetime} и {updated_datetime}; также {title}, {created_date}, {updated_date}, {source} и {conversation_id}. MD и JSON используют один шаблон.',
          'Первичная индексация (требуется разрешение)',
          'Продолжить первичную индексацию',
          'Проверить новые чаты',
          'Продолжить первичную полнотекстовую индексацию',
          'Повторно скачать последние сохранённые части ZIP',
          'Проверка обновлений…',
          'Перед экспортом проверить изменения в каталоге чатов; обновить только изменившийся полный кэш',
          'Фоновая инкрементальная синхронизация завершена',
          'Проверка полного каталога чатов (проекты и страницы)…',
          'Полнотекстовый поисковый индекс',
          'Полный кэш JSON',
          'Локальные данные текущего аккаунта',
          'Полный JSON не удаляется; автоматическое обновление отключится, индекс потребуется создать вручную.',
          'Полнотекстовый индекс не удаляется; содержимое будет загружаться по мере необходимости.',
          'Для этого аккаунта нет задач',
          'Переключитесь на вкладку ChatGPT с активным входом или нажмите «Открыть ChatGPT».',
          'Прогресс сохраняется локально и не теряется после обновления вкладки.',
          'Индекс подготавливается в этой вкладке',
          'Аккаунт изменился; экспорт остановлен',
          'Ошибка входа или разрешений; экспорт приостановлен. Сохранённые части и контрольные точки сохранены.',
          'Три последовательных сбоя; экспорт приостановлен. Проверьте журнал и продолжите вручную.',
          'Экспорт этого аккаунта уже выполняется в другой вкладке',
          'Для аккаунта выполняется другая задача; экспорт поставлен в очередь',
          'Задача этого типа уже приостановлена; продолжите её в диспетчере задач',
          'Завершено',
          'Осталось',
          'чаты'
        ],
        ja: [
          'ChatGPT を開く',
          '初期化中…',
          '全文検索インデックスとキャッシュ',
          '作成日時・更新日時を秒単位で指定できます：{created_datetime}、{updated_datetime}。{title}、{created_date}、{updated_date}、{source}、{conversation_id} も使用できます。MD と JSON は同じルールを使います。',
          '初回インデックス（許可が必要）',
          '初回インデックスを続行',
          '新しいチャットを今すぐ確認',
          '初回の全文インデックスを続行',
          '最近保存した ZIP 分割ファイルを再ダウンロード',
          '更新を確認中…',
          'エクスポート前にチャット一覧の更新を確認し、変更された完全キャッシュだけを更新します',
          'バックグラウンドの差分同期が完了しました',
          'チャット一覧全体（プロジェクトとページ）を確認中…',
          '全文検索インデックス',
          '完全な JSON キャッシュ',
          '現在のアカウントのローカルデータ',
          '完全な JSON は削除されません。自動更新は無効になり、インデックスを手動で再作成する必要があります。',
          '全文検索インデックスは削除されません。本文は必要に応じて取得されます。',
          'このアカウントのタスクはありません',
          'ログイン済みの ChatGPT タブに切り替えるか、「ChatGPT を開く」をクリックしてください。',
          'タスクの進捗はローカルに保存され、タブを更新しても保持されます。',
          'このタブでインデックスを準備しています',
          'アカウントが切り替わったため、エクスポートを停止しました',
          '認証/権限エラーのためエクスポートを一時停止しました。保存済みの分割ファイルとチェックポイントは保持されています。',
          '3 件連続で失敗したためエクスポートを一時停止しました。ログを確認して手動で再開してください。',
          'このアカウントのエクスポートは別のタブで実行中です',
          'このアカウントでは別のタスクが実行中です。エクスポートはキューに追加されます',
          '同じ種類のタスクが一時停止中です。タスク管理から再開してください',
          '完了',
          '残り',
          'チャット'
        ]
      }
    },
    {
      // Search-result provenance, local-only safeguards and export recovery.
      keys: [
        'ui.deletedRemotelyOriginalDataAndExportsRemainLocal',
        'ui.removeThisChatFromLocalJSONFullText',
        'ui.legacyIndexOnlineLinkAndCompleteExportUnverified',
        'ui.localOnlyConfirmedRemoteDeletion',
        'ui.remoteStatusNotVerified',
        'ui.accountChangedLocalSearchResultsCleared',
        'ui.unverified',
        'ui.localOnly_efb7560',
        'ui.exportThisConversationAsMarkdown',
        'ui.exportThisConversationAsOriginalJSON',
        'ui.removeLocalOnlyConversationData',
        'ui.noConversationsAvailableToExport',
        'ui.noUserOrAssistantMessagesToExport',
        'ui.completeJSONNotStoredLocallyOnlyASearch',
        'ui.permanentlyRemoveThisLocalOnlyChatFromJSON',
        'ui.accountSwitchedCannotPreviewPreviousAccountData',
        'ui.accountSwitchedSearchAgain',
        'ui.noCompleteJSONAvailableForLocalOnlyConversation',
        'ui.exportRetriesExhausted',
        'ui.onlyConfirmedLocalOnlyConversationsCanBeCleared',
        'ui.failedToDownloadSavedZIPParts',
        'ui.deletedRemotelyButLocalStateUpdateFailedCheck'
      ],
      translations: {
        'zh-TW': [
          "官方已明確標記刪除；原始資料與匯出仍保留在本機",
          "僅清理此聊天在擴充功能中的本機原始 JSON、全文索引與目錄記錄",
          "未歸屬的舊索引 · 無法確認線上連結或完整匯出",
          "僅本機 · 已確認官方刪除",
          "遠端狀態待核實",
          "登入帳號已變更，本機搜尋結果已清除",
          "待核實 · ",
          "僅本機 · ",
          "匯出此聊天為 Markdown",
          "匯出此聊天的原始 JSON",
          "清理此筆僅本機對話的本機資料",
          "沒有可匯出的聊天",
          "找不到可匯出的使用者/助理訊息",
          "完整原始 JSON 未保存在本機；只有搜尋片段，無法顯示完整預覽。",
          "永久清除此僅本機對話的原始 JSON、全文索引與目錄記錄？⏎此操作無法復原；不會要求刪除 ChatGPT 雲端聊天，也不會清除已下載檔案。",
          "帳號已切換，無法預覽先前帳號的內容",
          "帳號已切換，請重新搜尋",
          "此僅本機對話沒有可匯出的完整原始 JSON",
          "匯出重試次數已用盡",
          "只能清理已確認為僅本機的對話，不能清理線上或待核實記錄",
          "下載已儲存的 ZIP 分卷失敗",
          "雲端已刪除，但本機狀態標記失敗，請檢查快取"
        ],
        es: [
          "Eliminación oficial confirmada; los datos originales y las exportaciones se conservan localmente",
          "Eliminar solo el JSON original local, el índice de texto completo y el registro de directorio de este chat",
          "Índice antiguo sin asignar · no se puede confirmar el enlace en línea ni la exportación completa",
          "Solo local · eliminación oficial confirmada",
          "Estado remoto sin verificar",
          "La cuenta cambió; se borraron los resultados de búsqueda locales",
          "Sin verificar · ",
          "Solo local · ",
          "Exportar este chat como Markdown",
          "Exportar el JSON original de este chat",
          "Limpiar los datos locales de este chat solo local",
          "No hay chats para exportar",
          "No se encontraron mensajes de usuario o asistente para exportar",
          "El JSON original completo no está guardado localmente; solo hay fragmentos de búsqueda y no se puede mostrar la vista previa completa.",
          "¿Eliminar permanentemente el JSON original, el índice de texto completo y el registro local de este chat solo local?⏎Esta acción no se puede deshacer. No solicitará eliminar el chat de la nube de ChatGPT ni borrará los archivos descargados.",
          "La cuenta cambió; no se puede previsualizar el contenido de la cuenta anterior",
          "La cuenta cambió; vuelve a buscar",
          "No hay JSON original completo exportable para este chat solo local",
          "Se agotaron los reintentos de exportación",
          "Solo se pueden limpiar chats confirmados como solo locales; no los que están en línea o sin verificar",
          "Error al descargar las partes ZIP guardadas",
          "El chat se eliminó en la nube, pero no se pudo actualizar el estado local; revisa la caché"
        ],
        hi: [
          "रिमोट पर हटाने की स्पष्ट पुष्टि; मूल डेटा और एक्सपोर्ट स्थानीय रूप से सुरक्षित हैं",
          "इस चैट का केवल स्थानीय मूल JSON, पूर्ण-पाठ इंडेक्स और निर्देशिका रिकॉर्ड हटाएँ",
          "बिना खाते से जुड़ा पुराना इंडेक्स · ऑनलाइन लिंक या पूर्ण एक्सपोर्ट की पुष्टि नहीं हो सकती",
          "केवल स्थानीय · आधिकारिक हटाने की पुष्टि",
          "रिमोट स्थिति सत्यापित नहीं",
          "खाता बदल गया; स्थानीय खोज परिणाम साफ़ कर दिए गए",
          "सत्यापित नहीं · ",
          "केवल स्थानीय · ",
          "इस चैट को Markdown के रूप में एक्सपोर्ट करें",
          "इस चैट का मूल JSON एक्सपोर्ट करें",
          "इस केवल-स्थानीय चैट का स्थानीय डेटा साफ़ करें",
          "एक्सपोर्ट के लिए कोई चैट उपलब्ध नहीं",
          "एक्सपोर्ट करने के लिए उपयोगकर्ता या सहायक के संदेश नहीं मिले",
          "पूरा मूल JSON स्थानीय रूप से सहेजा नहीं गया; केवल खोज अंश उपलब्ध हैं, इसलिए पूरा पूर्वावलोकन नहीं दिखाया जा सकता।",
          "इस केवल-स्थानीय चैट का मूल JSON, पूर्ण-पाठ इंडेक्स और निर्देशिका रिकॉर्ड स्थायी रूप से हटाएँ?⏎यह कार्रवाई वापस नहीं ली जा सकती। इससे ChatGPT क्लाउड चैट हटाने का अनुरोध नहीं होगा और डाउनलोड की गई फ़ाइलें नहीं हटेंगी।",
          "खाता बदल गया; पिछले खाते की सामग्री का पूर्वावलोकन नहीं किया जा सकता",
          "खाता बदल गया; फिर से खोजें",
          "इस केवल-स्थानीय चैट के लिए एक्सपोर्ट करने योग्य पूरा मूल JSON उपलब्ध नहीं है",
          "एक्सपोर्ट के पुनः प्रयास समाप्त हो गए",
          "केवल पुष्टि की गई स्थानीय चैट ही साफ़ की जा सकती हैं; ऑनलाइन या असत्यापित रिकॉर्ड नहीं",
          "सहेजे गए ZIP भाग डाउनलोड नहीं हो सके",
          "क्लाउड में चैट हट गई, लेकिन स्थानीय स्थिति अपडेट नहीं हुई; कैश जाँचें"
        ],
        ar: [
          "تم تأكيد الحذف الرسمي؛ تظل البيانات الأصلية وملفات التصدير محفوظة محليًا",
          "احذف فقط ملف JSON الأصلي المحلي وفهرس النص الكامل وسجل الدليل لهذه المحادثة",
          "فهرس قديم غير مرتبط بحساب · لا يمكن تأكيد الرابط المباشر أو اكتمال التصدير",
          "محلي فقط · تم تأكيد الحذف الرسمي",
          "الحالة البعيدة غير متحقق منها",
          "تغير الحساب؛ تم مسح نتائج البحث المحلية",
          "غير متحقق منه · ",
          "محلي فقط · ",
          "تصدير هذه المحادثة بصيغة Markdown",
          "تصدير ملف JSON الأصلي لهذه المحادثة",
          "مسح البيانات المحلية لهذه المحادثة المحلية فقط",
          "لا توجد محادثات متاحة للتصدير",
          "لم يتم العثور على رسائل مستخدم أو مساعد للتصدير",
          "ملف JSON الأصلي الكامل غير محفوظ محليًا؛ تتوفر مقتطفات البحث فقط ولا يمكن عرض معاينة كاملة.",
          "هل تريد حذف ملف JSON الأصلي وفهرس النص الكامل وسجل الدليل لهذه المحادثة المحلية نهائيًا؟⏎لا يمكن التراجع عن هذا الإجراء. لن يطلب حذف المحادثة من سحابة ChatGPT ولن يحذف الملفات التي تم تنزيلها.",
          "تغير الحساب؛ لا يمكن معاينة محتوى الحساب السابق",
          "تغير الحساب؛ أجرِ البحث مرة أخرى",
          "لا يتوفر ملف JSON أصلي كامل قابل للتصدير لهذه المحادثة المحلية فقط",
          "تم استنفاد محاولات التصدير",
          "يمكن مسح المحادثات المؤكد أنها محلية فقط؛ لا يمكن مسح السجلات المتاحة عبر الإنترنت أو غير المتحقق منها",
          "تعذر تنزيل أجزاء ZIP المحفوظة",
          "حُذفت المحادثة من السحابة، لكن تعذر تحديث الحالة المحلية؛ تحقق من ذاكرة التخزين المؤقت"
        ],
        'pt-BR': [
          "Exclusão oficial confirmada; os dados originais e as exportações permanecem salvos localmente",
          "Remover apenas o JSON original local, o índice de texto completo e o registro de diretório deste chat",
          "Índice antigo sem vínculo · não é possível confirmar o link online nem a exportação completa",
          "Somente local · exclusão oficial confirmada",
          "Status remoto não verificado",
          "A conta mudou; os resultados de pesquisa locais foram apagados",
          "Não verificado · ",
          "Somente local · ",
          "Exportar este chat como Markdown",
          "Exportar o JSON original deste chat",
          "Limpar os dados locais deste chat somente local",
          "Nenhum chat disponível para exportação",
          "Nenhuma mensagem de usuário ou assistente encontrada para exportar",
          "O JSON original completo não está salvo localmente; há apenas trechos de pesquisa, portanto não é possível mostrar a prévia completa.",
          "Excluir permanentemente o JSON original, o índice de texto completo e o registro local deste chat somente local?⏎Esta ação não pode ser desfeita. Ela não solicitará a exclusão do chat na nuvem do ChatGPT nem apagará arquivos baixados.",
          "A conta mudou; não é possível visualizar o conteúdo da conta anterior",
          "A conta mudou; pesquise novamente",
          "Não há JSON original completo disponível para exportar este chat somente local",
          "As tentativas de exportação foram esgotadas",
          "Só é possível limpar chats confirmados como somente locais; registros online ou não verificados não podem ser excluídos",
          "Falha ao baixar as partes ZIP salvas",
          "O chat foi excluído na nuvem, mas o estado local não foi atualizado; verifique o cache"
        ],
        bn: [
          "দূরবর্তী মুছে ফেলার বিষয়টি নিশ্চিত; মূল ডেটা ও এক্সপোর্ট স্থানীয়ভাবে রাখা হয়েছে",
          "শুধু এই চ্যাটের স্থানীয় মূল JSON, সম্পূর্ণ-টেক্সট ইনডেক্স ও ডিরেক্টরি রেকর্ড সরান",
          "অ্যাকাউন্টে যুক্ত নয় এমন পুরোনো ইনডেক্স · অনলাইন লিংক বা সম্পূর্ণ এক্সপোর্ট নিশ্চিত করা যায় না",
          "শুধু স্থানীয় · অফিসিয়াল মুছে ফেলা নিশ্চিত",
          "দূরবর্তী অবস্থা যাচাই করা হয়নি",
          "অ্যাকাউন্ট বদলেছে; স্থানীয় অনুসন্ধানের ফল মুছে ফেলা হয়েছে",
          "যাচাই করা হয়নি · ",
          "শুধু স্থানীয় · ",
          "এই চ্যাট Markdown হিসেবে এক্সপোর্ট করুন",
          "এই চ্যাটের মূল JSON এক্সপোর্ট করুন",
          "শুধু-স্থানীয় এই চ্যাটের স্থানীয় ডেটা পরিষ্কার করুন",
          "এক্সপোর্ট করার মতো কোনো চ্যাট নেই",
          "এক্সপোর্ট করার জন্য ব্যবহারকারী বা সহকারীর কোনো বার্তা পাওয়া যায়নি",
          "সম্পূর্ণ মূল JSON স্থানীয়ভাবে সংরক্ষিত নেই; শুধু অনুসন্ধানের অংশ আছে, তাই সম্পূর্ণ পূর্বরূপ দেখানো যাবে না।",
          "শুধু-স্থানীয় এই চ্যাটের মূল JSON, সম্পূর্ণ-টেক্সট ইনডেক্স ও ডিরেক্টরি রেকর্ড স্থায়ীভাবে মুছবেন?⏎এই কাজ ফিরিয়ে নেওয়া যাবে না। এটি ChatGPT ক্লাউডের চ্যাট মুছতে বলবে না এবং ডাউনলোড করা ফাইলও মুছবে না।",
          "অ্যাকাউন্ট বদলেছে; আগের অ্যাকাউন্টের বিষয়বস্তু দেখা যাবে না",
          "অ্যাকাউন্ট বদলেছে; আবার অনুসন্ধান করুন",
          "শুধু-স্থানীয় এই চ্যাটের জন্য এক্সপোর্টযোগ্য সম্পূর্ণ মূল JSON নেই",
          "এক্সপোর্টের পুনঃচেষ্টার সীমা শেষ",
          "শুধু নিশ্চিতভাবে স্থানীয় চ্যাটই পরিষ্কার করা যাবে; অনলাইন বা যাচাই না করা রেকর্ড নয়",
          "সংরক্ষিত ZIP অংশ ডাউনলোড করা যায়নি",
          "ক্লাউডে চ্যাট মুছে গেছে, কিন্তু স্থানীয় অবস্থা আপডেট হয়নি; ক্যাশ পরীক্ষা করুন"
        ],
        id: [
          "Penghapusan resmi telah dikonfirmasi; data asli dan hasil ekspor tetap disimpan secara lokal",
          "Hapus hanya JSON asli lokal, indeks teks lengkap, dan catatan direktori untuk chat ini",
          "Indeks lama yang belum ditautkan · tautan online atau ekspor lengkap tidak dapat dipastikan",
          "Hanya lokal · penghapusan resmi dikonfirmasi",
          "Status jarak jauh belum diverifikasi",
          "Akun berubah; hasil pencarian lokal telah dihapus",
          "Belum diverifikasi · ",
          "Hanya lokal · ",
          "Ekspor chat ini sebagai Markdown",
          "Ekspor JSON asli chat ini",
          "Bersihkan data lokal chat yang hanya tersimpan lokal ini",
          "Tidak ada chat yang dapat diekspor",
          "Pesan pengguna atau asisten untuk diekspor tidak ditemukan",
          "JSON asli lengkap tidak tersimpan secara lokal; hanya cuplikan pencarian yang tersedia sehingga pratinjau lengkap tidak dapat ditampilkan.",
          "Hapus permanen JSON asli, indeks teks lengkap, dan catatan direktori untuk chat lokal ini?⏎Tindakan ini tidak dapat dibatalkan. Ini tidak akan meminta penghapusan chat dari cloud ChatGPT dan tidak akan menghapus file yang sudah diunduh.",
          "Akun berubah; konten akun sebelumnya tidak dapat dipratinjau",
          "Akun berubah; cari lagi",
          "JSON asli lengkap untuk ekspor tidak tersedia bagi chat yang hanya lokal ini",
          "Percobaan ulang ekspor telah habis",
          "Hanya chat yang dipastikan lokal yang dapat dibersihkan; catatan online atau belum diverifikasi tidak dapat dihapus",
          "Gagal mengunduh bagian ZIP yang tersimpan",
          "Chat telah dihapus dari cloud, tetapi status lokal gagal diperbarui; periksa cache"
        ],
        fr: [
          "Suppression officielle confirmée ; les données d’origine et les exports restent conservés localement",
          "Supprimer uniquement le JSON d’origine local, l’index de texte intégral et l’entrée du répertoire de ce chat",
          "Ancien index non attribué · lien en ligne et export complet non vérifiables",
          "Local uniquement · suppression officielle confirmée",
          "État distant non vérifié",
          "Le compte a changé ; les résultats de recherche locaux ont été effacés",
          "Non vérifié · ",
          "Local uniquement · ",
          "Exporter ce chat au format Markdown",
          "Exporter le JSON d’origine de ce chat",
          "Effacer les données locales de ce chat uniquement local",
          "Aucun chat à exporter",
          "Aucun message utilisateur ou assistant à exporter",
          "Le JSON d’origine complet n’est pas enregistré localement ; seuls des extraits de recherche sont disponibles et l’aperçu complet est impossible.",
          "Supprimer définitivement le JSON d’origine, l’index de texte intégral et l’entrée du répertoire de ce chat local ?⏎Cette action est irréversible. Elle ne demandera pas la suppression du chat dans le cloud ChatGPT et ne supprimera pas les fichiers téléchargés.",
          "Le compte a changé ; impossible d’afficher l’aperçu du contenu de l’ancien compte",
          "Le compte a changé ; relancez la recherche",
          "Aucun JSON d’origine complet exportable n’est disponible pour ce chat local",
          "Les tentatives d’export sont épuisées",
          "Seuls les chats confirmés comme locaux peuvent être effacés ; les éléments en ligne ou non vérifiés ne peuvent pas l’être",
          "Échec du téléchargement des parties ZIP enregistrées",
          "Le chat a été supprimé du cloud, mais l’état local n’a pas été mis à jour ; vérifiez le cache"
        ],
        ru: [
          "Удаление на сервере подтверждено; исходные данные и экспорты сохранены локально",
          "Удалить только локальный исходный JSON, полнотекстовый индекс и запись каталога этого чата",
          "Старый индекс без привязки · онлайн-ссылка и полный экспорт не подтверждены",
          "Только локально · официальное удаление подтверждено",
          "Удалённое состояние не проверено",
          "Аккаунт изменился; локальные результаты поиска очищены",
          "Не проверено · ",
          "Только локально · ",
          "Экспортировать этот чат в Markdown",
          "Экспортировать исходный JSON этого чата",
          "Очистить локальные данные этого чата, сохранённого только локально",
          "Нет чатов для экспорта",
          "Не найдены сообщения пользователя или ассистента для экспорта",
          "Полный исходный JSON не сохранён локально; доступны только поисковые фрагменты, поэтому полный просмотр невозможен.",
          "Безвозвратно удалить исходный JSON, полнотекстовый индекс и запись каталога этого локального чата?⏎Это действие нельзя отменить. Запрос на удаление чата из облака ChatGPT отправлен не будет; скачанные файлы не удаляются.",
          "Аккаунт изменился; содержимое предыдущего аккаунта недоступно для просмотра",
          "Аккаунт изменился; выполните поиск ещё раз",
          "Для этого локального чата нет полного исходного JSON для экспорта",
          "Попытки экспорта исчерпаны",
          "Можно очищать только подтверждённые локальные чаты; онлайн-записи и записи без проверки удалять нельзя",
          "Не удалось скачать сохранённые части ZIP",
          "Чат удалён из облака, но локальный статус не обновлён; проверьте кэш"
        ],
        ja: [
          "公式による削除を確認しました。元データとエクスポートはローカルに保持されています",
          "このチャットのローカルの元 JSON、全文検索インデックス、一覧記録だけを削除",
          "未割り当ての旧インデックス · オンラインリンクや完全なエクスポートは確認できません",
          "ローカルのみ · 公式の削除を確認済み",
          "リモート状態は未確認",
          "アカウントが切り替わったため、ローカル検索結果を消去しました",
          "未確認 · ",
          "ローカルのみ · ",
          "このチャットを Markdown としてエクスポート",
          "このチャットの元 JSON をエクスポート",
          "ローカルのみのこのチャットのローカルデータを消去",
          "エクスポートできるチャットがありません",
          "エクスポート可能なユーザーまたはアシスタントのメッセージがありません",
          "完全な元 JSON はローカルに保存されていません。検索用の抜粋のみのため、完全なプレビューは表示できません。",
          "このローカルのみのチャットの元 JSON、全文検索インデックス、一覧記録を完全に削除しますか？⏎この操作は取り消せません。ChatGPT クラウド上のチャットの削除は要求せず、ダウンロード済みファイルも削除しません。",
          "アカウントが切り替わったため、以前のアカウントの内容をプレビューできません",
          "アカウントが切り替わりました。もう一度検索してください",
          "このローカルのみのチャットには、エクスポート可能な完全な元 JSON がありません",
          "エクスポートの再試行回数に達しました",
          "ローカルのみと確認されたチャットだけを消去できます。オンラインまたは未確認の記録は削除できません",
          "保存済み ZIP 分割ファイルのダウンロードに失敗しました",
          "クラウド上ではチャットが削除されましたが、ローカル状態を更新できませんでした。キャッシュを確認してください"
        ]
      }
    },
    {
      // Labels and messages used by the live full-text search result renderer.
      keys: [
        'ui.cleanupFailed',
        'ui.localExportFailed',
        'ui.unableToReadCompleteLocalContent'
      ],
      translations: {
        'zh-TW': [
          "清理失敗",
          "僅本機匯出失敗",
          "無法讀取本機完整內容"
        ],
        es: [
          "Error al limpiar",
          "Error al exportar datos solo locales",
          "No se pudo leer el contenido local completo"
        ],
        hi: [
          "साफ़ करने में विफल",
          "केवल स्थानीय एक्सपोर्ट विफल",
          "पूरा स्थानीय कंटेंट पढ़ने में असमर्थ"
        ],
        ar: [
          "فشل التنظيف",
          "فشل التصدير المحلي",
          "تعذرت قراءة المحتوى المحلي الكامل"
        ],
        'pt-BR': [
          "Falha ao limpar",
          "Falha na exportação somente local",
          "Não foi possível ler o conteúdo local completo"
        ],
        bn: [
          "পরিষ্কার করতে ব্যর্থ",
          "শুধু-স্থানীয় এক্সপোর্ট ব্যর্থ",
          "সম্পূর্ণ স্থানীয় বিষয়বস্তু পড়া যায়নি"
        ],
        id: [
          "Gagal membersihkan",
          "Ekspor lokal gagal",
          "Konten lokal lengkap tidak dapat dibaca"
        ],
        fr: [
          "Échec du nettoyage",
          "Échec de l’export local",
          "Impossible de lire le contenu local complet"
        ],
        ru: [
          "Не удалось очистить",
          "Ошибка локального экспорта",
          "Не удалось прочитать полное локальное содержимое"
        ],
        ja: [
          "消去に失敗しました",
          "ローカルのみのエクスポートに失敗しました",
          "ローカルの完全な内容を読み取れません"
        ]
      }
    },
    {
      // Conversation directory, filters and minimap navigation labels.
      keys: [
        'ui.filterByTitle_d753c04',
        'ui.collapseConversationsDragToMove',
        'ui.conversationsDragToMove',
        'ui.standardChats',
        'ui.source',
        'ui.all',
        'ui.select',
        'ui.conversationMinimap_0e4e39b',
        'ui.message',
        'ui.unknownTime',
        'ui.unnamedProject',
        'ui.project',
        'ui.allProjects',
        'ui.conversationMessageNavigation',
        'ui.titleMatch',
        'ui.locallyStored',
        'ui.remove'
      ],
      translations: {
        'zh-TW': [
          '依標題篩選',
          '收起對話目錄（可拖曳移動）',
          '對話目錄（可拖曳移動）',
          '— · 一般對話',
          '來源',
          '全部',
          '選取',
          '長對話快速導覽（Minimap）',
          '訊息',
          '時間不明',
          '未命名專案',
          '專案',
          '專案 · 全部',
          '對話訊息導覽',
          '標題相符',
          '本機已有',
          '清理'
        ],
        es: [
          'Filtrar por título',
          'Contraer lista de chats (arrastrable)',
          'Lista de chats (arrastrable)',
          '— · Chats normales',
          'Origen',
          'Todos',
          'Seleccionar',
          'Navegación rápida por chats largos (Minimap)',
          'Mensaje',
          'Hora desconocida',
          'Proyecto sin nombre',
          'Proyecto',
          'Proyectos · Todos',
          'Navegación por mensajes',
          'Coincidencia en el título',
          'Ya guardado localmente',
          'Eliminar'
        ],
        hi: [
          'शीर्षक से फ़िल्टर करें',
          'चैट सूची समेटें (खींचकर ले जा सकते हैं)',
          'चैट सूची (खींचकर ले जा सकते हैं)',
          '— · सामान्य चैट',
          'स्रोत',
          'सभी',
          'चुनें',
          'लंबी चैट में तेज़ नेविगेशन (Minimap)',
          'संदेश',
          'समय अज्ञात',
          'बिना नाम का प्रोजेक्ट',
          'प्रोजेक्ट',
          'प्रोजेक्ट · सभी',
          'चैट संदेश नेविगेशन',
          'शीर्षक में मेल',
          'स्थानीय रूप से पहले से सहेजा गया',
          'साफ़ करें'
        ],
        ar: [
          'تصفية حسب العنوان',
          'طي قائمة المحادثات (يمكن سحبها)',
          'قائمة المحادثات (يمكن سحبها)',
          '— · محادثات عادية',
          'المصدر',
          'الكل',
          'تحديد',
          'تنقل سريع في المحادثات الطويلة (Minimap)',
          'رسالة',
          'وقت غير معروف',
          'مشروع بلا اسم',
          'مشروع',
          'المشاريع · الكل',
          'التنقل بين رسائل المحادثة',
          'تطابق العنوان',
          'محفوظ محليًا بالفعل',
          'مسح'
        ],
        'pt-BR': [
          'Filtrar por título',
          'Recolher lista de conversas (arrastável)',
          'Lista de conversas (arrastável)',
          '— · Conversas comuns',
          'Origem',
          'Todos',
          'Selecionar',
          'Navegação rápida em conversas longas (Minimap)',
          'Mensagem',
          'Horário desconhecido',
          'Projeto sem nome',
          'Projeto',
          'Projetos · Todos',
          'Navegação pelas mensagens',
          'Correspondência no título',
          'Já salvo localmente',
          'Limpar'
        ],
        bn: [
          'শিরোনাম দিয়ে ফিল্টার করুন',
          'চ্যাটের তালিকা গুটিয়ে নিন (টেনে সরানো যায়)',
          'চ্যাটের তালিকা (টেনে সরানো যায়)',
          '— · সাধারণ চ্যাট',
          'উৎস',
          'সব',
          'নির্বাচন করুন',
          'দীর্ঘ চ্যাটে দ্রুত চলাচল (Minimap)',
          'বার্তা',
          'সময় জানা নেই',
          'নামবিহীন প্রজেক্ট',
          'প্রজেক্ট',
          'প্রজেক্ট · সব',
          'চ্যাটের বার্তায় চলাচল',
          'শিরোনামে মিল',
          'ইতিমধ্যে স্থানীয়ভাবে সংরক্ষিত',
          'পরিষ্কার করুন'
        ],
        id: [
          'Filter menurut judul',
          'Ciutkan daftar percakapan (bisa digeser)',
          'Daftar percakapan (bisa digeser)',
          '— · Percakapan biasa',
          'Sumber',
          'Semua',
          'Pilih',
          'Navigasi cepat percakapan panjang (Minimap)',
          'Pesan',
          'Waktu tidak diketahui',
          'Proyek tanpa nama',
          'Proyek',
          'Proyek · Semua',
          'Navigasi pesan percakapan',
          'Kecocokan judul',
          'Sudah tersimpan secara lokal',
          'Bersihkan'
        ],
        fr: [
          'Filtrer par titre',
          'Réduire la liste des conversations (déplaçable)',
          'Liste des conversations (déplaçable)',
          '— · Conversations ordinaires',
          'Source',
          'Tout',
          'Sélectionner',
          'Navigation rapide dans les longues conversations (Minimap)',
          'Message',
          'Heure inconnue',
          'Projet sans nom',
          'Projet',
          'Projets · Tous',
          'Navigation entre les messages',
          'Correspondance dans le titre',
          'Déjà enregistré localement',
          'Effacer'
        ],
        ru: [
          'Фильтр по названию',
          'Свернуть список чатов (можно перетаскивать)',
          'Список чатов (можно перетаскивать)',
          '— · Обычные чаты',
          'Источник',
          'Все',
          'Выбрать',
          'Быстрая навигация по длинным чатам (Minimap)',
          'Сообщение',
          'Время неизвестно',
          'Проект без названия',
          'Проект',
          'Проекты · Все',
          'Навигация по сообщениям чата',
          'Совпадение в названии',
          'Уже сохранено локально',
          'Очистить'
        ],
        ja: [
          'タイトルで絞り込む',
          'チャット一覧を折りたたむ（ドラッグで移動可能）',
          'チャット一覧（ドラッグで移動可能）',
          '— · 通常のチャット',
          '取得元',
          'すべて',
          '選択',
          '長いチャットをすばやく移動（Minimap）',
          'メッセージ',
          '時刻不明',
          '名前のないプロジェクト',
          'プロジェクト',
          'プロジェクト · すべて',
          'チャット内のメッセージナビゲーション',
          'タイトルが一致',
          'ローカルに保存済み',
          '消去'
        ]
      }
    },
    {
      // Image downloads in a conversation branch: user-facing progress and
      // errors only, not internal ZIP transport validation.
      keys: [
        'ui.imageDownloadFailed',
        'ui.startingImageDownloads',
        'ui.noAccessibleImagesInTheCurrentConversationBranch',
        'ui.returnedDataIsNotAnImage',
        'ui.emptyImage',
        'ui.imageExceeds80MiBLimit',
        'ui.invalidImageFileIdentifier',
        'ui.chatgptDidNotProvideADownloadableImageURL',
        'status.imageDownloadHTTP',
        'status.imageZIPReadySucceededFailedParts',
        'status.downloadingImages',
        'status.savingImageZIP'
      ],
      translations: {
        'zh-TW': [
          '圖片下載失敗',
          '開始下載圖片',
          '目前對話分支沒有可辨識的圖片資源',
          '傳回的資料不是圖片',
          '圖片內容為空',
          '單張圖片超過 80 MiB 下載上限',
          '圖片檔案識別碼無效',
          'ChatGPT 未提供可下載的圖片連結',
          '圖片下載失敗（HTTP {1}）',
          '圖片 ZIP 已產生：成功 {1} 張、失敗 {2} 張；共 {3} 個分卷',
          '正在下載圖片 {1}/{2}',
          '正在儲存圖片 ZIP {1}/{2}'
        ],
        es: [
          'No se pudo descargar la imagen',
          'Iniciando la descarga de imágenes',
          'No se encontraron imágenes accesibles en esta rama de la conversación',
          'Los datos recibidos no corresponden a una imagen',
          'La imagen no contiene datos',
          'La imagen supera el límite de descarga de 80 MiB',
          'Identificador de archivo de imagen no válido',
          'ChatGPT no proporcionó un enlace de descarga para la imagen',
          'Error al descargar la imagen (HTTP {1})',
          'ZIP de imágenes generado: {1} correctas, {2} fallidas; {3} partes en total',
          'Descargando imágenes {1}/{2}',
          'Guardando el ZIP de imágenes {1}/{2}'
        ],
        hi: [
          'तस्वीर डाउनलोड नहीं हो सकी',
          'तस्वीरें डाउनलोड की जा रही हैं',
          'इस चैट की वर्तमान शाखा में कोई उपलब्ध तस्वीर नहीं मिली',
          'प्राप्त डेटा तस्वीर नहीं है',
          'तस्वीर का डेटा खाली है',
          'एक तस्वीर 80 MiB की डाउनलोड सीमा से बड़ी है',
          'तस्वीर की फ़ाइल पहचान अमान्य है',
          'ChatGPT ने तस्वीर डाउनलोड करने का लिंक नहीं दिया',
          'तस्वीर डाउनलोड विफल (HTTP {1})',
          'तस्वीरों का ZIP बन गया: {1} सफल, {2} विफल; कुल {3} हिस्से',
          'तस्वीरें डाउनलोड हो रही हैं {1}/{2}',
          'तस्वीरों का ZIP सेव हो रहा है {1}/{2}'
        ],
        ar: [
          'تعذر تنزيل الصورة',
          'بدء تنزيل الصور',
          'لا توجد صور يمكن الوصول إليها في فرع المحادثة الحالي',
          'البيانات المستلمة ليست صورة',
          'ملف الصورة فارغ',
          'يتجاوز حجم الصورة الواحدة حد التنزيل البالغ 80 MiB',
          'معرّف ملف الصورة غير صالح',
          'لم يوفر ChatGPT رابطًا لتنزيل الصورة',
          'فشل تنزيل الصورة (HTTP {1})',
          'تم إنشاء ملف ZIP للصور: نجح {1}، وفشل {2}؛ بإجمالي {3} أجزاء',
          'جارٍ تنزيل الصور {1}/{2}',
          'جارٍ حفظ ملف ZIP للصور {1}/{2}'
        ],
        'pt-BR': [
          'Falha ao baixar a imagem',
          'Iniciando o download das imagens',
          'Não foram encontradas imagens acessíveis nesta ramificação da conversa',
          'Os dados recebidos não são uma imagem',
          'A imagem não contém dados',
          'A imagem ultrapassa o limite de download de 80 MiB',
          'Identificador de arquivo de imagem inválido',
          'O ChatGPT não forneceu um link para baixar a imagem',
          'Falha ao baixar a imagem (HTTP {1})',
          'ZIP de imagens criado: {1} com sucesso, {2} com falha; {3} partes no total',
          'Baixando imagens {1}/{2}',
          'Salvando o ZIP de imagens {1}/{2}'
        ],
        bn: [
          'ছবি ডাউনলোড করা যায়নি',
          'ছবি ডাউনলোড শুরু হচ্ছে',
          'এই চ্যাটের বর্তমান শাখায় ব্যবহারযোগ্য কোনো ছবি পাওয়া যায়নি',
          'পাওয়া ডেটা কোনো ছবি নয়',
          'ছবির ডেটা খালি',
          'একটি ছবির আকার 80 MiB ডাউনলোড সীমা ছাড়িয়েছে',
          'ছবির ফাইল শনাক্তকারী সঠিক নয়',
          'ChatGPT ছবি ডাউনলোডের কোনো লিংক দেয়নি',
          'ছবি ডাউনলোড ব্যর্থ (HTTP {1})',
          'ছবির ZIP তৈরি হয়েছে: {1}টি সফল, {2}টি ব্যর্থ; মোট {3}টি অংশ',
          'ছবি ডাউনলোড হচ্ছে {1}/{2}',
          'ছবির ZIP সংরক্ষণ হচ্ছে {1}/{2}'
        ],
        id: [
          'Gagal mengunduh gambar',
          'Memulai pengunduhan gambar',
          'Tidak ada gambar yang dapat diakses pada cabang percakapan ini',
          'Data yang diterima bukan gambar',
          'Data gambar kosong',
          'Ukuran satu gambar melebihi batas unduhan 80 MiB',
          'Identitas berkas gambar tidak valid',
          'ChatGPT tidak menyediakan tautan untuk mengunduh gambar',
          'Gagal mengunduh gambar (HTTP {1})',
          'ZIP gambar berhasil dibuat: {1} berhasil, {2} gagal; total {3} bagian',
          'Mengunduh gambar {1}/{2}',
          'Menyimpan ZIP gambar {1}/{2}'
        ],
        fr: [
          'Échec du téléchargement de l’image',
          'Démarrage du téléchargement des images',
          'Aucune image accessible dans cette branche de la conversation',
          'Les données reçues ne sont pas une image',
          'Le fichier image est vide',
          'Une image dépasse la limite de téléchargement de 80 MiB',
          'Identifiant de fichier image non valide',
          'ChatGPT n’a fourni aucun lien permettant de télécharger l’image',
          'Échec du téléchargement de l’image (HTTP {1})',
          'ZIP des images créé : {1} réussites, {2} échecs ; {3} parties au total',
          'Téléchargement des images {1}/{2}',
          'Enregistrement du ZIP des images {1}/{2}'
        ],
        ru: [
          'Не удалось скачать изображение',
          'Начало загрузки изображений',
          'В текущей ветке чата нет доступных изображений',
          'Полученные данные не являются изображением',
          'Данные изображения пусты',
          'Размер одного изображения превышает ограничение на загрузку 80 MiB',
          'Недопустимый идентификатор файла изображения',
          'ChatGPT не предоставил ссылку для скачивания изображения',
          'Ошибка загрузки изображения (HTTP {1})',
          'ZIP с изображениями создан: успешно {1}, ошибок {2}; частей {3}',
          'Загрузка изображений {1}/{2}',
          'Сохранение ZIP с изображениями {1}/{2}'
        ],
        ja: [
          '画像のダウンロードに失敗しました',
          '画像のダウンロードを開始しています',
          '現在のチャットの分岐には取得可能な画像がありません',
          '取得したデータは画像ではありません',
          '画像データが空です',
          '画像 1 枚のサイズがダウンロード上限の 80 MiB を超えています',
          '画像ファイルの識別子が無効です',
          'ChatGPT から画像のダウンロードリンクが提供されませんでした',
          '画像のダウンロードに失敗しました（HTTP {1}）',
          '画像 ZIP を作成しました：成功 {1} 件、失敗 {2} 件、全 {3} 分割',
          '画像をダウンロード中 {1}/{2}',
          '画像 ZIP を保存中 {1}/{2}'
        ]
      }
    },
    {
      // Account-switch and authentication safeguards shared across tasks.
      // The distinction between an aborted local task and an uncertain
      // remote operation result must remain explicit in every language.
      keys: [
        'ui.accountChangedAuthorizeOrSearchAgain',
        'ui.accountChanged',
        'ui.accountChanged_8cef62a',
        'ui.accountChangedIndexingStopped',
        'ui.authenticationErrorTaskPaused',
        'ui.accountChangedInitialIndexingStopped',
        'ui.accountSwitchedReopenTaskManager',
        'ui.accountChangedTryAgain',
        'ui.accountChangedDuringDownload',
        'ui.unableToVerifyChatGPTAccountStoppedReadingAccount',
        'ui.accountChangedBulkRequestsStopped',
        'ui.accountSwitchedSyncAgain',
        'ui.accountChangedDetailTaskStopped',
        'ui.accountChangedDetailCacheWriteCanceled',
        'ui.accountChangedOperationStopped',
        'ui.accountChangedVerifyTheRemoteOperationResult'
      ],
      translations: {
        'zh-TW': [
          '帳號已變更；請重新授權或搜尋目前帳號',
          '帳號已切換',
          '登入帳號已切換',
          '登入帳號已切換，索引工作已停止',
          '登入或權限異常，工作已暫停',
          '登入帳號已切換，首次索引已停止',
          '登入帳號已切換，請重新開啟工作管理',
          '登入帳號已變更，請重試',
          '下載期間帳號已切換',
          '無法確認 ChatGPT 登入帳號，已停止讀取帳號快取',
          '登入帳號已切換，批次請求已停止',
          '登入帳號已切換，請重新同步',
          '登入帳號已切換，詳細資料擷取工作已停止',
          '登入帳號已切換，已取消寫入詳細資料快取',
          '登入帳號已切換，操作已停止',
          '登入帳號已切換，請核對遠端操作是否成功'
        ],
        es: [
          'La cuenta ha cambiado; vuelve a autorizar el acceso o busca en la cuenta actual',
          'La cuenta ha cambiado',
          'Ha cambiado la cuenta con la sesión iniciada',
          'Ha cambiado la cuenta; se ha detenido la tarea de indexación',
          'Error de inicio de sesión o permisos; tarea en pausa',
          'Ha cambiado la cuenta; se ha detenido la indexación inicial',
          'Ha cambiado la cuenta; vuelve a abrir el gestor de tareas',
          'Ha cambiado la cuenta; inténtalo de nuevo',
          'La cuenta ha cambiado durante la descarga',
          'No se pudo verificar la cuenta de ChatGPT; se ha dejado de leer su caché',
          'Ha cambiado la cuenta; se han detenido las solicitudes por lotes',
          'Ha cambiado la cuenta; vuelve a sincronizar',
          'Ha cambiado la cuenta; se ha detenido la tarea de obtención de detalles',
          'Ha cambiado la cuenta; se ha cancelado la escritura de detalles en caché',
          'Ha cambiado la cuenta; se ha detenido la operación',
          'Ha cambiado la cuenta; comprueba el resultado de la operación remota'
        ],
        hi: [
          'खाता बदल गया है; फिर से अनुमति दें या वर्तमान खाते में खोजें',
          'खाता बदल गया है',
          'लॉग-इन किया गया खाता बदल गया है',
          'लॉग-इन खाता बदल गया है; इंडेक्स बनाने का कार्य रोक दिया गया',
          'लॉग-इन या अनुमति संबंधी समस्या; कार्य रोक दिया गया है',
          'लॉग-इन खाता बदल गया है; पहली इंडेक्सिंग रोक दी गई',
          'लॉग-इन खाता बदल गया है; कार्य प्रबंधक दोबारा खोलें',
          'लॉग-इन खाता बदल गया है; फिर कोशिश करें',
          'डाउनलोड के दौरान खाता बदल गया',
          'ChatGPT के लॉग-इन खाते की पुष्टि नहीं हो सकी; खाते का कैश पढ़ना रोक दिया गया',
          'लॉग-इन खाता बदल गया है; बैच अनुरोध रोक दिए गए',
          'लॉग-इन खाता बदल गया है; फिर से सिंक करें',
          'लॉग-इन खाता बदल गया है; विवरण लाने का कार्य रोक दिया गया',
          'लॉग-इन खाता बदल गया है; विवरण कैश में लिखना रद्द कर दिया गया',
          'लॉग-इन खाता बदल गया है; कार्रवाई रोक दी गई',
          'लॉग-इन खाता बदल गया है; रिमोट कार्रवाई का परिणाम जाँचें'
        ],
        ar: [
          'تغير الحساب؛ أعد منح الإذن أو ابحث في الحساب الحالي',
          'تم تبديل الحساب',
          'تم تبديل الحساب المسجّل دخوله',
          'تم تبديل الحساب؛ توقفت مهمة الفهرسة',
          'مشكلة في تسجيل الدخول أو الأذونات؛ أُوقفت المهمة مؤقتًا',
          'تم تبديل الحساب؛ توقفت الفهرسة الأولية',
          'تم تبديل الحساب؛ أعد فتح مدير المهام',
          'تغير الحساب المسجّل دخوله؛ أعد المحاولة',
          'تغير الحساب أثناء التنزيل',
          'تعذر التحقق من حساب ChatGPT المسجّل دخوله؛ توقف الوصول إلى ذاكرة التخزين المؤقت للحساب',
          'تم تبديل الحساب؛ توقفت الطلبات المجمّعة',
          'تم تبديل الحساب؛ أعد المزامنة',
          'تم تبديل الحساب؛ توقفت مهمة جلب التفاصيل',
          'تم تبديل الحساب؛ أُلغيت كتابة التفاصيل في ذاكرة التخزين المؤقت',
          'تم تبديل الحساب؛ توقفت العملية',
          'تم تبديل الحساب؛ تحقق من نتيجة العملية على الخادم'
        ],
        'pt-BR': [
          'A conta mudou; autorize novamente ou pesquise na conta atual',
          'A conta mudou',
          'A conta conectada mudou',
          'A conta conectada mudou; a tarefa de indexação foi interrompida',
          'Problema de login ou permissão; tarefa pausada',
          'A conta conectada mudou; a indexação inicial foi interrompida',
          'A conta conectada mudou; abra novamente o gerenciador de tarefas',
          'A conta conectada mudou; tente novamente',
          'A conta mudou durante o download',
          'Não foi possível verificar a conta conectada do ChatGPT; a leitura do cache da conta foi interrompida',
          'A conta conectada mudou; as requisições em lote foram interrompidas',
          'A conta conectada mudou; sincronize novamente',
          'A conta conectada mudou; a tarefa de buscar detalhes foi interrompida',
          'A conta conectada mudou; a gravação de detalhes no cache foi cancelada',
          'A conta conectada mudou; a operação foi interrompida',
          'A conta conectada mudou; confira o resultado da operação remota'
        ],
        bn: [
          'অ্যাকাউন্ট বদলেছে; আবার অনুমতি দিন অথবা বর্তমান অ্যাকাউন্টে অনুসন্ধান করুন',
          'অ্যাকাউন্ট বদলেছে',
          'লগ-ইন করা অ্যাকাউন্ট বদলেছে',
          'লগ-ইন করা অ্যাকাউন্ট বদলেছে; ইনডেক্স তৈরির কাজ বন্ধ হয়েছে',
          'লগ-ইন বা অনুমতির সমস্যা; কাজ বিরতিতে আছে',
          'লগ-ইন করা অ্যাকাউন্ট বদলেছে; প্রথম ইনডেক্স তৈরির কাজ বন্ধ হয়েছে',
          'লগ-ইন করা অ্যাকাউন্ট বদলেছে; কাজ ব্যবস্থাপনা আবার খুলুন',
          'লগ-ইন করা অ্যাকাউন্ট বদলেছে; আবার চেষ্টা করুন',
          'ডাউনলোডের সময় অ্যাকাউন্ট বদলেছে',
          'ChatGPT-তে লগ-ইন করা অ্যাকাউন্ট যাচাই করা যায়নি; অ্যাকাউন্টের ক্যাশ পড়া বন্ধ হয়েছে',
          'লগ-ইন করা অ্যাকাউন্ট বদলেছে; ব্যাচ অনুরোধ বন্ধ হয়েছে',
          'লগ-ইন করা অ্যাকাউন্ট বদলেছে; আবার সিঙ্ক করুন',
          'লগ-ইন করা অ্যাকাউন্ট বদলেছে; বিস্তারিত তথ্য আনার কাজ বন্ধ হয়েছে',
          'লগ-ইন করা অ্যাকাউন্ট বদলেছে; বিস্তারিত তথ্য ক্যাশে লেখা বাতিল হয়েছে',
          'লগ-ইন করা অ্যাকাউন্ট বদলেছে; কাজটি বন্ধ হয়েছে',
          'লগ-ইন করা অ্যাকাউন্ট বদলেছে; দূরবর্তী কাজের ফলাফল যাচাই করুন'
        ],
        id: [
          'Akun berubah; berikan izin lagi atau cari di akun saat ini',
          'Akun telah berubah',
          'Akun yang masuk telah berubah',
          'Akun yang masuk berubah; tugas pengindeksan dihentikan',
          'Masalah login atau izin; tugas dijeda',
          'Akun yang masuk berubah; pengindeksan awal dihentikan',
          'Akun yang masuk berubah; buka kembali pengelola tugas',
          'Akun yang masuk berubah; coba lagi',
          'Akun berubah selama pengunduhan',
          'Akun ChatGPT yang masuk tidak dapat diverifikasi; pembacaan cache akun dihentikan',
          'Akun yang masuk berubah; permintaan massal dihentikan',
          'Akun yang masuk berubah; sinkronkan ulang',
          'Akun yang masuk berubah; tugas pengambilan detail dihentikan',
          'Akun yang masuk berubah; penulisan detail ke cache dibatalkan',
          'Akun yang masuk berubah; operasi dihentikan',
          'Akun yang masuk berubah; periksa hasil operasi jarak jauh'
        ],
        fr: [
          'Le compte a changé ; autorisez à nouveau l’accès ou recherchez dans le compte actuel',
          'Le compte a changé',
          'Le compte connecté a changé',
          'Le compte connecté a changé ; la tâche d’indexation a été arrêtée',
          'Problème de connexion ou d’autorisation ; tâche mise en pause',
          'Le compte connecté a changé ; l’indexation initiale a été arrêtée',
          'Le compte connecté a changé ; rouvrez le gestionnaire de tâches',
          'Le compte connecté a changé ; réessayez',
          'Le compte a changé pendant le téléchargement',
          'Impossible de vérifier le compte ChatGPT connecté ; la lecture de son cache a été arrêtée',
          'Le compte connecté a changé ; les requêtes groupées ont été arrêtées',
          'Le compte connecté a changé ; relancez la synchronisation',
          'Le compte connecté a changé ; la tâche de récupération des détails a été arrêtée',
          'Le compte connecté a changé ; l’écriture des détails dans le cache a été annulée',
          'Le compte connecté a changé ; l’opération a été arrêtée',
          'Le compte connecté a changé ; vérifiez le résultat de l’opération distante'
        ],
        ru: [
          'Учётная запись изменилась; повторно предоставьте разрешение или выполните поиск в текущей учётной записи',
          'Учётная запись изменилась',
          'Учётная запись, в которой выполнен вход, изменилась',
          'Учётная запись изменилась; задача индексации остановлена',
          'Проблема со входом или разрешениями; задача приостановлена',
          'Учётная запись изменилась; первичная индексация остановлена',
          'Учётная запись изменилась; снова откройте управление задачами',
          'Учётная запись изменилась; повторите попытку',
          'Учётная запись изменилась во время скачивания',
          'Не удалось проверить текущую учётную запись ChatGPT; чтение её кэша остановлено',
          'Учётная запись изменилась; пакетные запросы остановлены',
          'Учётная запись изменилась; повторите синхронизацию',
          'Учётная запись изменилась; задача получения подробных данных остановлена',
          'Учётная запись изменилась; запись подробных данных в кэш отменена',
          'Учётная запись изменилась; операция остановлена',
          'Учётная запись изменилась; проверьте результат удалённой операции'
        ],
        ja: [
          'アカウントが変更されました。再度許可するか、現在のアカウントで検索してください',
          'アカウントが切り替わりました',
          'ログイン中のアカウントが切り替わりました',
          'ログイン中のアカウントが切り替わったため、インデックス作成タスクを停止しました',
          'ログインまたは権限に問題があるため、タスクを一時停止しました',
          'ログイン中のアカウントが切り替わったため、初回のインデックス作成を停止しました',
          'ログイン中のアカウントが切り替わりました。タスク管理を開き直してください',
          'ログイン中のアカウントが変更されました。もう一度お試しください',
          'ダウンロード中にアカウントが切り替わりました',
          'ChatGPT のログインアカウントを確認できないため、アカウントのキャッシュの読み込みを停止しました',
          'ログイン中のアカウントが切り替わったため、一括リクエストを停止しました',
          'ログイン中のアカウントが切り替わりました。再度同期してください',
          'ログイン中のアカウントが切り替わったため、詳細取得タスクを停止しました',
          'ログイン中のアカウントが切り替わったため、詳細データのキャッシュへの書き込みを取り消しました',
          'ログイン中のアカウントが切り替わったため、操作を停止しました',
          'ログイン中のアカウントが切り替わりました。リモート側の操作結果を確認してください'
        ]
      }
    },
    {
      // Initial full-text indexing and directory synchronization messages.
      // These are presented to users, rather than low-level DB diagnostics.
      keys: [
        'ui.rebuildingLocalDirectory',
        'ui.initialDirectorySyncComplete',
        'ui.incrementalSyncComplete',
        'ui.syncFailed',
        'ui.indexUpdateFailed',
        'ui.failedToReadIndexStatus',
        'ui.initialIndexingRequiresExplicitConsent',
        'ui.repeatedDirectoryPageDetectedStoppedToPreventA',
        'ui.initialDirectoryEndedEarlyCompletenessCannotBeVerified',
        'ui.repeatedProjectCursorStoppedToPreventALoop',
        'ui.anotherTabIsSyncingTheDirectoryInitialCompleteness',
        'ui.gptProjectMetadataFailedRepeatedlyTryAgainLater',
        'ui.projectDirectoryFailedRepeatedlyTryAgainLater',
        'ui.initialIndexingPreparationInterrupted',
        'ui.directorySyncFailedCheckSignInOrTry',
        'ui.indexPausedAfterRepeatedFailures',
        'ui.directoryVerificationFailed',
        'ui.failedToPrepareInitialIndex',
        'ui.completeInitialIndexingFirst',
        'ui.initialIndexingConsentMissing'
      ],
      translations: {
        'zh-TW': [
          '正在重建本機目錄…',
          '首次目錄同步已完成',
          '增量同步已完成',
          '同步失敗',
          '索引更新失敗',
          '讀取索引狀態失敗',
          '首次全文索引必須取得使用者明確授權',
          '完整目錄出現重複分頁，已停止以避免無限循環',
          '首次完整目錄的分頁提前結束，無法確認資料是否完整',
          '專案分頁游標重複，已停止以避免無限循環',
          '另一個分頁正在同步目錄，無法確認首次完整掃描是否完成',
          'GPT 專案中繼資料連續取得失敗，已停止；請稍後手動重試',
          '專案目錄連續取得失敗，已停止；請稍後手動重試',
          '首次索引準備中斷',
          '目錄同步失敗，請檢查登入狀態，或等待冷卻後重試',
          '連續失敗次數達到門檻，索引工作已暫停',
          '目錄核實失敗',
          '首次索引準備失敗',
          '請先完成首次全文索引',
          '尚未授權首次完整索引'
        ],
        es: [
          'Reconstruyendo el directorio local…',
          'Sincronización inicial del directorio completada',
          'Sincronización incremental completada',
          'Error de sincronización',
          'Error al actualizar el índice',
          'No se pudo leer el estado del índice',
          'La primera indexación de texto completo requiere tu autorización expresa',
          'Se detectó una página repetida en el directorio completo; se detuvo para evitar un bucle',
          'La paginación del directorio inicial terminó antes de tiempo; no se puede confirmar que esté completo',
          'Se repitió el cursor de paginación del proyecto; se detuvo para evitar un bucle',
          'Otra pestaña está sincronizando el directorio; no se puede verificar el primer recorrido completo',
          'Falló varias veces la carga de metadatos de proyectos GPT; se detuvo. Vuelve a intentarlo manualmente más tarde',
          'Falló varias veces la carga del directorio de proyectos; se detuvo. Vuelve a intentarlo manualmente más tarde',
          'Se interrumpió la preparación de la primera indexación',
          'Error al sincronizar el directorio; comprueba la sesión o reintenta cuando termine la espera',
          'Se alcanzó el límite de fallos consecutivos; la indexación quedó en pausa',
          'Error al verificar el directorio',
          'No se pudo preparar la primera indexación',
          'Completa primero la indexación inicial de texto completo',
          'La indexación inicial completa aún no está autorizada'
        ],
        hi: [
          'स्थानीय चैट सूची फिर से बनाई जा रही है…',
          'पहली बार चैट सूची का सिंक पूरा हुआ',
          'बदलावों का सिंक पूरा हुआ',
          'सिंक विफल रहा',
          'इंडेक्स अपडेट नहीं हो सका',
          'इंडेक्स की स्थिति पढ़ी नहीं जा सकी',
          'पहली पूर्ण-पाठ इंडेक्सिंग के लिए उपयोगकर्ता की स्पष्ट अनुमति आवश्यक है',
          'पूरी चैट सूची में एक ही पेज दोबारा मिला; लूप से बचने के लिए प्रक्रिया रोक दी गई',
          'पहली पूरी चैट सूची में पेज समय से पहले समाप्त हो गए; सूची पूरी होने की पुष्टि नहीं की जा सकती',
          'प्रोजेक्ट का पेजिनेशन कर्सर दोहराया गया; लूप से बचने के लिए प्रक्रिया रोक दी गई',
          'दूसरा टैब चैट सूची सिंक कर रहा है; पहली पूरी जाँच की पुष्टि नहीं हो सकती',
          'GPT प्रोजेक्ट की जानकारी बार-बार लोड नहीं हो सकी; प्रक्रिया रोक दी गई। बाद में स्वयं दोबारा कोशिश करें',
          'प्रोजेक्ट की चैट सूची बार-बार लोड नहीं हो सकी; प्रक्रिया रोक दी गई। बाद में स्वयं दोबारा कोशिश करें',
          'पहली इंडेक्सिंग की तैयारी बीच में रुक गई',
          'चैट सूची सिंक नहीं हुई; लॉग-इन स्थिति जाँचें या प्रतीक्षा अवधि के बाद फिर कोशिश करें',
          'लगातार विफलताओं की सीमा पूरी हो गई; इंडेक्सिंग का काम रोक दिया गया',
          'चैट सूची का सत्यापन विफल रहा',
          'पहली इंडेक्सिंग की तैयारी विफल रही',
          'पहले पूर्ण-पाठ की प्रारंभिक इंडेक्सिंग पूरी करें',
          'पहली पूरी इंडेक्सिंग के लिए अभी अनुमति नहीं मिली है'
        ],
        ar: [
          'جارٍ إعادة بناء دليل المحادثات المحلي…',
          'اكتملت المزامنة الأولى للدليل',
          'اكتملت المزامنة التزايدية',
          'فشلت المزامنة',
          'فشل تحديث الفهرس',
          'تعذرت قراءة حالة الفهرس',
          'تتطلب الفهرسة النصية الأولى موافقة صريحة من المستخدم',
          'تكررت صفحة في الدليل الكامل؛ توقفت العملية لتجنب حلقة لا تنتهي',
          'انتهى ترقيم صفحات الدليل الأول مبكرًا؛ لا يمكن التأكد من اكتماله',
          'تكرر مؤشر ترقيم صفحات المشروع؛ توقفت العملية لتجنب حلقة لا تنتهي',
          'تعمل علامة تبويب أخرى على مزامنة الدليل؛ لا يمكن تأكيد اكتمال الفحص الأول',
          'فشل جلب بيانات مشاريع GPT الوصفية مرارًا؛ توقفت العملية. حاول يدويًا لاحقًا',
          'فشل جلب دليل المشاريع مرارًا؛ توقفت العملية. حاول يدويًا لاحقًا',
          'توقف الإعداد للفهرسة الأولى قبل اكتماله',
          'فشلت مزامنة الدليل؛ تحقق من تسجيل الدخول أو حاول بعد انتهاء فترة الانتظار',
          'بلغت الإخفاقات المتتالية الحد المحدد؛ أُوقفت مهمة الفهرسة مؤقتًا',
          'فشل التحقق من الدليل',
          'فشل الإعداد للفهرسة الأولى',
          'أكمل الفهرسة النصية الأولى قبل المتابعة',
          'لم يُمنح الإذن بعد للفهرسة الكاملة الأولى'
        ],
        'pt-BR': [
          'Reconstruindo o diretório local…',
          'Sincronização inicial do diretório concluída',
          'Sincronização incremental concluída',
          'Falha na sincronização',
          'Falha ao atualizar o índice',
          'Não foi possível ler o status do índice',
          'A primeira indexação de texto completo exige autorização explícita do usuário',
          'Uma página do diretório completo se repetiu; processo interrompido para evitar um loop',
          'A paginação do diretório inicial terminou antes do esperado; não é possível confirmar que esteja completo',
          'O cursor de paginação do projeto se repetiu; processo interrompido para evitar um loop',
          'Outra aba está sincronizando o diretório; não é possível confirmar a primeira varredura completa',
          'Falhas repetidas ao carregar metadados de projetos GPT; processo interrompido. Tente novamente mais tarde',
          'Falhas repetidas ao carregar o diretório de projetos; processo interrompido. Tente novamente mais tarde',
          'A preparação da primeira indexação foi interrompida',
          'Falha na sincronização do diretório; confira o login ou tente novamente após a pausa',
          'O limite de falhas consecutivas foi atingido; indexação pausada',
          'Falha ao verificar o diretório',
          'Falha ao preparar a primeira indexação',
          'Conclua primeiro a indexação inicial de texto completo',
          'A primeira indexação completa ainda não foi autorizada'
        ],
        bn: [
          'স্থানীয় চ্যাট তালিকা নতুন করে তৈরি হচ্ছে…',
          'প্রথমবারের চ্যাট তালিকা সিঙ্ক সম্পন্ন',
          'পরিবর্তিত তথ্যের সিঙ্ক সম্পন্ন',
          'সিঙ্ক ব্যর্থ হয়েছে',
          'ইনডেক্স হালনাগাদ ব্যর্থ হয়েছে',
          'ইনডেক্সের অবস্থা পড়া যায়নি',
          'প্রথম সম্পূর্ণ-টেক্সট ইনডেক্স তৈরিতে ব্যবহারকারীর স্পষ্ট অনুমতি প্রয়োজন',
          'সম্পূর্ণ তালিকায় একই পৃষ্ঠা আবার এসেছে; অনন্ত লুপ এড়াতে কাজ বন্ধ হয়েছে',
          'প্রথম সম্পূর্ণ তালিকার পৃষ্ঠা আগেই শেষ হয়েছে; তালিকা সম্পূর্ণ কি না নিশ্চিত করা যায়নি',
          'প্রজেক্টের পৃষ্ঠার কার্সর পুনরাবৃত্তি হয়েছে; অনন্ত লুপ এড়াতে কাজ বন্ধ হয়েছে',
          'অন্য একটি ট্যাবে তালিকা সিঙ্ক হচ্ছে; প্রথম পূর্ণাঙ্গ যাচাই শেষ হয়েছে কি না নিশ্চিত করা যায়নি',
          'GPT প্রজেক্টের বিবরণ বারবার পাওয়া যায়নি; কাজ বন্ধ হয়েছে। পরে নিজে আবার চেষ্টা করুন',
          'প্রজেক্টের তালিকা বারবার পাওয়া যায়নি; কাজ বন্ধ হয়েছে। পরে নিজে আবার চেষ্টা করুন',
          'প্রথম ইনডেক্সের প্রস্তুতি মাঝপথে থেমে গেছে',
          'তালিকা সিঙ্ক ব্যর্থ; লগ-ইন যাচাই করুন অথবা অপেক্ষার সময় শেষ হলে আবার চেষ্টা করুন',
          'পরপর ব্যর্থতার সীমা পূর্ণ হয়েছে; ইনডেক্স তৈরির কাজ বিরতিতে রাখা হয়েছে',
          'তালিকা যাচাই ব্যর্থ হয়েছে',
          'প্রথম ইনডেক্সের প্রস্তুতি ব্যর্থ হয়েছে',
          'আগে প্রথম সম্পূর্ণ-টেক্সট ইনডেক্স তৈরি শেষ করুন',
          'প্রথম সম্পূর্ণ ইনডেক্স তৈরির অনুমতি এখনও দেওয়া হয়নি'
        ],
        id: [
          'Membangun ulang direktori lokal…',
          'Sinkronisasi direktori awal selesai',
          'Sinkronisasi inkremental selesai',
          'Sinkronisasi gagal',
          'Gagal memperbarui indeks',
          'Gagal membaca status indeks',
          'Pengindeksan teks lengkap pertama memerlukan izin tegas dari pengguna',
          'Halaman direktori lengkap terulang; proses dihentikan untuk mencegah perulangan tanpa akhir',
          'Penelusuran halaman direktori awal berakhir terlalu cepat; kelengkapannya belum dapat dipastikan',
          'Kursor halaman proyek terulang; proses dihentikan untuk mencegah perulangan tanpa akhir',
          'Tab lain sedang menyinkronkan direktori; pemindaian awal secara lengkap belum dapat dipastikan',
          'Pengambilan metadata proyek GPT gagal berulang kali; proses dihentikan. Coba lagi secara manual nanti',
          'Pengambilan direktori proyek gagal berulang kali; proses dihentikan. Coba lagi secara manual nanti',
          'Persiapan pengindeksan awal terhenti',
          'Sinkronisasi direktori gagal; periksa login atau coba lagi setelah masa jeda',
          'Batas kegagalan berturut-turut tercapai; tugas pengindeksan dijeda',
          'Verifikasi direktori gagal',
          'Gagal menyiapkan pengindeksan awal',
          'Selesaikan pengindeksan teks lengkap awal terlebih dahulu',
          'Pengindeksan lengkap pertama belum diizinkan'
        ],
        fr: [
          'Reconstruction du répertoire local…',
          'Synchronisation initiale du répertoire terminée',
          'Synchronisation incrémentale terminée',
          'Échec de la synchronisation',
          'Échec de la mise à jour de l’index',
          'Impossible de lire l’état de l’index',
          'La première indexation en texte intégral nécessite votre autorisation explicite',
          'Une page du répertoire complet se répète ; opération arrêtée pour éviter une boucle',
          'La pagination du répertoire initial s’est terminée trop tôt ; impossible de confirmer son exhaustivité',
          'Le curseur de pagination du projet se répète ; opération arrêtée pour éviter une boucle',
          'Un autre onglet synchronise le répertoire ; impossible de confirmer le premier parcours complet',
          'Échecs répétés du chargement des métadonnées des projets GPT ; opération arrêtée. Réessayez manuellement plus tard',
          'Échecs répétés du chargement du répertoire des projets ; opération arrêtée. Réessayez manuellement plus tard',
          'La préparation de la première indexation a été interrompue',
          'Échec de la synchronisation du répertoire ; vérifiez la connexion ou réessayez après la période d’attente',
          'Le seuil d’échecs consécutifs a été atteint ; la tâche d’indexation est en pause',
          'Échec de la vérification du répertoire',
          'Échec de la préparation de la première indexation',
          'Terminez d’abord l’indexation initiale en texte intégral',
          'La première indexation complète n’a pas encore été autorisée'
        ],
        ru: [
          'Перестроение локального списка чатов…',
          'Первичная синхронизация списка чатов завершена',
          'Инкрементальная синхронизация завершена',
          'Ошибка синхронизации',
          'Не удалось обновить индекс',
          'Не удалось прочитать состояние индекса',
          'Для первой полнотекстовой индексации требуется явное разрешение пользователя',
          'Обнаружена повторная страница полного списка; операция остановлена во избежание цикла',
          'Разбиение первичного списка на страницы завершилось досрочно; полнота списка не подтверждена',
          'Курсор страниц проекта повторился; операция остановлена во избежание цикла',
          'Другая вкладка синхронизирует список чатов; первая полная проверка не подтверждена',
          'Не удалось загрузить метаданные проектов GPT после нескольких попыток; операция остановлена. Повторите вручную позже',
          'Не удалось загрузить список проектов после нескольких попыток; операция остановлена. Повторите вручную позже',
          'Подготовка к первой индексации прервана',
          'Сбой синхронизации списка чатов; проверьте вход или повторите попытку после паузы',
          'Достигнут предел последовательных ошибок; задача индексации приостановлена',
          'Ошибка проверки списка чатов',
          'Не удалось подготовить первую индексацию',
          'Сначала завершите первичную полнотекстовую индексацию',
          'Первая полная индексация ещё не разрешена'
        ],
        ja: [
          'ローカルのチャット一覧を再構築中…',
          '初回のチャット一覧の同期が完了しました',
          '差分同期が完了しました',
          '同期に失敗しました',
          'インデックスの更新に失敗しました',
          'インデックスの状態を読み取れませんでした',
          '初回の全文インデックス作成にはユーザーの明示的な許可が必要です',
          'チャット一覧全体で同じページが繰り返されたため、無限ループ防止のため処理を停止しました',
          '初回のチャット一覧のページ取得が途中で終了したため、一覧の完全性を確認できません',
          'プロジェクトのページ送りカーソルが重複したため、無限ループ防止のため処理を停止しました',
          '別のタブでチャット一覧を同期中のため、初回の全件確認が完了したか判断できません',
          'GPT プロジェクトのメタデータを繰り返し取得できなかったため停止しました。後で手動で再試行してください',
          'プロジェクト一覧を繰り返し取得できなかったため停止しました。後で手動で再試行してください',
          '初回のインデックス作成準備が中断されました',
          'チャット一覧の同期に失敗しました。ログイン状態を確認するか、待機時間の終了後に再試行してください',
          '連続エラーの上限に達したため、インデックス作成タスクを一時停止しました',
          'チャット一覧の検証に失敗しました',
          '初回インデックス作成の準備に失敗しました',
          '最初に初回の全文インデックス作成を完了してください',
          '初回の全件インデックス作成はまだ許可されていません'
        ]
      }
    },
    {
      // Bulk export task controls, saved ZIP-part recovery and their live statuses.
      keys: [
        'ui.bulkExportFailed',
        'ui.selectedChatsAreLocalOnlyAndCannotBe',
        'ui.failedItems',
        'ui.localTask',
        'ui.waitingToResume',
        'ui.refreshFailed',
        'ui.deletePermanently',
        'ui.savedZIPFileNotFound',
        'ui.exportErrorsTxt',
        'ui.extensionBackgroundOperationFailed',
        'ui.enableTheExtensionFirst',
        'ui.invalidTaskOperation',
        'ui.taskNotFoundForCurrentAccount',
        'ui.noSavedZIPPartsForThisTask',
        'ui.bulkRequestsEnteredSharedCooldown',
        'ui.bulkTaskItemFailed',
        'ui.taskStatusChanged',
        'ui.taskItemsCannotBeEmpty',
        'ui.taskContainsDuplicateConversationIDs',
        'ui.unsupportedTaskType',
        'ui.notAllowedToWriteThisExportTask',
        'ui.zipPartNumberAlreadyExists',
        'ui.exportTaskNotFoundForCurrentAccount',
        'ui.cancelOrFinishTheTaskBeforeClearingSaved',
        'ui.zipCleanupFailed',
        'ui.savedZIPPartNotFound',
        'ui.notAuthorizedToUploadZIPPart',
        'ui.cannotReadExportTask',
        'ui.failedItemsVariable',
        'ui.andDownloadStarted',
        'status.zipParts',
        'status.exporting'
      ],
      translations: {
        'zh-TW': [
          '批次匯出失敗',
          '所選記錄僅存在本機，無法對雲端記錄執行操作',
          '失敗項目',
          '本機工作',
          '等待恢復',
          '重新整理失敗',
          '永久刪除',
          '找不到已儲存的 ZIP 分卷',
          '匯出失敗.txt',
          '擴充功能背景操作失敗',
          '請先啟用擴充功能',
          '無效的工作操作',
          '找不到目前帳號的工作',
          '此工作沒有已儲存的 ZIP 分卷',
          '批次請求已進入共用冷卻',
          '批次工作中的單一項目處理失敗',
          '工作狀態已更新',
          '工作項目不可為空',
          '工作包含重複的對話 ID',
          '不支援的工作類型',
          '無權寫入此匯出工作',
          '相同編號的 ZIP 分卷已存在',
          '找不到目前帳號的匯出工作',
          '請先取消或完成工作，再清理已儲存的 ZIP 分卷',
          'ZIP 清理失敗',
          '找不到已儲存的 ZIP 分卷',
          '沒有上傳 ZIP 分卷的權限',
          '無法讀取匯出工作',
          '失敗項目：⏎{items}',
          '並已開始下載',
          '{1} · {2} 個 ZIP 分卷',
          '正在匯出 {1}'
        ],
        es: [
          'Error en la exportación por lotes',
          'Los registros seleccionados solo están guardados localmente; no se pueden realizar acciones en la nube',
          'Elementos fallidos',
          'Tarea local',
          'En espera para reanudar',
          'Error al actualizar',
          'Eliminar permanentemente',
          'No se encontró la parte ZIP guardada',
          'errores-de-exportación.txt',
          'Error en la operación en segundo plano de la extensión',
          'Activa primero la extensión',
          'Operación de tarea no válida',
          'No se encontró la tarea de esta cuenta',
          'No hay partes ZIP guardadas para esta tarea',
          'Las solicitudes por lotes entraron en una pausa compartida',
          'Falló un elemento de la tarea por lotes',
          'Estado de la tarea actualizado',
          'La tarea no puede estar vacía',
          'La tarea contiene ID de conversación duplicados',
          'Tipo de tarea no compatible',
          'No tienes permiso para escribir en esta tarea de exportación',
          'Ya existe una parte ZIP con ese número',
          'No se encontró la tarea de exportación de esta cuenta',
          'Cancela o termina la tarea antes de eliminar las partes ZIP guardadas',
          'Error al limpiar las partes ZIP',
          'No se encontró la parte ZIP guardada',
          'No tienes autorización para subir una parte ZIP',
          'No se puede leer la tarea de exportación',
          'Elementos fallidos:⏎{items}',
          'y se inició la descarga',
          '{1} · {2} partes ZIP',
          'Exportando {1}'
        ],
        hi: [
          'बैच एक्सपोर्ट विफल रहा',
          'चुने गए रिकॉर्ड केवल स्थानीय रूप से उपलब्ध हैं; उन पर क्लाउड कार्रवाई नहीं की जा सकती',
          'विफल आइटम',
          'स्थानीय कार्य',
          'फिर शुरू होने की प्रतीक्षा',
          'रीफ़्रेश विफल रहा',
          'स्थायी रूप से मिटाएँ',
          'सहेजा गया ZIP भाग नहीं मिला',
          'निर्यात-त्रुटियाँ.txt',
          'एक्सटेंशन की बैकग्राउंड कार्रवाई विफल रही',
          'पहले एक्सटेंशन चालू करें',
          'कार्य कार्रवाई अमान्य है',
          'इस खाते के लिए कार्य नहीं मिला',
          'इस कार्य के लिए कोई सहेजा गया ZIP भाग नहीं है',
          'बैच अनुरोध साझा प्रतीक्षा अवधि में चले गए',
          'बैच कार्य का एक आइटम विफल रहा',
          'कार्य की स्थिति अपडेट हुई',
          'कार्य में आइटम खाली नहीं हो सकते',
          'कार्य में दोहराई गई बातचीत ID हैं',
          'यह कार्य प्रकार समर्थित नहीं है',
          'इस एक्सपोर्ट कार्य में लिखने की अनुमति नहीं है',
          'इस नंबर वाला ZIP भाग पहले से मौजूद है',
          'इस खाते का एक्सपोर्ट कार्य नहीं मिला',
          'सहेजे गए ZIP भाग साफ़ करने से पहले कार्य रद्द करें या पूरा होने दें',
          'ZIP साफ़ करने में विफल',
          'सहेजा गया ZIP भाग नहीं मिला',
          'ZIP भाग अपलोड करने की अनुमति नहीं है',
          'एक्सपोर्ट कार्य पढ़ा नहीं जा सका',
          'विफल आइटम:⏎{items}',
          'और डाउनलोड शुरू हो गया',
          '{1} · {2} ZIP भाग',
          '{1} एक्सपोर्ट हो रहा है'
        ],
        ar: [
          'فشل التصدير المجمّع',
          'السجلات المحددة محفوظة محليًا فقط؛ لا يمكن تنفيذ إجراءات سحابية عليها',
          'العناصر الفاشلة',
          'مهمة محلية',
          'في انتظار الاستئناف',
          'فشل التحديث',
          'حذف نهائي',
          'لم يتم العثور على جزء ZIP المحفوظ',
          'أخطاء-التصدير.txt',
          'فشلت عملية الإضافة في الخلفية',
          'يرجى تفعيل الإضافة أولًا',
          'عملية المهمة غير صالحة',
          'لم يتم العثور على مهمة لهذا الحساب',
          'لا توجد أجزاء ZIP محفوظة لهذه المهمة',
          'دخلت الطلبات المجمعة في فترة انتظار مشتركة',
          'فشلت معالجة عنصر واحد من المهمة المجمعة',
          'تم تحديث حالة المهمة',
          'لا يمكن أن تكون عناصر المهمة فارغة',
          'تحتوي المهمة على معرّفات محادثات مكررة',
          'نوع المهمة غير مدعوم',
          'غير مصرح لك بالكتابة إلى مهمة التصدير هذه',
          'يوجد جزء ZIP بهذا الرقم بالفعل',
          'لم يتم العثور على مهمة التصدير لهذا الحساب',
          'ألغِ المهمة أو أكملها قبل حذف أجزاء ZIP المحفوظة',
          'فشل تنظيف ZIP',
          'لم يتم العثور على جزء ZIP المحفوظ',
          'غير مصرح لك برفع جزء ZIP',
          'تعذرت قراءة مهمة التصدير',
          'العناصر الفاشلة:⏎{items}',
          'وبدأ التنزيل',
          '{1} · {2} أجزاء ZIP',
          'جارٍ تصدير {1}'
        ],
        'pt-BR': [
          'Falha na exportação em lote',
          'Os registros selecionados existem apenas localmente; não é possível executar ações na nuvem',
          'Itens com falha',
          'Tarefa local',
          'Aguardando para retomar',
          'Falha ao atualizar',
          'Excluir permanentemente',
          'Parte ZIP salva não encontrada',
          'erros-de-exportação.txt',
          'Falha na operação em segundo plano da extensão',
          'Ative a extensão primeiro',
          'Operação de tarefa inválida',
          'Tarefa não encontrada para esta conta',
          'Não há partes ZIP salvas para esta tarefa',
          'As solicitações em lote entraram em uma pausa compartilhada',
          'Um item da tarefa em lote falhou',
          'Status da tarefa atualizado',
          'Os itens da tarefa não podem estar vazios',
          'A tarefa contém IDs de conversa duplicados',
          'Tipo de tarefa não compatível',
          'Você não tem permissão para gravar nesta tarefa de exportação',
          'Já existe uma parte ZIP com esse número',
          'Tarefa de exportação não encontrada para esta conta',
          'Cancele ou conclua a tarefa antes de limpar as partes ZIP salvas',
          'Falha ao limpar o ZIP',
          'Parte ZIP salva não encontrada',
          'Sem autorização para enviar uma parte ZIP',
          'Não foi possível ler a tarefa de exportação',
          'Itens com falha:⏎{items}',
          'e o download foi iniciado',
          '{1} · {2} partes ZIP',
          'Exportando {1}'
        ],
        bn: [
          'একসঙ্গে একাধিক আইটেম এক্সপোর্ট ব্যর্থ হয়েছে',
          'নির্বাচিত রেকর্ড শুধু স্থানীয়ভাবে আছে; এগুলোর ওপর ক্লাউডে কোনো কাজ করা যাবে না',
          'ব্যর্থ আইটেম',
          'স্থানীয় কাজ',
          'আবার শুরু হওয়ার অপেক্ষায়',
          'রিফ্রেশ ব্যর্থ হয়েছে',
          'স্থায়ীভাবে মুছুন',
          'সংরক্ষিত ZIP অংশ পাওয়া যায়নি',
          'এক্সপোর্ট-ত্রুটি.txt',
          'এক্সটেনশনের ব্যাকগ্রাউন্ড কাজ ব্যর্থ হয়েছে',
          'আগে এক্সটেনশন চালু করুন',
          'কাজের অপারেশনটি বৈধ নয়',
          'এই অ্যাকাউন্টের কাজ পাওয়া যায়নি',
          'এই কাজের জন্য কোনো সংরক্ষিত ZIP অংশ নেই',
          'একাধিক অনুরোধ যৌথ অপেক্ষার অবস্থায় গেছে',
          'একাধিক আইটেমের কাজের একটি আইটেম ব্যর্থ হয়েছে',
          'কাজের অবস্থা হালনাগাদ হয়েছে',
          'কাজের আইটেম খালি রাখা যাবে না',
          'কাজে একই কথোপকথনের ID একাধিকবার আছে',
          'এই ধরনের কাজ সমর্থিত নয়',
          'এই এক্সপোর্ট কাজে লেখার অনুমতি নেই',
          'এই নম্বরের ZIP অংশ আগে থেকেই আছে',
          'এই অ্যাকাউন্টের এক্সপোর্ট কাজ পাওয়া যায়নি',
          'সংরক্ষিত ZIP অংশ পরিষ্কার করার আগে কাজটি বাতিল করুন বা শেষ হতে দিন',
          'ZIP পরিষ্কার করা ব্যর্থ হয়েছে',
          'সংরক্ষিত ZIP অংশ পাওয়া যায়নি',
          'ZIP অংশ আপলোডের অনুমতি নেই',
          'এক্সপোর্ট কাজ পড়া যায়নি',
          'ব্যর্থ আইটেম:⏎{items}',
          'এবং ডাউনলোড শুরু হয়েছে',
          '{1} · {2}টি ZIP অংশ',
          '{1} এক্সপোর্ট হচ্ছে'
        ],
        id: [
          'Ekspor massal gagal',
          'Catatan yang dipilih hanya tersimpan secara lokal; tindakan cloud tidak dapat dilakukan',
          'Item gagal',
          'Tugas lokal',
          'Menunggu untuk dilanjutkan',
          'Gagal menyegarkan',
          'Hapus permanen',
          'Bagian ZIP tersimpan tidak ditemukan',
          'kesalahan-ekspor.txt',
          'Operasi latar belakang ekstensi gagal',
          'Aktifkan ekstensi terlebih dahulu',
          'Operasi tugas tidak valid',
          'Tugas untuk akun ini tidak ditemukan',
          'Tidak ada bagian ZIP tersimpan untuk tugas ini',
          'Permintaan massal memasuki jeda bersama',
          'Satu item dalam tugas massal gagal diproses',
          'Status tugas diperbarui',
          'Item tugas tidak boleh kosong',
          'Tugas berisi ID percakapan duplikat',
          'Jenis tugas tidak didukung',
          'Anda tidak diizinkan menulis ke tugas ekspor ini',
          'Bagian ZIP dengan nomor ini sudah ada',
          'Tugas ekspor untuk akun ini tidak ditemukan',
          'Batalkan atau selesaikan tugas sebelum menghapus bagian ZIP tersimpan',
          'Pembersihan ZIP gagal',
          'Bagian ZIP tersimpan tidak ditemukan',
          'Tidak diizinkan mengunggah bagian ZIP',
          'Tugas ekspor tidak dapat dibaca',
          'Item gagal:⏎{items}',
          'dan unduhan dimulai',
          '{1} · {2} bagian ZIP',
          'Mengekspor {1}'
        ],
        fr: [
          'Échec de l’exportation par lots',
          'Les éléments sélectionnés sont uniquement locaux ; aucune action dans le cloud n’est possible',
          'Éléments en échec',
          'Tâche locale',
          'En attente de reprise',
          'Échec de l’actualisation',
          'Supprimer définitivement',
          'Partie ZIP enregistrée introuvable',
          'erreurs-exportation.txt',
          'Échec de l’opération en arrière-plan de l’extension',
          'Activez d’abord l’extension',
          'Opération de tâche invalide',
          'Tâche introuvable pour ce compte',
          'Aucune partie ZIP enregistrée pour cette tâche',
          'Les requêtes groupées sont entrées dans une période d’attente partagée',
          'Échec du traitement d’un élément de la tâche groupée',
          'État de la tâche mis à jour',
          'La tâche ne peut pas être vide',
          'La tâche contient des identifiants de conversation en double',
          'Type de tâche non pris en charge',
          'Vous n’êtes pas autorisé à écrire dans cette tâche d’exportation',
          'Une partie ZIP portant ce numéro existe déjà',
          'Tâche d’exportation introuvable pour ce compte',
          'Annulez ou terminez la tâche avant de supprimer les parties ZIP enregistrées',
          'Échec du nettoyage ZIP',
          'Partie ZIP enregistrée introuvable',
          'Autorisation de téléversement de la partie ZIP manquante',
          'Impossible de lire la tâche d’exportation',
          'Éléments en échec :⏎{items}',
          'et le téléchargement a commencé',
          '{1} · {2} parties ZIP',
          'Exportation de {1} en cours'
        ],
        ru: [
          'Ошибка пакетного экспорта',
          'Выбранные записи сохранены только локально; действия в облаке для них недоступны',
          'Неудачные элементы',
          'Локальная задача',
          'Ожидание возобновления',
          'Не удалось обновить',
          'Удалить навсегда',
          'Сохранённая часть ZIP не найдена',
          'ошибки-экспорта.txt',
          'Ошибка фоновой операции расширения',
          'Сначала включите расширение',
          'Недопустимая операция с задачей',
          'Задача для этой учётной записи не найдена',
          'Для этой задачи нет сохранённых частей ZIP',
          'Пакетные запросы перешли в общий период ожидания',
          'Не удалось обработать один элемент пакетной задачи',
          'Статус задачи обновлён',
          'Список элементов задачи не может быть пустым',
          'Задача содержит повторяющиеся идентификаторы чатов',
          'Тип задачи не поддерживается',
          'Нет разрешения на запись в эту задачу экспорта',
          'Часть ZIP с таким номером уже существует',
          'Задача экспорта для этой учётной записи не найдена',
          'Отмените или завершите задачу перед очисткой сохранённых частей ZIP',
          'Не удалось очистить ZIP',
          'Сохранённая часть ZIP не найдена',
          'Нет разрешения на загрузку части ZIP',
          'Не удалось прочитать задачу экспорта',
          'Неудачные элементы:⏎{items}',
          'и загрузка началась',
          '{1} · частей ZIP: {2}',
          'Экспорт: {1}'
        ],
        ja: [
          '一括エクスポートに失敗しました',
          '選択した記録はローカルのみのため、クラウド上の操作はできません',
          '失敗した項目',
          'ローカルタスク',
          '再開待ち',
          '更新に失敗しました',
          '完全に削除',
          '保存済み ZIP 分割ファイルが見つかりません',
          'エクスポート失敗.txt',
          '拡張機能のバックグラウンド操作に失敗しました',
          '先に拡張機能を有効にしてください',
          '無効なタスク操作です',
          'このアカウントのタスクが見つかりません',
          'このタスクに保存済み ZIP 分割ファイルはありません',
          '一括リクエストは共通の待機状態に入りました',
          '一括タスクの項目処理に失敗しました',
          'タスクの状態を更新しました',
          'タスク項目を空にすることはできません',
          'タスクに重複した会話 ID が含まれています',
          'サポートされていないタスク形式です',
          'このエクスポートタスクへの書き込み権限がありません',
          '同じ番号の ZIP 分割ファイルが既に存在します',
          'このアカウントのエクスポートタスクが見つかりません',
          '保存済み ZIP 分割ファイルを消去する前に、タスクをキャンセルするか完了してください',
          'ZIP のクリーンアップに失敗しました',
          '保存済み ZIP 分割ファイルが見つかりません',
          'ZIP 分割ファイルをアップロードする権限がありません',
          'エクスポートタスクを読み取れません',
          '失敗した項目：⏎{items}',
          'ダウンロードも開始しました',
          '{1} · ZIP 分割ファイル {2} 個',
          '{1} をエクスポート中'
        ]
      }
    },
    {
      // Local cache and index-integrity errors. Keep technical terms such as
      // JSON and ID recognizable while making the recovery action explicit.
      keys: [
        'ui.fullTextSearchFailed',
        'ui.chatgptConversation',
        'ui.invalidConversationOperation',
        'ui.cannotReadIndexStatus',
        'ui.cannotClearLegacyIndex',
        'ui.oldDatabaseConnectionStillActiveReopenChatGPTTab',
        'ui.anExplicitAccountIDIsRequiredLegacyIndex',
        'ui.conversationIDMissing',
        'ui.conversationJSONIncompleteNotCached',
        'ui.originalJSONDoesNotMatchRequestedConversationID',
        'ui.directoryMustBeAnArray',
        'ui.indexVersionDoesNotMatchFullJSONRebuild',
        'ui.cannotClearCurrentAccountIndex',
        'ui.searchIndexDoesNotMatchOriginalConversation',
        'ui.newerFullJSONExistsRefusingToOverwriteWith',
        'ui.autoIndexSettingMustBeABoolean',
        'ui.unknownCleanupType',
        'ui.activeOrPendingTasksExistPauseOrCancel',
        'ui.failedToClearLocalData',
        'ui.initialDirectorySnapshotMustBeAnArray',
        'ui.initialDirectorySnapshotContainsDuplicateIDs',
        'ui.initialIndexingNotAuthorized',
        'ui.verifiedInitialDirectoryScanIncomplete',
        'ui.verifiedCompleteDirectorySnapshotMissing',
        'ui.initialIndexingTaskStillRunningOrPaused',
        'ui.automaticIndexingNotEnabledForThisAccount'
      ],
      translations: {
        'zh-TW': [
          '全文搜尋失敗',
          'ChatGPT 對話',
          '無效的對話操作',
          '無法讀取索引狀態',
          '無法清除舊索引',
          '舊版資料庫連線仍在使用中，請重新開啟 ChatGPT 分頁',
          '必須提供明確的帳號 ID；舊索引無法自動歸屬至目前帳號',
          '缺少對話 ID',
          '對話 JSON 不完整，未寫入快取',
          '原始 JSON 與要求的對話 ID 不一致',
          '目錄必須是陣列',
          '全文索引版本與完整 JSON 不一致，請重新建立索引',
          '無法清除目前帳號的索引',
          '搜尋索引與原始對話不一致',
          '已有較新的完整 JSON，拒絕以舊資料覆寫',
          '自動索引設定必須是布林值',
          '未知的清理類型',
          '目前帳號仍有執行中或待執行的工作，請先暫停或取消後再清理',
          '清除本機資料失敗',
          '首次完整目錄快照必須是陣列',
          '首次完整目錄快照包含重複 ID',
          '尚未授權首次完整索引',
          '尚未完成可驗證的首次完整目錄掃描',
          '缺少已驗證的完整目錄快照',
          '首次索引工作仍在執行或已暫停',
          '此帳號尚未啟用自動全文索引'
        ],
        es: [
          'Error en la búsqueda de texto completo',
          'Conversación de ChatGPT',
          'Operación de conversación no válida',
          'No se pudo leer el estado del índice',
          'No se pudo borrar el índice antiguo',
          'La conexión con la base de datos anterior sigue activa. Vuelve a abrir la pestaña de ChatGPT.',
          'Se requiere un ID de cuenta explícito; las entradas del índice antiguo no se pueden asignar automáticamente a la cuenta actual.',
          'Falta el ID de la conversación',
          'El JSON de la conversación está incompleto y no se guardó en caché',
          'El JSON original no coincide con el ID de conversación solicitado',
          'El directorio debe ser una matriz',
          'La versión del índice de texto completo no coincide con el JSON completo. Reconstruye el índice.',
          'No se pudo borrar el índice de la cuenta actual',
          'El índice de búsqueda no coincide con la conversación original',
          'Existe un JSON completo más reciente. Se rechazó sobrescribirlo con datos antiguos.',
          'La configuración de indexación automática debe ser un valor booleano',
          'Tipo de limpieza desconocido',
          'Esta cuenta tiene tareas en curso o pendientes. Páusalas o cancélalas antes de limpiar los datos.',
          'No se pudieron borrar los datos locales',
          'La instantánea inicial del directorio completo debe ser una matriz',
          'La instantánea inicial del directorio completo contiene ID duplicados',
          'La indexación completa inicial no está autorizada',
          'El primer recorrido verificable del directorio completo está incompleto',
          'Falta la instantánea verificada del directorio completo',
          'La tarea de indexación inicial sigue en curso o está pausada',
          'La indexación automática de texto completo no está activada para esta cuenta'
        ],
        hi: [
          'पूर्ण-पाठ खोज विफल रही',
          'ChatGPT बातचीत',
          'बातचीत पर अमान्य कार्रवाई',
          'इंडेक्स की स्थिति पढ़ी नहीं जा सकी',
          'पुराना इंडेक्स साफ़ नहीं किया जा सका',
          'पुराने डेटाबेस का कनेक्शन अभी सक्रिय है। ChatGPT टैब फिर से खोलें।',
          'खाते की स्पष्ट ID आवश्यक है; पुराने इंडेक्स की प्रविष्टियाँ अपने-आप वर्तमान खाते से नहीं जोड़ी जा सकतीं।',
          'बातचीत की ID मौजूद नहीं है',
          'बातचीत का JSON अधूरा है; इसे कैश में नहीं रखा गया',
          'मूल JSON अनुरोधित बातचीत ID से मेल नहीं खाता',
          'डायरेक्टरी एक array होनी चाहिए',
          'पूर्ण-पाठ इंडेक्स का संस्करण पूरे JSON से मेल नहीं खाता। इंडेक्स फिर से बनाएँ।',
          'वर्तमान खाते का इंडेक्स साफ़ नहीं किया जा सका',
          'खोज इंडेक्स मूल बातचीत से मेल नहीं खाता',
          'नया पूर्ण JSON उपलब्ध है। पुराने डेटा से उसे ओवरराइट नहीं किया गया।',
          'स्वचालित इंडेक्सिंग की सेटिंग boolean होनी चाहिए',
          'अज्ञात सफ़ाई प्रकार',
          'इस खाते में कुछ कार्य चल रहे हैं या लंबित हैं। डेटा साफ़ करने से पहले उन्हें रोकें या रद्द करें।',
          'स्थानीय डेटा साफ़ नहीं किया जा सका',
          'पहली पूरी डायरेक्टरी स्नैपशॉट एक array होनी चाहिए',
          'पहली पूरी डायरेक्टरी स्नैपशॉट में दोहराई गई ID हैं',
          'पहली पूर्ण इंडेक्सिंग की अनुमति नहीं दी गई है',
          'पहली सत्यापन योग्य पूरी डायरेक्टरी स्कैन अधूरी है',
          'सत्यापित पूर्ण डायरेक्टरी स्नैपशॉट मौजूद नहीं है',
          'पहली इंडेक्सिंग का कार्य अभी चल रहा है या रुका हुआ है',
          'इस खाते के लिए स्वचालित पूर्ण-पाठ इंडेक्सिंग चालू नहीं है'
        ],
        ar: [
          'فشل البحث في النص الكامل',
          'محادثة ChatGPT',
          'عملية محادثة غير صالحة',
          'تعذرت قراءة حالة الفهرس',
          'تعذر مسح الفهرس القديم',
          'لا يزال اتصال قاعدة البيانات القديمة نشطًا. أعد فتح علامة تبويب ChatGPT.',
          'يلزم تحديد معرّف الحساب صراحةً؛ لا يمكن إسناد إدخالات الفهرس القديم إلى الحساب الحالي تلقائيًا.',
          'معرّف المحادثة مفقود',
          'بيانات JSON للمحادثة غير مكتملة ولم تُحفظ في ذاكرة التخزين المؤقت',
          'لا تتطابق بيانات JSON الأصلية مع معرّف المحادثة المطلوب',
          'يجب أن يكون الدليل مصفوفة',
          'إصدار فهرس النص الكامل لا يتطابق مع ملف JSON الكامل. أعد إنشاء الفهرس.',
          'تعذر مسح فهرس الحساب الحالي',
          'فهرس البحث لا يتطابق مع المحادثة الأصلية',
          'توجد نسخة JSON كاملة أحدث؛ رُفض استبدالها ببيانات أقدم.',
          'يجب أن يكون إعداد الفهرسة التلقائية قيمة منطقية',
          'نوع تنظيف غير معروف',
          'توجد مهام قيد التشغيل أو معلقة لهذا الحساب. أوقفها مؤقتًا أو ألغها قبل تنظيف البيانات.',
          'فشل مسح البيانات المحلية',
          'يجب أن تكون اللقطة الأولية للدليل الكامل مصفوفة',
          'تحتوي اللقطة الأولية للدليل الكامل على معرّفات مكررة',
          'لم يُصرح بالفهرسة الكاملة الأولية',
          'لم يكتمل الفحص الأول القابل للتحقق للدليل الكامل',
          'لقطة الدليل الكامل التي تم التحقق منها مفقودة',
          'لا تزال مهمة الفهرسة الأولية قيد التشغيل أو متوقفة مؤقتًا',
          'الفهرسة التلقائية للنص الكامل غير مفعلة لهذا الحساب'
        ],
        'pt-BR': [
          'Falha na pesquisa de texto completo',
          'Conversa do ChatGPT',
          'Operação de conversa inválida',
          'Não foi possível ler o status do índice',
          'Não foi possível limpar o índice antigo',
          'A conexão com o banco de dados antigo ainda está ativa. Abra novamente a aba do ChatGPT.',
          'É necessário informar explicitamente o ID da conta; entradas do índice antigo não podem ser atribuídas automaticamente à conta atual.',
          'O ID da conversa está ausente',
          'O JSON da conversa está incompleto e não foi armazenado em cache',
          'O JSON original não corresponde ao ID de conversa solicitado',
          'O diretório precisa ser um array',
          'A versão do índice de texto completo não corresponde ao JSON completo. Reconstrua o índice.',
          'Não foi possível limpar o índice da conta atual',
          'O índice de pesquisa não corresponde à conversa original',
          'Já existe um JSON completo mais recente. A substituição por dados antigos foi recusada.',
          'A configuração de indexação automática precisa ser um valor booleano',
          'Tipo de limpeza desconhecido',
          'Há tarefas em andamento ou pendentes nesta conta. Pause-as ou cancele-as antes de limpar os dados.',
          'Falha ao limpar os dados locais',
          'O snapshot inicial do diretório completo precisa ser um array',
          'O snapshot inicial do diretório completo contém IDs duplicados',
          'A indexação completa inicial não foi autorizada',
          'A primeira varredura verificável do diretório completo está incompleta',
          'O snapshot verificado do diretório completo não foi encontrado',
          'A tarefa de indexação inicial ainda está em andamento ou pausada',
          'A indexação automática de texto completo não está ativada para esta conta'
        ],
        bn: [
          'সম্পূর্ণ-টেক্সট অনুসন্ধান ব্যর্থ হয়েছে',
          'ChatGPT কথোপকথন',
          'কথোপকথনের অপারেশনটি বৈধ নয়',
          'ইনডেক্সের অবস্থা পড়া যায়নি',
          'পুরোনো ইনডেক্স পরিষ্কার করা যায়নি',
          'পুরোনো ডেটাবেসের সংযোগ এখনও সক্রিয়। ChatGPT ট্যাবটি আবার খুলুন।',
          'অ্যাকাউন্টের নির্দিষ্ট ID দিতে হবে; পুরোনো ইনডেক্সের তথ্য স্বয়ংক্রিয়ভাবে বর্তমান অ্যাকাউন্টে যুক্ত করা যাবে না।',
          'কথোপকথনের ID নেই',
          'কথোপকথনের JSON অসম্পূর্ণ, তাই ক্যাশে রাখা হয়নি',
          'মূল JSON অনুরোধ করা কথোপকথনের ID-এর সঙ্গে মেলে না',
          'ডিরেক্টরি অবশ্যই একটি array হতে হবে',
          'সম্পূর্ণ-টেক্সট ইনডেক্সের সংস্করণ সম্পূর্ণ JSON-এর সঙ্গে মেলে না। ইনডেক্সটি আবার তৈরি করুন।',
          'বর্তমান অ্যাকাউন্টের ইনডেক্স পরিষ্কার করা যায়নি',
          'অনুসন্ধান ইনডেক্স মূল কথোপকথনের সঙ্গে মেলে না',
          'আরও নতুন সম্পূর্ণ JSON রয়েছে। পুরোনো তথ্য দিয়ে সেটি প্রতিস্থাপন করা হয়নি।',
          'স্বয়ংক্রিয় ইনডেক্সিং সেটিংটি boolean হতে হবে',
          'অজানা পরিষ্কারের ধরন',
          'এই অ্যাকাউন্টে কাজ চলছে বা অপেক্ষমাণ আছে। ডেটা পরিষ্কার করার আগে কাজগুলো থামান বা বাতিল করুন।',
          'স্থানীয় ডেটা পরিষ্কার করা যায়নি',
          'প্রথম সম্পূর্ণ ডিরেক্টরি snapshot অবশ্যই একটি array হতে হবে',
          'প্রথম সম্পূর্ণ ডিরেক্টরি snapshot-এ একই ID একাধিকবার রয়েছে',
          'প্রথম সম্পূর্ণ ইনডেক্স তৈরির অনুমতি নেই',
          'যাচাইযোগ্য প্রথম সম্পূর্ণ ডিরেক্টরি স্ক্যান শেষ হয়নি',
          'যাচাইকৃত সম্পূর্ণ ডিরেক্টরি snapshot নেই',
          'প্রথম ইনডেক্স তৈরির কাজ এখনও চলছে অথবা বিরতিতে আছে',
          'এই অ্যাকাউন্টে স্বয়ংক্রিয় সম্পূর্ণ-টেক্সট ইনডেক্সিং চালু নেই'
        ],
        id: [
          'Pencarian teks lengkap gagal',
          'Percakapan ChatGPT',
          'Operasi percakapan tidak valid',
          'Status indeks tidak dapat dibaca',
          'Indeks lama tidak dapat dibersihkan',
          'Koneksi basis data lama masih aktif. Buka kembali tab ChatGPT.',
          'ID akun harus ditentukan secara eksplisit; entri indeks lama tidak dapat otomatis dikaitkan ke akun saat ini.',
          'ID percakapan tidak ada',
          'JSON percakapan tidak lengkap dan tidak disimpan dalam cache',
          'JSON asli tidak cocok dengan ID percakapan yang diminta',
          'Direktori harus berupa array',
          'Versi indeks teks lengkap tidak cocok dengan JSON lengkap. Bangun ulang indeks.',
          'Indeks akun saat ini tidak dapat dibersihkan',
          'Indeks pencarian tidak cocok dengan percakapan asli',
          'JSON lengkap yang lebih baru sudah tersedia. Data lama tidak digunakan untuk menimpanya.',
          'Pengaturan pengindeksan otomatis harus berupa boolean',
          'Jenis pembersihan tidak dikenal',
          'Ada tugas yang sedang berjalan atau menunggu pada akun ini. Jeda atau batalkan tugas sebelum membersihkan data.',
          'Gagal membersihkan data lokal',
          'Snapshot direktori lengkap awal harus berupa array',
          'Snapshot direktori lengkap awal berisi ID duplikat',
          'Pengindeksan lengkap awal belum diizinkan',
          'Pemindaian direktori lengkap awal yang dapat diverifikasi belum selesai',
          'Snapshot direktori lengkap yang telah diverifikasi tidak ditemukan',
          'Tugas pengindeksan awal masih berjalan atau dijeda',
          'Pengindeksan teks lengkap otomatis belum diaktifkan untuk akun ini'
        ],
        fr: [
          'Échec de la recherche en texte intégral',
          'Conversation ChatGPT',
          'Opération de conversation invalide',
          'Impossible de lire l’état de l’index',
          'Impossible d’effacer l’ancien index',
          'La connexion à l’ancienne base de données est toujours active. Rouvrez l’onglet ChatGPT.',
          'Un identifiant de compte explicite est requis ; les entrées de l’ancien index ne peuvent pas être attribuées automatiquement au compte actuel.',
          'Identifiant de conversation manquant',
          'Le JSON de la conversation est incomplet et n’a pas été mis en cache',
          'Le JSON d’origine ne correspond pas à l’identifiant de conversation demandé',
          'Le répertoire doit être un tableau',
          'La version de l’index en texte intégral ne correspond pas au JSON complet. Reconstruisez l’index.',
          'Impossible d’effacer l’index du compte actuel',
          'L’index de recherche ne correspond pas à la conversation d’origine',
          'Un JSON complet plus récent existe. Le remplacement par des données plus anciennes a été refusé.',
          'Le paramètre d’indexation automatique doit être une valeur booléenne',
          'Type de nettoyage inconnu',
          'Des tâches sont en cours ou en attente pour ce compte. Mettez-les en pause ou annulez-les avant le nettoyage.',
          'Échec de l’effacement des données locales',
          'L’instantané initial du répertoire complet doit être un tableau',
          'L’instantané initial du répertoire complet contient des identifiants en double',
          'La première indexation complète n’est pas autorisée',
          'Le premier parcours vérifiable du répertoire complet est incomplet',
          'L’instantané vérifié du répertoire complet est manquant',
          'La tâche d’indexation initiale est toujours en cours ou en pause',
          'L’indexation automatique en texte intégral n’est pas activée pour ce compte'
        ],
        ru: [
          'Ошибка полнотекстового поиска',
          'Разговор ChatGPT',
          'Недопустимая операция с разговором',
          'Не удалось прочитать состояние индекса',
          'Не удалось очистить старый индекс',
          'Соединение со старой базой данных всё ещё активно. Повторно откройте вкладку ChatGPT.',
          'Необходимо явно указать ID учётной записи; записи старого индекса нельзя автоматически привязать к текущей учётной записи.',
          'Отсутствует ID разговора',
          'JSON разговора неполный и не был сохранён в кэше',
          'Исходный JSON не соответствует запрошенному ID разговора',
          'Каталог должен быть массивом',
          'Версия полнотекстового индекса не соответствует полному JSON. Перестройте индекс.',
          'Не удалось очистить индекс текущей учётной записи',
          'Поисковый индекс не соответствует исходному разговору',
          'Доступен более новый полный JSON. Перезапись старыми данными отклонена.',
          'Параметр автоматической индексации должен иметь логический тип',
          'Неизвестный тип очистки',
          'Для этой учётной записи есть выполняющиеся или ожидающие задачи. Приостановите или отмените их перед очисткой.',
          'Не удалось очистить локальные данные',
          'Первичный снимок полного каталога должен быть массивом',
          'В первичном снимке полного каталога есть повторяющиеся ID',
          'Первичная полная индексация не разрешена',
          'Первое проверяемое сканирование полного каталога не завершено',
          'Отсутствует проверенный снимок полного каталога',
          'Задача первичной индексации всё ещё выполняется или приостановлена',
          'Автоматическая полнотекстовая индексация для этой учётной записи не включена'
        ],
        ja: [
          '全文検索に失敗しました',
          'ChatGPT の会話',
          '無効な会話操作です',
          'インデックスの状態を読み取れませんでした',
          '旧インデックスを消去できませんでした',
          '旧データベースへの接続がまだ有効です。ChatGPT のタブを開き直してください。',
          'アカウント ID を明示する必要があります。旧インデックスの項目を現在のアカウントに自動で割り当てることはできません。',
          '会話 ID がありません',
          '会話の JSON が不完全なため、キャッシュに保存されませんでした',
          '元の JSON が指定された会話 ID と一致しません',
          'ディレクトリは配列である必要があります',
          '全文インデックスのバージョンが完全な JSON と一致しません。インデックスを再構築してください。',
          '現在のアカウントのインデックスを消去できませんでした',
          '検索インデックスが元の会話と一致しません',
          'より新しい完全な JSON が存在するため、古いデータによる上書きを拒否しました。',
          '自動インデックス設定は真偽値である必要があります',
          '不明なクリーンアップの種類です',
          'このアカウントには実行中または保留中のタスクがあります。データを消去する前に一時停止するかキャンセルしてください。',
          'ローカルデータの消去に失敗しました',
          '初回の完全なディレクトリスナップショットは配列である必要があります',
          '初回の完全なディレクトリスナップショットに重複した ID があります',
          '初回の完全インデックス作成は許可されていません',
          '検証可能な初回の全件ディレクトリスキャンが完了していません',
          '検証済みの完全なディレクトリスナップショットがありません',
          '初回のインデックス作成タスクはまだ実行中か、一時停止中です',
          'このアカウントでは全文自動インデックス作成が有効になっていません'
        ]
      }
    },
    {
      // Dynamic index, directory and task statuses. Numbered placeholders
      // follow the runtime capture groups in scripts/i18n.js.
      keys: [
        'status.repeatedPaginationCursorForProject',
        'status.emptyPageButMoreCursorResultsFor',
        'status.chatgptOperationFailedHTTP',
        'status.unableToReadCompleteLocalContent',
        'status.failedToPrepareInitialIndex',
        'status.group',
        'status.chats',
        'status.accountChats',
        'status.requestSubmitted',
        'status.taskUnavailable',
        'status.removedEntriesFromThisAccountOtherData',
        'status.indexingRequestedKeepChatGPTOpenAndCheck',
        'status.completedChats',
        'status.backgroundSyncComplete',
        'status.syncFailedLocalDataRetained'
      ],
      translations: {
        'zh-TW': [
          '{1} · 專案分頁游標重複',
          '{1} · 專案分頁為空，但游標仍有後續結果',
          'ChatGPT 操作失敗：HTTP {1}',
          '無法讀取本機完整內容：{1}',
          '首次索引準備失敗：{1}',
          '{1} / {2} · 第 {3} / {4} 組',
          '{1} · {2} 則聊天',
          '此帳號有 {1} 則聊天',
          '{1} 操作已提交',
          '工作無法使用：{1}',
          '已從此帳號移除 {1} 筆資料（{2}）；其他資料未變更',
          '已要求開始索引；請保持 ChatGPT 分頁開啟，稍後重新整理進度',
          '已完成 · {1} 則聊天',
          '{1} · 背景增量同步已完成',
          '同步失敗；本機資料已保留：{1}'
        ],
        es: [
          'Se repitió el cursor de paginación del proyecto {1}',
          'La página del proyecto {1} está vacía, pero el cursor indica que hay más resultados',
          'Falló una operación de ChatGPT: HTTP {1}',
          'No se pudo leer el contenido local completo: {1}',
          'No se pudo preparar la indexación inicial: {1}',
          '{1} / {2} · grupo {3} / {4}',
          '{1} · {2} conversaciones',
          '{1} conversaciones en esta cuenta',
          'Solicitud de {1} enviada',
          'Tarea no disponible: {1}',
          'Se eliminaron {1} entradas de esta cuenta ({2}); los demás datos no cambiaron',
          'Se solicitó la indexación; mantén abierta la pestaña de ChatGPT y actualiza el progreso más tarde',
          'Completado · {1} conversaciones',
          '{1} · Sincronización incremental en segundo plano completada',
          'Falló la sincronización; se conservaron los datos locales: {1}'
        ],
        hi: [
          'प्रोजेक्ट {1} का पेजिनेशन कर्सर दोहराया गया',
          'प्रोजेक्ट {1} का पेज खाली है, लेकिन कर्सर में आगे के परिणाम मौजूद हैं',
          'ChatGPT कार्रवाई विफल: HTTP {1}',
          'स्थानीय पूरा कंटेंट पढ़ा नहीं जा सका: {1}',
          'पहली इंडेक्सिंग की तैयारी विफल रही: {1}',
          '{1} / {2} · समूह {3} / {4}',
          '{1} · {2} चैट',
          'इस खाते में {1} चैट',
          '{1} का अनुरोध भेज दिया गया',
          'कार्य उपलब्ध नहीं है: {1}',
          'इस खाते से {1} प्रविष्टियाँ हटाई गईं ({2}); अन्य डेटा अपरिवर्तित है',
          'इंडेक्सिंग का अनुरोध किया गया है; ChatGPT टैब खुला रखें और थोड़ी देर बाद प्रगति रीफ़्रेश करें',
          'पूरा हुआ · {1} चैट',
          '{1} · बैकग्राउंड में बदलावों का सिंक पूरा हुआ',
          'सिंक विफल रहा; स्थानीय डेटा सुरक्षित रखा गया: {1}'
        ],
        ar: [
          'تكرر مؤشر ترقيم صفحات المشروع {1}',
          'صفحة المشروع {1} فارغة، لكن المؤشر يشير إلى وجود نتائج أخرى',
          'فشلت عملية ChatGPT: HTTP {1}',
          'تعذرت قراءة المحتوى المحلي الكامل: {1}',
          'فشل الإعداد للفهرسة الأولية: {1}',
          '{1} / {2} · المجموعة {3} / {4}',
          '{1} · {2} من المحادثات',
          '{1} محادثة في هذا الحساب',
          'تم إرسال طلب {1}',
          'المهمة غير متاحة: {1}',
          'أُزيلت {1} من الإدخالات من هذا الحساب ({2})؛ ولم تتغير البيانات الأخرى',
          'طُلب بدء الفهرسة؛ أبقِ علامة تبويب ChatGPT مفتوحة وحدّث التقدم لاحقًا',
          'اكتمل · {1} من المحادثات',
          '{1} · اكتملت المزامنة التزايدية في الخلفية',
          'فشلت المزامنة؛ تم الاحتفاظ بالبيانات المحلية: {1}'
        ],
        'pt-BR': [
          'O cursor de paginação do projeto {1} se repetiu',
          'A página do projeto {1} está vazia, mas o cursor indica que há mais resultados',
          'Falha em uma operação do ChatGPT: HTTP {1}',
          'Não foi possível ler o conteúdo local completo: {1}',
          'Falha ao preparar a indexação inicial: {1}',
          '{1} / {2} · grupo {3} / {4}',
          '{1} · {2} conversas',
          '{1} conversas nesta conta',
          'Solicitação de {1} enviada',
          'Tarefa indisponível: {1}',
          '{1} registros removidos desta conta ({2}); os demais dados não foram alterados',
          'A indexação foi solicitada; mantenha a aba do ChatGPT aberta e atualize o progresso mais tarde',
          'Concluído · {1} conversas',
          '{1} · Sincronização incremental em segundo plano concluída',
          'Falha na sincronização; os dados locais foram mantidos: {1}'
        ],
        bn: [
          'প্রজেক্ট {1}-এর পৃষ্ঠা-নির্দেশক কার্সর পুনরাবৃত্ত হয়েছে',
          'প্রজেক্ট {1}-এর পৃষ্ঠা ফাঁকা, তবে কার্সরে আরও ফলাফল রয়েছে',
          'ChatGPT-এর কাজ ব্যর্থ হয়েছে: HTTP {1}',
          'স্থানীয় সম্পূর্ণ বিষয়বস্তু পড়া যায়নি: {1}',
          'প্রথম ইনডেক্স তৈরির প্রস্তুতি ব্যর্থ হয়েছে: {1}',
          '{1} / {2} · গ্রুপ {3} / {4}',
          '{1} · {2}টি চ্যাট',
          'এই অ্যাকাউন্টে {1}টি চ্যাট',
          '{1}-এর অনুরোধ জমা হয়েছে',
          'কাজটি উপলভ্য নয়: {1}',
          'এই অ্যাকাউন্ট থেকে {1}টি এন্ট্রি সরানো হয়েছে ({2}); অন্য তথ্য অপরিবর্তিত আছে',
          'ইনডেক্স তৈরির অনুরোধ করা হয়েছে; ChatGPT ট্যাব খোলা রাখুন এবং পরে অগ্রগতি রিফ্রেশ করুন',
          'সম্পন্ন · {1}টি চ্যাট',
          '{1} · ব্যাকগ্রাউন্ডে পরিবর্তিত তথ্যের সিঙ্ক সম্পন্ন',
          'সিঙ্ক ব্যর্থ হয়েছে; স্থানীয় তথ্য রাখা হয়েছে: {1}'
        ],
        id: [
          'Kursor paginasi proyek {1} terulang',
          'Halaman proyek {1} kosong, tetapi kursor masih menunjukkan hasil berikutnya',
          'Operasi ChatGPT gagal: HTTP {1}',
          'Konten lokal lengkap tidak dapat dibaca: {1}',
          'Persiapan pengindeksan awal gagal: {1}',
          '{1} / {2} · grup {3} / {4}',
          '{1} · {2} percakapan',
          '{1} percakapan di akun ini',
          'Permintaan {1} dikirim',
          'Tugas tidak tersedia: {1}',
          '{1} entri dihapus dari akun ini ({2}); data lainnya tidak berubah',
          'Permintaan pengindeksan telah diajukan; biarkan tab ChatGPT tetap terbuka dan perbarui progres nanti',
          'Selesai · {1} percakapan',
          '{1} · Sinkronisasi inkremental latar belakang selesai',
          'Sinkronisasi gagal; data lokal tetap disimpan: {1}'
        ],
        fr: [
          'Le curseur de pagination du projet {1} s’est répété',
          'La page du projet {1} est vide, mais le curseur indique d’autres résultats',
          'Échec d’une opération ChatGPT : HTTP {1}',
          'Impossible de lire le contenu local complet : {1}',
          'Échec de la préparation de l’indexation initiale : {1}',
          '{1} / {2} · groupe {3} / {4}',
          '{1} · {2} conversations',
          '{1} conversations dans ce compte',
          'Demande {1} envoyée',
          'Tâche indisponible : {1}',
          '{1} entrées supprimées de ce compte ({2}) ; les autres données sont inchangées',
          'L’indexation a été demandée ; gardez l’onglet ChatGPT ouvert et actualisez la progression plus tard',
          'Terminé · {1} conversations',
          '{1} · Synchronisation incrémentale en arrière-plan terminée',
          'Échec de la synchronisation ; les données locales sont conservées : {1}'
        ],
        ru: [
          'Курсор страниц проекта {1} повторился',
          'Страница проекта {1} пуста, но курсор указывает на следующие результаты',
          'Ошибка операции ChatGPT: HTTP {1}',
          'Не удалось прочитать полное локальное содержимое: {1}',
          'Не удалось подготовить первичную индексацию: {1}',
          '{1} / {2} · группа {3} / {4}',
          '{1} · чатов: {2}',
          'Чатов в этой учётной записи: {1}',
          'Запрос «{1}» отправлен',
          'Задача недоступна: {1}',
          'Из этой учётной записи удалено записей: {1} ({2}); остальные данные не изменены',
          'Запрошена индексация; оставьте вкладку ChatGPT открытой и обновите сведения о ходе позже',
          'Завершено · чатов: {1}',
          '{1} · Фоновая инкрементальная синхронизация завершена',
          'Ошибка синхронизации; локальные данные сохранены: {1}'
        ],
        ja: [
          'プロジェクト {1} のページ送りカーソルが重複しました',
          'プロジェクト {1} のページは空ですが、カーソルには続きの結果があります',
          'ChatGPT の操作に失敗しました：HTTP {1}',
          'ローカルの完全な内容を読み取れませんでした：{1}',
          '初回インデックス作成の準備に失敗しました：{1}',
          '{1} / {2} · グループ {3} / {4}',
          '{1} · チャット {2} 件',
          'このアカウントのチャット {1} 件',
          '{1} のリクエストを送信しました',
          'タスクを利用できません：{1}',
          'このアカウントから {1} 件のデータ（{2}）を削除しました。ほかのデータは変更されていません',
          'インデックス作成をリクエストしました。ChatGPT のタブを開いたままにして、後で進捗を更新してください',
          '完了 · チャット {1} 件',
          '{1} · バックグラウンドの差分同期が完了しました',
          '同期に失敗しました。ローカルデータは保持されています：{1}'
        ]
      }
    },
    {
      // Bulk archive and permanent-delete progress, completion and failure states.
      keys: [
        'status.archivingSucceededFailed',
        'status.deletingSucceededFailed',
        'status.archivingSucceededFailed_65',
        'status.deletingSucceededFailed_65',
        'status.archiveCompletedSucceededFailed',
        'status.archiveCompletedSucceededFailedClickForFailures',
        'status.deletePermanentlyCompletedSucceededFailed',
        'status.deletePermanentlyCompletedSucceededFailedClickFor',
        'status.stopped',
        'status.status_68'
      ],
      translations: {
        'zh-TW': [
          '正在封存 {1}/{2} · 成功 {3}，失敗 {4}',
          '正在永久刪除 {1}/{2} · 成功 {3}，失敗 {4}',
          '正在封存 {2}/{3} · 成功 {4}，失敗 {5}',
          '正在永久刪除 {2}/{3} · 成功 {4}，失敗 {5}',
          '封存完成：成功 {2}，失敗 {3}',
          '封存完成：成功 {2}，失敗 {3}（點擊查看失敗項目）',
          '永久刪除完成：成功 {2}，失敗 {3}',
          '永久刪除完成：成功 {2}，失敗 {3}（點擊查看失敗項目）',
          '{1} 已中止：{2}',
          '{1}/{2} · {3}：{4}'
        ],
        es: [
          'Archivando {1}/{2} · {3} correctos, {4} fallidos',
          'Eliminando permanentemente {1}/{2} · {3} correctos, {4} fallidos',
          'Archivando {2}/{3} · {4} correctos, {5} fallidos',
          'Eliminando permanentemente {2}/{3} · {4} correctos, {5} fallidos',
          'Archivado completado: {2} correctos, {3} fallidos',
          'Archivado completado: {2} correctos, {3} fallidos (haz clic para ver los errores)',
          'Eliminación permanente completada: {2} correctos, {3} fallidos',
          'Eliminación permanente completada: {2} correctos, {3} fallidos (haz clic para ver los errores)',
          '{1} se detuvo: {2}',
          '{1}/{2} · {3}: {4}'
        ],
        hi: [
          'आर्काइव हो रहा है {1}/{2} · {3} सफल, {4} विफल',
          'स्थायी रूप से मिटाया जा रहा है {1}/{2} · {3} सफल, {4} विफल',
          'आर्काइव हो रहा है {2}/{3} · {4} सफल, {5} विफल',
          'स्थायी रूप से मिटाया जा रहा है {2}/{3} · {4} सफल, {5} विफल',
          'आर्काइव पूरा हुआ: {2} सफल, {3} विफल',
          'आर्काइव पूरा हुआ: {2} सफल, {3} विफल (विफल आइटम देखने के लिए क्लिक करें)',
          'स्थायी रूप से मिटाना पूरा हुआ: {2} सफल, {3} विफल',
          'स्थायी रूप से मिटाना पूरा हुआ: {2} सफल, {3} विफल (विफल आइटम देखने के लिए क्लिक करें)',
          '{1} रोक दिया गया: {2}',
          '{1}/{2} · {3}: {4}'
        ],
        ar: [
          'جارٍ الأرشفة {1}/{2} · نجح {3}، وفشل {4}',
          'جارٍ الحذف النهائي {1}/{2} · نجح {3}، وفشل {4}',
          'جارٍ الأرشفة {2}/{3} · نجح {4}، وفشل {5}',
          'جارٍ الحذف النهائي {2}/{3} · نجح {4}، وفشل {5}',
          'اكتملت الأرشفة: نجح {2}، وفشل {3}',
          'اكتملت الأرشفة: نجح {2}، وفشل {3} (انقر لعرض العناصر الفاشلة)',
          'اكتمل الحذف النهائي: نجح {2}، وفشل {3}',
          'اكتمل الحذف النهائي: نجح {2}، وفشل {3} (انقر لعرض العناصر الفاشلة)',
          'تم إيقاف {1}: {2}',
          '{1}/{2} · {3}: {4}'
        ],
        'pt-BR': [
          'Arquivando {1}/{2} · {3} concluídos, {4} com falha',
          'Excluindo permanentemente {1}/{2} · {3} concluídos, {4} com falha',
          'Arquivando {2}/{3} · {4} concluídos, {5} com falha',
          'Excluindo permanentemente {2}/{3} · {4} concluídos, {5} com falha',
          'Arquivamento concluído: {2} concluídos, {3} com falha',
          'Arquivamento concluído: {2} concluídos, {3} com falha (clique para ver os itens com falha)',
          'Exclusão permanente concluída: {2} concluídos, {3} com falha',
          'Exclusão permanente concluída: {2} concluídos, {3} com falha (clique para ver os itens com falha)',
          '{1} interrompido: {2}',
          '{1}/{2} · {3}: {4}'
        ],
        bn: [
          'আর্কাইভ করা হচ্ছে {1}/{2} · সফল {3}, ব্যর্থ {4}',
          'স্থায়ীভাবে মুছে ফেলা হচ্ছে {1}/{2} · সফল {3}, ব্যর্থ {4}',
          'আর্কাইভ করা হচ্ছে {2}/{3} · সফল {4}, ব্যর্থ {5}',
          'স্থায়ীভাবে মুছে ফেলা হচ্ছে {2}/{3} · সফল {4}, ব্যর্থ {5}',
          'আর্কাইভ সম্পন্ন: সফল {2}, ব্যর্থ {3}',
          'আর্কাইভ সম্পন্ন: সফল {2}, ব্যর্থ {3} (ব্যর্থ আইটেম দেখতে ক্লিক করুন)',
          'স্থায়ীভাবে মুছে ফেলা সম্পন্ন: সফল {2}, ব্যর্থ {3}',
          'স্থায়ীভাবে মুছে ফেলা সম্পন্ন: সফল {2}, ব্যর্থ {3} (ব্যর্থ আইটেম দেখতে ক্লিক করুন)',
          '{1} থামানো হয়েছে: {2}',
          '{1}/{2} · {3}: {4}'
        ],
        id: [
          'Mengarsipkan {1}/{2} · {3} berhasil, {4} gagal',
          'Menghapus permanen {1}/{2} · {3} berhasil, {4} gagal',
          'Mengarsipkan {2}/{3} · {4} berhasil, {5} gagal',
          'Menghapus permanen {2}/{3} · {4} berhasil, {5} gagal',
          'Pengarsipan selesai: {2} berhasil, {3} gagal',
          'Pengarsipan selesai: {2} berhasil, {3} gagal (klik untuk melihat item yang gagal)',
          'Penghapusan permanen selesai: {2} berhasil, {3} gagal',
          'Penghapusan permanen selesai: {2} berhasil, {3} gagal (klik untuk melihat item yang gagal)',
          '{1} dihentikan: {2}',
          '{1}/{2} · {3}: {4}'
        ],
        fr: [
          'Archivage {1}/{2} · {3} réussis, {4} échecs',
          'Suppression définitive {1}/{2} · {3} réussis, {4} échecs',
          'Archivage {2}/{3} · {4} réussis, {5} échecs',
          'Suppression définitive {2}/{3} · {4} réussis, {5} échecs',
          'Archivage terminé : {2} réussis, {3} échecs',
          'Archivage terminé : {2} réussis, {3} échecs (cliquez pour afficher les échecs)',
          'Suppression définitive terminée : {2} réussis, {3} échecs',
          'Suppression définitive terminée : {2} réussis, {3} échecs (cliquez pour afficher les échecs)',
          '{1} interrompu : {2}',
          '{1}/{2} · {3} : {4}'
        ],
        ru: [
          'Архивация {1}/{2} · успешно: {3}, ошибок: {4}',
          'Безвозвратное удаление {1}/{2} · успешно: {3}, ошибок: {4}',
          'Архивация {2}/{3} · успешно: {4}, ошибок: {5}',
          'Безвозвратное удаление {2}/{3} · успешно: {4}, ошибок: {5}',
          'Архивация завершена: успешно {2}, ошибок {3}',
          'Архивация завершена: успешно {2}, ошибок {3} (нажмите, чтобы посмотреть ошибки)',
          'Безвозвратное удаление завершено: успешно {2}, ошибок {3}',
          'Безвозвратное удаление завершено: успешно {2}, ошибок {3} (нажмите, чтобы посмотреть ошибки)',
          '{1} остановлено: {2}',
          '{1}/{2} · {3}: {4}'
        ],
        ja: [
          'アーカイブ中 {1}/{2} · 成功 {3} 件、失敗 {4} 件',
          '完全削除中 {1}/{2} · 成功 {3} 件、失敗 {4} 件',
          'アーカイブ中 {2}/{3} · 成功 {4} 件、失敗 {5} 件',
          '完全削除中 {2}/{3} · 成功 {4} 件、失敗 {5} 件',
          'アーカイブ完了：成功 {2} 件、失敗 {3} 件',
          'アーカイブ完了：成功 {2} 件、失敗 {3} 件（クリックして失敗項目を表示）',
          '完全削除完了：成功 {2} 件、失敗 {3} 件',
          '完全削除完了：成功 {2} 件、失敗 {3} 件（クリックして失敗項目を表示）',
          '{1} を中止しました：{2}',
          '{1}/{2} · {3}：{4}'
        ]
      }
    },
    {
      // Small labels and task feedback used by the settings panel and status UI.
      keys: [
        'ui.timestampSize',
        'ui.small',
        'ui.medium',
        'ui.large',
        'ui.succeeded',
        'ui.taskNotFoundForCurrentAccount_3826111',
        'ui.invalidTaskOperation_d3e0539'
      ],
      translations: {
        'zh-TW': [
          '時間字級',
          '小',
          '中',
          '大',
          '成功',
          '找不到目前帳號的任務',
          '無效的任務操作'
        ],
        es: [
          'Tamaño de la marca de tiempo',
          'Pequeño',
          'Mediano',
          'Grande',
          'Correcto',
          'No se encontró la tarea de la cuenta actual',
          'Operación de tarea no válida'
        ],
        hi: [
          'टाइमस्टैम्प फ़ॉन्ट का आकार',
          'छोटा',
          'मध्यम',
          'बड़ा',
          'सफल',
          'वर्तमान खाते के लिए कार्य नहीं मिला',
          'कार्य की अमान्य कार्रवाई'
        ],
        ar: [
          'حجم خط الطابع الزمني',
          'صغير',
          'متوسط',
          'كبير',
          'نجح',
          'لم يتم العثور على مهمة للحساب الحالي',
          'عملية مهمة غير صالحة'
        ],
        'pt-BR': [
          'Tamanho da marca de tempo',
          'Pequeno',
          'Médio',
          'Grande',
          'Concluído com sucesso',
          'Tarefa não encontrada para a conta atual',
          'Operação de tarefa inválida'
        ],
        bn: [
          'টাইমস্ট্যাম্পের ফন্টের আকার',
          'ছোট',
          'মাঝারি',
          'বড়',
          'সফল',
          'বর্তমান অ্যাকাউন্টের জন্য কাজ পাওয়া যায়নি',
          'কাজের অপারেশনটি বৈধ নয়'
        ],
        id: [
          'Ukuran font stempel waktu',
          'Kecil',
          'Sedang',
          'Besar',
          'Berhasil',
          'Tugas tidak ditemukan untuk akun saat ini',
          'Operasi tugas tidak valid'
        ],
        fr: [
          'Taille de l’horodatage',
          'Petit',
          'Moyen',
          'Grand',
          'Réussi',
          'Tâche introuvable pour le compte actuel',
          'Opération de tâche invalide'
        ],
        ru: [
          'Размер шрифта временной метки',
          'Маленький',
          'Средний',
          'Большой',
          'Успешно',
          'Задача для текущей учётной записи не найдена',
          'Недопустимая операция с задачей'
        ],
        ja: [
          'タイムスタンプの文字サイズ',
          '小',
          '中',
          '大',
          '成功',
          '現在のアカウントのタスクが見つかりません',
          '無効なタスク操作です'
        ]
      }
    },
    {
      // Remaining dynamic status templates. Captured values may be counts,
      // labels, or diagnostics; preserve them unless they are known UI labels.
      keys: [
        'status.notAllowedToWrite',
        'status.authorizeToBuildAFullTextIndex',
        'status.select',
        'status.filterByTitle',
        'status.select_41',
        'status.chats_42',
        'status.chats_43',
        'status.status',
        'status.failedToOpenChatGPT',
        'status.inProgress',
        'status.failed',
        'status.failedToUpdateAutomaticIndexing',
        'status.indexStartFailed',
        'status.incrementalSyncComplete'
      ],
      translations: {
        'zh-TW': [
          '{1} · 無權寫入…',
          '首次建立全文索引需要授權；不會自動擷取聊天正文。現有索引仍可搜尋 · 已索引 {1} 筆',
          '選取 {1}',
          '依標題篩選：{1}',
          '已選取 {1}',
          '{1} 則聊天記錄',
          '{1} 則 · {2}',
          '{1}：{2}',
          '開啟 ChatGPT 失敗：{1}',
          '{1} 進行中…',
          '{1} 失敗：{2}',
          '更新自動索引設定失敗：{1}',
          '索引啟動失敗：{1}',
          '{1} · 增量同步已完成'
        ],
        es: [
          'No tienes permiso para escribir en {1}',
          'Autoriza la creación del índice de texto completo; los cuerpos de los chats no se descargan automáticamente. El índice existente sigue disponible para búsquedas · {1} indexados',
          'Seleccionar {1}',
          'Filtrar por título: {1}',
          'Seleccionados: {1}',
          '{1} conversaciones',
          '{1} conversaciones · {2}',
          '{1}: {2}',
          'No se pudo abrir ChatGPT: {1}',
          '{1} en curso…',
          'Error en {1}: {2}',
          'No se pudo actualizar la indexación automática: {1}',
          'No se pudo iniciar la indexación: {1}',
          '{1} · Sincronización incremental completada'
        ],
        hi: [
          '{1} में लिखने की अनुमति नहीं है',
          'पूर्ण-पाठ इंडेक्स बनाने की अनुमति दें; चैट का मुख्य पाठ अपने-आप डाउनलोड नहीं होगा। मौजूदा इंडेक्स खोजा जा सकता है · {1} इंडेक्स किए गए',
          '{1} चुनें',
          'शीर्षक के अनुसार फ़िल्टर करें: {1}',
          'चुने गए: {1}',
          '{1} चैट',
          '{1} चैट · {2}',
          '{1}: {2}',
          'ChatGPT खोलना विफल रहा: {1}',
          '{1} जारी है…',
          '{1} विफल: {2}',
          'स्वचालित इंडेक्सिंग सेटिंग अपडेट नहीं हो सकी: {1}',
          'इंडेक्सिंग शुरू नहीं हो सकी: {1}',
          '{1} · इंक्रीमेंटल सिंक पूरा हुआ'
        ],
        ar: [
          'غير مسموح بالكتابة إلى {1}',
          'امنح الإذن لإنشاء فهرس النص الكامل؛ لن يتم جلب محتوى المحادثات تلقائيًا. يظل الفهرس الحالي قابلًا للبحث · تمت فهرسة {1}',
          'تحديد {1}',
          'تصفية حسب العنوان: {1}',
          'تم تحديد {1}',
          '{1} من المحادثات',
          '{1} من المحادثات · {2}',
          '{1}: {2}',
          'تعذر فتح ChatGPT: {1}',
          '{1} قيد التنفيذ…',
          'فشل {1}: {2}',
          'تعذر تحديث إعداد الفهرسة التلقائية: {1}',
          'تعذر بدء الفهرسة: {1}',
          '{1} · اكتملت المزامنة التزايدية'
        ],
        'pt-BR': [
          'Você não tem permissão para gravar em {1}',
          'Autorize a criação do índice de texto completo; o conteúdo das conversas não será baixado automaticamente. O índice existente continua pesquisável · {1} indexados',
          'Selecionar {1}',
          'Filtrar por título: {1}',
          'Selecionados: {1}',
          '{1} conversas',
          '{1} conversas · {2}',
          '{1}: {2}',
          'Falha ao abrir o ChatGPT: {1}',
          '{1} em andamento…',
          'Falha em {1}: {2}',
          'Falha ao atualizar a indexação automática: {1}',
          'Falha ao iniciar a indexação: {1}',
          '{1} · Sincronização incremental concluída'
        ],
        bn: [
          '{1}-এ লেখার অনুমতি নেই',
          'সম্পূর্ণ-টেক্সট ইনডেক্স তৈরির অনুমতি দিন; কথোপকথনের মূল লেখা স্বয়ংক্রিয়ভাবে ডাউনলোড হবে না। বিদ্যমান ইনডেক্সে অনুসন্ধান করা যাবে · {1}টি ইনডেক্স করা হয়েছে',
          '{1} নির্বাচন করুন',
          'শিরোনাম দিয়ে ফিল্টার করুন: {1}',
          'নির্বাচিত: {1}',
          '{1}টি চ্যাট',
          '{1}টি চ্যাট · {2}',
          '{1}: {2}',
          'ChatGPT খুলতে ব্যর্থ: {1}',
          '{1} চলছে…',
          '{1} ব্যর্থ হয়েছে: {2}',
          'স্বয়ংক্রিয় ইনডেক্সিং সেটিং আপডেট করা যায়নি: {1}',
          'ইনডেক্সিং শুরু করা যায়নি: {1}',
          '{1} · ইনক্রিমেন্টাল সিঙ্ক সম্পন্ন'
        ],
        id: [
          'Tidak diizinkan menulis ke {1}',
          'Izinkan pembuatan indeks teks lengkap; isi percakapan tidak akan diambil otomatis. Indeks yang ada tetap dapat dicari · {1} terindeks',
          'Pilih {1}',
          'Filter berdasarkan judul: {1}',
          'Dipilih: {1}',
          '{1} percakapan',
          '{1} percakapan · {2}',
          '{1}: {2}',
          'Gagal membuka ChatGPT: {1}',
          '{1} sedang berlangsung…',
          '{1} gagal: {2}',
          'Gagal memperbarui pengaturan pengindeksan otomatis: {1}',
          'Gagal memulai pengindeksan: {1}',
          '{1} · Sinkronisasi inkremental selesai'
        ],
        fr: [
          'Vous n’êtes pas autorisé à écrire dans {1}',
          'Autorisez la création de l’index en texte intégral ; le contenu des conversations ne sera pas récupéré automatiquement. L’index existant reste consultable · {1} indexés',
          'Sélectionner {1}',
          'Filtrer par titre : {1}',
          'Sélectionnés : {1}',
          '{1} conversations',
          '{1} conversations · {2}',
          '{1} : {2}',
          'Impossible d’ouvrir ChatGPT : {1}',
          '{1} en cours…',
          'Échec de {1} : {2}',
          'Impossible de mettre à jour l’indexation automatique : {1}',
          'Impossible de démarrer l’indexation : {1}',
          '{1} · Synchronisation incrémentale terminée'
        ],
        ru: [
          'Нет разрешения на запись: {1}',
          'Разрешите создание полнотекстового индекса; содержимое чатов не загружается автоматически. Существующий индекс доступен для поиска · проиндексировано: {1}',
          'Выбрать {1}',
          'Фильтр по заголовку: {1}',
          'Выбрано: {1}',
          'Чатов: {1}',
          'Чатов: {1} · {2}',
          '{1}: {2}',
          'Не удалось открыть ChatGPT: {1}',
          '{1} выполняется…',
          'Ошибка: {1} · {2}',
          'Не удалось обновить настройки автоматической индексации: {1}',
          'Не удалось запустить индексацию: {1}',
          '{1} · Инкрементальная синхронизация завершена'
        ],
        ja: [
          '{1} への書き込み権限がありません',
          '全文インデックスの作成を許可してください。会話本文は自動取得されません。既存のインデックスは検索できます · インデックス済み {1} 件',
          '{1} を選択',
          'タイトルで絞り込む：{1}',
          '選択済み：{1}',
          'チャット {1} 件',
          'チャット {1} 件 · {2}',
          '{1}：{2}',
          'ChatGPT を開けませんでした：{1}',
          '{1} 中…',
          '{1} に失敗しました：{2}',
          '自動インデックス設定を更新できませんでした：{1}',
          'インデックスを開始できませんでした：{1}',
          '{1} · 差分同期が完了しました'
        ]
      }
    },
    {
      keys: `ui.httpRequestFailed
ui.sessionRequestFailed
ui.requestUnauthorized`.split('\n'),
      translations: {
        en: [
          'HTTP request failed ({status}): {url}',
          'Session request failed: HTTP {status}',
          'Request is not authorized'
        ],
        es: [
          'Error en la solicitud HTTP ({status}): {url}',
          'Error en la solicitud de sesión: HTTP {status}',
          'Solicitud no autorizada'
        ],
        hi: [
          'HTTP अनुरोध विफल ({status}): {url}',
          'सत्र अनुरोध विफल: HTTP {status}',
          'अनुरोध अधिकृत नहीं है'
        ],
        ar: [
          'فشل طلب HTTP ({status}): {url}',
          'فشل طلب الجلسة: HTTP {status}',
          'الطلب غير مُصرّح به'
        ],
        'pt-BR': [
          'Falha na solicitação HTTP ({status}): {url}',
          'Falha na solicitação de sessão: HTTP {status}',
          'Solicitação não autorizada'
        ],
        bn: [
          'HTTP অনুরোধ ব্যর্থ ({status}): {url}',
          'সেশন অনুরোধ ব্যর্থ: HTTP {status}',
          'অনুরোধটি অনুমোদিত নয়'
        ],
        id: [
          'Permintaan HTTP gagal ({status}): {url}',
          'Permintaan sesi gagal: HTTP {status}',
          'Permintaan tidak diizinkan'
        ],
        fr: [
          'Échec de la requête HTTP ({status}) : {url}',
          'Échec de la requête de session : HTTP {status}',
          'Requête non autorisée'
        ],
        ru: [
          'Ошибка HTTP-запроса ({status}): {url}',
          'Ошибка запроса сеанса: HTTP {status}',
          'Запрос не авторизован'
        ],
        ja: [
          'HTTP リクエストに失敗しました（{status}）：{url}',
          'セッションのリクエストに失敗しました：HTTP {status}',
          'リクエストが認証されていません'
        ]
      }
    },
    {
      keys: `ui.chatgptTabNotReadyReloadAndTryAgain
ui.chatgptTabConnectionInterruptedReloadAndTryAgain`.split('\n'),
      translations: {
        en: [
          'The ChatGPT tab is not ready. Reload the tab and try again.',
          'The connection to the ChatGPT tab was interrupted. Reload the tab and try again.'
        ],
        es: [
          'La pestaña de ChatGPT aún no está lista. Recárgala e inténtalo de nuevo.',
          'Se interrumpió la conexión con la pestaña de ChatGPT. Recárgala e inténtalo de nuevo.'
        ],
        hi: [
          'ChatGPT टैब अभी तैयार नहीं है। टैब को रीफ़्रेश करके फिर कोशिश करें।',
          'ChatGPT टैब से कनेक्शन टूट गया। टैब को रीफ़्रेश करके फिर कोशिश करें।'
        ],
        ar: [
          'علامة تبويب ChatGPT غير جاهزة بعد. أعد تحميلها ثم حاول مرة أخرى.',
          'انقطع الاتصال بعلامة تبويب ChatGPT. أعد تحميلها ثم حاول مرة أخرى.'
        ],
        'pt-BR': [
          'A guia do ChatGPT ainda não está pronta. Recarregue-a e tente novamente.',
          'A conexão com a guia do ChatGPT foi interrompida. Recarregue-a e tente novamente.'
        ],
        bn: [
          'ChatGPT ট্যাবটি এখনও প্রস্তুত নয়। ট্যাবটি রিফ্রেশ করে আবার চেষ্টা করুন।',
          'ChatGPT ট্যাবের সঙ্গে সংযোগ বিচ্ছিন্ন হয়েছে। ট্যাবটি রিফ্রেশ করে আবার চেষ্টা করুন।'
        ],
        id: [
          'Tab ChatGPT belum siap. Muat ulang tab lalu coba lagi.',
          'Koneksi ke tab ChatGPT terputus. Muat ulang tab lalu coba lagi.'
        ],
        fr: [
          'L’onglet ChatGPT n’est pas encore prêt. Rechargez-le puis réessayez.',
          'La connexion à l’onglet ChatGPT a été interrompue. Rechargez-le puis réessayez.'
        ],
        ru: [
          'Вкладка ChatGPT ещё не готова. Обновите её и повторите попытку.',
          'Соединение с вкладкой ChatGPT прервано. Обновите её и повторите попытку.'
        ],
        ja: [
          'ChatGPT のタブがまだ準備できていません。タブを再読み込みして、もう一度お試しください。',
          'ChatGPT タブとの接続が中断されました。タブを再読み込みして、もう一度お試しください。'
        ]
      }
    },
    {
      keys: ['ui.filenamePreviewSampleTitle'],
      translations: {
        en: ['NocoBase Official Demo Analysis'],
        'zh-TW': ['NocoBase 官方 Demo 分析'],
        es: ['Análisis de la demo oficial de NocoBase'],
        hi: ['NocoBase के आधिकारिक डेमो का विश्लेषण'],
        ar: ['تحليل العرض التوضيحي الرسمي لـ NocoBase'],
        'pt-BR': ['Análise da demonstração oficial do NocoBase'],
        bn: ['NocoBase-এর অফিসিয়াল ডেমো বিশ্লেষণ'],
        id: ['Analisis demo resmi NocoBase'],
        fr: ['Analyse de la démo officielle de NocoBase'],
        ru: ['Анализ официального демо NocoBase'],
        ja: ['NocoBase 公式デモの分析']
      }
    },
    {
      keys: `ui.unverifiedStatus
ui.localOnlyStatus`.split('\n'),
      translations: {
        en: ['Unverified', 'Local only'],
        'zh-TW': ['待核實', '僅本機'],
        es: ['Sin verificar', 'Solo local'],
        hi: ['सत्यापित नहीं', 'केवल स्थानीय'],
        ar: ['غير متحقق منه', 'محلي فقط'],
        'pt-BR': ['Não verificado', 'Somente local'],
        bn: ['যাচাই করা হয়নি', 'শুধু স্থানীয়'],
        id: ['Belum diverifikasi', 'Hanya lokal'],
        fr: ['Non vérifié', 'Local uniquement'],
        ru: ['Не проверено', 'Только локально'],
        ja: ['未確認', 'ローカルのみ']
      }
    },
    {
      keys: ['status.minimapSpeaker'],
      translations: {
        en: ['{1}/{2} · {3}'],
        'zh-TW': ['{1}/{2} · {3}'],
        es: ['{1}/{2} · {3}'],
        hi: ['{1}/{2} · {3}'],
        ar: ['{1}/{2} · {3}'],
        'pt-BR': ['{1}/{2} · {3}'],
        bn: ['{1}/{2} · {3}'],
        id: ['{1}/{2} · {3}'],
        fr: ['{1}/{2} · {3}'],
        ru: ['{1}/{2} · {3}'],
        ja: ['{1}/{2} · {3}']
      }
    }
  ];
  const autoContinueKeys = `ui.autoContinue
ui.autoContinueDisabled
ui.currentChatNotStarted
ui.continuationMessage
ui.continuationMessageHelp
ui.enterContinuationMessage
ui.pollingInterval
ui.pollingIntervalHelp
ui.maximumContinuations
ui.maximumContinuationsHelp
ui.startCurrentChat
ui.stop
ui.waitingForCurrentReply
ui.sentCount
ui.runningCountdown
ui.pausedWithReason
ui.switchedChat
ui.reachedContinuationLimit
ui.composerHasContent
ui.composerNotFound
ui.sendButtonUnavailable
ui.openChatFirst
ui.unknownAutoContinueOperation`.split('\n');
  // These translations are authored directly in each locale pack above and
  // reviewed as one feature set here; keep the overlay aligned with them.
  blocks.push({
    keys: autoContinueKeys,
    translations: Object.fromEntries([
      'zh-TW', 'es', 'hi', 'ar', 'pt-BR', 'bn', 'id', 'fr', 'ru', 'ja'
    ].map(locale => [locale, autoContinueKeys.map(key => scope.ChatGPTProLocalePacks[locale][key])]))
  });
  const retryIndexKeys = `ui.retryIndexConversation
ui.retryRequiresIdleIndex`.split('\n');
  blocks.push({
    keys: retryIndexKeys,
    translations: Object.fromEntries([
      'zh-TW', 'es', 'hi', 'ar', 'pt-BR', 'bn', 'id', 'fr', 'ru', 'ja'
    ].map(locale => [locale, retryIndexKeys.map(key => scope.ChatGPTProLocalePacks[locale][key])]))
  });
  const indexSkipKeys = `ui.skipIndexConversation
ui.skipIndexConversationConfirm
status.skippedIndexConversations`.split('\n');
  // The skip action is translated directly in each offline locale bundle.
  blocks.push({
    keys: indexSkipKeys,
    translations: Object.fromEntries([
      'zh-TW', 'es', 'hi', 'ar', 'pt-BR', 'bn', 'id', 'fr', 'ru', 'ja'
    ].map(locale => [locale, indexSkipKeys.map(key => scope.ChatGPTProLocalePacks[locale][key])]))
  });
  const indexStatusUiKeys = `ui.taskPausedAfterConsecutiveFailures
ui.authenticationOrPermissionIssue
ui.taskRateLimitCooldownWillResume
ui.rateLimitRepeatedManualResume
ui.unknownError
ui.indexFailureOfficiallyReportedGone
ui.indexFailureNotFoundOrNoAccessCannotConfirmDeletion
ui.indexFailureCheckChatGPTAccountAndAccess
ui.indexFailureNewerLocalJSONWillBeUsed
ui.unknownConversation
ui.openConversation
ui.unrecordedReason
ui.indexPausedAfterRepeatedFailuresCheckLogs
ui.indexPausedAfterAuthenticationErrorCheckLogin
ui.indexManuallyPausedResumeInTaskManager
ui.newConversationSyncComplete
ui.taskPausedAfterAuthenticationError
ui.taskPausedAfterRateLimitExhausted
ui.taskManuallyPaused`.split('\n');
  // These strings are part of the index/task UI. Their translations are
  // independently authored in the offline locale packs above.
  blocks.push({
    keys: indexStatusUiKeys,
    translations: Object.fromEntries([
      'zh-TW', 'es', 'hi', 'ar', 'pt-BR', 'bn', 'id', 'fr', 'ru', 'ja'
    ].map(locale => [locale, indexStatusUiKeys.map(key => scope.ChatGPTProLocalePacks[locale][key])]))
  });
  const fullTextFailureLabelKeys = `ui.indexFailureLog
ui.errorLabel
ui.assessmentLabel`.split('\n');
  blocks.push({
    keys: fullTextFailureLabelKeys,
    translations: Object.fromEntries([
      'zh-TW', 'es', 'hi', 'ar', 'pt-BR', 'bn', 'id', 'fr', 'ru', 'ja'
    ].map(locale => [locale, fullTextFailureLabelKeys.map(key => scope.ChatGPTProLocalePacks[locale][key])]))
  });
  const fullTextIndexStatusKeys = `status.remainingIndexCount
status.skippedIndexCount
status.outdatedIndexCount
status.completeRemainingIndexCount
status.refreshOutdatedIndexCount`.split('\n');
  blocks.push({
    keys: fullTextIndexStatusKeys,
    translations: Object.fromEntries([
      'zh-TW', 'es', 'hi', 'ar', 'pt-BR', 'bn', 'id', 'fr', 'ru', 'ja'
    ].map(locale => [locale, fullTextIndexStatusKeys.map(key => scope.ChatGPTProLocalePacks[locale][key])]))
  });
  blocks.push({
    keys: ['ui.openExportMenu'],
    translations: Object.fromEntries([
      'zh-TW', 'es', 'hi', 'ar', 'pt-BR', 'bn', 'id', 'fr', 'ru', 'ja'
    ].map(locale => [locale, [scope.ChatGPTProLocalePacks[locale]['ui.openExportMenu']]]))
  });
  for (const block of blocks) {
    for (const [locale, translations] of Object.entries(block.translations)) {
      if (translations.length !== block.keys.length) {
        throw new Error(`Reviewed locale ${locale} has ${translations.length} entries; expected ${block.keys.length}`);
      }
      const pack = scope.ChatGPTProLocalePacks?.[locale];
      if (!pack) throw new Error(`Missing locale pack: ${locale}`);
      block.keys.forEach((key, index) => {
        if (inactiveLegacyKeys.has(key)) return;
        if (!Object.prototype.hasOwnProperty.call(pack, key)) throw new Error(`Unknown reviewed key: ${key}`);
        pack[key] = translations[index].replaceAll('⏎', '\n');
      });
    }
  }
  scope.ChatGPTProReviewedLocaleKeys = blocks.flatMap(block => block.keys)
    .filter(key => !inactiveLegacyKeys.has(key));
})(window);
