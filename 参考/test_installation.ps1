# Python环境测试脚本
# 用于验证安装是否成功

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Message = ""
    )
    
    if ($Success) {
        Write-Host "✅ $TestName" -ForegroundColor Green
        if ($Message) {
            Write-Host "   $Message" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ $TestName" -ForegroundColor Red
        if ($Message) {
            Write-Host "   $Message" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Python环境测试" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. 测试Python
Write-Host "1. 测试Python安装..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-TestResult -TestName "Python安装" -Success $true -Message $pythonVersion
    } else {
        Write-TestResult -TestName "Python安装" -Success $false -Message "无法运行python命令"
    }
} catch {
    Write-TestResult -TestName "Python安装" -Success $false -Message "Python未安装或未添加到PATH"
}

# 2. 测试pip
Write-Host "`n2. 测试pip..." -ForegroundColor Yellow
try {
    $pipVersion = pip --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-TestResult -TestName "pip安装" -Success $true -Message $pipVersion
    } else {
        Write-TestResult -TestName "pip安装" -Success $false
    }
} catch {
    Write-TestResult -TestName "pip安装" -Success $false
}

# 3. 测试uv
Write-Host "`n3. 测试uv..." -ForegroundColor Yellow
try {
    $uvVersion = uv --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-TestResult -TestName "uv安装" -Success $true -Message $uvVersion
    } else {
        Write-TestResult -TestName "uv安装" -Success $false
    }
} catch {
    Write-TestResult -TestName "uv安装" -Success $false -Message "请运行: pip install uv"
}

# 4. 测试环境变量
Write-Host "`n4. 测试环境变量..." -ForegroundColor Yellow

$uvCache = $env:UV_CACHE_DIR
if ($uvCache) {
    Write-TestResult -TestName "UV_CACHE_DIR" -Success $true -Message $uvCache
} else {
    Write-TestResult -TestName "UV_CACHE_DIR" -Success $false -Message "未设置"
}

$pipCache = $env:PIP_CACHE_DIR
if ($pipCache) {
    Write-TestResult -TestName "PIP_CACHE_DIR" -Success $true -Message $pipCache
} else {
    Write-TestResult -TestName "PIP_CACHE_DIR" -Success $false -Message "未设置"
}

$venvBase = $env:VIRTUAL_ENV_BASE
if ($venvBase) {
    Write-TestResult -TestName "VIRTUAL_ENV_BASE" -Success $true -Message $venvBase
} else {
    Write-TestResult -TestName "VIRTUAL_ENV_BASE" -Success $false -Message "未设置"
}

# 5. 测试Python功能
Write-Host "`n5. 测试Python基本功能..." -ForegroundColor Yellow
try {
    $testScript = @"
import sys
import platform
print(f'Python版本: {sys.version}')
print(f'平台: {platform.platform()}')
print(f'架构: {platform.machine()}')
"@
    
    $result = python -c $testScript 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-TestResult -TestName "Python运行" -Success $true
        Write-Host $result -ForegroundColor Gray
    } else {
        Write-TestResult -TestName "Python运行" -Success $false
    }
} catch {
    Write-TestResult -TestName "Python运行" -Success $false
}

# 6. 测试目录结构
Write-Host "`n6. 测试目录结构..." -ForegroundColor Yellow

# 尝试从环境变量获取基础路径
$basePath = $null
if ($env:VIRTUAL_ENV_BASE) {
    $basePath = Split-Path $env:VIRTUAL_ENV_BASE -Parent
}

if ($basePath -and (Test-Path $basePath)) {
    $directories = @{
        "基础目录" = $basePath
        "虚拟环境目录" = $env:VIRTUAL_ENV_BASE
        "UV缓存目录" = $env:UV_CACHE_DIR
        "PIP缓存目录" = $env:PIP_CACHE_DIR
        "脚本目录" = Join-Path $basePath "scripts"
    }
    
    foreach ($key in $directories.Keys) {
        $path = $directories[$key]
        if ($path -and (Test-Path $path)) {
            Write-TestResult -TestName $key -Success $true -Message $path
        } else {
            Write-TestResult -TestName $key -Success $false -Message "目录不存在: $path"
        }
    }
} else {
    Write-Host "   ⚠️  无法确定安装路径" -ForegroundColor Yellow
}

# 7. 测试网络连接（PyPI）
Write-Host "`n7. 测试网络连接..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://pypi.org" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-TestResult -TestName "PyPI连接" -Success $true -Message "可以正常访问PyPI"
    } else {
        Write-TestResult -TestName "PyPI连接" -Success $false
    }
} catch {
    Write-TestResult -TestName "PyPI连接" -Success $false -Message "无法访问PyPI，可能需要配置代理"
}

# 8. 性能测试（可选）
Write-Host "`n8. 快速性能测试..." -ForegroundColor Yellow
$performTest = Read-Host "是否执行uv安装速度测试？（会安装requests包）(y/n)"

if ($performTest -eq "y") {
    Write-Host "`n测试 uv 安装速度..." -ForegroundColor Cyan
    
    # 创建临时测试环境
    $testEnv = Join-Path $env:TEMP "uv_test_env"
    
    Write-Host "创建临时测试环境..." -ForegroundColor Gray
    uv venv $testEnv --quiet
    
    if (Test-Path $testEnv) {
        # 激活环境
        $activateScript = Join-Path $testEnv "Scripts\Activate.ps1"
        & $activateScript
        
        # 测试uv速度
        Write-Host "使用uv安装requests..." -ForegroundColor Gray
        $uvStart = Get-Date
        uv pip install requests --quiet
        $uvEnd = Get-Date
        $uvTime = ($uvEnd - $uvStart).TotalSeconds
        
        # 卸载
        uv pip uninstall requests -y --quiet
        
        # 测试pip速度
        Write-Host "使用pip安装requests..." -ForegroundColor Gray
        $pipStart = Get-Date
        pip install requests --quiet
        $pipEnd = Get-Date
        $pipTime = ($pipEnd - $pipStart).TotalSeconds
        
        # 显示结果
        Write-Host "`n性能对比:" -ForegroundColor Cyan
        Write-Host "  uv:  $([math]::Round($uvTime, 2)) 秒" -ForegroundColor Green
        Write-Host "  pip: $([math]::Round($pipTime, 2)) 秒" -ForegroundColor Yellow
        
        $speedup = [math]::Round($pipTime / $uvTime, 1)
        Write-Host "`n  uv 比 pip 快 ${speedup}x" -ForegroundColor Green
        
        # 清理
        deactivate
        Remove-Item $testEnv -Recurse -Force -ErrorAction SilentlyContinue
        
        Write-TestResult -TestName "性能测试" -Success $true -Message "uv 比 pip 快 ${speedup} 倍"
    } else {
        Write-TestResult -TestName "性能测试" -Success $false -Message "无法创建测试环境"
    }
}

# 总结
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  测试完成" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "💡 下一步操作:" -ForegroundColor Yellow
Write-Host "   1. 如果所有测试通过，可以开始使用" -ForegroundColor White
Write-Host "   2. 进入脚本目录查看辅助脚本:" -ForegroundColor White
if ($basePath) {
    Write-Host "      cd `"$basePath\scripts`"" -ForegroundColor Cyan
}
Write-Host "   3. 创建第一个虚拟环境:" -ForegroundColor White
Write-Host "      .\create_env.ps1 myproject" -ForegroundColor Cyan
Write-Host "   4. 安装ComfyUI环境:" -ForegroundColor White
Write-Host "      .\setup_comfyui.ps1" -ForegroundColor Cyan

Write-Host ""

