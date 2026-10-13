import { closeSync, fsyncSync, lstatSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';

/** 封装平台操作，便于测试真实临时文件及写入/替换失败分支。 */
export class FileOperations {
  public read(file: string): string { return new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(file)); }
  public mode(file: string): number | undefined {
    try {
      const stat = lstatSync(file);
      if (!stat.isFile()) { throw new Error('target is not a regular file'); }
      return stat.mode & 0o777;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') { return undefined; }
      throw error;
    }
  }
  public open(file: string, mode: number): number { return openSync(file, 'wx', mode); }
  public write(descriptor: number, contents: string): void { writeFileSync(descriptor, contents, 'utf8'); }
  public flush(descriptor: number): void { fsyncSync(descriptor); }
  public close(descriptor: number): void { closeSync(descriptor); }
  public replace(from: string, to: string): void { renameSync(from, to); }
  public remove(file: string): void { unlinkSync(file); }
}
