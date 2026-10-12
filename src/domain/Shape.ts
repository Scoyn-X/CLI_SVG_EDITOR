import { GeometryTransform } from './GeometryTransform.js';
import type { OrderedChildren } from './OrderedChildren.js';
import { ShapeAccess } from './ShapeAccess.js';
import type { ShapeChange } from './ShapeChange.js';
import { ShapeDescription } from './ShapeDescription.js';
import { StyleAttributes } from './StyleAttributes.js';
import { ValueValidation } from './ValueValidation.js';

export abstract class Shape {
  private readonly id: string;
  private styles = StyleAttributes.empty();

  protected constructor(id: string, private readonly tag: string) {
    this.id = ValueValidation.id(id);
  }

  public getId(): string { return this.id; }

  public move(dx: number, dy: number): void {
    this.prepareTransform(GeometryTransform.translation(dx, dy)).apply();
  }

  public scale(factor: number): void {
    this.prepareTransform(GeometryTransform.uniformScale(factor)).apply();
  }

  public set(name: string, value: string | number): void {
    if (this.styles.supports(name)) {
      this.styles = this.styles.withAttribute(name, value);
    } else {
      this.setSpecificAttribute(name, value);
    }
  }

  public describe(): ShapeDescription {
    return new ShapeDescription(this.id, this.tag,
      { id: this.id, ...this.geometryAttributes(), ...this.styles.attributes() },
      this[ShapeAccess.children]()?.items().map(child => child.describe()) ?? [], this.textContent(), this.position());
  }

  /** @internal 仅用于领域对象间的两阶段几何修改。 */
  public abstract prepareTransform(transform: GeometryTransform): ShapeChange;
  public abstract clone(): Shape;

  /** @internal 不返回给文档调用者；只用于树索引和容器维护。 */
  public [ShapeAccess.children](): OrderedChildren<Shape> | undefined { return undefined; }

  protected copyStylesTo<T extends Shape>(copy: T): T {
    copy.styles = this.styles;
    return copy;
  }

  protected geometryAttributes(): Readonly<Record<string, number>> { return {}; }
  protected textContent(): string | undefined { return undefined; }
  protected position(): readonly [number, number] | undefined { return undefined; }
  protected abstract setSpecificAttribute(name: string, value: string | number): void;
}
