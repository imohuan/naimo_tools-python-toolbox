// pip 配置解析工具

/**
 * 生成 pip.ini/pip.conf 文件内容
 * 支持 [global], [install], [download] 等配置节
 */
export function generatePipConfig(config: Record<string, any>): string {
  // 定义配置节映射
  const sectionMap: Record<string, string[]> = {
    global: [
      "index-url",
      "extra-index-url",
      "trusted-host",
      "find-links",
      "no-index",
      "timeout",
      "retries",
      "proxy",
      "cert",
      "client-cert",
      "cache-dir",
      "no-cache-dir",
      "require-virtualenv",
      "log",
      "log-file",
      "verbose",
      "quiet",
      "progress-bar",
      "disable-pip-version-check",
      "isolated",
      "use-feature",
      "build-dir",
      "src",
      "dist-dir",
    ],
    install: [
      "upgrade",
      "upgrade-strategy",
      "force-reinstall",
      "no-deps",
      "pre",
      "user",
      "target",
      "prefix",
      "root",
      "install-option",
      "global-option",
      "compile",
      "no-compile",
      "no-warn-script-location",
      "no-warn-conflicts",
      "ignore-installed",
      "no-build-isolation",
      "use-pep517",
      "no-use-pep517",
      "constraint",
    ],
    download: [
      "dest",
      "platform",
      "python-version",
      "implementation",
      "abi",
      "only-binary",
      "no-binary",
      "prefer-binary",
      "no-clean",
    ],
  };

  const sections: Record<string, Array<{ key: string; value: any }>> = {
    global: [],
    install: [],
    download: [],
  };

  // 将配置项分配到对应的节
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined || value === null || value === "") continue;

    let assigned = false;
    for (const [section, keys] of Object.entries(sectionMap)) {
      if (keys.includes(key)) {
        if (typeof value === "boolean") {
          if (value) {
            sections[section].push({ key, value: "" });
          }
        } else {
          sections[section].push({ key, value });
        }
        assigned = true;
        break;
      }
    }

    // 如果没有匹配到任何节，放到 global
    if (!assigned) {
      if (typeof value === "boolean") {
        if (value) {
          sections.global.push({ key, value: "" });
        }
      } else {
        sections.global.push({ key, value });
      }
    }
  }

  // 生成配置内容
  const lines: string[] = [];
  const sectionOrder = ["global", "install", "download"];

  for (const section of sectionOrder) {
    if (sections[section].length > 0) {
      lines.push(`[${section}]`);
      for (const { key, value } of sections[section]) {
        if (value === "") {
          lines.push(key);
        } else {
          lines.push(`${key} = ${value}`);
        }
      }
      lines.push("");
    }
  }

  return lines.join("\n").trim() || "# 暂无配置";
}

/**
 * 解析 pip.ini/pip.conf 文件内容
 */
export function parsePipConfig(content: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = content.split("\n");
  let currentSection = "global";

  for (const line of lines) {
    const trimmed = line.trim();

    // 跳过空行和注释
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) {
      continue;
    }

    // 检测配置节
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      currentSection = trimmed.slice(1, -1).trim();
      continue;
    }

    // 解析键值对
    const equalIndex = trimmed.indexOf("=");
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim();
      const value = trimmed.substring(equalIndex + 1).trim();
      result[key] = value;
    } else if (trimmed.length > 0) {
      // 只有 key，没有 value（boolean 类型）
      result[trimmed] = true;
    }
  }

  return result;
}
