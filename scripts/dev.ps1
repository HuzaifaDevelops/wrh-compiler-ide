<#
.SYNOPSIS
  Windows PowerShell Development Runner for WRH Compiler App
.DESCRIPTION
  Launches both Django backend and Next.js frontend concurrently.
#>

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting WRH Compiler Development Environment (Windows) " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check Python Venv
$VenvPython = Join-Path $BackendDir "venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    Write-Warning "backend/venv not found. Running with global python."
    $VenvPython = "python"
}

# Start Backend Server in Background Process
Write-Host "[1/2] Starting Django backend at http://127.0.0.1:8000..." -ForegroundColor Green
$BackendProcess = Start-Process -FilePath $VenvPython `
    -ArgumentList "manage.py runserver 127.0.0.1:8000" `
    -WorkingDirectory $BackendDir `
    -PassThru

# Start Frontend in Foreground
try {
    if (Test-Path $FrontendDir) {
        Write-Host "[2/2] Starting Next.js frontend at http://localhost:3000..." -ForegroundColor Blue
        Set-Location $FrontendDir
        npm run dev
    } else {
        Write-Host "[2/2] Frontend directory not yet found. Running backend only..." -ForegroundColor Yellow
        Wait-Process -Id $BackendProcess.Id
    }
}
finally {
    Write-Host "`nStopping backend process (PID: $($BackendProcess.Id))..." -ForegroundColor Yellow
    if ($BackendProcess -and -not $BackendProcess.HasExited) {
        Stop-Process -Id $BackendProcess.Id -Force
    }
    Set-Location $RootDir
}
