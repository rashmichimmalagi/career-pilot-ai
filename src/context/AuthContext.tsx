import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  supabase,
  isSupabaseConfigured,
  isUserEmailVerified,
  signInWithGoogle,
  signInWithGitHub,
  signUpWithEmail,
  signInWithEmail,
  sendPasswordResetEmail,
  resendVerificationEmail,
  updatePassword,
  signOutUser
} from '../lib/supabase';
import { profileService } from '../services/profileService';
import { Profile } from '../types/database';
import { Toast, ToastData } from '../components/common/Toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  isEmailVerified: boolean;
  toast: ToastData | null;
  showToast: (
    title: string,
    subtitle?: string,
    type?: 'success' | 'info' | 'warning' | 'error',
    action?: { label: string; onClick: () => void },
    duration?: number
  ) => void;
  dismissToast: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<any>;
  signInWithEmail: (email: string, password: string) => Promise<any>;
  sendPasswordResetEmail: (email: string) => Promise<any>;
  resendVerificationEmail: (email: string) => Promise<any>;
  updatePassword: (newPassword: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  refreshUser: () => Promise<User | null>;
  clearError: () => void;
  setProfileState: (profile: Profile | null) => void;
  setUserState: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  const configured = isSupabaseConfigured();

  const showToast = useCallback(
    (
      title: string,
      subtitle?: string,
      type: 'success' | 'info' | 'warning' | 'error' = 'success',
      action?: { label: string; onClick: () => void },
      duration?: number
    ) => {
      setToast({
        id: Date.now().toString(),
        title,
        subtitle,
        type,
        action,
        duration
      });
    },
    []
  );

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  // Auto-dismiss toast after duration
  useEffect(() => {
    if (!toast) return;
    const duration = toast.duration || (toast.type === 'warning' || toast.type === 'error' ? 2800 : 4000);
    const timer = setTimeout(() => {
      setToast(null);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast]);

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
    // Check for OAuth errors returned in URL query parameters or hash fragment
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const oauthError =
      urlParams.get('error_description') ||
      urlParams.get('error') ||
      hashParams.get('error_description') ||
      hashParams.get('error');

    if (oauthError) {
      const formattedError = decodeURIComponent(oauthError).replace(/\+/g, ' ');
      setError(`Authentication error: ${formattedError}`);
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }

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

        let authenticatedUser = currentSession?.user ?? null;
        if (currentSession) {
          try {
            const { data: { user: serverUser } } = await supabase.auth.getUser();
            if (serverUser) {
              authenticatedUser = serverUser;
            }
          } catch {
            // fallback to currentSession user
          }
        }

        if (isMounted) {
          setSession(currentSession);
          setUser(authenticatedUser);
        }

        if (authenticatedUser) {
          if (currentSession?.access_token) {
            sessionStorage.setItem('notified_session_token', currentSession.access_token);
          }
          const p = await fetchProfileForUser(authenticatedUser.id);
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

      if (event === 'INITIAL_SESSION') {
        if (newSession?.access_token) {
          sessionStorage.setItem('notified_session_token', newSession.access_token);
        }
        if (newSession?.user) {
          await fetchProfileForUser(newSession.user.id);
        } else {
          setProfile(null);
        }
      } else if (event === 'SIGNED_IN' && newSession?.user && newSession.access_token) {
        const prevToken = sessionStorage.getItem('notified_session_token');
        const userProfile = await fetchProfileForUser(newSession.user.id);

        if (prevToken !== newSession.access_token) {
          sessionStorage.setItem('notified_session_token', newSession.access_token);

          const rawName =
            userProfile?.full_name ||
            newSession.user.user_metadata?.full_name ||
            newSession.user.user_metadata?.name ||
            newSession.user.user_metadata?.user_name ||
            '';

          const studentName = typeof rawName === 'string' && rawName.trim() ? rawName.trim().split(' ')[0] : '';

          if (userProfile) {
            const title = studentName ? `Welcome back, ${studentName}! 👋` : 'Welcome back! 👋';
            showToast(title, "You're successfully signed in.", 'success');
          } else {
            showToast('Welcome to CareerPilot AI! 👋', "Let's set up your career profile.", 'success');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('notified_session_token');
        setProfile(null);
      } else if (newSession?.user) {
        await fetchProfileForUser(newSession.user.id);
      } else {
        setProfile(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    const handleProfileUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ profile: Profile; userId: string }>;
      if (customEvent.detail?.profile) {
        setProfile(customEvent.detail.profile);
      }
    };
    window.addEventListener('careerpilot_profile_updated', handleProfileUpdated);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('careerpilot_profile_updated', handleProfileUpdated);
    };
  }, [configured, fetchProfileForUser, showToast]);

  const handleSignInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.warn('Google Sign-In Notice:', err);
      setError(err.message || 'Failed to initiate Google Authentication. Please try again.');
      throw err;
    }
  };

  const handleSignInWithGitHub = async () => {
    setError(null);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        return;
      }
      await signInWithGitHub();
    } catch (err: any) {
      console.warn('GitHub Sign-In Notice:', err);
      setError(err.message || 'Failed to initiate GitHub Authentication. Please try again.');
      throw err;
    }
  };

  const handleSignUpWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      const data = await signUpWithEmail(email, password);
      return data;
    } catch (err: any) {
      console.warn('Email Sign-Up Notice:', err);
      const msg = err.message || 'Failed to create account.';
      setError(msg);
      throw err;
    }
  };

  const handleSignInWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      const data = await signInWithEmail(email, password);
      return data;
    } catch (err: any) {
      console.warn('Email Sign-In Notice:', err);
      const msg = err.message || 'Failed to sign in with email.';
      setError(msg);
      throw err;
    }
  };

  const handleSendPasswordResetEmail = async (email: string) => {
    setError(null);
    try {
      const data = await sendPasswordResetEmail(email);
      return data;
    } catch (err: any) {
      console.warn('Password Reset Notice:', err);
      const msg = err.message || 'Failed to send password reset email.';
      setError(msg);
      throw err;
    }
  };

  const handleResendVerificationEmail = async (email: string) => {
    setError(null);
    try {
      const data = await resendVerificationEmail(email);
      return data;
    } catch (err: any) {
      console.warn('Resend Verification Notice:', err);
      const msg = err.message || 'Failed to resend verification email.';
      setError(msg);
      throw err;
    }
  };

  const handleUpdatePassword = async (newPassword: string) => {
    setError(null);
    try {
      const data = await updatePassword(newPassword);
      return data;
    } catch (err: any) {
      console.warn('Update Password Notice:', err);
      const msg = err.message || 'Failed to update password.';
      setError(msg);
      throw err;
    }
  };

  const handleSignOut = async () => {
    setError(null);
    try {
      sessionStorage.removeItem('notified_session_token');
      await signOutUser();
      setUser(null);
      setSession(null);
      setProfile(null);
      showToast('Signed out successfully 👋', 'See you next time!', 'info');
    } catch (err: any) {
      console.error('Sign Out Error:', err);
      setError(err.message || 'Failed to sign out.');
    }
  };

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return null;
      return await fetchProfileForUser(currentUser.id);
    } catch {
      return null;
    }
  }, [fetchProfileForUser]);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const { data: { user: freshUser }, error } = await supabase.auth.getUser();
      if (!error && freshUser) {
        setUser(freshUser);
        return freshUser;
      }
      return null;
    } catch (err) {
      console.warn('Failed to refresh user auth state:', err);
      return null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const isEmailVerified = isUserEmailVerified(user);

  const contextValue = React.useMemo<AuthContextType>(
    () => ({
      user,
      session,
      profile,
      loading,
      profileLoading,
      error,
      isConfigured: configured,
      isEmailVerified,
      toast,
      showToast,
      dismissToast,
      signInWithGoogle: handleSignInWithGoogle,
      signInWithGitHub: handleSignInWithGitHub,
      signUpWithEmail: handleSignUpWithEmail,
      signInWithEmail: handleSignInWithEmail,
      sendPasswordResetEmail: handleSendPasswordResetEmail,
      resendVerificationEmail: handleResendVerificationEmail,
      updatePassword: handleUpdatePassword,
      signOut: handleSignOut,
      refreshProfile,
      refreshUser,
      clearError,
      setProfileState: setProfile,
      setUserState: setUser,
    }),
    [
      user,
      session,
      profile,
      loading,
      profileLoading,
      error,
      configured,
      isEmailVerified,
      toast,
      showToast,
      dismissToast,
      handleSignInWithGoogle,
      handleSignInWithGitHub,
      handleSignUpWithEmail,
      handleSignInWithEmail,
      handleSendPasswordResetEmail,
      handleResendVerificationEmail,
      handleUpdatePassword,
      handleSignOut,
      refreshProfile,
      refreshUser,
      clearError,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <Toast toast={toast} onClose={dismissToast} />
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
