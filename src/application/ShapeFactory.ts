import { DomainError } from '../domain/DomainError.js';
import type { Shape } from '../domain/Shape.js';
import type { ShapeCreator } from '../ports/ShapeCreator.js';
import type { ShapeProvider } from '../ports/ShapeProvider.js';
import type { ShapeImporter } from '../ports/ShapeImporter.js';
import type { SvgElement } from '../ports/SvgElement.js';

/** 唯一图形类型名分派位置；后续插件阶段重构注册来源和生命周期。 */
export class ShapeFactory implements ShapeCreator, ShapeImporter {
  private readonly providers = new Map<string, ShapeProvider>();

  public register(provider: ShapeProvider): void {
    const type = provider.getType();
    if (this.providers.has(type)) { throw new DomainError(`shape type already registered: ${type}`); }
    this.providers.set(type, provider);
  }

  public create(type: string, id: string, parameters: readonly string[]): Shape {
    return this.provider(type).create(id, parameters);
  }

  public fromSvg(element: SvgElement): Shape {
    return this.provider(element.getTag()).fromSvg(element, child => this.fromSvg(child));
  }
  public getUsages(): readonly string[] { return Object.freeze([...this.providers.values()].map(provider => provider.getUsage())); }

  private provider(type: string): ShapeProvider {
    const provider = this.providers.get(type);
    if (provider === undefined) { throw new DomainError(`unknown shape type: ${type} (is the plugin loaded?)`); }
    return provider;
  }
}
