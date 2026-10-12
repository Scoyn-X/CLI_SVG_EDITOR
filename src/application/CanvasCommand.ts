import { ValueValidation } from '../domain/ValueValidation.js';
import { Command } from './Command.js';
import { CommandResult } from './CommandResult.js';
import type { EditorSession } from './EditorSession.js';

export class CanvasCommand extends Command {
  public constructor(private readonly width?: string | number, private readonly height?: string | number) { super(); }

  public override execute(session: EditorSession): CommandResult {
    const current = session.describe();
    if (this.width === undefined) {
      return new CommandResult(`canvas ${current.getWidth()}x${current.getHeight()}`);
    }
    return session.resize(ValueValidation.number(this.width, 'canvas width'),
      this.height === undefined ? undefined : ValueValidation.number(this.height, 'canvas height'));
  }
}
