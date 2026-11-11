# Phase 2 工程工作指南

Phase 2 将 CLI 的变化点整理为稳定扩展契约，并通过独立插件提供新增能力。VS Code 扩展用于实践宿主注册与回调机制；CLI 保留 Phase 1 的命令语义，通过插件注册扩展图形、命令、属性和树显示。

## 工程入口

- [协作规范](../agent.md)：编码、提交和文档规则。
- [CLI 设计](phase2-cli.md)：扩展点、配置、目录适配器、ADR 和依赖图。
- [VS Code 扩展](phase2-vscode.md)：安装启动、宿主职责、模式分析和复用判断。
- [验收清单](phase2-acceptance.md)：操作步骤、预期结果和验证记录。
- [源码指标](../docs/metrics/README.md)：分类、统计口径及历史版本复算。

课程依据为 [Phase 1 原文](../phase_cli_1.md)和同级附件 `../pj1-phase2/phase_cli_2.md`。Phase 1 固定基线为 `final`（ba7b418cb5554d6e2a3c8e1d66f9940fb3c40e3a）。

## 功能与验证范围

| 模块 | 已实现能力 | 验证方式 |
| --- | --- | --- |
| VS Code 扩展 | SVG 文件标记、原生 Outline 层级与定位、编辑更新及 XML 恢复 | 4 项自动测试；开发宿主操作见验收清单 |
| CLI 框架 | 四扩展点、默认内置能力、A/B 装配、清单校验与注册回滚 | 框架探针、加载器及架构测试；Phase 1 字节回归 |
| 命令插件 | stats 深度优先统计；dir 工作目录列表和目录适配器 | 独立插件测试、替身和真实文件系统测试、A/B 进程比较 |
| 回归工具 | 六组冻结会话与四份 SVG；双装配回放 | 原始输出字节、退出码、产物名称及 SVG 字节比较 |
| 指标工具 | 文件职责、行数和函数圈复杂度，CLI 三类及单列 VS Code | Git 对象复算、五个计算夹具及同版本零增量检查 |

## 开发检查

在仓库根目录执行：

```powershell
npm run check
npm --prefix vscode-extension test
node doc/transcript/phase1/replay.mjs dist/bootstrap/main.js
node doc/transcript/phase2/replay.mjs dist/bootstrap/main.js plugins.config.json
node scripts/phase2-metrics.mjs --self-test
```

`npm run check` 串联类型检查、lint、生产构建、依赖规则、全部测试及编译后装配检查。真实 CLI 测试单独编译源码，避免读取旧 dist。插件错误场景同时检查后续命令可用性、注册回滚及文档历史。

Phase 1 回放使用独立临时目录，比较 final 的冻结输出。A/B 回放使用相同插件集合、顺序、选项、夹具和工作目录。dir 的配置与日志位于被列目录之外，目录内容在比较期间保持固定。产物写入 artifacts，避免覆盖项目样例和用户文件。

## 插件接入的变更边界

四类扩展通过公开契约协作，插件依赖领域抽象和扩展接口；加载器位于装配侧，按模块字符串解析插件。新增图形和标签应复用既有注册与调用路径。

接入记录以实际提交 C 为单位，检查 `git diff --name-status C^ C`：方式 A 新增插件并修改一个顶层装配文件；方式 B 新增插件并修改配置。测试、文档及依赖元数据变化逐项说明。核对比较路径存在后，排除新增插件目录，检查内核、加载器和既有插件的差异；标签接入同时检查渲染器。

## 后续功能与交付条件

| 功能 | 实施与验证重点 |
| --- | --- |
| box | 模板与派生 id、整体几何操作、fill/label 语义、单步历史、必要子件保护、坏结构拒绝及无插件读回降级；回放课程 §6.1 B |
| modified-star 与 (box) | 内容与干净基准比较、祖先传播、多标签顺序；覆盖保存、失败保存、undo/redo、新建与删除 |
| 课程交付 | 开发宿主验证证据、独立插件接入差异、完整回归、架构与 ADR、final 到 p2 的历史指标及同仓库 p2 标签 |

属性事务、读回降级和清单校验采用 [CLI ADR](phase2-cli.md#adr) 的实现契约。dirty 插件采用内容比较和祖先传播方案，具体状态机随插件实现验证。最终交付以功能、证据和 Git 引用共同核验。
