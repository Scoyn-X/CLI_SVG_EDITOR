import type { CommandRegistration } from '../application/CommandRegistration.js';
import type { PluginModule } from '../application/PluginModule.js';
import type { AttributeHandler } from '../ports/AttributeHandler.js';
import type { ShapeProvider } from '../ports/ShapeProvider.js';
import type { TreeDecorator } from '../ports/TreeDecorator.js';
import { PluginContributions } from './PluginContributions.js';
import type { PluginCategory, PluginManifest } from './PluginManifest.js';

export class PluginRegistry {
  private readonly committed: PluginContributions[] = [];
  private installing = false;

  public constructor(private readonly reserved: (category: PluginCategory, name: string) => boolean) {}

  public async install(manifest: PluginManifest, plugin: PluginModule, options: unknown): Promise<void> {
    if (this.installing) { throw new Error('plugin activation already in progress'); }
    this.installing = true;
    const staged = new PluginContributions((category, name) =>
      this.reserved(category, name) || this.committed.some(plugin => plugin.has(category, name)));
    try {
      try {
        await plugin.activate(staged, options);
      } catch (error) {
        const reason = error instanceof Error ? error.message : typeof error === 'string' ? error : 'unexpected failure';
        throw staged.seal() ?? new Error(`plugin failed to activate: ${manifest.getName()} (${reason})`);
      }
      const failure = staged.seal();
      if (failure !== undefined) { throw failure; }
      manifest.verify(category => staged.names(category));
      this.committed.push(staged);
    } finally {
      this.installing = false;
    }
  }

  public shapeProviders(): readonly ShapeProvider[] { return this.committed.flatMap(plugin => plugin.shapeProviders()); }
  public commandEntries(): readonly (readonly [string, CommandRegistration])[] { return this.committed.flatMap(plugin => plugin.commandEntries()); }
  public treeDecorators(): readonly TreeDecorator[] { return this.committed.flatMap(plugin => plugin.treeDecorators()); }
  public attributeHandlers(): readonly AttributeHandler[] { return this.committed.flatMap(plugin => plugin.attributeHandlers()); }
}
