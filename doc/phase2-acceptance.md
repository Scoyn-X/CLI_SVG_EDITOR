# Phase 2 集中验收

本清单覆盖 VS Code SVG 扩展、CLI 四个扩展点、加载器和 stats/dir。自动检查记录用于复算工程结果，开发宿主和终端操作用于核对界面与交互效果。

## 自动验证记录

验证日期：2026-11-26。环境：Windows，Node.js 24.11.0、npm 11.6.1。兼容基线为 final（ba7b418cb5554d6e2a3c8e1d66f9940fb3c40e3a），Phase 2 源码以交付提交为准（合并提交 `2e53fbf`，交付标签 `p2`）；人工验收执行记录见本文末尾。

| 检查 | 验证结果 | 证据入口 |
| --- | --- | --- |
| `npm run check` | 完整通过：26 文件 / 453 项，121 模块 / 381 依赖零违规 | typecheck、lint、build、architecture、test、runtime 全部通过 |
| Phase 1 字节级回归 | 六组均通过，四份 SVG 一致 | `node doc/transcript/phase1/replay.mjs dist/bootstrap/main.js`；比较 stdout/stderr、退出码、产物名称及原始字节 |
| A/B 双装配 | 六组旧会话及四份 SVG 字节一致；stats/dir 固定目录真实进程比较通过 | `node doc/transcript/phase2/replay.mjs dist/bootstrap/main.js plugins.config.json`；新增命令场景在 CliHistory 测试中 |
| 五文件定向检查 | 5 文件 / 48 项通过 | C05 的完整命令，含真实进程、框架探针、加载器、插件及 OOP 规范 |
| 扩展构建与测试 | 4 项通过 | `npm --prefix vscode-extension test`；VS Code API 替身测试，覆盖提供者行为 |
| import-only 包解析 | 定向 3 项通过 | `tests/bootstrap/PluginLoader.test.ts`，含 hook 释放断言 |
| 指标算法 | 5 个计算夹具通过；final 对 final 四类增量均为 0 | `node scripts/phase2-metrics.mjs --self-test`；`node scripts/phase2-metrics.mjs final final` |
| 源码指标报告 | 从 Git 历史生成 | `docs/metrics/phase2-current.md`；基线 final，目标为上述源码提交 |


## 提交验证记录

下列结果均来自对应提交内容导出的独立目录，依赖版本由锁文件固定。

| 提交 | 工程成果 | 检查结果 |
| --- | --- | --- |
| `7dc569d` | Phase 1 字节回归基线 | 完整 check：415 项；六组回放通过 |
| `999895f` | VS Code SVG 扩展 | 完整 check：415 项；扩展 4 项；六组回放通过 |
| `5ec0a55` | CLI 插件框架及 stats/dir | 完整 check：426 项；112 模块/351 依赖零违规；六组回放通过 |

## 一次验收的准备

在项目克隆目录的 PowerShell 终端执行：

```powershell
node --version
npm --version
npm run check
npm --prefix vscode-extension test
node doc/transcript/phase1/replay.mjs dist/bootstrap/main.js
$project = (Get-Location).Path
$extension = (Resolve-Path vscode-extension).Path
$before = Get-ChildItem "$extension\demo" -File -Recurse | Get-FileHash -Algorithm SHA256
$run = Join-Path $project ('artifacts\manual-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
New-Item -ItemType Directory -Path $run | Out-Null
```

依赖缺失时先在根目录和扩展目录分别 `npm ci` / `npm --prefix vscode-extension ci`。验收产物放 `$run`，与项目样例隔离。选定的课程截图及记录归档至 `doc/evidence/phase2/`。

截图须可辨识项目/开发宿主、输入与结果；每张图记录日期、VS Code/Node 版本、对应编号和实际结论。主题和布局可自由选择。失败时记录现象及复现步骤。

## VS Code：先普通窗口，再开发宿主

### V01 原生行为基线

1. 先用未启用本扩展的普通 VS Code 窗口打开 `vscode-extension/demo`。
2. 打开 example.svg；如为图像预览，使用 **Reopen Editor With… → Text Editor**。展开 Explorer 内的原生 **Outline / 大纲**。
3. 记录原有 Explorer 标记和 Outline 行为，并列出其他 XML/SVG 扩展及其影响。
4. 截图 `v01-before.png`：普通窗口、Explorer、SVG 文本和 Outline 同屏。

- [x] 已观察并记录普通窗口基线。

### V02 文件标记与内容保持

从上述 PowerShell 启动开发宿主：

```powershell
code --new-window --extensionDevelopmentPath="$extension" "$extension\demo"
```

1. 确认是 **Extension Development Host**。Explorer 同时显示 example.svg、notes.txt 和目录 folder.svg。
2. 预期只有 SVG 文件 example.svg 有 `[]`；notes.txt、folder.svg 目录和 inside.txt 不带此标记；名称没有被改写。`U` 表示 Git 未跟踪状态。
3. 若无标记，检查 Explorer **Decorations: Badges** 是否启用，并记录实际设置。
4. 截图 `v02-badge.png`：三种条目同时可见、扩展标记清楚、宿主身份可辨认。

2026-11-10 的开发宿主观察确认了文件标记效果。内容保持通过 V05 的前后哈希比较核对。

- [x] 已归档文件标记截图。
- [x] 文件名及操作前后哈希一致（见 V05）。

### V03 Outline 层级与点击定位

在同一个开发宿主把 example.svg 以文本打开并展开 Outline：

```text
svg
└─ g#flowchart
   ├─ rect#start
   └─ g#labels
      ├─ text
      └─ text#caption
```

预期根、嵌套容器、叶子均出现，无 id 的 text 不被补 id。点击 rect#start，编辑器定位到第 3 行标签名附近；点击 text#caption，定位对应源码元素。该结构展示在 VS Code 原生 Outline 中。

截图 `v03-outline-location.png`：Outline 完整展开，选中 rect#start，右侧源码位置和行号可见。

- [x] 层级、名称与无 id 节点正确。
- [x] 点击定位正确。

### V04 未保存编辑、畸形输入与恢复

1. 将 id `start` 改为 `start2`，先不保存。预期 Outline 自动显示 rect#start2，点击仍能定位。
2. 删除末尾 `</svg>`，保持不完整。预期大纲暂时清空，编辑器和扩展不崩溃；其他 Explorer 标记仍正常。
3. 补回结束标签，预期大纲恢复；再次点击节点验证定位。
4. 截图 `v04-edit.png`、`v04-invalid.png`、`v04-recovered.png`，分别显示未保存标记与更新、大纲清空、恢复后的层级。记录是否出现异常通知。
5. 撤销所有样例编辑；关闭文件时选择放弃保存，避免验收修改污染示例。

- [x] 未保存编辑更新。
- [x] 不完整 XML 无崩溃，恢复后可继续使用。

### V05 内容核对与归档

在先前的 PowerShell 会话中执行：

```powershell
$after = Get-ChildItem "$extension\demo" -File -Recurse | Get-FileHash -Algorithm SHA256
Compare-Object $before $after -Property Path,Hash
$before | Select-Object Path,Hash,Algorithm | ConvertTo-Json | Set-Content (Join-Path $run 'vscode-hashes-before.json')
$after | Select-Object Path,Hash,Algorithm | ConvertTo-Json | Set-Content (Join-Path $run 'vscode-hashes-after.json')
```

预期 Compare-Object 无输出。截图 `v05-hashes.png` 含命令和无差异结果；两个哈希记录一起归档。哈希检查覆盖磁盘文件，未保存编辑的刷新由 V04 单独证明。

- [x] 比较无差异，已归档哈希和截图。

## CLI：在同一个 VS Code 窗口的集成终端验收

新开 PowerShell 终端，保留前述 `$project`、`$run` 变量或重新设置。先建固定目录；配置放其外，列目录时不会将配置/日志混入结果：

```powershell
$fixed = Join-Path $run 'fixed-cwd'
New-Item -ItemType Directory -Path $fixed | Out-Null
New-Item -ItemType Directory -Path (Join-Path $fixed 'a-dir'),(Join-Path $fixed 'z-dir') | Out-Null
Set-Content -LiteralPath (Join-Path $fixed '.hidden') -Value ''
Set-Content -LiteralPath (Join-Path $fixed 'z.svg') -Value ''
Copy-Item -LiteralPath (Join-Path $project 'tests\fixtures\other.svg') -Destination (Join-Path $fixed 'a-dir\input.svg')
$entry = Join-Path $project 'dist\bootstrap\main.js'
$config = Join-Path $project 'plugins.config.json'
Set-Location $fixed
node $entry --code-plugins
```

以下代码块只输入命令，不输入 `svg>`。退出 CLI 在 Windows 输入 Ctrl+Z 后回车。用于人工演示的两次运行都在 fixed-cwd 中，期间不新增或保存文件。

### C01 默认装配与插件禁用

先退出带插件 CLI，以 `node $entry` 启动：

```text
dir
stats
init
help
create box n1 0 0 10 10 "test"
```

预期前两条为 unknown command；help 不含 stats/dir；box 仍为 `error: unknown shape type: box (is the plugin loaded?)`。截图 `c01-default.png` 保存默认行为。

### C02 方式 A：目录、统计和历史

退出并重新 `node $entry --code-plugins`，输入：

```text
dir
stats
init
stats
help
create g empty
create circle c 1 2 3
create rect r 0 0 10 10
stats
move c 10 0
undo
dir
stats
redo
show c
dir extra
canvas
read a-dir/input.svg
dir
stats
```

| 观察点 | 预期 |
| --- | --- |
| init 前 dir | 成功；四行顺序为 `[DIR]  a-dir`、`[DIR]  z-dir`、`[FILE]  .hidden`、`[FILE]  z.svg` |
| init 前 stats | 无文档错误；CLI 继续运行 |
| 空画布 stats | `(total 0, containers 0)` |
| help | 列出 stats、dir，均无参数 |
| 创建后的 stats | `circle: 1  rect: 1  (total 2, containers 1)`；空 g 只计容器 |
| undo → dir/stats → redo | redo 仍成功；show c 为 `cx=11 cy=2 r=3`，证明查询没有清空 redo |
| dir extra → canvas | `error: usage: dir` 后仍输出 canvas 尺寸 |
| read 后 dir | 与最初四行一致，未改为 a-dir；不列出其内部 input.svg |
| read 后 stats | `rect: 2  text: 1  circle: 2  ellipse: 1  (total 6, containers 1)` |

截图 `c02-directory.png` 含 init 前 dir；`c02-stats-history.png` 含 stats、undo/redo 与 show；`c02-read-cwd.png` 含 read 后 dir/stats。完整输出可滚屏分图记录，不要求一张图塞完。

### C03 方式 B 与独立启停

退出，以 `node $entry --config $config` 启动，重复 C02。预期与 A 行为一致。截图 `c03-config.png` 包含启动方式和关键输出。

制作两个独立配置（保持在 fixed-cwd 外）：

```powershell
$onlyDir = Join-Path $run 'only-dir.json'
$onlyStats = Join-Path $run 'only-stats.json'
$dirModule = (Join-Path $project 'dist\plugins\dir') -replace '\\','/'
$statsModule = (Join-Path $project 'dist\plugins\stats') -replace '\\','/'
@{plugins=@(@{module=$statsModule;enabled=$false},@{module=$dirModule})} | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 $onlyDir
@{plugins=@(@{module=$statsModule},@{module=$dirModule;enabled=$false})} | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 $onlyStats
node $entry --config $onlyDir
```

only-dir：dir 可用；init 后 help 只含 dir，stats 为 unknown command。退出后 `node $entry --config $onlyStats`：init 后 stats 可用，help 只含 stats，dir 为 unknown command。截图 `c03-independent.png` 可分两张。

### C04 非法配置与错误后继续

```powershell
$bad = Join-Path $run 'bad.json'
Set-Content -LiteralPath $bad -Value '{'
node $entry --config $bad
```

预期启动时出现 `error: invalid plugin config`，输入 init、canvas 仍成功。截图 `c04-error-continue.png` 包含诊断和后续命令。模块找不到、无默认导出、清单不符、激活抛错、内部依赖失败和重复回滚的完整自动验证见 C05，测试通过独立故障插件构造这些场景。

### C05 自动证据复算与字节一致性

退出 CLI，回项目根目录：

```powershell
Set-Location $project
node node_modules/vitest/vitest.mjs run tests/bootstrap/PluginLoader.test.ts tests/integration/PluginFramework.test.ts tests/application/CommandPlugins.test.ts tests/e2e/CliHistory.test.ts tests/architecture/OopConventions.test.ts
node doc/transcript/phase1/replay.mjs dist/bootstrap/main.js
node doc/transcript/phase2/replay.mjs dist/bootstrap/main.js plugins.config.json
node scripts/phase2-metrics.mjs --self-test
```

预期定向测试 48 项通过，Phase 1 回放六行 OK，双装配六行 A/B OK，指标 self-test OK。双装配脚本复用旧六组输入、同一路径及还原的夹具，启用相同顺序的 stats/dir，比较进程 Buffer、退出码和 SVG 字节。`CliHistory.test.ts` 的首项另使用固定真实目录比较新增命令会话，比较使用进程返回的原始 Buffer。目录空、隐藏项、特殊项、失败保留文档/基准/redo，由 CommandPlugins 的测试替身断言和真实进程测试共同覆盖。box 会话列入后续完整课程验收。

截图 `c05-auto-checks.png` 保存测试汇总和六组回放输出。若要保存详细日志，可在 `$run` 中保存；不得写入 C02 的 fixed-cwd。

- [x] C01 默认与禁用。
- [x] C02 目录、统计、历史和工作目录。
- [x] C03 配置装配及独立启停。
- [x] C04 错误后继续。
- [x] C05 已复算并归档证据。

## 完整课程验收范围

| 项目 | 验证内容 |
| --- | --- |
| 生产 box | §6.1 B 完整回放、fill/label 单步历史、必要子件及 id 冲突、坏结构拒绝、无插件降级、独立测试 |
| 两个生产树标签 | modified-star 内容比较、祖先传播、保存/失败保存/undo/redo 状态机，与 (box) 并存 |
| 接入差异 | 从新增插件的实际提交 C 验证 A/B 判据，确认比较路径存在，排除新增插件后检查内核、加载器及既有插件差异 |
| 正式指标及交付 | 功能与验证材料齐备后，从 final/p2 Git 对象复算指标，并在同一远程仓库交付 p2 |

人工结论填写格式：`编号 / 日期 / 通过或失败 / 实际观察 / 截图路径 / 复现信息`。各人工项目按实际操作结果填写。

## 生产插件验收记录（2026-11-17）

- [x] box 创建、子树 id 冲突原子性、move/scale/嵌套及整体删除恢复。
- [x] fill/label 单步 undo/redo、必要子件保护、SVG 往返、无插件降级及坏结构拒绝。
- [x] modified-star 保存点比较、祖先传播、失败保存和 undo/redo 状态机。
- [x] 仅修改标签、仅 box 标签及双标签冻结回放，版本 B 双装配逐字节一致。
- [x] 独立提交的受保护源码 diff 为空，指标从 final 与候选提交复算。

人工操作：以配置或代码装配启动，执行 doc/transcript/phase2/inputs/cli-1b.txt 中命令。预期创建摘要包含三个部件，move 使用 box 名称，fill 回显 propagated，label 回显 updated/restored；保存前为 `(box) *`，保存后及 undo 回保存点为 `(box)`。截图包含启动命令、源码树、属性摘要和保存/undo 前后树。仅 modified-star 配置只加载该包并用普通 rect 演示；仅类型标签配置加载 box 包；完整配置加载两包。人工勾选项仍按实际界面观察记录。

第 005 轮审核整改的逐项处理、语义决策和验证结果见 [整改记录](phase2-review-fixes.md)。


## 人工验收执行记录（2026-11-26）

执行者：AI 审查员（按用户授权执行验收操作，不代表教师或第三方验收）。环境：Windows 11、VS Code 1.146.0、Node.js 24.11.0。工件：`doc/evidence/phase2/`。

### VS Code

| 编号 | 操作 | 实际观察 | 证据 |
| --- | --- | --- | --- |
| V01 | 独立 profile、禁用扩展的普通窗口打开 `vscode-extension/demo` | Explorer 中 `example.svg`、`notes.txt`、`folder.svg` 均无标记 | `vscode/v01-baseline.png` |
| V02 | 开发宿主打开同一目录 | 仅 `example.svg` 带 `[]`；`notes.txt` 与目录 `folder.svg` 无标记；文件名未变 | `vscode/v02-badge.png`、`vscode/v02-badge-zoom.png` |
| V03 | 打开 `example.svg` 并展开大纲 | 层级为 `svg → g#flowchart → rect#start / g#labels → text / text#caption`；无 id 的 text 不补 id；符号计数 6；项带所在容器标签 | `vscode/v03-outline.png` |
| V03b | 定位 | 符号 `range` 实测：`rect#start` 第 3 行、`text#caption` 第 6 行；快速大纲选中 `text#caption` 时预览定位到第 6 行源码。未做鼠标点击实拍，定位依据为宿主使用的 `selectionRange` | `vscode/v03-outline.png`、验收日志 |
| V04 | 未保存改 `start`→`start2`；删除 `</svg>`；补回 | 编辑后标签页出现未保存圆点且大纲随之更新；XML 不完整时大纲显示 “No symbols found in document”，编辑器与扩展不崩溃；补回后大纲恢复 | `vscode/v04-1-state.png`、`vscode/v04-2-state.png`、`vscode/v04-3-state.png` |
| V05 | 操作前后文件哈希 | `example.svg`、`notes.txt`、`folder.svg/inside.txt` 三个文件哈希一致，差异 0 | `acceptance/v05-hashes.txt` |

### CLI（固定工作目录，配置与日志均在被列目录之外）

| 编号 | 操作 | 实际观察 | 证据 |
| --- | --- | --- | --- |
| C01 | 默认装配 | `dir`、`stats` 报 `unknown command`；`help` 不含两者；`create box` 报 `unknown shape type: box (is the plugin loaded?)` | `cli/c01-default.txt` |
| C02 | `--code-plugins` | init 前 `dir` 成功且列出 `a-dir`、`z-dir`、`.hidden`、`z.svg`；空画布 `stats` 为 `(total 0, containers 0)`；创建后 `stats` 为 `circle: 1  rect: 1  (total 2, containers 1)`；`undo` 后查询不清 redo，`show c` 为 `cx=11 cy=2 r=3`；`dir extra` 报 `usage:` 后 `canvas` 正常；`read` 不改变工作目录，读后 `stats` 为 `rect: 2  text: 1  circle: 2  ellipse: 1  (total 6, containers 1)` | `cli/c02-code-plugins.txt` |
| C03 | `--config plugins.config.json` | 与 C02 输出一致 | `cli/c03-config.txt` |
| C03b/C03c | 仅启用 `dir` / 仅启用 `stats` | 前者 `dir` 可用、`stats` 未知；后者反之；help 仅列已启用命令 | `cli/c03b-only-dir.txt`、`cli/c03c-only-stats.txt` |
| C04 | 非法配置 | 启动时 `error: invalid plugin config`，随后 `init`、`canvas` 正常 | `cli/c04-invalid-config.txt` |
| C05 | 自动证据复算 | 定向 5 文件 / 48 项通过；Phase 1 六组与 A/B 六组回放逐字节一致；指标 5 个夹具通过 | `cli/c05-*.txt` |

说明：VS Code 三项验收在同一开发宿主中进行；样例目录使用仓库 `vscode-extension/demo` 的只读副本，验收前后仓库样例哈希不变（见 V05）。大纲面板在当前窗口布局下只显示根行，完整层级以快速大纲截图为准。
