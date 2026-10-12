import { Line } from '../../domain/Line.js';
import { BuiltinShapeProvider } from './BuiltinShapeProvider.js';

export class LineProvider extends BuiltinShapeProvider {
  public constructor() { super('line', 4, 'stroke'); }
  protected override build(id: string, parameters: readonly string[]): Line {
    return new Line(id, this.number(parameters, 0, 'x1'), this.number(parameters, 1, 'y1'),
      this.number(parameters, 2, 'x2'), this.number(parameters, 3, 'y2'));
  }
}
