# Phase 1 CLI 回放基线

基线源码来自 `final` 对应的提交 `ba7b418cb5554d6e2a3c8e1d66f9940fb3c40e3a`。预期输出由该提交实际运行生成。

## 阶段 0 验证结果

2026-11-09，在 Windows 上用 `git archive` 导出 `final`，在隔离目录用本机缓存运行 `npm ci --offline --no-audit --no-fund`。Node.js 24.11.0、npm 11.6.1、Git 2.51.2.windows.1。完整 `npm run check` 通过，包含类型检查、lint、构建、依赖规则、21 个测试文件共 415 项，以及编译后装配检查。依赖检查覆盖 91 个模块和 288 条依赖，零违规。npm 提示环境中的 `http-proxy` 配置名未知，命令仍成功退出。

六组会话均正常退出，stderr 为空，共生成四份 SVG。独立再跑一遍，stdout、stderr、退出码、文件名与四份 SVG 均与快照一致。向对照进程的 stdout 追加一个字节时，比较器按预期失败并报告偏移。回放脚本单独通过 ESLint 检查。

## 输入与快照

| 输入 | 来源和覆盖范围 |
| --- | --- |
| `cli-1.txt` | Phase 1 §6 的 `typical.cli`，导入路径改为回放目录中的 `other.svg`，覆盖典型编辑、历史和补 id |
| `cli-1a.txt` | Phase 1 §6.1 A 的 `flowchart.cli`，覆盖嵌套组合、移动、撤销和保存 |
| `history.txt` | `history.cli`，覆盖历史屏障、redo 保留和 Phase 1 的未知 `box` 类型 |
| `tree-grouping.txt` | `tree-grouping.cli`，覆盖分组、解组和归属变更 |
| `tree-order.txt` | `tree-order.cli`，覆盖同级顺序、删除和历史 |
| `errors-and-io.txt` | 本阶段补充，覆盖未初始化 `help`、未知命令、失败读写后 redo、`show`、`scale` 及嵌套 SVG 往返 |

`inputs/` 只含命令和注释。`fixtures/` 保存运行前的文件，`expected/results.json` 记录每个进程的 stdout、stderr、退出码及生成文件名，`expected/svg/` 保存 SVG 原始字节。stdout 保留 `svg>` 提示符及 EOF 前的空格，JSON 字符串解码后以 UTF-8 字节比较。

## 比较候选版本

在仓库根目录执行，指向已构建且已关闭 Phase 2 可选插件的 CLI。

```powershell
npm run build
node doc/transcript/phase1/replay.mjs dist/bootstrap/main.js
```

每个会话使用独立的工作目录和夹具。比较范围包含 stdout、stderr、退出码、生成文件名和 SVG 内容。字节不符时报告第一个差异的位置。`--capture <new directory>` 用于在独立构建的 `final` 上复现取证，写入新目录供核对。候选版本验收使用默认比较模式。

程序回放与完整 `npm run check` 一起使用。运行测试还覆盖默认保存路径等需要状态断言的边界。Phase 2 双装配一致性单独验证，见 [Phase 2 工作指南](../../phase2-work-guide.md)。
