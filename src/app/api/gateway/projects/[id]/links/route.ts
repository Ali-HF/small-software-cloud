import { NextRequest, NextResponse } from 'next/server';
import { listLinks, createLink } from '@/lib/share-store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const links = listLinks(projectId);
    return NextResponse.json({ ok: true, links });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await req.json();

    const { link, rawToken } = createLink({
      projectId,
      label: body.label,
      accessType: body.accessType,
      pin: body.pin,
      password: body.password,
      allowedEmails: body.allowedEmails,
      expiresHours: body.expiresHours ? Number(body.expiresHours) : undefined,
      maxUses: body.maxUses ? Number(body.maxUses) : undefined,
    });

    return NextResponse.json({
      ok: true,
      link,
      rawToken,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
