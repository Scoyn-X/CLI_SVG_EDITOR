/** 工程启动前验证工具链支持的 Node.js 环境，不包含编辑器业务。 */
export class RuntimeEnvironment {
  private readonly version: string;

  public constructor(version: string = process.versions.node) {
    this.version = version;
  }

  public assertSupported(): void {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(this.version);
    if (match === null || Number(match[1]) !== 24 || Number(match[2]) < 11) {
      throw new Error(`需要 Node.js >=24.11.0 <25；当前为 ${this.version}`);
    }
  }
}
