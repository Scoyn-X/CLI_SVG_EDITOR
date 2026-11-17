import type { TreeDecorator } from '../../ports/TreeDecorator.js';
import type { DocumentDescription } from '../../domain/DocumentDescription.js';
import type { ShapeDescription } from '../../domain/ShapeDescription.js';
export class ModifiedStar implements TreeDecorator {
 private changed = new Set<string>();
 private canvasChanged = false;
 public prepare(document: DocumentDescription, saved: DocumentDescription | undefined): (shape?: ShapeDescription) => string | undefined {
  this.changed = new Set<string>();
  const previous = new Map<string, string>();
  const signature = (shape: ShapeDescription): string => JSON.stringify([shape.getType(), shape.getAttributes(), shape.getText(), shape.getChildren().map(signature)]);
  const remember = (shape: ShapeDescription): void => { previous.set(shape.getId(), signature(shape)); shape.getChildren().forEach(remember); };
  saved?.getRoots().forEach(remember);
  const visit = (shape: ShapeDescription): void => { if (signature(shape) !== previous.get(shape.getId())) { this.changed.add(shape.getId()); } shape.getChildren().forEach(visit); };
  document.getRoots().forEach(visit);
  this.canvasChanged = saved === undefined || JSON.stringify([document.getWidth(),document.getHeight(),document.getCanvasAttributes(),document.getRoots().map(signature)]) !== JSON.stringify([saved.getWidth(),saved.getHeight(),saved.getCanvasAttributes(),saved.getRoots().map(signature)]);
  const changed = new Set(this.changed); const canvasChanged = this.canvasChanged;
  return shape => (shape === undefined ? canvasChanged : changed.has(shape.getId())) ? '*' : undefined;
 }
}
