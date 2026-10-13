export interface DocumentStorage {
  resolve(file: string): string;
  read(file: string): string;
  write(file: string, contents: string): void;
}
