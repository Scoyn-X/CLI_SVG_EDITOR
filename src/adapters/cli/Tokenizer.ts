import { InputArgument } from '../../application/InputArgument.js';
import { DomainError } from '../../domain/DomainError.js';

export class Tokenizer {
  public tokenize(line: string): readonly InputArgument[] {
    if (line.trimStart().startsWith('#')) { return []; }
    const tokens: InputArgument[] = [];
    let index = 0;
    while (index < line.length) {
      if (/\s/u.test(line[index] ?? '')) { index++; continue; }
      if (line[index] === '"') {
        index++;
        let value = '';
        let closed = false;
        while (index < line.length) {
          const character = line[index];
          if (character === '"') { index++; closed = true; break; }
          if (character === '\\' && (line[index + 1] === '"' || line[index + 1] === '\\')) {
            value += line[index + 1];
            index += 2;
          } else { value += character; index++; }
        }
        if (!closed) { throw new DomainError('unterminated double quote'); }
        if (index < line.length && !/\s/u.test(line[index] ?? '')) { throw new DomainError('quoted argument must be separated by whitespace'); }
        tokens.push(new InputArgument(value, true));
      } else {
        const start = index;
        while (index < line.length && !/\s/u.test(line[index] ?? '')) {
          if (line[index] === '"') { throw new DomainError('double quote must start an argument'); }
          index++;
        }
        tokens.push(new InputArgument(line.slice(start, index)));
      }
    }
    return Object.freeze(tokens);
  }
}
