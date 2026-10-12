# 树编辑实现与恢复

阶段 5，2026-10-12；分支 feature-tree-editing，基于已推送的 4e2bfbc。按路线保留两个提交单元：“分组/归属”和“删除/顺序/恢复”。用户已确认本轮两份清单，授权依次提交并推送；以后仍逐次确认，不进入阶段 6。

## 单元 A：分组、解组与归属

已实现 GroupCommand、UngroupCommand、AddToCommand，统一继承 EditCommand，经现有会话候选执行和前/后 Memento 入一个历史单元；不新增历史机制或名字分派。Bootstrap 注册命令，帮助自动列出当前可用项。

SvgDocument 通过 group/ungroup/addTo 委托私有 ShapeTree。结构规则留在领域，CLI 不取得可写子列表，也不靠标签判断容器。

### group

按 D03 暂定基线：完整校验新 id、全部目标、重复目标及祖先/子孙冲突；按原树前序排序目标；找到各目标父级的最低共同容器，在包含目标的最早直接分支位置插入新 g。

构造并复制完整新组、验证新组与所有未选节点的 id 不冲突后，才摘除旧节点并附着新组、重建索引。复制失败不会留下部分分组。单目标允许包裹；原空容器保留；实际名为 svg 的图形 id 不与 undefined 表示的根哨兵混淆。

例：根 `[a,b,c,d]` 执行 `group pair c a` 得到 `[pair(a,c),b,d]`；跨根分支 `[left(a,x),middle,right(b,y)]` 执行 `group pair b a` 得到 `[pair(a,b),left(x),middle,right(y)]`。这些位置是工程暂定语义，不是教师确认。

### ungroup

容器资格通过 ShapeAccess 的领域协作能力判断；Shape.canUngroup 与能容纳子节点分别定义，普通 Group 返回 true。不给解组权限的容器报规定 composite shape 错误；普通根级 g 按题目拒绝；叶子报 not a container。

允许解组的嵌套 g，其子列表按原顺序一次替换它在父级的位置，空 g 不留下占位。移除组 id、重建全部父级/id 索引，子孙自身属性与数值保持。该能力边界没有注册 box 或实现插件。

### addto

验证源节点、目标容器以及不得移入自身/子孙的约束后，从原父级摘除，放到目标末尾，重建索引。同父级也移到末尾；原已末尾的成功操作仍按 D05 入一个历史单元。源/目标都不存在时先报源 no such shape，是暂定错误优先级。

OrderedChildren 以先准备后赋值的新数组维护列表，replace 可一次替换容器为多个子节点；不暴露内部可写数组。分组可能复制多个同级列表，最坏有 O(k×N) 列表工作量，课程规模暂可接受；不在本阶段引入复杂树索引优化。

重组保留显式/缺省属性，不物化原继承样式；移入、移出或解散带样式组可能改变视觉继承/遮挡。该限制按 D03/D04 记录，不能宣称像素外观不变；transform 等在 D09 定稿后重新核对。

## 验证与后续单元

- [领域分组测试](../tests/domain/TreeGrouping.test.ts)：同级/跨父/深层共同父级、单目标、空组解散、祖先冲突、复制失败、索引/计数/样式缺省和环拒绝。
- [命令与历史测试](../tests/application/TreeGroupingCommands.test.ts)：一条重组一个单元、完整前/后状态、redo 保留与替换、路径/屏障、输入列表隔离及 create in 的协作。
- [真实进程测试](../tests/e2e/CliHistory.test.ts) 回放 [tree-grouping.cli](../tests/fixtures/tree-grouping.cli)，验证成功摘要、精确错误及实际帮助。

删除、front/back 和相应恢复为单元 B，当前尚未完成。真实 SVG/文件及完整显示仍留后续；单元 A 的检查点只包含上述已实现内容，不把后一个单元的共享文件变更混入提交。
