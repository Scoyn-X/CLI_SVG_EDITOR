import type { ShapeDescription } from '../domain/ShapeDescription.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
import { CommandResult } from './CommandResult.js';
import { EditCommand } from './EditCommand.js';

export class SetCommand extends EditCommand {
  public constructor(private readonly id: string, private readonly attribute: string, private readonly value: string | number) { super(); }

  protected override apply(document: SvgDocument): CommandResult {
    const before = document.describeShape(this.id);
    document.set(this.id, this.attribute, this.value);
    return new CommandResult(this.summary(document.describeShape(this.id)), this.summary(before));
  }

  private summary(shape: ShapeDescription): string {
    const value = this.attribute === 'text' ? shape.getText() : shape.getAttributes()[this.attribute];
    const display = value === undefined ? '(unset)' : typeof value === 'string' ? JSON.stringify(value) : String(value);
    return `${shape.getTag()}#${this.id} updated: ${this.attribute}=${display}`;
  }
}
