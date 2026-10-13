import { describe, expect, it, vi } from 'vitest';
import { CliController } from '../../src/adapters/cli/CliController.js';
import { XmlSvgCodec } from '../../src/adapters/svg/XmlSvgCodec.js';
import { EditorSession } from '../../src/application/EditorSession.js';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';
import { DomainError } from '../../src/domain/DomainError.js';
import { Group } from '../../src/domain/Group.js';
import type { ShapeProvider } from '../../src/ports/ShapeProvider.js';
import { ExtensionProbe } from '../fixtures/ExtensionProbe.js';

describe('第一阶段扩展边界探针（不注册生产插件）', () => {
  it('注入测试提供者可创建子树，set 多态传播，move 与 undo/redo 保留能力', () => {
    const composition = new EditorComposition(); const factory = composition.createFactory(); const session = new EditorSession();
    const createProbe = vi.fn((id: string) => new ExtensionProbe(id));
    const provider: ShapeProvider = {
      getType: () => 'probe', getUsage: () => 'create probe <id>',
      create: createProbe,
      fromSvg: () => { throw new DomainError('probe import not implemented'); },
    };
    factory.register(provider);
    const cli = new CliController(composition.createDispatcher(factory), session);
    for (const line of ['init', 'create g outer', 'create probe p in outer']) { expect(cli.executeLine(line)[0]).not.toMatch(/^error:/); }
    expect(session.describe().getElementCount()).toBe(4);
    expect(session.getParentId('p-label')).toBe('p');
    const before = session.describe();
    expect(cli.executeLine('set p fill red')).toEqual(['g#p updated: fill=(unset)']);
    expect(session.describeShape('p-rect').getAttributes()['fill']).toBe('red');
    expect(session.describeShape('p').getAttributes()['fill']).toBeUndefined();
    cli.executeLine('undo'); expect(session.describe()).toEqual(before); cli.executeLine('redo');
    expect(session.describeShape('p-rect').getAttributes()['fill']).toBe('red');
    expect(cli.executeLine('set p label "new label"')).toEqual(['g#p updated: label=(unset)']);
    expect(session.describeShape('p-label').getText()).toBe('new label');
    cli.executeLine('undo'); expect(session.describeShape('p-label').getText()).toBe('probe'); cli.executeLine('redo');
    cli.executeLine('move p 2 3'); expect(session.describeShape('p-label').getPosition()).toEqual([17, 28]);
    cli.executeLine('undo'); expect(session.describeShape('p-label').getPosition()).toEqual([15, 25]); cli.executeLine('redo');
    expect(createProbe).toHaveBeenCalledOnce();
    const saved = session.describe(); const history = session.getHistoryStatus();
    expect(cli.executeLine('ungroup p')).toEqual(['error: cannot ungroup composite shape: p']);
    expect(session.describe()).toEqual(saved); expect(session.getHistoryStatus()).toEqual(history);
  });

  it('类型标记保存与普通 g 降级已具备，但注册同名提供者也尚未按 data-kind 恢复', () => {
    const composition = new EditorComposition(); const factory = composition.createFactory();
    const importProbe = vi.fn(() => new ExtensionProbe('unused'));
    factory.register({ getType: () => 'probe', getUsage: () => 'create probe <id>', create: id => new ExtensionProbe(id), fromSvg: importProbe });
    const session = new EditorSession(); const cli = new CliController(composition.createDispatcher(factory), session);
    cli.executeLine('init'); cli.executeLine('create probe p');
    const codec = new XmlSvgCodec(factory); const xml = codec.encode(session.describe());
    expect(xml).toContain('<g id="p" data-kind="probe">');
    const original = session.describe();
    for (const importer of [factory, composition.createFactory()]) {
      const loaded = new XmlSvgCodec(importer).decode(xml).getDocument();
      expect(loaded.describe()).toEqual(original);
      expect(loaded.describeShape('p').getAttributes()['data-kind']).toBe('probe');
      expect(loaded.getParentId('p-label')).toBe('p');
      const restored = new EditorSession(); restored.replaceDocument(loaded);
      const plain = new CliController(composition.createDispatcher(), restored);
      plain.executeLine('move p 1 2');
      expect(restored.describeShape('p-label').getPosition()).toEqual([16, 27]);
      expect(plain.executeLine('set p label "unsupported"')).toEqual(['error: unknown attribute: label']);
    }
    expect(importProbe).not.toHaveBeenCalled();
  });

  it('展示当前只输出 g 标签和 data-kind 元数据，不提供插件语义类型标注', () => {
    const composition = new EditorComposition(); const factory = composition.createFactory();
    factory.register({ getType: () => 'probe', getUsage: () => 'create probe <id>', create: id => new ExtensionProbe(id), fromSvg: () => new Group('unused') });
    const cli = new CliController(composition.createDispatcher(factory), new EditorSession());
    cli.executeLine('init'); cli.executeLine('create probe p');
    expect(cli.executeLine('tree p')[0]).toBe('g#p  data-kind=probe');
    expect(cli.executeLine('tree p')[0]).not.toContain('(probe)');
    expect(cli.executeLine('show p')).toContain('  data-kind=probe');
  });

  it('生产组合仍拒绝测试类型与 box，没有泄漏测试提供者注册', () => {
    const cli = new EditorComposition().createController(); cli.executeLine('init');
    for (const type of ['probe', 'box']) {
      expect(cli.executeLine(`create ${type} p`)).toEqual([`error: unknown shape type: ${type} (is the plugin loaded?)`]);
    }
  });
});
