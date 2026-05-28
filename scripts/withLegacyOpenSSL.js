'use strict';

const { spawn } = require('child_process');

const script = process.argv[2];
const args = process.argv.slice(3);

if (!script) {
  console.error('Usage: node scripts/withLegacyOpenSSL.js <script> [...args]');
  process.exit(1);
}

const nodeMajor = Number(process.versions.node.split('.')[0]);
const nodeOptions = process.env.NODE_OPTIONS || '';
const hasLegacyProvider =
  process.execArgv.includes('--openssl-legacy-provider') ||
  nodeOptions.includes('--openssl-legacy-provider');
const nodeArgs = nodeMajor >= 17 && !hasLegacyProvider
  ? ['--openssl-legacy-provider']
  : [];

const child = spawn(process.execPath, [...nodeArgs, script, ...args], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
