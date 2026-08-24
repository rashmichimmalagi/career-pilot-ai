import React from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Layers,
  Code2,
  Brain,
  BookOpen,
  Mic,
  FileText,
} from 'lucide-react';
import { RoadmapItem, RoadmapPhase } from '../../types/roadmap';

interface RoadmapPhasesViewProps {
  phases: RoadmapPhase[];
  onToggleItem: (itemId: string) => void;
  onNavigateToModule: (route: string, params?: Record<string, any>) => void;
}

export const RoadmapPhasesView: React.FC<RoadmapPhasesViewProps> = ({
  phases,
  onToggleItem,
  onNavigateToModule,
}) => {
  const getCategoryIcon = (area: string) => {
    switch (area) {
      case 'Coding':
        return <Code2 className="w-3.5 h-3.5 text-indigo-500" />;
      case 'Aptitude':
        return <Brain className="w-3.5 h-3.5 text-amber-500" />;
      case 'Technical MCQs':
        return <BookOpen className="w-3.5 h-3.5 text-blue-500" />;
      case 'Interview':
        return <Mic className="w-3.5 h-3.5 text-purple-500" />;
      case 'Resume':
        return <FileText className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High Priority':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
      case 'Medium Priority':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
      case 'Strong':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
      case 'Recommended':
      default:
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Phased Career Roadmap</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Structured roadmap moving from foundational screening to peak placement readiness.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {phases.map((phase) => {
          const completedCount = phase.items.filter((i) => i.isCompleted).length;
          const totalCount = phase.items.length;
          const isPhaseCompleted = totalCount > 0 && completedCount === totalCount;

          return (
            <div
              key={phase.phaseNumber}
              className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"
            >
              {/* Phase Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm ${
                      isPhaseCompleted
                        ? 'bg-emerald-600 text-white'
                        : phase.status === 'current'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isPhaseCompleted ? <CheckCircle2 className="w-5 h-5" /> : phase.phaseNumber}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Phase {phase.phaseNumber}
                      </span>
                      {phase.status === 'current' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                          Active Focus
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                      {phase.title}
                    </h3>
                  </div>
                </div>

                {/* Completion Metric */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {completedCount} of {totalCount} Completed
                    </span>
                    <div className="w-28 sm:w-36 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1">
                      <div
                        className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase Subtitle */}
              <p className="text-xs text-slate-600 dark:text-slate-400 -mt-2">
                {phase.subtitle}
              </p>

              {/* Items List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {phase.items.map((item) => {
                  const isChecked = !!item.isCompleted;
                  const isEvidence = !!item.isEvidenceBased;
                  const progressPct = item.progressPercentage ?? (isChecked ? 100 : 0);
                  const currentCount = item.currentCount ?? (isChecked ? 1 : 0);
                  const requiredCount = item.requiredCount ?? 1;
                  const unitLabel = item.unitLabel || 'Tasks';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 ${
                        isChecked
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-500/30'
                      }`}
                    >
                      <div className="space-y-2.5">
                        {/* Top Meta */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {isEvidence ? (
                              <div
                                className="flex items-center justify-center shrink-0"
                                title={isChecked ? 'Verified via Activity' : 'Requires Real Activity Verification'}
                              >
                                {isChecked ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center" />
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onToggleItem(item.id)}
                                className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shrink-0"
                                title={isChecked ? 'Mark Incomplete' : 'Mark Complete'}
                              >
                                {isChecked ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                                ) : (
                                  <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                                )}
                              </button>
                            )}

                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                              {getCategoryIcon(item.area)}
                              <span>{item.area}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(item.priority)}`}>
                              {item.priority}
                            </span>
                          </div>
                        </div>

                        {/* Title & Topic */}
                        <div>
                          <h4 className={`text-xs sm:text-sm font-bold ${isChecked ? 'text-slate-800 dark:text-slate-200' : 'text-slate-900 dark:text-slate-100'}`}>
                            {item.topic}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.recommendedAction}
                          </p>
                        </div>

                        {/* Evidence-Based Progress Bar & Status */}
                        {isEvidence && (
                          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="text-slate-700 dark:text-slate-300">
                                {currentCount} / {requiredCount} {unitLabel} Completed
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                                  isChecked
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                    : currentCount > 0
                                    ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}
                              >
                                {isChecked ? 'Status: Completed ✓' : currentCount > 0 ? 'Status: In Progress' : 'Status: Not Started'}
                              </span>
                            </div>

                            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isChecked ? 'bg-emerald-500' : 'bg-indigo-600 dark:bg-indigo-500'
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Row */}
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                          {item.area === 'Resume' || item.navigationTarget?.route === 'resume-analyzer' ? (
                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                              {isChecked ? '✓ Analysis up to date' : 'Upload & Analyze Resume'}
                            </span>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>~{item.estimatedHours}h estimated</span>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onNavigateToModule(item.navigationTarget.route, item.navigationTarget.params)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : item.priority === 'High Priority'
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : item.priority === 'Medium Priority'
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          <span>
                            {item.area === 'Resume' || item.navigationTarget?.route === 'resume-analyzer'
                              ? (isChecked ? 'View Analysis' : 'Analyze Resume')
                              : (isChecked ? 'Practice Again' : 'Practice')}
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
        })}
      </div>
    </div>
  );
};
