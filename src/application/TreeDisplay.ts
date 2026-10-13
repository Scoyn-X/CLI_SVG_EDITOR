import type { DocumentDescription } from '../domain/DocumentDescription.js';
import type { ShapeDescription } from '../domain/ShapeDescription.js';
import type { CommandDisplay } from './CommandDisplay.js';
import type { CommandFormatter } from './CommandFormatter.js';

export class TreeDisplay implements CommandDisplay {
  public constructor(private readonly document: DocumentDescription, private readonly root?: ShapeDescription) { Object.freeze(this); }
  public render(formatter: CommandFormatter): readonly string[] { return formatter.tree(this.document, this.root); }
}
