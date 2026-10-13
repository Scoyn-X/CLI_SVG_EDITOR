import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SourceConventionChecker } from './SourceConventionChecker.js';

const checker = new SourceConventionChecker();
const files = readdirSync(resolve('src'), { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.ts')).map(entry => resolve(entry.parentPath, entry.name));

describe('课程 OOP 源码规范与扫描器反例', () => {
  it('真实生产源码满足已定义的封装、文件、函数及分派检查', () => {
    const failures = files.flatMap(file => checker.check(file, readFileSync(file, 'utf8')).map(error => file + ': ' + error));
    expect(failures).toEqual([]);
  });

  it.each([
    { code: 'export class Probe { private value = 0; public read() { return this.value; } }' },
    { code: 'export class Probe { #value = 0; public read() { return this.#value; } }' },
    { code: 'export class Probe { public constructor(private readonly value: number) {} }' },
    { code: 'export interface Probe { read(): number; }' },
    { code: 'export class Probe { public static readonly key = Symbol(); }' },
    { code: 'export class Probe { private readonly shapes = new Map<string, Shape>(); public find(id: string) { return this.shapes.get(id); } }' },
  ])('合法内存样例 $code', ({ code }) => { expect(checker.check('Probe.ts', code)).toEqual([]); });

  it.each([
    { code: 'export class Probe {} class Other {}', error: 'multiple classes' },
    { code: 'export class Wrong {}', error: 'class/file name mismatch' },
    { code: 'export class Probe { public value = 0; }', error: 'unencapsulated property' },
    { code: 'export class Probe { protected value = 0; }', error: 'unencapsulated property' },
    { code: 'export class Probe { value = 0; }', error: 'unencapsulated property' },
    { code: 'export class Probe { constructor(public value: number) {} }', error: 'unencapsulated constructor property' },
    { code: 'export class Probe { constructor(protected readonly value: number) {} }', error: 'unencapsulated constructor property' },
    { code: 'export class Probe { constructor(readonly value: number) {} }', error: 'unencapsulated constructor property' },
    { code: 'export function edit() {}', error: 'top-level function' },
    { code: 'export const edit = () => 1;', error: 'top-level function variable' },
    { code: 'export const edit = function () { return 1; };', error: 'top-level function variable' },
    { code: 'export class Probe { read(tag: string) { switch (tag) { default: return 0; } } }', error: 'switch requires review' },
    { code: 'export class Probe { read(tag: string) { if (tag === "rect") { return 1; } return 0; } }', error: 'shape type comparison requires review' },
    { code: 'export class Probe { read(shape: Shape) { return shape.getTag() === "circle"; } }', error: 'shape type comparison requires review' },
    { code: 'export class Probe { find(type: string) { return this.providers.get(type); } }', error: 'misplaced name dispatch' },
    { code: 'export class Probe { private registry = new Map<string, ShapeProvider>(); find(type: string) { return this.registry.get(type); } }', error: 'misplaced name dispatch' },
    { code: 'export class Probe { private registry: Map<string, CommandRegistration>; find(name: string) { return this.registry.get(name); } }', error: 'misplaced name dispatch' },
    { code: 'import type { ShapeProvider as Provider } from "./Provider.js"; export class Probe { private table = new Map<string, Provider>(); find(type: string) { return this.table.get(type); } }', error: 'misplaced name dispatch' },
    { code: 'const registry = new Map<string, ShapeProvider>(); registry.get("rect");', error: 'misplaced name dispatch' },
  ])('负例 $error 确实产生诊断', ({ code, error }) => { expect(checker.check('Probe.ts', code)).toContain(error); });

  it.each(['ShapeFactory', 'CommandDispatcher'])('集中注册查找允许位于 %s', name => {
    const value = name === 'ShapeFactory' ? 'ShapeProvider' : 'CommandRegistration';
    const code = 'export class ' + name + ' { private table = new Map<string, ' + value + '>(); find(key: string) { return this.table.get(key); } }';
    expect(checker.check(name + '.ts', code)).toEqual([]);
  });
});
