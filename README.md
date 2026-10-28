# ⚡ Small Software Cloud (YE Digital Hackathon 2026)

> **"A Cloud for Small Software"**: The tools people want are too small to justify a developer, a repo, or a deployment, but too useful to stay one-off. Describe any small tool in plain English — the platform generates it as a single-file HTML app, stores it, and serves it with live multiplayer persistence and Google-Docs-style sharing.

---

## 🌟 Core Architecture & Key Innovations

### 1. The Injected Realtime SDK (`window.cloud`)
Generated apps are static HTML, but need to share and persist multi-user state. The platform injects a lightweight client SDK into every served app exposing:
```js
window.cloud.user()                 // Promise<{ id, name, email } of current viewer (or null for guest link viewers)>
window.cloud.store.get(key)         // Promise<any> read shared JSON for this app
window.cloud.store.set(key, value)  // Promise<boolean> write shared JSON (enforces permissions & broadcasts updates)
window.cloud.store.list(prefix)     // Promise<string[]> list keys matching prefix
window.cloud.store.subscribe(key, cb) // Realtime updates triggered when any user modifies state
```
All SDK communication flows over a secure `postMessage` gateway to the host page, which performs permission verification and persists data to Supabase (or the hybrid dev store).

### 2. Zero-Trust Security Model
Untrusted generated code is treated as strictly hostile:
- **Sandboxed iframe**: Served with `sandbox="allow-scripts"` (strictly **NO** `allow-same-origin`), meaning untrusted app code can never access cookies, platform session tokens, or parent storage.
- **Strict Content Security Policy (CSP)**:
  `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; connect-src 'none';`
  Outbound network access (`fetch`, `xhr`, `web-sockets`) is blocked from inside the sandbox; all network operations must pass through the authorized SDK postMessage bridge.
- **Role-Based Storage Gateways**: The host checks viewer permissions (owner, editor, viewer, link-viewer) on every write operation.

### 3. Google-Docs-Style Sharing
- Toggle between **Restricted** (invited collaborators only) and **Anyone with the link can view**.
- Invite collaborators by email as **Viewer** or **Editor**.
- Separate **"My Apps"** and **"Shared With Me"** dashboards.

### 4. Interactive Studio & Version History
- Describe any tool in natural language to generate a self-contained single-file HTML app.
- Chat-style **"Change It"** box sends current HTML + instruction to Claude 3.5 Sonnet to generate an updated iteration.
- Automatic **Version History** tracking with timestamped snapshots and 1-click restore.

---

## 🚀 Quick Start (Instant Testing)

The platform comes pre-configured with **Hybrid Dev Mode** so you can test all features and demo apps immediately without needing any external credentials!

### 1. Install & Run Dev Server
```bash
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 2. Ready-to-Use Demo Apps
The platform includes 3 complete, production-quality single-file apps showcasing `window.cloud.store` multiplayer synchronization:
1. **Flatmate Expense Splitter**: [http://localhost:3000/a/app-expense-demo](http://localhost:3000/a/app-expense-demo)
   - Realtime multi-roommate balance calculation, spending logs, and net settlement breakdown.
2. **Live Decision Poll**: [http://localhost:3000/a/app-poll-demo](http://localhost:3000/a/app-poll-demo)
   - Animated voting bars, vote counts, and instant live synchronization across all open tabs.
3. **Weekly Habit & Standup Roster**: [http://localhost:3000/a/app-roster-demo](http://localhost:3000/a/app-roster-demo)
   - Mon-Fri routine checklist, assignee tags, and live checkbox synchronization.

### 3. Multi-Account Collaboration Testing
Use the **"Acting as:"** user switcher in the top right header to simulate:
- **Alice (Owner)**: Has full edit, delete, and sharing control.
- **Bob (Editor)**: Can edit data and iterate on versions in the Studio.
- **Charlie (Viewer)**: Can view and interact with shared apps in read-only mode.
- **Anonymous Link Viewer**: Tests link-sharing permissions.

---

## 🔑 Production Setup (Supabase & Anthropic Claude)

When you're ready to connect your live Supabase project and Claude API key:

### 1. Configure `.env.local`
Edit your `.env.local`:
```bash
# Claude 3.5 Sonnet API Key (Server-side only)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Supabase Project Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Dedicated sandbox domain/subdomain
NEXT_PUBLIC_SANDBOX_ORIGIN=http://localhost:3000
```

### 2. Apply Supabase Database Schema
Copy and execute the contents of [`supabase/schema.sql`](file:///c:/vibes/cloud/supabase/schema.sql) in your **Supabase SQL Editor**:
- Creates tables: `apps`, `app_versions`, `app_members`, `app_kv`.
- Configures Row Level Security (RLS) policies for owner, editor, viewer, and link access.
- Enables Supabase Realtime publication on `app_kv`.

---

## 📁 Repository Structure

```
c:\vibes\cloud/
├── src/
│   ├── app/
│   │   ├── page.tsx               # Modern landing page & prompt launcher
│   │   ├── layout.tsx             # Root dark-mode layout & metadata
│   │   ├── dashboard/page.tsx     # My Apps & Shared With Me dashboard
│   │   ├── studio/page.tsx        # Tool generator & live preview studio
│   │   ├── studio/[id]/page.tsx   # Chat-style iteration & version history
│   │   ├── a/[id]/page.tsx        # Hosted app viewer with postMessage bridge
│   │   ├── embed/[id]/route.ts    # Sandboxed embed endpoint with CSP & SDK
│   │   └── api/
│   │       ├── generate/route.ts  # Claude 3.5 Sonnet single-file generator
│   │       ├── iterate/route.ts   # Claude iteration & version creator
│   │       ├── apps/route.ts      # App CRUD & search
│   │       ├── apps/[id]/route.ts # App updates, duplicate & delete
│   │       ├── apps/[id]/members/ # Collaborator invites & role updates
│   │       ├── apps/[id]/versions/# Version history & 1-click restore
│   │       └── bridge/[id]/route.ts # SDK store gateway & permission check
│   ├── components/
│   │   └── ShareModal.tsx         # Google-Docs-style sharing dialog
│   ├── lib/
│   │   ├── sdk-script.ts          # Injected window.cloud client code
│   │   ├── ai-generator.ts        # Claude API prompt engineering & synthesis
│   │   ├── storage.ts             # Hybrid in-memory & Supabase state service
│   │   ├── demo-apps.ts           # 3 complete production single-file apps
│   │   └── supabase.ts            # Supabase client connector
│   └── types/
│       └── index.ts               # Full TypeScript interface definitions
├── supabase/
│   └── schema.sql                 # Production Postgres schema with RLS & Realtime
├── ECC/                           # Cloned Everything Claude Code skill library
├── .env.example                   # Environment variable template
├── .env.local                     # Local development configuration
└── prompt.md                      # Original project requirements specification
```

---

## 🛡️ Hackathon Acceptance Criteria Checklist

- [x] **Create in < 1 minute**: Anyone can describe a tool, preview it live, and save it to the cloud.
- [x] **Realtime Multiplayer Sync**: Two users can open the same app and see changes live (`window.cloud.store`).
- [x] **Google-Docs Sharing**: Invite by email as viewer or editor; link sharing toggle; unauthorized visitors get a clear "Access Restricted" page.
- [x] **Zero-Trust Security**: Sandboxed iframe without `allow-same-origin`, strict CSP blocking unauthorized network requests, host postMessage validation.
- [x] **Version History & Iteration**: Chat-style iteration box with version history tracking and 1-click rollback.
- [x] **Production Polish**: 3 pre-built demo apps, responsive mobile layout, clean dark aesthetic, and full TypeScript typing.
