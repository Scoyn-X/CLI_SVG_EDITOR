export class IdAssignment {
  public constructor(private readonly id: string, private readonly tag: string) { Object.freeze(this); }
  public getId(): string { return this.id; }
  public getTag(): string { return this.tag; }
}
