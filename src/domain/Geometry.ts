import { DomainError } from './DomainError.js';
import type { GeometryTransform } from './GeometryTransform.js';
import { ValueValidation } from './ValueValidation.js';

/** 不可变几何值，坐标轴和尺寸由具体图形声明，操作无需辨别图形类型。 */
export class Geometry {
  private readonly xs: Readonly<Record<string, number>>;
  private readonly ys: Readonly<Record<string, number>>;
  private readonly sizes: Readonly<Record<string, number>>;

  public constructor(xs: Readonly<Record<string, number>>, ys: Readonly<Record<string, number>>, sizes: Readonly<Record<string, number>> = {}) {
    const names = [...Object.keys(xs), ...Object.keys(ys), ...Object.keys(sizes)];
    if (new Set(names).size !== names.length) {
      throw new DomainError('duplicate geometry attribute');
    }
    for (const [name, value] of [...Object.entries(xs), ...Object.entries(ys)]) {
      ValueValidation.finite(value, name);
    }
    for (const [name, value] of Object.entries(sizes)) {
      ValueValidation.nonNegative(value, name);
    }
    this.xs = Object.freeze({ ...xs });
    this.ys = Object.freeze({ ...ys });
    this.sizes = Object.freeze({ ...sizes });
  }

  public attributes(): Readonly<Record<string, number>> {
    return Object.freeze({ ...this.xs, ...this.ys, ...this.sizes });
  }

  /** 中立的位置锚点：line 取首端点，其余叶子取自身定位坐标。 */
  public position(): readonly [number, number] | undefined {
    const x = Object.values(this.xs)[0];
    const y = Object.values(this.ys)[0];
    return x === undefined || y === undefined ? undefined : Object.freeze([x, y] as const);
  }

  public value(name: string): number {
    const attributes = this.attributes();
    const value = attributes[name];
    if (!Object.hasOwn(attributes, name) || value === undefined) {
      throw new DomainError(`unknown attribute: ${name}`);
    }
    return value;
  }

  public withAttribute(name: string, value: string | number): Geometry {
    this.value(name);
    const numeric = ValueValidation.number(value, name);
    return new Geometry(
      Object.hasOwn(this.xs, name) ? { ...this.xs, [name]: numeric } : this.xs,
      Object.hasOwn(this.ys, name) ? { ...this.ys, [name]: numeric } : this.ys,
      Object.hasOwn(this.sizes, name) ? { ...this.sizes, [name]: numeric } : this.sizes,
    );
  }

  public transformed(transform: GeometryTransform): Geometry {
    return new Geometry(
      Object.fromEntries(Object.entries(this.xs).map(([name, value]) => [name, transform.x(value)])),
      Object.fromEntries(Object.entries(this.ys).map(([name, value]) => [name, transform.y(value)])),
      Object.fromEntries(Object.entries(this.sizes).map(([name, value]) => [name, transform.size(value)])),
    );
  }
}
