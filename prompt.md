# Antigravity prompt: "Small Software Cloud" (YE Digital Hackathon 2026)

Paste everything below the line into Antigravity as the first prompt. Work in phases and ask it to stop after each phase so you can test.

---

## Goal

Build a web platform where anyone can describe a small tool in plain English, and the platform generates it as a single-file HTML app, stores it, and serves it at a shareable link, much like a Google Doc. Think of it as a "cloud for small software": the tools people want are too small to justify a developer, a repo, or a deployment, but too useful to stay one-off.

Examples: a shared expense splitter for a flat, a class attendance sheet, a poll, a shift roster, a habit tracker shared with a friend.

## Stack

- Next.js (App Router, TypeScript) + Tailwind
- Supabase (Postgres, Row Level Security, Storage if needed)
- Auth: Google and GitHub OAuth through Supabase Auth. No email/password.
- Claude API for generation (server-side route only; the key never reaches the browser)
- Deploy: Vercel for the main app

## Core features (MVP)

1. **Create**: a prompt box ("Describe the tool you want"). The server calls Claude and gets back ONE self-contained HTML file (inline CSS and JS, no external build step). Show a live preview before saving.
2. **Iterate**: a chat-style "change it" box that sends the current HTML plus the instruction to Claude and returns a new version. Keep a version history (last N versions) with restore.
3. **Host**: each app is stored in Supabase and served at `/a/<app-id>` (or a separate origin, see Security).
4. **Share**: Google-Docs-style sharing. Owner can invite people by email as **viewer** or **editor**, or toggle "anyone with the link can view". Invited users sign in with Google/GitHub and the email must match.
5. **Dashboard**: "My apps" and "Shared with me", with rename, duplicate and delete.
6. **SDK**: a small JS SDK injected into every served app, exposing shared storage and identity (below).

## The injected SDK (the key idea)

Generated apps are static HTML, so they cannot persist or share data on their own. The platform injects a tiny SDK (served from the platform) that exposes something like:

```js
window.cloud.user()                 // { id, name, email } of the current viewer (or null for anonymous link viewers)
window.cloud.store.get(key)         // read shared JSON for this app
window.cloud.store.set(key, value)  // write shared JSON (editors only, or per-user keys for viewers if allowed)
window.cloud.store.list(prefix)
window.cloud.store.subscribe(key, cb) // realtime updates via Supabase Realtime
```

The Claude system prompt for generation must tell the model about this SDK so generated apps use it for persistence and multi-user state instead of localStorage. Communication between the sandboxed iframe and the host page should go through `postMessage`, with the host page performing the Supabase calls and enforcing permissions.

## Security model (important, judges will look at this)

Generated code is untrusted. Treat it that way.

- Serve apps inside a **sandboxed iframe** (`sandbox="allow-scripts"`, no `allow-same-origin`), ideally from a **separate origin** (for example a different domain/subdomain) so app code can never touch the main app's cookies or tokens.
- The app never receives Supabase keys or the user's session token. All data access goes through the `postMessage` bridge, and the host checks the app id and the viewer's role on every call.
- Apply a strict CSP to served apps (block outbound network by default, or allow only an explicit allowlist).
- RLS policies on every table. Roles: owner, editor, viewer, link-viewer.
- Rate-limit generation per user and cap HTML size.
- Sanitize and validate anything the SDK stores (size limits, JSON only).

## Data model (starting point)

- `apps` (id, owner_id, title, current_version_id, link_access enum[none|view], created_at)
- `app_versions` (id, app_id, html, prompt, created_at)
- `app_members` (app_id, email, user_id nullable, role enum[viewer|editor])
- `app_kv` (app_id, key, value jsonb, updated_by, updated_at) with a unique (app_id, key)

## Phases (stop after each)

1. Scaffold project, Supabase schema + RLS, Google/GitHub login, empty dashboard.
2. Generation: prompt -> Claude -> HTML -> preview -> save as app + version.
3. Hosting: serve saved apps in the sandboxed iframe on the separate origin with CSP.
4. SDK + postMessage bridge + shared storage with realtime.
5. Sharing: invite by email, roles, link access, "Shared with me".
6. Iteration chat + version history.
7. Polish: landing page, three polished demo apps (expense splitter, poll, shared checklist), error states, mobile layout.

## Acceptance criteria

- A new user can sign in, describe a tool, and have a working shared link in under a minute.
- Two different accounts can use the same app and see each other's changes live.
- An invited viewer cannot write; a stranger without access gets a clear "no access" page.
- A malicious generated app (try one that calls `fetch` to an external site and reads `document.cookie`) cannot reach the platform's session or data.
- The demo works end to end on the deployed site, not just locally.

## Working style for the agent

- Plan first, then implement phase by phase; summarize what changed after each phase.
- Keep files small and typed; add a `README` with setup (env vars, Supabase SQL, how to run).
- Do not hardcode secrets; use `.env.local` and list required variables in `.env.example`.
- When a decision is ambiguous, pick the simplest option and note it, rather than stopping.