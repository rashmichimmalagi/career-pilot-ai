import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ConfigMissingBanner } from './components/common/ConfigMissingBanner';
import { SetupGuideModal } from './components/common/SetupGuideModal';
import { LandingPage } from './pages/LandingPage';
import { WelcomePage } from './pages/WelcomePage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, profile, loading, isConfigured, isEmailVerified } = useAuth();
  
  const getPathFromLocation = () => {
    const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    const cleanPath = rawPath.split('/')[0];
    if (cleanPath === 'reset-password' || window.location.hash.includes('type=recovery')) {
      return 'reset-password';
    }
    if (cleanPath === 'verify-email') {
      return 'verify-email';
    }
    if (cleanPath === 'welcome' || cleanPath === '') {
      return 'welcome';
    }
    if (
      [
        'home',
        'auth',
        'onboarding',
        'dashboard',
        'profile',
        'coding',
        'interview',
        'resume',
        'career-mentor',
        'analytics',
      ].includes(cleanPath)
    ) {
      return cleanPath;
    }
    return 'welcome';
  };

  // Custom router state synchronized with path
  const [currentPage, setCurrentPage] = useState<string>(getPathFromLocation);

  const [setupGuideOpen, setSetupGuideOpen] = useState(false);

  // Sync route with window pathname and query params
  const navigateTo = (target: string) => {
    const [page, query] = target.split('?');
    const cleanPage = page.toLowerCase();
    setCurrentPage(cleanPage);

    let targetPath = cleanPage === 'welcome' ? '/' : `/${cleanPage}`;
    if (query) {
      targetPath += `?${query}`;
    }

    if (window.location.pathname + window.location.search !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPathFromLocation());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Protected Route Guards
  useEffect(() => {
    if (loading) return;

    const protectedPages = [
      'onboarding',
      'dashboard',
      'profile',
      'coding',
      'interview',
      'resume',
      'career-mentor',
      'analytics',
    ];

    if (!user) {
      // Unauthenticated users attempting to access protected routes -> redirect to auth
      if (protectedPages.includes(currentPage) || currentPage === 'verify-email') {
        navigateTo('auth');
      }
    } else {
      // Allow user on reset-password page if they arrived via recovery link
      if (currentPage === 'reset-password') {
        return;
      }

      // Check email verification for authenticated user
      if (!isEmailVerified) {
        if (currentPage !== 'verify-email') {
          navigateTo('verify-email');
        }
        return;
      }

      // If user is verified and currently on verify-email screen, redirect to onboarding or dashboard
      if (currentPage === 'verify-email') {
        if (profile) {
          navigateTo('dashboard');
        } else {
          navigateTo('onboarding');
        }
        return;
      }

      // Handle OAuth return redirect when landing on home or auth
      const hasOAuthParams =
        window.location.search.includes('code=') ||
        window.location.hash.includes('access_token=');

      if (hasOAuthParams) {
        window.history.replaceState({}, '', window.location.pathname);
      }

      if (currentPage === 'auth' || ((currentPage === 'home' || currentPage === 'welcome') && hasOAuthParams)) {
        if (profile) {
          navigateTo('dashboard');
        } else {
          navigateTo('onboarding');
        }
      } else if (currentPage === 'onboarding') {
        if (profile) {
          navigateTo('dashboard');
        }
      } else if (protectedPages.includes(currentPage)) {
        if (!profile && currentPage !== 'onboarding') {
          navigateTo('onboarding');
        }
      }
    }
  }, [user, profile, isEmailVerified, loading, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-800 dark:text-slate-200 gap-3 transition-colors duration-300">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">Initializing CareerPilot AI...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      
      {/* Configuration Banner if Anon Key is missing */}
      {!isConfigured && (
        <ConfigMissingBanner onOpenSetupGuide={() => setSetupGuideOpen(true)} />
      )}

      {/* Main Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={navigateTo}
        onOpenSetupGuide={() => setSetupGuideOpen(true)}
      />

      {/* View Page Routing */}
      <main className="flex-1">
        {currentPage === 'welcome' && (
          <WelcomePage
            onNavigate={navigateTo}
            onOpenSetupGuide={() => setSetupGuideOpen(true)}
          />
        )}

        {currentPage === 'home' && (
          <LandingPage
            onNavigate={navigateTo}
            onOpenSetupGuide={() => setSetupGuideOpen(true)}
          />
        )}

        {currentPage === 'auth' && (
          <AuthPage
            onNavigate={navigateTo}
            onOpenSetupGuide={() => setSetupGuideOpen(true)}
          />
        )}

        {currentPage === 'verify-email' && (
          <VerifyEmailPage onNavigate={navigateTo} />
        )}

        {currentPage === 'onboarding' && (
          <OnboardingPage onNavigate={navigateTo} />
        )}

        {currentPage === 'dashboard' && (
          <DashboardPage
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'reset-password' && (
          <ResetPasswordPage onNavigate={navigateTo} />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={navigateTo} />

      {/* Setup Guide Modal */}
      <SetupGuideModal
        isOpen={setupGuideOpen}
        onClose={() => setSetupGuideOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
