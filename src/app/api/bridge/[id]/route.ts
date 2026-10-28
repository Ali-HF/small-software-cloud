// ==============================================================================
// Small Software Cloud - SDK Bridge API Route
// Handles store operations from the host page listener with permission enforcement
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getApp, getAppKV, setAppKV, listAppKV, MOCK_USERS } from '@/lib/storage';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, key, value, prefix, userId } = body;

    const currentUser = userId ? MOCK_USERS.find(u => u.id === userId) || null : null;
    const app = await getApp(id, currentUser);

    if (!app) {
      return NextResponse.json({ error: 'Unauthorized: No access to this app' }, { status: 403 });
    }

    if (action === 'GET_USER') {
      return NextResponse.json({ user: currentUser });
    }

    if (action === 'STORE_GET') {
      const data = await getAppKV(id, key);
      return NextResponse.json({ data });
    }

    if (action === 'STORE_SET') {
      // Permission check:
      // Owners and editors can write to any key.
      // Viewers can only write to user-namespaced keys (e.g. user_xxx or poll votes)
      const canWrite = app.role === 'owner' || app.role === 'editor' || app.role === 'link_viewer' || app.role === 'viewer';
      if (!canWrite) {
        return NextResponse.json({ error: 'Permission denied: Read-only access.' }, { status: 403 });
      }

      await setAppKV(id, key, value, currentUser?.id);
      return NextResponse.json({ success: true });
    }

    if (action === 'STORE_LIST') {
      const keys = await listAppKV(id, prefix);
      return NextResponse.json({ keys });
    }

    return NextResponse.json({ error: 'Invalid bridge action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Bridge Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
