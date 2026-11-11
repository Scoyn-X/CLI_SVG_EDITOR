import type { ShapeDescription } from '../domain/ShapeDescription.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
import { DomainError } from '../domain/DomainError.js';
import type { AttributeHandler } from '../ports/AttributeHandler.js';
import { CommandResult } from './CommandResult.js';
import { EditCommand } from './EditCommand.js';

export class SetCommand extends EditCommand {
  public constructor(private readonly id: string, private readonly attribute: string, private readonly value: string | number,
    private readonly handlers: readonly AttributeHandler[] = []) { super(); }

  protected override apply(document: SvgDocument): CommandResult {
    const before = document.describeShape(this.id);
    const matches = this.handlers.filter(handler => handler.handles(before, this.attribute));
    if (matches.length > 1) { throw new DomainError(`conflicting attribute handlers: ${this.attribute}`); }
    const handler = matches[0];
    if (handler === undefined) {
      document.set(this.id, this.attribute, this.value);
    } else {
      handler.apply(before, this.attribute, this.value, (id, attribute, value) => document.set(id, attribute, value));
    }
    const after = document.describeShape(this.id);
    const summary = handler?.summarize?.(before, after, this.attribute);
    return new CommandResult(summary?.forward ?? this.summary(after), summary?.reverse ?? this.summary(before));
  }

  private summary(shape: ShapeDescription): string {
    const value = this.attribute === 'text' ? shape.getText() : shape.getAttributes()[this.attribute];
    const display = value === undefined ? '(unset)' : typeof value === 'string' ? JSON.stringify(value) : String(value);
    return `${shape.getTag()}#${this.id} updated: ${this.attribute}=${display}`;
  }
}
