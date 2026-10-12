import { DomainError } from '../domain/DomainError.js';
import type { Command } from './Command.js';
import type { CommandArguments } from './CommandArguments.js';

export class CommandRegistration {
  public constructor(private readonly usage: string, private readonly min: number, private readonly max: number | undefined,
    private readonly build: (arguments_: CommandArguments) => Command) {}

  public getUsage(): string { return this.usage; }

  public create(arguments_: CommandArguments): Command {
    if (arguments_.count() < this.min || (this.max !== undefined && arguments_.count() > this.max)) {
      throw new DomainError(`usage: ${this.usage}`);
    }
    return this.build(arguments_);
  }
}
