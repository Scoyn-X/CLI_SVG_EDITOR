import { Group } from '../../domain/Group.js';
import { BuiltinShapeProvider } from './BuiltinShapeProvider.js';
import type { Shape } from '../../domain/Shape.js';
import type { SvgElement } from '../../ports/SvgElement.js';

export class GroupProvider extends BuiltinShapeProvider {
  public constructor() { super('g', 0); }
  protected override build(id: string): Group { return new Group(id); }
  protected override allowsChildren(): boolean { return true; }
  protected override buildFromSvg(element: SvgElement, importChild: (element: SvgElement) => Shape): Group {
    return new Group(element.getAttribute('id') ?? '', element.getChildren().map(importChild));
  }
}
