import { Command } from './Command.js';
import { CommandResult } from './CommandResult.js';
import type { EditorSession } from './EditorSession.js';
import { TreeDisplay } from './TreeDisplay.js';

export class TreeCommand extends Command {
  public constructor(private readonly id?: string) { super(); }
  public override execute(session: EditorSession): CommandResult {
    const document = session.describe();
    const root = this.id === undefined ? undefined : session.describeShape(this.id);
    return new CommandResult('', undefined, [], new TreeDisplay(document, root));
  }
}
