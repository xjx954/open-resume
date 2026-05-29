/**
 * Open Resume — Unified Dev Launcher
 *
 * Starts frontend + PDF backend with a single command.
 *   npm start
 *
 * Press Ctrl+C to stop all services.
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

const FRONTEND_PORT = 3000;
const PDF_SERVER_PORT = 4000;

const children = [];
const ready = { web: false, pdf: false };
let readyPrinted = false;

// ── Helpers ──────────────────────────────────────────

function color(c, s) {
  const codes = { red: 31, green: 32, yellow: 33, blue: 34, magenta: 35, cyan: 36, gray: 90, reset: 0 };
  return `\x1b[${codes[c] || 0}m${s}\x1b[0m`;
}

function banner() {
  console.log('');
  console.log(`  ${color('cyan', '◆')}  ${color('reset', 'Open Resume')}  ${color('gray', '— dev mode')}`);
  console.log(`     Frontend → :${FRONTEND_PORT}   |   PDF API → :${PDF_SERVER_PORT}`);
  console.log('');
}

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, () => {
      resolve(false);
    });
    req.on('error', () => resolve(true));
    req.setTimeout(1500, () => { req.destroy(); resolve(false); });
  });
}

function killTree(pid) {
  if (!isWindows) return;
  try { execSync(`taskkill /F /T /PID ${pid} 2>nul`, { stdio: 'ignore' }); } catch {}
}

// ── Node args (OpenSSL compat for Node ≥ 17) ─────────

function getNodeArgs() {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  const nodeOptions = process.env.NODE_OPTIONS || '';
  const hasLegacyProvider =
    process.execArgv.includes('--openssl-legacy-provider') ||
    nodeOptions.includes('--openssl-legacy-provider');
  return nodeMajor >= 17 && !hasLegacyProvider ? ['--openssl-legacy-provider'] : [];
}

const nodeArgs = getNodeArgs();

// ── Process manager ──────────────────────────────────

function start(name, command, args, opts = {}) {
  const child = spawn(command, args, {
    cwd: ROOT,
    stdio: 'pipe',
    ...opts,
  });

  children.push(child);

  child.stdout.on('data', (data) => {
    const text = data.toString();
    const tag = color('cyan', `[${name}]`);
    process.stdout.write(`${tag} ${text}`);

    if (name === 'web ' && text.includes('Project is running')) {
      ready.web = true;
      printReady();
    }
    if (name === 'pdf ' && text.includes('PDF server running')) {
      ready.pdf = true;
      printReady();
    }
  });

  child.stderr.on('data', (data) => {
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

function watch(name, child, command, args, opts) {
  child.on('close', (code, signal) => {
    if (signal) return;
    if (children.length === 0) return;
    console.log(`${color('yellow', `[${name}]`)} restarting...`);
    const newChild = start(name, command, args, opts);
    watch(name, newChild, command, args, opts);
  });
}

// ── Ready summary ────────────────────────────────────

function printReady() {
  if (!ready.web || !ready.pdf || readyPrinted) return;
  readyPrinted = true;
  console.log('');
  console.log(`  ${color('green', '✓')}  Services ready:`);
  console.log(`     Frontend  ${color('gray', '→')} ${color('cyan', `http://localhost:${FRONTEND_PORT}`)}`);
  console.log(`     PDF API   ${color('gray', '→')} ${color('cyan', `http://localhost:${PDF_SERVER_PORT}/api/pdf`)}`);
  console.log('');
}

// ── Shutdown ─────────────────────────────────────────

let shuttingDown = false;

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`\n${color('magenta', 'Shutting down...')}`);

  children.forEach((child) => {
    try { child.kill('SIGTERM'); } catch {}
  });

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

  // Frontend dev server (inline OpenSSL compat, skip browserslist check)
  const webServer = start('web ', process.execPath, [
    ...nodeArgs,
    path.join(ROOT, 'scripts', 'start.js'),
  ], {
    env: {
      ...process.env,
      PORT: String(FRONTEND_PORT),
      BROWSER: 'none',
      BROWSERSLIST_IGNORE_OLD_DATA: 'true',
    },
  });
  watch('web ', webServer, process.execPath, [
    ...nodeArgs,
    path.join(ROOT, 'scripts', 'start.js'),
  ], {
    env: {
      ...process.env,
      PORT: String(FRONTEND_PORT),
      BROWSER: 'none',
      BROWSERSLIST_IGNORE_OLD_DATA: 'true',
    },
  });

  console.log(color('gray', 'Press Ctrl+C to stop all services.\n'));
}

main();
