import type { SvgDocument } from '../domain/SvgDocument.js';
import { CommandResult } from './CommandResult.js';
import { EditCommand } from './EditCommand.js';

export class GroupCommand extends EditCommand {
  private readonly ids: readonly string[];
  public constructor(private readonly newId: string, ids: readonly string[]) { super(); this.ids = Object.freeze([...ids]); }

  protected override apply(document: SvgDocument): CommandResult {
    document.group(this.newId, this.ids);
    const shape = document.describeShape(this.newId);
    const count = shape.getChildren().length;
    return new CommandResult(`${shape.getTag()}#${this.newId} created with ${count} ${count === 1 ? 'child' : 'children'}`,
      `${shape.getTag()}#${this.newId} grouping undone`);
  }
}
