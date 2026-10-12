import type { SvgDocument } from '../domain/SvgDocument.js';

/** 快照不泄漏所持文档，每次恢复都产生独立的领域对象。 */
export class DocumentMemento {
  private readonly snapshot: SvgDocument;

  public constructor(document: SvgDocument) { this.snapshot = document.clone(); }
  public restore(): SvgDocument { return this.snapshot.clone(); }
}
