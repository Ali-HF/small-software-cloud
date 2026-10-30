// ==============================================================================
// Small Software Cloud - Share Gateway store (Supabase Postgres backed)
// Works on serverless hosts (Vercel) where the filesystem is read-only/ephemeral.
// All tables are service-role only (RLS on, no policies).
// ==============================================================================

import crypto from 'node:crypto';
import path from 'node:path';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServerClient } from './supabase';

export interface ProjectRecord {
  id: string;
  name: string;
  framework?: string | null;
  activeDeployId?: string | null;
  filesCount: number;
  totalBytes: number;
  updatedAt: string;
}

export interface LinkRecord {
  id: string;
  projectId: string;
  label: string;
  tokenHash: string;
  tokenPreview: string;
  accessType: 'public' | 'pin' | 'password' | 'email';
  pinHash?: string | null;
  passwordHash?: string | null;
  allowedEmails?: string[] | null;
  expiresAt?: string | null;
  maxUses?: number | null;
  useCount: number;
  isRevoked: boolean;
  revokedAt?: string | null;
  createdAt: string;
}

export interface AccessEventRecord {
  id: string;
  linkId?: string | null;
  projectId: string;
  linkLabel?: string | null;
  status: 'allowed' | 'denied' | 'challenge' | 'expired' | 'revoked';
  reason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  timestamp: string;
}

export interface BundleFileInput {
  path: string;
  contentBase64: string;
  size?: number;
}

export const MAX_PROJECT_BYTES = 40 * 1024 * 1024; // 40 MB per deploy

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wasm': 'application/wasm',
  '.pdf': 'application/pdf',
};

export function contentTypeFor(p: string): string {
  return MIME_TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream';
}

function db(): SupabaseClient {
  const sb = getSupabaseServerClient();
  if (!sb) {
    throw new Error(
      'Share gateway storage is not configured (missing Supabase URL / service role key).'
    );
  }
  return sb;
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim()).digest('hex');
}
export const hashToken = sha256;
export const hashSecret = sha256;

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a || '');
  const bb = Buffer.from(b || '');
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function sanitizeRelPath(p: string): string | null {
  const norm = path.posix.normalize(String(p || '').replace(/\\/g, '/')).replace(/^\/+/, '');
  if (!norm || norm === '.' || norm.startsWith('..') || norm.includes('/../')) return null;
  return norm;
}

function mapProject(row: any): ProjectRecord {
  return {
    id: row.id,
    name: row.name,
    framework: row.framework,
    activeDeployId: row.active_deploy_id,
    filesCount: row.files_count,
    totalBytes: Number(row.total_bytes || 0),
    updatedAt: row.updated_at,
  };
}

function mapLink(row: any): LinkRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    label: row.label,
    tokenHash: row.token_hash,
    tokenPreview: row.token_preview,
    accessType: row.access_type,
    pinHash: row.pin_hash,
    passwordHash: row.password_hash,
    allowedEmails: row.allowed_emails,
    expiresAt: row.expires_at,
    maxUses: row.max_uses,
    useCount: row.use_count,
    isRevoked: row.is_revoked,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}

/** Strip secrets before returning a link to a client. */
export function publicLink(link: LinkRecord) {
  const { tokenHash, pinHash, passwordHash, ...rest } = link;
  void tokenHash; void pinHash; void passwordHash;
  return rest;
}

// ----------------- Projects & ownership -----------------

export async function getProject(id: string): Promise<ProjectRecord | null> {
  const { data } = await db().from('share_projects').select('*').eq('id', id).maybeSingle();
  return data ? mapProject(data) : null;
}

/**
 * Verifies the caller owns the project (via the per-project key held by the CLI).
 * If the project does not exist yet and `createIfMissing` is set, it is claimed.
 */
export async function authorizeProject(
  projectId: string,
  projectKey: string | null,
  opts: { createIfMissing?: boolean; name?: string; framework?: string | null } = {}
): Promise<{ ok: true; project: ProjectRecord } | { ok: false; status: number; error: string }> {
  if (!/^[a-zA-Z0-9_-]{4,64}$/.test(projectId)) {
    return { ok: false, status: 400, error: 'Invalid project id' };
  }
  if (!projectKey || projectKey.length < 24) {
    return { ok: false, status: 401, error: 'Missing project key' };
  }
  const sb = db();
  const { data: row } = await sb.from('share_projects').select('*').eq('id', projectId).maybeSingle();

  if (!row) {
    if (!opts.createIfMissing) return { ok: false, status: 404, error: 'Project not found' };
    const { data: created, error } = await sb
      .from('share_projects')
      .insert({
        id: projectId,
        name: (opts.name || projectId).slice(0, 120),
        framework: opts.framework || null,
        owner_key_hash: sha256(projectKey),
      })
      .select('*')
      .single();
    if (error || !created) return { ok: false, status: 500, error: error?.message || 'Could not create project' };
    return { ok: true, project: mapProject(created) };
  }

  if (!safeEqual(row.owner_key_hash, sha256(projectKey))) {
    return { ok: false, status: 403, error: 'Project key does not match' };
  }
  return { ok: true, project: mapProject(row) };
}

// ----------------- Deploys (chunked bundle upload) -----------------

export async function beginDeploy(projectId: string, meta: { name?: string; framework?: string | null }) {
  const deployId = `d_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  await db()
    .from('share_projects')
    .update({
      name: (meta.name || projectId).slice(0, 120),
      framework: meta.framework || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);
  return deployId;
}

export async function uploadDeployFiles(projectId: string, deployId: string, files: BundleFileInput[]) {
  if (!/^d_[a-z0-9_]+$/.test(deployId)) throw new Error('Invalid deploy id');
  const rows = [];
  for (const f of files) {
    const rel = sanitizeRelPath(f.path);
    if (!rel) continue;
    const size = f.size ?? Math.floor((f.contentBase64.length * 3) / 4);
    rows.push({
      project_id: projectId,
      deploy_id: deployId,
      path: rel,
      content_base64: f.contentBase64,
      content_type: contentTypeFor(rel),
      size,
    });
  }
  if (rows.length === 0) return 0;
  const { error } = await db().from('share_files').upsert(rows, { onConflict: 'project_id,deploy_id,path' });
  if (error) throw new Error(error.message);
  return rows.length;
}

export async function commitDeploy(projectId: string, deployId: string) {
  const sb = db();
  const { data: stats, error } = await sb
    .from('share_files')
    .select('size')
    .eq('project_id', projectId)
    .eq('deploy_id', deployId);
  if (error) throw new Error(error.message);
  const filesCount = stats?.length || 0;
  if (filesCount === 0) throw new Error('Deploy has no files');
  const totalBytes = (stats || []).reduce((s: number, r: any) => s + (r.size || 0), 0);
  if (totalBytes > MAX_PROJECT_BYTES) throw new Error('Deploy exceeds 40 MB limit');

  await sb
    .from('share_projects')
    .update({
      active_deploy_id: deployId,
      files_count: filesCount,
      total_bytes: totalBytes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  // Remove files from previous deploys
  await sb.from('share_files').delete().eq('project_id', projectId).neq('deploy_id', deployId);
  return { filesCount, totalBytes };
}

export async function getBundleFile(
  projectId: string,
  reqPath: string
): Promise<{ content: Buffer; contentType: string; path: string } | null> {
  const project = await getProject(projectId);
  if (!project?.activeDeployId) return null;
  const sb = db();

  let rel = String(reqPath || '').replace(/^\/+/, '').replace(/\/+$/, '');
  const clean = rel ? sanitizeRelPath(rel) : '';
  if (clean === null) return null;
  rel = clean;

  const candidates: string[] = [];
  if (!rel) candidates.push('index.html');
  else {
    candidates.push(rel);
    if (!path.posix.extname(rel)) {
      candidates.push(`${rel}.html`, `${rel}/index.html`, 'index.html');
    }
  }

  for (const candidate of candidates) {
    const { data } = await sb
      .from('share_files')
      .select('content_base64, content_type, path')
      .eq('project_id', projectId)
      .eq('deploy_id', project.activeDeployId)
      .eq('path', candidate)
      .maybeSingle();
    if (data) {
      return {
        content: Buffer.from(data.content_base64, 'base64'),
        contentType: data.content_type,
        path: data.path,
      };
    }
  }
  return null;
}

// ----------------- Links -----------------

export async function listLinks(projectId: string): Promise<LinkRecord[]> {
  const { data, error } = await db()
    .from('share_links')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapLink);
}

export async function findLinkByToken(rawToken: string): Promise<LinkRecord | null> {
  if (!rawToken || rawToken.length < 16 || rawToken.length > 128) return null;
  const { data } = await db()
    .from('share_links')
    .select('*')
    .eq('token_hash', hashToken(rawToken))
    .maybeSingle();
  return data ? mapLink(data) : null;
}

export async function getLink(linkId: string): Promise<LinkRecord | null> {
  const { data } = await db().from('share_links').select('*').eq('id', linkId).maybeSingle();
  return data ? mapLink(data) : null;
}

export async function createLink(opts: {
  projectId: string;
  label?: string;
  accessType?: 'public' | 'pin' | 'password' | 'email';
  pin?: string;
  password?: string;
  allowedEmails?: string[];
  expiresHours?: number;
  maxUses?: number;
}): Promise<{ link: LinkRecord; rawToken: string }> {
  const accessType = opts.accessType || 'public';
  if (!['public', 'pin', 'password', 'email'].includes(accessType)) throw new Error('Invalid access type');
  if (accessType === 'pin' && !/^\d{4,8}$/.test(opts.pin || '')) throw new Error('PIN must be 4-8 digits');
  if (accessType === 'password' && (opts.password || '').length < 4) throw new Error('Password must be at least 4 characters');
  const emails = (opts.allowedEmails || []).map((e) => e.trim().toLowerCase()).filter((e) => e.includes('@'));
  if (accessType === 'email' && emails.length === 0) throw new Error('Add at least one allowed email');

  const rawToken = crypto.randomBytes(24).toString('base64url');
  const id = `link_${crypto.randomBytes(8).toString('hex')}`;
  const expiresAt =
    opts.expiresHours && opts.expiresHours > 0
      ? new Date(Date.now() + opts.expiresHours * 3600 * 1000).toISOString()
      : null;

  const { data, error } = await db()
    .from('share_links')
    .insert({
      id,
      project_id: opts.projectId,
      label: (opts.label?.trim() || 'Share link').slice(0, 120),
      token_hash: hashToken(rawToken),
      token_preview: rawToken.slice(0, 8),
      access_type: accessType,
      pin_hash: accessType === 'pin' ? hashSecret(opts.pin!) : null,
      password_hash: accessType === 'password' ? hashSecret(opts.password!) : null,
      allowed_emails: accessType === 'email' ? emails : null,
      expires_at: expiresAt,
      max_uses: opts.maxUses && opts.maxUses > 0 ? Math.floor(opts.maxUses) : null,
    })
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message || 'Could not create link');
  return { link: mapLink(data), rawToken };
}

export async function recordLinkUse(linkId: string) {
  await db().rpc('share_increment_link_use', { p_link_id: linkId });
}

export async function revokeLink(linkId: string): Promise<LinkRecord | null> {
  const { data } = await db()
    .from('share_links')
    .update({ is_revoked: true, revoked_at: new Date().toISOString() })
    .eq('id', linkId)
    .select('*')
    .maybeSingle();
  return data ? mapLink(data) : null;
}

// ----------------- Audit Events -----------------

export async function recordEvent(event: Omit<AccessEventRecord, 'id' | 'timestamp'>) {
  try {
    await db().from('share_events').insert({
      id: `evt_${crypto.randomBytes(8).toString('hex')}`,
      link_id: event.linkId || null,
      project_id: event.projectId,
      link_label: event.linkLabel || null,
      status: event.status,
      reason: event.reason || null,
      ip: (event.ip || '').split(',')[0].trim().slice(0, 64) || null,
      user_agent: (event.userAgent || '').slice(0, 300) || null,
    });
  } catch {
    // auditing must never break serving
  }
}

export async function listEvents(projectId: string): Promise<AccessEventRecord[]> {
  const { data, error } = await db()
    .from('share_events')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data || []).map((r: any) => ({
    id: r.id,
    linkId: r.link_id,
    projectId: r.project_id,
    linkLabel: r.link_label,
    status: r.status,
    reason: r.reason,
    ip: r.ip,
    userAgent: r.user_agent,
    timestamp: r.created_at,
  }));
}
