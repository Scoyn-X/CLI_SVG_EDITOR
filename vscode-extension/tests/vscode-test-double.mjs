export const registrations = [];
export const FileType = { File: 1, Directory: 2, SymbolicLink: 64 };
export const SymbolKind = { Namespace: 2, Object: 18 };

export const workspace = { fs: { stat: async uri => {
  if (uri.error) { throw uri.error; }
  return { type: uri.type };
} } };

export class Range {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
}

export class DocumentSymbol {
  children = [];

  constructor(name, detail, kind, range, selectionRange) {
    Object.assign(this, { name, detail, kind, range, selectionRange });
  }
}

export class FileDecoration {
  constructor(badge, tooltip) {
    this.badge = badge;
    this.tooltip = tooltip;
  }
}

export const window = { registerFileDecorationProvider(provider) {
  registrations.push({ provider });
  return { dispose() {} };
} };

export const languages = { registerDocumentSymbolProvider(selector, provider) {
  registrations.push({ selector, provider });
  return { dispose() {} };
} };
