import { NextRequest, NextResponse } from 'next/server';
import { saveBundle, ProjectRecord, saveProject } from '@/lib/share-store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await req.json();
    const { files, project } = body as {
      files: Array<{ path: string; contentBase64: string; contentType?: string; size?: number }>;
      project?: Partial<ProjectRecord>;
    };

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'No files provided in bundle' }, { status: 400 });
    }

    if (project) {
      saveProject({
        id: projectId,
        name: project.name || projectId,
        target: 'static',
        outputDir: project.outputDir,
        buildCommand: project.buildCommand,
        originUrl: project.originUrl,
        devCommand: project.devCommand,
        devPort: project.devPort,
        updatedAt: new Date().toISOString(),
      });
    }

    saveBundle(
      projectId,
      files.map((f) => ({
        path: f.path,
        contentBase64: f.contentBase64,
        contentType: f.contentType || 'application/octet-stream',
        size: f.size || 0,
      }))
    );

    return NextResponse.json({
      ok: true,
      projectId,
      filesReceived: files.length,
    });
  } catch (err: any) {
    console.error('[gateway/bundle] error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
