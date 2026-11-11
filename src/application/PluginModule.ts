import type { PluginContext } from './PluginContext.js';

export interface PluginModule {
  activate(context: PluginContext, options: unknown): void | Promise<void>;
}
