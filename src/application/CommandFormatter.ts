import type { DocumentDescription } from '../domain/DocumentDescription.js';
import type { ShapeDescription } from '../domain/ShapeDescription.js';

export interface CommandFormatter {
  tree(document: DocumentDescription, root?: ShapeDescription, saved?: DocumentDescription): readonly string[];
  show(shape: ShapeDescription, parent: string): readonly string[];
}
