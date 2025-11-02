<template>
  <div class="w-full h-full flex flex-col">
    <!-- Teleport 到顶部的自定义区域 -->
    <Teleport to="#tab-actions">
      <template v-if="route.path === '/config'">
        <div class="flex items-center gap-2">
          <!-- 配置方案选择 -->
          <div class="flex items-center gap-1.5 border-r border-gray-200 pr-3">
            <span class="text-xs text-gray-600 font-medium">方案</span>
            <Select
              v-model="currentConfigId"
              :options="configOptions"
              @update:modelValue="handleConfigChange"
              size="sm"
            />
          </div>

          <Button @click="handleSave" :loading="isSaving" size="sm">
            <Icon name="save" size="xs" />
            应用配置
          </Button>
        </div>
      </template>
    </Teleport>

    <!-- 主内容 -->
    <div class="flex-1 flex min-h-0">
      <!-- 左侧：配置编辑 -->
      <div class="w-1/2 border-r border-gray-200 overflow-y-auto">
        <div class="p-2 space-y-2">
          <!-- 配置项分组 -->
          <div
            v-if="currentConfig"
            class="border border-gray-200 rounded-lg bg-white"
          >
            <!-- 分组标题 -->
            <div
              class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg"
            >
              <div class="flex items-center gap-2">
                <Icon name="cog" size="xs" class="text-gray-500" />
                <h3 class="text-xs font-semibold text-gray-700">
                  {{ currentConfig.name }}
                </h3>
              </div>
            </div>

            <!-- 配置项列表 -->
            <div class="p-2 space-y-2">
              <div
                v-for="item in currentConfig.items"
                :key="item.key"
                class="p-2 rounded bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs font-medium text-gray-700">
                    {{ item.label }}
                    <span v-if="item.required" class="text-red-500">*</span>
                  </label>
                </div>

                <p
                  v-if="item.description"
                  class="text-[10px] text-gray-500 mb-1"
                >
                  {{ item.description }}
                </p>

                <!-- 文本输入 -->
                <input
                  v-if="item.type === 'text'"
                  v-model="item.value"
                  type="text"
                  :placeholder="item.placeholder"
                  class="w-full px-2 py-1 text-xs border border-gray-300 rounded h-[26px] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />

                <!-- 下拉选择 -->
                <Select
                  v-else-if="item.type === 'select'"
                  v-model="item.value"
                  :options="item.options || []"
                  size="sm"
                />

                <!-- 数字输入 -->
                <input
                  v-else-if="item.type === 'number'"
                  v-model.number="item.value"
                  type="number"
                  :placeholder="item.placeholder"
                  class="w-full px-2 py-1 text-xs border border-gray-300 rounded h-[26px] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和环境变量 -->
      <div class="flex-1 overflow-y-auto">
        <div class="p-2 space-y-2">
          <!-- 配置预览 -->
          <div class="border border-gray-200 rounded-lg bg-white">
            <div
              class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200"
            >
              <div class="flex items-center gap-2">
                <Icon name="code" size="xs" class="text-gray-500" />
                <h3 class="text-xs font-semibold text-gray-700">配置预览</h3>
              </div>
              <div class="flex gap-1">
                <button
                  @click="handleCopy"
                  class="px-2 py-1 text-xs rounded h-[26px] transition-colors flex items-center gap-1"
                  :class="
                    copied
                      ? 'text-green-600 bg-green-50'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                  "
                  :title="copied ? '已复制' : '复制配置'"
                >
                  <svg
                    v-if="!copied"
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {{ copied ? "已复制" : "复制" }}
                </button>
              </div>
            </div>
            <div class="p-2">
              <CodePreview :content="pipConfig" />
              <div v-if="configPath" class="text-[10px] text-gray-400 mt-2">
                {{ configPath }}
              </div>
            </div>
          </div>

          <!-- 环境变量 -->
          <div class="border border-gray-200 rounded-lg bg-white">
            <div
              class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200"
            >
              <div class="flex items-center gap-2">
                <Icon name="settings" size="xs" class="text-gray-500" />
                <h3 class="text-xs font-semibold text-gray-700">环境变量</h3>
              </div>
              <Button
                @click="handleSaveEnvVars"
                :loading="isSavingEnv"
                size="xs"
              >
                <Icon name="save" size="xs" />
                保存
              </Button>
            </div>
            <div class="p-2 space-y-2">
              <div
                v-for="(value, key) in envVars"
                :key="key"
                class="p-2 rounded bg-gray-50/50"
              >
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  {{ key }}
                </label>
                <input
                  v-model="envVars[key as keyof typeof envVars]"
                  type="text"
                  :placeholder="`${key} 路径`"
                  :disabled="key === 'PYTHON_PATH'"
                  class="w-full px-2 py-1 text-xs border border-gray-300 rounded h-[26px] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useConfigStore } from "../stores/config";
import { storeToRefs } from "pinia";
import Card from "../components/Card.vue";
import Button from "../components/Button.vue";
import Icon from "../components/Icon.vue";
import Select from "../components/Select.vue";
import CodePreview from "../components/CodePreview.vue";
import { useNotify } from "../composables/useNotify";

const route = useRoute();
const configStore = useConfigStore();
const { configs, currentConfigId, currentConfig, pipConfig } =
  storeToRefs(configStore);
const notify = useNotify();

const configPath = ref("");
const isSaving = ref(false);
const isSavingEnv = ref(false);
const showCreateDialog = ref(false);
const copied = ref(false);
let copyTimeoutId: number | null = null;

const configOptions = computed(() => {
  return configs.value.map((config) => ({
    label: config.name,
    value: config.id,
  }));
});

const envVars = ref({
  UV_CACHE_DIR: "",
  PIP_CACHE_DIR: "",
  VIRTUAL_ENV_BASE: "",
  PYTHON_PATH: "",
});

function handleConfigChange() {
  // 配置切换逻辑已在 store 中处理
}

function handleAddItem() {
  configStore.addConfigItem();
}

async function handleSave() {
  isSaving.value = true;
  try {
    const success = await configStore.saveConfig();
    if (success) {
      notify.success("配置已成功应用！");
    } else {
      notify.error("配置应用失败，请检查权限。");
    }
  } finally {
    isSaving.value = false;
  }
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(pipConfig.value);
    copied.value = true;

    if (copyTimeoutId) {
      clearTimeout(copyTimeoutId);
    }

    copyTimeoutId = window.setTimeout(() => {
      copied.value = false;
      copyTimeoutId = null;
    }, 2000);
  } catch (error) {
    console.error("复制失败:", error);
  }
}

async function handleSaveEnvVars() {
  isSavingEnv.value = true;
  try {
    for (const [key, value] of Object.entries(envVars.value)) {
      if (value && key !== "PYTHON_PATH") {
        await window.pythonToolboxAPI.setEnvironmentVariable(key, value);
      }
    }
    notify.success("环境变量已保存！请重启终端以使更改生效。");
  } catch (error: any) {
    notify.error(`保存失败：${error.message}`);
  } finally {
    isSavingEnv.value = false;
  }
}

async function loadEnvVars() {
  try {
    const vars = await window.pythonToolboxAPI.getEnvironmentVariables();
    envVars.value = {
      UV_CACHE_DIR: vars.UV_CACHE_DIR || "",
      PIP_CACHE_DIR: vars.PIP_CACHE_DIR || "",
      VIRTUAL_ENV_BASE: vars.VIRTUAL_ENV_BASE || "",
      PYTHON_PATH: vars.PYTHON_PATH || "",
    };
  } catch (error) {
    console.error("加载环境变量失败:", error);
  }
}

onMounted(async () => {
  try {
    configPath.value = await window.pythonToolboxAPI.getPipConfigPath();
    await configStore.loadConfig();
    await loadEnvVars();
  } catch (error) {
    console.error("初始化配置失败:", error);
  }
});
</script>
