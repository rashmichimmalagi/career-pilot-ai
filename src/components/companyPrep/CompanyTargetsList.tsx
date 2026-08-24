import React from 'react';
import {
  Bookmark,
  Building2,
  Trash2,
  Check,
  ArrowRight,
  Plus,
  Briefcase,
  Layers,
} from 'lucide-react';
import { StudentTargetCompany } from '../../types/companyPrep';

interface CompanyTargetsListProps {
  targets: StudentTargetCompany[];
  activeTargetId: string | null;
  onSelectActiveTarget: (target: StudentTargetCompany) => void;
  onDeleteTarget: (targetId: string) => void;
  onAddNewTarget: () => void;
}

export const CompanyTargetsList: React.FC<CompanyTargetsListProps> = ({
  targets,
  activeTargetId,
  onSelectActiveTarget,
  onDeleteTarget,
  onAddNewTarget,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Bookmark className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              My Target Companies
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Switch your active target company to adapt roadmap and benchmarks.
            </p>
          </div>
        </div>

        <button
          onClick={onAddNewTarget}
          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Target</span>
        </button>
      </div>

      {targets.length === 0 ? (
        <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
          <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Target Companies Saved</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Choose a target company above and click "Save to My Target Companies".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {targets.map((t) => {
            const isActive = t.id === activeTargetId;
            return (
              <div
                key={t.id}
                onClick={() => onSelectActiveTarget(t)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isActive
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500/40 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="truncate">{t.companyName}</span>
                    </h4>

                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shrink-0">
                        Active Target
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <Briefcase className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{t.targetRole}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-700/60 mt-3">
                  <span className="text-[10px] text-slate-400">
                    Saved {new Date(t.createdAt).toLocaleDateString()}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTarget(t.id);
                    }}
                    title="Remove from target list (does not delete practice history)"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
