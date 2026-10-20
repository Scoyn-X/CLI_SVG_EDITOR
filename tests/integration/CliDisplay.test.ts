import { describe, expect, it } from 'vitest';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';
import { EditorSession } from '../../src/application/EditorSession.js';

describe('完整 CLI 查询与显示', () => {
  it('题目 tree/show 几何、文本与层级格式，局部树只显示目标', () => {
    const session = new EditorSession(); const cli = new EditorComposition().createController(session);
    for (const line of ['init', 'create rect bg 0 0 800 600 #ffffff', 'create text title 20 40 "My Diagram"', 'create circle c1 100 100 20 red', 'create rect box 200 80 60 60 #3366ff', 'group markers c1 box']) { cli.executeLine(line); }
    expect(cli.executeLine('tree')).toEqual(['svg (800x600)', '├── rect#bg     x=0 y=0 w=800 h=600 fill=#ffffff', '├── text#title  (20,40) "My Diagram"', '└── g#markers', '    ├── circle#c1  cx=100 cy=100 r=20 fill=red', '    └── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff']);
    expect(cli.executeLine('tree markers')).toEqual(['g#markers', '├── circle#c1  cx=100 cy=100 r=20 fill=red', '└── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff']);
    expect(cli.executeLine('tree title')).toEqual(['text#title  (20,40) "My Diagram"']);
    expect(cli.executeLine('show c1')).toEqual(['circle#c1  parent=g#markers', '  cx=100 cy=100 r=20', '  fill=red']);
    expect(cli.executeLine('show markers')).toEqual(['g#markers  parent=svg']);
  });

  it('line 两端点、ellipse 几何、空文本、样式和控制字符不破坏行边界', () => {
    const session = new EditorSession(); const cli = new EditorComposition().createController(session);
    for (const line of ['init 400 200', 'create line edge 1 2 3 4 black', 'set edge stroke-width 2', 'create ellipse e 1 2 3 4', 'create text t 5 6 ""', 'create g empty']) { cli.executeLine(line); }
    expect(cli.executeLine('tree')).toEqual(['svg (400x200)', '├── line#edge  (1,2) -> (3,4) stroke=black stroke-width=2', '├── ellipse#e  cx=1 cy=2 rx=3 ry=4', '├── text#t     (5,6) ""', '└── g#empty']);
    expect(cli.executeLine('show edge')).toContain('  stroke-width=2');
    expect(cli.executeLine('show t')).toEqual(['text#t  parent=svg', '  x=5 y=6', '  text=""']);
    expect(new EditorComposition().createController().executeLine('tree')).toEqual(["error: no document. use 'init' or 'read' first"]);
  });

  it('tree 仅按直接兄弟标签对齐，局部树独立计算，删除和撤销后重算且无行尾空格', () => {
    const session = new EditorSession(); const cli = new EditorComposition().createController(session);
    for (const line of ['init', 'create g parent', 'create rect r 1 2 3 4 in parent', 'create text long 5 6 "x" in parent',
      'create g blank in parent', 'create g branch in parent', 'create rect a 7 8 9 10 in branch', 'create circle wide 1 2 3 in branch']) {
      expect(cli.executeLine(line)[0]).not.toMatch(/^error:/);
    }
    const expected = ['g#parent', '├── rect#r     x=1 y=2 w=3 h=4', '├── text#long  (5,6) "x"', '├── g#blank', '└── g#branch',
      '    ├── rect#a       x=7 y=8 w=9 h=10', '    └── circle#wide  cx=1 cy=2 r=3'];
    const before = session.describe(); const history = session.getHistoryStatus();
    const actual = cli.executeLine('tree parent'); expect(actual).toEqual(expected);
    expect(cli.executeLine('tree branch')).toEqual(['g#branch', '├── rect#a       x=7 y=8 w=9 h=10', '└── circle#wide  cx=1 cy=2 r=3']);
    expect(cli.executeLine('tree r')).toEqual(['rect#r  x=1 y=2 w=3 h=4']);
    expect(actual.every(line => line === line.trimEnd())).toBe(true);
    expect(session.describe()).toEqual(before); expect(session.getHistoryStatus()).toEqual(history);
    cli.executeLine('delete long');
    expect(cli.executeLine('tree parent')).toContain('├── rect#r    x=1 y=2 w=3 h=4');
    cli.executeLine('undo'); expect(cli.executeLine('tree parent')).toEqual(expected);
  });

  it('所有查询及失败查询保持 redo/屏障，帮助列 19 条命令和六类参数', () => {
    const session = new EditorSession(); const composition = new EditorComposition(); const cli = composition.createController(session);
    cli.executeLine('init'); const barrier = session.getHistoryStatus();
    expect(cli.executeLine('tree')).toEqual(['svg (800x600)']); cli.executeLine('help');
    expect(session.getHistoryStatus()).toEqual(barrier);
    cli.executeLine('create rect r 1 2 3 4'); cli.executeLine('move r 5 0'); cli.executeLine('undo');
    const before = session.describe(); const history = session.getHistoryStatus();
    const help = cli.executeLine('help').join('\n');
    expect(composition.createDispatcher().getUsages()).toHaveLength(19);
    for (const usage of composition.createDispatcher().getUsages()) { expect(help).toContain(usage); }
    for (const usage of composition.createFactory().getUsages()) { expect(help).toContain(usage); }
    expect(help).toContain('create text <id> <x> <y> "content" [in <containerId>]');
    cli.executeLine('tree'); cli.executeLine('show r'); cli.executeLine('canvas');
    expect(cli.executeLine('tree missing')).toEqual(['error: no such shape: missing']);
    expect(cli.executeLine('show missing')).toEqual(['error: no such shape: missing']);
    expect(session.describe()).toEqual(before); expect(session.getHistoryStatus()).toEqual(history);
    expect(cli.executeLine('redo')).toEqual(['rect#r moved to (6,2)']);
  });

  it.each(['tree a b', 'show', 'show a b', 'help a'])('参数错误 %s 输出单行用法', line => {
    const cli = new EditorComposition().createController();
    expect(cli.executeLine(line)).toHaveLength(1); expect(cli.executeLine(line)[0]).toMatch(/^error: usage:/);
  });
});
