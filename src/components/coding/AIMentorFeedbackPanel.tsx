import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Layers,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Zap,
  BookOpen,
  Award,
  Terminal,
  FileCode,
  Check
} from 'lucide-react';
import { AICodingMentorFeedback, SubmissionStatus } from '../../types/coding';

interface AIMentorFeedbackPanelProps {
  feedback: AICodingMentorFeedback | null;
  isLoading: boolean;
  onRequestNextHint?: (nextLevel: number) => void;
  onRefreshFeedback?: () => void;
  onClose?: () => void;
  isReviewMode?: boolean;
}

export const AIMentorFeedbackPanel: React.FC<AIMentorFeedbackPanelProps> = ({
  feedback,
  isLoading,
  onRequestNextHint,
  onRefreshFeedback,
  onClose,
  isReviewMode = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (isLoading) {
    return (
      <div
        id="ai-mentor-loading-panel"
        className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 shadow-xs transition-all animate-pulse"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                AI Coding Mentor
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                Analyzing Logic
              </span>
            </div>
            <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
              AI Mentor is analyzing your code, execution traces, and constraints...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return null;
  }

  // Handle Empty Code State
  if (feedback.isEmptyCode || feedback.status === 'empty_code') {
    return (
      <div
        id="ai-mentor-empty-code-panel"
        className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-3 transition-all"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 mt-0.5">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Write Your Solution First
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed font-sans">
              {feedback.emptyCodeMessage || 'Write your solution first to receive AI feedback.'}
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Suggested Next Step:
          </span>
          <p>
            Start by planning your function's inputs and outputs in the code editor, implement your algorithm, and click <strong>Run Code</strong> or <strong>Submit Solution</strong>.
          </p>
        </div>
      </div>
    );
  }

  const isAccepted = feedback.status === 'accepted' || isReviewMode;
  const isCompilationError = feedback.status === 'compilation_error';
  const isRuntimeError = feedback.status === 'runtime_error';
  const isTLE = feedback.status === 'time_limit_exceeded';

  const getStatusBadge = () => {
    if (isAccepted) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>Code Review</span>
        </span>
      );
    }
    if (isCompilationError) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 flex items-center gap-1">
          <Terminal className="w-3 h-3 text-rose-500" />
          <span>Compilation Guidance</span>
        </span>
      );
    }
    if (isRuntimeError) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-rose-500" />
          <span>Runtime Error Analysis</span>
        </span>
      );
    }
    if (isTLE) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-500" />
          <span>Complexity & TLE Optimization</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 flex items-center gap-1">
        <XCircle className="w-3 h-3 text-rose-500" />
        <span>Logic & Hint Guidance</span>
      </span>
    );
  };

  return (
    <div
      id="ai-coding-mentor-feedback-card"
      className="rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all text-xs"
    >
      {/* Header Bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-indigo-50/60 dark:from-indigo-950/50 dark:via-slate-900 dark:to-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs sm:text-sm">
                <span>AI Coding Mentor</span>
              </h3>
              {getStatusBadge()}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
              Educational feedback & progressive interview coaching
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onRefreshFeedback && (
            <button
              type="button"
              onClick={onRefreshFeedback}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Feedback"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Mentor' : 'Expand Mentor'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Body Content */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 font-sans leading-relaxed">
          
          {/* Section 1: What Went Wrong & Why It Happened */}
          {!isAccepted && (
            <div className="space-y-3">
              {feedback.whatWentWrong && (
                <div className="p-3.5 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-bold uppercase text-[10px] tracking-wider">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>What Went Wrong</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 text-xs font-normal">
                    {feedback.whatWentWrong}
                  </p>
                </div>
              )}

              {feedback.whyItHappened && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Why It Happened (Core Concept)</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-xs">
                    {feedback.whyItHappened}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Progressive Hinting Box */}
          {feedback.currentHint && !isAccepted && (
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-indigo-950 dark:text-indigo-200 font-bold text-xs">
                  <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>
                    Hint (Level {feedback.hintLevel || 1} of {feedback.maxHintLevel || 3})
                  </span>
                </div>

                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                  Progressive Guidance
                </span>
              </div>

              <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
                {feedback.currentHint}
              </p>

              {/* Next Hint Action Button */}
              {feedback.hasMoreHints && onRequestNextHint && (
                <div className="pt-2 flex items-center justify-between border-t border-indigo-200/60 dark:border-indigo-800/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Need more specific guidance?
                  </span>

                  <button
                    type="button"
                    id="get-another-hint-btn"
                    onClick={() => onRequestNextHint((feedback.hintLevel || 1) + 1)}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Get Another Hint (Level {(feedback.hintLevel || 1) + 1})</span>
                  </button>
                </div>
              )}

              {!feedback.hasMoreHints && (
                <div className="pt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>You have unlocked all progressive mentor hints for this problem.</span>
                </div>
              )}
            </div>
          )}

          {/* Section 3: What to Reconsider */}
          {feedback.whatToReconsider && !isAccepted && (
            <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold uppercase text-[10px] tracking-wider">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>What to Reconsider</span>
              </div>
              <p className="text-slate-800 dark:text-slate-200 text-xs">
                {feedback.whatToReconsider}
              </p>
            </div>
          )}

          {/* Section 4: Complexity Analysis */}
          {feedback.complexity && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Complexity Analysis
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 font-sans block">
                      Time Complexity:
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {feedback.complexity.currentTime}
                    </span>
                  </div>
                  {feedback.complexity.expectedTime && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-sans block">Target:</span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {feedback.complexity.expectedTime}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 font-sans block">
                      Space Complexity:
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {feedback.complexity.currentSpace}
                    </span>
                  </div>
                  {feedback.complexity.expectedSpace && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-sans block">Target:</span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {feedback.complexity.expectedSpace}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {feedback.complexity.explanation && (
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pl-1 font-sans">
                  {feedback.complexity.explanation}
                </p>
              )}
            </div>
          )}

          {/* Section 5: Edge Cases to Inspect */}
          {feedback.edgeCases && feedback.edgeCases.length > 0 && !isAccepted && (
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
                <span>Edge Cases to Inspect</span>
              </div>
              <ul className="space-y-1 pl-4 list-disc marker:text-indigo-500 text-slate-700 dark:text-slate-300 text-xs">
                {feedback.edgeCases.map((ec, idx) => (
                  <li key={idx}>{ec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 6: Actionable Next Step */}
          {feedback.nextStep && !isAccepted && (
            <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/20 flex items-start gap-2.5">
              <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                  Actionable Next Step
                </span>
                <p className="text-slate-800 dark:text-slate-200 text-xs font-medium">
                  {feedback.nextStep}
                </p>
              </div>
            </div>
          )}

          {/* Section 7: Code Review Mode (for Accepted Code) */}
          {isAccepted && feedback.codeReview && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider">
                  <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Code Quality & Readability</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 text-xs">
                  {feedback.codeReview.codeQuality}
                </p>
                {feedback.codeReview.readabilityNotes && (
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] pt-1">
                    {feedback.codeReview.readabilityNotes}
                  </p>
                )}
              </div>

              {feedback.codeReview.optimizationSuggestions &&
                feedback.codeReview.optimizationSuggestions.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Optimization & Polish Ideas
                    </span>
                    <ul className="space-y-1 pl-4 list-disc marker:text-indigo-500 text-slate-700 dark:text-slate-300 text-xs">
                      {feedback.codeReview.optimizationSuggestions.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {feedback.codeReview.interviewTips &&
                feedback.codeReview.interviewTips.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-500/20 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                      Technical Interview Takeaways
                    </span>
                    <ul className="space-y-1 pl-4 list-disc marker:text-indigo-500 text-slate-700 dark:text-slate-300 text-xs">
                      {feedback.codeReview.interviewTips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};
