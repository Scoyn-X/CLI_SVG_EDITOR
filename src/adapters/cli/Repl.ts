import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import type { CliController } from './CliController.js';

export class Repl {
  public constructor(private readonly controller: CliController) {}

  public async start(input: Readable, output: Writable): Promise<void> {
    const lines = createInterface({ input, crlfDelay: Infinity, terminal: false });
    output.write("svg-editor 0.1 — type 'help' for commands\n\nsvg> ");
    try {
      for await (const line of lines) {
        for (const message of this.controller.executeLine(line)) { output.write(`${message}\n`); }
        output.write('svg> ');
      }
    } finally { lines.close(); }
  }
}
