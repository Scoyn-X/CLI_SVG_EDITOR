import { DomainError } from './DomainError.js';
import { ValueValidation } from './ValueValidation.js';

export class GeometryTransform {
  private constructor(
    private readonly factor: number,
    private readonly dx: number,
    private readonly dy: number,
  ) {}

  public static translation(dx: number, dy: number): GeometryTransform {
    return new GeometryTransform(1, ValueValidation.finite(dx, 'dx'), ValueValidation.finite(dy, 'dy'));
  }

  public static uniformScale(factor: number): GeometryTransform {
    ValueValidation.finite(factor, 'factor');
    if (factor <= 0) {
      throw new DomainError('scale factor must be positive');
    }
    return new GeometryTransform(factor, 0, 0);
  }

  public x(value: number): number {
    return value * this.factor + this.dx;
  }

  public y(value: number): number {
    return value * this.factor + this.dy;
  }

  public size(value: number): number {
    return value * this.factor;
  }
}
