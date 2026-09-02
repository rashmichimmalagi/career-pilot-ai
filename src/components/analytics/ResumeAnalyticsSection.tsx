import React from 'react';
import { FileText, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Briefcase, Tag } from 'lucide-react';
import { ResumeProgressAnalytics } from '../../types/intelligence';

interface ResumeAnalyticsSectionProps {
  resume: ResumeProgressAnalytics;
  onNavigate: (route: string) => void;
}

export const ResumeAnalyticsSection: React.FC<ResumeAnalyticsSectionProps> = ({
  resume,
  onNavigate,
}) => {
  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <FileText className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Resume & ATS Optimization Analytics
            </h3>
            <p className="text-xs text-slate-500">
              Applicant Tracking System alignment, keyword gaps, and job description match analyses.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('resume-analyzer')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer transition-colors self-start sm:self-auto"
        >
          <span>Audit Resume</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Current ATS Score</div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {resume.isAssessed ? `${resume.latestAtsScore}/100` : 'Not assessed'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {resume.targetRole ? `Role: ${resume.targetRole}` : 'No role set'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Previous ATS Score</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {resume.previousAtsScore !== null ? `${resume.previousAtsScore}/100` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {resume.previousAtsScore !== null ? 'Prior upload' : 'No previous version'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">ATS Improvement</div>
          <div className="text-2xl font-black mt-1">
            {resume.scoreImprovementDelta !== null ? (
              <span className={resume.scoreImprovementDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {resume.scoreImprovementDelta >= 0 ? `+${resume.scoreImprovementDelta}` : resume.scoreImprovementDelta} pts
              </span>
            ) : (
              <span className="text-sm font-bold text-slate-400">Baseline</span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Version delta</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Resume Versions</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {resume.totalVersions}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Iterations saved</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Job Matches</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {resume.jobMatchesCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Job postings matched</div>
        </div>
      </div>

      {!resume.isAssessed ? (
        <div className="py-8 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            No resume uploaded or analyzed yet
          </p>
          <p className="text-xs text-slate-500">
            Upload your resume PDF in the Resume Analyzer to receive ATS match scores, missing keyword alerts, and structural bullet feedback.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Most Common Missing Skills */}
            {resume.mostCommonMissingSkills.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 space-y-2">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Most Common Missing Skills</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Skills frequently required by your target roles but missing from your resume:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {resume.mostCommonMissingSkills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/50 text-xs font-medium text-amber-800 dark:text-amber-200"
                    >
                      + {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Most Common Keyword Gaps */}
            {resume.mostCommonKeywordGaps.length > 0 ? (
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 space-y-2">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Most Common Keyword Gaps</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Keywords flagged in job-match analyses to improve ATS filtering passes:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {resume.mostCommonKeywordGaps.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700/50 text-xs font-medium text-purple-800 dark:text-purple-200"
                    >
                      • {kw}
                    </span>
                  ))}
                </div>
              </div>
            ) : resume.latestStrengths.length > 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validated Resume Highlights</span>
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {resume.latestStrengths.map((st, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/50 text-xs font-medium text-emerald-800 dark:text-emerald-200"
                    >
                      ✓ {st}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Job / Resume Match Analyses */}
          {resume.jobMatches && resume.jobMatches.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Job Description Match History ({resume.jobMatches.length})</span>
                </h4>
                <button
                  onClick={() => onNavigate('resume-analyzer')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  New Match Analysis →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {resume.jobMatches.map((jm) => (
                  <div
                    key={jm.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {jm.jobTitle}
                        </div>
                        {jm.companyName && (
                          <div className="text-[10px] text-slate-500">{jm.companyName}</div>
                        )}
                      </div>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                          jm.matchScore >= 80
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : jm.matchScore >= 60
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {jm.matchScore}%
                      </span>
                    </div>

                    {jm.missingSkills && jm.missingSkills.length > 0 && (
                      <div className="text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">Missing:</span>{' '}
                        {jm.missingSkills.slice(0, 3).join(', ')}
                        {jm.missingSkills.length > 3 && ` +${jm.missingSkills.length - 3} more`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
