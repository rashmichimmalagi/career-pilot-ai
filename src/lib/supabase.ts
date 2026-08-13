import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://liqaeoxwjhsalfdqdwcr.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_ANON_KEY) &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
    SUPABASE_ANON_KEY.length > 20
  );
};

// Create Supabase client instance
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY || 'placeholder-anon-key-for-initialization',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }
);

/**
 * Get the exact OAuth redirect URI for Supabase & Google Cloud configuration.
 */
export const getOAuthRedirectUri = (): string => {
  const origin = window.location.origin;
  return `${origin}/auth`;
};

/**
 * Sign in with Google OAuth using Supabase Auth
 */
export const signInWithGoogle = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase environment variables (VITE_SUPABASE_ANON_KEY) are not configured yet. Please configure your key in environment secrets.'
    );
  }

  const redirectTo = getOAuthRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Sign in with GitHub OAuth using Supabase Auth
 */
export const signInWithGitHub = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase environment variables (VITE_SUPABASE_ANON_KEY) are not configured yet. Please configure your key in environment secrets.'
    );
  }

  const redirectTo = window.location.origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Sign out current user
 */
export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};
