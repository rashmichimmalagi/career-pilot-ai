import React from 'react';
import { Award, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { ProvenStrengthItem, ImprovementAreaItem } from '../../types/intelligence';

interface StrengthsWeaknessesSectionProps {
  provenStrengths: ProvenStrengthItem[];
  areasToImprove: ImprovementAreaItem[];
  onNavigate: (route: string) => void;
}

export const StrengthsWeaknessesSection: React.FC<StrengthsWeaknessesSectionProps> = ({
  provenStrengths,
  areasToImprove,
  onNavigate,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Proven Strengths */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Proven Strengths
            </h3>
            <p className="text-xs text-slate-500">
              Verified proficiencies backed by authentic accuracy metrics and test milestones.
            </p>
          </div>
        </div>

        {provenStrengths.length === 0 ? (
          <div className="py-10 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
            <Award className="w-6 h-6 text-slate-400 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Complete more practice to identify your proven strengths
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Strengths are formally unlocked when you achieve &ge;80% accuracy in coding topics, aptitude tests, technical interviews, or ATS resume alignment.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {provenStrengths.map((st, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {st.title}
                    </span>
                  </div>
                  {st.badgeLevel && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200">
                      {st.badgeLevel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 pl-6">
                  {st.evidence}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Areas to Improve */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Zap className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Areas to Improve
            </h3>
            <p className="text-xs text-slate-500">
              Targeted skill gaps and recommended practice sessions to maximize your placement readiness.
            </p>
          </div>
        </div>

        {areasToImprove.length === 0 ? (
          <div className="py-10 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No active skill deficits detected
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Continue engaging across all practice pillars to keep your skill telemetry updated.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {areasToImprove.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </span>
                    {item.score && (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 font-mono">
                        ({item.score})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 pl-6">
                    {item.evidence}
                  </p>
                </div>

                {item.actionRoute && item.actionText && (
                  <button
                    onClick={() => onNavigate(item.actionRoute!)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/50 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-slate-800 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
