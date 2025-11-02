// Python 相关类型定义

export interface PythonVersion {
  version: string;
  releaseDate: string;
  isPreRelease: boolean;
  url: string;
}

export interface PythonInfo {
  pythonVersion: string | null;
  pipVersion: string | null;
  uvVersion: string | null;
  pythonPath: string | null;
  hasUpdate: boolean;
  latestStable?: string;
}

export type Platform = 'win-x64' | 'win-x86' | 'win-arm64' | 'darwin-x64' | 'darwin-arm64' | 'linux-x64' | 'linux-arm64';

export interface DownloadInfo {
  version: string;
  platform: Platform;
  url: string;
  filename: string;
}

export interface VirtualEnv {
  name: string;
  path: string;
  pythonVersion: string;
  createdAt?: string;
  packages?: number;
}

