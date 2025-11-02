// pip 完整配置字段定义
// 数据来源：通过 `pip install --help` 和 `pip config --help` 命令获取
// 验证日期：2024-11-02
// 参考文档：https://pip.pypa.io/en/stable/topics/configuration/
//
// 更新说明：
// - 已移除已弃用的字段：install-option, global-option
// - 已移除非配置文件选项：build-dir, dist-dir, dest, log-file
// - 所有字段均与当前 pip 版本命令行选项对应
// - meta.cliFlags 用于根据实际命令行选项动态过滤可用字段

interface PipFieldMeta {
  since?: string;
  until?: string;
  cliFlags?: string[];
  notes?: string;
}

export interface PipField {
  key: string;
  label: string;
  description: string;
  type: "text" | "select" | "boolean" | "number";
  category: string;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  defaultValue?: string;
  meta?: PipFieldMeta;
}

export const pipFields: PipField[] = [
  // ========== [global] 全局配置 ==========
  {
    key: "index-url",
    label: "镜像源",
    description: "PyPI 包下载源（主索引 URL）",
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
        label: "豆瓣",
        value: "https://pypi.douban.com/simple/",
      },
      {
        label: "官方源",
        value: "https://pypi.org/simple",
      },
    ],
    placeholder: "https://pypi.org/simple",
  },
  {
    key: "extra-index-url",
    label: "额外索引源",
    description: "额外的 PyPI 索引 URL（可以多个，用空格分隔）",
    type: "text",
    category: "镜像源配置",
    placeholder: "https://example.com/simple",
  },
  {
    key: "trusted-host",
    label: "信任主机",
    description: "信任的主机地址（避免 SSL 验证错误，可多个，用空格分隔）",
    type: "text",
    category: "镜像源配置",
    placeholder: "pypi.tuna.tsinghua.edu.cn",
  },
  {
    key: "find-links",
    label: "查找链接",
    description: "额外的包查找链接（URL 或本地路径，可多个，用空格分隔）",
    type: "text",
    category: "镜像源配置",
    placeholder: "https://example.com/packages/",
  },
  {
    key: "no-index",
    label: "禁用索引",
    description: "禁用包索引，仅使用 --find-links 指定的链接",
    type: "boolean",
    category: "镜像源配置",
    defaultValue: "false",
  },

  // ========== 网络配置 ==========
  {
    key: "timeout",
    label: "超时时间",
    description: "网络请求超时时间（秒）",
    type: "number",
    category: "网络配置",
    placeholder: "15",
    defaultValue: "15",
  },
  {
    key: "retries",
    label: "重试次数",
    description: "网络请求失败时的重试次数",
    type: "number",
    category: "网络配置",
    placeholder: "5",
    defaultValue: "5",
  },
  {
    key: "proxy",
    label: "代理服务器",
    description: "代理服务器地址（格式：http://user:pass@host:port）",
    type: "text",
    category: "网络配置",
    placeholder: "http://proxy.example.com:8080",
  },
  {
    key: "cert",
    label: "CA 证书",
    description: "CA 证书文件路径（用于验证服务器证书）",
    type: "text",
    category: "网络配置",
    placeholder: "/path/to/ca-bundle.crt",
  },
  {
    key: "client-cert",
    label: "客户端证书",
    description: "客户端证书文件路径（用于客户端认证）",
    type: "text",
    category: "网络配置",
    placeholder: "/path/to/client.pem",
  },

  // ========== 缓存配置 ==========
  {
    key: "cache-dir",
    label: "缓存目录",
    description: "pip 缓存目录路径",
    type: "text",
    category: "缓存配置",
    placeholder: "~/.cache/pip",
  },
  {
    key: "no-cache-dir",
    label: "禁用缓存",
    description: "禁用 pip 缓存功能",
    type: "boolean",
    category: "缓存配置",
    defaultValue: "false",
  },

  // ========== 安装配置 ==========
  {
    key: "upgrade",
    label: "自动升级",
    description: "安装时自动升级已安装的包",
    type: "boolean",
    category: "安装配置",
    defaultValue: "false",
  },
  {
    key: "upgrade-strategy",
    label: "升级策略",
    description: "升级策略：only-if-needed（仅必要时）或 eager（总是升级）",
    type: "select",
    category: "安装配置",
    options: [
      { label: "仅必要时升级", value: "only-if-needed" },
      { label: "总是升级", value: "eager" },
    ],
    defaultValue: "only-if-needed",
  },
  {
    key: "force-reinstall",
    label: "强制重装",
    description: "即使已安装也强制重新安装",
    type: "boolean",
    category: "安装配置",
    defaultValue: "false",
  },
  {
    key: "no-deps",
    label: "不安装依赖",
    description: "不安装包的依赖项",
    type: "boolean",
    category: "安装配置",
    defaultValue: "false",
  },
  {
    key: "pre",
    label: "允许预发布版本",
    description: "允许安装预发布版本（alpha、beta、rc）",
    type: "boolean",
    category: "安装配置",
    defaultValue: "false",
  },
  {
    key: "require-virtualenv",
    label: "要求虚拟环境",
    description: "要求在虚拟环境中运行 pip",
    type: "boolean",
    category: "安装配置",
    defaultValue: "false",
  },
  {
    key: "break-system-packages",
    label: "允许修改系统包",
    description: "允许 pip 修改 EXTERNALLY-MANAGED 的 Python 环境（谨慎使用）",
    type: "boolean",
    category: "安装配置",
    defaultValue: "false",
    meta: {
      cliFlags: ["--break-system-packages"],
      notes: "仅在支持 --break-system-packages 的 pip 版本中可用",
    },
  },
  {
    key: "user",
    label: "用户安装",
    description: "安装到用户目录而非系统目录",
    type: "boolean",
    category: "安装配置",
    defaultValue: "false",
  },
  {
    key: "target",
    label: "目标目录",
    description: "安装包的目标目录",
    type: "text",
    category: "安装配置",
    placeholder: "/path/to/target",
  },
  {
    key: "prefix",
    label: "安装前缀",
    description: "安装包的路径前缀",
    type: "text",
    category: "安装配置",
    placeholder: "/path/to/prefix",
  },
  {
    key: "root",
    label: "根目录",
    description: "安装包相对于的根目录",
    type: "text",
    category: "安装配置",
    placeholder: "/path/to/root",
  },
  // install-option 和 global-option 已在新版 pip 中弃用，已移除
  {
    key: "compile",
    label: "编译 Python 文件",
    description: "将 Python 源文件编译为字节码",
    type: "boolean",
    category: "安装配置",
    defaultValue: "true",
  },
  {
    key: "no-compile",
    label: "不编译 Python 文件",
    description: "不将 Python 源文件编译为字节码",
    type: "boolean",
    category: "安装配置",
    defaultValue: "false",
  },
  {
    key: "no-warn-script-location",
    label: "不警告脚本位置",
    description: "不警告脚本不在 PATH 中",
    type: "boolean",
    category: "安装配置",
    defaultValue: "false",
  },
  {
    key: "no-warn-conflicts",
    label: "不警告冲突",
    description: "不警告依赖冲突",
    type: "boolean",
    category: "安装配置",
    defaultValue: "false",
  },

  // ========== 下载配置 ==========
  // 注：下载配置主要用于 pip download 命令，不是配置文件选项
  {
    key: "platform",
    label: "平台",
    description: "目标平台（例如：linux_x86_64）",
    type: "text",
    category: "下载配置",
    placeholder: "linux_x86_64",
  },
  {
    key: "python-version",
    label: "Python 版本",
    description: "目标 Python 版本（例如：3.9）",
    type: "text",
    category: "下载配置",
    placeholder: "3.9",
  },
  {
    key: "implementation",
    label: "实现",
    description: "Python 实现（例如：cp、pp、jy）",
    type: "text",
    category: "下载配置",
    placeholder: "cp",
  },
  {
    key: "abi",
    label: "ABI",
    description: "应用二进制接口（例如：cp39）",
    type: "text",
    category: "下载配置",
    placeholder: "cp39",
  },
  {
    key: "only-binary",
    label: "仅二进制",
    description: "仅使用二进制分发包（:all: 表示所有包，:none: 表示不使用）",
    type: "text",
    category: "下载配置",
    placeholder: ":all:",
  },
  {
    key: "no-binary",
    label: "不使用二进制",
    description: "不使用二进制分发包（:all: 表示所有包，:none: 表示不使用）",
    type: "text",
    category: "下载配置",
    placeholder: ":none:",
  },
  {
    key: "prefer-binary",
    label: "优先二进制",
    description: "优先使用二进制分发包而非源码包",
    type: "boolean",
    category: "下载配置",
    defaultValue: "false",
  },
  {
    key: "no-clean",
    label: "不清理",
    description: "下载后不清理临时文件",
    type: "boolean",
    category: "下载配置",
    defaultValue: "false",
  },

  // ========== 日志配置 ==========
  {
    key: "log",
    label: "日志文件",
    description: "日志文件路径",
    type: "text",
    category: "日志配置",
    placeholder: "~/.pip/pip.log",
  },
  // log-file 是 log 的别名，已合并到 log 字段
  {
    key: "verbose",
    label: "详细输出",
    description: "启用详细输出",
    type: "boolean",
    category: "日志配置",
    defaultValue: "false",
  },
  {
    key: "quiet",
    label: "静默模式",
    description: "静默模式，减少输出",
    type: "boolean",
    category: "日志配置",
    defaultValue: "false",
  },
  {
    key: "progress-bar",
    label: "进度条",
    description: "显示进度条（on、off、ascii、pretty、emoji）",
    type: "select",
    category: "日志配置",
    options: [
      { label: "开启", value: "on" },
      { label: "关闭", value: "off" },
      { label: "ASCII", value: "ascii" },
      { label: "美化", value: "pretty" },
      { label: "Emoji", value: "emoji" },
    ],
    defaultValue: "on",
  },

  // ========== 其他配置 ==========
  {
    key: "disable-pip-version-check",
    label: "禁用版本检查",
    description: "禁用 pip 版本检查",
    type: "boolean",
    category: "其他配置",
    defaultValue: "false",
  },
  {
    key: "isolated",
    label: "隔离模式",
    description: "隔离模式，忽略环境变量和用户配置",
    type: "boolean",
    category: "其他配置",
    defaultValue: "false",
  },
  {
    key: "ignore-installed",
    label: "忽略已安装",
    description: "忽略已安装的包，强制重新安装",
    type: "boolean",
    category: "其他配置",
    defaultValue: "false",
  },
  {
    key: "no-build-isolation",
    label: "禁用构建隔离",
    description: "禁用构建隔离（高级选项）",
    type: "boolean",
    category: "安装配置",
    defaultValue: "false",
  },
  {
    key: "use-pep517",
    label: "使用 PEP 517",
    description: "使用 PEP 517 构建源码包（新版 pip 默认启用）",
    type: "boolean",
    category: "安装配置",
    defaultValue: "true",
  },
  {
    key: "check-build-dependencies",
    label: "检查构建依赖",
    description: "使用 PEP517 时检查构建依赖项",
    type: "boolean",
    category: "安装配置",
    defaultValue: "false",
    meta: {
      cliFlags: ["--check-build-dependencies"],
      notes: "根据 pip 版本可能不可用",
    },
  },
  {
    key: "use-feature",
    label: "启用实验性功能",
    description: "启用实验性功能（可多个，用空格分隔）",
    type: "text",
    category: "其他配置",
    placeholder: "fast-deps",
  },
  // constraint 是命令行选项，不是配置文件选项
  // build-dir, src, dist-dir 是临时目录选项，不是配置文件选项，已移除
  // no-use-pep517 是 use-pep517 的反向选项，已包含在 use-pep517 字段中
  {
    key: "keyring-provider",
    label: "密钥环提供者",
    description:
      "凭证查找机制：auto（自动）、disabled（禁用）、import（导入）、subprocess（子进程）",
    type: "select",
    category: "其他配置",
    options: [
      { label: "自动", value: "auto" },
      { label: "禁用", value: "disabled" },
      { label: "导入", value: "import" },
      { label: "子进程", value: "subprocess" },
    ],
    defaultValue: "auto",
    meta: {
      cliFlags: ["--keyring-provider"],
      notes: "需要 pip 支持 keyring-provider 选项",
    },
  },
  {
    key: "no-color",
    label: "禁用颜色输出",
    description: "禁止在输出中使用颜色",
    type: "boolean",
    category: "日志配置",
    defaultValue: "false",
    meta: {
      cliFlags: ["--no-color"],
    },
  },
];

// 按分类和节分组
export const pipFieldsByCategory = pipFields.reduce((acc, field) => {
  const category = field.category;
  if (!acc[category]) {
    acc[category] = [];
  }
  acc[category].push(field);
  return acc;
}, {} as Record<string, PipField[]>);

// 预设配置
export const presetConfigs = {
  tsinghua: {
    "index-url": "https://pypi.tuna.tsinghua.edu.cn/simple",
    "trusted-host": "pypi.tuna.tsinghua.edu.cn",
    timeout: "15",
    retries: "5",
  },
  aliyun: {
    "index-url": "https://mirrors.aliyun.com/pypi/simple/",
    "trusted-host": "mirrors.aliyun.com",
    timeout: "15",
    retries: "5",
  },
  official: {
    "index-url": "https://pypi.org/simple",
  },
};
