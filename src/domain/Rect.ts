import { Geometry } from './Geometry.js';
import { LeafShape } from './LeafShape.js';

export class Rect extends LeafShape {
  public constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id, 'rect', new Geometry({ x }, { y }, { width, height }));
  }

  public override clone(): Rect {
    return this.copyStylesTo(new Rect(this.getId(), this.geometryValue('x'), this.geometryValue('y'),
      this.geometryValue('width'), this.geometryValue('height')));
  }
}
