// ==============================================================================
// Small Software Cloud - Iterate Tool API Route
// Modifies an existing HTML app via Claude and tracks version history
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { iterateAppHtml } from '@/lib/ai-generator';
import {
  createAppVersion,
  getApp,
  resolveUserByIdOrEmail,
  checkRateLimit,
  MAX_HTML_BYTES,
} from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      currentHtml: bodyHtml,
      instruction,
      appId,
      userId = 'usr_alice',
      userEmail,
    } = body;

    if (!instruction || typeof instruction !== 'string' || !instruction.trim()) {
      return NextResponse.json(
        { error: 'Instruction is required' },
        { status: 400 }
      );
    }

    if (instruction.length > 4000) {
      return NextResponse.json(
        { error: 'Instruction exceeds maximum length of 4000 characters' },
        { status: 400 }
      );
    }

    const rate = checkRateLimit(`iter:${userId}`, 15, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Please wait ${rate.retryAfterSeconds}s before iterating again.`,
        },
        { status: 429 }
      );
    }

    let sourceHtml = bodyHtml;
    if (!sourceHtml && appId) {
      const user = resolveUserByIdOrEmail(userId, userEmail);
      const app = await getApp(appId, user);
      if (!app) {
        return NextResponse.json(
          { error: 'App not found or access denied' },
          { status: 404 }
        );
      }
      sourceHtml = app.current_version?.html || '';
    }

    if (!sourceHtml) {
      return NextResponse.json(
        { error: 'currentHtml or valid appId is required' },
        { status: 400 }
      );
    }

    let updatedHtml = await iterateAppHtml(sourceHtml, instruction.trim());
    if (Buffer.byteLength(updatedHtml, 'utf8') > MAX_HTML_BYTES) {
      updatedHtml = updatedHtml.slice(0, MAX_HTML_BYTES);
    }

    let version = null;
    if (appId) {
      version = await createAppVersion(
        appId,
        instruction.trim(),
        updatedHtml,
        userId
      );
    }

    return NextResponse.json({
      success: true,
      html: updatedHtml,
      version,
    });
  } catch (error: any) {
    console.error('[API Iterate Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Iteration failed' },
      { status: 500 }
    );
  }
}
