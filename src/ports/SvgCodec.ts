import type { DocumentDescription } from '../domain/DocumentDescription.js';
import type { ImportedDocument } from './ImportedDocument.js';

export interface SvgCodec {
  decode(xml: string): ImportedDocument;
  encode(document: DocumentDescription): string;
}
