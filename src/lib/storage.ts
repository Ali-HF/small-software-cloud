// ==============================================================================
// Small Software Cloud - Storage & State Service
// Supports both Live Supabase and Hybrid In-Memory / Local Storage mode
// ==============================================================================

import { App, AppVersion, AppMember, AppKV, User, LinkAccess, MemberRole } from '@/types';
import { DEMO_APP_EXPENSE_SPLITTER, DEMO_APP_LIVE_POLL, DEMO_APP_HABIT_ROSTER } from './demo-apps';

// Mock Test Accounts for instant testing of multi-user collaboration
export const MOCK_USERS: User[] = [
  { id: 'usr_alice', name: 'Alice (Owner)', email: 'alice@example.com', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { id: 'usr_bob', name: 'Bob (Editor)', email: 'bob@example.com', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' },
  { id: 'usr_charlie', name: 'Charlie (Viewer)', email: 'charlie@example.com', avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop' }
];

// In-Memory store (persisted in global scope across hot reloads)
interface GlobalStorage {
  apps: Map<string, App>;
  versions: Map<string, AppVersion[]>;
  members: Map<string, AppMember[]>;
  kv: Map<string, Map<string, any>>;
  initialized: boolean;
}

const globalForStorage = globalThis as unknown as { __storage?: GlobalStorage };

if (!globalForStorage.__storage) {
  globalForStorage.__storage = {
    apps: new Map(),
    versions: new Map(),
    members: new Map(),
    kv: new Map(),
    initialized: false
  };
}

const db = globalForStorage.__storage;

// Seed initial Demo Apps
export function seedDemoApps() {
  if (db.initialized && db.apps.size > 0) return;

  const now = new Date().toISOString();
  const alice = MOCK_USERS[0];
  const bob = MOCK_USERS[1];
  const charlie = MOCK_USERS[2];

  // 1. Flatmate Expense Splitter
  const expenseAppId = 'app-expense-demo';
  const expenseVersionId = 'ver-expense-1';
  const expenseApp: App = {
    id: expenseAppId,
    owner_id: alice.id,
    title: 'Flatmate Expense Splitter',
    current_version_id: expenseVersionId,
    link_access: 'view',
    created_at: now,
    updated_at: now,
    owner: alice
  };
  const expenseVersion: AppVersion = {
    id: expenseVersionId,
    app_id: expenseAppId,
    html: DEMO_APP_EXPENSE_SPLITTER,
    prompt: 'Create a shared expense splitter for flatmates with net balances, realtime spending total, and expense list.',
    created_at: now
  };

  // 2. Live Team Poll
  const pollAppId = 'app-poll-demo';
  const pollVersionId = 'ver-poll-1';
  const pollApp: App = {
    id: pollAppId,
    owner_id: alice.id,
    title: 'Live Team Architecture Poll',
    current_version_id: pollVersionId,
    link_access: 'view',
    created_at: now,
    updated_at: now,
    owner: alice
  };
  const pollVersion: AppVersion = {
    id: pollVersionId,
    app_id: pollAppId,
    html: DEMO_APP_LIVE_POLL,
    prompt: 'Build a live voting poll with animated percentage bars, vote count, and multiplayer synchronization.',
    created_at: now
  };

  // 3. Shared Habit & Task Roster
  const rosterAppId = 'app-roster-demo';
  const rosterVersionId = 'ver-roster-1';
  const rosterApp: App = {
    id: rosterAppId,
    owner_id: alice.id,
    title: 'Team Habit & Weekly Standup Roster',
    current_version_id: rosterVersionId,
    link_access: 'view',
    created_at: now,
    updated_at: now,
    owner: alice
  };
  const rosterVersion: AppVersion = {
    id: rosterVersionId,
    app_id: rosterAppId,
    html: DEMO_APP_HABIT_ROSTER,
    prompt: 'A weekly team habit and standup roster table with Mon-Fri interactive check buttons and live sync.',
    created_at: now
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
    { id: 'mem_1', app_id: expenseAppId, email: bob.email, user_id: bob.id, role: 'editor', created_at: now, user: bob },
    { id: 'mem_2', app_id: expenseAppId, email: charlie.email, user_id: charlie.id, role: 'viewer', created_at: now, user: charlie }
  ]);

  db.members.set(pollAppId, [
    { id: 'mem_3', app_id: pollAppId, email: bob.email, user_id: bob.id, role: 'editor', created_at: now, user: bob }
  ]);

  db.initialized = true;
}

// Ensure demo apps are seeded
seedDemoApps();

// Check if live Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// --- App Service Operations ---

export async function getApps(userId: string): Promise<App[]> {
  seedDemoApps();
  const results: App[] = [];
  db.apps.forEach(app => {
    if (app.owner_id === userId) {
      const versions = db.versions.get(app.id) || [];
      const currentVersion = versions.find(v => v.id === app.current_version_id) || versions[0];
      results.push({
        ...app,
        current_version: currentVersion,
        role: 'owner'
      });
    }
  });
  return results.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export async function getSharedApps(userEmail: string): Promise<App[]> {
  seedDemoApps();
  const results: App[] = [];
  db.members.forEach((membersList, appId) => {
    const membership = membersList.find(m => m.email.toLowerCase() === userEmail.toLowerCase());
    if (membership) {
      const app = db.apps.get(appId);
      if (app) {
        const versions = db.versions.get(app.id) || [];
        const currentVersion = versions.find(v => v.id === app.current_version_id) || versions[0];
        results.push({
          ...app,
          current_version: currentVersion,
          role: membership.role
        });
      }
    }
  });
  return results.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export async function getApp(appId: string, user: User | null): Promise<App | null> {
  seedDemoApps();
  const app = db.apps.get(appId);
  if (!app) return null;

  const versions = db.versions.get(appId) || [];
  const currentVersion = versions.find(v => v.id === app.current_version_id) || versions[0];

  // Determine user's role
  let role: 'owner' | MemberRole | 'link_viewer' | null = null;

  if (user && app.owner_id === user.id) {
    role = 'owner';
  } else if (user) {
    const members = db.members.get(appId) || [];
    const member = members.find(m => 
      (m.user_id && m.user_id === user.id) || 
      (m.email.toLowerCase() === user.email.toLowerCase())
    );
    if (member) {
      role = member.role;
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
    role
  };
}

export async function createApp(title: string, prompt: string, html: string, ownerId: string): Promise<App> {
  seedDemoApps();
  const appId = 'app_' + Math.random().toString(36).substring(2, 10);
  const versionId = 'ver_' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  const owner = MOCK_USERS.find(u => u.id === ownerId) || {
    id: ownerId,
    name: 'User',
    email: 'user@example.com'
  };

  const newVersion: AppVersion = {
    id: versionId,
    app_id: appId,
    html,
    prompt,
    created_at: now
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
    role: 'owner'
  };

  db.apps.set(appId, newApp);
  db.versions.set(appId, [newVersion]);
  db.members.set(appId, []);

  return newApp;
}

export async function createAppVersion(appId: string, prompt: string, html: string, userId: string): Promise<AppVersion> {
  seedDemoApps();
  const app = db.apps.get(appId);
  if (!app) throw new Error('App not found');

  // Verify permission: owner or editor
  const members = db.members.get(appId) || [];
  const isOwner = app.owner_id === userId;
  const isEditor = members.some(m => m.user_id === userId && m.role === 'editor');

  if (!isOwner && !isEditor) {
    throw new Error('Unauthorized: Only owners and editors can create new versions.');
  }

  const versionId = 'ver_' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  const newVersion: AppVersion = {
    id: versionId,
    app_id: appId,
    html,
    prompt,
    created_at: now
  };

  const versions = db.versions.get(appId) || [];
  versions.push(newVersion);
  db.versions.set(appId, versions);

  // Update current version in app
  app.current_version_id = versionId;
  app.updated_at = now;
  db.apps.set(appId, app);

  return newVersion;
}

export async function getAppVersions(appId: string): Promise<AppVersion[]> {
  seedDemoApps();
  const list = db.versions.get(appId) || [];
  return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function restoreVersion(appId: string, versionId: string, userId: string): Promise<App> {
  seedDemoApps();
  const app = db.apps.get(appId);
  if (!app) throw new Error('App not found');

  const versions = db.versions.get(appId) || [];
  const version = versions.find(v => v.id === versionId);
  if (!version) throw new Error('Version not found');

  app.current_version_id = versionId;
  app.updated_at = new Date().toISOString();
  db.apps.set(appId, app);

  return app;
}

export async function updateApp(appId: string, updates: Partial<Pick<App, 'title' | 'link_access'>>, userId: string): Promise<App> {
  seedDemoApps();
  const app = db.apps.get(appId);
  if (!app) throw new Error('App not found');
  if (app.owner_id !== userId) throw new Error('Only the owner can modify app settings.');

  if (updates.title !== undefined) app.title = updates.title;
  if (updates.link_access !== undefined) app.link_access = updates.link_access;
  app.updated_at = new Date().toISOString();

  db.apps.set(appId, app);
  return app;
}

export async function duplicateApp(appId: string, userId: string): Promise<App> {
  seedDemoApps();
  const sourceApp = db.apps.get(appId);
  if (!sourceApp) throw new Error('Source app not found');

  const versions = db.versions.get(appId) || [];
  const currentVersion = versions.find(v => v.id === sourceApp.current_version_id) || versions[0];

  return createApp(
    sourceApp.title + ' (Copy)',
    currentVersion ? currentVersion.prompt : 'Duplicated app',
    currentVersion ? currentVersion.html : '',
    userId
  );
}

export async function deleteApp(appId: string, userId: string): Promise<boolean> {
  seedDemoApps();
  const app = db.apps.get(appId);
  if (!app) throw new Error('App not found');
  if (app.owner_id !== userId) throw new Error('Only the owner can delete this app.');

  db.apps.delete(appId);
  db.versions.delete(appId);
  db.members.delete(appId);
  db.kv.delete(appId);
  return true;
}

// --- App Members / Sharing Operations ---

export async function getAppMembers(appId: string): Promise<AppMember[]> {
  seedDemoApps();
  return db.members.get(appId) || [];
}

export async function addAppMember(appId: string, email: string, role: MemberRole, userId: string): Promise<AppMember> {
  seedDemoApps();
  const app = db.apps.get(appId);
  if (!app) throw new Error('App not found');
  if (app.owner_id !== userId) throw new Error('Only owner can invite members.');

  const members = db.members.get(appId) || [];
  const existing = members.find(m => m.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    existing.role = role;
    return existing;
  }

  const matchingUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  const newMember: AppMember = {
    id: 'mem_' + Math.random().toString(36).substring(2, 9),
    app_id: appId,
    email: email.toLowerCase(),
    user_id: matchingUser ? matchingUser.id : null,
    role,
    created_at: new Date().toISOString(),
    user: matchingUser
  };

  members.push(newMember);
  db.members.set(appId, members);
  return newMember;
}

export async function removeAppMember(appId: string, memberId: string, userId: string): Promise<boolean> {
  seedDemoApps();
  const app = db.apps.get(appId);
  if (!app) throw new Error('App not found');
  if (app.owner_id !== userId) throw new Error('Only owner can remove members.');

  const members = db.members.get(appId) || [];
  const updated = members.filter(m => m.id !== memberId);
  db.members.set(appId, updated);
  return true;
}

export async function updateAppMemberRole(appId: string, memberId: string, role: MemberRole, userId: string): Promise<AppMember> {
  seedDemoApps();
  const app = db.apps.get(appId);
  if (!app) throw new Error('App not found');
  if (app.owner_id !== userId) throw new Error('Only owner can change member roles.');

  const members = db.members.get(appId) || [];
  const member = members.find(m => m.id === memberId);
  if (!member) throw new Error('Member not found');

  member.role = role;
  return member;
}

// --- Shared KV Storage for Injected SDK ---

export async function getAppKV(appId: string, key: string): Promise<any> {
  seedDemoApps();
  const appStore = db.kv.get(appId);
  if (!appStore) return null;
  return appStore.get(key) ?? null;
}

export async function setAppKV(appId: string, key: string, value: any, userId?: string | null): Promise<boolean> {
  seedDemoApps();
  // Validate value is serializable JSON
  if (value === undefined) throw new Error('Value cannot be undefined');
  try {
    JSON.stringify(value);
  } catch {
    throw new Error('Value must be valid JSON');
  }

  let appStore = db.kv.get(appId);
  if (!appStore) {
    appStore = new Map();
    db.kv.set(appId, appStore);
  }

  appStore.set(key, value);
  return true;
}

export async function listAppKV(appId: string, prefix: string = ''): Promise<string[]> {
  seedDemoApps();
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
