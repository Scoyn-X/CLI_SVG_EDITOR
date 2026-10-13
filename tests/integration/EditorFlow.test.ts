import { describe, expect, it } from 'vitest';
import { CommandRegistration } from '../../src/application/CommandRegistration.js';
import { EditorSession } from '../../src/application/EditorSession.js';
import { UndoCommand } from '../../src/application/UndoCommand.js';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';

describe('CLI → Command → 会话 → 领域/历史集成', () => {
  it('最小流程按题目反馈；失败不破坏 redo，查询保持历史', () => {
    const session = new EditorSession();
    const controller = new EditorComposition().createController(session);
    expect(controller.executeLine('init')).toEqual(['canvas 800x600 created']);
    expect(controller.executeLine('create circle c1 100 100 20 red')).toEqual(['circle#c1 created']);
    expect(controller.executeLine('move c1 30 0')).toEqual(['circle#c1 moved to (130,100)']);
    expect(controller.executeLine('undo')).toEqual(['circle#c1 moved back to (100,100)']);
    const history = session.getHistoryStatus();
    expect(controller.executeLine('create circle c1 0 0 1')).toEqual(['error: id already exists: c1']);
    expect(controller.executeLine('canvas')).toEqual(['canvas 800x600']);
    expect(controller.executeLine('help')[0]).toContain('create <type> <id>');
    expect(session.getHistoryStatus()).toEqual(history);
    expect(controller.executeLine('redo')).toEqual(['circle#c1 moved to (130,100)']);
  });

  it.each([
    { type: 'rect', parameters: '1 2 3 4', position: [4, 6] },
    { type: 'circle', parameters: '1 2 3', position: [4, 6] },
    { type: 'ellipse', parameters: '1 2 3 4', position: [4, 6] },
    { type: 'line', parameters: '1 2 3 4', position: [4, 6] },
    { type: 'text', parameters: '1 2 "in"', position: [4, 6] },
    { type: 'g', parameters: '', position: undefined },
  ])('六种类型 $type 根与 in 创建、移动、撤销恢复及缺省样式', ({ type, parameters, position }) => {
    const session = new EditorSession();
    const controller = new EditorComposition().createController(session);
    controller.executeLine('init');
    controller.executeLine('create g parent');
    expect(controller.executeLine(`create ${type} a ${parameters} in parent`)).toEqual([`${type}#a created in g#parent`]);
    expect(session.getParentId('a')).toBe('parent');
    const before = session.describe();
    const response = controller.executeLine('move a 3 4');
    expect(response[0]).toBe(position === undefined ? 'g#a moved by (3,4)' : `${type}#a moved to (4,6)`);
    expect(session.describeShape('a').getPosition()).toEqual(position);
    expect(Object.hasOwn(session.describeShape('a').getAttributes(), 'fill')).toBe(false);
    controller.executeLine('undo');
    expect(session.describe()).toEqual(before);
    controller.executeLine('undo');
    expect(() => session.describeShape('a')).toThrow(/^no such shape: a$/);
    controller.executeLine('redo');
    expect(session.getParentId('a')).toBe('parent');
    expect(controller.executeLine(`create ${type} root ${parameters}`)).toEqual([`${type}#root created`]);
    expect(session.getParentId('root')).toBeUndefined();
  });

  it.each(['"in"', '"a in b"', '""', '"开始 <>&"'])('正文 %s 不误当 in 尾缀，set/undo 保存完整内容', text => {
    const session = new EditorSession();
    const controller = new EditorComposition().createController(session);
    controller.executeLine('init');
    controller.executeLine('create g g1');
    expect(controller.executeLine(`create text a 1 2 ${text}`)).toEqual(['text#a created']);
    expect(controller.executeLine(`create text b 1 2 ${text} in g1`)).toEqual(['text#b created in g#g1']);
    const before = session.describeShape('b').getText();
    expect(controller.executeLine('set b text "My Diagram v2"')).toEqual(['text#b updated: text="My Diagram v2"']);
    controller.executeLine('undo');
    expect(session.describeShape('b').getText()).toBe(before);
    controller.executeLine('redo');
    expect(session.describeShape('b').getText()).toBe('My Diagram v2');
  });

  it('嵌套容器平移与反馈不按标签分派，子孙一次恢复', () => {
    const session = new EditorSession();
    const controller = new EditorComposition().createController(session);
    for (const line of ['init', 'create g outer', 'create g inner in outer', 'create rect a 1 2 3 4 in inner', 'create text b 1 2 "内容" in inner']) {
      expect(controller.executeLine(line)[0]).not.toContain('error:');
    }
    const before = session.describe();
    expect(controller.executeLine('move outer 0 100')).toEqual(['g#outer moved by (0,100)']);
    expect(session.describeShape('a').getPosition()).toEqual([1, 102]);
    expect(session.describeShape('b').getPosition()).toEqual([1, 102]);
    expect(controller.executeLine('undo')).toEqual(['g#outer moved back by (0,-100)']);
    expect(session.describe()).toEqual(before);
  });

  it.each([
    { line: 'create box b 0 0 1 1 "box"', error: 'unknown shape type: box (is the plugin loaded?)' },
    { line: 'create rect b 0 0 1 1 in missing', error: 'no such container: missing' },
    { line: 'create rect b 0 0 1 1 in a', error: 'not a container: a' },
    { line: 'scale a 0', error: 'scale factor must be positive' },
    { line: 'set a transform translate', error: 'unknown attribute: transform' },
    { line: 'move missing 1 2', error: 'no such shape: missing' },
    { line: 'move a 1abc 0', error: 'invalid number: dx' },
    { line: 'undo extra', error: 'usage: undo' },
    { line: 'create text b 1 2 "bad', error: 'unterminated double quote' },
    { line: 'constructor', error: 'unknown command: constructor' },
  ])('失败回放 $line 保留文档和 redo，输出准确单行错误', ({ line, error }) => {
    const session = new EditorSession();
    const controller = new EditorComposition().createController(session);
    for (const setup of ['init', 'create rect a 1 2 3 4', 'move a 5 0', 'undo']) { controller.executeLine(setup); }
    const before = session.describe();
    const history = session.getHistoryStatus();
    expect(controller.executeLine(line)).toEqual([`error: ${error}`]);
    expect(session.describe()).toEqual(before);
    expect(session.getHistoryStatus()).toEqual(history);
    expect(controller.executeLine('redo')).toEqual(['rect#a moved to (6,2)']);
  });

  it('无文档错误与语法优先级固定，单尺寸暂定语义可回放', () => {
    const controller = new EditorComposition().createController();
    expect(controller.executeLine('move a bad 0')).toEqual(["error: no document. use 'init' or 'read' first"]);
    expect(controller.executeLine('move a')).toEqual(['error: usage: move <id> <dx> <dy>']);
    expect(controller.executeLine('help')).toEqual(["error: no document. use 'init' or 'read' first"]);
    expect(controller.executeLine('init 400')).toEqual(['canvas 400x600 created']);
    expect(controller.executeLine('undo')).toEqual(['error: undo not allowed after io command']);
    expect(controller.executeLine('canvas 300')).toEqual(['canvas 300x600']);
    expect(controller.executeLine('redo')).toEqual(['error: undo not allowed after io command']);
  });

  it('重复命令注册失败后原命令仍可用；help 只列实际注册项', () => {
    const composition = new EditorComposition();
    const dispatcher = composition.createDispatcher();
    expect(() => dispatcher.register('undo', new CommandRegistration('bad', 0, 0, () => new UndoCommand()))).toThrow(/^command already registered: undo$/);
    expect(dispatcher.getUsages()).toContain('undo');
    expect(dispatcher.getUsages()).toContain('read <file.svg>');
    expect(dispatcher.getUsages()).toContain('save [file.svg]');
    expect(Object.isFrozen(dispatcher.getUsages())).toBe(true);
  });
});
