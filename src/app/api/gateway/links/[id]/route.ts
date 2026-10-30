import { NextRequest, NextResponse } from 'next/server';
import { revokeLink, getLink, publicLink } from '@/lib/share-store';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: linkId } = await params;
    const link = await revokeLink(linkId);
    if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    return NextResponse.json({ ok: true, link: publicLink(link) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Supports POST /api/gateway/links/:id (or /revoke)
  try {
    const { id: linkId } = await params;
    const link = await revokeLink(linkId);
    if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    return NextResponse.json({ ok: true, link: publicLink(link) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: linkId } = await params;
    const link = await getLink(linkId);
    if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    return NextResponse.json({ ok: true, link: publicLink(link) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
