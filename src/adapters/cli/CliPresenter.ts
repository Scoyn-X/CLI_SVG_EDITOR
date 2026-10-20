import type { CommandFormatter } from '../../application/CommandFormatter.js';
import type { DocumentDescription } from '../../domain/DocumentDescription.js';
import type { ShapeDescription } from '../../domain/ShapeDescription.js';

export class CliPresenter implements CommandFormatter {
  public tree(document: DocumentDescription, root?: ShapeDescription): readonly string[] {
    const lines = root === undefined ? [`svg (${document.getWidth()}x${document.getHeight()})`] : [this.inline(root)];
    this.children(root?.getChildren() ?? document.getRoots(), '', lines);
    return Object.freeze(lines);
  }
  public show(shape: ShapeDescription, parent: string): readonly string[] {
    const attributes = Object.entries(shape.getAttributes()).filter(([name]) => name !== 'id');
    const numeric = attributes.filter(([name, value]) => typeof value === 'number' && name !== 'stroke-width');
    const geometryNames = new Set(numeric.map(([name]) => name));
    const geometry = attributes.filter(([name]) => geometryNames.has(name));
    const extra = attributes.filter(([name]) => !geometryNames.has(name));
    const text = shape.getText();
    return Object.freeze([`${shape.getTag()}#${shape.getId()}  parent=${parent}`,
      ...geometry.length === 0 ? [] : [`  ${this.pairs(geometry)}`],
      ...text === undefined ? [] : [`  text=${JSON.stringify(text)}`],
      ...extra.map(([name, value]) => `  ${name}=${this.value(value)}`)]);
  }
  private children(children: readonly ShapeDescription[], prefix: string, lines: string[]): void {
    const width = children.reduce((longest, shape) => Math.max(longest, this.label(shape).length), 0);
    children.forEach((shape, index) => {
      const last = index === children.length - 1;
      lines.push(`${prefix}${last ? '└── ' : '├── '}${this.inline(shape, width)}`);
      this.children(shape.getChildren(), prefix + (last ? '    ' : '│   '), lines);
    });
  }
  private label(shape: ShapeDescription): string { return `${shape.getTag()}#${shape.getId()}`; }
  private inline(shape: ShapeDescription, width = 0): string {
    const geometry = shape.getGeometry();
    const attributes = Object.entries(geometry.getAttributes()).map(([name, value]) => [name === 'width' ? 'w' : name === 'height' ? 'h' : name, value] as const);
    const points = geometry.getPoints().map(([x, y]) => `(${x},${y})`).join(' -> ');
    const text = shape.getText();
    const extra = Object.entries(shape.getAttributes()).filter(([name, value]) => name !== 'id' && (typeof value === 'string' || name === 'stroke-width'));
    const details = [this.pairs(attributes), points, text === undefined ? '' : JSON.stringify(text), this.pairs(extra)].filter(Boolean).join(' ');
    const label = this.label(shape);
    return details === '' ? label : `${label.padEnd(width)}  ${details}`;
  }
  private pairs(values: readonly (readonly [string, string | number])[]): string { return values.map(([name, value]) => `${name}=${this.value(value)}`).join(' '); }
  private value(value: string | number): string { return typeof value === 'string' && /[\r\n\t]/.test(value) ? JSON.stringify(value) : String(value); }
}
