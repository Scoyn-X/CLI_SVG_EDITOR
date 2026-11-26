import assert from 'node:assert/strict';
import { createRequire, registerHooks } from 'node:module';
import { test } from 'node:test';
import { URL } from 'node:url';
import { FileType, registrations } from './vscode-test-double.mjs';

const host = new URL('./vscode-test-double.mjs', import.meta.url).href;
const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    return specifier === 'vscode' ? { url: host, shortCircuit: true } : nextResolve(specifier, context);
  },
});
const require = createRequire(import.meta.url);
const { activate } = require('../dist/extension.js');
hook.deregister();

const subscriptions = [];
activate({ subscriptions });
const [decorationRegistration, outlineRegistration] = registrations;
const token = { isCancellationRequested: false };
const outline = outlineRegistration.provider;

test('activation registers Explorer and native Outline providers for SVG', () => {
  assert.equal(subscriptions.length, 2);
  assert.ok(subscriptions.every(item => typeof item.dispose === 'function'));
  assert.deepEqual(outlineRegistration.selector, { pattern: '**/*.[sS][vV][gG]' });
});

test('decoration only marks SVG files and tolerates stat failures and cancellation', async () => {
  const provider = decorationRegistration.provider;
  const file = Object.freeze({ path: '/root/image.SVG', type: FileType.File });
  assert.equal((await provider.provideFileDecoration(file, token)).badge, '[]');
  assert.equal(await provider.provideFileDecoration({ path: '/folder.svg', type: FileType.Directory }, token), undefined);
  assert.equal(await provider.provideFileDecoration({ path: '/notes.txt', type: FileType.File }, token), undefined);
  assert.equal(await provider.provideFileDecoration({ path: '/missing.svg', error: Error('missing') }, token), undefined);
  assert.equal(await provider.provideFileDecoration(file, { isCancellationRequested: true }), undefined);
  const cancelled = { isCancellationRequested: false };
  const pending = provider.provideFileDecoration(file, cancelled);
  cancelled.isCancellationRequested = true;
  assert.equal(await pending, undefined);
  assert.equal(file.path, '/root/image.SVG');
});

test('outline contains nested symbols and selects tag names at exact UTF-16 offsets', () => {
  const source = '\uFEFF<?xml version="1.0"?>\r\n<svg xmlns="http://www.w3.org/2000/svg">\r\n' +
    '<g id="outer"><g id="inner"><text>😀<![CDATA[<fake/>]]></text><!-- <fake/> -->' +
    '<rect id="x&amp;y" data-value=">"/></g></g></svg>';
  const [root] = outline.provideDocumentSymbols({ getText: () => source, positionAt: offset => offset }, token);
  assert.equal(root.name, 'svg');
  const [outer] = root.children;
  const [inner] = outer.children;
  assert.equal(outer.name, 'g#outer');
  assert.equal(inner.name, 'g#inner');
  assert.deepEqual(inner.children.map(child => child.name), ['text', 'rect#x&y']);
  const [text, rect] = inner.children;
  assert.equal(source.slice(text.range.start, text.range.end), '<text>😀<![CDATA[<fake/>]]></text>');
  assert.equal(source.slice(rect.range.start, rect.range.end), '<rect id="x&amp;y" data-value=">"/>');
  assert.equal(source.slice(rect.selectionRange.start, rect.selectionRange.end), 'rect');
  assert.equal(rect.selectionRange.start, source.indexOf('<rect') + 1);
  assert.equal(root.range.end, source.length);
});

test('outline recomputes after edits and recovers from invalid XML', () => {
  let source = '<s:svg xmlns:s="http://www.w3.org/2000/svg"><s:g id="old"/></s:svg>';
  const document = { getText: () => source, positionAt: offset => offset };
  assert.equal(outline.provideDocumentSymbols(document, token)[0].children[0].name, 's:g#old');
  for (const invalid of ['<svg><g id="new"', '<svg><g></svg>', '<root/>', '<!DOCTYPE svg><svg/>']) {
    source = invalid;
    assert.deepEqual(outline.provideDocumentSymbols(document, token), []);
  }
  source = '<svg><g id="new"/><text/></svg>';
  assert.deepEqual(outline.provideDocumentSymbols(document, token)[0].children.map(child => child.name), ['g#new', 'text']);
});
