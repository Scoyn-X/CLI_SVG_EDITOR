# Phase 2 源码指标复算

为衡量插件式重构的影响，指标脚本从两个 Git 版本读取源码，统计文件职责、物理行数和函数圈复杂度。当前报告的基线为 final，目标为插件框架源码提交 `5ec0a5573b1ae4fa3a246f9fb1dfc6d686ccf52b`。

## 生成报告

在仓库根目录执行：

```powershell
node scripts/phase2-metrics.mjs --self-test
node scripts/phase2-metrics.mjs final 5ec0a5573b1ae4fa3a246f9fb1dfc6d686ccf52b | Set-Content -Encoding utf8 docs/metrics/phase2-current.md
```

[当前报告](phase2-current.md)固定了基线与目标的完整提交 SHA。后续版本可将目标参数替换为对应提交；最终课程报告使用 final 和 p2。开发期间使用 `--worktree` 参数查看即时统计。

## 分类与范围

| 类别 | 路径与职责 |
| --- | --- |
| 内核 | src/domain、application、ports、adapters；领域规则、命令会话、公开契约和内置适配器 |
| 装配 | src/bootstrap；入口、依赖组装、加载器和注册校验 |
| 插件 | src/plugins；独立插件实现及 package.json 清单 |
| VS Code | vscode-extension/src；编辑器扩展，单列统计 |

行数包含源码中的空行和注释，末尾换行不产生额外空行。插件清单计入文件数和行数，圈复杂度为零。文件职责由模块、类/接口及公开操作生成。测试、文档、样例、依赖和构建产物排除；内置图形 Provider 归入内核适配器。

## 圈复杂度口径

脚本使用 TypeScript AST 遍历函数体。每个有实现的函数、方法、构造器、访问器和箭头函数起点为 1；函数体内的 if、循环、catch、非 default 的 case、三元表达式及 && / || / ?? 各加 1。嵌套函数独立计数。接口、抽象声明、类型表达式和模块顶层语句排除。该指标反映函数实现的路径数量。

两个版本采用同一算法，按类别汇总并计算增量。Git 内容通过 ls-tree 列举和 cat-file --batch 批量读取，blob 按原始字节长度分隔。

## 算法验证

2026-11-11，五个计算夹具通过，覆盖接口、纯声明、分支与短路、嵌套函数、循环/switch/catch。final 对 final 的四类增量均为零，报告可从上述提交对象重新生成。
