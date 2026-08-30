import React from 'react';
import {
  Cpu,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Code2,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import { InterviewWeaknessData } from '../../types/intelligence';

interface InterviewWeaknessTrackerProps {
  data: InterviewWeaknessData;
  onNavigate: (route: string) => void;
}

export const InterviewWeaknessTracker: React.FC<InterviewWeaknessTrackerProps> = ({
  data,
  onNavigate,
}) => {
  const {
    totalInterviews,
    hasEnoughDataForTrend,
    currentPerformance,
    previousPerformance,
    deltas,
    weakAreas,
    strongAreas,
    recommendedNextInterview,
  } = data;

  const renderDelta = (deltaVal?: number | null) => {
    if (deltaVal === undefined || deltaVal === null) return null;
    if (deltaVal > 0) {
      return (
        <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="w-3.5 h-3.5 mr-0.5" />+{deltaVal}
        </span>
      );
    }
    if (deltaVal < 0) {
      return (
        <span className="flex items-center text-xs font-bold text-rose-600 dark:text-rose-400">
          <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
          {deltaVal}
        </span>
      );
    }
    return (
      <span className="flex items-center text-xs font-semibold text-slate-400">
        <Minus className="w-3 h-3 mr-0.5" />0
      </span>
    );
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200';
    if (score >= 65) return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200';
    return 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200';
  };

  return (
    <div
      id="interview-weakness-tracker"
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Cpu className="w-5 h-5" />
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Interview Weakness Tracker
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Multi-dimensional evaluation across Technical Depth, Verbal Communication, and Problem Solving.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {totalInterviews} {totalInterviews === 1 ? 'Round' : 'Rounds'} Evaluated
          </span>
        </div>
      </div>

      {totalInterviews === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
          <Cpu className="w-10 h-10 mx-auto text-slate-400" />
          <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No Mock Interviews Recorded Yet
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Take your first technical mock interview to benchmark your verbal communication and algorithm explanation.
          </p>
          <button
            onClick={() => onNavigate('interview')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
          >
            Start First Mock Interview →
          </button>
        </div>
      ) : (
        <>
          {/* Dimension Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Overall Score
                </span>
                {renderDelta(deltas?.overall)}
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {currentPerformance.overall}/100
              </div>
              <div className="text-[11px] text-slate-400">
                {previousPerformance ? `Prev: ${previousPerformance.overall}` : 'Latest Assessment'}
              </div>
            </div>

            {/* Technical Depth */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                  Technical
                </span>
                {renderDelta(deltas?.technical)}
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {currentPerformance.technical}/100
              </div>
              <div className="text-[11px] text-slate-400">
                {previousPerformance ? `Prev: ${previousPerformance.technical}` : 'Latest Assessment'}
              </div>
            </div>

            {/* Communication */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                  Communication
                </span>
                {renderDelta(deltas?.communication)}
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {currentPerformance.communication}/100
              </div>
              <div className="text-[11px] text-slate-400">
                {previousPerformance ? `Prev: ${previousPerformance.communication}` : 'Latest Assessment'}
              </div>
            </div>

            {/* Problem Solving */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  Problem Solving
                </span>
                {renderDelta(deltas?.problemSolving)}
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {currentPerformance.problemSolving}/100
              </div>
              <div className="text-[11px] text-slate-400">
                {previousPerformance ? `Prev: ${previousPerformance.problemSolving}` : 'Latest Assessment'}
              </div>
            </div>
          </div>

          {/* Trend Note */}
          {!hasEnoughDataForTrend && (
            <div className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-center">
              More interviews needed to establish a continuous historical trend (2+ rounds required).
            </div>
          )}

          {/* Weak & Strong Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weak Areas */}
            <div className="p-5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Areas Needing Attention</span>
              </div>
              {(weakAreas || []).length > 0 ? (
                <div className="space-y-2">
                  {(weakAreas || []).map((w, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/60 dark:border-rose-900/40 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                        <span>{w.area}</span>
                        <span className="text-rose-600 font-mono">{w.score}/100</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        {w.actionableAdvice}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600">No major critical interview weaknesses detected.</p>
              )}
            </div>

            {/* Strong Areas */}
            <div className="p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Demonstrated Strengths</span>
              </div>
              {(strongAreas || []).length > 0 ? (
                <div className="space-y-2">
                  {(strongAreas || []).map((s, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-900/40 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                        <span>{s.area}</span>
                        <span className="text-emerald-600 font-mono">{s.score}/100</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">{s.evidence}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600">Complete more rounds to highlight strong competencies.</p>
              )}
            </div>
          </div>

          {/* Actionable Next Step Callout */}
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  Recommended Next Mock Round: {recommendedNextInterview.recommendedSubject}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  {recommendedNextInterview.rationale}
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('interview')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <span>Practice Next Round</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
