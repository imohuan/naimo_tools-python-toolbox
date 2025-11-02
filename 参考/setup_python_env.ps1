#Requires -RunAsAdministrator

<#
.SYNOPSIS
    Python + uv 环境一键安装配置脚本
    
.DESCRIPTION
    自动安装Python、uv，并配置所有路径到指定磁盘
    适用于系统盘空间不足的情况
    
.AUTHOR
    为软件备份目录定制
    
.DATE
    2025-11-02
#>

# 设置控制台编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# 颜色输出函数
function Write-ColorText {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Write-Title {
    param([string]$Text)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor Red
}

function Write-Info {
    param([string]$Text)
    Write-Host "ℹ️  $Text" -ForegroundColor Yellow
}

# 检查管理员权限
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 获取磁盘信息
function Get-DiskInfo {
    Write-Title "磁盘空间信息"
    
    Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Used -ne $null } | ForEach-Object {
        $free = [math]::Round($_.Free / 1GB, 2)
        $used = [math]::Round($_.Used / 1GB, 2)
        $total = $free + $used
        $freePercent = [math]::Round(($free / $total) * 100, 1)
        
        $color = if ($freePercent -lt 10) { "Red" } elseif ($freePercent -lt 30) { "Yellow" } else { "Green" }
        
        Write-Host "  $($_.Name):\ - " -NoNewline
        Write-Host "可用: $free GB / 总计: $total GB " -NoNewline -ForegroundColor $color
        Write-Host "($freePercent%)"
    }
    Write-Host ""
}

# 下载文件（带进度条）
function Download-File {
    param(
        [string]$Url,
        [string]$OutputPath
    )
    
    try {
        $webClient = New-Object System.Net.WebClient
        
        # 注册进度事件
        $progressEventHandler = {
            param($sender, $e)
            $percent = [math]::Round($e.ProgressPercentage, 0)
            Write-Progress -Activity "下载中..." -Status "$percent% 完成" -PercentComplete $percent
        }
        
        Register-ObjectEvent -InputObject $webClient -EventName DownloadProgressChanged -SourceIdentifier WebClient.DownloadProgressChanged -Action $progressEventHandler | Out-Null
        
        $webClient.DownloadFileAsync($Url, $OutputPath)
        
        # 等待下载完成
        while ($webClient.IsBusy) {
            Start-Sleep -Milliseconds 100
        }
        
        Write-Progress -Activity "下载中..." -Completed
        Unregister-Event -SourceIdentifier WebClient.DownloadProgressChanged -ErrorAction SilentlyContinue
        
        $webClient.Dispose()
        return $true
    }
    catch {
        Write-Error "下载失败: $_"
        return $false
    }
}

# 检测系统架构
function Get-SystemArchitecture {
    if ([Environment]::Is64BitOperatingSystem) {
        return "64"
    } else {
        return "32"
    }
}

# 安装Python
function Install-Python {
    param(
        [string]$InstallPath,
        [string]$TempPath
    )
    
    Write-Title "安装 Python"
    
    $arch = Get-SystemArchitecture
    $pythonVersion = "3.11.9"  # 稳定版本
    
    if ($arch -eq "64") {
        $downloadUrl = "https://www.python.org/ftp/python/$pythonVersion/python-$pythonVersion-amd64.exe"
    } else {
        $downloadUrl = "https://www.python.org/ftp/python/$pythonVersion/python-$pythonVersion.exe"
    }
    
    $installerPath = Join-Path $TempPath "python_installer.exe"
    
    Write-Info "Python版本: $pythonVersion ($arch 位)"
    Write-Info "下载地址: $downloadUrl"
    Write-Info "安装路径: $InstallPath"
    
    # 检查是否已安装
    if (Test-Path $InstallPath) {
        $answer = Read-Host "`n⚠️  检测到目录已存在，是否覆盖安装？(y/n)"
        if ($answer -ne "y") {
            Write-Info "跳过Python安装"
            return $true
        }
    }
    
    Write-Host "`n开始下载Python安装程序..." -ForegroundColor Yellow
    
    if (-not (Download-File -Url $downloadUrl -OutputPath $installerPath)) {
        Write-Error "Python下载失败"
        return $false
    }
    
    Write-Success "下载完成"
    Write-Host "`n开始安装Python..." -ForegroundColor Yellow
    Write-Info "这可能需要几分钟，请耐心等待..."
    
    # 静默安装Python
    $installArgs = @(
        "/quiet",
        "InstallAllUsers=1",
        "PrependPath=1",
        "Include_test=0",
        "Include_tcltk=0",
        "Include_doc=0",
        "Include_launcher=1",
        "InstallLauncherAllUsers=1",
        "TargetDir=$InstallPath"
    )
    
    $process = Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -PassThru
    
    if ($process.ExitCode -eq 0) {
        Write-Success "Python 安装完成"
        
        # 清理安装程序
        Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
        
        return $true
    } else {
        Write-Error "Python 安装失败，错误代码: $($process.ExitCode)"
        return $false
    }
}

# 配置环境变量
function Set-EnvironmentPaths {
    param(
        [string]$PythonPath,
        [string]$UvCachePath,
        [string]$PipCachePath,
        [string]$VenvBasePath
    )
    
    Write-Title "配置环境变量"
    
    # Python路径
    $pythonExePath = $PythonPath
    $pythonScriptsPath = Join-Path $PythonPath "Scripts"
    
    # 获取当前用户PATH
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    
    # 添加Python路径（如果不存在）
    $pathsToAdd = @($pythonExePath, $pythonScriptsPath)
    $pathModified = $false
    
    foreach ($path in $pathsToAdd) {
        if ($currentPath -notlike "*$path*") {
            $currentPath = "$path;$currentPath"
            $pathModified = $true
            Write-Info "添加到PATH: $path"
        }
    }
    
    if ($pathModified) {
        [Environment]::SetEnvironmentVariable("Path", $currentPath, "User")
        Write-Success "PATH 更新完成"
    } else {
        Write-Info "PATH 已包含Python路径"
    }
    
    # 设置缓存路径
    [Environment]::SetEnvironmentVariable("UV_CACHE_DIR", $UvCachePath, "User")
    Write-Success "UV_CACHE_DIR = $UvCachePath"
    
    [Environment]::SetEnvironmentVariable("PIP_CACHE_DIR", $PipCachePath, "User")
    Write-Success "PIP_CACHE_DIR = $PipCachePath"
    
    [Environment]::SetEnvironmentVariable("VIRTUAL_ENV_BASE", $VenvBasePath, "User")
    Write-Success "VIRTUAL_ENV_BASE = $VenvBasePath"
    
    # 刷新当前会话的环境变量
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "User") + ";" + [Environment]::GetEnvironmentVariable("Path", "Machine")
    $env:UV_CACHE_DIR = $UvCachePath
    $env:PIP_CACHE_DIR = $PipCachePath
    $env:VIRTUAL_ENV_BASE = $VenvBasePath
    
    Write-Success "环境变量配置完成"
}

# 安装uv
function Install-Uv {
    param([string]$PythonPath)
    
    Write-Title "安装 uv"
    
    $pythonExe = Join-Path $PythonPath "python.exe"
    
    if (-not (Test-Path $pythonExe)) {
        Write-Error "找不到Python可执行文件: $pythonExe"
        return $false
    }
    
    Write-Info "升级pip..."
    & $pythonExe -m pip install --upgrade pip --quiet
    
    Write-Host "`n安装uv..." -ForegroundColor Yellow
    & $pythonExe -m pip install uv
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "uv 安装完成"
        
        # 验证安装
        $uvExe = Join-Path $PythonPath "Scripts\uv.exe"
        if (Test-Path $uvExe) {
            $uvVersion = & $uvExe --version
            Write-Success "uv 版本: $uvVersion"
            return $true
        }
    }
    
    Write-Error "uv 安装失败"
    return $false
}

# 创建目录结构
function Initialize-DirectoryStructure {
    param([hashtable]$Paths)
    
    Write-Title "创建目录结构"
    
    foreach ($key in $Paths.Keys) {
        $path = $Paths[$key]
        if (-not (Test-Path $path)) {
            New-Item -ItemType Directory -Path $path -Force | Out-Null
            Write-Success "创建: $path"
        } else {
            Write-Info "已存在: $path"
        }
    }
}

# 创建快捷脚本
function Create-HelperScripts {
    param(
        [string]$ScriptPath,
        [string]$VenvBasePath,
        [string]$PythonPath
    )
    
    Write-Title "创建辅助脚本"
    
    # 创建虚拟环境脚本
    $createEnvScript = @"
# 创建虚拟环境快捷脚本
# 用法: .\create_env.ps1 环境名称

param(
    [Parameter(Mandatory=`$true)]
    [string]`$EnvName
)

`$venvPath = Join-Path "$VenvBasePath" `$EnvName

Write-Host "创建虚拟环境: `$EnvName" -ForegroundColor Cyan
Write-Host "位置: `$venvPath" -ForegroundColor Yellow

# 使用uv创建环境
uv venv `$venvPath

if (`$LASTEXITCODE -eq 0) {
    Write-Host "`n✅ 环境创建成功！" -ForegroundColor Green
    Write-Host "`n激活命令:" -ForegroundColor Cyan
    Write-Host "  `$venvPath\Scripts\activate" -ForegroundColor Yellow
    Write-Host "`n或使用:" -ForegroundColor Cyan
    Write-Host "  .\activate_env.ps1 `$EnvName" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ 环境创建失败" -ForegroundColor Red
}
"@
    
    $createEnvScriptPath = Join-Path $ScriptPath "create_env.ps1"
    Set-Content -Path $createEnvScriptPath -Value $createEnvScript -Encoding UTF8
    Write-Success "创建: create_env.ps1"
    
    # 激活环境脚本
    $activateEnvScript = @"
# 激活虚拟环境快捷脚本
# 用法: .\activate_env.ps1 环境名称

param(
    [Parameter(Mandatory=`$true)]
    [string]`$EnvName
)

`$venvPath = Join-Path "$VenvBasePath" `$EnvName
`$activateScript = Join-Path `$venvPath "Scripts\Activate.ps1"

if (Test-Path `$activateScript) {
    Write-Host "激活环境: `$EnvName" -ForegroundColor Green
    & `$activateScript
} else {
    Write-Host "❌ 找不到环境: `$EnvName" -ForegroundColor Red
    Write-Host "`n可用环境:" -ForegroundColor Yellow
    Get-ChildItem "$VenvBasePath" -Directory | ForEach-Object {
        Write-Host "  - `$(`$_.Name)" -ForegroundColor Cyan
    }
}
"@
    
    $activateEnvScriptPath = Join-Path $ScriptPath "activate_env.ps1"
    Set-Content -Path $activateEnvScriptPath -Value $activateEnvScript -Encoding UTF8
    Write-Success "创建: activate_env.ps1"
    
    # 列出环境脚本
    $listEnvScript = @"
# 列出所有虚拟环境

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  已创建的虚拟环境" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

`$envs = Get-ChildItem "$VenvBasePath" -Directory -ErrorAction SilentlyContinue

if (`$envs.Count -eq 0) {
    Write-Host "  暂无虚拟环境" -ForegroundColor Yellow
    Write-Host "`n创建环境命令:" -ForegroundColor Cyan
    Write-Host "  .\create_env.ps1 环境名称" -ForegroundColor White
} else {
    foreach (`$env in `$envs) {
        `$pythonExe = Join-Path `$env.FullName "Scripts\python.exe"
        if (Test-Path `$pythonExe) {
            `$version = & `$pythonExe --version 2>&1
            Write-Host "  📦 `$(`$env.Name)" -ForegroundColor Green -NoNewline
            Write-Host " - `$version" -ForegroundColor Gray
            Write-Host "     路径: `$(`$env.FullName)" -ForegroundColor DarkGray
        }
    }
    
    Write-Host "`n激活环境命令:" -ForegroundColor Cyan
    Write-Host "  .\activate_env.ps1 环境名称" -ForegroundColor White
}

Write-Host ""
"@
    
    $listEnvScriptPath = Join-Path $ScriptPath "list_envs.ps1"
    Set-Content -Path $listEnvScriptPath -Value $listEnvScript -Encoding UTF8
    Write-Success "创建: list_envs.ps1"
    
    # ComfyUI环境快速安装脚本
    $comfyuiScript = @"
# ComfyUI 环境快速安装脚本

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ComfyUI 环境安装" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 检测CUDA
Write-Host "检测NVIDIA显卡..." -ForegroundColor Yellow
try {
    `$nvidiaInfo = nvidia-smi --query-gpu=name,driver_version,cuda_version --format=csv,noheader 2>`$null
    if (`$nvidiaInfo) {
        Write-Host "✅ 检测到NVIDIA显卡" -ForegroundColor Green
        Write-Host "`$nvidiaInfo`n" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  未检测到NVIDIA显卡，将安装CPU版本" -ForegroundColor Yellow
}

Write-Host "请选择CUDA版本:" -ForegroundColor Cyan
Write-Host "  1. CUDA 12.1 (最新，推荐RTX 40系列)" -ForegroundColor White
Write-Host "  2. CUDA 11.8 (兼容性好，推荐RTX 30系列)" -ForegroundColor White
Write-Host "  3. CPU 版本 (无显卡或用于测试)" -ForegroundColor White

`$choice = Read-Host "`n请输入选项 (1/2/3)"

switch (`$choice) {
    "1" { `$indexUrl = "https://download.pytorch.org/whl/cu121"; `$cudaVer = "CUDA 12.1" }
    "2" { `$indexUrl = "https://download.pytorch.org/whl/cu118"; `$cudaVer = "CUDA 11.8" }
    "3" { `$indexUrl = "https://download.pytorch.org/whl/cpu"; `$cudaVer = "CPU" }
    default { `$indexUrl = "https://download.pytorch.org/whl/cu121"; `$cudaVer = "CUDA 12.1" }
}

Write-Host "`n选择版本: `$cudaVer" -ForegroundColor Green

# 创建环境
`$envName = "comfyui"
`$venvPath = Join-Path "$VenvBasePath" `$envName

Write-Host "`n创建虚拟环境..." -ForegroundColor Yellow
uv venv `$venvPath

if (`$LASTEXITCODE -ne 0) {
    Write-Host "❌ 环境创建失败" -ForegroundColor Red
    exit 1
}

# 激活环境
`$activateScript = Join-Path `$venvPath "Scripts\Activate.ps1"
& `$activateScript

Write-Host "`n安装PyTorch..." -ForegroundColor Yellow
uv pip install torch torchvision torchaudio --index-url `$indexUrl

Write-Host "`n安装ComfyUI常用依赖..." -ForegroundColor Yellow
uv pip install pillow opencv-python numpy safetensors transformers accelerate scipy tqdm psutil

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✅ ComfyUI 环境安装完成！" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "激活命令:" -ForegroundColor Cyan
Write-Host "  `$venvPath\Scripts\activate`n" -ForegroundColor Yellow

Write-Host "验证安装:" -ForegroundColor Cyan
python -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA可用: {torch.cuda.is_available()}')"

Write-Host "`n在ComfyUI目录中运行:" -ForegroundColor Cyan
Write-Host "  uv pip install -r requirements.txt" -ForegroundColor Yellow
"@
    
    $comfyuiScriptPath = Join-Path $ScriptPath "setup_comfyui.ps1"
    Set-Content -Path $comfyuiScriptPath -Value $comfyuiScript -Encoding UTF8
    Write-Success "创建: setup_comfyui.ps1"
}

# 生成使用说明
function Show-UsageGuide {
    param([hashtable]$Config)
    
    Write-Title "安装完成！"
    
    Write-Host "📦 Python 安装位置:" -ForegroundColor Cyan
    Write-Host "   $($Config.PythonPath)" -ForegroundColor White
    
    Write-Host "`n💾 缓存和环境位置:" -ForegroundColor Cyan
    Write-Host "   UV缓存:   $($Config.UvCachePath)" -ForegroundColor White
    Write-Host "   PIP缓存:  $($Config.PipCachePath)" -ForegroundColor White
    Write-Host "   虚拟环境: $($Config.VenvBasePath)" -ForegroundColor White
    
    Write-Host "`n📜 辅助脚本位置:" -ForegroundColor Cyan
    Write-Host "   $($Config.ScriptPath)" -ForegroundColor White
    
    Write-Host "`n" -NoNewline
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  快速开始指南" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
    Write-Host "`n1️⃣  创建虚拟环境:" -ForegroundColor Yellow
    Write-Host "   cd `"$($Config.ScriptPath)`"" -ForegroundColor White
    Write-Host "   .\create_env.ps1 myproject" -ForegroundColor White
    
    Write-Host "`n2️⃣  激活环境:" -ForegroundColor Yellow
    Write-Host "   .\activate_env.ps1 myproject" -ForegroundColor White
    
    Write-Host "`n3️⃣  安装依赖:" -ForegroundColor Yellow
    Write-Host "   uv pip install numpy pandas" -ForegroundColor White
    
    Write-Host "`n4️⃣  列出所有环境:" -ForegroundColor Yellow
    Write-Host "   .\list_envs.ps1" -ForegroundColor White
    
    Write-Host "`n5️⃣  安装ComfyUI环境:" -ForegroundColor Yellow
    Write-Host "   .\setup_comfyui.ps1" -ForegroundColor White
    
    Write-Host "`n" -NoNewline
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  常用命令" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
    Write-Host "`n📝 uv命令（比pip快10-100倍）:" -ForegroundColor Cyan
    Write-Host "   uv pip install 包名          # 安装包" -ForegroundColor White
    Write-Host "   uv pip install -r requirements.txt  # 安装依赖列表" -ForegroundColor White
    Write-Host "   uv pip uninstall 包名        # 卸载包" -ForegroundColor White
    Write-Host "   uv pip list                  # 列出已安装包" -ForegroundColor White
    Write-Host "   uv pip freeze > requirements.txt    # 导出依赖" -ForegroundColor White
    
    Write-Host "`n🔍 查看版本:" -ForegroundColor Cyan
    Write-Host "   python --version" -ForegroundColor White
    Write-Host "   uv --version" -ForegroundColor White
    
    Write-Host "`n⚙️  环境变量（已自动配置）:" -ForegroundColor Cyan
    Write-Host "   UV_CACHE_DIR     = $($Config.UvCachePath)" -ForegroundColor Gray
    Write-Host "   PIP_CACHE_DIR    = $($Config.PipCachePath)" -ForegroundColor Gray
    Write-Host "   VIRTUAL_ENV_BASE = $($Config.VenvBasePath)" -ForegroundColor Gray
    
    Write-Host "`n💡 提示:" -ForegroundColor Yellow
    Write-Host "   - 所有缓存和环境都保存在 $($Config.BasePath)" -ForegroundColor White
    Write-Host "   - 重装系统前备份该目录即可保留所有环境" -ForegroundColor White
    Write-Host "   - uv命令完全兼容pip，但速度快得多" -ForegroundColor White
    
    Write-Host ""
}

# 主程序
function Main {
    # 显示标题
    Clear-Host
    Write-Host @"
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     Python + uv 环境一键安装脚本                         ║
║                                                          ║
║     自动配置所有路径到机械硬盘                           ║
║     解决系统盘空间不足问题                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan
    
    # 检查管理员权限
    if (-not (Test-Administrator)) {
        Write-Error "请以管理员身份运行此脚本！"
        Write-Host "右键点击脚本，选择'以管理员身份运行'" -ForegroundColor Yellow
        Read-Host "`n按回车键退出"
        exit 1
    }
    
    # 显示磁盘信息
    Get-DiskInfo
    
    # 询问安装路径
    Write-Host "请选择安装位置（推荐选择空间较大的机械硬盘）:" -ForegroundColor Cyan
    Write-Host ""
    
    $drives = Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Used -ne $null -and $_.Free -gt 5GB } | Select-Object -ExpandProperty Name
    for ($i = 0; $i -lt $drives.Count; $i++) {
        $drive = $drives[$i]
        $freeGB = [math]::Round((Get-PSDrive $drive).Free / 1GB, 2)
        Write-Host "  $($i + 1). $drive`:\ (可用: $freeGB GB)" -ForegroundColor White
    }
    
    Write-Host "`n  0. 自定义路径" -ForegroundColor White
    
    $choice = Read-Host "`n请选择 (1-$($drives.Count) 或 0)"
    
    if ($choice -eq "0") {
        $basePath = Read-Host "请输入完整路径（例如: D:\Python）"
    } else {
        $driveIndex = [int]$choice - 1
        if ($driveIndex -ge 0 -and $driveIndex -lt $drives.Count) {
            $basePath = "$($drives[$driveIndex]):\Python"
        } else {
            Write-Error "无效选择，使用默认路径 D:\Python"
            $basePath = "D:\Python"
        }
    }
    
    # 确认路径
    Write-Host "`n将在以下位置创建目录结构:" -ForegroundColor Yellow
    Write-Host "  基础路径: $basePath" -ForegroundColor White
    Write-Host "  ├─ Python311\          (Python程序)" -ForegroundColor Gray
    Write-Host "  ├─ envs\               (虚拟环境)" -ForegroundColor Gray
    Write-Host "  ├─ uv_cache\           (uv缓存)" -ForegroundColor Gray
    Write-Host "  ├─ pip_cache\          (pip缓存)" -ForegroundColor Gray
    Write-Host "  └─ scripts\            (辅助脚本)" -ForegroundColor Gray
    
    $confirm = Read-Host "`n确认继续？(y/n)"
    if ($confirm -ne "y") {
        Write-Info "已取消安装"
        exit 0
    }
    
    # 定义路径配置
    $config = @{
        BasePath      = $basePath
        PythonPath    = Join-Path $basePath "Python311"
        VenvBasePath  = Join-Path $basePath "envs"
        UvCachePath   = Join-Path $basePath "uv_cache"
        PipCachePath  = Join-Path $basePath "pip_cache"
        ScriptPath    = Join-Path $basePath "scripts"
        TempPath      = Join-Path $env:TEMP "python_setup"
    }
    
    # 创建临时目录
    if (-not (Test-Path $config.TempPath)) {
        New-Item -ItemType Directory -Path $config.TempPath -Force | Out-Null
    }
    
    try {
        # 1. 创建目录结构
        Initialize-DirectoryStructure -Paths @{
            "基础路径"     = $config.BasePath
            "虚拟环境"     = $config.VenvBasePath
            "UV缓存"      = $config.UvCachePath
            "PIP缓存"     = $config.PipCachePath
            "辅助脚本"     = $config.ScriptPath
        }
        
        # 2. 安装Python
        if (-not (Install-Python -InstallPath $config.PythonPath -TempPath $config.TempPath)) {
            throw "Python安装失败"
        }
        
        # 3. 配置环境变量
        Set-EnvironmentPaths `
            -PythonPath $config.PythonPath `
            -UvCachePath $config.UvCachePath `
            -PipCachePath $config.PipCachePath `
            -VenvBasePath $config.VenvBasePath
        
        # 4. 安装uv
        if (-not (Install-Uv -PythonPath $config.PythonPath)) {
            throw "uv安装失败"
        }
        
        # 5. 创建辅助脚本
        Create-HelperScripts `
            -ScriptPath $config.ScriptPath `
            -VenvBasePath $config.VenvBasePath `
            -PythonPath $config.PythonPath
        
        # 6. 显示使用说明
        Show-UsageGuide -Config $config
        
        # 保存配置信息
        $configFile = Join-Path $config.ScriptPath "config.json"
        $config | ConvertTo-Json | Set-Content -Path $configFile -Encoding UTF8
        
        Write-Host "`n✅ 所有安装和配置已完成！" -ForegroundColor Green
        Write-Host "`n⚠️  重要提示:" -ForegroundColor Yellow
        Write-Host "   1. 请重新打开PowerShell窗口以使环境变量生效" -ForegroundColor White
        Write-Host "   2. 或者运行: refreshenv（如果安装了chocolatey）" -ForegroundColor White
        Write-Host "   3. 脚本目录: $($config.ScriptPath)" -ForegroundColor White
        
    }
    catch {
        Write-Error "安装过程中出现错误: $_"
        Write-Host "`n错误详情:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host "`n如需帮助，请检查:" -ForegroundColor Yellow
        Write-Host "  1. 是否以管理员身份运行" -ForegroundColor White
        Write-Host "  2. 网络连接是否正常" -ForegroundColor White
        Write-Host "  3. 磁盘空间是否充足" -ForegroundColor White
    }
    finally {
        # 清理临时文件
        if (Test-Path $config.TempPath) {
            Remove-Item $config.TempPath -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    
    Write-Host ""
    Read-Host "按回车键退出"
}

# 运行主程序
Main

