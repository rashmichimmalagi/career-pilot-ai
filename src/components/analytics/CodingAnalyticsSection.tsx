import React from 'react';
import {
  Code2,
  CheckCircle2,
  TrendingUp,
  Flame,
  ArrowRight,
  HelpCircle,
  BarChart3,
} from 'lucide-react';
import { CodingProgressAnalytics } from '../../types/intelligence';

interface CodingAnalyticsSectionProps {
  coding: CodingProgressAnalytics;
  onNavigate: (route: string) => void;
}

export const CodingAnalyticsSection: React.FC<CodingAnalyticsSectionProps> = ({
  coding,
  onNavigate,
}) => {
  const topicsList = Object.values(coding.topicBreakdown || {});
  const practicedTopics = topicsList.filter((t) => t.hasEnoughData);
  const unpracticedTopics = topicsList.filter((t) => !t.hasEnoughData);

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Code2 className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Coding & Data Structures Analytics
            </h3>
            <p className="text-xs text-slate-500">
              Authentic submission telemetry, acceptance rates, and topic-level mastery.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('coding')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-colors self-start sm:self-auto"
        >
          <span>Practice Coding</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Solved Problems</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {coding.uniqueAcceptedCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Unique accepted</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Submissions</div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {coding.totalSubmissions}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{coding.successfulSubmissions} accepted</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Accuracy Rate</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {coding.totalSubmissions > 0 ? `${coding.accuracyRate}%` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Accepted / Total</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Success Rate</div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
            {coding.attemptedCount > 0 ? `${coding.successRate}%` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Solved / Attempted</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Difficulty Solved</div>
          <div className="text-xs font-black text-slate-900 dark:text-slate-100 mt-2 flex items-center gap-1.5">
            <span className="text-emerald-500">{coding.easySolved}E</span>
            <span>•</span>
            <span className="text-amber-500">{coding.mediumSolved}M</span>
            <span>•</span>
            <span className="text-rose-500">{coding.hardSolved}H</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Easy • Med • Hard</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Active Streak</div>
          <div className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
            <Flame className="w-5 h-5" />
            <span>{coding.currentStreakDays}d</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Best: {coding.longestStreakDays} days</div>
        </div>
      </div>

      {/* Strongest vs Focus Areas */}
      {(coding.strongestTopics.length > 0 || coding.weakestTopics.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {coding.strongestTopics.length > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Strongest Topics</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {coding.strongestTopics.map((st) => (
                  <span
                    key={st.topic}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/50 text-xs font-bold text-emerald-800 dark:text-emerald-200"
                  >
                    {st.topic} • {st.accuracy}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {coding.weakestTopics.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 space-y-2">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Recommended Focus Topics</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {coding.weakestTopics.map((wt) => (
                  <span
                    key={wt.topic}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/50 text-xs font-bold text-amber-800 dark:text-amber-200"
                  >
                    {wt.topic} • {wt.accuracy}% acc ({wt.attempted} tries)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Topic-Wise Performance Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Topic-Wise Performance Breakdown
          </h4>
          <span className="text-[11px] text-slate-400">
            {practicedTopics.length} Practiced • {unpracticedTopics.length} Not Assessed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {topicsList.map((tm) => (
            <div
              key={tm.topic}
              className={`p-3.5 rounded-2xl border transition-all ${
                tm.hasEnoughData
                  ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  : 'bg-slate-50/30 dark:bg-slate-800/10 border-slate-100 dark:border-slate-800/50 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {tm.topic}
                </span>
                {tm.hasEnoughData ? (
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {tm.accuracy}%
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 italic">
                    Not enough data
                  </span>
                )}
              </div>

              {tm.hasEnoughData ? (
                <div className="mt-2 space-y-1.5">
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        tm.accuracy >= 75
                          ? 'bg-emerald-500'
                          : tm.accuracy >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${tm.accuracy}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between">
                    <span>{tm.solved} solved</span>
                    <span>{tm.attempted} attempts</span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-[10px] text-slate-400">
                  0 problems attempted yet
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
