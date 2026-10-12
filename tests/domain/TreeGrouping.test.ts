import { describe, expect, it, vi } from 'vitest';
import { DomainError } from '../../src/domain/DomainError.js';
import { Group } from '../../src/domain/Group.js';
import { Rect } from '../../src/domain/Rect.js';
import { SvgDocument } from '../../src/domain/SvgDocument.js';

describe('受控树分组、解组和归属', () => {
  it('同父级分组保持原树顺序和最早位置，不采用参数顺序', () => {
    const doc = new SvgDocument(100, 100, ['a', 'b', 'c', 'd'].map(id => new Rect(id, 1, 2, 3, 4)));
    doc.group('pair', ['c', 'a']);
    expect(doc.describe().getRoots().map(shape => shape.getId())).toEqual(['pair', 'b', 'd']);
    expect(doc.describeShape('pair').getChildren().map(shape => shape.getId())).toEqual(['a', 'c']);
    expect(doc.getParentId('pair')).toBeUndefined();
    expect(doc.getParentId('a')).toBe('pair');
    expect(doc.getParentId('c')).toBe('pair');
    expect(doc.getElementCount()).toBe(5);
  });

  it('跨根分支选择放在最低共同父级的最早分支前，原空容器保留', () => {
    const doc = new SvgDocument(100, 100, [new Group('left', [new Rect('a', 1, 2, 3, 4), new Rect('x', 0, 0, 1, 1)]),
      new Rect('middle', 0, 0, 1, 1), new Group('right', [new Rect('b', 2, 3, 4, 5), new Rect('y', 0, 0, 1, 1)])]);
    doc.group('pair', ['b', 'a']);
    expect(doc.describe().getRoots().map(shape => shape.getId())).toEqual(['pair', 'left', 'middle', 'right']);
    expect(doc.describeShape('pair').getChildren().map(shape => shape.getId())).toEqual(['a', 'b']);
    expect(doc.describeShape('left').getChildren().map(shape => shape.getId())).toEqual(['x']);
    expect(doc.describeShape('right').getChildren().map(shape => shape.getId())).toEqual(['y']);
    doc.group('all', ['right', 'left']);
    expect(doc.describe().getRoots().map(shape => shape.getId())).toEqual(['pair', 'all', 'middle']);
    expect(doc.getParentId('x')).toBe('left');
    expect(doc.getParentId('left')).toBe('all');
  });

  it('嵌套分支和直接子节点共同分组，挂在真正最低共同容器中', () => {
    const doc = new SvgDocument(100, 100, [new Group('outer', [new Rect('before', 0, 0, 1, 1),
      new Group('left', [new Group('deep', [new Rect('a', 1, 2, 3, 4)])]), new Rect('direct', 0, 0, 1, 1),
      new Group('right', [new Rect('b', 2, 3, 4, 5)]), new Rect('after', 0, 0, 1, 1)])]);
    expect(doc.getElementCount()).toBe(9);
    doc.group('pair', ['b', 'direct', 'a']);
    expect(doc.getParentId('pair')).toBe('outer');
    expect(doc.describeShape('outer').getChildren().map(shape => shape.getId())).toEqual(['before', 'pair', 'left', 'right', 'after']);
    expect(doc.describeShape('pair').getChildren().map(shape => shape.getId())).toEqual(['a', 'direct', 'b']);
    expect(doc.describeShape('deep').getChildren()).toEqual([]);
    expect(doc.describeShape('right').getChildren()).toEqual([]);
    expect(doc.getParentId('deep')).toBe('left');
    expect(doc.getElementCount()).toBe(10);
  });

  it('单目标分组包裹原位置；真实 id svg 不与根哨兵混淆', () => {
    const doc = new SvgDocument(100, 100, [new Group('svg', [new Rect('a', 1, 2, 3, 4)])]);
    doc.group('one', ['a']);
    expect(doc.getParentId('one')).toBe('svg');
    expect(doc.getParentId('a')).toBe('one');
    doc.ungroup('one');
    expect(doc.getParentId('a')).toBe('svg');
    expect(doc.describeShape('svg').getChildren().map(shape => shape.getId())).toEqual(['a']);
  });

  it.each([
    { newId: 'a', ids: ['b'], error: 'id already exists: a' },
    { newId: 'pair', ids: [], error: 'group requires at least one shape' },
    { newId: 'pair', ids: ['a', 'a'], error: 'duplicate group target: a' },
    { newId: 'pair', ids: ['a', 'missing'], error: 'no such shape: missing' },
    { newId: 'pair', ids: ['a', 'outer'], error: 'cannot group a container into its own descendant: outer' },
    { newId: 'pair', ids: ['outer', 'inner'], error: 'cannot group a container into its own descendant: outer' },
    { newId: '', ids: ['a'], error: 'id must be non-empty and contain no whitespace' },
  ])('分组校验 $error 后树、索引、计数与新 id 都不改变', ({ newId, ids, error }) => {
    const doc = new SvgDocument(100, 100, [new Group('outer', [new Group('inner', [new Rect('a', 1, 2, 3, 4)]), new Rect('b', 0, 0, 1, 1)])]);
    const before = doc.describe();
    const count = doc.getElementCount();
    expect(() => doc.group(newId, ids)).toThrow(error);
    expect(doc.describe()).toEqual(before);
    expect(doc.getElementCount()).toBe(count);
    expect(doc.getParentId('a')).toBe('inner');
    if (newId === 'pair') { doc.group('pair', ['a']); expect(doc.getParentId('a')).toBe('pair'); }
  });

  it('分组构造/复制抛错时旧节点尚未摘除', () => {
    const doc = new SvgDocument(100, 100, [new Rect('a', 1, 2, 3, 4), new Rect('b', 1, 2, 3, 4)]);
    const before = doc.describe();
    const clone = vi.spyOn(Rect.prototype, 'clone').mockImplementation(() => { throw new DomainError('clone failed'); });
    expect(() => doc.group('pair', ['a', 'b'])).toThrow(/^clone failed$/);
    expect(doc.describe()).toEqual(before);
    expect(doc.getElementCount()).toBe(2);
    clone.mockRestore();
    doc.group('pair', ['a', 'b']);
    expect(doc.getParentId('a')).toBe('pair');
  });

  it('复制得到与未选节点冲突的 id 也在修改前拒绝', () => {
    const doc = new SvgDocument(100, 100, [new Rect('a', 1, 2, 3, 4), new Rect('taken', 1, 2, 3, 4)]);
    const before = doc.describe();
    vi.spyOn(Rect.prototype, 'clone').mockImplementation(() => new Rect('taken', 1, 2, 3, 4));
    expect(() => doc.group('pair', ['a'])).toThrow(/^id already exists: taken$/);
    expect(doc.describe()).toEqual(before);
    expect(doc.getParentId('a')).toBeUndefined();
  });

  it('嵌套解组按原位置提升子节点，清理组 id 并保留缺省/显式属性', () => {
    const a = new Rect('a', 1, 2, 3, 4);
    const b = new Rect('b', 1, 2, 3, 4);
    b.set('fill', 'blue');
    const inner = new Group('inner', [a, new Group('nested', [b])]);
    inner.set('fill', 'red');
    const doc = new SvgDocument(100, 100, [new Group('outer', [new Rect('before', 0, 0, 1, 1), inner, new Rect('after', 0, 0, 1, 1)])]);
    doc.ungroup('inner');
    expect(doc.describeShape('outer').getChildren().map(shape => shape.getId())).toEqual(['before', 'a', 'nested', 'after']);
    expect(doc.getParentId('a')).toBe('outer');
    expect(doc.getParentId('nested')).toBe('outer');
    expect(doc.getParentId('b')).toBe('nested');
    expect(Object.hasOwn(doc.describeShape('a').getAttributes(), 'fill')).toBe(false);
    expect(doc.describeShape('b').getAttributes()['fill']).toBe('blue');
    expect(() => doc.describeShape('inner')).toThrow(/^no such shape: inner$/);
    doc.add(new Group('inner'), 'outer');
    expect(doc.getParentId('inner')).toBe('outer');
  });

  it('空嵌套组解散后没有占位，同级未选节点顺序保持', () => {
    const doc = new SvgDocument(100, 100, [new Group('outer', [new Rect('a', 1, 2, 3, 4), new Group('empty'), new Rect('b', 1, 2, 3, 4)])]);
    doc.ungroup('empty');
    expect(doc.describeShape('outer').getChildren().map(shape => shape.getId())).toEqual(['a', 'b']);
    expect(doc.getElementCount()).toBe(3);
  });

  it.each([
    { id: 'missing', error: 'no such shape: missing' },
    { id: 'outer', error: 'cannot ungroup top-level container: outer' },
    { id: 'a', error: 'not a container: a' },
  ])('解组失败 $error 保留树不变', ({ id, error }) => {
    const doc = new SvgDocument(100, 100, [new Group('outer', [new Rect('a', 1, 2, 3, 4)])]);
    const before = doc.describe();
    expect(() => doc.ungroup(id)).toThrow(error);
    expect(doc.describe()).toEqual(before);
  });

  it('容器能容纳与能解散分别判断，不通过标签/具体类分派', () => {
    const doc = new SvgDocument(100, 100, [new Group('outer', [new Group('locked')])]);
    const before = doc.describe();
    vi.spyOn(Group.prototype, 'canUngroup').mockReturnValue(false);
    expect(() => doc.ungroup('locked')).toThrow(/^cannot ungroup composite shape: locked$/);
    expect(doc.describe()).toEqual(before);
    doc.add(new Rect('a', 1, 2, 3, 4), 'locked');
    expect(doc.getParentId('a')).toBe('locked');
  });

  it('跨父级 addto 移入末尾，整棵子树索引、几何和自身属性保持', () => {
    const moved = new Group('moved', [new Rect('a', 1, 2, 3, 4)]);
    moved.set('fill', 'red');
    const doc = new SvgDocument(100, 100, [new Group('left', [moved]), new Group('right', [new Rect('b', 0, 0, 1, 1)])]);
    const before = doc.describeShape('moved');
    doc.addTo('right', 'moved');
    expect(doc.describeShape('moved')).toEqual(before);
    expect(doc.describeShape('left').getChildren()).toEqual([]);
    expect(doc.describeShape('right').getChildren().map(shape => shape.getId())).toEqual(['b', 'moved']);
    expect(doc.getParentId('moved')).toBe('right');
    expect(doc.getParentId('a')).toBe('moved');
    expect(doc.getElementCount()).toBe(5);
    doc.move('right', 3, 4);
    expect(doc.describeShape('a').getPosition()).toEqual([4, 6]);
    expect(doc.clone().describe()).toEqual(doc.describe());
  });

  it('同父级 addto 移到末尾，根级节点也可移入现有组', () => {
    const doc = new SvgDocument(100, 100, [new Rect('root', 1, 2, 3, 4), new Group('g', ['a', 'b'].map(id => new Rect(id, 1, 2, 3, 4)))]);
    doc.addTo('g', 'a');
    expect(doc.describeShape('g').getChildren().map(shape => shape.getId())).toEqual(['b', 'a']);
    doc.addTo('g', 'root');
    expect(doc.describe().getRoots().map(shape => shape.getId())).toEqual(['g']);
    expect(doc.describeShape('g').getChildren().map(shape => shape.getId())).toEqual(['b', 'a', 'root']);
    expect(doc.getParentId('root')).toBe('g');
  });

  it.each([
    { parent: 'missing', id: 'a', error: 'no such container: missing' },
    { parent: 'a', id: 'b', error: 'not a container: a' },
    { parent: 'outer', id: 'missing', error: 'no such shape: missing' },
    { parent: 'outer', id: 'outer', error: 'cannot add a shape into itself or its descendant: outer' },
    { parent: 'inner', id: 'outer', error: 'cannot add a shape into itself or its descendant: outer' },
    { parent: 'deep', id: 'outer', error: 'cannot add a shape into itself or its descendant: outer' },
  ])('addto 失败 $error 不改变列表、索引或计数', ({ parent, id, error }) => {
    const doc = new SvgDocument(100, 100, [new Group('outer', [new Group('inner', [new Group('deep'), new Rect('a', 1, 2, 3, 4)]), new Rect('b', 1, 2, 3, 4)])]);
    const before = doc.describe();
    expect(() => doc.addTo(parent, id)).toThrow(error);
    expect(doc.describe()).toEqual(before);
    expect(doc.getElementCount()).toBe(5);
    expect(doc.getParentId('a')).toBe('inner');
  });
});
