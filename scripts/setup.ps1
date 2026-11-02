<#
.SYNOPSIS
  Automated Environment Setup Script for Windows
.DESCRIPTION
  Creates Python virtual environment, installs backend requirements,
  applies Django migrations, installs root & frontend npm dependencies.
#>

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  WRH Compiler Monorepo Setup (Windows PowerShell)        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Root and Subdirectory .env Provisioning
Write-Host "`n[Step 1/5] Configuring environment files..." -ForegroundColor Green
$RootEnv = Join-Path $RootDir ".env"
$RootEnvExample = Join-Path $RootDir ".env.example"
if (-not (Test-Path $RootEnv) -and (Test-Path $RootEnvExample)) {
    Copy-Item $RootEnvExample $RootEnv
    Write-Host "  Created .env from .env.example"
}

$BackendEnv = Join-Path $BackendDir ".env"
$BackendEnvExample = Join-Path $BackendDir ".env.example"
if (-not (Test-Path $BackendEnv) -and (Test-Path $BackendEnvExample)) {
    Copy-Item $BackendEnvExample $BackendEnv
    Write-Host "  Created backend/.env from backend/.env.example"
}

$FrontendEnv = Join-Path $FrontendDir ".env.local"
$FrontendEnvExample = Join-Path $FrontendDir ".env.example"
if (-not (Test-Path $FrontendEnv) -and (Test-Path $FrontendEnvExample)) {
    Copy-Item $FrontendEnvExample $FrontendEnv
    Write-Host "  Created frontend/.env.local from frontend/.env.example"
}

# 2. Python Virtual Environment Setup
Write-Host "`n[Step 2/5] Setting up Python virtual environment in backend/venv..." -ForegroundColor Green
$VenvDir = Join-Path $BackendDir "venv"
if (-not (Test-Path $VenvDir)) {
    python -m venv $VenvDir
    Write-Host "  Created virtual environment at $VenvDir"
}

$VenvPython = Join-Path $VenvDir "Scripts\python.exe"
$VenvPip = Join-Path $VenvDir "Scripts\pip.exe"

Write-Host "  Upgrading pip..."
& $VenvPython -m pip install --upgrade pip

$ReqFile = Join-Path $BackendDir "requirements.txt"
if (Test-Path $ReqFile) {
    Write-Host "  Installing Python dependencies from requirements.txt..."
    & $VenvPip install -r $ReqFile
}

# 3. Database Migrations
Write-Host "`n[Step 3/5] Applying Django database migrations..." -ForegroundColor Green
Set-Location $BackendDir
& $VenvPython manage.py migrate
Set-Location $RootDir

# 4. Root NPM Dependencies
Write-Host "`n[Step 4/5] Installing root npm dependencies..." -ForegroundColor Green
Set-Location $RootDir
npm install

# 5. Frontend NPM Dependencies
Write-Host "`n[Step 5/5] Installing frontend npm dependencies..." -ForegroundColor Green
if (Test-Path $FrontendDir) {
    Set-Location $FrontendDir
    npm install
    Set-Location $RootDir
} else {
    Write-Host "  Frontend directory not yet found, skipping frontend npm install."
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! Run 'npm run dev' to launch the app.    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
