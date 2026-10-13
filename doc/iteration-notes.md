# 首轮审查后的增量记录

2026-10-13；开发基线 `25d6575`，任务分支 `refactor-review-followups`。对应仓库外 review/reports/review-round-001-20261013.md（审查 skill v1.1）。本文件记录开发整改，供下一轮独立审查使用，不替代原报告或冒充第二轮审查。

## 修改内容

| 单元 | 涉及文件 | 内容与原因 |
| --- | --- | --- |
| I01 / F4 | src/application/EditorSession.ts | 删除生产未使用的 establishIoBarrier；保存屏障只由 saveDocument 在回调成功后建立。更新 replaceDocument 注释，明确 init 与带锁 readDocument 的入口区别 |
| I01 / 回归 | tests/application/EditorSession.test.ts、tests/integration/DocumentCommands.test.ts | 原测试改走 saveDocument；新增实际 SaveCommand 的写入前后状态断言，检查成功前不清空 redo、成功后两栈清空并建立屏障、文档和来源路径不变 |

## 原审查项的处理口径

| 项目 | 本轮选择 | 下轮复核重点 |
| --- | --- | --- |
| F1 | 保留显式 stroke；这是示例逐字比较风险，尚未证明功能违规 | tree 仍显示真实样式，成功/错误反馈不变；不得写成已消除示例差异 |
| F2 | 评估后保留标签与详情间两个空格，避免未定义对齐宽度引入新的输出兼容变化 | 内容、树线、全文/局部树可读性保持；对齐差异仍存在 |
| F3 | 保留语义等价的 XML 属性顺序 | 往返按语义比较；不为排序新增图形类型分派 |
| F4 | 清理旧接口与注释，回归移到实际保存边界 | 生产无旧 API，失败保存仍保留 redo，成功写入后才建立屏障 |
| F5 | 保留固定 children 模板 | 单目标分组仍是一个历史单元；文法差异已知，未宣称修复 |

功能范围仍是六类图形与19命令；没有注册生产 box 或进入插件/GUI阶段。final 标签继续暂缓。

## 验证与提交

I01 针对性测试通过：EditorSession/DocumentCommands 两文件、39 项；类型与 lint 检查通过。本轮后续还将补源码检查反例和扩展边界探针，并完整运行 npm run check。原第一轮报告、日志、总账与需求来源保持不变。
