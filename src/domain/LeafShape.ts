import type { Geometry } from './Geometry.js';
import type { GeometryTransform } from './GeometryTransform.js';
import { Shape } from './Shape.js';
import { ShapeChange } from './ShapeChange.js';

export abstract class LeafShape extends Shape {
  private geometry: Geometry;

  protected constructor(id: string, tag: string, geometry: Geometry) {
    super(id, tag);
    this.geometry = geometry;
  }

  public override prepareTransform(transform: GeometryTransform): ShapeChange {
    const next = this.geometry.transformed(transform);
    return new ShapeChange(() => { this.geometry = next; });
  }

  protected override geometryAttributes(): Readonly<Record<string, number>> {
    return this.geometry.attributes();
  }

  protected geometryValue(name: string): number { return this.geometry.value(name); }

  protected override setSpecificAttribute(name: string, value: string | number): void {
    this.geometry = this.geometry.withAttribute(name, value);
  }
}
