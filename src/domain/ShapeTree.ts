import { DomainError } from './DomainError.js';
import { Group } from './Group.js';
import { OrderedChildren } from './OrderedChildren.js';
import type { Shape } from './Shape.js';
import { ShapeAccess } from './ShapeAccess.js';
import type { ShapeDescription } from './ShapeDescription.js';
import { ShapeTraversal } from './ShapeTraversal.js';
import { ValueValidation } from './ValueValidation.js';

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

  public group(newId: string, ids: readonly string[]): void {
    ValueValidation.id(newId);
    if (this.shapes.has(newId)) { throw new DomainError(`id already exists: ${newId}`); }
    if (ids.length === 0) { throw new DomainError('group requires at least one shape'); }
    const selected = new Set<string>();
    for (const id of ids) {
      if (selected.has(id)) { throw new DomainError(`duplicate group target: ${id}`); }
      this.requireShape(id);
      selected.add(id);
    }
    for (const id of ids) {
      for (const ancestor of this.parentChain(id)) {
        if (ancestor !== undefined && selected.has(ancestor)) {
          throw new DomainError(`cannot group a container into its own descendant: ${ancestor}`);
        }
      }
    }

    const ordered: Shape[] = [];
    new ShapeTraversal(this.roots.items()).visit(shape => {
      if (selected.has(shape.getId())) { ordered.push(shape); }
    });
    const parentId = this.commonParent(ids);
    const siblings = this.container(parentId);
    const branches = new Set(ids.map(id => this.branchBelow(parentId, id)));
    const position = siblings.items().findIndex(shape => branches.has(shape.getId()));
    if (position < 0) { throw new DomainError('invalid group insertion position'); }
    // 构造/复制完整新组必须发生在摘除任何旧节点之前。
    const group = new Group(newId, ordered);
    const replacedIds = new Set<string>();
    new ShapeTraversal(ordered).visit(shape => { replacedIds.add(shape.getId()); });
    new ShapeTraversal([group]).assertValidIds(new Set([...this.shapes.keys()].filter(id => !replacedIds.has(id))));
    for (const shape of ordered) { this.container(this.parents.get(shape.getId())).remove(shape); }
    siblings.insert(group, position);
    this.rebuildIndex();
  }

  public ungroup(id: string): void {
    const shape = this.requireShape(id);
    const children = shape[ShapeAccess.children]();
    if (children === undefined) { throw new DomainError(`not a container: ${id}`); }
    if (!shape.canUngroup()) { throw new DomainError(`cannot ungroup composite shape: ${id}`); }
    const parentId = this.parents.get(id);
    if (parentId === undefined) { throw new DomainError(`cannot ungroup top-level container: ${id}`); }
    this.container(parentId).replace(shape, children.items());
    this.rebuildIndex();
  }

  public addTo(parentId: string, id: string): void {
    const shape = this.requireShape(id);
    const target = this.container(parentId);
    if (parentId === id || this.parentChain(parentId).includes(id)) {
      throw new DomainError(`cannot add a shape into itself or its descendant: ${id}`);
    }
    this.container(this.parents.get(id)).remove(shape);
    target.insert(shape);
    this.rebuildIndex();
  }

  public front(id: string): void { this.reorder(id, true); }
  public back(id: string): void { this.reorder(id, false); }

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

  private reorder(id: string, front: boolean): void {
    const shape = this.requireShape(id);
    const siblings = this.container(this.parents.get(id));
    siblings.remove(shape);
    siblings.insert(shape, front ? siblings.items().length : 0);
    // 同级顺序变化没有改动对象身份和父级，现有两个索引仍然有效。
  }

  private parentChain(id: string): readonly (string | undefined)[] {
    const chain: (string | undefined)[] = [];
    let parentId = this.parents.get(id);
    while (parentId !== undefined) {
      chain.push(parentId);
      parentId = this.parents.get(parentId);
    }
    chain.push(undefined); // svg 根以 undefined 表示，不占用字符串 id。
    return chain;
  }

  private commonParent(ids: readonly string[]): string | undefined {
    const paths = ids.map(id => this.parentChain(id));
    return paths[0]?.find(candidate => paths.every(path => path.includes(candidate)));
  }

  private branchBelow(parentId: string | undefined, id: string): string {
    let branch = id;
    while (this.parents.get(branch) !== parentId) {
      const parent = this.parents.get(branch);
      if (parent === undefined) { throw new DomainError('invalid group ancestor'); }
      branch = parent;
    }
    return branch;
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
