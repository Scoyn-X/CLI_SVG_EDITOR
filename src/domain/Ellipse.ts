import { Geometry } from './Geometry.js';
import { LeafShape } from './LeafShape.js';

export class Ellipse extends LeafShape {
  public constructor(id: string, cx: number, cy: number, rx: number, ry: number) {
    super(id, 'ellipse', new Geometry({ cx }, { cy }, { rx, ry }));
  }

  public override clone(): Ellipse {
    return this.copyStylesTo(new Ellipse(this.getId(), this.geometryValue('cx'), this.geometryValue('cy'),
      this.geometryValue('rx'), this.geometryValue('ry')));
  }
}
