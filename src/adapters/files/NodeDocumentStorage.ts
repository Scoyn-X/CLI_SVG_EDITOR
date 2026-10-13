import { randomUUID } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import type { DocumentStorage } from '../../ports/DocumentStorage.js';
import { FileOperations } from './FileOperations.js';

export class NodeDocumentStorage implements DocumentStorage {
  public constructor(private readonly cwd: string = process.cwd(), private readonly files = new FileOperations()) {}
  public resolve(file: string): string {
    if (file.length === 0 || file.includes('\0')) { throw new Error('invalid path'); }
    return resolve(this.cwd, file);
  }
  public read(file: string): string { return this.files.read(file); }
  public write(file: string, contents: string): void {
    const mode = this.files.mode(file) ?? 0o666;
    const temporary = join(dirname(file), `.svg-editor-${randomUUID()}.tmp`);
    let descriptor: number | undefined;
    let created = false;
    try {
      descriptor = this.files.open(temporary, mode); created = true;
      this.files.write(descriptor, contents); this.files.flush(descriptor);
      this.files.close(descriptor); descriptor = undefined;
      this.files.replace(temporary, file); created = false;
    } finally {
      if (descriptor !== undefined) { try { this.files.close(descriptor); } catch { /* 原始写入错误优先。 */ } }
      if (created) { try { this.files.remove(temporary); } catch { /* 不删除用户目标文件。 */ } }
    }
  }
}
