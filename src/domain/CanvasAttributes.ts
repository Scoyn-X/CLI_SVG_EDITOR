import { DomainError } from './DomainError.js';
import { PresentationAttributes } from './PresentationAttributes.js';
import { ValueValidation } from './ValueValidation.js';

export class CanvasAttributes {
  private readonly values: Readonly<Record<string, string>>;
  public constructor(values: Readonly<Record<string, string>> = {}) {
    const allowed = ['viewBox', 'preserveAspectRatio', 'fill', 'stroke', 'stroke-width', 'transform', 'font-size', 'text-anchor'];
    for (const [name, value] of Object.entries(values)) {
      if (!allowed.includes(name)) { throw new DomainError(`unsupported SVG attribute: svg.${name}`); }
      ValueValidation.text(value, name);
      if (name === 'viewBox') {
        const parts = ValueValidation.numbers(value, name);
        if (parts.length !== 4) { throw new DomainError('invalid viewBox'); }
        ValueValidation.positive(parts[2] ?? 0, 'viewBox width');
        ValueValidation.positive(parts[3] ?? 0, 'viewBox height');
      }
      if (name === 'preserveAspectRatio' && !/^(?:none|x(?:Min|Mid|Max)Y(?:Min|Mid|Max)(?: (?:meet|slice))?)$/.test(value)) {
        throw new DomainError('invalid preserveAspectRatio');
      }
      if (name === 'stroke-width') { ValueValidation.nonNegative(ValueValidation.number(value, name), name); }
      if (PresentationAttributes.names().includes(name)) { new PresentationAttributes({ [name]: value }); }
    }
    this.values = Object.freeze({ ...values });
    Object.freeze(this);
  }
  public attributes(): Readonly<Record<string, string>> { return this.values; }
  public forCanvas(width: number, height: number): CanvasAttributes {
    const parts = this.values['viewBox']?.trim().split(/[\s,]+/).map(Number);
    if (parts?.[0] === 0 && parts[1] === 0 && parts[2] === width && parts[3] === height) {
      const values = { ...this.values }; delete values['viewBox']; return new CanvasAttributes(values);
    }
    return this;
  }
}
