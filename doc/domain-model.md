# 领域模型实施记录

阶段 3，2026-10-11；该基线已以 6bd9a43 推送至 feature-domain-model。阶段 4 扩充中立 position 描述；阶段 5 扩充受控重组和解散能力，不改变领域依赖方向。应用见 [command-history.md](command-history.md)，树编辑见 [tree-editing.md](tree-editing.md)。

## 实际职责与入口

| 类 | 已实现职责 |
| --- | --- |
| SvgDocument | 画布尺寸、对外的 id 操作入口、文档描述和独立复制 |
| ShapeTree | 独立维护树、全局 id 索引及父级索引，整体附着/移除子树；不处理路径、历史或输出 |
| Shape / LeafShape | 统一 move、scale、set、describe、clone；叶子封装不可变几何值 |
| Rect / Circle / Ellipse / Line / Text | 各自声明坐标、尺寸与合法属性；多态复制保留具体类；Text 单独保存文本 |
| Group | 有序子树及 Composite 递归修改；样式只设在组自身 |
| Geometry / GeometryTransform | 几何值与增量/缩放计算；按坐标轴和尺寸计算，不比较图形类型名 |
| StyleAttributes | 不可变的明确样式值，省略属性与显式设置保持区分 |
| ShapeChange | 内部已验证修改的集合；先准备整棵子树，再应用，不是 Command 或历史条目 |
| ShapeDescription / DocumentDescription | 不可变中立视图，不携带终端格式、XML 字符串或可写模型引用 |
| OrderedChildren / ShapeAccess / ShapeTraversal | 领域内部有序存储、容器协作键、前序遍历与树/id 校验 |
| ValueValidation / DomainError | 领域标量规则和无输出副作用的错误；交互边界以后添加 error: 前缀 |

当前 24 个类（原 21 加 PresentationAttributes、CanvasAttributes、GeometrySummary）各占一个同名文件，实例字段封装在类内。领域没有 Node、终端、文件系统、XML、应用或适配器依赖；公共方法的行为由类承担，没有自由函数形式的领域流程。

对外主要使用 SvgDocument：

```ts
const document = new SvgDocument();
document.add(new Group('scene'));
document.add(new Rect('r', 10, 20, 30, 40), 'scene');
document.add(new Text('t', 15, 25, '开始'), 'scene');
document.move('scene', 5, -2);
const snapshot = document.clone();
document.set('r', 'fill', '#eee');
const view = snapshot.describeShape('r'); // 快照仍未设置 fill
```

示例展示领域 API 调用；对应 CLI 已通过命令层提供。实际 API 还有 resize、scale、remove、describe、getParentId、getElementCount。传入图形在附着时被复制；describeShape 返回 ShapeDescription，不返回所持有的 Shape。

## 树与封装

ShapeTree 拥有有序根列表、id 到实例的索引和 id 到父 id 的索引。根画布不是 g，不占元素数或保留图形 id。输入 id 大小写敏感，允许中文，不额外强制 ASCII；按 D01 暂定规则拒绝空 id、空白与 XML 非法字符。

构造/附着前遍历整个输入子树，检查重复 id、对象共享和环；构造 Group 时也检查父 id 与全部子孙不重复。新输入与现有全文档索引一起校验，复制后再验证实际副本，成功才附着。失败不留下部分子孙，id 也可在后续合法添加中重用。删除子树移除全部子孙，随后同步重建 id 和父级索引；其他节点顺序不变。

容器资格通过 ShapeAccess.children 协作能力取得，不以 `getTag() === 'g'` 决定。ShapeAccess、OrderedChildren、ShapeTraversal 和 prepareTransform 是内部协作机制，适配器/应用不应调用；文档没有暴露这些内部节点。协作键是模块约定，不是面向任意恶意 JS 的安全机制；代码审查仍需禁止跨层使用它。

阶段 3 当时只有插入/移除基础；阶段 5 已扩充 group、ungroup、addTo、front/back，后者只重排同级。全部结构修改仍走受控领域入口，历史由应用 Command/Memento 组织，不把节点列表交给 CLI 修改；完整树编辑证据另见本阶段记录。

## 几何、样式与失败原子性

每种叶子通过 Geometry 声明 x 轴坐标、y 轴坐标及尺寸；move 加增量，scale 正数因子乘位置和尺寸。stroke-width 不属于几何，不随 scale 改变；Text 仅缩放位置，文本不变。按 D02 暂定语义，几何尺寸与描边宽度允许零、禁止负数，画布宽高严格正；全部数字及运算结果必须有限。

set 数字接受完整十进制/科学计数 token，不接受空白、px、十六进制或尾随字符。各类型只有构造时声明的几何属性与公共 fill/stroke/stroke-width，Text 另外允许 text；Group 没有 x/y/text。同时拒绝原型链上继承的属性名，防止 constructor/toString 被误认为合法几何属性。

叶子先生成新的不可变 Geometry，校验成功才替换原值。Group 通过多态 prepareTransform 收集全部子孙的 ShapeChange，全部准备成功后才应用；晚出现的数值溢出不会改变早出现的图形。应用阶段仅赋值已验证状态，不再次做可能失败的标量校验。结构附着、尺寸更新和属性设置同样先验证后改变状态。

这是当前内置领域操作的原子性保证；阶段 4 仍按 D08 在独立候选文档上执行整条 Command，以覆盖跨多个领域操作、历史及会话状态的失败。

字符串允许中文、空文本和特殊字符；非法码点依据 [XML 1.0 字符范围](https://www.w3.org/TR/xml/#charsets) 拒绝。这里只做值校验，文本和属性的 XML 转义在阶段 6 编解码器中实现。

## 描述与复制

describe 通过多态获得完整属性、文本与有序子描述；数据离开模型后冻结，旧视图不随后续编辑改变。当前完整属性包含受控元数据，GeometrySummary 提供属性/点列分组，Text/Line 多态声明点；CliPresenter 消费中立分组，不增加按图形标签分派。

阶段 4 增加只读 position 锚点以供移动摘要：LeafShape 经 Geometry 的第一对 x/y 声明提供坐标（line 为首端点），Group 没有自身锚点。ShapeDescription 复制并冻结该元组；领域不产生 moved to 等终端文字，命令不靠标签判断叶子/容器。

clone 由每个具体类实现。Group 递归复制全部子节点，ShapeTree 重建父级和索引，SvgDocument 保存精确画布尺寸；不使用 JSON 转换或 SVG 序列化。坐标和尺寸直接复制原数值，保留浮点精度、空文本、子类型及属性未设置状态。StyleAttributes 可以共享不可变值实例，后续 set 产生新值，不共享可写状态。

完整复制为 O(N)；插入/删除后索引重建也为 O(N)。本阶段接受该成本，后续先验证正确性，再根据实际规模考虑优化，不提前实现增量快照或插件框架。

## 验证与下一步

81 个领域测试位于 Shapes.test.ts、Group.test.ts、SvgDocument.test.ts：五种叶子几何/白名单、组递归/样式、六类根级及嵌套附着、全局唯一 id、树索引、环/共享节点拒绝、失败不变、深复制与只读视图。完整入口 npm run check 共 118 个测试通过，含既有 37 个工程测试；类型、lint、构建及 23 模块/55 依赖的架构检查通过。

对应课程验收是部分证据，见 [acceptance.md](acceptance.md)。上述 81 项是阶段 3 基线验证；阶段 4 已在其上加入 Command、历史与最小 CLI，最新验证见主文档。阶段 6—8 已完成 SVG 读写、完整 CLI 与系统验收，当前报告见 test-report.md；上述 118 项只是阶段 3 的历史检查点。


## 2026-10-13 阶段 6 更新

SVG 与真实文件 IO 已实现；read/save 复用共享 ShapeFactory 与会话发布边界，严格失败原子性、补 id、路径、屏障和受控元数据往返。实际类、支持范围、依赖选择及验证见 [SVG 与文件说明](svg-io.md)。历史阶段的“尚未实现”是当时状态，以本更新为当前状态。用户授权自动完成剩余阶段并逐步提交推送，本次明确不创建标签。


## 2026-10-13 阶段 7 更新

全部 19 条命令接通：tree/show 按不可变描述及多态显示协议渲染，help 包含六类完整语法。新增 GeometrySummary 不含终端字符串，不增加类型名分派；查询及失败查询保持历史。课程 transcript 与版本 A 通过真实进程回放并读回保存产物。职责及实际样例见 [完整命令行](cli.md)，阶段 8 接续独立系统验收。
