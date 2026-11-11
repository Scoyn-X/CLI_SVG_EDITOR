import type { CommandRegistration } from '../application/CommandRegistration.js';
import type { PluginContext } from '../application/PluginContext.js';
import type { AttributeHandler } from '../ports/AttributeHandler.js';
import type { ShapeProvider } from '../ports/ShapeProvider.js';
import type { TreeDecorator } from '../ports/TreeDecorator.js';
import type { PluginCategory } from './PluginManifest.js';

/** A single activation can only populate its own staging area. */
export class PluginContributions implements PluginContext {
  private readonly shapes = new Map<string, ShapeProvider>();
  private readonly commands = new Map<string, CommandRegistration>();
  private readonly decorators = new Map<string, TreeDecorator>();
  private readonly attributes = new Map<string, AttributeHandler>();
  private closed = false;
  private failure: Error | undefined;

  public constructor(private readonly blocked: (category: PluginCategory, name: string) => boolean) {}

  public registerShape(provider: ShapeProvider): void { this.add('shapes', provider.getType(), this.shapes, provider); }
  public registerCommand(name: string, command: CommandRegistration): void { this.add('commands', name, this.commands, command); }
  public registerDecorator(name: string, decorator: TreeDecorator): void { this.add('decorators', name, this.decorators, decorator); }
  public registerAttribute(name: string, handler: AttributeHandler): void { this.add('attributes', name, this.attributes, handler); }

  public names(category: PluginCategory): readonly string[] { return [...this[category].keys()]; }
  public has(category: PluginCategory, name: string): boolean { return this[category].has(name); }
  public shapeProviders(): readonly ShapeProvider[] { return [...this.shapes.values()]; }
  public commandEntries(): readonly (readonly [string, CommandRegistration])[] { return [...this.commands]; }
  public treeDecorators(): readonly TreeDecorator[] { return [...this.decorators.values()]; }
  public attributeHandlers(): readonly AttributeHandler[] { return [...this.attributes.values()]; }

  public seal(): Error | undefined {
    this.closed = true;
    return this.failure;
  }

  private add<T>(category: PluginCategory, name: string, entries: Map<string, T>, value: T): void {
    if (this.closed) { throw new Error('plugin registration is closed'); }
    if (entries.has(name) || this.blocked(category, name)) {
      this.failure ??= new Error(`duplicate registration: ${category}/${name}`);
      throw this.failure;
    }
    entries.set(name, value);
  }
}
