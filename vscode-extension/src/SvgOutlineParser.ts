import { SaxesParser } from 'saxes';
import { SvgOutlineNode } from './SvgOutlineNode';

export class SvgOutlineParser {
  public parse(source: string): SvgOutlineNode | undefined {
    const parser = new SaxesParser({ xmlns: true });
    const stack: SvgOutlineNode[] = [];
    let root: SvgOutlineNode | undefined;
    let startOffset = 0;
    let invalid = false;

    parser.on('error', () => { invalid = true; });
    parser.on('doctype', () => { invalid = true; });
    parser.on('opentagstart', () => {
      // This event fires after the name, before attributes can contain markup-like text.
      startOffset = source.lastIndexOf('<', parser.position - 1);
    });
    parser.on('opentag', tag => {
      if (invalid) { return; }
      const node = new SvgOutlineNode(tag.name, tag.attributes.id?.value, startOffset);
      const parent = stack.at(-1);
      if (parent !== undefined) {
        parent.addChild(node);
      } else if (tag.local === 'svg' && (tag.uri === '' || tag.uri === 'http://www.w3.org/2000/svg')) {
        root = node;
      }
      stack.push(node);
    });
    parser.on('closetag', () => {
      if (!invalid) { stack.pop()?.close(parser.position); }
    });

    parser.write(source).close();
    return invalid ? undefined : root;
  }
}
