// Project detection: figures out what kind of project lives in a folder and
// how it should be protected (static upload, existing URL, or local port).
import fs from 'node:fs';
import path from 'node:path';

// Order matters: specific meta-frameworks before generic bundlers (Vite).
const FRAMEWORKS = [
  { id: 'next', name: 'Next.js', dep: 'next', outDirs: ['out'], port: 3000,
    note: 'Next.js only produces a static folder with `output: "export"` in next.config. If the app uses server features, use the Existing URL target instead.' },
  { id: 'astro', name: 'Astro', dep: 'astro', outDirs: ['dist'], port: 4321 },
  { id: 'sveltekit', name: 'SvelteKit', dep: '@sveltejs/kit', outDirs: ['build'], port: 5173,
    note: 'SvelteKit needs adapter-static to produce a static folder.' },
  { id: 'nuxt', name: 'Nuxt', dep: 'nuxt', outDirs: ['.output/public', 'dist'], port: 3000,
    note: 'Run `nuxt generate` for a static folder.' },
  { id: 'gatsby', name: 'Gatsby', dep: 'gatsby', outDirs: ['public'], port: 8000 },
  { id: 'angular', name: 'Angular', dep: '@angular/core', outDirs: ['dist'], port: 4200 },
  { id: 'cra', name: 'Create React App', dep: 'react-scripts', outDirs: ['build'], port: 3000 },
  { id: 'vite', name: 'Vite', dep: 'vite', outDirs: ['dist'], port: 5173 },
];

const GENERIC_OUT_DIRS = ['dist', 'build', 'out', 'public', '_site'];
const SKIP_DIRS = new Set(['node_modules', '.git', '.share', '.next', '.vercel', '.turbo', '.cache']);

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function isFile(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

/** Count files under dir (capped), skipping heavy/irrelevant folders and any excluded absolute paths. */
export function countFiles(dir, exclude = [], cap = 20000) {
  let count = 0;
  let bytes = 0;
  const stack = [dir];
  while (stack.length && count < cap) {
    const cur = stack.pop();
    let entries;
    try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name) || exclude.includes(path.resolve(full))) continue;
        stack.push(full);
      } else if (e.isFile()) {
        count++;
        try { bytes += fs.statSync(full).size; } catch { /* ignore */ }
      }
    }
  }
  return { count, bytes, capped: count >= cap };
}

function detectPackageManager(root) {
  if (isFile(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm';
  if (isFile(path.join(root, 'yarn.lock'))) return 'yarn';
  if (isFile(path.join(root, 'bun.lockb')) || isFile(path.join(root, 'bun.lock'))) return 'bun';
  return 'npm';
}

function guessPort(script, fallback) {
  if (!script) return fallback;
  const m = script.match(/(?:--port[ =]|-p )(\d{2,5})/);
  return m ? Number(m[1]) : fallback;
}

/**
 * Detect a project. `exclude` lists absolute paths that must never be treated
 * as part of the project (e.g. this tool's own folder when cloned inside it).
 */
export function detectProject(root, { exclude = [] } = {}) {
  root = path.resolve(root);
  const result = {
    root,
    exists: isDir(root),
    name: path.basename(root),
    kind: 'unknown',          // 'node' | 'static' | 'unknown'
    framework: null,          // { id, name }
    packageManager: null,
    scripts: {},
    buildCommand: null,
    devCommand: null,
    outputDir: null,          // relative to root ('.' for plain HTML)
    outputExists: false,
    outputFiles: null,        // { count, bytes, capped }
    devPort: null,
    suggestedTarget: null,    // 'static' | 'url' | 'port'
    notes: [],
  };

  if (!result.exists) {
    result.notes.push('Folder does not exist.');
    return result;
  }

  const pkg = readJson(path.join(root, 'package.json'));
  if (pkg) {
    result.kind = 'node';
    result.name = pkg.name || result.name;
    result.packageManager = detectPackageManager(root);
    result.scripts = {
      build: pkg.scripts?.build || null,
      dev: pkg.scripts?.dev || null,
      start: pkg.scripts?.start || null,
    };
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const fw = FRAMEWORKS.find((f) => deps[f.dep]);
    const pm = result.packageManager;
    const run = pm === 'npm' ? 'npm run' : pm;

    if (fw) {
      result.framework = { id: fw.id, name: fw.name };
      if (fw.note) result.notes.push(fw.note);
    }
    if (result.scripts.build) result.buildCommand = `${run} build`;
    if (result.scripts.dev) result.devCommand = `${run} dev`;
    else if (result.scripts.start) result.devCommand = `${run} start`;
    result.devPort = guessPort(result.scripts.dev || result.scripts.start, fw?.port || 3000);

    // Prefer an output dir that already exists; otherwise the framework's expected one.
    const candidates = [...(fw?.outDirs || []), ...GENERIC_OUT_DIRS];
    const existing = candidates.find((d) => isFile(path.join(root, d, 'index.html')));
    result.outputDir = existing || fw?.outDirs[0] || (result.buildCommand ? 'dist' : null);

    // A package.json with only static files and no build step (e.g. index.html at root).
    if (!result.outputDir && isFile(path.join(root, 'index.html'))) result.outputDir = '.';
  } else if (isFile(path.join(root, 'index.html'))) {
    result.kind = 'static';
    result.framework = { id: 'html', name: 'Plain HTML' };
    result.outputDir = '.';
  } else {
    const nested = GENERIC_OUT_DIRS.find((d) => isFile(path.join(root, d, 'index.html')));
    if (nested) {
      result.kind = 'static';
      result.framework = { id: 'html', name: 'Static site' };
      result.outputDir = nested;
    } else {
      result.notes.push('No package.json or index.html found. Pick the folder manually, or use the Existing URL target.');
    }
  }

  if (result.outputDir) {
    const outAbs = path.resolve(root, result.outputDir);
    result.outputExists = isFile(path.join(outAbs, 'index.html'));
    if (result.outputExists) result.outputFiles = countFiles(outAbs, exclude);
  }

  // Suggested target
  if (result.outputExists || result.kind === 'static') result.suggestedTarget = 'static';
  else if (result.buildCommand && result.framework?.id !== 'next') result.suggestedTarget = 'static';
  else if (result.framework?.id === 'next') result.suggestedTarget = 'url';
  else if (result.devCommand) result.suggestedTarget = 'port';
  else result.suggestedTarget = 'url';

  if (result.suggestedTarget === 'static' && !result.outputExists && result.buildCommand) {
    result.notes.push(`Output folder "${result.outputDir}" not built yet. It will be built with \`${result.buildCommand}\` before upload.`);
  }

  return result;
}

/** Heuristic: does this folder look like a project worth protecting? */
export function looksLikeProject(dir) {
  return isFile(path.join(dir, 'package.json')) || isFile(path.join(dir, 'index.html'));
}
