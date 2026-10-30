// Project packager and uploader for Small Software Cloud CLI.
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';

const IGNORED_NAMES = new Set([
  '.git',
  '.share',
  'node_modules',
  '.next',
  '.turbo',
  'dist_temp',
  '.vercel',
  'small-software-cloud',
  'cloud',
]);

const MAX_BUNDLE_BYTES = 40 * 1024 * 1024; // 40MB safety limit
const CHUNK_MAX_BYTES = 2 * 1024 * 1024;   // 2MB raw bytes per HTTP chunk (well under Vercel 4.5MB limit)

export function runBuildCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    if (!command || !command.trim()) return resolve({ skipped: true, stdout: '', stderr: '' });
    exec(command, { cwd, maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`Build failed: ${err.message}\n${stderr || stdout}`));
      resolve({ skipped: false, stdout, stderr });
    });
  });
}

function walkDir(dir, baseDir = dir, ignoreSet = IGNORED_NAMES) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    if (ignoreSet.has(item.name)) continue;
    const absPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...walkDir(absPath, baseDir, ignoreSet));
    } else if (item.isFile()) {
      const relPath = path.relative(baseDir, absPath).replace(/\\/g, '/');
      results.push({ absPath, relPath, size: fs.statSync(absPath).size });
    }
  }
  return results;
}

/**
 * Collect static bundle files from a standard Next.js `.next` build folder
 * (when `out/index.html` isn't used because `output: 'export'` wasn't configured).
 */
function collectNextBuildFiles(projectRoot) {
  const entries = [];
  const nextDir = path.join(projectRoot, '.next');
  const appServerDir = path.join(nextDir, 'server', 'app');
  const pagesServerDir = path.join(nextDir, 'server', 'pages');
  const staticDir = path.join(nextDir, 'static');
  const publicDir = path.join(projectRoot, 'public');

  // 1. Collect HTML/RSC files from .next/server/app
  if (fs.existsSync(appServerDir)) {
    const serverFiles = walkDir(appServerDir, appServerDir, new Set(['api']));
    for (const f of serverFiles) {
      if (f.relPath.endsWith('.html') || f.relPath.endsWith('.rsc')) {
        entries.push({ absPath: f.absPath, relPath: f.relPath, size: f.size });
      }
    }
  }

  // 2. Collect HTML files from .next/server/pages (Pages router fallback)
  if (fs.existsSync(pagesServerDir)) {
    const pageFiles = walkDir(pagesServerDir, pagesServerDir, new Set(['api']));
    for (const f of pageFiles) {
      if (f.relPath.endsWith('.html') || f.relPath.endsWith('.json')) {
        if (!entries.some((e) => e.relPath === f.relPath)) {
          entries.push({ absPath: f.absPath, relPath: f.relPath, size: f.size });
        }
      }
    }
  }

  // 3. Collect all client chunks & CSS from .next/static -> _next/static/...
  if (fs.existsSync(staticDir)) {
    const staticFiles = walkDir(staticDir, staticDir, new Set());
    for (const f of staticFiles) {
      entries.push({
        absPath: f.absPath,
        relPath: `_next/static/${f.relPath}`,
        size: f.size,
      });
    }
  }

  // 4. Collect public/ assets
  if (fs.existsSync(publicDir)) {
    const pubFiles = walkDir(publicDir, publicDir, new Set());
    for (const f of pubFiles) {
      if (!entries.some((e) => e.relPath === f.relPath)) {
        entries.push({ absPath: f.absPath, relPath: f.relPath, size: f.size });
      }
    }
  }

  return entries;
}

export async function packageProject({ projectRoot, outputDir, buildCommand, shouldBuild = false }) {
  let buildOutput = null;

  // Check if output already exists or if we need to run build
  const hasOutIndex = outputDir && fs.existsSync(path.resolve(projectRoot, outputDir, 'index.html'));
  const hasNextIndex =
    fs.existsSync(path.join(projectRoot, '.next', 'server', 'app', 'index.html')) ||
    fs.existsSync(path.join(projectRoot, '.next', 'server', 'pages', 'index.html'));

  if ((shouldBuild || (!hasOutIndex && !hasNextIndex)) && buildCommand) {
    // Check if node_modules exists; if not, install dependencies first
    if (
      fs.existsSync(path.join(projectRoot, 'package.json')) &&
      !fs.existsSync(path.join(projectRoot, 'node_modules'))
    ) {
      await runBuildCommand('npm install', projectRoot);
    }
    buildOutput = await runBuildCommand(buildCommand, projectRoot);
  }

  let files = [];
  const outDirResolved = outputDir ? path.resolve(projectRoot, outputDir) : projectRoot;

  if (fs.existsSync(path.join(projectRoot, 'out', 'index.html'))) {
    files = walkDir(path.join(projectRoot, 'out'));
  } else if (
    outputDir === '.next' ||
    fs.existsSync(path.join(projectRoot, '.next', 'server', 'app', 'index.html')) ||
    fs.existsSync(path.join(projectRoot, '.next', 'server', 'pages', 'index.html'))
  ) {
    files = collectNextBuildFiles(projectRoot);
  } else if (fs.existsSync(outDirResolved)) {
    files = walkDir(outDirResolved);
  } else {
    throw new Error(`Output folder does not exist: ${outDirResolved}. Try running the build command first.`);
  }

  if (files.length === 0) {
    throw new Error(`No deployable files found in ${projectRoot}`);
  }

  let totalSize = 0;
  const bundleFiles = [];
  for (const f of files) {
    totalSize += f.size;
    if (totalSize > MAX_BUNDLE_BYTES) {
      throw new Error(`Project bundle exceeds maximum allowed size of 40MB`);
    }
    const buf = fs.readFileSync(f.absPath);
    bundleFiles.push({
      path: f.relPath,
      contentBase64: buf.toString('base64'),
      size: f.size,
    });
  }

  return {
    filesCount: bundleFiles.length,
    totalBytes: totalSize,
    files: bundleFiles,
    buildOutput,
  };
}

export async function uploadBundle({ gatewayUrl, projectId, projectKey, projectMeta, bundleFiles }) {
  const cleanId =
    String(projectId || 'default-project')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64) || 'default-project';

  const endpoint = `${gatewayUrl.replace(/\/+$/, '')}/api/gateway/projects/${encodeURIComponent(cleanId)}/bundle`;
  const headers = {
    'Content-Type': 'application/json',
    ...(projectKey ? { 'x-project-key': projectKey } : {}),
  };

  // Split bundleFiles into chunks so each request stays well under Vercel's 4.5MB body limit
  const chunks = [];
  let currentChunk = [];
  let currentBytes = 0;

  for (const file of bundleFiles) {
    const fileSize = file.size || Math.ceil((file.contentBase64.length * 3) / 4);
    if (currentChunk.length > 0 && currentBytes + fileSize > CHUNK_MAX_BYTES) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentBytes = 0;
    }
    currentChunk.push(file);
    currentBytes += fileSize;
  }
  if (currentChunk.length > 0) chunks.push(currentChunk);

  let deployId = undefined;
  let lastData = null;

  for (let i = 0; i < chunks.length; i++) {
    const isLast = i === chunks.length - 1;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        files: chunks[i],
        project: i === 0 ? projectMeta : undefined,
        deployId,
        commit: isLast,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Upload failed with HTTP ${res.status}`);
    }
    if (data.deployId) deployId = data.deployId;
    lastData = data;
  }

  return lastData;
}
