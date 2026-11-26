import type { ShapeDescription } from '../domain/ShapeDescription.js';

export interface AttributeHandler {
  handles(target: ShapeDescription, attribute: string): boolean;
  apply(target: ShapeDescription, attribute: string, value: string | number,
    set: (id: string, attribute: string, value: string | number) => void): void;
  summarize?(before: ShapeDescription, after: ShapeDescription, attribute: string): { readonly forward: string; readonly reverse: string };
}
