import { describe, expect, it } from 'vitest';
import { Circle } from '../../src/domain/Circle.js';
import { Group } from '../../src/domain/Group.js';
import { Line } from '../../src/domain/Line.js';
import { Rect } from '../../src/domain/Rect.js';
import { ShapeAccess } from '../../src/domain/ShapeAccess.js';
import { Text } from '../../src/domain/Text.js';

describe('Composite 组行为', () => {
  it('嵌套组对叶子统一移动、缩放，保留顺序和文本', () => {
    const group = new Group('outer', [new Rect('a', 1, 2, 3, 4), new Group('inner', [
      new Circle('b', 5, 6, 7), new Text('t', 8, 9, '开始'),
    ])]);
    group.move(-1, 0.5);
    group.scale(2);
    const children = group.describe().getChildren();
    expect(children.map(child => child.getId())).toEqual(['a', 'inner']);
    expect(children[0]?.getAttributes()).toEqual({ id: 'a', x: 0, y: 5, width: 6, height: 8 });
    expect(children[1]?.getChildren()[0]?.getAttributes()).toEqual({ id: 'b', cx: 8, cy: 13, r: 14 });
    expect(children[1]?.getChildren()[1]?.getAttributes()).toEqual({ id: 't', x: 14, y: 19 });
    expect(children[1]?.getChildren()[1]?.getText()).toBe('开始');
    expect(group.describe().getAttributes()).toEqual({ id: 'outer' });
  });

  it('组样式只设在组自身，不覆写子节点样式', () => {
    const explicit = new Rect('a', 1, 2, 3, 4);
    explicit.set('fill', 'blue');
    const group = new Group('g', [explicit, new Circle('b', 0, 0, 1)]);
    group.set('fill', 'red');
    group.set('stroke-width', '2');
    expect(group.describe().getAttributes()).toEqual({ id: 'g', fill: 'red', 'stroke-width': 2 });
    expect(group.describe().getChildren()[0]?.getAttributes()).toHaveProperty('fill', 'blue');
    expect(group.describe().getChildren()[1]?.getAttributes()).not.toHaveProperty('fill');
    for (const attr of ['x', 'text', 'transform']) expect(() => group.set(attr, '1')).toThrow(`unknown attribute: ${attr}`);
  });

  it.each(['move', 'scale'])('晚出现的子孙溢出时，整组 %s 原子失败', operation => {
    const group = new Group('g', [new Rect('first', 1, 2, 3, 4), new Group('nested', [
      new Line('last', 1, 2, Number.MAX_VALUE, 4),
    ])]);
    const before = group.describe();
    if (operation === 'move') expect(() => group.move(Number.MAX_VALUE, 0)).toThrow('invalid number: x2');
    else expect(() => group.scale(2)).toThrow('invalid number: x2');
    expect(group.describe()).toEqual(before);
  });

  it('空组也校验增量与因子', () => {
    const group = new Group('empty');
    group.move(1, 2);
    group.scale(2);
    expect(group.describe().getChildren()).toEqual([]);
    expect(() => group.move(Infinity, 0)).toThrow('invalid number: dx');
    expect(() => group.scale(0)).toThrow(/^scale factor must be positive$/);
  });

  it('构造和复制拥有独立子树，保留全部具体类型', () => {
    const source = new Rect('a', 1, 2, 3, 4);
    const group = new Group('g', [source, new Group('inner', [new Text('t', 5, 6, '')])]);
    source.move(100, 100);
    const clone = group.clone();
    expect(clone).toBeInstanceOf(Group);
    expect(clone[ShapeAccess.children]().items()[0]).toBeInstanceOf(Rect);
    const inner = clone[ShapeAccess.children]().items()[1];
    expect(inner).toBeInstanceOf(Group);
    expect(inner?.[ShapeAccess.children]()?.items()[0]).toBeInstanceOf(Text);
    clone.move(10, 20);
    expect(group.describe().getChildren()[0]?.getAttributes()).toMatchObject({ x: 1, y: 2 });
    group.set('fill', 'red');
    expect(clone.describe().getAttributes()).not.toHaveProperty('fill');
  });

  it('构造时拒绝父子重复 id 和不同分支的重复 id', () => {
    expect(() => new Group('g', [new Rect('g', 0, 0, 1, 1)])).toThrow(/^id already exists: g$/);
    expect(() => new Group('g', [new Group('left', [new Circle('x', 0, 0, 1)]),
      new Group('right', [new Rect('x', 0, 0, 1, 1)])])).toThrow(/^id already exists: x$/);
  });
});
