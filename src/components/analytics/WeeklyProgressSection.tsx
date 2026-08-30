import React from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, Code2, Brain, Cpu, FileText, Map, Clock } from 'lucide-react';
import { WeeklyProgressSummary } from '../../types/intelligence';

interface WeeklyProgressSectionProps {
  weekly: WeeklyProgressSummary;
  onOpenReportModal: () => void;
}

export const WeeklyProgressSection: React.FC<WeeklyProgressSectionProps> = ({
  weekly,
  onOpenReportModal,
}) => {
  const renderTrendBadge = (trend: 'up' | 'down' | 'stable' | 'none', delta: number) => {
    if (trend === 'up') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="w-3 h-3" />
          <span>+{delta} vs prev</span>
        </span>
      );
    }
    if (trend === 'down') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
          <TrendingDown className="w-3 h-3" />
          <span>{delta} vs prev</span>
        </span>
      );
    }
    if (trend === 'stable') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
          <Minus className="w-3 h-3" />
          <span>Same as prev</span>
        </span>
      );
    }
    return (
      <span className="text-[10px] text-slate-400 italic">
        No prev week data
      </span>
    );
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Calendar className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Weekly Progress & Comparison ("This Week")
            </h3>
            <p className="text-xs text-slate-500">
              Activities completed in the last 7 days evaluated against your prior 7-day baseline.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenReportModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer transition-colors self-start sm:self-auto"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Generate Career Report</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Coding */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Code2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Coding</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {weekly.codingProblems.currentValue}{' '}
            <span className="text-xs font-semibold text-slate-400">problems</span>
          </div>
          <div>{renderTrendBadge(weekly.codingProblems.trend, weekly.codingProblems.delta)}</div>
        </div>

        {/* Aptitude */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Brain className="w-3.5 h-3.5 text-cyan-500" />
            <span>Aptitude</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {weekly.placementQuestions.currentValue}{' '}
            <span className="text-xs font-semibold text-slate-400">tests</span>
          </div>
          <div>{renderTrendBadge(weekly.placementQuestions.trend, weekly.placementQuestions.delta)}</div>
        </div>

        {/* Mock Interview */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Cpu className="w-3.5 h-3.5 text-purple-500" />
            <span>Interviews</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {weekly.interviewsCompleted.currentValue}{' '}
            <span className="text-xs font-semibold text-slate-400">rounds</span>
          </div>
          <div>{renderTrendBadge(weekly.interviewsCompleted.trend, weekly.interviewsCompleted.delta)}</div>
        </div>

        {/* Resume Activity */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            <span>Resume Updates</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {weekly.resumeActivity.currentValue}{' '}
            <span className="text-xs font-semibold text-slate-400">versions</span>
          </div>
          <div>{renderTrendBadge(weekly.resumeActivity.trend, weekly.resumeActivity.delta)}</div>
        </div>

        {/* Career Readiness Delta */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            <span>Readiness Delta</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {weekly.overallReadinessDelta !== null ? (
              <span className={weekly.overallReadinessDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {weekly.overallReadinessDelta >= 0 ? `+${weekly.overallReadinessDelta}` : weekly.overallReadinessDelta} pts
              </span>
            ) : (
              <span className="text-slate-400 text-sm font-bold">Stable</span>
            )}
          </div>
          <div className="text-[10px] text-slate-400">{weekly.comparisonNote}</div>
        </div>
      </div>
    </div>
  );
};
