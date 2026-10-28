// ==============================================================================
// Small Software Cloud - App Versions API Route
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAppVersions, restoreVersion } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const versions = await getAppVersions(id);
    return NextResponse.json({ versions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, versionId, userId = 'usr_alice' } = body;

    if (action === 'restore' && versionId) {
      const app = await restoreVersion(id, versionId, userId);
      return NextResponse.json({ success: true, app });
    }

    return NextResponse.json({ error: 'Invalid version action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
