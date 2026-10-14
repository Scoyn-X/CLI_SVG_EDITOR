import { BuiltinShapeProvider } from '../../src/adapters/shapes/BuiltinShapeProvider.js';
import type { Shape } from '../../src/domain/Shape.js';
import type { SvgElement } from '../../src/ports/SvgElement.js';
import { ExtensionProbe } from './ExtensionProbe.js';

/** 仅测试注册：导入必须消费实际子元素，不能重建默认部件模板。 */
export class ExtensionProbeProvider extends BuiltinShapeProvider {
  public constructor() { super('probe', 0); }
  protected override build(id: string): ExtensionProbe { return new ExtensionProbe(id); }
  protected override allowsChildren(): boolean { return true; }
  protected override buildFromSvg(element: SvgElement, importChild: (element: SvgElement) => Shape): ExtensionProbe {
    return new ExtensionProbe(element.getAttribute('id') ?? '', element.getChildren().map(importChild));
  }
}
