import { Circle } from '../../domain/Circle.js';
import { BuiltinShapeProvider } from './BuiltinShapeProvider.js';

export class CircleProvider extends BuiltinShapeProvider {
  public constructor() { super('circle', 3, 'fill'); }
  protected override build(id: string, parameters: readonly string[]): Circle {
    return new Circle(id, this.number(parameters, 0, 'cx'), this.number(parameters, 1, 'cy'), this.number(parameters, 2, 'r'));
  }
}
