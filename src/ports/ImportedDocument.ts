import type { SvgDocument } from '../domain/SvgDocument.js';
import type { IdAssignment } from './IdAssignment.js';

export class ImportedDocument {
  private readonly document: SvgDocument;
  private readonly assignments: readonly IdAssignment[];
  public constructor(document: SvgDocument, assignments: readonly IdAssignment[] = []) {
    this.document = document.clone(); this.assignments = Object.freeze([...assignments]);
  }
  public getDocument(): SvgDocument { return this.document.clone(); }
  public getElementCount(): number { return this.document.getElementCount(); }
  public getAssignments(): readonly IdAssignment[] { return this.assignments; }
}
