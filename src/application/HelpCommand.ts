import { Command } from './Command.js';
import { CommandResult } from './CommandResult.js';
import type { EditorSession } from './EditorSession.js';

/** 当前可用命令的帮助；后续命令注册后自动出现在列表中。 */
export class HelpCommand extends Command {
  private readonly usages: readonly string[];
  public constructor(usages: readonly string[]) { super(); this.usages = Object.freeze([...usages]); }
  public override execute(session: EditorSession): CommandResult {
    session.describe();
    return new CommandResult(this.usages.join('\n'));
  }
}
