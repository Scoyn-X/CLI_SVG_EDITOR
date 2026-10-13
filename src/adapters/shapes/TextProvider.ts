import { Text } from '../../domain/Text.js';
import { BuiltinShapeProvider } from './BuiltinShapeProvider.js';
import type { SvgElement } from '../../ports/SvgElement.js';

export class TextProvider extends BuiltinShapeProvider {
  public constructor() { super('text', 3, undefined, ['x', 'y']); }
  protected override allowsText(): boolean { return true; }
  protected override svgParameters(element: SvgElement): readonly string[] { return [...super.svgParameters(element), element.getText()]; }
  protected override build(id: string, parameters: readonly string[]): Text {
    return new Text(id, this.number(parameters, 0, 'x'), this.number(parameters, 1, 'y'), this.parameter(parameters, 2));
  }
}
