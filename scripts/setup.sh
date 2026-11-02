#!/usr/bin/env bash
# ==============================================================================
# Automated Environment Setup Script for Unix (macOS / Linux / Git Bash)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

echo -e "\033[1;36m==========================================================\033[0m"
echo -e "\033[1;36m  WRH Compiler Monorepo Setup (Unix / macOS / Linux)      \033[0m"
echo -e "\033[1;36m==========================================================\033[0m"

# 1. Environment Files
echo -e "\n\033[1;32m[Step 1/5] Configuring environment files...\033[0m"
[ ! -f "${ROOT_DIR}/.env" ] && [ -f "${ROOT_DIR}/.env.example" ] && cp "${ROOT_DIR}/.env.example" "${ROOT_DIR}/.env" && echo "  Created .env"
[ ! -f "${BACKEND_DIR}/.env" ] && [ -f "${BACKEND_DIR}/.env.example" ] && cp "${BACKEND_DIR}/.env.example" "${BACKEND_DIR}/.env" && echo "  Created backend/.env"
[ ! -f "${FRONTEND_DIR}/.env.local" ] && [ -f "${FRONTEND_DIR}/.env.example" ] && cp "${FRONTEND_DIR}/.env.example" "${FRONTEND_DIR}/.env.local" && echo "  Created frontend/.env.local"

# 2. Python Virtual Environment
echo -e "\n\033[1;32m[Step 2/5] Creating Python virtual environment...\033[0m"
if [ ! -d "${BACKEND_DIR}/venv" ]; then
  python3 -m venv "${BACKEND_DIR}/venv"
  echo "  Created virtual environment at backend/venv"
fi

VENV_PYTHON="${BACKEND_DIR}/venv/bin/python"
VENV_PIP="${BACKEND_DIR}/venv/bin/pip"
if [ ! -f "${VENV_PYTHON}" ] && [ -f "${BACKEND_DIR}/venv/Scripts/python.exe" ]; then
  VENV_PYTHON="${BACKEND_DIR}/venv/Scripts/python.exe"
  VENV_PIP="${BACKEND_DIR}/venv/Scripts/pip.exe"
fi

"${VENV_PYTHON}" -m pip install --upgrade pip
if [ -f "${BACKEND_DIR}/requirements.txt" ]; then
  echo "  Installing dependencies from backend/requirements.txt..."
  "${VENV_PIP}" install -r "${BACKEND_DIR}/requirements.txt"
fi

# 3. Database Migrations
echo -e "\n\033[1;32m[Step 3/5] Applying database migrations...\033[0m"
cd "${BACKEND_DIR}"
"${VENV_PYTHON}" manage.py migrate
cd "${ROOT_DIR}"

# 4. Root Dependencies
echo -e "\n\033[1;32m[Step 4/5] Installing root npm dependencies...\033[0m"
npm install

# 5. Frontend Dependencies
echo -e "\n\033[1;32m[Step 5/5] Installing frontend npm dependencies...\033[0m"
cd "${FRONTEND_DIR}"
npm install
cd "${ROOT_DIR}"

echo -e "\n\033[1;36m==========================================================\033[0m"
echo -e "\033[1;36m  Setup Complete! Run 'npm run dev' to launch the app.    \033[0m"
echo -e "\033[1;36m==========================================================\033[0m"
