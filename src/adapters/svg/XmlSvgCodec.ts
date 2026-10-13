import { parseXml, XmlDeclaration, XmlDocumentType, XmlElement, XmlProcessingInstruction, XmlText } from '@rgrove/parse-xml';
import { CanvasAttributes } from '../../domain/CanvasAttributes.js';
import type { DocumentDescription } from '../../domain/DocumentDescription.js';
import { DomainError } from '../../domain/DomainError.js';
import type { ShapeDescription } from '../../domain/ShapeDescription.js';
import { SvgDocument } from '../../domain/SvgDocument.js';
import { ValueValidation } from '../../domain/ValueValidation.js';
import { IdAssignment } from '../../ports/IdAssignment.js';
import { ImportedDocument } from '../../ports/ImportedDocument.js';
import type { ShapeImporter } from '../../ports/ShapeImporter.js';
import type { SvgCodec } from '../../ports/SvgCodec.js';
import { SvgElement } from '../../ports/SvgElement.js';

export class XmlSvgCodec implements SvgCodec {
  public constructor(private readonly importer: ShapeImporter) {}

  public decode(xml: string): ImportedDocument {
    const root = this.parse(xml);
    if (root.getText().trim() !== '') { throw new DomainError('unexpected SVG root text'); }
    const width = this.dimension(root.getAttribute('width'), 'width');
    const height = this.dimension(root.getAttribute('height'), 'height');
    const canvas = new CanvasAttributes(Object.fromEntries(Object.entries(root.getAttributes()).filter(([name]) => name !== 'width' && name !== 'height')));
    const ids = new Set<string>();
    for (const child of root.getChildren()) { this.collectIds(child, ids); }
    const assignments: IdAssignment[] = [];
    const counters = new Map<string, number>();
    const assigned = root.getChildren().map(child => this.assignIds(child, ids, counters, assignments));
    const document = new SvgDocument(width, height, assigned.map(child => this.importer.fromSvg(child)), canvas.forCanvas(width, height));
    return new ImportedDocument(document, assignments);
  }

  public encode(document: DocumentDescription): string {
    const attributes = { xmlns: 'http://www.w3.org/2000/svg', width: document.getWidth(), height: document.getHeight(),
      viewBox: `0 0 ${document.getWidth()} ${document.getHeight()}`, ...document.getCanvasAttributes() };
    const roots = document.getRoots().map(shape => this.element(shape, 1)).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg${this.attributes(attributes)}>\n${roots}${roots === '' ? '' : '\n'}</svg>\n`;
  }

  private parse(xml: string): SvgElement {
    try {
      const document = parseXml(xml, { preserveXmlDeclaration: true, preserveDocumentType: true });
      for (const node of document.children) {
        if (node instanceof XmlDocumentType) { throw new DomainError('SVG DTD is not supported'); }
        if (node instanceof XmlProcessingInstruction) { throw new DomainError('SVG processing instructions are not supported'); }
        if (node instanceof XmlDeclaration && (node.version !== '1.0' || (node.encoding !== null && node.encoding.toLowerCase() !== 'utf-8'))) {
          throw new DomainError('SVG must use XML 1.0 and UTF-8');
        }
      }
      if (document.root === null) { throw new DomainError('missing svg root'); }
      const root = this.convert(document.root, new Map());
      if (root.getTag() !== 'svg') { throw new DomainError('expected svg root'); }
      return root;
    } catch (error) {
      if (error instanceof DomainError) { throw error; }
      throw new DomainError(`invalid SVG XML: ${error instanceof Error ? error.message.split(/[\r\n]/)[0] : 'parse failed'}`);
    }
  }

  private convert(node: XmlElement, inherited: ReadonlyMap<string, string>): SvgElement {
    const namespaces = new Map(inherited);
    const attributes: Record<string, string> = {};
    for (const [name, value] of Object.entries(node.attributes)) {
      if (name === 'xmlns' || name.startsWith('xmlns:')) {
        const prefix = name === 'xmlns' ? '' : name.slice(6);
        if (prefix.includes(':') || prefix === 'xmlns' || (prefix !== '' && value === '')
          || (prefix === 'xml') !== (value === 'http://www.w3.org/XML/1998/namespace')
          || value === 'http://www.w3.org/2000/xmlns/') { throw new DomainError('invalid SVG namespace declaration'); }
        namespaces.set(prefix, value);
      } else {
        if (name.includes(':')) { throw new DomainError(`unsupported SVG attribute namespace: ${name}`); }
        Object.defineProperty(attributes, name, { value, enumerable: true });
      }
    }
    const parts = node.name.split(':');
    const local = parts.at(-1) ?? '';
    const prefix = parts.length === 1 ? '' : parts[0] ?? '';
    if (parts.length > 2 || prefix === 'xmlns' || namespaces.get(prefix) !== 'http://www.w3.org/2000/svg') {
      throw new DomainError(`unsupported SVG namespace: ${node.name}`);
    }
    const children: SvgElement[] = [];
    let content = '';
    for (const child of node.children) {
      if (child instanceof XmlElement) { children.push(this.convert(child, namespaces)); }
      else if (child instanceof XmlText) { content += child.text; }
      else if (child instanceof XmlProcessingInstruction) { throw new DomainError('SVG processing instructions are not supported'); }
    }
    return new SvgElement(local, attributes, children, content);
  }

  private dimension(value: string | undefined, name: string): number {
    if (value === undefined) { throw new DomainError(`missing SVG ${name}`); }
    return ValueValidation.positive(ValueValidation.number(value.replace(/px$/, ''), `canvas ${name}`), `canvas ${name}`);
  }

  private collectIds(element: SvgElement, ids: Set<string>): void {
    const id = element.getAttribute('id');
    if (id !== undefined) {
      ValueValidation.id(id);
      if (ids.has(id)) { throw new DomainError(`id already exists: ${id}`); }
      ids.add(id);
    }
    for (const child of element.getChildren()) { this.collectIds(child, ids); }
  }

  private assignIds(element: SvgElement, ids: Set<string>, counters: Map<string, number>, assignments: IdAssignment[]): SvgElement {
    let id = element.getAttribute('id');
    if (id === undefined) {
      const tag = element.getTag();
      let next = counters.get(tag) ?? 1;
      while (ids.has(`${tag}${next}`)) { next++; }
      id = `${tag}${next}`;
      counters.set(tag, next + 1); ids.add(id); assignments.push(new IdAssignment(id, tag));
    }
    return new SvgElement(element.getTag(), { ...element.getAttributes(), id }, element.getChildren().map(child => this.assignIds(child, ids, counters, assignments)), element.getText());
  }

  private element(shape: ShapeDescription, depth: number): string {
    const tag = shape.getTag();
    if (!/^[A-Za-z_][\w.-]*$/.test(tag)) { throw new DomainError('invalid SVG element name'); }
    const indent = '  '.repeat(depth);
    const opening = `${indent}<${tag}${this.attributes(shape.getAttributes())}`;
    const text = shape.getText();
    if (text !== undefined) { return `${opening}>${this.escape(text, false)}</${tag}>`; }
    const children = shape.getChildren();
    return children.length === 0 ? `${opening}/>` : `${opening}>\n${children.map(child => this.element(child, depth + 1)).join('\n')}\n${indent}</${tag}>`;
  }

  private attributes(values: Readonly<Record<string, string | number>>): string {
    return Object.entries(values).map(([name, value]) => ` ${name}="${this.escape(String(value), true)}"`).join('');
  }
  private escape(value: string, attribute: boolean): string {
    let escaped = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r/g, '&#13;');
    if (attribute) { escaped = escaped.replace(/"/g, '&quot;').replace(/\n/g, '&#10;').replace(/\t/g, '&#9;'); }
    return escaped;
  }
}
