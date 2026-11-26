import { languages, window } from 'vscode';
import type { ExtensionContext } from 'vscode';
import { SvgDocumentSymbolProvider } from './SvgDocumentSymbolProvider';
import { SvgFileDecorationProvider } from './SvgFileDecorationProvider';

export function activate(context: ExtensionContext): void {
  context.subscriptions.push(
    window.registerFileDecorationProvider(new SvgFileDecorationProvider()),
    languages.registerDocumentSymbolProvider(
      { pattern: '**/*.[sS][vV][gG]' },
      new SvgDocumentSymbolProvider(),
    ),
  );
}
