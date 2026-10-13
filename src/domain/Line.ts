import { Geometry } from './Geometry.js';
import { LeafShape } from './LeafShape.js';
import { GeometrySummary } from './GeometrySummary.js';

export class Line extends LeafShape {
  public constructor(id: string, x1: number, y1: number, x2: number, y2: number) {
    super(id, 'line', new Geometry({ x1, x2 }, { y1, y2 }));
  }

  public override clone(): Line {
    return this.copyStylesTo(new Line(this.getId(), this.geometryValue('x1'), this.geometryValue('y1'),
      this.geometryValue('x2'), this.geometryValue('y2')));
  }
  protected override geometrySummary(): GeometrySummary {
    return new GeometrySummary({}, [[this.geometryValue('x1'), this.geometryValue('y1')], [this.geometryValue('x2'), this.geometryValue('y2')]]);
  }
}
