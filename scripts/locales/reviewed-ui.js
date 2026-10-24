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
        'status.indexedForThisAccountUnassignedLegacyEntries',
        'status.updatingIndex',
        'status.addedUpdatedFailed',
        'status.chatsRemainToBeIndexedResumeTo',
        'status.indexUpToDateUpdatedSkipped',
        'status.localChatsCheckingForUpdates'
      ],
      translations: {
        'zh-TW': [
          '此帳號已索引 {1}/{2} 段對話 · 尚未歸屬的舊索引 {3} 筆',
          '正在更新索引：{1}',
          '新增或更新 {1} 筆，失敗 {2} 筆',
          '首次索引尚有 {1} 段對話未完成，可繼續執行',
          '索引已是最新狀態 · 更新 {1} 筆、略過 {2} 筆',
          '本機已有 {1} 段對話，正在檢查最新變更…'
        ],
        es: [
          'Indexadas {1} de {2} conversaciones de esta cuenta · {3} entradas antiguas sin asignar',
          'Actualizando el índice: {1}',
          '{1} registros añadidos o actualizados; {2} fallidos',
          'Quedan {1} conversaciones por indexar inicialmente; puedes reanudar la tarea',
          'Índice al día · {1} registros actualizados, {2} omitidos',
          'Hay {1} conversaciones guardadas localmente; comprobando cambios…'
        ],
        hi: [
          'इस खाते की {1}/{2} चैट इंडेक्स हो चुकी हैं · {3} पुराने रिकॉर्ड अभी किसी खाते से नहीं जुड़े हैं',
          'इंडेक्स अपडेट हो रहा है: {1}',
          '{1} रिकॉर्ड जोड़े या अपडेट किए गए; {2} विफल रहे',
          'पहली इंडेक्सिंग में {1} चैट अभी बाकी हैं; कार्य फिर शुरू किया जा सकता है',
          'इंडेक्स अपडेट है · {1} रिकॉर्ड अपडेट हुए, {2} छोड़े गए',
          'इस डिवाइस पर {1} चैट सेव हैं; नए बदलाव जाँचे जा रहे हैं…'
        ],
        ar: [
          'تمت فهرسة {1} من أصل {2} محادثة لهذا الحساب · {3} سجلات قديمة غير مرتبطة',
          'جارٍ تحديث الفهرس: {1}',
          'تمت إضافة أو تحديث {1} سجل؛ وفشل {2}',
          'تبقت {1} محادثة لإكمال الفهرسة الأولى؛ يمكنك استئناف المهمة',
          'الفهرس محدّث · تم تحديث {1} سجل وتخطي {2}',
          'توجد {1} محادثة محفوظة محليًا؛ جارٍ التحقق من التغييرات…'
        ],
        'pt-BR': [
          'Indexadas {1} de {2} conversas desta conta · {3} registros antigos sem vínculo',
          'Atualizando o índice: {1}',
          '{1} registros adicionados ou atualizados; {2} com falha',
          'Ainda faltam {1} conversas na indexação inicial; você pode retomar a tarefa',
          'Índice atualizado · {1} registros atualizados, {2} ignorados',
          'Há {1} conversas salvas localmente; verificando alterações…'
        ],
        bn: [
          'এই অ্যাকাউন্টের {1}/{2}টি চ্যাট ইনডেক্স করা হয়েছে · {3}টি পুরোনো রেকর্ড এখনও সংযুক্ত নয়',
          'ইনডেক্স হালনাগাদ হচ্ছে: {1}',
          '{1}টি রেকর্ড যোগ বা হালনাগাদ হয়েছে; {2}টি ব্যর্থ হয়েছে',
          'প্রথম ইনডেক্স তৈরিতে এখনও {1}টি চ্যাট বাকি; কাজটি আবার শুরু করা যাবে',
          'ইনডেক্স হালনাগাদ আছে · {1}টি রেকর্ড হালনাগাদ, {2}টি এড়িয়ে যাওয়া হয়েছে',
          'এই ডিভাইসে {1}টি চ্যাট সংরক্ষিত আছে; পরিবর্তন পরীক্ষা করা হচ্ছে…'
        ],
        id: [
          '{1} dari {2} percakapan akun ini telah diindeks · {3} entri lama belum ditetapkan',
          'Memperbarui indeks: {1}',
          '{1} entri ditambahkan atau diperbarui; {2} gagal',
          'Masih ada {1} percakapan dalam pengindeksan awal; tugas dapat dilanjutkan',
          'Indeks sudah terbaru · {1} entri diperbarui, {2} dilewati',
          'Ada {1} percakapan tersimpan secara lokal; memeriksa perubahan…'
        ],
        fr: [
          '{1} conversations indexées sur {2} pour ce compte · {3} anciennes entrées non attribuées',
          'Mise à jour de l’index : {1}',
          '{1} entrées ajoutées ou mises à jour ; {2} échecs',
          'Il reste {1} conversations à indexer lors du premier passage ; vous pouvez reprendre la tâche',
          'Index à jour · {1} entrées mises à jour, {2} ignorées',
          '{1} conversations enregistrées localement ; recherche des modifications…'
        ],
        ru: [
          'Проиндексировано {1} из {2} чатов этой учётной записи · {3} старые записи не привязаны',
          'Обновление индекса: {1}',
          'Добавлено или обновлено записей: {1}; ошибок: {2}',
          'В первичной индексации осталось {1} чатов; задачу можно продолжить',
          'Индекс актуален · обновлено {1}, пропущено {2}',
          'Локально сохранено {1} чатов; проверка изменений…'
        ],
        ja: [
          'このアカウントのチャット {1}/{2} 件をインデックス済み · 未割り当ての旧データ {3} 件',
          'インデックスを更新中：{1}',
          '{1} 件を追加・更新、{2} 件が失敗',
          '初回のインデックス作成が残り {1} 件です。タスクを再開して続行できます',
          'インデックスは最新です · 更新 {1} 件、スキップ {2} 件',
          'ローカルに {1} 件のチャットを保存済み。変更を確認中…'
        ]
      }
    }
  ];
  for (const block of blocks) {
    for (const [locale, translations] of Object.entries(block.translations)) {
      if (translations.length !== block.keys.length) {
        throw new Error(`Reviewed locale ${locale} has ${translations.length} entries; expected ${block.keys.length}`);
      }
      const pack = scope.ChatGPTProLocalePacks?.[locale];
      if (!pack) throw new Error(`Missing locale pack: ${locale}`);
      block.keys.forEach((key, index) => {
        if (!Object.prototype.hasOwnProperty.call(pack, key)) throw new Error(`Unknown reviewed key: ${key}`);
        pack[key] = translations[index].replaceAll('⏎', '\n');
      });
    }
  }
  scope.ChatGPTProReviewedLocaleKeys = blocks.flatMap(block => block.keys);
})(window);
