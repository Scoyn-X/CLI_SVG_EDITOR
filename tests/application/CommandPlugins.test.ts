import { describe, expect, it } from 'vitest';
import { EditorSession } from '../../src/application/EditorSession.js';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';
import { PluginManifest } from '../../src/bootstrap/PluginManifest.js';
import { DirCommand } from '../../src/plugins/dir/DirCommand.js';
import { DirPlugin } from '../../src/plugins/dir/DirPlugin.js';
import type { DirectoryEntry, DirectoryReader } from '../../src/plugins/dir/DirectoryReader.js';
import { StatsPlugin } from '../../src/plugins/stats/StatsPlugin.js';

class DirectoryDouble implements DirectoryReader {
  public constructor(private readonly entries: readonly DirectoryEntry[] | Error) {}
  public currentDirectory(): string { return '/fixed'; }
  public read(directory: string): readonly DirectoryEntry[] {
    expect(directory).toBe('/fixed');
    if (this.entries instanceof Error) { throw this.entries; }
    return this.entries;
  }
}

describe('independent command plugins', () => {
  it('stats traverses depth first and counts empty groups as containers', async () => {
    const registry = new EditorComposition().createPluginRegistry();
    await registry.install(PluginManifest.parse({ name: 'stats', contributes: { commands: ['stats'] } }), new StatsPlugin(), undefined);
    const session = new EditorSession();
    const cli = new EditorComposition(registry).createController(session);
    expect(cli.executeLine('stats')).toEqual(["error: no document. use 'init' or 'read' first"]);
    cli.executeLine('init');
    expect(cli.executeLine('stats')).toEqual(['(total 0, containers 0)']);
    for (const input of ['create g outer', 'create g empty in outer', 'create circle c 1 2 3 in outer',
      'create rect a 1 2 3 4', 'create circle b 2 3 4', 'create text t 1 2 "title"']) {
      expect(cli.executeLine(input)[0]).not.toMatch(/^error:/);
    }
    const history = session.getHistoryStatus();
    expect(cli.executeLine('stats')).toEqual(['circle: 2  rect: 1  text: 1  (total 4, containers 2)']);
    expect(cli.executeLine('stats extra')).toEqual(['error: usage: stats']);
    expect(cli.executeLine('help')[0]?.split('\n')).toContain('stats');
    expect(cli.executeLine('dir')).toEqual(['error: unknown command: dir']);
    expect(session.getHistoryStatus()).toEqual(history);
  });

  it('dir formats a mixed directory deterministically and includes hidden entries', () => {
    const reader = new DirectoryDouble([
      { name: 'z.svg', type: 'file' }, { name: '.', type: 'directory' }, { name: '..', type: 'directory' },
      { name: 'b', type: 'directory' }, { name: '.hidden', type: 'file' }, { name: 'A', type: 'directory' },
      { name: 'link', type: 'other' },
    ]);
    const command = new DirCommand(reader);
    expect(command.execute().getSummary().split('\n')).toEqual(['[DIR]  A', '[DIR]  b', '[FILE]  .hidden', '[FILE]  z.svg', '[OTHER]  link']);
    expect(new DirCommand(new DirectoryDouble([])).execute().getSummary()).toBe('(empty directory)');
  });

  it.each([false, true])('dir stays outside document and history on success and failure (%s)', async fails => {
    const registry = new EditorComposition().createPluginRegistry();
    const reader = new DirectoryDouble(fails ? new Error('read failed') : []);
    await registry.install(PluginManifest.parse({ name: 'dir', contributes: { commands: ['dir'] } }), new DirPlugin(reader), undefined);
    const session = new EditorSession();
    const cli = new EditorComposition(registry).createController(session);
    const output = fails ? 'error: cannot read directory: /fixed' : '(empty directory)';
    expect(cli.executeLine('dir')).toEqual([output]);
    expect(cli.executeLine('dir nested')).toEqual(['error: usage: dir']);
    expect(cli.executeLine('stats')).toEqual(['error: unknown command: stats']);
    cli.executeLine('init');
    cli.executeLine('create rect r 0 0 1 1');
    cli.executeLine('move r 1 0');
    cli.executeLine('undo');
    const before = session.describe();
    const history = session.getHistoryStatus();
    const saved = session.describeSaved();
    expect(cli.executeLine('dir')).toEqual([output]);
    expect(session.describe()).toEqual(before);
    expect(session.describeSaved()).toBe(saved);
    expect(session.getHistoryStatus()).toEqual(history);
    expect(cli.executeLine('redo')).toEqual(['rect#r moved to (1,0)']);
    expect(cli.executeLine('help')[0]?.split('\n')).toContain('dir');
  });
});
