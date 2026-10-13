import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FileOperations } from '../../src/adapters/files/FileOperations.js';
import { NodeDocumentStorage } from '../../src/adapters/files/NodeDocumentStorage.js';

let directory = '';
beforeEach(() => { mkdirSync('artifacts', { recursive: true }); directory = mkdtempSync(resolve('artifacts/io-')); });
afterEach(() => { vi.restoreAllMocks(); if (!directory.startsWith(resolve('artifacts') + '/')) { expect(directory.startsWith(resolve('artifacts') + '\\')).toBe(true); } rmSync(directory, { recursive: true, force: true }); });

describe('真实文件存储与失败替换', () => {
  it('中文空格路径、UTF-8、首次写入和覆盖既有文件', () => {
    const storage = new NodeDocumentStorage(directory); const path = storage.resolve('中文 space.svg');
    storage.write(path, '第一版'); storage.write(path, '第二版 😀');
    expect(storage.read(path)).toBe('第二版 😀'); expect(readdirSync(directory)).toEqual(['中文 space.svg']);
    expect(storage.resolve(path)).toBe(path);
  });
  it.each(['write', 'flush', 'replace'] as const)('%s 失败保留旧目标且清理本次临时文件', method => {
    const operations = new FileOperations(); const storage = new NodeDocumentStorage(directory, operations);
    const file = storage.resolve('old.svg'); writeFileSync(file, 'old');
    vi.spyOn(operations, method).mockImplementation(() => { throw new Error('injected failure'); });
    expect(() => storage.write(file, 'new')).toThrow('injected failure');
    expect(readFileSync(file, 'utf8')).toBe('old'); expect(readdirSync(directory)).toEqual(['old.svg']);
  });
  it('不存在目录、目录目标和非 UTF-8 内容都失败', () => {
    const storage = new NodeDocumentStorage(directory);
    expect(() => storage.write(storage.resolve('missing/out.svg'), 'x')).toThrow();
    expect(() => storage.write(directory, 'x')).toThrow();
    writeFileSync(storage.resolve('invalid.svg'), Buffer.from([0xff, 0xfe]));
    expect(() => storage.read(storage.resolve('invalid.svg'))).toThrow();
    expect(() => storage.read(storage.resolve('missing.svg'))).toThrow();
    expect(() => storage.resolve('')).toThrow(); expect(() => storage.resolve('a\0b')).toThrow();
  });
});
