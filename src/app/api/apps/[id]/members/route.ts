// ==============================================================================
// Small Software Cloud - App Members / Sharing API Route
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAppMembers, addAppMember, removeAppMember, updateAppMemberRole } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const members = await getAppMembers(id);
    return NextResponse.json({ members });
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
    const { email, role = 'viewer', userId = 'usr_alice' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const member = await addAppMember(id, email, role, userId);
    return NextResponse.json({ member });
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
    const memberId = searchParams.get('memberId');
    const userId = searchParams.get('userId') || 'usr_alice';

    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
    }

    await removeAppMember(id, memberId, userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { memberId, role, userId = 'usr_alice' } = body;

    if (!memberId || !role) {
      return NextResponse.json({ error: 'memberId and role are required' }, { status: 400 });
    }

    const updated = await updateAppMemberRole(id, memberId, role, userId);
    return NextResponse.json({ member: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
