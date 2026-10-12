import { CanvasCommand } from '../application/CanvasCommand.js';
import { CommandDispatcher } from '../application/CommandDispatcher.js';
import { CommandRegistration } from '../application/CommandRegistration.js';
import { CreateCommand } from '../application/CreateCommand.js';
import { EditorSession } from '../application/EditorSession.js';
import { InitCommand } from '../application/InitCommand.js';
import { HelpCommand } from '../application/HelpCommand.js';
import { AddToCommand } from '../application/AddToCommand.js';
import { GroupCommand } from '../application/GroupCommand.js';
import { UngroupCommand } from '../application/UngroupCommand.js';
import { BackCommand } from '../application/BackCommand.js';
import { DeleteCommand } from '../application/DeleteCommand.js';
import { FrontCommand } from '../application/FrontCommand.js';
import { MoveCommand } from '../application/MoveCommand.js';
import { RedoCommand } from '../application/RedoCommand.js';
import { ScaleCommand } from '../application/ScaleCommand.js';
import { SetCommand } from '../application/SetCommand.js';
import { ShapeFactory } from '../application/ShapeFactory.js';
import { UndoCommand } from '../application/UndoCommand.js';
import { CliController } from '../adapters/cli/CliController.js';
import { Repl } from '../adapters/cli/Repl.js';
import { CircleProvider } from '../adapters/shapes/CircleProvider.js';
import { EllipseProvider } from '../adapters/shapes/EllipseProvider.js';
import { GroupProvider } from '../adapters/shapes/GroupProvider.js';
import { LineProvider } from '../adapters/shapes/LineProvider.js';
import { RectProvider } from '../adapters/shapes/RectProvider.js';
import { TextProvider } from '../adapters/shapes/TextProvider.js';

/** 集中组装依赖；这里只登记名字，不按名字比较或执行图形算法。 */
export class EditorComposition {
  public createFactory(): ShapeFactory {
    const factory = new ShapeFactory();
    for (const provider of [new RectProvider(), new CircleProvider(), new EllipseProvider(), new LineProvider(), new TextProvider(), new GroupProvider()]) {
      factory.register(provider);
    }
    return factory;
  }

  public createDispatcher(factory: ShapeFactory = this.createFactory()): CommandDispatcher {
    const dispatcher = new CommandDispatcher();
    dispatcher.register('init', new CommandRegistration('init [w] [h]', 0, 2, args => new InitCommand(args.optional(0), args.optional(1))));
    dispatcher.register('canvas', new CommandRegistration('canvas [w] [h]', 0, 2, args => new CanvasCommand(args.optional(0), args.optional(1))));
    dispatcher.register('create', new CommandRegistration('create <type> <id> [params…] [in <containerId>]', 2, undefined, args => {
      const parentId = args.creationParent();
      return new CreateCommand(factory, args.required(0), args.required(1), args.values(2, args.count() - (parentId === undefined ? 0 : 2)), parentId);
    }));
    dispatcher.register('move', new CommandRegistration('move <id> <dx> <dy>', 3, 3, args => new MoveCommand(args.required(0), args.required(1), args.required(2))));
    dispatcher.register('scale', new CommandRegistration('scale <id> <factor>', 2, 2, args => new ScaleCommand(args.required(0), args.required(1))));
    dispatcher.register('set', new CommandRegistration('set <id> <attr> <value>', 3, 3, args => new SetCommand(args.required(0), args.required(1), args.required(2))));
    dispatcher.register('group', new CommandRegistration('group <newGid> <id1> <id2>…', 2, undefined, args => new GroupCommand(args.required(0), args.values(1))));
    dispatcher.register('ungroup', new CommandRegistration('ungroup <gid>', 1, 1, args => new UngroupCommand(args.required(0))));
    dispatcher.register('addto', new CommandRegistration('addto <gid> <id>', 2, 2, args => new AddToCommand(args.required(0), args.required(1))));
    dispatcher.register('delete', new CommandRegistration('delete <id>', 1, 1, args => new DeleteCommand(args.required(0))));
    dispatcher.register('front', new CommandRegistration('front <id>', 1, 1, args => new FrontCommand(args.required(0))));
    dispatcher.register('back', new CommandRegistration('back <id>', 1, 1, args => new BackCommand(args.required(0))));
    dispatcher.register('undo', new CommandRegistration('undo', 0, 0, () => new UndoCommand()));
    dispatcher.register('redo', new CommandRegistration('redo', 0, 0, () => new RedoCommand()));
    dispatcher.register('help', new CommandRegistration('help', 0, 0, () => new HelpCommand(dispatcher.getUsages())));
    return dispatcher;
  }

  public createController(session: EditorSession = new EditorSession()): CliController { return new CliController(this.createDispatcher(), session); }
  public createRepl(): Repl { return new Repl(this.createController()); }
}
