<template>
  <div class="w-full h-full overflow-auto">
    <div class="p-2 space-y-2">
      <!-- 环境信息卡片 -->
      <div class="border border-gray-200 rounded-lg bg-white">
        <div
          class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200"
        >
          <div class="flex items-center gap-2">
            <Icon name="server" size="xs" class="text-gray-500" />
            <h3 class="text-xs font-semibold text-gray-700">Python 环境</h3>
          </div>
          <Button @click="handleRefresh" :loading="isLoadingInfo" size="xs">
            <Icon name="refresh" size="xs" />
            刷新
          </Button>
        </div>
        <div class="p-2 space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <div class="p-2 rounded bg-gray-50/50">
              <label class="block text-xs font-medium text-gray-600 mb-1"
                >Python 版本</label
              >
              <div class="text-sm font-semibold text-indigo-600">
                {{ pythonInfo.pythonVersion || "未安装" }}
              </div>
            </div>

            <div class="p-2 rounded bg-gray-50/50">
              <label class="block text-xs font-medium text-gray-600 mb-1"
                >pip 版本</label
              >
              <div class="text-sm font-semibold text-green-600">
                {{ pythonInfo.pipVersion || "未安装" }}
              </div>
            </div>

            <div class="p-2 rounded bg-gray-50/50">
              <label class="block text-xs font-medium text-gray-600 mb-1"
                >uv 版本</label
              >
              <div class="text-sm font-semibold text-blue-600">
                {{ pythonInfo.uvVersion || "未安装" }}
              </div>
            </div>

            <div class="p-2 rounded bg-gray-50/50">
              <label class="block text-xs font-medium text-gray-600 mb-1"
                >Python 路径</label
              >
              <div class="text-[10px] text-gray-600 truncate">
                {{ pythonInfo.pythonPath || "-" }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Python 下载 -->
      <div class="border border-gray-200 rounded-lg bg-white">
        <div
          class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200"
        >
          <div class="flex items-center gap-2">
            <Icon name="download" size="xs" class="text-gray-500" />
            <h3 class="text-xs font-semibold text-gray-700">Python 下载</h3>
          </div>
        </div>
        <div class="p-2 space-y-2">
          <p class="text-xs text-gray-500 px-2">
            从官方网站下载最新版本的 Python
          </p>

          <div class="px-2 space-y-3">
            <div
              v-if="isLoadingVersions"
              class="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center"
            >
              <div
                class="flex items-center justify-center gap-2 text-xs text-gray-500"
              >
                <div
                  class="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"
                ></div>
                <span>正在加载 Python 版本列表...</span>
              </div>
            </div>
            <template v-else-if="hasDownloadOptions">
              <div v-if="primaryStable">
                <DownloadButton
                  :url="primaryStable.url"
                  :filename="primaryStable.filename"
                  :version="primaryStable.version"
                  :date="primaryStable.date"
                  label="最新稳定版本"
                  variant="current"
                  :tag-text="primaryStable.tagText"
                  :tag-variant="primaryStable.tagVariant"
                  @download-start="handleDownloadStart"
                  @download-complete="handleDownloadComplete"
                  @download-error="handleDownloadError"
                />
              </div>

              <div v-if="otherStable.length" class="space-y-2">
                <div class="px-1 text-[12px] font-medium text-gray-500">
                  其他稳定版本
                </div>
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <DownloadButton
                    v-for="item in otherStable"
                    :key="`stable-${item.version}`"
                    :url="item.url"
                    :filename="item.filename"
                    :version="item.version"
                    :date="item.date"
                    label="稳定版本"
                    variant="lts"
                    :tag-text="item.tagText"
                    :tag-variant="item.tagVariant"
                    @download-start="handleDownloadStart"
                    @download-complete="handleDownloadComplete"
                    @download-error="handleDownloadError"
                  />
                </div>
              </div>

              <div v-if="previewVersions.length" class="space-y-2">
                <div class="px-1 text-[12px] font-medium text-gray-500">
                  最新预览版本
                </div>
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <DownloadButton
                    v-for="item in previewVersions"
                    :key="`preview-${item.version}`"
                    :url="item.url"
                    :filename="item.filename"
                    :version="item.version"
                    :date="item.date"
                    label="预览版本"
                    variant="current"
                    :tag-text="item.tagText"
                    :tag-variant="item.tagVariant"
                    @download-start="handleDownloadStart"
                    @download-complete="handleDownloadComplete"
                    @download-error="handleDownloadError"
                  />
                </div>
              </div>
            </template>

            <div
              v-else
              class="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400"
            >
              暂无可用的下载版本，请稍后再试
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { usePythonStore } from "../stores/python";
import { storeToRefs } from "pinia";
import Button from "../components/Button.vue";
import Icon from "../components/Icon.vue";
import DownloadButton from "../components/DownloadButton.vue";
import { useTerminalStore } from "../stores/terminal";
import type { PythonVersion } from "../types";

const pythonStore = usePythonStore();
const { pythonInfo, versions, isLoadingInfo, isLoadingVersions } =
  storeToRefs(pythonStore);
const terminalStore = useTerminalStore();

function compareSemverDesc(a: PythonVersion, b: PythonVersion) {
  const parse = (input: string) =>
    input.split(".").map((part) => Number.parseInt(part) || 0);

  const [aMajor, aMinor, aPatch] = parse(a.version);
  const [bMajor, bMinor, bPatch] = parse(b.version);

  if (aMajor !== bMajor) return bMajor - aMajor;
  if (aMinor !== bMinor) return bMinor - aMinor;
  return (bPatch || 0) - (aPatch || 0);
}

function toDownloadItem(
  version: PythonVersion,
  options: {
    tagText: string;
    tagVariant: "latest" | "stable" | "preview";
    variant: "lts" | "current";
  }
) {
  try {
    const info = pythonStore.getDownloadInfo(version.version);
    return {
      ...info,
      version: version.version,
      date: version.releaseDate
        ? new Date(version.releaseDate).toLocaleDateString("zh-CN")
        : "",
      tagText: options.tagText,
      tagVariant: options.tagVariant,
      variant: options.variant,
    };
  } catch (error) {
    console.error("获取下载信息失败:", error);
    return null;
  }
}

const sortedStableVersions = computed(() => {
  return versions.value
    .filter((version) => !version.isPreRelease)
    .slice()
    .sort(compareSemverDesc);
});

const sortedPreviewVersions = computed(() => {
  return versions.value
    .filter((version) => version.isPreRelease)
    .slice()
    .sort(compareSemverDesc);
});

const primaryStable = computed(() => {
  const version = sortedStableVersions.value[0];
  if (!version) return null;
  return toDownloadItem(version, {
    tagText: "最新",
    tagVariant: "latest",
    variant: "current",
  });
});

const otherStable = computed(() => {
  return sortedStableVersions.value
    .slice(1, 5)
    .map((version) =>
      toDownloadItem(version, {
        tagText: "稳定",
        tagVariant: "stable",
        variant: "lts",
      })
    )
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
});

const previewVersions = computed(() => {
  return sortedPreviewVersions.value
    .slice(0, 4)
    .map((version) =>
      toDownloadItem(version, {
        tagText: "预览",
        tagVariant: "preview",
        variant: "current",
      })
    )
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
});

const hasDownloadOptions = computed(() =>
  Boolean(
    primaryStable.value ||
      otherStable.value.length ||
      previewVersions.value.length
  )
);

async function handleRefresh() {
  try {
    terminalStore.info("正在检测 Python 环境...");
    const success = await pythonStore.fetchPythonInfo();
    if (success) {
      terminalStore.success("环境检测完成");
    } else {
      terminalStore.error("环境检测失败");
    }
  } catch (error: any) {
    terminalStore.error(`环境检测失败：${error.message}`);
  }
}

async function loadVersions() {
  try {
    terminalStore.info("正在获取 Python 版本列表...");
    const success = await pythonStore.fetchVersions();
    if (success) {
      terminalStore.success(`已加载 ${versions.value.length} 个版本信息`);
    } else {
      terminalStore.error("获取版本列表失败");
    }
  } catch (error: any) {
    terminalStore.error(`获取版本列表失败：${error.message}`);
  }
}

function handleDownloadStart(version: string) {
  terminalStore.info(`开始下载 Python ${version}...`);
}

function handleDownloadComplete(filePath: string) {
  terminalStore.success(`下载完成：${filePath}`);
}

function handleDownloadError(error: string) {
  terminalStore.error(`下载失败：${error}`);
}

onMounted(async () => {
  await handleRefresh();
  await loadVersions();
});
</script>
