/**
 * One-command dev launcher: starts both the frontend dev server and the PDF backend.
 *
 * Usage:
 *   node scripts/dev.js
 *   npm run dev
 */

const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

function start(name, command, args, opts = {}) {
  const child = spawn(command, args, {
    cwd: ROOT,
    stdio: 'pipe',
    shell: isWindows,
    ...opts,
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line) console.log(`[${name}] ${line}`);
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line) console.log(`[${name}] ${line}`);
    });
  });

  child.on('error', (err) => {
    console.error(`[${name}] Failed to start: ${err.message}`);
  });

  child.on('close', (code) => {
    console.log(`[${name}] Process exited with code ${code}`);
  });

  return child;
}

console.log('Starting Open Resume (frontend + PDF backend)...\n');

// Start PDF backend
const pdfServer = start('pdf-server', 'node', ['server/index.js'], {
  cwd: path.join(ROOT, 'server'),
});

// Start frontend (with legacy OpenSSL for Node 17+)
const frontend = start('frontend', 'node', [
  path.join(ROOT, 'scripts', 'withLegacyOpenSSL.js'),
  path.join(ROOT, 'scripts', 'start.js'),
]);

// Graceful shutdown
function shutdown() {
  console.log('\nShutting down...');
  pdfServer.kill('SIGTERM');
  frontend.kill('SIGTERM');
  // Force kill after 3s
  setTimeout(() => {
    pdfServer.kill('SIGKILL');
    frontend.kill('SIGKILL');
    process.exit(0);
  }, 3000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
