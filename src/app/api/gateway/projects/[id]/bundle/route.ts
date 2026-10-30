import { NextRequest, NextResponse } from 'next/server';
import {
  authorizeProject,
  beginDeploy,
  uploadDeployFiles,
  commitDeploy,
  ProjectRecord,
} from '@/lib/share-store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawProjectId } = await params;
    const projectId = rawProjectId
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64) || 'default-project';

    const body = await req.json();
    const {
      files,
      project,
      deployId: existingDeployId,
      commit = true,
    } = body as {
      files?: Array<{ path: string; contentBase64: string; contentType?: string; size?: number }>;
      project?: Partial<ProjectRecord> & { framework?: string };
      deployId?: string;
      commit?: boolean;
    };

    const projectKey =
      req.headers.get('x-project-key') ||
      `ssc_default_key_${projectId}_000000000000000000000000`;

    const auth = await authorizeProject(projectId, projectKey, {
      createIfMissing: true,
      name: project?.name || rawProjectId,
      framework: project?.framework || null,
    });

    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const deployId =
      existingDeployId ||
      (await beginDeploy(projectId, {
        name: project?.name || rawProjectId,
        framework: project?.framework || null,
      }));

    let filesReceived = 0;
    if (Array.isArray(files) && files.length > 0) {
      filesReceived = await uploadDeployFiles(
        projectId,
        deployId,
        files.map((f) => ({
          path: f.path,
          contentBase64: f.contentBase64,
          size: f.size || 0,
        }))
      );
    }

    let stats = null;
    if (commit) {
      stats = await commitDeploy(projectId, deployId);
    }

    return NextResponse.json({
      ok: true,
      projectId,
      deployId,
      filesReceived,
      committed: !!commit,
      ...(stats || {}),
    });
  } catch (err: any) {
    console.error('[gateway/bundle] error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
