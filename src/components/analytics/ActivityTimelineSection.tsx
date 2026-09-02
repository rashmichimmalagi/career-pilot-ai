import React from 'react';
import {
  History,
  Code2,
  Cpu,
  Brain,
  FileText,
  MessageSquare,
  Map,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { CareerActivityItem } from '../../types/intelligence';

interface ActivityTimelineSectionProps {
  activities: CareerActivityItem[];
  onNavigate: (route: string) => void;
}

export const ActivityTimelineSection: React.FC<ActivityTimelineSectionProps> = ({
  activities,
  onNavigate,
}) => {
  const safeActivities = Array.isArray(activities) ? activities : [];

  const getIcon = (type: CareerActivityItem['type']) => {
    switch (type) {
      case 'coding':
        return <Code2 className="w-4 h-4 text-emerald-500" />;
      case 'interview':
        return <Cpu className="w-4 h-4 text-purple-500" />;
      case 'placement':
        return <Brain className="w-4 h-4 text-cyan-500" />;
      case 'resume':
        return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'mentor':
        return <MessageSquare className="w-4 h-4 text-amber-500" />;
      case 'roadmap':
        return <Map className="w-4 h-4 text-blue-500" />;
      default:
        return <History className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <History className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Activity & Preparation Timeline
            </h3>
            <p className="text-xs text-slate-500">
              Chronological log of verified coding solutions, mock rounds, aptitude practice, and resume revisions.
            </p>
          </div>
        </div>

        {safeActivities.length > 0 && (
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            {safeActivities.length} Logged Events
          </span>
        )}
      </div>

      {safeActivities.length === 0 ? (
        <div className="py-10 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
          <Clock className="w-6 h-6 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No activity recorded yet
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your recent practice submissions, mock interview reports, and resume audits will appear here in chronological order.
          </p>
        </div>
      ) : (
        <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 sm:ml-4 space-y-6">
          {safeActivities.slice(0, 15).map((item) => (
            <div key={item.id} className="relative pl-6 sm:pl-8 group">
              {/* Timeline marker */}
              <div className="absolute -left-2.5 sm:-left-3 top-1 w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 flex items-center justify-center shadow-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              </div>

              {/* Activity Card */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="p-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                      {getIcon(item.type)}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h4>
                    {item.statusBadge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {item.statusBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.description}
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {item.displayDate}
                  </div>
                </div>

                {item.actionRoute && (
                  <button
                    onClick={() => onNavigate(item.actionRoute!)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline shrink-0 self-start sm:self-center cursor-pointer"
                  >
                    <span>{item.actionText || 'View'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
