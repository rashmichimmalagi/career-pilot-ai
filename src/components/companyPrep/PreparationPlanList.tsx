import React from 'react';
import {
  ListOrdered,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Inbox,
  CheckCircle2,
  Clock,
  Flame,
} from 'lucide-react';
import { PreparationPriorityItem, PriorityLevel, GapLifecycleStatus } from '../../types/companyPrep';

interface PreparationPlanListProps {
  priorities: PreparationPriorityItem[];
  hasSufficientData?: boolean;
  onNavigateToModule: (route: string, params?: any) => void;
}

export const PreparationPlanList: React.FC<PreparationPlanListProps> = ({
  priorities,
  hasSufficientData = true,
  onNavigateToModule,
}) => {
  const getPriorityBadgeStyle = (priority: PriorityLevel) => {
    switch (priority) {
      case 'high':
        return {
          bg: 'bg-rose-500/10 dark:bg-rose-500/20',
          text: 'text-rose-700 dark:text-rose-300',
          border: 'border-rose-500/30',
          indicator: '🔴 High Priority',
        };
      case 'medium':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/20',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-500/30',
          indicator: '🟠 Medium Priority',
        };
      case 'recommended':
        return {
          bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
          text: 'text-indigo-700 dark:text-indigo-300',
          border: 'border-indigo-500/30',
          indicator: '🟡 Recommended',
        };
      case 'strong':
      default:
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-500/30',
          indicator: '🟢 Strong Area',
        };
    }
  };

  const getStatusBadgeStyle = (status?: GapLifecycleStatus) => {
    switch (status) {
      case 'RESOLVED':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-500/30',
          label: 'Resolved',
        };
      case 'IMPROVING':
        return {
          bg: 'bg-blue-500/10 dark:bg-blue-500/20',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-500/30',
          label: 'Improving',
        };
      case 'IN PROGRESS':
        return {
          bg: 'bg-purple-500/10 dark:bg-purple-500/20',
          text: 'text-purple-700 dark:text-purple-300',
          border: 'border-purple-500/30',
          label: 'In Progress',
        };
      case 'OPEN':
      default:
        return {
          bg: 'bg-slate-500/10 dark:bg-slate-500/20',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-500/30',
          label: 'Open Gap',
        };
    }
  };

  const showEmptyState = !hasSufficientData || priorities.length === 0;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Preparation Priorities</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Targeted skill gaps derived by comparing your real CareerPilot metrics against role requirements.
          </p>
        </div>
      </div>

      {showEmptyState ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-md mx-auto">
            Complete more preparation activities to generate personalized skill gap recommendations.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => onNavigateToModule('coding')}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              Solve Coding Problem
            </button>
            <button
              onClick={() => onNavigateToModule('placement')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              Practice Placement MCQs
            </button>
            <button
              onClick={() => onNavigateToModule('resume-analyzer')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              Analyze Resume
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {priorities.map((item) => {
            const style = getPriorityBadgeStyle(item.priority);
            const statusStyle = getStatusBadgeStyle(item.status);
            return (
              <div
                key={item.id}
                className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-3 max-w-2xl">
                  {/* Top Bar: Area + Priority Badge + Status Badge + Current Performance */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      {item.area || item.title}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${style.bg} ${style.text} ${style.border}`}>
                      <span>{style.indicator}</span>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                      <span>Status: {statusStyle.label}</span>
                    </span>
                    <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Current: {item.currentPerformance || (item.currentScore !== undefined ? `${item.currentScore}%` : 'Not Started')}
                    </span>
                  </div>

                  {/* Reason Block */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Reason:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {item.reason}
                    </p>
                  </div>

                  {/* Recommended Action Block */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Recommended Action:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {item.recommendedAction || item.description}
                    </p>
                  </div>
                </div>

                {/* Address Gap Button */}
                <div className="shrink-0 flex items-center justify-end pt-2 md:pt-0">
                  <button
                    onClick={() => onNavigateToModule(item.actionRoute, item.actionParams)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>{item.actionText || 'Address Gap →'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
