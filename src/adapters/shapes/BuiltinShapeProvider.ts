import { DomainError } from '../../domain/DomainError.js';
import type { Shape } from '../../domain/Shape.js';
import { ValueValidation } from '../../domain/ValueValidation.js';
import type { ShapeProvider } from '../../ports/ShapeProvider.js';

export abstract class BuiltinShapeProvider implements ShapeProvider {
  protected constructor(private readonly type: string, private readonly count: number, private readonly style?: string) {}

  public getType(): string { return this.type; }

  public create(id: string, parameters: readonly string[]): Shape {
    if (parameters.length < this.count || parameters.length > this.count + (this.style === undefined ? 0 : 1)) {
      throw new DomainError(`invalid parameters for ${this.type}`);
    }
    const shape = this.build(id, parameters);
    const style = parameters[this.count];
    if (this.style !== undefined && style !== undefined) { shape.set(this.style, style); }
    return shape;
  }

  protected parameter(parameters: readonly string[], index: number): string {
    const value = parameters[index];
    if (value === undefined) { throw new DomainError(`missing parameter for ${this.type}`); }
    return value;
  }

  protected number(parameters: readonly string[], index: number, name: string): number {
    return ValueValidation.number(this.parameter(parameters, index), name);
  }

  protected abstract build(id: string, parameters: readonly string[]): Shape;
}
