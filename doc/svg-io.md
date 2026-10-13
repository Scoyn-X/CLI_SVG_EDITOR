# SVG 与文件读写

2026-10-13，阶段 6。课程范围是六类图形的编辑器，以下为可修订工程基线，不能代替教师补充要求。

## 实际架构

`ReadCommand`/`SaveCommand` 依赖 `DocumentStorage` 与 `SvgCodec`；NodeDocumentStorage 负责路径与文件，XmlSvgCodec 负责 XML。`SvgElement` 是冻结的中立解析描述，ShapeFactory 的同一 provider 查找服务 create 和导入，提供者多态构造各类图形，没有第三处类型名分派。ImportedDocument 封装独立候选文档和 IdAssignment 警告。

`PresentationAttributes`/`CanvasAttributes` 校验受控元数据，模型复制保留它们。read 全文扫描显式 id，再按前序分配最小可用序号；所有校验成功后才发布文档、路径、警告与屏障。save 编码并准备反馈，实际写入成功后才建立屏障。同步会话锁覆盖 IO 回调，重入拒绝且失败后释放。

## 支持范围与取舍

| 项目 | 行为 |
| --- | --- |
| XML | XML 1.0 / UTF-8；标准 SVG 命名空间（可用前缀）；注释忽略、CDATA 转纯文本；转义文本及属性，包括 CR、属性 TAB/LF |
| 元素 | rect/circle/ellipse/line/text/g；有序嵌套，text 只允许纯文本；svg 根不是可编辑 id |
| 尺寸 | 根宽高必需、正数，数字或 px；几何无单位有限数字、省略按 0；尺寸非负 |
| 样式 | fill/stroke/stroke-width 属性存在性保留；不写入未设置的默认值，不物化继承 |
| 额外属性 | translate/scale transform、font-size 数字或 px、text-anchor、data-kind；root 可保留样式、transform、字体、非默认 viewBox/preserveAspectRatio |
| 变换编辑 | 变换原样保留；move/scale 操作存储的局部几何，font-size/stroke-width 不缩放。group/addto/ungroup 改父级可能改变继承或变换后的外观，不补偿世界坐标 |
| viewBox | 导入时等于 0 0 width height 的视为原生坐标系，随 canvas 修改；其余保留。clone 不重新归一化，避免修改尺寸后失去自定义坐标系 |
| 明确拒绝 | 未知标签/属性、style/CSS、tspan、rotate/matrix/skew、百分比或缺根尺寸、非支持单位、DTD/处理指令、外部实体、非法值/重复 id；不静默丢失内容 |

data-kind 只保留为元数据，不注册或恢复 box；CLI set 白名单保持课程原文。

连续变换之间校验合法空白/逗号分隔，数字列表仅接受 XML 空白，不把 NBSP 当成 SVG 分隔符；依据 [SVG 1.1 transform 语法](https://www.w3.org/TR/SVG11/coords.html#TransformAttribute)，回归用例覆盖无分隔、非标准空白、合法空格/逗号组合。

## 路径与保存

相对路径按启动目录解析，read 记绝对路径；init 清除来源，显式另存不改变读入路径，无来源的 save 报单行错误。同目录随机临时文件使用独占创建，写入/flush/关闭后 rename 替换；不先删除已有目标，finally 只尝试清理本次临时文件。已验证 Windows 下覆盖与失败保护；不承诺跨文件系统原子性或断电持久性。目录/符号链接目标拒绝，缺父目录不自动创建，非 UTF-8 读取失败。清理本身失败可能留下临时文件，原始错误优先。

## 依赖选择与实际验证

运行时唯一新增依赖 [@rgrove/parse-xml 官方项目](https://github.com/rgrove/parse-xml) 5.0.0（ISC，无传递依赖），锁文件固定。XML 解析交给该库，命名空间作用域及 SVG 白名单由适配器校验，不访问外部实体。曾尝试 saxes 6.0.0，其类型声明在 TS 6 / exactOptionalPropertyTypes 下失败，已撤换；未使用 skipLibCheck 绕过。

- [编解码测试](../tests/adapters/XmlSvgCodec.test.ts)：六类/嵌套、变换/字体/坐标系、特殊文本、前序补 id、重复/非法 XML/不支持内容、复制与画布修改。
- [文档命令集成](../tests/integration/DocumentCommands.test.ts)：路径与警告、保存屏障、失败保留 redo、重入保护。
- [真实文件测试](../tests/adapters/NodeDocumentStorage.test.ts)：首次/覆盖保存、中文空格路径、非法 UTF-8，注入 write/flush/rename 失败验证旧文件与临时文件。

本阶段验证 A02—A05、A23/A24、S04/S08 的对应范围；完整系统回归和浏览器预览安排阶段 8。

验证结果：修复 viewBox 复制问题后 npm run check 全部通过，17 个测试文件、345 项测试；生产依赖检查 83 个模块、258 条依赖，0 违规。类型、lint、构建、CLI 组装检查均通过。
