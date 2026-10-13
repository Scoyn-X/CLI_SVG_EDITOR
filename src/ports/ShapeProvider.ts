import type { Shape } from '../domain/Shape.js';
import type { SvgElement } from './SvgElement.js';

/** 创建参数为中立值，不依赖 CLI token、XML DOM 或应用具体工厂。 */
export interface ShapeProvider {
  getType(): string;
  create(id: string, parameters: readonly string[]): Shape;
  fromSvg(element: SvgElement, importChild: (element: SvgElement) => Shape): Shape;
}
