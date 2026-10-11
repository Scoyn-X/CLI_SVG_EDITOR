import { Geometry } from './Geometry.js';
import { LeafShape } from './LeafShape.js';

export class Circle extends LeafShape {
  public constructor(id: string, cx: number, cy: number, r: number) {
    super(id, 'circle', new Geometry({ cx }, { cy }, { r }));
  }

  public override clone(): Circle {
    return this.copyStylesTo(new Circle(this.getId(), this.geometryValue('cx'), this.geometryValue('cy'), this.geometryValue('r')));
  }
}
