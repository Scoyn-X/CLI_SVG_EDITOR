import { describe, expect, it, vi } from 'vitest';
import { CanvasCommand } from '../../src/application/CanvasCommand.js';
import { CommandResult } from '../../src/application/CommandResult.js';
import { CreateCommand } from '../../src/application/CreateCommand.js';
import { DocumentMemento } from '../../src/application/DocumentMemento.js';
import { EditorSession } from '../../src/application/EditorSession.js';
import { InitCommand } from '../../src/application/InitCommand.js';
import { MoveCommand } from '../../src/application/MoveCommand.js';
import { ScaleCommand } from '../../src/application/ScaleCommand.js';
import { SetCommand } from '../../src/application/SetCommand.js';
import { ShapeFactory } from '../../src/application/ShapeFactory.js';
import { RectProvider } from '../../src/adapters/shapes/RectProvider.js';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';
import { DomainError } from '../../src/domain/DomainError.js';
import { Group } from '../../src/domain/Group.js';
import { Rect } from '../../src/domain/Rect.js';
import { SvgDocument } from '../../src/domain/SvgDocument.js';

describe('Command、候选执行与 Memento 历史', () => {
  it.each([
    (session: EditorSession) => session.describe(),
    (session: EditorSession) => session.undo(),
    (session: EditorSession) => session.redo(),
    (session: EditorSession) => session.resize(1, 2),
    (session: EditorSession) => session.establishIoBarrier(),
    (session: EditorSession) => new MoveCommand('a', 'bad', 0).execute(session),
    (session: EditorSession) => new CreateCommand(new ShapeFactory(), 'box', 'a').execute(session),
  ])('无文档优先报规定错误且不改变会话 (%#)', action => {
    const session = new EditorSession();
    const history = session.getHistoryStatus();
    expect(() => action(session)).toThrow(/^no document\. use 'init' or 'read' first$/);
    expect(session.getHistoryStatus()).toEqual(history);
    expect(session.getSourcePath()).toBeUndefined();
  });

  it('init 新建/替换画布、清除读入路径和历史，并建立显式屏障', () => {
    const session = new EditorSession();
    session.replaceDocument(new SvgDocument(10, 20, [new Rect('a', 1, 2, 3, 4)]), 'D:/source.svg');
    new MoveCommand('a', 1, 0).execute(session);
    session.undo();
    expect(new InitCommand().execute(session).getSummary()).toBe('canvas 800x600 created');
    expect(session.describe().getRoots()).toEqual([]);
    expect(session.getSourcePath()).toBeUndefined();
    expect(session.getHistoryStatus().getUndoCount()).toBe(0);
    expect(session.getHistoryStatus().getRedoCount()).toBe(0);
    expect(() => session.undo()).toThrow(/^undo not allowed after io command$/);
    expect(() => session.redo()).toThrow(/^undo not allowed after io command$/);
  });

  it.each([0, -1, Infinity, NaN, '10abc'])('init 无效值 %s 不替换文档、路径或历史', width => {
    const session = new EditorSession();
    session.replaceDocument(new SvgDocument(100, 200, [new Rect('a', 1, 2, 3, 4)]), 'source.svg');
    new MoveCommand('a', 1, 0).execute(session);
    session.undo();
    const before = session.describe();
    const history = session.getHistoryStatus();
    expect(() => new InitCommand(width).execute(session)).toThrow();
    expect(session.describe()).toEqual(before);
    expect(session.getSourcePath()).toBe('source.svg');
    expect(session.getHistoryStatus()).toEqual(history);
    session.redo();
    expect(session.describeShape('a').getAttributes()['x']).toBe(2);
  });

  it('重复 id 失败保留 redo；redo 恢复既存后状态，不重跑工厂', () => {
    const session = new EditorSession();
    const factory = new ShapeFactory();
    const provider = new RectProvider();
    factory.register(provider);
    const create = vi.spyOn(provider, 'create');
    new InitCommand().execute(session);
    new CreateCommand(factory, 'rect', 'a', ['10', '20', '30', '40']).execute(session);
    new MoveCommand('a', 5, 0).execute(session);
    session.undo();
    const before = session.describe();
    const history = session.getHistoryStatus();
    expect(() => new CreateCommand(factory, 'rect', 'a', ['0', '0', '1', '1']).execute(session)).toThrow(/^id already exists: a$/);
    expect(session.describe()).toEqual(before);
    expect(session.getHistoryStatus()).toEqual(history);
    session.redo();
    expect(session.describeShape('a').getAttributes()['x']).toBe(15);
    session.undo();
    session.undo();
    create.mockImplementation(() => { throw new DomainError('provider later unavailable'); });
    session.redo();
    expect(session.describeShape('a').getAttributes()).toEqual({ id: 'a', x: 10, y: 20, width: 30, height: 40 });
    expect(create).toHaveBeenCalledTimes(2);
  });

  it.each([
    () => new MoveCommand('missing', 1, 2),
    () => new MoveCommand('a', '12px', 0),
    () => new ScaleCommand('a', 0),
    () => new SetCommand('a', 'id', 'b'),
    () => new CreateCommand(new EditorComposition().createFactory(), 'box', 'b'),
    () => new CreateCommand(new EditorComposition().createFactory(), 'rect', 'b', ['0', '0', '1', '1'], 'missing'),
    () => new CreateCommand(new EditorComposition().createFactory(), 'rect', 'b', ['0', '0', '1', '1'], 'a'),
  ])('失败编辑保留整个文档、路径、两栈及屏障 (%#)', build => {
    const session = new EditorSession();
    session.replaceDocument(new SvgDocument(100, 100, [new Rect('a', 1, 2, 3, 4)]), 'source.svg');
    const before = session.describe();
    const history = session.getHistoryStatus();
    expect(() => build().execute(session)).toThrow();
    expect(session.describe()).toEqual(before);
    expect(session.getHistoryStatus()).toEqual(history);
    expect(session.getSourcePath()).toBe('source.svg');
    expect(() => session.redo()).toThrow(/^undo not allowed after io command$/);
  });

  it('在候选上完成多项修改后抛错，不发布任何状态或消耗 id', () => {
    const session = new EditorSession();
    new InitCommand().execute(session);
    const history = session.getHistoryStatus();
    expect(() => session.edit(candidate => {
      candidate.add(new Rect('reserved', 1, 2, 3, 4));
      candidate.resize(10, 20);
      throw new DomainError('late failure');
    })).toThrow('late failure');
    expect(session.describe().getWidth()).toBe(800);
    expect(session.describe().getRoots()).toEqual([]);
    expect(session.getHistoryStatus()).toEqual(history);
    session.edit(candidate => { candidate.add(new Group('reserved')); return new CommandResult('created'); });
    expect(session.getHistoryStatus().getUndoCount()).toBe(1);
  });

  it('禁止命令执行过程中重入会话修改；失败后仍可正常执行', () => {
    const session = new EditorSession();
    new InitCommand().execute(session);
    expect(() => session.edit(candidate => {
      candidate.add(new Group('bad'));
      session.replaceDocument(new SvgDocument(1, 1));
      return new CommandResult('bad');
    })).toThrow(/^command already in progress$/);
    expect(session.describe().getRoots()).toEqual([]);
    expect(new InitCommand(10, 20).execute(session).getSummary()).toBe('canvas 10x20 created');
  });

  it('命令持有的候选、来源文档及恢复副本均不能改写当前会话或快照', () => {
    const source = new SvgDocument(100, 200, [new Rect('a', 1, 2, 3, 4)]);
    const session = new EditorSession();
    session.replaceDocument(source, 'source.svg');
    source.move('a', 100, 100);
    let retained: SvgDocument | undefined;
    session.edit(candidate => { retained = candidate; candidate.move('a', 5, 0); return new CommandResult('forward', 'backward'); });
    retained?.remove('a');
    expect(session.describeShape('a').getAttributes()['x']).toBe(6);
    expect(session.undo().getSummary()).toBe('backward');
    expect(session.describeShape('a').getAttributes()['x']).toBe(1);
    expect(session.redo().getSummary()).toBe('forward');
    const memento = new DocumentMemento(source);
    const restored = memento.restore();
    restored.remove('a');
    expect(memento.restore().describeShape('a').getAttributes()['x']).toBe(101);
  });

  it.each([
    () => new MoveCommand('a', 0, 0),
    () => new ScaleCommand('a', 1),
    () => new SetCommand('a', 'x', 1),
  ])('成功无变化编辑仍入一个历史单元、解禁并清空 redo (%#)', build => {
    const session = new EditorSession();
    session.replaceDocument(new SvgDocument(100, 200, [new Rect('a', 1, 2, 3, 4)]));
    const before = session.describe();
    build().execute(session);
    expect(session.describe()).toEqual(before);
    expect(session.getHistoryStatus().isBlocked()).toBe(false);
    expect(session.getHistoryStatus().getUndoCount()).toBe(1);
    session.undo();
    build().execute(session);
    expect(session.getHistoryStatus().getRedoCount()).toBe(0);
    expect(() => session.redo()).toThrow(/^nothing to redo$/);
  });

  it('canvas 查询不改变 redo；失败修改不建立屏障；成功修改阻断旧历史', () => {
    const session = new EditorSession();
    session.replaceDocument(new SvgDocument(100, 200, [new Rect('a', 1, 2, 3, 4)]), 'source.svg');
    new MoveCommand('a', 10, 0).execute(session);
    session.undo();
    const history = session.getHistoryStatus();
    expect(new CanvasCommand().execute(session).getSummary()).toBe('canvas 100x200');
    expect(session.getHistoryStatus()).toEqual(history);
    expect(() => new CanvasCommand(300, -1).execute(session)).toThrow();
    expect(session.describe().getWidth()).toBe(100);
    expect(session.getHistoryStatus()).toEqual(history);
    new CanvasCommand(300).execute(session);
    expect(session.describe().getHeight()).toBe(200);
    expect(session.getSourcePath()).toBe('source.svg');
    expect(() => session.undo()).toThrow(/^undo not allowed after io command$/);
    new MoveCommand('a', 10, 0).execute(session);
    session.undo();
    expect(session.describe().getWidth()).toBe(300);
    expect(session.describeShape('a').getAttributes()['x']).toBe(1);
    expect(() => session.undo()).toThrow(/^nothing to undo$/);
  });

  it('文档发布及 save 成功边界建立屏障；失败发布不改变路径或历史', () => {
    const session = new EditorSession();
    session.replaceDocument(new SvgDocument(100, 200, [new Rect('a', 1, 2, 3, 4)]), 'old.svg');
    new MoveCommand('a', 10, 0).execute(session);
    const before = session.describe();
    const history = session.getHistoryStatus();
    expect(() => session.replaceDocument(new SvgDocument(10, 10), '')).toThrow();
    expect(session.describe()).toEqual(before);
    expect(session.getSourcePath()).toBe('old.svg');
    expect(session.getHistoryStatus()).toEqual(history);
    session.establishIoBarrier();
    expect(() => session.undo()).toThrow(/^undo not allowed after io command$/);
    new MoveCommand('a', 1, 0).execute(session);
    session.undo();
    expect(session.describeShape('a').getAttributes()['x']).toBe(11);
    expect(() => session.undo()).toThrow(/^nothing to undo$/);
    session.replaceDocument(new SvgDocument(400, 300, [new Group('new')]), 'new.svg');
    expect(session.getSourcePath()).toBe('new.svg');
    expect(() => session.describeShape('a')).toThrow(/^no such shape: a$/);
    expect(session.getHistoryStatus().getRedoCount()).toBe(0);
    expect(() => session.redo()).toThrow(/^undo not allowed after io command$/);
  });

  it('浮点撤销恢复原值；嵌套组整条修改一个单元，恢复父级、顺序和缺省样式', () => {
    const session = new EditorSession();
    session.replaceDocument(new SvgDocument(100, 100, [new Group('outer', [new Rect('a', 0.1, 0.2, 3, 4), new Group('inner', [new Rect('b', 1, 2, 3, 4)])])]));
    const before = session.describe();
    new MoveCommand('outer', 0.2, 0.1).execute(session);
    const after = session.describe();
    expect(session.getHistoryStatus().getUndoCount()).toBe(1);
    session.undo();
    expect(session.describe()).toEqual(before);
    expect(session.describeShape('a').getAttributes()['x']).toBe(0.1);
    expect(session.getParentId('b')).toBe('inner');
    expect(session.describeShape('outer').getChildren().map(child => child.getId())).toEqual(['a', 'inner']);
    expect(Object.hasOwn(session.describeShape('a').getAttributes(), 'fill')).toBe(false);
    session.redo();
    expect(session.describe()).toEqual(after);
    new ScaleCommand('outer', 0.3).execute(session);
    session.undo();
    expect(session.describe()).toEqual(after);
  });

  it('组内后续数值溢出失败保留全文档与 redo', () => {
    const session = new EditorSession();
    session.replaceDocument(new SvgDocument(100, 100, [new Group('outer', [new Rect('a', 1, 2, 3, 4), new Rect('b', Number.MAX_VALUE, 0, 1, 1)])]));
    new SetCommand('a', 'fill', 'red').execute(session);
    session.undo();
    const before = session.describe();
    const history = session.getHistoryStatus();
    expect(() => new ScaleCommand('outer', 2).execute(session)).toThrow();
    expect(session.describe()).toEqual(before);
    expect(session.getHistoryStatus()).toEqual(history);
    session.redo();
    expect(session.describeShape('a').getAttributes()['fill']).toBe('red');
    session.undo();
    expect(Object.hasOwn(session.describeShape('a').getAttributes(), 'fill')).toBe(false);
  });

  it('候选执行成功但发布副本准备失败时，仍保留原文档和历史', () => {
    const session = new EditorSession();
    session.replaceDocument(new SvgDocument(100, 100, [new Rect('a', 1, 2, 3, 4)]), 'source.svg');
    new MoveCommand('a', 5, 0).execute(session);
    session.undo();
    const before = session.describe();
    const history = session.getHistoryStatus();
    expect(() => session.edit(candidate => {
      candidate.move('a', 100, 100);
      vi.spyOn(candidate, 'clone').mockImplementation(() => { throw new DomainError('snapshot preparation failed'); });
      return new CommandResult('moved');
    })).toThrow(/^snapshot preparation failed$/);
    expect(session.describe()).toEqual(before);
    expect(session.getHistoryStatus()).toEqual(history);
    expect(session.getSourcePath()).toBe('source.svg');
    session.redo();
    expect(session.describeShape('a').getAttributes()['x']).toBe(6);
  });

  it('多条命令按栈顺序精确恢复；撤销后真实新编辑替换 redo 分支', () => {
    const session = new EditorSession();
    session.replaceDocument(new SvgDocument(100, 100, [new Rect('a', 0.1, 0.2, 3, 4)]));
    const baseline = session.describe();
    new MoveCommand('a', 0.2, 0).execute(session);
    const moved = session.describe();
    new ScaleCommand('a', 0.3).execute(session);
    const scaled = session.describe();
    new SetCommand('a', 'fill', 'red').execute(session);
    const styled = session.describe();
    expect(session.getHistoryStatus().getUndoCount()).toBe(3);
    for (const expected of [scaled, moved, baseline]) { session.undo(); expect(session.describe()).toEqual(expected); }
    for (const expected of [moved, scaled, styled]) { session.redo(); expect(session.describe()).toEqual(expected); }
    session.undo();
    new SetCommand('a', 'stroke', 'blue').execute(session);
    expect(session.getHistoryStatus().getRedoCount()).toBe(0);
    expect(() => session.redo()).toThrow(/^nothing to redo$/);
    expect(Object.hasOwn(session.describeShape('a').getAttributes(), 'fill')).toBe(false);
    expect(session.describeShape('a').getAttributes()['stroke']).toBe('blue');
    session.undo();
    expect(session.describe()).toEqual(scaled);
  });
});
