#!/usr/bin/env bash
# ==============================================================================
# Unix (Linux / macOS / Git Bash) Development Runner for WRH Compiler App
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

echo -e "\033[1;36m==========================================================\033[0m"
echo -e "\033[1;36m  Starting WRH Compiler Development Environment (Unix)    \033[0m"
echo -e "\033[1;36m==========================================================\033[0m"

# Determine Python Binary
PYTHON_BIN="python3"
if [ -f "${BACKEND_DIR}/venv/bin/python" ]; then
  PYTHON_BIN="${BACKEND_DIR}/venv/bin/python"
elif [ -f "${BACKEND_DIR}/venv/Scripts/python.exe" ]; then
  PYTHON_BIN="${BACKEND_DIR}/venv/Scripts/python.exe"
fi

# Cleanup on exit
cleanup() {
  echo -e "\n\033[1;33mShutting down servers...\033[0m"
  if [ -n "${BACKEND_PID}" ]; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start Backend Server in Background
echo -e "\033[1;32m[1/2] Starting Django backend on http://127.0.0.1:8000...\033[0m"
cd "${BACKEND_DIR}"
"${PYTHON_BIN}" manage.py runserver 127.0.0.1:8000 &
BACKEND_PID=$!

# Start Frontend Server in Foreground
echo -e "\033[1;34m[2/2] Starting Next.js frontend on http://localhost:3000...\033[0m"
cd "${FRONTEND_DIR}"
npm run dev
