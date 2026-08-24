import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Info,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MapPin,
  Flame,
  Award,
  AlertCircle,
} from 'lucide-react';
import { CompanyProfile } from '../../types/companyPrep';

interface CompanyProfileCardProps {
  company: CompanyProfile;
  targetRole: string;
}

export const CompanyProfileCard: React.FC<CompanyProfileCardProps> = ({
  company,
  targetRole,
}) => {
  const [showAllRounds, setShowAllRounds] = useState(false);

  const displayedRounds = showAllRounds
    ? company.hiringProcess
    : company.hiringProcess.slice(0, 2);

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Hard':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'Easy':
      default:
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 relative overflow-hidden">
      
      {/* Background Accent Gradient */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
              {company.tier}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getDifficultyBadge(company.typicalDifficulty)}`}>
              {company.typicalDifficulty} Benchmark
            </span>
            {company.isVerified ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Standard Hiring Pattern</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                <Info className="w-3 h-3" />
                <span>General Guidance Framework</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>{company.name}</span>
            <span className="text-slate-400 font-normal text-lg">/</span>
            <span className="text-indigo-600 dark:text-indigo-400 text-xl sm:text-2xl">{targetRole}</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {company.overview}
          </p>

          {company.headquarters && (
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium pt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Locations: {company.headquarters}</span>
            </div>
          )}
        </div>

        {/* Focus Breakdown Pill */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shrink-0 space-y-2 md:w-64">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Assessment Weighting</span>
          </div>

          <div className="space-y-1.5 text-xs font-medium">
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span>Coding & DSA</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{Math.round(company.preparationWeights.coding * 100)}%</span>
            </div>
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span>Technical Interview</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{Math.round(company.preparationWeights.interview * 100)}%</span>
            </div>
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span>Technical MCQs</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{Math.round(company.preparationWeights.technicalMcq * 100)}%</span>
            </div>
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span>Aptitude & Logic</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{Math.round(company.preparationWeights.aptitude * 100)}%</span>
            </div>
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span>Resume Alignment</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{Math.round(company.preparationWeights.resume * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Relevant Skills Badges */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Primary Skills Evaluated
        </div>
        <div className="flex flex-wrap gap-2">
          {company.relevantSkills.map((skill, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Typical Hiring Process Timeline */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Typical Hiring Process ({company.hiringProcess.length} Rounds)</span>
          </h3>

          {company.hiringProcess.length > 2 && (
            <button
              onClick={() => setShowAllRounds(!showAllRounds)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showAllRounds ? 'Show Less' : `View All ${company.hiringProcess.length} Rounds`}</span>
              {showAllRounds ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayedRounds.map((round) => (
            <div
              key={round.roundNumber}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2 relative"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {round.roundNumber}
                  </span>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    {round.title}
                  </h4>
                </div>
                {round.duration && (
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{round.duration}</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal pl-8">
                {round.description}
              </p>

              <div className="flex flex-wrap gap-1.5 pl-8 pt-1">
                {round.focusAreas.map((f, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-medium"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verified / Custom Disclaimer */}
      {company.disclaimer && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>{company.disclaimer}</span>
        </div>
      )}

    </div>
  );
};
