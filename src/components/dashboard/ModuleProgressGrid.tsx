import React from 'react';
import {
  FileText,
  Code2,
  Brain,
  Cpu,
  Users2,
  Building2,
  Map,
  Bot,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { ModuleProgressItem } from '../../types/preparationDashboard';

interface ModuleProgressGridProps {
  modules: ModuleProgressItem[];
  onNavigate: (page: string) => void;
}

export const ModuleProgressGrid: React.FC<ModuleProgressGridProps> = ({
  modules,
  onNavigate,
}) => {
  const getModuleIcon = (category: string) => {
    switch (category) {
      case 'resume':
        return <FileText className="w-5 h-5 text-indigo-500" />;
      case 'coding':
        return <Code2 className="w-5 h-5 text-emerald-500" />;
      case 'aptitude':
        return <Brain className="w-5 h-5 text-purple-500" />;
      case 'technical-interview':
        return <Cpu className="w-5 h-5 text-cyan-500" />;
      case 'hr-interview':
        return <Users2 className="w-5 h-5 text-pink-500" />;
      case 'company-prep':
        return <Building2 className="w-5 h-5 text-amber-500" />;
      case 'roadmap':
        return <Map className="w-5 h-5 text-blue-500" />;
      case 'mentor':
        return <Bot className="w-5 h-5 text-indigo-400" />;
      default:
        return <Layers className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusBadge = (item: ModuleProgressItem) => {
    if (!item.hasData) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>Not enough data</span>
        </span>
      );
    }

    if (item.score !== undefined) {
      const isHigh = item.score >= 70;
      const isMid = item.score >= 50;

      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
            isHigh
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
              : isMid
              ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20'
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>{item.score}% Score</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
        <CheckCircle2 className="w-3 h-3" />
        <span>Active</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Module-Wise Preparation Progress</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real performance tracking and activity status across all 8 CareerPilot modules
          </p>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {modules.filter((m) => m.hasData).length} of {modules.length} Modules Active
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((item) => (
          <div
            key={item.id}
            onClick={() => onNavigate(item.route)}
            className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
          >
            {/* Header: Icon & Status Badge */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 group-hover:scale-105 transition-transform">
                  {getModuleIcon(item.category)}
                </div>
                {getStatusBadge(item)}
              </div>

              {/* Title & Status Summary */}
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5 line-clamp-1">
                  {item.statusText}
                </p>
              </div>

              {/* Progress Bar (if meaningful score/progress is available) */}
              {item.hasData && item.score !== undefined ? (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Mastery Progress</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {item.score}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.score >= 70
                          ? 'bg-emerald-500'
                          : item.score >= 50
                          ? 'bg-indigo-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.max(4, Math.min(100, item.score))}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="pt-1">
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2">
                    {item.detailSummary}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
              <span>{item.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
