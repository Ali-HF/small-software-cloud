// ==============================================================================
// Small Software Cloud - Apps Collection API Route
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getApps, getSharedApps, createApp } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || 'my';
    const userId = searchParams.get('userId') || 'usr_alice';
    const email = searchParams.get('email') || 'alice@example.com';

    if (tab === 'shared') {
      const sharedApps = await getSharedApps(email);
      return NextResponse.json({ apps: sharedApps });
    } else {
      const myApps = await getApps(userId);
      return NextResponse.json({ apps: myApps });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, prompt, html, ownerId = 'usr_alice' } = body;

    if (!title || !html) {
      return NextResponse.json(
        { error: 'title and html are required' },
        { status: 400 }
      );
    }

    const newApp = await createApp(title, prompt || 'Custom created tool', html, ownerId);
    return NextResponse.json({ app: newApp });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
