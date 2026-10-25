# ChatGPT-Pro 多语言范围审计交接

**日期：** 2026-10-25
**项目：** `/home/cislunar/App/ChatGPT-Pro/`
**状态：** 待审计；本交接只明确下一窗口工作范围，不代表已完成用户可见文案审计。
**下一步唯一目标：** 核实哪些文案真正出现在用户界面中，只对这些内容实施和验证多语言支持。

## 1. 用户已确认的原则

用户指出，最近的多语言工作可能把范围扩大到了内部文案。后续应遵循：

- 翻译用户能看到、能操作或需要理解的内容：按钮、菜单、设置、状态、进度、确认框、悬浮提示、无障碍标签，以及面向用户的错误说明。
- 不需要翻译纯内部代码注释、开发文档、调试日志、底层校验描述、协议/API 字段、数据库字段、内部标识符。
- 用户的 ChatGPT 对话、标题、消息、项目名称和导出原文必须保留原样，不能当作扩展界面文案翻译。
- 内部异常需要可定位问题时，优先保留稳定错误码和技术诊断信息；用户界面只显示简明、已本地化的说明。
- 动态状态只本地化扩展自身生成的文案。不能使用宽泛的中文替换规则处理用户内容或 ChatGPT 原生页面。
- 不应以“语言包中的 Key 全部有翻译”作为多语言功能完成的判定。应以实际用户界面覆盖和运行时验证为准。

## 2. 当前 Git 基线与必须保护的修改

- 分支：`main`
- 当前 HEAD：`4c62ed3 i18n: complete reviewed UI translations`
- 最近多语言提交：
  - `53ec4a5 i18n: review cache integrity errors in ten languages`
  - `8f475df i18n: review dynamic indexing and task statuses`
  - `7ca4025 i18n: review bulk archive and delete statuses`
  - `4c62ed3 i18n: complete reviewed UI translations`
- 本轮之前的提交还包括动态索引/任务状态等翻译工作。388 个 Key 已被标记为审校完成，但**不能据此推断这 388 项全都应该属于翻译范围**。

开始工作时必须重新运行 `git status --short`。当前已有以下未提交修改，均不是本交接任务的内容，不得覆盖、恢复、暂存或提交：

- `PRIVACY.md`
- `README.md`
- `docs/chrome-web-store-description.md`
- `icons/icon128.png`、`icons/icon16.png`、`icons/icon48.png`
- `manifest.json`
- `popup/popup.js`
- `scripts/api-handler.js`
- `scripts/chatgpt-dom-adapter.js`
- `scripts/content-chatgpt.js`
- `styles/timeline.css`
- 未跟踪文件 `docs/2026-10-24-full-index-refactor-remaining-work.md`
- 未跟踪文件 `随手记.txt`

本交接文件也必须单独暂存和提交，禁止使用 `git add .`。

## 3. 当前多语言实现概况

- 语言包共 12 种：简体中文、英语、繁体中文、西班牙语、印地语、阿拉伯语、巴西葡萄牙语、孟加拉语、印尼语、法语、俄语、日语。
- `scripts/locales/keys.json` 当前有 388 个 Key。
- `scripts/locales/reviewed-ui.js` 将这 388 个 Key 全部标记为审校完成；该标记集合过大与否尚未基于运行时使用情况核实。
- 动态文案主要涉及 `scripts/i18n.js` 和 `scripts/locales/dynamic-map.js`。
- 当前维护原则文档：`docs/i18n-maintenance.md`。该文档已明确用户可见边界、内部诊断边界、稳定错误码和必要测试。后续实际实现应与它保持一致。

最近一次已执行并通过的相关检查：

```sh
node --check scripts/locales/reviewed-ui.js
node --check scripts/i18n.js
node --check tests/i18n-reviewed-ui-smoke.cjs
node tests/i18n-reviewed-ui-smoke.cjs
node tests/i18n-coverage-smoke.cjs
git diff --check
```

这些测试主要验证当前语言资源和动态模板的一致性；它们**不能替代真实使用范围审计**。维护文档另外要求运行：

```sh
node tests/i18n-diagnostics-smoke.cjs
node tests/i18n-hardcoded-audit.cjs
```

本轮未声称这两个测试已重新执行。下一窗口应在核实脚本存在及其当前断言后再运行。

## 4. 审计中已有的初步线索

对 Popup、scripts 和 styles 中的 JavaScript/HTML/CSS 做过一次简单静态扫描，结果是：

- 388 个语言 Key；
- 33 个 Key 名在运行时代码中被直接引用；
- 71 个 Key 名出现在动态映射文件中；
- 10 个 Key 未在该次扫描中找到直接 Key 引用、原文或动态映射命中。

以上统计**只是搜索线索，不是最终使用情况结论**：翻译可能通过原文匹配、数组、运行时组装、动态正则或间接调用发生；字符串出现也不代表它一定会展示给用户。不要据此直接删除 Key。

静态扫描未命中的候选项包括：

- `ui.initializing_51a08fb`
- `ui.settings`
- `ui.timestampSize`
- `ui.small`
- `ui.large`
- `ui.checkingForUpdates`
- `ui.startingImageDownloads`
- `ui.noTasksForThisAccount`
- `ui.allProjects`
- `ui.permanentlyRemoveThisLocalOnlyChatFromJSON`

下一窗口应逐项确认实际引用、渲染位置和是否仍在使用；特别是确认框、设置项可能通过间接方式构建，不能只靠 grep 结果判断。

## 5. 下一窗口执行步骤

必须使用 DevSpaceGO 操作项目。一次只完成这个审计/清理事项，不扩展到其他功能，不重复验收与本次无关的已通过功能。

### A. 先核实实际调用链

阅读：

1. `docs/i18n-maintenance.md`
2. `scripts/i18n.js`
3. `scripts/locales/keys.json`
4. `scripts/locales/dynamic-map.js`
5. `scripts/locales/reviewed-ui.js`
6. 各语言包和 `manifest.json` 中的脚本加载顺序
7. `popup/popup.html`、`popup/popup.js`、`scripts/content-chatgpt.js`、`scripts/api-handler.js`、`scripts/chatgpt-dom-adapter.js` 中的文案来源、DOM 渲染位置和错误处理调用点。

列出真实界面入口，至少覆盖：

- Popup 与设置；
- ChatGPT 页面上的侧边栏、时间戳和 Minimap；
- 全文搜索、索引授权和索引状态；
- Markdown/JSON 导出、图片下载、ZIP 分卷和批量任务；
- 确认框、悬浮提示、空状态、进度、用户可见错误；
- `title`、`aria-label` 等非正文但仍对用户可见/可感知的文案。

### B. 给文案分类，先产出证据再改动

对当前 Key 和硬编码中文逐项归类：

1. **用户可见且正在使用：** 保留并保证 12 种语言有正确翻译。
2. **内部诊断/开发用途：** 不应为了“全中文清零”而翻译；如果当前被直接展示给用户，先将技术错误和 UI 摘要分离。
3. **用户数据/第三方页面内容：** 不翻译、不改写。
4. **未使用、重复或历史遗留：** 记录引用搜索和调用链证据后再决定清理。
5. **不确定：** 标记待核实，不因名称或一次 grep 未命中而删除。

可用一份审计表记录：Key/原文、调用位置、渲染目标、类别、处理决定、验证方式。优先审计整个 388 Key 的真实用途，而不是再新增更多翻译。

### C. 根据证据最小化修正

- `reviewed-ui.js` 的审校集合只代表实际审校的用户可见文案，不应机械地等于 `keys.json` 的全部 Key。
- 语言包完整性测试可以继续检查各语言结构一致，但“审校覆盖”测试应针对明确批准的用户可见 Key 集合，不再把 388 作为天然正确的目标数。
- 对仅内部使用且不需要翻译的文案，先确认是否存在 UI 调用点，再决定移出审校集合、保留内部原文或改成稳定错误码；不要无证据地大批删除语言资源。
- 修复或保留动态匹配时，应限定为扩展自产生的状态文本；确保对话标题、用户消息和项目名称不受影响。
- 对用户可见的低层异常，提供本地化摘要，同时保留可供开发者定位的稳定错误码/技术日志。
- 翻译采用模型语义翻译并逐条审校，不使用机器批量直译，也不把所有中文统一替换成英文。

### D. 最小验证

按变更范围运行：

```sh
node tests/i18n-reviewed-ui-smoke.cjs
node tests/i18n-coverage-smoke.cjs
node tests/i18n-diagnostics-smoke.cjs
node tests/i18n-hardcoded-audit.cjs
git diff --check
```

如修改了运行时动态匹配，再补充对应的动态状态测试。检查至少一种非中文语言下的 Popup 和 ChatGPT 页面关键 UI；不能只靠 Key 数量或正则匹配通过来宣布完成。

### E. 独立提交

按“现状核对 → 证据分类 → 必要修改 → 最小验证 → 独立 Commit”执行。提交前确认只暂存本事项的文件和必要测试；不要包含第 2 节所列的既有未提交修改。未经授权不 Push、不部署。

## 6. 完成标准

- 有证据地确定哪些文案是用户可见的，覆盖主要功能和所有非正文 UI 提示。
- 所有活跃用户可见文案均能按当前语言正确显示，动态占位符完整。
- 内部日志、协议字段、用户内容和第三方页面内容未被误翻译或改写。
- 不再以“388/388”作为目标本身；最终 Key 数量以审计结果为准。
- 未使用 Key 只有在核实无直接/间接/动态引用后才清理。
- 相关专项测试通过，变更单独提交，工作区其他修改保持原状。

## 7. 新窗口直接执行提示词

> 继续 ChatGPT-Pro 多语言范围审计，项目目录 `/home/cislunar/App/ChatGPT-Pro/`。先检查 Git 状态并保护所有已有未提交修改，然后阅读 `docs/2026-10-25-i18n-user-visible-audit-handoff.md` 和 `docs/i18n-maintenance.md`。用户已明确：只翻译用户能看到、使用到的界面文案；内部注释、日志、协议/数据库字段、用户对话内容不应为了清零中文而翻译。当前 388 个 Key 虽已全部标记审校，但不应默认它们全都属于翻译范围。请使用 DevSpaceGO 检查真实调用链、渲染位置和动态匹配，先形成有证据的分类，再做最小必要修改与测试。不要仅凭 grep 未命中就删除 Key，不要扩大到其他需求，不要覆盖或提交既有脏文件；完成一个完整事项后独立 Commit，不 Push、不部署。
