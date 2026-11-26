import type { AttributeHandler } from '../ports/AttributeHandler.js';
import type { ShapeProvider } from '../ports/ShapeProvider.js';
import type { TreeDecorator } from '../ports/TreeDecorator.js';
import type { CommandRegistration } from './CommandRegistration.js';

export interface PluginContext {
  registerShape(provider: ShapeProvider): void;
  registerCommand(name: string, registration: CommandRegistration): void;
  registerDecorator(name: string, decorator: TreeDecorator): void;
  registerAttribute(name: string, handler: AttributeHandler): void;
}
