// uv 配置解析工具
// uv 配置文件格式为 TOML，通常位于 uv.toml 或 pyproject.toml 的 [tool.uv] 部分

/**
 * 生成 uv.toml 文件内容
 */
export function generateUvConfig(config: Record<string, any>): string {
  const lines: string[] = ["[tool.uv]"];

  // 按类别排序配置项
  const categories = [
    "镜像源配置",
    "缓存配置",
    "Python 版本配置",
    "网络配置",
    "构建配置",
    "其他配置",
  ];

  const configByCategory: Record<
    string,
    Array<{ key: string; value: any }>
  > = {};

  for (const [key, value] of Object.entries(config)) {
    if (value === undefined || value === null || value === "") continue;

    // 简单分类（实际应该根据字段定义来分类）
    let category = "其他配置";
    if (key.includes("index") || key.includes("url")) {
      category = "镜像源配置";
    } else if (key.includes("cache")) {
      category = "缓存配置";
    } else if (key.includes("python")) {
      category = "Python 版本配置";
    } else if (
      key.includes("timeout") ||
      key.includes("retries") ||
      key.includes("cert")
    ) {
      category = "网络配置";
    } else if (key.includes("build") || key.includes("compile")) {
      category = "构建配置";
    }

    if (!configByCategory[category]) {
      configByCategory[category] = [];
    }

    if (typeof value === "boolean") {
      if (value) {
        configByCategory[category].push({ key, value: true });
      }
    } else {
      configByCategory[category].push({ key, value });
    }
  }

  // 按类别顺序输出
  for (const category of categories) {
    if (configByCategory[category] && configByCategory[category].length > 0) {
      // 添加分类注释
      lines.push(`# ${category}`);
      for (const { key, value } of configByCategory[category]) {
        if (typeof value === "boolean") {
          lines.push(`${key} = ${value}`);
        } else if (typeof value === "number") {
          lines.push(`${key} = ${value}`);
        } else if (typeof value === "string" && value.startsWith("[")) {
          // 数组格式
          lines.push(`${key} = ${value}`);
        } else {
          lines.push(`${key} = "${value}"`);
        }
      }
      lines.push("");
    }
  }

  return lines.join("\n").trim() || "# 暂无配置";
}

/**
 * 解析 uv.toml 文件内容
 */
export function parseUvConfig(content: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = content.split("\n");
  let inToolUv = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // 跳过空行和注释
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    // 检测 [tool.uv] 节
    if (trimmed === "[tool.uv]") {
      inToolUv = true;
      continue;
    }

    // 如果遇到其他节，停止解析
    if (trimmed.startsWith("[") && trimmed !== "[tool.uv]") {
      inToolUv = false;
      continue;
    }

    if (!inToolUv) {
      continue;
    }

    // 解析键值对
    const equalIndex = trimmed.indexOf("=");
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim();
      let value = trimmed.substring(equalIndex + 1).trim();

      // 移除引号
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // 处理布尔值
      if (value === "true") {
        result[key] = true;
      } else if (value === "false") {
        result[key] = false;
      } else if (!isNaN(Number(value)) && value !== "") {
        // 数字
        result[key] = Number(value);
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}
