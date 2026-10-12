import type { SvgDocument } from '../domain/SvgDocument.js';
import { CommandResult } from './CommandResult.js';
import { EditCommand } from './EditCommand.js';

export class DeleteCommand extends EditCommand {
  public constructor(private readonly id: string) { super(); }
  protected override apply(document: SvgDocument): CommandResult {
    const shape = document.describeShape(this.id);
    const parentId = document.getParentId(this.id);
    const parent = parentId === undefined ? 'svg' : `${document.describeShape(parentId).getTag()}#${parentId}`;
    document.remove(this.id);
    const label = `${shape.getTag()}#${this.id}`;
    return new CommandResult(`${label} deleted`, `${label} restored into ${parent}`);
  }
}
