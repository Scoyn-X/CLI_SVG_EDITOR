/** 应用反馈，不含提示符、错误前缀或终端 IO；撤销反馈随历史条目保存。 */
export class CommandResult {
  public constructor(private readonly summary: string, private readonly undoSummary: string = summary) {
    Object.freeze(this);
  }

  public getSummary(): string { return this.summary; }
  public reversed(): CommandResult { return new CommandResult(this.undoSummary, this.summary); }
}
