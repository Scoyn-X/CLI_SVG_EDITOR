import { Text } from '../../domain/Text.js';
import { BuiltinShapeProvider } from './BuiltinShapeProvider.js';

export class TextProvider extends BuiltinShapeProvider {
  public constructor() { super('text', 3); }
  protected override build(id: string, parameters: readonly string[]): Text {
    return new Text(id, this.number(parameters, 0, 'x'), this.number(parameters, 1, 'y'), this.parameter(parameters, 2));
  }
}
