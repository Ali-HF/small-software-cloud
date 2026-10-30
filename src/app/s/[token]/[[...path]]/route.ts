import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  findLinkByToken,
  recordEvent,
  recordLinkUse,
  getBundleFile,
  hashSecret,
} from '@/lib/share-store';

function challengeHtml(opts: {
  token: string;
  label: string;
  type: 'pin' | 'password' | 'email';
  error?: string;
}) {
  const titleText =
    opts.type === 'pin'
      ? 'Enter Security PIN'
      : opts.type === 'email'
      ? 'Verify Authorized Email'
      : 'Enter Access Password';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${opts.label || 'Protected Share'} · Small Software Cloud</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap">
  <style>
    :root {
      --bg-canvas: #f8fafc;
      --bg-surface: #ffffff;
      --bg-subtle: #f1f5f9;
      --border-default: #e2e8f0;
      --text-primary: #0f172a;
      --text-secondary: #334155;
      --text-muted: #64748b;
      --accent: #2563eb;
      --accent-hover: #1d4ed8;
      --accent-subtle: #eff6ff;
      --accent-border: #bfdbfe;
      --status-restricted-bg: #fffbeb;
      --status-restricted-text: #b45309;
      --status-restricted-border: #fde68a;
      --status-revoked-bg: #fef2f2;
      --status-revoked-text: #b91c1c;
      --status-revoked-border: #fecaca;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-canvas: #0b0f17;
        --bg-surface: #111827;
        --bg-subtle: #1e293b;
        --border-default: #1f2937;
        --text-primary: #f8fafc;
        --text-secondary: #cbd5e1;
        --text-muted: #94a3b8;
        --accent: #3b82f6;
        --accent-hover: #2563eb;
        --accent-subtle: rgba(59, 130, 246, 0.12);
        --accent-border: rgba(59, 130, 246, 0.3);
        --status-restricted-bg: rgba(245, 158, 11, 0.12);
        --status-restricted-text: #fbbf24;
        --status-restricted-border: rgba(245, 158, 11, 0.3);
        --status-revoked-bg: rgba(239, 68, 68, 0.12);
        --status-revoked-text: #f87171;
        --status-revoked-border: rgba(239, 68, 68, 0.3);
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--bg-canvas);
      color: var(--text-primary);
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
    }
    .card {
      width: 100%;
      max-width: 420px;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: 12px;
      padding: 28px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .badge {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 999px;
      background: var(--status-restricted-bg);
      color: var(--status-restricted-text);
      border: 1px solid var(--status-restricted-border);
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 6px; }
    p { font-size: 13px; color: var(--text-muted); line-height: 1.5; }
    form { display: flex; flex-direction: column; gap: 16px; }
    label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
    input {
      width: 100%;
      background: var(--bg-canvas);
      border: 1px solid var(--border-default);
      color: var(--text-primary);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 14px;
      font-family: ${opts.type === 'pin' ? "'JetBrains Mono', monospace" : 'inherit'};
      letter-spacing: ${opts.type === 'pin' ? '0.25em' : 'normal'};
      text-align: ${opts.type === 'pin' ? 'center' : 'left'};
      outline: none;
      transition: border-color .15s, box-shadow .15s;
    }
    input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 2px var(--accent-subtle);
    }
    .btn {
      all: unset;
      cursor: pointer;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      text-align: center;
      background: var(--accent);
      color: #ffffff;
      transition: background .15s, transform .1s;
    }
    .btn:hover { background: var(--accent-hover); }
    .btn:active { transform: scale(0.99); }
    .error {
      background: var(--status-revoked-bg);
      border: 1px solid var(--status-revoked-border);
      color: var(--status-revoked-text);
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
    }
    .foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-muted);
      border-top: 1px solid var(--border-default);
      padding-top: 14px;
    }
    .mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> Restricted Access</div>
    <div>
      <h1>${opts.label || titleText}</h1>
      <p>This shared application is protected by access controls. Provide your ${
        opts.type === 'pin'
          ? 'security PIN'
          : opts.type === 'email'
          ? 'authorized email address'
          : 'password'
      } to continue.</p>
    </div>
    ${opts.error ? `<div class="error" role="alert">${opts.error}</div>` : ''}
    <form method="POST" action="/s/${opts.token}">
      <div>
        <label for="secret">${titleText}</label>
        <input
          id="secret"
          name="secret"
          type="${
            opts.type === 'pin'
              ? 'text'
              : opts.type === 'email'
              ? 'email'
              : 'password'
          }"
          ${opts.type === 'pin' ? 'inputmode="numeric"' : ''}
          required
          autofocus
          autocomplete="off"
          placeholder="${
            opts.type === 'pin'
              ? '••••'
              : opts.type === 'email'
              ? 'you@company.com'
              : 'Enter password'
          }"
        >
      </div>
      <button class="btn" type="submit">Verify &amp; Open Application</button>
    </form>
    <div class="foot">
      <span>Small Software Cloud</span>
      <span class="mono">SHA-256 Gate</span>
    </div>
  </div>
</body>
</html>`;
}

function errorHtml(
  title: string,
  message: string,
  code = 403,
  statusVariant: 'expired' | 'revoked' = 'revoked'
) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${title} · Small Software Cloud</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap">
  <style>
    :root {
      --bg-canvas: #f8fafc;
      --bg-surface: #ffffff;
      --border-default: #e2e8f0;
      --text-primary: #0f172a;
      --text-muted: #64748b;
      --badge-bg: ${statusVariant === 'expired' ? '#f1f5f9' : '#fef2f2'};
      --badge-text: ${statusVariant === 'expired' ? '#475569' : '#b91c1c'};
      --badge-border: ${statusVariant === 'expired' ? '#cbd5e1' : '#fecaca'};
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-canvas: #0b0f17;
        --bg-surface: #111827;
        --border-default: #1f2937;
        --text-primary: #f8fafc;
        --text-muted: #94a3b8;
        --badge-bg: ${
          statusVariant === 'expired'
            ? 'rgba(148, 163, 184, 0.12)'
            : 'rgba(239, 68, 68, 0.12)'
        };
        --badge-text: ${statusVariant === 'expired' ? '#94a3b8' : '#f87171'};
        --badge-border: ${
          statusVariant === 'expired'
            ? 'rgba(148, 163, 184, 0.28)'
            : 'rgba(239, 68, 68, 0.3)'
        };
      }
    }
    body {
      background: var(--bg-canvas);
      color: var(--text-primary);
      font-family: 'Inter', system-ui, sans-serif;
      display: grid;
      place-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
    }
    .card {
      max-width: 420px;
      width: 100%;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: 12px;
      padding: 28px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 999px;
      background: var(--badge-bg);
      color: var(--badge-text);
      border: 1px solid var(--badge-border);
      margin-bottom: 16px;
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.02em; }
    p { font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0 0 20px 0; }
    .foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 14px;
      border-top: 1px solid var(--border-default);
      font-size: 11px;
      color: var(--text-muted);
    }
    .code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: var(--badge-text);
      background: var(--badge-bg);
      padding: 2px 8px;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> ${
      statusVariant === 'expired' ? 'Expired' : 'Revoked / Denied'
    }</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="foot">
      <span>Small Software Cloud</span>
      <span class="code">HTTP ${code}</span>
    </div>
  </div>
</body>
</html>`;
}

function getAuthCookieName(linkId: string) {
  return `ssc_auth_${linkId}`;
}

function computeAuthToken(linkId: string, tokenHash: string) {
  return crypto
    .createHmac('sha256', tokenHash)
    .update(`authed_${linkId}`)
    .digest('hex');
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; path?: string[] }> }
) {
  const { token, path: pathSegments } = await params;
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  const link = findLinkByToken(token);
  if (!link) {
    return new NextResponse(
      errorHtml(
        'Link Not Found',
        'This share link does not exist or has been removed.',
        404,
        'revoked'
      ),
      {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  // Check revocation
  if (link.isRevoked) {
    recordEvent({
      linkId: link.id,
      projectId: link.projectId,
      linkLabel: link.label,
      status: 'revoked',
      reason: 'Link has been revoked by owner',
      ip,
      userAgent,
    });
    return new NextResponse(
      errorHtml(
        'Link Revoked',
        'The owner has revoked this link. Access is no longer permitted.',
        403,
        'revoked'
      ),
      {
        status: 403,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  // Check expiration
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    recordEvent({
      linkId: link.id,
      projectId: link.projectId,
      linkLabel: link.label,
      status: 'expired',
      reason: 'Link expiry time passed',
      ip,
      userAgent,
    });
    return new NextResponse(
      errorHtml(
        'Link Expired',
        'This link has passed its expiration window and is no longer accessible.',
        410,
        'expired'
      ),
      {
        status: 410,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  // Check max uses limit
  if (link.maxUses && link.useCount >= link.maxUses) {
    recordEvent({
      linkId: link.id,
      projectId: link.projectId,
      linkLabel: link.label,
      status: 'denied',
      reason: 'Max view limit reached',
      ip,
      userAgent,
    });
    return new NextResponse(
      errorHtml(
        'Usage Limit Reached',
        'This link has reached its maximum allowed open count.',
        410,
        'expired'
      ),
      {
        status: 410,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  // Check challenge requirements (PIN, Password, or Email Allowlist)
  const isProtected =
    link.accessType === 'pin' ||
    link.accessType === 'password' ||
    link.accessType === 'email';
  if (isProtected) {
    const cookieVal = req.cookies.get(getAuthCookieName(link.id))?.value;
    const expectedAuth = computeAuthToken(link.id, link.tokenHash);
    if (cookieVal !== expectedAuth) {
      recordEvent({
        linkId: link.id,
        projectId: link.projectId,
        linkLabel: link.label,
        status: 'challenge',
        reason: 'Awaiting credential challenge',
        ip,
        userAgent,
      });
      return new NextResponse(
        challengeHtml({
          token,
          label: link.label,
          type: link.accessType as 'pin' | 'password' | 'email',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    }
  }

  // Passed all checks!
  const relPath = pathSegments ? pathSegments.join('/') : 'index.html';
  const file = getBundleFile(link.projectId, relPath);

  if (!file) {
    return new NextResponse(
      errorHtml(
        'File Not Found',
        `The requested resource "${relPath}" was not found in the project bundle.`,
        404,
        'revoked'
      ),
      {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  // Record access and increment use count on main page view
  if (!pathSegments || pathSegments.length === 0 || relPath === 'index.html') {
    recordLinkUse(link.id);
    recordEvent({
      linkId: link.id,
      projectId: link.projectId,
      linkLabel: link.label,
      status: 'allowed',
      ip,
      userAgent,
    });
  }

  return new NextResponse(new Uint8Array(file.content), {
    status: 200,
    headers: {
      'Content-Type': file.contentType,
      'Content-Security-Policy':
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://fonts.googleapis.com https://fonts.gstatic.com;",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
      'X-Share-Role': 'viewer',
      'Cache-Control': 'no-cache',
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  const link = findLinkByToken(token);
  if (!link) {
    return new NextResponse(
      errorHtml('Link Not Found', 'This link does not exist.', 404, 'revoked'),
      {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  const formData = await req.formData().catch(() => null);
  const secret = formData?.get('secret')?.toString().trim() || '';

  let isValid = false;
  if (link.accessType === 'pin' && link.pin) {
    isValid = secret === link.pin;
  } else if (link.accessType === 'password' && link.passwordHash) {
    isValid = hashSecret(secret) === link.passwordHash;
  } else if (link.accessType === 'email' && Array.isArray(link.allowedEmails)) {
    isValid = link.allowedEmails.some(
      (e) => e.trim().toLowerCase() === secret.toLowerCase()
    );
  }

  if (!isValid) {
    recordEvent({
      linkId: link.id,
      projectId: link.projectId,
      linkLabel: link.label,
      status: 'denied',
      reason: `Failed ${link.accessType} challenge`,
      ip,
      userAgent,
    });
    return new NextResponse(
      challengeHtml({
        token,
        label: link.label,
        type: link.accessType as 'pin' | 'password' | 'email',
        error:
          link.accessType === 'email'
            ? 'Email address is not on the authorized allowlist for this link.'
            : `Incorrect ${
                link.accessType === 'pin' ? 'PIN' : 'password'
              }. Please try again.`,
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  // Correct secret! Set HttpOnly cookie and redirect cleanly to /s/[token]
  const cookieVal = computeAuthToken(link.id, link.tokenHash);
  const cookieName = getAuthCookieName(link.id);

  const res = NextResponse.redirect(new URL(`/s/${token}`, req.url), 303);
  res.cookies.set(cookieName, cookieVal, {
    httpOnly: true,
    sameSite: 'lax',
    path: `/s/${token}`,
    maxAge: 7 * 24 * 3600, // 7 days
  });

  return res;
}
