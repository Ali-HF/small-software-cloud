// ==============================================================================
// Small Software Cloud - Sandboxed Embed Route
// Serves the single-file HTML app with Injected SDK and Strict Content Security Policy
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getApp, resolveUserByIdOrEmail } from '@/lib/storage';
import { injectSDKIntoHtml } from '@/lib/sdk-script';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('email');

    const currentUser = resolveUserByIdOrEmail(userId, userEmail);
    const app = await getApp(id, currentUser);

    if (!app || !app.current_version) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="en">
        <head><meta charset="utf-8"><title>Access Restricted</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0b0f17; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .card { background: #111827; padding: 2rem; border-radius: 12px; border: 1px solid #1e293b; max-width: 400px; }
          h2 { margin: 0 0 0.5rem 0; color: #f87171; font-size: 1.125rem; }
          p { color: #94a3b8; font-size: 0.875rem; line-height: 1.5; margin: 0; }
        </style>
        </head>
        <body>
          <div class="card">
            <h2>Access Restricted</h2>
            <p>You do not have permission to view this tool, or link sharing has not been enabled by the owner.</p>
          </div>
        </body>
        </html>`,
        {
          status: 403,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    }

    // Inject the Cloud SDK script into the raw HTML app
    const htmlWithSdk = injectSDKIntoHtml(app.current_version.html);

    // Strict Content Security Policy (CSP) per prompt.md security requirements:
    // Disables external outbound fetch/xhr/websockets to third-party endpoints,
    // restricts script execution to inline sandbox, allows Google Fonts and safe images.
    const cspHeader = [
      "default-src 'none'",
      "script-src 'unsafe-inline'",
      "style-src 'unsafe-inline' https://fonts.googleapis.com",
      "font-src https://fonts.gstatic.com data:",
      "img-src data: https: blob:",
      "connect-src 'none'", // Block outbound network calls from untrusted iframe
      "frame-ancestors *",
    ].join('; ');

    return new NextResponse(htmlWithSdk, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': cspHeader,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    return new NextResponse('Internal server error', { status: 500 });
  }
}
