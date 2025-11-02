<template>
  <div class="w-full h-full flex flex-col">
    <!-- Teleport 到顶部的自定义区域 -->
    <Teleport to="#tab-actions">
      <template v-if="route.path === '/config'">
        <!-- 方案选择 -->
        <div class="flex items-center gap-2 border-r border-gray-200 pr-4">
          <span class="text-xs text-gray-600 font-medium">方案</span>
          <Select
            v-model="currentPreset"
            :options="presetOptions"
            @update:modelValue="applyPreset"
            size="sm"
          />
        </div>

        <!-- 菜单下拉框 -->
        <div class="flex items-center border-r border-gray-200 pr-4">
          <DropdownMenu ref="menuDropdownRef">
            <template #default="{ close }">
              <!-- 配置类型切换 -->
              <div class="px-2 py-1">
                <div class="text-[10px] text-gray-500 font-medium mb-1">
                  配置类型
                </div>
                <div
                  class="flex items-center gap-1 bg-gray-100 rounded-md p-0.5"
                >
                  <button
                    @click.stop="
                      configType = 'pip';
                      close();
                    "
                    :class="[
                      'flex-1 px-2 py-1.5 text-xs rounded-md transition-all',
                      configType === 'pip'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900',
                    ]"
                  >
                    pip
                  </button>
                  <button
                    @click.stop="
                      configType = 'uv';
                      close();
                    "
                    :class="[
                      'flex-1 px-2 py-1.5 text-xs rounded-md transition-all',
                      configType === 'uv'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900',
                    ]"
                  >
                    uv
                  </button>
                </div>
              </div>

              <!-- 分隔线 -->
              <div class="border-t border-gray-200 my-1"></div>

              <!-- 显示过滤选项 -->
              <div class="px-2 py-1">
                <div class="text-[10px] text-gray-500 font-medium mb-1">
                  显示过滤
                </div>
                <div
                  class="flex items-center gap-1 bg-gray-100 rounded-md p-0.5"
                >
                  <button
                    @click.stop="
                      showOnlyConfigured = false;
                      close();
                    "
                    :class="[
                      'flex-1 px-2 py-1.5 text-xs rounded-md transition-all flex items-center justify-center gap-1',
                      !showOnlyConfigured
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900',
                    ]"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    <span>全部</span>
                  </button>
                  <button
                    @click.stop="
                      showOnlyConfigured = true;
                      close();
                    "
                    :class="[
                      'flex-1 px-2 py-1.5 text-xs rounded-md transition-all flex items-center justify-center gap-1',
                      showOnlyConfigured
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900',
                    ]"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polygon
                        points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
                      />
                    </svg>
                    <span>已配置</span>
                  </button>
                </div>
              </div>

              <!-- 分隔线 -->
              <div class="border-t border-gray-200 my-1"></div>

              <!-- 视图切换选项 -->
              <div class="px-2 py-1">
                <div class="text-[10px] text-gray-500 font-medium mb-1">
                  视图模式
                </div>
                <div
                  class="flex items-center gap-1 bg-gray-100 rounded-md p-0.5"
                >
                  <button
                    v-for="mode in viewModes"
                    :key="mode.value"
                    @click.stop="
                      viewMode = mode.value as ViewMode;
                      close();
                    "
                    :class="[
                      'flex-1 px-2 py-1.5 text-xs rounded-md transition-all flex items-center justify-center gap-1',
                      viewMode === mode.value
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900',
                    ]"
                    :title="mode.label"
                  >
                    <Icon :name="mode.icon" size="xs" />
                    <span>{{ mode.label }}</span>
                  </button>
                </div>
              </div>
            </template>
          </DropdownMenu>
        </div>
      </template>
    </Teleport>

    <!-- 主内容区 -->
    <div class="flex-1 flex min-h-0 overflow-hidden">
      <!-- 配置编辑区 -->
      <div
        v-show="viewMode === 'dual' || viewMode === 'edit'"
        :class="
          viewMode === 'dual' ? 'w-1/2 border-r border-gray-200' : 'w-full'
        "
        class="flex flex-col min-h-0 overflow-hidden"
      >
        <div class="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div class="p-2 space-y-2">
            <!-- 按分类显示配置项 -->
            <div
              v-for="category in categories"
              :key="category"
              class="border border-gray-200 rounded-lg"
            >
              <!-- 分类标题栏 -->
              <div
                @click="toggleCategory(category)"
                class="flex items-center justify-between px-3 py-1.5 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors select-none sticky top-0 z-10 border-gray-200"
                :class="{
                  'border-b': !isCategoryCollapsed(category),
                  'rounded-lg': isCategoryCollapsed(category),
                  'rounded-t-lg': !isCategoryCollapsed(category),
                }"
              >
                <div class="flex items-center gap-1.5">
                  <!-- 展开/折叠箭头 -->
                  <div
                    class="text-gray-500 flex-shrink-0 transition-transform duration-200"
                    :class="{
                      'rotate-0': !isCategoryCollapsed(category),
                      '-rotate-90': isCategoryCollapsed(category),
                    }"
                  >
                    <Icon name="chevron-down" size="xs" />
                  </div>

                  <!-- 分类名称 -->
                  <span class="text-xs font-semibold text-gray-700">{{
                    category
                  }}</span>

                  <!-- 配置项数量 -->
                  <span class="text-xs text-gray-400">
                    ({{ getFieldsByCategory(category).length }})
                  </span>
                </div>
              </div>

              <!-- 分类内容 -->
              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="max-h-0 opacity-0"
                enter-to-class="max-h-[2000px] opacity-100"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="max-h-[2000px] opacity-100"
                leave-to-class="max-h-0 opacity-0"
              >
                <div
                  v-show="!isCategoryCollapsed(category)"
                  class="bg-white border-0"
                >
                  <div class="p-2 space-y-1">
                    <div
                      v-for="field in getFieldsByCategory(category)"
                      :key="field.key"
                      class="flex flex-col gap-1 py-1.5 px-2 hover:bg-gray-50 rounded transition-all group"
                    >
                      <!-- 第一层：左右布局（标题 + 组件） -->
                      <div class="flex items-center gap-2">
                        <!-- 左侧标题 -->
                        <label
                          class="w-36 flex-shrink-0 text-xs font-medium text-gray-700 truncate"
                          :title="field.label"
                        >
                          {{ field.label }}
                        </label>

                        <!-- 右侧组件 -->
                        <div
                          class="flex-1 flex items-center gap-1.5 min-w-0 overflow-hidden"
                        >
                          <!-- 带下拉的输入框（用于镜像源等） -->
                          <Combobox
                            v-if="field.type === 'text' && field.options"
                            v-model="config[field.key]"
                            :options="getComboboxOptions(field)"
                            :placeholder="field.placeholder"
                            class="flex-1"
                          />

                          <!-- 纯文本输入 -->
                          <input
                            v-else-if="field.type === 'text'"
                            v-model="config[field.key]"
                            type="text"
                            class="flex-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-400 transition-all min-w-0"
                            :placeholder="field.placeholder"
                          />

                          <!-- 数字输入 -->
                          <input
                            v-else-if="field.type === 'number'"
                            v-model.number="config[field.key]"
                            type="number"
                            class="flex-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-400 transition-all min-w-0"
                            :placeholder="field.placeholder"
                          />

                          <!-- 下拉选择 -->
                          <Select
                            v-else-if="field.type === 'select'"
                            v-model="config[field.key]"
                            :options="[
                              { label: '不设置', value: '' },
                              ...(field.options || []),
                            ]"
                            size="sm"
                            class="flex-1"
                          />

                          <!-- 布尔值 -->
                          <label
                            v-else-if="field.type === 'boolean'"
                            class="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              v-model="config[field.key]"
                              type="checkbox"
                              class="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                            <span class="text-xs text-gray-700">启用</span>
                          </label>

                          <!-- 打开文件夹按钮（仅针对路径类型） -->
                          <button
                            v-if="
                              field.type === 'text' &&
                              (field.key.endsWith('-dir') ||
                                field.key.endsWith('-cert') ||
                                ['cert', 'log', 'log-file'].includes(field.key))
                            "
                            @click="selectFolder(field.key)"
                            class="w-5 h-5 flex items-center justify-center flex-shrink-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                            title="选择文件夹"
                          >
                            <Icon name="folder" size="xs" />
                          </button>

                          <!-- 删除按钮 -->
                          <button
                            v-if="
                              config[field.key] !== undefined &&
                              config[field.key] !== '' &&
                              config[field.key] !== false
                            "
                            @click="delete config[field.key]"
                            class="w-5 h-5 flex items-center justify-center flex-shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                            title="清除此项"
                          >
                            <Icon name="x" size="xs" />
                          </button>
                        </div>
                      </div>

                      <!-- 第二层：描述 -->
                      <p
                        class="text-xs text-gray-400 leading-tight pl-0"
                        :title="field.description"
                      >
                        {{ field.description }}
                      </p>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>

      <!-- 预览区 -->
      <div
        v-show="viewMode === 'dual' || viewMode === 'preview'"
        :class="viewMode === 'dual' ? 'w-1/2' : 'w-full'"
        class="flex flex-col min-h-0 overflow-hidden"
      >
        <div
          class="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2 min-h-0"
        >
          <!-- 生成的配置 -->
          <div
            class="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200"
          >
            <!-- 头部 -->
            <div
              class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200"
            >
              <span class="text-xs text-gray-700 font-mono font-semibold">{{
                configFileName
              }}</span>
              <div class="flex gap-1.5">
                <button
                  @click="copyToClipboard"
                  :disabled="copyStatus === 'copying'"
                  :class="[
                    'w-6 h-6 flex items-center justify-center rounded transition-all',
                    copyStatus === 'copying'
                      ? 'text-indigo-400 cursor-not-allowed'
                      : copyStatus === 'success'
                      ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                      : copyStatus === 'error'
                      ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50',
                  ]"
                  :title="
                    copyStatus === 'copying'
                      ? '复制中...'
                      : copyStatus === 'success'
                      ? '复制成功'
                      : copyStatus === 'error'
                      ? '复制失败'
                      : '复制'
                  "
                >
                  <Icon
                    :name="
                      copyStatus === 'copying'
                        ? 'refresh'
                        : copyStatus === 'success'
                        ? 'check'
                        : copyStatus === 'error'
                        ? 'x'
                        : 'copy'
                    "
                    size="xs"
                    :class="{ 'animate-spin': copyStatus === 'copying' }"
                  />
                </button>
                <button
                  @click="applyToGlobal"
                  class="w-6 h-6 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded transition-all"
                  title="应用到全局"
                >
                  <Icon name="save" size="xs" />
                </button>
              </div>
            </div>

            <!-- 内容 -->
            <textarea
              v-model="editableConfig"
              spellcheck="false"
              class="w-full p-3 text-xs text-gray-800 font-mono leading-relaxed bg-white resize-none focus:outline-none min-h-[300px] overflow-x-auto"
              :placeholder="`# 在此编辑 ${configFileName} 配置`"
              style="word-wrap: break-word; overflow-wrap: break-word"
            ></textarea>
          </div>

          <!-- 当前系统配置对比 -->
          <div
            class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
          >
            <div class="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <span class="text-xs font-semibold text-gray-700"
                >当前系统 {{ configFileName }}</span
              >
            </div>
            <pre
              v-if="currentConfigContent"
              class="p-3 text-xs text-gray-700 font-mono leading-relaxed max-h-96 overflow-auto select-text whitespace-pre-wrap break-words"
              style="word-wrap: break-word; overflow-wrap: break-word"
              >{{ currentConfigContent }}</pre
            >
            <div v-else class="p-3 text-xs text-gray-500 text-center">
              未找到配置文件
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";
import { pipFields, presetConfigs } from "../data/pip-fields";
import { uvFields, uvPresetConfigs } from "../data/uv-fields";
import { generatePipConfig, parsePipConfig } from "../utils/pip-config-parser";
import { generateUvConfig, parseUvConfig } from "../utils/uv-config-parser";
import { useNotify } from "../composables/useNotify";
import { usePythonStore } from "../stores/python";
import Select from "../components/Select.vue";
import Combobox from "../components/Combobox.vue";
import DropdownMenu from "../components/DropdownMenu.vue";
import Icon from "../components/Icon.vue";

type ViewMode = "dual" | "edit" | "preview";
type ConfigType = "pip" | "uv";

const route = useRoute();
const notify = useNotify();
const pythonStore = usePythonStore();
const collapsedCategories = ref<Set<string>>(new Set());
const menuDropdownRef = ref<InstanceType<typeof DropdownMenu> | null>(null);

const configType = ref<ConfigType>("pip");
const viewMode = ref<ViewMode>("dual");
const currentPreset = ref("current");
const config = reactive<Record<string, any>>({});
const currentPipConfigContent = ref("");
const editablePipConfig = ref("");
const currentUvConfigContent = ref("");
const editableUvConfig = ref("");
const showOnlyConfigured = ref(false);
const isParsingFromText = ref(false);
const copyStatus = ref<"idle" | "copying" | "success" | "error">("idle");

const viewModes = [
  { label: "双屏", value: "dual", icon: "layout-split" },
  { label: "编辑", value: "edit", icon: "edit" },
  { label: "预览", value: "preview", icon: "eye" },
];

const presetOptions = computed(() => {
  if (configType.value === "pip") {
    return [
      { label: "当前全局配置", value: "current" },
      { label: "清华镜像", value: "tsinghua" },
      { label: "阿里云镜像", value: "aliyun" },
      { label: "官方源", value: "official" },
    ];
  } else {
    return [
      { label: "当前全局配置", value: "current" },
      { label: "清华镜像", value: "tsinghua" },
      { label: "阿里云镜像", value: "aliyun" },
      { label: "官方源", value: "official" },
    ];
  }
});

const rawFields = computed(() => {
  return configType.value === "pip" ? pipFields : uvFields;
});

function isFieldSupported(field: any) {
  const meta = field.meta ?? {};

  if (configType.value === "pip") {
    if (meta.since && !pythonStore.isPipVersionAtLeast(meta.since)) {
      return false;
    }
    if (meta.until && pythonStore.isPipVersionAtLeast(meta.until)) {
      return false;
    }
    if (meta.cliFlags && meta.cliFlags.length > 0) {
      const supported = meta.cliFlags.some((flag: string) =>
        pythonStore.isPipOptionSupported(flag)
      );
      if (!supported) {
        return false;
      }
    }
  } else {
    if (meta.since && !pythonStore.isUvVersionAtLeast(meta.since)) {
      return false;
    }
    if (meta.until && pythonStore.isUvVersionAtLeast(meta.until)) {
      return false;
    }
    if (meta.cliFlags && meta.cliFlags.length > 0) {
      const supported = meta.cliFlags.some((flag: string) =>
        pythonStore.isUvOptionSupported(flag)
      );
      if (!supported) {
        return false;
      }
    }
  }

  return true;
}

const currentFields = computed(() => {
  return rawFields.value.filter((field) => isFieldSupported(field));
});

const visibleFieldKeys = computed(() =>
  currentFields.value.map((field) => field.key)
);

const sanitizedConfig = computed(() => {
  const allowed = new Set(visibleFieldKeys.value);
  const result: Record<string, any> = {};
  Object.entries(config).forEach(([key, value]) => {
    if (allowed.has(key)) {
      result[key] = value;
    }
  });
  return result;
});

const categories = computed(() => {
  const cats = new Set<string>();
  currentFields.value.forEach((field) => cats.add(field.category));
  const allCategories = Array.from(cats);

  if (showOnlyConfigured.value) {
    return allCategories.filter((category) => {
      return getFieldsByCategory(category).length > 0;
    });
  }

  return allCategories;
});

function getFieldsByCategory(category: string) {
  const fields = currentFields.value.filter(
    (field) => field.category === category
  );

  if (showOnlyConfigured.value) {
    return fields.filter((field) => {
      const value = config[field.key];
      return (
        value !== undefined && value !== null && value !== "" && value !== false
      );
    });
  }

  return fields;
}

function toggleCategory(category: string) {
  if (collapsedCategories.value.has(category)) {
    collapsedCategories.value.delete(category);
  } else {
    collapsedCategories.value.add(category);
  }
}

function isCategoryCollapsed(category: string) {
  return collapsedCategories.value.has(category);
}

function getComboboxOptions(field: any) {
  if (!field.options) return [];
  return field.options;
}

const generatedConfig = computed(() => {
  if (configType.value === "pip") {
    return generatePipConfig(sanitizedConfig.value);
  } else {
    return generateUvConfig(sanitizedConfig.value);
  }
});

const editableConfig = computed({
  get: () => {
    return configType.value === "pip"
      ? editablePipConfig.value
      : editableUvConfig.value;
  },
  set: (value: string) => {
    if (configType.value === "pip") {
      editablePipConfig.value = value;
    } else {
      editableUvConfig.value = value;
    }
  },
});

const currentConfigContent = computed(() => {
  return configType.value === "pip"
    ? currentPipConfigContent.value
    : currentUvConfigContent.value;
});

const configFileName = computed(() => {
  return configType.value === "pip" ? "pip.ini" : "uv.toml";
});

// 监听配置变化，同步到可编辑文本框
watch(
  generatedConfig,
  (newValue) => {
    if (!isParsingFromText.value) {
      editableConfig.value = newValue;
    }
  },
  { immediate: true }
);

watch(
  () => [...visibleFieldKeys.value],
  (keys) => {
    const allowed = new Set(keys);
    Object.keys(config).forEach((key) => {
      if (!allowed.has(key)) {
        delete config[key];
      }
    });
  },
  { immediate: true }
);

function pruneUnsupportedKeys() {
  const allowed = new Set(visibleFieldKeys.value);
  Object.keys(config).forEach((key) => {
    if (!allowed.has(key)) {
      delete config[key];
    }
  });
}

// 监听配置类型切换
watch(configType, () => {
  currentPreset.value = "current";
  applyPreset();
  refreshCurrentConfigContent();
});

// 解析文本内容到配置对象
function parseConfigText(text: string) {
  if (!text || text.trim() === "" || text === "# 暂无配置") {
    return;
  }

  isParsingFromText.value = true;

  try {
    const parsed =
      configType.value === "pip" ? parsePipConfig(text) : parseUvConfig(text);

    // 清空现有配置并应用新配置
    Object.keys(config).forEach((key) => delete config[key]);
    Object.assign(config, parsed);
    pruneUnsupportedKeys();
  } finally {
    setTimeout(() => {
      isParsingFromText.value = false;
    }, 0);
  }
}

// 防抖监听可编辑文本框的变化
let parseTimer: number | null = null;
watch(editableConfig, (newValue) => {
  if (isParsingFromText.value) {
    return;
  }

  if (parseTimer) {
    clearTimeout(parseTimer);
  }

  parseTimer = window.setTimeout(() => {
    parseConfigText(newValue);
  }, 500);
});

async function applyPreset() {
  if (currentPreset.value === "current") {
    await loadCurrentConfig();
    return;
  }

  const preset =
    configType.value === "pip"
      ? presetConfigs[currentPreset.value as keyof typeof presetConfigs]
      : uvPresetConfigs[currentPreset.value as keyof typeof uvPresetConfigs];

  if (preset) {
    Object.keys(config).forEach((key) => delete config[key]);
    Object.assign(config, preset);
    pruneUnsupportedKeys();
    notify.success(
      `已应用预设: ${
        presetOptions.value.find((o) => o.value === currentPreset.value)?.label
      }`
    );
  }
}

async function copyToClipboard() {
  if (copyStatus.value === "copying") return;

  copyStatus.value = "copying";

  try {
    await navigator.clipboard.writeText(editableConfig.value);
    copyStatus.value = "success";
    notify.success("已复制到剪贴板");

    setTimeout(() => {
      copyStatus.value = "idle";
    }, 2000);
  } catch (error) {
    copyStatus.value = "error";
    notify.error("复制失败");

    setTimeout(() => {
      copyStatus.value = "idle";
    }, 2000);
  }
}

async function refreshCurrentConfigContent() {
  try {
    if (configType.value === "pip") {
      const content = await window.pythonToolboxAPI.readPipConfig();
      currentPipConfigContent.value = content;
    } else {
      const content = await window.pythonToolboxAPI.readUvConfig();
      currentUvConfigContent.value = content;
    }
  } catch (error) {
    console.error("刷新配置内容失败:", error);
  }
}

async function applyToGlobal() {
  try {
    notify.info("正在备份当前配置...");
    if (configType.value === "pip") {
      await window.pythonToolboxAPI.writePipConfig(editablePipConfig.value);
      notify.success("已应用到全局 pip.ini 文件");
    } else {
      await window.pythonToolboxAPI.writeUvConfig(editableUvConfig.value);
      notify.success("已应用到全局 uv.toml 文件");
    }

    await refreshCurrentConfigContent();
  } catch (error: any) {
    notify.error(`应用失败: ${error.message}`);
  }
}

async function selectFolder(key: string) {
  try {
    const folderPath = await window.pythonToolboxAPI.selectFolder();
    if (folderPath) {
      config[key] = folderPath;
      notify.success(`已选择路径: ${folderPath}`);
    }
  } catch (error: any) {
    notify.error(`选择文件夹失败: ${error.message}`);
  }
}

async function loadCurrentConfig() {
  try {
    notify.info("正在读取当前配置...");
    const content =
      configType.value === "pip"
        ? await window.pythonToolboxAPI.readPipConfig()
        : await window.pythonToolboxAPI.readUvConfig();

    if (configType.value === "pip") {
      currentPipConfigContent.value = content;
    } else {
      currentUvConfigContent.value = content;
    }

    Object.keys(config).forEach((key) => delete config[key]);

    if (content) {
      const parsed =
        configType.value === "pip"
          ? parsePipConfig(content)
          : parseUvConfig(content);
      Object.assign(config, parsed);
      pruneUnsupportedKeys();
      notify.success(`已加载当前全局配置 (${Object.keys(parsed).length} 项)`);
    } else {
      const fileName = configType.value === "pip" ? "pip.ini" : "uv.toml";
      notify.warning(`当前没有 ${fileName} 配置文件`);
    }
  } catch (error) {
    notify.error("读取配置失败");
  }
}

onMounted(() => {
  pythonStore.fetchPythonInfo();
  void pythonStore.ensureCliOptions();
  applyPreset();
  refreshCurrentConfigContent();
});

onUnmounted(() => {
  if (parseTimer) {
    clearTimeout(parseTimer);
  }
});
</script>
