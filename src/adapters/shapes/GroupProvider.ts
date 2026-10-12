import { Group } from '../../domain/Group.js';
import { BuiltinShapeProvider } from './BuiltinShapeProvider.js';

export class GroupProvider extends BuiltinShapeProvider {
  public constructor() { super('g', 0); }
  protected override build(id: string): Group { return new Group(id); }
}
