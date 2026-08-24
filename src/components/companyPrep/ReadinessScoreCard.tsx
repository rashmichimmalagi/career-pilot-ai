import React from 'react';
import { Target, TrendingUp } from 'lucide-react';
import { CompanyReadinessAnalysis } from '../../types/companyPrep';

interface ReadinessScoreCardProps {
  analysis: CompanyReadinessAnalysis;
  onOpenTargetDrawer?: () => void;
}

export const ReadinessScoreCard: React.FC<ReadinessScoreCardProps> = ({
  analysis,
}) => {
  const { overallScore, statusCategory, statusDescription, company, targetRole } = analysis;

  const getStatusBadge = () => {
    switch (statusCategory) {
      case 'Highly Prepared':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/20',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-500/30',
        };
      case 'Placement Ready':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-500/30',
        };
      case 'Making Progress':
        return {
          bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
          text: 'text-indigo-700 dark:text-indigo-300',
          border: 'border-indigo-500/30',
        };
      case 'Building Foundations':
        return {
          bg: 'bg-sky-500/10 dark:bg-sky-500/20',
          text: 'text-sky-700 dark:text-sky-300',
          border: 'border-sky-500/30',
        };
      case 'Getting Started':
      default:
        return {
          bg: 'bg-slate-500/10 dark:bg-slate-500/20',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-500/30',
        };
    }
  };

  const statusStyle = getStatusBadge();

  // Dial color
  const scoreColor =
    overallScore >= 85
      ? 'text-amber-500'
      : overallScore >= 70
      ? 'text-emerald-500'
      : overallScore >= 50
      ? 'text-indigo-500'
      : overallScore >= 25
      ? 'text-sky-500'
      : 'text-slate-400';

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900/10 via-slate-100 to-white dark:from-indigo-950/80 dark:via-slate-900 dark:to-slate-950 border border-indigo-500/20 shadow-sm relative overflow-hidden">
      
      {/* Glow orb */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        
        {/* Left summary */}
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              <span>Target Company Readiness</span>
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
              {statusCategory}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Readiness for {company.name}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {statusDescription}
          </p>

          <p className="pt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Your readiness score is based on your overall preparation across resume, coding, aptitude, technical skills, and interview performance.
          </p>
        </div>

        {/* Big Score Dial */}
        <div className="flex items-center gap-5 bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs shrink-0 self-start md:self-auto">
          <div className="text-center">
            <div className={`text-4xl sm:text-5xl font-black tracking-tight ${scoreColor}`}>
              {overallScore}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
              Out of 100
            </div>
          </div>

          <div className="h-12 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="space-y-1 text-left">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              <span>{targetRole}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {overallScore >= 70 ? 'Eligible for Direct Rounds' : 'Prepare Priorities Below'}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
