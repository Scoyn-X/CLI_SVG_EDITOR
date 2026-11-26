import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';
import assert from 'node:assert/strict';
import ts from 'typescript';

const groups = new Map([
  ['src/domain/', ['内核', 'SVG 领域对象与结构']],
  ['src/application/', ['内核', '编辑命令、状态与扩展契约']],
  ['src/ports/', ['内核', '输入输出及扩展接口']],
  ['src/adapters/', ['内核', 'CLI、SVG 和文件系统适配']],
  ['src/bootstrap/', ['装配', '启动、插件加载与依赖组装']],
  ['src/plugins/', ['插件', '独立插件实现与清单']],
  ['vscode-extension/src/', ['VS Code', '编辑器扩展']],
]);
const decisionKinds = new Set([
  ts.SyntaxKind.IfStatement, ts.SyntaxKind.ConditionalExpression, ts.SyntaxKind.CatchClause, ts.SyntaxKind.CaseClause,
  ts.SyntaxKind.ForStatement, ts.SyntaxKind.ForInStatement, ts.SyntaxKind.ForOfStatement, ts.SyntaxKind.WhileStatement, ts.SyntaxKind.DoStatement,
]);
const logicalKinds = new Set([ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken]);

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', windowsHide: true });
}

function complexity(path, source) {
  if (!path.endsWith('.ts')) { return 0; }
  let total = 0;
  const visit = (node, executable = false) => {
    if (ts.isFunctionLike(node)) {
      if (!node.body) { return; }
      total++;
      visit(node.body, true);
      return;
    }
    if (executable && (decisionKinds.has(node.kind) || (ts.isBinaryExpression(node) && logicalKinds.has(node.operatorToken.kind)))) { total++; }
    ts.forEachChild(node, child => visit(child, executable));
  };
  visit(ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true));
  return total;
}

function responsibility(path, source, fallback) {
  if (path.endsWith('package.json')) { return '独立插件包入口与 contributes 清单'; }
  if (path === 'src/bootstrap/main.ts') { return 'CLI 参数、插件装入与 REPL 启动'; }
  if (path === 'vscode-extension/src/extension.ts') { return '向 VS Code 注册文件装饰和文档符号提供者'; }
  const tree = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const declarations = tree.statements.filter(node => ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node));
  const names = declarations.map(node => node.name?.text).filter(Boolean).join('、');
  const members = declarations.flatMap(node => node.members)
    .filter(node => ts.isMethodDeclaration(node) || ts.isMethodSignature(node))
    .filter(node => !node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword || modifier.kind === ts.SyntaxKind.ProtectedKeyword))
    .map(node => node.name.getText(tree));
  return `${fallback}：${names || path.split('/').at(-1)}${members.length ? `；公开操作 ${[...new Set(members)].join('、')}` : ''}`;
}

function collect(ref) {
  const worktree = ref === '--worktree';
  const revision = worktree ? '工作树（含未跟踪源码）' : git(['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]).trim();
  const paths = worktree ? git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
    : git(['ls-tree', '-r', '--name-only', '-z', revision]);
  const candidates = [...new Set(paths.split('\0'))].sort().filter(path =>
    [...groups.keys()].some(prefix => path.startsWith(prefix))
    && (path.endsWith('.ts') || /^src\/plugins\/[^/]+\/package\.json$/.test(path))
    && (!worktree || existsSync(path)));
  const sources = new Map();
  if (!worktree && candidates.length) {
    const batch = execFileSync('git', ['cat-file', '--batch'], {
      input: candidates.map(path => `${revision}:${path}\n`).join(''), windowsHide: true,
    });
    let offset = 0;
    for (const path of candidates) {
      const end = batch.indexOf(10, offset);
      const header = batch.subarray(offset, end).toString('utf8');
      const match = /^[a-f0-9]+ blob (\d+)$/.exec(header);
      if (!match) { throw new Error(`cannot read Git blob: ${path}`); }
      const size = Number(match[1]);
      sources.set(path, batch.subarray(end + 1, end + 1 + size).toString('utf8'));
      offset = end + 1 + size + 1;
    }
  }
  const files = new Map();
  for (const path of candidates) {
    const group = [...groups].find(([prefix]) => path.startsWith(prefix))?.[1];
    const source = worktree ? readFileSync(path, 'utf8') : sources.get(path);
    files.set(path, {
      group: group[0], role: responsibility(path, source, group[1]),
      lines: source === '' ? 0 : source.replace(/\r?\n$/, '').split(/\r?\n/).length,
      complexity: complexity(path, source),
    });
  }
  return { revision, files };
}

function total(files, group) {
  const values = [...files.values()].filter(file => file.group === group);
  return [values.length, values.reduce((sum, file) => sum + file.lines, 0), values.reduce((sum, file) => sum + file.complexity, 0)];
}

if (process.argv[2] === '--self-test') {
  assert.equal(complexity('interface.ts', 'export interface I { run(): void; }'), 0);
  assert.equal(complexity('branch.ts', 'function f(x) { if (x && x.a) return 1; return 0; }'), 3);
  assert.equal(complexity('nested.ts', 'function f() { return () => true ? 1 : 0; }'), 3);
  assert.equal(complexity('declaration.ts', 'declare function f(): void;'), 0);
  assert.equal(complexity('loop.ts', 'function f(xs) { for (const x of xs) { try { switch (x) { case 1: break; default: break; } } catch {} } }'), 4);
  process.stdout.write('metrics self-test OK (5 fixtures)\n');
  process.exit(0);
}
const [base = 'final', target = 'p2'] = process.argv.slice(2);
const before = collect(base);
const after = collect(target);
const lines = [
  '# Phase 2 源码指标', '',
  `基线 \`${base}\`（${before.revision}）`, '',
  `目标 \`${target}\`（${after.revision}）`, '',
  ...(target === '--worktree' ? ['工作树开发快照；历史版本报告请指定目标提交。', ''] : []),
  '口径：物理行含空行和注释；圈复杂度为有函数体的函数/方法/构造器/访问器/箭头函数的路径数之和。每个实现起点 1，if、三元、catch、非 default 的 case、循环及 && / || / ?? 各加 1；嵌套函数独立计数。接口、声明、模块顶层语句与类型表达式不计圈复杂度。VS Code 单列，不计入 CLI 增量。', '',
  '| 类别 | 文件数 基线 → 目标 | 行数 基线 → 目标 | 圈复杂度 基线 → 目标（增量） |',
  '| --- | ---: | ---: | ---: |',
];
for (const group of ['内核', '装配', '插件', 'VS Code']) {
  const [oldFiles, oldLines, oldComplexity] = total(before.files, group);
  const [newFiles, newLines, newComplexity] = total(after.files, group);
  lines.push(`| ${group} | ${oldFiles} → ${newFiles} | ${oldLines} → ${newLines} | ${oldComplexity} → ${newComplexity}（${newComplexity - oldComplexity}） |`);
}
lines.push('', '## 文件清单', '', '| 文件 | 类别与职责 | 行数 基线 → 目标 | 圈复杂度 基线 → 目标 |', '| --- | --- | ---: | ---: |');
for (const path of [...new Set([...before.files.keys(), ...after.files.keys()])].sort()) {
  const oldFile = before.files.get(path);
  const newFile = after.files.get(path);
  const file = newFile ?? oldFile;
  lines.push(`| \`${path}\` | ${file.group} · ${file.role} | ${oldFile?.lines ?? 0} → ${newFile?.lines ?? 0} | ${oldFile?.complexity ?? 0} → ${newFile?.complexity ?? 0} |`);
}
process.stdout.write(lines.join('\n') + '\n');
