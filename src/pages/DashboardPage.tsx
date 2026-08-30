import React, { useState, useEffect, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import {
  RefreshCw,
  Edit3,
  LogIn,
  AlertTriangle,
  Code2,
  Brain,
  Cpu,
  FileText,
  UserCheck,
  Sparkles,
  ArrowRight,
  Calendar,
  Activity,
  CheckCircle2,
  Briefcase,
  Layers,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import {
  getPreparationDashboardData,
  getCachedPreparationDashboardData,
} from '../services/preparationDashboardService';
import { PreparationDashboardData } from '../types/preparationDashboard';
import { careerIntelligenceService } from '../services/careerIntelligenceService';
import { UnifiedCareerIntelligence } from '../types/intelligence';

// Intelligence Widgets
import { CareerReadinessWidget } from '../components/intelligence/CareerReadinessWidget';
import { TodaysFocusCard } from '../components/intelligence/TodaysFocusCard';
import { JobMatchSection } from '../components/intelligence/JobMatchSection';
import { InterviewWeaknessTracker } from '../components/intelligence/InterviewWeaknessTracker';
import { AdaptiveInsightsWidget } from '../components/intelligence/AdaptiveInsightsWidget';
import { WeeklyReportModal } from '../components/intelligence/WeeklyReportModal';

// Existing Dashboard Components
import { PreparationTopSection } from '../components/dashboard/PreparationTopSection';
import { ModuleProgressGrid } from '../components/dashboard/ModuleProgressGrid';
import { PerformanceInsightsSection } from '../components/dashboard/PerformanceInsightsSection';
import { RecentActivitySection } from '../components/dashboard/RecentActivitySection';
import { SendTestEmailCard } from '../components/common/SendTestEmailCard';

// React Error Boundary for isolated error handling
interface ErrorBoundaryProps {
  children: ReactNode;
  onReset: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class DashboardErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[DashboardErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
              Something went wrong loading this section
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              We encountered an unexpected issue rendering the preparation analytics.
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface DashboardPageProps {
  onNavigate: (page: string) => void;
  onOpenSetupGuide?: () => void;
}

type DashboardViewTab = 'overview' | 'focus' | 'job_match' | 'interview_tracker' | 'adaptive';

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, profile, loading: authLoading } = useAuth();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardViewTab>('overview');

  // Authenticated Student ID for Scoped Calculation
  const studentId = user?.id || profile?.id || 'guest';

  // Instant render from local cache first (no blank screen or full-page spinner)
  const [dashboardData, setDashboardData] = useState<PreparationDashboardData | null>(() => {
    return getCachedPreparationDashboardData(studentId);
  });
  const [intelligence, setIntelligence] = useState<UnifiedCareerIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !dashboardData);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Ref to hold the latest profile without causing re-renders
  const profileRef = React.useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const isMountedRef = React.useRef(true);
  const inFlightRef = React.useRef(false);

  const loadDashboard = useCallback(async (isSilent = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (!isSilent) {
      setIsLoading(true);
    }
    setLoadError(null);
    try {
      const curProfile = profileRef.current;
      const [data, intel] = await Promise.all([
        getPreparationDashboardData(studentId, curProfile),
        careerIntelligenceService.getUnifiedIntelligence(studentId, {
          forceRefresh: !isSilent,
          profile: curProfile,
        }),
      ]);

      if (isMountedRef.current) {
        setDashboardData(data);
        setIntelligence(intel);
      }
    } catch (err: any) {
      console.error('[Dashboard] Error fetching preparation dashboard data:', err);
      if (isMountedRef.current) {
        setLoadError(err?.message || 'Failed to aggregate student analytics');
      }
    } finally {
      inFlightRef.current = false;
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [studentId]);

  useEffect(() => {
    isMountedRef.current = true;
    loadDashboard(true);

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const handleDataUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadDashboard(true);
      }, 300);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleDataUpdate();
      }
    };

    window.addEventListener('careerpilot_profile_updated', handleDataUpdate);
    window.addEventListener('careerpilot_activity_updated', handleDataUpdate);
    window.addEventListener('storage', handleDataUpdate);
    window.addEventListener('focus', handleDataUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('careerpilot_profile_updated', handleDataUpdate);
      window.removeEventListener('careerpilot_activity_updated', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
      window.removeEventListener('focus', handleDataUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadDashboard]);

  // Case 1: Unauthenticated Student State
  if (!user && !authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <LogIn className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="font-bold text-slate-900 dark:text-white text-xl">
              Please sign in to view your preparation dashboard
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Access your real-time preparation score, coding streaks, mock interview evaluations, and personalized AI recommendations.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('auth?mode=signin&redirect=dashboard')}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to CareerPilot</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans space-y-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Control Bar: Refresh & Profile Trigger */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Real-Time Career Intelligence Active</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWeeklyReportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              title="Open 7-Day Weekly Career Report"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Weekly Report</span>
            </button>

            <button
              onClick={() => onNavigate('analytics')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-xs cursor-pointer"
              title="Deep Progress Analytics"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => onNavigate('study-planner')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white transition-all shadow-xs cursor-pointer"
              title="Open AI Daily Study Planner"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Study Planner</span>
            </button>

            <button
              onClick={() => loadDashboard(false)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Profile Incomplete Notification if profile is missing */}
        {!profile && !authLoading && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Complete your profile to personalize CareerPilot
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Add your target role, dream companies, and skills to get role-specific benchmarks and tailored recommendations.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer shrink-0"
            >
              Complete Profile
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !dashboardData ? (
          <div className="p-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Loading your unified preparation intelligence...
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Aggregating real-time performance across Coding, Aptitude, Mock Interviews, Resume, and Target Company benchmarks...
              </p>
            </div>
          </div>
        ) : dashboardData ? (
          <DashboardErrorBoundary onReset={loadDashboard}>
            {/* 1. TOP SECTION: Greeting, Target Meta & Overview */}
            <section aria-label="Student Preparation Overview">
              <PreparationTopSection
                data={dashboardData}
                onNavigate={onNavigate}
                onEditProfile={() => setIsEditProfileOpen(true)}
              />
            </section>

            {/* 2. CAREER READINESS SCORE ENGINE */}
            {intelligence?.readiness && (
              <section aria-label="Career Readiness Score">
                <CareerReadinessWidget
                  readiness={intelligence.readiness}
                  onNavigate={onNavigate}
                  onRefresh={() => loadDashboard(false)}
                />
              </section>
            )}

            {/* Quick Navigation Tabs for Intelligence Suite */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none">
              {[
                { id: 'overview', label: 'Suite Overview', icon: Layers },
                { id: 'focus', label: "Today's Focus", icon: Sparkles },
                { id: 'job_match', label: 'Job ↔ Resume Match', icon: Briefcase },
                { id: 'interview_tracker', label: 'Interview Weakness Tracker', icon: Cpu },
                { id: 'adaptive', label: 'Adaptive Insights', icon: Brain },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as DashboardViewTab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 3. TODAY'S FOCUS SECTION */}
            {(activeTab === 'overview' || activeTab === 'focus') && intelligence?.todaysFocus && (
              <section aria-label="Personalized Today's Focus">
                <TodaysFocusCard
                  todaysFocus={intelligence.todaysFocus}
                  studentId={studentId}
                  onNavigate={onNavigate}
                  onTaskCompletionChange={() => loadDashboard(true)}
                />
              </section>
            )}

            {/* 4. JOB MATCH ANALYZER SECTION */}
            {(activeTab === 'overview' || activeTab === 'job_match') && (
              <section aria-label="Job Description Match Analyzer">
                <JobMatchSection
                  studentId={studentId}
                  resumes={intelligence?.analytics?.resume?.versionsList || []}
                  onNavigate={onNavigate}
                />
              </section>
            )}

            {/* 5. INTERVIEW WEAKNESS TRACKER SECTION */}
            {(activeTab === 'overview' || activeTab === 'interview_tracker') && intelligence?.interviewWeakness && (
              <section aria-label="Interview Weakness Tracker">
                <InterviewWeaknessTracker
                  data={intelligence.interviewWeakness}
                  onNavigate={onNavigate}
                />
              </section>
            )}

            {/* 6. ADAPTIVE LEARNING INSIGHTS SECTION */}
            {(activeTab === 'overview' || activeTab === 'adaptive') && intelligence?.adaptive && (
              <section aria-label="Adaptive Learning Insights">
                <AdaptiveInsightsWidget
                  insights={intelligence.adaptive}
                  onNavigate={onNavigate}
                />
              </section>
            )}

            {/* 7. MODULE PROGRESS GRID: 8 Core Modules */}
            {activeTab === 'overview' && (
              <section aria-label="Module Progress">
                <ModuleProgressGrid
                  modules={dashboardData.modules}
                  onNavigate={onNavigate}
                />
              </section>
            )}

            {/* 8. PERFORMANCE INSIGHTS */}
            {activeTab === 'overview' && (
              <section aria-label="Performance Insights">
                <PerformanceInsightsSection
                  weakAreas={dashboardData.weakAreas}
                  strongAreas={dashboardData.strongAreas}
                  onNavigate={onNavigate}
                />
              </section>
            )}

            {/* 9. RECENT ACTIVITY TIMELINE */}
            {activeTab === 'overview' && (
              <section aria-label="Recent Activity">
                <RecentActivitySection
                  activities={dashboardData.recentActivities}
                  onNavigate={onNavigate}
                />
              </section>
            )}

            {/* 10. EMAIL NOTIFICATIONS */}
            <section aria-label="Notifications System" className="pt-2">
              <SendTestEmailCard />
            </section>
          </DashboardErrorBoundary>
        ) : (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 text-center space-y-5 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                Unable to load your saved CareerPilot data.
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                {loadError || 'An unexpected issue occurred while fetching your saved student records from Supabase.'}
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => loadDashboard(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => {
            setIsEditProfileOpen(false);
            loadDashboard();
          }}
        />
      )}

      {/* Weekly Report Modal */}
      {intelligence?.weeklyReport && (
        <WeeklyReportModal
          report={intelligence.weeklyReport}
          isOpen={isWeeklyReportOpen}
          onClose={() => setIsWeeklyReportOpen(false)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
