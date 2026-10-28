// Config storage.
//  - Secrets (gateway URL + API key) live in ~/.config/small-software-cloud/credentials.json
//  - Per-project, NON-secret settings live in <project>/.share/config.json
//  - <project>/.gitignore gets a `.share/` entry automatically.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

export function globalConfigDir() {
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(base, 'small-software-cloud');
}

export function loadCredentials() {
  const dir = globalConfigDir();
  const file = path.join(dir, 'credentials.json');
  let creds = {};
  try { creds = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* first run */ }
  // Env vars take precedence over the stored file.
  return {
    gatewayUrl: process.env.SHARE_GATEWAY_URL || creds.gatewayUrl || 'http://localhost:3000',
    apiKey: process.env.SHARE_API_KEY || creds.apiKey || null,
    file,
  };
}

export function saveCredentials(update) {
  const dir = globalConfigDir();
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'credentials.json');
  let current = {};
  try { current = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* none */ }
  const next = { ...current, ...update };
  fs.writeFileSync(file, JSON.stringify(next, null, 2), { mode: 0o600 });
  return next;
}

export function projectConfigPath(root) {
  return path.join(root, '.share', 'config.json');
}

export function loadProjectConfig(root) {
  try { return JSON.parse(fs.readFileSync(projectConfigPath(root), 'utf8')); } catch { return null; }
}

/** Create .share/config.json (non-secret) and make sure .share/ is git-ignored. */
export function ensureProjectConfig(root) {
  const dir = path.join(root, '.share');
  fs.mkdirSync(dir, { recursive: true });
  let cfg = loadProjectConfig(root);
  if (!cfg) {
    cfg = { localId: crypto.randomUUID(), createdAt: new Date().toISOString(), overrides: {} };
    fs.writeFileSync(projectConfigPath(root), JSON.stringify(cfg, null, 2));
  }
  // A README inside .share explains what the folder is, in case someone finds it.
  const readme = path.join(dir, 'README.txt');
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(readme, 'Created by Small Software Cloud share CLI. Contains non-secret settings only.\nSecrets are stored in ~/.config/small-software-cloud/. Safe to delete.\n');
  }
  const gitignoreUpdated = ensureGitignored(root, '.share/');
  return { config: cfg, gitignoreUpdated };
}

export function saveProjectConfig(root, update) {
  const cfg = loadProjectConfig(root) || { localId: crypto.randomUUID(), overrides: {} };
  const next = { ...cfg, ...update, updatedAt: new Date().toISOString() };
  fs.mkdirSync(path.join(root, '.share'), { recursive: true });
  fs.writeFileSync(projectConfigPath(root), JSON.stringify(next, null, 2));
  return next;
}

/** Append `entry` to <root>/.gitignore unless an equivalent line exists. Returns true if written. */
export function ensureGitignored(root, entry) {
  const file = path.join(root, '.gitignore');
  let content = '';
  try { content = fs.readFileSync(file, 'utf8'); } catch { /* no .gitignore yet */ }
  const bare = entry.replace(/\/$/, '');
  const lines = content.split(/\r?\n/).map((l) => l.trim());
  if (lines.some((l) => l === entry || l === bare || l === `/${entry}` || l === `/${bare}`)) return false;
  const prefix = content && !content.endsWith('\n') ? '\n' : '';
  fs.appendFileSync(file, `${prefix}# Small Software Cloud share settings\n${entry}\n`);
  return true;
}
