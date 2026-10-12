import type { SvgDocument } from '../domain/SvgDocument.js';
import { CommandResult } from './CommandResult.js';
import { EditCommand } from './EditCommand.js';

export class GroupCommand extends EditCommand {
  private readonly ids: readonly string[];
  public constructor(private readonly newId: string, ids: readonly string[]) { super(); this.ids = Object.freeze([...ids]); }

  protected override apply(document: SvgDocument): CommandResult {
    document.group(this.newId, this.ids);
    const shape = document.describeShape(this.newId);
    return new CommandResult(`${shape.getTag()}#${this.newId} created with ${shape.getChildren().length} children`,
      `${shape.getTag()}#${this.newId} grouping undone`);
  }
}
