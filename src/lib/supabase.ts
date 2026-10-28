// ==============================================================================
// Small Software Cloud - Supabase Client
// Connects to live Supabase backend when environment variables are supplied
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Returns true if real Supabase environment is active
 */
export function hasSupabase(): boolean {
  return !!supabase;
}
