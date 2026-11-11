# Phase 2 源码指标

基线 `final`（ba7b418cb5554d6e2a3c8e1d66f9940fb3c40e3a）

目标 `5ec0a5573b1ae4fa3a246f9fb1dfc6d686ccf52b`（5ec0a5573b1ae4fa3a246f9fb1dfc6d686ccf52b）

口径：物理行含空行和注释；圈复杂度为有函数体的函数/方法/构造器/访问器/箭头函数的路径数之和。每个实现起点 1，if、三元、catch、非 default 的 case、循环及 && / || / ?? 各加 1；嵌套函数独立计数。接口、声明、模块顶层语句与类型表达式不计圈复杂度。VS Code 单列，不计入 CLI 增量。

| 类别 | 文件数 基线 → 目标 | 行数 基线 → 目标 | 圈复杂度 基线 → 目标（增量） |
| --- | ---: | ---: | ---: |
| 内核 | 82 → 86 | 2057 → 2155 | 659 → 694（35） |
| 装配 | 3 → 9 | 106 → 375 | 30 → 152（122） |
| 插件 | 0 → 8 | 0 → 115 | 0 → 29（29） |
| VS Code | 0 → 5 | 0 → 134 | 0 → 34（34） |

## 文件清单

| 文件 | 类别与职责 | 行数 基线 → 目标 | 圈复杂度 基线 → 目标 |
| --- | --- | ---: | ---: |
| `src/adapters/cli/CliController.ts` | 内核 · CLI、SVG 和文件系统适配：CliController；公开操作 executeLine | 25 → 26 | 6 → 8 |
| `src/adapters/cli/CliPresenter.ts` | 内核 · CLI、SVG 和文件系统适配：CliPresenter；公开操作 tree、show | 44 → 54 | 34 → 44 |
| `src/adapters/cli/Repl.ts` | 内核 · CLI、SVG 和文件系统适配：Repl；公开操作 start | 18 → 18 | 4 → 4 |
| `src/adapters/cli/Tokenizer.ts` | 内核 · CLI、SVG 和文件系统适配：Tokenizer；公开操作 tokenize | 37 → 37 | 19 → 19 |
| `src/adapters/files/FileOperations.ts` | 内核 · CLI、SVG 和文件系统适配：FileOperations；公开操作 read、mode、open、write、flush、close、replace、remove | 22 → 22 | 13 → 13 |
| `src/adapters/files/NodeDocumentStorage.ts` | 内核 · CLI、SVG 和文件系统适配：NodeDocumentStorage；公开操作 resolve、read、write | 28 → 28 | 11 → 11 |
| `src/adapters/shapes/BuiltinShapeProvider.ts` | 内核 · CLI、SVG 和文件系统适配：BuiltinShapeProvider；公开操作 getType、getUsage、create、fromSvg | 66 → 66 | 37 → 37 |
| `src/adapters/shapes/CircleProvider.ts` | 内核 · CLI、SVG 和文件系统适配：CircleProvider | 9 → 9 | 2 → 2 |
| `src/adapters/shapes/EllipseProvider.ts` | 内核 · CLI、SVG 和文件系统适配：EllipseProvider | 10 → 10 | 2 → 2 |
| `src/adapters/shapes/GroupProvider.ts` | 内核 · CLI、SVG 和文件系统适配：GroupProvider | 13 → 13 | 5 → 5 |
| `src/adapters/shapes/LineProvider.ts` | 内核 · CLI、SVG 和文件系统适配：LineProvider | 10 → 10 | 2 → 2 |
| `src/adapters/shapes/RectProvider.ts` | 内核 · CLI、SVG 和文件系统适配：RectProvider | 10 → 10 | 2 → 2 |
| `src/adapters/shapes/TextProvider.ts` | 内核 · CLI、SVG 和文件系统适配：TextProvider | 13 → 13 | 5 → 5 |
| `src/adapters/svg/XmlSvgCodec.ts` | 内核 · CLI、SVG 和文件系统适配：XmlSvgCodec；公开操作 decode、encode | 142 → 142 | 72 → 72 |
| `src/application/AddToCommand.ts` | 内核 · 编辑命令、状态与扩展契约：AddToCommand | 16 → 16 | 3 → 3 |
| `src/application/BackCommand.ts` | 内核 · 编辑命令、状态与扩展契约：BackCommand | 13 → 13 | 2 → 2 |
| `src/application/CanvasCommand.ts` | 内核 · 编辑命令、状态与扩展契约：CanvasCommand；公开操作 execute | 17 → 17 | 4 → 4 |
| `src/application/Command.ts` | 内核 · 编辑命令、状态与扩展契约：Command；公开操作 execute | 6 → 6 | 0 → 0 |
| `src/application/CommandArguments.ts` | 内核 · 编辑命令、状态与扩展契约：CommandArguments；公开操作 count、optional、required、values、creationParent | 29 → 29 | 11 → 11 |
| `src/application/CommandDispatcher.ts` | 内核 · 编辑命令、状态与扩展契约：CommandDispatcher；公开操作 has、getUsages、register、create | 23 → 25 | 6 → 7 |
| `src/application/CommandDisplay.ts` | 内核 · 编辑命令、状态与扩展契约：CommandDisplay；公开操作 render | 3 → 3 | 0 → 0 |
| `src/application/CommandFormatter.ts` | 内核 · 编辑命令、状态与扩展契约：CommandFormatter；公开操作 tree、show | 7 → 7 | 0 → 0 |
| `src/application/CommandRegistration.ts` | 内核 · 编辑命令、状态与扩展契约：CommandRegistration；公开操作 getUsage、create | 17 → 17 | 6 → 6 |
| `src/application/CommandResult.ts` | 内核 · 编辑命令、状态与扩展契约：CommandResult；公开操作 getSummary、getWarnings、render、reversed | 16 → 16 | 6 → 6 |
| `src/application/CreateCommand.ts` | 内核 · 编辑命令、状态与扩展契约：CreateCommand | 22 → 23 | 3 → 4 |
| `src/application/DeleteCommand.ts` | 内核 · 编辑命令、状态与扩展契约：DeleteCommand | 15 → 15 | 3 → 3 |
| `src/application/DocumentMemento.ts` | 内核 · 编辑命令、状态与扩展契约：DocumentMemento；公开操作 restore | 9 → 9 | 2 → 2 |
| `src/application/EditCommand.ts` | 内核 · 编辑命令、状态与扩展契约：EditCommand；公开操作 execute | 12 → 12 | 2 → 2 |
| `src/application/EditorSession.ts` | 内核 · 编辑命令、状态与扩展契约：EditorSession；公开操作 describe、describeSaved、describeShape、getParentId、getSourcePath、getHistoryStatus、readDocument、saveDocument、edit、replaceDocument、resize、undo、redo | 115 → 123 | 27 → 28 |
| `src/application/FrontCommand.ts` | 内核 · 编辑命令、状态与扩展契约：FrontCommand | 13 → 13 | 2 → 2 |
| `src/application/GroupCommand.ts` | 内核 · 编辑命令、状态与扩展契约：GroupCommand | 16 → 16 | 3 → 3 |
| `src/application/HelpCommand.ts` | 内核 · 编辑命令、状态与扩展契约：HelpCommand；公开操作 execute | 13 → 13 | 2 → 2 |
| `src/application/HistoryEntry.ts` | 内核 · 编辑命令、状态与扩展契约：HistoryEntry；公开操作 restoreBefore、restoreAfter、forwardResult、backwardResult | 18 → 18 | 5 → 5 |
| `src/application/HistoryManager.ts` | 内核 · 编辑命令、状态与扩展契约：HistoryManager；公开操作 status、record、establishBarrier、peekUndo、peekRedo、acceptUndo、acceptRedo | 51 → 51 | 12 → 12 |
| `src/application/HistoryStatus.ts` | 内核 · 编辑命令、状态与扩展契约：HistoryStatus；公开操作 getUndoCount、getRedoCount、isBlocked | 9 → 9 | 4 → 4 |
| `src/application/InitCommand.ts` | 内核 · 编辑命令、状态与扩展契约：InitCommand；公开操作 execute | 16 → 16 | 2 → 2 |
| `src/application/InputArgument.ts` | 内核 · 编辑命令、状态与扩展契约：InputArgument；公开操作 getValue、isLiteral | 6 → 6 | 3 → 3 |
| `src/application/MoveCommand.ts` | 内核 · 编辑命令、状态与扩展契约：MoveCommand | 24 → 24 | 5 → 5 |
| `src/application/PluginContext.ts` | 内核 · 编辑命令、状态与扩展契约：PluginContext；公开操作 registerShape、registerCommand、registerDecorator、registerAttribute | 0 → 11 | 0 → 0 |
| `src/application/PluginModule.ts` | 内核 · 编辑命令、状态与扩展契约：PluginModule；公开操作 activate | 0 → 5 | 0 → 0 |
| `src/application/ReadCommand.ts` | 内核 · 编辑命令、状态与扩展契约：ReadCommand；公开操作 execute | 20 → 20 | 8 → 8 |
| `src/application/RedoCommand.ts` | 内核 · 编辑命令、状态与扩展契约：RedoCommand；公开操作 execute | 7 → 7 | 1 → 1 |
| `src/application/SaveCommand.ts` | 内核 · 编辑命令、状态与扩展契约：SaveCommand；公开操作 execute | 22 → 22 | 7 → 7 |
| `src/application/ScaleCommand.ts` | 内核 · 编辑命令、状态与扩展契约：ScaleCommand | 15 → 15 | 2 → 2 |
| `src/application/SetCommand.ts` | 内核 · 编辑命令、状态与扩展契约：SetCommand | 20 → 32 | 6 → 12 |
| `src/application/ShapeDisplay.ts` | 内核 · 编辑命令、状态与扩展契约：ShapeDisplay；公开操作 render | 8 → 8 | 2 → 2 |
| `src/application/ShapeFactory.ts` | 内核 · 编辑命令、状态与扩展契约：ShapeFactory；公开操作 has、register、create、fromSvg、getUsages | 32 → 38 | 9 → 13 |
| `src/application/ShowCommand.ts` | 内核 · 编辑命令、状态与扩展契约：ShowCommand；公开操作 execute | 13 → 13 | 3 → 3 |
| `src/application/TreeCommand.ts` | 内核 · 编辑命令、状态与扩展契约：TreeCommand；公开操作 execute | 13 → 13 | 3 → 3 |
| `src/application/TreeDisplay.ts` | 内核 · 编辑命令、状态与扩展契约：TreeDisplay；公开操作 render | 9 → 10 | 2 → 2 |
| `src/application/UndoCommand.ts` | 内核 · 编辑命令、状态与扩展契约：UndoCommand；公开操作 execute | 7 → 7 | 1 → 1 |
| `src/application/UngroupCommand.ts` | 内核 · 编辑命令、状态与扩展契约：UngroupCommand | 12 → 12 | 2 → 2 |
| `src/bootstrap/CodePlugins.ts` | 装配 · 启动、插件加载与依赖组装：CodePlugins；公开操作 load | 0 → 13 | 0 → 1 |
| `src/bootstrap/EditorComposition.ts` | 装配 · 启动、插件加载与依赖组装：EditorComposition；公开操作 createPluginRegistry、createFactory、createDispatcher、createController、createRepl | 76 → 93 | 25 → 36 |
| `src/bootstrap/PluginConfigEntry.ts` | 装配 · 启动、插件加载与依赖组装：PluginConfigEntry | 0 → 5 | 0 → 0 |
| `src/bootstrap/PluginContributions.ts` | 装配 · 启动、插件加载与依赖组装：PluginContributions；公开操作 registerShape、registerCommand、registerDecorator、registerAttribute、names、has、shapeProviders、commandEntries、treeDecorators、attributeHandlers、seal | 0 → 44 | 0 → 16 |
| `src/bootstrap/PluginLoader.ts` | 装配 · 启动、插件加载与依赖组装：PluginLoader；公开操作 activate、loadConfig | 0 → 97 | 0 → 48 |
| `src/bootstrap/PluginManifest.ts` | 装配 · 启动、插件加载与依赖组装：PluginManifest；公开操作 parse、getName、verify | 0 → 38 | 0 → 25 |
| `src/bootstrap/PluginRegistry.ts` | 装配 · 启动、插件加载与依赖组装：PluginRegistry；公开操作 install、shapeProviders、commandEntries、treeDecorators、attributeHandlers | 0 → 40 | 0 → 20 |
| `src/bootstrap/RuntimeEnvironment.ts` | 装配 · 启动、插件加载与依赖组装：RuntimeEnvironment；公开操作 assertSupported | 15 → 15 | 5 → 5 |
| `src/bootstrap/main.ts` | 装配 · CLI 参数、插件装入与 REPL 启动 | 15 → 30 | 0 → 1 |
| `src/domain/CanvasAttributes.ts` | 内核 · SVG 领域对象与结构：CanvasAttributes；公开操作 attributes、forCanvas | 35 → 35 | 17 → 17 |
| `src/domain/Circle.ts` | 内核 · SVG 领域对象与结构：Circle；公开操作 clone | 12 → 12 | 2 → 2 |
| `src/domain/DocumentDescription.ts` | 内核 · SVG 领域对象与结构：DocumentDescription；公开操作 getWidth、getHeight、getRoots、getCanvasAttributes、getElementCount | 21 → 21 | 8 → 8 |
| `src/domain/DomainError.ts` | 内核 · SVG 领域对象与结构：DomainError | 7 → 7 | 1 → 1 |
| `src/domain/Ellipse.ts` | 内核 · SVG 领域对象与结构：Ellipse；公开操作 clone | 13 → 13 | 2 → 2 |
| `src/domain/Geometry.ts` | 内核 · SVG 领域对象与结构：Geometry；公开操作 attributes、position、value、withAttribute、transformed | 64 → 64 | 19 → 19 |
| `src/domain/GeometrySummary.ts` | 内核 · SVG 领域对象与结构：GeometrySummary；公开操作 getAttributes、getPoints | 12 → 12 | 4 → 4 |
| `src/domain/GeometryTransform.ts` | 内核 · SVG 领域对象与结构：GeometryTransform；公开操作 translation、uniformScale、x、y、size | 34 → 34 | 7 → 7 |
| `src/domain/Group.ts` | 内核 · SVG 领域对象与结构：Group；公开操作 [ShapeAccess.children]、canUngroup、prepareTransform、clone | 38 → 41 | 9 → 10 |
| `src/domain/LeafShape.ts` | 内核 · SVG 领域对象与结构：LeafShape；公开操作 prepareTransform | 30 → 30 | 7 → 7 |
| `src/domain/Line.ts` | 内核 · SVG 领域对象与结构：Line；公开操作 clone | 17 → 17 | 3 → 3 |
| `src/domain/OrderedChildren.ts` | 内核 · SVG 领域对象与结构：OrderedChildren；公开操作 items、insert、remove、replace | 30 → 30 | 8 → 8 |
| `src/domain/PresentationAttributes.ts` | 内核 · SVG 领域对象与结构：PresentationAttributes；公开操作 names、attributes | 35 → 35 | 18 → 18 |
| `src/domain/Rect.ts` | 内核 · SVG 领域对象与结构：Rect；公开操作 clone | 13 → 13 | 2 → 2 |
| `src/domain/Shape.ts` | 内核 · SVG 领域对象与结构：Shape；公开操作 getId、getType、creationDetails、canUngroup、canDetachChild、preservePresentation、move、scale、set、describe、prepareTransform、clone、[ShapeAccess.children] | 67 → 73 | 17 → 20 |
| `src/domain/ShapeAccess.ts` | 内核 · SVG 领域对象与结构：ShapeAccess | 4 → 4 | 0 → 0 |
| `src/domain/ShapeChange.ts` | 内核 · SVG 领域对象与结构：ShapeChange；公开操作 combine、apply | 20 → 20 | 5 → 5 |
| `src/domain/ShapeDescription.ts` | 内核 · SVG 领域对象与结构：ShapeDescription；公开操作 getId、getTag、getType、isContainer、getAttributes、getChildren、getText、getPosition、getGeometry | 31 → 35 | 9 → 11 |
| `src/domain/ShapeTraversal.ts` | 内核 · SVG 领域对象与结构：ShapeTraversal；公开操作 visit、assertValidIds | 42 → 42 | 11 → 11 |
| `src/domain/ShapeTree.ts` | 内核 · SVG 领域对象与结构：ShapeTree；公开操作 insert、remove、group、ungroup、addTo、front、back、move、scale、set、describe、describeRoots、getElementCount、getParentId、clone | 181 → 192 | 58 → 62 |
| `src/domain/StyleAttributes.ts` | 内核 · SVG 领域对象与结构：StyleAttributes；公开操作 empty、supports、attributes、withAttribute | 36 → 36 | 10 → 10 |
| `src/domain/SvgDocument.ts` | 内核 · SVG 领域对象与结构：SvgDocument；公开操作 getWidth、getHeight、getElementCount、getParentId、describeShape、describe、resize、add、remove、group、ungroup、addTo、front、back、move、scale、set、clone | 51 → 51 | 19 → 19 |
| `src/domain/Text.ts` | 内核 · SVG 领域对象与结构：Text；公开操作 clone | 32 → 32 | 7 → 7 |
| `src/domain/ValueValidation.ts` | 内核 · SVG 领域对象与结构：ValueValidation；公开操作 finite、nonNegative、positive、number、text、numbers、id | 59 → 59 | 29 → 29 |
| `src/plugins/dir/DirCommand.ts` | 插件 · 独立插件实现与清单：DirCommand；公开操作 execute | 0 → 25 | 0 → 12 |
| `src/plugins/dir/DirPlugin.ts` | 插件 · 独立插件实现与清单：DirPlugin；公开操作 activate | 0 → 16 | 0 → 3 |
| `src/plugins/dir/DirectoryReader.ts` | 插件 · 独立插件实现与清单：DirectoryEntry、DirectoryReader；公开操作 currentDirectory、read | 0 → 9 | 0 → 0 |
| `src/plugins/dir/NodeDirectoryReader.ts` | 插件 · 独立插件实现与清单：NodeDirectoryReader；公开操作 currentDirectory、read | 0 → 14 | 0 → 5 |
| `src/plugins/dir/package.json` | 插件 · 独立插件包入口与 contributes 清单 | 0 → 6 | 0 → 0 |
| `src/plugins/stats/StatsCommand.ts` | 插件 · 独立插件实现与清单：StatsCommand；公开操作 execute | 0 → 27 | 0 → 7 |
| `src/plugins/stats/StatsPlugin.ts` | 插件 · 独立插件实现与清单：StatsPlugin；公开操作 activate | 0 → 12 | 0 → 2 |
| `src/plugins/stats/package.json` | 插件 · 独立插件包入口与 contributes 清单 | 0 → 6 | 0 → 0 |
| `src/ports/AttributeHandler.ts` | 内核 · 输入输出及扩展接口：AttributeHandler；公开操作 handles、apply、summarize | 0 → 8 | 0 → 0 |
| `src/ports/DocumentStorage.ts` | 内核 · 输入输出及扩展接口：DocumentStorage；公开操作 resolve、read、write | 5 → 5 | 0 → 0 |
| `src/ports/IdAssignment.ts` | 内核 · 输入输出及扩展接口：IdAssignment；公开操作 getId、getTag | 5 → 5 | 3 → 3 |
| `src/ports/ImportedDocument.ts` | 内核 · 输入输出及扩展接口：ImportedDocument；公开操作 getDocument、getElementCount、getAssignments | 13 → 13 | 4 → 4 |
| `src/ports/ShapeCreator.ts` | 内核 · 输入输出及扩展接口：ShapeCreator；公开操作 create | 5 → 5 | 0 → 0 |
| `src/ports/ShapeImporter.ts` | 内核 · 输入输出及扩展接口：ShapeImporter；公开操作 fromSvg | 4 → 4 | 0 → 0 |
| `src/ports/ShapeProvider.ts` | 内核 · 输入输出及扩展接口：ShapeProvider；公开操作 getType、getUsage、getSvgTag、create、fromSvg | 10 → 12 | 0 → 0 |
| `src/ports/SvgCodec.ts` | 内核 · 输入输出及扩展接口：SvgCodec；公开操作 decode、encode | 7 → 7 | 0 → 0 |
| `src/ports/SvgElement.ts` | 内核 · 输入输出及扩展接口：SvgElement；公开操作 getTag、getAttributes、getAttribute、getChildren、getText | 13 → 13 | 7 → 7 |
| `src/ports/TreeDecorator.ts` | 内核 · 输入输出及扩展接口：TreeDecorator；公开操作 prepare | 0 → 7 | 0 → 0 |
| `vscode-extension/src/SvgDocumentSymbolProvider.ts` | VS Code · 编辑器扩展：SvgDocumentSymbolProvider；公开操作 provideDocumentSymbols | 0 → 37 | 0 → 7 |
| `vscode-extension/src/SvgFileDecorationProvider.ts` | VS Code · 编辑器扩展：SvgFileDecorationProvider；公开操作 provideFileDecoration | 0 → 15 | 0 → 6 |
| `vscode-extension/src/SvgOutlineNode.ts` | VS Code · 编辑器扩展：SvgOutlineNode；公开操作 addChild、close | 0 → 32 | 0 → 7 |
| `vscode-extension/src/SvgOutlineParser.ts` | VS Code · 编辑器扩展：SvgOutlineParser；公开操作 parse | 0 → 36 | 0 → 13 |
| `vscode-extension/src/extension.ts` | VS Code · 向 VS Code 注册文件装饰和文档符号提供者 | 0 → 14 | 0 → 1 |
