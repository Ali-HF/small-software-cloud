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
  type: 'pin' | 'password';
  error?: string;
}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Access Protected Project</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap">
  <style>
    :root {
      --bg: #07090f;
      --card: #111725;
      --border: #1f2940;
      --border-focus: #7c6cff;
      --accent: #7c6cff;
      --accent-hover: #6956ff;
      --text: #e8ecf5;
      --muted: #8a94ad;
      --red: #f87171;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: radial-gradient(1000px 500px at 50% -10%, rgba(124,108,255,0.15), transparent 70%), var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 20px;
    }
    .card {
      width: 100%;
      max-width: 420px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px 28px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .badge {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .05em;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(124,108,255,0.14);
      color: #a594ff;
    }
    h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    p { font-size: 13px; color: var(--muted); line-height: 1.5; }
    form { display: flex; flex-direction: column; gap: 14px; }
    label { font-size: 12px; font-weight: 600; color: var(--muted); }
    input {
      width: 100%;
      background: #07090f;
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 15px;
      font-family: ${opts.type === 'pin' ? "'JetBrains Mono', monospace" : 'inherit'};
      letter-spacing: ${opts.type === 'pin' ? '0.25em' : 'normal'};
      text-align: ${opts.type === 'pin' ? 'center' : 'left'};
      outline: none;
      transition: border-color .15s;
    }
    input:focus { border-color: var(--border-focus); box-shadow: 0 0 0 1px var(--border-focus); }
    .btn {
      all: unset;
      cursor: pointer;
      padding: 12px 18px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
      background: linear-gradient(135deg, var(--accent), #5b4cf0);
      color: #fff;
      box-shadow: 0 6px 18px rgba(124,108,255,0.3);
      transition: filter .15s, transform .1s;
    }
    .btn:hover { filter: brightness(1.08); }
    .btn:active { transform: scale(0.98); }
    .error {
      background: rgba(248,113,113,0.1);
      border: 1px solid rgba(248,113,113,0.3);
      color: var(--red);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
    }
    .foot {
      text-align: center;
      font-size: 11px;
      color: var(--muted);
      border-top: 1px solid var(--border);
      padding-top: 14px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🔒 Protected Share</div>
    <div>
      <h1>${opts.label || 'Project Access'}</h1>
      <p>This project is protected by access controls. Enter the ${opts.type === 'pin' ? 'PIN code' : 'password'} to continue.</p>
    </div>
    ${opts.error ? `<div class="error">${opts.error}</div>` : ''}
    <form method="POST" action="/s/${opts.token}">
      <div>
        <label for="secret">${opts.type === 'pin' ? 'Security PIN' : 'Password'}</label>
        <input
          id="secret"
          name="secret"
          type="${opts.type === 'pin' ? 'number' : 'password'}"
          required
          autofocus
          autocomplete="off"
          placeholder="${opts.type === 'pin' ? '••••' : 'Enter password'}"
        >
      </div>
      <button class="btn" type="submit">Unlock Project</button>
    </form>
    <div class="foot">Secured by Small Software Cloud</div>
  </div>
</body>
</html>`;
}

function errorHtml(title: string, message: string, code = 403) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title} · Small Software Cloud</title>
  <style>
    body { background: #07090f; color: #e8ecf5; font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; }
    .card { max-width: 420px; text-align: center; background: #111725; border: 1px solid #1f2940; border-radius: 16px; padding: 36px 28px; }
    h1 { font-size: 22px; margin-bottom: 8px; }
    p { font-size: 14px; color: #8a94ad; line-height: 1.5; margin-bottom: 20px; }
    .code { font-family: monospace; font-size: 11px; color: #7c6cff; background: rgba(124,108,255,0.1); padding: 3px 8px; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 32px; margin-bottom: 12px;">🚫</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <span class="code">HTTP ${code}</span>
  </div>
</body>
</html>`;
}

function getAuthCookieName(linkId: string) {
  return `ssc_auth_${linkId}`;
}

function computeAuthToken(linkId: string, tokenHash: string) {
  return crypto.createHmac('sha256', tokenHash).update(`authed_${linkId}`).digest('hex');
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
    return new NextResponse(errorHtml('Link Not Found', 'This share link does not exist or has been removed.', 404), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
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
    return new NextResponse(errorHtml('Link Revoked', 'The owner has revoked this link. Access is no longer permitted.', 403), {
      status: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
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
    return new NextResponse(errorHtml('Link Expired', 'This link has expired and is no longer accessible.', 410), {
      status: 410,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
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
    return new NextResponse(errorHtml('Limit Reached', 'This link has reached its maximum allowed view limit.', 410), {
      status: 410,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Check challenge requirements (PIN or Password)
  const isProtected = link.accessType === 'pin' || link.accessType === 'password';
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
          type: link.accessType as 'pin' | 'password',
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
    return new NextResponse(errorHtml('File Not Found', `The requested resource "${relPath}" was not found in the project bundle.`, 404), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
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
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://fonts.googleapis.com https://fonts.gstatic.com;",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
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
    return new NextResponse(errorHtml('Link Not Found', 'This link does not exist.', 404), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const formData = await req.formData().catch(() => null);
  const secret = formData?.get('secret')?.toString().trim() || '';

  let isValid = false;
  if (link.accessType === 'pin' && link.pin) {
    isValid = secret === link.pin;
  } else if (link.accessType === 'password' && link.passwordHash) {
    isValid = hashSecret(secret) === link.passwordHash;
  }

  if (!isValid) {
    recordEvent({
      linkId: link.id,
      projectId: link.projectId,
      linkLabel: link.label,
      status: 'denied',
      reason: 'Incorrect PIN or password',
      ip,
      userAgent,
    });
    return new NextResponse(
      challengeHtml({
        token,
        label: link.label,
        type: link.accessType as 'pin' | 'password',
        error: `Incorrect ${link.accessType === 'pin' ? 'PIN' : 'password'}. Please try again.`,
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
