#!/usr/bin/env node
// Small Software Cloud: share CLI entry point.
//   npm run share                 (from this repo, cloned inside or next to your project)
//   npm run share -- --dir ../app (explicit project folder)
//   npx small-software-cloud share --dir .
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startDashboard } from './server.mjs';
import { looksLikeProject } from './detect.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { dir: null, port: Number(process.env.SHARE_DASHBOARD_PORT) || 4040, open: true, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === 'share') continue; // allow `npx small-software-cloud share`
    else if (a === '--dir' || a === '-d') args.dir = argv[++i];
    else if (a.startsWith('--dir=')) args.dir = a.slice(6);
    else if (a === '--port' || a === '-p') args.port = Number(argv[++i]);
    else if (a === '--no-open') args.open = false;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (!a.startsWith('-') && !args.dir) args.dir = a;
  }
  return args;
}

/**
 * Resolve which folder to protect:
 *  1. --dir (relative to where the user typed the command)
 *  2. the folder npm/npx was invoked from, if it is not this repo
 *  3. the parent of this repo, if this repo was cloned inside a project
 *  4. otherwise null: the dashboard asks for a path
 */
function resolveProjectRoot(dirArg) {
  const invokedFrom = path.resolve(process.env.INIT_CWD || process.cwd());
  if (dirArg) return path.resolve(invokedFrom, dirArg);
  if (invokedFrom !== REPO_ROOT && !invokedFrom.startsWith(REPO_ROOT + path.sep)) return invokedFrom;
  const parent = path.dirname(REPO_ROOT);
  if (parent !== REPO_ROOT && looksLikeProject(parent)) return parent;
  return null;
}

function openBrowser(url) {
  const platform = process.platform;
  const cmd = platform === 'win32' ? 'cmd' : platform === 'darwin' ? 'open' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '""', url] : [url];
  try {
    const child = spawn(cmd, args, { stdio: 'ignore', detached: true, windowsVerbatimArguments: platform === 'win32' });
    child.on('error', () => {});
    child.unref();
  } catch { /* user can click the printed link */ }
}

async function listenWithFallback(opts, attempts = 10) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await startDashboard({ ...opts, port: opts.port + i });
    } catch (e) {
      if (e.code !== 'EADDRINUSE') throw e;
    }
  }
  throw new Error(`Ports ${opts.port}-${opts.port + attempts - 1} are all in use. Pass --port.`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`
  Small Software Cloud: share any project behind access-controlled links

  Usage:
    npm run share [-- --dir <project-folder>] [--port 4040] [--no-open]

  The dashboard opens at http://localhost:4040 (bound to 127.0.0.1 only).
`);
    return;
  }

  const projectRoot = resolveProjectRoot(args.dir);
  if (projectRoot && !fs.existsSync(projectRoot)) {
    console.error(`\n  Folder not found: ${projectRoot}\n`);
    process.exit(1);
  }

  const { port, authUrl } = await listenWithFallback({ projectRoot, repoRoot: REPO_ROOT, port: args.port });

  console.log('\n  \x1b[1mSmall Software Cloud: Share\x1b[0m');
  console.log(`  Project:   ${projectRoot || '(none detected, choose one in the dashboard)'}`);
  console.log(`  Dashboard: http://localhost:${port}  (127.0.0.1 only)`);
  console.log(`\n  Open this one-time sign-in link (also opened automatically):`);
  console.log(`  \x1b[36m${authUrl}\x1b[0m\n`);
  console.log('  Press Ctrl+C to stop.\n');

  if (args.open) openBrowser(authUrl);
}

main().catch((err) => {
  console.error('\n  Error:', err.message, '\n');
  process.exit(1);
});
