import type { AttributeHandler } from '../../ports/AttributeHandler.js';
import type { ShapeDescription } from '../../domain/ShapeDescription.js';
export class BoxAttributes implements AttributeHandler {
  public handles(target: ShapeDescription, attribute: string): boolean { return target.getType() === 'box' && ['fill', 'label'].includes(attribute); }
  public apply(target: ShapeDescription, attribute: string, value: string | number, set: Parameters<AttributeHandler['apply']>[3]): void {
    set(target.getId() + (attribute === 'fill' ? '-rect' : '-label'), attribute === 'fill' ? 'fill' : 'text', value);
  }
  public summarize(before: ShapeDescription, after: ShapeDescription, attribute: string): { forward: string; reverse: string } {
    const id = after.getId();
    const label = (shape: ShapeDescription): string => JSON.stringify(shape.getChildren().find(child => child.getId() === id + '-label')?.getText());
    return attribute === 'fill' ? { forward: 'box#' + id + ' fill propagated to ' + id + '-rect', reverse: 'box#' + id + ' fill restored on ' + id + '-rect' }
      : { forward: 'box#' + id + ' label updated: ' + label(after), reverse: 'box#' + id + ' label restored: ' + label(before) };
  }
}
