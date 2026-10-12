import type { CommandResult } from './CommandResult.js';
import type { EditorSession } from './EditorSession.js';

export abstract class Command {
  public abstract execute(session: EditorSession): CommandResult;
}
