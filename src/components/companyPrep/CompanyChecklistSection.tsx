import React, { useState } from 'react';
import {
  ListChecks,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { CompanyChecklistItem } from '../../types/companyPrep';
import { toggleCompanyChecklistItem } from '../../services/companyPrepStorage';

interface CompanyChecklistSectionProps {
  checklist?: CompanyChecklistItem[];
  companyName: string;
  studentId?: string;
  onNavigateToModule: (route: string, params?: any) => void;
  onRefresh?: () => void;
}

export const CompanyChecklistSection: React.FC<CompanyChecklistSectionProps> = ({
  checklist = [],
  companyName,
  studentId = 'guest',
  onNavigateToModule,
  onRefresh,
}) => {
  const [localChecked, setLocalChecked] = useState<Record<string, boolean>>({});

  if (!checklist || checklist.length === 0) return null;

  const handleToggle = (item: CompanyChecklistItem) => {
    // If auto-verified, don't uncheck if verified by real data unless desired, but allow manual toggle
    const currentCompleted = localChecked[item.id] !== undefined ? localChecked[item.id] : item.isCompleted;
    setLocalChecked((prev) => ({ ...prev, [item.id]: !currentCompleted }));
    toggleCompanyChecklistItem(studentId, companyName, item.id);
    if (onRefresh) {
      setTimeout(onRefresh, 100);
    }
  };

  const getIsCompleted = (item: CompanyChecklistItem) => {
    if (localChecked[item.id] !== undefined) {
      return localChecked[item.id];
    }
    return item.isCompleted;
  };

  const completedCount = checklist.filter((item) => getIsCompleted(item)).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <ListChecks className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              {companyName} Preparation Checklist
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track essential milestones. Items with verified benchmarks are automatically checked.
            </p>
          </div>
        </div>

        {/* Progress Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 shrink-0">
          <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
            {completedCount} of {checklist.length} Completed
          </span>
          <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
            ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            progressPercent === 100
              ? 'bg-emerald-500'
              : progressPercent >= 50
              ? 'bg-purple-600'
              : 'bg-indigo-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist Items */}
      <div className="space-y-2.5">
        {checklist.map((item) => {
          const isDone = getIsCompleted(item);

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDone
                  ? 'bg-purple-50/30 dark:bg-purple-950/10 border-purple-500/20'
                  : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggle(item)}
                  className="mt-0.5 text-purple-600 dark:text-purple-400 shrink-0 hover:scale-110 transition-transform focus:outline-none"
                  aria-label={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 fill-purple-600 text-white dark:fill-purple-500 dark:text-slate-900" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-purple-500 transition-colors" />
                  )}
                </button>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        isDone
                          ? 'line-through text-slate-500 dark:text-slate-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {item.title}
                    </span>

                    {item.isAutoVerified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3" /> Auto-Verified
                      </span>
                    )}

                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    {item.description}
                  </p>

                  {item.verifiedEvidence && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ {item.verifiedEvidence}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex items-center justify-end sm:pl-4">
                <button
                  type="button"
                  onClick={() => onNavigateToModule(item.actionRoute, item.actionParams)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all shadow-xs group"
                >
                  <span>{item.actionText}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
