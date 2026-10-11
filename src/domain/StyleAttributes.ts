import { DomainError } from './DomainError.js';
import { ValueValidation } from './ValueValidation.js';

export class StyleAttributes {
  private readonly values: Readonly<Record<string, string | number>>;

  private constructor(values: Readonly<Record<string, string | number>>) {
    this.values = Object.freeze({ ...values });
  }

  public static empty(): StyleAttributes { return new StyleAttributes({}); }

  public supports(name: string): boolean {
    return name === 'fill' || name === 'stroke' || name === 'stroke-width';
  }

  public attributes(): Readonly<Record<string, string | number>> {
    return this.values;
  }

  public withAttribute(name: string, value: string | number): StyleAttributes {
    if (!this.supports(name)) {
      throw new DomainError(`unknown attribute: ${name}`);
    }
    let validated: string | number;
    if (name === 'stroke-width') {
      validated = ValueValidation.nonNegative(ValueValidation.number(value, name), name);
    } else {
      if (typeof value !== 'string') {
        throw new DomainError(`invalid value: ${name}`);
      }
      validated = ValueValidation.text(value, name);
    }
    return new StyleAttributes({ ...this.values, [name]: validated });
  }
}
