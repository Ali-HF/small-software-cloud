// ==============================================================================
// Small Software Cloud - Supabase Client & Auth Helpers
// Connects to live Supabase backend (Auth, Postgres, Realtime) when configured,
// and gracefully falls back to Hybrid Local Mode when using placeholder env vars.
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User } from '@/types';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

function isRealSupabaseConfig(url: string, key: string): boolean {
  if (!url || !key) return false;
  if (url.includes('your-project.supabase.co')) return false;
  if (key.includes('your-supabase-') || key === 'your-anon-key') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const supabase: SupabaseClient | null = isRealSupabaseConfig(supabaseUrl, supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

let adminClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  const keyToUse =
    supabaseServiceKey && !supabaseServiceKey.includes('your-supabase-')
      ? supabaseServiceKey
      : supabaseAnonKey;
  if (!isRealSupabaseConfig(supabaseUrl, keyToUse)) return null;
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, keyToUse, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

/**
 * Returns true if a real Supabase project is configured
 */
export function hasSupabase(): boolean {
  return !!supabase;
}

/**
 * Triggers Google or GitHub OAuth sign-in via Supabase Auth
 */
export async function signInWithOAuthProvider(
  provider: 'google' | 'github',
  redirectPath: string = '/dashboard'
): Promise<{ url?: string; error?: string }> {
  if (!supabase) {
    return {
      error:
        'Live Supabase Auth is not configured in .env.local. Using instant Dev Account Switcher instead.',
    };
  }

  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
    },
  });

  if (error) {
    return { error: error.message };
  }
  return { url: data?.url || undefined };
}

/**
 * Signs out of Supabase Auth
 */
export async function signOutSupabase(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
}

/**
 * Returns the currently authenticated Supabase user mapped to our User interface
 */
export async function getSupabaseSessionUser(): Promise<User | null> {
  if (!supabase) return null;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return null;
    const u = session.user;
    return {
      id: u.id,
      email: u.email || '',
      name:
        u.user_metadata?.full_name ||
        u.user_metadata?.name ||
        u.user_metadata?.user_name ||
        (u.email ? u.email.split('@')[0] : 'User'),
      avatar_url: u.user_metadata?.avatar_url,
    };
  } catch {
    return null;
  }
}
