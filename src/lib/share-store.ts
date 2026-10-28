import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface ProjectRecord {
  id: string;
  name: string;
  target: 'static' | 'url' | 'port';
  outputDir?: string;
  buildCommand?: string;
  originUrl?: string;
  devCommand?: string;
  devPort?: number;
  filesCount?: number;
  totalBytes?: number;
  updatedAt: string;
}

export interface LinkRecord {
  id: string;
  projectId: string;
  label: string;
  tokenHash: string;
  tokenPreview: string; // first 8 chars for reference
  accessType: 'public' | 'pin' | 'password' | 'email';
  pin?: string;
  passwordHash?: string;
  allowedEmails?: string[];
  expiresAt?: string | null;
  maxUses?: number | null;
  useCount: number;
  isRevoked: boolean;
  revokedAt?: string | null;
  createdAt: string;
}

export interface AccessEventRecord {
  id: string;
  linkId: string;
  projectId: string;
  linkLabel?: string;
  status: 'allowed' | 'denied' | 'challenge' | 'expired' | 'revoked';
  reason?: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

export interface BundleFile {
  path: string;
  contentBase64: string;
  contentType: string;
  size: number;
}

const DATA_DIR = path.resolve(process.cwd(), '.share-data');
const BUNDLES_DIR = path.join(DATA_DIR, 'bundles');

function ensureDataDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BUNDLES_DIR)) fs.mkdirSync(BUNDLES_DIR, { recursive: true });
}

function readJson<T>(filename: string, fallback: T): T {
  ensureDataDirs();
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(filename: string, data: any) {
  ensureDataDirs();
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret.trim()).digest('hex');
}

// ----------------- Projects -----------------
export function getProject(id: string): ProjectRecord | null {
  const projects = readJson<Record<string, ProjectRecord>>('projects.json', {});
  return projects[id] || null;
}

export function saveProject(project: ProjectRecord): ProjectRecord {
  const projects = readJson<Record<string, ProjectRecord>>('projects.json', {});
  projects[project.id] = { ...project, updatedAt: new Date().toISOString() };
  writeJson('projects.json', projects);
  return projects[project.id];
}

// ----------------- Bundles -----------------
export function saveBundle(projectId: string, files: BundleFile[]) {
  ensureDataDirs();
  const projectBundleDir = path.join(BUNDLES_DIR, projectId);
  if (fs.existsSync(projectBundleDir)) {
    fs.rmSync(projectBundleDir, { recursive: true, force: true });
  }
  fs.mkdirSync(projectBundleDir, { recursive: true });

  let totalBytes = 0;
  for (const file of files) {
    const cleanRel = path.normalize(file.path).replace(/^(\.\.[\/\\])+/, '');
    const absPath = path.join(projectBundleDir, cleanRel);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    const buf = Buffer.from(file.contentBase64, 'base64');
    fs.writeFileSync(absPath, buf);
    totalBytes += buf.length;
  }

  // Update project metadata
  const proj = getProject(projectId) || {
    id: projectId,
    name: projectId,
    target: 'static',
    updatedAt: new Date().toISOString(),
  };
  proj.filesCount = files.length;
  proj.totalBytes = totalBytes;
  saveProject(proj);
}

export function getBundleFile(projectId: string, reqPath: string): { content: Buffer; contentType: string } | null {
  const projectBundleDir = path.join(BUNDLES_DIR, projectId);
  if (!fs.existsSync(projectBundleDir)) return null;

  let rel = reqPath.replace(/^\/+/, '');
  if (!rel || rel === '/') rel = 'index.html';

  let absPath = path.resolve(projectBundleDir, rel);
  if (!absPath.startsWith(projectBundleDir)) return null;

  if (fs.existsSync(absPath) && fs.statSync(absPath).isDirectory()) {
    absPath = path.join(absPath, 'index.html');
  }

  // Fallback to index.html for SPA client-side routing if file has no extension
  if (!fs.existsSync(absPath) && !path.extname(rel)) {
    const fallback = path.join(projectBundleDir, 'index.html');
    if (fs.existsSync(fallback)) absPath = fallback;
  }

  if (!fs.existsSync(absPath) || fs.statSync(absPath).isDirectory()) return null;

  const ext = path.extname(absPath).toLowerCase();
  const MIME_TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8',
  };

  return {
    content: fs.readFileSync(absPath),
    contentType: MIME_TYPES[ext] || 'application/octet-stream',
  };
}

// ----------------- Links -----------------
export function listLinks(projectId?: string): LinkRecord[] {
  const links = readJson<Record<string, LinkRecord>>('links.json', {});
  const list = Object.values(links);
  if (projectId) return list.filter((l) => l.projectId === projectId);
  return list;
}

export function findLinkByToken(rawToken: string): LinkRecord | null {
  const hash = hashToken(rawToken);
  const links = readJson<Record<string, LinkRecord>>('links.json', {});
  return Object.values(links).find((l) => l.tokenHash === hash) || null;
}

export function getLink(linkId: string): LinkRecord | null {
  const links = readJson<Record<string, LinkRecord>>('links.json', {});
  return links[linkId] || null;
}

export function createLink(opts: {
  projectId: string;
  label?: string;
  accessType?: 'public' | 'pin' | 'password' | 'email';
  pin?: string;
  password?: string;
  allowedEmails?: string[];
  expiresHours?: number;
  maxUses?: number;
}): { link: LinkRecord; rawToken: string } {
  const links = readJson<Record<string, LinkRecord>>('links.json', {});
  const rawToken = crypto.randomBytes(24).toString('base64url');
  const tokenHash = hashToken(rawToken);
  const id = `link_${crypto.randomBytes(8).toString('hex')}`;

  let expiresAt: string | null = null;
  if (opts.expiresHours && opts.expiresHours > 0) {
    expiresAt = new Date(Date.now() + opts.expiresHours * 3600 * 1000).toISOString();
  }

  const link: LinkRecord = {
    id,
    projectId: opts.projectId,
    label: opts.label?.trim() || 'Access Link',
    tokenHash,
    tokenPreview: rawToken.slice(0, 8),
    accessType: opts.accessType || 'public',
    pin: opts.pin?.trim() || undefined,
    passwordHash: opts.password ? hashSecret(opts.password) : undefined,
    allowedEmails: opts.allowedEmails || undefined,
    expiresAt,
    maxUses: opts.maxUses || null,
    useCount: 0,
    isRevoked: false,
    revokedAt: null,
    createdAt: new Date().toISOString(),
  };

  links[id] = link;
  writeJson('links.json', links);
  return { link, rawToken };
}

export function recordLinkUse(linkId: string) {
  const links = readJson<Record<string, LinkRecord>>('links.json', {});
  if (links[linkId]) {
    links[linkId].useCount = (links[linkId].useCount || 0) + 1;
    writeJson('links.json', links);
  }
}

export function revokeLink(linkId: string): LinkRecord | null {
  const links = readJson<Record<string, LinkRecord>>('links.json', {});
  if (!links[linkId]) return null;
  links[linkId].isRevoked = true;
  links[linkId].revokedAt = new Date().toISOString();
  writeJson('links.json', links);
  return links[linkId];
}

// ----------------- Audit Events -----------------
export function recordEvent(event: Omit<AccessEventRecord, 'id' | 'timestamp'>): AccessEventRecord {
  const events = readJson<AccessEventRecord[]>('events.json', []);
  const newEvent: AccessEventRecord = {
    id: `evt_${crypto.randomBytes(8).toString('hex')}`,
    ...event,
    timestamp: new Date().toISOString(),
  };
  events.unshift(newEvent);
  // Keep last 500 events
  if (events.length > 500) events.length = 500;
  writeJson('events.json', events);
  return newEvent;
}

export function listEvents(projectId?: string): AccessEventRecord[] {
  const events = readJson<AccessEventRecord[]>('events.json', []);
  if (projectId) return events.filter((e) => e.projectId === projectId);
  return events;
}
