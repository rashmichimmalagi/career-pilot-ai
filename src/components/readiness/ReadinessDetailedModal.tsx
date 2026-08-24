import React from 'react';
import {
  X,
  Target,
  FileCheck,
  Code2,
  Cpu,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PlacementReadinessReport } from '../../types/readiness';

interface ReadinessDetailedModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: PlacementReadinessReport | null;
  onNavigate: (page: string) => void;
}

export const ReadinessDetailedModal: React.FC<ReadinessDetailedModalProps> = ({
  isOpen,
  onClose,
  report,
  onNavigate,
}) => {
  if (!isOpen || !report) return null;

  const { components, weights, overallScore, statusCategory, statusBadgeColor } = report;

  const handleAction = (page: string) => {
    onClose();
    onNavigate(page);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Placement Readiness Analysis</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${statusBadgeColor.bg} ${statusBadgeColor.text} ${statusBadgeColor.border}`}>
                  {statusCategory}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deterministic multi-dimensional evaluation based on your real activity
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Formula & Overall Summary Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-slate-50 to-purple-50/70 dark:from-slate-800/80 dark:via-slate-900 dark:to-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 font-mono">
                  Composite Readiness Formula
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Weighted Synthesis of 4 Core Placement Pillars
                </p>
              </div>

              <div className="flex items-baseline gap-2 bg-white dark:bg-slate-950 px-4 py-2 rounded-2xl border border-indigo-500/20 shadow-sm self-start sm:self-auto">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {overallScore}
                </span>
                <span className="text-xs font-semibold text-slate-400">/ 100</span>
              </div>
            </div>

            {/* Formula Breakdown chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Resume (25%)</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {components.resume.isAvailable ? `${components.resume.score} × 0.25 = ${components.resume.weightedContribution}` : '0 pts'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Coding (30%)</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {components.coding.isAvailable ? `${components.coding.score} × 0.30 = ${components.coding.weightedContribution}` : '0 pts'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Interview (30%)</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {components.technicalInterview.isAvailable ? `${components.technicalInterview.score} × 0.30 = ${components.technicalInterview.weightedContribution}` : '0 pts'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Consistency (15%)</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {`${components.consistency.score} × 0.15 = ${components.consistency.weightedContribution}`}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Deep Dive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Resume Breakdown Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Resume Alignment</h3>
                    <span className="text-[11px] text-slate-500 font-mono">Weight: 25%</span>
                  </div>
                </div>

                <div className="text-right">
                  {components.resume.isAvailable ? (
                    <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                      {components.resume.score} / 100
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Unavailable</span>
                  )}
                </div>
              </div>

              {components.resume.isAvailable ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">ATS Score</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{components.resume.atsScore}/100</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Role Match</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{components.resume.roleMatchScore}/100</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Overall</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{components.resume.overallResumeScore}/100</span>
                    </div>
                  </div>

                  {components.resume.targetRole && (
                    <p className="text-slate-600 dark:text-slate-400">
                      Target Role: <strong className="text-slate-900 dark:text-slate-200">{components.resume.targetRole}</strong>
                    </p>
                  )}

                  <button
                    onClick={() => handleAction('resume-analyzer')}
                    className="w-full py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-colors"
                  >
                    View or Re-Analyze Resume →
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    No resume analyzed yet. Upload your PDF resume to unlock this 25% component.
                  </p>
                  <button
                    onClick={() => handleAction('resume-analyzer')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors"
                  >
                    Analyze My Resume
                  </button>
                </div>
              )}
            </div>

            {/* 2. Coding Breakdown Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Coding Performance</h3>
                    <span className="text-[11px] text-slate-500 font-mono">Weight: 30%</span>
                  </div>
                </div>

                <div className="text-right">
                  {components.coding.isAvailable ? (
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {components.coding.score} / 100
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Unavailable</span>
                  )}
                </div>
              </div>

              {components.coding.isAvailable ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Accepted</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{components.coding.uniqueAcceptedProblems}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Easy</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{components.coding.easySolved}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Medium</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{components.coding.mediumSolved}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Hard</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{components.coding.hardSolved}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Total Submissions: <strong>{components.coding.totalSubmissions}</strong></span>
                    <span>Success Rate: <strong>{components.coding.accuracyRate}%</strong></span>
                  </div>

                  <button
                    onClick={() => handleAction('coding')}
                    className="w-full py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold text-xs transition-colors"
                  >
                    Open Coding Practice Arena →
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    No coding problems submitted yet. Solve problems to build algorithmic depth.
                  </p>
                  <button
                    onClick={() => handleAction('coding')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                  >
                    Start Coding Practice
                  </button>
                </div>
              )}
            </div>

            {/* 3. Technical Interview Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Technical Interview</h3>
                    <span className="text-[11px] text-slate-500 font-mono">Weight: 30%</span>
                  </div>
                </div>

                <div className="text-right">
                  {components.technicalInterview.isAvailable ? (
                    <span className="text-base font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                      {components.technicalInterview.score} / 100
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Unavailable</span>
                  )}
                </div>
              </div>

              {components.technicalInterview.isAvailable ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Technical</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{components.technicalInterview.technicalKnowledgeScore}/100</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Problem Solving</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{components.technicalInterview.problemSolvingScore}/100</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Communication</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{components.technicalInterview.communicationScore}/100</span>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-400">
                    Completed: <strong>{components.technicalInterview.completedRounds} round(s)</strong> • Latest Score: <strong>{components.technicalInterview.latestScore}/100</strong>
                  </p>

                  <button
                    onClick={() => handleAction('interview')}
                    className="w-full py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold text-xs transition-colors"
                  >
                    Take Another Mock Round →
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Technical Interview score unavailable. Take your first AI mock round to unlock this 30% component.
                  </p>
                  <button
                    onClick={() => handleAction('interview')}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors"
                  >
                    Take Mock Interview
                  </button>
                </div>
              )}
            </div>

            {/* 4. Consistency Breakdown Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Practice Consistency</h3>
                    <span className="text-[11px] text-slate-500 font-mono">Weight: 15%</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                    {components.consistency.score} / 100
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Current Streak</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{components.consistency.currentStreak} Days</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Longest Peak</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{components.consistency.longestStreak} Days</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">14-Day Active</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{components.consistency.recentActiveDays14} Days</span>
                  </div>
                </div>

                <p className="text-slate-500 text-[11px] italic">
                  Note: Multiple submissions on the same calendar day count as 1 practice day to reward sustained discipline.
                </p>

                <button
                  onClick={() => handleAction('coding')}
                  className="w-full py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-semibold text-xs transition-colors"
                >
                  Practice Today's Problem →
                </button>
              </div>
            </div>

          </div>

          {/* Placement Status Standards & Benchmark Reference */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Placement Readiness Status Tiers
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-center">
              <div className={`p-2 rounded-xl border ${overallScore < 25 ? 'bg-slate-200 dark:bg-slate-800 font-bold border-slate-400' : 'border-slate-200 dark:border-slate-800 opacity-60'}`}>
                <span className="block text-[11px] font-mono">0–24</span>
                <span>Getting Started</span>
              </div>
              <div className={`p-2 rounded-xl border ${overallScore >= 25 && overallScore < 50 ? 'bg-sky-100 dark:bg-sky-950 font-bold border-sky-400 text-sky-700 dark:text-sky-300' : 'border-slate-200 dark:border-slate-800 opacity-60'}`}>
                <span className="block text-[11px] font-mono">25–49</span>
                <span>Building Foundations</span>
              </div>
              <div className={`p-2 rounded-xl border ${overallScore >= 50 && overallScore < 70 ? 'bg-indigo-100 dark:bg-indigo-950 font-bold border-indigo-400 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-800 opacity-60'}`}>
                <span className="block text-[11px] font-mono">50–69</span>
                <span>Making Progress</span>
              </div>
              <div className={`p-2 rounded-xl border ${overallScore >= 70 && overallScore < 85 ? 'bg-emerald-100 dark:bg-emerald-950 font-bold border-emerald-400 text-emerald-700 dark:text-emerald-300' : 'border-slate-200 dark:border-slate-800 opacity-60'}`}>
                <span className="block text-[11px] font-mono">70–84</span>
                <span>Placement Ready</span>
              </div>
              <div className={`p-2 rounded-xl border ${overallScore >= 85 ? 'bg-amber-100 dark:bg-amber-950 font-bold border-amber-400 text-amber-700 dark:text-amber-300' : 'border-slate-200 dark:border-slate-800 opacity-60'}`}>
                <span className="block text-[11px] font-mono">85–100</span>
                <span>Highly Prepared</span>
              </div>
            </div>
          </div>

          {/* Academic Integrity & Placement Disclaimer */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>
              Placement Readiness Score is calculated deterministically from your authenticated activities across CareerPilot.
              This score measures technical preparedness and does not guarantee job selection or interview conversion.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors"
          >
            Close Analysis
          </button>
        </div>

      </div>
    </div>
  );
};
