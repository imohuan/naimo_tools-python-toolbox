#Requires -RunAsAdministrator

<#
.SYNOPSIS
    Python环境卸载脚本
    
.DESCRIPTION
    清理安装的Python、uv及所有环境变量
    
.NOTES
    此脚本会删除所有Python环境和缓存，请谨慎使用！
#>

# 设置控制台编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

function Write-ColorText {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

# 显示警告
Clear-Host
Write-Host @"
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     ⚠️  Python环境卸载脚本                               ║
║                                                          ║
║     此操作将删除：                                       ║
║     - Python程序                                         ║
║     - 所有虚拟环境                                       ║
║     - 所有缓存文件                                       ║
║     - 相关环境变量                                       ║
║                                                          ║
║     ⚠️  此操作不可逆！请确认后再继续！                   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Red

Write-Host ""

# 检查管理员权限
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ 请以管理员身份运行此脚本！" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

# 获取配置信息
$configPaths = @()

# 从环境变量获取路径
if ($env:VIRTUAL_ENV_BASE) {
    $basePath = Split-Path $env:VIRTUAL_ENV_BASE -Parent
    $configPaths += $basePath
}

# 询问路径
Write-Host "请输入Python安装的基础路径" -ForegroundColor Yellow
if ($configPaths.Count -gt 0) {
    Write-Host "检测到可能的路径: $($configPaths[0])" -ForegroundColor Gray
    $useDetected = Read-Host "是否使用此路径？(y/n)"
    if ($useDetected -eq "y") {
        $basePath = $configPaths[0]
    } else {
        $basePath = Read-Host "请输入完整路径（例如: D:\Python）"
    }
} else {
    $basePath = Read-Host "请输入完整路径（例如: D:\Python）"
}

if (-not $basePath -or -not (Test-Path $basePath)) {
    Write-Host "❌ 路径不存在或无效: $basePath" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

# 显示将要删除的内容
Write-Host "`n将删除以下目录和文件:" -ForegroundColor Yellow
Write-Host "  📁 $basePath" -ForegroundColor White

$subDirs = Get-ChildItem -Path $basePath -Directory -ErrorAction SilentlyContinue
if ($subDirs) {
    foreach ($dir in $subDirs) {
        Write-Host "     └─ $($dir.Name)\" -ForegroundColor Gray
    }
}

# 计算大小
try {
    $totalSize = (Get-ChildItem -Path $basePath -Recurse -ErrorAction SilentlyContinue | 
                  Measure-Object -Property Length -Sum).Sum / 1GB
    Write-Host "`n  总大小: $([math]::Round($totalSize, 2)) GB" -ForegroundColor Cyan
} catch {
    Write-Host "`n  无法计算总大小" -ForegroundColor Gray
}

# 最终确认
Write-Host "`n⚠️  最终确认" -ForegroundColor Red
Write-Host "输入 'DELETE' 确认删除（区分大小写）: " -ForegroundColor Yellow -NoNewline
$confirmation = Read-Host

if ($confirmation -ne "DELETE") {
    Write-Host "`n已取消卸载" -ForegroundColor Green
    Read-Host "按回车键退出"
    exit 0
}

Write-Host "`n开始卸载..." -ForegroundColor Yellow

# 1. 停止可能运行的Python进程
Write-Host "`n1. 检查运行中的Python进程..." -ForegroundColor Cyan
$pythonProcesses = Get-Process -Name python* -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    Write-Host "   发现 $($pythonProcesses.Count) 个Python进程" -ForegroundColor Yellow
    $killProcesses = Read-Host "   是否关闭这些进程？(y/n)"
    if ($killProcesses -eq "y") {
        $pythonProcesses | Stop-Process -Force
        Write-Host "   ✅ 已关闭Python进程" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
}

# 2. 清理环境变量
Write-Host "`n2. 清理环境变量..." -ForegroundColor Cyan

# 清理PATH
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$originalPath = $userPath

# 移除Python相关路径
$pathsToRemove = @(
    "$basePath\Python311",
    "$basePath\Python311\Scripts",
    "$basePath\scripts"
)

foreach ($pathToRemove in $pathsToRemove) {
    if ($userPath -like "*$pathToRemove*") {
        $userPath = $userPath -replace [regex]::Escape("$pathToRemove;"), ""
        $userPath = $userPath -replace [regex]::Escape(";$pathToRemove"), ""
        $userPath = $userPath -replace [regex]::Escape("$pathToRemove"), ""
        Write-Host "   移除PATH: $pathToRemove" -ForegroundColor Gray
    }
}

if ($userPath -ne $originalPath) {
    [Environment]::SetEnvironmentVariable("Path", $userPath, "User")
    Write-Host "   ✅ PATH已更新" -ForegroundColor Green
}

# 删除自定义环境变量
$envVarsToRemove = @("UV_CACHE_DIR", "PIP_CACHE_DIR", "VIRTUAL_ENV_BASE")
foreach ($envVar in $envVarsToRemove) {
    $value = [Environment]::GetEnvironmentVariable($envVar, "User")
    if ($value) {
        [Environment]::SetEnvironmentVariable($envVar, $null, "User")
        Write-Host "   删除: $envVar = $value" -ForegroundColor Gray
    }
}

Write-Host "   ✅ 环境变量清理完成" -ForegroundColor Green

# 3. 删除文件和目录
Write-Host "`n3. 删除文件..." -ForegroundColor Cyan
Write-Host "   这可能需要几分钟，请耐心等待..." -ForegroundColor Yellow

try {
    # 先尝试删除子目录（逐个删除，显示进度）
    $subDirs = Get-ChildItem -Path $basePath -Directory -ErrorAction SilentlyContinue
    $totalDirs = $subDirs.Count
    $currentDir = 0
    
    foreach ($dir in $subDirs) {
        $currentDir++
        $percent = [math]::Round(($currentDir / $totalDirs) * 100)
        Write-Progress -Activity "删除目录" -Status "$($dir.Name)" -PercentComplete $percent
        
        try {
            Remove-Item $dir.FullName -Recurse -Force -ErrorAction Stop
            Write-Host "   ✅ 已删除: $($dir.Name)" -ForegroundColor Gray
        } catch {
            Write-Host "   ⚠️  删除失败: $($dir.Name) - $_" -ForegroundColor Yellow
        }
    }
    
    Write-Progress -Activity "删除目录" -Completed
    
    # 删除基础目录
    Remove-Item $basePath -Recurse -Force -ErrorAction Stop
    Write-Host "   ✅ 已删除基础目录" -ForegroundColor Green
    
} catch {
    Write-Host "   ⚠️  部分文件删除失败: $_" -ForegroundColor Yellow
    Write-Host "   可能原因：文件被占用或权限不足" -ForegroundColor Gray
    Write-Host "   建议：重启后再次运行此脚本" -ForegroundColor Gray
}

# 4. 清理注册表（可选）
Write-Host "`n4. 清理注册表..." -ForegroundColor Cyan
$cleanRegistry = Read-Host "   是否清理Python注册表项？(y/n)"

if ($cleanRegistry -eq "y") {
    try {
        # 清理用户Python注册表
        $pythonRegPath = "HKCU:\Software\Python"
        if (Test-Path $pythonRegPath) {
            Remove-Item $pythonRegPath -Recurse -Force -ErrorAction Stop
            Write-Host "   ✅ 已清理用户注册表" -ForegroundColor Green
        }
        
        # 注意：不删除HKLM（系统级）注册表，避免影响其他Python安装
        Write-Host "   ✅ 注册表清理完成" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  注册表清理失败: $_" -ForegroundColor Yellow
    }
}

# 5. 清理pip/uv配置文件
Write-Host "`n5. 清理配置文件..." -ForegroundColor Cyan

$configFiles = @(
    "$env:APPDATA\pip\pip.ini",
    "$env:USERPROFILE\.uvrc"
)

foreach ($configFile in $configFiles) {
    if (Test-Path $configFile) {
        Remove-Item $configFile -Force -ErrorAction SilentlyContinue
        Write-Host "   删除: $configFile" -ForegroundColor Gray
    }
}

Write-Host "   ✅ 配置文件清理完成" -ForegroundColor Green

# 完成
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✅ 卸载完成" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "已完成以下操作:" -ForegroundColor Yellow
Write-Host "  ✅ 删除Python程序和所有环境" -ForegroundColor White
Write-Host "  ✅ 清理环境变量" -ForegroundColor White
Write-Host "  ✅ 清理配置文件" -ForegroundColor White

Write-Host "`n⚠️  重要提示:" -ForegroundColor Yellow
Write-Host "  1. 请重启计算机以确保所有更改生效" -ForegroundColor White
Write-Host "  2. 如果有文件删除失败，重启后可再次运行此脚本" -ForegroundColor White
Write-Host "  3. 如需重新安装，运行 setup_python_env.ps1" -ForegroundColor White

Write-Host ""
Read-Host "按回车键退出"

