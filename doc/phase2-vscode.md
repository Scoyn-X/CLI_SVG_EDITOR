# Phase 2 VS Code 扩展

对应课程要求 A.1–A.3。扩展在 [`vscode-extension`](../vscode-extension/package.json) 下独立构建，样例见 [`example.svg`](../vscode-extension/demo/example.svg)。

扩展为 Explorer 和 Outline 提供 SVG 文件信息：文件装饰用于识别 SVG 资源，文档符号用于查看结构和定位源码。两种能力分别注册到 VS Code，由宿主管理显示和文档更新。

## 启动与验收

在仓库根目录用 PowerShell 运行以下命令。建议使用项目的 Node.js 24 和 npm 11，VS Code 最低版本为 1.96。

```powershell
npm --prefix vscode-extension ci
npm --prefix vscode-extension test
$extension = (Resolve-Path vscode-extension).Path
code --new-window --extensionDevelopmentPath="$extension" "$extension\demo"
```

1. 在未启用扩展的普通 VS Code 窗口打开 `vscode-extension/demo`，观察 Explorer 和 Outline 的初始状态。若安装了其他 XML 或 SVG 扩展，记录它们对 Outline 的影响。
2. 在 Extension Development Host 的 Explorer 查看 `example.svg`、`notes.txt` 和 `folder.svg`。预期只有文件 `example.svg` 有 `[]`。可用 `Get-FileHash` 对照操作前后的样例文件内容。
3. 若 SVG 被打开为图片预览，使用 **Reopen Editor With… → Text Editor**。在 Explorer 展开原生 **Outline**，应看到 `svg → g#flowchart`，以及 `rect#start`、`g#labels`、无 id 的 `text` 和 `text#caption`。点击 `rect#start`，应跳到源码第 3 行的标签名。
4. 在文本编辑器把 `start` 改为 `start2`，确认未保存的编辑也会刷新 Outline。暂时删除结束的 `</svg>`，确认 SVG 大纲暂时清空。恢复标签后，确认大纲恢复，再撤销样例修改或关闭时放弃保存。

验收截图应展示 Explorer 三类条目及实际标记、Outline 层级与源码跳转。测试记录另注明不完整 XML 和恢复的观察结果。若看不到标记，检查 Explorer 的 **Decorations: Badges** 设置。

## 宿主职责与模式

`activate` 由 VS Code 启动后调用。扩展把 `SvgFileDecorationProvider` 和 `SvgDocumentSymbolProvider` 注册给宿主，并把注册句柄交给扩展上下文处理释放。Explorer 需要呈现资源时向文件装饰提供者请求结果。Outline 需要文本结构时按 `.svg` 文档选择器调用符号提供者。宿主管理 Explorer、原生 Outline、文档更新和定位。扩展返回 `FileDecoration`、层级 `DocumentSymbol` 和对应源码范围。

[VS Code API 参考](https://code.visualstudio.com/api/references/vscode-api) · [启动事件](https://code.visualstudio.com/api/references/activation-events)

文件标记体现了 **Decorator** 为已有对象附加职责的思路：资源 URI 和内容保持原样，Explorer 获得额外的显示信息。经典 Decorator 通过相同接口包装对象并逐层组合；VS Code 的文件装饰机制通过提供者接口查询元数据，由宿主完成组合和渲染。

在 **Adapter** 关系中，Explorer 期望的目标契约是 `FileDecorationProvider`，`SvgFileDecorationProvider` 把 URI 后缀和 `workspace.fs.stat` 返回的资源类型转成 `FileDecoration`。它对非 SVG、目录、取消和资源消失返回空结果。符号提供者也做一层适配，把解析器产出的节点和 UTF-16 区间转成宿主的 `DocumentSymbol`、`range` 和 `selectionRange`。

## Phase 1 复用判断

Phase 1 的 SVG 示例可直接用作输入，有序树与容器遍历方式可借鉴。`XmlSvgCodec` 的目标是构建 CLI 领域文档，其解析模型没有暴露源码区间，且导入会补 id、校验受支持的图形和属性。Outline 需要保留无 id 节点、遍历任意 SVG 元素、定位原文且随未保存文本更新。扩展因此使用独立的 SAX 解析层和带区间的 `SvgOutlineNode`，再以宿主适配器完成符号映射。

## 构建与验证

扩展使用 TypeScript 6.0.3 和 saxes 6.0.0。saxes 的声明文件存在泛型约束兼容问题，扩展 tsconfig 采用 `skipLibCheck` 跳过依赖声明检查，扩展源码继续使用严格类型检查。

2026-11-11，`npm --prefix vscode-extension test` 的 4 项测试通过。测试使用编译后的扩展和 VS Code API 测试替身，覆盖注册、文件类型过滤、stat 失败、取消、嵌套层级、无 id、CRLF 和 Unicode 源码区间、编辑更新、畸形 XML 及恢复。独立锁文件安装与测试也已验证。

开发宿主的 Explorer 观察记录（2026-11-10）确认：example.svg 显示 `[]`，notes.txt 和 folder.svg 目录保持原样。Outline 的界面验证项目包括层级、点击定位和编辑恢复，操作步骤见上文；自动测试已覆盖相应提供者行为。
