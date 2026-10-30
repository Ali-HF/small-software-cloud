// ==============================================================================
// Small Software Cloud - Storage & State Service
// Connects to Live Supabase Postgres + RLS + Realtime with Hybrid Fallback
// ==============================================================================

import { App, AppVersion, AppMember, User, MemberRole } from '@/types';
import {
  DEMO_APP_EXPENSE_SPLITTER,
  DEMO_APP_LIVE_POLL,
  DEMO_APP_HABIT_ROSTER,
} from './demo-apps';
import { getSupabaseServerClient, hasSupabase } from './supabase';

export const MAX_HTML_BYTES = 256 * 1024; // 256 KB max single-file HTML size
export const MAX_KV_BYTES = 64 * 1024; // 64 KB max JSON payload per KV key
export const MAX_KEY_LENGTH = 128;

// Deterministic UUID mapping for built-in multi-role test accounts in auth.users
export const USER_UUID_MAP: Record<string, string> = {
  usr_alice: '00000000-0000-0000-0000-000000000001',
  usr_bob: '00000000-0000-0000-0000-000000000002',
  usr_charlie: '00000000-0000-0000-0000-000000000003',
  usr_stranger: '00000000-0000-0000-0000-000000000004',
};

export function toDbUserId(userId: string): string {
  return USER_UUID_MAP[userId] || userId;
}

export function isSameUserId(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return toDbUserId(a) === toDbUserId(b) || a === b;
}

// Mock Test Accounts for instant multi-user collaboration testing
export const MOCK_USERS: User[] = [
  {
    id: 'usr_alice',
    name: 'Alice (Owner)',
    email: 'alice@example.com',
    avatar_url:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  },
  {
    id: 'usr_bob',
    name: 'Bob (Editor)',
    email: 'bob@example.com',
    avatar_url:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
  },
  {
    id: 'usr_charlie',
    name: 'Charlie (Viewer)',
    email: 'charlie@example.com',
    avatar_url:
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop',
  },
  {
    id: 'usr_stranger',
    name: 'Stranger (No Access)',
    email: 'stranger@external.org',
  },
];

// Client-side helper to persist the selected test user across pages
const ACTIVE_USER_STORAGE_KEY = 'ssc_active_user_id';

export function getStoredMockUser(): User {
  if (typeof window === 'undefined') return MOCK_USERS[0];
  try {
    const savedId = window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (savedId) {
      const found = MOCK_USERS.find(
        (u) => u.id === savedId || toDbUserId(u.id) === savedId
      );
      if (found) return found;
    }
  } catch {
    // ignore storage errors
  }
  return MOCK_USERS[0];
}

export function setStoredMockUser(user: User): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, user.id);
  } catch {
    // ignore storage errors
  }
}

export function resolveUserByIdOrEmail(
  userId?: string | null,
  email?: string | null
): User | null {
  if (!userId && !email) return null;
  if (userId === 'anonymous' || userId === 'guest') return null;
  const byId = userId
    ? MOCK_USERS.find((u) => isSameUserId(u.id, userId))
    : undefined;
  if (byId) return byId;
  const byEmail = email
    ? MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase())
    : undefined;
  if (byEmail) return byEmail;
  if (userId) {
    return {
      id: userId,
      name: email ? email.split('@')[0] : 'Authenticated User',
      email: email || `${userId}@user.local`,
    };
  }
  return null;
}

// In-Memory store (persisted in global scope across hot reloads)
interface GlobalStorage {
  apps: Map<string, App>;
  versions: Map<string, AppVersion[]>;
  members: Map<string, AppMember[]>;
  kv: Map<string, Map<string, any>>;
  rateLimits: Map<string, number[]>;
  initialized: boolean;
  supabaseSeeded: boolean;
}

const globalForStorage = globalThis as unknown as { __storage?: GlobalStorage };

if (!globalForStorage.__storage) {
  globalForStorage.__storage = {
    apps: new Map(),
    versions: new Map(),
    members: new Map(),
    kv: new Map(),
    rateLimits: new Map(),
    initialized: false,
    supabaseSeeded: false,
  };
}

const db = globalForStorage.__storage;

/**
 * Simple sliding-window rate limiter per user (default: 15 generations per minute)
 */
export function checkRateLimit(
  userKey: string,
  maxRequests: number = 15,
  windowMs: number = 60_000
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const timestamps = (db.rateLimits.get(userKey) || []).filter(
    (t) => now - t < windowMs
  );
  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((windowMs - (now - oldest)) / 1000)
    );
    db.rateLimits.set(userKey, timestamps);
    return { allowed: false, retryAfterSeconds };
  }
  timestamps.push(now);
  db.rateLimits.set(userKey, timestamps);
  return { allowed: true };
}

// Seed initial Demo Apps in memory
export function seedDemoApps() {
  if (db.initialized && db.apps.size > 0) return;

  const now = new Date().toISOString();
  const alice = MOCK_USERS[0];
  const bob = MOCK_USERS[1];
  const charlie = MOCK_USERS[2];

  // 1. Flatmate Expense Splitter
  const expenseAppId = 'app-expense-demo';
  const expenseVersion: AppVersion = {
    id: expenseAppId + '-v1',
    app_id: expenseAppId,
    html: DEMO_APP_EXPENSE_SPLITTER,
    prompt:
      'Create a shared expense splitter for flatmates with net balances, realtime spending total, and expense list.',
    created_at: now,
  };
  const expenseApp: App = {
    id: expenseAppId,
    owner_id: alice.id,
    title: 'Flatmate Expense Splitter',
    current_version_id: expenseVersion.id,
    link_access: 'view',
    created_at: now,
    updated_at: now,
    owner: alice,
  };

  // 2. Live Team Poll
  const pollAppId = 'app-poll-demo';
  const pollVersion: AppVersion = {
    id: pollAppId + '-v1',
    app_id: pollAppId,
    html: DEMO_APP_LIVE_POLL,
    prompt:
      'Build a live voting poll with animated percentage bars, vote count, and multiplayer synchronization.',
    created_at: now,
  };
  const pollApp: App = {
    id: pollAppId,
    owner_id: alice.id,
    title: 'Live Team Architecture Poll',
    current_version_id: pollVersion.id,
    link_access: 'view',
    created_at: now,
    updated_at: now,
    owner: alice,
  };

  // 3. Shared Habit & Task Roster
  const rosterAppId = 'app-roster-demo';
  const rosterVersion: AppVersion = {
    id: rosterAppId + '-v1',
    app_id: rosterAppId,
    html: DEMO_APP_HABIT_ROSTER,
    prompt:
      'A weekly team habit and standup roster table with Mon-Fri interactive check buttons and live sync.',
    created_at: now,
  };
  const rosterApp: App = {
    id: rosterAppId,
    owner_id: alice.id,
    title: 'Team Habit & Weekly Standup Roster',
    current_version_id: rosterVersion.id,
    link_access: 'view',
    created_at: now,
    updated_at: now,
    owner: alice,
  };

  // Store apps & versions
  db.apps.set(expenseAppId, expenseApp);
  db.versions.set(expenseAppId, [expenseVersion]);

  db.apps.set(pollAppId, pollApp);
  db.versions.set(pollAppId, [pollVersion]);

  db.apps.set(rosterAppId, rosterApp);
  db.versions.set(rosterAppId, [rosterVersion]);

  // Seed memberships for demonstration
  db.members.set(expenseAppId, [
    {
      id: 'mem_1',
      app_id: expenseAppId,
      email: bob.email,
      user_id: bob.id,
      role: 'editor',
      created_at: now,
      user: bob,
    },
    {
      id: 'mem_2',
      app_id: expenseAppId,
      email: charlie.email,
      user_id: charlie.id,
      role: 'viewer',
      created_at: now,
      user: charlie,
    },
  ]);

  db.members.set(pollAppId, [
    {
      id: 'mem_3',
      app_id: pollAppId,
      email: bob.email,
      user_id: bob.id,
      role: 'editor',
      created_at: now,
      user: bob,
    },
  ]);

  db.members.set(rosterAppId, [
    {
      id: 'mem_4',
      app_id: rosterAppId,
      email: charlie.email,
      user_id: charlie.id,
      role: 'viewer',
      created_at: now,
      user: charlie,
    },
  ]);

  db.initialized = true;
}

// Seed Demo Apps in Live Supabase Postgres if not already present
export async function ensureSupabaseDemoSeed(): Promise<void> {
  if (db.supabaseSeeded) return;
  const sb = getSupabaseServerClient();
  if (!sb) return;

  try {
    const { data: existing } = await sb
      .from('apps')
      .select('id')
      .eq('id', 'app-expense-demo')
      .maybeSingle();

    if (existing) {
      db.supabaseSeeded = true;
      return;
    }

    const aliceUuid = USER_UUID_MAP.usr_alice;
    const bobUuid = USER_UUID_MAP.usr_bob;
    const charlieUuid = USER_UUID_MAP.usr_charlie;

    const demoEntries = [
      {
        appId: 'app-expense-demo',
        verId: 'app-expense-demo-v1',
        title: 'Flatmate Expense Splitter',
        prompt:
          'Create a shared expense splitter for flatmates with net balances, realtime spending total, and expense list.',
        html: DEMO_APP_EXPENSE_SPLITTER,
      },
      {
        appId: 'app-poll-demo',
        verId: 'app-poll-demo-v1',
        title: 'Live Team Architecture Poll',
        prompt:
          'Build a live voting poll with animated percentage bars, vote count, and multiplayer synchronization.',
        html: DEMO_APP_LIVE_POLL,
      },
      {
        appId: 'app-roster-demo',
        verId: 'app-roster-demo-v1',
        title: 'Team Habit & Weekly Standup Roster',
        prompt:
          'A weekly team habit and standup roster table with Mon-Fri interactive check buttons and live sync.',
        html: DEMO_APP_HABIT_ROSTER,
      },
    ];

    for (const entry of demoEntries) {
      await sb.from('apps').upsert({
        id: entry.appId,
        owner_id: aliceUuid,
        title: entry.title,
        link_access: 'view',
      });
      await sb.from('app_versions').upsert({
        id: entry.verId,
        app_id: entry.appId,
        html: entry.html,
        prompt: entry.prompt,
      });
      await sb
        .from('apps')
        .update({ current_version_id: entry.verId })
        .eq('id', entry.appId);
    }

    await sb.from('app_members').upsert(
      [
        {
          id: 'mem_1',
          app_id: 'app-expense-demo',
          email: 'bob@example.com',
          user_id: bobUuid,
          role: 'editor',
        },
        {
          id: 'mem_2',
          app_id: 'app-expense-demo',
          email: 'charlie@example.com',
          user_id: charlieUuid,
          role: 'viewer',
        },
        {
          id: 'mem_3',
          app_id: 'app-poll-demo',
          email: 'bob@example.com',
          user_id: bobUuid,
          role: 'editor',
        },
        {
          id: 'mem_4',
          app_id: 'app-roster-demo',
          email: 'charlie@example.com',
          user_id: charlieUuid,
          role: 'viewer',
        },
      ],
      { onConflict: 'app_id,email' }
    );

    db.supabaseSeeded = true;
  } catch (err) {
    console.warn('[Storage] Supabase demo seed skipped:', err);
  }
}

// Ensure demo apps are seeded
seedDemoApps();

export function isSupabaseConfigured(): boolean {
  return hasSupabase();
}

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

// --- App Service Operations ---

export async function getApps(userId: string): Promise<App[]> {
  seedDemoApps();
  await ensureSupabaseDemoSeed();

  const sb = getSupabaseServerClient();
  const dbOwnerId = toDbUserId(userId);

  if (sb && isUuid(dbOwnerId)) {
    const { data: appsData, error } = await sb
      .from('apps')
      .select('*, current_version:app_versions!fk_apps_current_version(*)')
      .eq('owner_id', dbOwnerId)
      .order('updated_at', { ascending: false });

    if (!error && appsData) {
      const ownerUser = resolveUserByIdOrEmail(userId);
      return appsData.map((row: any) => ({
        ...row,
        owner: ownerUser || undefined,
        role: 'owner' as const,
      }));
    }
  }

  const results: App[] = [];
  db.apps.forEach((app) => {
    if (isSameUserId(app.owner_id, userId)) {
      const versions = db.versions.get(app.id) || [];
      const currentVersion =
        versions.find((v) => v.id === app.current_version_id) || versions[0];
      results.push({
        ...app,
        current_version: currentVersion,
        role: 'owner',
      });
    }
  });
  return results.sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export async function getSharedApps(userEmail: string): Promise<App[]> {
  seedDemoApps();
  await ensureSupabaseDemoSeed();

  const sb = getSupabaseServerClient();

  if (sb && userEmail) {
    const { data: memberRows, error } = await sb
      .from('app_members')
      .select(
        'role, app_id, apps(*, current_version:app_versions!fk_apps_current_version(*))'
      )
      .ilike('email', userEmail);

    if (!error && memberRows) {
      return memberRows
        .filter((m: any) => m.apps)
        .map((m: any) => ({
          ...m.apps,
          owner: resolveUserByIdOrEmail(m.apps.owner_id) || undefined,
          role: m.role,
        }));
    }
  }

  const results: App[] = [];
  db.members.forEach((membersList, appId) => {
    const membership = membersList.find(
      (m) => m.email.toLowerCase() === userEmail.toLowerCase()
    );
    if (membership) {
      const app = db.apps.get(appId);
      if (app) {
        const versions = db.versions.get(app.id) || [];
        const currentVersion =
          versions.find((v) => v.id === app.current_version_id) || versions[0];
        results.push({
          ...app,
          current_version: currentVersion,
          role: membership.role,
        });
      }
    }
  });
  return results.sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export async function getApp(
  appId: string,
  user: User | null
): Promise<App | null> {
  seedDemoApps();
  await ensureSupabaseDemoSeed();

  const sb = getSupabaseServerClient();

  if (sb) {
    const { data: appRow, error } = await sb
      .from('apps')
      .select('*, current_version:app_versions!fk_apps_current_version(*)')
      .eq('id', appId)
      .maybeSingle();

    if (!error && appRow) {
      let role: 'owner' | MemberRole | 'link_viewer' | null = null;
      if (user && isSameUserId(appRow.owner_id, user.id)) {
        role = 'owner';
      } else if (user) {
        const { data: mem } = await sb
          .from('app_members')
          .select('role, user_id')
          .eq('app_id', appId)
          .ilike('email', user.email)
          .maybeSingle();
        if (mem) {
          role = mem.role as MemberRole;
          const dbUid = toDbUserId(user.id);
          if (!mem.user_id && isUuid(dbUid)) {
            await sb
              .from('app_members')
              .update({ user_id: dbUid })
              .eq('app_id', appId)
              .ilike('email', user.email);
          }
        }
      }

      if (!role && appRow.link_access === 'view') {
        role = 'link_viewer';
      }
      if (!role) return null;

      return {
        ...appRow,
        owner: resolveUserByIdOrEmail(appRow.owner_id) || undefined,
        role,
      };
    }
  }

  const app = db.apps.get(appId);
  if (!app) return null;

  const versions = db.versions.get(appId) || [];
  const currentVersion =
    versions.find((v) => v.id === app.current_version_id) || versions[0];

  // Determine user's role
  let role: 'owner' | MemberRole | 'link_viewer' | null = null;

  if (user && isSameUserId(app.owner_id, user.id)) {
    role = 'owner';
  } else if (user) {
    const members = db.members.get(appId) || [];
    const member = members.find(
      (m) =>
        (m.user_id && isSameUserId(m.user_id, user.id)) ||
        m.email.toLowerCase() === user.email.toLowerCase()
    );
    if (member) {
      role = member.role;
      if (!member.user_id) {
        member.user_id = user.id;
      }
    }
  }

  // Check link access
  if (!role && app.link_access === 'view') {
    role = 'link_viewer';
  }

  // If no permission, return null (strict security)
  if (!role) {
    return null;
  }

  return {
    ...app,
    current_version: currentVersion,
    role,
  };
}

export async function createApp(
  title: string,
  prompt: string,
  html: string,
  ownerId: string
): Promise<App> {
  seedDemoApps();
  await ensureSupabaseDemoSeed();

  const htmlByteLength = Buffer.byteLength(html || '', 'utf8');
  if (htmlByteLength > MAX_HTML_BYTES) {
    throw new Error(
      `Generated HTML exceeds maximum allowed size (${Math.round(
        MAX_HTML_BYTES / 1024
      )} KB).`
    );
  }

  const appId = 'app_' + Math.random().toString(36).substring(2, 10);
  const versionId = 'ver_' + Math.random().toString(36).substring(2, 10);
  const dbOwnerId = toDbUserId(ownerId);

  const sb = getSupabaseServerClient();
  if (sb && isUuid(dbOwnerId)) {
    const { data: insertedApp, error: appErr } = await sb
      .from('apps')
      .insert({
        id: appId,
        owner_id: dbOwnerId,
        title: title || 'Untitled App',
        link_access: 'none',
      })
      .select('*')
      .single();

    if (!appErr && insertedApp) {
      const { data: insertedVer, error: verErr } = await sb
        .from('app_versions')
        .insert({
          id: versionId,
          app_id: insertedApp.id,
          html,
          prompt,
        })
        .select('*')
        .single();

      if (!verErr && insertedVer) {
        const { data: updatedApp } = await sb
          .from('apps')
          .update({ current_version_id: insertedVer.id })
          .eq('id', insertedApp.id)
          .select('*')
          .single();

        return {
          ...(updatedApp || insertedApp),
          owner: resolveUserByIdOrEmail(ownerId) || undefined,
          current_version: insertedVer,
          role: 'owner',
        };
      }
    }
  }

  const now = new Date().toISOString();
  const owner = resolveUserByIdOrEmail(ownerId) || {
    id: ownerId,
    name: 'User',
    email: 'user@example.com',
  };

  const newVersion: AppVersion = {
    id: versionId,
    app_id: appId,
    html,
    prompt,
    created_at: now,
  };

  const newApp: App = {
    id: appId,
    owner_id: ownerId,
    title: title || 'Untitled App',
    current_version_id: versionId,
    link_access: 'none',
    created_at: now,
    updated_at: now,
    owner,
    current_version: newVersion,
    role: 'owner',
  };

  db.apps.set(appId, newApp);
  db.versions.set(appId, [newVersion]);
  db.members.set(appId, []);

  return newApp;
}

export async function createAppVersion(
  appId: string,
  prompt: string,
  html: string,
  userId: string
): Promise<AppVersion> {
  seedDemoApps();
  await ensureSupabaseDemoSeed();

  const htmlByteLength = Buffer.byteLength(html || '', 'utf8');
  if (htmlByteLength > MAX_HTML_BYTES) {
    throw new Error(
      `Generated HTML exceeds maximum allowed size (${Math.round(
        MAX_HTML_BYTES / 1024
      )} KB).`
    );
  }

  const versionId = 'ver_' + Math.random().toString(36).substring(2, 10);

  const sb = getSupabaseServerClient();
  if (sb) {
    const user = resolveUserByIdOrEmail(userId);
    const app = await getApp(appId, user);
    if (!app || (app.role !== 'owner' && app.role !== 'editor')) {
      throw new Error(
        'Unauthorized: Only owners and editors can create new versions.'
      );
    }

    const { data: newVer, error } = await sb
      .from('app_versions')
      .insert({
        id: versionId,
        app_id: appId,
        html,
        prompt,
      })
      .select('*')
      .single();

    if (!error && newVer) {
      await sb
        .from('apps')
        .update({
          current_version_id: newVer.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appId);
      return newVer;
    }
  }

  const app = db.apps.get(appId);
  if (!app) throw new Error('App not found');

  // Verify permission: owner or editor
  const members = db.members.get(appId) || [];
  const isOwner = isSameUserId(app.owner_id, userId);
  const isEditor = members.some(
    (m) =>
      (isSameUserId(m.user_id, userId) ||
        m.email.toLowerCase() ===
          (resolveUserByIdOrEmail(userId)?.email || '').toLowerCase()) &&
      m.role === 'editor'
  );

  if (!isOwner && !isEditor) {
    throw new Error(
      'Unauthorized: Only owners and editors can create new versions.'
    );
  }

  const now = new Date().toISOString();
  const newVersion: AppVersion = {
    id: versionId,
    app_id: appId,
    html,
    prompt,
    created_at: now,
  };

  const versions = db.versions.get(appId) || [];
  versions.push(newVersion);
  if (versions.length > 20) {
    versions.splice(0, versions.length - 20);
  }
  db.versions.set(appId, versions);

  app.current_version_id = versionId;
  app.updated_at = now;
  db.apps.set(appId, app);

  return newVersion;
}

export async function getAppVersions(appId: string): Promise<AppVersion[]> {
  seedDemoApps();
  await ensureSupabaseDemoSeed();

  const sb = getSupabaseServerClient();
  if (sb) {
    const { data, error } = await sb
      .from('app_versions')
      .select('*')
      .eq('app_id', appId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error && data && data.length > 0) return data;
  }

  const list = db.versions.get(appId) || [];
  return [...list].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function restoreVersion(
  appId: string,
  versionId: string,
  userId: string
): Promise<App> {
  seedDemoApps();
  await ensureSupabaseDemoSeed();

  const sb = getSupabaseServerClient();
  if (sb) {
    const user = resolveUserByIdOrEmail(userId);
    const app = await getApp(appId, user);
    if (!app || (app.role !== 'owner' && app.role !== 'editor')) {
      throw new Error('Only owners and editors can restore versions.');
    }

    const { data: updated, error } = await sb
      .from('apps')
      .update({
        current_version_id: versionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appId)
      .select('*, current_version:app_versions!fk_apps_current_version(*)')
      .single();
    if (!error && updated) return updated;
  }

  const app = db.apps.get(appId);
  if (!app) throw new Error('App not found');

  const versions = db.versions.get(appId) || [];
  const version = versions.find((v) => v.id === versionId);
  if (!version) throw new Error('Version not found');

  app.current_version_id = versionId;
  app.updated_at = new Date().toISOString();
  db.apps.set(appId, app);

  return {
    ...app,
    current_version: version,
  };
}

export async function updateApp(
  appId: string,
  updates: Partial<Pick<App, 'title' | 'link_access'>>,
  userId: string
): Promise<App> {
  seedDemoApps();
  await ensureSupabaseDemoSeed();

  const sb = getSupabaseServerClient();
  const dbOwnerId = toDbUserId(userId);
  if (sb) {
    const { data, error } = await sb
      .from('apps')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appId)
      .eq('owner_id', dbOwnerId)
      .select('*, current_version:app_versions!fk_apps_current_version(*)')
      .single();
    if (!error && data) {
      return {
        ...data,
        owner: resolveUserByIdOrEmail(userId) || undefined,
        role: 'owner',
      };
    }
  }

  const app = db.apps.get(appId);
  if (!app) throw new Error('App not found');
  if (!isSameUserId(app.owner_id, userId))
    throw new Error('Only the owner can modify app settings.');

  if (updates.title !== undefined) app.title = updates.title;
  if (updates.link_access !== undefined) app.link_access = updates.link_access;
  app.updated_at = new Date().toISOString();

  db.apps.set(appId, app);
  const versions = db.versions.get(appId) || [];
  const currentVersion =
    versions.find((v) => v.id === app.current_version_id) || versions[0];
  return {
    ...app,
    current_version: currentVersion,
    role: 'owner',
  };
}

export async function duplicateApp(
  appId: string,
  userId: string
): Promise<App> {
  seedDemoApps();
  const user = resolveUserByIdOrEmail(userId);
  const sourceApp = await getApp(appId, user);
  if (!sourceApp) throw new Error('Source app not found or access denied');

  const currentVersion = sourceApp.current_version;
  return createApp(
    sourceApp.title + ' (Copy)',
    currentVersion ? currentVersion.prompt : 'Duplicated app',
    currentVersion ? currentVersion.html : '',
    userId
  );
}

export async function deleteApp(
  appId: string,
  userId: string
): Promise<boolean> {
  seedDemoApps();
  const sb = getSupabaseServerClient();
  const dbOwnerId = toDbUserId(userId);
  if (sb) {
    const { error } = await sb
      .from('apps')
      .delete()
      .eq('id', appId)
      .eq('owner_id', dbOwnerId);
    if (!error) {
      db.apps.delete(appId);
      return true;
    }
  }

  const app = db.apps.get(appId);
  if (!app) throw new Error('App not found');
  if (!isSameUserId(app.owner_id, userId))
    throw new Error('Only the owner can delete this app.');

  db.apps.delete(appId);
  db.versions.delete(appId);
  db.members.delete(appId);
  db.kv.delete(appId);
  return true;
}

// --- App Members / Sharing Operations ---

export async function getAppMembers(appId: string): Promise<AppMember[]> {
  seedDemoApps();
  await ensureSupabaseDemoSeed();

  const sb = getSupabaseServerClient();
  if (sb) {
    const { data, error } = await sb
      .from('app_members')
      .select('*')
      .eq('app_id', appId)
      .order('created_at', { ascending: true });
    if (!error && data) {
      return data.map((m: any) => ({
        ...m,
        user: resolveUserByIdOrEmail(m.user_id, m.email) || undefined,
      }));
    }
  }
  return db.members.get(appId) || [];
}

export async function addAppMember(
  appId: string,
  email: string,
  role: MemberRole,
  userId: string
): Promise<AppMember> {
  seedDemoApps();
  await ensureSupabaseDemoSeed();

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Please provide a valid email address.');
  }

  const matchingUser = resolveUserByIdOrEmail(null, normalizedEmail);
  const matchingDbUid = matchingUser ? toDbUserId(matchingUser.id) : null;

  const sb = getSupabaseServerClient();
  if (sb) {
    const memId = 'mem_' + Math.random().toString(36).substring(2, 9);
    const { data, error } = await sb
      .from('app_members')
      .upsert(
        {
          id: memId,
          app_id: appId,
          email: normalizedEmail,
          user_id: matchingDbUid && isUuid(matchingDbUid) ? matchingDbUid : null,
          role,
        },
        { onConflict: 'app_id,email' }
      )
      .select('*')
      .single();
    if (!error && data) {
      return {
        ...data,
        user: matchingUser || undefined,
      };
    }
  }

  const app = db.apps.get(appId);
  if (!app) throw new Error('App not found');
  if (!isSameUserId(app.owner_id, userId))
    throw new Error('Only owner can invite members.');

  const members = db.members.get(appId) || [];
  const existing = members.find(
    (m) => m.email.toLowerCase() === normalizedEmail
  );

  if (existing) {
    existing.role = role;
    return existing;
  }

  const newMember: AppMember = {
    id: 'mem_' + Math.random().toString(36).substring(2, 9),
    app_id: appId,
    email: normalizedEmail,
    user_id: matchingUser ? matchingUser.id : null,
    role,
    created_at: new Date().toISOString(),
    user: matchingUser || undefined,
  };

  members.push(newMember);
  db.members.set(appId, members);
  return newMember;
}

export async function removeAppMember(
  appId: string,
  memberId: string,
  userId: string
): Promise<boolean> {
  seedDemoApps();
  const sb = getSupabaseServerClient();
  if (sb) {
    const { error } = await sb
      .from('app_members')
      .delete()
      .eq('id', memberId)
      .eq('app_id', appId);
    if (!error) return true;
  }

  const app = db.apps.get(appId);
  if (!app) throw new Error('App not found');
  if (!isSameUserId(app.owner_id, userId))
    throw new Error('Only owner can remove members.');

  const members = db.members.get(appId) || [];
  const updated = members.filter((m) => m.id !== memberId);
  db.members.set(appId, updated);
  return true;
}

export async function updateAppMemberRole(
  appId: string,
  memberId: string,
  role: MemberRole,
  userId: string
): Promise<AppMember> {
  seedDemoApps();
  const sb = getSupabaseServerClient();
  if (sb) {
    const { data, error } = await sb
      .from('app_members')
      .update({ role })
      .eq('id', memberId)
      .eq('app_id', appId)
      .select('*')
      .single();
    if (!error && data) return data;
  }

  const app = db.apps.get(appId);
  if (!app) throw new Error('App not found');
  if (!isSameUserId(app.owner_id, userId))
    throw new Error('Only owner can change member roles.');

  const members = db.members.get(appId) || [];
  const member = members.find((m) => m.id === memberId);
  if (!member) throw new Error('Member not found');

  member.role = role;
  return member;
}

// --- Shared KV Storage for Injected SDK ---

export async function getAppKV(appId: string, key: string): Promise<any> {
  seedDemoApps();
  if (!key || typeof key !== 'string') return null;

  const sb = getSupabaseServerClient();
  if (sb) {
    const { data, error } = await sb
      .from('app_kv')
      .select('value')
      .eq('app_id', appId)
      .eq('key', key)
      .maybeSingle();
    if (!error && data) return data.value;
  }

  const appStore = db.kv.get(appId);
  if (!appStore) return null;
  return appStore.get(key) ?? null;
}

export async function setAppKV(
  appId: string,
  key: string,
  value: any,
  userId?: string | null
): Promise<boolean> {
  seedDemoApps();
  await ensureSupabaseDemoSeed();

  if (!key || typeof key !== 'string' || key.trim() === '') {
    throw new Error('Key must be a non-empty string');
  }
  if (key.length > MAX_KEY_LENGTH) {
    throw new Error(`Key exceeds maximum length of ${MAX_KEY_LENGTH} characters`);
  }
  if (value === undefined) {
    throw new Error('Value cannot be undefined');
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new Error('Value must be valid JSON');
  }

  const byteLen = Buffer.byteLength(serialized, 'utf8');
  if (byteLen > MAX_KV_BYTES) {
    throw new Error(
      `Value exceeds maximum size limit of ${Math.round(MAX_KV_BYTES / 1024)} KB`
    );
  }

  const parsedValue = JSON.parse(serialized);
  const dbUid = userId ? toDbUserId(userId) : null;

  const sb = getSupabaseServerClient();
  if (sb) {
    const { error } = await sb.from('app_kv').upsert(
      {
        app_id: appId,
        key: key.trim(),
        value: parsedValue,
        updated_by: dbUid && isUuid(dbUid) ? dbUid : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'app_id,key' }
    );
    if (!error) return true;
  }

  let appStore = db.kv.get(appId);
  if (!appStore) {
    appStore = new Map();
    db.kv.set(appId, appStore);
  }

  appStore.set(key.trim(), parsedValue);
  return true;
}

export async function listAppKV(
  appId: string,
  prefix: string = ''
): Promise<string[]> {
  seedDemoApps();

  const sb = getSupabaseServerClient();
  if (sb) {
    let query = sb.from('app_kv').select('key').eq('app_id', appId);
    if (prefix) {
      query = query.ilike('key', `${prefix}%`);
    }
    const { data, error } = await query;
    if (!error && data) {
      return data.map((r: any) => r.key);
    }
  }

  const appStore = db.kv.get(appId);
  if (!appStore) return [];
  const keys: string[] = [];
  appStore.forEach((_, k) => {
    if (!prefix || k.startsWith(prefix)) {
      keys.push(k);
    }
  });
  return keys;
}
