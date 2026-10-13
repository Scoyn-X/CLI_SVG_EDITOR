import type { DocumentDescription } from '../domain/DocumentDescription.js';
import { DomainError } from '../domain/DomainError.js';
import type { ShapeDescription } from '../domain/ShapeDescription.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
import { ValueValidation } from '../domain/ValueValidation.js';
import { CommandResult } from './CommandResult.js';
import { HistoryEntry } from './HistoryEntry.js';
import { HistoryManager } from './HistoryManager.js';
import type { HistoryStatus } from './HistoryStatus.js';
import type { ImportedDocument } from '../ports/ImportedDocument.js';

export class EditorSession {
  private document: SvgDocument | undefined;
  private sourcePath: string | undefined;
  private readonly history = new HistoryManager();
  private executing = false;

  public describe(): DocumentDescription { return this.requireDocument().describe(); }
  public describeShape(id: string): ShapeDescription { return this.requireDocument().describeShape(id); }
  public getParentId(id: string): string | undefined { return this.requireDocument().getParentId(id); }
  public getSourcePath(): string | undefined { return this.sourcePath; }
  public getHistoryStatus(): HistoryStatus { return this.history.status(); }

  public readDocument(load: () => ImportedDocument, sourcePath: string, feedback: (loaded: ImportedDocument) => CommandResult): CommandResult {
    return this.exclusive(() => {
      ValueValidation.text(sourcePath, 'source path');
      if (sourcePath.length === 0) { throw new DomainError('source path must be non-empty'); }
      const loaded = load(); const owned = loaded.getDocument(); const result = feedback(loaded);
      this.history.establishBarrier(); this.document = owned; this.sourcePath = sourcePath;
      return result;
    });
  }

  public saveDocument(write: (document: DocumentDescription, sourcePath: string | undefined) => CommandResult): CommandResult {
    return this.exclusive(() => {
      const result = write(this.requireDocument().describe(), this.sourcePath);
      this.history.establishBarrier(); return result;
    });
  }

  public edit(action: (candidate: SvgDocument) => CommandResult): CommandResult {
    return this.exclusive(() => {
      const before = this.requireDocument();
      const candidate = before.clone();
      const result = action(candidate);
      // 命令可能保留 candidate 引用，因此发布时再次复制，不持有外部可写对象。
      const after = candidate.clone();
      const entry = new HistoryEntry(before, after, result);
      this.history.record(entry);
      this.document = after;
      return result;
    });
  }

  /** init/read 的发布边界；read 的 IO/解析必须在调用前成功完成。 */
  public replaceDocument(document: SvgDocument, sourcePath?: string): void {
    this.exclusive(() => {
      if (sourcePath !== undefined) {
        ValueValidation.text(sourcePath, 'source path');
        if (sourcePath.length === 0) { throw new DomainError('source path must be non-empty'); }
      }
      const owned = document.clone();
      this.history.establishBarrier();
      this.document = owned;
      this.sourcePath = sourcePath;
    });
  }

  public resize(width: number, height?: number): CommandResult {
    return this.exclusive(() => {
      const candidate = this.requireDocument().clone();
      candidate.resize(width, height ?? candidate.getHeight());
      const result = new CommandResult(`canvas ${candidate.getWidth()}x${candidate.getHeight()}`);
      this.history.establishBarrier();
      this.document = candidate;
      return result;
    });
  }

  /** save 的成功发布边界；本阶段没有文件写入，阶段 6 在写入成功后调用。 */
  public establishIoBarrier(): void {
    this.exclusive(() => {
      this.requireDocument();
      this.history.establishBarrier();
    });
  }

  public undo(): CommandResult {
    return this.exclusive(() => {
      this.requireDocument();
      const entry = this.history.peekUndo();
      const restored = entry.restoreBefore();
      const result = entry.backwardResult();
      this.history.acceptUndo(entry);
      this.document = restored;
      return result;
    });
  }

  public redo(): CommandResult {
    return this.exclusive(() => {
      this.requireDocument();
      const entry = this.history.peekRedo();
      const restored = entry.restoreAfter();
      const result = entry.forwardResult();
      this.history.acceptRedo(entry);
      this.document = restored;
      return result;
    });
  }

  private requireDocument(): SvgDocument {
    if (this.document === undefined) { throw new DomainError("no document. use 'init' or 'read' first"); }
    return this.document;
  }

  private exclusive<T>(action: () => T): T {
    if (this.executing) { throw new DomainError('command already in progress'); }
    this.executing = true;
    try { return action(); } finally { this.executing = false; }
  }
}
