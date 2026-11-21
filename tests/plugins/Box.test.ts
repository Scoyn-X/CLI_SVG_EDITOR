import { it, expect } from 'vitest';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';
import { PluginManifest } from '../../src/bootstrap/PluginManifest.js';
import { EditorSession } from '../../src/application/EditorSession.js';
import { CliController } from '../../src/adapters/cli/CliController.js';
import { CliPresenter } from '../../src/adapters/cli/CliPresenter.js';
import { BoxPlugin } from '../../src/plugins/box/BoxPlugin.js';
import manifest from '../../src/plugins/box/package.json' with { type: 'json' };

async function fixture() {
 const registry = new EditorComposition().createPluginRegistry();
 await registry.install(PluginManifest.parse(manifest),new BoxPlugin(),undefined);
 const composition = new EditorComposition(registry), session = new EditorSession(); let xml = '';
 const storage = {resolve:(p:string)=>p,read:()=>xml,write:(_p:string,data:string)=>{xml=data;}};
 const cli = new CliController(composition.createDispatcher(composition.createFactory(),storage),session,new CliPresenter(registry.treeDecorators()));
 cli.executeLine('init'); cli.executeLine('create box n 120 100 160 60 "开始"');
 return {cli,session,getXml:()=>xml,setXml:(value:string)=>{xml=value;},storage};
}
it('creates the box template and type label',async()=>{
 const {cli,session}=await fixture(); expect(cli.executeLine('tree n')[0]).toBe('g#n (box)'); expect(session.describeShape('n-label').getAttributes()['y']).toBe(135);
});
it('rejects subtree id conflicts without consuming redo',async()=>{
 const {cli,session}=await fixture();cli.executeLine('create rect collision-label 0 0 1 1');cli.executeLine('move n 1 0');cli.executeLine('undo');
 const before=session.describe(),history=session.getHistoryStatus();expect(cli.executeLine('create box collision 0 0 1 1 "x"')[0]).toContain('id already exists');expect(session.describe()).toEqual(before);expect(session.getHistoryStatus()).toEqual(history);expect(cli.executeLine('redo')[0]).toContain('box#n moved');
});
it('moves and scales a nested box with semantic feedback and exact undo',async()=>{
 const {cli,session}=await fixture();cli.executeLine('create box nested 1 2 3 4 "child" in n'); const before=session.describe();
 expect(cli.executeLine('scale n 2')).toEqual(['box#n scaled by 2']);expect(cli.executeLine('undo')).toEqual(['box#n scaling undone']);expect(session.describe()).toEqual(before);
 expect(cli.executeLine('move n 0 100')).toEqual(['box#n moved by (0,100)']);expect(session.describeShape('n-label').getAttributes()['y']).toBe(235);
});
it.each(['set n fill red','set n label "处理数据"'])('records one undo unit for %s',async input=>{
 const {cli,session}=await fixture(); const before=session.describe();cli.executeLine(input);const after=session.describe();cli.executeLine('undo');expect(session.describe()).toEqual(before);cli.executeLine('redo');expect(session.describe()).toEqual(after);
});
it.each(['delete n-rect','group steal n-label','addto n n-label','addto n n-rect','addto target n-label','ungroup n','front n-rect','back n-label'])('rejects protected structure edits: %s',async input=>{
 const {cli,session}=await fixture();cli.executeLine('create g target');cli.executeLine('move n 1 0');cli.executeLine('undo');const before=session.describe(),history=session.getHistoryStatus();expect(cli.executeLine(input)[0]).toContain('error:');expect(session.describe()).toEqual(before);expect(session.getHistoryStatus()).toEqual(history);expect(cli.executeLine('redo')[0]).toContain('box#n moved');
});
it('deletes and restores the complete semantic box',async()=>{
 const {cli,session}=await fixture();const before=session.describe();expect(cli.executeLine('delete n')).toEqual(['box#n deleted']);expect(cli.executeLine('undo')).toEqual(['box#n restored into svg']);expect(session.describe()).toEqual(before);
 expect(cli.executeLine('set n stroke red')).toEqual(['box#n updated: stroke="red"']);
});
it('round trips and degrades to an ordinary g without the plugin',async()=>{
 const {cli,session,storage}=await fixture();cli.executeLine('save fixture.svg');cli.executeLine('init');cli.executeLine('read fixture.svg');expect(session.describeShape('n').getType()).toBe('box');
 const plain=new EditorSession(),base=new EditorComposition();new CliController(base.createDispatcher(base.createFactory(),storage),plain).executeLine('read fixture.svg');expect(plain.describeShape('n').getType()).toBe('g');expect(plain.describeShape('n').getChildren()).toHaveLength(2);
});
it.each(['missing','wrong','duplicate'])('rejects %s imported parts atomically',async variant=>{
 const {cli,session,getXml,setXml}=await fixture();cli.executeLine('save fixture.svg');const good=getXml();setXml(variant==='missing'?good.replace('id="n-rect"','id="other"'):variant==='wrong'?good.replace('<rect id="n-rect"','<circle id="n-rect"'):good.replace('id="n-label"','id="n-rect"'));const before=session.describe(),history=session.getHistoryStatus();expect(cli.executeLine('read fixture.svg')[0]).toContain('error:');expect(session.describe()).toEqual(before);expect(session.getHistoryStatus()).toEqual(history);
});
it('preserves container inheritance while fill editing targets the frame',async()=>{
 const {cli,session,getXml,setXml}=await fixture();cli.executeLine('save fixture.svg');setXml(getXml().replace('data-kind="box"','data-kind="box" fill="red"'));cli.executeLine('read fixture.svg');cli.executeLine('set n fill blue');
 expect(session.describeShape('n').getAttributes()['fill']).toBe('red');expect(session.describeShape('n-rect').getAttributes()['fill']).toBe('blue');expect(cli.executeLine('show n')).toContain('  fill=red');
 cli.executeLine('save again.svg');expect(getXml()).toContain('fill="red"');expect(getXml()).toContain('fill="blue"');
});

it('uses the semantic parent type while showing the SVG element itself', async () => {
  const { cli } = await fixture();
  expect(cli.executeLine('show n-label')[0]).toBe('text#n-label  parent=box#n');
  expect(cli.executeLine('show n')[0]).toBe('g#n  parent=svg');
});

it('still allows explicit ordering of optional children and ordinary groups', async () => {
  const { cli, session } = await fixture();
  cli.executeLine('create circle extra 0 0 1 in n');
  expect(cli.executeLine('back extra')).toEqual(['circle#extra moved to back']);
  expect(session.describeShape('n').getChildren().map(child => child.getId())).toEqual(['extra', 'n-rect', 'n-label']);
  expect(cli.executeLine('front extra')).toEqual(['circle#extra moved to front']);
  cli.executeLine('create g ordinary');
  cli.executeLine('create rect first 0 0 1 1 in ordinary');
  cli.executeLine('create rect second 0 0 1 1 in ordinary');
  expect(cli.executeLine('front first')).toEqual(['rect#first moved to front']);
  expect(session.describeShape('ordinary').getChildren().map(child => child.getId())).toEqual(['second', 'first']);
});
