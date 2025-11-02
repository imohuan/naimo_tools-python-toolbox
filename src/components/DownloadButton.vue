<template>
  <button
    @click="handleDownload"
    :disabled="isDownloading"
    class="relative flex w-full items-center gap-2 overflow-hidden rounded-lg border border-transparent bg-gray-50 px-3 py-2 transition-colors duration-200"
    :class="buttonClasses"
  >
    <!-- 背景进度条 -->
    <div
      v-if="isDownloading"
      class="absolute inset-0 opacity-15 transition-all duration-300"
      :class="progressBgClass"
      :style="{ width: progress + '%' }"
    ></div>

    <!-- 斜向标签 -->
    <div
      class="pointer-events-none absolute -right-7 top-2 flex h-5 w-24 rotate-45 items-center justify-center text-[10px] font-semibold tracking-wide text-white shadow-sm"
      :class="tagClasses"
    >
      {{ isDownloading ? "下载中" : tagText }}
    </div>

    <!-- 左侧图标 -->
    <div
      class="relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-white"
      :class="iconClasses"
    >
      <svg
        class="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <slot name="icon">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </slot>
      </svg>
    </div>

    <!-- 内容区域 -->
    <div class="relative z-10 flex flex-1 items-center justify-between gap-2">
      <div class="text-left">
        <p class="text-[11px] text-gray-500">{{ label }}</p>
        <p class="mt-0.5 font-mono text-base font-semibold text-gray-900">
          {{ version }}
        </p>
        <div class="mt-1 flex h-4 items-center text-[11px] text-gray-500">
          <template v-if="!isDownloading">
            {{ date }}
          </template>
          <template v-else>
            <span class="font-mono text-gray-700"
              >{{ progress.toFixed(1) }}%</span
            >
            <span class="mx-1 text-gray-400">•</span>
            <span class="font-mono text-gray-700"
              >{{ formatBytes(downloadRate) }}/s</span
            >
          </template>
        </div>
      </div>

      <!-- 下载/加载图标 -->
      <div
        class="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md"
      >
        <svg
          v-if="!isDownloading"
          class="h-4 w-4 transition-transform"
          :class="iconColor"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <svg
          v-else
          class="h-4 w-4 animate-spin"
          :class="iconColor"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="3"
            fill="none"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface Props {
  url: string;
  filename: string;
  version: string;
  date?: string;
  label?: string;
  variant?: "lts" | "current";
  tagText?: string;
  tagVariant?: "latest" | "stable" | "preview";
}

const props = withDefaults(defineProps<Props>(), {
  date: "",
  label: "版本",
  variant: "lts",
  tagText: "下载",
  tagVariant: "stable" as const,
});

const emit = defineEmits<{
  downloadStart: [version: string];
  downloadComplete: [filePath: string];
  downloadError: [error: string];
}>();

const isDownloading = ref(false);
const progress = ref(0);
const bytesReceived = ref(0);
const totalBytes = ref(0);
const downloadRate = ref(0);
const currentDownloadId = ref("");

const buttonClasses = computed(() => {
  if (isDownloading.value) {
    return "border-blue-400/80 bg-blue-50/20 cursor-wait";
  }
  return props.variant === "lts"
    ? "hover:border-emerald-400/80"
    : "hover:border-indigo-400/80";
});

const iconClasses = computed(() => {
  const base = "bg-gradient-to-br";
  return props.variant === "lts"
    ? `${base} from-emerald-500 to-teal-500`
    : `${base} from-indigo-500 to-blue-500`;
});

const iconColor = computed(() => {
  return props.variant === "lts" ? "text-emerald-500" : "text-indigo-500";
});

const progressBgClass = computed(() => {
  return props.variant === "lts"
    ? "bg-gradient-to-r from-emerald-400 to-teal-400"
    : "bg-gradient-to-r from-indigo-400 to-blue-400";
});

const tagClasses = computed(() => {
  switch (props.tagVariant) {
    case "latest":
      return "bg-indigo-500";
    case "preview":
      return "bg-orange-500";
    default:
      return "bg-emerald-500";
  }
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

async function handleDownload() {
  if (isDownloading.value) return;

  isDownloading.value = true;
  progress.value = 0;
  bytesReceived.value = 0;
  totalBytes.value = 0;
  downloadRate.value = 0;
  currentDownloadId.value = "";

  emit("downloadStart", props.version);

  let unsubProgress: (() => void) | null = null;
  let unsubCompleted: (() => void) | null = null;
  let unsubError: (() => void) | null = null;

  const cleanup = () => {
    unsubProgress?.();
    unsubCompleted?.();
    unsubError?.();
    currentDownloadId.value = "";
  };

  try {
    // 先注册监听器，使用 ref 可以访问到最新的 downloadId
    unsubProgress = naimo.download.onDownloadProgress((status) => {
      console.log("Progress event:", currentDownloadId.value, status);
      if (currentDownloadId.value && status.id === currentDownloadId.value) {
        console.log("Updating progress:", status.progress);
        progress.value = status.progress;
        bytesReceived.value = status.bytesReceived;
        totalBytes.value = status.totalBytes;
        downloadRate.value = status.downloadRate;
      }
    });

    unsubCompleted = naimo.download.onDownloadCompleted(async (data) => {
      console.log("Completed event:", currentDownloadId.value, data);
      if (currentDownloadId.value && data.id === currentDownloadId.value) {
        progress.value = 100;
        isDownloading.value = false;

        cleanup();

        // 打开下载的文件
        try {
          await naimo.shell.openPath(data.filePath);
        } catch (err) {
          console.error("打开文件失败:", err);
        }

        emit("downloadComplete", data.filePath);
      }
    });

    unsubError = naimo.download.onDownloadError((data) => {
      console.log("Error event:", currentDownloadId.value, data);
      if (currentDownloadId.value && data.id === currentDownloadId.value) {
        isDownloading.value = false;

        cleanup();

        emit("downloadError", data.error);
      }
    });

    // 开始下载，等待获取 downloadId
    const downloadId = await naimo.download.startDownload({
      url: props.url,
      saveAsFilename: props.filename,
    });

    console.log("Download started with ID:", downloadId);

    // 如果 downloadId 为空，说明下载启动失败
    if (!downloadId) {
      throw new Error("下载启动失败：未获取到下载 ID");
    }

    // 将 downloadId 存储到 ref 中，这样监听器闭包可以访问到
    currentDownloadId.value = downloadId;
  } catch (error) {
    console.error("Download error:", error);
    isDownloading.value = false;
    cleanup();
    emit("downloadError", String(error));
  }
}
</script>
