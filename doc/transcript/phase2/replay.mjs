import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

if (process.argv.length !== 4) { throw new Error('Usage: node replay.mjs <compiled CLI entry> <plugin config>'); }
const entry = realpathSync(process.argv[2]);
const config = realpathSync(process.argv[3]);
const suite = fileURLToPath(new URL('../phase1/', import.meta.url));
const parent = resolve('artifacts');
mkdirSync(parent, { recursive: true });
const scratchParent = realpathSync(parent);
const scratch = mkdtempSync(join(scratchParent, 'phase2-assembly-'));

// A and B use exactly the same cwd, restored fixtures and plugin order (stats, dir).
try {
  for (const input of readdirSync(join(suite, 'inputs')).filter(name => name.endsWith('.txt')).sort()) {
    const cwd = join(scratch, input);
    const output = join(cwd, 'artifacts');
    const run = args => {
      cpSync(join(suite, 'fixtures'), cwd, { recursive: true });
      if (existsSync(output)) {
        assert.equal(dirname(realpathSync(output)), realpathSync(cwd));
        rmSync(output, { recursive: true });
      }
      mkdirSync(output);
      const child = spawnSync(process.execPath, [entry, ...args], {
        cwd, input: readFileSync(join(suite, 'inputs', input)), timeout: 10000, windowsHide: true,
      });
      if (child.error) { throw child.error; }
      assert.equal(child.signal, null, `${input}: signal`);
      assert.equal(child.status, 0, `${input}: exit code`);
      assert.equal(child.stderr.length, 0, `${input}: plugin startup must succeed`);
      return { child, files: new Map(readdirSync(output).sort().map(name => [name, readFileSync(join(output, name))])) };
    };
    const a = run(['--code-plugins']);
    const b = run(['--config', config]);
    assert.equal(a.child.status, b.child.status, `${input}: exit code`);
    assert.ok(a.child.stdout.equals(b.child.stdout), `${input}: stdout bytes`);
    assert.ok(a.child.stderr.equals(b.child.stderr), `${input}: stderr bytes`);
    assert.deepEqual([...a.files.keys()], [...b.files.keys()], `${input}: artifact names`);
    for (const [name, bytes] of a.files) { assert.ok(bytes.equals(b.files.get(name)), `${input}: ${name} bytes`); }
    process.stdout.write(`${input} A/B OK (${a.files.size} SVG)\n`);
  }
} finally {
  assert.equal(dirname(realpathSync(scratch)), scratchParent);
  assert.equal(realpathSync(scratch), scratch);
  rmSync(scratch, { recursive: true, force: true });
}
