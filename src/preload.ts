/// <reference path="../typings/naimo.d.ts" />

import { contextBridge } from "electron";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

// 日志回调函数
type LogCallback = (data: string) => void;
let logCallback: LogCallback | null = null;

// 命令组回调函数
type CommandStartCallback = (commandId: string, command: string) => void;
type CommandLogCallback = (
  commandId: string,
  message: string,
  type?: "info" | "error" | "warning"
) => void;
type CommandEndCallback = (commandId: string, exitCode: number) => void;

let commandStartCallback: CommandStartCallback | null = null;
let commandLogCallback: CommandLogCallback | null = null;
let commandEndCallback: CommandEndCallback | null = null;

// 定义 API 接口
interface PythonToolboxAPI {
  // 日志监听
  onLog: (callback: LogCallback) => void;

  // 命令组监听
  onCommandStart: (callback: CommandStartCallback) => void;
  onCommandLog: (callback: CommandLogCallback) => void;
  onCommandEnd: (callback: CommandEndCallback) => void;

  // Python 版本检测
  getPythonVersion: () => Promise<string | null>;
  getPipVersion: () => Promise<string | null>;
  getUvVersion: () => Promise<string | null>;
  getPythonPath: () => Promise<string | null>;
  getEnvironmentInfo: () => Promise<{
    pythonVersion: string | null;
    pipVersion: string | null;
    uvVersion: string | null;
    pythonPath: string | null;
    pipPath: string | null;
    uvPath: string | null;
    logs: string[];
  }>;

  // 执行命令
  executeCommand: (command: string) => Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }>;

  // 全局包管理
  installGlobalPackage: (
    name: string,
    usePip?: boolean
  ) => Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    error?: string;
  }>;
  updateGlobalPackage: (
    name: string,
    usePip?: boolean
  ) => Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    error?: string;
  }>;
  uninstallGlobalPackage: (
    name: string,
    usePip?: boolean
  ) => Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    error?: string;
  }>;
  checkGlobalPackage: (name: string) => Promise<{
    installed: boolean;
    version?: string;
  }>;
  listGlobalPackages: (usePip?: boolean) => Promise<{
    packages: Array<{
      name: string;
      version: string;
    }>;
    stdout: string;
    stderr: string;
  }>;
  getLatestVersion: (name: string) => Promise<string | null>;
  batchUpdatePackages: (
    names: string[],
    usePip?: boolean
  ) => Promise<
    Array<{
      name: string;
      success: boolean;
      stdout?: string;
      stderr?: string;
      error?: string;
    }>
  >;
  searchPyPIPackages: (keyword: string) => Promise<{
    packages: Array<{
      name: string;
      description: string;
      version: string;
      author?: string;
    }>;
  }>;

  // pip/uv 配置文件操作
  readPipConfig: () => Promise<string>;
  writePipConfig: (content: string) => Promise<void>;
  getPipConfigPath: () => Promise<string>;

  // 环境变量管理
  getEnvironmentVariables: () => Promise<Record<string, string>>;
  setEnvironmentVariable: (key: string, value: string) => Promise<void>;

  // Python 下载
  downloadPython: (
    version: string,
    platform: string
  ) => Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }>;
  getPythonVersions: () => Promise<
    Array<{
      version: string;
      releaseDate: string;
      isPreRelease: boolean;
    }>
  >;

  // 虚拟环境管理
  createVirtualEnv: (
    name: string,
    path: string,
    useUv?: boolean
  ) => Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    error?: string;
  }>;
  listVirtualEnvs: (basePath: string) => Promise<
    Array<{
      name: string;
      path: string;
      pythonVersion: string;
    }>
  >;
  deleteVirtualEnv: (path: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  // 系统信息
  getSystemInfo: () => Promise<{
    platform: string;
    arch: string;
    homeDir: string;
    tempDir: string;
  }>;
}

// 发送日志到渲染进程
function sendLog(message: string) {
  if (logCallback) {
    logCallback(message);
  }
}

// 命令组相关
function sendCommandStart(commandId: string, command: string) {
  if (commandStartCallback) {
    commandStartCallback(commandId, command);
  }
}

function sendCommandLog(
  commandId: string,
  message: string,
  type?: "info" | "error" | "warning"
) {
  if (commandLogCallback) {
    commandLogCallback(commandId, message, type);
  }
}

function sendCommandEnd(commandId: string, exitCode: number) {
  if (commandEndCallback) {
    commandEndCallback(commandId, exitCode);
  }
}

// 生成命令ID
function generateCommandId(): string {
  return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 执行命令并发送日志
async function executeCommandWithLogs(
  command: string,
  commandId?: string
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  const id = commandId || generateCommandId();
  sendCommandStart(id, command);

  return new Promise((resolve) => {
    const child = spawn(command, [], {
      shell: true,
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      sendCommandLog(id, text, "info");
    });

    child.stderr?.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      sendCommandLog(id, text, "error");
    });

    child.on("close", (code) => {
      const exitCode = code || 0;
      sendCommandEnd(id, exitCode);
      resolve({ stdout, stderr, exitCode });
    });

    child.on("error", (error) => {
      sendCommandLog(id, `执行错误: ${error.message}`, "error");
      sendCommandEnd(id, 1);
      resolve({ stdout, stderr: error.message, exitCode: 1 });
    });
  });
}

// Python 版本检测
async function getPythonVersion(): Promise<string | null> {
  try {
    const { stdout } = await execAsync("python --version");
    const match = stdout.trim().match(/Python\s+(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch {
    try {
      const { stdout } = await execAsync("python3 --version");
      const match = stdout.trim().match(/Python\s+(\d+\.\d+\.\d+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}

async function getPipVersion(): Promise<string | null> {
  try {
    const { stdout } = await execAsync("pip --version");
    const match = stdout.trim().match(/pip\s+(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function getUvVersion(): Promise<string | null> {
  try {
    const { stdout } = await execAsync("uv --version");
    const match = stdout.trim().match(/uv\s+(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function getPythonPath(): Promise<string | null> {
  try {
    const isWindows = os.platform() === "win32";
    const command = isWindows ? "where python" : "which python";
    const { stdout } = await execAsync(command);
    return stdout.trim().split("\n")[0] || null;
  } catch {
    return null;
  }
}

async function getEnvironmentInfo() {
  const logs: string[] = [];

  const parseVersion = (output: string, regex: RegExp) => {
    const match = output.match(regex);
    return match ? match[1] : null;
  };

  const collectOutput = (stdout: string, stderr: string) =>
    `${stdout}\n${stderr}`.trim();

  async function runWithLogs(command: string) {
    const result = await executeCommandWithLogs(command);
    return {
      output: collectOutput(result.stdout, result.stderr),
      exitCode: result.exitCode,
    };
  }

  // 检测 Python 版本
  let pythonVersion: string | null = null;
  try {
    const primary = await runWithLogs("python --version");
    pythonVersion = parseVersion(primary.output, /Python\s+([\d.]+)/);

    if (!pythonVersion) {
      const fallback = await runWithLogs("python3 --version");
      pythonVersion = parseVersion(fallback.output, /Python\s+([\d.]+)/);
    }
  } catch (error) {
    console.error("检测 Python 版本失败:", error);
  }
  logs.push(`Python版本: ${pythonVersion || "未安装"}`);

  // 检测 pip 版本
  let pipVersion: string | null = null;
  try {
    const primary = await runWithLogs("pip --version");
    pipVersion = parseVersion(primary.output, /pip\s+([\d.]+)/);

    if (!pipVersion) {
      const fallback = await runWithLogs("python -m pip --version");
      pipVersion = parseVersion(fallback.output, /pip\s+([\d.]+)/);
    }
  } catch (error) {
    console.error("检测 pip 版本失败:", error);
  }
  logs.push(`pip版本: ${pipVersion || "未安装"}`);

  // 检测 uv 版本
  let uvVersion: string | null = null;
  try {
    const result = await runWithLogs("uv --version");
    uvVersion = parseVersion(result.output, /uv\s+([\d.]+)/);
  } catch (error) {
    console.error("检测 uv 版本失败:", error);
  }
  logs.push(`uv版本: ${uvVersion || "未安装"}`);

  // 检测 Python 路径
  let pythonPath: string | null = null;
  try {
    const isWindows = os.platform() === "win32";
    const cmd = isWindows ? "where python" : "which python";
    const result = await runWithLogs(cmd);
    if (result.exitCode === 0 && result.output) {
      pythonPath = result.output.split(/\r?\n/)[0] || null;
    }
  } catch (error) {
    console.error("检测 Python 路径失败:", error);
  }
  logs.push(`Python路径: ${pythonPath || "未找到"}`);

  // 检测 pip 路径
  let pipPath: string | null = null;
  try {
    const isWindows = os.platform() === "win32";
    const cmd = isWindows ? "where pip" : "which pip";
    const result = await runWithLogs(cmd);
    if (result.exitCode === 0 && result.output) {
      pipPath = result.output.split(/\r?\n/)[0] || null;
    }
  } catch (error) {
    console.error("检测 pip 路径失败:", error);
  }
  logs.push(`pip路径: ${pipPath || "未找到"}`);

  // 检测 uv 路径
  let uvPath: string | null = null;
  try {
    const isWindows = os.platform() === "win32";
    const cmd = isWindows ? "where uv" : "which uv";
    const result = await runWithLogs(cmd);
    if (result.exitCode === 0 && result.output) {
      uvPath = result.output.split(/\r?\n/)[0] || null;
    }
  } catch (error) {
    console.error("检测 uv 路径失败:", error);
  }
  logs.push(`uv路径: ${uvPath || "未找到"}`);

  return {
    pythonVersion,
    pipVersion,
    uvVersion,
    pythonPath,
    pipPath,
    uvPath,
    logs,
  };
}

// 全局包管理
async function installGlobalPackage(name: string, usePip: boolean = false) {
  const packageManager = usePip ? "pip" : "uv pip";
  const command = `${packageManager} install ${name}`;

  try {
    const result = await executeCommandWithLogs(command);
    return {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error: any) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      error: error.message,
    };
  }
}

async function updateGlobalPackage(name: string, usePip: boolean = false) {
  const packageManager = usePip ? "pip" : "uv pip";
  const command = `${packageManager} install --upgrade ${name}`;

  try {
    const result = await executeCommandWithLogs(command);
    return {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error: any) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      error: error.message,
    };
  }
}

async function uninstallGlobalPackage(name: string, usePip: boolean = false) {
  const packageManager = usePip ? "pip" : "uv pip";
  const command = `${packageManager} uninstall -y ${name}`;

  try {
    const result = await executeCommandWithLogs(command);
    return {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error: any) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      error: error.message,
    };
  }
}

async function checkGlobalPackage(name: string) {
  try {
    const { stdout } = await execAsync(`pip show ${name}`);
    const versionMatch = stdout.match(/Version:\s+(\S+)/);
    return {
      installed: true,
      version: versionMatch ? versionMatch[1] : undefined,
    };
  } catch {
    return {
      installed: false,
    };
  }
}

async function listGlobalPackages(usePip: boolean = false) {
  const packageManager = usePip ? "pip" : "uv pip";
  const command = `${packageManager} list --format=json`;

  try {
    const result = await executeCommandWithLogs(command);

    if (result.exitCode === 0) {
      try {
        const packages = JSON.parse(result.stdout);
        return {
          packages: packages.map((pkg: any) => ({
            name: pkg.name,
            version: pkg.version,
          })),
          stdout: result.stdout,
          stderr: result.stderr,
        };
      } catch {
        return {
          packages: [],
          stdout: result.stdout,
          stderr: result.stderr,
        };
      }
    }

    return {
      packages: [],
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error: any) {
    return {
      packages: [],
      stdout: "",
      stderr: error.message,
    };
  }
}

async function getLatestVersion(name: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`pip index versions ${name}`);
    const match = stdout.match(/Available versions:\s+([^\s,]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function batchUpdatePackages(names: string[], usePip: boolean = false) {
  const results = [];

  for (const name of names) {
    try {
      const result = await updateGlobalPackage(name, usePip);
      results.push({
        name,
        success: result.success,
        stdout: result.stdout,
        stderr: result.stderr,
        error: result.error,
      });
    } catch (error: any) {
      results.push({
        name,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

async function searchPyPIPackages(keyword: string) {
  try {
    const { stdout } = await execAsync(`pip search "${keyword}"`);

    const packages: Array<{
      name: string;
      description: string;
      version: string;
    }> = [];

    const lines = stdout.split("\n");
    for (const line of lines) {
      const match = line.match(/^(\S+)\s+\(([^)]+)\)\s+-\s+(.+)$/);
      if (match) {
        packages.push({
          name: match[1],
          version: match[2],
          description: match[3],
        });
      }
    }

    return { packages };
  } catch {
    return { packages: [] };
  }
}

// pip配置文件操作
async function getPipConfigPath(): Promise<string> {
  const homeDir = os.homedir();
  const isWindows = os.platform() === "win32";

  if (isWindows) {
    return path.join(homeDir, "pip", "pip.ini");
  } else {
    return path.join(homeDir, ".pip", "pip.conf");
  }
}

async function readPipConfig(): Promise<string> {
  try {
    const configPath = await getPipConfigPath();
    const content = await fs.readFile(configPath, "utf-8");
    return content;
  } catch {
    return "";
  }
}

async function writePipConfig(content: string): Promise<void> {
  const configPath = await getPipConfigPath();
  const dir = path.dirname(configPath);

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(configPath, content, "utf-8");
}

// 环境变量管理
async function getEnvironmentVariables(): Promise<Record<string, string>> {
  return { ...process.env } as Record<string, string>;
}

async function setEnvironmentVariable(
  key: string,
  value: string
): Promise<void> {
  const isWindows = os.platform() === "win32";

  if (isWindows) {
    await execAsync(`setx ${key} "${value}"`);
  } else {
    throw new Error("设置环境变量在非Windows系统上需要手动操作");
  }
}

// Python下载
async function getPythonVersions() {
  try {
    const response = await fetch(
      "https://www.python.org/api/v2/downloads/release/"
    );
    const data = await response.json();

    return data.map((release: any) => ({
      version: release.name.replace("Python ", ""),
      releaseDate: release.release_date,
      isPreRelease: release.is_published && release.pre_release,
    }));
  } catch {
    return [];
  }
}

async function downloadPython(version: string, platform: string) {
  try {
    const url = `https://www.python.org/ftp/python/${version}/python-${version}-${platform}.exe`;
    const downloadDir = path.join(os.homedir(), "Downloads");
    const filePath = path.join(
      downloadDir,
      `python-${version}-${platform}.exe`
    );

    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(buffer));

    return {
      success: true,
      filePath,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// 虚拟环境管理
async function createVirtualEnv(
  name: string,
  envPath: string,
  useUv: boolean = false
) {
  const command = useUv
    ? `uv venv "${envPath}"`
    : `python -m venv "${envPath}"`;

  try {
    const result = await executeCommandWithLogs(command);
    return {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error: any) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      error: error.message,
    };
  }
}

async function listVirtualEnvs(basePath: string) {
  try {
    const entries = await fs.readdir(basePath, { withFileTypes: true });
    const envs = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const envPath = path.join(basePath, entry.name);
        const pythonPath = path.join(envPath, "Scripts", "python.exe");

        try {
          await fs.access(pythonPath);
          const { stdout } = await execAsync(`"${pythonPath}" --version`);
          const match = stdout.match(/Python\s+(\d+\.\d+\.\d+)/);

          envs.push({
            name: entry.name,
            path: envPath,
            pythonVersion: match ? match[1] : "Unknown",
          });
        } catch {
          // 不是有效的虚拟环境
        }
      }
    }

    return envs;
  } catch {
    return [];
  }
}

async function deleteVirtualEnv(envPath: string) {
  try {
    await fs.rm(envPath, { recursive: true, force: true });
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// 系统信息
async function getSystemInfo() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    homeDir: os.homedir(),
    tempDir: os.tmpdir(),
  };
}

// 暴露API到渲染进程
const api: PythonToolboxAPI = {
  onLog: (callback: LogCallback) => {
    logCallback = callback;
  },

  onCommandStart: (callback: CommandStartCallback) => {
    commandStartCallback = callback;
  },

  onCommandLog: (callback: CommandLogCallback) => {
    commandLogCallback = callback;
  },

  onCommandEnd: (callback: CommandEndCallback) => {
    commandEndCallback = callback;
  },

  getPythonVersion,
  getPipVersion,
  getUvVersion,
  getPythonPath,
  getEnvironmentInfo,

  executeCommand: executeCommandWithLogs,

  installGlobalPackage,
  updateGlobalPackage,
  uninstallGlobalPackage,
  checkGlobalPackage,
  listGlobalPackages,
  getLatestVersion,
  batchUpdatePackages,
  searchPyPIPackages,

  readPipConfig,
  writePipConfig,
  getPipConfigPath,

  getEnvironmentVariables,
  setEnvironmentVariable,

  downloadPython,
  getPythonVersions,

  createVirtualEnv,
  listVirtualEnvs,
  deleteVirtualEnv,

  getSystemInfo,
};

contextBridge.exposeInMainWorld("pythonToolboxAPI", api);

// 导出类型供renderer使用
declare global {
  interface Window {
    pythonToolboxAPI: PythonToolboxAPI;
  }
}
