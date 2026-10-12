import type { SvgDocument } from '../domain/SvgDocument.js';
import { CommandResult } from './CommandResult.js';
import { EditCommand } from './EditCommand.js';

export class AddToCommand extends EditCommand {
  public constructor(private readonly parentId: string, private readonly id: string) { super(); }
  protected override apply(document: SvgDocument): CommandResult {
    const shape = document.describeShape(this.id);
    const oldParentId = document.getParentId(this.id);
    const oldParent = oldParentId === undefined ? 'svg' : `${document.describeShape(oldParentId).getTag()}#${oldParentId}`;
    document.addTo(this.parentId, this.id);
    const parent = document.describeShape(this.parentId);
    const label = `${shape.getTag()}#${this.id}`;
    return new CommandResult(`${label} moved into ${parent.getTag()}#${this.parentId}`, `${label} restored into ${oldParent}`);
  }
}
