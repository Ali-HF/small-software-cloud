// ==============================================================================
// Small Software Cloud - Single App API Route
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  getApp,
  updateApp,
  deleteApp,
  duplicateApp,
  resolveUserByIdOrEmail,
} from '@/lib/storage';

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

    if (!app) {
      return NextResponse.json(
        {
          error:
            'Access Denied: You do not have permission to view this tool, or link sharing is disabled.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ app });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, link_access, userId = 'usr_alice' } = body;

    const updated = await updateApp(id, { title, link_access }, userId);
    return NextResponse.json({ app: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr_alice';

    await deleteApp(id, userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, userId = 'usr_alice' } = body;

    if (action === 'duplicate') {
      const duplicated = await duplicateApp(id, userId);
      return NextResponse.json({ app: duplicated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
