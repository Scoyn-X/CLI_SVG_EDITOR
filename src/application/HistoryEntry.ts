import type { SvgDocument } from '../domain/SvgDocument.js';
import type { CommandResult } from './CommandResult.js';
import { DocumentMemento } from './DocumentMemento.js';

export class HistoryEntry {
  private readonly before: DocumentMemento;
  private readonly after: DocumentMemento;

  public constructor(before: SvgDocument, after: SvgDocument, private readonly result: CommandResult) {
    this.before = new DocumentMemento(before);
    this.after = new DocumentMemento(after);
  }

  public restoreBefore(): SvgDocument { return this.before.restore(); }
  public restoreAfter(): SvgDocument { return this.after.restore(); }
  public forwardResult(): CommandResult { return this.result; }
  public backwardResult(): CommandResult { return this.result.reversed(); }
}
