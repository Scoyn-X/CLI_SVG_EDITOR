import type { ShapeDescription } from '../domain/ShapeDescription.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
import { ValueValidation } from '../domain/ValueValidation.js';
import { CommandResult } from './CommandResult.js';
import { EditCommand } from './EditCommand.js';

export class MoveCommand extends EditCommand {
  public constructor(private readonly id: string, private readonly dx: string | number, private readonly dy: string | number) { super(); }

  protected override apply(document: SvgDocument): CommandResult {
    const dx = ValueValidation.number(this.dx, 'dx');
    const dy = ValueValidation.number(this.dy, 'dy');
    const before = document.describeShape(this.id);
    document.move(this.id, dx, dy);
    return new CommandResult(this.summary(document.describeShape(this.id), dx, dy, false), this.summary(before, -dx, -dy, true));
  }

  private summary(shape: ShapeDescription, dx: number, dy: number, reversed: boolean): string {
    const label = `${shape.getTag()}#${shape.getId()}`;
    const verb = reversed ? 'moved back' : 'moved';
    const position = shape.getPosition();
    return position === undefined ? `${label} ${verb} by (${dx},${dy})` : `${label} ${verb} to (${position[0]},${position[1]})`;
  }
}
