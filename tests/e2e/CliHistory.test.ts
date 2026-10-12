import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));
const output = resolve(root, 'artifacts/e2e-build');
const entry = resolve(output, 'bootstrap/main.js');

beforeAll(() => {
  // 独立 npm test 也编译当前源码，避免测试误用旧 dist；产物不纳入 Git。
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.build.json', '--outDir', output],
    { cwd: root, timeout: 30_000, stdio: 'pipe' });
}, 35_000);

describe('真实 CLI 进程', () => {
  it('分组、解组与归属回放产生规定反馈，帮助自动覆盖新命令', () => {
    const input = readFileSync(resolve(root, 'tests/fixtures/tree-grouping.cli'), 'utf8');
    const child = spawnSync(process.execPath, [entry], { cwd: root, input, encoding: 'utf8', timeout: 5_000 });
    expect(child.error).toBeUndefined();
    expect(child.status).toBe(0);
    expect(child.stderr).toBe('');
    const messages = child.stdout.split('svg> ').map(part => part.trim()).filter(Boolean);
    expect(messages.slice(1, -1)).toEqual([
      'canvas 800x600 created', 'g#outer created', 'rect#a created in g#outer', 'circle#b created in g#outer',
      'g#pair created with 2 children', 'g#pair grouping undone', 'g#pair created with 2 children',
      'g#pair ungrouped', 'g#pair grouping restored', 'error: cannot group a container into its own descendant: pair',
      'g#target created', 'g#pair moved into g#target', 'g#pair restored into g#outer', 'g#pair moved into g#target',
      'error: cannot ungroup top-level container: target', 'error: cannot add a shape into itself or its descendant: target',
    ]);
    expect(messages.at(-1)).toContain('group <newGid> <id1> <id2>…');
    expect(messages.at(-1)).toContain('ungroup <gid>');
    expect(messages.at(-1)).toContain('addto <gid> <id>');
  });

  it('逐行回放历史 fixture，错误后继续执行，EOF 正常退出', () => {
    const input = readFileSync(resolve(root, 'tests/fixtures/history.cli'), 'utf8');
    const child = spawnSync(process.execPath, [entry], { cwd: root, input, encoding: 'utf8', timeout: 5_000 });
    expect(child.error).toBeUndefined();
    expect(child.status).toBe(0);
    expect(child.stderr).toBe('');
    const messages = child.stdout.split('svg> ').map(part => part.trim()).filter(Boolean);
    expect(messages).toEqual([
      "svg-editor 0.1 — type 'help' for commands",
      'canvas 400x200 created', 'error: undo not allowed after io command',
      'circle#c1 created', 'circle#c1 moved to (130,100)', 'circle#c1 moved back to (100,100)',
      'error: id already exists: c1', 'canvas 400x200', 'circle#c1 moved to (130,100)',
      'g#node created', 'text#title created in g#node',
      'text#title updated: text="My Diagram v2"', 'text#title updated: text="in"', 'text#title updated: text="My Diagram v2"',
      'canvas 500x300', 'error: undo not allowed after io command', 'error: undo not allowed after io command',
      'g#node moved by (0,100)', 'g#node moved back by (0,-100)', 'error: nothing to undo',
      'error: unknown shape type: box (is the plugin loaded?)',
    ]);
    expect(child.stdout.match(/svg> /g)).toHaveLength(input.trimEnd().split(/\r?\n/u).length + 1);
  });

  it('CRLF、空行、未闭合引号、颜色与空文本在实际进程中正确处理', () => {
    const child = spawnSync(process.execPath, [entry], { cwd: root, input: '\r\ninit\r\ncreate text bad 1 2 "bad\r\ncreate text t 1 2 ""\r\ncreate rect a 0 0 1 1 #3366ff\r\n', encoding: 'utf8', timeout: 5_000 });
    expect(child.status).toBe(0);
    expect(child.stderr).toBe('');
    expect(child.stdout).toContain('error: unterminated double quote\n');
    expect(child.stdout).toContain('text#t created\n');
    expect(child.stdout).toContain('rect#a created\n');
  });

  it('组装检查模式无需输入即可退出，交互模式空 EOF 也正常退出', () => {
    const check = spawnSync(process.execPath, [entry, '--check'], { cwd: root, encoding: 'utf8', timeout: 5_000 });
    expect(check.status).toBe(0);
    expect(check.stdout).toContain('编辑器组装检查通过');
    const empty = spawnSync(process.execPath, [entry], { cwd: root, input: '', encoding: 'utf8', timeout: 5_000 });
    expect(empty.status).toBe(0);
    expect(empty.stdout).toContain('svg> ');
  });
});
