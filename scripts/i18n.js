/** Shared, offline UI translations for the Popup and injected ChatGPT panel.
 * Account data, exported content and API protocol strings are not translated.
 */
(function (scope) {
  'use strict';
  const EN = {
    '打开 ChatGPT ↗':'Open ChatGPT ↗','正在初始化':'Initializing','扩展已就绪':'Extension ready',
    '请打开 ChatGPT':'Open ChatGPT','正在初始化…':'Initializing…','本地数据':'Local data','目录':'Directory',
    '完整 JSON':'Full JSON','已索引':'Indexed','功能设置':'Settings','启用扩展':'Enable extension',
    '侧边栏显示时间':'Sidebar timestamps','聊天消息显示时间戳':'Message timestamps',
    '后台新标签页打开':'Open in background tab','点击弹窗外关闭':'Close panel on outside click',
    '时间字号':'Timestamp size','小':'Small','中':'Medium','大':'Large',
    '导出文件名':'Export filenames','创建时间 + 对话标题':'Created time + title',
    '创建时间 + 来源 + 对话标题':'Created time + source + title','对话标题':'Conversation title',
    '来源 + 对话标题':'Source + title','仅日期 + 对话标题':'Date only + title',
    '仅日期 + 来源 + 对话标题':'Date only + source + title','自定义模板':'Custom template',
    '文件名预览：':'Filename preview:','索引与数据管理':'Index & data management',
    '当前没有运行中的任务':'No active tasks','全文索引与缓存':'Full-text index & cache',
    '刷新状态':'Refresh status','建立全文索引（需授权）':'Build index (consent required)',
    '首次需要授权扫描当前账号全部可读取的聊天；完成后自动增量更新。':'First scan requires your consent. Incremental updates follow completion.',
    '自动更新全文索引':'Automatically update index','清除索引':'Clear index',
    '清除完整 JSON':'Clear full JSON','正在读取任务…':'Loading tasks…',
    '完整刷新 / 重建缓存':'Full refresh / rebuild cache',
    '通常无需使用：聊天目录会保存在本地，平时只增量检查新增或发生变化的记录。':'Usually unnecessary: the local directory checks only new or changed conversations.',
    '支持创建/更新时间（精确到秒）：{created_datetime}、{updated_datetime}；也支持 {title}、{created_date}、{updated_date}、{source}、{conversation_id}。MD 和 JSON 共用规则。':'Date and time (to the second): {created_datetime}, {updated_datetime}. Also: {title}, {created_date}, {updated_date}, {source}, {conversation_id}. Shared by MD and JSON.',
    '刷新':'Refresh','暂停':'Pause','继续':'Resume','取消':'Cancel','下载分卷':'Download ZIP parts',
    '待执行':'Pending','执行中':'Running','已暂停':'Paused','已完成':'Completed','失败':'Failed','已取消':'Canceled',
    '全文索引':'Full-text index','Markdown 导出':'Markdown export','JSON 导出':'JSON export',
    '抓取 / 处理对话':'Fetching conversations','生成并保存 ZIP 分卷':'Saving ZIP parts',
    '请求间隔等待':'Waiting between requests','限流冷却':'Rate-limit cooldown',
    '连续失败，等待人工继续':'Paused after repeated failures','等待执行':'Waiting',
    '正在读取本地目录…':'Loading local directory…','聊天目录':'Conversations','全文搜索':'Full-text search',
    '已保存分卷':'Saved ZIP parts','检查更新':'Check updates','导出 MD':'Export MD','导出 JSON':'Export JSON',
    '归档':'Archive','删除':'Delete','下载当前对话所有图片 ZIP':'Download all images from this chat (ZIP)',
    '长对话快速导航':'Conversation minimap','展开消息导航':'Expand minimap','收起消息导航':'Collapse minimap',
    '创建时间':'Created','标题':'Title','搜索标题':'Search titles','输入标题关键词':'Filter by title',
    '清除':'Clear','确定':'Apply','项目名称 · 全部':'Projects · All','来源 · 全部':'Sources · All',
    '导出':'Export','搜索所有聊天内容':'Search all conversations','全文搜索关键词':'Search query',
    '搜索':'Search','正在读取索引状态…':'Loading index status…','更新索引':'Update index',
    '另查未归属的旧版全文索引（不归入当前账号）':'Include unassigned legacy index (not linked to this account)',
    '全选当前筛选结果':'Select all filtered conversations','按创建时间排序':'Sort by creation time',
    '按标题筛选':'Filter by title','收起聊天目录（可拖动）':'Collapse conversations (drag to move)',
    '聊天目录（可拖动）':'Conversations (drag to move)','聊天工具':'Chat tools',
    '本地全文搜索':'Local full-text search','没有找到匹配内容':'No matching results',
    '本地完整预览':'Full local preview','收起本地预览':'Hide local preview','清理本地':'Delete local copy',
    '仅本地':'Local only','用户':'User','普通聊天':'Standard chat','— · 普通聊天':'— · Standard chats',
    '首次索引（需授权）':'First index (consent required)','继续首次索引':'Continue first index',
    '立即检查新增聊天':'Check for new chats','继续首次全文索引':'Continue first index',
    '首次扫描需确认授权；原始 JSON 仅保存在本机':'First scan needs consent; full JSON stays on this device',
    '首次索引已完成，之后自动检查增量变化':'Initial index complete; checking changes automatically',
    '首次索引已完成，自动更新已关闭':'Initial index complete; auto-update disabled',
    '已授权，首次完整索引尚未完成':'Consent granted; initial indexing is incomplete',
    '索引任务已创建，请使用下方任务控制和进度查看':'Index task created; use task controls for progress',
    '正在扫描完整聊天目录，包括项目与分页；索引任务准备中':'Scanning all conversations and projects…',
    '正在搜索本地索引…':'Searching local index…',
    '输入关键词以搜索已有的本地索引':'Enter keywords to search the local index',
    '首次使用，正在建立本地目录…':'Building the initial local directory…',
    '正在检查所选聊天的目录版本…':'Checking selected conversation versions…',
    '当前账号没有已持久化的 ZIP 分卷':'No saved ZIP parts for this account',
    '未授权，未开始首次全量索引':'Not authorized; initial indexing not started',
    '索引任务已暂停，请在任务管理中继续':'Index paused; resume it in task management',
    '索引任务正在其他标签页运行':'Index is running in another tab',
    '同账号已有其他任务在执行，索引任务将排队':'Another account task is running; index is queued',
    '来源':'Source','全部':'All','选择':'Select','界面语言':'Interface language',
    '成功':'Succeeded','已完成增量同步':'Incremental sync complete',
    '收起本地预览':'Hide local preview','正在读取索引状态…':'Loading index status…',
    '重新下载最近一次已持久化的批量 ZIP 分卷':'Redownload latest saved bulk ZIP parts',
    '正在检查更新…':'Checking for updates…',
    '长对话快速导航（Minimap）':'Conversation minimap', '消息':'Message',
    '时间戳字号':'Timestamp font size',
    '时间戳字号（侧边栏及消息）':'Timestamp font size (sidebar and messages)',
    '打开聊天目录':'Open conversations', '导出整个对话（Markdown）':'Export entire chat (Markdown)',
    '正在导出整个对话…':'Exporting entire conversation…', '已导出整个对话':'Conversation exported',
    '下载当前对话所有图片 ZIP':'Download all conversation images (ZIP)',
    '按项目筛选':'Filter by project',
    '导出前增量检查聊天目录；仅更新有变化的完整缓存':'Check for updated conversations before exporting; reuse unchanged cache',
    '官方明确删除标记，原始数据和导出保留在本地':'Deleted remotely; original data and exports remain local',
    '只清理此对话的扩展本地原始 JSON、全文索引和目录':'Remove this chat from local JSON, full-text index, and directory only',
    '已完成后台增量同步':'Background sync complete',
    '已完成增量同步':'Incremental sync complete',
    '正在核实完整聊天目录（项目和分页）…':'Verifying full chat directory (including projects)…',
    '同步失败':'Sync failed','导出失败':'Export failed','图片下载失败':'Image download failed',
    '清理失败':'Cleanup failed','仅本地导出失败':'Local export failed',
    '索引更新失败':'Index update failed','索引状态读取失败':'Failed to read index status',
    '批量导出失败':'Bulk export failed','全文搜索失败':'Full-text search failed',
    '下载已保存分卷失败':'Failed to download saved ZIP parts',
    '未归属历史索引 · 不可确认在线链接或完整导出':'Legacy index · online link and complete export unverified',
    '仅本地 · 已确认官方删除':'Local only · confirmed remote deletion',
    '远端状态待核实':'Remote status unverified',
    '账号已变化；请重新授权或搜索当前账号':'Account changed; authorize or search again',
    '登录账号已变化，本地搜索结果已清空':'Account changed; local search results cleared',
    '正在搜索本地索引…':'Searching local index…',
    '正在检查所选聊天的目录版本…':'Checking selected chat versions…',
    '所选记录已是仅本地状态，无法操作云端':'Selected chats are local-only and cannot be changed remotely',
    '当前账号没有已持久化的 ZIP 分卷':'No saved ZIP parts for this account',
    '首次使用，正在建立本地目录…':'Building initial local directory…',
    '开始下载图片':'Starting image downloads',
    '失败记录':'Failed items', '当前账号暂无任务':'No current account tasks',
    '请切换到已登录的 ChatGPT 标签页，或点击“打开 ChatGPT”':'Switch to a signed-in ChatGPT tab or open ChatGPT',
    '本地任务':'Local task','等待恢复':'Waiting to resume',
    '自动增量索引已开启':'Automatic incremental index enabled',
    '自动增量索引已关闭；已有任务不受影响':'Automatic indexing disabled; current tasks are unaffected',
    '刷新失败':'Refresh failed','正在重建本地目录…':'Rebuilding local directory…',
    '完成':'Completed','还需':'Remaining','条聊天记录':'chats',
    '归档':'Archive','删除':'Delete','永久删除':'Delete permanently'
  };
  const PACKS = {
    'en': EN,
    'zh-TW': {
      '打开 ChatGPT ↗':'開啟 ChatGPT ↗','正在初始化':'初始化中','扩展已就绪':'擴充功能已就緒',
      '请打开 ChatGPT':'請開啟 ChatGPT','本地数据':'本機資料','目录':'目錄','完整 JSON':'完整 JSON','已索引':'已建立索引',
      '功能设置':'功能設定','启用扩展':'啟用擴充功能','侧边栏显示时间':'側邊欄顯示時間','聊天消息显示时间戳':'聊天訊息顯示時間戳',
      '后台新标签页打开':'在背景分頁開啟','点击弹窗外关闭':'點擊面板外關閉','时间字号':'時間字級','小':'小','中':'中','大':'大',
      '导出文件名':'匯出檔名','创建时间 + 对话标题':'建立時間 + 對話標題','创建时间 + 来源 + 对话标题':'建立時間 + 來源 + 標題',
      '对话标题':'對話標題','来源 + 对话标题':'來源 + 標題','仅日期 + 对话标题':'僅日期 + 標題',
      '仅日期 + 来源 + 对话标题':'僅日期 + 來源 + 標題','自定义模板':'自訂範本','文件名预览：':'檔名預覽：',
      '索引与数据管理':'索引與資料管理','当前没有运行中的任务':'目前沒有執行中的工作',
      '全文索引与缓存':'全文索引與快取','刷新状态':'重新整理狀態','建立全文索引（需授权）':'建立全文索引（需授權）',
      '自动更新全文索引':'自動更新全文索引','清除索引':'清除索引','清除完整 JSON':'清除完整 JSON',
      '正在读取任务…':'正在讀取工作…','完整刷新 / 重建缓存':'完整重新整理／重建快取',
      '聊天目录':'聊天目錄','全文搜索':'全文搜尋','已保存分卷':'已儲存分卷','检查更新':'檢查更新',
      '导出 MD':'匯出 MD','导出 JSON':'匯出 JSON','创建时间':'建立時間','标题':'標題','搜索标题':'搜尋標題',
      '输入标题关键词':'輸入標題關鍵字','清除':'清除','确定':'確定','项目名称 · 全部':'專案 · 全部',
      '来源 · 全部':'來源 · 全部','导出':'匯出','搜索所有聊天内容':'搜尋所有聊天內容','搜索':'搜尋',
      '更新索引':'更新索引','本地全文搜索':'本機全文搜尋','没有找到匹配内容':'找不到符合的內容',
      '本地完整预览':'本機完整預覽','清理本地':'清除本機副本','暂停':'暫停','继续':'繼續',
      '取消':'取消','下载分卷':'下載分卷','待执行':'待執行','执行中':'執行中','已暂停':'已暫停',
      '已完成':'已完成','失败':'失敗','已取消':'已取消','用户':'使用者','普通聊天':'一般聊天'
    },
    'es': {
      '打开 ChatGPT ↗':'Abrir ChatGPT ↗','正在初始化':'Iniciando','扩展已就绪':'Extensión lista',
      '请打开 ChatGPT':'Abre ChatGPT','本地数据':'Datos locales','目录':'Conversaciones',
      '完整 JSON':'JSON completo','已索引':'Indexadas','功能设置':'Configuración',
      '启用扩展':'Activar extensión','侧边栏显示时间':'Horas en barra lateral',
      '聊天消息显示时间戳':'Horas en mensajes','后台新标签页打开':'Abrir pestaña en segundo plano',
      '点击弹窗外关闭':'Cerrar al hacer clic fuera','时间字号':'Tamaño de fecha','小':'Pequeño','中':'Mediano','大':'Grande',
      '导出文件名':'Nombres de archivo','创建时间 + 对话标题':'Fecha y hora + título',
      '创建时间 + 来源 + 对话标题':'Fecha y hora + origen + título','对话标题':'Título',
      '来源 + 对话标题':'Origen + título','仅日期 + 对话标题':'Solo fecha + título',
      '仅日期 + 来源 + 对话标题':'Solo fecha + origen + título','自定义模板':'Plantilla propia',
      '文件名预览：':'Vista previa:','索引与数据管理':'Índice y datos',
      '当前没有运行中的任务':'Sin tareas activas','全文索引与缓存':'Índice y caché',
      '刷新状态':'Actualizar estado','建立全文索引（需授权）':'Crear índice (requiere permiso)',
      '自动更新全文索引':'Actualizar índice automáticamente','清除索引':'Borrar índice',
      '清除完整 JSON':'Borrar JSON','正在读取任务…':'Cargando tareas…',
      '完整刷新 / 重建缓存':'Actualizar / reconstruir caché',
      '聊天目录':'Conversaciones','全文搜索':'Buscar contenido','已保存分卷':'ZIP guardados',
      '检查更新':'Comprobar cambios','导出 MD':'Exportar MD','导出 JSON':'Exportar JSON',
      '创建时间':'Creación','标题':'Título','搜索标题':'Buscar títulos','输入标题关键词':'Filtrar títulos',
      '清除':'Borrar','确定':'Aplicar','项目名称 · 全部':'Proyectos · Todos',
      '导出':'Exportar','搜索所有聊天内容':'Buscar en conversaciones','搜索':'Buscar',
      '更新索引':'Actualizar índice','本地全文搜索':'Búsqueda local',
      '没有找到匹配内容':'Sin resultados','本地完整预览':'Vista local completa',
      '清理本地':'Borrar copia local','暂停':'Pausar','继续':'Reanudar','取消':'Cancelar',
      '下载分卷':'Descargar ZIP','待执行':'Pendiente','执行中':'En curso',
      '已暂停':'Pausada','已完成':'Finalizada','失败':'Fallida','已取消':'Cancelada','用户':'Usuario'
    },
    'hi': {
      '打开 ChatGPT ↗':'ChatGPT खोलें ↗','正在初始化':'शुरू हो रहा है','扩展已就绪':'एक्सटेंशन तैयार',
      '本地数据':'लोकल डेटा','目录':'चैट सूची','完整 JSON':'पूरा JSON','已索引':'इंडेक्स किए',
      '功能设置':'सेटिंग्स','启用扩展':'एक्सटेंशन चालू करें','侧边栏显示时间':'साइडबार में समय',
      '聊天消息显示时间戳':'संदेशों पर समय','后台新标签页打开':'बैकग्राउंड टैब में खोलें',
      '点击弹窗外关闭':'बाहर क्लिक पर बंद करें','时间字号':'समय का फ़ॉन्ट','小':'छोटा','中':'मध्यम','大':'बड़ा',
      '导出文件名':'फ़ाइल नाम','创建时间 + 对话标题':'बनने का समय + शीर्षक',
      '创建时间 + 来源 + 对话标题':'समय + स्रोत + शीर्षक','对话标题':'चैट शीर्षक',
      '来源 + 对话标题':'स्रोत + शीर्षक','仅日期 + 对话标题':'तारीख + शीर्षक',
      '仅日期 + 来源 + 对话标题':'तारीख + स्रोत + शीर्षक','自定义模板':'अपना टेम्पलेट',
      '文件名预览：':'फ़ाइल पूर्वावलोकन:','索引与数据管理':'इंडेक्स और डेटा',
      '当前没有运行中的任务':'कोई सक्रिय कार्य नहीं','全文索引与缓存':'इंडेक्स और कैश',
      '刷新状态':'स्थिति ताज़ा करें','建立全文索引（需授权）':'इंडेक्स बनाएं (अनुमति चाहिए)',
      '自动更新全文索引':'इंडेक्स अपने आप अपडेट करें','清除索引':'इंडेक्स हटाएं',
      '清除完整 JSON':'पूरा JSON हटाएं','正在读取任务…':'कार्य लोड हो रहे हैं…',
      '完整刷新 / 重建缓存':'फिर से लोड / कैश बनाएं',
      '聊天目录':'चैट सूची','全文搜索':'पूरा पाठ खोजें','已保存分卷':'सहेजे ZIP',
      '检查更新':'अपडेट जांचें','导出 MD':'MD निर्यात','导出 JSON':'JSON निर्यात',
      '创建时间':'बनने का समय','标题':'शीर्षक','搜索标题':'शीर्षक खोजें',
      '输入标题关键词':'शीर्षक फ़िल्टर','清除':'साफ़ करें','确定':'लागू करें',
      '导出':'निर्यात','搜索所有聊天内容':'सभी चैट खोजें','搜索':'खोजें',
      '更新索引':'इंडेक्स अपडेट','本地全文搜索':'लोकल खोज',
      '没有找到匹配内容':'कोई परिणाम नहीं','暂停':'रोकें','继续':'जारी रखें',
      '取消':'रद्द करें','下载分卷':'ZIP डाउनलोड','待执行':'लंबित','执行中':'चल रहा है',
      '已暂停':'रुका है','已完成':'पूरा हुआ','失败':'विफल','已取消':'रद्द हुआ'
    },
    'ar': {
      '打开 ChatGPT ↗':'فتح ChatGPT ↗','正在初始化':'جارٍ التهيئة','扩展已就绪':'الإضافة جاهزة',
      '本地数据':'البيانات المحلية','目录':'المحادثات','完整 JSON':'JSON الكامل','已索引':'المفهرسة',
      '功能设置':'الإعدادات','启用扩展':'تفعيل الإضافة','侧边栏显示时间':'وقت الشريط الجانبي',
      '聊天消息显示时间戳':'وقت الرسائل','后台新标签页打开':'فتح علامة تبويب في الخلفية',
      '点击弹窗外关闭':'إغلاق بالنقر خارج النافذة','时间字号':'حجم خط الوقت',
      '小':'صغير','中':'متوسط','大':'كبير','导出文件名':'أسماء الملفات',
      '创建时间 + 对话标题':'وقت الإنشاء + العنوان',
      '创建时间 + 来源 + 对话标题':'الوقت + المصدر + العنوان','对话标题':'عنوان المحادثة',
      '来源 + 对话标题':'المصدر + العنوان','仅日期 + 对话标题':'التاريخ + العنوان',
      '仅日期 + 来源 + 对话标题':'التاريخ + المصدر + العنوان','自定义模板':'قالب مخصص',
      '文件名预览：':'معاينة الاسم:','索引与数据管理':'الفهرس والبيانات',
      '当前没有运行中的任务':'لا توجد مهام نشطة','全文索引与缓存':'الفهرس والذاكرة',
      '刷新状态':'تحديث الحالة','建立全文索引（需授权）':'إنشاء الفهرس (يتطلب إذنًا)',
      '自动更新全文索引':'تحديث الفهرس تلقائيًا','清除索引':'مسح الفهرس',
      '清除完整 JSON':'مسح JSON الكامل','正在读取任务…':'جارٍ تحميل المهام…',
      '完整刷新 / 重建缓存':'تحديث كامل / إعادة بناء',
      '聊天目录':'المحادثات','全文搜索':'البحث النصي','已保存分卷':'أجزاء ZIP المحفوظة',
      '检查更新':'فحص التحديثات','导出 MD':'تصدير MD','导出 JSON':'تصدير JSON',
      '创建时间':'تاريخ الإنشاء','标题':'العنوان','搜索标题':'بحث في العناوين',
      '输入标题关键词':'تصفية العنوان','清除':'مسح','确定':'تطبيق',
      '导出':'تصدير','搜索所有聊天内容':'بحث في المحادثات','搜索':'بحث',
      '更新索引':'تحديث الفهرس','本地全文搜索':'بحث محلي',
      '没有找到匹配内容':'لا توجد نتائج','暂停':'إيقاف مؤقت','继续':'متابعة',
      '取消':'إلغاء','下载分卷':'تنزيل ZIP','待执行':'معلّق','执行中':'قيد التنفيذ',
      '已暂停':'متوقف','已完成':'مكتمل','失败':'فشل','已取消':'ملغى'
    },
    'pt-BR': {
      '打开 ChatGPT ↗':'Abrir ChatGPT ↗','正在初始化':'Iniciando','扩展已就绪':'Extensão pronta',
      '本地数据':'Dados locais','目录':'Conversas','完整 JSON':'JSON completo','已索引':'Indexadas',
      '功能设置':'Configurações','启用扩展':'Ativar extensão','侧边栏显示时间':'Horário na barra lateral',
      '聊天消息显示时间戳':'Horário nas mensagens','后台新标签页打开':'Abrir aba em segundo plano',
      '点击弹窗外关闭':'Fechar ao clicar fora','时间字号':'Tamanho do horário','小':'Pequeno','中':'Médio','大':'Grande',
      '导出文件名':'Nomes dos arquivos','创建时间 + 对话标题':'Data e hora + título',
      '创建时间 + 来源 + 对话标题':'Data e hora + origem + título',
      '对话标题':'Título da conversa','来源 + 对话标题':'Origem + título',
      '仅日期 + 对话标题':'Só data + título','仅日期 + 来源 + 对话标题':'Só data + origem + título',
      '自定义模板':'Modelo personalizado','文件名预览：':'Prévia do nome:',
      '索引与数据管理':'Índice e dados','当前没有运行中的任务':'Nenhuma tarefa ativa',
      '全文索引与缓存':'Índice e cache','刷新状态':'Atualizar status',
      '建立全文索引（需授权）':'Criar índice (requer permissão)',
      '自动更新全文索引':'Atualizar índice automaticamente','清除索引':'Limpar índice',
      '清除完整 JSON':'Limpar JSON','正在读取任务…':'Carregando tarefas…',
      '完整刷新 / 重建缓存':'Atualizar / refazer cache',
      '聊天目录':'Conversas','全文搜索':'Busca de texto','已保存分卷':'ZIPs salvos',
      '检查更新':'Verificar mudanças','导出 MD':'Exportar MD','导出 JSON':'Exportar JSON',
      '创建时间':'Criada','标题':'Título','搜索标题':'Buscar títulos',
      '输入标题关键词':'Filtrar títulos','清除':'Limpar','确定':'Aplicar',
      '导出':'Exportar','搜索所有聊天内容':'Buscar conversas','搜索':'Buscar',
      '更新索引':'Atualizar índice','本地全文搜索':'Busca local',
      '没有找到匹配内容':'Nenhum resultado','暂停':'Pausar','继续':'Retomar',
      '取消':'Cancelar','下载分卷':'Baixar ZIP','待执行':'Pendente','执行中':'Em andamento',
      '已暂停':'Pausada','已完成':'Concluída','失败':'Falhou','已取消':'Cancelada'
    },
    'id': {
      '打开 ChatGPT ↗':'Buka ChatGPT ↗','正在初始化':'Memulai','扩展已就绪':'Ekstensi siap',
      '本地数据':'Data lokal','目录':'Daftar','完整 JSON':'JSON lengkap','已索引':'Terindeks',
      '功能设置':'Pengaturan','启用扩展':'Aktifkan ekstensi','侧边栏显示时间':'Waktu di bilah samping',
      '聊天消息显示时间戳':'Waktu pada pesan','后台新标签页打开':'Buka tab latar belakang',
      '点击弹窗外关闭':'Tutup saat klik di luar','时间字号':'Ukuran waktu','小':'Kecil','中':'Sedang','大':'Besar',
      '导出文件名':'Nama berkas','创建时间 + 对话标题':'Waktu dibuat + judul',
      '创建时间 + 来源 + 对话标题':'Waktu + sumber + judul','对话标题':'Judul percakapan',
      '来源 + 对话标题':'Sumber + judul','仅日期 + 对话标题':'Tanggal + judul',
      '仅日期 + 来源 + 对话标题':'Tanggal + sumber + judul','自定义模板':'Templat khusus',
      '文件名预览：':'Pratinjau nama:','索引与数据管理':'Indeks dan data',
      '当前没有运行中的任务':'Tidak ada tugas aktif','全文索引与缓存':'Indeks dan cache',
      '刷新状态':'Muat ulang status','建立全文索引（需授权）':'Buat indeks (perlu izin)',
      '自动更新全文索引':'Perbarui indeks otomatis','清除索引':'Hapus indeks',
      '清除完整 JSON':'Hapus JSON lengkap','正在读取任务…':'Memuat tugas…',
      '完整刷新 / 重建缓存':'Segarkan / bangun cache',
      '聊天目录':'Percakapan','全文搜索':'Pencarian teks','已保存分卷':'ZIP tersimpan',
      '检查更新':'Periksa perubahan','导出 MD':'Ekspor MD','导出 JSON':'Ekspor JSON',
      '创建时间':'Dibuat','标题':'Judul','搜索标题':'Cari judul',
      '输入标题关键词':'Saring judul','清除':'Hapus','确定':'Terapkan',
      '导出':'Ekspor','搜索所有聊天内容':'Cari percakapan','搜索':'Cari',
      '更新索引':'Perbarui indeks','本地全文搜索':'Pencarian lokal',
      '没有找到匹配内容':'Tidak ada hasil','暂停':'Jeda','继续':'Lanjut',
      '取消':'Batal','下载分卷':'Unduh ZIP','待执行':'Menunggu','执行中':'Berjalan',
      '已暂停':'Dijeda','已完成':'Selesai','失败':'Gagal','已取消':'Dibatalkan'
    },
    'fr': {
      '打开 ChatGPT ↗':'Ouvrir ChatGPT ↗','正在初始化':'Initialisation','扩展已就绪':'Extension prête',
      '本地数据':'Données locales','目录':'Répertoire','完整 JSON':'JSON complet','已索引':'Indexées',
      '功能设置':'Paramètres','启用扩展':'Activer l’extension','侧边栏显示时间':'Heure dans la barre latérale',
      '聊天消息显示时间戳':'Horodatage des messages','后台新标签页打开':'Ouvrir en arrière-plan',
      '点击弹窗外关闭':'Fermer en cliquant dehors','时间字号':'Taille des dates',
      '小':'Petit','中':'Moyen','大':'Grand','导出文件名':'Noms des fichiers',
      '创建时间 + 对话标题':'Date et heure + titre',
      '创建时间 + 来源 + 对话标题':'Date + source + titre','对话标题':'Titre',
      '来源 + 对话标题':'Source + titre','仅日期 + 对话标题':'Date seule + titre',
      '仅日期 + 来源 + 对话标题':'Date + source + titre','自定义模板':'Modèle personnalisé',
      '文件名预览：':'Aperçu du nom :','索引与数据管理':'Index et données',
      '当前没有运行中的任务':'Aucune tâche active','全文索引与缓存':'Index et cache',
      '刷新状态':'Actualiser','建立全文索引（需授权）':'Créer l’index (accord requis)',
      '自动更新全文索引':'Actualiser l’index automatiquement','清除索引':'Effacer l’index',
      '清除完整 JSON':'Effacer JSON complet','正在读取任务…':'Chargement des tâches…',
      '完整刷新 / 重建缓存':'Actualiser / recréer le cache',
      '聊天目录':'Conversations','全文搜索':'Recherche intégrale','已保存分卷':'ZIP enregistrés',
      '检查更新':'Vérifier les changements','导出 MD':'Exporter MD','导出 JSON':'Exporter JSON',
      '创建时间':'Création','标题':'Titre','搜索标题':'Chercher un titre',
      '输入标题关键词':'Filtrer les titres','清除':'Effacer','确定':'Appliquer',
      '导出':'Exporter','搜索所有聊天内容':'Chercher dans les conversations','搜索':'Chercher',
      '更新索引':'Actualiser l’index','本地全文搜索':'Recherche locale',
      '没有找到匹配内容':'Aucun résultat','暂停':'Pause','继续':'Reprendre',
      '取消':'Annuler','下载分卷':'Télécharger ZIP','待执行':'En attente','执行中':'En cours',
      '已暂停':'En pause','已完成':'Terminé','失败':'Échec','已取消':'Annulé'
    },
    'ru': {
      '打开 ChatGPT ↗':'Открыть ChatGPT ↗','正在初始化':'Инициализация','扩展已就绪':'Расширение готово',
      '本地数据':'Локальные данные','目录':'Каталог','完整 JSON':'Полный JSON','已索引':'В индексе',
      '功能设置':'Настройки','启用扩展':'Включить расширение','侧边栏显示时间':'Время в боковой панели',
      '聊天消息显示时间戳':'Время сообщений','后台新标签页打开':'Открывать в фоновой вкладке',
      '点击弹窗外关闭':'Закрывать при клике снаружи','时间字号':'Размер времени',
      '小':'Маленький','中':'Средний','大':'Большой','导出文件名':'Имена файлов',
      '创建时间 + 对话标题':'Дата и время + заголовок',
      '创建时间 + 来源 + 对话标题':'Время + источник + заголовок',
      '对话标题':'Заголовок','来源 + 对话标题':'Источник + заголовок',
      '仅日期 + 对话标题':'Только дата + заголовок',
      '仅日期 + 来源 + 对话标题':'Дата + источник + заголовок','自定义模板':'Свой шаблон',
      '文件名预览：':'Пример имени:','索引与数据管理':'Индекс и данные',
      '当前没有运行中的任务':'Нет активных задач','全文索引与缓存':'Индекс и кэш',
      '刷新状态':'Обновить статус','建立全文索引（需授权）':'Создать индекс (нужно согласие)',
      '自动更新全文索引':'Обновлять индекс автоматически','清除索引':'Очистить индекс',
      '清除完整 JSON':'Очистить JSON','正在读取任务…':'Загрузка задач…',
      '完整刷新 / 重建缓存':'Обновить / пересоздать кэш',
      '聊天目录':'Список чатов','全文搜索':'Полнотекстовый поиск','已保存分卷':'ZIP-архивы',
      '检查更新':'Проверить изменения','导出 MD':'Экспорт MD','导出 JSON':'Экспорт JSON',
      '创建时间':'Создано','标题':'Название','搜索标题':'Найти заголовок',
      '输入标题关键词':'Фильтр названий','清除':'Очистить','确定':'Применить',
      '导出':'Экспорт','搜索所有聊天内容':'Искать по чатам','搜索':'Поиск',
      '更新索引':'Обновить индекс','本地全文搜索':'Локальный поиск',
      '没有找到匹配内容':'Нет результатов','暂停':'Пауза','继续':'Продолжить',
      '取消':'Отмена','下载分卷':'Скачать ZIP','待执行':'Ожидает','执行中':'Выполняется',
      '已暂停':'Приостановлено','已完成':'Завершено','失败':'Ошибка','已取消':'Отменено'
    },
    'ja': {
      '打开 ChatGPT ↗':'ChatGPT を開く ↗','正在初始化':'初期化中','扩展已就绪':'拡張機能の準備完了',
      '本地数据':'ローカルデータ','目录':'一覧','完整 JSON':'完全な JSON','已索引':'索引済み',
      '功能设置':'機能設定','启用扩展':'拡張機能を有効化','侧边栏显示时间':'サイドバーに時刻を表示',
      '聊天消息显示时间戳':'メッセージの時刻を表示','后台新标签页打开':'バックグラウンドタブで開く',
      '点击弹窗外关闭':'外側クリックで閉じる','时间字号':'時刻の文字サイズ',
      '小':'小','中':'中','大':'大','导出文件名':'エクスポート名',
      '创建时间 + 对话标题':'作成日時 + タイトル','创建时间 + 来源 + 对话标题':'日時 + ソース + タイトル',
      '对话标题':'会話タイトル','来源 + 对话标题':'ソース + タイトル',
      '仅日期 + 对话标题':'日付 + タイトル','仅日期 + 来源 + 对话标题':'日付 + ソース + タイトル',
      '自定义模板':'カスタム形式','文件名预览：':'ファイル名の例：',
      '索引与数据管理':'索引とデータ管理','当前没有运行中的任务':'実行中のタスクなし',
      '全文索引与缓存':'全文索引とキャッシュ','刷新状态':'状態を更新',
      '建立全文索引（需授权）':'索引を作成（同意が必要）',
      '自动更新全文索引':'索引を自動更新','清除索引':'索引を削除',
      '清除完整 JSON':'完全な JSON を削除','正在读取任务…':'タスクを読み込み中…',
      '完整刷新 / 重建缓存':'全更新 / キャッシュ再構築',
      '聊天目录':'チャット一覧','全文搜索':'全文検索','已保存分卷':'保存済み ZIP',
      '检查更新':'更新を確認','导出 MD':'MD 書き出し','导出 JSON':'JSON 書き出し',
      '创建时间':'作成日時','标题':'タイトル','搜索标题':'タイトルを検索',
      '输入标题关键词':'タイトルで絞り込み','清除':'クリア','确定':'適用',
      '导出':'書き出し','搜索所有聊天内容':'全チャットを検索','搜索':'検索',
      '更新索引':'索引を更新','本地全文搜索':'ローカル全文検索',
      '没有找到匹配内容':'一致する内容なし','暂停':'一時停止','继续':'再開',
      '取消':'キャンセル','下载分卷':'ZIP をダウンロード',
      '待执行':'待機中','执行中':'実行中','已暂停':'一時停止中',
      '已完成':'完了','失败':'失敗','已取消':'キャンセル済み'
    },
    'bn': {
      '打开 ChatGPT ↗':'ChatGPT খুলুন ↗','正在初始化':'শুরু হচ্ছে','扩展已就绪':'এক্সটেনশন প্রস্তুত',
      '本地数据':'স্থানীয় ডেটা','目录':'চ্যাট তালিকা','完整 JSON':'সম্পূর্ণ JSON','已索引':'ইনডেক্স করা',
      '功能设置':'সেটিংস','启用扩展':'এক্সটেনশন চালু','侧边栏显示时间':'সাইডবারে সময়',
      '聊天消息显示时间戳':'বার্তার সময়','后台新标签页打开':'পটভূমিতে ট্যাব খুলুন',
      '点击弹窗外关闭':'বাইরে ক্লিকে বন্ধ করুন','时间字号':'সময়ের ফন্ট','小':'ছোট','中':'মাঝারি','大':'বড়',
      '导出文件名':'ফাইলের নাম','创建时间 + 对话标题':'তৈরির সময় + শিরোনাম',
      '创建时间 + 来源 + 对话标题':'সময় + উৎস + শিরোনাম','对话标题':'চ্যাট শিরোনাম',
      '来源 + 对话标题':'উৎস + শিরোনাম','仅日期 + 对话标题':'তারিখ + শিরোনাম',
      '仅日期 + 来源 + 对话标题':'তারিখ + উৎস + শিরোনাম','自定义模板':'নিজস্ব টেমপ্লেট',
      '文件名预览：':'নামের নমুনা:','索引与数据管理':'ইনডেক্স ও ডেটা',
      '当前没有运行中的任务':'সক্রিয় কাজ নেই','全文索引与缓存':'ইনডেক্স ও ক্যাশে',
      '刷新状态':'অবস্থা রিফ্রেশ','建立全文索引（需授权）':'ইনডেক্স তৈরি (অনুমতি দরকার)',
      '自动更新全文索引':'স্বয়ংক্রিয় আপডেট','清除索引':'ইনডেক্স মুছুন',
      '清除完整 JSON':'JSON মুছুন','正在读取任务…':'কাজ লোড হচ্ছে…',
      '完整刷新 / 重建缓存':'রিফ্রেশ / ক্যাশে পুনর্নির্মাণ',
      '聊天目录':'চ্যাট তালিকা','全文搜索':'পূর্ণ পাঠ অনুসন্ধান','已保存分卷':'সংরক্ষিত ZIP',
      '检查更新':'আপডেট দেখুন','导出 MD':'MD এক্সপোর্ট','导出 JSON':'JSON এক্সপোর্ট',
      '创建时间':'তৈরির সময়','标题':'শিরোনাম','搜索标题':'শিরোনাম খুঁজুন',
      '输入标题关键词':'শিরোনাম ফিল্টার','清除':'মুছুন','确定':'প্রয়োগ',
      '导出':'এক্সপোর্ট','搜索所有聊天内容':'সব চ্যাটে খুঁজুন','搜索':'অনুসন্ধান',
      '更新索引':'ইনডেক্স আপডেট','本地全文搜索':'স্থানীয় অনুসন্ধান',
      '没有找到匹配内容':'কোনো ফল নেই','暂停':'বিরতি','继续':'চালিয়ে যান',
      '取消':'বাতিল','下载分卷':'ZIP ডাউনলোড','待执行':'অপেক্ষমাণ',
      '执行中':'চলছে','已暂停':'বিরতিতে','已完成':'সম্পন্ন','失败':'ব্যর্থ','已取消':'বাতিল হয়েছে'
    }
  };
  const LANGUAGES = [
    ['auto','自动 / Browser'],['zh-CN','简体中文'],['zh-TW','繁體中文'],
    ['en','English'],['es','Español'],['hi','हिन्दी'],['ar','العربية'],
    ['pt-BR','Português (Brasil)'],['bn','বাংলা'],['id','Bahasa Indonesia'],
    ['fr','Français'],['ru','Русский'],['ja','日本語']
  ];

  const originals = new WeakMap();
  let preferred = 'auto';
  let current = 'zh-CN';
  const fallback = key => EN[key] || key;
  function resolveLanguage(value) {
    const raw = String(value === 'auto' || !value
      ? (scope.chrome?.i18n?.getUILanguage?.() || scope.navigator?.language || 'zh-CN') : value);
    const short = raw.split(/[-_]/)[0].toLowerCase();
    if (short === 'zh') return /(?:tw|hk|mo|hant)/i.test(raw) ? 'zh-TW' : 'zh-CN';
    if (short === 'pt') return 'pt-BR';
    return Object.prototype.hasOwnProperty.call(PACKS, short) ? short : 'en';
  }
  function t(key) {
    if (current === 'zh-CN') return key;
    return PACKS[current]?.[key] || fallback(key);
  }
  // Explicit wildcard templates for extension-generated UI only. Do not
  // translate arbitrary ChatGPT page content or the user's chat titles.
  const DYNAMIC = [
    [/^当前账号已索引 (\d+) \/ (\d+) 个 · 未归属旧索引 (\d+) 个$/, m =>
      `Indexed ${m[1]} / ${m[2]} for this account · ${m[3]} unassigned legacy entries`],
    [/^首次建立全文索引需点击授权；不会自动抓取正文。已有索引可搜索 · 当前 (\d+) 条$/, m =>
      `Authorize to build a full-text index; chat bodies are not fetched automatically. Existing index is searchable · ${m[1]} indexed`],
    [/^选择 (.+)$/, m => `${t('选择')} ${m[1]}`],
    [/^标题筛选：(.+)$/, m => `${t('按标题筛选')}: ${m[1]}`],
    [/^已选 (\d+)$/, m => `${t('选择')} ${m[1]}`],
    [/^(\d+) 条聊天记录$/, m => `${m[1]} ${t('条聊天记录')}`],
    [/^(\d+) 条 · (.+)$/, m => `${m[1]} chats · ${translateText(m[2])}`],
    [/^(导出失败|图片下载失败|清理失败|仅本地导出失败|索引更新失败|索引状态读取失败|批量导出失败|全文搜索失败|同步失败|下载已保存分卷失败)：(.+)$/, m => `${t(m[1])}: ${translateText(m[2])}`],
    [/^图片 ZIP 已生成：成功 (\d+)，失败 (\d+)；共 (\d+) 卷$/, m => `Image ZIP ready: ${m[1]} succeeded, ${m[2]} failed · ${m[3]} parts`],
    [/^正在下载图片 (\d+) \/ (\d+)$/, m => `Downloading images ${m[1]} / ${m[2]}`],
    [/^正在保存图片 ZIP (\d+) \/ (\d+)$/, m => `Saving image ZIP ${m[1]} / ${m[2]}`],
    [/^正在导出 (.+)$/, m => `Exporting ${translateText(m[1])}`],
    [/^打开 ChatGPT 失败：(.+)$/, m => `Failed to open ChatGPT: ${translateText(m[1])}`],
    [/^账号请求冷却中 · 剩余 (\d+) 秒 · 到期后可自动继续$/, m => `Request cooldown · ${m[1]}s remaining · automatic resume`],
    [/^ · 还需 (\d+) 秒$/, m => ` · ${m[1]}s remaining`],
    [/^ · 等待结束，正在恢复$/, () => ' · Resuming'],
    [/^(.+)中…$/, m => `${translateText(m[1])} in progress…`],
    [/^(.+)失败：(.+)$/, m => `${translateText(m[1])} failed: ${translateText(m[2])}`],
    [/^任务不可用：(.+)$/, m => `Task unavailable: ${translateText(m[1])}`],
    [/^自动更新设置失败：(.+)$/, m => `Failed to update automatic indexing: ${translateText(m[1])}`],
    [/^索引启动失败：(.+)$/, m => `Index start failed: ${translateText(m[1])}`],
    [/^完成 · (\d+) 条聊天记录$/, m => `Done · ${m[1]} chats`],
    [/^(.+) · ZIP (\d+) 卷$/, m => `${translateText(m[1])} · ${m[2]} ZIP parts`],
    [/^当前账号 (\d+) 条(?: · 未归属旧索引 (\d+) 条)?$/, m => `${m[1]} account chats${m[2] ? ` · ${m[2]} legacy entries` : ''}`],
    [/^本地已有 (\d+) 条，正在增量检查最新数据…$/, m => `${m[1]} local chats · checking for updates…`],
    [/^(.+) · 已完成增量同步$/, m => `${translateText(m[1])} · ${t('已完成增量同步')}`],
    [/^已发起下载 (\d+) \/ (\d+) 卷（最近一次导出任务）$/, m => `Started downloading ${m[1]} / ${m[2]} ZIP parts (latest export)`],
    [/^已持久化 (\d+) 卷 · 成功 (\d+) 个、失败 (\d+) 个（浏览器下载需单独确认）$/, m => `${m[1]} saved parts · ${m[2]} succeeded, ${m[3]} failed (check browser downloads)`],
    [/^(正在归档|正在永久删除) (\d+) \/ (\d+) · 成功 (\d+)、失败 (\d+)$/, m => `${m[1] === '正在归档' ? 'Archiving' : 'Deleting'} ${m[2]} / ${m[3]} · ${m[4]} succeeded, ${m[5]} failed`],
    [/^(归档|永久删除)完成：成功 (\d+)、失败 (\d+)(（点击查看失败清单）)?$/, m => `${t(m[1])} completed: ${m[2]} succeeded, ${m[3]} failed${m[4] ? ' (click for failures)' : ''}`],
    [/^(归档|永久删除)中止：(.+)$/, m => `${t(m[1])} stopped: ${translateText(m[2])}`],
    [/^(\d+)\/(\d+) · (用户|ChatGPT|消息)：(.+)$/, m => `${m[1]}/${m[2]} · ${t(m[3])}: ${m[4]}`]
  ];
  function translateText(source) {
    const value = source.trim();
    if (!value) return source;
    let result = t(value);
    if (result === value) {
      if (current !== 'zh-CN' && value.includes(' · ')) {
        const parts = value.split(' · ');
        if (parts.every(part => Object.prototype.hasOwnProperty.call(EN, part))) {
          result = parts.map(part => t(part)).join(' · ');
        }
      }
      if (current !== 'zh-CN') for (const [pattern, format] of DYNAMIC) {
        const match = value.match(pattern);
        if (match) { result = format(match); break; }
      }
    }
    if (result === value) return source;
    return source.replace(value, result);
  }
  function translateNode(node) {
    if (node.nodeType !== 3 || !node.parentElement) return;
    const parent = node.parentElement;
    if (parent.closest('script,style,.chatgpt-pro-row-title,.chatgpt-pro-row-project,.chatgpt-pro-search-result,.chatgpt-pro-local-preview,#filenamePreview')) return;
    const previous = originals.get(node);
    const source = previous && previous.last === node.nodeValue ? previous.source : node.nodeValue;
    const target = translateText(source);
    originals.set(node, { source, last: target });
    if (node.nodeValue !== target) node.nodeValue = target;
  }
  function translateAttributes(element) {
    if (!element.getAttribute || element.matches('script,style')) return;
    for (const key of ['placeholder','title','aria-label']) {
      const value = element.getAttribute(key);
      if (!value) continue;
      const cache = originals.get(element) || {};
      const prev = cache[key];
      const source = prev && prev.last === value ? prev.source : value;
      const target = translateText(source);
      cache[key] = { source, last: target };
      originals.set(element, cache);
      if (target !== value) element.setAttribute(key, target);
    }
  }
  function apply(root) {
    if (!root) return;
    if (root.nodeType === 3) { translateNode(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) translateAttributes(root);
    const doc = root.ownerDocument || root;
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const item = walker.currentNode;
      if (item.nodeType === 3) translateNode(item);
      else translateAttributes(item);
    }
  }
  function watch(root) {
    apply(root);
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') apply(mutation.target);
        else if (mutation.type === 'attributes') translateAttributes(mutation.target);
        else for (const node of mutation.addedNodes) apply(node);
      }
    });
    observer.observe(root, { subtree:true, childList:true, characterData:true,
      attributes:true, attributeFilter:['title','aria-label','placeholder'] });
    return () => observer.disconnect();
  }
  function setLanguage(value) {
    preferred = LANGUAGES.some(([key]) => key === value) ? value : 'auto';
    current = resolveLanguage(preferred);
  }
  function setDirection(root) {
    if (root) { root.dir = current === 'ar' ? 'rtl' : 'ltr'; root.lang = current; }
  }
  setLanguage('auto');
  scope.ChatGPTProI18n = { t, translateText, apply, watch, setLanguage, setDirection, resolveLanguage,
    get language() { return current; }, get preferred() { return preferred; }, LANGUAGES };
})(window);
