import { DomainError } from './DomainError.js';
import { Geometry } from './Geometry.js';
import { LeafShape } from './LeafShape.js';
import { ValueValidation } from './ValueValidation.js';

export class Text extends LeafShape {
  private text: string;

  public constructor(id: string, x: number, y: number, text: string) {
    super(id, 'text', new Geometry({ x }, { y }));
    this.text = ValueValidation.text(text, 'text');
  }

  public override clone(): Text {
    return this.copyStylesTo(new Text(this.getId(), this.geometryValue('x'), this.geometryValue('y'), this.text));
  }

  protected override textContent(): string { return this.text; }

  protected override setSpecificAttribute(name: string, value: string | number): void {
    if (name === 'text') {
      if (typeof value !== 'string') {
        throw new DomainError('invalid value: text');
      }
      this.text = ValueValidation.text(value, name);
    } else {
      super.setSpecificAttribute(name, value);
    }
  }
}
