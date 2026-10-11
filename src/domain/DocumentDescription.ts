import type { ShapeDescription } from './ShapeDescription.js';

export class DocumentDescription {
  private readonly roots: readonly ShapeDescription[];

  public constructor(private readonly width: number, private readonly height: number, roots: readonly ShapeDescription[]) {
    this.roots = Object.freeze([...roots]);
    Object.freeze(this);
  }

  public getWidth(): number { return this.width; }
  public getHeight(): number { return this.height; }
  public getRoots(): readonly ShapeDescription[] { return this.roots; }
}
