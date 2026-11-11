export interface DirectoryEntry {
  readonly name: string;
  readonly type: 'directory' | 'file' | 'other';
}

export interface DirectoryReader {
  currentDirectory(): string;
  read(directory: string): readonly DirectoryEntry[];
}
