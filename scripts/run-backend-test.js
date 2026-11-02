/**
 * Cross-platform Django Backend Test Runner
 * Runs automated backend unit tests.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const backendDir = path.resolve(__dirname, '..', 'backend');
const isWin = process.platform === 'win32';

const venvWin = path.join(backendDir, 'venv', 'Scripts', 'python.exe');
const venvUnix = path.join(backendDir, 'venv', 'bin', 'python');

let pythonBin = 'python';
if (isWin && fs.existsSync(venvWin)) {
  pythonBin = venvWin;
} else if (!isWin && fs.existsSync(venvUnix)) {
  pythonBin = venvUnix;
}

console.log(`\x1b[36m[test:backend] Running Django tests using ${pythonBin}...\x1b[0m`);

const proc = spawn(pythonBin, ['manage.py', 'test', 'apps'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: false,
});

proc.on('close', (code) => {
  process.exit(code || 0);
});
