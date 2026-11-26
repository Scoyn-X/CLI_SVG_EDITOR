import { CommandRegistration } from '../../application/CommandRegistration.js';
import type { PluginContext } from '../../application/PluginContext.js';
import type { PluginModule } from '../../application/PluginModule.js';
import { DirCommand } from './DirCommand.js';
import type { DirectoryReader } from './DirectoryReader.js';
import { NodeDirectoryReader } from './NodeDirectoryReader.js';

export class DirPlugin implements PluginModule {
  public constructor(private readonly reader: DirectoryReader = new NodeDirectoryReader()) {}

  public activate(context: PluginContext): void {
    context.registerCommand('dir', new CommandRegistration('dir', 0, 0, () => new DirCommand(this.reader)));
  }
}

export default new DirPlugin();
