import { createClient, User } from '@supabase/supabase-js';

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
 * Helper to check if a user's email is verified.
 * Google and GitHub OAuth users are automatically considered verified.
 * Email/Password users require email_confirmed_at / confirmed_at from Supabase Auth.
 */
export const isUserEmailVerified = (user: User | null): boolean => {
  if (!user) return false;

  const provider = user.app_metadata?.provider;
  const isOAuth =
    provider === 'google' ||
    provider === 'github' ||
    Boolean(user.identities?.some((id) => id.provider === 'google' || id.provider === 'github'));

  if (isOAuth) {
    return true;
  }

  return Boolean(user.email_confirmed_at || user.confirmed_at);
};

/**
 * Helper to get the environment-aware auth redirect URL for OAuth providers.
 * Prefers VITE_SITE_URL if configured (e.g. on Vercel production),
 * otherwise falls back to window.location.origin.
 */
export const getAuthRedirectUrl = (): string => {
  if (import.meta.env.VITE_SITE_URL) {
    return import.meta.env.VITE_SITE_URL;
  }
  return window.location.origin;
};

/**
 * Get the exact OAuth redirect URI for Supabase & Google Cloud configuration.
 */
export const getOAuthRedirectUri = (): string => {
  return getAuthRedirectUrl();
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

  const redirectTo = getAuthRedirectUrl();

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

  const redirectTo = getAuthRedirectUrl();

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
 * Sign up with Email and Password using Supabase Auth
 */
export const signUpWithEmail = async (email: string, password: string) => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase environment variables (VITE_SUPABASE_ANON_KEY) are not configured yet. Please configure your key in environment secrets.'
    );
  }

  const redirectTo = getAuthRedirectUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Sign in with Email and Password using Supabase Auth
 */
export const signInWithEmail = async (email: string, password: string) => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase environment variables (VITE_SUPABASE_ANON_KEY) are not configured yet. Please configure your key in environment secrets.'
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Send Password Reset Email using Supabase Auth
 */
export const sendPasswordResetEmail = async (email: string) => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase environment variables (VITE_SUPABASE_ANON_KEY) are not configured yet. Please configure your key in environment secrets.'
    );
  }

  const redirectTo = `${getAuthRedirectUrl()}/reset-password`;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Update user password (for password recovery flow)
 */
export const updatePassword = async (newPassword: string) => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase environment variables (VITE_SUPABASE_ANON_KEY) are not configured yet. Please configure your key in environment secrets.'
    );
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Resend Verification Email using Supabase Auth
 */
export const resendVerificationEmail = async (email: string) => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase environment variables (VITE_SUPABASE_ANON_KEY) are not configured yet. Please configure your key in environment secrets.'
    );
  }

  const redirectTo = getAuthRedirectUrl();

  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: redirectTo,
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
