# ============================================================
# resume-builder 一键分享脚本（Cloudflare Tunnel 版）
# 用法：双击 share.bat 运行
# 说明：使用 Cloudflare 免费快速隧道，无需注册账号，
#       无确认页，单次上传可达 100MB（与后端限制一致）
# ============================================================
$ErrorActionPreference = "Continue"

$backendProc = $null
$cfProc = $null

try {
$projectDir = "D:\Dev\resume-builder"
$port = 8000

# ---- 0. 设置 API Key（从本地文件读取，避免明文写在脚本里）----
$keyFile = "$projectDir\apikey.txt"
if (Test-Path $keyFile) {
    $apiKey = (Get-Content $keyFile -Raw).Trim()
} else {
    Write-Host "未找到 $keyFile，请输入 DeepSeek API Key（sk-开头）：" -ForegroundColor Yellow
    $apiKey = Read-Host
    if ($apiKey) {
        Set-Content -Path $keyFile -Value $apiKey -Encoding UTF8
        Write-Host "  已保存到 apikey.txt（请勿把该文件发给任何人或上传 GitHub）" -ForegroundColor Gray
    }
}
if (-not $apiKey) {
    Write-Host "未提供 API Key，无法启动。按回车退出。" -ForegroundColor Red
    Read-Host "按回车退出"
    throw "缺少 API Key"
}
$env:DEEPSEEK_API_KEY = $apiKey

# ---- 1. 清理端口占用 ----
function Clear-Port {
    param([int]$Port)
    Write-Host ">>> 清理端口 $Port ..." -ForegroundColor Cyan

    $raw = cmd /c "netstat -ano 2>nul" 2>$null
    $pids = @()
    if ($raw) {
        $raw -split "`r`n" | ForEach-Object {
            if ($_ -match ":$Port\s+.*\s+(\d+)\s*$") {
                $p = $matches[1]
                if ($p -ne "0" -and $pids -notcontains $p) { $pids += $p }
            }
        }
    }

    foreach ($procId in $pids) {
        cmd /c "taskkill /F /PID $procId 2>nul" | Out-Null
        Write-Host "  已终止 PID $procId" -ForegroundColor Gray
    }

    if ($pids.Count -gt 0) {
        Start-Sleep -Seconds 2
    }

    $free = $true
    try {
        $check = New-Object System.Net.Sockets.TcpClient
        $check.Connect("127.0.0.1", $Port)
        $check.Close()
        $free = $false
    } catch {
        $free = $true
    }
    if (-not $free) {
        Write-Host "   端口 $Port 仍被占用" -ForegroundColor Yellow
    }
    elseif ($pids.Count -eq 0) {
        Write-Host "  端口空闲" -ForegroundColor Gray
    }
    else {
        Write-Host "  端口已释放" -ForegroundColor Green
    }
}

Clear-Port -Port $port

# ---- 2. 构建前端 ----
Write-Host ">>> 构建前端..." -ForegroundColor Cyan
Push-Location "$projectDir\frontend"
$buildResult = npx vite build 2>&1
Pop-Location
if (-not (Test-Path "$projectDir\frontend\dist\index.html")) {
    Write-Host "前端构建失败！输出：" -ForegroundColor Red
    Write-Host $buildResult
    Read-Host "按回车退出"
    throw "前端构建失败"
}
Write-Host "  前端构建完成" -ForegroundColor Green

# ---- 3. 启动后端 ----
Write-Host ">>> 启动后端..." -ForegroundColor Cyan

$pyExe = "$projectDir\backend\venv\Scripts\python.exe"
if (-not (Test-Path $pyExe)) {
    Write-Host "  找不到 venv Python: $pyExe" -ForegroundColor Red
    Read-Host "按回车退出"
    exit 1
}
$backendProc = Start-Process -FilePath "cmd" `
    -ArgumentList "/c", "set DEEPSEEK_API_KEY=$apiKey && `"$pyExe`" -m uvicorn main:app --host 0.0.0.0 --port $port" `
    -WorkingDirectory "$projectDir\backend" `
    -PassThru

$ready = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:$port/api/health" -UseBasicParsing -TimeoutSec 5
        $ready = $true
        break
    } catch {}
}
if (-not $ready) {
    Write-Host "  后端启动失败！请检查 $projectDir\backend\main.py" -ForegroundColor Red
    & taskkill /F /T /PID $backendProc.Id 2>$null
    Read-Host "按回车退出"
    throw "后端启动失败"
}
Write-Host "  后端已就绪 (PID $($backendProc.Id))" -ForegroundColor Green

# ---- 4. 准备 cloudflared ----
Write-Host ">>> 准备 Cloudflare Tunnel..." -ForegroundColor Cyan

$cfExe = "$projectDir\cloudflared.exe"
# 优先用系统 PATH 里的 cloudflared，其次用项目目录下的
$cfCmd = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($cfCmd) {
    $cfExeToRun = $cfCmd.Source
} elseif (Test-Path $cfExe) {
    $cfExeToRun = $cfExe
} else {
    Write-Host "  首次运行，正在下载 cloudflared（约 60MB，只需一次）..." -ForegroundColor Gray
    $dlUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $dlUrl -OutFile $cfExe -UseBasicParsing
        $cfExeToRun = $cfExe
        Write-Host "  下载完成" -ForegroundColor Green
    } catch {
        Write-Host "  下载失败：$_" -ForegroundColor Red
        Write-Host "  请手动下载 cloudflared-windows-amd64.exe：" -ForegroundColor Yellow
        Write-Host "  $dlUrl" -ForegroundColor Yellow
        Write-Host "  保存为 $cfExe 后重新运行本脚本" -ForegroundColor Yellow
        Read-Host "按回车退出"
        throw "cloudflared 下载失败"
    }
}

# ---- 5. 启动隧道（http2 协议，国内网络下 QUIC 常连不上；失败自动重试）----
Write-Host ">>> 启动公网隧道..." -ForegroundColor Cyan

$cfOut = "$env:TEMP\cf_stdout.txt"
$cfErr = "$env:TEMP\cf_stderr.txt"

$url = $null
$maxAttempts = 3

for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    Remove-Item $cfOut, $cfErr -ErrorAction SilentlyContinue
    if ($attempt -gt 1) {
        Write-Host "  第 $attempt 次尝试建立隧道..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    }

    $cfProc = Start-Process -FilePath $cfExeToRun `
        -ArgumentList "tunnel", "--url", "http://localhost:$port", "--no-autoupdate", "--protocol", "http2", "--edge-ip-version", "4" `
        -RedirectStandardOutput $cfOut `
        -RedirectStandardError $cfErr `
        -WindowStyle Hidden `
        -PassThru

    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 1
        if ($cfProc.HasExited) { break }
        foreach ($f in @($cfErr, $cfOut)) {
            if (Test-Path $f) {
                $content = Get-Content $f -Raw -ErrorAction SilentlyContinue
                if ($content -match '(https://[a-z0-9-]+\.trycloudflare\.com)') {
                    $url = $matches[1]
                    break
                }
            }
        }
        if ($url) { break }
    }

    if ($url) {
        # 拿到网址后再等几秒，确认进程没在握手阶段死掉
        Start-Sleep -Seconds 8
        if ($cfProc.HasExited) {
            Write-Host "  隧道握手失败，进程已退出，准备重试..." -ForegroundColor Yellow
            $url = $null
            continue
        }
        break
    }

    if (-not $cfProc.HasExited) {
        Stop-Process -Id $cfProc.Id -Force -ErrorAction SilentlyContinue
    }
}


if ($url) {
    Set-Clipboard -Value $url

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  公网链接（已复制到剪贴板）：" -ForegroundColor Green
    Write-Host "  $url" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  提示：此链接是随机生成的，每次运行都会变化；" -ForegroundColor Gray
    Write-Host "  关闭本窗口或按 Ctrl+C 即停止分享" -ForegroundColor Gray
    Write-Host ""

    while (-not $cfProc.HasExited) {
        Start-Sleep -Seconds 3
    }
    Write-Host "  隧道已断开" -ForegroundColor Yellow
} else {
    Write-Host "  隧道启动超时或失败，输出日志如下：" -ForegroundColor Yellow
    foreach ($f in @($cfErr, $cfOut)) {
        if (Test-Path $f) {
            Get-Content $f -ErrorAction SilentlyContinue | Select-Object -Last 15 | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
        }
    }
}

Write-Host ""

Read-Host "按回车退出"
} catch {
    Write-Host ""
    Write-Host "脚本出错: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
} finally {
    Write-Host ""
    Write-Host "正在清理后台进程..." -ForegroundColor Yellow
    if ($backendProc -and !$backendProc.HasExited) {
        & taskkill /F /T /PID $backendProc.Id 2>$null
        Write-Host "  后端已停止" -ForegroundColor Gray
    }
    if ($cfProc -and !$cfProc.HasExited) {
        Stop-Process -Id $cfProc.Id -Force -ErrorAction SilentlyContinue
        Write-Host "  隧道已关闭" -ForegroundColor Gray
    }
    Read-Host "按回车退出"
}
