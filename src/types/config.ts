// pip/uv 配置相关类型定义

export interface ConfigItem {
  key: string;
  label: string;
  description: string;
  type: "text" | "select" | "boolean" | "number" | "path";
  value: string;
  defaultValue?: string;
  options?: Array<{
    label: string;
    value: string;
  }>;
  placeholder?: string;
  required?: boolean;
}

export interface PyConfig {
  id: string;
  name: string;
  description: string;
  items: ConfigItem[];
}

export type ViewMode = "dual" | "edit" | "preview";

export interface PipConfig {
  registry?: string;
  trustedHost?: string;
  timeout?: number;
  retries?: number;
}

export interface UvConfig {
  indexUrl?: string;
  extraIndexUrl?: string;
  cacheDir?: string;
}

export interface EnvironmentConfig {
  UV_CACHE_DIR?: string;
  PIP_CACHE_DIR?: string;
  VIRTUAL_ENV_BASE?: string;
  PYTHON_PATH?: string;
}

export interface RequirementsLine {
  packageName: string;
  version?: string;
  operator?: string;
  extras?: string[];
  originalLine: string;
}
