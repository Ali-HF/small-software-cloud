// Dashboard client for Small Software Cloud Share CLI.
const CSRF = document.querySelector('meta[name="csrf-token"]').content;
const $ = (id) => document.getElementById(id);
let state = null;
let currentLinks = [];
let currentEvents = [];

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

function formatDate(iso) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ---------- Navigation ----------
document.querySelectorAll('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.page').forEach((p) => p.classList.toggle('hidden', p.id !== `page-${btn.dataset.page}`));
    if (btn.dataset.page === 'links') loadLinks();
    if (btn.dataset.page === 'activity') loadActivity();
  });
});

// ---------- Target Selection ----------
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

// ---------- Render Project ----------
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

  if ($('banner-project-title')) {
    $('banner-project-title').textContent = `${p.name} · Synced & Ready`;
  }
  if ($('banner-sync-meta') && data.initialSync?.synced) {
    $('banner-sync-meta').textContent = `✓ Automatically built and synced ${data.initialSync.filesCount} files (${formatBytes(data.initialSync.totalBytes)}) to ${data.gateway?.url || 'cloud gateway'}.`;
  }

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

  // Automatically open on the Links tab when a project is detected & ready so the user is 1 click away
  if (!render._didInitialTab && data.project) {
    render._didInitialTab = true;
    const linksBtn = $('nav-links');
    if (linksBtn) linksBtn.click();
  } else {
    loadLinks();
  }
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

// ---------- Folder Browse & Switch ----------
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

async function setRoot(value) {
  try {
    const data = await api('/api/project/root', { method: 'POST', body: { root: value } });
    render(data);
    toast(data.looksLikeProject ? 'Project loaded' : 'Folder loaded');
  } catch (err) { toast(err.message, true); }
}

$('form-root').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const val = $('input-root').value.trim();
  if (!val) { toast('Please enter a folder path or click Browse folder', true); return; }
  setRoot(val);
});
$('form-root-2').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const val = $('input-root-2').value.trim();
  if (!val) { toast('Please enter a folder path or click Browse', true); return; }
  setRoot(val);
});

$('btn-refresh').addEventListener('click', () => { load(); toast('Re-detected'); });

// ---------- Build & Sync Bundle ----------
async function triggerSync(build = false) {
  const box = $('sync-status-box');
  const txt = $('sync-status-text');
  box.classList.remove('hidden');
  txt.textContent = build ? 'Building project & syncing to gateway…' : 'Packaging & uploading to gateway…';
  try {
    const res = await api('/api/project/build', { method: 'POST', body: { build } });
    txt.textContent = `✓ Synced ${res.filesCount} files (${formatBytes(res.totalBytes)}) to gateway.`;
    toast('Project synced to gateway!');
    load();
    setTimeout(() => box.classList.add('hidden'), 4000);
  } catch (err) {
    txt.textContent = `✕ Sync failed: ${err.message}`;
    toast(err.message, true);
  }
}

$('btn-sync-bundle')?.addEventListener('click', () => triggerSync(false));
$('btn-build-sync')?.addEventListener('click', () => triggerSync(true));

// ---------- Overrides & Gateway Form ----------
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

// ---------- Links Management ----------
async function loadLinks() {
  try {
    const data = await api('/api/links');
    currentLinks = data.links || [];
    renderLinks();
  } catch (err) {
    console.warn('Could not load links:', err);
  }
}

function renderLinks() {
  const container = $('links-container');
  const empty = $('links-empty');
  const badge = $('badge-links-count');

  if (badge) {
    badge.textContent = currentLinks.length;
    badge.classList.toggle('hidden', currentLinks.length === 0);
  }

  if (currentLinks.length === 0) {
    empty.classList.remove('hidden');
    container.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  container.classList.remove('hidden');
  container.replaceChildren();

  const gwUrl = (state?.gateway?.url || window.location.origin).replace(/\/+$/, '');

  currentLinks.forEach((link) => {
    const card = document.createElement('div');
    card.className = `link-card ${link.isRevoked ? 'revoked' : ''}`;

    const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
    const isLimitReached = link.maxUses && link.useCount >= link.maxUses;

    let statusText = 'Active';
    let statusClass = 'tag-active';
    if (link.isRevoked) {
      statusText = 'Revoked';
      statusClass = 'tag-revoked';
    } else if (isExpired) {
      statusText = 'Expired';
      statusClass = 'tag-expired';
    } else if (isLimitReached) {
      statusText = 'Limit Reached';
      statusClass = 'tag-expired';
    }

    const typeLabel = link.accessType === 'pin'
      ? `🔢 PIN: ${link.pin || '••••'}`
      : link.accessType === 'password'
      ? '🔑 Password protected'
      : '🌐 Public view';

    const fullUrl = link.rawToken
      ? `${gwUrl}/s/${link.rawToken}`
      : `${gwUrl}/s/${link.tokenPreview}…`;

    card.innerHTML = `
      <div class="link-header">
        <div class="link-title">
          <span>${link.label}</span>
          <span class="tag-status ${statusClass}">${statusText}</span>
        </div>
        ${!link.isRevoked ? `<button class="btn btn-danger btn-revoke" data-id="${link.id}">Revoke</button>` : ''}
      </div>
      <div class="link-url-box">
        <a class="link-url-text" href="${fullUrl}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">${fullUrl}</a>
        ${link.rawToken ? `
          <div class="row" style="gap: 8px;">
            <a class="btn btn-primary" href="${fullUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">↗ Open Live App</a>
            <button class="btn btn-secondary btn-copy" data-url="${fullUrl}">Copy link</button>
          </div>
        ` : ''}
      </div>
      <div class="link-meta">
        <span>${typeLabel}</span>
        <span>•</span>
        <span>Views: <strong>${link.useCount}</strong>${link.maxUses ? ` / ${link.maxUses}` : ''}</span>
        <span>•</span>
        <span>Expires: ${formatDate(link.expiresAt)}</span>
        <span>•</span>
        <span>Created: ${formatDate(link.createdAt)}</span>
      </div>
    `;

    card.querySelector('.btn-copy')?.addEventListener('click', (e) => {
      const url = e.currentTarget.dataset.url;
      navigator.clipboard.writeText(url).then(() => toast('Link copied to clipboard!'));
    });

    card.querySelector('.btn-revoke')?.addEventListener('click', async () => {
      if (confirm(`Revoke link "${link.label}"? Anyone with this link will immediately lose access.`)) {
        try {
          await api(`/api/links/${link.id}/revoke`, { method: 'POST', body: {} });
          toast('Link revoked');
          loadLinks();
        } catch (err) { toast(err.message, true); }
      }
    });

    container.appendChild(card);
  });
}

// ---------- Modal Create Link ----------
const modal = $('modal-create-link');
function openModal() {
  modal.classList.remove('hidden');
  $('link-label').focus();
}
function closeModal() {
  modal.classList.add('hidden');
}

$('btn-open-create-link')?.addEventListener('click', openModal);
$('btn-create-first-link')?.addEventListener('click', openModal);
$('btn-close-modal')?.addEventListener('click', closeModal);
$('btn-cancel-modal')?.addEventListener('click', closeModal);

async function generateInstantLink() {
  try {
    toast('Generating deployed link…');
    if (!state?.initialSync?.synced) {
      await api('/api/project/build', { method: 'POST', body: { build: !state?.project?.outputExists } });
      if (state) state.initialSync = { synced: true };
    }
    const label = `${state?.project?.name || 'Live App'} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    const res = await api('/api/links', {
      method: 'POST',
      body: { label, accessType: 'public', expiresHours: 0, maxUses: 0 },
    });
    if (res.link && res.rawToken) {
      const gwUrl = (state?.gateway?.url || window.location.origin).replace(/\/+$/, '');
      const fullUrl = `${gwUrl}/s/${res.rawToken}`;
      currentLinks.unshift({ ...res.link, rawToken: res.rawToken });
      renderLinks();
      navigator.clipboard?.writeText(fullUrl).catch(() => {});
      toast('✓ Deployed link generated & copied to clipboard!');
    } else {
      loadLinks();
    }
  } catch (err) {
    toast(err.message, true);
  }
}

$('btn-instant-link')?.addEventListener('click', generateInstantLink);
$('btn-instant-link-hero')?.addEventListener('click', generateInstantLink);
$('btn-instant-first-link')?.addEventListener('click', generateInstantLink);

document.querySelectorAll('.access-choice').forEach((choice) => {
  choice.addEventListener('click', () => {
    document.querySelectorAll('.access-choice').forEach((c) => c.classList.remove('selected'));
    choice.classList.add('selected');
    const type = choice.querySelector('input').value;
    $('field-pin').classList.toggle('hidden', type !== 'pin');
    $('field-password').classList.toggle('hidden', type !== 'password');
  });
});

$('form-create-link')?.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const label = $('link-label').value.trim();
  const accessType = document.querySelector('input[name="accessType"]:checked')?.value || 'public';
  const pin = $('link-pin').value.trim();
  const password = $('link-password').value.trim();
  const expiresHours = Number($('link-expiry').value) || 0;
  const maxUses = Number($('link-max-uses').value) || 0;

  if (accessType === 'pin' && !pin) {
    toast('Please enter a PIN code', true);
    return;
  }
  if (accessType === 'password' && !password) {
    toast('Please enter a password', true);
    return;
  }

  try {
    if (!state?.initialSync?.synced) {
      await api('/api/project/build', { method: 'POST', body: { build: !state?.project?.outputExists } });
      if (state) state.initialSync = { synced: true };
    }
    const res = await api('/api/links', {
      method: 'POST',
      body: { label, accessType, pin, password, expiresHours, maxUses },
    });
    closeModal();
    $('form-create-link').reset();
    toast('Share link created & copied!');

    // Prepend new link with its rawToken so copy button works right away
    if (res.link && res.rawToken) {
      const gwUrl = (state?.gateway?.url || window.location.origin).replace(/\/+$/, '');
      const fullUrl = `${gwUrl}/s/${res.rawToken}`;
      navigator.clipboard?.writeText(fullUrl).catch(() => {});
      currentLinks.unshift({ ...res.link, rawToken: res.rawToken });
      renderLinks();
    } else {
      loadLinks();
    }
  } catch (err) {
    toast(err.message, true);
  }
});

// ---------- Activity Audit Log ----------
async function loadActivity() {
  try {
    const data = await api('/api/activity');
    currentEvents = data.events || [];
    renderActivity();
  } catch (err) {
    console.warn('Could not load activity:', err);
  }
}

function renderActivity() {
  const empty = $('activity-empty');
  const card = $('activity-table-card');
  const tbody = $('activity-tbody');

  if (currentEvents.length === 0) {
    empty.classList.remove('hidden');
    card.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  card.classList.remove('hidden');
  tbody.replaceChildren();

  currentEvents.forEach((evt) => {
    const tr = document.createElement('tr');
    let statusClass = 'tag-active';
    if (evt.status === 'revoked' || evt.status === 'denied') statusClass = 'tag-revoked';
    if (evt.status === 'expired') statusClass = 'tag-expired';

    tr.innerHTML = `
      <td class="mono small">${formatDate(evt.timestamp)}</td>
      <td><strong>${evt.linkLabel || 'Share Link'}</strong></td>
      <td><span class="tag-status ${statusClass}">${evt.status}</span></td>
      <td class="muted small">${evt.reason || 'Successful access'}</td>
      <td class="mono small muted">${evt.ip || '—'}</td>
    `;
    tbody.appendChild(tr);
  });
}

$('btn-refresh-activity')?.addEventListener('click', () => {
  loadActivity();
  toast('Activity refreshed');
});

load();
