import type { ShapeDescription } from './ShapeDescription.js';
import { CanvasAttributes } from './CanvasAttributes.js';

export class DocumentDescription {
  private readonly roots: readonly ShapeDescription[];

  public constructor(private readonly width: number, private readonly height: number, roots: readonly ShapeDescription[],
    private readonly canvasAttributes: CanvasAttributes = new CanvasAttributes()) {
    this.roots = Object.freeze([...roots]);
    Object.freeze(this);
  }

  public getWidth(): number { return this.width; }
  public getHeight(): number { return this.height; }
  public getRoots(): readonly ShapeDescription[] { return this.roots; }
  public getCanvasAttributes(): Readonly<Record<string, string>> { return this.canvasAttributes.attributes(); }
  public getElementCount(): number { return this.count(this.roots); }
  private count(shapes: readonly ShapeDescription[]): number {
    return shapes.reduce((total, shape) => total + 1 + this.count(shape.getChildren()), 0);
  }
}
