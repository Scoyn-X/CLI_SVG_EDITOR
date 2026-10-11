/** 领域错误只保存消息；error: 前缀由交互边界统一添加。 */
export class DomainError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
