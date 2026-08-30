import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  Sparkles,
  Flame,
  Target,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  X,
  FileText,
  Code2,
  Brain,
  Cpu,
  Map,
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
  const [showFormulaModal, setShowFormulaModal] = useState(false);

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
    modules,
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
    <>
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
                    {totalActivitiesCount > 0 ? 'Early Progress' : 'No Score Yet'}
                  </span>
                </div>
              )}
            </div>

            {/* Score Details & CTA */}
            <div className="space-y-2 text-center sm:text-left">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>Overall Preparation Score</span>
                  <button
                    onClick={() => setShowFormulaModal(true)}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors p-0.5"
                    title="How is this calculated?"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${catStyle.bg}`}>
                    {hasEnoughDataForOverallScore ? overallScoreCategory : totalActivitiesCount > 0 ? 'Early Progress' : 'Awaiting Data'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {totalActivitiesCount > 0
                  ? `${totalActivitiesCount} authentic ${totalActivitiesCount === 1 ? 'activity' : 'activities'} completed`
                  : 'Zero recorded attempts so far'}
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  onClick={() => setShowFormulaModal(true)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  How is this calculated?
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Score Transparency Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Career Readiness Score Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Transparent, evidence-based calculation with zero fabricated data.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold text-indigo-700 dark:text-indigo-300">Mathematical Formula:</span>
              <p className="mt-1 font-mono text-[11px]">
                Score = (Coding DSA × 25%) + (Resume ATS × 20%) + (Technical Interview × 20%) + (Placement Aptitude × 20%) + (Roadmap × 15%)
              </p>
            </div>

            {/* Minimum Data Requirement Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Minimum Evidence Threshold</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                To guarantee academic integrity, a composite readiness score is only generated after a student completes activities in at least 2 distinct core domains (or ≥ 3 authentic attempts). Early users see verified dimension scores with an uninflated baseline.
              </p>
            </div>

            {/* 5 Core Dimension Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Current Dimension Status (5 Core Scoring Dimensions)
                </span>
                <span className="text-[11px] font-medium text-slate-400">Total = 100%</span>
              </div>
              <div className="space-y-2">
                {[
                  {
                    key: 'coding',
                    name: 'Coding',
                    weight: 25,
                    mod: modules.find((m) => m.id === 'mod-coding' || m.category === 'coding'),
                  },
                  {
                    key: 'resume',
                    name: 'Resume ATS',
                    weight: 20,
                    mod: modules.find((m) => m.id === 'mod-resume' || m.category === 'resume'),
                  },
                  {
                    key: 'aptitude',
                    name: 'Placement Aptitude',
                    weight: 20,
                    mod: modules.find((m) => m.id === 'mod-aptitude' || m.category === 'aptitude'),
                  },
                  {
                    key: 'tech-interview',
                    name: 'Technical Interview',
                    weight: 20,
                    mod: modules.find((m) => m.id === 'mod-tech-interview' || m.category === 'technical-interview'),
                  },
                  {
                    key: 'roadmap',
                    name: 'Roadmap',
                    weight: 15,
                    mod: modules.find((m) => m.id === 'mod-roadmap' || m.category === 'roadmap'),
                  },
                ].map((item) => {
                  const hasData = Boolean(item.mod?.hasData);
                  const score = hasData && typeof item.mod?.score === 'number' ? item.mod.score : null;
                  const contrib = score !== null ? (score * (item.weight / 100)).toFixed(1) : '0.0';

                  return (
                    <div
                      key={item.key}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                          {item.weight}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {score !== null ? (
                          <div className="text-right">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{score}%</span>
                            <span className="text-[11px] text-slate-400 font-mono ml-2">
                              {score} × {item.weight}% = {contrib}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400">Not assessed</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Score Calculation Summary */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Overall Calculated Score:</span>
              <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                {hasEnoughDataForOverallScore && score !== null
                  ? `${score} / 100`
                  : 'Not enough verified activity yet'}
              </span>
            </div>

            {/* Additional Activity Status (Non-contributing to 100-pt formula) */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Additional Activity Status (Not included in current score)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  {
                    key: 'company-prep',
                    name: 'Company Preparation',
                    mod: modules.find((m) => m.id === 'mod-company-prep' || m.category === 'company-prep'),
                  },
                  {
                    key: 'hr-interview',
                    name: 'HR Interview',
                    mod: modules.find((m) => m.id === 'mod-hr-interview' || m.category === 'hr-interview'),
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/20 border border-slate-200/60 dark:border-slate-700/40 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                      <div className="text-[10px] text-slate-400">Not included in current score</div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold ${
                        item.mod?.hasData
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.mod?.hasData
                        ? typeof item.mod.score === 'number'
                          ? `${item.mod.score}%`
                          : 'Assessed'
                        : 'Not assessed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
