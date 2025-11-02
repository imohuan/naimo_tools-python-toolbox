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
          <Button @click="handleRefresh" :loading="isLoading" size="xs">
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

          <div class="px-2">
            <DownloadButton
              v-if="downloadTarget"
              :url="downloadTarget.url"
              :filename="downloadTarget.filename"
              :version="downloadTarget.version"
              :date="downloadTarget.date"
              label="最新稳定版本"
              badge-text="最新"
              variant="current"
              @download-start="handleDownloadStart"
              @download-complete="handleDownloadComplete"
              @download-error="handleDownloadError"
            />
            <div
              v-else
              class="px-3 py-4 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg text-center"
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
import { computed, ref, onMounted } from "vue";
import { usePythonStore } from "../stores/python";
import { storeToRefs } from "pinia";
import Button from "../components/Button.vue";
import Icon from "../components/Icon.vue";
import DownloadButton from "../components/DownloadButton.vue";
import { useTerminalStore } from "../stores/terminal";

const pythonStore = usePythonStore();
const { pythonInfo, versions } = storeToRefs(pythonStore);
const terminalStore = useTerminalStore();

const isLoading = ref(false);

const latestStableVersion = computed(() =>
  versions.value.find((version) => !version.isPreRelease)
);

const downloadTarget = computed(() => {
  const version = latestStableVersion.value;
  if (!version) return null;

  try {
    const info = pythonStore.getDownloadInfo(version.version);
    return {
      ...info,
      version: version.version,
      date: version.releaseDate
        ? new Date(version.releaseDate).toLocaleDateString("zh-CN")
        : "",
    };
  } catch (error) {
    console.error("获取下载信息失败:", error);
    return null;
  }
});

async function handleRefresh() {
  isLoading.value = true;
  try {
    terminalStore.info("正在检测 Python 环境...");
    const success = await pythonStore.fetchPythonInfo();
    if (success) {
      terminalStore.success("环境检测完成");
    } else {
      terminalStore.error("环境检测失败");
    }
  } finally {
    isLoading.value = false;
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
