import { Command } from '../../application/Command.js';
import { CommandResult } from '../../application/CommandResult.js';
import { DomainError } from '../../domain/DomainError.js';
import type { DirectoryReader } from './DirectoryReader.js';

export class DirCommand extends Command {
  private static readonly order = ['directory', 'file', 'other'] as const;
  private static readonly labels = { directory: '[DIR]', file: '[FILE]', other: '[OTHER]' } as const;

  public constructor(private readonly reader: DirectoryReader) { super(); }

  public override execute(): CommandResult {
    let path = '.';
    try {
      path = this.reader.currentDirectory();
      const entries = this.reader.read(path).filter(entry => entry.name !== '.' && entry.name !== '..');
      entries.sort((a, b) => DirCommand.order.indexOf(a.type) - DirCommand.order.indexOf(b.type)
        || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
      const lines = entries.map(entry => `${DirCommand.labels[entry.type]}  ${entry.name.replace(/[\r\n]/g, character => JSON.stringify(character).slice(1, -1))}`);
      return new CommandResult(lines.length === 0 ? '(empty directory)' : lines.join('\n'));
    } catch {
      throw new DomainError(`cannot read directory: ${path}`);
    }
  }
}
