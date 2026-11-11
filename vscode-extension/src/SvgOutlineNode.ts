export class SvgOutlineNode {
  private readonly children: SvgOutlineNode[] = [];
  private endOffset: number;

  public constructor(
    public readonly tag: string,
    public readonly id: string | undefined,
    public readonly startOffset: number,
  ) {
    this.endOffset = startOffset + 1 + tag.length;
  }

  public get label(): string {
    return this.id ? `${this.tag}#${this.id}` : this.tag;
  }

  public get end(): number {
    return this.endOffset;
  }

  public get elements(): readonly SvgOutlineNode[] {
    return this.children;
  }

  public addChild(child: SvgOutlineNode): void {
    this.children.push(child);
  }

  public close(endOffset: number): void {
    this.endOffset = endOffset;
  }
}
