import { DomainError } from '../../src/domain/DomainError.js';
import { Group } from '../../src/domain/Group.js';
import { PresentationAttributes } from '../../src/domain/PresentationAttributes.js';
import { Rect } from '../../src/domain/Rect.js';
import type { Shape } from '../../src/domain/Shape.js';
import { ShapeAccess } from '../../src/domain/ShapeAccess.js';
import { Text } from '../../src/domain/Text.js';

/** 仅测试使用的标记容器；不注册到生产组合，不是课程 box 的实现。 */
export class ExtensionProbe extends Group {
  public constructor(id: string, children?: readonly Shape[]) {
    super(id, children ?? [new Rect(`${id}-rect`, 10, 20, 30, 40), new Text(`${id}-label`, 15, 25, 'probe')]);
    this.preservePresentation(new PresentationAttributes({ 'data-kind': 'probe' }));
  }

  public override canUngroup(): boolean { return false; }

  public override set(name: string, value: string | number): void {
    if (name === 'fill') { this.part('rect').set('fill', value); }
    else if (name === 'label') { this.part('label').set('text', value); }
    else { super.set(name, value); }
  }

  public override clone(): ExtensionProbe {
    return this.copyStylesTo(new ExtensionProbe(this.getId(), this[ShapeAccess.children]().items()));
  }

  private part(suffix: string): Shape {
    const part = this[ShapeAccess.children]().items().find(child => child.getId() === `${this.getId()}-${suffix}`);
    if (part === undefined) { throw new DomainError('invalid test probe structure'); }
    return part;
  }
}
