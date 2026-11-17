import type { PluginContext } from '../../application/PluginContext.js';
import { ModifiedStar } from './ModifiedStar.js';
export class ModifiedStarPlugin {
 public activate(context: PluginContext): void { context.registerDecorator('modified-star', new ModifiedStar()); }
}
export default new ModifiedStarPlugin();
