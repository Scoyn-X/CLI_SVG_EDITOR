import { afterEach, describe, expect, it } from 'vitest';
import { ArchitectureWorkspace } from './ArchitectureWorkspace.js';

let workspace: ArchitectureWorkspace | undefined;

afterEach(() => {
  workspace?.dispose();
  workspace = undefined;
});

describe('真实依赖检查器的模块边界', () => {
  it.each([
    ['domain', 'domain'], ['ports', 'domain'], ['application', 'domain'],
    ['application', 'ports'], ['adapters/cli', 'application'], ['adapters/cli', 'domain'],
    ['adapters/svg', 'ports'], ['adapters/svg', 'domain'],
    ['adapters/shapes', 'domain'], ['adapters/shapes', 'ports'],
    ['adapters/files', 'ports'], ['bootstrap', 'adapters/cli'],
  ])('允许 %s → %s', (source, target) => {
    const relativeTarget = '../'.repeat(source.split('/').length) + `${target}/Target.js`;
    workspace = new ArchitectureWorkspace({
      [`src/${source}/Probe.ts`]: `import type { Value } from '${relativeTarget}'; export type Probe = Value;`,
      [`src/${target}/Target.ts`]: 'export type Value = string;',
    });
    expect(workspace.check()).toContain('no dependency violations found');
  });

  it.each([
    ['domain', 'application'], ['domain', 'ports'], ['domain', 'adapters/cli'],
    ['ports', 'application'], ['application', 'adapters/files'], ['application', 'bootstrap'],
    ['adapters/cli', 'adapters/svg'], ['adapters/svg', 'application'],
    ['adapters/shapes', 'adapters/svg'], ['adapters/files', 'domain'],
  ])('拒绝 %s → %s（包括仅类型依赖）', (source, target) => {
    const relativeTarget = '../'.repeat(source.split('/').length) + `${target}/Target.js`;
    workspace = new ArchitectureWorkspace({
      [`src/${source}/Probe.ts`]: `import type { Value } from '${relativeTarget}'; export type Probe = Value;`,
      [`src/${target}/Target.ts`]: 'export type Value = string;',
    });
    expect(workspace.check()).toContain('not-in-allowed');
  });

  it('拒绝领域层依赖 Node 文件系统', () => {
    workspace = new ArchitectureWorkspace({
      'src/domain/Probe.ts': "export { readFile } from 'node:fs/promises';",
    });
    expect(workspace.check()).toContain('not-in-allowed');
  });

  it('允许文件适配器依赖 Node 文件系统', () => {
    workspace = new ArchitectureWorkspace({
      'src/adapters/files/Probe.ts': "export { readFile } from 'node:fs/promises';",
    });
    expect(workspace.check()).toContain('no dependency violations found');
  });

  it('拒绝循环依赖', () => {
    workspace = new ArchitectureWorkspace({
      'src/domain/First.ts': "export { second } from './Second.js'; export const first = 1;",
      'src/domain/Second.ts': "export { first } from './First.js'; export const second = 2;",
    });
    expect(workspace.check()).toContain('no-cycles');
  });

  it('拒绝无法解析的 import', () => {
    workspace = new ArchitectureWorkspace({
      'src/domain/Probe.ts': "export { missing } from './Missing.js';",
    });
    expect(workspace.check()).toContain('no-unresolved-imports');
  });

  it('拒绝生产代码导入测试文件', () => {
    workspace = new ArchitectureWorkspace({
      'src/bootstrap/Probe.ts': "export { value } from '../../tests/Fixture.js';",
      'tests/Fixture.ts': 'export const value = 1;',
    });
    expect(workspace.check()).toContain('production-must-not-import-tests');
  });

  it('拒绝生产代码依赖开发工具', () => {
    workspace = new ArchitectureWorkspace({
      'src/bootstrap/Probe.ts': "export { describe } from 'vitest';",
    });
    expect(workspace.check()).toContain('production-must-not-import-dev-tools');
  });
});
