import { DomainError } from './DomainError.js';
import type { Shape } from './Shape.js';
import { ShapeAccess } from './ShapeAccess.js';

export class ShapeTraversal {
  public constructor(private readonly roots: readonly Shape[]) {}

  public visit(visitor: (shape: Shape, parent: Shape | undefined) => void): void {
    const active = new Set<Shape>();
    const seen = new Set<Shape>();
    for (const shape of this.roots) {
      this.visitNode(shape, undefined, visitor, active, seen);
    }
  }

  public assertValidIds(existing: ReadonlySet<string> = new Set()): void {
    const ids = new Set(existing);
    this.visit(shape => {
      if (ids.has(shape.getId())) {
        throw new DomainError(`id already exists: ${shape.getId()}`);
      }
      ids.add(shape.getId());
    });
  }

  private visitNode(shape: Shape, parent: Shape | undefined, visitor: (shape: Shape, parent: Shape | undefined) => void,
    active: Set<Shape>, seen: Set<Shape>): void {
    if (active.has(shape)) {
      throw new DomainError(`cyclic shape tree: ${shape.getId()}`);
    }
    if (seen.has(shape)) {
      throw new DomainError(`id already exists: ${shape.getId()}`);
    }
    active.add(shape);
    seen.add(shape);
    visitor(shape, parent);
    for (const child of shape[ShapeAccess.children]()?.items() ?? []) {
      this.visitNode(child, shape, visitor, active, seen);
    }
    active.delete(shape);
  }
}
