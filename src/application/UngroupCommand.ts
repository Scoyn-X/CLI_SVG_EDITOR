import type { SvgDocument } from '../domain/SvgDocument.js';
import { CommandResult } from './CommandResult.js';
import { EditCommand } from './EditCommand.js';

export class UngroupCommand extends EditCommand {
  public constructor(private readonly id: string) { super(); }
  protected override apply(document: SvgDocument): CommandResult {
    const shape = document.describeShape(this.id);
    document.ungroup(this.id);
    return new CommandResult(`${shape.getTag()}#${this.id} ungrouped`, `${shape.getTag()}#${this.id} grouping restored`);
  }
}
