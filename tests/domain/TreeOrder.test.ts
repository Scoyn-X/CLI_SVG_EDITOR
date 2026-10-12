import { describe, expect, it } from 'vitest';
import { Group } from '../../src/domain/Group.js';
import { OrderedChildren } from '../../src/domain/OrderedChildren.js';
import { Rect } from '../../src/domain/Rect.js';
import { SvgDocument } from '../../src/domain/SvgDocument.js';

describe('同级绘制顺序和树编辑组合', () => {
  it.each([
    { front: true, expected: ['a', 'c', 'b'] },
    { front: false, expected: ['b', 'a', 'c'] },
  ])('根级 front=$front 移到对应末尾/开头，文档其余状态保持', ({ front, expected }) => {
    const doc = new SvgDocument(100, 200, ['a', 'b', 'c'].map(id => new Rect(id, 1, 2, 3, 4)));
    const b = doc.describeShape('b');
    const old = doc.describe();
    if (front) { doc.front('b'); } else { doc.back('b'); }
    expect(doc.describe().getRoots().map(shape => shape.getId())).toEqual(expected);
    expect(old.getRoots().map(shape => shape.getId())).toEqual(['a', 'b', 'c']);
    expect(doc.describeShape('b')).toEqual(b);
    expect(doc.getParentId('b')).toBeUndefined();
    expect(doc.getElementCount()).toBe(3);
    expect(doc.getWidth()).toBe(100);
    expect(doc.getHeight()).toBe(200);
  });

  it('嵌套组的 front/back 移动整棵子树，不跨父级或改变自身内容', () => {
    const g = new Group('inner', [new Rect('leaf', .1, .2, 3, 4)]);
    g.set('fill', 'red');
    const doc = new SvgDocument(100, 100, [new Rect('root', 0, 0, 1, 1), new Group('outer', [new Rect('a', 0, 0, 1, 1), g, new Rect('b', 0, 0, 1, 1)])]);
    const before = doc.describeShape('inner');
    doc.front('inner');
    expect(doc.describeShape('outer').getChildren().map(shape => shape.getId())).toEqual(['a', 'b', 'inner']);
    doc.back('inner');
    expect(doc.describeShape('outer').getChildren().map(shape => shape.getId())).toEqual(['inner', 'a', 'b']);
    expect(doc.describe().getRoots().map(shape => shape.getId())).toEqual(['root', 'outer']);
    expect(doc.describeShape('inner')).toEqual(before);
    expect(doc.getParentId('inner')).toBe('outer');
    expect(doc.getParentId('leaf')).toBe('inner');
    expect(doc.clone().describe()).toEqual(doc.describe());
  });

  it.each(['front', 'back'] as const)('%s 对单节点和已经到边界的节点为成功无变化操作', operation => {
    const single = new SvgDocument(100, 100, [new Group('g')]);
    const before = single.describe();
    single[operation]('g');
    expect(single.describe()).toEqual(before);
    const doc = new SvgDocument(100, 100, ['a', 'b'].map(id => new Rect(id, 1, 2, 3, 4)));
    const expected = doc.describe();
    doc[operation](operation === 'front' ? 'b' : 'a');
    expect(doc.describe()).toEqual(expected);
  });

  it.each(['front', 'back'] as const)('%s 不存在 id 失败时没有移除任何节点', operation => {
    const doc = new SvgDocument(100, 100, [new Group('outer', [new Rect('a', 1, 2, 3, 4)])]);
    const before = doc.describe();
    expect(() => doc[operation]('missing')).toThrow(/^no such shape: missing$/);
    expect(doc.describe()).toEqual(before);
    expect(doc.getParentId('a')).toBe('outer');
  });

  it('重排后的分组按当前文档顺序收编，解组按当前组位置提升', () => {
    const doc = new SvgDocument(100, 100, [new Group('outer', ['a', 'b', 'c', 'd'].map(id => new Rect(id, 1, 2, 3, 4)))]);
    doc.front('a');
    doc.back('d');
    expect(doc.describeShape('outer').getChildren().map(shape => shape.getId())).toEqual(['d', 'b', 'c', 'a']);
    doc.group('pair', ['a', 'd']);
    expect(doc.describeShape('pair').getChildren().map(shape => shape.getId())).toEqual(['d', 'a']);
    doc.front('pair');
    doc.ungroup('pair');
    expect(doc.describeShape('outer').getChildren().map(shape => shape.getId())).toEqual(['b', 'c', 'd', 'a']);
    expect(doc.getParentId('d')).toBe('outer');
    doc.remove('outer');
    expect(doc.getElementCount()).toBe(0);
    expect(() => doc.front('a')).toThrow(/^no such shape: a$/);
    doc.add(new Rect('a', 1, 2, 3, 4));
    expect(doc.getParentId('a')).toBeUndefined();
  });

  it('有序列表替换来源会被复制，非法位置与未知成员失败不改变列表', () => {
    const list = new OrderedChildren<string>();
    list.insert('a'); list.insert('group'); list.insert('b');
    const incoming = ['x', 'y'];
    list.replace('group', incoming);
    incoming.push('late');
    expect(list.items()).toEqual(['a', 'x', 'y', 'b']);
    const before = list.items();
    expect(() => list.replace('missing', ['bad'])).toThrow();
    expect(() => list.insert('bad', -1)).toThrow();
    expect(() => list.insert('bad', 99)).toThrow();
    expect(() => list.insert('bad', 0.5)).toThrow();
    expect(list.items()).toEqual(before);
    expect(Object.isFrozen(before)).toBe(true);
  });
});
