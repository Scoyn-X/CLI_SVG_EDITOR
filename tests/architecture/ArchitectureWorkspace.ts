import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 在隔离目录中运行真实依赖检查器，不向生产模块写入违例。 */
export class ArchitectureWorkspace {
  private readonly projectRoot = fileURLToPath(new URL('../../', import.meta.url));
  private readonly fixtureParent = join(this.projectRoot, 'artifacts', 'architecture-tests');
  private readonly fixtureRoot: string;

  public constructor(files: Readonly<Record<string, string>>) {
    mkdirSync(this.fixtureParent, { recursive: true });
    this.fixtureRoot = mkdtempSync(join(this.fixtureParent, 'case-'));
    for (const config of ['package.json', 'tsconfig.json', 'dependency-cruiser.config.json']) {
      writeFileSync(join(this.fixtureRoot, config), readFileSync(join(this.projectRoot, config)));
    }
    for (const [path, content] of Object.entries(files)) {
      const target = resolve(this.fixtureRoot, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content, 'utf8');
    }
  }

  public check(): string {
    const result = spawnSync(process.execPath, [
      join(this.projectRoot, 'node_modules', 'dependency-cruiser', 'bin', 'dependency-cruiser.mjs'),
      '--config', 'dependency-cruiser.config.json', '--output-type', 'err-long', 'src',
    ], { cwd: this.fixtureRoot, encoding: 'utf8', windowsHide: true, timeout: 12_000 });
    if (result.error !== undefined) {
      throw result.error;
    }
    const output = result.stdout + result.stderr;
    if (result.status === null || result.status < 0
      || (result.status === 0) !== output.includes('no dependency violations found')
      || (result.status > 0 && !output.includes('dependency violations'))) {
      throw new Error(`依赖检查器执行异常（${String(result.status)}）：${output}`);
    }
    return output;
  }

  public dispose(): void {
    // 只允许删除本实例在工程 artifacts 中创建的直接子目录。
    if (dirname(this.fixtureRoot) !== this.fixtureParent) {
      throw new Error('架构测试临时目录越界');
    }
    rmSync(this.fixtureRoot, { recursive: true, force: true });
  }
}
