import { DomainError } from './DomainError.js';
import { OrderedChildren } from './OrderedChildren.js';
import type { Shape } from './Shape.js';
import { ShapeAccess } from './ShapeAccess.js';
import type { ShapeDescription } from './ShapeDescription.js';
import { ShapeTraversal } from './ShapeTraversal.js';

/** 拥有整棵树及其索引；对外只有 id 操作和不可变描述，不泄漏所持图形。 */
export class ShapeTree {
  private readonly roots = new OrderedChildren<Shape>();
  private readonly shapes = new Map<string, Shape>();
  private readonly parents = new Map<string, string | undefined>();

  public constructor(roots: readonly Shape[] = []) {
    new ShapeTraversal(roots).assertValidIds();
    for (const root of roots) {
      this.roots.insert(root.clone());
    }
    new ShapeTraversal(this.roots.items()).assertValidIds();
    this.rebuildIndex();
  }

  public insert(shape: Shape, parentId?: string): void {
    const children = this.container(parentId);
    new ShapeTraversal([shape]).assertValidIds(new Set(this.shapes.keys()));
    const owned = shape.clone();
    new ShapeTraversal([owned]).assertValidIds(new Set(this.shapes.keys()));
    children.insert(owned);
    this.rebuildIndex();
  }

  public remove(id: string): void {
    const shape = this.requireShape(id);
    this.container(this.parents.get(id)).remove(shape);
    this.rebuildIndex();
  }

  public move(id: string, dx: number, dy: number): void { this.requireShape(id).move(dx, dy); }
  public scale(id: string, factor: number): void { this.requireShape(id).scale(factor); }
  public set(id: string, name: string, value: string | number): void { this.requireShape(id).set(name, value); }
  public describe(id: string): ShapeDescription { return this.requireShape(id).describe(); }
  public describeRoots(): readonly ShapeDescription[] { return Object.freeze(this.roots.items().map(shape => shape.describe())); }
  public getElementCount(): number { return this.shapes.size; }

  public getParentId(id: string): string | undefined {
    this.requireShape(id);
    return this.parents.get(id);
  }

  public clone(): ShapeTree { return new ShapeTree(this.roots.items()); }

  private requireShape(id: string): Shape {
    const shape = this.shapes.get(id);
    if (shape === undefined) {
      throw new DomainError(`no such shape: ${id}`);
    }
    return shape;
  }

  private container(parentId: string | undefined): OrderedChildren<Shape> {
    if (parentId === undefined) {
      return this.roots;
    }
    const shape = this.shapes.get(parentId);
    if (shape === undefined) {
      throw new DomainError(`no such container: ${parentId}`);
    }
    const children = shape[ShapeAccess.children]();
    if (children === undefined) {
      throw new DomainError(`not a container: ${parentId}`);
    }
    return children;
  }

  private rebuildIndex(): void {
    this.shapes.clear();
    this.parents.clear();
    new ShapeTraversal(this.roots.items()).visit((shape, parent) => {
      this.shapes.set(shape.getId(), shape);
      this.parents.set(shape.getId(), parent?.getId());
    });
  }
}
