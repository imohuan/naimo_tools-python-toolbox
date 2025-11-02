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
  const currentCheckingPackage = ref("");
  const shouldCancelCheck = ref(false);
  const isCancelling = ref(false);
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

  // 获取全局包列表（自动检测 uv，优先使用 uv pip）
  async function fetchPackages() {
    isLoading.value = true;
    try {
      const result = await window.pythonToolboxAPI.listGlobalPackages();

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
    currentCheckingPackage.value = "";
    shouldCancelCheck.value = false;
    isCancelling.value = false;

    try {
      const total = packages.value.length;

      for (let i = 0; i < total; i++) {
        // 检查是否取消
        if (shouldCancelCheck.value) {
          break;
        }

        const pkg = packages.value[i];
        currentCheckingPackage.value = pkg.name;

        // 如果正在取消，显示提示
        if (isCancelling.value && currentCheckingPackage.value) {
          // 继续执行但设置标志，让用户知道正在等待当前操作完成
        }

        await checkPackageUpdate(pkg.name);

        // 检查是否取消（在API调用之后也检查）
        if (shouldCancelCheck.value) {
          break;
        }

        // 更新进度
        checkProgress.value = Math.round(((i + 1) / total) * 100);

        // 添加小延迟，避免请求过快（如果已取消则跳过延迟）
        if (!shouldCancelCheck.value) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error("批量检查更新失败:", error);
    } finally {
      currentCheckingPackage.value = "";
      isCheckingUpdates.value = false;
      checkProgress.value = 0;
      shouldCancelCheck.value = false;
      isCancelling.value = false;
    }
  }

  // 取消检查更新
  function cancelCheckUpdates() {
    if (currentCheckingPackage.value) {
      // 如果当前正在检查某个包，设置取消标志并显示提示
      isCancelling.value = true;
      shouldCancelCheck.value = true;
    } else {
      // 如果没有正在检查的包，直接取消
      shouldCancelCheck.value = true;
      isCancelling.value = false;
    }
  }

  // 安装包
  async function installPackage(name: string): Promise<boolean> {
    return runWithCommandLoading(async () => {
      try {
        const result = await window.pythonToolboxAPI.installGlobalPackage(name);
        if (result.success) {
          await fetchPackages();
        }
        return result.success;
      } catch (error) {
        console.error("安装包失败:", error);
        return false;
      }
    }, `安装 ${name}`);
  }

  // 更新包
  async function updatePackage(name: string): Promise<boolean> {
    return runWithCommandLoading(async () => {
      try {
        const result = await window.pythonToolboxAPI.updateGlobalPackage(name);
        if (result.success) {
          await fetchPackages();
        }
        return result.success;
      } catch (error) {
        console.error("更新包失败:", error);
        return false;
      }
    }, `更新 ${name}`);
  }

  // 卸载包
  async function uninstallPackage(name: string): Promise<boolean> {
    return runWithCommandLoading(async () => {
      try {
        const result = await window.pythonToolboxAPI.uninstallGlobalPackage(
          name
        );
        if (result.success) {
          await fetchPackages();
        }
        return result.success;
      } catch (error) {
        console.error("卸载包失败:", error);
        return false;
      }
    }, `卸载 ${name}`);
  }

  // 批量更新
  async function updateAllPackages(): Promise<void> {
    const packageNames = packagesWithUpdate.value.map((p) => p.name);
    if (packageNames.length === 0) return;

    await runWithCommandLoading(async () => {
      isLoading.value = true;
      try {
        await window.pythonToolboxAPI.batchUpdatePackages(packageNames);
        await fetchPackages();
      } catch (error) {
        console.error("批量更新失败:", error);
      } finally {
        isLoading.value = false;
      }
    }, `批量更新 ${packageNames.length} 个包`);
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
            await window.pythonToolboxAPI.installGlobalPackage(name);
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
    }, `批量安装 ${toolNames.length} 个推荐工具`);
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
    currentCheckingPackage,
    isCancelling,
    commandLoading,
    commandMessage,
    packagesByCategory,
    packagesWithUpdate,
    uninstalledRecommended,
    recommendedTools,
    fetchPackages,
    checkPackageUpdate,
    checkAllUpdates,
    cancelCheckUpdates,
    installPackage,
    updatePackage,
    uninstallPackage,
    updateAllPackages,
    installRecommendedTools,
    searchPackages,
  };
});
