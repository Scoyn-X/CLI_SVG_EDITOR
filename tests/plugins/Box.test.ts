import { it, expect } from 'vitest';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';
import { PluginManifest } from '../../src/bootstrap/PluginManifest.js';
import { EditorSession } from '../../src/application/EditorSession.js';
import { CliController } from '../../src/adapters/cli/CliController.js';
import { CliPresenter } from '../../src/adapters/cli/CliPresenter.js';
import { BoxPlugin } from '../../src/plugins/box/BoxPlugin.js';
import manifest from '../../src/plugins/box/package.json' with { type: 'json' };
it('box preserves composite invariants, transactions, history and SVG round trips', async () => {
 const registry = new EditorComposition().createPluginRegistry();
 await registry.install(PluginManifest.parse(manifest), new BoxPlugin(), undefined);
 const composition = new EditorComposition(registry); const session = new EditorSession(); let xml = '';
 const storage = { resolve: (p: string) => p, read: () => xml, write: (_p: string, data: string) => { xml = data; } };
 const cli = new CliController(composition.createDispatcher(composition.createFactory(), storage),session,new CliPresenter(registry.treeDecorators()));
 cli.executeLine('init');
 expect(cli.executeLine('create box n 120 100 160 60 "开始"')[0]).toContain('box#n created (g#n + rect#n-rect + text#n-label)');
 expect(cli.executeLine('tree n')[0]).toBe('g#n (box)');
 cli.executeLine('move n 0 100'); expect(session.describeShape('n-label').getAttributes()['y']).toBe(235);
 cli.executeLine('undo'); cli.executeLine('redo'); cli.executeLine('undo');
 for (const input of ['set n fill red', 'set n label "处理数据"']) {
 const before = session.describe(); cli.executeLine(input); const after = session.describe(); cli.executeLine('undo'); expect(session.describe()).toEqual(before); cli.executeLine('redo'); expect(session.describe()).toEqual(after);
 }
 for (const input of ['delete n-rect','group steal n-label','addto n n-label','ungroup n']) {
 const before = session.describe(); const result = cli.executeLine(input);
 if (input.startsWith('addto')) { expect(result[0]).not.toContain('error:'); } else { expect(result[0]).toContain('error:'); expect(session.describe()).toEqual(before); }
 }
 cli.executeLine('create rect collision-label 0 0 1 1'); const before = session.describe(); const history = session.getHistoryStatus();
 expect(cli.executeLine('create box collision 0 0 1 1 "x"')[0]).toContain('id already exists'); expect(session.describe()).toEqual(before); expect(session.getHistoryStatus()).toEqual(history);
 cli.executeLine('create box nested 1 2 3 4 "child" in n'); cli.executeLine('scale n 2'); cli.executeLine('undo');
 cli.executeLine('save fixture.svg'); const good = xml; cli.executeLine('init'); cli.executeLine('read fixture.svg'); expect(session.describeShape('n').getType()).toBe('box');
 const plain = new EditorSession(); const base = new EditorComposition(); new CliController(base.createDispatcher(base.createFactory(),storage),plain).executeLine('read fixture.svg'); expect(plain.describeShape('n').getType()).toBe('g');
 for (const broken of [good.replace('id="n-rect"','id="other"'),good.replace('<rect id="n-rect"','<circle id="n-rect"'),good.replace('id="n-label"','id="n-rect"')]) {
 xml = broken; const previous = session.describe(); expect(cli.executeLine('read fixture.svg')[0]).toContain('error:'); expect(session.describe()).toEqual(previous);
 }
 cli.executeLine('delete n'); cli.executeLine('undo'); expect(session.describeShape('n').getType()).toBe('box');
});

