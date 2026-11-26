# Phase 2 验收证据

执行日期：2026-11-26。环境：Windows 11、VS Code 1.146.0、Node.js 24.11.0、npm 11.6.1。执行记录见 [集中验收清单](../../phase2-acceptance.md#人工验收执行记录2026-11-26)。

## VS Code（`../vscode/`）

| 文件 | 内容 |
| --- | --- |
| `v01-baseline.png` | 未加载扩展的普通窗口：三个样例条目均无标记 |
| `v02-badge.png` | 开发宿主：`example.svg` 带 `[]`，`notes.txt` 与目录 `folder.svg` 无标记 |
| `v02-badge-zoom.png` | 标记区域放大 |
| `v03-outline.png` | 快速大纲：`svg → g#flowchart → rect#start / g#labels → text / text#caption`，预览定位到 `text#caption` |
| `v04-1-state.png` | 未保存把 `id="start"` 改为 `start2` |
| `v04-2-state.png` | 删除 `</svg>` 后大纲显示 “No symbols found in document” |
| `v04-3-state.png` | 补回结束标签后大纲恢复 |

截图由开发宿主窗口直接捕获（`PrintWindow`），未做裁剪以外的编辑；样例目录使用 `vscode-extension/demo` 的只读副本。

## 哈希（本目录）

| 文件 | 内容 |
| --- | --- |
| `v05-hashes.txt` | 仓库样例与验收副本的逐文件 SHA-256，三个文件一致、差异 0 |

## CLI（`../cli/`）

| 文件 | 内容 |
| --- | --- |
| `c01-default.txt` | 默认装配：`dir`/`stats` 未注册、`create box` 报未知类型 |
| `c02-code-plugins.txt` | 方式 A 完整会话：目录、统计、历史、工作目录 |
| `c03-config.txt` | 方式 B 同一会话 |
| `c03b-only-dir.txt` / `c03c-only-stats.txt` | 单插件启用与禁用 |
| `c04-invalid-config.txt` | 非法配置后继续运行 |
| `c05-targeted-tests.txt` | 5 个文件 / 48 项定向测试 |
| `c05-phase1-replay.txt` / `c05-ab-replay.txt` | 六组 Phase 1 与 A/B 回放 |
| `c05-metrics-selftest.txt` | 指标算法 5 个夹具 |

## 复现

```powershell
npm ci
npm run check
npm --prefix vscode-extension ci
code --new-window --extensionDevelopmentPath="$PWD\vscode-extension" "$PWD\vscode-extension\demo"
node doc/transcript/phase1/replay.mjs dist/bootstrap/main.js
node doc/transcript/phase2/replay.mjs dist/bootstrap/main.js plugins.config.json
node scripts/phase2-metrics.mjs --self-test
```

CLI 会话按 [集中验收清单](../../phase2-acceptance.md) 的 C01–C05 步骤在固定目录中执行；配置与日志放在被列目录之外，避免污染 `dir` 输出。
