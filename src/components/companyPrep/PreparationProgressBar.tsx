import React from 'react';
import {
  FileText,
  Code2,
  Brain,
  BookOpen,
  Cpu,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { CategoryMetric } from '../../types/companyPrep';

interface PreparationProgressBarProps {
  categories: {
    resume: CategoryMetric;
    coding: CategoryMetric;
    aptitude: CategoryMetric;
    technicalMcq: CategoryMetric;
    interview: CategoryMetric;
  };
  onNavigateToModule: (route: string, params?: any) => void;
}

export const PreparationProgressBar: React.FC<PreparationProgressBarProps> = ({
  categories,
  onNavigateToModule,
}) => {
  const categoryList = [
    categories.resume,
    categories.coding,
    categories.aptitude,
    categories.technicalMcq,
    categories.interview,
  ];

  const getCategoryIcon = (key: string) => {
    switch (key) {
      case 'resume':
        return <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'coding':
        return <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'aptitude':
        return <Brain className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'technicalMcq':
        return <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'interview':
      default:
        return <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
  };

  const getProgressColor = (score: number, isAvailable: boolean) => {
    if (!isAvailable) return 'bg-slate-300 dark:bg-slate-700';
    if (score >= 75) return 'bg-emerald-500';
    if (score >= 50) return 'bg-indigo-500';
    if (score >= 25) return 'bg-sky-500';
    return 'bg-amber-500';
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            Preparation Progress Breakdown
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real performance tracking connected directly to your CareerPilot activities.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {categoryList.map((cat) => (
          <div
            key={cat.key}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-colors space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200 dark:border-slate-700">
                  {getCategoryIcon(cat.key)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {cat.title}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      Weight: {Math.round(cat.weight * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {cat.detailSummary}
                  </p>
                </div>
              </div>

              {/* Progress & Action button */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700/60">
                <div className="text-right">
                  {cat.isAvailable ? (
                    <div className="font-mono font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      {cat.score}%
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 italic">
                      Not Started
                    </span>
                  )}
                  <div className="text-[10px] text-slate-400">
                    {cat.statusText}
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToModule(cat.actionRoute)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span>{cat.actionText}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Progress Track */}
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700/70 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(cat.score, cat.isAvailable)}`}
                style={{ width: `${cat.isAvailable ? Math.max(5, cat.score) : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
