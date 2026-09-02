import React from 'react';
import {
  Briefcase,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
  Target,
} from 'lucide-react';
import { CompanyJobMatchInfo } from '../../types/companyPrep';

interface CompanyJobMatchCardProps {
  jobMatch?: CompanyJobMatchInfo | null;
  companyName: string;
  targetRole: string;
  onNavigateToModule: (route: string, params?: any) => void;
}

export const CompanyJobMatchCard: React.FC<CompanyJobMatchCardProps> = ({
  jobMatch,
  companyName,
  targetRole,
  onNavigateToModule,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Briefcase className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              Job Description Match Analysis
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Semantic match between your resume and {companyName} {targetRole} job descriptions.
            </p>
          </div>
        </div>

        {jobMatch && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 shrink-0">
            <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
              {jobMatch.matchScore}% Match
            </span>
          </div>
        )}
      </div>

      {jobMatch ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Matching Keywords */}
            <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Matching Skills & Keywords ({jobMatch.matchingSkills.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {jobMatch.matchingSkills.slice(0, 8).map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                  >
                    {skill}
                  </span>
                ))}
                {jobMatch.matchingSkills.length === 0 && (
                  <span className="text-xs text-slate-400">No matching skills detected yet</span>
                )}
              </div>
            </div>

            {/* Missing Keywords / Gaps */}
            <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Missing Keywords ({jobMatch.missingSkills.length + jobMatch.keywordGaps.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[...jobMatch.missingSkills, ...jobMatch.keywordGaps].slice(0, 8).map((kw, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                  >
                    {kw}
                  </span>
                ))}
                {jobMatch.missingSkills.length === 0 && jobMatch.keywordGaps.length === 0 && (
                  <span className="text-xs text-slate-400">No critical missing keywords</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Analyzed for {jobMatch.resumeName || 'latest resume'} • {new Date(jobMatch.analyzedAt).toLocaleDateString()}
            </span>
            <button
              type="button"
              onClick={() => onNavigateToModule('job-match', { company: companyName, role: targetRole })}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Analyze Another JD</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-2.5">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              No Job Description match analyzed for {companyName} yet
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-md mx-auto">
              Compare your current resume against real {companyName} job descriptions to detect missing keywords and boost ATS screening pass rates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToModule('job-match', { company: companyName, role: targetRole })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Match Resume Against {companyName} JD</span>
          </button>
        </div>
      )}
    </div>
  );
};
