import type { TreeDecorator } from '../../ports/TreeDecorator.js';
import type { ShapeDescription } from '../../domain/ShapeDescription.js';
export class BoxTypeLabel implements TreeDecorator {
  public prepare(): (shape?: ShapeDescription) => string | undefined { return shape => shape?.getType() === 'box' ? '(box)' : undefined; }
}
