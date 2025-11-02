// 全局包管理相关类型定义

export interface GlobalPackage {
  name: string;
  displayName?: string;
  currentVersion: string;
  latestVersion?: string;
  hasUpdate: boolean;
  description?: string;
  category?: string;
  recommended?: boolean;
  homepage?: string;
  repository?: string;
}

export interface PackageUpdateInfo {
  name: string;
  currentVersion: string;
  latestVersion: string;
  updateType: "major" | "minor" | "patch";
}

export interface RecommendedTool {
  name: string;
  displayName: string;
  description: string;
  category: string;
}

export interface SearchPackage {
  name: string;
  description: string;
  version: string;
  author?: string;
  keywords?: string[];
  date?: string;
  installed?: boolean;
  currentVersion?: string;
}

export type PackageCategory =
  | "Web框架"
  | "数据科学"
  | "机器学习"
  | "开发工具"
  | "测试工具"
  | "其他";

export interface PyPIPackage {
  info: {
    name: string;
    version: string;
    summary: string;
    author: string;
    home_page: string;
    project_url: string;
  };
  releases: Record<string, any[]>;
}
