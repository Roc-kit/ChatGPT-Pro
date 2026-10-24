# ChatGPT-Pro 多语言维护边界

## 哪些内容需要翻译

- 用户能直接看到的按钮、菜单、设置、悬停提示、动态进度、结果状态。
- 删除、归档、首次索引授权、缓存清理等操作前的确认文案。
- 出错后面向用户的简明说明。扩展离线提供简体中文、繁体中文、英语、西班牙语、印地语、阿拉伯语、巴西葡萄牙语、孟加拉语、印尼语、法语、俄语、日语。

## 哪些内容不应该当作翻译条目

- IndexedDB 事务、ZIP 分块验证、任务租约、底层索引校验等内部诊断。
- 用户对话标题、消息、项目名称、导出原始内容，以及 API 协议字段。
- 数值不同而语义相同的句子：使用一个带变量的模板。

内部异常采用可搜索的稳定英文错误码，如 `E_DB_TRANSACTION_FAILED`、`E_ZIP_CHUNK_ENCODING_INVALID`、`E_TASK_LEASE_EXPIRED`。UI 只显示本地化的错误摘要及代码，例如「导出失败 (E_ZIP_CHUNK_ENCODING_INVALID)」；不得仅显示不明原因的异常，也不要翻译错误码本身。详细异常日志应保留技术信息，避免翻译破坏问题定位。

## 开发约束

1. 新增面向用户的文案：为其分配稳定 `ui.*` / `status.*` Key，并在对应语言包提供译文。高风险确认框先验证变量占位符。
2. 新增内部错误：使用 `E_DB_*`、`E_ZIP_*`、`E_TASK_*`、`E_INDEX_*` 等稳定代码，避免新增 12 份机械翻译的异常文本。
3. 不得用「包含汉字」判断是否没有翻译：繁体中文、日语本身包含汉字。
4. 需要回归：`node tests/i18n-coverage-smoke.cjs`、`node tests/i18n-diagnostics-smoke.cjs`、`node tests/i18n-hardcoded-audit.cjs`、`node tests/i18n-reviewed-ui-smoke.cjs`。

语言包中的 Key 覆盖率表示结构完整，不能代替译文质量审校；`reviewed-ui.js` 只标记已实际审校的内容。
