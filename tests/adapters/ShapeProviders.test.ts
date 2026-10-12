import { describe, expect, it } from 'vitest';
import { ShapeFactory } from '../../src/application/ShapeFactory.js';
import { RectProvider } from '../../src/adapters/shapes/RectProvider.js';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';

describe('唯一图形工厂及六种提供者', () => {
  it.each([
    { type: 'rect', parameters: ['1', '2', '3', '4'], attributes: { id: 'a', x: 1, y: 2, width: 3, height: 4 } },
    { type: 'circle', parameters: ['1', '2', '3'], attributes: { id: 'a', cx: 1, cy: 2, r: 3 } },
    { type: 'ellipse', parameters: ['1', '2', '3', '4'], attributes: { id: 'a', cx: 1, cy: 2, rx: 3, ry: 4 } },
    { type: 'line', parameters: ['1', '2', '3', '4'], attributes: { id: 'a', x1: 1, y1: 2, x2: 3, y2: 4 } },
    { type: 'text', parameters: ['1', '2', '开始 <>&'], attributes: { id: 'a', x: 1, y: 2 } },
    { type: 'g', parameters: [], attributes: { id: 'a' } },
  ])('$type 保持参数、缺省样式、标签和具体类的复制能力', ({ type, parameters, attributes }) => {
    const factory = new EditorComposition().createFactory();
    const shape = factory.create(type, 'a', parameters);
    expect(shape.describe().getTag()).toBe(type);
    expect(shape.describe().getAttributes()).toEqual(attributes);
    expect(shape.clone().constructor).toBe(shape.constructor);
    expect(shape.clone().describe()).toEqual(shape.describe());
    if (type === 'text') { expect(shape.describe().getText()).toBe('开始 <>&'); }
  });

  it.each(['rect', 'circle', 'ellipse', 'line'])('%s 可选样式和非法参数数量严格处理', type => {
    const factory = new EditorComposition().createFactory();
    const parameters = type === 'circle' ? ['0', '0', '1'] : ['0', '0', '1', '1'];
    const shape = factory.create(type, 'a', [...parameters, '#3366ff']);
    expect(shape.describe().getAttributes()[type === 'line' ? 'stroke' : 'fill']).toBe('#3366ff');
    expect(() => factory.create(type, 'a', parameters.slice(1))).toThrow(`invalid parameters for ${type}`);
    expect(() => factory.create(type, 'a', [...parameters, 'red', 'blue'])).toThrow(`invalid parameters for ${type}`);
  });

  it.each(['box', 'hexagon', 'RECT', 'constructor', '__proto__'])('未注册类型 %s 给出规定错误，不受原型属性影响', type => {
    const factory = new EditorComposition().createFactory();
    expect(() => factory.create(type, 'a', [])).toThrow(`unknown shape type: ${type} (is the plugin loaded?)`);
  });

  it.each(['NaN', 'Infinity', '1px', '0x10', '1abc'])('创建拒绝非完整有限数字 %s', value => {
    const factory = new EditorComposition().createFactory();
    expect(() => factory.create('rect', 'a', [value, '0', '1', '1'])).toThrow(/^invalid number: x$/);
  });

  it('科学计数法、空 text 和空 g 可创建；g/text 不接收额外样式位置参数', () => {
    const factory = new EditorComposition().createFactory();
    expect(factory.create('rect', 'a', ['1e-1', '-.2', '0', '1']).describe().getPosition()).toEqual([0.1, -0.2]);
    expect(factory.create('text', 'b', ['0', '0', '']).describe().getText()).toBe('');
    expect(factory.create('g', 'c', []).describe().getChildren()).toEqual([]);
    expect(() => factory.create('g', 'c', ['red'])).toThrow(/^invalid parameters for g$/);
    expect(() => factory.create('text', 'b', ['0', '0', '', 'red'])).toThrow(/^invalid parameters for text$/);
  });

  it('重复注册失败后保留原提供者', () => {
    const factory = new ShapeFactory();
    factory.register(new RectProvider());
    expect(() => factory.register(new RectProvider())).toThrow(/^shape type already registered: rect$/);
    expect(factory.create('rect', 'a', ['1', '2', '3', '4']).describe().getAttributes()['x']).toBe(1);
  });
});
