import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Sparkles,
  Award,
  AlertTriangle,
  X,
  ArrowRight,
  Code2,
  Brain,
  Cpu,
  FileText,
} from 'lucide-react';
import { WeeklyCareerReport } from '../../types/intelligence';

interface WeeklyReportModalProps {
  report: WeeklyCareerReport | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({
  report,
  isOpen,
  onClose,
  onNavigate,
}) => {
  // Lock background scroll and listen for Escape key when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !report) return null;

  const formatDate = (dStr: string) => {
    try {
      return new Date(dStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (_) {
      return dStr;
    }
  };

  const modalContent = (
    <div
      id="weekly-career-report-backdrop"
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 m-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="weekly-career-report-modal"
        className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto flex flex-col m-0"
        style={{ margin: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header: Calendar icon, Title, Period, and Close (X) button */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                Weekly Career Intelligence Report
              </h3>
              <p className="text-xs text-slate-500">
                Period: {formatDate(report.startDate)} – {formatDate(report.endDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="weekly-report-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Executive Summary */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-4 h-4" />
              <span>7-Day Executive Takeaways</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {report.executiveSummary}
            </p>
          </div>

          {/* 7-Day Activity Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              7-Day Activity Breakdown
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Coding */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Coding DSA</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {(report.coding.uniqueQuestionsSolved ?? report.coding.solvedCount) || 0} Solved
                </div>
                <div className="text-[11px] text-slate-400">
                  {report.coding.totalSubmissions !== undefined
                    ? `${report.coding.totalSubmissions} ${report.coding.totalSubmissions === 1 ? 'submission' : 'submissions'} across ${report.coding.uniqueQuestionsAttempted ?? report.coding.attemptedCount} ${(report.coding.uniqueQuestionsAttempted ?? report.coding.attemptedCount) === 1 ? 'question' : 'questions'}`
                    : `${report.coding.attemptedCount} attempts (${report.coding.accuracyRate}% acc)`}
                </div>
              </div>

              {/* Placement */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Brain className="w-3.5 h-3.5 text-sky-500" />
                  <span>Placement Tests</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {report.placement.attemptsCount} Rounds
                </div>
                <div className="text-[11px] text-slate-400">
                  Avg Score: {report.placement.averageScore}%
                </div>
              </div>

              {/* Mock Interviews */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Cpu className="w-3.5 h-3.5 text-purple-500" />
                  <span>Interviews</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {report.interview.completedCount} Completed
                </div>
                <div className="text-[11px] text-slate-400">
                  Avg Score: {report.interview.averageScore}/100
                </div>
              </div>

              {/* Study Planner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Study Planner</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {report.studyPlanner.completionRate}%
                </div>
                <div className="text-[11px] text-slate-400">
                  {report.studyPlanner.completedPlannedCount}/{report.studyPlanner.plannedTasksCount} tasks done
                </div>
              </div>

              {/* Resume */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>Resume Score</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {report.resume.latestScore}/100
                </div>
                <div className="text-[11px] text-slate-400">ATS Benchmarked</div>
              </div>

              {/* Overall Readiness */}
              <div className="p-4 rounded-2xl bg-indigo-600 text-white space-y-1">
                <div className="text-xs font-medium text-indigo-100">Overall Readiness</div>
                <div className="text-2xl font-black">
                  {report.currentReadinessScore !== null ? `${report.currentReadinessScore}%` : '—'}
                </div>
                <div className="text-[11px] text-indigo-200">5-Pillar Synthesized</div>
              </div>
            </div>
          </div>

          {/* Biggest Improvement & Gap */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Biggest Improvement */}
            <div className="p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <Award className="w-4 h-4" />
                <span>Biggest Improvement</span>
              </div>
              {report.biggestImprovement ? (
                <>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {report.biggestImprovement.area} ({report.biggestImprovement.metric})
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {report.biggestImprovement.description}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500 italic">No significant change recorded this week.</p>
              )}
            </div>

            {/* Biggest Gap */}
            <div className="p-5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4" />
                <span>Primary Gap to Close</span>
              </div>
              {report.biggestGap ? (
                <>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {report.biggestGap.area}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {report.biggestGap.description}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500 italic">No critical gap detected.</p>
              )}
            </div>
          </div>

          {/* Next Week's Strategic Focus */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Next Week's High-Leverage Strategic Focus
            </h4>
            <div className="space-y-2">
              {(report.nextWeeksFocus || []).map((item, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-500">{item.reason}</div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate(item.actionRoute);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 border border-slate-200 dark:border-slate-600 shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <span>Go</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
