import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  SkipForward,
  AlertTriangle,
  HelpCircle,
  Layers,
  Sparkles,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  Send,
  Flag,
} from 'lucide-react';
import {
  PlacementAnswerRecord,
  PlacementMCQ,
  PlacementMode,
  PlacementPracticeConfig,
} from '../../types/placement';

interface PlacementQuestionViewProps {
  questions: PlacementMCQ[];
  config: PlacementPracticeConfig;
  onFinishTest: (answers: Record<number, PlacementAnswerRecord>, timeTakenSeconds: number) => void;
  onExit: () => void;
}

export const PlacementQuestionView: React.FC<PlacementQuestionViewProps> = ({
  questions,
  config,
  onFinishTest,
  onExit,
}) => {
  const totalQuestions = questions.length;
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentQuestion = questions[currentIndex] || questions[0];

  // Answers record state: questionNumber -> PlacementAnswerRecord
  const [answers, setAnswers] = useState<Record<number, PlacementAnswerRecord>>({});

  // Practice mode explanation reveal tracking (questionNumber -> boolean)
  const [revealedInPractice, setRevealedInPractice] = useState<Record<number, boolean>>({});

  // Submission lock & idempotency
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);

  // Determine mode
  // Mode 2 (Practice Quiz): config.mode === 'practice' (immediate feedback, locked per question)
  // Mode 1 (Placement Practice): config.mode === 'timed' or assessment test (record selection, change allowed, review, evaluate on final submit)
  const isPracticeQuiz = config.mode === 'practice';
  const isPlacementPractice = !isPracticeQuiz;

  // Timer state
  const isTimedMode = config.mode === 'timed';
  const initialTimeSeconds = (config.timeLimitMinutes || Math.max(1, Math.round(totalQuestions * 1.5))) * 60;
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(initialTimeSeconds);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState<boolean>(false);
  const [isQuestionPaletteOpen, setIsQuestionPaletteOpen] = useState<boolean>(false);

  // Time remaining countdown for timed mode, elapsed time for practice mode
  useEffect(() => {
    if (isSubmitted) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);

      if (isTimedMode) {
        setTimeRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Auto submit when timer runs out
            handleAutoSubmitOnTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimedMode, isSubmitted]);

  const evaluateAllAnswersOnSubmit = useCallback(
    (currentAnswersMap: Record<number, PlacementAnswerRecord>) => {
      const finalAnswers: Record<number, PlacementAnswerRecord> = {};
      questions.forEach((q) => {
        const existing = currentAnswersMap[q.questionNumber];
        if (existing && !existing.isSkipped && existing.selectedOption !== null) {
          // In Placement Practice or Practice Quiz, evaluate the candidate's last chosen option against the correct option
          const isCorrect = existing.selectedOption === q.correctOption;
          finalAnswers[q.questionNumber] = {
            questionNumber: q.questionNumber,
            selectedOption: existing.selectedOption,
            isSkipped: false,
            isCorrect,
            timeSpentSeconds: existing.timeSpentSeconds || 0,
          };
        } else {
          finalAnswers[q.questionNumber] = {
            questionNumber: q.questionNumber,
            selectedOption: null,
            isSkipped: true,
            isCorrect: false,
            timeSpentSeconds: 0,
          };
        }
      });
      return finalAnswers;
    },
    [questions]
  );

  const handleAutoSubmitOnTimeOut = useCallback(() => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitted(true);

    const finalAnswers = evaluateAllAnswersOnSubmit(answers);
    onFinishTest(finalAnswers, initialTimeSeconds);
  }, [answers, evaluateAllAnswersOnSubmit, initialTimeSeconds, onFinishTest]);

  // Handle option selection
  const handleSelectOption = (optionKey: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitted) return;
    const qNum = currentQuestion.questionNumber;

    if (isPracticeQuiz) {
      // MODE 2: PRACTICE QUIZ
      // If already answered, question is LOCKED - prevent altering the answer
      const existingAnswer = answers[qNum];
      if (existingAnswer && existingAnswer.selectedOption !== null) {
        return;
      }

      // Immediately evaluate and lock
      const isCorrect = optionKey === currentQuestion.correctOption;
      setAnswers((prev) => ({
        ...prev,
        [qNum]: {
          questionNumber: qNum,
          selectedOption: optionKey,
          isSkipped: false,
          isCorrect,
          timeSpentSeconds: prev[qNum]?.timeSpentSeconds || 0,
        },
      }));

      setRevealedInPractice((prev) => ({
        ...prev,
        [qNum]: true,
      }));
    } else {
      // MODE 1: PLACEMENT PRACTICE
      // Record selected option without evaluating yet
      // Student can change answer freely (A -> C -> B)
      // Only the last selected option is evaluated on final submit
      setAnswers((prev) => ({
        ...prev,
        [qNum]: {
          questionNumber: qNum,
          selectedOption: optionKey,
          isSkipped: false,
          isCorrect: false, // will be evaluated on final test submission
          timeSpentSeconds: prev[qNum]?.timeSpentSeconds || 0,
        },
      }));
    }
  };

  const handleClearOption = () => {
    if (isSubmitted) return;
    const qNum = currentQuestion.questionNumber;

    // In Practice Quiz mode, if locked, clearing is not allowed
    if (isPracticeQuiz && revealedInPractice[qNum]) {
      return;
    }

    setAnswers((prev) => {
      const next = { ...prev };
      delete next[qNum];
      return next;
    });
  };

  const handleSkipQuestion = () => {
    if (isSubmitted) return;
    const qNum = currentQuestion.questionNumber;

    // If practice mode and already answered, simply move to next question
    if (isPracticeQuiz && revealedInPractice[qNum]) {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
      return;
    }

    setAnswers((prev) => ({
      ...prev,
      [qNum]: {
        questionNumber: qNum,
        selectedOption: null,
        isSkipped: true,
        isCorrect: false,
        timeSpentSeconds: prev[qNum]?.timeSpentSeconds || 0,
      },
    }));

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentIndex(index);
    setIsQuestionPaletteOpen(false);
  };

  const handleSubmitConfirmed = () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitted(true);
    setIsSubmitModalOpen(false);

    // Evaluate all answers upon final submission
    const finalAnswers = evaluateAllAnswersOnSubmit(answers);
    const timeSpent = isTimedMode ? initialTimeSeconds - timeRemainingSeconds : elapsedSeconds;
    onFinishTest(finalAnswers, Math.max(1, timeSpent));
  };

  // Keyboard shortcut listener (A, B, C, D / 1, 2, 3, 4, ArrowLeft, ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or modal is open or submitted
      if (
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName) ||
        isSubmitModalOpen ||
        isExitModalOpen ||
        isSubmitted
      ) {
        return;
      }

      // If in practice mode and current question is already answered, do not process option keys
      const currentQNum = currentQuestion.questionNumber;
      const isCurrentLockedInPractice = isPracticeQuiz && Boolean(revealedInPractice[currentQNum]);

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        if (!isCurrentLockedInPractice) {
          handleSelectOption(key as 'A' | 'B' | 'C' | 'D');
        }
      } else if (key === '1') {
        if (!isCurrentLockedInPractice) handleSelectOption('A');
      } else if (key === '2') {
        if (!isCurrentLockedInPractice) handleSelectOption('B');
      } else if (key === '3') {
        if (!isCurrentLockedInPractice) handleSelectOption('C');
      } else if (key === '4') {
        if (!isCurrentLockedInPractice) handleSelectOption('D');
      } else if (e.key === 'ArrowRight' && currentIndex < totalQuestions - 1) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentQuestion, totalQuestions, isSubmitModalOpen, isExitModalOpen, isSubmitted, isPracticeQuiz, revealedInPractice]);

  // Status counts
  const answerList = Object.values(answers) as PlacementAnswerRecord[];
  const answeredCount = answerList.filter((a) => !a.isSkipped && a.selectedOption !== null).length;
  const skippedCount = answerList.filter((a) => a.isSkipped).length;
  const currentAnswerRecord = answers[currentQuestion.questionNumber];
  const isQuestionAnsweredInPractice = isPracticeQuiz && Boolean(revealedInPractice[currentQuestion.questionNumber]);

  // Format timer strings
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Timer urgency style
  const timerStyle = useMemo(() => {
    if (!isTimedMode) return 'text-slate-700 dark:text-slate-200';
    if (timeRemainingSeconds <= 30) {
      return 'text-rose-600 dark:text-rose-400 font-extrabold animate-pulse';
    }
    if (timeRemainingSeconds <= 120) {
      return 'text-amber-600 dark:text-amber-400 font-bold';
    }
    return 'text-indigo-600 dark:text-indigo-400 font-bold';
  }, [isTimedMode, timeRemainingSeconds]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Floating Action & Status Bar */}
      <div className="sticky top-20 z-30 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
        
        {/* Left: Exit & Subject Badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsExitModalOpen(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Exit Test"
            aria-label="Exit Test"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                config.difficulty === 'Easy'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : config.difficulty === 'Hard'
                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
              }`}>
                {config.difficulty}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-xs">
              {config.subject} · {currentQuestion.topic || config.topic}
            </p>
          </div>
        </div>

        {/* Center: Timer */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-sm">
          <Clock className={`w-4 h-4 ${timerStyle}`} />
          <span className={timerStyle}>
            {isTimedMode ? formatTime(timeRemainingSeconds) : formatTime(elapsedSeconds)}
          </span>
          <span className="text-[10px] uppercase font-sans font-semibold text-slate-400">
            {isTimedMode ? 'Remaining' : 'Elapsed'}
          </span>
        </div>

        {/* Right: Question Palette Toggle & Submit */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQuestionPaletteOpen(!isQuestionPaletteOpen)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Palette ({answeredCount}/{totalQuestions})</span>
            <span className="sm:hidden">{answeredCount}/{totalQuestions}</span>
          </button>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit</span>
          </button>
        </div>
      </div>

      {/* Question Palette Dropdown / Bar */}
      {isQuestionPaletteOpen && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-500/30 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Question Navigator
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Answered ({answeredCount})
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Skipped ({skippedCount})
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" /> Unanswered ({totalQuestions - answeredCount - skippedCount})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {questions.map((q, idx) => {
              const ans = answers[q.questionNumber];
              const isCurrent = idx === currentIndex;
              let bg = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

              if (ans?.selectedOption) {
                bg = 'bg-emerald-500 text-white border-emerald-600';
              } else if (ans?.isSkipped) {
                bg = 'bg-amber-500 text-white border-amber-600';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => handleJumpToQuestion(idx)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${bg} ${
                    isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 scale-105' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Question Content Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* Question Header & Subject Meta */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-extrabold text-sm flex items-center justify-center">
              Q{currentQuestion.questionNumber}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {currentQuestion.subject} · {currentQuestion.topic}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentAnswerRecord?.selectedOption && !isQuestionAnsweredInPractice && (
              <button
                onClick={handleClearOption}
                className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                title="Clear selected answer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear Choice</span>
              </button>
            )}
          </div>
        </div>

        {/* Question Text */}
        <div className="space-y-4">
          <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
            {currentQuestion.question}
          </p>

          {/* Optional Code Snippet */}
          {currentQuestion.codeSnippet && (
            <div className="rounded-2xl bg-slate-950 p-4 font-mono text-xs sm:text-sm text-slate-200 overflow-x-auto border border-slate-800">
              <pre>{currentQuestion.codeSnippet}</pre>
            </div>
          )}
        </div>

        {/* 4 Options (A, B, C, D) */}
        <div className="space-y-3 pt-2">
          {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
            const optText = currentQuestion.options[optKey];
            const isSelected = currentAnswerRecord?.selectedOption === optKey;
            const isCorrectOption = optKey === currentQuestion.correctOption;

            let optionClasses = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-800 dark:text-slate-200';

            if (isPlacementPractice) {
              // MODE 1: PLACEMENT PRACTICE
              // Highlight selected option cleanly. NO "Correct" / "Incorrect" / reveal feedback.
              if (isSelected) {
                optionClasses = 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/30 shadow-xs font-medium';
              }
            } else {
              // MODE 2: PRACTICE QUIZ
              // If answered/revealed, highlight correctness immediately and lock
              if (isQuestionAnsweredInPractice) {
                if (isCorrectOption) {
                  optionClasses = 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-semibold';
                } else if (isSelected && !isCorrectOption) {
                  optionClasses = 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 font-medium';
                } else {
                  optionClasses = 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 text-slate-400 dark:text-slate-500 opacity-60';
                }
              } else if (isSelected) {
                optionClasses = 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 shadow-xs';
              }
            }

            return (
              <button
                key={optKey}
                type="button"
                onClick={() => handleSelectOption(optKey)}
                disabled={isQuestionAnsweredInPractice || isSubmitted}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-4 relative group ${
                  isQuestionAnsweredInPractice ? 'cursor-default' : 'cursor-pointer'
                } ${optionClasses}`}
              >
                <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                  isPlacementPractice
                    ? isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/60'
                    : isQuestionAnsweredInPractice
                    ? isCorrectOption
                      ? 'bg-emerald-600 text-white'
                      : isSelected
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    : isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/60'
                }`}>
                  {optKey}
                </div>

                <div className="flex-1 pt-1 text-sm leading-snug">
                  {optText}
                </div>

                {isPracticeQuiz && isQuestionAnsweredInPractice && isCorrectOption && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-1" />
                )}

                {isPracticeQuiz && isQuestionAnsweredInPractice && isSelected && !isCorrectOption && (
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Practice Quiz Mode ONLY: Instant Explanation Banner */}
        {isPracticeQuiz && isQuestionAnsweredInPractice && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/60 dark:from-slate-900 dark:to-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentAnswerRecord?.isCorrect ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Correct Answer!</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Incorrect Choice (Correct: Option {currentQuestion.correctOption})</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Step-by-Step Rationale
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

      </div>

      {/* Bottom Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={handleSkipQuestion}
            className="px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 hover:bg-amber-100 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Skip Question</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {currentIndex < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-8 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Review & Submit Test</span>
            </button>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Submit Placement Practice?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You are about to submit your test answers for score calculation and detailed performance analysis.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Answered</span>
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{answeredCount}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Skipped</span>
                <p className="text-base font-extrabold text-amber-600 dark:text-amber-400">{skippedCount}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Unanswered</span>
                <p className="text-base font-extrabold text-slate-400">{totalQuestions - answeredCount - skippedCount}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Continue Solving
              </button>
              <button
                type="button"
                onClick={handleSubmitConfirmed}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Confirm & Submit
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  Leave this test?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your current answers will be lost if you leave.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsExitModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                Stay in Test
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExitModalOpen(false);
                  onExit();
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Leave Test
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
