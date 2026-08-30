import React from 'react';
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { AdaptiveLearningInsights } from '../../types/intelligence';

interface AdaptiveInsightsWidgetProps {
  insights: AdaptiveLearningInsights;
  onNavigate: (route: string) => void;
}

export const AdaptiveInsightsWidget: React.FC<AdaptiveInsightsWidgetProps> = ({
  insights,
  onNavigate,
}) => {
  const weakTopics = insights?.weakTopics || [];
  const strongTopics = insights?.strongTopics || [];
  const neglectedAreas = insights?.neglectedAreas || [];
  const repeatedMistakes = insights?.repeatedMistakes || [];
  const adaptiveRecommendations = insights?.adaptiveRecommendations || [];

  const hasInsights =
    weakTopics.length > 0 ||
    strongTopics.length > 0 ||
    neglectedAreas.length > 0 ||
    repeatedMistakes.length > 0;

  return (
    <div
      id="adaptive-learning-widget"
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Brain className="w-5 h-5" />
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Adaptive Learning Insights
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dynamic detection of skill strengths, authentic test case failure patterns, and spaced revision needs.
          </p>
        </div>
      </div>

      {!hasInsights ? (
        <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500">
          Complete at least 2 coding submissions or assessments to unlock adaptive learning patterns.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Weak Topics & Repeated Mistakes */}
          <div className="p-5 rounded-2xl bg-rose-50/30 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-800 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Skill Gaps & Repeated Mistakes</span>
            </div>

            <div className="space-y-2.5">
              {weakTopics.map((w, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/60 dark:border-rose-900/40 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                    <span>{w.topic}</span>
                    <span className="text-rose-600 font-mono text-[11px]">
                      {w.accuracyRate !== undefined ? `${w.accuracyRate}% Acc` : 'Needs Practice'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">{w.evidence}</p>
                </div>
              ))}

              {repeatedMistakes.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                    <span className="text-amber-700 dark:text-amber-400">{m.title}</span>
                    <span className="text-xs font-semibold text-slate-400">
                      {m.occurrencesCount}x
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {m.actionableSuggestion}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Strong Topics & Neglected Areas */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Demonstrated Proficiencies</span>
            </div>

            <div className="space-y-2.5">
              {strongTopics.map((s, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                    <span>{s.topic}</span>
                    <span className="text-emerald-600 font-mono text-[11px]">
                      {s.accuracyRate}% Acc
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">{s.evidence}</p>
                </div>
              ))}

              {neglectedAreas.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    Spaced Revision Alerts
                  </div>
                  {neglectedAreas.slice(0, 2).map((n, i) => (
                    <div key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between py-1">
                      <span>{n.area}</span>
                      <span className="font-semibold text-slate-400">{n.lastPracticedDaysAgo}d ago</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
