import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { CareerRoadmapAnalysis } from '../../types/roadmap';

interface RoadmapStrengthsAndGapsProps {
  analysis: CareerRoadmapAnalysis;
  onNavigateToModule: (route: string, params?: Record<string, any>) => void;
}

export const RoadmapStrengthsAndGaps: React.FC<RoadmapStrengthsAndGapsProps> = ({
  analysis,
  onNavigateToModule,
}) => {
  const { strengths, weaknesses } = analysis;

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'Critical':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
      case 'Moderate':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
      case 'Minor':
      default:
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20';
    }
  };

  const getRouteForCategory = (category: string) => {
    switch (category) {
      case 'Coding':
        return 'coding';
      case 'Aptitude':
      case 'Technical MCQs':
        return 'placement';
      case 'Interview':
        return 'interview';
      case 'Resume':
        return 'resume-analyzer';
      default:
        return 'coding';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Priority Gaps & Action Items */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                Priority Performance Gaps
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                High-impact areas that directly affect screening and interview cutoffs.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
            {weaknesses.length} {weaknesses.length === 1 ? 'Gap' : 'Gaps'}
          </span>
        </div>

        {weaknesses.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No Critical Gaps Detected</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Your benchmark across all 5 areas is solid.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {weaknesses.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-500/20 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getUrgencyBadge(item.urgency)}`}>
                    {item.urgency}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.description}
                </p>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigateToModule(getRouteForCategory(item.category))}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Address Gap</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validated Strengths */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                Validated Skill Strengths
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Verified through your actual tests and practice history.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            {strengths.length} {strengths.length === 1 ? 'Strength' : 'Strengths'}
          </span>
        </div>

        {strengths.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
            <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Building Validated Strengths</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Complete more tests and coding problems to log verified strengths.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {strengths.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onNavigateToModule(getRouteForCategory(item.category))}
                className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 transition-all cursor-pointer space-y-2 group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onNavigateToModule(getRouteForCategory(item.category));
                  }
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                      {item.title}
                    </h4>
                  </div>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {item.score}%
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.description}
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">
                    Verified through activity records
                  </span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 group-hover:underline">
                    <span>View Module Evidence</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
