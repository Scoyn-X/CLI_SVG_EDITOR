# 命令、会话与历史实现

阶段 4 基线，2026-10-12；4e2bfbc 已推送至 feature-command-history。阶段 5 在现有候选/快照机制上增加树编辑，见 [tree-editing.md](tree-editing.md)；阶段 6—9 已按用户授权自动完成并提交推送，旧清单确认门槛已取消。

## 当前范围

已实现 Command、会话、候选执行、Memento 与历史屏障，并贯通最小 CLI。当前注册全部 19 个命令，create 支持六种内置图形及末尾 in，box 保持规定未知类型错误。帮助只列实际注册的命令。

阶段 4 当时没有树编辑；阶段 5 已接入 delete/group/ungroup/addto/front/back 并验证完整历史恢复。阶段 6 已完成真实 SVG/read/save 和文件替换，阶段 7 已完成 tree/show、完整帮助和 transcript，阶段 8 已实际验收，详见 svg-io.md/cli.md/test-report.md。

## 实际职责与依赖

| 位置/对象 | 职责 |
| --- | --- |
| application/Command、EditCommand | 共同执行契约；编辑统一委托会话候选执行，具体命令只修改候选文档 |
| Init/Canvas/Create/Move/Scale/Set/Undo/Redo/HelpCommand | 当前具体用例；文档、查询和历史命令不走编辑入栈路径 |
| EditorSession | 拥有当前文档、读入路径和私有 HistoryManager；只对外提供不可变描述与受控操作 |
| DocumentMemento、HistoryEntry | 封装独立的前/后文档；恢复时再次多态复制，保存原反馈与撤销反馈 |
| HistoryManager、HistoryStatus | 两栈、显式屏障和不可变状态视图；准备恢复成功后才接受栈迁移 |
| CommandResult | 封装应用反馈及撤销反馈；不执行终端 IO，不带 svg> 或 error: |
| InputArgument、CommandArguments | 输入值和字面量标记、参数读取与 in 尾缀识别 |
| CommandRegistration、CommandDispatcher | 通用参数数量验证与唯一命令名查找 |
| ShapeFactory、ports/ShapeCreator、ShapeProvider | 唯一类型名查找与中立创建协议；当前接收创建值序列，不依赖 CLI token/XML DOM |
| adapters/shapes 的六种 Provider、BuiltinShapeProvider | 本类型参数数量、数值转换、可选 fill/stroke 和领域构造；不保存会话 |
| adapters/cli/Tokenizer、CliController、Repl | 引号/注释分词、统一 error: 边界、提示符及逐行终端 IO |
| bootstrap/EditorComposition、main | 注册提供者和命令、注入会话并启动 REPL；--check 只检查组装，不等待读入 |

依赖遵守原规则：应用只用领域/协议；图形提供者只用领域/协议；CLI 只用应用/领域及 Node 终端能力；具体依赖仅在 bootstrap 组装。唯一名字查找分别在 CommandDispatcher 和 ShapeFactory；注册语句集中组装，几何/复制/反馈不按图形标签分支。

SVG 读回与 create 复用工厂 provider 查找；提供者通过 SvgElement 中立协议构造，图形类型分派仍只有工厂一处。codec/storage 协议已有真实适配器，不实现插件加载器。

## 候选执行与恢复

编辑流程：读取当前文档 → 多态复制候选 → 具体 Command 修改候选并生成反馈 → 再复制发布文档 → 准备独立前/后 Memento → 记录单个历史条目并发布文档。任何准备失败都不触碰当前文档、路径、两栈和屏障。

发布时额外复制，是为了防止命令保留候选引用后修改会话。输入文档与快照也不能泄漏可写对象；描述冻结，旧视图不会随后续编辑改变。同步执行期间禁止重入会话修改；失败后 finally 释放执行锁。未来异步文件命令需在串行入口完成 IO，成功后再调用发布边界。

undo/redo 先获取待恢复条目，准备独立恢复文档及反馈，再移动两栈并替换文档。redo 恢复保存的后状态，不重新执行命令、调用工厂、分配 id 或访问文件。浮点值通过复制精确恢复，不使用减去增量/除以因子等逆运算。

快照目前只含文档。读入路径由会话管理，编辑命令不改变路径；init 清除路径，read 成功才替换路径。历史对象不放进领域文档。当前接受每次编辑 O(N) 复制、历史 O(H×N) 空间成本，不增加未经需求约定的历史裁剪。

## 历史状态机

按 [D05/D06](decisions.md) 的工程基线，未定义部分仍为暂定，不冒充教师确认：

| 操作 | 历史行为 |
| --- | --- |
| 无文档时 undo/redo/编辑/查询 | no document. use 'init' or 'read' first |
| init 或 canvas 带参数成功 | 清空两栈并建立屏障 |
| readDocument / saveDocument 成功边界 | 路径解析、IO、反馈准备在执行锁内，成功后建立屏障 |
| 屏障中 undo 或 redo | undo not allowed after io command，区别于空栈 |
| 一条成功编辑，包括无变化编辑 | 一个前/后条目，解禁屏障，清空 redo |
| 编辑或文档修改失败 | 所有会话状态保持，失败不解禁或清空 redo |
| canvas 查询、help、空行及注释 | 不入栈，不改变历史或屏障 |
| 无屏障且栈空 | nothing to undo / nothing to redo |

## 最小 CLI 与展示取舍

`npm run cli` 先编译再启动；启动文案按题目，提示符 svg>，逐行处理，EOF 正常退出。命令失败输出规定单行 error: 并继续读取；未预期的程序异常终止进程并设置非零退出码。交互和管道均输出提示符，当前不增加 exit 命令或 shell 插值。

整行注释与颜色 # 分开；双引号保留空正文和字面量标记，仅解释双引号/反斜杠转义。只有 create 末尾未引用的 in 才是归属子句。语法/参数数量先检查，再由执行入口检查文档与标量/领域规则。类型专用参数数量和语义归提供者；完整可扩展 schema 在实际 CLI/SVG 需要时再增补。

为支持题目的 moved to/moved by，领域描述增加中立的只读 position 锚点：叶子通过 Geometry 声明的第一对 x/y 坐标提供，line 取首端点，Group 无自身锚点。MoveCommand 多态消费描述，不比较 rect/circle/g 类型名，也不让领域返回终端文本。

当前 CommandResult 采用已格式化的应用摘要；CLI 负责提示符与错误前缀，具体命令负责业务反馈措辞。该选择保证当前题目反馈和历史回显一致，但会限制未来多语言或图形入口的富结果；出现该需求时可扩充为中立反馈字段/策略，不引入按类型名分派。tree/show 已通过 CommandDisplay/Formatter 与 GeometrySummary 组织展示，应用不保存终端树线。

## 验证与剩余范围

- [应用测试](../tests/application/EditorSession.test.ts)：失败前/后发布原子性、redo、新编辑分支、无变化编辑、屏障、路径、浮点恢复、副本隔离和重入拒绝。
- [提供者测试](../tests/adapters/ShapeProviders.test.ts)、[分词测试](../tests/adapters/Tokenizer.test.ts)：六种创建、严格数值、缺省样式、未知类型、颜色/引号/Windows 路径。
- [集成测试](../tests/integration/EditorFlow.test.ts)：六种根/嵌套创建、文本 in、题目移动反馈、精确错误及最小流程。
- [真实进程测试](../tests/e2e/CliHistory.test.ts)：编译当前源码到忽略目录，回放 [history.cli](../tests/fixtures/history.cli)，验证输出/提示符、错误后继续、CRLF 和 EOF。

阶段 4 的检查数量见 [课程主文档](historical-checks.md#7-v06-命令与历史检查)，阶段 5 的新证据另行记录。阶段 6—8 已完成完整受支持 SVG 往返、浏览器预览及独立系统验收，当前真实报告见 test-report.md。


## 2026-10-13 阶段 6 更新

SVG 与真实文件 IO 已实现；read/save 复用共享 ShapeFactory 与会话发布边界，严格失败原子性、补 id、路径、屏障和受控元数据往返。实际类、支持范围、依赖选择及验证见 [SVG 与文件说明](svg-io.md)。历史阶段的“尚未实现”是当时状态，以本更新为当前状态。用户授权自动完成剩余阶段并逐步提交推送，本次明确不创建标签。


## 2026-10-13 阶段 7 更新

全部 19 条命令接通：tree/show 按不可变描述及多态显示协议渲染，help 包含六类完整语法。新增 GeometrySummary 不含终端字符串，不增加类型名分派；查询及失败查询保持历史。课程 transcript 与版本 A 通过真实进程回放并读回保存产物。职责及实际样例见 [完整命令行](cli.md)，阶段 8 接续独立系统验收。


## 首轮审查后接口清理

生产未使用的 establishIoBarrier 已删除；saveDocument 在写入回调成功返回后建立屏障，是实际 SaveCommand 使用的边界。测试验证写入前保留历史、成功后清空两栈，失败仍保持 redo。replaceDocument 用于已构造文档发布，readDocument 覆盖读取全程执行锁；增量见 [iteration-notes.md](iteration-notes.md)。
