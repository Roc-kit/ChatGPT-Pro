# 单对话上下文预算：实施记录（2026-11-09）

## 已确定的产品口径

- 只显示当前聊天活动分支的 **Token 总量估算**，不按用户、Assistant、DevSpace 等类型细分。
- 100% = 用户为每个对话自行设定的管理预算，不是 OpenAI 官方模型上下文窗口，不是订阅剩余额度，也不是历史累计 API 计费。
- 默认 100K Tokens；Popup 支持自定义 10K～2M，超过预算仍显示实际百分比。
- 圆环放在现有 Minimap 下方、自动继续按钮上方；点击弹层只显示总量/预算/百分比与统计限制。工具栏透明度、位置、折叠沿用现有行为。
- 颜色：70% 以下灰；70%～89% 黄；90%～99% 橙；100% 及以上红。

## 技术边界

- `scripts/context-budget.js` 严格沿 `current_node -> parent` 统计活动分支；不接受缺失节点、循环或被废弃分支的猜测性回退。
- 包括当前分支所有角色的可读取文本与嵌套工具返回文本。图片、音视频与附件内容不作虚假 Token 推断，仅标识未完整计量。
- 当前为无额外依赖的**启发式 Token 估算**，不是 `o200k_base` 或 GPT-6 真实 tokenizer 的精确输出。
- Minimap 开启时沿用其对话详情缓存及刷新流程，不增加重复的详情 API 请求；关闭 Minimap 时按需调用现有 `APIHandler`，遵守原有租约/429 冷却。无需申请新的 Chrome 权限。
- 关闭 Minimap 时不把全文搜索或虚拟滚动临时挂载的 DOM 消息 ID 当作新回复。以模型回复结束作为刷新触发；连续回复触发的冷却延迟最多待约 30 秒后重试一次（按 2 秒检查节奏），避免无止境地显示旧值。
- 当上下文按钮增加了工具栏底部高度时，Minimap 保留至少 80px 可用面板高度（视窗口空间而定），避免拖短后仅剩三条标记。
- 页面只对当前对话作统计；没有对话数据时显示破折号，不误报为 0%。

## 验收及未完成事项

- `node tests/context-budget-smoke.cjs`：通过，覆盖 DevSpace 工具内容、无效分支、废弃分支、预算、图片及接线。
- `node tests/s6-extension-browser-smoke.cjs --context-budget-only`：通过，覆盖真实 MV3 环、位置、弹层、预算设置、开关及无重复 Minimap 详情请求。
- `tests/conversation-tools-smoke.cjs`、`tests/s3-popup-dashboard-smoke.cjs`、`tests/i18n-coverage-smoke.cjs`、`tests/i18n-manifest-smoke.cjs`：通过。
- 完整 `tests/s6-extension-browser-smoke.cjs`：**通过**（真实 MV3、Minimap 动画/拖动、原有导出、索引、搜索、时间戳；详情 API 请求总计 8 次）。测试已区分中间对话更新与不必要的强制读取，并明确断言出现非预期重复读取时失败。
- `node tests/s6-extension-browser-smoke.cjs --minimap-only`：通过，含长对话、拖动和首尾定位。
- `node tests/s6-extension-browser-smoke.cjs --context-budget-disabled-control`：关闭新圆环并等待紧凑布局稳定后，完整 S6 对照通过。`--context-budget-only` 是新功能独立的 Chrome 验收入口。
- 其他既有 i18n 硬编码/翻译检验存在本次开发前已存在的未覆盖字符串（与该功能无关）；新增 UI 的 12 语言完整性检查通过。
- 当前 Git 工作区已有其他未提交修改（尤其 `content-chatgpt.js`、`local-data-store.js`）；**不得直接 `git add .` 或整体提交**。没有 Push、部署或修改用户的真实聊天数据。
