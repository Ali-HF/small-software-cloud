// Dashboard client. All data is rendered with textContent (never innerHTML).
const CSRF = document.querySelector('meta[name="csrf-token"]').content;
const $ = (id) => document.getElementById(id);
let state = null;

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: { 'X-CSRF-Token': CSRF, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function toast(msg, isError = false) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.toggle('error', isError);
  t.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add('hidden'), 2600);
}

function formatBytes(n) {
  if (!n) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), u.length - 1);
  return `${(n / 1024 ** i).toFixed(i ? 1 : 0)} ${u[i]}`;
}

// ---------- Navigation ----------
document.querySelectorAll('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.page').forEach((p) => p.classList.toggle('hidden', p.id !== `page-${btn.dataset.page}`));
  });
});

// ---------- Rendering ----------
function selectTarget(target) {
  document.querySelectorAll('.target').forEach((el) => {
    const on = el.dataset.target === target;
    el.classList.toggle('selected', on);
    el.querySelector('input').checked = on;
  });
  document.querySelectorAll('[data-show]').forEach((el) => {
    el.classList.toggle('hidden', el.dataset.show !== target);
  });
}

function render(data) {
  state = data;
  $('f-gateway').value = data.gateway?.url || '';
  $('creds-path').textContent = data.gateway?.credentialsFile || '~/.config';

  if (!data.project) {
    $('no-project').classList.remove('hidden');
    $('project-view').classList.add('hidden');
    return;
  }
  $('no-project').classList.add('hidden');
  $('project-view').classList.remove('hidden');

  const p = data.project;
  const e = data.effective;
  $('p-name').textContent = p.name;
  $('p-root').textContent = p.root;
  $('p-kind').textContent = p.kind === 'node' ? 'Node project' : p.kind === 'static' ? 'Static site' : 'Unknown';
  $('fw-badge').textContent = (p.framework?.name || '?').slice(0, 2).toUpperCase();
  $('p-framework').textContent = p.framework?.name || 'Not detected';
  $('p-pm').textContent = p.packageManager || '—';
  $('p-out').textContent = e.outputDir || '—';
  $('p-files').textContent = p.outputExists && p.outputFiles
    ? `${p.outputFiles.count}${p.outputFiles.capped ? '+' : ''} · ${formatBytes(p.outputFiles.bytes)}`
    : 'Not built yet';

  const notes = $('p-notes');
  notes.replaceChildren();
  for (const n of p.notes || []) {
    const li = document.createElement('li');
    li.textContent = n;
    notes.appendChild(li);
  }
  $('gitignore-note').classList.toggle('hidden', !data.gitignoreUpdated);

  selectTarget(e.target);
  $('f-build').value = e.buildCommand || '';
  $('f-out').value = e.outputDir || '';
  $('f-origin').value = e.originUrl || '';
  $('f-dev').value = e.devCommand || '';
  $('f-port').value = e.devPort || '';
}

async function load() {
  try {
    render(await api('/api/project'));
  } catch (err) {
    toast(err.message, true);
  }
  checkGateway();
}

async function checkGateway() {
  const dot = document.querySelector('#gw-status .dot');
  const text = $('gw-status-text');
  try {
    const r = await api('/api/gateway/health');
    dot.className = `dot ${r.ok ? 'dot-ok' : 'dot-bad'}`;
    text.textContent = r.ok ? 'Gateway online' : `Gateway unreachable`;
    $('gw-status').title = r.url;
  } catch {
    dot.className = 'dot dot-bad';
    text.textContent = 'Gateway check failed';
  }
}

// ---------- Events ----------
document.querySelectorAll('.target').forEach((el) => {
  el.addEventListener('click', () => selectTarget(el.dataset.target));
});

$('btn-refresh').addEventListener('click', () => { load(); toast('Re-detected'); });

async function setRoot(value) {
  try {
    const data = await api('/api/project/root', { method: 'POST', body: { root: value } });
    render(data);
    toast(data.looksLikeProject ? 'Project loaded' : 'Folder loaded (no package.json or index.html found)');
  } catch (err) { toast(err.message, true); }
}

async function browseFolder() {
  toast('Opening folder picker…');
  try {
    const data = await api('/api/project/browse', { method: 'POST', body: {} });
    if (data.cancelled) {
      toast('Folder selection cancelled');
      return;
    }
    if (data.selected) {
      $('input-root').value = data.selected;
      if ($('input-root-2')) $('input-root-2').value = data.selected;
    }
    render(data);
    toast(data.looksLikeProject ? 'Project loaded' : 'Folder loaded');
  } catch (err) { toast(err.message, true); }
}

$('btn-browse')?.addEventListener('click', browseFolder);
$('btn-browse-2')?.addEventListener('click', browseFolder);

$('form-root').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const val = $('input-root').value.trim();
  if (!val) {
    toast('Please enter a folder path or click Browse folder', true);
    return;
  }
  setRoot(val);
});
$('form-root-2').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const val = $('input-root-2').value.trim();
  if (!val) {
    toast('Please enter a folder path or click Browse', true);
    return;
  }
  setRoot(val);
});

$('form-overrides').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const target = document.querySelector('input[name="target"]:checked')?.value;
  try {
    render(await api('/api/project/overrides', {
      method: 'POST',
      body: {
        target,
        buildCommand: $('f-build').value.trim(),
        outputDir: $('f-out').value.trim(),
        originUrl: $('f-origin').value.trim(),
        devCommand: $('f-dev').value.trim(),
        devPort: $('f-port').value.trim(),
      },
    }));
    toast('Target saved');
  } catch (err) { toast(err.message, true); }
});

$('btn-reset').addEventListener('click', async () => {
  try { render(await api('/api/project/reset', { method: 'POST', body: {} })); toast('Reset to detected settings'); }
  catch (err) { toast(err.message, true); }
});

$('form-gateway').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  try {
    render(await api('/api/gateway', { method: 'POST', body: { gatewayUrl: $('f-gateway').value.trim() } }));
    toast('Gateway saved');
    checkGateway();
  } catch (err) { toast(err.message, true); }
});

load();
