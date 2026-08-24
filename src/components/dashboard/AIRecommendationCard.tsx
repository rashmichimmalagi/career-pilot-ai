import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Target,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import { AIRecommendationRule } from '../../types/preparationDashboard';

interface AIRecommendationCardProps {
  recommendation: AIRecommendationRule;
  onNavigate: (page: string) => void;
}

export const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({
  recommendation,
  onNavigate,
}) => {
  const { title, priority, message, targetMetric, actionRoute, actionLabel, bulletPoints } =
    recommendation;

  const getPriorityTheme = () => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return {
          border: 'border-indigo-500/30 dark:border-indigo-500/40',
          badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
          badgeText: 'Highest Priority Action',
          glow: 'from-indigo-500/10 via-purple-500/5 to-cyan-500/5',
        };
      case 'medium':
        return {
          border: 'border-amber-500/30 dark:border-amber-500/40',
          badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
          badgeText: 'Targeted Focus',
          glow: 'from-amber-500/10 via-orange-500/5 to-yellow-500/5',
        };
      case 'info':
      default:
        return {
          border: 'border-emerald-500/30 dark:border-emerald-500/40',
          badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          badgeText: 'Optimization Phase',
          glow: 'from-emerald-500/10 via-teal-500/5 to-cyan-500/5',
        };
    }
  };

  const theme = getPriorityTheme();

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border ${theme.border} shadow-sm dark:shadow-xl p-6 sm:p-8 transition-all`}
    >
      {/* Glow Effect */}
      <div
        className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl ${theme.glow} blur-3xl opacity-70 pointer-events-none`}
      />

      <div className="relative z-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                  Recommended Next Step
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  AI Personalized
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Personalized preparation next step based on your profile & sub-system performance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {targetMetric && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Target: {targetMetric}
              </span>
            )}
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${theme.badge}`}>
              {theme.badgeText}
            </span>
          </div>
        </div>

        {/* Core Message & Action Plan */}
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            {message}
          </p>

          {/* Actionable Bullet Points */}
          {bulletPoints && bulletPoints.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {bulletPoints.map((bp, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{bp}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom CTA Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Updates automatically in real time as you complete practice sessions</span>
          </div>

          <button
            onClick={() => onNavigate(actionRoute)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all cursor-pointer"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
