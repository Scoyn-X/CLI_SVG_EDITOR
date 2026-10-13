import type { CommandDispatcher } from '../../application/CommandDispatcher.js';
import type { EditorSession } from '../../application/EditorSession.js';
import { DomainError } from '../../domain/DomainError.js';
import { Tokenizer } from './Tokenizer.js';
import { CliPresenter } from './CliPresenter.js';

export class CliController {
  private readonly tokenizer = new Tokenizer();

  public constructor(private readonly dispatcher: CommandDispatcher, private readonly session: EditorSession, private readonly presenter = new CliPresenter()) {}

  public executeLine(line: string): readonly string[] {
    try {
      const tokens = this.tokenizer.tokenize(line);
      const name = tokens[0];
      if (name === undefined) { return []; }
      const command = this.dispatcher.create(name.getValue(), tokens.slice(1));
      const result = command.execute(this.session);
      return [...result.getWarnings().map(warning => `warning: ${warning}`), ...result.render(this.presenter)];
    } catch (error) {
      if (!(error instanceof DomainError)) { throw error; }
      return [`error: ${error.message.replace(/[\r\n]+/g, ' ')}`];
    }
  }
}
