// ==============================================================================
// Small Software Cloud - 3 Production-Quality Demo Apps
// Each app is a self-contained single-file HTML document utilizing window.cloud
// ==============================================================================

export const DEMO_APP_EXPENSE_SPLITTER = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flatmate Expense Splitter</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --primary-light: #eef2ff;
      --bg: #0f172a;
      --card: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 1.5rem;
    }
    .container { max-width: 900px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    h1 { font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; }
    .badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      background: var(--primary-light);
      color: var(--primary);
      font-weight: 700;
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--card);
      border: 1px solid var(--border);
      padding: 0.4rem 0.8rem;
      border-radius: 9999px;
      font-size: 0.875rem;
    }
    .user-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
    }
    h2 { font-size: 1.125rem; font-weight: 700; margin-bottom: 1rem; color: #cbd5e1; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; color: var(--text-muted); }
    input, select {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid var(--border);
      background: #0f172a;
      color: var(--text);
      font-family: inherit;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus, select:focus { border-color: var(--primary); }
    .btn {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      border: none;
      background: var(--primary);
      color: white;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    .btn:hover { background: var(--primary-hover); }
    .btn:active { transform: scale(0.98); }
    .stats-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-box {
      background: #0f172a;
      padding: 1rem;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
    }
    .stat-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
    .stat-val { font-size: 1.5rem; font-weight: 800; margin-top: 0.25rem; }
    .expense-list { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; max-height: 380px; overflow-y: auto; }
    .expense-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1rem;
      background: #0f172a;
      border: 1px solid var(--border);
      border-radius: 0.6rem;
    }
    .expense-desc { font-weight: 600; font-size: 0.95rem; }
    .expense-meta { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem; }
    .expense-amount { font-weight: 800; font-size: 1.1rem; color: var(--success); }
    .balances-list { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; margin-top: 1rem; }
    .balance-item {
      display: flex;
      justify-content: space-between;
      padding: 0.6rem 0.8rem;
      border-radius: 0.4rem;
      background: #0f172a;
      font-size: 0.875rem;
    }
    .pos { color: var(--success); font-weight: 700; }
    .neg { color: var(--danger); font-weight: 700; }
    .empty-state { text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>🏡 Flatmate Expense Splitter <span class="badge">Live Shared</span></h1>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Split rent, groceries & utilities in realtime</p>
      </div>
      <div class="user-pill">
        <div class="user-dot"></div>
        <span id="user-display">Connecting...</span>
      </div>
    </header>

    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-label">TOTAL SPENT</div>
        <div class="stat-val" id="total-spent">$0.00</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">EXPENSES LOGGED</div>
        <div class="stat-val" id="total-count">0</div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h2>Add New Expense</h2>
        <form id="expense-form">
          <div class="form-group">
            <label>Description</label>
            <input type="text" id="desc" placeholder="e.g., Weekly Groceries, WiFi Bill" required>
          </div>
          <div class="form-group">
            <label>Amount ($)</label>
            <input type="number" id="amount" step="0.01" min="0.01" placeholder="0.00" required>
          </div>
          <div class="form-group">
            <label>Paid By</label>
            <select id="payer">
              <option value="Alice">Alice</option>
              <option value="Bob">Bob</option>
              <option value="Charlie">Charlie</option>
              <option value="Dave">Dave</option>
            </select>
          </div>
          <button type="submit" class="btn" id="submit-btn">+ Log Shared Expense</button>
        </form>

        <div style="margin-top: 1.5rem;">
          <h2>Net Balances</h2>
          <div id="balances-container" class="balances-list"></div>
        </div>
      </div>

      <div class="card">
        <h2>Recent Shared Expenses</h2>
        <ul id="expense-list" class="expense-list">
          <li class="empty-state">No expenses yet. Add one to start splitting!</li>
        </ul>
      </div>
    </div>
  </div>

  <script>
    let state = { expenses: [] };
    let currentUser = null;

    async function init() {
      // 1. Identify current user
      if (window.cloud) {
        currentUser = await window.cloud.user();
        if (currentUser) {
          document.getElementById('user-display').textContent = currentUser.name || currentUser.email;
          const payerSelect = document.getElementById('payer');
          const myName = currentUser.name?.split(' ')[0] || 'Me';
          if (![...payerSelect.options].some(o => o.value === myName)) {
            const opt = document.createElement('option');
            opt.value = myName;
            opt.textContent = myName + ' (You)';
            payerSelect.prepend(opt);
            payerSelect.value = myName;
          }
        } else {
          document.getElementById('user-display').textContent = 'Anonymous Viewer';
        }

        // 2. Fetch existing state
        const savedData = await window.cloud.store.get('expenses_data');
        if (savedData && savedData.expenses) {
          state = savedData;
          render();
        }

        // 3. Subscribe to realtime updates
        window.cloud.store.subscribe('expenses_data', (newVal) => {
          if (newVal && newVal.expenses) {
            state = newVal;
            render();
          }
        });
      }
    }

    function render() {
      const listEl = document.getElementById('expense-list');
      const totalSpentEl = document.getElementById('total-spent');
      const totalCountEl = document.getElementById('total-count');
      const balancesEl = document.getElementById('balances-container');

      const expenses = state.expenses || [];
      const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      
      totalSpentEl.textContent = '$' + total.toFixed(2);
      totalCountEl.textContent = expenses.length;

      if (expenses.length === 0) {
        listEl.innerHTML = '<li class="empty-state">No expenses yet. Add one to start splitting!</li>';
        balancesEl.innerHTML = '<div class="empty-state" style="padding: 0.5rem;">All settled up!</div>';
        return;
      }

      listEl.innerHTML = expenses.slice().reverse().map(e => \`
        <li class="expense-item">
          <div>
            <div class="expense-desc">\${escapeHtml(e.desc)}</div>
            <div class="expense-meta">Paid by \${escapeHtml(e.payer)} \u2022 \${new Date(e.createdAt).toLocaleDateString()}</div>
          </div>
          <div class="expense-amount">$\${parseFloat(e.amount).toFixed(2)}</div>
        </li>
      \`).join('');

      // Calculate balances
      const participants = Array.from(new Set(expenses.map(e => e.payer).concat(['Alice', 'Bob'])));
      const balances = {};
      participants.forEach(p => balances[p] = 0);

      expenses.forEach(e => {
        const amt = parseFloat(e.amount);
        const splitAmount = amt / participants.length;
        participants.forEach(p => {
          if (p === e.payer) {
            balances[p] += amt - splitAmount;
          } else {
            balances[p] -= splitAmount;
          }
        });
      });

      balancesEl.innerHTML = Object.entries(balances).map(([name, bal]) => \`
        <div class="balance-item">
          <span>\${escapeHtml(name)}</span>
          <span class="\${bal >= 0 ? 'pos' : 'neg'}">\${bal >= 0 ? '+$' + bal.toFixed(2) : '-$' + Math.abs(bal).toFixed(2)}</span>
        </div>
      \`).join('');
    }

    document.getElementById('expense-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const descInput = document.getElementById('desc');
      const amountInput = document.getElementById('amount');
      const payerSelect = document.getElementById('payer');

      const newExpense = {
        id: 'exp_' + Date.now(),
        desc: descInput.value.trim(),
        amount: parseFloat(amountInput.value),
        payer: payerSelect.value,
        createdAt: new Date().toISOString()
      };

      state.expenses = state.expenses || [];
      state.expenses.push(newExpense);
      render();

      descInput.value = '';
      amountInput.value = '';

      if (window.cloud) {
        await window.cloud.store.set('expenses_data', state);
      }
    });

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    window.addEventListener('load', init);
  </script>
</body>
</html>`;

export const DEMO_APP_LIVE_POLL = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Team Decision Poll</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card: #131a29;
      --border: #232f48;
      --primary: #3b82f6;
      --primary-gradient: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      --text: #f1f5f9;
      --muted: #94a3b8;
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1.5rem;
    }
    .poll-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 1.25rem;
      width: 100%;
      max-width: 650px;
      padding: 2.25rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
      color: #60a5fa;
      background: rgba(59, 130, 246, 0.12);
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      margin-bottom: 1rem;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #3b82f6;
      box-shadow: 0 0 10px #3b82f6;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    h1 { font-size: 1.6rem; font-weight: 800; line-height: 1.3; margin-bottom: 0.5rem; }
    .subtitle { font-size: 0.9rem; color: var(--muted); margin-bottom: 1.75rem; }
    .options-container { display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 2rem; }
    .poll-option {
      position: relative;
      background: #0d131f;
      border: 1px solid var(--border);
      border-radius: 0.85rem;
      padding: 1.1rem 1.25rem;
      cursor: pointer;
      overflow: hidden;
      transition: all 0.2s ease;
      user-select: none;
    }
    .poll-option:hover {
      border-color: #3b82f6;
      transform: translateY(-1px);
    }
    .poll-option.selected {
      border-color: #3b82f6;
      box-shadow: 0 0 0 1px #3b82f6;
    }
    .fill-bar {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      background: rgba(59, 130, 246, 0.18);
      transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1;
    }
    .poll-content {
      position: relative;
      z-index: 2;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .option-title { font-weight: 600; font-size: 1rem; }
    .vote-stats { display: flex; align-items: baseline; gap: 0.5rem; }
    .pct { font-size: 1.1rem; font-weight: 800; color: #93c5fd; }
    .count { font-size: 0.8rem; color: var(--muted); }
    footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border);
      font-size: 0.85rem;
      color: var(--muted);
    }
    .user-tag { color: var(--text); font-weight: 600; }
  </style>
</head>
<body>
  <div class="poll-card">
    <div class="badge"><div class="pulse-dot"></div> Live Multi-User Poll</div>
    <h1 id="poll-title">Which architecture should we use for the Realtime Engine?</h1>
    <p class="subtitle">Votes update instantly across all team members via window.cloud</p>

    <div class="options-container" id="options"></div>

    <footer>
      <span id="total-votes">Total: 0 votes</span>
      <span>Voter: <span class="user-tag" id="current-user">Connecting...</span></span>
    </footer>
  </div>

  <script>
    const DEFAULT_POLL = {
      title: "Which architecture should we use for the Realtime Engine?",
      options: [
        { id: 'opt_1', text: "Supabase Realtime Broadcast Channels" },
        { id: 'opt_2', text: "Direct WebSockets with Cloudflare Durable Objects" },
        { id: 'opt_3', text: "Server-Sent Events (SSE) + Redis Pub/Sub" },
        { id: 'opt_4', text: "Peer-to-Peer WebRTC Data Channels" }
      ],
      votes: {} // { voterId: optionId }
    };

    let pollState = { ...DEFAULT_POLL };
    let currentUser = null;

    async function init() {
      if (window.cloud) {
        currentUser = await window.cloud.user();
        document.getElementById('current-user').textContent = 
          currentUser ? (currentUser.name || currentUser.email) : 'Anonymous Link Viewer';

        // Load persisted votes
        const data = await window.cloud.store.get('poll_state');
        if (data && data.options) {
          pollState = data;
        }
        render();

        // Subscribe to live votes
        window.cloud.store.subscribe('poll_state', (newPoll) => {
          if (newPoll && newPoll.options) {
            pollState = newPoll;
            render();
          }
        });
      } else {
        render();
      }
    }

    async function castVote(optionId) {
      const voterKey = currentUser ? currentUser.id : 'anon_' + getSessionId();
      pollState.votes = pollState.votes || {};
      pollState.votes[voterKey] = optionId;
      render();

      if (window.cloud) {
        await window.cloud.store.set('poll_state', pollState);
      }
    }

    function render() {
      const optionsContainer = document.getElementById('options');
      const totalVotesEl = document.getElementById('total-votes');
      
      const votes = pollState.votes || {};
      const voterKey = currentUser ? currentUser.id : 'anon_' + getSessionId();
      const myVote = votes[voterKey];

      const counts = {};
      pollState.options.forEach(o => counts[o.id] = 0);
      let total = 0;

      Object.values(votes).forEach(optId => {
        if (counts[optId] !== undefined) {
          counts[optId]++;
          total++;
        }
      });

      totalVotesEl.textContent = \`Total: \${total} vote\${total === 1 ? '' : 's'}\`;

      optionsContainer.innerHTML = pollState.options.map(option => {
        const count = counts[option.id] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const isSelected = myVote === option.id;

        return \`
          <div class="poll-option \${isSelected ? 'selected' : ''}" onclick="castVote('\${option.id}')">
            <div class="fill-bar" style="width: \${pct}%"></div>
            <div class="poll-content">
              <span class="option-title">\${escapeHtml(option.text)} \${isSelected ? '\u2714' : ''}</span>
              <div class="vote-stats">
                <span class="pct">\${pct}%</span>
                <span class="count">(\${count})</span>
              </div>
            </div>
          </div>
        \`;
      }).join('');
    }

    function getSessionId() {
      let id = sessionStorage.getItem('poll_anon_id');
      if (!id) {
        id = Math.random().toString(36).substring(2, 9);
        sessionStorage.setItem('poll_anon_id', id);
      }
      return id;
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

export const DEMO_APP_HABIT_ROSTER = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shared Team Habit & Task Roster</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card: #151c2e;
      --border: #242f49;
      --primary: #10b981;
      --primary-hover: #059669;
      --text: #f8fafc;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 1.5rem;
    }
    .container { max-width: 950px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    h1 { font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; }
    .badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.15);
      color: var(--primary);
      font-weight: 700;
    }
    .table-container {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 1rem;
      overflow-x: auto;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
    }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); }
    th { font-size: 0.8rem; text-transform: uppercase; color: var(--muted); font-weight: 700; background: #0f1524; }
    tr:last-child td { border-bottom: none; }
    .task-title { font-weight: 600; font-size: 0.95rem; }
    .assignee-badge {
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      background: #242f49;
      border-radius: 0.35rem;
      color: #cbd5e1;
      font-weight: 600;
      margin-top: 0.25rem;
      display: inline-block;
    }
    .day-cell { text-align: center; cursor: pointer; }
    .check-btn {
      width: 28px;
      height: 28px;
      border-radius: 0.4rem;
      border: 2px solid #334155;
      background: transparent;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: transparent;
      font-size: 1rem;
      font-weight: 800;
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .check-btn.completed {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }
    .add-bar {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    input {
      flex: 1;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--text);
      font-family: inherit;
    }
    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      border: none;
      background: var(--primary);
      color: white;
      font-weight: 700;
      cursor: pointer;
    }
    .btn:hover { background: var(--primary-hover); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>📋 Team Habit & Weekly Roster <span class="badge">Multiplayer Sync</span></h1>
        <p style="font-size: 0.85rem; color: var(--muted); margin-top: 0.25rem;">Live checklist for daily standups, deployments, and shared team routines</p>
      </div>
      <div id="user-status" style="font-size: 0.85rem; color: var(--muted);">Connecting...</div>
    </header>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 35%;">Routine / Task</th>
            <th style="text-align: center;">Mon</th>
            <th style="text-align: center;">Tue</th>
            <th style="text-align: center;">Wed</th>
            <th style="text-align: center;">Thu</th>
            <th style="text-align: center;">Fri</th>
          </tr>
        </thead>
        <tbody id="roster-body"></tbody>
      </table>
    </div>

    <form id="add-form" class="add-bar">
      <input type="text" id="task-name" placeholder="Add a new shared routine (e.g., Run daily backup, Review pull requests)" required>
      <input type="text" id="assignee-name" placeholder="Assignee (e.g. Alice)" style="max-width: 180px;" required>
      <button type="submit" class="btn">+ Add Task</button>
    </form>
  </div>

  <script>
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    let rosterState = {
      tasks: [
        { id: '1', title: 'Daily Standup & Sync', assignee: 'Team', days: { Mon: true, Tue: true, Wed: false, Thu: false, Fri: false } },
        { id: '2', title: 'Staging E2E Smoke Tests', assignee: 'Alex', days: { Mon: true, Tue: true, Wed: false, Thu: false, Fri: false } },
        { id: '3', title: 'Dependency Vulnerability Scan', assignee: 'Jordan', days: { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false } },
        { id: '4', title: 'Weekly Sprint Retrospective', assignee: 'Team', days: { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false } }
      ]
    };

    async function init() {
      if (window.cloud) {
        const user = await window.cloud.user();
        document.getElementById('user-status').textContent = user ? \`Signed in: \${user.name || user.email}\` : 'Guest Mode';

        const data = await window.cloud.store.get('roster_state');
        if (data && data.tasks) {
          rosterState = data;
        }
        render();

        window.cloud.store.subscribe('roster_state', (newState) => {
          if (newState && newState.tasks) {
            rosterState = newState;
            render();
          }
        });
      } else {
        render();
      }
    }

    async function toggleDay(taskId, day) {
      const task = rosterState.tasks.find(t => t.id === taskId);
      if (!task) return;
      task.days[day] = !task.days[day];
      render();

      if (window.cloud) {
        await window.cloud.store.set('roster_state', rosterState);
      }
    }

    function render() {
      const tbody = document.getElementById('roster-body');
      tbody.innerHTML = rosterState.tasks.map(task => \`
        <tr>
          <td>
            <div class="task-title">\${escapeHtml(task.title)}</div>
            <span class="assignee-badge">\${escapeHtml(task.assignee)}</span>
          </td>
          \${DAYS.map(day => {
            const isDone = !!task.days[day];
            return \`
              <td class="day-cell" onclick="toggleDay('\${task.id}', '\${day}')">
                <button type="button" class="check-btn \${isDone ? 'completed' : ''}">\${isDone ? '\u2713' : ''}</button>
              </td>
            \`;
          }).join('')}
        </tr>
      \`).join('');
    }

    document.getElementById('add-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const taskInput = document.getElementById('task-name');
      const assigneeInput = document.getElementById('assignee-name');

      const newTask = {
        id: 'task_' + Date.now(),
        title: taskInput.value.trim(),
        assignee: assigneeInput.value.trim(),
        days: { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false }
      };

      rosterState.tasks.push(newTask);
      render();

      taskInput.value = '';
      assigneeInput.value = '';

      if (window.cloud) {
        await window.cloud.store.set('roster_state', rosterState);
      }
    });

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    window.addEventListener('load', init);
  </script>
</body>
</html>`;
