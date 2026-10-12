export class HistoryStatus {
  public constructor(private readonly undoCount: number, private readonly redoCount: number, private readonly blocked: boolean) {
    Object.freeze(this);
  }

  public getUndoCount(): number { return this.undoCount; }
  public getRedoCount(): number { return this.redoCount; }
  public isBlocked(): boolean { return this.blocked; }
}
