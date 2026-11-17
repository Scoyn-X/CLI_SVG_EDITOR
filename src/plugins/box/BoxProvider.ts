import type { ShapeProvider } from '../../ports/ShapeProvider.js';
import type { Shape } from '../../domain/Shape.js';
import type { SvgElement } from '../../ports/SvgElement.js';
import { Rect } from '../../domain/Rect.js';
import { Text } from '../../domain/Text.js';
import { DomainError } from '../../domain/DomainError.js';
import { ValueValidation } from '../../domain/ValueValidation.js';
import { Box } from './Box.js';
export class BoxProvider implements ShapeProvider {
  public getType(): string { return 'box'; }
  public getSvgTag(): string { return 'g'; }
  public getUsage(): string { return 'create box <id> <x> <y> <w> <h> "<title>" [in <containerId>]'; }
  public create(id: string, parameters: readonly string[]): Shape {
    if (parameters.length !== 5) { throw new DomainError('usage: ' + this.getUsage()); }
    const [x, y, w, h] = parameters.slice(0,4).map(value => ValueValidation.number(value, 'box geometry'));
    if (x === undefined || y === undefined || w === undefined || h === undefined) { throw new DomainError('invalid box geometry'); }
    const rect = new Rect(id + '-rect', x, y, w, h); rect.set('fill', '#4a90d9');
    return new Box(id, [rect, new Text(id + '-label', x + 20, y + h / 2 + 5, parameters[4] ?? '')]);
  }
  public fromSvg(element: SvgElement, importChild: (element: SvgElement) => Shape): Shape {
    return new Box(element.getAttribute('id') ?? '', element.getChildren().map(importChild));
  }
}
