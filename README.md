# CLI SVG Editor

软件设计课程项目：使用 TypeScript、面向对象和 Command 模式构建 SVG 命令行编辑器。

仓库：[Scoyn-X/CLI_SVG_EDITOR](https://github.com/Scoyn-X/CLI_SVG_EDITOR)。

## 当前状态

**阶段 2：工程基础初始化。已建立 TypeScript 工具链和模块目录，尚未实现 SVG CLI。**

| 项目 | 状态 |
| --- | --- |
| 架构、依赖规则、设计模式和变化点 | 已形成设计基线，见课程文档 |
| 需求决策和验收清单 | 已编写；教师未确认的事项明确标注 |
| 文档基线 | 已提交并推送：36c2055，分支 docs-architecture-and-testing-plan |
| 工程基础 | Node.js 24、TypeScript strict、ESLint、Vitest、依赖检查及锁文件已建立 |
| 业务功能 | 图形、命令、SVG 读写及 REPL 尚未实现 |
| 当前工作分支 | chore-typescript-tooling；工程初始化完成，35 文件提交清单已获用户确认 |
| final 标签 | 未授权创建，截止时间尚未提供 |

## 工程检查

使用 Node.js `>=24.11.0 <25` 和 npm 11，首次安装或按锁文件恢复依赖：

```sh
npm ci
npm run check
```

`check` 依次执行类型检查、lint、构建、生产代码依赖检查、自动测试与编译后启动验证。独立检查及工具版本见 [开发说明](doc/development.md)。启动验证只输出工程就绪信息；`npm run cli` 待真正的 REPL 实现后提供。

## 文档入口

- [正式课程文档](doc/README.md)：架构方案、过程记录、一致性自查、质量保证手段。
- [需求与设计决策](doc/decisions.md)：明确规则、暂定语义与待确认范围。
- [验收清单](doc/acceptance.md)：需求对应的检查项和关键操作序列。
- [测试计划](doc/testing.md)：持续测试、独立系统测试阶段、退出条件与报告要求。
- [开发说明](doc/development.md)：环境、依赖、可运行命令和检查边界。
- [阶段路线与提交计划](doc/roadmap.md)：每阶段完成内容、验收和拟提交内容。
- [架构图源文件](doc/architecture.puml)：PlantUML 组件图，与课程文档内嵌图一致。
- [协作规范](agent.md)：包括持续生效的 Git 权限。
- [课程需求原文](phase_cli_1.md)、[第一次设计讨论](think1.md)：保持原文的来源副本。

## 第一阶段功能目标

内置 `rect / circle / ellipse / line / text / g`，通过唯一 id 定位图形，支持层级编辑、几何与属性编辑、SVG 读写、结构显示和撤销重做。

`box` 和插件加载属于后续课程阶段，本阶段拒绝 `create box`。GUI、协同编辑及通用 SVG 全格式支持不属于已承诺功能。当前导入范围的未决事项见需求决策文档。

## 开发约定

工程已建立 `src/domain`、`src/application`、`src/ports`、`src/adapters`、`src/bootstrap` 和分层测试目录。空目录使用 `.gitkeep` 保留；只有启动环境检查有源码，领域与应用代码待相应阶段实现。

每阶段同步更新实现、必要验证和课程文档。每次提交前列出 add 清单，用户明确确认后才暂存并提交。提交信息为 `类型 - 一句话说明工作内容`，任务分支为 `类型-英文短描述`；push 与标签按授权范围执行，具体见协作规范。

测试贯穿开发阶段，并在功能完成后安排阶段 8“系统测试与回归验收”；最终交付顺延为阶段 9。该安排目前是计划，业务测试尚未执行。
