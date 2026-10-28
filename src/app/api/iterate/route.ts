// ==============================================================================
// Small Software Cloud - Iterate Tool API Route
// Modifies an existing HTML app via Claude and tracks version history
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { iterateAppHtml } from '@/lib/ai-generator';
import { createAppVersion } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentHtml, instruction, appId, userId = 'usr_alice' } = body;

    if (!currentHtml || !instruction) {
      return NextResponse.json(
        { error: 'currentHtml and instruction are required' },
        { status: 400 }
      );
    }

    const updatedHtml = await iterateAppHtml(currentHtml, instruction.trim());

    let version = null;
    if (appId) {
      version = await createAppVersion(appId, instruction.trim(), updatedHtml, userId);
    }

    return NextResponse.json({
      success: true,
      html: updatedHtml,
      version
    });
  } catch (error: any) {
    console.error('[API Iterate Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Iteration failed' },
      { status: 500 }
    );
  }
}
