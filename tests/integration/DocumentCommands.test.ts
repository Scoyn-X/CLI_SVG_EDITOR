import { describe, expect, it, vi } from 'vitest';
import { CliController } from '../../src/adapters/cli/CliController.js';
import { EditorSession } from '../../src/application/EditorSession.js';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';

const valid = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><g id="scene"><rect width="5" height="2"/><text>in &amp; 中文</text></g></svg>';

describe('read/save 原子发布与真实命令组合', () => {
  it('补 id 警告、元素数、读入路径、另存与无参 save 生命周期', () => {
    const session = new EditorSession(); const composition = new EditorComposition();
    const storage = { resolve: (file: string) => file.startsWith('/') ? file : `/base/${file}`, read: vi.fn(() => valid), write: vi.fn() };
    const cli = new CliController(composition.createDispatcher(composition.createFactory(), storage), session);
    expect(cli.executeLine('read "中文 space.svg"')).toEqual(['warning: assigned id rect1 to unnamed <rect>', 'warning: assigned id text1 to unnamed <text>', 'read 中文 space.svg (3 elements)']);
    expect(session.getSourcePath()).toBe('/base/中文 space.svg');
    expect(cli.executeLine('undo')).toEqual(['error: undo not allowed after io command']);
    cli.executeLine('move rect1 2 3');
    expect(cli.executeLine('save copy.svg')).toEqual(['saved to copy.svg (3 elements)']);
    expect(storage.write.mock.calls[0]?.[0]).toBe('/base/copy.svg');
    expect(session.getSourcePath()).toBe('/base/中文 space.svg');
    expect(cli.executeLine('redo')).toEqual(['error: undo not allowed after io command']);
    cli.executeLine('save');
    expect(storage.write.mock.calls[1]?.[0]).toBe('/base/中文 space.svg');
    cli.executeLine('init');
    expect(session.getSourcePath()).toBeUndefined();
    expect(cli.executeLine('save')).toEqual(['error: no source path. specify a file']);
    expect(cli.executeLine('save new.svg')).toEqual(['saved to new.svg (0 elements)']);
    expect(cli.executeLine('save')).toEqual(['error: no source path. specify a file']);
  });

  it.each(['read missing.svg', 'read bad.svg', 'save bad.svg'])('失败 %s 不发布警告、不改变文档/路径/redo', command => {
    const session = new EditorSession(); const composition = new EditorComposition();
    const storage = { resolve: (file: string) => file, read: (file: string) => {
      if (file === 'missing.svg') { throw new Error('missing'); }
      return file === 'bad.svg' ? '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect/><path/></svg>' : valid;
    }, write: () => { throw new Error('write failed'); } };
    const cli = new CliController(composition.createDispatcher(composition.createFactory(), storage), session);
    for (const line of ['read original.svg', 'move rect1 5 0', 'undo']) { cli.executeLine(line); }
    const before = session.describe(); const history = session.getHistoryStatus(); const path = session.getSourcePath();
    const response = cli.executeLine(command);
    expect(response).toHaveLength(1); expect(response[0]).toMatch(/^error:/);
    expect(session.describe()).toEqual(before); expect(session.getHistoryStatus()).toEqual(history); expect(session.getSourcePath()).toBe(path);
    expect(cli.executeLine('redo')).toEqual(['rect#rect1 moved to (5,0)']);
  });

  it('同步 IO 全程拒绝重入；异常后释放锁并保持状态', () => {
    const session = new EditorSession(); const composition = new EditorComposition();
    const storage = { resolve: (file: string) => file, read: vi.fn(() => valid), write: vi.fn(() => { session.undo(); }) };
    const cli = new CliController(composition.createDispatcher(composition.createFactory(), storage), session);
    cli.executeLine('read original.svg'); cli.executeLine('move rect1 1 1');
    const before = session.describe(); const history = session.getHistoryStatus();
    expect(cli.executeLine('save out.svg')).toEqual(['error: cannot write file: out.svg']);
    expect(session.describe()).toEqual(before); expect(session.getHistoryStatus()).toEqual(history);
    storage.read.mockImplementationOnce(() => { session.resize(1, 1); return valid; });
    expect(cli.executeLine('read next.svg')).toEqual(['error: cannot read file: next.svg']);
    expect(session.describe()).toEqual(before); expect(session.getSourcePath()).toBe('original.svg');
    expect(cli.executeLine('undo')).toEqual(['rect#rect1 moved back to (0,0)']);
  });
});
