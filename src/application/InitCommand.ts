import { SvgDocument } from '../domain/SvgDocument.js';
import { ValueValidation } from '../domain/ValueValidation.js';
import { Command } from './Command.js';
import { CommandResult } from './CommandResult.js';
import type { EditorSession } from './EditorSession.js';

export class InitCommand extends Command {
  public constructor(private readonly width: string | number = 800, private readonly height: string | number = 600) { super(); }

  public override execute(session: EditorSession): CommandResult {
    const document = new SvgDocument(ValueValidation.number(this.width, 'canvas width'), ValueValidation.number(this.height, 'canvas height'));
    const result = new CommandResult(`canvas ${document.getWidth()}x${document.getHeight()} created`);
    session.replaceDocument(document);
    return result;
  }
}
