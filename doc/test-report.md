# 系统测试与回归验收报告

本文保留25d6575首次交付时的历史结果；首轮审查整改后的最新21文件/407项验证、变更范围与剩余边界见 [iteration-notes.md](iteration-notes.md)，不把历史数量冒充当前总数。

日期：2026-10-13（Asia/Shanghai）。系统验收基线：a4f84ae（test-system-regression，368项）；交付最终代码：ad74465（docs-final-delivery，R04修复后376项）；报告在代码检查、提交推送及实际浏览器预览后形成。阶段 8 已完成；课程 Phase 1 功能范围验收通过，final 标签按用户明确要求暂不创建，截止时间未提供。

## 环境与执行结果

Windows；Node.js 24.11.0、npm 11.6.1、TypeScript 6.0.3、Vitest 5.0.3、ESLint 10.12.0、typescript-eslint 8.71.1、dependency-cruiser 18.5.0。运行时 XML 依赖 @rgrove/parse-xml 5.0.0，固定版本和锁文件。

| 实际检查 | 结果 |
| --- | --- |
| npm ci | 按锁文件恢复成功；194 包审计，0 已报告漏洞（只代表该次审计结果） |
| npm run typecheck | strict、exactOptionalPropertyTypes 等开启；skipLibCheck=false；通过 |
| npm run lint | 0 错误、0 警告 |
| npm run build | 当前生产代码编译通过 |
| npm run check:architecture | 91 个模块、288 条依赖，0 违规；含解析库模块，生产 src 为 85 文件 |
| npm test | 20 个测试文件、376 项测试全部通过；未声明覆盖率百分比 |
| npm run check:runtime | 编译后真实组装检查通过 |
| npm run check | R04 最后代码修改后的完整串行回归通过，以上检查全部包含 |
| 课程源码规范 | AST 与人工抽查通过：77 类、7 接口及入口；一类一同名文件、私有实例字段、无顶层业务函数；两处分派核对 |
| 文档/来源 | 内嵌图与独立图源一致；phase_cli_1.md/think1.md 未变；最终全目录链接复核在阶段 9 |

自动测试产物位于忽略的 artifacts，真实 CLI 测试独立编译当前源码，不使用陈旧 dist。主要长期证据为可提交的测试源码、fixtures 和 doc/examples 中的实际输出。CI 尚未配置，本次结果来自本地 Windows 环境，不据此声称其他平台已验收。

## A01—A30 逐项映射

下表的通过以课程明确规则及 D01—D09 已记载工程基线为准，假设不冒充教师确认；课程插件版本 B 不在范围。

| 编号 | 实际证据 | 结果 |
| --- | --- | --- |
| A01 | [EditorSession](../tests/application/EditorSession.test.ts)、[EditorFlow](../tests/integration/EditorFlow.test.ts)：默认/单参数/双参数 init、替换与屏障 | 通过 |
| A02 | [DocumentCommands](../tests/integration/DocumentCommands.test.ts)、[SystemRegression](../tests/integration/SystemRegression.test.ts)、[真实 CLI](../tests/e2e/CliHistory.test.ts)：完整读取、解析/路径/IO 失败保持文档与 redo | 通过 |
| A03 | [XmlSvgCodec](../tests/adapters/XmlSvgCodec.test.ts)、DocumentCommands、真实 CLI：前序补号避开后方显式 id、准确警告、失败不发布 | 通过 |
| A04 | [NodeDocumentStorage](../tests/adapters/NodeDocumentStorage.test.ts)、DocumentCommands、真实 CLI：首次/覆盖/另存/默认路径、失败旧目标不变 | 通过 |
| A05 | [SvgDocument](../tests/domain/SvgDocument.test.ts)、EditorSession/EditorFlow：canvas 查询、修改、失败与屏障；XmlSvgCodec 的 viewBox 规则 | 通过 |
| A06 | [ShapeProviders](../tests/adapters/ShapeProviders.test.ts)、EditorFlow：六类参数、根/容器创建、文本及省略样式 | 通过 |
| A07 | SvgDocument、EditorFlow、XmlSvgCodec：全局唯一且大小写敏感，缺失/重复/非容器错误 | 通过 |
| A08 | [TreeOrderCommands](../tests/application/TreeOrderCommands.test.ts)、SvgDocument、真实 CLI：整子树删除、一次恢复完整父级/id/顺序 | 通过 |
| A09 | [Shapes](../tests/domain/Shapes.test.ts)、[Group](../tests/domain/Group.test.ts)、EditorFlow、流程图真实 CLI：增量及全部子孙移动、精确恢复 | 通过 |
| A10 | Shapes/Group、EditorSession、SystemRegression：全部几何缩放，非正/非有限/溢出失败不变，字体/笔宽保留 | 通过 |
| A11 | Shapes/Group、EditorFlow、SystemRegression：公共/各类白名单、text text、非法属性拒绝、继承区别 | 通过 |
| A12 | [TreeGrouping](../tests/domain/TreeGrouping.test.ts)、[TreeGroupingCommands](../tests/application/TreeGroupingCommands.test.ts)、真实 CLI：D03 原顺序/共同父级、祖先冲突与失败不变 | 通过（位置按暂定 D03） |
| A13 | TreeGrouping/TreeGroupingCommands、真实 CLI：嵌套/空组解散原位置替换、根级规定拒绝、一步恢复 | 通过 |
| A14 | TreeGrouping/TreeGroupingCommands：末尾归属、自包含/循环拒绝、完整恢复原位置 | 通过 |
| A15 | [TreeOrder](../tests/domain/TreeOrder.test.ts)、TreeOrderCommands：front 最后绘制/back 最先绘制，同级及边界恢复 | 通过 |
| A16 | [CliDisplay](../tests/integration/CliDisplay.test.ts)、真实 CLI：全文/局部 tree、几何与端点/文本、show 父级和属性、无状态改变 | 通过 |
| A17 | CliDisplay：19 命令与六类完整语法；帮助源于实际注册；无文档按 D10 | 通过（无文档假设未获教师确认） |
| A18 | EditorSession、TreeGroupingCommands、TreeOrderCommands：每条一个单元、独立前后快照，redo 不重跑工厂 | 通过 |
| A19 | EditorFlow、DocumentCommands、CliDisplay、SystemRegression：失败/查询保留 redo，新成功编辑清空分支 | 通过 |
| A20 | EditorSession、DocumentCommands、SystemRegression、真实 CLI：全部文档命令成功屏障、失败不建立、新编辑解禁 | 通过 |
| A21 | EditorFlow、各命令集成和真实 CLI：题目精确错误/摘要、单行 error: 与错误优先级 | 通过 |
| A22 | [Tokenizer](../tests/adapters/Tokenizer.test.ts)、EditorFlow、真实 CLI：svg>、引号、空文本、#、CRLF/EOF、路径 | 通过 |
| A23 | XmlSvgCodec、NodeDocumentStorage、SystemRegression、真实 CLI及下述浏览器预览：转义、数值、属性存在性与结构往返 | 通过（支持范围内） |
| A24 | XmlSvgCodec/SystemRegression、nested.svg 实际回放与浏览器：transform/font/viewBox 受控保留，未知内容显式拒绝 | 通过（D09 范围） |
| A25 | ShapeProviders、EditorFlow、真实 CLI：box 准确未知类型错误 | 通过 |
| A26 | 真实 CLI 的 [typical.cli](../tests/fixtures/typical.cli) 与 [other.svg](../tests/fixtures/other.svg)：关键输出、5/7 元素数、保存读回 | 通过 |
| A27 | 真实 CLI 的 [flowchart.cli](../tests/fixtures/flowchart.cli)：8 元素、节点与文字随行、undo 恢复、保存与浏览器预览 | 通过 |
| A28 | [OopConventions](../tests/architecture/OopConventions.test.ts)、[DependencyRules](../tests/architecture/DependencyRules.test.ts)、人工代码审查：Command/Composite、私有状态、两处名字查找 | 通过 |
| A29 | [课程主文档](README.md)、图源/渲染、实际依赖检查与过程/修复记录；阶段 9 最后复核 | 功能与架构证据通过 |
| A30 | 已按阶段实际 commit/push，远程引用复核；用户明确“暂不创建标签”，截止时间未提供 | 提交推送完成；final/截止时间验收暂缓 |

## S01—S08 系统场景

| 编号 | 已执行证据及结果 |
| --- | --- |
| S01 | EditorFlow/EditorSession/真实 CLI：重复 id 创建失败仍可 redo 到原后状态；通过 |
| S02 | SystemRegression/真实 CLI：实际 save 后 undo/redo 拒绝，只能撤销屏障后的新编辑；通过 |
| S03 | TreeOrderCommands/真实 CLI：删除 inner 包括全部子孙，一次恢复父级/顺序/id 后仍可移动；通过 |
| S04 | XmlSvgCodec/DocumentCommands：先全扫描再前序补号，失败导入无警告/计数泄漏；通过 |
| S05 | TreeGrouping/TreeGroupingCommands：pair(a,c),b,d 与完整恢复；晚发现无效 id 或祖先冲突不变；通过 |
| S06 | Tokenizer/EditorFlow/XmlSvgCodec/真实 CLI：正文 in/空文本/引号/中文/转义、路径及颜色；通过 |
| S07 | SystemRegression/XmlSvgCodec：子属性缺省与显式 blue 经父样式编辑、撤销、保存读回仍有区别；通过 |
| S08 | NodeDocumentStorage 注入 write/flush/replace 失败检查原目标与临时文件，DocumentCommands/真实 CLI 检查失败导入/写入不改会话/redo；通过 |

## 缺陷与浏览器观察

R01 非法命名空间 QName、R02 路径回调重入、R03 自定义 viewBox 复制及 R04 SVG 分隔符问题，复现、修复及测试位置见 [系统回归记录](system-regression.md)。最后代码回归无未解决的阻断缺陷。

2026-10-13，Codex 内置浏览器，通过公开 HTTPS 地址读取 a4f84ae 中真实 CLI 保存的文件，查看可访问性内容及截图。file 协议受工具策略禁止，因此没有访问本地文件协议或启动代理绕过；以下均为已推送的仓库产物：

- [流程图](https://raw.githubusercontent.com/Scoyn-X/CLI_SVG_EDITOR/a4f84ae/doc/examples/flowchart.svg)：蓝/黄两个矩形、中文“开始”和“处理数据 v2”、黑色连接线；节点 2 恢复到 y=100，文字与组的布局一致。
- [嵌套变换](https://raw.githubusercontent.com/Scoyn-X/CLI_SVG_EDITOR/a4f84ae/doc/examples/nested.svg)：外组 translate(60,40)，右节点 translate(200,0) scale(0.8)，右框更小，白色 End 居中；transform/字体未丢失。
- [典型会话](https://raw.githubusercontent.com/Scoyn-X/CLI_SVG_EDITOR/a4f84ae/doc/examples/demo.svg)：白底、My Diagram、红圆、蓝框；圆的位置体现 redo，文本体现 undo 后原内容。
- [架构图](https://raw.githubusercontent.com/Scoyn-X/CLI_SVG_EDITOR/a4f84ae/doc/architecture.svg)：PlantUML 渲染成功，完整宽度截图检查 8 个模块、依赖箭头与两处待重构说明；宽屏图可横向查看。

人工预览只证明这些样例的视觉表现，不能替代历史、失败原子性和全部导入边界的自动测试。未执行跨浏览器像素比较或其他操作系统测试。

## 现有取舍

支持范围见 [svg-io.md](svg-io.md)。编辑以局部几何为准，不补偿重组后父变换/继承；快照复制完整文档，适合课程规模，未做大图性能基准。D03 分组位置、D05 历史清空/无变化、D06 路径、D07 单尺寸、D10 无文档 help 均为可修订假设。标签和截止时间只按用户后续授权处理。
