import { Command } from './Command.js';
import type { CommandResult } from './CommandResult.js';
import type { EditorSession } from './EditorSession.js';

export class UndoCommand extends Command {
  public override execute(session: EditorSession): CommandResult { return session.undo(); }
}
