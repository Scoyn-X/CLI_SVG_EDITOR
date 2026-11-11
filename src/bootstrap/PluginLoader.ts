import { existsSync, readFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { PluginModule } from '../application/PluginModule.js';
import type { PluginConfigEntry } from './PluginConfigEntry.js';
import { PluginManifest } from './PluginManifest.js';
import type { PluginRegistry } from './PluginRegistry.js';

export class PluginLoader {
  public constructor(private readonly registry: PluginRegistry, private readonly report: (message: string) => void) {}

  public async activate(manifest: PluginManifest, plugin: PluginModule, options?: unknown): Promise<void> {
    try { await this.registry.install(manifest, plugin, options); }
    catch (error) { this.report(this.reason(error)); }
  }

  public async loadConfig(file: string): Promise<void> {
    const config = resolve(file);
    let entries: readonly PluginConfigEntry[];
    try { entries = this.parseConfig(JSON.parse(readFileSync(config, 'utf8').replace(/^\uFEFF/, ''))); }
    catch { this.report('invalid plugin config'); return; }

    for (const entry of entries) {
      if (entry.enabled !== false) { await this.loadModule(entry, specifier => this.resolveModule(specifier, config)); }
    }
  }

  private resolveModule(specifier: string, config: string): string {
    // Keep directory plugins (package.json main), while packages use Node's import conditions.
    if (specifier.startsWith('.') || isAbsolute(specifier)) { return createRequire(config).resolve(specifier); }
    const hook = registerHooks({
      resolve: (name, context, next) => next(name, { ...context, parentURL: pathToFileURL(config).href }),
    });
    try {
      const file = fileURLToPath(import.meta.resolve(specifier));
      if (!existsSync(file)) { throw new Error('module entry does not exist'); }
      return file;
    } finally {
      // Resolution is synchronous; no hook remains installed during evaluation/activation.
      hook.deregister();
    }
  }

  private parseConfig(value: unknown): readonly PluginConfigEntry[] {
    if (typeof value !== 'object' || value === null || !('plugins' in value) || Object.keys(value).length !== 1
      || !Array.isArray(value.plugins) || !value.plugins.every(entry => this.isConfigEntry(entry))) {
      throw new Error('invalid plugin config');
    }
    return value.plugins;
  }

  private isConfigEntry(entry: unknown): entry is PluginConfigEntry {
    return typeof entry === 'object' && entry !== null && 'module' in entry
      && typeof entry.module === 'string' && entry.module.trim() !== ''
      && (!('enabled' in entry) || typeof entry.enabled === 'boolean')
      && Object.keys(entry).every(key => ['module', 'enabled', 'options'].includes(key));
  }

  private async loadModule(entry: PluginConfigEntry, resolveModule: (specifier: string) => string): Promise<void> {
    let file: string;
    try { file = resolveModule(entry.module); }
    catch { this.report(`plugin not found: ${entry.module}`); return; }

    let name = entry.module;
    try {
      const manifest = this.readManifest(file);
      name = manifest.getName();
      const loaded: unknown = await import(pathToFileURL(file).href);
      const plugin = typeof loaded === 'object' && loaded !== null && 'default' in loaded ? loaded.default : undefined;
      if (plugin === undefined) { this.report(`plugin has no default export: ${entry.module}`); return; }
      if (!this.isPlugin(plugin)) { throw new Error('default export must provide activate'); }
      await this.activate(manifest, plugin, entry.options);
    } catch (error) {
      this.report(`plugin failed to activate: ${name} (${this.reason(error)})`);
    }
  }

  private readManifest(file: string): PluginManifest {
    let directory = dirname(file);
    while (directory !== dirname(directory)) {
      const manifest = join(directory, 'package.json');
      if (existsSync(manifest)) { return PluginManifest.parse(JSON.parse(readFileSync(manifest, 'utf8'))); }
      directory = dirname(directory);
    }
    throw new Error('missing plugin package.json');
  }

  private isPlugin(value: unknown): value is PluginModule {
    return typeof value === 'object' && value !== null && 'activate' in value && typeof value.activate === 'function';
  }

  private reason(error: unknown): string {
    const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'unexpected failure';
    return message.replace(/[\r\n]+/g, ' ');
  }
}
