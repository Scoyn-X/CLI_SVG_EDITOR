/** 脱离可写模型的不可变中立描述，可供通用 SVG 和 CLI 展示读取。 */
export class ShapeDescription {
  private readonly attributes: Readonly<Record<string, string | number>>;
  private readonly children: readonly ShapeDescription[];

  public constructor(
    private readonly id: string,
    private readonly tag: string,
    attributes: Readonly<Record<string, string | number>>,
    children: readonly ShapeDescription[],
    private readonly text: string | undefined,
  ) {
    this.attributes = Object.freeze({ ...attributes });
    this.children = Object.freeze([...children]);
    Object.freeze(this);
  }

  public getId(): string { return this.id; }
  public getTag(): string { return this.tag; }
  public getAttributes(): Readonly<Record<string, string | number>> { return this.attributes; }
  public getChildren(): readonly ShapeDescription[] { return this.children; }
  public getText(): string | undefined { return this.text; }
}
