import { describe, expect, it } from 'vitest';
import { CliController } from '../../src/adapters/cli/CliController.js';
import { CliPresenter } from '../../src/adapters/cli/CliPresenter.js';
import { EditorSession } from '../../src/application/EditorSession.js';
import type { PluginContext } from '../../src/application/PluginContext.js';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';
import { PluginManifest } from '../../src/bootstrap/PluginManifest.js';
import type { DocumentDescription } from '../../src/domain/DocumentDescription.js';
import { Group } from '../../src/domain/Group.js';
import { PresentationAttributes } from '../../src/domain/PresentationAttributes.js';
import { Rect } from '../../src/domain/Rect.js';
import type { Shape } from '../../src/domain/Shape.js';
import type { ShapeDescription } from '../../src/domain/ShapeDescription.js';
import { Text } from '../../src/domain/Text.js';
import type { AttributeHandler } from '../../src/ports/AttributeHandler.js';
import type { ShapeProvider } from '../../src/ports/ShapeProvider.js';
import type { SvgElement } from '../../src/ports/SvgElement.js';
import type { TreeDecorator } from '../../src/ports/TreeDecorator.js';

class MarkerProbe extends Group {
  public constructor(id: string, children: readonly Shape[]) {
    super(id, children);
    this.preservePresentation(new PresentationAttributes({ 'data-kind': 'marker-probe' }));
  }
  public override getType(): string { return 'marker-probe'; }
  public override canUngroup(): boolean { return false; }
  public override canDetachChild(id: string): boolean { return id !== `${this.getId()}-frame`; }
  public override creationDetails(): string { return 'probe details'; }
  protected override createCopy(children: readonly Shape[]): Group { return new MarkerProbe(this.getId(), children); }
}

class MarkerProvider implements ShapeProvider {
  public getType(): string { return 'marker-probe'; }
  public getUsage(): string { return 'create marker-probe <id>'; }
  public getSvgTag(): string { return 'g'; }
  public create(id: string): Shape { return new MarkerProbe(id, [new Rect(`${id}-frame`, 0, 0, 10, 5), new Text(`${id}-title`, 0, 0, 'before')]); }
  public fromSvg(element: SvgElement, importChild: (element: SvgElement) => Shape): Shape {
    return new MarkerProbe(element.getAttribute('id') ?? '', element.getChildren().map(importChild));
  }
}

class MarkerAttribute implements AttributeHandler {
  public constructor(private readonly attribute: string) {}
  public handles(target: ShapeDescription, attribute: string): boolean { return target.getType() === 'marker-probe' && attribute === this.attribute; }
  public apply(target: ShapeDescription, _attribute: string, value: string | number, set: Parameters<AttributeHandler['apply']>[3]): void {
    set(`${target.getId()}-frame`, 'fill', value);
    if (value === 'fail') { throw new Error('probe\nfailed'); }
    set(`${target.getId()}-title`, 'text', value);
  }
  public summarize(): { forward: string; reverse: string } { return { forward: 'probe changed', reverse: 'probe restored' }; }
}

class MarkerTreeDecorator implements TreeDecorator {
  public prepare(_document: DocumentDescription, saved: DocumentDescription | undefined): (shape?: ShapeDescription) => string | undefined {
    return shape => shape === undefined ? `saved:${saved?.getElementCount()}`
      : shape.getType() === 'marker-probe' ? '(marker)' : undefined;
  }
}

async function fixture() {
  const registry = new EditorComposition().createPluginRegistry();
  await registry.install(PluginManifest.parse({ name: 'test-probe', contributes: {
    shapes: ['marker-probe'], decorators: ['marker', 'suffix'], attributes: ['pair', 'ambiguous-a', 'ambiguous-b'],
  } }), {
    activate(context: PluginContext) {
      context.registerShape(new MarkerProvider());
      context.registerDecorator('marker', new MarkerTreeDecorator());
      context.registerDecorator('suffix', { prepare: () => shape => shape?.getType() === 'marker-probe' ? '*' : undefined });
      context.registerAttribute('pair', new MarkerAttribute('pair'));
      context.registerAttribute('ambiguous-a', new MarkerAttribute('ambiguous'));
      context.registerAttribute('ambiguous-b', new MarkerAttribute('ambiguous'));
    },
  }, undefined);
  const composition = new EditorComposition(registry);
  const session = new EditorSession();
  const factory = composition.createFactory();
  let xml = '';
  const storage = { resolve: (file: string) => file, read: () => xml, write: (_file: string, data: string) => { xml = data; } };
  const cli = new CliController(composition.createDispatcher(factory, storage), session, new CliPresenter(registry.treeDecorators()));
  return { cli, session, storage };
}

describe('Phase 2 extensibility probe', () => {
  it('dispatches a marked shape, preserves its subtype through history, and supports plain SVG fallback', async () => {
    const { cli, session, storage } = await fixture();
    cli.executeLine('init');
    expect(cli.executeLine('create marker-probe p')).toEqual(['marker-probe#p created (probe details)']);
    expect(cli.executeLine('tree').slice(0, 2)).toEqual(['svg (800x600) saved:0', '└── g#p (marker) *']);
    expect(cli.executeLine('tree p')[0]).toBe('g#p (marker) *');
    expect(cli.executeLine('group outer p')).toEqual(['g#outer created with 1 child']);
    expect(cli.executeLine('move p 1 2')).toEqual(['marker-probe#p moved by (1,2)']);
    cli.executeLine('undo');
    cli.executeLine('redo');
    expect(session.describeShape('p').getType()).toBe('marker-probe');
    expect(session.describeShape('p-frame').getPosition()).toEqual([1, 2]);
    for (const input of ['delete p-frame', 'addto outer p-frame', 'group remove-frame p-frame']) {
      expect(cli.executeLine(input)).toEqual(['error: cannot detach required child: p-frame']);
    }
    expect(cli.executeLine('ungroup p')).toEqual(['error: cannot ungroup composite shape: p']);
    cli.executeLine('save test.svg');
    expect(storage.read()).toContain('<g id="p" data-kind="marker-probe">');
    cli.executeLine('init');
    cli.executeLine('read test.svg');
    expect(session.describeShape('p').getType()).toBe('marker-probe');
    expect(cli.executeLine('tree')[0]).toBe('svg (800x600) saved:4');
    const base = new EditorComposition();
    const plainSession = new EditorSession();
    const plain = new CliController(base.createDispatcher(base.createFactory(), storage), plainSession);
    plain.executeLine('read test.svg');
    expect(plainSession.describeShape('p').getType()).toBe('g');
    expect(plainSession.describeShape('p').getAttributes()['data-kind']).toBe('marker-probe');
    expect(plain.executeLine('tree p')[0]).toBe('g#p  data-kind=marker-probe');
  });

  it('keeps multi-part edits in one history entry, falls back, and rolls back both failures and conflicts', async () => {
    const { cli, session } = await fixture();
    cli.executeLine('init');
    cli.executeLine('create marker-probe p');
    expect(cli.executeLine('set p-title fill blue')).toEqual(['text#p-title updated: fill="blue"']);
    expect(cli.executeLine('set p missing green')).toEqual(['error: unknown attribute: missing']);
    expect(cli.executeLine('set p pair green')).toEqual(['probe changed']);
    const after = session.describe();
    expect(session.describeShape('p-frame').getAttributes()['fill']).toBe('green');
    expect(session.describeShape('p-title').getText()).toBe('green');
    expect(cli.executeLine('undo')).toEqual(['probe restored']);
    const before = session.describe();
    expect(session.describeShape('p-frame').getAttributes()['fill']).toBeUndefined();
    expect(session.describeShape('p-title').getText()).toBe('before');
    const history = session.getHistoryStatus();
    expect(cli.executeLine('set p pair fail')).toEqual(['error: unexpected command failure: probe failed']);
    expect(cli.executeLine('set p ambiguous blue')).toEqual(['error: conflicting attribute handlers: ambiguous']);
    expect(session.describe()).toEqual(before);
    expect(session.getHistoryStatus()).toEqual(history);
    expect(cli.executeLine('redo')).toEqual(['probe changed']);
    expect(session.describe()).toEqual(after);
  });
});
