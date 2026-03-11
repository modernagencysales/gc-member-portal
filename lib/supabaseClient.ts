/**
 * supabaseClient. Creates and exports the shared Supabase client for all DB and auth operations.
 * Constraint: Use this singleton — never call createClient() directly elsewhere. Degrades gracefully when env vars are missing.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logWarn } from './logError';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a dummy client if env vars are missing (for preview/dev without Supabase)
const createSupabaseClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseAnonKey) {
    logWarn(
      'supabaseClient:init',
      'Missing Supabase environment variables - bootcamp features will be disabled'
    );
    // Return a minimal client that won't crash but will fail gracefully
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();
