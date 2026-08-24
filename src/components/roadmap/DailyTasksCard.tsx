import React from 'react';
import {
  CheckSquare,
  Square,
  Clock,
  ArrowRight,
  Flame,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { DailyRoadmapTask } from '../../types/roadmap';

interface DailyTasksCardProps {
  tasks: DailyRoadmapTask[];
  onToggleTask: (taskId: string) => void;
  onNavigateToModule: (route: string, params?: Record<string, any>) => void;
}

export const DailyTasksCard: React.FC<DailyTasksCardProps> = ({
  tasks,
  onToggleTask,
  onNavigateToModule,
}) => {
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Today’s Personalized Action Plan
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                Daily Focus
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bite-sized preparation milestones to maintain placement momentum today.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {completedCount} of {totalCount} completed
          </span>
          <div className="w-20 sm:w-28 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                allCompleted ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const isEvidence = !!task.isEvidenceBased;
          const currentCount = task.currentCount ?? (task.completed ? 1 : 0);
          const requiredCount = task.requiredCount ?? 1;
          const unitLabel = task.unitLabel || 'Tasks';
          const progressPct = task.progressPercentage ?? (task.completed ? 100 : 0);

          return (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                task.completed
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-500/30'
              }`}
            >
              <div className="flex items-start gap-3">
                {isEvidence ? (
                  <div
                    className="mt-0.5 shrink-0"
                    title={task.completed ? 'Verified via Activity' : 'Requires Real Activity Completion'}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                    ) : (
                      <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center" />
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shrink-0"
                  >
                    {task.completed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </button>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      {task.category}
                    </span>
                    <h4 className={`text-xs sm:text-sm font-bold ${task.completed ? 'text-slate-800 dark:text-slate-200' : 'text-slate-900 dark:text-slate-100'}`}>
                      {task.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {task.description}
                  </p>

                  {/* Progress info for evidence-based tasks */}
                  {isEvidence && (
                    <div className="flex items-center gap-2.5 pt-0.5">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {currentCount} / {requiredCount} {unitLabel}
                      </span>
                      <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            task.completed ? 'bg-emerald-500' : 'bg-indigo-600 dark:bg-indigo-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {task.completed ? '✓ Done' : task.estimatedMinutes + 'm'}
                      </span>
                    </div>
                  )}

                  {!isEvidence && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{task.estimatedMinutes} mins</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => onNavigateToModule(task.actionRoute, task.actionParams)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer ${
                    task.completed
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  <span>
                    {task.category === 'Resume' || task.actionRoute === 'resume-analyzer'
                      ? (task.completed ? 'View Analysis' : 'Analyze Resume')
                      : (task.completed ? 'Practice Again' : 'Practice Now')}
                  </span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
