import React from 'react';
import {
  TrendingDown,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  Award,
  Sparkles,
  Code2,
  Brain,
  Cpu,
  FileText,
  Target,
} from 'lucide-react';
import { TopicInsightItem } from '../../types/preparationDashboard';

interface PerformanceInsightsSectionProps {
  weakAreas: TopicInsightItem[];
  strongAreas: TopicInsightItem[];
  onNavigate: (page: string) => void;
}

export const PerformanceInsightsSection: React.FC<PerformanceInsightsSectionProps> = ({
  weakAreas,
  strongAreas,
  onNavigate,
}) => {
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'DSA':
        return <Code2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Aptitude':
        return <Brain className="w-3.5 h-3.5 text-purple-500" />;
      case 'Interview':
        return <Cpu className="w-3.5 h-3.5 text-cyan-500" />;
      case 'Resume':
        return <FileText className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <Target className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* ================= 1. WEAK AREAS ================= */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Weak Areas
                </h3>
                <p className="text-xs text-slate-500">
                  Topics with lower accuracy or identified improvement gaps
                </p>
              </div>
            </div>

            {weakAreas.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                {weakAreas.length} Topics
              </span>
            )}
          </div>

          {weakAreas.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
              <TrendingDown className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500" />
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                Complete more practice to identify your weak areas.
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                We analyze your coding submissions, aptitude tests, and mock interview answers.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('coding')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Start Practice
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {weakAreas.slice(0, 5).map((item, idx) => (
                <div
                  key={`weak-${idx}-${item.topic}`}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-rose-500/30 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">
                        {item.topic}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {item.category} • {item.totalAttempts} attempts
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        {item.score}% Acc
                      </span>
                    </div>

                    <button
                      onClick={() => onNavigate(item.actionRoute)}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/30 transition-colors cursor-pointer"
                      title={item.actionLabel}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= 2. STRONG AREAS ================= */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50">
                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Your Strong Areas
                </h3>
                <p className="text-xs text-slate-500">
                  Subjects and topics where you consistently perform at benchmark
                </p>
              </div>
            </div>

            {strongAreas.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                {strongAreas.length} Strengths
              </span>
            )}
          </div>

          {strongAreas.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
              <TrendingUp className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500" />
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                Complete more practice to reveal your strong areas.
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Topics with ≥75% accuracy and high evaluation scores will appear here.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('placement')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Practice Aptitude & MCQs
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {strongAreas.slice(0, 5).map((item, idx) => (
                <div
                  key={`strong-${idx}-${item.topic}`}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">
                        {item.topic}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {item.category} • {item.totalAttempts} attempts
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {item.score}% Score
                      </span>
                    </div>

                    <button
                      onClick={() => onNavigate(item.actionRoute)}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/30 transition-colors cursor-pointer"
                      title={item.actionLabel}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
