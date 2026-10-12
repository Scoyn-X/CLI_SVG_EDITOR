import { describe, expect, it } from 'vitest';
import { GroupCommand } from '../../src/application/GroupCommand.js';
import { EditorSession } from '../../src/application/EditorSession.js';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';
import { Group } from '../../src/domain/Group.js';
import { Rect } from '../../src/domain/Rect.js';
import { SvgDocument } from '../../src/domain/SvgDocument.js';

describe('分组和归属命令与历史集成', () => {
  it('group 一条命令一个单元，undo 恢复原父级/位置/缺省属性及所有 id', () => {
    const session = new EditorSession();
    const controller = new EditorComposition().createController(session);
    for (const line of ['init', 'create g outer', 'create g left in outer', 'create rect a .1 .2 3 4 in left',
      'create rect middle 1 2 3 4 in outer', 'create g right in outer', 'create circle b 1 2 3 blue in right']) {
      expect(controller.executeLine(line)[0]).not.toContain('error:');
    }
    const before = session.describe();
    const count = session.getHistoryStatus().getUndoCount();
    expect(controller.executeLine('group pair b a')).toEqual(['g#pair created with 2 children']);
    const after = session.describe();
    expect(session.getHistoryStatus().getUndoCount()).toBe(count + 1);
    expect(session.getParentId('pair')).toBe('outer');
    expect(session.describeShape('outer').getChildren().map(shape => shape.getId())).toEqual(['pair', 'left', 'middle', 'right']);
    expect(session.describeShape('pair').getChildren().map(shape => shape.getId())).toEqual(['a', 'b']);
    expect(controller.executeLine('undo')).toEqual(['g#pair grouping undone']);
    expect(session.describe()).toEqual(before);
    expect(session.getParentId('a')).toBe('left');
    expect(session.getParentId('b')).toBe('right');
    expect(Object.hasOwn(session.describeShape('a').getAttributes(), 'fill')).toBe(false);
    expect(() => session.describeShape('pair')).toThrow(/^no such shape: pair$/);
    expect(controller.executeLine('redo')).toEqual(['g#pair created with 2 children']);
    expect(session.describe()).toEqual(after);
    controller.executeLine('move pair 1 2');
    expect(session.describeShape('a').getPosition()).toEqual([1.1, 2.2]);
    controller.executeLine('undo');
    expect(session.describe()).toEqual(after);
  });

  it('group/ungroup 和 addto 一次恢复完整结构，源路径始终保持', () => {
    const session = new EditorSession();
    session.replaceDocument(new SvgDocument(100, 100, [new Group('outer', ['a', 'b', 'c'].map(id => new Rect(id, 1, 2, 3, 4))), new Group('target')]), 'source.svg');
    const controller = new EditorComposition().createController(session);
    controller.executeLine('group pair c a');
    const grouped = session.describe();
    const count = session.getHistoryStatus().getUndoCount();
    expect(controller.executeLine('ungroup pair')).toEqual(['g#pair ungrouped']);
    expect(session.getHistoryStatus().getUndoCount()).toBe(count + 1);
    expect(session.describeShape('outer').getChildren().map(shape => shape.getId())).toEqual(['a', 'c', 'b']);
    expect(controller.executeLine('undo')).toEqual(['g#pair grouping restored']);
    expect(session.describe()).toEqual(grouped);
    expect(controller.executeLine('addto target pair')).toEqual(['g#pair moved into g#target']);
    expect(session.getParentId('pair')).toBe('target');
    expect(session.getParentId('a')).toBe('pair');
    const moved = session.describe();
    expect(controller.executeLine('undo')).toEqual(['g#pair restored into g#outer']);
    expect(session.describe()).toEqual(grouped);
    controller.executeLine('redo');
    expect(session.describe()).toEqual(moved);
    expect(session.getSourcePath()).toBe('source.svg');
  });

  it.each([
    { line: 'group pair a missing', error: 'no such shape: missing' },
    { line: 'group pair a outer', error: 'cannot group a container into its own descendant: outer' },
    { line: 'group a b', error: 'id already exists: a' },
    { line: 'group pair a a', error: 'duplicate group target: a' },
    { line: 'ungroup outer', error: 'cannot ungroup top-level container: outer' },
    { line: 'ungroup a', error: 'not a container: a' },
    { line: 'addto a b', error: 'not a container: a' },
    { line: 'addto missing a', error: 'no such container: missing' },
    { line: 'addto inner outer', error: 'cannot add a shape into itself or its descendant: outer' },
    { line: 'group pair', error: 'usage: group <newGid> <id1> <id2>…' },
    { line: 'ungroup inner extra', error: 'usage: ungroup <gid>' },
    { line: 'addto inner', error: 'usage: addto <gid> <id>' },
  ])('失败 $line 不破坏文档、路径、redo 或 id 可用性', ({ line, error }) => {
    const session = new EditorSession();
    session.replaceDocument(new SvgDocument(100, 100, [new Group('outer', [new Group('inner', [new Rect('a', 1, 2, 3, 4)]), new Rect('b', 1, 2, 3, 4)])]), 'source.svg');
    const controller = new EditorComposition().createController(session);
    controller.executeLine('move a 5 0');
    controller.executeLine('undo');
    const before = session.describe();
    const history = session.getHistoryStatus();
    expect(controller.executeLine(line)).toEqual([`error: ${error}`]);
    expect(session.describe()).toEqual(before);
    expect(session.getHistoryStatus()).toEqual(history);
    expect(session.getSourcePath()).toBe('source.svg');
    expect(controller.executeLine('redo')).toEqual(['rect#a moved to (6,2)']);
    controller.executeLine('group pair a');
    expect(session.getParentId('a')).toBe('pair');
  });

  it('成功重组清空 redo；同父末尾的 addto 即使无变化仍为一个单元', () => {
    const session = new EditorSession();
    const controller = new EditorComposition().createController(session);
    for (const line of ['init', 'create g g', 'create rect a 1 2 3 4 in g', 'move a 5 0', 'undo']) { controller.executeLine(line); }
    const before = session.describe();
    const count = session.getHistoryStatus().getUndoCount();
    controller.executeLine('addto g a');
    expect(session.describe()).toEqual(before);
    expect(session.getHistoryStatus().getUndoCount()).toBe(count + 1);
    expect(controller.executeLine('redo')).toEqual(['error: nothing to redo']);
    controller.executeLine('undo');
    controller.executeLine('group pair a');
    expect(controller.executeLine('redo')).toEqual(['error: nothing to redo']);
  });

  it('新屏障后失败不解禁，成功重组解禁且不能越过屏障', () => {
    const session = new EditorSession();
    session.replaceDocument(new SvgDocument(100, 100, [new Group('outer', [new Rect('a', 1, 2, 3, 4)])]));
    const controller = new EditorComposition().createController(session);
    controller.executeLine('group pair missing');
    expect(controller.executeLine('undo')).toEqual(['error: undo not allowed after io command']);
    const before = session.describe();
    controller.executeLine('group pair a');
    controller.executeLine('undo');
    expect(session.describe()).toEqual(before);
    expect(controller.executeLine('undo')).toEqual(['error: nothing to undo']);
  });

  it.each(['group pair a', 'ungroup a', 'addto outer a'])('无文档执行 %s 给出统一错误', line => {
    const controller = new EditorComposition().createController();
    expect(controller.executeLine(line)).toEqual(["error: no document. use 'init' or 'read' first"]);
  });

  it('创建命令 in 与后续归属/解组协作；GroupCommand 输入清单独立保存', () => {
    const session = new EditorSession();
    const controller = new EditorComposition().createController(session);
    for (const line of ['init', 'create g outer', 'create g inner in outer', 'create text a 1 2 "in" in inner', 'create rect b 3 4 5 6']) { controller.executeLine(line); }
    const ids = ['b', 'a'];
    const command = new GroupCommand('pair', ids);
    ids.splice(0, ids.length, 'missing');
    expect(command.execute(session).getSummary()).toBe('g#pair created with 2 children');
    expect(session.describeShape('pair').getChildren().map(shape => shape.getId())).toEqual(['a', 'b']);
    controller.executeLine('addto outer pair');
    controller.executeLine('ungroup pair');
    expect(session.getParentId('a')).toBe('outer');
    expect(session.getParentId('b')).toBe('outer');
    expect(session.describeShape('a').getText()).toBe('in');
  });
});
