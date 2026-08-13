import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ConfigMissingBanner } from './components/common/ConfigMissingBanner';
import { SetupGuideModal } from './components/common/SetupGuideModal';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, profile, loading, isConfigured } = useAuth();
  
  // Custom router state synchronized with path
  const [currentPage, setCurrentPage] = useState<string>(() => {
    const path = window.location.pathname.replace('/', '');
    if (path === 'auth' || path === 'onboarding' || path === 'dashboard') {
      return path;
    }
    return 'home';
  });

  const [setupGuideOpen, setSetupGuideOpen] = useState(false);

  // Sync route with window pathname
  const navigateTo = (page: string) => {
    setCurrentPage(page);
    const targetPath = page === 'home' ? '/' : `/${page}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '');
      if (path === 'auth' || path === 'onboarding' || path === 'dashboard') {
        setCurrentPage(path);
      } else {
        setCurrentPage('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Protected Route Guards
  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Unauthenticated users attempting to access protected routes -> redirect to auth
      if (currentPage === 'dashboard' || currentPage === 'onboarding') {
        navigateTo('auth');
      }
    } else {
      // Handle OAuth return redirect when landing on home or auth
      const hasOAuthParams =
        window.location.search.includes('code=') ||
        window.location.hash.includes('access_token=');

      if (hasOAuthParams) {
        window.history.replaceState({}, '', window.location.pathname);
      }

      if (currentPage === 'auth' || (currentPage === 'home' && hasOAuthParams)) {
        if (profile) {
          navigateTo('dashboard');
        } else {
          navigateTo('onboarding');
        }
      } else if (currentPage === 'onboarding') {
        if (profile) {
          navigateTo('dashboard');
        }
      }
    }
  }, [user, profile, loading, currentPage]);

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

        {currentPage === 'onboarding' && (
          <OnboardingPage onNavigate={navigateTo} />
        )}

        {currentPage === 'dashboard' && (
          <DashboardPage
            onNavigate={navigateTo}
            onOpenSetupGuide={() => setSetupGuideOpen(true)}
          />
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
