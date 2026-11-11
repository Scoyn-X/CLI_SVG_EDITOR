import { RuntimeEnvironment } from './RuntimeEnvironment.js';
import { EditorComposition } from './EditorComposition.js';
import { PluginLoader } from './PluginLoader.js';

new RuntimeEnvironment().assertSupported();
const plugins = new EditorComposition().createPluginRegistry();
const loader = new PluginLoader(plugins, message => process.stderr.write(`error: ${message}\n`));
const args = process.argv.slice(2);
const configIndex = args.indexOf('--config');
const useCode = args.includes('--code-plugins');
if (configIndex >= 0) {
  const file = args[configIndex + 1];
  if (file === undefined || file.startsWith('--') || useCode || args.lastIndexOf('--config') !== configIndex) {
    process.stderr.write('error: invalid plugin config\n');
  } else { await loader.loadConfig(file); }
} else if (useCode) {
  const { CodePlugins } = await import('./CodePlugins.js');
  await new CodePlugins().load(loader);
}
const editor = new EditorComposition(plugins);
if (process.argv.includes('--check')) {
  editor.createController();
  process.stdout.write(`编辑器组装检查通过（Node.js ${process.versions.node}）。\n`);
} else {
  try { await editor.createRepl().start(process.stdin, process.stdout); }
  catch (error) {
    process.stderr.write(`error: ${error instanceof Error ? error.message.replace(/[\r\n]+/g, ' ') : 'unexpected failure'}\n`);
    process.exitCode = 1;
  }
}
