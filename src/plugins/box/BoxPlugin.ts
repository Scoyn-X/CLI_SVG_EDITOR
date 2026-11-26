import type { PluginContext } from '../../application/PluginContext.js';
import { BoxProvider } from './BoxProvider.js';
import { BoxAttributes } from './BoxAttributes.js';
import { BoxTypeLabel } from './BoxTypeLabel.js';
export class BoxPlugin {
  public activate(context: PluginContext): void {
    context.registerShape(new BoxProvider()); context.registerAttribute('box-attributes', new BoxAttributes()); context.registerDecorator('box-type-label', new BoxTypeLabel());
  }
}
export default new BoxPlugin();
