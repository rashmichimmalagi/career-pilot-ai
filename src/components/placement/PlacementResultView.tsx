import React, { useState } from 'react';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  SkipForward,
  Clock,
  Target,
  BarChart2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  History,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import { PlacementTestSession, TopicPerformance } from '../../types/placement';

interface PlacementResultViewProps {
  session: PlacementTestSession;
  onPracticeWeakTopic: (topic: string, subject: string, category: 'Aptitude' | 'Technical') => void;
  onRetakeTest: () => void;
  onNewSession: () => void;
  onViewHistory: () => void;
  onBackToCompanyPrep?: () => void;
}

export const PlacementResultView: React.FC<PlacementResultViewProps> = ({
  session,
  onPracticeWeakTopic,
  onRetakeTest,
  onNewSession,
  onViewHistory,
  onBackToCompanyPrep,
}) => {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [filterReview, setFilterReview] = useState<'all' | 'correct' | 'incorrect' | 'skipped'>('all');

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const toggleExpand = (qNum: number) => {
    setExpandedQuestion((prev) => (prev === qNum ? null : qNum));
  };

  // Filter questions
  const filteredQuestions = session.questions.filter((q) => {
    const ans = session.answers[q.questionNumber];
    if (filterReview === 'correct') return ans?.isCorrect;
    if (filterReview === 'incorrect') return ans && !ans.isCorrect && !ans.isSkipped && ans.selectedOption !== null;
    if (filterReview === 'skipped') return !ans || ans.isSkipped || ans.selectedOption === null;
    return true;
  });

  const topicEntries = Object.values(session.topicBreakdown || {}) as TopicPerformance[];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      
      {/* Top Banner / Scorecard */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900/10 via-slate-100 to-white dark:from-indigo-950/80 dark:via-slate-900 dark:to-slate-950 border border-indigo-500/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[350px] h-[250px] bg-indigo-500/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {onBackToCompanyPrep ? (
                <button
                  type="button"
                  onClick={onBackToCompanyPrep}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200 dark:border-indigo-800/80 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs mr-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Company Preparation</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNewSession}
                  className="p-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer mr-1"
                  title="Exit Test"
                  aria-label="Exit Test"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                <span>Placement Assessment Scorecard</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs">
                {session.formattedDate || 'Completed Just Now'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {session.subject} · {session.topic}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
              Category: <span className="font-semibold text-slate-800 dark:text-slate-200">{session.category}</span> · Difficulty: <span className="font-semibold text-slate-800 dark:text-slate-200">{session.difficulty}</span> · Mode: <span className="font-semibold text-slate-800 dark:text-slate-200">{session.mode === 'timed' ? 'Timed Test' : 'Practice Mode'}</span>
            </p>
          </div>

          {/* Big Score Dial */}
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs shrink-0">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Final Score</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {session.score}%
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {session.correctCount} / {session.totalQuestions} Correct
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Accuracy</span>
            <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {session.accuracy}%
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Time Taken</span>
            <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              {formatTime(session.timeTakenSeconds)}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Incorrect</span>
            <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
              {session.incorrectCount}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Skipped</span>
            <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              {session.skippedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Weak Topic Detection Alert & Direct Action */}
      {session.weakestTopic && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Weak Area Detected: <span className="text-amber-600 dark:text-amber-400">{session.weakestTopic.topic}</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                  {session.weakestTopic.accuracy}% Accuracy
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                You had {session.weakestTopic.incorrect} incorrect or skipped questions in this topic. Strengthen your fundamentals with a targeted practice drill.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onPracticeWeakTopic(
                session.weakestTopic!.topic,
                session.subject,
                session.category
              )
            }
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Practice Weak Topic</span>
          </button>
        </div>
      )}

      {/* Topic-Wise Performance Breakdown */}
      {topicEntries.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            <span>Topic-Wise Breakdown</span>
          </h2>

          <div className="space-y-3">
            {topicEntries.map((tb) => (
              <div key={tb.topic} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{tb.topic}</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    {tb.correct}/{tb.total} ({tb.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      tb.percentage >= 80
                        ? 'bg-emerald-500'
                        : tb.percentage >= 50
                        ? 'bg-indigo-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.max(5, tb.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question-By-Question Detailed Review */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Question Solutions & Explanations</span>
            </h2>
            <p className="text-xs text-slate-500">
              Review every problem with step-by-step mathematical calculations and CS conceptual rationales.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            {(
              [
                { key: 'all', label: `All (${session.totalQuestions})` },
                { key: 'correct', label: `Correct (${session.correctCount})` },
                { key: 'incorrect', label: `Incorrect (${session.incorrectCount})` },
                { key: 'skipped', label: `Skipped (${session.skippedCount})` },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterReview(key)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  filterReview === key
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const ans = session.answers[q.questionNumber];
            const isCorrect = ans?.isCorrect;
            const isSkipped = !ans || ans.isSkipped || ans.selectedOption === null;
            const isExpanded = expandedQuestion === q.questionNumber;

            return (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 overflow-hidden"
              >
                <div
                  onClick={() => toggleExpand(q.questionNumber)}
                  className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                      isCorrect
                        ? 'bg-emerald-500 text-white'
                        : isSkipped
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}>
                      Q{q.questionNumber}
                    </span>

                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                        {q.question}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>Topic: {q.topic}</span>
                        <span>·</span>
                        <span>Your choice: {ans?.selectedOption ? `Option ${ans.selectedOption}` : 'Skipped'}</span>
                        <span>·</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">Correct: Option {q.correctOption}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isCorrect ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        Correct
                      </span>
                    ) : isSkipped ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                        Skipped
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                        Incorrect
                      </span>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                    
                    {/* Full Question Text */}
                    <div className="space-y-2">
                      <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Question:</span>
                      <p className="text-sm text-slate-800 dark:text-slate-200">{q.question}</p>
                      
                      {q.codeSnippet && (
                        <div className="rounded-xl bg-slate-950 p-3 font-mono text-xs text-slate-200 border border-slate-800 overflow-x-auto">
                          <pre>{q.codeSnippet}</pre>
                        </div>
                      )}
                    </div>

                    {/* 4 Options breakdown */}
                    <div className="space-y-1.5 pt-1">
                      <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Options:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                          const isCorrectOpt = optKey === q.correctOption;
                          const isSelectedOpt = ans?.selectedOption === optKey;

                          let border = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50';
                          if (isCorrectOpt) {
                            border = 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 font-semibold';
                          } else if (isSelectedOpt && !isCorrectOpt) {
                            border = 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100';
                          }

                          return (
                            <div
                              key={optKey}
                              className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${border}`}
                            >
                              <span className="font-bold font-mono">{optKey}.</span>
                              <span className="flex-1">{q.options[optKey]}</span>
                              {isCorrectOpt && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />}
                              {isSelectedOpt && !isCorrectOpt && <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Detailed Explanation */}
                    <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 space-y-1.5">
                      <span className="font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 text-[10px] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Step-by-Step Solution & Rationale:</span>
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {q.explanation}
                      </p>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onViewHistory}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <History className="w-4 h-4 text-indigo-600" />
            <span>View All Past Tests</span>
          </button>

          {onBackToCompanyPrep && (
            <button
              type="button"
              onClick={onBackToCompanyPrep}
              className="px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Company Preparation</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRetakeTest}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake This Configuration</span>
          </button>

          <button
            type="button"
            onClick={onNewSession}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <span>Practice Another Topic</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
