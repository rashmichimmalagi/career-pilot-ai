import React from 'react';
import { Brain, ArrowRight, CheckCircle2, TrendingUp, HelpCircle } from 'lucide-react';
import { PlacementProgressAnalytics } from '../../types/intelligence';

interface AptitudeAnalyticsSectionProps {
  placement: PlacementProgressAnalytics;
  onNavigate: (route: string) => void;
}

export const AptitudeAnalyticsSection: React.FC<AptitudeAnalyticsSectionProps> = ({
  placement,
  onNavigate,
}) => {
  const hasData = placement.totalAttempts > 0;
  const categories = Object.entries(placement.categoryPerformance || {});

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
            <Brain className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Placement Aptitude Analytics
            </h3>
            <p className="text-xs text-slate-500">
              Quantitative reasoning, logical analysis, verbal ability, and core CS test telemetry.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('placement')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs cursor-pointer transition-colors self-start sm:self-auto"
        >
          <span>Take Aptitude Test</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Tests Completed</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {placement.totalAttempts}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Sessions logged</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Average Score</div>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
            {hasData ? `${placement.averageScore}%` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Overall mean</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Accuracy Rate</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {hasData ? `${placement.averageAccuracy}%` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Correct / Answered</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Questions Answered</div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {placement.totalQuestionsAnswered}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{placement.totalCorrect} correct</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Personal Best</div>
          <div className="text-2xl font-black text-amber-500 mt-1">
            {hasData ? `${placement.bestScore}%` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Peak test score</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Score Trend</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {hasData ? (
              <span className={placement.improvementTrend >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {placement.improvementTrend >= 0 ? `+${placement.improvementTrend}%` : `${placement.improvementTrend}%`}
              </span>
            ) : (
              '—'
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Recent delta</div>
        </div>
      </div>

      {!hasData ? (
        <div className="py-8 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            No aptitude test sessions completed yet
          </p>
          <p className="text-xs text-slate-500">
            Take timed assessments in Quantitative, Logical Reasoning, and Verbal Ability to generate company-specific placement readiness benchmarks.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Recent Performance Timeline */}
          {placement.recentPerformanceTrend.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recent Test Sessions & Score Timeline
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {placement.recentPerformanceTrend.map((pt) => (
                  <div
                    key={pt.id}
                    className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                        {pt.title}
                      </span>
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {pt.score}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${pt.score}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>{pt.displayDate}</span>
                      <span>{pt.correctAnswers}/{pt.totalQuestions} correct</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Performance Breakdown */}
          {categories.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Performance by Aptitude Category
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {categories.map(([catName, data]) => (
                  <div
                    key={catName}
                    className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {catName}
                      </span>
                      <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 font-mono">
                        {data.avgScore}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${data.avgScore}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>{data.attempts} test{data.attempts > 1 ? 's' : ''}</span>
                      <span>{data.accuracy}% accuracy</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
