// ==============================================================================
// Small Software Cloud - Generate Tool API Route
// Server-side route calling Claude 3.5 Sonnet (API key never exposed to client)
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateAppHtml } from '@/lib/ai-generator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Rate-limiting / size cap safety per prompt.md specifications
    if (prompt.length > 4000) {
      return NextResponse.json(
        { error: 'Prompt exceeds maximum allowed length of 4000 characters' },
        { status: 400 }
      );
    }

    const html = await generateAppHtml(prompt.trim());

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
      title
    });
  } catch (error: any) {
    console.error('[API Generate Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}
