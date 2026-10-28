import { NextRequest, NextResponse } from 'next/server';
import { listEvents } from '@/lib/share-store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const events = listEvents(projectId);
    return NextResponse.json({ ok: true, events });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
