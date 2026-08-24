import React from 'react';
import {
  Trophy,
  Calendar,
  Layers,
  Terminal,
  BookOpen,
  ArrowRight,
  Sparkles,
  Award,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
} from 'lucide-react';
import { MockInterviewReport, TechnicalInterviewConfig } from '../../types/interview';

interface InterviewHistoryViewProps {
  reports: MockInterviewReport[];
  onViewReport: (report: MockInterviewReport) => void;
  onPracticeAgain: (report: MockInterviewReport) => void;
  onStartNew: () => void;
}

export const InterviewHistoryView: React.FC<InterviewHistoryViewProps> = ({
  reports,
  onViewReport,
  onPracticeAgain,
  onStartNew,
}) => {
  if (!reports || reports.length === 0) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-5 shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mx-auto flex items-center justify-center text-2xl">
          🎤
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            🎤 No completed interviews yet.
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Complete your first Technical Mock Interview to see your performance history.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onStartNew}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 mx-auto cursor-pointer"
          >
            <span>Start Interview →</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            <span>Previous Mock Interviews ({reports.length})</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review past interview evaluations, detailed scores, and interviewer feedback.
          </p>
        </div>
        <button
          type="button"
          onClick={onStartNew}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Interview</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((rep) => {
          const overall = rep.overallScore !== undefined ? rep.overallScore : (rep.overall_score || 0);
          const isHigh = overall >= 75;
          const isMid = overall >= 50 && overall < 75;
          const qCount = rep.questionCount || rep.question_count || 5;

          return (
            <div
              key={rep.id}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5 group"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                      Technical Mock Interview
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {rep.subject} &bull; {rep.topic} &bull; {rep.difficulty}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {rep.language && rep.language !== 'Not Required' && rep.language !== 'None'
                        ? `${rep.language} • `
                        : ''}
                      {qCount} Questions
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Score
                    </div>
                    <div className="flex items-baseline justify-end gap-1">
                      <span className={`text-xl font-black ${
                        isHigh ? 'text-emerald-600 dark:text-emerald-400' : isMid ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {overall}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">/ 100</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{rep.formattedDate || (rep.completedAt ? new Date(rep.completedAt).toLocaleDateString() : 'Recent')}</span>
                  </div>
                  <span>
                    {rep.questionsAnswered !== undefined ? rep.questionsAnswered : (rep.answered_count || 0)} / {qCount} answered
                  </span>
                </div>

                {/* Score bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isHigh ? 'bg-emerald-500' : isMid ? 'bg-indigo-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.max(5, overall)}%` }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onViewReport(rep)}
                  className="flex-1 py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => onPracticeAgain(rep)}
                  className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Practice Again</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
