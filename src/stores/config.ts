import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { PyConfig, ViewMode } from "../types";
import { pipFieldToConfigItem, pipFields } from "../data/pip-fields";

// 预设配置方案
const presetConfigs: PyConfig[] = [
  {
    id: "tsinghua",
    name: "清华镜像",
    description: "使用清华大学 PyPI 镜像加速下载",
    items: [
      pipFieldToConfigItem(
        pipFields.find((f) => f.key === "index-url")!,
        "https://pypi.tuna.tsinghua.edu.cn/simple"
      ),
      pipFieldToConfigItem(
        pipFields.find((f) => f.key === "trusted-host")!,
        "pypi.tuna.tsinghua.edu.cn"
      ),
      pipFieldToConfigItem(pipFields.find((f) => f.key === "timeout")!),
      pipFieldToConfigItem(pipFields.find((f) => f.key === "retries")!),
    ],
  },
  {
    id: "aliyun",
    name: "阿里云镜像",
    description: "使用阿里云 PyPI 镜像",
    items: [
      pipFieldToConfigItem(
        pipFields.find((f) => f.key === "index-url")!,
        "https://mirrors.aliyun.com/pypi/simple/"
      ),
      pipFieldToConfigItem(
        pipFields.find((f) => f.key === "trusted-host")!,
        "mirrors.aliyun.com"
      ),
      pipFieldToConfigItem(pipFields.find((f) => f.key === "timeout")!),
      pipFieldToConfigItem(pipFields.find((f) => f.key === "retries")!),
    ],
  },
  {
    id: "complete",
    name: "完整配置",
    description: "包含所有常用配置项的完整方案",
    items: pipFields
      .filter((f) => {
        // 只包含常用配置项
        const commonKeys = [
          "index-url",
          "extra-index-url",
          "trusted-host",
          "find-links",
          "timeout",
          "retries",
          "proxy",
          "cert",
          "client-cert",
          "cache-dir",
          "no-cache-dir",
          "upgrade-strategy",
          "pre",
          "require-virtualenv",
          "compile",
          "log",
          "verbose",
          "progress-bar",
          "disable-pip-version-check",
          "use-feature",
        ];
        return commonKeys.includes(f.key);
      })
      .map((field) => pipFieldToConfigItem(field)),
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

    // 根据配置节分组
    const sections: Record<string, Array<{ key: string; value: string }>> = {};

    config.items.forEach((item) => {
      if (item.value && item.value !== "false") {
        // 查找配置项所属的节
        const field = pipFields.find((f) => f.key === item.key);
        const section = field?.section || "global";

        if (!sections[section]) {
          sections[section] = [];
        }

        // boolean 类型为 true 时只写 key，不需要值
        if (item.type === "boolean" && item.value === "true") {
          sections[section].push({ key: item.key, value: "" });
        } else if (item.type !== "boolean") {
          sections[section].push({ key: item.key, value: item.value });
        }
      }
    });

    // 生成配置内容
    const lines: string[] = [];
    const sectionOrder = [
      "global",
      "install",
      "download",
      "list",
      "search",
      "freeze",
      "uninstall",
    ];

    sectionOrder.forEach((section) => {
      if (sections[section] && sections[section].length > 0) {
        lines.push(`[${section}]`);
        sections[section].forEach((item) => {
          if (item.value) {
            lines.push(`${item.key} = ${item.value}`);
          } else {
            lines.push(item.key);
          }
        });
        lines.push(""); // 添加空行分隔
      }
    });

    // 处理其他自定义节
    Object.keys(sections).forEach((section) => {
      if (!sectionOrder.includes(section)) {
        lines.push(`[${section}]`);
        sections[section].forEach((item) => {
          if (item.value) {
            lines.push(`${item.key} = ${item.value}`);
          } else {
            lines.push(item.key);
          }
        });
        lines.push("");
      }
    });

    return lines.join("\n").trim();
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
