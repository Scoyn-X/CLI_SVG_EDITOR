import { DomainError } from './DomainError.js';
import type { GeometryTransform } from './GeometryTransform.js';
import { OrderedChildren } from './OrderedChildren.js';
import { Shape } from './Shape.js';
import { ShapeAccess } from './ShapeAccess.js';
import { ShapeChange } from './ShapeChange.js';
import { ShapeTraversal } from './ShapeTraversal.js';

export class Group extends Shape {
  private readonly children = new OrderedChildren<Shape>();

  public constructor(id: string, children: readonly Shape[] = []) {
    super(id, 'g');
    new ShapeTraversal(children).assertValidIds(new Set([id]));
    for (const child of children) {
      this.children.insert(child.clone());
    }
  }

  public override [ShapeAccess.children](): OrderedChildren<Shape> { return this.children; }
  public override canUngroup(): boolean { return true; }

  public override prepareTransform(transform: GeometryTransform): ShapeChange {
    return ShapeChange.combine(this.children.items().map(child => child.prepareTransform(transform)));
  }

  public override clone(): Group {
    return this.copyStylesTo(this.createCopy(this.children.items()));
  }

  /** A composite subtype supplies its own constructor and consumes the current children. */
  protected createCopy(children: readonly Shape[]): Group {
    const copy = new Group(this.getId());
    for (const child of children) { copy.children.insert(child.clone()); }
    return copy;
  }

  protected override setSpecificAttribute(name: string): void {
    throw new DomainError(`unknown attribute: ${name}`);
  }
}
