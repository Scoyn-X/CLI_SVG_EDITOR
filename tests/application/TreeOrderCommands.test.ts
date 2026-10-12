import { describe, expect, it } from 'vitest';
import { EditorSession } from '../../src/application/EditorSession.js';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';
import { Group } from '../../src/domain/Group.js';
import { Rect } from '../../src/domain/Rect.js';
import { SvgDocument } from '../../src/domain/SvgDocument.js';

describe('删除与同级顺序的 Command/Memento 恢复', () => {
  it.each([
    { type: 'rect', parameters: '1 2 3 4' },
    { type: 'circle', parameters: '1 2 3 red' },
    { type: 'ellipse', parameters: '1 2 3 4' },
    { type: 'line', parameters: '1 2 3 4 blue' },
    { type: 'text', parameters: '1 2 "开始 <>&"' },
    { type: 'g', parameters: '' },
  ])('delete $type 统一删除/恢复父级、同级位置、类型和完整属性', ({ type, parameters }) => {
    const session = new EditorSession();
    const controller = new EditorComposition().createController(session);
    for (const line of ['init', 'create g outer', 'create rect before 0 0 1 1 in outer', `create ${type} a ${parameters} in outer`, 'create rect after 0 0 1 1 in outer']) {
      expect(controller.executeLine(line)[0]).not.toContain('error:');
    }
    const before = session.describe();
    const count = session.getHistoryStatus().getUndoCount();
    expect(controller.executeLine('delete a')).toEqual([`${type}#a deleted`]);
    const after = session.describe();
    expect(session.getHistoryStatus().getUndoCount()).toBe(count + 1);
    expect(() => session.describeShape('a')).toThrow(/^no such shape: a$/);
    expect(session.describeShape('outer').getChildren().map(shape => shape.getId())).toEqual(['before', 'after']);
    expect(controller.executeLine('undo')).toEqual([`${type}#a restored into g#outer`]);
    expect(session.describe()).toEqual(before);
    expect(session.getParentId('a')).toBe('outer');
    expect(controller.executeLine('redo')).toEqual([`${type}#a deleted`]);
    expect(session.describe()).toEqual(after);
    controller.executeLine('undo');
    expect(controller.executeLine('move a 5 6')[0]).not.toContain('error:');
  });

  it('S03 删除嵌套容器仅一个单元，全部后代索引清理并完整恢复后仍可操作', () => {
    const source = new SvgDocument(100, 200, [new Rect('root-before', 0, 0, 1, 1), new Group('outer',
      [new Rect('a', .1, .2, 3, 4), new Group('inner', [new Group('deep', [new Rect('b', 1, 2, 3, 4)])]), new Rect('c', 0, 0, 1, 1)]), new Group('root-after')]);
    source.set('inner', 'fill', 'red');
    source.set('b', 'stroke', 'blue');
    const session = new EditorSession();
    session.replaceDocument(source, 'source.svg');
    const controller = new EditorComposition().createController(session);
    const before = session.describe();
    controller.executeLine('delete inner');
    expect(session.getHistoryStatus().getUndoCount()).toBe(1);
    for (const id of ['inner', 'deep', 'b']) { expect(() => session.describeShape(id)).toThrow(`no such shape: ${id}`); }
    expect(session.describeShape('outer').getChildren().map(shape => shape.getId())).toEqual(['a', 'c']);
    expect(controller.executeLine('undo')).toEqual(['g#inner restored into g#outer']);
    expect(session.describe()).toEqual(before);
    expect(session.getParentId('b')).toBe('deep');
    controller.executeLine('move outer 0 10');
    expect(session.describeShape('a').getPosition()).toEqual([.1, 10.2]);
    expect(session.describeShape('b').getPosition()).toEqual([1, 12]);
    const moved = session.describe();
    controller.executeLine('undo');
    expect(session.describe()).toEqual(before);
    controller.executeLine('redo');
    expect(session.describe()).toEqual(moved);
    expect(session.getSourcePath()).toBe('source.svg');
  });

  it('根级删除恢复原位置；删除后复用 id 会清空 redo，undo 新创建再 undo 删除仍准确', () => {
    const session = new EditorSession();
    const controller = new EditorComposition().createController(session);
    for (const line of ['init', 'create rect before 0 0 1 1', 'create circle a 1 2 3 red', 'create rect after 0 0 1 1']) { controller.executeLine(line); }
    const before = session.describe();
    controller.executeLine('delete a');
    expect(controller.executeLine('undo')).toEqual(['circle#a restored into svg']);
    expect(session.describe()).toEqual(before);
    controller.executeLine('redo');
    controller.executeLine('create text a 5 6 "replacement"');
    expect(session.describeShape('a').getTag()).toBe('text');
    controller.executeLine('undo');
    controller.executeLine('undo');
    expect(session.describe()).toEqual(before);
    expect(controller.executeLine('redo')).toEqual(['circle#a deleted']);
    expect(controller.executeLine('redo')).toEqual(['text#a created']);
    expect(session.describeShape('a').getText()).toBe('replacement');
  });

  it.each(['front', 'back'] as const)('%s 调整嵌套组一个历史单元，并恢复全部同级位置', operation => {
    const session = new EditorSession();
    session.replaceDocument(new SvgDocument(100, 100, [new Group('outer', [new Rect('a', 0, 0, 1, 1), new Group('inner', [new Rect('b', .1, .2, 3, 4)]), new Rect('c', 0, 0, 1, 1)])]));
    const controller = new EditorComposition().createController(session);
    const before = session.describe();
    expect(controller.executeLine(`${operation} inner`)).toEqual([`g#inner moved to ${operation}`]);
    const after = session.describe();
    expect(session.describeShape('outer').getChildren().map(shape => shape.getId())).toEqual(operation === 'front' ? ['a', 'c', 'inner'] : ['inner', 'a', 'c']);
    expect(session.getHistoryStatus().getUndoCount()).toBe(1);
    expect(session.getParentId('b')).toBe('inner');
    expect(controller.executeLine('undo')).toEqual(['g#inner order restored']);
    expect(session.describe()).toEqual(before);
    expect(controller.executeLine('redo')).toEqual([`g#inner moved to ${operation}`]);
    expect(session.describe()).toEqual(after);
  });

  it.each(['front', 'back'] as const)('已在边界的 %s 仍解禁并入栈、替换 redo 分支', operation => {
    const session = new EditorSession();
    session.replaceDocument(new SvgDocument(100, 100, [new Rect('a', 1, 2, 3, 4)]));
    const controller = new EditorComposition().createController(session);
    const before = session.describe();
    controller.executeLine(`${operation} a`);
    expect(session.describe()).toEqual(before);
    expect(session.getHistoryStatus().isBlocked()).toBe(false);
    expect(session.getHistoryStatus().getUndoCount()).toBe(1);
    controller.executeLine('undo');
    controller.executeLine(`${operation} a`);
    expect(controller.executeLine('redo')).toEqual(['error: nothing to redo']);
  });

  it.each(['delete missing', 'front missing', 'back missing', 'delete a extra', 'front', 'back a extra'])('失败 %s 保留原文档、路径、两栈和屏障', line => {
    const session = new EditorSession();
    session.replaceDocument(new SvgDocument(100, 100, [new Group('g', [new Rect('a', 1, 2, 3, 4)])]), 'source.svg');
    const controller = new EditorComposition().createController(session);
    controller.executeLine('move a 5 0');
    controller.executeLine('undo');
    const before = session.describe();
    const history = session.getHistoryStatus();
    expect(controller.executeLine(line)[0]).toMatch(/^error: /);
    expect(session.describe()).toEqual(before);
    expect(session.getHistoryStatus()).toEqual(history);
    expect(session.getSourcePath()).toBe('source.svg');
    expect(controller.executeLine('redo')).toEqual(['rect#a moved to (6,2)']);
  });

  it.each(['delete a', 'front a', 'back a'])('未建文档 %s 给出统一错误', line => {
    expect(new EditorComposition().createController().executeLine(line)).toEqual(["error: no document. use 'init' or 'read' first"]);
  });

  it('全部六类 in 与树编辑组合，连续 undo/redo 恢复每一步完整状态', () => {
    const session = new EditorSession();
    const controller = new EditorComposition().createController(session);
    const setup = ['init', 'create g outer', 'create g target', 'create rect a 1 2 3 4 in outer', 'create circle b 5 6 7 red in outer',
      'create ellipse c 1 2 3 4 in outer', 'create line d 1 2 3 4 blue in outer', 'create text e 1 2 "in" in outer', 'create g f in outer'];
    for (const line of setup) { expect(controller.executeLine(line)[0]).not.toContain('error:'); }
    const states = [session.describe()];
    for (const line of ['front a', 'back f', 'group pair e b f', 'addto target pair', 'front pair', 'ungroup pair', 'delete target']) {
      expect(controller.executeLine(line)[0]).not.toContain('error:');
      states.push(session.describe());
    }
    for (let index = states.length - 2; index >= 0; index--) { controller.executeLine('undo'); expect(session.describe()).toEqual(states[index]); }
    for (let index = 1; index < states.length; index++) { controller.executeLine('redo'); expect(session.describe()).toEqual(states[index]); }
    expect(() => session.describeShape('b')).toThrow(/^no such shape: b$/);
    expect(session.getParentId('a')).toBe('outer');
    controller.executeLine('undo');
    expect(session.getParentId('b')).toBe('target');
    expect(session.describeShape('e').getText()).toBe('in');
  });
});
