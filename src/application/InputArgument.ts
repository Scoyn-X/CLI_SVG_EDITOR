/** 中立的输入值与字面量标记，不依赖终端或解析库。 */
export class InputArgument {
  public constructor(private readonly value: string, private readonly literal = false) { Object.freeze(this); }
  public getValue(): string { return this.value; }
  public isLiteral(): boolean { return this.literal; }
}
