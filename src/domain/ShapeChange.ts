/** 整棵子树先生成已验证的修改，再一次应用；校验期间不改变原对象。 */
export class ShapeChange {
  private readonly applyChange: () => void;

  public constructor(applyChange: () => void) {
    this.applyChange = applyChange;
  }

  public static combine(changes: readonly ShapeChange[]): ShapeChange {
    return new ShapeChange(() => {
      for (const change of changes) {
        change.apply();
      }
    });
  }

  public apply(): void {
    this.applyChange();
  }
}
