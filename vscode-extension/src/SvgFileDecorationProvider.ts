import { FileDecoration, FileType, workspace } from 'vscode';
import type { CancellationToken, FileDecorationProvider, Uri } from 'vscode';

export class SvgFileDecorationProvider implements FileDecorationProvider {
  public async provideFileDecoration(uri: Uri, token: CancellationToken): Promise<FileDecoration | undefined> {
    if (token.isCancellationRequested || !uri.path.toLowerCase().endsWith('.svg')) { return undefined; }
    try {
      const entry = await workspace.fs.stat(uri);
      if (token.isCancellationRequested || (entry.type & FileType.File) === 0) { return undefined; }
      return new FileDecoration('[]', 'SVG file');
    } catch {
      return undefined;
    }
  }
}
