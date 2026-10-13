# 首轮审查后的增量记录

2026-10-13；开发基线 `25d6575`，任务分支 `refactor-review-followups`。对应仓库外 review/reports/review-round-001-20261013.md（审查 skill v1.1）。本文件记录开发整改，供下一轮独立审查使用，不替代原报告或冒充第二轮审查。

## 修改内容

| 单元 | 涉及文件 | 内容与原因 |
| --- | --- | --- |
| I01 / F4 | src/application/EditorSession.ts | 删除生产未使用的 establishIoBarrier；保存屏障只由 saveDocument 在回调成功后建立。更新 replaceDocument 注释，明确 init 与带锁 readDocument 的入口区别 |
| I01 / 回归 | tests/application/EditorSession.test.ts、tests/integration/DocumentCommands.test.ts | 原测试改走 saveDocument；新增实际 SaveCommand 的写入前后状态断言，检查成功前不清空 redo、成功后两栈清空并建立屏障、文档和来源路径不变 |
| I02 / 源码检查 | tests/architecture/SourceConventionChecker.ts、OopConventions.test.ts | 提取测试专用扫描器，真实生产源码与内存正/负例使用同一入口；补公开 readonly 参数属性、顶层箭头/函数表达式、改名/别名类型注册表和明显标签判断的诊断 |
| I02 / 扩展探针 | tests/fixtures/ExtensionProbe.ts、tests/integration/ExtensionBoundaries.test.ts | 仅测试注册标记容器，验证子树创建、set 多态传播、移动/快照恢复、拒绝解组、标记保存/普通 g 降级与生产组合不泄漏注册 |
| I03 / 审查规则 | 仓库外 ../review/REVIEW-SKILL.md | 更新 v1.2：校准 help 与循环方向、错误条数/示例风险表述、真实反例与扩展完成程度，下一轮读取本增量记录；原报告/日志/总账未改写 |
| I04 / 文档同步 | AGENTS.md、agent.md、README.md、doc/README.md、command-history.md、testing.md、roadmap.md、delivery.md、test-report.md | 当前入口更新407项和扩展边界；首次交付376项记录加历史说明，不覆盖旧验证结果，统一指向本增量记录 |

## 原审查项的处理口径

| 项目 | 本轮选择 | 下轮复核重点 |
| --- | --- | --- |
| F1 | 保留显式 stroke；这是示例逐字比较风险，尚未证明功能违规 | tree 仍显示真实样式，成功/错误反馈不变；不得写成已消除示例差异 |
| F2 | 评估后保留标签与详情间两个空格，避免未定义对齐宽度引入新的输出兼容变化 | 内容、树线、全文/局部树可读性保持；对齐差异仍存在 |
| F3 | 保留语义等价的 XML 属性顺序 | 往返按语义比较；不为排序新增图形类型分派 |
| F4 | 清理旧接口与注释，回归移到实际保存边界 | 生产无旧 API，失败保存仍保留 redo，成功写入后才建立屏障 |
| F5 | 保留固定 children 模板 | 单目标分组仍是一个历史单元；文法差异已知，未宣称修复 |

功能范围仍是六类图形与19命令；没有注册生产 box 或进入插件/GUI阶段。final 标签继续暂缓。

## 已确认的扩展边界

探针只验证当前能力，不声称插件链路完整：

- 子树创建、图形多态 set、clone/undo/redo 可保留测试容器能力，无需先增加 Provider 转发接口。
- 序列化保持 g/data-kind 与子节点；导入仅按 SVG 标签选择提供者。即使注册 probe 提供者，读回 data-kind=probe 仍得到普通 g，便利属性语义降级；这在本阶段是受控已知边界。
- tree/show 显示 data-kind 属性，没有语义类型标注 `(probe)`。
- SetCommand 摘要目前读取节点自身属性；传播到子部件的 fill/label 会显示 `(unset)`，因此“能多态修改”不等于已有插件反馈。未来需中立属性读回/富反馈协议。
- 快照是 DocumentMemento/HistoryEntry 中直接构造的具体实现，已封装但未提供可注入策略；本轮不增加没有性能依据的策略框架。
- AST 检查针对可识别语法、类型注册表和显式比较；动态别名、反射及任意控制流仍需人工审查，不能据通过证明全程序只有两处分派。

## 验证与提交

I01 已独立提交推送：117cadd；针对性测试两文件/39 项、类型与 lint 通过。I02 已独立提交推送：d55f239；源码扫描器 28 项（真实源码1、普通正例6、负例19、集中查找正例2）通过；扩展探针4项通过。最后代码变更后 npm run check 全部通过：21 个测试文件、407 项测试；strict类型、lint 0警告、构建、91模块/288依赖/0违规、运行时组装均通过。原第一轮报告、日志、总账与需求来源保持不变；本记录与测试一起提交，不冒充第002轮审查。

## 下一轮审查入口

以当前Git提交为基线，先读外部 REVIEW-SKILL.md v1.2、原第001轮报告和本记录，再独立全量核查。重点：F4入口确已移除、保存成败的历史边界；同一扫描器反例能失败；探针未进入生产；data-kind/反馈/显示/快照策略的限制与自述一致。F1/F2/F3/F5仍是已记录的维持现状事项，不写成已修复；第002轮报告和日志仍放review目录。本轮没有重做浏览器预览，图形输出/序列化代码没有改变；已有真实CLI课程序列已随全量测试重新回放。

本轮文档复核通过：154个项目文件有效UTF-8，148个本地链接/Markdown锚点有效，内嵌图与图源一致，需求与首次讨论原文未变；src/tests/配置/锁文件与最终已测试的d55f239一致。审查skill位于仓库外，按其产物隔离规则不纳入Git暂存；本轮只修改该规则文件，未生成或改写审查报告/日志/总账。
