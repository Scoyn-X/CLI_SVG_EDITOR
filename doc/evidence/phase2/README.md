# Phase 2 生产插件验证证据

验证日期：2026-11-17。候选源码提交：d48ae4cac68f2215ccd2e473ed1030278a6973b6。固定基线 final 为 ba7b418。测试命令的原始输出保存在同目录文本文件。

| 命令 | 输出文件与结果 |
| --- | --- |
| npm run check | check.txt：26 文件 / 428 项；121 模块 / 381 依赖零违规 |
| npm --prefix vscode-extension test | vscode.txt：4 项通过 |
| node doc/transcript/phase1/replay.mjs dist/bootstrap/main.js | phase1.txt：六组 OK，四份 SVG 字节一致 |
| node doc/transcript/phase2/replay.mjs dist/bootstrap/main.js plugins.config.json | assembly.txt：六组 A/B OK |
| node scripts/phase2-metrics.mjs --self-test | metrics-self-test.txt：五个夹具通过 |
| node doc/transcript/phase2/production.mjs | production.txt：三个标签组合、版本 B A/B 均通过 |

## 提交边界

box：C=b57329040f25beed9d0aca6fb17a0abde98dd819。modified-star：C=7c0a4d53e15354498b14a8e591ba17def9ff75c7。两次均采用配置接入。测试文件验证相应插件，配置列出启用模块；运行代码仅新增插件包。

分别执行 git diff --name-status C^ C，原始输出为 box-names.txt 和 modified-star-names.txt。git cat-file -e C:src/plugins/box（或 modified-star）确认路径存在。分别执行：

```powershell
git diff b573290^ b573290 -- src ':(exclude)src/plugins/box'
git diff 7c0a4d5^ 7c0a4d5 -- src ':(exclude)src/plugins/modified-star'
```

输出 box-core.txt 和 modified-star-core.txt 均为 0 字节。后续 d48ae4c 完成代码装配、导入属性校验与 A/B 测试集合同步，内核、渲染器、加载器和 stats/dir 保持不变。

## 验收范围

自动证据覆盖生产插件、加载器、历史、序列化、默认兼容和两种装配。VS Code 原生 Outline 操作及截图使用集中验收清单中的人工项目记录。按本次任务约束，p2 标签不创建；当前源码指标以候选提交复算。

## 方式 A：独立代码装配接入

演示分支 demo-assembly-a 从 d0fd1fa 建立，接入提交 C=937dbb32d52a909fb074c0493a5bbdc4ad1e6100。box 包逐文件与主线 d2722d5 完全一致。运行代码新增 src/plugins/box，仅修改 src/bootstrap/CodePlugins.ts，按 stats、dir、box 顺序激活。两个测试文件分别验证 box 与同步后的 A/B 插件集合。

原始证据位于 assembly-a/：names.txt 为 git diff --name-status C^ C；outside-box.txt 为 git diff C^ C -- src ':(exclude)src/plugins/box'，只包含 CodePlugins.ts；它是方式 A 唯一允许修改的顶层装配文件。进一步排除该文件后的 protected.txt 为 0 字节。git cat-file -e C:src/plugins/box/Box.ts 的 stdout/stderr 均为空，cat-file-exit.txt 为 0。

check.txt 记录完整检查：25 文件/427 项通过；phase1.txt 为六组字节回归。comparison.txt 为八组 A/B 比较，包括版本 B 与 stats/dir 会话。比较双方均加载 stats、dir、box，主线 B 关闭 modified-star，工作目录与夹具逐次还原。每次的原始 stdout/stderr 单独保存，比较同时核对退出码、产物名称与 SVG 字节。

复算（在主线仓库根目录）：

```powershell
node doc/evidence/phase2/assembly-a/compare.mjs <演示分支构建入口> dist/bootstrap/main.js
```

该独立提交是方式 A 的接入边界证据；d48ae4c 记录主线集成与验证。

## 第 005 轮审核整改验证

候选源码 53614aa，完整检查 26 文件/449 项通过。整改后的 Phase 1、A/B、生产回放、扩展测试与指标夹具输出保存于 round005-fixes/。逐项处理见 [整改记录](../../phase2-review-fixes.md)。本页前述 d48ae4c 和方式 A 的原始记录保留其对应版本。
