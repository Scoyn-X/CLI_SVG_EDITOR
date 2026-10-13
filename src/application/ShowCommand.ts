import { Command } from './Command.js';
import { CommandResult } from './CommandResult.js';
import type { EditorSession } from './EditorSession.js';
import { ShapeDisplay } from './ShapeDisplay.js';

export class ShowCommand extends Command {
  public constructor(private readonly id: string) { super(); }
  public override execute(session: EditorSession): CommandResult {
    const shape = session.describeShape(this.id); const parentId = session.getParentId(this.id);
    const parent = parentId === undefined ? 'svg' : `${session.describeShape(parentId).getTag()}#${parentId}`;
    return new CommandResult('', undefined, [], new ShapeDisplay(shape, parent));
  }
}
