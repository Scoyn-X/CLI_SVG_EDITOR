import { describe, expect, it } from 'vitest';
import { Circle } from '../../src/domain/Circle.js';
import { Ellipse } from '../../src/domain/Ellipse.js';
import { Group } from '../../src/domain/Group.js';
import { Line } from '../../src/domain/Line.js';
import { Rect } from '../../src/domain/Rect.js';
import type { Shape } from '../../src/domain/Shape.js';
import { Text } from '../../src/domain/Text.js';

const leaves = [
  { tag: 'rect', create: () => new Rect('s', 1, 2, 3, 4), initial: { x: 1, y: 2, width: 3, height: 4 },
    moved: { x: -1, y: 2.5, width: 3, height: 4 }, scaled: { x: 2, y: 4, width: 6, height: 8 } },
  { tag: 'circle', create: () => new Circle('s', 1, 2, 3), initial: { cx: 1, cy: 2, r: 3 },
    moved: { cx: -1, cy: 2.5, r: 3 }, scaled: { cx: 2, cy: 4, r: 6 } },
  { tag: 'ellipse', create: () => new Ellipse('s', 1, 2, 3, 4), initial: { cx: 1, cy: 2, rx: 3, ry: 4 },
    moved: { cx: -1, cy: 2.5, rx: 3, ry: 4 }, scaled: { cx: 2, cy: 4, rx: 6, ry: 8 } },
  { tag: 'line', create: () => new Line('s', 1, 2, 3, 4), initial: { x1: 1, y1: 2, x2: 3, y2: 4 },
    moved: { x1: -1, y1: 2.5, x2: 1, y2: 4.5 }, scaled: { x1: 2, y1: 4, x2: 6, y2: 8 } },
  { tag: 'text', create: () => new Text('s', 1, 2, '开始 & "<>"'), initial: { x: 1, y: 2 },
    moved: { x: -1, y: 2.5 }, scaled: { x: 2, y: 4 } },
];

describe.each(leaves)('$tag 叶子图形', ({ tag, create, initial, moved, scaled }) => {
  it('保留几何、类型和未设置样式', () => {
    const view = create().describe();
    expect(view.getId()).toBe('s');
    expect(view.getTag()).toBe(tag);
    expect(view.getAttributes()).toEqual({ id: 's', ...initial });
    expect(view.getChildren()).toEqual([]);
    if (tag === 'text') expect(view.getText()).toBe('开始 & "<>"');
  });

  it('按增量移动全部坐标，保留尺寸', () => {
    const shape: Shape = create();
    shape.move(-2, 0.5);
    expect(shape.describe().getAttributes()).toEqual({ id: 's', ...moved });
  });

  it('缩放位置和尺寸，不缩放样式', () => {
    const shape: Shape = create();
    shape.set('stroke-width', 2);
    shape.scale(2);
    expect(shape.describe().getAttributes()).toEqual({ id: 's', ...scaled, 'stroke-width': 2 });
  });

  it('只允许自身几何白名单和公共样式', () => {
    const shape: Shape = create();
    for (const name of Object.keys(initial)) shape.set(name, '5e1');
    expect(shape.describe().getAttributes()).toEqual({ id: 's', ...Object.fromEntries(Object.keys(initial).map(name => [name, 50])) });
    shape.set('fill', '#eee');
    shape.set('stroke', 'none');
    expect(shape.describe().getAttributes()).toMatchObject({ fill: '#eee', stroke: 'none' });
    for (const name of ['id', 'label', 'transform', 'font-size', 'constructor', 'toString', '__proto__']) {
      const before = shape.describe();
      expect(() => shape.set(name, '1')).toThrow(`unknown attribute: ${name}`);
      expect(shape.describe()).toEqual(before);
    }
  });

  it('多态复制保留子类型与显式样式，修改互不影响', () => {
    const shape: Shape = create();
    shape.set('fill', 'red');
    const clone = shape.clone();
    expect(clone).toBeInstanceOf(shape.constructor);
    expect(clone.describe()).toEqual(shape.describe());
    clone.move(10, 20);
    clone.set('fill', 'blue');
    expect(shape.describe().getAttributes()).toEqual({ id: 's', ...initial, fill: 'red' });
    shape.set('stroke', 'green');
    expect(clone.describe().getAttributes()).not.toHaveProperty('stroke');
  });
});

describe('几何与属性失败边界', () => {
  it.each([0, -1, -0])('非正缩放 %s 的消息精确，状态不变', factor => {
    const rect = new Rect('r', 1, 2, 3, 4);
    const before = rect.describe();
    expect(() => rect.scale(factor)).toThrow(/^scale factor must be positive$/);
    expect(rect.describe()).toEqual(before);
  });

  it.each([NaN, Infinity, -Infinity])('拒绝非有限值 %s', value => {
    const rect = new Rect('r', 1, 2, 3, 4);
    const before = rect.describe();
    expect(() => new Circle('c', value, 0, 1)).toThrow('invalid number');
    expect(() => rect.move(1, value)).toThrow('invalid number');
    expect(() => rect.scale(value)).toThrow('invalid number');
    expect(() => rect.set('x', value)).toThrow('invalid number');
    expect(rect.describe()).toEqual(before);
  });

  it.each(['', ' ', ' 1', '1 ', '10abc', '10px', '0x10', 'NaN', 'Infinity', '1e999'])('完整校验数字 token %j', value => {
    const rect = new Rect('r', 1, 2, 3, 4);
    const before = rect.describe();
    expect(() => rect.set('width', value)).toThrow('invalid number: width');
    expect(() => rect.set('stroke-width', value)).toThrow('invalid number: stroke-width');
    expect(rect.describe()).toEqual(before);
  });

  it('允许负坐标和零尺寸，拒绝负尺寸、半径和描边宽度', () => {
    expect(new Rect('r', -1, -2, 0, 0).describe().getAttributes()).toMatchObject({ x: -1, width: 0 });
    expect(new Circle('c', -1, -2, 0).describe().getAttributes()).toMatchObject({ r: 0 });
    expect(new Ellipse('e', -1, -2, 0, 0).describe().getAttributes()).toMatchObject({ rx: 0, ry: 0 });
    expect(() => new Rect('r', 0, 0, -1, 1)).toThrow('width must be non-negative');
    expect(() => new Circle('c', 0, 0, -1)).toThrow('r must be non-negative');
    expect(() => new Ellipse('e', 0, 0, 1, -1)).toThrow('ry must be non-negative');
    const rect = new Rect('r', 0, 0, 1, 1);
    expect(() => rect.set('width', -1)).toThrow('width must be non-negative');
    expect(() => rect.set('stroke-width', -1)).toThrow('stroke-width must be non-negative');
    expect(rect.describe().getAttributes()).toEqual({ id: 'r', x: 0, y: 0, width: 1, height: 1 });
  });

  it('叶子运算溢出前不提交任何坐标或尺寸', () => {
    const line = new Line('l', 1, 2, Number.MAX_VALUE, 4);
    const before = line.describe();
    expect(() => line.move(Number.MAX_VALUE, 0)).toThrow('invalid number: x2');
    expect(() => line.scale(2)).toThrow('invalid number: x2');
    expect(line.describe()).toEqual(before);
  });

  it('text 内容独立于属性，允许空字符串、中文和特殊字符', () => {
    const text = new Text('t', 1, 2, '');
    expect(text.describe().getText()).toBe('');
    text.set('text', '开始 <A>&"B"\n结束😀');
    text.scale(0.5);
    expect(text.describe().getText()).toBe('开始 <A>&"B"\n结束😀');
    expect(text.describe().getAttributes()).not.toHaveProperty('text');
    const before = text.describe();
    expect(() => text.set('text', 1)).toThrow('invalid value: text');
    expect(() => text.set('text', '\u0000')).toThrow('invalid XML character: text');
    expect(text.describe()).toEqual(before);
  });

  it('公共样式校验不改变已设置值，描边宽度允许零', () => {
    const rect = new Rect('图形-😀', 0, 0, 1, 1);
    rect.set('fill', 'red');
    rect.set('stroke-width', '0');
    const before = rect.describe();
    expect(() => rect.set('fill', 1)).toThrow('invalid value: fill');
    expect(() => rect.set('stroke', '\u0000')).toThrow('invalid XML character: stroke');
    expect(rect.describe()).toEqual(before);
    expect(before.getId()).toBe('图形-😀');
    expect(before.getAttributes()).toHaveProperty('stroke-width', 0);
    expect(before.getAttributes()).not.toHaveProperty('stroke');
  });

  it.each(['', 'a b', 'a\tb', 'a\n', '\u0000', '\ud800', '\ufffe'])('拒绝不合法 id %j', id => {
    expect(() => new Group(id)).toThrow();
  });

  it('描述不可变，旧描述不随后续编辑改变', () => {
    const text = new Text('t', 1, 2, 'old');
    const before = text.describe();
    expect(Object.isFrozen(before)).toBe(true);
    expect(Object.isFrozen(before.getAttributes())).toBe(true);
    expect(Object.isFrozen(before.getChildren())).toBe(true);
    expect(Reflect.set(before.getAttributes(), 'x', 99)).toBe(false);
    text.move(10, 20);
    text.set('text', 'new');
    expect(before.getAttributes()).toEqual({ id: 't', x: 1, y: 2 });
    expect(before.getText()).toBe('old');
  });
});
