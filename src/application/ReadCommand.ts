import { DomainError } from '../domain/DomainError.js';
import type { DocumentStorage } from '../ports/DocumentStorage.js';
import type { SvgCodec } from '../ports/SvgCodec.js';
import { Command } from './Command.js';
import { CommandResult } from './CommandResult.js';
import type { EditorSession } from './EditorSession.js';

export class ReadCommand extends Command {
  public constructor(private readonly file: string, private readonly storage: DocumentStorage, private readonly codec: SvgCodec) { super(); }
  public override execute(session: EditorSession): CommandResult {
    return session.readDocument(path => {
      let xml: string;
      try { xml = this.storage.read(path); } catch { throw new DomainError(`cannot read file: ${this.file}`); }
      return this.codec.decode(xml);
    }, () => {
      try { return this.storage.resolve(this.file); } catch { throw new DomainError(`cannot read file: ${this.file}`); }
    }, loaded => new CommandResult(`read ${this.file} (${loaded.getElementCount()} elements)`, undefined,
      loaded.getAssignments().map(assignment => `assigned id ${assignment.getId()} to unnamed <${assignment.getTag()}>`)));
  }
}
