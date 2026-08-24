import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Code2,
  Layers,
  BookOpen,
  Terminal,
  Loader2,
  FileText,
} from 'lucide-react';
import {
  InterviewQuestion,
  RecordedAnswer,
  QuestionStatus,
  TechnicalInterviewConfig,
} from '../../types/interview';

interface InterviewReviewViewProps {
  config: TechnicalInterviewConfig;
  questions: InterviewQuestion[];
  recordedAnswers: Record<number, RecordedAnswer>;
  questionStatuses: Record<number, QuestionStatus>;
  isSubmitting?: boolean;
  onNavigateQuestion: (questionNumber: number) => void;
  onSubmitFinal: () => void;
  onBackToInterview: () => void;
}

export const InterviewReviewView: React.FC<InterviewReviewViewProps> = ({
  config,
  questions,
  recordedAnswers,
  questionStatuses,
  isSubmitting = false,
  onNavigateQuestion,
  onSubmitFinal,
  onBackToInterview,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const totalQuestions = questions.length || Number(config.questionCount) || 5;

  const answeredQuestions = questions.filter((q) => {
    const ans = recordedAnswers[q.questionNumber];
    return ans && !ans.isSkipped && ans.answerText && ans.answerText.trim().length > 0;
  });

  const answeredCount = answeredQuestions.length;
  const skippedCount = totalQuestions - answeredCount;
  const isAllAnswered = skippedCount === 0;

  const handleFinishClick = () => {
    if (skippedCount > 0) {
      setShowConfirmModal(true);
    } else {
      onSubmitFinal();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-slate-900/20 dark:from-indigo-950/60 dark:via-purple-950/40 dark:to-slate-900/80 border border-indigo-200/60 dark:border-indigo-800/60 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-100/60 dark:border-indigo-900/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-[2px] shadow-md shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                  Pre-Submission Review
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {answeredCount} of {totalQuestions} answered
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                Technical Interview Review
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToInterview}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Questions</span>
            </button>
          </div>
        </div>

        {/* Progress & Stat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>Subject &bull; Topic</span>
            </div>
            <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
              {config.subject} &bull; {config.isCustomTopic ? config.customTopicText : config.topic}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Terminal className="w-3.5 h-3.5 text-cyan-500" />
              <span>{config.language ? 'Language & Difficulty' : 'Difficulty'}</span>
            </div>
            <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
              {config.language ? `${config.language} (${config.difficulty})` : `${config.difficulty}`}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 mb-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Answered</span>
            </div>
            <p className="font-extrabold text-sm sm:text-base text-emerald-800 dark:text-emerald-300">
              {answeredCount} / {totalQuestions}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20">
            <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 mb-1 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Skipped / Empty</span>
            </div>
            <p className="font-extrabold text-sm sm:text-base text-amber-800 dark:text-amber-300">
              {skippedCount} / {totalQuestions}
            </p>
          </div>
        </div>
      </div>

      {/* Warning Notice if Skipped */}
      {skippedCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs sm:text-sm text-amber-900 dark:text-amber-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              You have {skippedCount} unanswered or skipped question{skippedCount > 1 ? 's' : ''}.
            </p>
            <p className="text-xs text-amber-800/90 dark:text-amber-400/90">
              You can click &ldquo;Answer Question&rdquo; on any skipped card below to provide an answer before final AI evaluation. Unanswered questions will receive 0 points.
            </p>
          </div>
        </div>
      )}

      {/* Question Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
            Questions Summary ({totalQuestions})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Click any question to edit or answer
          </span>
        </div>

        {questions.map((q, idx) => {
          const qNum = q.questionNumber || idx + 1;
          const ans = recordedAnswers[qNum];
          const hasAnswer = ans && !ans.isSkipped && ans.answerText && ans.answerText.trim().length > 0;
          const wordCount = hasAnswer ? ans.answerText.trim().split(/\s+/).length : 0;
          const isEvaluated = ans?.isEvaluated && ans.evaluation;
          const score = ans?.evaluation?.score;

          return (
            <div
              key={q.id || qNum}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isEvaluated
                  ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-300/60 dark:border-emerald-800/40 shadow-xs'
                  : hasAnswer
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                  : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                      Q{qNum}
                    </span>

                    {isEvaluated ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Evaluated &bull; Score: {score}/10</span>
                      </span>
                    ) : hasAnswer ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-blue-500" />
                        <span>Answer Draft Saved ({wordCount} words)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span>Skipped / Not Answered</span>
                      </span>
                    )}

                    {q.questionType && (
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        &bull; {q.questionType}
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-snug">
                    {q.question}
                  </p>

                  {hasAnswer ? (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 line-clamp-2 italic">
                      &ldquo;{ans.answerText}&rdquo;
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700 dark:text-amber-400/90 italic">
                      No explanation provided yet.
                    </p>
                  )}
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => onNavigateQuestion(qNum)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      isEvaluated
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : hasAnswer
                        ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                    }`}
                  >
                    <span>{isEvaluated ? 'View / Revise' : hasAnswer ? 'Edit Answer' : 'Answer Question'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Final Action Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToInterview}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Questions</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleFinishClick}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-extrabold shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Final Report...</span>
            </>
          ) : (
            <>
              <span>Finish Interview →</span>
            </>
          )}
        </button>
      </div>

      {/* Confirmation Modal if Skipped Questions exist */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Finish Interview?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                You have skipped {skippedCount} question{skippedCount > 1 ? 's' : ''}. Are you sure you want to finish?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  onSubmitFinal();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Finish Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
