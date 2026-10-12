import { DomainError } from '../domain/DomainError.js';
import type { Command } from './Command.js';
import { CommandArguments } from './CommandArguments.js';
import type { CommandRegistration } from './CommandRegistration.js';
import type { InputArgument } from './InputArgument.js';

/** 唯一命令名分派位置；后续插件阶段重构注册来源和生命周期。 */
export class CommandDispatcher {
  private readonly commands = new Map<string, CommandRegistration>();

  public getUsages(): readonly string[] { return Object.freeze([...this.commands.values()].map(command => command.getUsage())); }

  public register(name: string, registration: CommandRegistration): void {
    if (this.commands.has(name)) { throw new DomainError(`command already registered: ${name}`); }
    this.commands.set(name, registration);
  }

  public create(name: string, arguments_: readonly InputArgument[]): Command {
    const registration = this.commands.get(name);
    if (registration === undefined) { throw new DomainError(`unknown command: ${name}`); }
    return registration.create(new CommandArguments(arguments_));
  }
}
