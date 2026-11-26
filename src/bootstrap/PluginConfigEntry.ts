export interface PluginConfigEntry {
  readonly module: string;
  readonly enabled?: boolean;
  readonly options?: unknown;
}
