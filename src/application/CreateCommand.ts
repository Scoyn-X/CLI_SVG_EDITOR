import type { SvgDocument } from '../domain/SvgDocument.js';
import type { ShapeCreator } from '../ports/ShapeCreator.js';
import { CommandResult } from './CommandResult.js';
import { EditCommand } from './EditCommand.js';

export class CreateCommand extends EditCommand {
  private readonly parameters: readonly string[];

  public constructor(private readonly creator: ShapeCreator, private readonly type: string, private readonly id: string,
    parameters: readonly string[] = [], private readonly parentId?: string) {
    super();
    this.parameters = Object.freeze([...parameters]);
  }

  protected override apply(document: SvgDocument): CommandResult {
    const shape = this.creator.create(this.type, this.id, this.parameters);
    document.add(shape, this.parentId);
    const label = `${shape.describe().getTag()}#${this.id}`;
    const parent = this.parentId === undefined ? '' : ` in ${document.describeShape(this.parentId).getTag()}#${this.parentId}`;
    return new CommandResult(`${label} created${parent}`, `${label} deleted`);
  }
}
