import React, { useState } from 'react';
import {
  Target,
  FileCheck,
  Code2,
  Cpu,
  Flame,
  ArrowRight,
  Sparkles,
  Info,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { PlacementReadinessReport, ReadinessComponentKey } from '../../types/readiness';
import { ReadinessDetailedModal } from './ReadinessDetailedModal';

interface PlacementReadinessCardProps {
  report: PlacementReadinessReport | null;
  isLoading: boolean;
  onRefresh: () => void;
  onNavigate: (page: string) => void;
}

export const PlacementReadinessCard: React.FC<PlacementReadinessCardProps> = ({
  report,
  isLoading,
  onRefresh,
  onNavigate,
}) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  if (isLoading || !report) {
    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
          <div className="md:col-span-2 space-y-3">
            <div className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const { overallScore, statusCategory, statusBadgeColor, components, recommendation } = report;

  // Determine progress bar stroke & color
  const getProgressColor = (score: number) => {
    if (score >= 90) return 'text-amber-500 stroke-amber-500';
    if (score >= 75) return 'text-emerald-500 stroke-emerald-500';
    if (score >= 60) return 'text-indigo-500 stroke-indigo-500';
    if (score >= 40) return 'text-sky-500 stroke-sky-500';
    return 'text-slate-400 stroke-slate-400';
  };

  const getBarColor = (score: number) => {
    if (score >= 90) return 'bg-amber-500';
    if (score >= 75) return 'bg-emerald-500';
    if (score >= 60) return 'bg-indigo-500';
    if (score >= 40) return 'bg-sky-500';
    return 'bg-slate-400';
  };

  return (
    <>
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-6 relative overflow-hidden transition-all duration-300">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  🎯 Placement Readiness
                </h2>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold border shadow-xs ${statusBadgeColor.bg} ${statusBadgeColor.text} ${statusBadgeColor.border}`}
                >
                  {statusCategory}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Deterministic calculation across Resume, Coding, Technical Mock & Consistency
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={onRefresh}
              title="Refresh readiness metrics"
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsDetailModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-500/20 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Info className="w-3.5 h-3.5" />
              <span>View Detailed Analysis</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Overall Score Radial + 4 Components Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Column: Overall Score Presentation */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-950 dark:to-indigo-950/20 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              Overall Readiness Score
            </span>
            
            <div className="flex items-baseline gap-1.5">
              <span className={`text-5xl sm:text-6xl font-black font-mono tracking-tight ${getProgressColor(overallScore).split(' ')[0]}`}>
                {overallScore}
              </span>
              <span className="text-xl font-bold text-slate-400 font-mono">/ 100</span>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full max-w-[220px] bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(overallScore)}`}
                style={{ width: `${Math.max(4, overallScore)}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[220px] leading-relaxed">
              {(!components.resume.isAvailable || !components.coding.isAvailable || !components.technicalInterview.isAvailable)
                ? 'Complete more activities to calculate your readiness accurately.'
                : 'Your readiness score is based on your actual resume, coding performance, interview performance, and consistency.'}
            </p>
          </div>

          {/* Right Column: 4 Component Scores & Interactive CTAs */}
          <div className="lg:col-span-8 space-y-3.5">
            
            {/* Component 1: Resume */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-[170px]">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Resume</span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">(25%)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[200px]">
                    {components.resume.isAvailable ? components.resume.summary : 'ATS analysis pending'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 flex-1">
                {components.resume.isAvailable ? (
                  <>
                    <div className="w-24 sm:w-32 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full ${getBarColor(components.resume.score)}`}
                        style={{ width: `${components.resume.score}%` }}
                      />
                    </div>
                    <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-slate-100 min-w-[58px] text-right">
                      {components.resume.score}/100
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Resume score unavailable
                    </span>
                    <button
                      onClick={() => onNavigate('resume-analyzer')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
                    >
                      Analyze My Resume
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Component 2: Coding */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-[170px]">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Coding</span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">(30%)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[200px]">
                    {components.coding.isAvailable ? components.coding.summary : 'Practice problems pending'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 flex-1">
                {components.coding.isAvailable ? (
                  <>
                    <div className="w-24 sm:w-32 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full ${getBarColor(components.coding.score)}`}
                        style={{ width: `${components.coding.score}%` }}
                      />
                    </div>
                    <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-slate-100 min-w-[58px] text-right">
                      {components.coding.score}/100
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Coding score unavailable
                    </span>
                    <button
                      onClick={() => onNavigate('coding')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
                    >
                      Practice Coding
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Component 3: Technical Interview */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-[170px]">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Technical Interview</span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">(30%)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[200px]">
                    {components.technicalInterview.isAvailable ? components.technicalInterview.summary : 'Mock session pending'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 flex-1">
                {components.technicalInterview.isAvailable ? (
                  <>
                    <div className="w-24 sm:w-32 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full ${getBarColor(components.technicalInterview.score)}`}
                        style={{ width: `${components.technicalInterview.score}%` }}
                      />
                    </div>
                    <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-slate-100 min-w-[58px] text-right">
                      {components.technicalInterview.score}/100
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Technical Interview score unavailable
                    </span>
                    <button
                      onClick={() => onNavigate('interview')}
                      className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
                    >
                      Take Mock Interview
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Component 4: Consistency */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-[170px]">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Consistency</span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">(15%)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[200px]">
                    {components.consistency.summary}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 flex-1">
                <div className="w-24 sm:w-32 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shrink-0">
                  <div
                    className={`h-full rounded-full ${getBarColor(components.consistency.score)}`}
                    style={{ width: `${components.consistency.score}%` }}
                  />
                </div>
                <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-slate-100 min-w-[58px] text-right">
                  {components.consistency.score}/100
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Dynamic Improvement Recommendation Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-purple-500/10 dark:from-amber-950/30 dark:via-slate-900 dark:to-purple-950/30 border border-amber-500/30 dark:border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                {recommendation.headline}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                {recommendation.componentTitle} Score: {recommendation.currentScore}/100
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              <strong className="font-semibold text-slate-800 dark:text-slate-200">Recommended:</strong>{' '}
              {recommendation.recommendedAction}
            </p>
          </div>

          <button
            onClick={() => onNavigate(recommendation.actionRoute)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
          >
            <span>{recommendation.actionButtonText}</span>
          </button>
        </div>

      </div>

      {/* Detailed Analysis Modal */}
      <ReadinessDetailedModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        report={report}
        onNavigate={onNavigate}
      />
    </>
  );
};
