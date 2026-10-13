import type { DocumentDescription } from '../domain/DocumentDescription.js';
import type { ShapeDescription } from '../domain/ShapeDescription.js';

export interface CommandFormatter {
  tree(document: DocumentDescription, root?: ShapeDescription): readonly string[];
  show(shape: ShapeDescription, parent: string): readonly string[];
}
