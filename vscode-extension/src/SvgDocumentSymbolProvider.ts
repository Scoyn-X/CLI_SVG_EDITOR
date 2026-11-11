import { DocumentSymbol, Range, SymbolKind } from 'vscode';
import type { CancellationToken, DocumentSymbolProvider, TextDocument } from 'vscode';
import type { SvgOutlineNode } from './SvgOutlineNode';
import { SvgOutlineParser } from './SvgOutlineParser';

export class SvgDocumentSymbolProvider implements DocumentSymbolProvider {
  private readonly parser = new SvgOutlineParser();

  public provideDocumentSymbols(document: TextDocument, token: CancellationToken): DocumentSymbol[] {
    if (token.isCancellationRequested) { return []; }
    const root = this.parser.parse(document.getText());
    if (root === undefined) { return []; }

    const outline = this.createSymbol(document, root);
    const pending: Array<readonly [SvgOutlineNode, DocumentSymbol]> = [[root, outline]];
    for (let item = pending.pop(); item !== undefined; item = pending.pop()) {
      const [node, symbol] = item;
      for (const child of node.elements) {
        const childSymbol = this.createSymbol(document, child);
        symbol.children.push(childSymbol);
        pending.push([child, childSymbol]);
      }
    }
    return [outline];
  }

  private createSymbol(document: TextDocument, node: SvgOutlineNode): DocumentSymbol {
    const nameOffset = node.startOffset + 1;
    return new DocumentSymbol(
      node.label,
      '',
      node.elements.length > 0 ? SymbolKind.Namespace : SymbolKind.Object,
      new Range(document.positionAt(node.startOffset), document.positionAt(node.end)),
      new Range(document.positionAt(nameOffset), document.positionAt(nameOffset + node.tag.length)),
    );
  }
}
