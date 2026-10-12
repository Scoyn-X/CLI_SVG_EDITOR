import type { SvgDocument } from '../domain/SvgDocument.js';
import { Command } from './Command.js';
import type { CommandResult } from './CommandResult.js';
import type { EditorSession } from './EditorSession.js';

export abstract class EditCommand extends Command {
  public override execute(session: EditorSession): CommandResult {
    return session.edit(candidate => this.apply(candidate));
  }

  protected abstract apply(document: SvgDocument): CommandResult;
}
