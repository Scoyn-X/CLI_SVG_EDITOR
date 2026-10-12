import { DomainError } from '../domain/DomainError.js';
import type { InputArgument } from './InputArgument.js';

export class CommandArguments {
  private readonly arguments: readonly InputArgument[];

  public constructor(arguments_: readonly InputArgument[]) { this.arguments = Object.freeze([...arguments_]); }
  public count(): number { return this.arguments.length; }
  public optional(index: number): string | undefined { return this.arguments[index]?.getValue(); }

  public required(index: number): string {
    const value = this.optional(index);
    if (value === undefined) { throw new DomainError('missing command argument'); }
    return value;
  }

  public values(start = 0, end = this.count()): readonly string[] {
    return Object.freeze(this.arguments.slice(start, end).map(argument => argument.getValue()));
  }

  /** 只识别未加引号的末尾 in；字面量正文保持完整。 */
  public creationParent(): string | undefined {
    const marker = this.arguments.at(-2);
    if (this.count() >= 4 && marker?.getValue() === 'in' && !marker.isLiteral()) {
      return this.required(this.count() - 1);
    }
    return undefined;
  }
}
