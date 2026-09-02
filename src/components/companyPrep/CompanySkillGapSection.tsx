import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Filter,
  ShieldCheck,
  Code2,
  Database,
  Layers,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { CompanySkillGapData, CompanySkillGapItem } from '../../types/companyPrep';

interface CompanySkillGapSectionProps {
  skillGap?: CompanySkillGapData;
  companyName: string;
  targetRole: string;
  hasSufficientData?: boolean;
  onNavigateToModule: (route: string, params?: any) => void;
}

export const CompanySkillGapSection: React.FC<CompanySkillGapSectionProps> = ({
  skillGap,
  companyName,
  targetRole,
  hasSufficientData = true,
  onNavigateToModule,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  if (!skillGap) return null;

  const categories = [
    { key: 'all', label: 'All Skills' },
    { key: 'DSA', label: 'DSA & Algorithms' },
    { key: 'Core CS', label: 'Core CS' },
    { key: 'Languages & Frameworks', label: 'Languages & Tech' },
    { key: 'System Design', label: 'System Design' },
    { key: 'Soft Skills / Behavioral', label: 'Behavioral' },
  ];

  const filteredYouHave = filterCategory === 'all'
    ? skillGap.youHave
    : skillGap.youHave.filter((s) => s.category === filterCategory);

  const filteredNeedsAttention = filterCategory === 'all'
    ? skillGap.needsAttention
    : skillGap.needsAttention.filter((s) => s.category === filterCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DSA':
        return <Code2 className="w-3.5 h-3.5" />;
      case 'Core CS':
        return <Database className="w-3.5 h-3.5" />;
      case 'System Design':
        return <Layers className="w-3.5 h-3.5" />;
      case 'Soft Skills / Behavioral':
        return <MessageSquare className="w-3.5 h-3.5" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header & Match Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              {companyName} Skill Gap Comparison
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real requirement comparison evaluated against your uploaded resume, solved coding challenges, and mock interview performance for <span className="font-medium text-slate-700 dark:text-slate-300">{targetRole}</span>.
          </p>
        </div>

        {/* Match Percentage Pill */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shrink-0">
          <div className="text-right">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Skills Matched
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-slate-100">
              {skillGap.matchPercentage}%
            </div>
          </div>
          <div className="w-12 h-12 relative flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-700"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={
                  skillGap.matchPercentage >= 70
                    ? 'text-emerald-500'
                    : skillGap.matchPercentage >= 40
                    ? 'text-amber-500'
                    : 'text-indigo-500'
                }
                strokeDasharray={`${skillGap.matchPercentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {skillGap.youHave.length}/{skillGap.totalRequired}
            </span>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1 text-[11px] font-medium">
          <Filter className="w-3 h-3" /> Category:
        </span>
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilterCategory(cat.key)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all text-xs ${
              filterCategory === cat.key
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Two Column Matrix: YOU HAVE vs NEEDS ATTENTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Column 1: YOU HAVE */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                You Have ({filteredYouHave.length})
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Verified
            </span>
          </div>

          {filteredYouHave.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {hasSufficientData
                  ? 'No verified skills matching this category filter.'
                  : 'Complete coding tests, upload your resume, and practice mock interviews to verify your skills.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredYouHave.map((item, idx) => (
                <div
                  key={`have-${idx}`}
                  className="p-3.5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-1.5 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-emerald-600 dark:text-emerald-400 shrink-0">
                        {getCategoryIcon(item.category)}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {item.skill}
                      </span>
                    </div>
                    {item.proficiencyLevel && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shrink-0 border border-emerald-500/20">
                        {item.proficiencyLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 pl-5">
                    {item.evidence}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: NEEDS ATTENTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
              </span>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Needs Attention ({filteredNeedsAttention.length})
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Gap Detected
            </span>
          </div>

          {filteredNeedsAttention.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-dashed border-emerald-500/30">
              <ShieldCheck className="w-7 h-7 text-emerald-500 mx-auto mb-1" />
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                All benchmark skills in this category are verified!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredNeedsAttention.map((item, idx) => (
                <div
                  key={`need-${idx}`}
                  className="p-3.5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-500/20 space-y-2 hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-amber-600 dark:text-amber-400 shrink-0">
                        {getCategoryIcon(item.category)}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {item.skill}
                      </span>
                    </div>
                    {item.proficiencyLevel && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 shrink-0 border border-amber-500/20">
                        {item.proficiencyLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 pl-5">
                    {item.evidence}
                  </p>
                  {item.actionRoute && (
                    <div className="pl-5 pt-0.5 flex justify-end">
                      <button
                        onClick={() => onNavigateToModule(item.actionRoute!, item.actionParams)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 group"
                      >
                        <span>{item.actionText || 'Practice Skill'}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
