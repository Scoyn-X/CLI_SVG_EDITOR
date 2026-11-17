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
