/// <reference types="vite/client" />

// Vite 环境变量类型定义
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Python Toolbox API 类型定义
declare global {
  interface Window {
    pythonToolboxAPI?: {
      getEnvironmentInfo: () => Promise<{
        pythonVersion: string | null;
        pipVersion: string | null;
        uvVersion: string | null;
        pythonPath: string | null;
        pipPath: string | null;
        uvPath: string | null;
        logs: string[];
      }>;
      getPipSupportedOptions: () => Promise<{
        options: string[];
        sourceCommands: string[];
        fetchedAt: string;
      }>;
      getUvSupportedOptions: () => Promise<{
        options: string[];
        sourceCommands: string[];
        fetchedAt: string;
      }>;
      getPythonVersions: () => Promise<
        Array<{
          version: string;
          releaseDate: string;
          isPreRelease: boolean;
        }>
      >;
    };
  }
}
