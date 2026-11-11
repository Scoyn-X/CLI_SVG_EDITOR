import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';
import { PluginLoader } from '../../src/bootstrap/PluginLoader.js';

const parent = resolve('artifacts');
let directory: string;

beforeEach(() => {
  mkdirSync(parent, { recursive: true });
  directory = mkdtempSync(join(realpathSync(parent), 'plugin-loader-'));
});

afterEach(() => {
  expect(dirname(realpathSync(directory))).toBe(realpathSync(parent));
  rmSync(directory, { recursive: true, force: true });
});

function plugin(path: string, name: string, commands: string[], source: string) {
  const folder = join(directory, path);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, 'package.json'), JSON.stringify({ name, type: 'module', main: './index.js', contributes: { commands } }));
  writeFileSync(join(folder, 'index.js'), source);
}

function config(entries: unknown[]) {
  const path = join(directory, 'plugins.json');
  writeFileSync(path, JSON.stringify({ plugins: entries }));
  return path;
}

function register(name: string, result: string) {
  return `ctx.registerCommand(${JSON.stringify(name)}, {
    getUsage() { return ${JSON.stringify(name)}; },
    create() { return { execute() { return { getWarnings: () => [], render: () => [${result}] }; } }; }
  });`;
}

describe('config plugin activation', () => {
  it('resolves import-only package exports relative to the config, then releases its resolution hook', async () => {
    const registry = new EditorComposition().createPluginRegistry();
    const diagnostics: string[] = [];
    const loader = new PluginLoader(registry, message => diagnostics.push(message));
    plugin('node_modules/@fixture/import-only', '@fixture/import-only', ['esm'],
      `export default { activate(ctx) { ${register('esm', '"esm"')} } };`);
    writeFileSync(join(directory, 'node_modules/@fixture/import-only/package.json'), JSON.stringify({
      name: '@fixture/import-only', type: 'module', exports: { import: './index.js' }, contributes: { commands: ['esm'] },
    }));
    await loader.loadConfig(config([{ module: '@fixture/import-only' }]));
    expect(diagnostics).toEqual([]);
    expect(new EditorComposition(registry).createController().executeLine('esm')).toEqual(['esm']);
    expect(import.meta.resolve('./PluginLoader.test.ts')).toBe(new URL('./PluginLoader.test.ts', import.meta.url).href);
  });

  it('resolves relative and installed modules, skips disabled entries and rolls back all failing contributions', async () => {
    const registry = new EditorComposition().createPluginRegistry();
    const diagnostics: string[] = [];
    const loader = new PluginLoader(registry, message => diagnostics.push(message));
    plugin('first', 'first', ['first'], `export default { activate(ctx, options) { ${register('first', 'options.message')} } };`);
    plugin('node_modules/@fixture/last', '@fixture/last', ['last'], `export default { activate(ctx) { ${register('last', '"last"')} } };`);
    plugin('no-default', 'no-default', [], 'export const ignored = true;');
    plugin('throws', 'throws', ['partial'], `export default { async activate(ctx) { await Promise.resolve(); ${register('partial', '0')} throw new Error('broken'); } };`);
    plugin('duplicate', 'duplicate', ['first', 'leaked'], `export default { activate(ctx) { ${register('leaked', '0')} try { ${register('first', '0')} } catch {} } };`);
    plugin('builtin', 'builtin', ['init'], `export default { activate(ctx) { ${register('init', '0')} } };`);
    plugin('mismatch', 'mismatch', ['declared'], `export default { activate(ctx) { ${register('actual', '0')} } };`);
    plugin('dependency', 'dependency', [], 'import "./missing-dependency.js"; export default { activate() {} };');

    await loader.loadConfig(config([
      { module: './first', options: { message: 'selected' } },
      { module: './skipped', enabled: false }, { module: './not-found' }, { module: './no-default' },
      { module: './throws' }, { module: './duplicate' }, { module: './builtin' }, { module: './mismatch' },
      { module: './dependency' }, { module: '@fixture/last' },
    ]));
    expect(diagnostics).toEqual([
      'plugin not found: ./not-found',
      'plugin has no default export: ./no-default',
      'plugin failed to activate: throws (broken)',
      'duplicate registration: commands/first',
      'duplicate registration: commands/init',
      'plugin manifest mismatch: mismatch (declared: {"shapes":[],"commands":["declared"],"decorators":[],"attributes":[]}, registered: {"shapes":[],"commands":["actual"],"decorators":[],"attributes":[]})',
      expect.stringMatching(/^plugin failed to activate: dependency \(.*missing-dependency\.js/),
    ]);
    expect(registry.commandEntries().map(([name]) => name)).toEqual(['first', 'last']);
    const cli = new EditorComposition(registry).createController();
    expect(cli.executeLine('first')).toEqual(['selected']);
    expect(cli.executeLine('last')).toEqual(['last']);
    expect(cli.executeLine('partial')).toEqual(['error: unknown command: partial']);
    expect(cli.executeLine('init')).toEqual(['canvas 800x600 created']);
  });

  it('validates the complete configuration before loading any module', async () => {
    const registry = new EditorComposition().createPluginRegistry();
    const diagnostics: string[] = [];
    const loader = new PluginLoader(registry, message => diagnostics.push(message));
    await loader.loadConfig(config([{ module: './missing' }, { module: './bad', enabled: 'yes' }]));
    const path = join(directory, 'broken.json');
    writeFileSync(path, '{');
    await loader.loadConfig(path);
    expect(diagnostics).toEqual(['invalid plugin config', 'invalid plugin config']);
    expect(registry.commandEntries()).toEqual([]);
  });
});
