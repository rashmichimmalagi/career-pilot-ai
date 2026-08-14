import React, { useState, useEffect } from 'react';
import { Compass, ShieldAlert, Key, Loader2, ArrowLeft, Eye, EyeOff, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isUserEmailVerified } from '../lib/supabase';
import { profileService } from '../services/profileService';

interface AuthPageProps {
  onNavigate: (page: string) => void;
  onOpenSetupGuide: () => void;
}

type AuthViewMode = 'main' | 'email';
type EmailFormMode = 'signin' | 'signup' | 'forgot';

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate, onOpenSetupGuide }) => {
  const {
    user,
    profile,
    loading,
    error,
    isConfigured,
    isEmailVerified,
    signInWithGitHub,
    signUpWithEmail,
    signInWithEmail,
    sendPasswordResetEmail,
    clearError,
    showToast
  } = useAuth();

  const getInitialMode = (): EmailFormMode => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    return mode === 'signup' ? 'signup' : 'signin';
  };

  const [authView, setAuthView] = useState<AuthViewMode>('main');
  const [emailMode, setEmailMode] = useState<EmailFormMode>(getInitialMode);

  const [isGitHubAuthenticating, setIsGitHubAuthenticating] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  // Email form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const switchMode = (newMode: 'signup' | 'signin') => {
    clearError();
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setEmailMode(newMode);
    setAuthView('email');
    const params = new URLSearchParams(window.location.search);
    params.set('mode', newMode);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  };

  // Sync mode with URL search params
  useEffect(() => {
    const mode = getInitialMode();
    setEmailMode(mode);
  }, [window.location.search]);

  // Clear any leftover auth errors when AuthPage mounts
  useEffect(() => {
    clearError();
  }, []);

  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      if (!isEmailVerified) {
        onNavigate('verify-email');
      } else if (profile) {
        onNavigate('dashboard');
      } else {
        onNavigate('onboarding');
      }
    }
  }, [loading, user, profile, isEmailVerified, onNavigate]);

  const resetFormState = () => {
    clearError();
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const handleGitHubSignIn = async () => {
    clearError();
    setIsGitHubAuthenticating(true);

    try {
      // 1. First check if a valid Supabase session exists
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      const currentUser = existingSession?.user || user;

      if (currentUser) {
        // Active session exists -> do NOT open GitHub or request reauthorization
        const userProfile = profile || (await profileService.getProfile(currentUser.id));
        setIsGitHubAuthenticating(false);

        if (!isUserEmailVerified(currentUser)) {
          onNavigate('verify-email');
        } else if (userProfile) {
          onNavigate('dashboard');
        } else {
          onNavigate('onboarding');
        }
        return;
      }

      if (!isConfigured) {
        setIsGitHubAuthenticating(false);
        showToast(
          'Setup Required',
          'Supabase Anon Key is missing. Please configure your VITE_SUPABASE_ANON_KEY.',
          'warning'
        );
        return;
      }

      await signInWithGitHub();
    } catch (err: any) {
      setIsGitHubAuthenticating(false);
      showToast(
        'Authentication Error',
        'Something went wrong. Please try again.',
        'error'
      );
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!isConfigured) {
      showToast(
        'Setup Required',
        'Supabase Anon Key is missing. Please configure your VITE_SUPABASE_ANON_KEY.',
        'warning'
      );
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
      showToast(
        'Invalid email address',
        'Please enter a valid email address.',
        'warning'
      );
      return;
    }

    if (emailMode !== 'forgot') {
      if (!password) {
        showToast(
          'Password required',
          'Please enter your password.',
          'warning'
        );
        return;
      }
      if (password.length < 6) {
        showToast(
          'Password too short',
          'Password must be at least 6 characters long.',
          'warning'
        );
        return;
      }
    }

    if (emailMode === 'signup') {
      if (password !== confirmPassword) {
        showToast(
          'Passwords do not match',
          'Please re-enter your password.',
          'warning'
        );
        return;
      }
    }

    try {
      setIsEmailLoading(true);

      if (emailMode === 'signup') {
        const res = await signUpWithEmail(trimmedEmail, password);

        // Check if Supabase returned an existing user (identities array is empty for existing emails)
        if (res?.user && res.user.identities && res.user.identities.length === 0) {
          const appMeta = res.user.app_metadata || {};
          const providers = appMeta.providers || [];
          const identities = res.user.identities || [];

          let isGithubAccount =
            appMeta.provider === 'github' ||
            providers.includes('github') ||
            identities.some((i: any) => i.provider === 'github');

          if (!isGithubAccount) {
            try {
              const raw = localStorage.getItem('careerpilot_github_emails');
              const emails: string[] = raw ? JSON.parse(raw) : [];
              if (emails.includes(trimmedEmail.toLowerCase())) {
                isGithubAccount = true;
              }
            } catch {
              // ignore storage errors
            }
          }

          if (isGithubAccount) {
            showToast(
              'GitHub account detected',
              'This email is associated with a GitHub account. Please sign in using GitHub.',
              'info',
              {
                label: 'Continue with GitHub',
                onClick: handleGitHubSignIn
              }
            );
            return;
          }

          showToast(
            'Account already exists',
            'This email is already associated with an existing CareerPilot account. Please sign in using your existing authentication method.',
            'error',
            {
              label: 'Sign In',
              onClick: () => switchMode('signin')
            }
          );
          return;
        }

        showToast(
          'Account created successfully!',
          'Please verify your email address to continue.',
          'success'
        );
        onNavigate('verify-email');
      } else if (emailMode === 'signin') {
        const res = await signInWithEmail(trimmedEmail, password);
        if (res?.user && !res.user.email_confirmed_at && !res.user.confirmed_at) {
          showToast(
            'Email not verified',
            'Please verify your email before continuing.',
            'warning',
            {
              label: 'Verify Email',
              onClick: () => onNavigate('verify-email')
            }
          );
          onNavigate('verify-email');
        }
      } else if (emailMode === 'forgot') {
        await sendPasswordResetEmail(trimmedEmail);
        showToast(
          'Reset link sent!',
          'Please check your email inbox to reset your password.',
          'success'
        );
      }
    } catch (err: any) {
      console.warn('Email Auth Notice:', err);
      const rawMsg = err.message || '';
      const lower = rawMsg.toLowerCase();

      if (emailMode === 'signup') {
        if (
          lower.includes('user already registered') ||
          lower.includes('email already exists') ||
          lower.includes('already registered') ||
          lower.includes('already exists') ||
          lower.includes('identity_already_exists')
        ) {
          let isGithubAccount = false;
          try {
            const raw = localStorage.getItem('careerpilot_github_emails');
            const emails: string[] = raw ? JSON.parse(raw) : [];
            if (emails.includes(trimmedEmail.toLowerCase())) {
              isGithubAccount = true;
            }
          } catch {
            // ignore
          }

          if (isGithubAccount) {
            showToast(
              'GitHub account detected',
              'This email is associated with a GitHub account. Please sign in using GitHub.',
              'info',
              {
                label: 'Continue with GitHub',
                onClick: handleGitHubSignIn
              }
            );
            return;
          }

          showToast(
            'Account already exists',
            'This email is already associated with an existing CareerPilot account. Please sign in using your existing authentication method.',
            'error',
            {
              label: 'Sign In',
              onClick: () => switchMode('signin')
            }
          );
          return;
        }
      }

      if (emailMode === 'signin') {
        if (
          lower.includes('invalid login credentials') ||
          lower.includes('invalid_grant') ||
          lower.includes('invalid credentials') ||
          lower.includes('incorrect email or password')
        ) {
          // Check if this email is known to be associated with a GitHub account
          let isGithubAccount = false;
          try {
            const raw = localStorage.getItem('careerpilot_github_emails');
            const emails: string[] = raw ? JSON.parse(raw) : [];
            if (emails.includes(trimmedEmail.toLowerCase())) {
              isGithubAccount = true;
            }
          } catch {
            // ignore
          }

          if (isGithubAccount) {
            showToast(
              'GitHub account detected',
              'This email is associated with a GitHub account. Please sign in using GitHub.',
              'info',
              {
                label: 'Continue with GitHub',
                onClick: handleGitHubSignIn
              }
            );
            return;
          }

          showToast(
            'Invalid login credentials',
            'Please check your email and password and try again.',
            'error'
          );
          return;
        }

        if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
          showToast(
            'Email not verified',
            'Please verify your email before continuing.',
            'warning',
            {
              label: 'Verify Email',
              onClick: () => onNavigate('verify-email')
            }
          );
          return;
        }
      }

      showToast(
        'Authentication Error',
        rawMsg || 'Something went wrong. Please try again.',
        'error'
      );
    } finally {
      setIsEmailLoading(false);
    }
  };

  // Guard: if loading or already authenticated, do NOT render the sign-in form
  if (loading || user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
        <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl relative z-10 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {user ? 'Signed in! Redirecting to dashboard...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans transition-colors duration-300">
      
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-indigo-500/15 dark:bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Back button */}
      <button
        onClick={() => {
          if (authView === 'email') {
            setAuthView('main');
            resetFormState();
          } else {
            if (window.history.length > 2) {
              window.history.back();
            } else {
              onNavigate('welcome');
            }
          }
        }}
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-white/90 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{authView === 'email' ? 'All Sign In Options' : 'Back'}</span>
      </button>

      {/* Main Auth Card */}
      <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl relative z-10 space-y-6 transition-colors duration-300">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20 mx-auto">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Compass className="w-6 h-6" />
            </div>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 pt-2">
            {emailMode === 'signup' && 'Create your CareerPilot account'}
            {emailMode === 'signin' && 'Welcome back'}
            {emailMode === 'forgot' && 'Reset your password'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {emailMode === 'signup' && 'Start your placement and career journey'}
            {emailMode === 'signin' && 'Sign in to your CareerPilot account'}
            {emailMode === 'forgot' && 'Enter your email address to receive a reset link'}
          </p>
        </div>

        {/* Supabase Key Status Indicator */}
        {!isConfigured && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Supabase Key Configuration Needed</span>
            </div>
            <p className="text-amber-800/80 dark:text-amber-200/80 leading-relaxed text-[11px]">
              Authentication requires setting <code className="bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-500/30 px-1 py-0.5 rounded text-amber-900 dark:text-amber-300">VITE_SUPABASE_ANON_KEY</code>.
            </p>
            <button
              onClick={onOpenSetupGuide}
              className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 font-semibold text-xs border border-amber-500/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>View Setup & SQL Instructions</span>
            </button>
          </div>
        )}

        {/* Main View Buttons: ONLY GitHub + Email */}
        {authView === 'main' && (
          <div className="space-y-3 pt-2">
            
            {/* GitHub OAuth */}
            <button
              onClick={handleGitHubSignIn}
              disabled={isGitHubAuthenticating}
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 border border-slate-800 dark:border-slate-700"
            >
              {isGitHubAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Redirecting to GitHub OAuth...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 fill-current text-white shrink-0" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>Continue with GitHub</span>
                </>
              )}
            </button>

            {/* Email Option */}
            <button
              onClick={() => {
                clearError();
                setAuthView('email');
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800/90 dark:hover:bg-slate-800 border border-indigo-200 dark:border-slate-700 text-indigo-900 dark:text-indigo-200 font-bold text-sm shadow-sm transition-all flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Continue with Email</span>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            </button>

            {/* Mode Switcher Link */}
            <div className="text-center pt-2">
              {emailMode === 'signin' ? (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                  >
                    Create one
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>

          </div>
        )}

        {/* Email View Form */}
        {authView === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4 pt-1">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            {emailMode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  {emailMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        resetFormState();
                        setEmailMode('forgot');
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password Field */}
            {emailMode === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isEmailLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              {isEmailLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>
                  {emailMode === 'signin' && 'Sign In'}
                  {emailMode === 'signup' && 'Create Account'}
                  {emailMode === 'forgot' && 'Send Reset Link'}
                </span>
              )}
            </button>

            {/* Mode Toggle Footer */}
            <div className="text-center pt-2">
              {emailMode === 'signin' && (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                  >
                    Create one
                  </button>
                </p>
              )}

              {emailMode === 'signup' && (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              )}

              {emailMode === 'forgot' && (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Remembered your password?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </p>
              )}
            </div>

          </form>
        )}

        {/* Footer info */}
        <p className="text-[11px] text-slate-500 dark:text-slate-500 text-center leading-relaxed">
          By signing in, you agree to CareerPilot AI's Terms of Service and Privacy Policy. Real Supabase Auth ensures encrypted user identity.
        </p>

      </div>
    </div>
  );
};
