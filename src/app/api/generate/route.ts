// ==============================================================================
// Small Software Cloud - Generate Tool API Route
// Server-side route calling Claude 3.5 Sonnet (API key never exposed to client)
// Includes per-user rate limiting and HTML size cap enforcement
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateAppHtml } from '@/lib/ai-generator';
import { checkRateLimit, MAX_HTML_BYTES } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, userId = 'usr_alice' } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (prompt.length > 4000) {
      return NextResponse.json(
        { error: 'Prompt exceeds maximum allowed length of 4000 characters' },
        { status: 400 }
      );
    }

    // Per-user rate limit check
    const ip = req.headers.get('x-forwarded-for') || 'local';
    const rateKey = `gen:${userId}:${ip}`;
    const rate = checkRateLimit(rateKey, 15, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Please wait ${rate.retryAfterSeconds}s before generating again.`,
        },
        { status: 429 }
      );
    }

    let html = await generateAppHtml(prompt.trim());

    // Cap HTML size
    if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) {
      html = html.slice(0, MAX_HTML_BYTES);
    }

    // Extract title from HTML or prompt
    let title = 'New Tool';
    const match = html.match(/<title>(.*?)<\/title>/i);
    if (match && match[1]) {
      title = match[1].trim();
    } else {
      title = prompt.length > 40 ? prompt.substring(0, 40) + '...' : prompt;
    }

    return NextResponse.json({
      success: true,
      html,
      title,
    });
  } catch (error: any) {
    console.error('[API Generate Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}
