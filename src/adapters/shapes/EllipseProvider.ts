import { Ellipse } from '../../domain/Ellipse.js';
import { BuiltinShapeProvider } from './BuiltinShapeProvider.js';

export class EllipseProvider extends BuiltinShapeProvider {
  public constructor() { super('ellipse', 4, 'fill', ['cx', 'cy', 'rx', 'ry']); }
  protected override build(id: string, parameters: readonly string[]): Ellipse {
    return new Ellipse(id, this.number(parameters, 0, 'cx'), this.number(parameters, 1, 'cy'),
      this.number(parameters, 2, 'rx'), this.number(parameters, 3, 'ry'));
  }
}
