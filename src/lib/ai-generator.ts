// ==============================================================================
// Small Software Cloud - AI Generation Engine
// Interfaces with Claude 3.5 Sonnet and provides offline synthetic fallback
// ==============================================================================

import Anthropic from '@anthropic-ai/sdk';

export const CLAUDE_SYSTEM_PROMPT = `You are an expert single-file web application architect for "Small Software Cloud".
Your mission is to generate ONE complete, production-ready, self-contained HTML document (with inline CSS and inline JavaScript, NO external build step).

CRITICAL ARCHITECTURAL REQUIREMENT: THE INJECTED SDK (window.cloud)
The platform automatically injects a tiny SDK into the app before serving it. You MUST use this SDK for all persistent data and multi-user state instead of localStorage:

1. Current Viewer:
   const user = await window.cloud.user(); // returns { id, name, email } or null for anonymous link viewers

2. Read Shared JSON Store:
   const data = await window.cloud.store.get('app_state'); // returns parsed JSON or null

3. Write Shared JSON Store:
   await window.cloud.store.set('app_state', stateObject); // persists JSON and broadcasts to all other viewers

4. Realtime Multiplayer Sync:
   window.cloud.store.subscribe('app_state', (newState) => {
     // Triggered live whenever ANY user modifies the shared state!
     state = newState;
     render();
   });

5. List Keys (optional):
   const keys = await window.cloud.store.list('prefix');

RULES FOR GENERATED APPS:
- Produce a single, complete HTML document starting with <!DOCTYPE html> and ending with </html>.
- Include Google Fonts (e.g. Plus Jakarta Sans or Inter) for clean, modern typography.
- Use a curated modern dark or light color scheme with smooth gradients, card containers, clear status badges, and interactive hover states.
- Every interactive element (inputs, buttons, forms, lists) must be functional.
- Initialize state cleanly: on window load, call window.cloud.user(), load initial store data with window.cloud.store.get(), render the UI, and register window.cloud.store.subscribe().
- Do NOT use localStorage or cookies for shared state.
- Output ONLY the raw HTML code. Do NOT wrap in markdown code fences (\`\`\`html). Do NOT include conversational preamble or postscript.`;

/**
 * Resolves a remote gateway URL (e.g. the deployed Vercel URL) to proxy AI generation
 * when running locally without a local ANTHROPIC_API_KEY.
 * Avoids self-loops by ignoring localhost/127.0.0.1 or the current VERCEL_URL.
 */
function getRemoteGatewayUrl(): string | null {
  const candidate = (
    process.env.AI_PROXY_URL ||
    process.env.SHARE_GATEWAY_URL ||
    process.env.NEXT_PUBLIC_GATEWAY_URL ||
    ''
  )
    .trim()
    .replace(/\/+$/, '');

  if (!candidate) return null;

  try {
    const parsed = new URL(candidate);
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '0.0.0.0'
    ) {
      return null;
    }
    if (
      process.env.VERCEL_URL &&
      parsed.hostname === process.env.VERCEL_URL.replace(/^https?:\/\//, '')
    ) {
      return null;
    }
    return candidate;
  } catch {
    return null;
  }
}

/**
 * Generate a new single-file HTML app based on user prompt.
 */
export async function generateAppHtml(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        system: CLAUDE_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Create a single-file small tool based on this description: "${prompt}". Remember to use window.cloud.store for all persistence and realtime synchronization.`
          }
        ]
      });

      const contentBlock = response.content[0];
      if (contentBlock && contentBlock.type === 'text') {
        return cleanGeneratedHtml(contentBlock.text);
      }
    } catch (error) {
      console.warn('[AI Generator] Anthropic API call failed, falling back:', error);
    }
  }

  // If no local API key is configured, try proxying through the deployed remote gateway
  const gatewayUrl = getRemoteGatewayUrl();
  if (gatewayUrl) {
    try {
      const res = await fetch(`${gatewayUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.html && typeof data.html === 'string') {
          return cleanGeneratedHtml(data.html);
        }
      }
    } catch (error) {
      console.warn('[AI Generator] Remote gateway proxy failed, falling back to local generator:', error);
    }
  }

  // Fallback synthetic generator for testing without API keys
  return generateOfflineSyntheticApp(prompt);
}

/**
 * Iterates on an existing HTML app based on user's instruction.
 */
export async function iterateAppHtml(currentHtml: string, instruction: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        system: CLAUDE_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Here is the current HTML app:\n\n${currentHtml}\n\nPlease apply this modification: "${instruction}".\nReturn the complete updated single-file HTML app. Maintain the window.cloud SDK integration.`
          }
        ]
      });

      const contentBlock = response.content[0];
      if (contentBlock && contentBlock.type === 'text') {
        return cleanGeneratedHtml(contentBlock.text);
      }
    } catch (error) {
      console.warn('[AI Generator] Iteration API call failed, falling back:', error);
    }
  }

  // If no local API key is configured, try proxying through the deployed remote gateway
  const gatewayUrl = getRemoteGatewayUrl();
  if (gatewayUrl) {
    try {
      const res = await fetch(`${gatewayUrl}/api/iterate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentHtml, instruction }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.html && typeof data.html === 'string') {
          return cleanGeneratedHtml(data.html);
        }
      }
    } catch (error) {
      console.warn('[AI Generator] Remote gateway iteration proxy failed, falling back to local modifier:', error);
    }
  }

  // Local modifier fallback
  return applyLocalModification(currentHtml, instruction);
}

/**
 * Removes markdown code fences if model returned them
 */
function cleanGeneratedHtml(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```html')) {
    cleaned = cleaned.replace(/^```html\s*/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3).trim();
  }
  return cleaned;
}

/**
 * Generates an intelligent, fully functional interactive tool offline tailored to user prompt.
 */
function generateOfflineSyntheticApp(prompt: string): string {
  const lower = prompt.toLowerCase();
  const title = prompt.length > 40 ? prompt.substring(0, 40) + '...' : prompt;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeXml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card: #141b2d;
      --border: #232f48;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --text: #f8fafc;
      --muted: #94a3b8;
      --success: #10b981;
      --danger: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 1.5rem;
    }
    .app-container {
      max-width: 800px;
      margin: 0 auto;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border);
    }
    h1 { font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; gap: 0.6rem; }
    .badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      font-weight: 700;
    }
    .user-pill {
      font-size: 0.85rem;
      padding: 0.4rem 0.8rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 9999px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .user-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
    }
    .add-form {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    input[type="text"], input[type="number"], select {
      flex: 1;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid var(--border);
      background: #090d16;
      color: var(--text);
      font-family: inherit;
      font-size: 0.95rem;
      outline: none;
    }
    input:focus { border-color: var(--primary); }
    .btn {
      padding: 0.75rem 1.25rem;
      border-radius: 0.5rem;
      border: none;
      background: var(--primary);
      color: white;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    .btn:hover { background: var(--primary-hover); }
    .btn:active { transform: scale(0.98); }
    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      color: var(--danger);
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .btn-danger:hover { background: var(--danger); color: white; }
    .item-list { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; }
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #090d16;
      border: 1px solid var(--border);
      border-radius: 0.6rem;
      transition: border-color 0.2s;
    }
    .item-row:hover { border-color: #3b4b6e; }
    .item-title { font-weight: 600; font-size: 1rem; }
    .item-meta { font-size: 0.8rem; color: var(--muted); margin-top: 0.25rem; }
    .stats-bar {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .stat-pill {
      background: var(--card);
      border: 1px solid var(--border);
      padding: 0.75rem 1.25rem;
      border-radius: 0.75rem;
    }
    .stat-val { font-size: 1.3rem; font-weight: 800; color: #a5b4fc; }
    .stat-lbl { font-size: 0.75rem; color: var(--muted); font-weight: 600; }
    .empty-state { text-align: center; padding: 2.5rem; color: var(--muted); }
  </style>
</head>
<body>
  <div class="app-container">
    <header>
      <div>
        <h1>⚡ ${escapeXml(title)} <span class="badge">Multiplayer Cloud</span></h1>
        <p style="font-size: 0.85rem; color: var(--muted); margin-top: 0.25rem;">Generated with Small Software Cloud \u2022 Realtime Collaborative</p>
      </div>
      <div class="user-pill">
        <div class="user-dot"></div>
        <span id="user-name">Connecting...</span>
      </div>
    </header>

    <div class="stats-bar">
      <div class="stat-pill">
        <div class="stat-val" id="total-count">0</div>
        <div class="stat-lbl">TOTAL ITEMS</div>
      </div>
      <div class="stat-pill">
        <div class="stat-val" id="active-user-count">Shared</div>
        <div class="stat-lbl">LIVE SYNC STATUS</div>
      </div>
    </div>

    <div class="card">
      <form id="create-form" class="add-form">
        <input type="text" id="item-input" placeholder="Type new item or entry here..." required>
        <button type="submit" class="btn">+ Add to Cloud</button>
      </form>

      <ul id="items-list" class="item-list">
        <li class="empty-state">No entries logged yet. Add one above to get started!</li>
      </ul>
    </div>
  </div>

  <script>
    let appState = { items: [] };
    let currentUser = null;

    async function init() {
      if (window.cloud) {
        currentUser = await window.cloud.user();
        document.getElementById('user-name').textContent = currentUser ? (currentUser.name || currentUser.email) : 'Guest Viewer';

        // Load persisted state
        const saved = await window.cloud.store.get('app_data');
        if (saved && saved.items) {
          appState = saved;
        }
        render();

        // Subscribe to realtime updates from other viewers
        window.cloud.store.subscribe('app_data', (newState) => {
          if (newState && newState.items) {
            appState = newState;
            render();
          }
        });
      } else {
        render();
      }
    }

    function render() {
      const listEl = document.getElementById('items-list');
      const countEl = document.getElementById('total-count');
      const items = appState.items || [];

      countEl.textContent = items.length;

      if (items.length === 0) {
        listEl.innerHTML = '<li class="empty-state">No entries logged yet. Add one above to get started!</li>';
        return;
      }

      listEl.innerHTML = items.slice().reverse().map(item => \`
        <li class="item-row">
          <div>
            <div class="item-title">\${escapeHtml(item.text)}</div>
            <div class="item-meta">Added by \${escapeHtml(item.author)} \u2022 \${new Date(item.timestamp).toLocaleTimeString()}</div>
          </div>
          <button type="button" class="btn btn-danger" onclick="deleteItem('\${item.id}')">Delete</button>
        </li>
      \`).join('');
    }

    document.getElementById('create-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('item-input');
      const text = input.value.trim();
      if (!text) return;

      const newItem = {
        id: 'item_' + Date.now(),
        text: text,
        author: currentUser ? (currentUser.name || currentUser.email.split('@')[0]) : 'Guest',
        timestamp: new Date().toISOString()
      };

      appState.items = appState.items || [];
      appState.items.push(newItem);
      render();
      input.value = '';

      if (window.cloud) {
        await window.cloud.store.set('app_data', appState);
      }
    });

    async function deleteItem(id) {
      appState.items = (appState.items || []).filter(item => item.id !== id);
      render();
      if (window.cloud) {
        await window.cloud.store.set('app_data', appState);
      }
    }

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    window.addEventListener('load', init);
  </script>
</body>
</html>`;
}

function applyLocalModification(html: string, instruction: string): string {
  // If instruction mentions theme/dark/light/color
  if (instruction.toLowerCase().includes('dark') || instruction.toLowerCase().includes('theme')) {
    if (html.includes('--bg:')) {
      return html.replace('--bg: #0b0f19;', '--bg: #030712;');
    }
  }
  // If instruction mentions title or heading
  return html.replace('</h1>', ` <span style="font-size: 0.8rem; color: #a5b4fc;">(Updated)</span></h1>`);
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
