import React from 'react';
import {
  TrendingUp,
  Code2,
  Brain,
  Cpu,
  FileText,
  Map,
  Flame,
  ChevronRight,
  Info,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  CareerReadinessScore,
  CodingProgressAnalytics,
  PlacementProgressAnalytics,
  MockInterviewProgressAnalytics,
  ResumeProgressAnalytics,
  RoadmapProgressAnalytics,
} from '../../types/intelligence';

interface AnalyticsTopCardsProps {
  readiness?: CareerReadinessScore;
  coding: CodingProgressAnalytics;
  placement: PlacementProgressAnalytics;
  interview: MockInterviewProgressAnalytics;
  resume: ResumeProgressAnalytics;
  roadmap: RoadmapProgressAnalytics;
  onOpenBreakdown: () => void;
  onNavigate: (route: string) => void;
}

export const AnalyticsTopCards: React.FC<AnalyticsTopCardsProps> = ({
  readiness,
  coding,
  placement,
  interview,
  resume,
  roadmap,
  onOpenBreakdown,
  onNavigate,
}) => {
  const readinessScore = readiness?.overallScore;
  const statusTier = readiness?.statusCategory || 'Not Enough Data';

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Highly Prepared':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';
      case 'Placement Ready':
        return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800';
      case 'Making Progress':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800';
      case 'Building Foundations':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Career Readiness Card (Spans 2 cols on md+ if prominent) */}
      <div className="sm:col-span-2 p-5 rounded-3xl bg-linear-to-br from-indigo-900 via-slate-900 to-slate-950 text-white shadow-md border border-indigo-800/40 relative overflow-hidden flex flex-col justify-between">
        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Placement Readiness
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getTierColor(statusTier)}`}>
                {statusTier}
              </span>
            </div>
            <h3 className="text-xl font-extrabold tracking-tight">Career Readiness Score</h3>
          </div>

          <button
            onClick={onOpenBreakdown}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-200 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-xl transition-all cursor-pointer backdrop-blur-xs"
            title="View exact formula breakdown"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Score Breakdown</span>
          </button>
        </div>

        <div className="relative z-10 my-4 flex items-baseline gap-3">
          {readinessScore !== null ? (
            <>
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {readinessScore}
              </span>
              <span className="text-lg font-semibold text-indigo-300">/ 100</span>
            </>
          ) : (
            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-indigo-200">
                Not enough data
              </span>
              <p className="text-xs text-indigo-300/80">
                Complete assessments in at least 2 pillars to compute overall score.
              </p>
            </div>
          )}
        </div>

        {/* 5-Dimension Mini Progress Bar */}
        <div className="relative z-10 pt-2 border-t border-white/10 space-y-2">
          <div className="grid grid-cols-5 gap-1 text-center text-[10px] font-semibold text-indigo-200/90">
            <div>Coding 25%</div>
            <div>Resume 20%</div>
            <div>Interview 20%</div>
            <div>Aptitude 20%</div>
            <div>Roadmap 15%</div>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex gap-0.5">
            <div
              className="bg-emerald-400 h-full rounded-l-full transition-all"
              style={{ width: `${((readiness?.dimensions.coding.score || 0) * 0.25)}%` }}
              title={`Coding: ${readiness?.dimensions.coding.score || 0}/100`}
            />
            <div
              className="bg-indigo-400 h-full transition-all"
              style={{ width: `${((readiness?.dimensions.resume.score || 0) * 0.20)}%` }}
              title={`Resume: ${readiness?.dimensions.resume.score || 0}/100`}
            />
            <div
              className="bg-purple-400 h-full transition-all"
              style={{ width: `${((readiness?.dimensions.interview.score || 0) * 0.20)}%` }}
              title={`Technical Interview: ${readiness?.dimensions.interview.score || 0}/100`}
            />
            <div
              className="bg-cyan-400 h-full transition-all"
              style={{ width: `${((readiness?.dimensions.placement.score || 0) * 0.20)}%` }}
              title={`Aptitude: ${readiness?.dimensions.placement.score || 0}/100`}
            />
            <div
              className="bg-amber-400 h-full rounded-r-full transition-all"
              style={{ width: `${((readiness?.dimensions.roadmap.score || 0) * 0.15)}%` }}
              title={`Roadmap: ${readiness?.dimensions.roadmap.score || 0}/100`}
            />
          </div>
        </div>
      </div>

      {/* 2. Coding Card */}
      <div
        onClick={() => onNavigate('coding')}
        className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Code2 className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-500">Coding Arena</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        <div className="my-3 space-y-1">
          {coding.solvedCount > 0 || coding.totalSubmissions > 0 ? (
            <>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                {coding.solvedCount}{' '}
                <span className="text-sm font-semibold text-slate-400">Solved</span>
              </div>
              <p className="text-xs text-slate-500">
                {coding.accuracyRate}% accuracy • {coding.easySolved}E {coding.mediumSolved}M {coding.hardSolved}H
              </p>
            </>
          ) : (
            <>
              <div className="text-xl font-bold text-slate-700 dark:text-slate-300">
                Not assessed
              </div>
              <p className="text-xs text-slate-400">No coding submissions yet</p>
            </>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
          <span>{coding.totalSubmissions} attempts</span>
          <span>{coding.successRate}% solve rate</span>
        </div>
      </div>

      {/* 3. Aptitude Assessment Card */}
      <div
        onClick={() => onNavigate('placement')}
        className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-cyan-500/40 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
              <Brain className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-500">Placement Aptitude</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        <div className="my-3 space-y-1">
          {placement.totalAttempts > 0 ? (
            <>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                {placement.averageScore}%{' '}
                <span className="text-sm font-semibold text-slate-400">Avg</span>
              </div>
              <p className="text-xs text-slate-500">
                {placement.totalAttempts} tests completed • Best: {placement.bestScore}%
              </p>
            </>
          ) : (
            <>
              <div className="text-xl font-bold text-slate-700 dark:text-slate-300">
                Not assessed
              </div>
              <p className="text-xs text-slate-400">No tests completed yet</p>
            </>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 flex items-center justify-between">
          <span>{placement.totalQuestionsAnswered} questions</span>
          <span>{placement.averageAccuracy}% accuracy</span>
        </div>
      </div>

      {/* 4. Technical Interview Card */}
      <div
        onClick={() => onNavigate('interview')}
        className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-500/40 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Cpu className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-500">Technical Interview</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        <div className="my-3 space-y-1">
          {interview.totalInterviews > 0 ? (
            <>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                {interview.latestScore}{' '}
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
              </div>
              <p className="text-xs text-slate-500">
                {interview.totalInterviews} rounds • Avg: {interview.averageOverallScore}/100
              </p>
            </>
          ) : (
            <>
              <div className="text-xl font-bold text-slate-700 dark:text-slate-300">
                Not assessed
              </div>
              <p className="text-xs text-slate-400">No mock interviews completed</p>
            </>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center justify-between">
          <span>Tech: {interview.averageTechnicalScore}/100</span>
          <span>Comm: {interview.averageCommunicationScore}/100</span>
        </div>
      </div>

      {/* 5. Resume Card */}
      <div
        onClick={() => onNavigate('resume-analyzer')}
        className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-500">Resume & ATS</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        <div className="my-3 space-y-1">
          {resume.isAssessed ? (
            <>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                {resume.latestAtsScore}{' '}
                <span className="text-sm font-semibold text-slate-400">ATS</span>
              </div>
              <p className="text-xs text-slate-500">
                {resume.totalVersions} version{resume.totalVersions > 1 ? 's' : ''} • Role: {resume.targetRole || 'SWE'}
              </p>
            </>
          ) : (
            <>
              <div className="text-xl font-bold text-slate-700 dark:text-slate-300">
                Not assessed
              </div>
              <p className="text-xs text-slate-400">Upload resume for ATS audit</p>
            </>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
          <span>{resume.latestAnalysisDate ? `Analyzed ${resume.latestAnalysisDate}` : 'No date'}</span>
          <span>{resume.highestAtsScore > 0 ? `Peak: ${resume.highestAtsScore}` : '—'}</span>
        </div>
      </div>

      {/* 6. Career Roadmap Card */}
      <div
        onClick={() => onNavigate('roadmap')}
        className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-500/40 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Map className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-500">Career Roadmap</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        <div className="my-3 space-y-1">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {roadmap.completionPercentage}%
          </div>
          <p className="text-xs text-slate-500">
            {roadmap.completedTasks} of {roadmap.totalTasks} milestones completed
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-between">
          <span className="truncate max-w-[150px]">{roadmap.activePhaseTitle}</span>
          <span>{roadmap.remainingTasks} left</span>
        </div>
      </div>

      {/* 7. Practice Streak Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
              <Flame className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-500">Practice Streak</span>
          </div>
        </div>

        <div className="my-3 space-y-1">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span>{coding.currentStreakDays}</span>
            <span className="text-sm font-semibold text-slate-400">
              day{coding.currentStreakDays === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {coding.currentStreakDays > 0
              ? 'Active consecutive practice'
              : 'Practice today to activate streak'}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-orange-600 dark:text-orange-400 flex items-center justify-between">
          <span>Best: {coding.longestStreakDays} days</span>
          <span>{coding.currentStreakDays > 0 ? '🔥 On Fire' : '⚡ Ready'}</span>
        </div>
      </div>
    </div>
  );
};
