/**
 * Open Resume — Unified Dev Launcher
 *
 * Starts frontend + PDF backend with a single command.
 * Handles startup, crash recovery, and graceful shutdown.
 *
 *   npm start        → unified launch (both services)
 *   npm run start:web → frontend only
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

const FRONTEND_PORT = 3000;
const PDF_SERVER_PORT = 4000;

const children = [];

// ── Helpers ──────────────────────────────────────────

function color(c, s) {
  const codes = { red: 31, green: 32, yellow: 33, blue: 34, magenta: 35, cyan: 36, gray: 90, reset: 0 };
  return `\x1b[${codes[c] || 0}m${s}\x1b[0m`;
}

function banner() {
  console.log('');
  console.log(`  ${color('cyan', '◆')}  ${color('reset', 'Open Resume')}  ${color('gray', '— dev mode')}`);
  console.log('');
}

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, () => {
      resolve(false); // port is in use
    });
    req.on('error', () => resolve(true)); // port is free
    req.setTimeout(1500, () => { req.destroy(); resolve(false); });
  });
}

function killTree(pid) {
  if (!isWindows) return;
  try { execSync(`taskkill /F /T /PID ${pid} 2>nul`, { stdio: 'ignore' }); } catch {}
}

// ── Process manager ──────────────────────────────────

function start(name, command, args, opts = {}) {
  const child = spawn(command, args, {
    cwd: ROOT,
    stdio: 'pipe',
    ...opts,
  });

  children.push(child);

  child.stdout.on('data', (data) => {
    const prefix = color('cyan', `[${name}]`);
    process.stdout.write(`${prefix} ${data}`);
  });

  child.stderr.on('data', (data) => {
    // webpack-dev-server outputs info to stderr — treat as normal
    process.stderr.write(`${color('cyan', `[${name}]`)} ${data}`);
  });

  child.on('error', (err) => {
    console.error(`${color('red', `[${name}]`)} Failed: ${err.message}`);
  });

  child.on('close', (code, signal) => {
    const idx = children.indexOf(child);
    if (idx >= 0) children.splice(idx, 1);

    if (signal) {
      console.log(`${color('gray', `[${name}]`)} stopped (${signal})`);
    } else if (code !== 0 && code !== null) {
      console.log(`${color('yellow', `[${name}]`)} exited (${code})`);
    }
  });

  return child;
}

// Restart a crashed process
function watch(name, child, command, args, opts) {
  child.on('close', (code, signal) => {
    if (signal) return; // killed by us — don't restart
    if (children.length === 0) return; // shutting down
    console.log(`${color('yellow', `[${name}]`)} restarting...`);
    const newChild = start(name, command, args, opts);
    watch(name, newChild, command, args, opts);
  });
}

// ── Shutdown ─────────────────────────────────────────

let shuttingDown = false;

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`\n${color('magenta', 'Shutting down...')}`);

  // Step 1: graceful SIGTERM
  children.forEach((child) => {
    try { child.kill('SIGTERM'); } catch {}
  });

  // Step 2: force kill after 2s
  setTimeout(() => {
    children.forEach((child) => {
      if (child.exitCode === null && child.signalCode === null) {
        if (isWindows) {
          killTree(child.pid);
        } else {
          try { child.kill('SIGKILL'); } catch {}
        }
      }
    });

    // Step 3: cleanup orphaned browser processes
    if (isWindows) {
      try {
        execSync('taskkill /F /IM chrome.exe /FI "SESSIONNAME eq Console" 2>nul', { stdio: 'ignore' });
      } catch {}
    }

    console.log(color('green', 'Done.\n'));
    process.exit(0);
  }, 2000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGBREAK', shutdown);
process.on('uncaughtException', (err) => {
  console.error(color('red', 'Fatal:'), err.message);
  shutdown();
});

// ── Main ─────────────────────────────────────────────

async function main() {
  banner();

  // Port conflict check
  const webFree = await checkPort(FRONTEND_PORT);
  const pdfFree = await checkPort(PDF_SERVER_PORT);

  if (!webFree) {
    console.log(`${color('yellow', '!')} Port ${FRONTEND_PORT} is in use — frontend may fail`);
  }
  if (!pdfFree) {
    console.log(`${color('yellow', '!')} Port ${PDF_SERVER_PORT} is in use — PDF server may fail`);
  }

  console.log(color('gray', 'Starting services...\n'));

  // PDF backend
  const pdfServer = start('pdf ', process.execPath, ['index.js'], {
    cwd: path.join(ROOT, 'server'),
    env: { ...process.env, PORT: String(PDF_SERVER_PORT) },
  });
  watch('pdf ', pdfServer, process.execPath, ['index.js'], {
    cwd: path.join(ROOT, 'server'),
    env: { ...process.env, PORT: String(PDF_SERVER_PORT) },
  });

  // Frontend dev server
  const webServer = start('web ', process.execPath, [
    path.join(ROOT, 'scripts', 'withLegacyOpenSSL.js'),
    path.join(ROOT, 'scripts', 'start.js'),
  ], {
    env: { ...process.env, PORT: String(FRONTEND_PORT), BROWSER: 'none' },
  });
  watch('web ', webServer, process.execPath, [
    path.join(ROOT, 'scripts', 'withLegacyOpenSSL.js'),
    path.join(ROOT, 'scripts', 'start.js'),
  ], {
    env: { ...process.env, PORT: String(FRONTEND_PORT), BROWSER: 'none' },
  });

  console.log(color('gray', 'Press Ctrl+C to stop all services.\n'));
}

main();
