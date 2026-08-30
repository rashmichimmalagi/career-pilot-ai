import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ConfigMissingBanner } from './components/common/ConfigMissingBanner';
import { SetupGuideModal } from './components/common/SetupGuideModal';
import { InactivityWarningModal } from './components/common/InactivityWarningModal';
import { OfflineNetworkBanner } from './components/common/OfflineNetworkBanner';
import { useInactivityTimeout } from './hooks/useInactivityTimeout';
import { useNetworkInterruption } from './hooks/useNetworkInterruption';
import { LandingPage } from './pages/LandingPage';
import { WelcomePage } from './pages/WelcomePage';
import { AboutPage } from './pages/AboutPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ResumeAnalyzerPage } from './pages/ResumeAnalyzerPage';
import { CodingPracticePage } from './pages/CodingPracticePage';
import { TechnicalInterviewPage } from './pages/TechnicalInterviewPage';
import { PlacementPracticePage } from './pages/PlacementPracticePage';
import { CompanyPreparationPage } from './pages/CompanyPreparationPage';
import { CareerRoadmapPage } from './pages/CareerRoadmapPage';
import { CareerMentorPage } from './pages/CareerMentorPage';
import { StudyPlannerPage } from './pages/StudyPlannerPage';
import { ProgressAnalyticsPage } from './pages/ProgressAnalyticsPage';
import { ResumePrintPage } from './pages/ResumePrintPage';
import { ResumeEditorPage } from './pages/ResumeEditorPage';
import { ProfilePage } from './pages/ProfilePage';
import { Loader2 } from 'lucide-react';

export function extractResumeIdFromPath(raw: string): string | null {
  if (!raw) return null;
  const clean = raw.split('?')[0].split('#')[0].replace(/^\/+|\/+$/g, '');
  const match = clean.match(/(?:resume\/print|print-resume|print\/resume)\/(.+)/i);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  const searchPart = raw.includes('?') ? raw.split('?')[1] : window.location.search;
  if (searchPart) {
    const params = new URLSearchParams(searchPart);
    const id = params.get('id') || params.get('resumeId');
    if (id) return id;
  }
  return null;
}

function normalizeRoute(raw: string): string {
  if (!raw) return 'welcome';
  const clean = raw.split('?')[0].split('#')[0].replace(/^\/+|\/+$/g, '').toLowerCase();

  // Dedicated Print Route
  if (
    clean.startsWith('resume/print') ||
    clean.startsWith('print-resume') ||
    clean.startsWith('print/resume')
  ) {
    return 'resume-print';
  }

  // Dedicated Live Resume Editor Route
  if (
    clean.startsWith('resume/editor') ||
    clean.startsWith('resume-editor') ||
    clean.startsWith('live-resume-editor') ||
    clean.startsWith('resume-studio')
  ) {
    return 'resume-editor';
  }

  const firstSegment = clean.split('/')[0];

  if (!firstSegment || firstSegment === 'welcome' || firstSegment === 'index' || firstSegment === 'index.html') {
    return 'welcome';
  }
  if (firstSegment === 'home' || firstSegment === 'landing') {
    return 'home';
  }
  if (firstSegment === 'about' || firstSegment === 'about-us' || firstSegment === 'about-careerpilot') {
    return 'about';
  }
  if (firstSegment === 'auth' || firstSegment === 'login' || firstSegment === 'signin' || firstSegment === 'signup') {
    return 'auth';
  }
  if (firstSegment === 'resume' || firstSegment === 'resume-analyzer' || firstSegment === 'ai-resume') {
    return 'resume-analyzer';
  }
  if (firstSegment === 'coding' || firstSegment === 'coding-practice' || firstSegment === 'coding-arena') {
    return 'coding';
  }
  if (firstSegment === 'achievements' || firstSegment === 'badges' || firstSegment === 'coding-achievements') {
    return 'coding';
  }
  if (firstSegment === 'interview' || firstSegment === 'technical-interview') {
    return 'interview';
  }
  if (firstSegment === 'placement' || firstSegment === 'placement-practice' || firstSegment === 'placement-arena' || firstSegment === 'aptitude') {
    return 'placement';
  }
  if (firstSegment === 'company' || firstSegment === 'company-prep' || firstSegment === 'company-preparation') {
    return 'company-prep';
  }
  if (firstSegment === 'roadmap' || firstSegment === 'career-roadmap' || firstSegment === 'my-roadmap') {
    return 'roadmap';
  }
  if (
    firstSegment === 'study-planner' ||
    firstSegment === 'planner' ||
    firstSegment === 'study' ||
    firstSegment === 'ai-study-planner' ||
    firstSegment === 'daily-planner'
  ) {
    return 'study-planner';
  }
  if (
    firstSegment === 'mentor' ||
    firstSegment === 'career-mentor' ||
    firstSegment === 'ai-mentor' ||
    firstSegment === 'ai-career-mentor'
  ) {
    return 'career-mentor';
  }
  if (firstSegment === 'reset-password' || window.location.hash.includes('type=recovery')) {
    return 'reset-password';
  }
  if (firstSegment === 'verify-email') {
    return 'verify-email';
  }
  if (firstSegment === 'onboarding') {
    return 'onboarding';
  }
  if (
    firstSegment === 'dashboard' ||
    firstSegment === 'preparation-dashboard' ||
    firstSegment === 'prep-dashboard'
  ) {
    return 'dashboard';
  }
  if (
    [
      'profile',
      'career-mentor',
      'analytics',
    ].includes(firstSegment)
  ) {
    return firstSegment;
  }
  return 'welcome';
}

function AppContent() {
  const { user, profile, loading, profileLoading, isConfigured, isEmailVerified, signOut, showToast } = useAuth();
  
  const getPathFromLocation = (): string => {
    if (window.location.hash.includes('type=recovery')) {
      return 'reset-password';
    }
    return normalizeRoute(window.location.pathname);
  };

  // Custom router state synchronized with path
  const [currentPage, setCurrentPage] = useState<string>(getPathFromLocation);
  const [setupGuideOpen, setSetupGuideOpen] = useState(false);

  // Sync route with window pathname and query params
  const navigateTo = (target: string) => {
    if (!target || target === '/' || target === '') {
      setCurrentPage('welcome');
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const [pagePart, query] = target.split('?');
    const cleanPage = normalizeRoute(pagePart);
    setCurrentPage(cleanPage);

    let effectiveQuery = query || '';
    if ((pagePart === 'achievements' || pagePart === 'badges') && !effectiveQuery.includes('tab=')) {
      effectiveQuery = effectiveQuery ? `${effectiveQuery}&tab=achievements` : 'tab=achievements';
    }

    let targetPath = cleanPage === 'welcome' ? '/' : `/${cleanPage}`;
    if (cleanPage === 'home') {
      targetPath = '/home';
    }
    if (effectiveQuery) {
      targetPath += `?${effectiveQuery}`;
    }

    if (window.location.pathname + window.location.search !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Inactivity auto-logout hook
  const { isWarningOpen, secondsRemaining, stayLoggedIn } = useInactivityTimeout({
    user,
    loading,
    onSignOut: signOut,
    onNavigate: navigateTo,
    showToast,
  });

  // Network interruption & offline detection hook
  const {
    isOnline,
    syncState,
    currentQuote,
    pendingQueueCount,
    isSyncing,
    syncError,
    quoteSecondsLeft,
    totalQuoteIntervalSeconds,
    triggerSync,
    nextQuote,
  } = useNetworkInterruption({
    user,
    currentPage,
    showToast,
  });

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
      'study-planner',
      'profile',
      'coding',
      'interview',
      'placement',
      'company-prep',
      'roadmap',
      'resume-analyzer',
      'resume-editor',
      'career-mentor',
      'analytics',
    ];

    if (!user) {
      // Unauthenticated users attempting to access protected routes -> redirect to auth with return redirect
      if (protectedPages.includes(currentPage) || currentPage === 'verify-email') {
        navigateTo(`auth?mode=signin&redirect=${currentPage}`);
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
        const urlParams = new URLSearchParams(window.location.search);
        const redirectParam = urlParams.get('redirect');
        if (redirectParam && protectedPages.includes(redirectParam)) {
          navigateTo(redirectParam);
        } else if (profile) {
          navigateTo('dashboard');
        } else {
          navigateTo('onboarding');
        }
      } else if (currentPage === 'onboarding') {
        if (profile) {
          navigateTo('dashboard');
        }
      } else if (currentPage === 'dashboard') {
        if (!profile && !profileLoading) {
          navigateTo('onboarding');
        }
      }
    }
  }, [user, profile, isEmailVerified, loading, profileLoading, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-800 dark:text-slate-200 gap-3 transition-colors duration-300">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">Initializing CareerPilot AI...</p>
      </div>
    );
  }

  // Dedicated Print Route: Render strictly the print document page with NO application shell, navbar, or footer
  if (currentPage === 'resume-print') {
    const printResumeId =
      extractResumeIdFromPath(window.location.pathname) ||
      extractResumeIdFromPath(window.location.hash) ||
      extractResumeIdFromPath(window.location.href);

    return (
      <ResumePrintPage
        resumeId={printResumeId}
        onNavigate={navigateTo}
      />
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

        {currentPage === 'about' && (
          <AboutPage
            onNavigate={navigateTo}
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

        {currentPage === 'profile' && (
          <ProfilePage
            onNavigate={navigateTo}
          />
        )}

        {(currentPage === 'resume-analyzer' || currentPage === 'resume') && (
          <ResumeAnalyzerPage
            onNavigate={navigateTo}
          />
        )}

        {(currentPage === 'resume-editor' || currentPage === 'resume-studio') && (
          <ResumeEditorPage
            onNavigate={navigateTo}
            resumeId={extractResumeIdFromPath(window.location.pathname) || extractResumeIdFromPath(window.location.hash) || extractResumeIdFromPath(window.location.href)}
          />
        )}

        {(currentPage === 'coding' || currentPage === 'coding-practice' || currentPage === 'coding-arena') && (
          <CodingPracticePage
            onNavigate={navigateTo}
          />
        )}

        {(currentPage === 'interview' || currentPage === 'technical-interview') && (
          <TechnicalInterviewPage
            onNavigate={navigateTo}
          />
        )}

        {(currentPage === 'placement' || currentPage === 'placement-practice' || currentPage === 'placement-arena' || currentPage === 'aptitude') && (
          <PlacementPracticePage
            onNavigate={navigateTo}
          />
        )}

        {(currentPage === 'company-prep' || currentPage === 'company' || currentPage === 'company-preparation') && (
          <CompanyPreparationPage
            onNavigate={navigateTo}
          />
        )}

        {(currentPage === 'roadmap' || currentPage === 'career-roadmap') && (
          <CareerRoadmapPage
            onNavigate={navigateTo}
          />
        )}

        {(currentPage === 'career-mentor' || currentPage === 'mentor' || currentPage === 'ai-mentor') && (
          <CareerMentorPage
            onNavigate={navigateTo}
          />
        )}

        {(currentPage === 'study-planner' || currentPage === 'planner' || currentPage === 'study') && (
          <StudyPlannerPage
            onNavigate={navigateTo}
          />
        )}

        {(currentPage === 'analytics' || currentPage === 'progress-analytics') && (
          <ProgressAnalyticsPage
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'reset-password' && (
          <ResetPasswordPage onNavigate={navigateTo} />
        )}

        {/* Safe fallback if route is unrecognized so app NEVER renders blank */}
        {![
          'welcome',
          'home',
          'about',
          'auth',
          'verify-email',
          'onboarding',
          'dashboard',
          'study-planner',
          'planner',
          'study',
          'resume-analyzer',
          'resume',
          'coding',
          'coding-practice',
          'coding-arena',
          'interview',
          'technical-interview',
          'placement',
          'placement-practice',
          'placement-arena',
          'aptitude',
          'company-prep',
          'company',
          'company-preparation',
          'roadmap',
          'career-roadmap',
          'career-mentor',
          'mentor',
          'ai-mentor',
          'reset-password',
        ].includes(currentPage) && (
          <WelcomePage
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

      {/* Inactivity Warning Modal */}
      <InactivityWarningModal
        isOpen={isWarningOpen}
        secondsRemaining={secondsRemaining}
        onStayLoggedIn={stayLoggedIn}
      />

      {/* Offline & Network Interruption Banner */}
      <OfflineNetworkBanner
        isOnline={isOnline}
        syncState={syncState}
        currentQuote={currentQuote}
        pendingQueueCount={pendingQueueCount}
        isSyncing={isSyncing}
        syncError={syncError}
        quoteSecondsLeft={quoteSecondsLeft}
        totalQuoteIntervalSeconds={totalQuoteIntervalSeconds}
        onRetrySync={triggerSync}
        onNextQuote={nextQuote}
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
