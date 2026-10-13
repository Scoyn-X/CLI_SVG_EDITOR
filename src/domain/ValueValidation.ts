import { DomainError } from './DomainError.js';

export class ValueValidation {
  public static finite(value: number, name: string): number {
    if (!Number.isFinite(value)) {
      throw new DomainError(`invalid number: ${name}`);
    }
    return value;
  }

  public static nonNegative(value: number, name: string): number {
    this.finite(value, name);
    if (value < 0) {
      throw new DomainError(`${name} must be non-negative`);
    }
    return value;
  }

  public static positive(value: number, name: string): number {
    this.finite(value, name);
    if (value <= 0) {
      throw new DomainError(`${name} must be positive`);
    }
    return value;
  }

  public static number(value: string | number, name: string): number {
    if (typeof value === 'string' && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)) {
      throw new DomainError(`invalid number: ${name}`);
    }
    return this.finite(Number(value), name);
  }

  public static text(value: string, name: string): string {
    for (const character of value) {
      const code = character.codePointAt(0);
      if (code === undefined || !(code === 9 || code === 10 || code === 13
        || (code >= 0x20 && code <= 0xd7ff) || (code >= 0xe000 && code <= 0xfffd)
        || (code >= 0x10000 && code <= 0x10ffff))) {
        throw new DomainError(`invalid XML character: ${name}`);
      }
    }
    return value;
  }

  public static numbers(value: string, name: string): readonly number[] {
    const trimmed = value.trim();
    if (trimmed === '' || /[^\S \t\r\n]/u.test(value) || /^,|,$|,\s*,/.test(trimmed)) { throw new DomainError(`invalid number list: ${name}`); }
    return Object.freeze(trimmed.split(/\s*,\s*|\s+/).map(part => this.number(part, name)));
  }

  public static id(value: string): string {
    this.text(value, 'id');
    if (value.length === 0 || /\s/u.test(value)) {
      throw new DomainError('id must be non-empty and contain no whitespace');
    }
    return value;
  }
}
