/** 应用反馈，不含提示符、错误前缀或终端 IO；撤销反馈随历史条目保存。 */
export class CommandResult {
  private readonly warnings: readonly string[];
  public constructor(private readonly summary: string, private readonly undoSummary: string = summary, warnings: readonly string[] = []) {
    this.warnings = Object.freeze([...warnings]);
    Object.freeze(this);
  }

  public getSummary(): string { return this.summary; }
  public getWarnings(): readonly string[] { return this.warnings; }
  public reversed(): CommandResult { return new CommandResult(this.undoSummary, this.summary); }
}
