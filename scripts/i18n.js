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
    '常用显示设置':'Display settings', '高级设置':'Advanced settings',
    '后台打开、弹窗行为、导出文件名':'Background tabs, panel behavior, export filenames',
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
    ,'时间未知':'Unknown time','未命名项目':'Unnamed project','项目':'Project','项目 · 全部':'All projects'
    ,'来源 · 全部':'All sources','待核实 · ':'Unverified · ','仅本地 · ':'Local only · '
    ,'导出该聊天为 Markdown':'Export this conversation as Markdown'
    ,'导出该聊天原始 JSON':'Export this conversation as original JSON'
    ,'清理此条仅本地对话的本地数据':'Remove local-only conversation data'
    ,'重新下载最近一次已持久化的批量 ZIP 分卷':'Download previously saved ZIP parts again'
    ,'对话消息导航':'Conversation message navigation'
    ,'标题匹配':'Title match','清理':'Remove','未命名项目':'Unnamed project'
    ,'没有可导出的聊天':'No conversations available to export'
    ,'没有找到可导出的用户/助手消息':'No user or assistant messages to export'
    ,'当前对话分支没有可识别的图片资源':'No accessible images in the current conversation branch'
    ,'账号已切换':'Account changed','登录账号已切换':'Account changed'
    ,'返回内容不是图片':'Returned data is not an image','图片内容为空':'Empty image'
    ,'单张图片超过 80 MiB 下载上限':'Image exceeds 80 MiB limit'
    ,'导出重试次数已用尽':'Export retries exhausted','找不到已保存的 ZIP 分卷':'Saved ZIP file not found'
    ,'没有找到匹配内容':'No matching results','当前账号暂无任务':'No tasks for this account'
    ,'完整原始 JSON 未保存在本机；仅有搜索片段，无法提供完整预览。':'Complete JSON not stored locally; only a search excerpt is available.'
    ,'全选当前筛选结果':'Select all current filtered conversations'
    ,'永久删除':'Delete permanently','失败记录':'Failed items'
    ,'当前账号没有已持久化的 ZIP 分卷':'No saved ZIP parts for the current account'
    ,'索引任务已暂停，请在任务管理中继续':'Index paused; resume from Task Manager'
    ,'同账号的导出任务正在其他标签页执行':'A bulk export is already running in another tab'
    ,'同账号已有其他任务执行，导出任务将排队':'Another account task is running; export is queued'
    ,'已有同类型的暂停任务，请在任务管理中继续':'A matching task is paused; resume it from Task Manager'
    ,'首次索引（需授权）':'Initial indexing (consent required)'
    ,'当前账号没有已持久化的 ZIP 分卷':'No saved ZIP parts for this account'
    ,'同账号已有其他任务在执行，索引任务将排队':'Another task is running; indexing is queued'
    ,'索引任务正在其他标签页运行':'Indexing is running in another tab'
    ,'未授权，未开始首次全量索引':'Consent not granted; initial indexing not started'
    ,'远端状态待核实':'Remote status not verified'
    ,'当前账号没有已持久化的 ZIP 分卷':'No saved ZIP parts for the current account'
    ,'任务进度保存在本地，刷新标签页不会清空':'Task progress is saved locally and survives page reloads'
    ,'已请求开始索引；请保持 ChatGPT 标签页打开，稍后刷新进度':'Indexing requested; keep ChatGPT open and check task progress'
    ,'索引任务正在当前标签页准备中':'Index is starting in the current tab'
    ,'刷新状态':'Refresh status','完整刷新 / 重建缓存':'Full refresh / rebuild cache'
    ,'首次索引已完成，自动更新已关闭':'Initial index completed; automatic updates disabled'
    ,'已授权，首次完整索引尚未完成':'Consent granted; initial indexing incomplete'
    ,'索引任务已创建，请使用下方任务控制和进度查看':'Index task created; view task controls for progress'
    ,'正在扫描完整聊天目录，包括项目与分页；索引任务准备中':'Scanning all chats and projects for indexing'
    ,'首次扫描需确认授权；原始 JSON 仅保存在本机':'Initial scan requires consent; original JSON stays local'
    ,'索引任务已暂停，请在任务管理中继续':'Index paused; resume it in Task Manager'
    ,'自动增量索引已开启':'Automatic incremental indexing enabled'
    ,'自动增量索引已关闭；已有任务不受影响':'Automatic indexing disabled; running tasks unaffected'
    ,'正在核实完整聊天目录（项目和分页）…':'Verifying complete chat directory and projects…'
    ,'本地已有':'Locally stored','同步失败':'Sync failed','输入关键词以搜索已有的本地索引':'Enter keywords to search the local index'
    ,'永久清理这条仅本地对话在扩展中的原始 JSON、全文索引和目录记录？此操作不可撤销；不会请求删除 ChatGPT 云端记录，也不会清理已下载文件。':'Permanently remove local JSON, search index and directory record? This cannot be undone. Nothing will be deleted from ChatGPT or your downloaded files.'
    ,'确定{action}选中的 {count} 条对话？\n\n{detail}\n\n操作可能持续一段时间，失败的条目会保留供重试。':'{action} {count} selected conversations?\n\n{detail}\n\nThis may take a while. Failed items remain selected for retry.'
    ,'删除 ChatGPT 云端对话不可撤销。扩展会先验证完整 JSON 已保存到本地，删除后保留本地索引和原文。':'Deleting conversations in ChatGPT cannot be undone. The extension verifies that complete JSON is stored locally before deletion and retains the local index and original data.'
    ,'归档只影响 ChatGPT 云端的对话列表，不会清理扩展本地数据。':'Archiving removes chats from the remote list without clearing local extension data.'
    ,'仅清除当前已确认账号的 {label}（约 {count} 条）？\n{detail}\n已有下载文件、ZIP 分卷、其他账号及未归属旧索引均不受影响。':'Clear {count} {label} records for the verified account only?\n{detail}\nDownloaded files, ZIP parts, other accounts and unassigned legacy records are unaffected.'
    ,'不会删除完整 JSON；自动更新会关闭，须手动重新建立索引。':'Full JSON is retained. Automatic indexing will be disabled until you rebuild the index manually.'
    ,'不会删除全文搜索索引；后续需要正文时将按需重新获取。':'Full-text index is retained. Chat content will be fetched when needed.'
    ,'首次全文索引会读取当前 ChatGPT 账号全部可读取的聊天目录，并按需获取未缓存的完整聊天正文。本机保存原始 JSON 和搜索索引，首次完成后自动增量更新。是否授权？':'The first index reads all accessible chats from this ChatGPT account, fetching any uncached full content. Original JSON and search data stay on this device. Enable automatic incremental updates after completion. Authorize now?'
    ,'首次建立全文索引将遍历当前账号可读取的完整聊天目录，并按需抓取未缓存的对话正文。原始 JSON 和搜索索引只保存在本机。首次完成后将自动增量更新。是否授权开始？':'The first index scans all accessible chats and fetches missing content as needed. Raw JSON and the search index stay on this device. Automatic incremental updates follow completion. Authorize now?'
    ,'永久清理这条仅本地对话在扩展中的原始 JSON、全文索引和目录记录？\n此操作不可撤销；不会请求删除 ChatGPT 云端记录，也不会清理已下载文件。':'Permanently remove this local-only chat from JSON, search index and directory?\nThis cannot be undone; no remote chats or downloaded files are deleted.'
    ,'读取任务失败':'Failed to load task',' · 等待账号限流冷却':' · Waiting for account rate limit cooldown'
    ,' · 等待结束，正在恢复':' · Resuming after wait','全文搜索索引':'Full-text search index'
    ,'· 等待账号限流冷却':'· Waiting for account rate-limit cooldown'
    ,'· 等待结束，正在恢复':'· Resuming after wait'
    ,'完整 JSON 缓存':'Full JSON cache','当前账号本地数据数量':'Local data count for this account'
    ,'已完成首次目录同步':'Initial directory sync complete'
    ,'ChatGPT 聊天记录':'ChatGPT conversation','导出失败.txt':'export-errors.txt'
    ,'登录账号已切换，导出任务已停止':'Account switched; export stopped'
    ,'登录/权限异常，导出任务已暂停；本地分卷与检查点仍保留':'Authentication error; export paused. Saved parts and checkpoints retained.'
    ,'连续 3 条处理失败，导出任务已暂停；可检查日志后手动继续':'Three consecutive failures. Export paused; review logs before resuming.'
    ,'扩展后台操作失败':'Extension background operation failed'
    ,'登录账号已切换，索引任务已停止':'Account changed; indexing stopped'
    ,'登录/权限异常，任务已暂停':'Authentication error; task paused'
    ,'登录账号已切换，首次索引已停止':'Account changed; initial indexing stopped'
    ,'登录账号已切换，请重新打开任务管理':'Account switched; reopen Task Manager'
    ,'登录账号发生变化，请重试':'Account changed; try again'
    ,'请先启用扩展':'Enable the extension first'
    ,'首次全文索引必须由用户明确授权':'Initial indexing requires explicit consent'
    ,'任务操作无效':'Invalid task operation'
    ,'当前账号下找不到该任务':'Task not found for current account'
    ,'当前账号下没有此任务的已保存分卷':'No saved ZIP parts for this task'
    ,'下载期间账号发生变化':'Account changed during download'
    ,'登录账号已切换，无法预览旧账号内容':'Account switched; cannot preview previous account data'
    ,'登录账号已切换，请重新搜索':'Account switched; search again'
    ,'完整原文尚未保存到本地，未执行云端删除':'Complete JSON not saved locally; remote deletion canceled'
    ,'云端已删除，但本地状态标记失败，请检查缓存':'Deleted remotely, but local state update failed; check cache'
    ,'ChatGPT 登录账号无法确认，已停止读取账号缓存':'Unable to verify ChatGPT account; stopped reading account cache'
    ,'登录账号已切换，停止批量请求':'Account changed; bulk requests stopped'
    ,'本地数据读取失败':'Failed to read local data'
    ,'登录账号已切换，请重新同步':'Account switched; sync again'
    ,'完整目录出现重复分页，已停止以避免循环':'Repeated directory page detected; stopped to prevent a loop'
    ,'首次全量目录分页提前结束，不能确认完整':'Initial directory ended early; completeness cannot be verified'
    ,'项目分页游标重复，已停止以避免循环':'Repeated project cursor; stopped to prevent a loop'
    ,'另一个标签正在同步目录，无法确认首次全量扫描':'Another tab is syncing the directory; initial completeness cannot be verified'
    ,'GPT 项目元数据连续失败已停止，请稍后手动重试':'GPT project metadata failed repeatedly; try again later'
    ,'项目目录连续失败已停止，请稍后手动重试':'Project directory failed repeatedly; try again later'
    ,'登录账号已切换，详情任务已停止':'Account changed; detail task stopped'
    ,'登录账号已切换，已取消详情缓存写入':'Account changed; detail cache write canceled'
    ,'仅本地对话没有可导出的完整原始 JSON':'No complete JSON available for local-only conversation'
    ,'无效的对话操作':'Invalid conversation operation'
    ,'登录账号已切换，操作已停止':'Account changed; operation stopped'
    ,'登录账号已切换，请核对远端操作结果':'Account changed; verify the remote operation result'
    ,'无效的图片文件标识':'Invalid image file identifier'
    ,'ChatGPT 未提供可下载的图片链接':'ChatGPT did not provide a downloadable image URL'
    ,'索引操作失败':'Index operation failed','索引事务已中止':'Index transaction aborted'
    ,'索引事务失败':'Index transaction failed','索引记录缺少 conversation id':'Index record missing conversation ID'
    ,'无法读取索引状态':'Cannot read index status','无法清理旧索引':'Cannot clear legacy index'
    ,'首次索引准备中断':'Initial indexing preparation interrupted'
    ,'目录同步失败，请检查登录状态或冷却后重试':'Directory sync failed; check sign-in or try after cooldown'
    ,'批量请求进入共享冷却':'Bulk requests entered shared cooldown'
    ,'连续失败达到阈值，索引任务已暂停':'Index paused after repeated failures'
    ,'批量任务单条处理失败':'Bulk task item failed','任务状态已修改':'Task status changed'
    ,'无法打开本地数据缓存':'Cannot open local data cache'
    ,'旧版数据库连接仍在使用，请重新打开 ChatGPT 标签页':'Old database connection still active; reopen ChatGPT tab'
    ,'IndexedDB 请求失败':'IndexedDB request failed'
    ,'IndexedDB 事务已中止':'IndexedDB transaction aborted','IndexedDB 事务失败':'IndexedDB transaction failed'
    ,'必须提供明确的账号 ID；旧索引不能自动归属给当前账号':'An explicit account ID is required; legacy index cannot be assigned automatically'
    ,'缺少对话 ID':'Conversation ID missing','对话 JSON 不完整，未写入缓存':'Conversation JSON incomplete; not cached'
    ,'原始 JSON 与请求的对话 ID 不一致':'Original JSON does not match requested conversation ID'
    ,'目录应为数组':'Directory must be an array'
    ,'只能清理已经明确确认仅本地的对话，不能删除在线或待核实记录':'Only confirmed local-only conversations can be cleared'
    ,'索引记录缺少消息数组':'Index record missing message array'
    ,'全文索引版本与完整 JSON 不一致，请重新索引':'Index version does not match full JSON; rebuild the index'
    ,'无法清理当前账号索引':'Cannot clear current account index'
    ,'搜索索引与原始对话不一致':'Search index does not match original conversation'
    ,'已有更新版本的完整 JSON，拒绝覆盖旧数据':'Newer full JSON exists; refusing to overwrite with older data'
    ,'索引准备阶段无效':'Invalid indexing preparation phase'
    ,'自动更新开关必须是布尔值':'Auto-index setting must be a boolean'
    ,'请先完成首次全文索引':'Complete initial indexing first'
    ,'未知的清理类型':'Unknown cleanup type'
    ,'当前账号有执行中或待执行的任务，请先暂停或取消任务再清理':'Active or pending tasks exist; pause or cancel them before clearing data'
    ,'清理本地数据失败':'Failed to clear local data'
    ,'首次全量目录快照必须是数组':'Initial directory snapshot must be an array'
    ,'首次全量目录快照含重复 ID':'Initial directory snapshot contains duplicate IDs'
    ,'未授权首次全量索引':'Initial indexing not authorized','目录核实失败':'Directory verification failed'
    ,'尚未授权首次全量索引':'Initial indexing consent missing'
    ,'尚未完成可验证的首次全量目录扫描':'Verified initial directory scan incomplete'
    ,'缺少已核实的全量目录快照':'Verified complete directory snapshot missing'
    ,'首次索引任务仍在执行或暂停':'Initial indexing task still running or paused'
    ,'任务内容不能为空':'Task items cannot be empty','任务存在重复的对话 ID':'Task contains duplicate conversation IDs'
    ,'不支持的任务类型':'Unsupported task type'
    ,'当前账号未启用自动全文索引':'Automatic indexing not enabled for this account'
    ,'任务租约已失效，拒绝旧执行器写入':'Task lease expired; stale executor write rejected'
    ,'找不到当前账号任务':'Task not found for current account'
    ,'任务阶段无效':'Invalid task phase','无效的任务结果':'Invalid task result'
    ,'任务检查点顺序不正确':'Invalid task checkpoint order','无效的任务操作':'Invalid task operation'
    ,'分卷 ZIP 内容为空':'ZIP part is empty','分卷文件名无效':'Invalid ZIP part filename'
    ,'分卷清单不能为空':'ZIP part manifest cannot be empty'
    ,'无权写入该导出任务':'Not allowed to write this export task'
    ,'分卷进度或编号不正确':'Invalid ZIP part progress or number'
    ,'分卷清单与任务快照不符':'ZIP part manifest does not match task snapshot'
    ,'已有同编号分卷':'ZIP part number already exists'
    ,'无效的分卷编号':'Invalid ZIP part number'
    ,'当前账号下没有该导出任务':'Export task not found for current account'
    ,'请先取消或结束任务，再清理已保存的 ZIP 分卷':'Cancel or finish the task before clearing saved ZIP parts'
    ,'ZIP 清理失败':'ZIP cleanup failed','ZIP 下载区间无效':'Invalid ZIP download range'
    ,'找不到已保存的分卷':'Saved ZIP part not found'
    ,'分卷上传索引无效':'Invalid ZIP upload index'
    ,'ZIP 分块编码无效':'Invalid ZIP chunk encoding'
    ,'无权上传分卷':'Not authorized to upload ZIP part'
    ,'分卷上传序号错误':'Invalid ZIP upload part number'
    ,'ZIP 分块数无效':'Invalid ZIP chunk count'
    ,'无法读取导出任务':'Cannot read export task'
    ,'ZIP 分块未完整上传':'ZIP chunk upload incomplete'
    ,'ZIP 上传暂存清理失败':'Failed to clear temporary ZIP upload'
    ,'详情请求租约已失效':'Detail request lease expired'
    ,'详情请求租约已失效，拒绝修改共享冷却':'Detail lease expired; cannot modify shared cooldown'
    ,'不支持的日志类型':'Unsupported log type'
    ,'日志保留期清理失败':'Failed to purge expired logs'
    ,'失败记录：\n{items}':'Failed items:\n{items}'
    ,'无法读取本地完整内容':'Unable to read complete local content'
    ,'首次索引准备失败':'Failed to prepare initial index'
    ,'登录账号已切换，操作已停止':'Account changed; operation stopped'
    ,'并发起下载':'and download started'
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
  function format(key, values = {}) {
    return t(key).replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (whole, name) =>
      Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : whole);
  }
  // Explicit wildcard templates for extension-generated UI only. Do not
  // translate arbitrary ChatGPT page content or the user's chat titles.
  const DYNAMIC = [
    [/^项目 (.+) 分页游标重复$/, m => `Repeated pagination cursor for project ${m[1]}`],
    [/^项目 (.+) 分页为空但仍有后续游标$/, m => `Empty page but more cursor results for project ${m[1]}`],
    [/^ChatGPT 操作失败：HTTP (\d+)$/, m => `ChatGPT operation failed: HTTP ${m[1]}`],
    [/^无法读取本地完整内容：(.+)$/, m => `${t('无法读取本地完整内容')}: ${translateText(m[1])}`],
    [/^首次索引准备失败：(.+)$/, m => `${t('首次索引准备失败')}: ${translateText(m[1])}`],
    [/^正在重试 (\d+) \/ (\d+) · (.+)$/, m => `Retrying ${m[1]}/${m[2]} · ${translateText(m[3])}`],
    [/^正在(?:归档|永久删除) (\d+) \/ (\d+) · 成功 (\d+)、失败 (\d+)$/, m =>
      `${valueVerb(m[0])} ${m[1]}/${m[2]} · ${m[3]} succeeded, ${m[4]} failed`],
    [/^(\d+) \/ (\d+) · 第 (\d+) \/ (\d+) 组$/, m =>
      `${m[1]} / ${m[2]} · group ${m[3]} / ${m[4]}`],
    [/^(.+?) · (\d+) 条$/, m => `${translateText(m[1])} · ${m[2]} chats`],
    [/^当前账号 (\d+) 条(?: · 未归属旧索引 (\d+) 条)?$/, m => `${m[1]} account chats${m[2] ? ` · ${m[2]} unassigned legacy entries` : ''}`],
    [/^(\d+) \/ (\d+) · 成功 (\d+) · 失败 (\d+)(?: · ZIP (\d+) 卷)?$/, m =>
      `${m[1]}/${m[2]} · ${m[3]} succeeded · ${m[4]} failed${m[5] ? ` · ${m[5]} ZIP parts` : ''}`],
    [/^已发起 (\d+) 个分卷下载，请检查浏览器下载提示$/, m => `Started ${m[1]} ZIP part downloads; check browser downloads`],
    [/^已清理 (\d+) 个本地 ZIP 分卷，原始聊天缓存和任务历史仍保留$/, m => `Deleted ${m[1]} saved ZIP parts; original chat cache and task history remain`],
    [/^(.+?)操作已提交$/, m => `${translateText(m[1])} request submitted`],
    [/^任务不可用：(.+)$/, m => `Task unavailable: ${translateText(m[1])}`],
    [/^请求限流冷却中，至 (.+)$/, m => `Rate-limit cooldown until ${m[1]}`],
    [/^已从当前账号清除 (\d+) 条(.+)；其他数据保持不变$/, m =>
      `Removed ${m[1]} ${translateText(m[2])} entries from this account; other data unchanged`],
    [/^已请求开始索引；请保持 ChatGPT 标签页打开，稍后刷新进度$/, () => t('已请求开始索引；请保持 ChatGPT 标签页打开，稍后刷新进度')],
    [/^完成 · (\d+) 条聊天记录$/, m => `Completed · ${m[1]} chats`],
    [/^(.+) · 已完成后台增量同步$/, m => `${translateText(m[1])} · ${t('已完成后台增量同步')}`],
    [/^当前账号已索引 (\d+) \/ (\d+) 个 · 未归属旧索引 (\d+) 个$/, m =>
      `Indexed ${m[1]} / ${m[2]} for this account · ${m[3]} unassigned legacy entries`],
    [/^请求受限，(\d+) 秒后继续 · (.+)$/, m => `Rate limited · resume in ${m[1]}s · ${translateText(m[2])}`],
    [/^本组完成，(\d+) 秒后继续 · (.+)$/, m => `Batch complete · continue in ${m[1]}s · ${translateText(m[2])}`],
    [/^请求失败，(\d+) 秒后重试 · (.+)$/, m => `Request failed · retry in ${m[1]}s · ${translateText(m[2])}`],
    [/^请求受限 · (\d+) 秒后继续 · (.+)$/, m => `Rate limited · resume in ${m[1]}s · ${translateText(m[2])}`],
    [/^本组完成 · (\d+) 秒后继续 · (.+)$/, m => `Batch complete · continue in ${m[1]}s · ${translateText(m[2])}`],
    [/^请求失败 · (\d+) 秒后重试 (\d+) \/ (\d+) · (.+)$/, m =>
      `Request failed · retry in ${m[1]}s (${m[2]}/${m[3]}) · ${translateText(m[4])}`],
    [/^第 (\d+) 个 ZIP 已保存(并发起下载)? · (\d+) \/ (\d+)$/, m =>
      `ZIP part ${m[1]} saved${m[2] ? ' and download started' : ''} · ${m[3]}/${m[4]}`],
    [/^正在更新索引 (.+)$/, m => `Updating index ${translateText(m[1])}`],
    [/^新增\/更新 (\d+) 个，失败 (\d+) 个$/, m => `${m[1]} added/updated, ${m[2]} failed`],
    [/^首次索引仍有 (\d+) 条待补全，可再次继续$/, m => `${m[1]} chats remain to be indexed; resume to continue`],
    [/^索引已是最新 · 更新 (\d+) 个，跳过 (\d+) 个$/, m =>
      `Index up to date · ${m[1]} updated, ${m[2]} skipped`],
    [/^已持久化 (\d+) 卷 · 成功 (\d+) 个、失败 (\d+) 个（浏览器下载需单独确认）$/, m =>
      `${m[1]} saved ZIP parts · ${m[2]} succeeded, ${m[3]} failed (verify browser downloads)`],
    [/^已发起下载 (\d+) \/ (\d+) 卷（最近一次导出任务）$/, m =>
      `Downloading saved ZIP part ${m[1]}/${m[2]}`],
    [/^同步失败，已保留本地数据：(.+)$/, m => `Sync failed; local data retained: ${translateText(m[1])}`],
    [/^图片下载 HTTP (\d+)$/, m => `Image download HTTP ${m[1]}`],
    [/^无权写入(.+)$/, m => `Not allowed to write ${translateText(m[1])}`],
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
  function valueVerb(text) { return text.startsWith('正在归档') ? 'Archiving' : 'Deleting'; }
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
  scope.ChatGPTProI18n = { t, format, translateText, apply, watch, setLanguage, setDirection, resolveLanguage,
    get language() { return current; }, get preferred() { return preferred; }, LANGUAGES };
})(window);
