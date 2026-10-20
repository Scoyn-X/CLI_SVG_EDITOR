import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { XmlSvgCodec } from '../../src/adapters/svg/XmlSvgCodec.js';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const output = resolve(root, 'artifacts/e2e-build');
const entry = resolve(output, 'bootstrap/main.js');

beforeAll(() => {
  // 独立 npm test 也编译当前源码，避免测试误用旧 dist；产物不纳入 Git。
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.build.json', '--outDir', output],
    { cwd: root, timeout: 30_000, stdio: 'pipe' });
}, 35_000);

describe('真实 CLI 进程', () => {
  it('课程背景的嵌套变换与字体通过实际 read/save 保留', () => {
    const input = 'read tests/fixtures/nested.svg\nsave artifacts/nested.svg\n';
    const child = spawnSync(process.execPath, [entry], { cwd: root, input, encoding: 'utf8', timeout: 5_000 });
    expect(child.status).toBe(0); expect(child.stderr).toBe(''); expect(child.stdout).not.toContain('error:');
    expect(child.stdout).toContain('warning: assigned id rect1 to unnamed <rect>');
    expect(child.stdout).toContain('warning: assigned id text1 to unnamed <text>');
    const codec = new XmlSvgCodec(new EditorComposition().createFactory());
    const actual = codec.decode(readFileSync(resolve(root, 'artifacts/nested.svg'), 'utf8'));
    const expected = codec.decode(readFileSync(resolve(root, 'tests/fixtures/nested.svg'), 'utf8'));
    expect(actual.getDocument().describe()).toEqual(expected.getDocument().describe());
  });
  it('真实 IO 失败保留 redo，带空格读入路径与另存/默认保存可回放', () => {
    const directory = mkdtempSync(resolve(root, 'artifacts/system-'));
    try {
      writeFileSync(resolve(directory, '来源 space.svg'), readFileSync(resolve(root, 'tests/fixtures/other.svg')));
      writeFileSync(resolve(directory, 'bad.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect/><rect width="-1"/></svg>');
      mkdirSync(resolve(directory, 'directory.svg'));
      const input = ['read "来源 space.svg"', 'move c1 10 0', 'undo', 'read missing.svg', 'read bad.svg', 'save directory.svg', 'redo', 'show c1', 'save copy.svg', 'undo', 'move c1 2 0', 'undo', 'save', 'init', 'save'].join('\n') + '\n';
      const child = spawnSync(process.execPath, [entry], { cwd: directory, input, encoding: 'utf8', timeout: 5_000 });
      expect(child.status).toBe(0); expect(child.stderr).toBe('');
      expect(child.stdout).toContain('error: cannot read file: missing.svg');
      expect(child.stdout).toContain('error: cannot write file: directory.svg');
      expect(child.stdout).toContain('error: width must be non-negative');
      expect(child.stdout).toContain('circle#c1 moved to (60,50)');
      expect(child.stdout).toContain('circle#c1  parent=svg\n  cx=60 cy=50 r=10');
      expect(child.stdout).toContain('error: undo not allowed after io command');
      expect(child.stdout).toContain('error: no source path. specify a file');
      expect(child.stdout.match(/warning:/g)).toHaveLength(1);
      const codec = new XmlSvgCodec(new EditorComposition().createFactory());
      for (const file of ['copy.svg', '来源 space.svg']) {
        expect(codec.decode(readFileSync(resolve(directory, file), 'utf8')).getDocument().describeShape('c1').getAttributes()['cx']).toBe(60);
      }
    } finally {
      expect(directory.startsWith(resolve(root, 'artifacts') + sep)).toBe(true);
      rmSync(directory, { recursive: true, force: true });
    }
  });
  it('完整课程 transcript 包含准确编辑/错误/补 id 和保存产物', () => {
    const input = readFileSync(resolve(root, 'tests/fixtures/typical.cli'), 'utf8');
    const child = spawnSync(process.execPath, [entry], { cwd: root, input, encoding: 'utf8', timeout: 5_000 });
    expect(child.status).toBe(0); expect(child.stderr).toBe('');
    const messages = child.stdout.split('svg> ').map(part => part.trim()).filter(Boolean);
    expect(messages.slice(1, 7)).toEqual(['canvas 800x600 created', 'rect#bg created', 'text#title created', 'circle#c1 created', 'rect#box created', 'g#markers created with 2 children']);
    expect(messages[7]).toContain('├── text#title  (20,40) "My Diagram"');
    expect(messages.slice(8, 19)).toEqual(['circle#c1 moved to (130,100)', 'circle#c1 moved back to (100,100)', 'circle#c1 moved to (130,100)', 'text#title updated: text="My Diagram v2"', 'text#title updated: text="My Diagram"', 'error: cannot group a container into its own descendant: markers', 'rect#box deleted', 'rect#box restored into g#markers', 'saved to artifacts/demo.svg (5 elements)', 'error: undo not allowed after io command', 'warning: assigned id rect1 to unnamed <rect>\nread tests/fixtures/other.svg (7 elements)']);
    expect(messages.at(-1)).toContain('svg (400x300)');
    expect(messages.at(-1)).toContain('└── ellipse#e1  cx=1 cy=2 rx=3 ry=4');
    const saved = new XmlSvgCodec(new EditorComposition().createFactory()).decode(readFileSync(resolve(root, 'artifacts/demo.svg'), 'utf8'));
    expect(saved.getElementCount()).toBe(5); expect(saved.getDocument().describeShape('c1').getAttributes()['cx']).toBe(130);
    expect(saved.getDocument().describeShape('title').getText()).toBe('My Diagram');
  });

  it('版本 A 的 8 元素流程图，组移动文字随行、undo 还原且保存读回', () => {
    const input = readFileSync(resolve(root, 'tests/fixtures/flowchart.cli'), 'utf8');
    const child = spawnSync(process.execPath, [entry], { cwd: root, input, encoding: 'utf8', timeout: 5_000 });
    expect(child.status).toBe(0); expect(child.stderr).toBe(''); expect(child.stdout).not.toContain('error:');
    expect(child.stdout).toContain('rect#process        x=520 y=200 w=160 h=60 fill=#f5a623');
    expect(child.stdout).toContain('text#process-label  (545,235) "处理数据"');
    expect(child.stdout).toContain('g#node2 moved back by (0,-100)');
    expect(child.stdout).toContain('saved to artifacts/flowchart.svg (8 elements)');
    const saved = new XmlSvgCodec(new EditorComposition().createFactory()).decode(readFileSync(resolve(root, 'artifacts/flowchart.svg'), 'utf8'));
    expect(saved.getElementCount()).toBe(8); expect(saved.getDocument().describeShape('process').getAttributes()['y']).toBe(100);
    expect(saved.getDocument().describeShape('process-label').getText()).toBe('处理数据 v2');
    expect(saved.getDocument().getParentId('process-label')).toBe('node2');
  });
  it('删除与同级顺序回放包含题目恢复摘要，错误后历史仍可恢复', () => {
    const input = readFileSync(resolve(root, 'tests/fixtures/tree-order.cli'), 'utf8');
    const child = spawnSync(process.execPath, [entry], { cwd: root, input, encoding: 'utf8', timeout: 5_000 });
    expect(child.error).toBeUndefined();
    expect(child.status).toBe(0);
    expect(child.stderr).toBe('');
    const messages = child.stdout.split('svg> ').map(part => part.trim()).filter(Boolean);
    expect(messages.slice(1, -1)).toEqual([
      'canvas 800x600 created', 'g#outer created', 'rect#before created in g#outer', 'rect#box created in g#outer', 'rect#after created in g#outer',
      'rect#box moved to front', 'rect#box order restored', 'rect#box moved to back', 'rect#box order restored',
      'rect#box deleted', 'rect#box restored into g#outer', 'rect#box deleted', 'error: no such shape: missing', 'rect#box restored into g#outer',
      'g#inner created in g#outer', 'text#label created in g#inner', 'g#inner deleted', 'g#inner restored into g#outer',
      'g#inner moved by (0,10)', 'g#inner moved back by (0,-10)', 'g#inner moved by (0,10)',
    ]);
    expect(messages.at(-1)).toContain('delete <id>');
    expect(messages.at(-1)).toContain('front <id>');
    expect(messages.at(-1)).toContain('back <id>');
  });

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
