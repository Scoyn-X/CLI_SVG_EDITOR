# 工程工作入口

开始工作前读取 [协作规范](agent.md)、[项目文档](doc/README.md)、[Phase 1 决策](doc/decisions.md)和[Phase 2 工作指南](doc/phase2-work-guide.md)。课程依据为 [Phase 1 原文](phase_cli_1.md)及同级附件目录中的 `../pj1-phase2/phase_cli_2.md`。

- 当前功能包括 Phase 1 的六种内置图形和 19 条命令、VS Code SVG 扩展，以及 CLI 插件框架与 stats/dir。
- 扩展接口、调用契约、装配与 ADR 见 [CLI 设计](doc/phase2-cli.md)；操作和验证步骤见 [验收清单](doc/phase2-acceptance.md)。
- 使用 TypeScript 和面向对象设计：一类一文件、字段封装、Command 和 Composite。按命令名和图形类型名的查找分别集中在分发器与图形工厂。
- 失败命令保留文档、路径、id 分配和历史；成功编辑对应一个 undo 单元。
- 实现、测试和文档同步更新，验证记录对应实际执行结果。
- 提交按功能与架构边界组织，格式为 `类型 - 一句话说明工作内容`。只暂存明确路径，按授权进行常规推送。
- 保留用户文件与无关改动。Phase 1 的 final 固定不动，Phase 2 的最终标签为 p2。

文件使用 UTF-8。工程文档直接说明问题、方法和效果，具体写作规范见 agent.md。
