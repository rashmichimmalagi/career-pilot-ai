import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  StudyPlanData,
  StudyTask,
  TaskStatus,
} from '../types/studyPlanner';
import { PreparationDashboardData } from '../types/preparationDashboard';
import {
  getTodayStudyPlan,
  getStoredStudyPlan,
  getImmediateDeterministicPlan,
  updatePlanTimeBudget,
  updateTaskStatus,
  getDailyStudyTime,
} from '../services/studyPlannerService';
import {
  Sparkles,
  Calendar,
  Clock,
  Flame,
  CheckCircle2,
  Circle,
  Play,
  RotateCw,
  ArrowRight,
  Code2,
  Brain,
  Cpu,
  FileText,
  Building2,
  Map,
  Bot,
  UserCheck,
  AlertCircle,
  Target,
  Zap,
  TrendingUp,
  Layers,
  Award,
  ChevronRight,
  ListTodo,
} from 'lucide-react';

interface StudyPlannerPageProps {
  onNavigate: (route: string) => void;
}

export const StudyPlannerPage: React.FC<StudyPlannerPageProps> = ({ onNavigate }) => {
  const { user, profile } = useAuth();
  const studentId = user?.id || 'guest';

  // 1. Initial State: Load existing saved plan immediately without waiting for Gemini
  const [selectedTimeBudget, setSelectedTimeBudget] = useState<number>(() => getDailyStudyTime(studentId));
  const [plan, setPlan] = useState<StudyPlanData>(() => {
    return (
      getStoredStudyPlan(studentId) ||
      getImmediateDeterministicPlan(studentId, profile, getDailyStudyTime(studentId))
    );
  });

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<PreparationDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'weekly'>('today');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Background non-blocking sync of authentic dashboard metrics on mount and live events
  useEffect(() => {
    let isCancelled = false;

    const syncInitialData = async () => {
      try {
        const { plan: syncedPlan, dashboardData: dashData } = await getTodayStudyPlan(
          studentId,
          profile,
          false // DO NOT force AI generation on page load
        );
        if (!isCancelled) {
          setPlan(syncedPlan);
          setDashboardData(dashData);
          if (syncedPlan.dailyStudyTimeMinutes) {
            setSelectedTimeBudget(syncedPlan.dailyStudyTimeMinutes);
          }
        }
      } catch (err) {
        console.warn('[StudyPlannerPage] Background data sync:', err);
      }
    };

    syncInitialData();

    // Listen for live activity completions across modules (e.g. coding submission accepted, placement finished)
    const handleActivityUpdated = async () => {
      try {
        const { plan: updatedPlan, dashboardData: updatedDash } = await getTodayStudyPlan(
          studentId,
          profile,
          false
        );
        if (!isCancelled) {
          setPlan(updatedPlan);
          setDashboardData(updatedDash);
        }
      } catch (_) {}
    };

    const handlePlanUpdated = (e: any) => {
      if (e.detail?.plan && !isCancelled) {
        setPlan(e.detail.plan);
      }
    };

    window.addEventListener('careerpilot_activity_updated', handleActivityUpdated);
    window.addEventListener('careerpilot_study_plan_updated', handlePlanUpdated);

    return () => {
      isCancelled = true;
      window.removeEventListener('careerpilot_activity_updated', handleActivityUpdated);
      window.removeEventListener('careerpilot_study_plan_updated', handlePlanUpdated);
    };
  }, [studentId, profile]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Explicit AI refresh initiated by student
  const handleRefreshPlan = useCallback(async () => {
    if (refreshing) return; // Deduplicate concurrent clicks

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setRefreshing(true);
    setRefreshError(null);

    try {
      const { plan: newPlan, dashboardData: dashData } = await getTodayStudyPlan(
        studentId,
        profile,
        true, // forceRefresh
        { signal: controller.signal, timeoutMs: 25000 }
      );

      if (!controller.signal.aborted) {
        setPlan(newPlan);
        setDashboardData(dashData);
        if (newPlan.dailyStudyTimeMinutes) {
          setSelectedTimeBudget(newPlan.dailyStudyTimeMinutes);
        }
        setRefreshError(null);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return;
      }
      console.error('[StudyPlannerPage] Refresh plan error:', err);
      setRefreshError('Unable to refresh recommendations right now. Your current plan remains active.');
    } finally {
      if (!controller.signal.aborted) {
        setRefreshing(false);
      }
    }
  }, [studentId, profile, refreshing]);

  // Handle time budget change instantly without an external AI call
  const handleTimeBudgetChange = (minutes: number) => {
    setSelectedTimeBudget(minutes);
    const updatedPlan = updatePlanTimeBudget(studentId, minutes, profile);
    if (updatedPlan) {
      setPlan({ ...updatedPlan });
    }
  };

  // Handle starting a task
  const handleStartTask = (task: StudyTask) => {
    if (task.status === 'pending') {
      const updatedPlan = updateTaskStatus(studentId, task.id, 'in_progress');
      if (updatedPlan) {
        setPlan(updatedPlan);
      }
    }
    if (task.category === 'coding' && (task.targetTopic || task.targetCompany)) {
      const q = new URLSearchParams();
      q.set('subject', 'DSA');
      if (task.targetTopic) q.set('topic', task.targetTopic);
      if (task.targetCompany) q.set('company', task.targetCompany);
      if (task.targetLanguage) q.set('language', task.targetLanguage);
      q.set('difficulty', 'Medium');
      q.set('auto', 'true');
      onNavigate(`coding?${q.toString()}`);
    } else {
      onNavigate(task.route);
    }
  };

  // Handle manual task completion toggle
  const handleToggleTaskStatus = (task: StudyTask) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updatedPlan = updateTaskStatus(studentId, task.id, nextStatus);
    if (updatedPlan) {
      setPlan({ ...updatedPlan });
    }
  };

  // Icon selector based on category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'coding':
        return <Code2 className="w-4 h-4 text-emerald-500" />;
      case 'aptitude':
        return <Brain className="w-4 h-4 text-indigo-500" />;
      case 'interview':
        return <Cpu className="w-4 h-4 text-purple-500" />;
      case 'hr-interview':
        return <Bot className="w-4 h-4 text-amber-500" />;
      case 'resume':
        return <FileText className="w-4 h-4 text-cyan-500" />;
      case 'company-prep':
        return <Building2 className="w-4 h-4 text-rose-500" />;
      case 'roadmap':
        return <Map className="w-4 h-4 text-blue-500" />;
      case 'profile':
        return <UserCheck className="w-4 h-4 text-indigo-500" />;
      default:
        return <ListTodo className="w-4 h-4 text-indigo-500" />;
    }
  };

  // Category badge color
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'coding':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'aptitude':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'interview':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'hr-interview':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'resume':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      case 'company-prep':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'roadmap':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  // Difficulty badge color
  const getDifficultyBadgeClass = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
      case 'Intermediate':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
      case 'Advanced':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-500/20';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
    }
  };

  // Duration formatter helper
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours} hr ${remainingMins} min` : `${hours} hr`;
  };

  // Priority badge renderer
  const renderPriorityBadge = (priorityLevel?: string, isPriority?: boolean) => {
    if (priorityLevel === 'high' || isPriority) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          HIGH PRIORITY
        </span>
      );
    }
    if (priorityLevel === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          MEDIUM PRIORITY
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        <span className="text-slate-400 font-bold">○</span>
        LOW PRIORITY
      </span>
    );
  };

  // Helper for module display name
  const getModuleName = (task: StudyTask) => {
    if (task.relatedModuleName) return task.relatedModuleName;
    if (task.route === 'coding' || task.category === 'coding') return 'Coding Arena';
    if (task.route === 'placement' || task.category === 'aptitude') return 'Placement Practice / Aptitude';
    if (task.route === 'interview' || task.category === 'interview') return 'Technical Interview';
    if (task.route === 'hr-interview' || task.category === 'hr-interview') return 'HR Interview';
    if (task.route === 'company-prep' || task.category === 'company-prep') return 'Company Prep';
    if (task.route === 'roadmap' || task.category === 'roadmap') return 'Roadmap';
    if (task.route === 'resume-analyzer' || task.category === 'resume') return 'Resume Analyzer';
    return 'CareerPilot Practice';
  };

  // Calculate today's completion stats
  const totalTasks = plan?.tasks.length || 0;
  const completedTasks = plan?.tasks.filter((t) => t.status === 'completed').length || 0;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalEstMinutes = plan?.tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0) || 0;

  const rawName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    '';
  const studentName = String(rawName).trim().split(' ')[0] || 'Student';
  const targetRole = profile?.target_role?.trim() || 'Not set';
  const targetCompany =
    profile?.target_companies?.[0]?.trim() ||
    ((profile as any)?.target_company ? String((profile as any).target_company).trim() : undefined);

  let languagesList: string[] = [];
  const rawLangs = (profile as any)?.programming_languages;
  if (Array.isArray(rawLangs)) {
    languagesList = rawLangs.map((l: string) => String(l).trim()).filter(Boolean);
  } else if (typeof rawLangs === 'string') {
    languagesList = rawLangs.split(',').map((l: string) => l.trim()).filter(Boolean);
  }
  if (profile?.preferred_language && !languagesList.includes(profile.preferred_language.trim())) {
    languagesList.unshift(profile.preferred_language.trim());
  }
  const codingLanguagesDisplay = languagesList.length > 0 ? languagesList.join(', ') : 'Not set';
  const dsaProficiency = profile?.dsa_level?.trim() || 'Not set';

  const isBrandNewStudent = (plan?.totalActivitiesCount || 0) === 0 && (!dashboardData || dashboardData.totalActivitiesCount === 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* ========================================================
          1. TOP HEADER & PERSONALIZED PROFILE CONTEXT
      ======================================================== */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Header Left: Greeting & Goal Context */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                AI Placement Copilot
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Here’s what you should practice today, {studentName}.
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Your personalized daily preparation plan, prioritized using your current performance, target role, and preparation goals.
            </p>

            {/* Profile Context Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Target className="w-3 h-3 text-indigo-500" />
                Role: <strong className="font-semibold text-slate-900 dark:text-white ml-0.5">{targetRole}</strong>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Code2 className="w-3 h-3 text-emerald-500" />
                Languages: <strong className="font-semibold text-slate-900 dark:text-white ml-0.5">{codingLanguagesDisplay}</strong>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Layers className="w-3 h-3 text-purple-500" />
                DSA: <strong className="font-semibold text-slate-900 dark:text-white ml-0.5">{dsaProficiency}</strong>
              </span>
              {targetCompany && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                  <Building2 className="w-3 h-3 text-rose-500" />
                  Target: <strong className="font-semibold ml-0.5">{targetCompany}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Header Right: Daily Time Budget & Refresh Action */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0 bg-slate-50 dark:bg-slate-950/60 p-3.5 sm:p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between w-full gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Daily Time Budget
              </span>
              <button
                onClick={handleRefreshPlan}
                disabled={refreshing}
                title="Fetch latest performance data and regenerate plan"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/70 transition-colors disabled:opacity-75 cursor-pointer"
              >
                <RotateCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Updating your plan...' : 'Refresh Plan'}</span>
              </button>
            </div>

            {/* Time Budget Selector Buttons */}
            <div className="grid grid-cols-5 gap-1 w-full max-w-xs">
              {[
                { label: '30m', val: 30 },
                { label: '1h', val: 60 },
                { label: '1.5h', val: 90 },
                { label: '2h', val: 120 },
                { label: '3h+', val: 180 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => handleTimeBudgetChange(opt.val)}
                  className={`py-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                    selectedTimeBudget === opt.val
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-right w-full">
              Today's Plan: ⏱ <strong>{formatDuration(totalEstMinutes)}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          ERROR / TIMEOUT NOTIFICATION BANNER (NON-BLOCKING)
      ======================================================== */}
      {refreshError && (
        <div className="bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{refreshError}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRefreshPlan}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors cursor-pointer"
            >
              Try Again
            </button>
            <button
              onClick={() => setRefreshError(null)}
              className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          2. METRICS & PROGRESS HIGHLIGHTS GRID
      ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Today's Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Today's Progress
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {completedTasks} <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">/ {totalTasks} tasks</span>
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {progressPct}%
              </span>
            </div>
            {/* Dynamic Progress Bar */}
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2.5">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            {completedTasks === totalTasks && totalTasks > 0
              ? '🎉 All daily tasks completed! Excellent work.'
              : `${totalTasks - completedTasks} task${totalTasks - completedTasks === 1 ? '' : 's'} remaining today`}
          </p>
        </div>

        {/* Metric 2: Authentic Study Streak */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Study Streak
            </span>
            <div className={`p-2 rounded-xl ${plan?.streakDays && plan.streakDays > 0 ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {plan?.streakDays && plan.streakDays > 0 ? (
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {plan.streakDays}
                  </span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Day{plan.streakDays === 1 ? '' : 's'} Streak 🔥
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Keep practicing daily to maintain your momentum.
                </p>
              </div>
            ) : (
              <div>
                <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                  0 Days
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Start your first activity to begin your streak.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Metric 3: Active Preparation Time */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Allocated Time
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {totalEstMinutes}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                mins planned / {selectedTimeBudget}m budget
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Estimated duration for today's full plan
            </p>
          </div>
        </div>

        {/* Metric 4: Placement Readiness Diagnostic */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Placement Readiness
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {dashboardData && dashboardData.overallScore !== null ? (
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {dashboardData.overallScore}
                  </span>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">/ 100</span>
                  <span className={`text-xs font-bold ml-auto ${dashboardData.overallScore >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {dashboardData.overallScoreCategory}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Weighted benchmark from prep modules
                </p>
              </div>
            ) : (
              <div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Calibrating
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Complete activities to reveal your score
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          3. EMPTY STATE FOR NEW STUDENTS
      ======================================================== */}
      {isBrandNewStudent && (
        <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-slate-900/5 dark:from-indigo-950/50 dark:via-purple-950/40 dark:to-slate-900/80 rounded-2xl p-6 sm:p-8 border border-indigo-500/20 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Welcome to CareerPilot AI Study Planner!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              Complete more preparation activities to unlock personalized recommendations. Start with a quick diagnostic session below:
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('coding')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Code2 className="w-4 h-4" />
              <span>Start Coding</span>
            </button>
            <button
              onClick={() => onNavigate('placement')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              <span>Practice Aptitude</span>
            </button>
            <button
              onClick={() => onNavigate('interview')}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>Take Interview</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          4. TAB SWITCHER (Today's Plan vs. Weekly Goals)
      ======================================================== */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'today'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Today's Plan</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'today' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
              {totalTasks}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'weekly'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>This Week</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'weekly' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
              {plan?.weeklyGoals?.length || 4}
            </span>
          </button>
        </div>

        {/* AI Strategic Summary note */}
        {plan?.aiSummary && (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 max-w-md truncate">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">{plan.aiSummary}</span>
          </div>
        )}
      </div>

      {/* ========================================================
          5. TODAY'S PRACTICE PLAN VIEW
      ======================================================== */}
      {activeTab === 'today' && (
        <div className="space-y-6">

          {/* AI Strategic Note / Welcome Banner */}
          {isBrandNewStudent ? (
            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-cyan-500/10 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-cyan-950/30 rounded-2xl p-4 sm:p-5 border border-indigo-500/20 flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Welcome to Your AI Placement Copilot
                  </h4>
                  {refreshing && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse">
                      <RotateCw className="w-3 h-3 animate-spin" />
                      Updating recommendations...
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-indigo-700 dark:text-indigo-300 font-semibold leading-relaxed">
                  Your personalized plan will become more accurate as you practice.
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Complete these initial starter activities in Coding Arena, Aptitude Practice, and Technical Interviews to calibrate your placement baseline.
                </p>
              </div>
            </div>
          ) : plan?.aiSummary ? (
            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-cyan-500/10 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-cyan-950/30 rounded-2xl p-4 sm:p-5 border border-indigo-500/20 flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-indigo-500 text-white shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    AI Strategic Plan Summary
                  </h4>
                  {refreshing && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse">
                      <RotateCw className="w-3 h-3 animate-spin" />
                      Updating recommendations...
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {plan.aiSummary}
                </p>
                {plan.recommendationNote && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                    💡 <strong className="font-medium text-slate-700 dark:text-slate-300">Tip:</strong> {plan.recommendationNote}
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {/* SECTION TITLE & OVERVIEW */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <ListTodo className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <span>Today's Practice Plan</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {plan?.tasks.length || 0} activities recommended based on your verified performance data
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Total Time: <strong>{formatDuration(totalEstMinutes)}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {completedTasks} / {totalTasks} Completed
              </span>
            </div>
          </div>

          {/* TODAY'S PRACTICE PLAN TASKS LIST (3–5 Recommended Activities) */}
          <div className="space-y-4">
            {plan?.tasks.map((task, idx) => {
              const isCompleted = task.status === 'completed';
              const isInProgress = task.status === 'in_progress';
              const moduleName = getModuleName(task);
              const taskTopic = task.topic || task.targetTopic || task.category.replace('-', ' ');

              return (
                <div
                  key={task.id || `task-${idx}`}
                  className={`relative bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                    task.priorityLevel === 'high' || task.isPriority
                      ? isCompleted
                        ? 'border-emerald-500/40 bg-emerald-500/[0.02]'
                        : 'border-2 border-indigo-500/40 dark:border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                      : isCompleted
                      ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  {/* Top Bar: Priority + Module + Difficulty + Estimated Time + Completion Status Toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Priority Tag */}
                      {renderPriorityBadge(task.priorityLevel, task.isPriority)}

                      {/* Related CareerPilot Module */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getCategoryBadgeClass(task.category)}`}>
                        {getCategoryIcon(task.category)}
                        <span>{moduleName}</span>
                      </span>

                      {/* Difficulty */}
                      {task.difficulty && (
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${getDifficultyBadgeClass(task.difficulty)}`}>
                          {task.difficulty}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Estimated Time */}
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        ⏱ {task.estimatedMinutes} min
                      </span>

                      {/* Evidence-Based Progress / Verification Badge */}
                      {task.isVerifiable !== false ? (
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : isInProgress
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Verified Complete</span>
                            </>
                          ) : isInProgress ? (
                            <>
                              <RotateCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                              <span>
                                {typeof task.completedCount === 'number' && typeof task.requiredCount === 'number'
                                  ? `${task.completedCount}/${task.requiredCount} Done`
                                  : 'In Progress'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {typeof task.completedCount === 'number' && typeof task.requiredCount === 'number'
                                  ? `0/${task.requiredCount} Completed`
                                  : 'Activity Required'}
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleToggleTaskStatus(task)}
                          title={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Completed</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-3.5 h-3.5" />
                              <span>Mark Done</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Task Content: Title & Topic */}
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className={`text-base sm:text-lg font-bold tracking-tight ${isCompleted ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                        {task.title}
                      </h3>
                      {taskTopic && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Topic: <strong className="font-bold text-slate-800 dark:text-slate-200">{taskTopic}</strong>
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {task.description}
                      </p>
                    )}

                    {/* Completion Criteria / Evidence Requirement */}
                    {task.completionCriteria && (
                      <div className="mt-2.5 flex items-start gap-2 text-xs bg-indigo-50/60 dark:bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-500/15">
                        <Target className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <div className="space-y-1 w-full">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                              Completion Requirement:
                            </span>
                            {typeof task.completedCount === 'number' && typeof task.requiredCount === 'number' && (
                              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                {task.completedCount} / {task.requiredCount} completed
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                            {task.completionCriteria}
                          </p>
                          {/* Mini Progress Bar for multi-item tasks */}
                          {typeof task.completedCount === 'number' && typeof task.requiredCount === 'number' && task.requiredCount > 1 && (
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.round((task.completedCount / task.requiredCount) * 100))}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reason for Recommendation (Why: ...) */}
                  <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                      Why:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {task.reason}
                    </p>
                  </div>

                  {/* Footer: Status Badge & Start Action Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Status:</span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : isInProgress
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {isCompleted ? '✓ Completed' : isInProgress ? '● In Progress' : '○ Not Started'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleStartTask(task)}
                      className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer group ${
                        isCompleted
                          ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                          : isInProgress
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      <span>
                        {isCompleted
                          ? 'Practice Again'
                          : isInProgress
                          ? 'Continue Activity'
                          : task.actionLabel || 'Start Activity'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          6. WEEKLY PREPARATION GOALS ("THIS WEEK")
      ======================================================== */}
      {activeTab === 'weekly' && (
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-500" />
                  <span>This Week's Preparation Targets</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Structured weekly targets calculated to systematically build placement competencies.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                Weekly Horizon
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan?.weeklyGoals?.map((goal) => {
                const goalProgressPct = goal.targetCount > 0
                  ? Math.min(100, Math.round((goal.completedCount / goal.targetCount) * 100))
                  : 0;
                const isGoalMet = goal.completedCount >= goal.targetCount;

                return (
                  <div
                    key={goal.id}
                    className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(goal.category)}
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {goal.title}
                        </h4>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        isGoalMet
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {goal.completedCount} / {goal.targetCount} {goal.unit}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isGoalMet
                              ? 'bg-emerald-500'
                              : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                          }`}
                          style={{ width: `${goalProgressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                        <span>{goalProgressPct}% completed</span>
                        <span>Target: {goal.targetCount} {goal.unit}</span>
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => onNavigate(goal.route)}
                      className="w-full py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Practice {goal.title}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          7. QUICK SHORTCUT PANEL TO CORE MODULES
      ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Direct Access to Preparation Modules</span>
          </h3>
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>View Full Prep Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {[
            { label: 'Coding Arena', route: 'coding', icon: <Code2 className="w-4 h-4 text-emerald-500" /> },
            { label: 'Placement MCQs', route: 'placement', icon: <Brain className="w-4 h-4 text-indigo-500" /> },
            { label: 'Tech Interview', route: 'interview', icon: <Cpu className="w-4 h-4 text-purple-500" /> },
            { label: 'Resume ATS', route: 'resume-analyzer', icon: <FileText className="w-4 h-4 text-cyan-500" /> },
            { label: 'Company Prep', route: 'company-prep', icon: <Building2 className="w-4 h-4 text-rose-500" /> },
            { label: 'Roadmap', route: 'roadmap', icon: <Map className="w-4 h-4 text-blue-500" /> },
            { label: 'AI Mentor', route: 'career-mentor', icon: <Bot className="w-4 h-4 text-amber-500" /> },
          ].map((item) => (
            <button
              key={item.route}
              onClick={() => onNavigate(item.route)}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200/60 dark:border-slate-800 text-left transition-all group cursor-pointer"
            >
              <div className="mb-2 p-1.5 w-fit rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
