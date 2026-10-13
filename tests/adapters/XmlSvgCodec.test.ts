import { describe, expect, it } from 'vitest';
import { XmlSvgCodec } from '../../src/adapters/svg/XmlSvgCodec.js';
import { EditorComposition } from '../../src/bootstrap/EditorComposition.js';

const codec = new XmlSvgCodec(new EditorComposition().createFactory());
const wrap = (children: string, attributes = ''): string => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" ${attributes}>${children}</svg>`;

describe('严格 SVG 编解码', () => {
  it('六种类型、嵌套、继承、变换和非默认坐标系语义往返', () => {
    const xml = wrap('<g id="a" transform="translate(60,40) scale(0.8)" fill="blue" data-kind="future"><rect id="r" width="120" height="60"/><circle id="c" cx="1.25" cy="-2" r="4"/><ellipse id="e" rx="2" ry="3"/><line id="l" x2="10" stroke="red" stroke-width="2"/><text id="t" x="60" y="38" font-size="16px" text-anchor="middle">开始 &amp; End</text><g id="b"/></g>', 'viewBox="10 20 800 400" preserveAspectRatio="xMidYMid meet" fill="white"');
    const loaded = codec.decode(xml);
    expect(loaded.getElementCount()).toBe(7);
    const description = loaded.getDocument().describe();
    expect(codec.decode(codec.encode(description)).getDocument().describe()).toEqual(description);
    expect(loaded.getDocument().describeShape('r').getAttributes()).toEqual({ id: 'r', x: 0, y: 0, width: 120, height: 60 });
    expect(description.getCanvasAttributes()['viewBox']).toBe('10 20 800 400');
    const document = loaded.getDocument(); document.move('a', 1, 2); document.scale('a', 2);
    expect(document.describeShape('t').getAttributes()).toMatchObject({ x: 122, y: 80, 'font-size': '16px' });
    expect(document.describeShape('a').getAttributes()['transform']).toBe('translate(60,40) scale(0.8)');
  });

  it('先扫描全部显式 id，补号按前序且大小写敏感，每次独立', () => {
    const xml = wrap('<g><rect/><rect id="rect1"/><rect/><rect id="Rect2"/><g/></g>');
    const loaded = codec.decode(xml);
    expect(loaded.getAssignments().map(item => [item.getId(), item.getTag()])).toEqual([['g1', 'g'], ['rect2', 'rect'], ['rect3', 'rect'], ['g2', 'g']]);
    expect(codec.decode(xml).getDocument().describe()).toEqual(loaded.getDocument().describe());
    expect(loaded.getDocument().describeShape('Rect2').getId()).toBe('Rect2');
  });

  it('命名空间前缀、注释、CDATA、空文本与特殊字符往返', () => {
    const loaded = codec.decode('<s:svg xmlns:s="http://www.w3.org/2000/svg" width="1px" height="2px"><!-- ignore --><s:text id="t" x="0" y="0" fill="a&#10;b&#9;c&#13;&quot;">A<![CDATA[<>&]]>&#13;\n开始</s:text><s:text id="empty"/></s:svg>');
    const description = loaded.getDocument().describe();
    expect(loaded.getDocument().describeShape('t').getText()).toBe('A<>&\r\n开始');
    expect(loaded.getDocument().describeShape('empty').getText()).toBe('');
    expect(codec.decode(codec.encode(description)).getDocument().describe()).toEqual(description);
  });

  it('原生 viewBox 随画布修改，非默认 viewBox 保留', () => {
    const native = codec.decode(wrap('', 'viewBox="0 0 400 200"')).getDocument();
    native.resize(500, 300);
    expect(codec.encode(native.describe())).toContain('viewBox="0 0 500 300"');
    const custom = codec.decode(wrap('', 'viewBox="0 0 40 20"')).getDocument();
    custom.resize(500, 300);
    expect(codec.encode(custom.describe())).toContain('viewBox="0 0 40 20"');
    custom.resize(40, 20);
    const copied = custom.clone(); copied.resize(500, 300);
    expect(codec.encode(copied.describe())).toContain('viewBox="0 0 40 20"');
  });

  it.each([
    '<rect id="a"/><circle id="a"/>', '<rect id=""/>', '<rect id="a b"/>',
    '<path id="a"/>', '<rect id="a" style="fill:red"/>', '<text id="a"><tspan>text</tspan></text>',
    '<rect id="a">unexpected</rect>', '<g id="a">unexpected</g>', '<rect id="a" width="1px"/>',
    '<rect id="a" width="-1"/>', '<rect id="a" width="Infinity"/>', '<rect id="a" transform="rotate(1)"/>',
    '<rect id="a" transform="translate(1,,2)"/>', '<rect id="a" transform=",scale(1)"/>',
    '<rect id="a" transform="scale(1),"/>', '<rect id="a" transform="scale(1) junk scale(2)"/>',
    '<rect id="a" font-size="10%"/>', '<text id="a" text-anchor="other"/>', '<g xmlns="urn:other"/>',
    '<q:rect/>', '<rect xmlns:xml="urn:bad"/>', '<rect xmlns:q=""/>', '<rect q:x="1"/>',
    '<rect id="a" id="b"/>', '<rect></circle>', '<rect id="a">&unknown;</rect>',
  ])('拒绝不支持或不合法内容 %s', body => { expect(() => codec.decode(wrap(body))).toThrow(); });

  it.each([
    '<svg xmlns="http://www.w3.org/2000/svg" height="1"/>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="1"/>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="1"/>',
    '<svg width="1" height="1"/>', wrap('', 'viewBox="0,,0,1,1"'), wrap('', 'viewBox="0 0 0 1"'),
    wrap('', 'id="root"'), wrap('unexpected'), '<!DOCTYPE svg SYSTEM "https://example.invalid/a.dtd">' + wrap(''),
    '<?x data?>' + wrap(''), wrap('<?x data?>'), '<?xml version="1.1"?>' + wrap(''),
    '<?xml version="1.0" encoding="UTF-16"?>' + wrap(''), wrap('') + wrap(''), '',
  ])('根、XML 及外部资源边界 %s', xml => { expect(() => codec.decode(xml)).toThrow(); });
});
