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

## 单元 A 的验证

- [领域分组测试](../tests/domain/TreeGrouping.test.ts)：同级/跨父/深层共同父级、单目标、空组解散、祖先冲突、复制失败、索引/计数/样式缺省和环拒绝。
- [命令与历史测试](../tests/application/TreeGroupingCommands.test.ts)：一条重组一个单元、完整前/后状态、redo 保留与替换、路径/屏障、输入列表隔离及 create in 的协作。
- [真实进程测试](../tests/e2e/CliHistory.test.ts) 回放 [tree-grouping.cli](../tests/fixtures/tree-grouping.cli)，验证成功摘要、精确错误及实际帮助。

单元 A 独立检查点为 258 项测试通过；源码/文档和差异保存在忽略的 artifacts，不修改 Git 索引。该检查点只有分组/归属内容，不含下面单元 B 的共享文件增量。

## 单元 B：删除与同级顺序恢复

新增 DeleteCommand、FrontCommand、BackCommand，全部继承 EditCommand，继续复用候选执行和独立快照；ShapeTree 管理树，命令只调用 SvgDocument 的受控入口并产生摘要。

delete 对叶子/容器统一移除目标子树并重建索引；undo 直接恢复前文档，不用重新 create 或 addto 推算原位置。恢复包括具体类型、全部后代 id、父级、同级位置、几何精度、文本与属性缺省。恢复摘要包含原父级，例如题目的 `rect#box restored into g#markers`；根级为 svg。

front 移到同级末尾，back 移到同级开头，不跨父级或修改节点自身内容。ShapeTree 的两个 id/父级索引不随这种重排变化，描述仍按新列表顺序生成；快照复制时重新建索引。当前摘要为 moved to front/back，撤销为 order restored，这是题目未指定措辞的工程选择。

每条成功操作一个历史单元；已在边界的成功 front/back 按 D05 仍入栈、解禁并清空 redo。失败删除/重排保持文档、源路径、两栈和屏障。删除后显式复用旧 id 是新编辑，按标准历史规则恢复该次状态，不另设全局递增 id 计数。

- [领域顺序测试](../tests/domain/TreeOrder.test.ts)：根/嵌套顺序、完整子树、边界无变化、失败不变、有序列表替换以及重排/分组/删除组合。
- [删除与历史测试](../tests/application/TreeOrderCommands.test.ts)：六种统一删除、S03 嵌套子树、根级恢复和 id 复用、前后顺序一步恢复、redo 分支、失败/无文档与全部编辑的连续逐步恢复。
- 真实 CliHistory 继续编译当前源码，回放 [tree-order.cli](../tests/fixtures/tree-order.cli)，核对删除/恢复摘要和错误后继续。

## 完成边界与提交安排

两个单元的完整入口均通过；最终 14 个测试文件、290 项测试，包含原阶段 4 的 210 项和本轮新增 80 项。分别保留可审查快照、差异和清单，确认后依次提交 A，再提交相对 A 的 B，避免一次性混入整个阶段。

共享文件在两个单元都可能出现，第一次只暂存分组/归属检查点，第二次才加入删除/顺序增量；清单项数不能简单相加作为唯一文件数。所有准备均未 add/commit/push。阶段 6 尚未授权，D09 仍需在 SVG 读写前定稿；没有创建 test-report.md 或执行完整系统验收/浏览器 SVG 预览。
