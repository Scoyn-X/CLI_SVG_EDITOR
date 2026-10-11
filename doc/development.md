# 开发环境与工程检查

2026-10-11 工程基础初始化。以下入口已经配置；业务功能和课程验收尚未完成。

## 环境与依赖

- Node.js `>=24.11.0 <25`、npm `>=11 <12`；本轮环境为 Node.js 24.11.0、npm 11.6.1。
- `.nvmrc` 提供 24.11.0 基准；可以使用同一范围内的较新补丁版本。Node.js 版本管理工具是可选项。
- 本地 `.npmrc` 使用官方 npm registry，开启精确直接依赖版本和环境校验，缓存位于忽略的 `artifacts/npm-cache`。不修改全局 npm 设置。
- 提交 `package-lock.json`；后续恢复用 `npm ci`，有意更新依赖时重新核对兼容性并说明锁文件变化。项目设为 private，不发布 npm 包。

| 工具 | 锁定的直接依赖版本 | 用途 |
| --- | --- | --- |
| TypeScript | 6.0.3 | strict 类型检查与 Node ESM 构建 |
| @types/node | 24.19.2 | 与 Node.js 24 主版本匹配的类型 |
| ESLint / @eslint/js | 10.12.0 / 10.0.1 | 静态检查 |
| typescript-eslint | 8.71.1 | 类型感知规则与显式成员访问权限 |
| Vitest | 5.0.3 | 单元和架构规则回归测试 |
| dependency-cruiser | 18.5.0 | 实际 imports、类型依赖、循环及边界检查 |

选型时核对官方 npm 元数据。typescript-eslint 的 TypeScript peer 范围为 `>=4.8.4 <6.1.0`，因此使用兼容的 6.0.3，没有选当时较新的 TypeScript 7。上述依赖均为开发依赖，当前没有业务运行时第三方依赖。

参考：[TypeScript 配置](https://www.typescriptlang.org/tsconfig/)、[typescript-eslint 配置](https://typescript-eslint.io/getting-started/)、[Vitest](https://vitest.dev/guide/)、[dependency-cruiser 规则](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md)。

## 运行入口

在仓库根目录运行：

```sh
npm ci
npm run check
```

| 命令 | 实际作用 |
| --- | --- |
| npm run typecheck | 检查 src、tests 和 Vitest 配置，不生成文件 |
| npm run lint | 检查源码、测试与 JS 配置，警告也导致失败 |
| npm run build | 仅编译 src 到 dist；测试和配置不进入产物 |
| npm run check:architecture | 使用依赖规则检查真实 src，包括类型 import |
| npm test | 执行全部已存在的测试并退出；没有用例时失败 |
| npm run test:watch | 开发时监听测试；不是提交前验证命令 |
| npm run check:runtime | 运行 dist/bootstrap/main.js，须先 build |
| npm run check | 依次运行类型、lint、构建、依赖、测试和启动验证，任一失败停止 |

采用 NodeNext ESM，TypeScript 本地 imports 使用 `.js` 后缀，由编译器解析对应 `.ts`。编译目标与 lib 为 ES2024，没有浏览器 DOM 类型。开启 strict、索引访问与可选属性严格校验、override、未使用变量和参数检查；不跳过依赖类型检查。

`src/bootstrap/main.ts` 是最小组装入口，只检查 Node.js 环境并输出工程状态；`RuntimeEnvironment.ts` 一类一文件且封装版本字段。这里没有 Command、图形模型或 REPL，课程功能完成前不能将此入口当作编辑器。

## 架构检查范围

`dependency-cruiser.config.json` 对应 [课程主文档](README.md) 中的依赖规则：领域只依赖领域；协议、应用和各适配器按允许方向使用内层；具体组装集中在 bootstrap。Node 内置模块仅允许 CLI、文件适配器和启动入口使用；生产第三方库仅允许 SVG 适配器使用。未来需要其他依赖时先说明职责和影响，同步规则。

所有规则违例为 error。还检查无法解析的 import、循环、生产代码依赖 tests 或开发工具。启用编译前依赖，接口的 `import type` 也受边界限制。

`tests/architecture` 在 `artifacts/architecture-tests` 创建隔离样例并调用真实检查器，验证允许依赖、违规方向、Node IO 越界、循环、未解析路径、生产导入测试和开发工具。临时目录在每例结束后清理；不往真实生产目录插入违例。

静态 imports 无法判断 CLI 是否通过领域方法绕过应用，不能证明字段没有通过其他方式泄漏，也不能自动确认仅有两处分派、Command/Composite 的语义或全量功能完整。这些项目在后续实现阶段仍需代码审查与行为测试。当前目录骨架中的 `.gitkeep` 只保留规划目录，不表示对应模块已实现。

## 验证记录

实际执行结果写入 [主文档的工程初始化记录](README.md#5-v04-工程基础初始化检查)。课程功能结果仍通过 [验收清单](acceptance.md) 和 [测试计划](testing.md) 记录；阶段 8 才根据实际系统测试编写 test-report.md。

`dist/`、`node_modules/`、缓存、测试临时文件和后续 coverage 均不提交。每次提交仍先给完整 add 清单并等待用户确认；检查通过不改变提交、推送或标签权限。
