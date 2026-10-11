import { RuntimeEnvironment } from './RuntimeEnvironment.js';

new RuntimeEnvironment().assertSupported();
process.stdout.write(`工程基础已就绪（Node.js ${process.versions.node}）；SVG CLI 尚未实现。\n`);
