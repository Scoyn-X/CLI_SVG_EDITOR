import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import {spawnSync,execFileSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,cpSync,rmSync,realpathSync,readdirSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import process from 'node:process';
const [aArg,bArg] = process.argv.slice(2);
assert.ok(aArg && bArg,'Usage: node compare.mjs <demo entry> <mainline entry> (from repository root)');
const a=resolve(aArg),b=resolve(bArg), out=resolve('doc/evidence/phase2/assembly-a');
mkdirSync('artifacts',{recursive:true});const parent=realpathSync('artifacts'),scratch=mkdtempSync(join(parent,'assembly-a-'));
const cases=readdirSync('doc/transcript/phase1/inputs').filter(n=>n.endsWith('.txt')).map(n=>[n,readFileSync('doc/transcript/phase1/inputs/'+n)]);
cases.push(['cli-1b.txt',readFileSync('doc/transcript/phase2/inputs/cli-1b.txt')],['commands.txt',Buffer.from('dir\ninit\ncreate box n 1 2 3 4 "title"\nstats\nhelp\n')]);
try {
 const config=join(scratch,'plugins.json');writeFileSync(config,JSON.stringify({plugins:['stats','dir','box'].map(n=>({module:resolve(dirname(b),'../plugins',n)}))}));
 const summary=[];
 for(const [name,input] of cases){
  const cwd=join(scratch,name);const runs=[];
  for(const [label,entry,args] of [['a',a,['--code-plugins']],['b',b,['--config',config]]]){
   cpSync('doc/transcript/phase1/fixtures',cwd,{recursive:true});mkdirSync(join(cwd,'artifacts'));
   const child=spawnSync(process.execPath,[entry,...args],{cwd,input,timeout:15000});if(child.error)throw child.error;assert.equal(child.status,0);assert.equal(child.stderr.length,0);
   writeFileSync(join(out,name+'-'+label+'.stdout'),child.stdout);writeFileSync(join(out,name+'-'+label+'.stderr'),child.stderr);
   const files=readdirSync(join(cwd,'artifacts')).sort().map(n=>[n,readFileSync(join(cwd,'artifacts',n)).toString('base64')]);writeFileSync(join(out,name+'-'+label+'.artifacts.json'),JSON.stringify(files,null,2)+'\n');runs.push({stdout:child.stdout,stderr:child.stderr,status:child.status,files});
   assert.equal(dirname(realpathSync(cwd)),scratch);rmSync(cwd,{recursive:true,force:true});
  }
  assert.deepEqual(runs[0],runs[1],name);summary.push(name+' A/B OK (stdout, stderr, exit 0, '+runs[0].files.length+' SVG)');
 }
 writeFileSync(join(out,'comparison.txt'),summary.join('\n')+'\n');process.stdout.write(summary.join('\n')+'\n');
 const paths=execFileSync('git',['ls-tree','-r','--name-only','d2722d5','--','src/plugins/box'],{encoding:'utf8'}).trim().split('\n');
 for(const path of paths){assert.ok(execFileSync('git',['show','d2722d5:'+path]).equals(readFileSync(resolve(dirname(a),'../../',path))),path+' package bytes');}
 process.stdout.write('Final box package bytes match d2722d5\n');
}finally{assert.equal(dirname(realpathSync(scratch)),parent);rmSync(scratch,{recursive:true,force:true});}
