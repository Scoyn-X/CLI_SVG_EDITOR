import { readdirSync } from 'node:fs';
import { cwd } from 'node:process';
import type { DirectoryEntry, DirectoryReader } from './DirectoryReader.js';

export class NodeDirectoryReader implements DirectoryReader {
  public currentDirectory(): string { return cwd(); }

  public read(directory: string): readonly DirectoryEntry[] {
    return readdirSync(directory, { withFileTypes: true }).map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : entry.isFile() ? 'file' : 'other',
    }));
  }
}
