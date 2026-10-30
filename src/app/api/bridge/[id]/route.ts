// ==============================================================================
// Small Software Cloud - SDK Bridge API Route
// Handles store operations from the host page listener with strict role enforcement
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  getApp,
  getAppKV,
  setAppKV,
  listAppKV,
  resolveUserByIdOrEmail,
} from '@/lib/storage';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, key, value, prefix, userId, userEmail } = body;

    const currentUser = resolveUserByIdOrEmail(userId, userEmail);
    const app = await getApp(id, currentUser);

    if (!app) {
      return NextResponse.json(
        { error: 'Unauthorized: No access to this app' },
        { status: 403 }
      );
    }

    if (action === 'GET_USER') {
      return NextResponse.json({ user: currentUser, role: app.role });
    }

    if (action === 'STORE_GET') {
      const data = await getAppKV(id, key);
      return NextResponse.json({ data });
    }

    if (action === 'STORE_SET') {
      // Strict Role-Based Access Control per prompt.md:
      // - Owners and editors can write to any key.
      // - Viewers and anonymous link_viewers cannot overwrite shared state keys
      //   (they may only write to per-user keys prefixed with `user_<id>` if authenticated).
      const isEditorOrOwner = app.role === 'owner' || app.role === 'editor';
      const isPerUserViewerKey =
        (app.role === 'viewer' || app.role === 'link_viewer') &&
        currentUser?.id &&
        typeof key === 'string' &&
        key.startsWith(`user_${currentUser.id}`);

      if (!isEditorOrOwner && !isPerUserViewerKey) {
        return NextResponse.json(
          {
            error:
              'Permission denied: Invited viewers have read-only access. Only Owners and Editors can modify shared state.',
          },
          { status: 403 }
        );
      }

      await setAppKV(id, key, value, currentUser?.id);
      return NextResponse.json({ success: true });
    }

    if (action === 'STORE_LIST') {
      const keys = await listAppKV(id, prefix);
      return NextResponse.json({ keys });
    }

    return NextResponse.json(
      { error: 'Invalid bridge action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Bridge Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
