import { describe, expect, it, vi } from 'vitest';
import { CliController } from '../../src/adapters/cli/CliController.js';
import { XmlSvgCodec } from '../../src/adapters/svg/XmlSvgCodec.js';
import { EditorSession } from '../../src/application/EditorSession.js';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';
import { DomainError } from '../../src/domain/DomainError.js';
import { Group } from '../../src/domain/Group.js';
import type { ShapeProvider } from '../../src/ports/ShapeProvider.js';
import { ExtensionProbe } from '../fixtures/ExtensionProbe.js';
import { ExtensionProbeProvider } from '../fixtures/ExtensionProbeProvider.js';

const importedProbe = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">
  <probe id="p" stroke="#123456" stroke-width="2.5" transform="translate(7,9)" font-size="16" text-anchor="end" data-kind="external &amp; &quot;marker&quot;">
    <text id="from-file-label" x="-12.5" y="33" fill="blue" font-size="18" text-anchor="middle">中文 &amp; &lt;输入&gt; "quoted"</text>
    <g id="nested" fill="none" transform="scale(2)">
      <circle id="dot" cx="6" cy="8" r="4" stroke="red"/>
      <probe id="empty" data-kind="empty-marker"/>
    </g>
    <rect id="from-file-rect" x="91" y="-2" width="7.5" height="11" fill="#abcdef" stroke-width="0"/>
  </probe>
</svg>`;

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

  it('自定义标签按注册提供者递归导入，保留输入 id、顺序、父级、几何、样式、元数据和文本', () => {
    const factory = new EditorComposition().createFactory();
    const provider = new ExtensionProbeProvider(); const importProbe = vi.spyOn(provider, 'fromSvg');
    factory.register(provider);
    const imported = new XmlSvgCodec(factory).decode(importedProbe); const document = imported.getDocument();
    expect(importProbe).toHaveBeenCalledTimes(2); expect(imported.getAssignments()).toEqual([]);
    expect(document.describe().getElementCount()).toBe(6);
    expect(document.describe().getRoots().map(shape => shape.getId())).toEqual(['p']);
    expect(document.describeShape('p').getChildren().map(shape => shape.getId())).toEqual(['from-file-label', 'nested', 'from-file-rect']);
    expect(document.describeShape('nested').getChildren().map(shape => shape.getId())).toEqual(['dot', 'empty']);
    for (const id of ['from-file-label', 'nested', 'from-file-rect']) { expect(document.getParentId(id)).toBe('p'); }
    for (const id of ['dot', 'empty']) { expect(document.getParentId(id)).toBe('nested'); }
    expect(document.describeShape('empty').getChildren()).toEqual([]);
    expect(document.describeShape('p').getAttributes()).toEqual({ id: 'p', stroke: '#123456', 'stroke-width': 2.5,
      transform: 'translate(7,9)', 'font-size': '16', 'text-anchor': 'end', 'data-kind': 'external & "marker"' });
    expect(document.describeShape('from-file-label').getAttributes()).toEqual({ id: 'from-file-label', x: -12.5, y: 33,
      fill: 'blue', 'font-size': '18', 'text-anchor': 'middle' });
    expect(document.describeShape('from-file-label').getText()).toBe('中文 & <输入> "quoted"');
    expect(document.describeShape('nested').getAttributes()).toEqual({ id: 'nested', fill: 'none', transform: 'scale(2)' });
    expect(document.describeShape('dot').getAttributes()).toEqual({ id: 'dot', cx: 6, cy: 8, r: 4, stroke: 'red' });
    expect(document.describeShape('from-file-rect').getAttributes()).toEqual({ id: 'from-file-rect', x: 91, y: -2,
      width: 7.5, height: 11, fill: '#abcdef', 'stroke-width': 0 });
    expect(document.describeShape('empty').getAttributes()).toEqual({ id: 'empty', 'data-kind': 'empty-marker' });
  });

  it('自定义标签导入后保存为普通 g，再读回保持数据，但不会凭标记恢复子类型能力', () => {
    const factory = new EditorComposition().createFactory(); const provider = new ExtensionProbeProvider();
    const importProbe = vi.spyOn(provider, 'fromSvg'); factory.register(provider);
    const codec = new XmlSvgCodec(factory); const document = codec.decode(importedProbe).getDocument();
    const before = document.describe(); const xml = codec.encode(before);
    expect(xml).not.toContain('<probe'); expect(xml).toContain('data-kind="external &amp; &quot;marker&quot;"');
    expect(xml).toContain('中文 &amp; &lt;输入&gt; "quoted"');
    for (const importer of [factory, new EditorComposition().createFactory()]) {
      const restored = new XmlSvgCodec(importer).decode(xml).getDocument();
      expect(restored.describe()).toEqual(before);
      for (const id of ['p', 'from-file-label', 'nested', 'dot', 'empty', 'from-file-rect']) {
        expect(restored.getParentId(id)).toBe(document.getParentId(id));
      }
      // 普通嵌套 g 可解组；导入的测试复合容器明确拒绝解组。
      restored.ungroup('empty');
      expect(restored.describeShape('nested').getChildren().map(shape => shape.getId())).toEqual(['dot']);
      expect(restored.describe().getElementCount()).toBe(5);
    }
    expect(() => document.ungroup('empty')).toThrow('cannot ungroup composite shape: empty');
    expect(importProbe).toHaveBeenCalledTimes(2);
  });

  it('无 id 的空自定义容器补 id 后仍为空，不能凭默认模板新增节点或标记', () => {
    const factory = new EditorComposition().createFactory(); factory.register(new ExtensionProbeProvider());
    const imported = new XmlSvgCodec(factory).decode('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20"><probe/></svg>');
    expect(imported.getAssignments().map(assignment => [assignment.getId(), assignment.getTag()])).toEqual([['probe1', 'probe']]);
    const document = imported.getDocument(); expect(document.describe().getElementCount()).toBe(1);
    expect(document.describeShape('probe1').getAttributes()).toEqual({ id: 'probe1' });
    expect(document.describeShape('probe1').getChildren()).toEqual([]);
  });

  it.each([
    ['<path id="bad"/>', 'unknown shape type: path (is the plugin loaded?)'],
    ['<rect id="bad" width="-1"/>', 'width must be non-negative'],
    ['<rect id="p"/>', 'id already exists: p'],
  ])('自定义容器内 %s 导入失败时保持会话、路径、redo 与下一次 id 分配', (invalid, error) => {
    const composition = new EditorComposition(); const factory = composition.createFactory(); factory.register(new ExtensionProbeProvider());
    const good = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20"><probe id="p"><rect/></probe></svg>';
    const bad = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20"><probe id="p"><rect/>${invalid}</probe></svg>`;
    const storage = { resolve: (file: string) => file, read: (file: string) => file === 'bad.svg' ? bad : good, write: () => {} };
    const session = new EditorSession(); const cli = new CliController(composition.createDispatcher(factory, storage), session);
    expect(cli.executeLine('read original.svg')).toEqual(['warning: assigned id rect1 to unnamed <rect>', 'read original.svg (2 elements)']);
    cli.executeLine('move rect1 5 0'); cli.executeLine('undo');
    const before = session.describe(); const history = session.getHistoryStatus();
    expect(cli.executeLine('read bad.svg')).toEqual([`error: ${error}`]);
    expect(session.describe()).toEqual(before); expect(session.getHistoryStatus()).toEqual(history);
    expect(session.getSourcePath()).toBe('original.svg');
    expect(cli.executeLine('redo')).toEqual(['rect#rect1 moved to (5,0)']);
    expect(cli.executeLine('read next.svg')).toEqual(['warning: assigned id rect1 to unnamed <rect>', 'read next.svg (2 elements)']);
  });

  it('生产组合仍拒绝测试类型与 box，没有泄漏测试提供者注册', () => {
    const cli = new EditorComposition().createController(); cli.executeLine('init');
    for (const type of ['probe', 'box']) {
      expect(cli.executeLine(`create ${type} p`)).toEqual([`error: unknown shape type: ${type} (is the plugin loaded?)`]);
    }
    expect(() => new XmlSvgCodec(new EditorComposition().createFactory()).decode(importedProbe)).toThrow('unknown shape type: probe');
  });
});
