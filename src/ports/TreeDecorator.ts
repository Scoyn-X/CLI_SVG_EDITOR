import type { DocumentDescription } from '../domain/DocumentDescription.js';
import type { ShapeDescription } from '../domain/ShapeDescription.js';

/** Prepare once per tree. An absent shape identifies the canvas row. */
export interface TreeDecorator {
  prepare(document: DocumentDescription, saved: DocumentDescription | undefined): (shape?: ShapeDescription) => string | undefined;
}
