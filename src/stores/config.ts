import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { PyConfig, ViewMode } from "../types";

// 预设配置方案
const presetConfigs: PyConfig[] = [
  {
    id: "tsinghua",
    name: "清华镜像",
    description: "使用清华大学 PyPI 镜像加速下载",
    items: [
      {
        key: "index-url",
        label: "镜像源",
        description: "PyPI 包下载源",
        type: "select",
        value: "https://pypi.tuna.tsinghua.edu.cn/simple",
        options: [
          {
            label: "清华镜像",
            value: "https://pypi.tuna.tsinghua.edu.cn/simple",
          },
          { label: "官方源", value: "https://pypi.org/simple" },
          {
            label: "阿里云",
            value: "https://mirrors.aliyun.com/pypi/simple/",
          },
          {
            label: "腾讯云",
            value: "https://mirrors.cloud.tencent.com/pypi/simple",
          },
        ],
      },
      {
        key: "trusted-host",
        label: "信任主机",
        description: "信任的主机地址",
        type: "text",
        value: "pypi.tuna.tsinghua.edu.cn",
      },
    ],
  },
  {
    id: "aliyun",
    name: "阿里云镜像",
    description: "使用阿里云 PyPI 镜像",
    items: [
      {
        key: "index-url",
        label: "镜像源",
        description: "PyPI 包下载源",
        type: "text",
        value: "https://mirrors.aliyun.com/pypi/simple/",
      },
      {
        key: "trusted-host",
        label: "信任主机",
        description: "信任的主机地址",
        type: "text",
        value: "mirrors.aliyun.com",
      },
    ],
  },
];

export const useConfigStore = defineStore("config", () => {
  const configs = ref<PyConfig[]>([...presetConfigs]);
  const currentConfigId = ref<string>("tsinghua");
  const viewMode = ref<ViewMode>("dual");
  const isLoading = ref(false);

  // 当前配置
  const currentConfig = computed(() => {
    return (
      configs.value.find((c) => c.id === currentConfigId.value) ||
      configs.value[0]
    );
  });

  // 生成 pip.ini/pip.conf 内容
  const pipConfig = computed(() => {
    const config = currentConfig.value;
    if (!config) return "";

    const lines = ["[global]"];
    config.items.forEach((item) => {
      if (item.value) {
        lines.push(`${item.key} = ${item.value}`);
      }
    });

    return lines.join("\n");
  });

  // 切换配置方案
  function setCurrentConfig(id: string) {
    currentConfigId.value = id;
  }

  // 切换视图模式
  function setViewMode(mode: ViewMode) {
    viewMode.value = mode;
  }

  // 更新配置项
  function updateConfigItem(key: string, value: string) {
    const config = currentConfig.value;
    if (!config) return;

    const item = config.items.find((i) => i.key === key);
    if (item) {
      item.value = value;
    }
  }

  // 添加新配置项
  function addConfigItem() {
    const config = currentConfig.value;
    if (!config) return;

    config.items.push({
      key: "",
      label: "新配置项",
      description: "",
      type: "text",
      value: "",
    });
  }

  // 删除配置项
  function removeConfigItem(key: string) {
    const config = currentConfig.value;
    if (!config) return;

    const index = config.items.findIndex((i) => i.key === key);
    if (index !== -1) {
      config.items.splice(index, 1);
    }
  }

  // 保存配置到本地
  async function saveConfig() {
    try {
      const content = pipConfig.value;
      await window.pythonToolboxAPI.writePipConfig(content);
      return true;
    } catch (error) {
      console.error("保存配置失败:", error);
      return false;
    }
  }

  // 从本地加载配置
  async function loadConfig() {
    isLoading.value = true;
    try {
      const content = await window.pythonToolboxAPI.readPipConfig();
      // 解析配置内容并更新
      console.log("当前配置:", content);
    } catch (error) {
      console.error("加载配置失败:", error);
    } finally {
      isLoading.value = false;
    }
  }

  // 创建新配置方案
  function createConfig(name: string, description: string) {
    const newConfig: PyConfig = {
      id: Date.now().toString(),
      name,
      description,
      items: [],
    };
    configs.value.push(newConfig);
    currentConfigId.value = newConfig.id;
  }

  // 删除配置方案
  function deleteConfig(id: string) {
    const index = configs.value.findIndex((c) => c.id === id);
    if (index !== -1) {
      configs.value.splice(index, 1);
      if (currentConfigId.value === id) {
        currentConfigId.value = configs.value[0]?.id || "";
      }
    }
  }

  return {
    configs,
    currentConfigId,
    currentConfig,
    viewMode,
    pipConfig,
    isLoading,
    setCurrentConfig,
    setViewMode,
    updateConfigItem,
    addConfigItem,
    removeConfigItem,
    saveConfig,
    loadConfig,
    createConfig,
    deleteConfig,
  };
});
