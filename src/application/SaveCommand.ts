import { DomainError } from '../domain/DomainError.js';
import type { DocumentStorage } from '../ports/DocumentStorage.js';
import type { SvgCodec } from '../ports/SvgCodec.js';
import { Command } from './Command.js';
import { CommandResult } from './CommandResult.js';
import type { EditorSession } from './EditorSession.js';

export class SaveCommand extends Command {
  public constructor(private readonly storage: DocumentStorage, private readonly codec: SvgCodec, private readonly file?: string) { super(); }
  public override execute(session: EditorSession): CommandResult {
    return session.saveDocument((document, sourcePath) => {
      const file = this.file ?? sourcePath;
      if (file === undefined) { throw new DomainError('no source path. specify a file'); }
      let path: string;
      try { path = this.storage.resolve(file); } catch { throw new DomainError(`cannot write file: ${file}`); }
      const xml = this.codec.encode(document);
      const result = new CommandResult(`saved to ${file} (${document.getElementCount()} elements)`);
      try { this.storage.write(path, xml); } catch { throw new DomainError(`cannot write file: ${file}`); }
      return result;
    });
  }
}
