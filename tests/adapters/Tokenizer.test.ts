import { describe, expect, it } from 'vitest';
import { Tokenizer } from '../../src/adapters/cli/Tokenizer.js';

describe('CLI 分词边界', () => {
  it.each(['', '   \t', '# comment', '  # create rect a 0 0 1 1'])('空行与整行注释忽略：%s', line => {
    expect(new Tokenizer().tokenize(line)).toEqual([]);
  });

  it('保留颜色、空文本、空格正文和 quoted 标记', () => {
    const tokens = new Tokenizer().tokenize('  create text t 1 2 "a in b" "" #3366ff  ');
    expect(tokens.map(token => token.getValue())).toEqual(['create', 'text', 't', '1', '2', 'a in b', '', '#3366ff']);
    expect(tokens.map(token => token.isLiteral())).toEqual([false, false, false, false, false, true, true, false]);
    expect(Object.isFrozen(tokens)).toBe(true);
    expect(Object.isFrozen(tokens[0])).toBe(true);
  });

  it('引号内只解释双引号和反斜杠转义，Windows 路径保持完整', () => {
    const tokens = new Tokenizer().tokenize(String.raw`read "D:\Secret\a b.svg" "a\"b\\c"`);
    expect(tokens.map(token => token.getValue())).toEqual([String.raw`read`, String.raw`D:\Secret\a b.svg`, String.raw`a"b\c`]);
  });

  it.each(['create text t 1 2 "bad', '"a"b', 'a"b"'])('错误引号拒绝：%s', line => {
    expect(() => new Tokenizer().tokenize(line)).toThrow();
  });

  it('不执行插值、命令替换或行内注释', () => {
    const tokens = new Tokenizer().tokenize(String.raw`set t text "$HOME $(thing)" # rest`);
    expect(tokens.map(token => token.getValue())).toEqual(['set', 't', 'text', '$HOME $(thing)', '#', 'rest']);
  });
});
