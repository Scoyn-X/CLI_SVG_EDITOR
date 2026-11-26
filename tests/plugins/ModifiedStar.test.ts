import { it, expect } from 'vitest';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';
import { PluginManifest } from '../../src/bootstrap/PluginManifest.js';
import { EditorSession } from '../../src/application/EditorSession.js';
import { CliController } from '../../src/adapters/cli/CliController.js';
import { CliPresenter } from '../../src/adapters/cli/CliPresenter.js';
import { ModifiedStarPlugin } from '../../src/plugins/modified-star/ModifiedStarPlugin.js';
import { ModifiedStar } from '../../src/plugins/modified-star/ModifiedStar.js';

async function fixture() {
 const registry=new EditorComposition().createPluginRegistry();await registry.install(PluginManifest.parse({name:'star',contributes:{decorators:['modified-star']}}),new ModifiedStarPlugin(),undefined);
 const composition=new EditorComposition(registry),session=new EditorSession();let fail=false;
 const storage={resolve:(p:string)=>p,read:()=>'',write:()=>{if(fail)throw new Error('failed');}};
 const cli=new CliController(composition.createDispatcher(composition.createFactory(),storage),session,new CliPresenter(registry.treeDecorators()));
 cli.executeLine('init');return {cli,session,failSave:()=>{fail=true;}};
}
it('keeps init clean and marks new nodes and ancestors',async()=>{
 const {cli}=await fixture();expect(cli.executeLine('tree')).toEqual(['svg (800x600)']);cli.executeLine('create g outer');cli.executeLine('create rect r 0 0 1 1 in outer');expect(cli.executeLine('tree').every(line=>line.endsWith('*'))).toBe(true);
});
it('clears at save and undo to the saved content, then marks redo',async()=>{
 const {cli}=await fixture();cli.executeLine('create rect r 0 0 1 1');cli.executeLine('save fixture.svg');expect(cli.executeLine('tree').some(line=>line.endsWith('*'))).toBe(false);cli.executeLine('move r 1 0');expect(cli.executeLine('tree').every(line=>line.endsWith('*'))).toBe(true);cli.executeLine('undo');expect(cli.executeLine('tree').some(line=>line.endsWith('*'))).toBe(false);cli.executeLine('redo');expect(cli.executeLine('tree')[0]).toContain('*');
});
it('preserves the clean baseline on failed save',async()=>{
 const {cli,session,failSave}=await fixture();cli.executeLine('create rect r 0 0 1 1');cli.executeLine('save fixture.svg');cli.executeLine('move r 1 0');const saved=session.describeSaved(),history=session.getHistoryStatus();failSave();expect(cli.executeLine('save bad.svg')[0]).toContain('error:');expect(session.describeSaved()).toBe(saved);expect(session.getHistoryStatus()).toEqual(history);expect(cli.executeLine('tree')[0]).toContain('*');
});
it('propagates deletion to ancestors and clears after undo',async()=>{
 const {cli}=await fixture();cli.executeLine('create g outer');cli.executeLine('create rect r 0 0 1 1 in outer');cli.executeLine('save fixture.svg');cli.executeLine('delete r');expect(cli.executeLine('tree outer')[0]).toBe('g#outer *');cli.executeLine('undo');expect(cli.executeLine('tree').some(line=>line.endsWith('*'))).toBe(false);
});
it('marks canvas changes and resets on init',async()=>{
 const {cli}=await fixture();cli.executeLine('canvas 900 600');expect(cli.executeLine('tree')[0]).toContain('*');cli.executeLine('init');expect(cli.executeLine('tree')[0]).not.toContain('*');
});
it('isolates decorator instances and already prepared render callbacks',async()=>{
 const {cli,session}=await fixture();const star=new ModifiedStar(),clean=star.prepare(session.describe(),session.describeSaved());cli.executeLine('create g outer');expect(star.prepare(session.describe(),session.describeSaved())()).toBe('*');expect(clean()).toBeUndefined();expect(new ModifiedStar().prepare(session.describe(),session.describe())()).toBeUndefined();
});
