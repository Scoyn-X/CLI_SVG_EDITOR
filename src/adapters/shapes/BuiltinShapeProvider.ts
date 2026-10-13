import { DomainError } from '../../domain/DomainError.js';
import type { Shape } from '../../domain/Shape.js';
import { ValueValidation } from '../../domain/ValueValidation.js';
import type { ShapeProvider } from '../../ports/ShapeProvider.js';
import type { SvgElement } from '../../ports/SvgElement.js';
import { PresentationAttributes } from '../../domain/PresentationAttributes.js';

export abstract class BuiltinShapeProvider implements ShapeProvider {
  protected constructor(private readonly type: string, private readonly count: number, private readonly style?: string,
    private readonly geometry: readonly string[] = []) {}

  public getType(): string { return this.type; }

  public create(id: string, parameters: readonly string[]): Shape {
    if (parameters.length < this.count || parameters.length > this.count + (this.style === undefined ? 0 : 1)) {
      throw new DomainError(`invalid parameters for ${this.type}`);
    }
    const shape = this.build(id, parameters);
    const style = parameters[this.count];
    if (this.style !== undefined && style !== undefined) { shape.set(this.style, style); }
    return shape;
  }

  public fromSvg(element: SvgElement, importChild: (element: SvgElement) => Shape): Shape {
    const allowed = ['id', ...this.geometry, 'fill', 'stroke', 'stroke-width', ...PresentationAttributes.names()];
    for (const name of Object.keys(element.getAttributes())) {
      if (!allowed.includes(name)) { throw new DomainError(`unsupported SVG attribute: ${this.type}.${name}`); }
    }
    if (!this.allowsChildren() && element.getChildren().length > 0) { throw new DomainError(`unsupported SVG children: ${this.type}`); }
    if (!this.allowsText() && element.getText().trim() !== '') { throw new DomainError(`unexpected SVG text: ${this.type}`); }
    const shape = this.buildFromSvg(element, importChild);
    for (const name of ['fill', 'stroke', 'stroke-width']) {
      const value = element.getAttribute(name); if (value !== undefined) { shape.set(name, value); }
    }
    const presentation = Object.fromEntries(PresentationAttributes.names().flatMap(name => {
      const value = element.getAttribute(name); return value === undefined ? [] : [[name, value]];
    }));
    shape.preservePresentation(new PresentationAttributes(presentation));
    return shape;
  }

  protected allowsChildren(): boolean { return false; }
  protected allowsText(): boolean { return false; }
  protected svgParameters(element: SvgElement): readonly string[] { return this.geometry.map(name => element.getAttribute(name) ?? '0'); }
  protected buildFromSvg(element: SvgElement, _importChild: (element: SvgElement) => Shape): Shape {
    void _importChild;
    return this.build(element.getAttribute('id') ?? '', this.svgParameters(element));
  }

  protected parameter(parameters: readonly string[], index: number): string {
    const value = parameters[index];
    if (value === undefined) { throw new DomainError(`missing parameter for ${this.type}`); }
    return value;
  }

  protected number(parameters: readonly string[], index: number, name: string): number {
    return ValueValidation.number(this.parameter(parameters, index), name);
  }

  protected abstract build(id: string, parameters: readonly string[]): Shape;
}
