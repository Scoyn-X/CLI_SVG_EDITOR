import { RuntimeEnvironment } from './RuntimeEnvironment.js';
import { EditorComposition } from './EditorComposition.js';

new RuntimeEnvironment().assertSupported();
const editor = new EditorComposition();
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
