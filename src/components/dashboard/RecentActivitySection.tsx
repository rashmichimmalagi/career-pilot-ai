import React from 'react';
import {
  History,
  Code2,
  Brain,
  Cpu,
  Users2,
  Building2,
  FileText,
  Map,
  Bot,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { RecentActivityItem } from '../../types/preparationDashboard';

interface RecentActivitySectionProps {
  activities: RecentActivityItem[];
  onNavigate: (page: string) => void;
}

export const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({
  activities,
  onNavigate,
}) => {
  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Recently';

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 2) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'coding':
        return <Code2 className="w-4 h-4 text-emerald-500" />;
      case 'aptitude':
        return <Brain className="w-4 h-4 text-purple-500" />;
      case 'interview':
        return <Cpu className="w-4 h-4 text-cyan-500" />;
      case 'hr-interview':
        return <Users2 className="w-4 h-4 text-pink-500" />;
      case 'company-prep':
        return <Building2 className="w-4 h-4 text-amber-500" />;
      case 'resume':
        return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'roadmap':
        return <Map className="w-4 h-4 text-blue-500" />;
      case 'mentor':
        return <Bot className="w-4 h-4 text-indigo-400" />;
      default:
        return <History className="w-4 h-4 text-slate-500" />;
    }
  };

  const getBadgeStyle = (badge?: { text: string; type: string }) => {
    if (!badge) return null;
    switch (badge.type) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
      case 'danger':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
      case 'info':
      default:
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20';
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
            <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Recent Activity Timeline
            </h3>
            <p className="text-xs text-slate-500">
              Chronological log of your real practice submissions and evaluations
            </p>
          </div>
        </div>

        {activities.length > 0 && (
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing {activities.length} recent events
          </span>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              No activity yet
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start your first preparation activity to track your progress and build your timeline.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => onNavigate('resume-analyzer')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Analyze Resume
            </button>
            <button
              onClick={() => onNavigate('coding')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            >
              Start Coding
            </button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {activities.map((act) => (
            <div
              key={act.id}
              onClick={() => onNavigate(act.route)}
              className="group py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 px-3 rounded-xl transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform shrink-0">
                  {getActivityIcon(act.type)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {act.title}
                    </span>
                    {act.statusBadge && (
                      <span
                        className={`px-2 py-0.2 rounded-md text-[10px] font-bold border ${getBadgeStyle(
                          act.statusBadge
                        )}`}
                      >
                        {act.statusBadge.text}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {act.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">
                    {formatTimeAgo(act.timestamp)}
                  </span>
                  {act.scoreLabel && (
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {act.scoreLabel}
                    </span>
                  )}
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
