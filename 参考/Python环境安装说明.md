# Python + uv 环境一键安装说明

## 📋 功能特点

- ✅ 自动下载并安装 Python 3.11.9
- ✅ 自动安装 uv（超快的包管理器）
- ✅ 所有文件安装到机械硬盘（解决系统盘空间问题）
- ✅ 自动配置环境变量
- ✅ 创建辅助脚本，简化日常操作
- ✅ 支持快速安装 ComfyUI 环境

## 🚀 快速开始

### 1. 运行安装脚本

**右键点击** `setup_python_env.ps1` → **以管理员身份运行**

或者在 PowerShell（管理员）中运行：

```powershell
cd "I:\软件备份"
.\setup_python_env.ps1
```

### 2. 选择安装位置

脚本会自动检测所有磁盘，选择空间较大的磁盘（推荐机械硬盘）

例如选择 D 盘，会在 `D:\Python` 下创建以下结构：

```
D:\Python\
├── Python311\          # Python 主程序
├── envs\              # 虚拟环境目录
│   ├── comfyui\       # ComfyUI 环境
│   ├── myproject\     # 其他项目环境
│   └── ...
├── uv_cache\          # uv 缓存（加速安装）
├── pip_cache\         # pip 缓存
└── scripts\           # 辅助脚本
    ├── create_env.ps1      # 创建环境
    ├── activate_env.ps1    # 激活环境
    ├── list_envs.ps1       # 列出环境
    └── setup_comfyui.ps1   # 安装ComfyUI环境
```

### 3. 重启 PowerShell

安装完成后，**关闭并重新打开 PowerShell**，使环境变量生效。

## 📖 使用方法

### 创建虚拟环境

```powershell
cd D:\Python\scripts
.\create_env.ps1 myproject
```

### 激活虚拟环境

```powershell
.\activate_env.ps1 myproject
```

### 安装依赖包

```powershell
# 激活环境后
uv pip install numpy pandas matplotlib
```

### 列出所有环境

```powershell
.\list_envs.ps1
```

### 快速安装 ComfyUI 环境

```powershell
.\setup_comfyui.ps1
```

脚本会自动：

1. 检测显卡和 CUDA 版本
2. 创建 comfyui 虚拟环境
3. 安装 PyTorch（GPU 或 CPU 版本）
4. 安装常用依赖包

## 💡 常用命令速查

### uv 命令（推荐，速度极快）

```powershell
# 安装包
uv pip install 包名

# 批量安装
uv pip install -r requirements.txt

# 卸载包
uv pip uninstall 包名

# 列出已安装包
uv pip list

# 导出依赖
uv pip freeze > requirements.txt

# 搜索包
uv pip search 包名
```

### 环境管理

```powershell
# 创建环境（Python 3.11）
uv venv D:\Python\envs\环境名

# 创建环境（指定Python版本）
uv venv --python 3.10 D:\Python\envs\环境名

# 激活环境
D:\Python\envs\环境名\Scripts\activate

# 退出环境
deactivate
```

### 查看信息

```powershell
# Python 版本
python --version

# uv 版本
uv --version

# 查看已安装包
pip list
# 或
uv pip list

# 查看包详情
pip show 包名
```

## 🎯 实战示例

### 示例 1：创建数据分析环境

```powershell
# 1. 创建环境
cd D:\Python\scripts
.\create_env.ps1 data-analysis

# 2. 激活环境
.\activate_env.ps1 data-analysis

# 3. 安装常用包
uv pip install numpy pandas matplotlib seaborn jupyter scikit-learn

# 4. 启动 Jupyter
jupyter notebook
```

### 示例 2：创建 Web 开发环境

```powershell
# 1. 创建环境
.\create_env.ps1 web-dev

# 2. 激活环境
.\activate_env.ps1 web-dev

# 3. 安装 FastAPI 相关
uv pip install fastapi uvicorn sqlalchemy pydantic

# 4. 运行项目
uvicorn main:app --reload
```

### 示例 3：ComfyUI 使用

```powershell
# 1. 运行快速安装脚本
cd D:\Python\scripts
.\setup_comfyui.ps1

# 2. 进入 ComfyUI 目录
cd I:\软件备份\不常用\大型\ComfyUI

# 3. 激活环境
D:\Python\envs\comfyui\Scripts\activate

# 4. 安装 ComfyUI 依赖
uv pip install -r requirements.txt

# 5. 运行 ComfyUI
python main.py
```

## ⚙️ 环境变量说明

脚本会自动设置以下环境变量：

| 变量名             | 作用                   | 示例值                    |
| ------------------ | ---------------------- | ------------------------- |
| `UV_CACHE_DIR`     | uv 缓存目录            | `D:\Python\uv_cache`      |
| `PIP_CACHE_DIR`    | pip 缓存目录           | `D:\Python\pip_cache`     |
| `VIRTUAL_ENV_BASE` | 虚拟环境基础目录       | `D:\Python\envs`          |
| `Path`             | 添加 Python 到系统路径 | `D:\Python\Python311;...` |

## 🔧 故障排除

### 问题 1：脚本无法运行

**错误信息：** "无法加载文件，因为在此系统上禁止运行脚本"

**解决方法：**

```powershell
# 以管理员身份运行 PowerShell，执行：
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 问题 2：Python 下载失败

**原因：** 网络问题或防火墙拦截

**解决方法：**

1. 检查网络连接
2. 关闭防火墙重试
3. 手动下载 Python 安装到 `D:\Python\Python311`，然后重新运行脚本（会跳过下载）

### 问题 3：环境变量未生效

**解决方法：**

1. 完全关闭所有 PowerShell 窗口
2. 重新打开 PowerShell
3. 运行 `python --version` 验证

### 问题 4：uv 命令找不到

**解决方法：**

```powershell
# 手动添加到 PATH
$env:Path += ";D:\Python\Python311\Scripts"

# 或重新安装
python -m pip install uv
```

## 📊 性能对比

### 安装速度测试（50 个包）

| 工具   | 时间       | 速度       |
| ------ | ---------- | ---------- |
| **uv** | 30-60 秒   | ⭐⭐⭐⭐⭐ |
| pip    | 5-10 分钟  | ⭐⭐       |
| conda  | 10-20 分钟 | ⭐         |

### 磁盘占用

| 项目     | uv     | conda |
| -------- | ------ | ----- |
| 缓存大小 | ~500MB | ~2GB  |
| 环境大小 | ~1GB   | ~3GB  |
| 总体占用 | 较小   | 较大  |

## 🎓 进阶技巧

### 1. 加速国内安装

编辑 `pip.ini` 配置文件（`C:\Users\用户名\AppData\Roaming\pip\pip.ini`）：

```ini
[global]
index-url = https://pypi.tuna.tsinghua.edu.cn/simple
trusted-host = pypi.tuna.tsinghua.edu.cn
```

### 2. 环境克隆

```powershell
# 导出现有环境
D:\Python\envs\源环境\Scripts\activate
pip freeze > requirements.txt

# 创建新环境并安装
.\create_env.ps1 新环境
.\activate_env.ps1 新环境
uv pip install -r requirements.txt
```

### 3. 自动激活环境

在项目目录创建 `activate.ps1`：

```powershell
# 项目专用激活脚本
D:\Python\envs\myproject\Scripts\activate
Write-Host "✅ 环境已激活: myproject" -ForegroundColor Green
```

### 4. 全局工具安装

```powershell
# 不要在虚拟环境中安装全局工具
deactivate

# 使用 Python 主环境
python -m pip install black flake8 pytest
```

## 🔄 重装系统后恢复

### 备份（重装前）

只需备份整个 Python 目录：

```
D:\Python\  （整个目录）
```

### 恢复（重装后）

1. 将 `D:\Python\` 复制回新系统
2. 重新运行 `setup_python_env.ps1`（会检测到已有安装，只配置环境变量）
3. 或手动添加环境变量：
   ```powershell
   $env:Path += ";D:\Python\Python311;D:\Python\Python311\Scripts"
   ```

## 📚 参考资源

- [uv 官方文档](https://github.com/astral-sh/uv)
- [Python 官方文档](https://docs.python.org/zh-cn/3/)
- [PyTorch 安装指南](https://pytorch.org/get-started/locally/)
- [ComfyUI GitHub](https://github.com/comfyanonymous/ComfyUI)

## 🤝 问题反馈

如有问题，请检查：

1. ✅ 是否以管理员身份运行
2. ✅ 网络是否正常
3. ✅ 磁盘空间是否充足（建议至少 10GB）
4. ✅ Windows 版本（建议 Win10/11）

## 📝 更新日志

### v1.0 (2025-11-02)

- ✅ 初始版本发布
- ✅ 支持 Python 3.11.9 自动安装
- ✅ 集成 uv 包管理器
- ✅ 自定义安装路径
- ✅ ComfyUI 快速安装
- ✅ 完整的辅助脚本

---

**祝使用愉快！** 🎉
