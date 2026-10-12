# CLI SVG Editor

软件设计课程项目：使用 TypeScript、面向对象和 Command 模式构建 SVG 命令行编辑器。

仓库：[Scoyn-X/CLI_SVG_EDITOR](https://github.com/Scoyn-X/CLI_SVG_EDITOR)。

## 当前状态

**阶段 5：正在完善树编辑；分组、解组和归属已接通，删除与顺序调整为本阶段下一单元。**

| 项目 | 状态 |
| --- | --- |
| 架构、依赖规则、设计模式和变化点 | 已形成设计基线，见课程文档 |
| 需求决策和验收清单 | 已编写；教师未确认的事项明确标注 |
| 文档基线 | 已提交并推送：36c2055，分支 docs-architecture-and-testing-plan |
| 工程基础 | 6a60d87 已推送至 chore-typescript-tooling；构建与质量检查可运行 |
| 领域模型 | 六种图形、画布、树/id 索引及深复制；6bd9a43 已推送至 feature-domain-model |
| 编辑流程与历史 | 4e2bfbc 已推送至 feature-command-history；候选执行、快照、屏障及副本隔离已实现 |
| 当前 CLI | init/canvas/create/move/scale/set/group/ungroup/addto/undo/redo/help；六种图形及 in 可回放 |
| 本阶段待续 | delete/front/back 及其完整结构/顺序恢复 |
| 后续功能 | read/save、tree/show 及完整系统验收 |
| 当前工作分支 | feature-tree-editing；本轮两个提交清单已确认，授权依次提交及推送 |
| final 标签 | 未授权创建，截止时间尚未提供 |

## 工程检查

使用 Node.js `>=24.11.0 <25` 和 npm 11，首次安装或按锁文件恢复依赖：

```sh
npm ci
npm run check
```

`check` 依次执行类型检查、lint、构建、生产代码依赖检查、自动测试与编译后组装验证。独立检查及工具版本见 [开发说明](doc/development.md)。

启动最小 CLI：

```sh
npm run cli
```

例如依次输入 `init`、`create circle c1 100 100 20 red`、`move c1 30 0`、`undo`、`redo`。输入结束（EOF）正常退出；尚未实现的命令暂报 unknown command，不能据此视为最终产品行为。可回放脚本见 [history.cli](tests/fixtures/history.cli)。

## 文档入口

- [正式课程文档](doc/README.md)：架构方案、过程记录、一致性自查、质量保证手段。
- [需求与设计决策](doc/decisions.md)：明确规则、暂定语义与待确认范围。
- [验收清单](doc/acceptance.md)：需求对应的检查项和关键操作序列。
- [测试计划](doc/testing.md)：持续测试、独立系统测试阶段、退出条件与报告要求。
- [开发说明](doc/development.md)：环境、依赖、可运行命令和检查边界。
- [领域模型说明](doc/domain-model.md)：实际类职责、调用入口、树不变量、复制与原子性。
- [命令与历史说明](doc/command-history.md)：状态机、快照隔离、最小 CLI 范围及阶段 4 验证。
- [树编辑说明](doc/tree-editing.md)：分组位置、归属/解组不变量和本阶段恢复验证。
- [阶段路线与提交计划](doc/roadmap.md)：每阶段完成内容、验收和拟提交内容。
- [架构图源文件](doc/architecture.puml)：PlantUML 组件图，与课程文档内嵌图一致。
- [协作规范](agent.md)：包括持续生效的 Git 权限。
- [课程需求原文](phase_cli_1.md)、[第一次设计讨论](think1.md)：保持原文的来源副本。

## 第一阶段功能目标

内置 `rect / circle / ellipse / line / text / g`，通过唯一 id 定位图形，支持层级编辑、几何与属性编辑、SVG 读写、结构显示和撤销重做。

`box` 和插件加载属于后续课程阶段，本阶段拒绝 `create box`。GUI、协同编辑及通用 SVG 全格式支持不属于已承诺功能。当前导入范围的未决事项见需求决策文档。

## 开发约定

工程已建立领域、应用、协议、CLI、图形提供者和启动组装；SVG 与文件适配器仍为规划目录。类各在同名文件中，领域不依赖应用和外部 IO。

每阶段同步更新实现、必要验证和课程文档。每次提交前列出 add 清单，用户明确确认后才暂存并提交。提交信息为 `类型 - 一句话说明工作内容`，任务分支为 `类型-英文短描述`；push 与标签按授权范围执行，具体见协作规范。

测试贯穿开发阶段，并在功能完成后安排阶段 8“系统测试与回归验收”；最终交付为阶段 9。当前检查结果和数量见 [课程文档](doc/README.md#8-v07-树编辑检查)，不代表完整课程验收已完成。
