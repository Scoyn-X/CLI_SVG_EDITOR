import box from '../plugins/box/BoxPlugin.js';
import boxManifest from '../plugins/box/package.json' with { type: 'json' };
import star from '../plugins/modified-star/ModifiedStarPlugin.js';
import starManifest from '../plugins/modified-star/package.json' with { type: 'json' };
import dir from '../plugins/dir/DirPlugin.js';
import dirManifest from '../plugins/dir/package.json' with { type: 'json' };
import stats from '../plugins/stats/StatsPlugin.js';
import statsManifest from '../plugins/stats/package.json' with { type: 'json' };
import type { PluginLoader } from './PluginLoader.js';
import { PluginManifest } from './PluginManifest.js';

export class CodePlugins {
  public async load(loader: PluginLoader): Promise<void> {
    await loader.activate(PluginManifest.parse(statsManifest), stats);
    await loader.activate(PluginManifest.parse(dirManifest), dir);
    await loader.activate(PluginManifest.parse(boxManifest), box);
    await loader.activate(PluginManifest.parse(starManifest), star);
  }
}
