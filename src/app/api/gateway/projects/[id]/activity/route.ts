import { NextRequest, NextResponse } from 'next/server';
import { listEvents } from '@/lib/share-store';

function normalizeProjectId(raw: string): string {
  return (
    raw
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64) || 'default-project'
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const projectId = normalizeProjectId(rawId);
    const events = await listEvents(projectId);
    return NextResponse.json({ ok: true, events });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
