import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Code2,
  Brain,
  Cpu,
  FileText,
  Building2,
  Map,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { TodayRecommendation } from '../../types/preparationDashboard';

interface TodayPreparationSectionProps {
  recommendations: TodayRecommendation[];
  onNavigate: (page: string) => void;
}

export const TodayPreparationSection: React.FC<TodayPreparationSectionProps> = ({
  recommendations,
  onNavigate,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code2':
        return <Code2 className="w-5 h-5 text-emerald-500" />;
      case 'Brain':
        return <Brain className="w-5 h-5 text-purple-500" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-cyan-500" />;
      case 'FileText':
        return <FileText className="w-5 h-5 text-indigo-500" />;
      case 'Building2':
        return <Building2 className="w-5 h-5 text-amber-500" />;
      case 'Map':
        return <Map className="w-5 h-5 text-blue-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            Recommended
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Next Milestone
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Today's Preparation Focus</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Targeted daily action items generated from your weak topics and preparation milestones
          </p>
        </div>

        {recommendations.length > 0 && (
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            {recommendations.length} Recommended Actions
          </span>
        )}
      </div>

      {recommendations.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No Pending Action Items
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Complete an activity in Coding Arena, Aptitude Practice, or Mock Interviews to receive personalized recommendations.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => onNavigate('coding')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              Start Coding Practice
            </button>
            <button
              onClick={() => onNavigate('placement')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Practice Aptitude
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                      {getIcon(rec.iconName)}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {rec.category}
                    </span>
                  </div>
                  {getPriorityBadge(rec.priority)}
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                    {rec.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {rec.description}
                  </p>
                </div>

                {rec.reason && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <span>{rec.reason}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => onNavigate(rec.route)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <span>{rec.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
