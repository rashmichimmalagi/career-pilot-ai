import React from 'react';
import {
  Compass,
  CheckCircle2,
  Sparkles,
  Flame,
  Target,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { PreparationDashboardData } from '../../types/preparationDashboard';

interface PreparationTopSectionProps {
  data: PreparationDashboardData;
  onNavigate: (page: string) => void;
  onEditProfile?: () => void;
}

export const PreparationTopSection: React.FC<PreparationTopSectionProps> = ({
  data,
  onNavigate,
  onEditProfile,
}) => {
  const {
    studentName,
    greeting,
    targetRole,
    hasEnoughDataForOverallScore,
    overallScore,
    overallScoreCategory,
    overallScoreDescription,
    totalActivitiesCount,
    streakDays,
  } = data;

  // Determine badge color and ring based on overallScoreCategory
  const getCategoryStyles = () => {
    switch (overallScoreCategory) {
      case 'Highly Prepared':
        return {
          bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          ring: 'text-emerald-500 dark:text-emerald-400',
          glow: 'from-emerald-500/20 to-teal-500/10',
        };
      case 'Placement Ready':
        return {
          bg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
          ring: 'text-indigo-600 dark:text-indigo-400',
          glow: 'from-indigo-500/20 to-cyan-500/10',
        };
      case 'Making Progress':
        return {
          bg: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
          ring: 'text-sky-500 dark:text-sky-400',
          glow: 'from-sky-500/20 to-indigo-500/10',
        };
      case 'Building Foundations':
        return {
          bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
          ring: 'text-amber-500 dark:text-amber-400',
          glow: 'from-amber-500/20 to-orange-500/10',
        };
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
          ring: 'text-slate-500 dark:text-slate-400',
          glow: 'from-slate-500/10 to-indigo-500/5',
        };
    }
  };

  const catStyle = getCategoryStyles();

  // SVG Circular progress ring calculations
  const score = overallScore;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const validScore = typeof score === 'number' ? Math.max(0, Math.min(100, score)) : 0;
  const strokeDashoffset = circumference * (1 - validScore / 100);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl p-6 sm:p-8 transition-all">
      {/* Background ambient lighting */}
      <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl ${catStyle.glow} blur-3xl opacity-60 pointer-events-none`} />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        
        {/* Left: Greeting & Target Meta */}
        <div className="space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
              <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Placement Preparation Dashboard</span>
            </span>

            {targetRole && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Target className="w-3 h-3 text-slate-500" />
                <span>Target: {targetRole}</span>
              </span>
            )}

            {data.profileCompletion && (
              <button
                onClick={() => onNavigate('profile')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                title="View & Edit Student Profile"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Profile {data.profileCompletion.percentage}% Complete</span>
              </button>
            )}

            {streakDays > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>{streakDays} Day Streak</span>
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {greeting}, <span className="text-indigo-600 dark:text-indigo-400">{studentName}</span> 👋
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 font-medium">
              Your Placement Preparation Overview & Real-Time Performance Analytics
            </p>
          </div>

          {/* Preparation Status Callout */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            {hasEnoughDataForOverallScore ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {hasEnoughDataForOverallScore ? overallScoreCategory : 'Baseline Evaluation in Progress'}
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                {overallScoreDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Real Placement Preparation Score Card */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-900/90 border border-slate-200 dark:border-slate-700/80 shadow-xs shrink-0 min-w-[280px] sm:min-w-[320px]">
          
          {/* Circular Score Visualizer */}
          <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 shrink-0">
            {hasEnoughDataForOverallScore && score !== null ? (
              <>
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Background track circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="stroke-slate-200 dark:stroke-slate-700/80"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className={`${catStyle.ring} transition-[stroke-dashoffset] duration-1000 ease-out`}
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    fill="none"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none font-mono">
                    {score}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                    out of 100
                  </span>
                </div>
              </>
            ) : (
              <div className="w-full h-full rounded-full border-4 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center p-2">
                <span className="text-xl sm:text-2xl font-bold text-slate-400 dark:text-slate-500">--</span>
                <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase leading-tight">
                  No Score Yet
                </span>
              </div>
            )}
          </div>

          {/* Score Details & CTA */}
          <div className="space-y-2 text-center sm:text-left">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Overall Preparation Score
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${catStyle.bg}`}>
                  {hasEnoughDataForOverallScore ? overallScoreCategory : 'Awaiting Data'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {totalActivitiesCount > 0
                ? `${totalActivitiesCount} authentic activities completed`
                : 'Zero recorded attempts so far'}
            </div>

            {!hasEnoughDataForOverallScore && (
              <button
                onClick={() => onNavigate('resume-analyzer')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors pt-1 cursor-pointer"
              >
                <span>Start Initial Assessment</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
