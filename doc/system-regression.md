# 独立系统回归与缺陷修复

2026-10-13，阶段 8；基线 09ee2d3，分支 test-system-regression。功能阶段持续测试已通过，本阶段对照验收补齐跨模块和静态审查证据。

## 发现与修复

| 编号 | 复现/影响 | 修复及回归 |
| --- | --- | --- |
| R01 | 先前编译产物接受 `<:rect/>` 并导入一个 rect。XML Name 验证不等于命名空间 QName 验证，非法前缀可能被忽略 | XmlSvgCodec 独立检查前缀/局部名 NCName 首字符及 namespace 声明；SystemRegression 覆盖空前缀、数字首字符、多重冒号、错误声明与合法 Unicode 前缀 |
| R02 | 静态复查发现 ReadCommand 在会话锁外解析路径；依赖回调若重入修改会话后失败，会破坏失败原子性 | EditorSession.readDocument 在锁内解析/校验绝对路径，再读文件与构造候选；新增回调重入用例断言文档、路径、redo 不变 |
| R03（阶段 6 已修复） | 非默认 viewBox 恰好等于 resize 后尺寸时，clone 再归一化可能失去自定义坐标系 | 归一化只在导入一次，领域复制保留 CanvasAttributes；XmlSvgCodec 测试验证复制后再 resize 的 viewBox |
| R04（交付复核） | 连续 transform 没有分隔符、或使用 NBSP 也能通过，保存了非法 SVG 变换 | 按 SVG comma-wsp 检查函数间分隔及 XML 空白，numbers 拒绝 NBSP；XmlSvgCodec 新增合法/非法分隔符回归 |

没有改变 set 白名单、加入 box 或放宽 TypeScript 严格配置。R01/R02 与回归测试同一提交，不将整套剩余项目做成一次提交。

## 新增独立证据

SystemRegression 覆盖 S02 保存屏障、S07 样式继承缺省/显式区别、元数据经历编辑/撤销/保存读回、编码和路径失败保持 redo、控制字符单行显示。真实 CLI 补带空格中文路径、文件不存在/无效 SVG/目录写目标失败后继续 redo、另存与无参保存的源路径，以及 §0.1 嵌套 transform/字体实际读写。

OopConventions 使用 TypeScript AST 检查每个类位于同名唯一文件、实例字段封装、无顶层业务函数、无 switch，辅助核对名字注册查找位置。该检查不是完整程序证明，结合人工抽查 Dispatcher、ShapeFactory、提供者、codec、presenter、clone 确认两处分派、Command 与 Composite 的实际落点；ShapeAccess 的静态 readonly Symbol 是内部协作键，不是可写公共状态。

运行环境由 npm ci 按锁文件重新恢复，194 包审计 0 漏洞。生产依赖仍为单个 XML 库，开发工具不进入业务层。

## 架构图与浏览器预览准备

[architecture.puml](architecture.puml) 的“planned”标题已改为实际实现，并保持课程文档内嵌图一致。[architecture.svg](architecture.svg) 使用官方 PlantUML 1.2026.8、Java 25.0.3、Smetana 渲染成功；无需 Graphviz，图像完整。命令：

```sh
java -jar artifacts/plantuml-1.2026.8.jar -Playout=smetana -tsvg doc/architecture.puml
```

[PlantUML 官方发布](https://github.com/plantuml/plantuml/releases/tag/v1.2026.8) 下载包 SHA-256 与发布摘要一致：5e1ecfa8ecd32c90b03bbf3b1eb6f020943f98ab0fcf4032be31a0002ee2c462。[官方布局说明](https://plantuml.com/layout-engines) 说明 Smetana 参数。jar 仅存忽略目录，不作为项目运行依赖。

doc/examples 中保存真实 CLI 生成的课程会话与流程图 SVG。浏览器禁止 file 协议，遵守限制，不启动本地文件代理；在已授权推送后预览仓库 HTTPS 公开示例。最终浏览器观察与逐项 A/S 映射记录于后续 test-report.md，不把准备状态写成已预览。

最新代码完整回归：npm run check 全部通过，20 个测试文件、368 项测试；依赖检查 91 个模块、288 条依赖，0 违规。生产源码 85 文件、77 类、7 接口及入口；需求原文和第一次讨论副本未变。

交付复核 R04 后再次完整 npm run check 通过：20 个测试文件、376 项测试，生产依赖仍 91 模块/288 依赖、0 违规。阶段 8 的 368 项记录保留为当时结果，本条是最终代码修复后的最新回归。
