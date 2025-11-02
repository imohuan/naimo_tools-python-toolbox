// uv 完整配置字段定义
// 数据来源：通过 `uv --help` 和 `uv pip install --help` 命令获取
// 验证日期：2024-11-02
// 参考文档：https://docs.astral.sh/uv/configuration/
//
// 更新说明：
// - 更新了索引配置：index-url 改为 default-index，新增 index 字段
// - 更新了 Python 版本配置：python-preference 改为 managed-python 相关选项
// - 新增了 allow-insecure-host（替代 trusted-host）
// - 新增了 native-tls、offline、no-progress 等全局选项
// - 所有字段均与当前 uv 版本命令行选项对应
// - meta.cliFlags 用于根据实际命令行选项动态过滤可用字段

interface UvFieldMeta {
  since?: string;
  until?: string;
  cliFlags?: string[];
  notes?: string;
}

export interface UvField {
  key: string;
  label: string;
  description: string;
  type: "text" | "select" | "boolean" | "number";
  category: string;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  defaultValue?: string;
  meta?: UvFieldMeta;
}

export const uvFields: UvField[] = [
  // ========== 镜像源配置 ==========
  {
    key: "default-index",
    label: "默认索引源",
    description: "默认的 PyPI 索引 URL（推荐使用此字段替代 index-url）",
    type: "select",
    category: "镜像源配置",
    options: [
      {
        label: "清华镜像",
        value: "https://pypi.tuna.tsinghua.edu.cn/simple",
      },
      {
        label: "阿里云",
        value: "https://mirrors.aliyun.com/pypi/simple/",
      },
      {
        label: "腾讯云",
        value: "https://mirrors.cloud.tencent.com/pypi/simple",
      },
      {
        label: "中科大",
        value: "https://pypi.mirrors.ustc.edu.cn/simple/",
      },
      {
        label: "官方源",
        value: "https://pypi.org/simple",
      },
    ],
    placeholder: "https://pypi.org/simple",
    meta: {
      cliFlags: ["--default-index"],
      notes: "uv 新版本提供 --default-index 选项时可用",
    },
  },
  {
    key: "index-url",
    label: "索引源（已弃用）",
    description: "PyPI 索引 URL（已弃用，建议使用 default-index）",
    type: "text",
    category: "镜像源配置",
    placeholder: "https://pypi.org/simple",
    meta: {
      cliFlags: ["--index-url"],
    },
  },
  {
    key: "index",
    label: "额外索引源",
    description: "额外的 PyPI 索引 URL（可添加多个）",
    type: "text",
    category: "镜像源配置",
    placeholder: "https://example.com/simple",
    meta: {
      cliFlags: ["--index"],
    },
  },
  {
    key: "extra-index-url",
    label: "额外索引源（已弃用）",
    description: "额外的 PyPI 索引 URL（已弃用，建议使用 index）",
    type: "text",
    category: "镜像源配置",
    placeholder: "https://example.com/simple",
    meta: {
      cliFlags: ["--extra-index-url"],
    },
  },
  {
    key: "find-links",
    label: "查找链接",
    description: "额外的包查找链接（URL 或本地路径）",
    type: "text",
    category: "镜像源配置",
    placeholder: "https://example.com/packages/",
  },
  {
    key: "no-index",
    label: "禁用索引",
    description: "忽略包索引，仅使用 --find-links 指定的链接",
    type: "boolean",
    category: "镜像源配置",
    defaultValue: "false",
  },
  {
    key: "index-strategy",
    label: "索引策略",
    description:
      "索引查找策略：first-match（首次匹配）或 unsafe-any-match（任意匹配）",
    type: "select",
    category: "镜像源配置",
    options: [
      { label: "首次匹配", value: "first-match" },
      { label: "任意匹配", value: "unsafe-any-match" },
    ],
    defaultValue: "first-match",
  },

  // ========== 缓存配置 ==========
  {
    key: "cache-dir",
    label: "缓存目录",
    description: "uv 缓存目录路径",
    type: "text",
    category: "缓存配置",
    placeholder: "~/.cache/uv",
  },
  {
    key: "no-cache",
    label: "禁用缓存",
    description: "禁用缓存功能",
    type: "boolean",
    category: "缓存配置",
    defaultValue: "false",
  },

  // ========== Python 版本配置 ==========
  {
    key: "python-version",
    label: "Python 版本",
    description: "默认 Python 版本（例如：3.11）",
    type: "text",
    category: "Python 版本配置",
    placeholder: "3.11",
  },
  {
    key: "managed-python",
    label: "托管 Python",
    description: "要求使用 uv 托管的 Python 版本",
    type: "boolean",
    category: "Python 版本配置",
    defaultValue: "false",
  },
  {
    key: "no-managed-python",
    label: "禁用托管 Python",
    description: "禁用使用 uv 托管的 Python 版本",
    type: "boolean",
    category: "Python 版本配置",
    defaultValue: "false",
  },
  {
    key: "no-python-downloads",
    label: "禁用 Python 下载",
    description: "禁用自动下载 Python",
    type: "boolean",
    category: "Python 版本配置",
    defaultValue: "false",
  },

  // ========== 网络配置 ==========
  // 注：timeout 和 retries 在 uv 中可能通过环境变量配置，不在命令行选项中
  {
    key: "native-tls",
    label: "原生 TLS",
    description: "从平台的原生证书存储加载 TLS 证书",
    type: "boolean",
    category: "网络配置",
    defaultValue: "false",
    meta: {
      cliFlags: ["--native-tls"],
    },
  },
  {
    key: "allow-insecure-host",
    label: "允许不安全主机",
    description: "允许连接到不安全的主机（可多个，用空格分隔）",
    type: "text",
    category: "网络配置",
    placeholder: "pypi.tuna.tsinghua.edu.cn",
    meta: {
      cliFlags: ["--allow-insecure-host"],
    },
  },
  {
    key: "keyring-provider",
    label: "密钥环提供者",
    description: "凭证查找机制：disabled（禁用）或 subprocess（子进程）",
    type: "select",
    category: "网络配置",
    options: [
      { label: "禁用", value: "disabled" },
      { label: "子进程", value: "subprocess" },
    ],
    defaultValue: "subprocess",
  },

  // ========== 构建配置 ==========
  {
    key: "no-build-isolation",
    label: "禁用构建隔离",
    description: "禁用构建源码包时的隔离环境",
    type: "boolean",
    category: "构建配置",
    defaultValue: "false",
    meta: {
      cliFlags: ["--no-build-isolation"],
    },
  },
  {
    key: "no-build-isolation-package",
    label: "禁用特定包的构建隔离",
    description: "禁用特定包的构建隔离（可多个，用空格分隔）",
    type: "text",
    category: "构建配置",
    placeholder: "package1 package2",
    meta: {
      cliFlags: ["--no-build-isolation-package"],
    },
  },
  {
    key: "compile-bytecode",
    label: "编译字节码",
    description: "安装后编译 Python 字节码",
    type: "boolean",
    category: "构建配置",
    defaultValue: "false",
    meta: {
      cliFlags: ["--compile-bytecode"],
    },
  },
  {
    key: "config-setting",
    label: "构建配置",
    description: "传递给 PEP 517 构建后端的配置（格式：KEY=VALUE）",
    type: "text",
    category: "构建配置",
    placeholder: "KEY=VALUE",
    meta: {
      cliFlags: ["--config-setting"],
    },
  },

  // ========== 解析器配置 ==========
  {
    key: "resolution",
    label: "解析策略",
    description:
      "版本选择策略：highest（最高版本）、lowest（最低版本）、lowest-direct（直接依赖最低）",
    type: "select",
    category: "解析器配置",
    options: [
      { label: "最高版本", value: "highest" },
      { label: "最低版本", value: "lowest" },
      { label: "直接依赖最低", value: "lowest-direct" },
    ],
    defaultValue: "highest",
  },
  {
    key: "prerelease",
    label: "预发布版本",
    description: "预发布版本策略",
    type: "select",
    category: "解析器配置",
    options: [
      { label: "禁止", value: "disallow" },
      { label: "允许", value: "allow" },
      { label: "必要时", value: "if-necessary" },
      { label: "显式指定", value: "explicit" },
      { label: "必要时或显式", value: "if-necessary-or-explicit" },
    ],
    defaultValue: "if-necessary-or-explicit",
  },
  {
    key: "exclude-newer",
    label: "排除新包",
    description: "排除指定日期之后上传的包（格式：YYYY-MM-DD）",
    type: "text",
    category: "解析器配置",
    placeholder: "2024-11-01",
  },

  // ========== 安装配置 ==========
  {
    key: "no-deps",
    label: "不安装依赖",
    description: "不安装包的依赖项",
    type: "boolean",
    category: "安装配置",
    defaultValue: "false",
    meta: {
      cliFlags: ["--no-deps"],
    },
  },
  {
    key: "require-hashes",
    label: "要求哈希验证",
    description: "要求每个包都有哈希验证",
    type: "boolean",
    category: "安装配置",
    defaultValue: "false",
    meta: {
      cliFlags: ["--require-hashes"],
    },
  },
  {
    key: "system",
    label: "系统环境",
    description: "安装到系统 Python 环境",
    type: "boolean",
    category: "安装配置",
    defaultValue: "false",
    meta: {
      cliFlags: ["--system"],
    },
  },
  {
    key: "break-system-packages",
    label: "允许修改系统包",
    description: "允许修改 EXTERNALLY-MANAGED 的 Python 环境",
    type: "boolean",
    category: "安装配置",
    defaultValue: "false",
    meta: {
      cliFlags: ["--break-system-packages"],
    },
  },
  {
    key: "target",
    label: "目标目录",
    description: "安装包到指定目录",
    type: "text",
    category: "安装配置",
    placeholder: "/path/to/target",
    meta: {
      cliFlags: ["--target"],
    },
  },
  {
    key: "prefix",
    label: "安装前缀",
    description: "安装到指定前缀目录（lib、bin 等）",
    type: "text",
    category: "安装配置",
    placeholder: "/path/to/prefix",
    meta: {
      cliFlags: ["--prefix"],
    },
  },
  {
    key: "no-binary",
    label: "不使用二进制包",
    description: "不使用预编译的二进制包（可指定包名或 :all:）",
    type: "text",
    category: "安装配置",
    placeholder: ":all: 或 package-name",
    meta: {
      cliFlags: ["--no-binary"],
    },
  },
  {
    key: "only-binary",
    label: "仅使用二进制包",
    description: "仅使用预编译的二进制包（可指定包名或 :all:）",
    type: "text",
    category: "安装配置",
    placeholder: ":all: 或 package-name",
    meta: {
      cliFlags: ["--only-binary"],
    },
  },
  {
    key: "reinstall",
    label: "重新安装",
    description: "重新安装所有包",
    type: "boolean",
    category: "安装配置",
    defaultValue: "false",
    meta: {
      cliFlags: ["--reinstall"],
    },
  },
  {
    key: "link-mode",
    label: "链接模式",
    description: "从全局缓存安装包的方法",
    type: "select",
    category: "安装配置",
    options: [
      { label: "克隆", value: "clone" },
      { label: "复制", value: "copy" },
      { label: "硬链接", value: "hardlink" },
      { label: "符号链接", value: "symlink" },
    ],
    defaultValue: "clone",
    meta: {
      cliFlags: ["--link-mode"],
    },
  },

  // ========== 其他配置 ==========
  {
    key: "quiet",
    label: "静默模式",
    description: "减少输出信息",
    type: "boolean",
    category: "其他配置",
    defaultValue: "false",
    meta: {
      cliFlags: ["--quiet"],
    },
  },
  {
    key: "verbose",
    label: "详细输出",
    description: "显示详细输出信息",
    type: "boolean",
    category: "其他配置",
    defaultValue: "false",
    meta: {
      cliFlags: ["--verbose"],
    },
  },
  {
    key: "color",
    label: "颜色输出",
    description: "控制输出中的颜色使用",
    type: "select",
    category: "其他配置",
    options: [
      { label: "自动", value: "auto" },
      { label: "总是", value: "always" },
      { label: "从不", value: "never" },
    ],
    defaultValue: "auto",
    meta: {
      cliFlags: ["--color"],
    },
  },
  {
    key: "offline",
    label: "离线模式",
    description: "禁用网络访问，仅使用本地缓存",
    type: "boolean",
    category: "其他配置",
    defaultValue: "false",
    meta: {
      cliFlags: ["--offline"],
    },
  },
  {
    key: "no-progress",
    label: "隐藏进度条",
    description: "隐藏所有进度输出",
    type: "boolean",
    category: "其他配置",
    defaultValue: "false",
    meta: {
      cliFlags: ["--no-progress"],
    },
  },
  {
    key: "refresh",
    label: "刷新缓存",
    description: "刷新所有缓存数据",
    type: "boolean",
    category: "其他配置",
    defaultValue: "false",
    meta: {
      cliFlags: ["--refresh"],
    },
  },
  {
    key: "config-file",
    label: "配置文件",
    description: "指定 uv.toml 配置文件路径",
    type: "text",
    category: "其他配置",
    placeholder: "/path/to/uv.toml",
    meta: {
      cliFlags: ["--config-file"],
    },
  },
  {
    key: "no-config",
    label: "禁用配置文件",
    description: "不加载配置文件（pyproject.toml、uv.toml）",
    type: "boolean",
    category: "其他配置",
    defaultValue: "false",
    meta: {
      cliFlags: ["--no-config"],
    },
  },
];

// 预设配置
// 注：使用 default-index 替代已弃用的 index-url
export const uvPresetConfigs = {
  tsinghua: {
    "default-index": "https://pypi.tuna.tsinghua.edu.cn/simple",
    "allow-insecure-host": "pypi.tuna.tsinghua.edu.cn",
  },
  aliyun: {
    "default-index": "https://mirrors.aliyun.com/pypi/simple/",
    "allow-insecure-host": "mirrors.aliyun.com",
  },
  tencent: {
    "default-index": "https://mirrors.cloud.tencent.com/pypi/simple",
    "allow-insecure-host": "mirrors.cloud.tencent.com",
  },
  ustc: {
    "default-index": "https://pypi.mirrors.ustc.edu.cn/simple/",
    "allow-insecure-host": "pypi.mirrors.ustc.edu.cn",
  },
  official: {
    "default-index": "https://pypi.org/simple",
  },
};
