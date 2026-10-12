import { DomainError } from '../domain/DomainError.js';
import type { HistoryEntry } from './HistoryEntry.js';
import { HistoryStatus } from './HistoryStatus.js';

/** 先取待恢复条目，恢复副本准备成功后才移动两栈；屏障不是空栈的别名。 */
export class HistoryManager {
  private past: readonly HistoryEntry[] = [];
  private future: readonly HistoryEntry[] = [];
  private blocked = false;

  public status(): HistoryStatus { return new HistoryStatus(this.past.length, this.future.length, this.blocked); }

  public record(entry: HistoryEntry): void {
    const past = [...this.past, entry];
    this.past = past;
    this.future = [];
    this.blocked = false;
  }

  public establishBarrier(): void {
    this.past = [];
    this.future = [];
    this.blocked = true;
  }

  public peekUndo(): HistoryEntry { return this.peek(this.past, 'undo'); }
  public peekRedo(): HistoryEntry { return this.peek(this.future, 'redo'); }

  public acceptUndo(entry: HistoryEntry): void {
    if (this.peekUndo() !== entry) { throw new DomainError('history changed during undo'); }
    const past = this.past.slice(0, -1);
    const future = [...this.future, entry];
    this.past = past;
    this.future = future;
  }

  public acceptRedo(entry: HistoryEntry): void {
    if (this.peekRedo() !== entry) { throw new DomainError('history changed during redo'); }
    const past = [...this.past, entry];
    const future = this.future.slice(0, -1);
    this.past = past;
    this.future = future;
  }

  private peek(entries: readonly HistoryEntry[], operation: string): HistoryEntry {
    if (this.blocked) { throw new DomainError('undo not allowed after io command'); }
    const entry = entries.at(-1);
    if (entry === undefined) { throw new DomainError(`nothing to ${operation}`); }
    return entry;
  }
}
