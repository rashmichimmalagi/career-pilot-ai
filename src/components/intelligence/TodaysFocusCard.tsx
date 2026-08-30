import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Code2,
  Brain,
  Cpu,
  FileText,
  Map,
  Target,
  ShieldCheck,
  Info,
  Lock,
} from 'lucide-react';
import { TodaysFocus, TodaysFocusTask } from '../../types/intelligence';
import { toggleFocusTaskCompletion } from '../../services/todaysFocusService';

interface TodaysFocusCardProps {
  todaysFocus: TodaysFocus;
  studentId?: string;
  onNavigate: (route: string) => void;
  onTaskCompletionChange?: () => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  coding: Code2,
  interview: Cpu,
  placement: Brain,
  resume: FileText,
  roadmap: Map,
  study_plan: Calendar,
  company: Target,
  manual: CheckCircle2,
};

export const TodaysFocusCard: React.FC<TodaysFocusCardProps> = ({
  todaysFocus,
  studentId = 'guest',
  onNavigate,
  onTaskCompletionChange,
}) => {
  const [tasks, setTasks] = useState<TodaysFocusTask[]>(() => todaysFocus?.tasks || []);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  React.useEffect(() => {
    if (todaysFocus?.tasks) {
      setTasks(todaysFocus.tasks);
    }
  }, [todaysFocus?.tasks]);

  const handleManualToggle = (task: TodaysFocusTask) => {
    if (task.isVerifiable) {
      // Show brief explanatory tooltip for evidence-based tasks
      setActiveTooltip(task.id);
      setTimeout(() => setActiveTooltip(null), 3000);
      return;
    }

    const updatedCompletedIds = toggleFocusTaskCompletion(studentId, task.id);
    setTasks((prev) =>
      (prev || []).map((t) => ({
        ...t,
        isCompleted: updatedCompletedIds.includes(t.id),
      }))
    );
    if (onTaskCompletionChange) {
      onTaskCompletionChange();
    }
  };

  const safeTasks = tasks || [];
  const completedCount = safeTasks.filter((t) => t.isCompleted).length;
  const totalCount = safeTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div
      id="todays-focus-section"
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm relative overflow-hidden transition-all space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Today's Focus
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              <ShieldCheck className="w-3 h-3 text-indigo-500" />
              Evidence-Based
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Prioritized daily action plan verified automatically from your actual submissions, interview scores, and milestones.
          </p>
        </div>

        {/* Time & Verified Progress Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>~{todaysFocus.totalEstimatedMinutes} mins total</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              completedCount === totalCount && totalCount > 0
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {completedCount}/{totalCount} Completed
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <span>Daily Target Progress</span>
          <span>{progressPercent}% Complete</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Action Items List */}
      <div className="space-y-3">
        {safeTasks.map((task) => {
          const IconComp = CATEGORY_ICONS[task.category] || Target;
          const isDone = task.isCompleted;
          const isVerifiable = task.isVerifiable !== false;

          return (
            <div
              key={task.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all relative ${
                isDone
                  ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/40'
                  : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Left Area: Status Icon & Details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Status Indicator (Evidence-based or Toggleable) */}
                  <div className="relative mt-0.5 shrink-0">
                    {isVerifiable ? (
                      <button
                        type="button"
                        onClick={() => handleManualToggle(task)}
                        title={
                          isDone
                            ? 'Verified Completed via your submitted activity'
                            : 'Evidence-based task: Complete the activity in the module to mark done'
                        }
                        className="group cursor-pointer focus:outline-none"
                      >
                        {isDone ? (
                          <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 fill-emerald-100 dark:fill-emerald-950" />
                          </div>
                        ) : (
                          <div className="p-1 rounded-lg bg-slate-200/80 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-center transition-colors">
                            <IconComp className="w-5 h-5" />
                          </div>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleManualToggle(task)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm sm:text-base font-bold ${
                          isDone
                            ? 'text-slate-900 dark:text-slate-100'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Progress Badge */}
                      {task.progressText && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            isDone
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
                              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40'
                          }`}
                        >
                          {task.progressText}
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {task.estimatedMinutes}m
                      </span>

                      {task.priority === 'high' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                          Priority
                        </span>
                      )}
                    </div>

                    {/* Explicit Evidence Reason */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        Why:
                      </span>{' '}
                      {task.reason}
                    </p>

                    {/* Completion Criteria Hint for Incomplete Items */}
                    {!isDone && task.completionCriteria && (
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-0.5">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Completion requirement: {task.completionCriteria}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action Button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                  <button
                    onClick={() => onNavigate(task.actionRoute)}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isDone
                        ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10'
                    }`}
                  >
                    <span>{isDone ? 'Review Activity' : task.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* In-place Tooltip on Click for Verifiable Tasks */}
              {activeTooltip === task.id && !isDone && (
                <div className="mt-3 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-800 dark:text-indigo-300 flex items-center gap-2 animate-fadeIn">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>
                    This task is verified automatically. Click <strong>"{task.actionText}"</strong> and complete the activity to earn verified completion.
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grounding Summary Note */}
      <div className="pt-2 text-[11px] text-slate-400 dark:text-slate-500 text-center flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>{todaysFocus.dataGroundingSummary}</span>
      </div>
    </div>
  );
};
