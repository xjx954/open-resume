/**
 * One-command dev launcher: starts both the frontend dev server and the PDF backend.
 *
 * Usage:
 *   npm run dev
 *
 * Press Ctrl+C to gracefully shut down both services.
 */

const { spawn, execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

// Track child PIDs for cleanup
const children = [];

function start(name, command, args, opts = {}) {
  // On Windows, NEVER use shell:true — it prevents signal propagation to grandchildren
  const child = spawn(command, args, {
    cwd: ROOT,
    stdio: 'pipe',
    ...opts,
  });

  children.push(child);

  // Forward output with prefix
  child.stdout.on('data', (data) => {
    process.stdout.write(`\x1b[36m[${name}]\x1b[0m ${data}`);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(`\x1b[33m[${name}]\x1b[0m ${data}`);
  });

  child.on('error', (err) => {
    console.error(`\x1b[31m[${name}] Failed to start: ${err.message}\x1b[0m`);
  });

  child.on('close', (code) => {
    const idx = children.indexOf(child);
    if (idx >= 0) children.splice(idx, 1);
    // Only log non-zero exits (not killed by us)
    if (code !== 0 && code !== null) {
      console.log(`\x1b[36m[${name}]\x1b[0m exited with code ${code}`);
    }
  });

  return child;
}

// Kill a process and all its descendants on Windows
function killTree(pid) {
  if (!isWindows) return;
  try {
    execSync(`taskkill /F /T /PID ${pid} 2>nul`, { stdio: 'ignore' });
  } catch {
    // Process may already be dead — ignore
  }
  try {
    execSync(`taskkill /F /PID ${pid} 2>nul`, { stdio: 'ignore' });
  } catch {
    // ignore
  }
}

// Graceful shutdown
function shutdown() {
  if (children.length === 0) {
    process.exit(0);
  }

  console.log('\n\x1b[35mShutting down services...\x1b[0m');

  // Step 1: Send graceful SIGTERM to all children
  children.forEach((child) => {
    try {
      child.kill('SIGTERM');
    } catch {
      // already dead
    }
  });

  // Step 2: After 2s, force kill any survivors (including orphaned grandchildren)
  setTimeout(() => {
    children.forEach((child) => {
      if (child.exitCode === null) {
        // Still alive — force kill
        if (isWindows) {
          killTree(child.pid);
        } else {
          try { child.kill('SIGKILL'); } catch {}
        }
      }
    });

    // Step 3: Clean up any remaining Puppeteer browsers on the system
    if (isWindows) {
      try {
        // Kill orphaned Chromium processes that may have been spawned by Puppeteer
        execSync('taskkill /F /IM chrome.exe /FI "SESSIONNAME eq Console" 2>nul', { stdio: 'ignore' });
      } catch {
        // ignore — no orphaned chrome processes
      }
    }

    console.log('\x1b[32mAll services stopped.\x1b[0m');
    process.exit(0);
  }, 2000);
}

// Handle exit signals
process.on('SIGINT', shutdown);   // Ctrl+C
process.on('SIGTERM', shutdown);  // kill command
process.on('SIGBREAK', shutdown); // Windows console close

// Handle unexpected exits
process.on('exit', () => {
  children.forEach((child) => {
    try { child.kill('SIGKILL'); } catch {}
  });
});

// Handle uncaught errors — don't leave orphaned processes
process.on('uncaughtException', (err) => {
  console.error('\x1b[31mFatal error:\x1b[0m', err.message);
  shutdown();
});

// ────────────────────────────────────────────
// Start everything
// ────────────────────────────────────────────

console.log('\x1b[32mStarting Open Resume...\x1b[0m\n');

// PDF backend — no shell wrapper, direct node invocation
const pdfServer = start('pdf', process.execPath, ['index.js'], {
  cwd: path.join(ROOT, 'server'),
});

// Frontend dev server — with legacy OpenSSL for Node 17+
const frontend = start('web', process.execPath, [
  path.join(ROOT, 'scripts', 'withLegacyOpenSSL.js'),
  path.join(ROOT, 'scripts', 'start.js'),
]);

console.log('\x1b[90mPress Ctrl+C to stop all services.\x1b[0m\n');
