# 完整命令行

2026-10-13，阶段 7；此前分词、候选执行和全部编辑已完成，本阶段补齐 tree/show 与帮助及课程会话。

## 实际显示路径

TreeCommand/ShowCommand 只读取会话的冻结描述，不入历史。CommandResult 持有可选 CommandDisplay；TreeDisplay/ShapeDisplay 多态调用 CommandFormatter，由 CLI 的 CliPresenter 输出树线与属性格式。应用不依赖 CLI；CLI 不比较命令名或图形标签决定显示方式。

GeometrySummary 封装属性/点列分组：一般叶子内联几何，Text 描述定位点，Line 描述两端点；具体图形覆盖描述方法。领域不保存树线或完整 XML。tree 中 width/height 显示为 w/h，文字 JSON 引号保留空文本/转义字符，明确设置的样式与导入元数据保留。标签与详情使用两个空格分隔，题目示例中的列对齐空格不影响内容。

tree 无参数显示 svg 尺寸及整树；tree id 以该节点为首行，仅列其子树。show 显示标签/id、真实父级（根级为 svg）、几何、文本、明确属性；没有省略样式时不虚构默认 fill。输出采用原有可往返数字精度，控制字符不会成为额外终端行。

## 语法与帮助

目前注册 19 个命令（front/back 各计一个）和六类图形；HelpCommand 查询实际注册语法及提供者自己的参数描述，不复制第二套类型表。text 帮助为 `create text <id> <x> <y> "content" [in <containerId>]`。双引号路径、空文本、正文 in、颜色 #、Windows 反斜杠规则沿用 D07。help 在未建文档时仍按题目无文档约束拒绝，此为 D10 可修订假设。

REPL 保持 svg>、逐行处理和 EOF 正常退出；未知 box 按规定报错，不实现版本 B。查询和失败查询均保持屏障/redo；非 DomainError 属于程序缺陷，交互入口报告失败并非零退出，避免掩盖异常。

## 样例与验证

- [typical.cli](../tests/fixtures/typical.cli) 回放课程 §6；路径改为 artifacts/demo.svg 和 tests/fixtures/other.svg，图形/编辑/输出/元素计数语义不变。
- [other.svg](../tests/fixtures/other.svg) 保持题目外部文件的 7 元素内容。
- [flowchart.cli](../tests/fixtures/flowchart.cli) 对应 §6.1 A，8 元素，额外查询移动后的局部树以验证文字随行，保存 artifacts/flowchart.svg。
- [查询集成测试](../tests/integration/CliDisplay.test.ts) 检查全文/局部树、show 父级/几何、空文本、全部帮助、查询保持历史与语法错误。
- [真实进程测试](../tests/e2e/CliHistory.test.ts) 编译当前代码后回放两份课程样例，检查精确编辑/错误反馈、保存产物的 id/父级/坐标与文本；保留此前历史与树编辑回放。

完整功能已接通，独立系统验收、遗漏边界审查、浏览器预览与最终报告在阶段 8 执行。

验证结果：npm run check 全部通过，18 个测试文件、354 项测试；生产依赖检查 91 个模块、288 条依赖，0 违规。类型、lint、构建和 CLI 组装检查均通过。
