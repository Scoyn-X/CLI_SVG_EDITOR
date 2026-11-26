export type PluginCategory = typeof PluginManifest.categories[number];

export class PluginManifest {
  public static readonly categories = ['shapes', 'commands', 'decorators', 'attributes'] as const;

  private constructor(private readonly name: string, private readonly declared: string) {}

  public static parse(value: unknown): PluginManifest {
    if (typeof value !== 'object' || value === null || !('name' in value) || typeof value.name !== 'string' || !value.name.trim()) {
      throw new Error('invalid plugin package name');
    }
    const contributes = 'contributes' in value ? value.contributes : {};
    if (typeof contributes !== 'object' || contributes === null || Array.isArray(contributes)
      || Object.keys(contributes).some(key => !PluginManifest.categories.some(category => category === key))) {
      throw new Error('invalid plugin contributes');
    }
    const declarations = contributes as Partial<Record<PluginCategory, unknown>>;
    const entries = PluginManifest.categories.map(category => {
      const names = Object.hasOwn(declarations, category) ? declarations[category] : [];
      if (!Array.isArray(names) || !names.every((name): name is string => typeof name === 'string' && name.trim() !== '')
        || new Set(names).size !== names.length) {
        throw new Error(`invalid plugin contributes.${category}`);
      }
      return [category, [...names].sort()] as const;
    });
    return new PluginManifest(value.name, JSON.stringify(Object.fromEntries(entries)));
  }

  public getName(): string { return this.name; }

  public verify(names: (category: PluginCategory) => readonly string[]): void {
    const entries = PluginManifest.categories.map(category => [category, [...names(category)].sort()]);
    const registered = JSON.stringify(Object.fromEntries(entries));
    if (registered !== this.declared) {
      throw new Error(`plugin manifest mismatch: ${this.name} (declared: ${this.declared}, registered: ${registered})`);
    }
  }
}
