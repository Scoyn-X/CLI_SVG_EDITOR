import type { CommandFormatter } from './CommandFormatter.js';

export interface CommandDisplay { render(formatter: CommandFormatter): readonly string[]; }
