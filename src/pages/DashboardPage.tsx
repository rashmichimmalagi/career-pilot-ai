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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { getPreparationDashboardData } from '../services/preparationDashboardService';
import { PreparationDashboardData } from '../types/preparationDashboard';
import { PreparationTopSection } from '../components/dashboard/PreparationTopSection';
import { ModuleProgressGrid } from '../components/dashboard/ModuleProgressGrid';
import { TodayPreparationSection } from '../components/dashboard/TodayPreparationSection';
import { PerformanceInsightsSection } from '../components/dashboard/PerformanceInsightsSection';
import { RecentActivitySection } from '../components/dashboard/RecentActivitySection';
import { AIRecommendationCard } from '../components/dashboard/AIRecommendationCard';
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

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, profile, loading: authLoading } = useAuth();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<PreparationDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Authenticated Student ID for Scoped Calculation
  const studentId = user?.id || profile?.id || 'guest';

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getPreparationDashboardData(studentId, profile);
      setDashboardData(data);
    } catch (err: any) {
      console.error('[Dashboard] Error fetching preparation dashboard data:', err);
      setLoadError(err?.message || 'Failed to aggregate student analytics');
    } finally {
      setIsLoading(false);
    }
  }, [studentId, profile]);

  useEffect(() => {
    loadDashboard();

    const handleDataUpdate = () => {
      console.log('[Dashboard] Activity or profile updated event received. Refreshing...');
      loadDashboard();
    };

    window.addEventListener('careerpilot_profile_updated', handleDataUpdate);
    window.addEventListener('careerpilot_activity_updated', handleDataUpdate);
    window.addEventListener('storage', handleDataUpdate);
    window.addEventListener('focus', handleDataUpdate);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleDataUpdate();
      }
    });

    return () => {
      window.removeEventListener('careerpilot_profile_updated', handleDataUpdate);
      window.removeEventListener('careerpilot_activity_updated', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
      window.removeEventListener('focus', handleDataUpdate);
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
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Real-Time Student Analytics Active</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('study-planner')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white transition-all shadow-xs cursor-pointer"
              title="Open AI Daily Study Planner"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>AI Study Planner</span>
            </button>

            <button
              onClick={loadDashboard}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
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
                Loading your preparation dashboard...
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Aggregating real-time performance across Coding, Aptitude, Mock Interviews, Resume, and Target Company benchmarks...
              </p>
            </div>
          </div>
        ) : dashboardData ? (
          <DashboardErrorBoundary onReset={loadDashboard}>
            {/* 1. TOP SECTION: Greeting, Overall Score, Target Meta */}
            <section aria-label="Student Preparation Overview">
              <PreparationTopSection
                data={dashboardData}
                onNavigate={onNavigate}
                onEditProfile={() => setIsEditProfileOpen(true)}
              />
            </section>

            {/* Quick-Start Cards for New Students with 0 activities */}
            {dashboardData.totalActivitiesCount === 0 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-blue-50/80 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-blue-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      Your preparation journey starts here.
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    Complete your first activity to unlock personalized analytics.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    onClick={() => onNavigate('coding')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-xs transition-all text-left flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        <Code2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          Start Coding
                        </div>
                        <div className="text-[11px] text-slate-500">DSA & Algorithms</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    onClick={() => onNavigate('placement')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 hover:shadow-xs transition-all text-left flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          Practice Aptitude
                        </div>
                        <div className="text-[11px] text-slate-500">Timed Placement Tests</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    onClick={() => onNavigate('interview')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 hover:shadow-xs transition-all text-left flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          Take Interview
                        </div>
                        <div className="text-[11px] text-slate-500">Technical & HR Mock</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. AI RECOMMENDATION CARD: Rule-based, performance grounded */}
            <section aria-label="AI Strategic Recommendation">
              <AIRecommendationCard
                recommendation={dashboardData.aiRecommendation}
                onNavigate={onNavigate}
              />
            </section>

            {/* 3. TODAY'S PREPARATION FOCUS: Actionable daily recommendations */}
            <section aria-label="Today's Preparation Focus">
              <TodayPreparationSection
                recommendations={dashboardData.todayRecommendations}
                onNavigate={onNavigate}
              />
            </section>

            {/* 4. MODULE PROGRESS GRID: 8 Core Modules */}
            <section aria-label="Module Progress">
              <ModuleProgressGrid
                modules={dashboardData.modules}
                onNavigate={onNavigate}
              />
            </section>

            {/* 5. PERFORMANCE INSIGHTS: Weak Areas & Strong Areas */}
            <section aria-label="Performance Insights">
              <PerformanceInsightsSection
                weakAreas={dashboardData.weakAreas}
                strongAreas={dashboardData.strongAreas}
                onNavigate={onNavigate}
              />
            </section>

            {/* 6. RECENT ACTIVITY TIMELINE: Real sorted activity logs */}
            <section aria-label="Recent Activity">
              <RecentActivitySection
                activities={dashboardData.recentActivities}
                onNavigate={onNavigate}
              />
            </section>

            {/* 7. EMAIL NOTIFICATIONS: Integration Placeholder */}
            <section aria-label="Notifications System" className="pt-2">
              <SendTestEmailCard />
            </section>
          </DashboardErrorBoundary>
        ) : (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Unable to load preparation metrics
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                {loadError || 'An unexpected error occurred while loading your preparation analytics.'}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={loadDashboard}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Retry
              </button>
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
    </div>
  );
};
