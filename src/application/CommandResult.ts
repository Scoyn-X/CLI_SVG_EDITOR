import type { CommandDisplay } from './CommandDisplay.js';
import type { CommandFormatter } from './CommandFormatter.js';

/** 应用反馈，不含提示符、错误前缀或终端 IO；撤销反馈随历史条目保存。 */
export class CommandResult {
  private readonly warnings: readonly string[];
  public constructor(private readonly summary: string, private readonly undoSummary: string = summary, warnings: readonly string[] = [], private readonly display?: CommandDisplay) {
    this.warnings = Object.freeze([...warnings]);
    Object.freeze(this);
  }

  public getSummary(): string { return this.summary; }
  public getWarnings(): readonly string[] { return this.warnings; }
  public render(formatter: CommandFormatter): readonly string[] { return this.display?.render(formatter) ?? [this.summary]; }
  public reversed(): CommandResult { return new CommandResult(this.undoSummary, this.summary); }
}
