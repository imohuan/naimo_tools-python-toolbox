import { defineStore } from "pinia";
import { ref } from "vue";
import type { PythonInfo, PythonVersion, Platform } from "../types";

export const usePythonStore = defineStore("python", () => {
  const pythonInfo = ref<PythonInfo>({
    pythonVersion: null,
    pipVersion: null,
    uvVersion: null,
    pythonPath: null,
    hasUpdate: false,
  });

  const versions = ref<PythonVersion[]>([]);
  const selectedPlatform = ref<Platform>("win-x64");
  const isLoading = ref(false);

  // 比较版本号
  function compareVersion(current: string, latest: string): number {
    const parseVersion = (v: string) => {
      const cleaned = v.replace(/^v/, "");
      const parts = cleaned.split(".").map((p) => parseInt(p) || 0);
      return parts;
    };

    const currentParts = parseVersion(current);
    const latestParts = parseVersion(latest);

    for (
      let i = 0;
      i < Math.max(currentParts.length, latestParts.length);
      i++
    ) {
      const curr = currentParts[i] || 0;
      const lat = latestParts[i] || 0;

      if (curr < lat) return -1;
      if (curr > lat) return 1;
    }

    return 0;
  }

  // 检查版本更新
  function checkUpdate() {
    if (pythonInfo.value.pythonVersion && versions.value.length > 0) {
      const latestStable = versions.value.find((v) => !v.isPreRelease);

      if (latestStable) {
        pythonInfo.value.hasUpdate =
          compareVersion(pythonInfo.value.pythonVersion, latestStable.version) <
          0;
      }
    }
  }

  // 获取当前环境信息
  async function fetchPythonInfo(): Promise<boolean> {
    isLoading.value = true;
    try {
      if (!window.pythonToolboxAPI) {
        console.error("pythonToolboxAPI 不可用");
        return false;
      }
      const envInfo = await window.pythonToolboxAPI.getEnvironmentInfo();

      pythonInfo.value = {
        pythonVersion: envInfo.pythonVersion,
        pipVersion: envInfo.pipVersion,
        uvVersion: envInfo.uvVersion,
        pythonPath: envInfo.pythonPath,
        hasUpdate: false,
      };

      checkUpdate();
      return true;
    } catch (error) {
      console.error("获取 Python 信息失败:", error);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // 获取 Python 版本列表
  async function fetchVersions(): Promise<boolean> {
    isLoading.value = true;
    try {
      if (!window.pythonToolboxAPI) {
        console.error("pythonToolboxAPI 不存在");
        return false;
      }
      const data = await window.pythonToolboxAPI.getPythonVersions();
      versions.value = data.slice(0, 20); // 只取前20个版本

      checkUpdate();
      return true;
    } catch (error) {
      console.error("获取版本列表失败:", error);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // 自动检测当前平台
  function detectPlatform(): Platform {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    if (platform.includes("win")) {
      return "win-x64";
    } else if (platform.includes("mac") || userAgent.includes("mac")) {
      if (userAgent.includes("arm") || platform.includes("arm")) {
        return "darwin-arm64";
      }
      return "darwin-x64";
    } else if (platform.includes("linux") || userAgent.includes("linux")) {
      if (userAgent.includes("arm") || platform.includes("arm")) {
        return "linux-arm64";
      }
      return "linux-x64";
    }

    return "win-x64";
  }

  // 获取下载信息
  function getDownloadInfo(version: string): { url: string; filename: string } {
    const detectedPlatform = detectPlatform();

    let filename: string;
    let url: string;

    if (detectedPlatform === "win-x64") {
      filename = `python-${version}-amd64.exe`;
      url = `https://www.python.org/ftp/python/${version}/${filename}`;
    } else if (detectedPlatform === "win-x86") {
      filename = `python-${version}.exe`;
      url = `https://www.python.org/ftp/python/${version}/${filename}`;
    } else if (detectedPlatform === "win-arm64") {
      filename = `python-${version}-arm64.exe`;
      url = `https://www.python.org/ftp/python/${version}/${filename}`;
    } else if (detectedPlatform.startsWith("darwin")) {
      filename = `python-${version}-macos11.pkg`;
      url = `https://www.python.org/ftp/python/${version}/${filename}`;
    } else if (detectedPlatform === "linux-x64") {
      filename = `Python-${version}.tgz`;
      url = `https://www.python.org/ftp/python/${version}/${filename}`;
    } else if (detectedPlatform === "linux-arm64") {
      filename = `Python-${version}.tgz`;
      url = `https://www.python.org/ftp/python/${version}/${filename}`;
    } else {
      throw new Error(`不支持的平台: ${detectedPlatform}`);
    }

    return { url, filename };
  }

  return {
    pythonInfo,
    versions,
    selectedPlatform,
    isLoading,
    fetchPythonInfo,
    fetchVersions,
    getDownloadInfo,
  };
});
