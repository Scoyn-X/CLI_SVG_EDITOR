/** 领域内部协作键，不是供 CLI/适配器使用的结构编辑接口。 */
export class ShapeAccess {
  public static readonly children = Symbol('domain-owned-children');
}
