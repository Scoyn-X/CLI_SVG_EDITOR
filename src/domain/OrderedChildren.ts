import { DomainError } from './DomainError.js';

/** 内部有序存储，结构操作由 ShapeTree 统一校验后调用。 */
export class OrderedChildren<T> {
  private readonly values: T[] = [];

  public items(): readonly T[] {
    return Object.freeze([...this.values]);
  }

  public insert(value: T, position: number = this.values.length): void {
    if (!Number.isInteger(position) || position < 0 || position > this.values.length) {
      throw new DomainError('invalid child position');
    }
    this.values.splice(position, 0, value);
  }

  public remove(value: T): void {
    const position = this.values.indexOf(value);
    if (position === -1) {
      throw new DomainError('shape is not a child of this container');
    }
    this.values.splice(position, 1);
  }
}
