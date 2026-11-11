import { CommandRegistration } from '../../application/CommandRegistration.js';
import type { PluginContext } from '../../application/PluginContext.js';
import type { PluginModule } from '../../application/PluginModule.js';
import { StatsCommand } from './StatsCommand.js';

export class StatsPlugin implements PluginModule {
  public activate(context: PluginContext): void {
    context.registerCommand('stats', new CommandRegistration('stats', 0, 0, () => new StatsCommand()));
  }
}

export default new StatsPlugin();
