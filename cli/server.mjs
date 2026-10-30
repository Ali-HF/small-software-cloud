// Localhost dashboard server.
// Security model:
//  - Binds to 127.0.0.1 only.
//  - Host header must be localhost/127.0.0.1:<port>  (blocks DNS-rebinding).
//  - A random per-run session token is redeemed once via /auth?t=... into an
//    HttpOnly, SameSite=Strict cookie, then redirected to a clean URL.
//  - Every /api call needs the cookie AND an X-CSRF-Token header (derived from
//    the session via HMAC and only embedded in the authenticated page).
//  - Mutating calls must be JSON (forces a CORS preflight cross-origin) and,
//    if an Origin header is present, it must be our own origin.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { detectProject, looksLikeProject } from './detect.mjs';
import { ensureProjectConfig, loadProjectConfig, saveProjectConfig, loadCredentials, saveCredentials } from './config.mjs';
import { promptFolderPicker } from './picker.mjs';
import { packageProject, uploadBundle } from './packager.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DASHBOARD_DIR = path.resolve(__dirname, '..', 'dashboard');
const COOKIE = 'ssc_dash';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function safeEqual(a, b) {
  const ba = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function baseHeaders(extra = {}) {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    ...extra,
  };
}

function sendJson(res, status, body) {
  res.writeHead(status, baseHeaders({ 'Content-Type': 'application/json; charset=utf-8' }));
  res.end(JSON.stringify(body));
}

function sendText(res, status, text, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, baseHeaders({ 'Content-Type': type }));
  res.end(text);
}

function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('Body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const LOCKED_PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>Dashboard locked</title>
<meta name="robots" content="noindex"><link rel="stylesheet" href="/assets/styles.css"></head>
<body class="locked"><main class="locked-card"><div class="logo-mark">S</div><h1>Dashboard locked</h1>
<p>This dashboard only opens through the one-time link printed in your terminal when you ran <code>npm run share</code>.</p>
<p class="muted">This protects it from other websites and other users on this machine.</p></main></body></html>`;

/**
 * Start the dashboard server.
 * @param {object} opts
 * @param {string|null} opts.projectRoot  resolved project folder (may be null)
 * @param {string} opts.repoRoot          this tool's own folder (excluded from detection)
 * @param {number} opts.port
 */
export function startDashboard({ projectRoot, repoRoot, port, initialSync = null }) {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const csrfToken = crypto.createHmac('sha256', sessionToken).update('csrf').digest('hex');
  const state = { projectRoot, repoRoot, gitignoreUpdated: false, initialSync };

  function getProjectId() {
    if (!state.projectRoot) return 'default-project';
    const config = loadProjectConfig(state.projectRoot);
    const detected = detectProject(state.projectRoot, { exclude: [state.repoRoot] });
    const raw = config?.projectId || detected.name || path.basename(state.projectRoot);
    return (
      String(raw)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 64) || 'default-project'
    );
  }

  if (state.projectRoot) {
    state.gitignoreUpdated = ensureProjectConfig(state.projectRoot).gitignoreUpdated;
  }

  function projectPayload() {
    const creds = loadCredentials();
    const gateway = { url: creds.gatewayUrl, hasApiKey: !!creds.apiKey, credentialsFile: creds.file };
    if (!state.projectRoot) {
      return { project: null, config: null, gateway, repoRoot: state.repoRoot, initialSync: null };
    }
    const detected = detectProject(state.projectRoot, { exclude: [state.repoRoot] });
    const config = loadProjectConfig(state.projectRoot);
    const o = config?.overrides || {};
    // Effective settings = detection, overridden by anything the user saved.
    const effective = {
      target: o.target || detected.suggestedTarget,
      outputDir: o.outputDir ?? detected.outputDir,
      buildCommand: o.buildCommand ?? detected.buildCommand,
      originUrl: o.originUrl || '',
      devCommand: o.devCommand ?? detected.devCommand,
      devPort: o.devPort ?? detected.devPort,
    };
    return {
      project: detected,
      projectId: getProjectId(),
      config,
      effective,
      gateway,
      gitignoreUpdated: state.gitignoreUpdated,
      repoRoot: state.repoRoot,
      initialSync: state.initialSync,
    };
  }

  const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
  const allowedOrigins = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`]);

  const server = http.createServer(async (req, res) => {
    try {
      // 1. DNS-rebinding guard
      if (!allowedHosts.has(req.headers.host || '')) {
        return sendText(res, 403, 'Forbidden host');
      }
      const url = new URL(req.url, `http://${req.headers.host}`);
      const cookies = parseCookies(req.headers.cookie);
      const authed = safeEqual(cookies[COOKIE], sessionToken);

      // 2. Session redemption: token -> cookie -> clean URL
      if (url.pathname === '/auth') {
        if (!safeEqual(url.searchParams.get('t'), sessionToken)) {
          return sendText(res, 403, 'Invalid or expired dashboard link. Re-run `npm run share`.');
        }
        res.writeHead(302, baseHeaders({
          'Set-Cookie': `${COOKIE}=${sessionToken}; HttpOnly; SameSite=Strict; Path=/`,
          Location: '/',
        }));
        return res.end();
      }

      // 3. Static assets (non-sensitive, no auth needed)
      if (url.pathname.startsWith('/assets/')) {
        const rel = url.pathname.slice('/assets/'.length);
        const file = path.resolve(DASHBOARD_DIR, rel);
        if (!file.startsWith(DASHBOARD_DIR + path.sep) || !fs.existsSync(file)) {
          return sendText(res, 404, 'Not found');
        }
        res.writeHead(200, baseHeaders({ 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' }));
        return fs.createReadStream(file).pipe(res);
      }

      // 3.5. Inline <script> blocks in dashboard use 'unsafe-inline' isn't set, only /assets/app.js is used
      // Allow external links from the dashboard to open in a new tab
      if (url.pathname.startsWith('/api/')) {
        if (!authed) return sendJson(res, 401, { error: 'Not authenticated' });
        if (!safeEqual(req.headers['x-csrf-token'], csrfToken)) {
          return sendJson(res, 403, { error: 'Missing or invalid CSRF token' });
        }
        const origin = req.headers.origin;
        if (origin && !allowedOrigins.has(origin)) return sendJson(res, 403, { error: 'Bad origin' });

        let body = {};
        if (req.method !== 'GET') {
          if (!(req.headers['content-type'] || '').startsWith('application/json')) {
            return sendJson(res, 415, { error: 'JSON required' });
          }
          try { body = JSON.parse((await readBody(req)) || '{}'); } catch { return sendJson(res, 400, { error: 'Invalid JSON' }); }
        }

        if (url.pathname === '/api/project' && req.method === 'GET') {
          return sendJson(res, 200, projectPayload());
        }

        if (url.pathname === '/api/project/root' && req.method === 'POST') {
          const raw = String(body.root || '').trim();
          if (!raw) return sendJson(res, 400, { error: 'Path required' });
          const abs = path.resolve(raw);
          if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) return sendJson(res, 400, { error: 'Folder not found' });
          if (abs === state.repoRoot) return sendJson(res, 400, { error: 'That is the Small Software Cloud folder itself. Pick your project folder.' });
          state.projectRoot = abs;
          state.gitignoreUpdated = ensureProjectConfig(abs).gitignoreUpdated;
          return sendJson(res, 200, { ...projectPayload(), looksLikeProject: looksLikeProject(abs) });
        }

        if (url.pathname === '/api/project/browse' && req.method === 'POST') {
          const chosen = await promptFolderPicker();
          if (!chosen) {
            return sendJson(res, 200, { cancelled: true, ...projectPayload() });
          }
          const abs = path.resolve(chosen);
          if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
            return sendJson(res, 400, { error: 'Selected path is not a folder' });
          }
          if (abs === state.repoRoot) {
            return sendJson(res, 400, { error: 'That is the Small Software Cloud folder itself. Pick your project folder.' });
          }
          state.projectRoot = abs;
          state.gitignoreUpdated = ensureProjectConfig(abs).gitignoreUpdated;
          return sendJson(res, 200, {
            cancelled: false,
            selected: abs,
            ...projectPayload(),
            looksLikeProject: looksLikeProject(abs),
          });
        }

        if (url.pathname === '/api/project/overrides' && req.method === 'POST') {
          if (!state.projectRoot) return sendJson(res, 400, { error: 'No project selected' });
          const allowed = ['target', 'outputDir', 'buildCommand', 'originUrl', 'devCommand', 'devPort'];
          const overrides = {};
          for (const k of allowed) {
            if (body[k] !== undefined && body[k] !== null && body[k] !== '') overrides[k] = body[k];
          }
          if (overrides.target && !['static', 'url', 'port'].includes(overrides.target)) {
            return sendJson(res, 400, { error: 'Invalid target' });
          }
          if (overrides.originUrl) {
            try {
              const u = new URL(overrides.originUrl);
              if (!['http:', 'https:'].includes(u.protocol)) throw new Error();
            } catch { return sendJson(res, 400, { error: 'Origin URL must be http(s)' }); }
          }
          if (overrides.outputDir) {
            const outAbs = path.resolve(state.projectRoot, overrides.outputDir);
            if (outAbs !== state.projectRoot && !outAbs.startsWith(state.projectRoot + path.sep)) {
              return sendJson(res, 400, { error: 'Output folder must be inside the project' });
            }
          }
          if (overrides.devPort) overrides.devPort = Number(overrides.devPort) || undefined;
          saveProjectConfig(state.projectRoot, { overrides });
          return sendJson(res, 200, projectPayload());
        }

        if (url.pathname === '/api/project/reset' && req.method === 'POST') {
          if (!state.projectRoot) return sendJson(res, 400, { error: 'No project selected' });
          saveProjectConfig(state.projectRoot, { overrides: {} });
          return sendJson(res, 200, projectPayload());
        }

        if (url.pathname === '/api/gateway' && req.method === 'POST') {
          const update = {};
          if (body.gatewayUrl) {
            try { update.gatewayUrl = new URL(body.gatewayUrl).origin; } catch { return sendJson(res, 400, { error: 'Invalid gateway URL' }); }
          }
          if (body.apiKey) update.apiKey = String(body.apiKey);
          saveCredentials(update);
          return sendJson(res, 200, projectPayload());
        }

        if (url.pathname === '/api/gateway/health' && req.method === 'GET') {
          const { gatewayUrl } = loadCredentials();
          try {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), 3000);
            const r = await fetch(`${gatewayUrl}/api/health`, { signal: ctrl.signal });
            clearTimeout(t);
            return sendJson(res, 200, { ok: r.ok, status: r.status, url: gatewayUrl });
          } catch (e) {
            return sendJson(res, 200, { ok: false, error: e.name === 'AbortError' ? 'timeout' : e.message, url: gatewayUrl });
          }
        }

        if (url.pathname === '/api/project/build' && req.method === 'POST') {
          if (!state.projectRoot) return sendJson(res, 400, { error: 'No project selected' });
          const payload = projectPayload();
          const e = payload.effective;
          const { gatewayUrl } = loadCredentials();
          const shouldBuild = !!body.build;
          const projectId = getProjectId();

          try {
            const bundled = await packageProject({
              projectRoot: state.projectRoot,
              outputDir: e.outputDir,
              buildCommand: e.buildCommand,
              shouldBuild,
            });

            const uploaded = await uploadBundle({
              gatewayUrl,
              projectId,
              projectMeta: {
                id: projectId,
                name: payload.project?.name || projectId,
                framework: payload.project?.framework?.name || null,
                target: e.target,
                outputDir: e.outputDir,
                buildCommand: e.buildCommand,
                originUrl: e.originUrl,
                devCommand: e.devCommand,
                devPort: e.devPort,
              },
              bundleFiles: bundled.files,
            });

            state.initialSync = {
              synced: true,
              filesCount: bundled.filesCount,
              totalBytes: bundled.totalBytes,
              projectId,
            };

            return sendJson(res, 200, {
              ok: true,
              projectId,
              filesCount: bundled.filesCount,
              totalBytes: bundled.totalBytes,
              buildOutput: bundled.buildOutput,
              uploaded,
            });
          } catch (err) {
            return sendJson(res, 400, { error: err.message });
          }
        }

        if (url.pathname === '/api/links' && req.method === 'GET') {
          if (!state.projectRoot) return sendJson(res, 200, { links: [] });
          const projectId = getProjectId();
          const { gatewayUrl } = loadCredentials();
          try {
            const r = await fetch(`${gatewayUrl}/api/gateway/projects/${encodeURIComponent(projectId)}/links`);
            const data = await r.json();
            return sendJson(res, r.status, data);
          } catch (err) {
            return sendJson(res, 502, { error: 'Failed to reach gateway: ' + err.message });
          }
        }

        if (url.pathname === '/api/links' && req.method === 'POST') {
          if (!state.projectRoot) return sendJson(res, 400, { error: 'No project selected' });
          const projectId = getProjectId();
          const { gatewayUrl } = loadCredentials();
          try {
            const r = await fetch(`${gatewayUrl}/api/gateway/projects/${encodeURIComponent(projectId)}/links`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            const data = await r.json();
            return sendJson(res, r.status, data);
          } catch (err) {
            return sendJson(res, 502, { error: 'Failed to reach gateway: ' + err.message });
          }
        }

        if (url.pathname.startsWith('/api/links/') && url.pathname.endsWith('/revoke') && req.method === 'POST') {
          const linkId = url.pathname.slice('/api/links/'.length, -('/revoke'.length));
          const { gatewayUrl } = loadCredentials();
          try {
            const r = await fetch(`${gatewayUrl}/api/gateway/links/${encodeURIComponent(linkId)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            const data = await r.json();
            return sendJson(res, r.status, data);
          } catch (err) {
            return sendJson(res, 502, { error: 'Failed to reach gateway: ' + err.message });
          }
        }

        if (url.pathname === '/api/activity' && req.method === 'GET') {
          if (!state.projectRoot) return sendJson(res, 200, { events: [] });
          const projectId = getProjectId();
          const { gatewayUrl } = loadCredentials();
          try {
            const r = await fetch(`${gatewayUrl}/api/gateway/projects/${encodeURIComponent(projectId)}/activity`);
            const data = await r.json();
            return sendJson(res, r.status, data);
          } catch (err) {
            return sendJson(res, 502, { error: 'Failed to reach gateway: ' + err.message });
          }
        }

        return sendJson(res, 404, { error: 'Unknown endpoint' });
      }

      // 5. The dashboard page itself
      if (url.pathname === '/' || url.pathname === '/index.html') {
        if (!authed) return sendText(res, 401, LOCKED_PAGE, 'text/html; charset=utf-8');
        const html = fs.readFileSync(path.join(DASHBOARD_DIR, 'index.html'), 'utf8')
          .replace('__CSRF_TOKEN__', csrfToken);
        return sendText(res, 200, html, 'text/html; charset=utf-8');
      }

      return sendText(res, 404, 'Not found');
    } catch (err) {
      console.error('[dashboard] error:', err);
      if (!res.headersSent) sendJson(res, 500, { error: 'Internal error' });
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      resolve({ server, port, authUrl: `http://localhost:${port}/auth?t=${sessionToken}` });
    });
  });
}
