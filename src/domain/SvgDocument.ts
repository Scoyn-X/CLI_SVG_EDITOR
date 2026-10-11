import { DocumentDescription } from './DocumentDescription.js';
import type { Shape } from './Shape.js';
import type { ShapeDescription } from './ShapeDescription.js';
import { ShapeTree } from './ShapeTree.js';
import { ValueValidation } from './ValueValidation.js';

export class SvgDocument {
  private width: number;
  private height: number;
  private tree: ShapeTree;

  public constructor(width: number = 800, height: number = 600, roots: readonly Shape[] = []) {
    this.width = ValueValidation.positive(width, 'canvas width');
    this.height = ValueValidation.positive(height, 'canvas height');
    this.tree = new ShapeTree(roots);
  }

  public getWidth(): number { return this.width; }
  public getHeight(): number { return this.height; }
  public getElementCount(): number { return this.tree.getElementCount(); }
  public getParentId(id: string): string | undefined { return this.tree.getParentId(id); }
  public describeShape(id: string): ShapeDescription { return this.tree.describe(id); }
  public describe(): DocumentDescription { return new DocumentDescription(this.width, this.height, this.tree.describeRoots()); }

  public resize(width: number, height: number): void {
    const nextWidth = ValueValidation.positive(width, 'canvas width');
    const nextHeight = ValueValidation.positive(height, 'canvas height');
    this.width = nextWidth;
    this.height = nextHeight;
  }

  public add(shape: Shape, parentId?: string): void { this.tree.insert(shape, parentId); }
  public remove(id: string): void { this.tree.remove(id); }
  public move(id: string, dx: number, dy: number): void { this.tree.move(id, dx, dy); }
  public scale(id: string, factor: number): void { this.tree.scale(id, factor); }
  public set(id: string, name: string, value: string | number): void { this.tree.set(id, name, value); }

  public clone(): SvgDocument {
    const copy = new SvgDocument(this.width, this.height);
    copy.tree = this.tree.clone();
    return copy;
  }
}
