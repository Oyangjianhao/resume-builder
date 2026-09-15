# ============================================================
# resume-builder 本地开发启动脚本（前后端 + 自动开浏览器）
# 用法：双击 dev.bat 运行
# 说明：仅本地访问，不生成公网网址。
#       后端 http://localhost:8000 （前端代理指向此端口）
#       前端 http://localhost:5173 （自动打开浏览器）
#       关闭本窗口即自动停止前后端。
# ============================================================
$ErrorActionPreference = "Continue"

$projectDir   = "D:\Dev\resume-builder"
$backendPort  = 8000
$frontendPort = 5173

$backendProc  = $null
$frontendProc = $null

# ---- 清理端口占用 ----
function Clear-Port {
    param([int]$Port)
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
        cmd /c "taskkill /F /T /PID $procId 2>nul" | Out-Null
    }
    return $pids.Count
}

function Test-Port {
    param([int]$Port)
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $c.Connect("127.0.0.1", $Port)
        $c.Close()
        return $true
    } catch {
        return $false
    }
}

try {
    # ---- 0. 读取 API Key ----
    $keyFile = "$projectDir\apikey.txt"
    if (Test-Path $keyFile) {
        $apiKey = (Get-Content $keyFile -Raw).Trim()
    } else {
        Write-Host "未找到 $keyFile，请输入 DeepSeek API Key（sk-开头）：" -ForegroundColor Yellow
        $apiKey = Read-Host
        if ($apiKey) {
            Set-Content -Path $keyFile -Value $apiKey -Encoding UTF8
            Write-Host "  已保存到 apikey.txt（请勿外传或上传 GitHub）" -ForegroundColor Gray
        }
    }
    if (-not $apiKey) {
        Write-Host "未提供 API Key，无法启动。" -ForegroundColor Red
        Read-Host "按回车退出"
        throw "缺少 API Key"
    }
    $env:DEEPSEEK_API_KEY = $apiKey

    # ---- 1. 清理端口 ----
    Write-Host ">>> 清理端口 $backendPort / $frontendPort ..." -ForegroundColor Cyan
    $n1 = Clear-Port -Port $backendPort
    $n2 = Clear-Port -Port $frontendPort
    if (($n1 + $n2) -gt 0) { Start-Sleep -Seconds 2 }
    Write-Host "  完成" -ForegroundColor Gray

    # ---- 2. 启动后端（独立窗口，端口 8000，热重载）----
    Write-Host ">>> 启动后端 (端口 $backendPort) ..." -ForegroundColor Cyan
    $pyExe = "$projectDir\backend\venv\Scripts\python.exe"
    if (-not (Test-Path $pyExe)) {
        Write-Host "  找不到 venv Python: $pyExe" -ForegroundColor Red
        Read-Host "按回车退出"
        throw "缺少 venv"
    }
    $backendProc = Start-Process -FilePath "cmd" `
        -ArgumentList "/k", "title 后端 localhost:$backendPort && set DEEPSEEK_API_KEY=$apiKey && `"$pyExe`" -m uvicorn main:app --host 127.0.0.1 --port $backendPort --reload" `
        -WorkingDirectory "$projectDir\backend" `
        -PassThru

    $ready = $false
    for ($i = 0; $i -lt 25; $i++) {
        Start-Sleep -Seconds 1
        try {
            $null = Invoke-WebRequest -Uri "http://localhost:$backendPort/api/health" -UseBasicParsing -TimeoutSec 3
            $ready = $true
            break
        } catch {}
    }
    if (-not $ready) {
        Write-Host "  后端未在 25 秒内就绪，请看后端窗口里的报错。" -ForegroundColor Yellow
    } else {
        Write-Host "  后端已就绪 http://localhost:$backendPort" -ForegroundColor Green
    }

    # ---- 3. 启动前端（独立窗口，Vite dev，端口 5173）----
    Write-Host ">>> 启动前端 (Vite dev) ..." -ForegroundColor Cyan
    if (-not (Test-Path "$projectDir\frontend\node_modules")) {
        Write-Host "  未检测到 node_modules，正在执行 npm install（首次较慢）..." -ForegroundColor Yellow
        Push-Location "$projectDir\frontend"
        npm install
        Pop-Location
    }
    $frontendProc = Start-Process -FilePath "cmd" `
        -ArgumentList "/k", "title 前端 localhost:$frontendPort && npm run dev" `
        -WorkingDirectory "$projectDir\frontend" `
        -PassThru

    $feReady = $false
    for ($i = 0; $i -lt 40; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Port -Port $frontendPort) { $feReady = $true; break }
    }
    if ($feReady) {
        Write-Host "  前端已就绪 http://localhost:$frontendPort" -ForegroundColor Green
    } else {
        Write-Host "  前端端口 $frontendPort 未监听，可能 Vite 改用了其它端口，请看前端窗口。" -ForegroundColor Yellow
    }

    # ---- 4. 自动打开浏览器 ----
    $localUrl = "http://localhost:$frontendPort"
    if ($feReady) {
        Start-Process $localUrl
        Write-Host ">>> 已自动打开浏览器" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  本地访问地址：" -ForegroundColor Green
    Write-Host "  前端  $localUrl" -ForegroundColor Yellow
    Write-Host "  后端  http://localhost:$backendPort" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  提示：前端和后端各自在独立窗口运行，可看实时日志；" -ForegroundColor Gray
    Write-Host "  关闭本窗口即自动停止前后端服务。" -ForegroundColor Gray
    Write-Host ""

    Read-Host "按回车停止服务并退出"
} catch {
    Write-Host ""
    Write-Host "脚本出错: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
} finally {
    Write-Host ""
    Write-Host "正在停止前后端..." -ForegroundColor Yellow
    if ($backendProc  -and !$backendProc.HasExited)  { & taskkill /F /T /PID $backendProc.Id  2>$null | Out-Null }
    if ($frontendProc -and !$frontendProc.HasExited) { & taskkill /F /T /PID $frontendProc.Id 2>$null | Out-Null }
    Clear-Port -Port $backendPort  | Out-Null
    Clear-Port -Port $frontendPort | Out-Null
    Write-Host "  已清理" -ForegroundColor Gray
}
