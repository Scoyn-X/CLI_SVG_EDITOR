import { Group } from '../../domain/Group.js';
import type { Shape } from '../../domain/Shape.js';
import { DomainError } from '../../domain/DomainError.js';
import { PresentationAttributes } from '../../domain/PresentationAttributes.js';
export class Box extends Group {
  public constructor(id: string, children: readonly Shape[]) {
    super(id, children);
    const parts = children.map(child => child.describe());
    const required = new Map([[id + '-rect', 'rect'], [id + '-label', 'text']]);
    if ([...required].some(([childId, tag]) => !parts.some(child => child.getId() === childId && child.getTag() === tag))) {
      throw new DomainError('invalid box structure: ' + id);
    }
    this.preservePresentation(new PresentationAttributes({ 'data-kind': 'box' }));
  }
  public override getType(): string { return 'box'; }
  public override canUngroup(): boolean { return false; }
  public override canDetachChild(id: string): boolean { return id !== this.getId() + '-rect' && id !== this.getId() + '-label'; }
  public override creationDetails(): string { const id = this.getId(); return 'g#' + id + ' + rect#' + id + '-rect + text#' + id + '-label'; }
  protected override createCopy(children: readonly Shape[]): Group { return new Box(this.getId(), children); }
}
