import { describe, expect, it } from 'vitest';
import { RuntimeEnvironment } from '../../src/bootstrap/RuntimeEnvironment.js';

describe('运行环境兼容边界', () => {
  it.each(['24.11.0', '24.11.1', '24.20.0'])('接受受支持的 Node.js %s', (version) => {
    expect(() => new RuntimeEnvironment(version).assertSupported()).not.toThrow();
  });

  it.each(['22.20.0', '24.10.9', '25.0.0', '26.0.0', 'invalid', '24.11'])('拒绝不受支持的版本 %s', (version) => {
    expect(() => new RuntimeEnvironment(version).assertSupported()).toThrow('需要 Node.js >=24.11.0 <25');
  });
});
