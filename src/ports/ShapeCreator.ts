import type { Shape } from '../domain/Shape.js';

export interface ShapeCreator {
  create(type: string, id: string, parameters: readonly string[]): Shape;
}
