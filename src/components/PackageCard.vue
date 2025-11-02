<template>
  <div
    class="p-2 bg-white border rounded-lg hover:border-indigo-400 transition-all group"
    :class="[
      variant === 'recommended'
        ? 'border-indigo-200 bg-indigo-50/20'
        : variant === 'search' && 'installed' in data && data.installed
        ? 'border-green-200 bg-green-50/20'
        : 'border-gray-200',
    ]"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <!-- 标题行 -->
        <div class="flex items-center gap-1 mb-0.5">
          <h4 class="text-xs font-semibold text-gray-900 truncate">
            {{
              ("displayName" in data ? data.displayName : undefined) ||
              data.name
            }}
          </h4>

          <!-- 徽章 -->
          <span
            v-if="'recommended' in data && data.recommended"
            class="px-1 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded flex-shrink-0"
          >
            推荐
          </span>
          <span
            v-else-if="
              'installed' in data && data.installed && variant === 'search'
            "
            class="px-1 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded flex-shrink-0"
          >
            已安装
          </span>
        </div>

        <!-- 标签信息（横向布局） -->
        <div class="flex items-center gap-1 text-[10px] flex-wrap mb-1">
          <!-- 版本信息 -->
          <span
            v-if="
              ('currentVersion' in data && data.currentVersion) ||
              ('version' in data && data.version)
            "
            class="px-1 py-0.5 font-mono text-blue-600 bg-blue-50 rounded"
          >
            {{
              "currentVersion" in data && data.currentVersion
                ? data.currentVersion
                : "version" in data && data.version
                ? `v${data.version}`
                : ""
            }}
          </span>

          <!-- 更新提示 -->
          <template
            v-if="
              'hasUpdate' in data &&
              data.hasUpdate &&
              'latestVersion' in data &&
              data.latestVersion
            "
          >
            <span class="text-amber-600">→</span>
            <span
              class="px-1 py-0.5 font-mono text-amber-600 bg-amber-50 rounded"
            >
              {{ data.latestVersion }}
            </span>
          </template>
          <span
            v-else-if="
              'latestVersion' in data &&
              data.latestVersion &&
              'hasUpdate' in data &&
              !data.hasUpdate
            "
            class="px-1 py-0.5 font-medium text-green-600 bg-green-50 rounded"
          >
            最新
          </span>
        </div>

        <!-- 描述（简短显示） -->
        <p
          v-if="data.description && variant !== 'installed'"
          class="text-[10px] text-gray-500 leading-tight line-clamp-1 mt-0.5"
        >
          {{ data.description }}
        </p>
      </div>

      <!-- 操作按钮 -->
      <div
        class="flex items-center gap-0.5 transition-opacity flex-shrink-0"
        :class="
          operation?.updating ||
          operation?.uninstalling ||
          operation?.installing ||
          operation?.checking
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100'
        "
      >
        <!-- 检查更新加载指示器（始终显示，不需要hover） -->
        <div
          v-if="operation?.checking && variant === 'installed'"
          class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200"
        >
          <div
            class="w-2.5 h-2.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
          ></div>
          <span class="text-[10px] text-blue-600 font-medium">检查中</span>
        </div>
        <!-- 检查更新按钮（检查中时隐藏） -->
        <PackageActionButton
          v-if="
            variant === 'installed' &&
            (!('latestVersion' in data) || data.latestVersion === undefined) &&
            !operation?.checking
          "
          icon="search"
          variant="blue"
          title="检查更新"
          :disabled="
            operation?.updating ||
            operation?.uninstalling ||
            operation?.installing
          "
          @click="$emit('check-update', data.name)"
        />

        <!-- 更新按钮 -->
        <PackageActionButton
          v-if="
            'hasUpdate' in data && data.hasUpdate && variant === 'installed'
          "
          icon="upload"
          variant="green"
          title="更新"
          :loading="operation?.updating"
          :disabled="
            operation?.uninstalling ||
            operation?.installing ||
            operation?.checking ||
            operation?.updating
          "
          @click="$emit('update', data.name)"
        />

        <!-- 安装按钮 -->
        <PackageActionButton
          v-if="
            variant === 'recommended' ||
            (variant === 'search' &&
              (!('installed' in data) || !data.installed))
          "
          icon="download"
          variant="green"
          title="安装"
          :loading="operation?.installing"
          :disabled="
            operation?.updating ||
            operation?.uninstalling ||
            operation?.checking ||
            operation?.installing
          "
          @click="$emit('install', data.name)"
        />

        <!-- 卸载按钮 -->
        <PackageActionButton
          v-if="variant === 'installed'"
          icon="trash"
          variant="red"
          title="卸载"
          :loading="operation?.uninstalling"
          :disabled="
            operation?.updating ||
            operation?.installing ||
            operation?.checking ||
            operation?.uninstalling
          "
          @click="$emit('uninstall', data.name)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GlobalPackage, RecommendedTool, SearchPackage } from "../types";
import PackageActionButton from "./PackageActionButton.vue";

interface Props {
  data: GlobalPackage | RecommendedTool | SearchPackage;
  variant?: "installed" | "recommended" | "search";
  operation?: {
    installing: boolean;
    updating: boolean;
    uninstalling: boolean;
    checking: boolean;
  };
}

withDefaults(defineProps<Props>(), {
  variant: "installed",
});

defineEmits<{
  install: [name: string];
  update: [name: string];
  uninstall: [name: string];
  "open-link": [name: string];
  "check-update": [name: string];
}>();
</script>
