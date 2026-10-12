import { DomainError } from './DomainError.js';

/** 内部有序存储，结构操作由 ShapeTree 统一校验后调用。 */
export class OrderedChildren<T> {
  private values: readonly T[] = [];

  public items(): readonly T[] {
    return Object.freeze([...this.values]);
  }

  public insert(value: T, position: number = this.values.length): void {
    if (!Number.isInteger(position) || position < 0 || position > this.values.length) {
      throw new DomainError('invalid child position');
    }
    this.values = [...this.values.slice(0, position), value, ...this.values.slice(position)];
  }

  public remove(value: T): void {
    this.replace(value, []);
  }

  /** 先准备完整新列表；解组可以一次把容器替换成有序子节点。 */
  public replace(value: T, replacements: readonly T[]): void {
    const position = this.values.indexOf(value);
    if (position === -1) {
      throw new DomainError('shape is not a child of this container');
    }
    this.values = [...this.values.slice(0, position), ...replacements, ...this.values.slice(position + 1)];
  }
}
