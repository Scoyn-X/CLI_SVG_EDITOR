import { describe, expect, it, vi } from 'vitest';
import { CliController } from '../../src/adapters/cli/CliController.js';
import { XmlSvgCodec } from '../../src/adapters/svg/XmlSvgCodec.js';
import { EditorSession } from '../../src/application/EditorSession.js';
import { SaveCommand } from '../../src/application/SaveCommand.js';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';

const imported = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="10 20 800 400" fill="white"><g id="scene" fill="red" transform="translate(10,20)"><rect id="a" width="10" height="5"/><rect id="b" width="2" height="3" fill="blue"/><text id="label" x="1" y="2" font-size="16" text-anchor="middle">开始 &amp; &lt;&gt;</text></g></svg>';

describe('独立跨模块系统回归', () => {
  it('S07：继承属性缺省、显式值、元数据经编辑/undo/save/read 保留', () => {
    const session = new EditorSession(); const composition = new EditorComposition();
    let contents = imported;
    const storage = { resolve: (file: string) => file, read: () => contents, write: (_file: string, value: string) => { contents = value; } };
    const cli = new CliController(composition.createDispatcher(composition.createFactory(), storage), session);
    cli.executeLine('read source.svg'); const original = session.describe();
    cli.executeLine('set scene fill green');
    expect(session.describeShape('scene').getAttributes()['fill']).toBe('green');
    expect(Object.hasOwn(session.describeShape('a').getAttributes(), 'fill')).toBe(false);
    expect(session.describeShape('b').getAttributes()['fill']).toBe('blue');
    cli.executeLine('undo'); expect(session.describe()).toEqual(original); cli.executeLine('redo');
    cli.executeLine('move scene 1 2'); cli.executeLine('scale scene 2');
    expect(session.describeShape('label').getAttributes()).toMatchObject({ x: 4, y: 8, 'font-size': '16', 'text-anchor': 'middle' });
    cli.executeLine('undo'); cli.executeLine('undo');
    const expected = session.describe();
    expect(cli.executeLine('save source.svg')).toEqual(['saved to source.svg (4 elements)']);
    expect(cli.executeLine('undo')).toEqual(['error: undo not allowed after io command']);
    cli.executeLine('read source.svg'); expect(session.describe()).toEqual(expected);
    expect(cli.executeLine('show scene')).toContain('  transform=translate(10,20)');
    expect(cli.executeLine('tree')).toContain('    └── text#label  (1,2) "开始 & <>" font-size=16 text-anchor=middle');
  });

  it('S02：保存后只可撤销新的编辑，查询/失败不解禁', () => {
    const session = new EditorSession(); const composition = new EditorComposition();
    const storage = { resolve: (file: string) => file, read: () => imported, write: vi.fn() };
    const cli = new CliController(composition.createDispatcher(composition.createFactory(), storage), session);
    for (const line of ['init', 'create rect r1 1 2 3 4', 'save explicit.svg']) { cli.executeLine(line); }
    const barrier = session.getHistoryStatus();
    for (const line of ['tree', 'show r1', 'help', 'canvas', 'move missing 1 0']) { cli.executeLine(line); }
    expect(session.getHistoryStatus()).toEqual(barrier);
    for (const line of ['undo', 'redo']) { expect(cli.executeLine(line)).toEqual(['error: undo not allowed after io command']); }
    cli.executeLine('move r1 10 0'); expect(cli.executeLine('undo')).toEqual(['rect#r1 moved back to (1,2)']);
    expect(cli.executeLine('undo')).toEqual(['error: nothing to undo']);
    expect(session.describeShape('r1').getAttributes()['x']).toBe(1);
  });

  it('编码失败及路径解析失败保留状态，编码失败不写文件', () => {
    const session = new EditorSession(); const composition = new EditorComposition(); const cli = composition.createController(session);
    for (const line of ['init', 'create rect r 1 2 3 4', 'move r 2 0', 'undo']) { cli.executeLine(line); }
    const before = session.describe(); const history = session.getHistoryStatus();
    const codec = new XmlSvgCodec(composition.createFactory()); vi.spyOn(codec, 'encode').mockImplementation(() => { throw new Error('encode failed'); });
    const storage = { resolve: (file: string) => file, read: vi.fn(), write: vi.fn() };
    expect(() => new SaveCommand(storage, codec, 'out.svg').execute(session)).toThrow('encode failed');
    expect(storage.write).not.toHaveBeenCalled(); expect(session.describe()).toEqual(before); expect(session.getHistoryStatus()).toEqual(history);
    const invalidStorage = { ...storage, resolve: () => { throw new Error('invalid path'); } };
    const faulty = new CliController(composition.createDispatcher(composition.createFactory(), invalidStorage), session);
    expect(faulty.executeLine('read a.svg')).toEqual(['error: cannot read file: a.svg']);
    expect(faulty.executeLine('save a.svg')).toEqual(['error: cannot write file: a.svg']);
    expect(session.describe()).toEqual(before); expect(session.getHistoryStatus()).toEqual(history);
    expect(cli.executeLine('redo')).toEqual(['rect#r moved to (3,2)']);
  });

  it.each(['<:rect/>', '<q:rect xmlns:q="http://www.w3.org/2000/svg" xmlns:="urn:bad"/>', '<svg:1rect xmlns:svg="http://www.w3.org/2000/svg"/>', '<rect xmlns:1q="urn:bad"/>', '<q::rect xmlns:q="http://www.w3.org/2000/svg"/>'])('拒绝非法命名空间 QName %s', child => {
    const codec = new XmlSvgCodec(new EditorComposition().createFactory());
    expect(() => codec.decode(`<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">${child}</svg>`)).toThrow();
  });

  it('合法 Unicode 命名空间前缀与 text 换行可保留，终端逐项单行', () => {
    const session = new EditorSession(); const composition = new EditorComposition();
    const storage = { resolve: (file: string) => file, write: vi.fn(), read: () => '<图:svg xmlns:图="http://www.w3.org/2000/svg" width="1" height="1"><图:text id="t" fill="a&#10;b">line1&#13;&#10;line2</图:text></图:svg>' };
    const cli = new CliController(composition.createDispatcher(composition.createFactory(), storage), session);
    expect(cli.executeLine('read unicode.svg')).toEqual(['read unicode.svg (1 elements)']);
    expect(session.describeShape('t').getText()).toBe('line1\r\nline2');
    for (const line of [...cli.executeLine('tree'), ...cli.executeLine('show t')]) { expect(line).not.toMatch(/[\r\n]/); }
    expect(cli.executeLine('tree')[1]).toContain('"line1\\r\\nline2"');
  });

  it('read 的路径解析也在锁内，依赖回调不能先修改会话再导致导入失败', () => {
    const session = new EditorSession(); const composition = new EditorComposition(); const normal = composition.createController(session);
    for (const line of ['init', 'create rect r 1 2 3 4', 'move r 5 0', 'undo']) { normal.executeLine(line); }
    const before = session.describe(); const history = session.getHistoryStatus();
    const storage = { resolve: () => { session.resize(9, 9); throw new Error('failure after mutation'); }, read: () => imported, write: vi.fn() };
    const cli = new CliController(composition.createDispatcher(composition.createFactory(), storage), session);
    expect(cli.executeLine('read failed.svg')).toEqual(['error: cannot read file: failed.svg']);
    expect(session.describe()).toEqual(before); expect(session.getHistoryStatus()).toEqual(history);
    expect(normal.executeLine('redo')).toEqual(['rect#r moved to (6,2)']);
  });
});
