import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, signInWithGoogle, signOutUser } from '../lib/supabase';
import { profileService } from '../services/profileService';
import { Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  clearError: () => void;
  setProfileState: (profile: Profile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  const fetchProfileForUser = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const userProfile = await profileService.getProfile(userId);
      setProfile(userProfile);
      return userProfile;
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Initialize session and set up auth state change listener
  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session retrieval error:', sessionError);
          if (isMounted) setError(sessionError.message);
        }

        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }

        if (currentSession?.user) {
          const p = await fetchProfileForUser(currentSession.user.id);
          if (isMounted) setProfile(p);
        }
      } catch (err: any) {
        console.error('Error initializing auth state:', err);
        if (isMounted) setError(err.message || 'Authentication error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen to Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      console.log('Auth event triggered:', event);
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (newSession?.user) {
          await fetchProfileForUser(newSession.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [configured, fetchProfileForUser]);

  const handleSignInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setError(err.message || 'Failed to initiate Google Authentication. Please try again.');
      throw err;
    }
  };

  const handleSignOut = async () => {
    setError(null);
    try {
      await signOutUser();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (err: any) {
      console.error('Sign Out Error:', err);
      setError(err.message || 'Failed to sign out.');
    }
  };

  const refreshProfile = async (): Promise<Profile | null> => {
    if (!user) return null;
    return await fetchProfileForUser(user.id);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        profileLoading,
        error,
        isConfigured: configured,
        signInWithGoogle: handleSignInWithGoogle,
        signOut: handleSignOut,
        refreshProfile,
        clearError,
        setProfileState: setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
