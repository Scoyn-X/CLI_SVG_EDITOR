import type { SvgDocument } from '../domain/SvgDocument.js';
import { ValueValidation } from '../domain/ValueValidation.js';
import { CommandResult } from './CommandResult.js';
import { EditCommand } from './EditCommand.js';

export class ScaleCommand extends EditCommand {
  public constructor(private readonly id: string, private readonly factor: string | number) { super(); }

  protected override apply(document: SvgDocument): CommandResult {
    document.scale(this.id, ValueValidation.number(this.factor, 'scale factor'));
    const shape = document.describeShape(this.id);
    const label = `${shape.getTag()}#${this.id}`;
    return new CommandResult(`${label} scaled by ${this.factor}`, `${label} scaling undone`);
  }
}
