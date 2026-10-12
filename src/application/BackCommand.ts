import type { SvgDocument } from '../domain/SvgDocument.js';
import { CommandResult } from './CommandResult.js';
import { EditCommand } from './EditCommand.js';

export class BackCommand extends EditCommand {
  public constructor(private readonly id: string) { super(); }
  protected override apply(document: SvgDocument): CommandResult {
    const shape = document.describeShape(this.id);
    document.back(this.id);
    const label = `${shape.getTag()}#${this.id}`;
    return new CommandResult(`${label} moved to back`, `${label} order restored`);
  }
}
