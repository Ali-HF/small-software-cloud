import { NextRequest, NextResponse } from 'next/server';
import { listLinks, createLink, authorizeProject, publicLink } from '@/lib/share-store';

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
    const links = await listLinks(projectId);
    return NextResponse.json({ ok: true, links: links.map(publicLink) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const projectId = normalizeProjectId(rawId);
    const body = await req.json();

    const projectKey =
      req.headers.get('x-project-key') ||
      `ssc_default_key_${projectId}_000000000000000000000000`;

    // Ensure the project row exists in share_projects so foreign key on share_links succeeds
    await authorizeProject(projectId, projectKey, {
      createIfMissing: true,
      name: rawId,
    });

    const { link, rawToken } = await createLink({
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
      link: publicLink(link),
      rawToken,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
