# 开发与回放

2026-10-13，课程 Phase 1 完整实现。运行 Node.js >=24.11.0 <25、npm 11；已验证 Windows / Node24.11.0 / npm11.6.1。

## 工具与入口

唯一生产依赖 @rgrove/parse-xml5.0.0（ISC）。TypeScript6.0.3、Vitest5.0.3、ESLint10.12.0、@eslint/js10.0.1、typescript-eslint8.71.1、@types/node24.19.2、dependency-cruiser18.5.0 为固定开发依赖；精确版本及传递依赖见 package.json/package-lock.json。

| 命令 | 实际内容 |
| --- | --- |
| npm ci | 按锁文件恢复依赖 |
| npm run typecheck | src/tests/Vitest配置严格类型，skipLibCheck=false |
| npm run lint | ESLint，警告上限0 |
| npm run build | 仅生产src编译到dist |
| npm run check:architecture | 真实生产依赖，含仅类型导入、循环/未解析/越界/开发工具 |
| npm test / npm run test:watch | 单次全量 / 开发持续测试 |
| npm run check:runtime | 编译后的组装--check |
| npm run check | 顺序包含全部检查；任一失败即停止 |
| npm run cli | 构建后启动REPL，EOF退出 |

## Windows 回放

在仓库根目录执行，先创建样例保存目录；文件适配器不会自动创建父目录。PowerShell：

```powershell
npm ci
npm run build
New-Item -ItemType Directory -Path artifacts -Force | Out-Null
$OutputEncoding = [System.Text.UTF8Encoding]::new()
Get-Content -Raw -Encoding utf8 tests/fixtures/typical.cli | node dist/bootstrap/main.js
Get-Content -Raw -Encoding utf8 tests/fixtures/flowchart.cli | node dist/bootstrap/main.js
```

产物 artifacts/demo.svg、artifacts/flowchart.svg 可以浏览器打开，已提交的对应样例见 doc/examples。路径相对启动工作目录，read记绝对源路径；带空格路径使用双引号。另存不改变来源，无来源save报错。支持范围及变换语义见 [svg-io.md](svg-io.md)。

## 检查边界

真实CLI端到端测试先独立编译当前源码到artifacts/e2e-build，再启动子进程，独立npm test也不会误用旧dist。Vitest模块缓存固定artifacts/vitest-cache，避免此前Windows沙箱临时缓存故障。架构负例通过真实dependency-cruiser运行；OOP AST检查结合人工模式/分派审查，不声称仅靠工具证明架构正确。

dist/node_modules/artifacts/coverage及日志忽略。没有CI、跨平台或大图性能结果。最终本地检查见 [test-report.md](test-report.md)，阶段历史见 [historical-checks.md](historical-checks.md)。受工具沙箱的spawn权限限制时，应使用已有执行权限运行同一检查，不能通过删除测试或放宽规则绕过。

用户授权本次剩余阶段自动提交推送，取消add清单确认；提交格式与任务分支规范继续遵守agent.md。标签本次明确不创建。
