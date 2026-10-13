import type { ShapeDescription } from '../domain/ShapeDescription.js';
import type { CommandDisplay } from './CommandDisplay.js';
import type { CommandFormatter } from './CommandFormatter.js';

export class ShapeDisplay implements CommandDisplay {
  public constructor(private readonly shape: ShapeDescription, private readonly parent: string) { Object.freeze(this); }
  public render(formatter: CommandFormatter): readonly string[] { return formatter.show(this.shape, this.parent); }
}
