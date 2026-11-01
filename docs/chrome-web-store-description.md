# Chrome Web Store 商品详情

本文包含可直接用于 Chrome Web Store 的英文默认文案、简体中文文案和本次更新日志。竞争产品分析仅供内部定位，不要粘贴到商店简介中。

**商店多语言发布说明：** 本文中的中英文商店介绍供开发者后台分别粘贴，不会通过放入扩展 ZIP 自动切换。请在 Chrome Web Store Developer Dashboard 的 Store listing 页面，分别选择 English 和 Chinese (Simplified) 填写对应的详细说明。ZIP 中的 `_locales` 目录用于扩展内部界面语言，不等同于商店商品介绍的本地化配置。

## 商店后台文案（用户确认版）

以下中英文文案用于商店后台的对应语言栏位，不放入扩展运行 ZIP。

### 简体中文

```text
ChatGPT Pro 是专为 ChatGPT Web 端设计的全能效率扩展。聚合聊天管理、本地检索、长文导航与数据备份，所有数据均在浏览器本地处理，安全高效。

──────────────────────────────
【 核心亮点 】
──────────────────────────────

▪ 🗂️ 目录与时间线：悬浮呼出聊天目录，按时间排序，支持按普通聊天、项目及自定义 GPT 分类筛选。
▪ 🧭 长对话导航：侧边显示可视 Minimap，一键快速跳转至目标消息。
▪ 🔍 本地全文搜索：按需构建本地索引，秒级检索历史对话，完全不上传云端。
▪ ⏰ 消息时间戳：在侧边栏和每条问答正文上方标注精确时间。
▪ 🧹 批量管理：多选对话，一键批量归档或永久删除。
▪ 📤 丰富导出：支持将对话导出为 Markdown/JSON（单聊或批量打包 ZIP），支持一键打包下载对话内所有图片。

──────────────────────────────
【 隐私安全 】
──────────────────────────────

本地沙盒运行，不会收集或上传聊天记录、Token 与登录凭据。

──────────────────────────────
【 开源地址 】
──────────────────────────────

GitHub: https://github.com/Roc-kit/ChatGPT-Pro

* 本项目为第三方开源效率工具，与 OpenAI 官方无任何隶属关系。
```

### English

```text
ChatGPT Pro is an all-in-one productivity extension for ChatGPT Web. It streamlines chat management, local search, long-chat navigation, and data backups—completely local and privacy-first.

──────────────────────────────
[ KEY FEATURES ]
──────────────────────────────

▪ 🗂️ Chat Directory & Timeline: Floating drawer to sort and filter chats by date, Projects, or custom GPTs.
▪ 🧭 Long-Chat Minimap: Visual sidebar map to jump directly to any message node in long threads.
▪ 🔍 Local Full-Text Search: Fast on-demand search across historical messages without cloud uploads.
▪ ⏰ Message Timestamps: Clear timestamps in the native sidebar and above each prompt/response.
▪ 🧹 Batch Management: Multi-select conversations to bulk archive or permanently delete.
▪ 📤 Export & Backup: Export single chats or batch-download to Markdown, JSON, and ZIP (including all chat images).

──────────────────────────────
[ PRIVACY & SECURITY ]
──────────────────────────────

100% client-side. No chat history, tokens, or credentials are collected or sent to external servers.

──────────────────────────────
[ OPEN SOURCE ]
──────────────────────────────

GitHub: https://github.com/Roc-kit/ChatGPT-Pro

* ChatGPT Pro is an independent open-source project and is not affiliated with or endorsed by OpenAI.
```

## 推荐名称

ChatGPT Pro: Timeline, Search, Timestamps & Bulk Export

## English listing

### Short description

Open-source ChatGPT timeline, full-text search, timestamps, and bulk Markdown/JSON export. Free, with no paid tiers.

### Full description

```text
ChatGPT is useful until your conversation history becomes difficult to navigate. ChatGPT Pro adds a timeline, local full-text search, long-chat navigation, message timestamps, and bulk exports directly to ChatGPT Web.

OPEN SOURCE. FREE. NO PAID FEATURE GATES.

- Open source under the MIT License.
- No subscription, no extension-specific account, and no paid feature unlocks.
- No extension-imposed monthly export quota. Large jobs are processed in batches and still respect ChatGPT's own rate limits and your browser's available resources.

FIND CONVERSATIONS

- Browse and sort conversations by creation time.
- Filter by title, ChatGPT Project, or custom GPT.
- Use the conversation minimap to navigate long chats and jump to messages without endless scrolling.

BULK ARCHIVE AND DELETE

- Select multiple conversations in the chat directory and archive or permanently delete them.
- Archiving removes conversations from ChatGPT's conversation list without clearing the extension's locally saved data.
- Permanent deletion requires confirmation, and the result shows successful and failed items.

SEARCH YOUR LOCAL ARCHIVE

- Start full-text indexing when you choose; the extension does not automatically scan your entire history on first install.
- Search message content and jump to the matching conversation location.
- Build an account-scoped local index and update it incrementally after the initial scan.
- Cache complete conversation JSON locally so search and exports can reuse saved data instead of repeatedly fetching unchanged conversations.
- Preview or export cached items marked as local-only when the saved content is available.

EXPORT WITHOUT ARTIFICIAL CAPS

- Export the current conversation as Markdown or the original conversation JSON.
- Download images from the current conversation as ZIP files, split into volumes when needed, with a manifest and a list of failed images.
- Select multiple conversations or export the current filtered selection.
- Package bulk exports into ZIP volumes, with progress checkpoints so interrupted jobs can be resumed.
- Use filename presets or custom templates based on title, date, source, and conversation ID.
- Include useful archive metadata such as the original conversation link, conversation ID, timestamps, and message count.

RELIABLE, USER-CONTROLLED TASKS

- See indexing and export progress, task stages, and rate-limit cooldowns.
- Requests back off when ChatGPT applies rate limits; repeated failures pause the task rather than retrying endlessly.
- Manage the local index and complete JSON cache separately.

TIMESTAMPS AND LANGUAGES

- Show conversation creation times in the ChatGPT sidebar.
- Optionally show timestamps above user messages and assistant replies.
- The interface supports 12 languages: Simplified Chinese, Traditional Chinese, English, Spanish, Hindi, Arabic, Brazilian Portuguese, Bengali, Indonesian, French, Russian, and Japanese.

PRIVACY FIRST

- Conversation content, the full-text index, and cached JSON stay in your browser; they are not sent to a developer-controlled server.
- The extension uses ChatGPT's own website and APIs to access data available to your currently signed-in account.
- The first full indexing run requires your explicit action. Export files are generated locally in your browser.

GitHub: https://github.com/Roc-kit/ChatGPT-Pro

ChatGPT Pro is an independent third-party extension. It is not affiliated with, endorsed by, or sponsored by OpenAI, and it is separate from any paid ChatGPT plan.
```

## v3.0.2 What's New（English）

```text
- Added on-demand full-text indexing with automatic updates for new or changed conversations.
- Bulk archive and permanent deletion are now available from the conversation list.
- Added a minimap for jumping around long conversations.
- Added ZIP export for images in the current conversation, including split volumes and a result summary.
- Bulk exports can be split into ZIP parts and resumed after an interruption, with clearer progress and rate-limit status.
- Improved message timestamp display when switching between conversations.
```

## v3.0.2 本次更新（简体中文）

```text
首次使用全文搜索时，可以按需建立索引；之后会自动更新新增或发生变化的对话。
聊天目录新增批量归档和永久删除操作。
新增长对话快速导航 Minimap，方便快速跳转到不同消息。
新增当前对话图片 ZIP 导出，支持分卷并显示导出结果。
批量导出支持 ZIP 分卷和中断后继续，任务进度与限流等待状态也更清楚。
改进切换对话后时间戳的显示稳定性。
```

## Chrome Web Store 简体中文完整简介（可直接粘贴）

```text
3.0.2
- 首次使用全文搜索时，可以按需建立索引；之后会自动更新新增或发生变化的对话。
- 聊天目录新增批量归档和永久删除操作。
- 新增长对话快速导航 Minimap，方便快速跳转到不同消息。
- 新增当前对话图片 ZIP 导出，支持分卷并显示导出结果。
- 批量导出支持 ZIP 分卷和中断后继续，任务进度与限流等待状态也更清楚。
- 改进切换对话后时间戳的显示稳定性。

3.0.1
- 时间显示开关现在开启后即可生效，无需等待聊天目录处理完成。
- 修复切换对话后消息时间戳消失的问题。
- GPT 回复时间戳现在显示在回复正文上方，位置更清晰。
- 提升普通聊天、项目聊天和自定义 GPT 对话中的时间戳显示稳定性。
- 优化首次使用和聊天目录更新体验，减少等待时间。

开源免费，无订阅费用，也没有需要付费解锁的功能。扩展本身不设月度导出配额；大量任务仍受 ChatGPT 官方限流和浏览器资源限制。

ChatGPT 很适合持续工作，但当聊天越来越多时，查找旧对话、定位历史内容、确认消息时间和批量归档都会变得困难。

ChatGPT Pro 是一个面向 ChatGPT Web 的第三方效率工具箱。它把聊天目录、全文搜索、时间戳和导出能力集中到现有 ChatGPT 页面中，帮助你更快找到、整理和保存重要对话。

📦 仓库地址
- https://github.com/Roc-kit/ChatGPT-Pro

🗂️ 聊天时间线

- 通过页面悬浮入口打开聊天目录。
- 按创建时间查看、排序并打开历史聊天。
- 使用标题关键词即时筛选对话。
- 按普通聊天、ChatGPT 项目或自定义 GPT 筛选。

🧭 长对话快速导航（Minimap）

- 在长对话旁显示简洁的消息导航图。
- 点击或拖动即可快速定位到对话中的不同位置，并查看当前阅读位置。
- 可在扩展弹窗中开启或关闭。

🧹 批量删除与归档

- 在聊天目录中选择多条对话，批量归档或永久删除。
- 归档只会将对话从 ChatGPT 的对话列表中移除，不会清除扩展保存在本地的数据。
- 永久删除前会显示确认提示；执行结果会区分成功和失败，失败的对话可查看后处理。

🔍 本地全文搜索

- 按需建立本地聊天索引，搜索历史消息并跳转到对应位置。
- 首次建立索引后，会自动更新新增或发生变化的对话。
- 搜索索引和缓存保存在浏览器本地，不会上传到开发者服务器。

⏰ 时间信息

- 在 ChatGPT 原生侧边栏中显示聊天创建时间。
- 可在用户消息和 GPT 回复正文上方显示时间戳。
- 支持普通聊天、项目聊天和自定义 GPT 对话。

📤 Markdown / JSON 导出

- 通过页面右侧可拖动的图标，一键将当前聊天导出为 Markdown。
- 支持导出 ChatGPT 提供的原始对话 JSON 数据。
- 导出文件可包含原始链接、对话 ID、创建和更新时间、消息数等信息。

📦 批量导出

- 在聊天目录中选择单条、多条或当前筛选结果。
- 批量导出 Markdown 或 JSON，并打包为 ZIP 文件。
- 大批量导出会分卷保存；任务中断后可以继续未完成的部分。

🖼️ 导出对话图片

- 点击对话页面右侧的图片导出按钮，将当前对话中的图片打包为 ZIP 文件。
- 图片较多时会自动分卷，并显示下载进度、成功数量和失败数量。
- ZIP 中包含图片及相关清单；无法下载的图片会记录在清单中，方便核对。

📝 自定义导出文件名称

- 自定义 Markdown、JSON 和 ZIP 文件名。
- 可选择“标题”“日期 + 标题”“来源 + 标题”等命名规则。
- 也可以使用标题、日期、来源和对话 ID 设置自己的文件名模板。

⚙️ 本地设置与缓存

- 在扩展弹窗中管理时间戳、字体大小、打开方式和目录行为。
- 聊天目录、全文索引和对话缓存保存在浏览器本地。
- 优先使用本地目录，并在后台更新新增或变化的记录。

隐私说明

ChatGPT Pro 不会把聊天内容、聊天目录、全文索引或身份验证信息发送到开发者控制的服务器。扩展只访问当前登录账号在 chatgpt.com 中可访问的数据。你主动导出时，Markdown、JSON 或 ZIP 文件由浏览器本地生成。

兼容 ChatGPT Web。ChatGPT Pro 是独立的第三方扩展，与 OpenAI 没有隶属、授权或官方背书关系。

GitHub：https://github.com/Roc-kit/ChatGPT-Pro
```

## 竞品对比与定位（内部参考，不放入商店简介）

| 产品 | 当前公开定位 | 对比结论 |
| --- | --- | --- |
| Superpower ChatGPT | 综合工作区，覆盖文件夹、提示词、笔记、树状图和导出；免费版对部分数量和高级能力有限制，Pro 公开价格为年付折合每月 10 美元或月付 15 美元。 | 不与它比“功能最多”；突出本产品聚焦本地索引、时间导航、时间戳和导出，没有订阅或付费解锁。 |
| ChatGPT Exporter | 导出格式丰富，支持 PDF、Markdown、TXT、CSV、JSON 等；商店简介注明 PDF 每天免费 3 次，额外导出收费。 | 突出本产品的本地全文搜索、时间线/Minimap、原始 JSON 缓存和无扩展月度配额；不要声称竞品所有格式都收费。 |
| ChatVault Exporter | 免费开源，支持多个 AI 平台的 Markdown/JSON/SDoc 导出，ChatGPT/Claude 支持项目批量导出。 | 它也是开源免费产品，因此不要宣传“唯一开源”；差异应放在本产品将全文索引、时间导航、消息时间戳和可恢复批量导出整合在一起。 |

### 对外宣传边界

- 可以写“开源免费、无订阅、无付费功能墙、扩展本身不设月度导出配额”。
- 不要写“唯一开源”或暗示所有竞品都收费。
- “无限制”必须加准确边界：扩展不设人为月度配额，但仍受 ChatGPT 官方限流、浏览器存储/内存和用户设备性能影响。
- 不要承诺“无限存储”或“绝不失败”；应强调本地缓存、分卷、进度保存、冷却和恢复能力。

竞品资料：
- Superpower 定价：https://spchatgpt.com/pricing/
- ChatGPT Exporter 商店页：https://chromewebstore.google.com/detail/chatgpt-exporter-chatgpt/ilmdofdhpnhffldihboadndccenlnfll
- ChatVault Exporter：https://www.nathanspear.com/tools/chatvault

## 提交前检查

- 在 Chrome Web Store Developer Dashboard 的 Store listing 中同步更新名称、简短说明和完整说明。
- 上传包含 `manifest.json` v3.0.2 的完整 ZIP 包。
- 当前公开商品页仍显示旧名称 `ChatGPT Timeline` 和 v2.6.0；本地 manifest 使用 v3.0.2 和 `ChatGPT Pro: Timeline, Search, Timestamps & Bulk Export`。提交前统一商店名称、版本号和本地清单。
- 更新截图，至少展示聊天时间线/Minimap、全文搜索、本地索引管理、消息时间戳和可恢复的批量导出。
- 检查 Privacy practices 与 `PRIVACY.md` 保持一致。
- 提交审核前确认商品详情中没有声明尚未实现的功能。

## 隐私权规范：unlimitedStorage 权限理由

可直接粘贴到 Chrome Web Store Developer Dashboard：

> 扩展使用 unlimitedStorage 权限在用户浏览器本地保存全文搜索索引和聊天目录缓存。用户主动更新全文索引时，扩展会将历史消息文本保存在扩展自身的 IndexedDB 中；聊天目录缓存和设置保存在 chrome.storage.local 中。数据量会随聊天数量和内容增长，因此需要此权限避免大型本地索引受到存储配额限制或被清除，确保全文搜索功能稳定可用。所有索引、目录缓存和设置仅保存在用户浏览器本地，不会发送到开发者服务器，也不会用于广告、用户画像或与扩展功能无关的用途。用户可通过清除扩展存储或卸载扩展删除这些数据。
