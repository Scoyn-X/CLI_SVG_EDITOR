/** 不绑定 XML 库的只读元素视图，共享工厂的导入输入。 */
export class SvgElement {
  private readonly attributes: Readonly<Record<string, string>>;
  private readonly children: readonly SvgElement[];
  public constructor(private readonly tag: string, attributes: Readonly<Record<string, string>>, children: readonly SvgElement[] = [], private readonly text = '') {
    this.attributes = Object.freeze({ ...attributes }); this.children = Object.freeze([...children]); Object.freeze(this);
  }
  public getTag(): string { return this.tag; }
  public getAttributes(): Readonly<Record<string, string>> { return this.attributes; }
  public getAttribute(name: string): string | undefined { return Object.hasOwn(this.attributes, name) ? this.attributes[name] : undefined; }
  public getChildren(): readonly SvgElement[] { return this.children; }
  public getText(): string { return this.text; }
}
