import React from 'react';
import {
  Award,
  ShieldCheck,
  Target,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ResumeBeforeAfterComparison } from '../../types/resume';

interface ResumeComparisonViewProps {
  comparison: ResumeBeforeAfterComparison;
  keyEnhancements?: string[];
  targetRole: string;
}

export const ResumeComparisonView: React.FC<ResumeComparisonViewProps> = ({
  comparison,
  keyEnhancements = [],
  targetRole,
}) => {
  const { before, after, overallScoreDiff, atsScoreDiff, roleMatchScoreDiff } = comparison;

  // Render score change badge (+X points, maintained, or -X points)
  const renderScoreChangeBadge = (diff: number) => {
    if (diff > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs">
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>+{diff} {Math.abs(diff) === 1 ? 'point' : 'points'}</span>
        </span>
      );
    }
    if (diff === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-xs font-semibold">
          Maintained
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">
        {diff} points
      </span>
    );
  };

  // Filter or prepare 3-5 key improvements from dynamic analysis data
  const dynamicImprovements = React.useMemo(() => {
    if (keyEnhancements && keyEnhancements.length > 0) {
      return keyEnhancements.slice(0, 5);
    }

    // Context-driven dynamic improvements based on target role and actual score gains
    const items: string[] = [];
    if (atsScoreDiff > 0) {
      items.push(`Optimized ATS-friendly formatting, standard headers, and parsable structure`);
    }
    if (roleMatchScoreDiff > 0) {
      items.push(`Enhanced skill keywords and technical competencies tailored for ${targetRole}`);
    }
    if (overallScoreDiff > 0) {
      items.push(`Strengthened project impact statements with action verbs and quantifiable results`);
    }
    items.push(`Refined executive summary highlighting core strengths for ${targetRole}`);
    return items.slice(0, 4);
  }, [keyEnhancements, targetRole, atsScoreDiff, roleMatchScoreDiff, overallScoreDiff]);

  return (
    <div id="resume-improvement-results-section" className="space-y-6">
      {/* Main Results Container */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        
        {/* Header with Title, Subtitle, and AI Verified Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Resume Improvement Results
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Your resume was re-evaluated after applying the recommended improvements.
            </p>
          </div>

          <div className="self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>AI Verified</span>
            </span>
          </div>
        </div>

        {/* 3 Clean Score Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Card 1: OVERALL RESUME SCORE */}
          <div
            id="overall-resume-score-card"
            className="p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                Overall Resume Score
              </span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Award className="w-4 h-4" />
              </div>
            </div>

            {/* Primary Visual Focus: New Score & Improvement */}
            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                    {after.overall_score}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 font-mono">/ 100</span>
                </div>
                {renderScoreChangeBadge(overallScoreDiff)}
              </div>

              {/* Secondary / Small Previous Score */}
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Previously: <span className="font-semibold text-slate-600 dark:text-slate-300 font-mono">{before.overall_score}/100</span>
              </p>
            </div>

            {/* Subtle Progress Bar */}
            <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, after.overall_score))}%` }}
              />
            </div>
          </div>

          {/* Card 2: ATS COMPATIBILITY */}
          <div
            id="ats-compatibility-score-card"
            className="p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                ATS Compatibility
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Primary Visual Focus: New Score & Improvement */}
            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                    {after.ats_score}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 font-mono">/ 100</span>
                </div>
                {renderScoreChangeBadge(atsScoreDiff)}
              </div>

              {/* Secondary / Small Previous Score */}
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Previously: <span className="font-semibold text-slate-600 dark:text-slate-300 font-mono">{before.ats_score}/100</span>
              </p>
            </div>

            {/* Subtle Progress Bar */}
            <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, after.ats_score))}%` }}
              />
            </div>
          </div>

          {/* Card 3: TARGET ROLE MATCH */}
          <div
            id="target-role-match-score-card"
            className="p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                Target Role Match
              </span>
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Target className="w-4 h-4" />
              </div>
            </div>

            {/* Primary Visual Focus: New Score & Improvement */}
            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                    {after.role_match_score}%
                  </span>
                </div>
                {renderScoreChangeBadge(roleMatchScoreDiff)}
              </div>

              {/* Secondary / Small Previous Score */}
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Previously: <span className="font-semibold text-slate-600 dark:text-slate-300 font-mono">{before.role_match_score}%</span>
              </p>
            </div>

            {/* Subtle Progress Bar */}
            <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 dark:bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, after.role_match_score))}%` }}
              />
            </div>
          </div>

        </div>

        {/* Improvement Summary: Key Improvements */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Key Improvements
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {dynamicImprovements.map((enhancement, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/80 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{enhancement}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

