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
]);

const MAX_BUNDLE_BYTES = 50 * 1024 * 1024; // 50MB safety limit

export function runBuildCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    if (!command || !command.trim()) return resolve({ skipped: true, stdout: '', stderr: '' });
    exec(command, { cwd, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`Build failed: ${err.message}\n${stderr || stdout}`));
      resolve({ skipped: false, stdout, stderr });
    });
  });
}

function walkDir(dir, baseDir = dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    if (IGNORED_NAMES.has(item.name)) continue;
    const absPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...walkDir(absPath, baseDir));
    } else if (item.isFile()) {
      const relPath = path.relative(baseDir, absPath).replace(/\\/g, '/');
      results.push({ absPath, relPath, size: fs.statSync(absPath).size });
    }
  }
  return results;
}

export async function packageProject({ projectRoot, outputDir, buildCommand, shouldBuild = false }) {
  let buildOutput = null;
  if (shouldBuild && buildCommand) {
    buildOutput = await runBuildCommand(buildCommand, projectRoot);
  }

  const targetDir = outputDir ? path.resolve(projectRoot, outputDir) : projectRoot;
  if (!fs.existsSync(targetDir)) {
    throw new Error(`Output folder does not exist: ${targetDir}. Try running the build command first.`);
  }

  const files = walkDir(targetDir);
  if (files.length === 0) {
    throw new Error(`No files found in ${targetDir}`);
  }

  let totalSize = 0;
  const bundleFiles = [];
  for (const f of files) {
    totalSize += f.size;
    if (totalSize > MAX_BUNDLE_BYTES) {
      throw new Error(`Project bundle exceeds maximum allowed size of 50MB`);
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

export async function uploadBundle({ gatewayUrl, projectId, projectMeta, bundleFiles }) {
  const endpoint = `${gatewayUrl.replace(/\/+$/, '')}/api/gateway/projects/${projectId}/bundle`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: bundleFiles,
      project: projectMeta,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Upload failed with HTTP ${res.status}`);
  }
  return data;
}
