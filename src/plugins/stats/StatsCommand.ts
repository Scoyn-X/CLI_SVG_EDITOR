import { Command } from '../../application/Command.js';
import { CommandResult } from '../../application/CommandResult.js';
import type { DocumentDescription } from '../../domain/DocumentDescription.js';
import type { ShapeDescription } from '../../domain/ShapeDescription.js';

export class StatsCommand extends Command {
  public override execute(session: { describe(): DocumentDescription }): CommandResult {
    const counts = new Map<string, number>();
    let total = 0;
    let containers = 0;
    const pending: ShapeDescription[] = [...session.describe().getRoots()].reverse();
    while (pending.length > 0) {
      const shape = pending.pop();
      if (shape === undefined) { break; }
      if (shape.isContainer()) {
        containers++;
        for (const child of [...shape.getChildren()].reverse()) { pending.push(child); }
      } else {
        const type = shape.getType();
        counts.set(type, (counts.get(type) ?? 0) + 1);
        total++;
      }
    }
    const labels = [...counts].map(([type, count]) => `${type}: ${count}`);
    return new CommandResult([...labels, `(total ${total}, containers ${containers})`].join('  '));
  }
}
