// ==============================================================================
// Small Software Cloud - Sandboxed Embed Route
// Serves the single-file HTML app with Injected SDK and Strict Content Security Policy
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getApp, MOCK_USERS } from '@/lib/storage';
import { injectSDKIntoHtml } from '@/lib/sdk-script';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const currentUser = userId ? MOCK_USERS.find(u => u.id === userId) || null : null;
    const app = await getApp(id, currentUser);

    if (!app || !app.current_version) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head><title>Access Denied</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .card { background: #151c2e; padding: 2rem; border-radius: 1rem; border: 1px solid #242f49; max-width: 400px; }
          h2 { margin: 0 0 0.5rem 0; color: #f87171; }
          p { color: #94a3b8; font-size: 0.9rem; }
        </style>
        </head>
        <body>
          <div class="card">
            <h2>🔒 Access Restricted</h2>
            <p>You do not have permission to view this tool, or link sharing has not been enabled by the owner.</p>
          </div>
        </body>
        </html>`,
        {
          status: 403,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
    }

    // Inject the Cloud SDK script into the raw HTML app
    const htmlWithSdk = injectSDKIntoHtml(app.current_version.html);

    // Strict Content Security Policy (CSP) per prompt.md security requirements:
    // Disables external outbound fetch/xhr to third-party endpoints,
    // restricts script execution to inline sandbox, allows Google Fonts and safe images.
    const cspHeader = [
      "default-src 'none'",
      "script-src 'unsafe-inline'",
      "style-src 'unsafe-inline' https://fonts.googleapis.com",
      "font-src https://fonts.gstatic.com data:",
      "img-src data: https: blob:",
      "connect-src 'none'", // No outbound network from inside untrusted iframe!
      "frame-ancestors *"
    ].join('; ');

    return new NextResponse(htmlWithSdk, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': cspHeader,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error: any) {
    return new NextResponse('Internal server error', { status: 500 });
  }
}
