import React, { useState } from 'react';
import {
  Trophy,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Layers,
  Code2,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  BrainCircuit,
  Target,
  Lightbulb,
  AlertTriangle,
  Award,
  BarChart3,
  Calendar,
  History,
  Terminal,
  Bot,
  Calculator,
  MinusCircle,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import {
  MockInterviewReport,
  RecordedAnswer,
  TechnicalInterviewConfig,
} from '../../types/interview';

interface InterviewResultsViewProps {
  report: MockInterviewReport;
  config?: TechnicalInterviewConfig;
  onRestart: () => void;
  onNavigateDashboard: () => void;
  onBackToHistory?: () => void;
}

export const InterviewResultsView: React.FC<InterviewResultsViewProps> = ({
  report,
  config,
  onRestart,
  onNavigateDashboard,
  onBackToHistory,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const getVerdictBadge = (verdict?: string) => {
    switch (verdict) {
      case 'Excellent':
        return {
          bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
          label: '★ Excellent Technical Demonstration',
        };
      case 'Strong Pass':
        return {
          bg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
          label: '✓ Strong Technical Foundation',
        };
      case 'Pass with Recommendations':
        return {
          bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
          label: '▲ Solid Concepts with Recommendations',
        };
      case 'Needs Practice':
      default:
        return {
          bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
          label: '● Recommended for Further Practice',
        };
    }
  };

  const verdictStyle = getVerdictBadge(report.verdict);

  const totalQuestions = report.questionCount || report.question_count || 5;
  const answeredCount = report.questionsAnswered !== undefined ? report.questionsAnswered : (report.answered_count || 0);
  const skippedCount = report.questionsSkipped !== undefined ? report.questionsSkipped : (report.skipped_count || (totalQuestions - answeredCount));

  // Score details
  const calcDetails = report.scoreCalculationDetails;
  const overallScore = report.overallScore !== undefined ? report.overallScore : (report.overall_score || 0);
  const techScore = report.technicalKnowledgeScore !== undefined ? report.technicalKnowledgeScore : (report.technical_score || overallScore);
  const problemScore = report.problemSolvingScore !== undefined ? report.problemSolvingScore : (report.problem_solving_score || overallScore);
  const commScore = report.communicationScore !== undefined ? report.communicationScore : (report.communication_score || overallScore);

  // Recommendations
  const primaryRecommendation = report.recommendation || (report.aiRecommendations && report.aiRecommendations[0]) || '';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Top Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-slate-900/20 dark:from-indigo-950/60 dark:via-purple-950/40 dark:to-slate-900/80 border border-indigo-200/60 dark:border-indigo-800/60 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-100/60 dark:border-indigo-900/40">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-600 p-[2px] shadow-lg shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Trophy className="w-7 h-7 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${verdictStyle.bg}`}>
                  {verdictStyle.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{report.formattedDate || new Date().toLocaleDateString()}</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                🎤 Technical Mock Interview Report
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onBackToHistory && (
              <button
                type="button"
                onClick={onBackToHistory}
                className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-xs"
              >
                <History className="w-3.5 h-3.5 text-indigo-500" />
                <span>Previous Interviews</span>
              </button>
            )}
            <button
              type="button"
              onClick={onRestart}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Practice Again</span>
            </button>
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>

        {/* Section 3: Overall Score and Core Sub-scores */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Main Overall Score Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/30 dark:border-indigo-500/40 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Overall Score
              </span>
              <Award className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-1.5 my-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                {overallScore}
              </span>
              <span className="text-sm font-bold text-slate-400">/ 100</span>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, overallScore)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {answeredCount} of {totalQuestions} answered &bull; {skippedCount} skipped
              </p>
            </div>
          </div>

          {/* Technical Knowledge */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-bold">Technical Knowledge</span>
              <Code2 className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="flex items-baseline gap-1.5 my-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {techScore}
              </span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, techScore)}%` }}
              />
            </div>
          </div>

          {/* Problem Solving */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-bold">Problem Solving</span>
              <BrainCircuit className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-1.5 my-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {problemScore}
              </span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, problemScore)}%` }}
              />
            </div>
          </div>

          {/* Communication / Explanation */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-bold">Communication</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1.5 my-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {commScore}
              </span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, commScore)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Section 8: Score Calculation Breakdown & Configuration Bar */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md font-mono font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                {report.subject}
              </span>
              <span className="px-2.5 py-0.5 rounded-md font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                {report.topic}
              </span>
              <span className="px-2.5 py-0.5 rounded-md font-mono font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                {report.language && report.language !== 'Not Required' && report.language !== 'None'
                  ? `${report.language} (${report.difficulty})`
                  : report.difficulty}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-emerald-700 dark:text-emerald-400">
                ✓ {answeredCount} / {totalQuestions} answered
              </span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-amber-700 dark:text-amber-400">
                — {skippedCount} skipped
              </span>
            </div>
          </div>

          {calcDetails && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>
                <strong>Score Calculation:</strong> {calcDetails.formulaText}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Section 4 & 5: Strengths and Areas to Improve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 4: STRENGTHS */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                Strengths
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                2-5 key areas where your answers demonstrated solid understanding
              </p>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            {report.strengths && report.strengths.length > 0 ? (
              report.strengths.map((str, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30"
                >
                  <span className="text-emerald-600 dark:text-emerald-400 font-black shrink-0">✓</span>
                  <span className="leading-relaxed font-medium">{str}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500 italic p-3">No specific strengths recorded.</li>
            )}
          </ul>
        </div>

        {/* Section 5: AREAS TO IMPROVE */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                Areas to Improve
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                2-5 specific conceptual and communication improvements
              </p>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            {(report.areasForImprovement || report.areas_to_improve) &&
            (report.areasForImprovement || report.areas_to_improve)!.length > 0 ? (
              (report.areasForImprovement || report.areas_to_improve)!.map((imp, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30"
                >
                  <span className="text-amber-600 dark:text-amber-400 font-black shrink-0">•</span>
                  <span className="leading-relaxed font-medium">{imp}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500 italic p-3">No specific areas noted.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Section 6: QUESTION-BY-QUESTION PERFORMANCE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <span>Question-by-Question Performance ({report.questionEvaluations?.length || report.questions?.length || 0})</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Click any question to view recorded answer, score, strengths &amp; feedback
          </span>
        </div>

        <div className="space-y-3">
          {report.questionEvaluations && report.questionEvaluations.length > 0 ? (
            report.questionEvaluations.map((qe, idx) => {
              const isExpanded = expandedIndex === idx;
              const isSkipped = qe.status === 'SKIPPED' || !qe.answerText || !qe.answerText.trim();
              const scoreOutOf10 = qe.scoreOutOf10 !== undefined ? qe.scoreOutOf10 : (qe.score <= 10 ? qe.score : Math.round(qe.score / 10));

              return (
                <div
                  key={qe.questionNumber || idx}
                  className={`rounded-2xl border overflow-hidden transition-all ${
                    isSkipped
                      ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-200/80 dark:border-amber-900/40'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="w-full p-4 sm:p-5 flex items-start justify-between gap-4 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                          Question {qe.questionNumber}
                        </span>

                        {isSkipped ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1">
                            <span>— Skipped</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>✓ Answered &bull; Score: {scoreOutOf10}/10</span>
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-2">
                        {qe.questionText}
                      </p>
                    </div>

                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 mt-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 sm:p-6 pt-0 border-t border-slate-100 dark:border-slate-800/80 space-y-4 animate-in fade-in duration-200 text-xs sm:text-sm">
                      {/* Code Snippet if present */}
                      {qe.codeSnippet && (
                        <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 overflow-x-auto text-xs font-mono text-emerald-400">
                          <pre><code>{qe.codeSnippet}</code></pre>
                        </div>
                      )}

                      {/* Candidate Answer */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Your Recorded Answer:
                        </span>
                        <div
                          className={`p-4 rounded-xl border whitespace-pre-wrap leading-relaxed ${
                            isSkipped
                              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 italic'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {qe.answerText || '(Skipped — No answer recorded)'}
                        </div>
                      </div>

                      {/* What you did well */}
                      {qe.strengths && qe.strengths.length > 0 && (
                        <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 space-y-2">
                          <span className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>What you did well:</span>
                          </span>
                          <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                            {qe.strengths.map((s, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-2">
                                <span className="text-emerald-500 font-bold">•</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* What you missed */}
                      {((qe.missingPoints && qe.missingPoints.length > 0) || (qe.improvements && qe.improvements.length > 0)) && (
                        <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 space-y-2">
                          <span className="text-[11px] font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            <span>What you missed / Areas to improve:</span>
                          </span>
                          <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                            {(qe.missingPoints || qe.improvements).map((m, mIdx) => (
                              <li key={mIdx} className="flex items-start gap-2">
                                <span className="text-amber-500 font-bold">•</span>
                                <span>{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Evaluator Feedback & Tips */}
                      {(qe.feedback || qe.idealApproach || qe.interviewTip) && (
                        <div className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 space-y-2">
                          <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                            <BrainCircuit className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Improvement Feedback &amp; Ideal Approach:</span>
                          </span>
                          <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                            {qe.feedback || qe.idealApproach || qe.interviewTip}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-500 italic p-4">No detailed question evaluations available.</p>
          )}
        </div>
      </div>

      {/* Section 7: AI Interviewer Recommendation */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>🤖 AI Interviewer Recommendation</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalized guidance to elevate your technical mock performance
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-cyan-50/50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-cyan-950/30 border border-indigo-200/80 dark:border-indigo-900/50">
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {primaryRecommendation || `Your fundamentals in ${report.subject} (${report.topic}) are solid. Focus on proactively stating time and space complexity upfront and discussing edge cases to build high fluency for live interviews.`}
          </p>
        </div>

        {report.aiRecommendations && report.aiRecommendations.length > 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {report.aiRecommendations.slice(1).map((rec, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
              >
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {i + 2}
                </span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {onBackToHistory ? (
          <button
            type="button"
            onClick={onBackToHistory}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <History className="w-4 h-4 text-indigo-500" />
            <span>View All Previous Interviews</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onNavigateDashboard}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        )}

        <button
          type="button"
          onClick={onRestart}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-extrabold shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Practice Again</span>
        </button>
      </div>
    </div>
  );
};

