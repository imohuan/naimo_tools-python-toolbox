import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { GlobalPackage, RecommendedTool, SearchPackage } from "../types";
import { hasUpdate } from "../utils/version-compare";

// 推荐工具列表
const recommendedTools: RecommendedTool[] = [
  {
    name: "uv",
    displayName: "uv",
    description: "极快的 Python 包管理器和项目管理工具",
    category: "开发工具",
  },
  {
    name: "requests",
    displayName: "Requests",
    description: "优雅简洁的 HTTP 库",
    category: "Web框架",
  },
  {
    name: "flask",
    displayName: "Flask",
    description: "轻量级 Web 框架",
    category: "Web框架",
  },
  {
    name: "django",
    displayName: "Django",
    description: "全功能 Web 框架",
    category: "Web框架",
  },
  {
    name: "fastapi",
    displayName: "FastAPI",
    description: "现代高性能 Web 框架",
    category: "Web框架",
  },
  {
    name: "numpy",
    displayName: "NumPy",
    description: "科学计算基础库",
    category: "数据科学",
  },
  {
    name: "pandas",
    displayName: "Pandas",
    description: "数据分析库",
    category: "数据科学",
  },
  {
    name: "matplotlib",
    displayName: "Matplotlib",
    description: "数据可视化库",
    category: "数据科学",
  },
  {
    name: "scikit-learn",
    displayName: "Scikit-Learn",
    description: "机器学习库",
    category: "机器学习",
  },
  {
    name: "tensorflow",
    displayName: "TensorFlow",
    description: "深度学习框架",
    category: "机器学习",
  },
  {
    name: "pytorch",
    displayName: "PyTorch",
    description: "深度学习框架",
    category: "机器学习",
  },
  {
    name: "pytest",
    displayName: "pytest",
    description: "Python 测试框架",
    category: "测试工具",
  },
  {
    name: "black",
    displayName: "Black",
    description: "代码格式化工具",
    category: "开发工具",
  },
  {
    name: "pylint",
    displayName: "Pylint",
    description: "代码检查工具",
    category: "开发工具",
  },
  {
    name: "ipython",
    displayName: "IPython",
    description: "增强的交互式 Python Shell",
    category: "开发工具",
  },
];

export const usePackagesStore = defineStore("packages", () => {
  const packages = ref<GlobalPackage[]>([]);
  const searchResults = ref<SearchPackage[]>([]);
  const isLoading = ref(false);
  const isSearching = ref(false);
  const isCheckingUpdates = ref(false);
  const checkProgress = ref(0);
  const usePip = ref(false); // 默认使用 uv
  const commandLoading = ref(false);
  const commandMessage = ref("");

  // 按分类分组的包
  const packagesByCategory = computed(() => {
    const grouped: Record<string, GlobalPackage[]> = {};

    packages.value.forEach((pkg) => {
      const category = pkg.category || "其他";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(pkg);
    });

    return grouped;
  });

  // 有更新的包
  const packagesWithUpdate = computed(() => {
    return packages.value.filter((pkg) => pkg.hasUpdate);
  });

  // 推荐但未安装的工具
  const uninstalledRecommended = computed(() => {
    const installedNames = new Set(packages.value.map((p) => p.name));
    return recommendedTools.filter((tool) => !installedNames.has(tool.name));
  });

  // 获取全局包列表
  async function fetchPackages() {
    isLoading.value = true;
    try {
      const result = await window.pythonToolboxAPI.listGlobalPackages(
        usePip.value
      );

      // 先显示包列表，不检查最新版本（避免大量API调用导致卡死）
      packages.value = result.packages.map((pkg) => {
        // 查找推荐工具中的信息
        const recommended = recommendedTools.find((t) => t.name === pkg.name);

        return {
          name: pkg.name,
          displayName: recommended?.displayName || pkg.name,
          currentVersion: pkg.version,
          latestVersion: undefined,
          hasUpdate: false,
          category: recommended?.category || "其他",
          description: recommended?.description,
          recommended: !!recommended,
        };
      });
    } catch (error) {
      console.error("获取包列表失败:", error);
      packages.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  // 检查单个包的更新（按需调用）
  async function checkPackageUpdate(packageName: string) {
    try {
      const latestVersion = await window.pythonToolboxAPI.getLatestVersion(
        packageName
      );

      if (latestVersion) {
        const pkg = packages.value.find((p) => p.name === packageName);
        if (pkg) {
          pkg.latestVersion = latestVersion;
          pkg.hasUpdate = hasUpdate(pkg.currentVersion, latestVersion);
        }
      }
    } catch (error) {
      console.error(`检查 ${packageName} 更新失败:`, error);
    }
  }

  // 逐个检查所有包的更新
  async function checkAllUpdates() {
    if (packages.value.length === 0 || isCheckingUpdates.value) return;

    isCheckingUpdates.value = true;
    checkProgress.value = 0;

    try {
      const total = packages.value.length;

      for (let i = 0; i < total; i++) {
        const pkg = packages.value[i];
        await checkPackageUpdate(pkg.name);

        // 更新进度
        checkProgress.value = Math.round(((i + 1) / total) * 100);

        // 添加小延迟，避免请求过快
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("批量检查更新失败:", error);
    } finally {
      isCheckingUpdates.value = false;
      checkProgress.value = 0;
    }
  }

  // 安装包
  async function installPackage(name: string): Promise<boolean> {
    return runWithCommandLoading(async () => {
      try {
        const result = await window.pythonToolboxAPI.installGlobalPackage(
          name,
          usePip.value
        );
        if (result.success) {
          await fetchPackages();
        }
        return result.success;
      } catch (error) {
        console.error("安装包失败:", error);
        return false;
      }
    }, `${usePip.value ? "pip" : "uv"} install ${name}`);
  }

  // 更新包
  async function updatePackage(name: string): Promise<boolean> {
    return runWithCommandLoading(async () => {
      try {
        const result = await window.pythonToolboxAPI.updateGlobalPackage(
          name,
          usePip.value
        );
        if (result.success) {
          await fetchPackages();
        }
        return result.success;
      } catch (error) {
        console.error("更新包失败:", error);
        return false;
      }
    }, `${usePip.value ? "pip" : "uv"} update ${name}`);
  }

  // 卸载包
  async function uninstallPackage(name: string): Promise<boolean> {
    return runWithCommandLoading(async () => {
      try {
        const result = await window.pythonToolboxAPI.uninstallGlobalPackage(
          name,
          usePip.value
        );
        if (result.success) {
          await fetchPackages();
        }
        return result.success;
      } catch (error) {
        console.error("卸载包失败:", error);
        return false;
      }
    }, `${usePip.value ? "pip" : "uv"} uninstall ${name}`);
  }

  // 批量更新
  async function updateAllPackages(): Promise<void> {
    const packageNames = packagesWithUpdate.value.map((p) => p.name);
    if (packageNames.length === 0) return;

    await runWithCommandLoading(
      async () => {
        isLoading.value = true;
        try {
          await window.pythonToolboxAPI.batchUpdatePackages(
            packageNames,
            usePip.value
          );
          await fetchPackages();
        } catch (error) {
          console.error("批量更新失败:", error);
        } finally {
          isLoading.value = false;
        }
      },
      `${usePip.value ? "pip" : "uv"} update ${packageNames.length} packages`
    );
  }

  // 批量安装推荐工具
  async function installRecommendedTools(): Promise<void> {
    const toolNames = uninstalledRecommended.value.map((t) => t.name);
    if (toolNames.length === 0) return;

    await runWithCommandLoading(async () => {
      isLoading.value = true;
      try {
        for (const name of toolNames) {
          try {
            await window.pythonToolboxAPI.installGlobalPackage(
              name,
              usePip.value
            );
          } catch (error) {
            console.error(`安装推荐工具 ${name} 失败:`, error);
          }
        }
        await fetchPackages();
      } catch (error) {
        console.error("批量安装失败:", error);
      } finally {
        isLoading.value = false;
      }
    }, `${usePip.value ? "pip" : "uv"} install ${toolNames.length} packages`);
  }

  // 搜索包
  async function searchPackages(keyword: string) {
    if (!keyword.trim()) {
      searchResults.value = [];
      return;
    }

    isSearching.value = true;
    try {
      const result = await window.pythonToolboxAPI.searchPyPIPackages(keyword);

      const installedNames = new Set(packages.value.map((p) => p.name));

      searchResults.value = result.packages.map((pkg) => ({
        ...pkg,
        installed: installedNames.has(pkg.name),
        currentVersion: packages.value.find((p) => p.name === pkg.name)
          ?.currentVersion,
      }));
    } catch (error) {
      console.error("搜索包失败:", error);
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  }

  // 切换包管理器
  function togglePackageManager() {
    usePip.value = !usePip.value;
  }

  async function runWithCommandLoading<T>(
    task: () => Promise<T>,
    message: string
  ): Promise<T> {
    commandLoading.value = true;
    commandMessage.value = message;
    try {
      return await task();
    } finally {
      commandLoading.value = false;
      commandMessage.value = "";
    }
  }

  return {
    packages,
    searchResults,
    isLoading,
    isSearching,
    isCheckingUpdates,
    checkProgress,
    usePip,
    commandLoading,
    commandMessage,
    packagesByCategory,
    packagesWithUpdate,
    uninstalledRecommended,
    recommendedTools,
    fetchPackages,
    checkPackageUpdate,
    checkAllUpdates,
    installPackage,
    updatePackage,
    uninstallPackage,
    updateAllPackages,
    installRecommendedTools,
    searchPackages,
    togglePackageManager,
  };
});
