import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, realpathSync, rmSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import process from 'node:process';
const parent = resolve('artifacts'); mkdirSync(parent,{recursive:true});
const scratch = mkdtempSync(join(realpathSync(parent),'production-'));
const expected = resolve('doc/transcript/phase2/expected-production.json');
const results = {};
try {
 const entry = resolve('dist/bootstrap/main.js');
 for (const [name,plugins] of [['box-only',['box']],['star-only',['modified-star']],['both',['box','modified-star']],['assembly',['stats','dir','box','modified-star']]]) {
  const cwd = join(scratch,name); mkdirSync(cwd); mkdirSync(join(cwd,'artifacts'));
  const config=join(scratch,name+'.json'); writeFileSync(config,JSON.stringify({plugins:plugins.map(plugin=>({module:resolve('dist/plugins',plugin)}))}));
  const input=name==='star-only' ? 'init\ncreate rect r 1 2 3 4\ntree\nsave artifacts/simple.svg\ntree\nmove r 1 0\ntree\nundo\ntree\n' : readFileSync('doc/transcript/phase2/inputs/cli-1b.txt');
  const run=args=>spawnSync(process.execPath,[entry,...args],{cwd,input,timeout:10000});
  const b=run(['--config',config]); assert.equal(b.status,0); assert.equal(b.stderr.length,0); assert.ok(!b.stdout.toString().includes('error:'));
  if(name==='assembly') { const a=run(['--code-plugins']); assert.equal(a.status,b.status); assert.ok(a.stdout.equals(b.stdout)); assert.ok(a.stderr.equals(b.stderr)); }
  results[name]={stdout:b.stdout.toString('base64'),stderr:b.stderr.toString('base64'),exitCode:b.status,svg:readFileSync(join(cwd,'artifacts',name==='star-only'?'simple.svg':'flowchart-box.svg')).toString('base64')};
 }
 if(process.argv.includes('--capture')) { writeFileSync(expected,JSON.stringify(results,null,2)+'\n'); }
 else { assert.deepEqual(results,JSON.parse(readFileSync(expected,'utf8'))); }
 process.stdout.write('production replay OK: box-only, star-only, both, A/B version B\n');
} finally { assert.equal(dirname(realpathSync(scratch)),realpathSync(parent)); rmSync(scratch,{recursive:true,force:true}); }
