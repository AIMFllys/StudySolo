export interface ConfigEntry {
  key: string;
  value: unknown;
  description: string | null;
  updated_by: string | null;
  updated_at: string | null;
}

export interface ConfigListResponse {
  configs: ConfigEntry[];
  total: number;
}
