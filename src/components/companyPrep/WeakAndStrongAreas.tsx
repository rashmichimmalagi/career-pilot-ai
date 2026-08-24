import React, { useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Inbox,
  Clock,
  ExternalLink,
  X,
  FileCheck,
  Award,
} from 'lucide-react';
import { StrongAreaItem, ImprovingAreaItem } from '../../types/companyPrep';

interface WeakAndStrongAreasProps {
  strongAreas: StrongAreaItem[];
  improvingAreas?: ImprovingAreaItem[];
  hasSufficientData?: boolean;
  onNavigateToModule: (route: string, params?: any) => void;
}

export const WeakAndStrongAreas: React.FC<WeakAndStrongAreasProps> = ({
  strongAreas,
  improvingAreas = [],
  hasSufficientData = true,
  onNavigateToModule,
}) => {
  const [selectedStrongArea, setSelectedStrongArea] = useState<StrongAreaItem | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 1. Strong Areas (Validated Skill Strengths) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                Strong Areas
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Competencies where your performance meets or exceeds company requirements.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            {strongAreas.length} {strongAreas.length === 1 ? 'Area' : 'Areas'}
          </span>
        </div>

        {strongAreas.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-1.5">
            <Clock className="w-7 h-7 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {hasSufficientData
                ? 'No strong benchmarks validated yet'
                : 'Complete more preparation activities to generate personalized skill gap recommendations.'}
            </p>
            {hasSufficientData && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Achieve 75%+ score in assessments, coding tests, or interviews to record strong areas.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {strongAreas.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedStrongArea(item)}
                className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 transition-all cursor-pointer space-y-2 group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedStrongArea(item);
                  }
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                      {item.title}
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                    {item.scoreText}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal pl-5">
                  {item.description}
                </p>

                <div className="flex items-center justify-between pl-5 pt-1 text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">
                    {item.category}
                  </span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 group-hover:underline">
                    <span>View Evidence & Module</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Improving Areas */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                Improving Areas
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Active competencies currently in progress that can reach target benchmarks.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
            {improvingAreas.length} {improvingAreas.length === 1 ? 'Area' : 'Areas'}
          </span>
        </div>

        {improvingAreas.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-1.5">
            <Clock className="w-7 h-7 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {hasSufficientData
                ? 'No intermediate areas currently recorded'
                : 'Complete more preparation activities to generate personalized skill gap recommendations.'}
            </p>
            {hasSufficientData && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Continue regular practice sessions across modules to track ongoing progress.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {improvingAreas.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/20 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                    {item.scoreText}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal pl-5">
                  {item.description}
                </p>

                {item.actionRoute && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => onNavigateToModule(item.actionRoute!, item.actionParams)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{item.actionText || 'Practice Now'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validated Strength Evidence Detail Modal */}
      {selectedStrongArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      Validated Strength
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {selectedStrongArea.scoreText}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {selectedStrongArea.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedStrongArea(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedStrongArea.description}
            </p>

            {/* Evidence Breakdown */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Why CareerPilot Validated This Strength</span>
              </h4>
              
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                {selectedStrongArea.evidence && selectedStrongArea.evidence.length > 0 ? (
                  selectedStrongArea.evidence.map((evPoint, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{evPoint}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Real-time benchmark score exceeds 75% accuracy threshold for target hiring bar.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer / Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedStrongArea(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
              
              {selectedStrongArea.actionRoute && (
                <button
                  onClick={() => {
                    const route = selectedStrongArea.actionRoute!;
                    const params = selectedStrongArea.actionParams;
                    setSelectedStrongArea(null);
                    onNavigateToModule(route, params);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <span>{selectedStrongArea.actionText || `Open in ${selectedStrongArea.moduleName || 'Module'}`}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
