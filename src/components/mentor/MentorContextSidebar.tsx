import React from 'react';
import {
  Target,
  Sparkles,
  FileText,
  Code2,
  Cpu,
  Brain,
  Building2,
  Map,
  Flame,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { MentorStudentContext } from '../../types/mentor';

interface MentorContextSidebarProps {
  context: MentorStudentContext | null;
  isLoadingContext?: boolean;
  onRefreshContext: () => void;
  onNavigate: (route: string) => void;
}

export const MentorContextSidebar: React.FC<MentorContextSidebarProps> = ({
  context,
  isLoadingContext,
  onRefreshContext,
  onNavigate,
}) => {
  if (!context) {
    return (
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse space-y-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
        <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        <div className="h-32 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
      </div>
    );
  }

  const {
    studentName,
    targetRole,
    targetCompany,
    placementReadiness,
    resumeData,
    codingData,
    placementData,
    interviewData,
    consistencyData,
  } = context;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
    if (score >= 40) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="space-y-4 text-xs">
      
      {/* Student Profile Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Grounded Context
          </span>
          <button
            onClick={onRefreshContext}
            disabled={isLoadingContext}
            title="Refresh student metrics"
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingContext ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {studentName}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
              <Flame className="w-3 h-3 text-amber-500" />
              {consistencyData.currentStreak}d Streak
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
            <span>🎯 <strong>Role:</strong> {targetRole}</span>
            <span>🏢 <strong>Target:</strong> {targetCompany}</span>
          </div>
        </div>

        {/* Readiness Overview Meter */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900/40 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Placement Readiness
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${placementReadiness.overallScore !== null ? getScoreColor(placementReadiness.overallScore) : 'text-slate-500 bg-slate-500/10 border-slate-500/20'}`}>
              {placementReadiness.overallScore !== null ? `${placementReadiness.overallScore}% • ${placementReadiness.statusCategory}` : 'Awaiting Data'}
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${placementReadiness.overallScore !== null ? Math.max(5, placementReadiness.overallScore) : 0}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            {placementReadiness.primaryRecommendation}
          </p>
        </div>
      </div>

      {/* Module Performance Grid */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
          Module Breakdown
        </span>

        <div className="space-y-2.5">
          {/* Resume */}
          <div
            onClick={() => onNavigate('resume-analyzer')}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Resume ATS
                </p>
                <p className="text-[11px] text-slate-400">
                  {resumeData.isAnalyzed ? `${resumeData.atsScore}/100 score` : 'Not uploaded yet'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-500">
              <span className="font-semibold text-xs">
                {resumeData.isAnalyzed ? `${resumeData.atsScore}%` : 'Upload'}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Coding Arena */}
          <div
            onClick={() => onNavigate('coding')}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Coding Arena
                </p>
                <p className="text-[11px] text-slate-400">
                  {codingData.totalSolved} solved • {codingData.overallAccuracy}% acc
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400 group-hover:text-emerald-500">
              <span className="font-semibold text-xs">{codingData.totalSolved} Solved</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Technical Interview */}
          <div
            onClick={() => onNavigate('interview')}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Mock Interview
                </p>
                <p className="text-[11px] text-slate-400">
                  {interviewData.totalInterviews > 0
                    ? `${interviewData.totalInterviews} taken • Avg ${interviewData.averageScore}%`
                    : 'None completed'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400 group-hover:text-purple-500">
              <span className="font-semibold text-xs">
                {interviewData.totalInterviews > 0 ? `${interviewData.averageScore}%` : 'Start'}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Placement MCQs */}
          <div
            onClick={() => onNavigate('placement')}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Placement Practice
                </p>
                <p className="text-[11px] text-slate-400">
                  {placementData.totalTests} tests • {placementData.overallAccuracy}% acc
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400 group-hover:text-sky-500">
              <span className="font-semibold text-xs">{placementData.totalTests} Tests</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Weak Areas Attention Box */}
      {(codingData.weakTopics.length > 0 || placementData.topicWeaknesses.length > 0 || !resumeData.isAnalyzed) && (
        <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Target Gaps for {targetRole}</span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
            {!resumeData.isAnalyzed && (
              <p>• <strong>Resume:</strong> Missing ATS baseline scan.</p>
            )}
            {codingData.weakTopics.length > 0 && (
              <p>• <strong>Coding:</strong> Low accuracy in {codingData.weakTopics.slice(0, 2).join(', ')}.</p>
            )}
            {placementData.topicWeaknesses.length > 0 && (
              <p>• <strong>MCQs:</strong> Strengthen {placementData.topicWeaknesses.slice(0, 2).join(', ')}.</p>
            )}
          </div>
        </div>
      )}

      {/* Direct Module Links */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
          Quick Switch
        </span>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <button
            onClick={() => onNavigate('company-prep')}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition-colors text-left flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">Company Prep</span>
          </button>
          <button
            onClick={() => onNavigate('roadmap')}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition-colors text-left flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <Map className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">Roadmap</span>
          </button>
        </div>
      </div>

    </div>
  );
};
