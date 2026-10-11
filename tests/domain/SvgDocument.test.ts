import { describe, expect, it } from 'vitest';
import { Circle } from '../../src/domain/Circle.js';
import { Ellipse } from '../../src/domain/Ellipse.js';
import { Group } from '../../src/domain/Group.js';
import { Line } from '../../src/domain/Line.js';
import { Rect } from '../../src/domain/Rect.js';
import { ShapeAccess } from '../../src/domain/ShapeAccess.js';
import { SvgDocument } from '../../src/domain/SvgDocument.js';
import { Text } from '../../src/domain/Text.js';

describe('画布和受控文档树', () => {
  it.each([
    { tag: 'rect', create: () => new Rect('s', 1, 2, 3, 4) },
    { tag: 'circle', create: () => new Circle('s', 1, 2, 3) },
    { tag: 'ellipse', create: () => new Ellipse('s', 1, 2, 3, 4) },
    { tag: 'line', create: () => new Line('s', 1, 2, 3, 4) },
    { tag: 'text', create: () => new Text('s', 1, 2, '') },
    { tag: 'g', create: () => new Group('s', [new Circle('child', 1, 2, 3)]) },
  ])('$tag 同样支持根级和嵌套附着', ({ tag, create }) => {
    const rootDoc = new SvgDocument();
    rootDoc.add(create());
    expect(rootDoc.getParentId('s')).toBeUndefined();
    expect(rootDoc.describeShape('s').getTag()).toBe(tag);
    const nestedDoc = new SvgDocument(100, 100, [new Group('parent')]);
    nestedDoc.add(create(), 'parent');
    expect(nestedDoc.getParentId('s')).toBe('parent');
    expect(nestedDoc.describeShape('s')).toEqual(rootDoc.describeShape('s'));
    expect(nestedDoc.getElementCount()).toBe(rootDoc.getElementCount() + 1);
  });

  it('默认 800×600，根画布不占图形 id 或元素数', () => {
    const doc = new SvgDocument();
    expect(doc.getWidth()).toBe(800);
    expect(doc.getHeight()).toBe(600);
    expect(doc.getElementCount()).toBe(0);
    expect(doc.describe().getRoots()).toEqual([]);
    expect(() => doc.describeShape('svg')).toThrow(/^no such shape: svg$/);
    doc.add(new Group('svg'));
    expect(doc.getElementCount()).toBe(1);
    expect(doc.getParentId('svg')).toBeUndefined();
  });

  it.each([0, -1, NaN, Infinity])('画布无效尺寸 %s 拒绝且双尺寸原子更新', value => {
    const doc = new SvgDocument(100, 200);
    const before = doc.describe();
    expect(() => new SvgDocument(value, 200)).toThrow();
    expect(() => doc.resize(300, value)).toThrow();
    expect(doc.describe()).toEqual(before);
    doc.resize(0.5, 2.5);
    expect(doc.describe().getWidth()).toBe(0.5);
    expect(doc.describe().getHeight()).toBe(2.5);
  });

  it('嵌套附着时索引、父级和顺序一致', () => {
    const doc = new SvgDocument(400, 300, [new Group('outer', [new Group('inner')])]);
    doc.add(new Rect('a', 1, 2, 3, 4), 'inner');
    doc.add(new Text('b', 5, 6, ''), 'inner');
    doc.add(new Circle('c', 0, 0, 1));
    expect(doc.getElementCount()).toBe(5);
    expect(doc.getParentId('outer')).toBeUndefined();
    expect(doc.getParentId('inner')).toBe('outer');
    expect(doc.getParentId('a')).toBe('inner');
    expect(doc.describeShape('inner').getChildren().map(child => child.getId())).toEqual(['a', 'b']);
    expect(doc.describe().getRoots().map(child => child.getId())).toEqual(['outer', 'c']);
    doc.move('outer', 2, 3);
    expect(doc.describeShape('a').getAttributes()).toMatchObject({ x: 3, y: 5 });
    expect(doc.describeShape('b').getAttributes()).toMatchObject({ x: 7, y: 9 });
  });

  it('id 大小写敏感，全树唯一，失败附着不留下半棵子树', () => {
    const doc = new SvgDocument(100, 100, [new Rect('A', 0, 0, 1, 1)]);
    doc.add(new Circle('a', 1, 1, 2));
    const before = doc.describe();
    expect(() => doc.add(new Group('g', [new Text('ok', 0, 0, ''), new Rect('A', 0, 0, 1, 1)])))
      .toThrow(/^id already exists: A$/);
    expect(doc.describe()).toEqual(before);
    expect(doc.getElementCount()).toBe(2);
    expect(() => doc.describeShape('ok')).toThrow(/^no such shape: ok$/);
    expect(() => doc.describeShape('g')).toThrow(/^no such shape: g$/);
    doc.add(new Group('g'));
    doc.add(new Text('ok', 0, 0, ''), 'g');
    expect(doc.getElementCount()).toBe(4);
  });

  it('错误容器消息精确，失败后可重用相同 id', () => {
    const doc = new SvgDocument(100, 100, [new Rect('r', 0, 0, 1, 1)]);
    const before = doc.describe();
    const child = new Circle('c', 0, 0, 1);
    expect(() => doc.add(child, 'missing')).toThrow(/^no such container: missing$/);
    expect(() => doc.add(child, 'r')).toThrow(/^not a container: r$/);
    expect(doc.describe()).toEqual(before);
    doc.add(child);
    expect(doc.getElementCount()).toBe(2);
  });

  it('批量初始树也检测跨根重复 id，根和输入数组均复制', () => {
    expect(() => new SvgDocument(100, 100, [new Group('g', [new Rect('x', 0, 0, 1, 1)]),
      new Circle('x', 0, 0, 1)])).toThrow(/^id already exists: x$/);
    const source = new Group('g', [new Text('t', 1, 2, 'old')]);
    const roots = [source];
    const doc = new SvgDocument(100, 100, roots);
    roots.pop();
    source.move(10, 20);
    source.set('fill', 'red');
    expect(doc.describeShape('t').getAttributes()).toMatchObject({ x: 1, y: 2 });
    expect(doc.describeShape('g').getAttributes()).not.toHaveProperty('fill');
  });

  it('添加时复制来源，调用者后续修改无法绕过文档索引', () => {
    const source = new Group('g', [new Text('t', 1, 2, 'old')]);
    const doc = new SvgDocument();
    doc.add(source);
    source.move(10, 20);
    source[ShapeAccess.children]().insert(new Rect('external', 0, 0, 1, 1));
    expect(doc.getElementCount()).toBe(2);
    expect(doc.describeShape('t').getAttributes()).toMatchObject({ x: 1, y: 2 });
    expect(() => doc.describeShape('external')).toThrow('no such shape: external');
  });

  it('内部协作键构造的环或共享节点也在克隆前拒绝', () => {
    const cyclic = new Group('cycle');
    cyclic[ShapeAccess.children]().insert(cyclic);
    const doc = new SvgDocument();
    expect(() => doc.add(cyclic)).toThrow('cyclic shape tree: cycle');
    expect(doc.getElementCount()).toBe(0);
    const shared = new Rect('same', 0, 0, 1, 1);
    const invalid = new Group('g');
    invalid[ShapeAccess.children]().insert(shared);
    invalid[ShapeAccess.children]().insert(shared);
    expect(() => doc.add(invalid)).toThrow('id already exists: same');
    expect(doc.describe().getRoots()).toEqual([]);
  });

  it('移除嵌套子树清理全部索引、父级，并保留其他节点顺序', () => {
    const doc = new SvgDocument(100, 100, [new Group('g', [new Rect('a', 0, 0, 1, 1),
      new Group('inner', [new Text('b', 1, 2, '')]), new Circle('c', 0, 0, 1)])]);
    doc.remove('inner');
    expect(doc.getElementCount()).toBe(3);
    expect(doc.describeShape('g').getChildren().map(child => child.getId())).toEqual(['a', 'c']);
    expect(() => doc.getParentId('b')).toThrow(/^no such shape: b$/);
    expect(() => doc.describeShape('inner')).toThrow(/^no such shape: inner$/);
    doc.add(new Text('b', 3, 4, ''), 'g');
    expect(doc.getParentId('b')).toBe('g');
    doc.remove('g');
    expect(doc.getElementCount()).toBe(0);
    expect(doc.describe().getRoots()).toEqual([]);
  });

  it('所有按 id 操作对缺失目标统一失败且不改变文档', () => {
    const doc = new SvgDocument();
    const before = doc.describe();
    for (const action of [() => doc.remove('x'), () => doc.move('x', 1, 2), () => doc.scale('x', 2),
      () => doc.set('x', 'fill', 'red'), () => doc.getParentId('x'), () => doc.describeShape('x')]) {
      expect(action).toThrow(/^no such shape: x$/);
      expect(doc.describe()).toEqual(before);
    }
  });

  it('深复制精确保留尺寸、子树、缺省样式、文本和浮点值', () => {
    const a = new Rect('a', 0.1, -0.2, 1 / 3, 4);
    a.set('fill', 'red');
    const doc = new SvgDocument(123.5, 456.25, [new Group('g', [a, new Group('inner', [new Text('t', 2, 3, '')])])]);
    const before = doc.describe();
    const copy = doc.clone();
    expect(copy.describe()).toEqual(before);
    expect(copy.getParentId('t')).toBe('inner');
    doc.remove('inner');
    doc.resize(1, 2);
    doc.set('a', 'fill', 'blue');
    copy.move('g', 10, 20);
    copy.set('t', 'text', 'new');
    copy.add(new Circle('c', 0, 0, 1), 'inner');
    expect(doc.getElementCount()).toBe(2);
    expect(copy.getElementCount()).toBe(5);
    expect(copy.describeShape('a').getAttributes()).toHaveProperty('fill', 'red');
    expect(copy.describeShape('t').getText()).toBe('new');
    expect(before.getRoots()[0]?.getChildren()[0]?.getAttributes()).toEqual({ id: 'a', x: 0.1, y: -0.2, width: 1 / 3, height: 4, fill: 'red' });
  });

  it('只读文档描述不会泄露持有节点或可写数组', () => {
    const doc = new SvgDocument(100, 100, [new Group('g', [new Rect('a', 1, 2, 3, 4)])]);
    const before = doc.describe();
    expect(Object.isFrozen(before)).toBe(true);
    expect(Object.isFrozen(before.getRoots())).toBe(true);
    expect(Reflect.set(before.getRoots(), '0', null)).toBe(false);
    expect(Reflect.set(doc.describeShape('a').getAttributes(), 'width', 99)).toBe(false);
    doc.move('a', 5, 6);
    expect(before.getRoots()[0]?.getChildren()[0]?.getAttributes()).toMatchObject({ x: 1, y: 2 });
    expect(doc.describeShape('a').getAttributes()).toMatchObject({ x: 6, y: 8, width: 3 });
  });
});
