import React, { useState, useEffect, useMemo } from 'react';
import {
  Bot,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Code2,
  BookOpen,
  Layers,
  CheckCircle2,
  Loader2,
  Terminal,
  FileText,
  AlertCircle,
  Check,
  AlertTriangle,
  Lightbulb,
  Target,
  RefreshCw,
  FastForward,
} from 'lucide-react';
import {
  InterviewQuestion,
  RecordedAnswer,
  QuestionStatus,
  TechnicalInterviewConfig,
  AnswerEvaluation,
} from '../../types/interview';
import { useAuth } from '../../context/AuthContext';

interface InterviewQuestionViewProps {
  question: InterviewQuestion;
  questionsList: InterviewQuestion[];
  config: TechnicalInterviewConfig;
  savedAnswer?: string;
  savedEvaluation?: AnswerEvaluation;
  recordedAnswers: Record<number, RecordedAnswer>;
  questionStatuses: Record<number, QuestionStatus>;
  isEvaluating?: boolean;
  evaluationError?: string | null;
  onSubmitAnswer: (questionNumber: number, answerText: string) => Promise<void>;
  onSkipQuestion: () => void;
  onSaveAnswer: (questionNumber: number, answerText: string) => void;
  onNavigateQuestion: (targetQuestionNum: number) => void;
  onPreviousQuestion: () => void;
  onNextQuestion: (currentDraftText: string) => void;
  onReviewInterview: () => void;
  onExit: () => void;
  onRestart: () => void;
}

export const InterviewQuestionView: React.FC<InterviewQuestionViewProps> = ({
  question,
  questionsList,
  config,
  savedAnswer = '',
  savedEvaluation,
  recordedAnswers,
  questionStatuses,
  isEvaluating = false,
  evaluationError = null,
  onSubmitAnswer,
  onSkipQuestion,
  onSaveAnswer,
  onNavigateQuestion,
  onPreviousQuestion,
  onNextQuestion,
  onReviewInterview,
  onExit,
  onRestart,
}) => {
  const { showToast } = useAuth();

  // Local active textarea state initialized to existing saved answer
  const [answerText, setAnswerText] = useState(savedAnswer);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  const notifyBlockedPaste = () => {
    showToast(
      '🚫 Copy & Paste Not Allowed',
      'Please type your answer manually.',
      'warning',
      undefined,
      2500
    );
  };

  // Sync textarea whenever switching to a different question
  useEffect(() => {
    setAnswerText(savedAnswer || '');
    setValidationError(null);
    setIsSavedFeedback(false);
  }, [question.id, question.questionNumber, savedAnswer]);

  const currentQNum = question.questionNumber;
  const totalQuestions = question.totalQuestions || Number(config.questionCount) || questionsList.length || 5;
  const isFirstQuestion = currentQNum <= 1;
  const isLastQuestion = currentQNum >= totalQuestions;
  const rawLanguage = question.language || config.language || '';
  const isLanguageApplicable =
    Boolean(rawLanguage) &&
    rawLanguage !== 'Not Required' &&
    rawLanguage !== 'None' &&
    rawLanguage !== 'not_applicable';
  const activeLanguage = isLanguageApplicable ? rawLanguage : '';

  // Check if current question has an existing evaluation
  const activeEvaluation: AnswerEvaluation | undefined =
    savedEvaluation || recordedAnswers[currentQNum]?.evaluation;
  const isEvaluated = !!activeEvaluation && questionStatuses[currentQNum] === 'EVALUATED';

  // Check if candidate modified the text after it was evaluated
  const isModifiedSinceEvaluation =
    isEvaluated &&
    recordedAnswers[currentQNum]?.answerText &&
    answerText.trim() !== recordedAnswers[currentQNum]?.answerText.trim();

  const wordCount = useMemo(() => {
    const trimmed = answerText.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [answerText]);

  const charCount = answerText.length;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setAnswerText(val);
    if (validationError && val.trim()) {
      setValidationError(null);
    }
    // Auto-save on change so student never loses text when navigating
    onSaveAnswer(currentQNum, val);
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAnswer(currentQNum, answerText);
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2500);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = answerText.trim();
    if (!trimmed) {
      setValidationError('Please enter your answer before submitting.');
      showToast(
        '⚠️ Empty Answer',
        'Please enter your answer before submitting.',
        'warning',
        undefined,
        3000
      );
      return;
    }

    setValidationError(null);
    await onSubmitAnswer(currentQNum, answerText);
  };

  const handleSkip = () => {
    setValidationError(null);
    onSkipQuestion();
  };

  const handleNextClick = () => {
    onNextQuestion(answerText);
  };

  const getDifficultyBadgeColor = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
      case 'Hard':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
      case 'Medium':
      default:
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
    }
  };

  const getScoreRubric = (score: number) => {
    if (score >= 10) {
      return {
        label: 'Excellent, complete interview-level answer',
        color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700',
        badge: 'bg-emerald-600 text-white',
        barColor: 'bg-emerald-500',
      };
    }
    if (score >= 9) {
      return {
        label: 'Very strong answer',
        color: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700',
        badge: 'bg-purple-600 text-white',
        barColor: 'bg-purple-500',
      };
    }
    if (score >= 7) {
      return {
        label: 'Good understanding',
        color: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700',
        badge: 'bg-indigo-600 text-white',
        barColor: 'bg-indigo-500',
      };
    }
    if (score >= 5) {
      return {
        label: 'Partially correct',
        color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700',
        badge: 'bg-amber-600 text-white',
        barColor: 'bg-amber-500',
      };
    }
    if (score >= 3) {
      return {
        label: 'Limited understanding',
        color: 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 border-orange-300 dark:border-orange-700',
        badge: 'bg-orange-600 text-white',
        barColor: 'bg-orange-500',
      };
    }
    return {
      label: 'Very weak / incorrect answer',
      color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700',
      badge: 'bg-rose-600 text-white',
      barColor: 'bg-rose-500',
    };
  };

  const answeredCount = (Object.values(recordedAnswers) as RecordedAnswer[]).filter(
    (a) => !a?.isSkipped && a?.answerText && a.answerText.trim()
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Top Session Progress Bar & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
              Live Mock Interview
            </span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
              Question {currentQNum} of {totalQuestions}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-48 sm:w-64 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(8, (currentQNum / totalQuestions) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReviewInterview}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-indigo-200 dark:border-indigo-800"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>
              Review ({answeredCount}/{totalQuestions})
            </span>
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={onExit}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* Question Number Palette / Fast Navigation Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Jump to Question:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((qNum) => {
            const isCurrent = qNum === currentQNum;
            const ans = recordedAnswers[qNum];
            const qEval = ans?.evaluation;
            const isQEvaluated = questionStatuses[qNum] === 'EVALUATED' || (!!qEval && ans?.isEvaluated);
            const hasAnswer = ans && !ans.isSkipped && ans.answerText && ans.answerText.trim().length > 0;
            const isSkipped = ans?.isSkipped || questionStatuses[qNum] === 'SKIPPED';

            let btnClass =
              'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700';
            if (isCurrent) {
              btnClass =
                'bg-indigo-600 text-white ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 font-black';
            } else if (isQEvaluated) {
              btnClass =
                'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25';
            } else if (hasAnswer) {
              btnClass =
                'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 hover:bg-blue-500/25';
            } else if (isSkipped) {
              btnClass =
                'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25';
            }

            return (
              <button
                key={qNum}
                type="button"
                onClick={() => onNavigateQuestion(qNum)}
                className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${btnClass}`}
                title={`Question ${qNum}: ${
                  isQEvaluated
                    ? `Evaluated (${qEval?.score ?? '?'}/10)`
                    : hasAnswer
                    ? 'Draft Saved'
                    : isSkipped
                    ? 'Skipped'
                    : 'Not Answered'
                }`}
              >
                {isQEvaluated && !isCurrent ? (
                  <>
                    <span className="text-[10px]">✓</span>
                    <span>Q{qNum}</span>
                    {qEval && (
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                        {qEval.score}
                      </span>
                    )}
                  </>
                ) : hasAnswer && !isCurrent ? (
                  <>
                    <span className="text-[10px]">✎</span>
                    <span>Q{qNum}</span>
                  </>
                ) : isSkipped && !isCurrent ? (
                  <>
                    <span className="text-[10px]">—</span>
                    <span>Q{qNum}</span>
                  </>
                ) : (
                  <span>Q{qNum}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Evaluated
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Skipped
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Current
          </span>
        </div>
      </div>

      {/* Interviewer Persona Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-900/10 via-purple-900/5 to-slate-900/10 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900/60 border border-indigo-200/60 dark:border-indigo-800/60 shadow-sm space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-[2px] shadow-md shadow-indigo-500/20 shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Bot className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                AI Technical Interviewer
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                Senior Engineering Bar Raiser
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic">
              &ldquo;{question.interviewerGreeting || 'Take your time and explain your reasoning clearly.'}&rdquo;
            </p>
          </div>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40 text-xs">
          <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Subject: {question.subject}</span>
          </span>

          <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Topic: {question.topic}</span>
          </span>

          <span
            className={`px-2.5 py-1 rounded-xl font-bold border ${getDifficultyBadgeColor(
              question.difficulty
            )}`}
          >
            Difficulty: {question.difficulty}
          </span>

          {activeLanguage && (
            <span className="px-2.5 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5 border border-cyan-200 dark:border-cyan-800">
              <Terminal className="w-3.5 h-3.5 text-cyan-500" />
              <span>Language: {activeLanguage}</span>
            </span>
          )}

          {question.questionType && (
            <span className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 border border-purple-200 dark:border-purple-800">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Type: {question.questionType}</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Question Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Code2 className="w-4 h-4" />
              <span>Question {currentQNum} of {totalQuestions}</span>
            </div>

            {isEvaluated && activeEvaluation && (
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Evaluated ({activeEvaluation.score}/10)</span>
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
            {question.question}
          </h3>
        </div>

        {/* Code Snippet if present */}
        {question.codeSnippet && (
          <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden space-y-0 shadow-inner">
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reference Snippet ({activeLanguage})</span>
              </span>
            </div>
            <pre className="p-4 text-xs sm:text-sm font-mono text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
              <code>{question.codeSnippet}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Candidate Answer Workspace */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Your Answer / Explanation</span>
              {isEvaluated && !isModifiedSinceEvaluation && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Evaluated
                </span>
              )}
              {isModifiedSinceEvaluation && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Edited (Unsubmitted changes)
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Explain your reasoning clearly, mentioning time/space complexities, mechanisms, and edge cases.
            </p>
          </div>

          {isSavedFeedback && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Draft Saved</span>
            </span>
          )}
        </div>

        <div className="space-y-4">
          <textarea
            id={`interview-answer-input-q${currentQNum}`}
            rows={8}
            value={answerText}
            disabled={isEvaluating}
            onChange={handleTextChange}
            onPaste={(e) => {
              e.preventDefault();
              notifyBlockedPaste();
            }}
            onDrop={(e) => {
              e.preventDefault();
              notifyBlockedPaste();
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'v' || e.code === 'KeyV')) {
                e.preventDefault();
                notifyBlockedPaste();
              } else if (e.shiftKey && (e.key === 'Insert' || e.code === 'Insert')) {
                e.preventDefault();
                notifyBlockedPaste();
              }
            }}
            placeholder="Type your answer here... (Explain definitions, memory layout, steps, and time/space complexity)"
            className={`w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border text-sm font-sans text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-y leading-relaxed ${
              validationError
                ? 'border-rose-500 ring-1 ring-rose-500/30'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          />

          {/* Validation Error Message */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Evaluation Error Banner with Retry */}
          {evaluationError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
                <span className="font-semibold">{evaluationError}</span>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Evaluation</span>
              </button>
            </div>
          )}

          {/* Answer Counter directly below textarea */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 font-medium px-1">
            <span>
              {wordCount} words &bull; {charCount} chars
            </span>
            <span className="text-[11px] text-slate-400">
              {wordCount > 0 ? '✓ Auto-saving draft' : 'Type your answer or click Skip'}
            </span>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Left: Previous Button */}
            <button
              type="button"
              disabled={isFirstQuestion || isEvaluating}
              onClick={onPreviousQuestion}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {/* Middle & Right Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
              {/* Skip Question Button */}
              <button
                type="button"
                disabled={isEvaluating}
                onClick={handleSkip}
                className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Skip this question without calling AI evaluation"
              >
                <FastForward className="w-4 h-4 text-slate-400" />
                <span>Skip</span>
              </button>

              {/* Submit Answer / Submit Revision Button */}
              <button
                id="btn-submit-interview-answer"
                type="button"
                disabled={isEvaluating}
                onClick={handleSubmit}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Evaluating...</span>
                  </>
                ) : isEvaluated && !isModifiedSinceEvaluation ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Re-evaluate Answer</span>
                  </>
                ) : isModifiedSinceEvaluation ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Submit Revision →</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Submit Answer →</span>
                  </>
                )}
              </button>

              {/* Next Question / Review button */}
              {!isLastQuestion ? (
                <button
                  type="button"
                  disabled={isEvaluating}
                  onClick={handleNextClick}
                  className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isEvaluating}
                  onClick={onReviewInterview}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <span>View Interview Results →</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🤖 AI INTERVIEWER FEEDBACK SECTION (Phase 3 Core Evaluation Display) */}
      {isEvaluated && activeEvaluation && (
        <div
          id={`ai-feedback-q${currentQNum}`}
          className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500/40 dark:border-indigo-500/40 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {/* Feedback Header with Score & Visual Scale */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white shrink-0">
                <Bot className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    🤖 AI Interviewer Feedback
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Detailed evaluation of your answer for Question {currentQNum}
                </p>
              </div>
            </div>

            {/* Score Display & Rubric Badge */}
            <div className="flex flex-col items-start md:items-end gap-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Score:
                </span>
                <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {activeEvaluation.score}
                  <span className="text-base font-bold text-slate-400">/10</span>
                </span>
              </div>

              {/* Rubric Status Pill */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  getScoreRubric(activeEvaluation.score).color
                }`}
              >
                {getScoreRubric(activeEvaluation.score).label}
              </span>
            </div>
          </div>

          {/* Visual Score Meter (0 to 10 scale) */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Score Breakdown (0 to 10 Scale)</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {activeEvaluation.score * 10}% Performance
              </span>
            </div>

            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  getScoreRubric(activeEvaluation.score).barColor
                }`}
                style={{ width: `${Math.max(5, (activeEvaluation.score / 10) * 100)}%` }}
              />
            </div>

            {/* Scale Reference Points */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
              <span>0 (Weak)</span>
              <span>5 (Partially Correct)</span>
              <span>8 (Good)</span>
              <span>10 (Excellent)</span>
            </div>
          </div>

          {/* Correctness Summary Statement */}
          {activeEvaluation.correctness && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-1">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wide">
                Evaluation Summary
              </span>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {activeEvaluation.correctness}
              </p>
            </div>
          )}

          {/* Evaluation Structured Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ✅ What you did well */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-extrabold text-sm">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>✅ What you did well</span>
              </div>

              {Array.isArray(activeEvaluation.strengths) && activeEvaluation.strengths.length > 0 ? (
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  {activeEvaluation.strengths.map((st, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-emerald-500 font-bold mt-0.5">•</span>
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Your answer demonstrates baseline understanding.
                </p>
              )}
            </div>

            {/* ⚠️ What could be improved */}
            <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>⚠️ What could be improved</span>
              </div>

              {activeEvaluation.improvement ? (
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeEvaluation.improvement}
                </p>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Include explicit Big-O complexities and discuss underlying memory mechanisms.
                </p>
              )}
            </div>
          </div>

          {/* 💡 Missing Points */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-extrabold text-sm">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
              <span>💡 Missing points</span>
            </div>

            {Array.isArray(activeEvaluation.missing_points) && activeEvaluation.missing_points.length > 0 ? (
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {activeEvaluation.missing_points.map((mp, mIdx) => (
                  <li key={mIdx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-amber-500 font-bold mt-0.5">•</span>
                    <span>{mp}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                No major omissions found. Excellent technical completeness.
              </p>
            )}
          </div>

          {/* 🎯 Interview Tip */}
          {activeEvaluation.interview_tip && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-cyan-500/10 border border-purple-200/80 dark:border-purple-900/40 space-y-2">
              <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-extrabold text-sm">
                <Target className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>🎯 Interview Tip</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {activeEvaluation.interview_tip}
              </p>
            </div>
          )}

          {/* Feedback Bottom Actions: Next Question / Review */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Evaluation saved. You can revise your answer above or proceed to the next question.
            </span>

            {!isLastQuestion ? (
              <button
                id="btn-next-question-evaluated"
                type="button"
                onClick={handleNextClick}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="btn-review-interview-evaluated"
                type="button"
                onClick={onReviewInterview}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>View Interview Results →</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
