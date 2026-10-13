# CLI SVG Editor

软件设计课程的 TypeScript 面向对象 SVG 命令行编辑器。课程 Phase 1 的全部功能、测试及文档已完成，按阶段提交推送；本次按用户要求暂不创建 final 标签。

仓库：[Scoyn-X/CLI_SVG_EDITOR](https://github.com/Scoyn-X/CLI_SVG_EDITOR)。交付记录见 [doc/delivery.md](doc/delivery.md)。

## 运行

需要 Node.js >=24.11.0 <25 和 npm 11：

```sh
npm ci
npm run check
npm run cli
```

例如输入：

```text
init 800 600
create g node
create rect box 120 100 160 60 #4a90d9 in node
create text label 155 135 "开始" in node
tree
move node 0 100
undo
save demo.svg
```

保存后浏览器可直接打开 SVG；EOF 正常退出。所有图形按唯一、大小写敏感 id 定位。

## 功能与边界

- 六种图形：rect、circle、ellipse、line、text、g；create 均支持 in 容器。
- 文档：init/read/save/canvas；图形：create/delete/move/scale/set/group/ungroup/addto/front/back。
- 查询：tree/show/help；历史：undo/redo。19 个命令全部实现。
- 每条编辑一个撤销单元，失败不改变文档/路径/历史；成功文档命令建立历史屏障，后续新编辑解禁。
- 支持 SVG 嵌套与文本、样式存在性、受控 transform/字体/viewBox 保留；不支持内容明确拒绝。详细范围见 [SVG 与文件](doc/svg-io.md)。

box/插件、GUI 和完整 SVG 格式属于后续范围；跨父重组的局部坐标/继承取舍及其他未定义语义在 [决策记录](doc/decisions.md) 明确标为工程假设。

## 验证与样例

最后完整检查通过：20 个测试文件、376 项测试，类型/lint/构建/依赖/组装检查通过。已执行题目完整会话和版本 A 的真实 CLI 回放，以及浏览器 SVG 预览；详情见 [测试报告](doc/test-report.md)。

[流程图](doc/examples/flowchart.svg)、[典型会话导出图](doc/examples/demo.svg)、[嵌套变换](doc/examples/nested.svg) 是实际保存产物。[回放说明](doc/development.md) 包含 Windows 运行方法；[typical.cli](tests/fixtures/typical.cli)、[flowchart.cli](tests/fixtures/flowchart.cli) 为可重复脚本。

![实际 CLI 生成的流程图](doc/examples/flowchart.svg)

## 文档

- [正式课程文档](doc/README.md)：架构方案、过程记录、一致性自查、质量保证。
- [架构图源](doc/architecture.puml) / [渲染图](doc/architecture.svg)。
- [验收索引](doc/acceptance.md)、[测试计划](doc/testing.md)、[系统修复记录](doc/system-regression.md)。
- [阶段路线与提交记录](doc/roadmap.md)、[开发说明](doc/development.md)、[历史检查](doc/historical-checks.md)。
- [领域](doc/domain-model.md)、[命令与历史](doc/command-history.md)、[树编辑](doc/tree-editing.md)、[完整 CLI](doc/cli.md)。
- [协作规范](agent.md)、[课程原文](phase_cli_1.md)、[第一次设计讨论](think1.md)。

提交信息为“类型 - 一句话说明工作内容”，任务分支为“类型-英文短描述”。2026-10-13 用户授权自动完成本次剩余阶段并 commit/push，取消 add 清单确认；只暂存任务路径，不强推。标签本次明确不执行，截止时间尚未提供。
