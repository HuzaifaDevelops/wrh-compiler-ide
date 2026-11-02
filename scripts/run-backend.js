/**
 * Cross-platform Django Backend Development Server Runner
 * Automatically resolves virtual environment Python across Windows and POSIX.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const backendDir = path.resolve(__dirname, '..', 'backend');
const isWin = process.platform === 'win32';

// Check virtual environment python paths
const venvWin = path.join(backendDir, 'venv', 'Scripts', 'python.exe');
const venvUnix = path.join(backendDir, 'venv', 'bin', 'python');

let pythonBin = 'python';
if (isWin && fs.existsSync(venvWin)) {
  pythonBin = venvWin;
} else if (!isWin && fs.existsSync(venvUnix)) {
  pythonBin = venvUnix;
} else {
  console.log('\x1b[33m[backend] Warning: backend/venv not detected. Using system python.\x1b[0m');
}

const host = process.env.BACKEND_HOST || '127.0.0.1';
const port = process.env.BACKEND_PORT || '8000';
const addr = `${host}:${port}`;

console.log(`\x1b[36m[backend] Launching Django server on http://${addr} using ${pythonBin}...\x1b[0m`);

const proc = spawn(pythonBin, ['manage.py', 'runserver', addr], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: false,
});

proc.on('close', (code) => {
  if (code !== 0) {
    console.error(`\x1b[31m[backend] Django server exited with code ${code}\x1b[0m`);
  }
  process.exit(code || 0);
});
