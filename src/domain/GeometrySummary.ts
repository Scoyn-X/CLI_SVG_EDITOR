/** 几何语义分组；领域不持有终端树线或 XML 字符串。 */
export class GeometrySummary {
  private readonly attributes: Readonly<Record<string, number>>;
  private readonly points: readonly (readonly [number, number])[];
  public constructor(attributes: Readonly<Record<string, number>> = {}, points: readonly (readonly [number, number])[] = []) {
    this.attributes = Object.freeze({ ...attributes });
    this.points = Object.freeze(points.map(point => Object.freeze([...point] as [number, number])));
    Object.freeze(this);
  }
  public getAttributes(): Readonly<Record<string, number>> { return this.attributes; }
  public getPoints(): readonly (readonly [number, number])[] { return this.points; }
}
