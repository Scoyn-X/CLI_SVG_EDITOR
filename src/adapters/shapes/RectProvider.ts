import { Rect } from '../../domain/Rect.js';
import { BuiltinShapeProvider } from './BuiltinShapeProvider.js';

export class RectProvider extends BuiltinShapeProvider {
  public constructor() { super('rect', 4, 'fill', ['x', 'y', 'width', 'height']); }
  protected override build(id: string, parameters: readonly string[]): Rect {
    return new Rect(id, this.number(parameters, 0, 'x'), this.number(parameters, 1, 'y'),
      this.number(parameters, 2, 'width'), this.number(parameters, 3, 'height'));
  }
}
