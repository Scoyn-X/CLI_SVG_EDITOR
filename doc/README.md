# CLI SVG Editor — Phase 1 项目文档

本项目是软件设计课程的 SVG 命令行编辑器，使用 TypeScript 和面向对象设计，通过 REPL 完成文档读写、图形编辑、结构调整与撤销重做。课程 Phase 1 的六种内置图形和 19 个命令已实现，持续测试、独立系统验收及审查跟进均已完成。

本文件是课程要求的 `doc/README.md`，集中说明架构、AI 协作中的关键迭代、一致性自查和质量保证。以项目负责人视角展开的补充报告见 [Report.md](Report.md) 和 [Report.pdf](Report.pdf)。需求依据为 [phase_cli_1.md](../phase_cli_1.md)，未明确语义的工程选择见 [决策记录](decisions.md)。

文档更新：2026-10-20。实现与完整测试基线：`04cc97e`；此后的报告与 README 整理未改变代码、测试或依赖。

## 目录

- [项目概况与运行](#项目概况与运行)
- [架构方案](#架构方案)
- [过程记录](#过程记录)
- [一致性自查](#一致性自查)
- [质量保证手段](#质量保证手段)
- [交付与文档索引](#交付与文档索引)

## 项目概况与运行

### 环境与启动

需要 Node.js `>=24.11.0 <25`、npm `>=11 <12`。在仓库根目录执行：

```sh
npm ci
npm run check
npm run cli
```

项目使用 TypeScript strict、Vitest、ESLint 和 dependency-cruiser；SVG 解析使用 `@rgrove/parse-xml`。具体版本由 `package-lock.json` 固定。`npm run check` 依次执行类型检查、lint、构建、依赖检查、测试和编译后运行时组装检查。

进入 `svg>` 提示符后，可输入以下命令：

```text
init 800 600
create g node
create rect start 120 100 160 60 #4a90d9 in node
create text label 155 135 "开始" in node
tree
move node 0 100
undo
redo
save demo.svg
```

保存的 SVG 可直接在浏览器中打开；输入结束符 EOF 退出。逐行脚本回放及 Windows 使用说明见 [development.md](development.md)。

### 功能范围

| 类别 | 已实现内容 |
| --- | --- |
| 图形 | `rect`、`circle`、`ellipse`、`line`、`text`、`g`；所有类型的 `create` 均支持尾缀 `in <containerId>` |
| 文档命令（4 个） | `init`、`read`、`save`、`canvas` |
| 编辑命令（10 个） | `create`、`delete`、`move`、`scale`、`set`、`group`、`ungroup`、`addto`、`front`、`back` |
| 显示命令（3 个） | `tree`、`show`、`help` |
| 历史命令（2 个） | `undo`、`redo` |

图形通过唯一、大小写敏感的 id 定位。每条成功编辑构成一个撤销单元，失败不改变文档、路径、id 分配或历史。`tree/show/help` 和无参数 `canvas` 不进入历史；成功的文档操作建立历史屏障，下一条成功编辑解禁。细则见 [命令与历史](command-history.md)。

本阶段不实现 `box`、插件加载或 GUI。SVG 读入采用明确的受支持子集；不支持的元素或属性报错，避免静默丢失数据。具体范围见 [svg-io.md](svg-io.md)。

## 架构方案

### 模块划分与依赖方向

生产代码分为八个模块。领域对象维护自身规则，应用层组织用例，外部输入输出通过端口和适配器连接；入口只负责注册和组装。

| 模块 | 职责 | 允许依赖及理由 |
| --- | --- | --- |
| `src/domain` | `Shape/LeafShape`、六类图形、`SvgDocument/ShapeTree`、几何与属性校验、描述与复制、树不变量 | 仅自身；领域规则独立于终端、文件和 XML |
| `src/application` | 19 个命令、`EditorSession`、历史与快照、命令分发、共享图形工厂、结果协议 | `domain`、`ports`、自身；通过协议访问外部能力 |
| `src/ports` | 存储、SVG 编解码、图形创建与导入接口，以及中立导入数据 | `domain`、自身；不绑定 Node 或 XML 库 |
| `src/adapters/cli` | 分词、控制器、REPL、提示符、错误与树形输出 | `application`、`domain`、自身及 Node 终端能力；消费用例和只读描述 |
| `src/adapters/svg` | 严格 XML/命名空间校验、候选补 id、通用序列化 | `ports`、`domain`、自身及 XML 库；不依赖应用层或另建类型表 |
| `src/adapters/files` | 路径解析、UTF-8 读写、安全临时文件替换 | `ports`、自身及 Node 文件/路径能力；不决定历史规则 |
| `src/adapters/shapes` | 六类 Provider 的参数、帮助语法和 SVG 构造 | `ports`、`domain`、自身；不持有全局会话 |
| `src/bootstrap` | `EditorComposition` 注册与注入、运行环境及入口 | 各生产模块及 Node；集中组装，不实现图形算法 |

以下为已渲染的 PlantUML 组件图，箭头表示允许的模块依赖；[图源](report-architecture.puml) 与 [横向版本](architecture.puml) 描述相同的八模块及依赖关系。

![模块依赖组件图](report-architecture.svg)

依赖规则同时写入 [dependency-cruiser.config.json](../dependency-cruiser.config.json)，检查循环、未解析 import、越界依赖及生产代码导入测试/开发工具，类型导入也受约束。领域层不得依赖应用层或适配器，应用层不得依赖具体适配器。

测试按 domain/application/adapters/integration/e2e/architecture/bootstrap 分层，fixtures 提供可重复输入；`doc` 保存文档、图源和示例。`node_modules/dist/artifacts/coverage` 是忽略产物，不作为课程源码提交。

### 设计模式与实际落点

| 模式 | 实现落点与作用 | 取舍 |
| --- | --- | --- |
| Command | `Command/EditCommand` 与具体命令；编辑统一经过 `EditorSession.edit` | 一条编辑对应一个历史单元，复杂树操作也只需一次撤销 |
| Composite | `Shape/Group` 统一几何与属性操作，文档统一受控删除；容器多态准备子孙变换 | 不按类型名判断叶子/容器；组样式设置自身，保留 SVG 继承 |
| Memento | `DocumentMemento/HistoryEntry` 保存独立的编辑前后领域副本 | 单次完整复制 O(N)，H 条历史占用 O(H×N)；优先保证精确恢复 |
| 工厂与提供者 | 同一 `ShapeFactory` 为 CLI 创建和 SVG 导入查找 Provider | 各提供者负责自身构造与校验，避免重复标签映射 |
| Adapter 与依赖倒置 | 文件/XML/CLI 适配器实现或消费内层协议；显示通过多态描述输出 | 外部技术变化不传入领域对象，显示无需比较图形类型名 |

按课程要求，两处按名字分派明确标记为**待重构**：`CommandDispatcher` 的命令名到实现、`ShapeFactory` 的类型名到 Provider。当前使用集中注册；后续插件阶段再考虑注册来源与生命周期。复制、SVG 输出、`tree/show` 和几何运算不另建名字分派。

### 状态、原子性与历史

`SvgDocument` 通过私有 `ShapeTree` 管理有序节点及全局 id/父级索引，维护单父级、无环、id 唯一和顺序一致性。结构变化经过受控操作，外部不能直接修改子列表。`Group` 的几何变换先准备全部子孙结果，全部通过后再应用，避免后部节点溢出造成部分修改。

编辑先复制当前文档，在候选上执行命令和准备反馈；成功后再准备独立发布副本、前后快照，最后发布并记录一条历史。失败不暴露候选变化。`undo/redo` 恢复独立快照，`redo` 不重跑命令、不重新调用工厂或访问文件；撤销不靠逆运算消除浮点误差。

`read` 在会话锁内完成路径解析、读入、XML 校验和补 id，成功后一起发布文档、路径、警告及历史屏障。`save` 在同目录独占创建临时文件，完成写入、flush、关闭和 rename 后才更新会话；失败不预先删除旧文件。`init` 清除读入路径，显式另存不改变读入路径。

成功的 `init/read/save` 和修改尺寸的 `canvas` 清空旧历史并禁止撤销重做，下一次成功编辑解禁；查询不改变历史。描述和值对象保持只读，历史使用领域复制，不将 XML 或类实例的 JSON 转换作为快照。

### 变化点与设计边界

| 可能变化 | 当前设计与暂不实现的部分 |
| --- | --- |
| 新图形与复合图形 | 共享 Provider/Factory，区分可容纳与可解散能力；`data-kind` 可保留，但读回普通 `g` 不恢复插件能力。测试探针只验证扩展边界，不注册生产 `box` |
| 新命令或其他入口 | 应用命令与会话可复用，CLI 语法/显示隔离；当前编辑摘要是英语字符串，多语言需要更中立的反馈协议 |
| XML 或存储实现 | `SvgCodec/DocumentStorage` 可替换；同步 IO 满足当前 REPL，未来异步化须维持串行发布 |
| 大文档与历史成本 | 快照已封装，但仍直接构造具体 Memento；未根据性能证据引入增量快照、历史裁剪或事件溯源 |
| 更广 SVG 支持 | 受控保留 translate/scale、字体及画布元数据；不承诺完整 CSS、路径、字体排版或重组后的世界坐标补偿 |

未明确的语义作为可修订工程假设记录：跨父级 `group` 使用共同父级、原前序与最早分支位置（D03）；无变化的成功编辑仍入历史（D05）；默认保存路径生命周期（D06）；单尺寸参数（D07）。重组可能改变变换或样式继承后的视觉，目前不做补偿。

未 `init/read` 时 `help` 仍按 §4.2 的前置条件拒绝执行，但与启动横幅提示存在体验上的矛盾，列入 D10 待确认。上述选择不表述为已经获得课程方确认。

## 过程记录

开发采用“先分析需求与设计、分步实现、持续验证、独立系统回归”的流程。AI 辅助研究、生成代码和测试、分析失败及整理记录；项目负责人负责范围、架构取舍、验证要求和审查意见筛选。AI 输出和审查结论都需要与需求、实现及实际证据对照。

以下选取对架构或验证方法有影响的迭代，完整阶段记录见 [roadmap.md](roadmap.md)，逐次改动见 [iteration-notes.md](iteration-notes.md)。

| 关键问题 | 判断与修改 | 形成的依据 |
| --- | --- | --- |
| 如何借鉴已有编辑器 | 参考 SVG-Edit 的编辑内核/UI 分离、Fabric.js 的类型注册和 tldraw 的历史单元；根据课程约束选择共享工厂与多态，而非直接引入框架 | 未复制上述项目代码或将其作为依赖；CLI、导入和显示避免重复类型分派 |
| 最初计划缺少独立测试环节 | 项目负责人复核计划后补充“持续测试 + 独立系统验收”，将交付置于回归之后 | 建立 A01—A30 需求索引和 S01—S08 关键场景，测试不集中拖到最后 |
| 递归修改可能破坏原子性 | 后出现的子孙溢出会留下前部修改；命令保留候选引用也可能绕过会话封装 | 几何采用准备/应用两阶段，发布额外复制，测试溢出、引用隔离及失败保留 redo |
| 外部 SVG 不能静默简化 | 背景示例含变换、字体和 viewBox；读入后丢弃元数据会改变图像 | 明确支持子集，受控保留元数据并拒绝未知内容；XML 库兼容性问题通过替换实现解决，未放宽 strict 检查 |
| 系统测试发现边界缺陷 | XML Name 校验不足以覆盖非法 QName；路径解析回调位于 read 锁外 | 修复并保留回归用例，验证失败不改变文档、路径、历史或补 id 状态 |
| 扩展测试通过不等于数据保持 | 审查探针只证明提供者被调用，实际构造了默认子树，未证明导入真实输入 | 改用区别于默认模板的 id、顺序、属性与文本，验证嵌套、空子树、往返降级及失败状态 |
| 审查结论也需要核验 | 历史分支停留旧提交被误判为整改未推送 | 核对真实远程默认/整改分支 SHA，补勘误并保留原报告，避免改写历史证据 |
| 最后显示层修复应限制范围 | 修正 `tree` 同级列对齐及单目标 `group` 的 `1 child`，保留显式 stroke 和 XML 属性顺序 | 先复现旧输出，再补精确显示及 undo/redo 断言；八套回放仅有预期差异，四份 SVG 字节不变 |

多轮审查促进了代码与测试修订，但开发侧自动复核不等同于第三方独立审查。旧报告保留其当时基线和测试数量，勘误及增量另行记录，避免把计划、历史结果或方法调用次数写成当前功能正确性的证明。

## 一致性自查

| 检查项 | 实际结果与依据 |
| --- | --- |
| 模块与目录 | 八模块均有实际实现，与上述方案一致；85 个生产源码文件，77 个同名类、7 个接口及 main 入口。历史管理在应用层，IO 在适配器，新增描述/协议已同步入文档 |
| 依赖方向 | 最近完整检查覆盖 91 模块、288 条依赖，0 违规；包含 XML 库模块，类型导入同样受检 |
| 依赖抽查 | `EditorSession/ReadCommand/SaveCommand` 使用 ports/domain；`XmlSvgCodec` 使用 ports/domain/XML 库；`NodeDocumentStorage` 使用 ports/Node；`CliPresenter` 使用 application/domain；Provider 使用 ports/domain |
| 命名分派与模式 | 名字查找集中于 `CommandDispatcher.commands.get` 和 `ShapeFactory.providers.get`；bootstrap 负责注册，复制/显示/序列化使用多态 |
| 代码规范 | `SourceConventionChecker` 检查一类一文件、封装、顶层函数和明显类型分派，并用正负例验证扫描器；结合源码抽查判断设计，不声称静态扫描证明全部语义正确 |

图源与渲染图已生成并检查，本文纵向图与原横向图的依赖关系一致。需求原文与首次讨论保持原样；后续修订通过决策和增量记录追踪。完整规则与检查方法见 [testing.md](testing.md)。

## 质量保证手段

### 功能完整性与回归

功能验收以 [acceptance.md](acceptance.md) 的 A01—A29 和 S01—S08 映射为基础，覆盖六种图形、19 个命令、规定错误与典型流程；A30 单独追踪 Git 和标签交付。重点验证以下可观察行为：

- 几何与属性白名单、样式缺省和继承、嵌套容器及有序树不变量。
- 删除、分组、归属调整与 z-order 的单条撤销单元，恢复原父级、顺序、属性和 id 索引。
- 失败保留 redo，新成功编辑清空 redo，文档屏障与查询不入历史。
- 补 id 避开全文档已有 id；读入失败不泄漏警告或消耗分配状态。
- XML 命名空间、转义、特殊文本、受支持元数据、读写往返及真实文件失败。
- CLI 引号、空文本、颜色中的 `#`、`in` 子句、错误行、树列对齐和历史摘要。

往返测试比较结构与属性语义，包括属性是否存在；撤销测试比较原值与结构。真实 CLI 测试独立编译当前源码，避免误用旧构建产物。

### 已执行验证与限制

`04cc97e` 的 `npm run check` 完整通过，结果如下；本次 README 整理没有代码变化，不重复运行相同测试。

| 检查 | 结果 |
| --- | --- |
| TypeScript strict、ESLint、生产构建 | 通过，lint 零警告 |
| 依赖方向 | 91 模块 / 288 条依赖 / 0 违规 |
| 自动测试 | 21 个文件 / 415 项通过 |
| 编译后运行时组装 | 通过 |
| 显示修复后的真实 CLI 回放 | 八套与修复前对比，仅有预期对齐和单复数变化 |
| 保存产物对比 | 四份 SVG 与修复前逐字节一致 |

最新测试说明及审查增量见 [testing.md](testing.md)、[iteration-notes.md](iteration-notes.md)。首次系统交付的 [test-report.md](test-report.md) 保留当时的 376 项结果及浏览器观察，属于历史报告，不代表当前测试总数。

浏览器检查覆盖实际生成的 [流程图](examples/flowchart.svg)、[典型会话](examples/demo.svg)、[嵌套变换](examples/nested.svg) 及架构图；图像检查只支持这些样例的展示结论，不能替代历史和错误分支测试。未设置虚构覆盖率，未配置 CI，也未声称跨平台或大图性能已经验证。

当前保留边界包括受控 SVG 子集、快照内存成本、重组后的局部坐标/继承语义，以及 D10 的 `help` 前置条件。树列宽按 JavaScript 字符串长度计算，不额外处理所有 Unicode 终端显示宽度；示例文字排版不承诺与每一处 transcript 逐字相同。

## 交付与文档索引

代码、测试和文档通过分步 Git 提交保留真实开发过程。课程平台截图给出的截止时间为 **2026-10-25 23:59**。`final` 标记包含本次 README 整理、修改后报告及 PDF 的交付版本；标签更新过程见 [增量记录](iteration-notes.md)。后续分支提交或 push 不会自动移动标签。

| 文档 | 用途 |
| --- | --- |
| [Report.md](Report.md) / [Report.pdf](Report.pdf) | 补充课程报告，采用项目负责人视角叙述架构思考和关键迭代 |
| [development.md](development.md) / [cli.md](cli.md) | 环境、运行、脚本回放及命令交互 |
| [domain-model.md](domain-model.md) / [command-history.md](command-history.md) / [tree-editing.md](tree-editing.md) / [svg-io.md](svg-io.md) | 各部分设计与实现细节 |
| [decisions.md](decisions.md) / [iteration-notes.md](iteration-notes.md) | 工程假设、修改原因及逐次增量 |
| [testing.md](testing.md) / [acceptance.md](acceptance.md) | 测试安排、需求映射和关键验收场景 |
| [roadmap.md](roadmap.md) / [historical-checks.md](historical-checks.md) / [delivery.md](delivery.md) | 工程里程碑、历史验证及交付记录 |

GitHub 仓库：[Scoyn-X/CLI_SVG_EDITOR](https://github.com/Scoyn-X/CLI_SVG_EDITOR)。已发布交付快照：[final](https://github.com/Scoyn-X/CLI_SVG_EDITOR/tree/final)。
