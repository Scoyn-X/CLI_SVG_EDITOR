import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const [entryArgument, mode, captureArgument, ...extra] = process.argv.slice(2);
if (!entryArgument || extra.length || (mode !== undefined && (mode !== '--capture' || !captureArgument))) {
  throw new Error('Usage: node replay.mjs <compiled CLI entry> [--capture <new directory>]');
}

const entry = realpathSync(entryArgument);
const suite = fileURLToPath(new URL('.', import.meta.url));
const expected = join(suite, 'expected');
const capture = captureArgument === undefined ? undefined : resolve(captureArgument);
const inputs = readdirSync(join(suite, 'inputs')).filter(name => name.endsWith('.txt')).sort();
assert.ok(inputs.length > 0, 'No replay inputs');

const snapshots = capture === undefined ? JSON.parse(readFileSync(join(expected, 'results.json'), 'utf8')) : {};
if (capture === undefined) {
  assert.deepEqual(Object.keys(snapshots).sort(), inputs, 'Snapshot inputs differ');
} else {
  mkdirSync(capture);
  mkdirSync(join(capture, 'svg'));
}

function checkBytes(actual, expectedBytes, label) {
  if (actual.equals(expectedBytes)) { return; }
  const commonLength = Math.min(actual.length, expectedBytes.length);
  let offset = 0;
  while (offset < commonLength && actual[offset] === expectedBytes[offset]) { offset += 1; }
  throw new Error(`${label} differs at byte ${offset} (expected ${expectedBytes.length} bytes, got ${actual.length})`);
}

const artifacts = resolve('artifacts');
mkdirSync(artifacts, { recursive: true });
const scratchParent = realpathSync(artifacts);
const scratch = mkdtempSync(join(scratchParent, 'phase1-replay-'));
try {
  for (const inputName of inputs) {
    const cwd = join(scratch, inputName);
    const outputs = join(cwd, 'artifacts');
    cpSync(join(suite, 'fixtures'), cwd, { recursive: true });
    mkdirSync(outputs);

    const result = spawnSync(process.execPath, [entry], {
      cwd,
      input: readFileSync(join(suite, 'inputs', inputName)),
      timeout: 10000,
      windowsHide: true,
    });
    if (result.error) { throw result.error; }
    assert.equal(result.signal, null, `${inputName} terminated by signal`);
    const svg = readdirSync(outputs).sort();
    if (capture === undefined) {
      const snapshot = snapshots[inputName];
      assert.equal(result.status, snapshot.exitCode, `${inputName} exit code`);
      checkBytes(result.stdout, Buffer.from(snapshot.stdout), `${inputName} stdout`);
      checkBytes(result.stderr, Buffer.from(snapshot.stderr), `${inputName} stderr`);
      assert.deepEqual(svg, snapshot.svg, `${inputName} generated file names`);
      for (const name of svg) {
        checkBytes(readFileSync(join(outputs, name)), readFileSync(join(expected, 'svg', name)), `${inputName} ${name}`);
      }
    } else {
      assert.equal(result.status, 0, `${inputName} baseline process exit code`);
      const stdout = result.stdout.toString('utf8');
      const stderr = result.stderr.toString('utf8');
      checkBytes(result.stdout, Buffer.from(stdout), `${inputName} stdout UTF-8 round trip`);
      checkBytes(result.stderr, Buffer.from(stderr), `${inputName} stderr UTF-8 round trip`);
      snapshots[inputName] = { exitCode: result.status, stdout, stderr, svg };
      for (const name of svg) {
        writeFileSync(join(capture, 'svg', name), readFileSync(join(outputs, name)), { flag: 'wx' });
      }
    }
    process.stdout.write(`${inputName} OK (${svg.length} SVG)\n`);
  }
  if (capture !== undefined) {
    writeFileSync(join(capture, 'results.json'), `${JSON.stringify(snapshots, null, 2)}\n`, { flag: 'wx' });
  }
} finally {
  const resolvedScratch = realpathSync(scratch);
  assert.equal(dirname(resolvedScratch), scratchParent, 'Replay scratch directory escaped artifacts');
  assert.equal(resolvedScratch, scratch, 'Replay scratch directory changed');
  rmSync(resolvedScratch, { recursive: true, force: true });
}
