import React from 'react';
import {
  BarChart3,
  Sparkles,
  FileText,
  Building2,
  Cpu,
  Target,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { MentorQuickAction } from '../../types/mentor';
import { MENTOR_QUICK_ACTIONS } from '../../services/mentorService';

interface MentorQuickActionsProps {
  onSelectAction: (action: MentorQuickAction) => void;
  isLoading?: boolean;
}

export const MentorQuickActions: React.FC<MentorQuickActionsProps> = ({
  onSelectAction,
  isLoading,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'BarChart3':
        return <BarChart3 className="w-4 h-4 text-indigo-500" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'FileText':
        return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'Building2':
        return <Building2 className="w-4 h-4 text-sky-500" />;
      case 'Cpu':
        return <Cpu className="w-4 h-4 text-purple-500" />;
      case 'Target':
        return <Target className="w-4 h-4 text-rose-500" />;
      case 'Calendar':
        return <Calendar className="w-4 h-4 text-cyan-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Instant Strategic Queries
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          Powered by your real profile
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {MENTOR_QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            id={`mentor-quick-action-${action.id}`}
            disabled={isLoading}
            onClick={() => onSelectAction(action)}
            className="text-left p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 shadow-xs hover:shadow-md dark:hover:shadow-indigo-950/30 transition-all duration-200 group cursor-pointer disabled:opacity-50 flex flex-col justify-between gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 transition-colors">
                  {getIcon(action.icon)}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {action.title}
                </span>
              </div>
              {action.badge && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors shrink-0">
                  {action.badge}
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {action.description}
            </p>

            <div className="flex items-center justify-end text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Ask Mentor</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
