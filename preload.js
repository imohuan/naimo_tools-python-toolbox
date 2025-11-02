"use strict";
const electron = require("electron");
const child_process = require("child_process");
const util = require("util");
const fs = require("fs/promises");
const path = require("path");
const os = require("os");
const https = require("https");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const os__namespace = /* @__PURE__ */ _interopNamespaceDefault(os);
const https__namespace = /* @__PURE__ */ _interopNamespaceDefault(https);
const execAsync = util.promisify(child_process.exec);
let logCallback = null;
let commandStartCallback = null;
let commandLogCallback = null;
let commandEndCallback = null;
function sendLog(message) {
  if (logCallback) {
    logCallback(message);
  }
}
function sendCommandStart(commandId, command) {
  if (commandStartCallback) {
    commandStartCallback(commandId, command);
  }
}
function sendCommandLog(commandId, message, type) {
  if (commandLogCallback) {
    commandLogCallback(commandId, message, type);
  }
}
function sendCommandEnd(commandId, exitCode) {
  if (commandEndCallback) {
    commandEndCallback(commandId, exitCode);
  }
}
function generateCommandId() {
  return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
async function executeCommandWithLogs(command, commandId) {
  const id = commandId || generateCommandId();
  sendCommandStart(id, command);
  return new Promise((resolve) => {
    const child = child_process.spawn(command, [], {
      shell: true,
      env: process.env
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
async function getPythonVersion() {
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
async function getPipVersion() {
  try {
    const { stdout } = await execAsync("pip --version");
    const match = stdout.trim().match(/pip\s+(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
async function getUvVersion() {
  try {
    const { stdout } = await execAsync("uv --version");
    const match = stdout.trim().match(/uv\s+(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
let uvAvailableCache = null;
async function isUvAvailable() {
  if (uvAvailableCache !== null) {
    return uvAvailableCache;
  }
  try {
    await execAsync("uv --version");
    uvAvailableCache = true;
    return true;
  } catch {
    uvAvailableCache = false;
    return false;
  }
}
async function getPythonPath() {
  try {
    const isWindows = os__namespace.platform() === "win32";
    const command = isWindows ? "where python" : "which python";
    const { stdout } = await execAsync(command);
    return stdout.trim().split("\n")[0] || null;
  } catch {
    return null;
  }
}
async function getEnvironmentInfo() {
  const logs = [];
  const parseVersion = (output, regex) => {
    const match = output.match(regex);
    return match ? match[1] : null;
  };
  const collectOutput = (stdout, stderr) => `${stdout}
${stderr}`.trim();
  async function runWithLogs(command) {
    const result = await executeCommandWithLogs(command);
    return {
      output: collectOutput(result.stdout, result.stderr),
      exitCode: result.exitCode
    };
  }
  let pythonVersion = null;
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
  let pipVersion = null;
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
  let uvVersion = null;
  try {
    const result = await runWithLogs("uv --version");
    uvVersion = parseVersion(result.output, /uv\s+([\d.]+)/);
  } catch (error) {
    console.error("检测 uv 版本失败:", error);
  }
  logs.push(`uv版本: ${uvVersion || "未安装"}`);
  let pythonPath = null;
  try {
    const isWindows = os__namespace.platform() === "win32";
    const cmd = isWindows ? "where python" : "which python";
    const result = await runWithLogs(cmd);
    if (result.exitCode === 0 && result.output) {
      pythonPath = result.output.split(/\r?\n/)[0] || null;
    }
  } catch (error) {
    console.error("检测 Python 路径失败:", error);
  }
  logs.push(`Python路径: ${pythonPath || "未找到"}`);
  let pipPath = null;
  try {
    const isWindows = os__namespace.platform() === "win32";
    const cmd = isWindows ? "where pip" : "which pip";
    const result = await runWithLogs(cmd);
    if (result.exitCode === 0 && result.output) {
      pipPath = result.output.split(/\r?\n/)[0] || null;
    }
  } catch (error) {
    console.error("检测 pip 路径失败:", error);
  }
  logs.push(`pip路径: ${pipPath || "未找到"}`);
  let uvPath = null;
  try {
    const isWindows = os__namespace.platform() === "win32";
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
    logs
  };
}
async function installGlobalPackage(name) {
  const useUv = await isUvAvailable();
  const command = useUv ? `uv pip install --system ${name}` : `pip install ${name}`;
  try {
    const result = await executeCommandWithLogs(command);
    return {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      error: error.message
    };
  }
}
async function updateGlobalPackage(name) {
  const useUv = await isUvAvailable();
  const command = useUv ? `uv pip install --upgrade --system ${name}` : `pip install --upgrade ${name}`;
  try {
    const result = await executeCommandWithLogs(command);
    return {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      error: error.message
    };
  }
}
async function uninstallGlobalPackage(name) {
  const useUv = await isUvAvailable();
  const command = useUv ? `uv pip uninstall -y --system ${name}` : `pip uninstall -y ${name}`;
  try {
    const result = await executeCommandWithLogs(command);
    return {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      error: error.message
    };
  }
}
async function checkGlobalPackage(name) {
  try {
    const { stdout } = await execAsync(`pip show ${name}`);
    const versionMatch = stdout.match(/Version:\s+(\S+)/);
    return {
      installed: true,
      version: versionMatch ? versionMatch[1] : void 0
    };
  } catch {
    return {
      installed: false
    };
  }
}
async function listGlobalPackages() {
  const useUv = await isUvAvailable();
  const command = useUv ? `uv pip list --format=json --system` : `pip list --format=json`;
  try {
    const result = await executeCommandWithLogs(command);
    if (result.exitCode === 0) {
      try {
        const packages = JSON.parse(result.stdout);
        return {
          packages: packages.map((pkg) => ({
            name: pkg.name,
            version: pkg.version
          })),
          stdout: result.stdout,
          stderr: result.stderr
        };
      } catch {
        return {
          packages: [],
          stdout: result.stdout,
          stderr: result.stderr
        };
      }
    }
    return {
      packages: [],
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error) {
    return {
      packages: [],
      stdout: "",
      stderr: error.message
    };
  }
}
async function getLatestVersion(name) {
  try {
    const { stdout } = await execAsync(`pip index versions ${name}`);
    const match = stdout.match(/Available versions:\s+([^\s,]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
async function batchUpdatePackages(names) {
  const results = [];
  if (names.length === 0) return results;
  const CONCURRENT_LIMIT = 5;
  let taskIndex = 0;
  const taskQueue = [...names];
  const getNextTaskIndex = () => {
    if (taskIndex >= taskQueue.length) return -1;
    return taskIndex++;
  };
  const worker = async () => {
    while (true) {
      const currentIndex = getNextTaskIndex();
      if (currentIndex < 0) break;
      const name = taskQueue[currentIndex];
      try {
        const result = await updateGlobalPackage(name);
        results.push({
          name,
          success: result.success,
          stdout: result.stdout,
          stderr: result.stderr,
          error: result.error
        });
      } catch (error) {
        results.push({
          name,
          success: false,
          error: error.message
        });
      }
    }
  };
  const workers = Array.from(
    { length: Math.min(CONCURRENT_LIMIT, names.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}
async function searchPyPIPackages(keyword) {
  try {
    const { stdout } = await execAsync(`pip search "${keyword}"`);
    const packages = [];
    const lines = stdout.split("\n");
    for (const line of lines) {
      const match = line.match(/^(\S+)\s+\(([^)]+)\)\s+-\s+(.+)$/);
      if (match) {
        packages.push({
          name: match[1],
          version: match[2],
          description: match[3]
        });
      }
    }
    return { packages };
  } catch {
    return { packages: [] };
  }
}
async function getPipConfigPath() {
  const homeDir = os__namespace.homedir();
  const isWindows = os__namespace.platform() === "win32";
  if (isWindows) {
    return path__namespace.join(homeDir, "pip", "pip.ini");
  } else {
    return path__namespace.join(homeDir, ".pip", "pip.conf");
  }
}
async function readPipConfig() {
  try {
    const configPath = await getPipConfigPath();
    const content = await fs__namespace.readFile(configPath, "utf-8");
    return content;
  } catch {
    return "";
  }
}
async function writePipConfig(content) {
  const configPath = await getPipConfigPath();
  const dir = path__namespace.dirname(configPath);
  await fs__namespace.mkdir(dir, { recursive: true });
  await fs__namespace.writeFile(configPath, content, "utf-8");
}
async function getUvConfigPath() {
  const homeDir = os__namespace.homedir();
  const configDir = path__namespace.join(homeDir, ".config", "uv");
  return path__namespace.join(configDir, "uv.toml");
}
async function readUvConfig() {
  try {
    const configPath = await getUvConfigPath();
    const content = await fs__namespace.readFile(configPath, "utf-8");
    return content;
  } catch {
    return "";
  }
}
async function writeUvConfig(content) {
  const configPath = await getUvConfigPath();
  const dir = path__namespace.dirname(configPath);
  await fs__namespace.mkdir(dir, { recursive: true });
  await fs__namespace.writeFile(configPath, content, "utf-8");
}
async function getEnvironmentVariables() {
  return { ...process.env };
}
async function setEnvironmentVariable(key, value) {
  const isWindows = os__namespace.platform() === "win32";
  if (isWindows) {
    await execAsync(`setx ${key} "${value}"`);
  } else {
    throw new Error("设置环境变量在非Windows系统上需要手动操作");
  }
}
async function selectFolder() {
  try {
    const result = await window.naimo.dialog.showOpen({
      properties: ["openDirectory"],
      title: "选择文件夹"
    });
    if (result && result.length > 0) {
      return result[0];
    }
    return null;
  } catch (error) {
    console.error("选择文件夹失败:", error);
    return null;
  }
}
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https__namespace.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
        const location = res.headers.location;
        if (location) {
          fetchJson(location).then(resolve).catch(reject);
          res.resume();
          return;
        }
      }
      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
        reject(new Error(`HTTP ${res.statusCode}`));
        res.resume();
        return;
      }
      let rawData = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        rawData += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    }).on("error", (error) => {
      reject(error);
    });
  });
}
async function getPythonVersions() {
  try {
    const data = await fetchJson(
      "https://www.python.org/api/v2/downloads/release/?is_published=true&show_on_download_page=true&ordering=-release_date"
    );
    const versions = data.filter((release) => release.is_published).map((release) => {
      const version = release.name.replace("Python ", "");
      const match = version.match(/(\d+\.\d+\.\d+)/);
      const normalized = match ? match[1] : null;
      return normalized ? {
        version: normalized,
        releaseDate: release.release_date,
        isPreRelease: release.pre_release,
        resourceUri: release.resource_uri
      } : null;
    }).filter(
      (item) => !!item
    );
    if (versions.length > 0) {
      return versions.sort(
        (a, b) => b.version.localeCompare(a.version, void 0, { numeric: true })
      );
    }
    return [];
  } catch {
    return [];
  }
}
async function downloadPython(version, platform) {
  try {
    const url = `https://www.python.org/ftp/python/${version}/python-${version}-${platform}.exe`;
    const downloadDir = path__namespace.join(os__namespace.homedir(), "Downloads");
    const filePath = path__namespace.join(
      downloadDir,
      `python-${version}-${platform}.exe`
    );
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    await fs__namespace.writeFile(filePath, Buffer.from(buffer));
    return {
      success: true,
      filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
async function createVirtualEnv(_name, envPath, useUv = false) {
  const command = useUv ? `uv venv "${envPath}"` : `python -m venv "${envPath}"`;
  try {
    const result = await executeCommandWithLogs(command);
    return {
      success: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error) {
    return {
      success: false,
      stdout: "",
      stderr: "",
      error: error.message
    };
  }
}
async function listVirtualEnvs(basePath) {
  try {
    const entries = await fs__namespace.readdir(basePath, { withFileTypes: true });
    const envs = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const envPath = path__namespace.join(basePath, entry.name);
        const pythonPath = path__namespace.join(envPath, "Scripts", "python.exe");
        try {
          await fs__namespace.access(pythonPath);
          const { stdout } = await execAsync(`"${pythonPath}" --version`);
          const match = stdout.match(/Python\s+(\d+\.\d+\.\d+)/);
          envs.push({
            name: entry.name,
            path: envPath,
            pythonVersion: match ? match[1] : "Unknown"
          });
        } catch {
        }
      }
    }
    return envs;
  } catch {
    return [];
  }
}
async function deleteVirtualEnv(envPath) {
  try {
    await fs__namespace.rm(envPath, { recursive: true, force: true });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
async function getSystemInfo() {
  return {
    platform: os__namespace.platform(),
    arch: os__namespace.arch(),
    homeDir: os__namespace.homedir(),
    tempDir: os__namespace.tmpdir()
  };
}
const CLI_OPTION_REGEX = /--[a-z0-9][\w-]*/gi;
function addCliOptions(output, collector) {
  if (!output) return;
  const matches = output.match(CLI_OPTION_REGEX);
  if (!matches) return;
  matches.forEach((flag) => {
    collector.add(flag.toLowerCase());
  });
}
async function collectCliOptions(commands) {
  const collector = /* @__PURE__ */ new Set();
  const executed = [];
  for (const command of commands) {
    sendLog(`正在执行命令: ${command}`);
    const { stdout, stderr } = await executeCommandWithLogs(command);
    executed.push(command);
    addCliOptions(stdout, collector);
    addCliOptions(stderr, collector);
  }
  return {
    options: Array.from(collector).sort(),
    sourceCommands: executed,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
let pipOptionsCache = null;
let pipOptionsPromise = null;
async function getPipCliOptions() {
  if (pipOptionsCache) {
    return pipOptionsCache;
  }
  if (!pipOptionsPromise) {
    pipOptionsPromise = collectCliOptions([
      "pip --help",
      "pip install --help",
      "pip config --help",
      "pip download --help"
    ]);
  }
  pipOptionsCache = await pipOptionsPromise;
  pipOptionsPromise = null;
  return pipOptionsCache;
}
let uvOptionsCache = null;
let uvOptionsPromise = null;
async function getUvCliOptions() {
  if (uvOptionsCache) {
    return uvOptionsCache;
  }
  if (!uvOptionsPromise) {
    uvOptionsPromise = collectCliOptions([
      "uv --help",
      "uv pip install --help"
    ]);
  }
  uvOptionsCache = await uvOptionsPromise;
  uvOptionsPromise = null;
  return uvOptionsCache;
}
const api = {
  onLog: (callback) => {
    logCallback = callback;
  },
  onCommandStart: (callback) => {
    commandStartCallback = callback;
  },
  onCommandLog: (callback) => {
    commandLogCallback = callback;
  },
  onCommandEnd: (callback) => {
    commandEndCallback = callback;
  },
  getPythonVersion,
  getPipVersion,
  getUvVersion,
  getPythonPath,
  getEnvironmentInfo,
  getPipSupportedOptions: async () => {
    const result = await getPipCliOptions();
    return {
      ...result,
      options: result.options
    };
  },
  getUvSupportedOptions: async () => {
    const result = await getUvCliOptions();
    return {
      ...result,
      options: result.options
    };
  },
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
  readUvConfig,
  writeUvConfig,
  getUvConfigPath,
  getEnvironmentVariables,
  setEnvironmentVariable,
  selectFolder,
  downloadPython,
  getPythonVersions,
  createVirtualEnv,
  listVirtualEnvs,
  deleteVirtualEnv,
  getSystemInfo
};
electron.contextBridge.exposeInMainWorld("pythonToolboxAPI", api);
