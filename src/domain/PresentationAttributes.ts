import { DomainError } from './DomainError.js';
import { ValueValidation } from './ValueValidation.js';

/** 导入时受控保留的 SVG 属性，不扩展 CLI set 白名单。 */
export class PresentationAttributes {
  private readonly values: Readonly<Record<string, string>>;
  public static names(): readonly string[] { return ['transform', 'font-size', 'text-anchor', 'data-kind']; }

  public constructor(values: Readonly<Record<string, string>> = {}) {
    for (const [name, value] of Object.entries(values)) {
      if (!PresentationAttributes.names().includes(name)) { throw new DomainError(`unsupported SVG attribute: ${name}`); }
      ValueValidation.text(value, name);
      if (name === 'transform') { this.validateTransform(value); }
      if (name === 'font-size') { ValueValidation.nonNegative(ValueValidation.number(value.replace(/px$/, ''), name), name); }
      if (name === 'text-anchor' && !['start', 'middle', 'end'].includes(value)) { throw new DomainError('invalid text-anchor'); }
    }
    this.values = Object.freeze({ ...values });
    Object.freeze(this);
  }

  public attributes(): Readonly<Record<string, string>> { return this.values; }

  private validateTransform(value: string): void {
    let end = 0;
    let count = 0;
    for (const match of value.matchAll(/(translate|scale)\s*\(([^()]*)\)/g)) {
      const separator = value.slice(end, match.index);
      if (!(count === 0 ? /^\s*$/.test(separator) : /^\s*(?:,\s*)?$/.test(separator))) { throw new DomainError('unsupported or invalid transform'); }
      const parameters = ValueValidation.numbers(match[2] ?? '', 'transform');
      if (parameters.length < 1 || parameters.length > 2) { throw new DomainError(`invalid transform: ${match[1]}`); }
      end = match.index + match[0].length; count++;
    }
    if (count === 0 || value.slice(end).trim() !== '') { throw new DomainError('unsupported or invalid transform'); }
  }
}
