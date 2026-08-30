import React from 'react';
import { Map, ArrowRight, CheckCircle2, Circle, Clock } from 'lucide-react';
import { RoadmapProgressAnalytics } from '../../types/intelligence';

interface RoadmapAnalyticsSectionProps {
  roadmap: RoadmapProgressAnalytics;
  onNavigate: (route: string) => void;
}

export const RoadmapAnalyticsSection: React.FC<RoadmapAnalyticsSectionProps> = ({
  roadmap,
  onNavigate,
}) => {
  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Map className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Career Roadmap & Milestone Progress
            </h3>
            <p className="text-xs text-slate-500">
              Structured milestone tracking, phase completion, and daily skill acquisition.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('roadmap')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer transition-colors self-start sm:self-auto"
        >
          <span>Open Full Roadmap</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Roadmap Completion</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {roadmap.completionPercentage}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Overall progress</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Completed Milestones</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {roadmap.completedTasks}{' '}
            <span className="text-sm font-semibold text-slate-400">/ {roadmap.totalTasks}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{roadmap.remainingTasks} remaining</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Current Phase</div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2 truncate">
            {roadmap.activePhaseTitle}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active curriculum level</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Skills Acquired</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {roadmap.completedSkillsCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{roadmap.remainingSkillsCount} in queue</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-600 dark:text-slate-400">Curriculum Completion Progress</span>
          <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">
            {roadmap.completedTasks} / {roadmap.totalTasks} Tasks ({roadmap.completionPercentage}%)
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${roadmap.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Milestone Skill List */}
      {roadmap.skillsList.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Roadmap Milestones & Skill Progression
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {roadmap.skillsList.map((skill, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  skill.isCompleted
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-100'
                    : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {skill.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="text-xs font-medium truncate">{skill.name}</span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider shrink-0 px-2 py-0.5 rounded-md ${
                    skill.isCompleted
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {skill.isCompleted ? 'Done' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
