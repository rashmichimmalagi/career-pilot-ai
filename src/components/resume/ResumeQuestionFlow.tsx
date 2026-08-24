import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  CheckCircle2,
  Bot,
  HelpCircle,
  FolderGit2,
  Briefcase,
  Wrench,
  Award,
  GraduationCap,
  FileText,
} from 'lucide-react';
import {
  ResumeImprovementQuestion,
  ResumeQuestionAnswer,
  ResumeSectionType,
} from '../../types/resume';

interface ResumeQuestionFlowProps {
  questions: ResumeImprovementQuestion[];
  initialAnswers?: ResumeQuestionAnswer[];
  targetRole: string;
  onComplete: (answers: ResumeQuestionAnswer[]) => void;
  onCancel: () => void;
}

export const ResumeQuestionFlow: React.FC<ResumeQuestionFlowProps> = ({
  questions,
  initialAnswers = [],
  targetRole,
  onComplete,
  onCancel,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answersMap, setAnswersMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    initialAnswers.forEach((a) => {
      if (a.answer) map[a.questionId] = a.answer;
    });
    return map;
  });
  const [skippedMap, setSkippedMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialAnswers.forEach((a) => {
      if (a.isSkipped) map[a.questionId] = true;
    });
    return map;
  });

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">No improvement questions available.</p>
        <button onClick={onCancel} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer">
          Return to Analysis
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex] || questions[0];
  const currentAnswer = answersMap[currentQ?.id] || '';

  const getSectionIcon = (section: ResumeSectionType) => {
    switch (section) {
      case 'projects':
        return <FolderGit2 className="w-4 h-4 text-indigo-500" />;
      case 'experience':
        return <Briefcase className="w-4 h-4 text-purple-500" />;
      case 'skills':
        return <Wrench className="w-4 h-4 text-amber-500" />;
      case 'achievements':
      case 'certifications':
        return <Award className="w-4 h-4 text-emerald-500" />;
      case 'education':
        return <GraduationCap className="w-4 h-4 text-blue-500" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-500" />;
    }
  };

  const handleAnswerChange = (val: string) => {
    setAnswersMap((prev) => ({ ...prev, [currentQ.id]: val }));
    if (skippedMap[currentQ.id]) {
      setSkippedMap((prev) => ({ ...prev, [currentQ.id]: false }));
    }
  };

  const handleSkip = () => {
    setSkippedMap((prev) => ({ ...prev, [currentQ.id]: true }));
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finalizeAnswers({ ...skippedMap, [currentQ.id]: true });
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finalizeAnswers(skippedMap);
    }
  };

  const finalizeAnswers = (latestSkipped: Record<string, boolean>) => {
    const compiled: ResumeQuestionAnswer[] = questions.map((q) => {
      const isSkipped = Boolean(latestSkipped[q.id] && !answersMap[q.id]?.trim());
      return {
        questionId: q.id,
        question: q.question,
        answer: (answersMap[q.id] || '').trim(),
        section: q.section,
        purpose: q.purpose,
        isSkipped,
      };
    });
    onComplete(compiled);
  };

  const totalAnswered = questions.filter(
    (q) => answersMap[q.id] && answersMap[q.id].trim().length > 0
  ).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      
      {/* Top AI Mentor Header Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-indigo-900/20 via-slate-900 to-indigo-950/80 border border-indigo-500/30 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 border border-indigo-400/30 flex items-center justify-center text-white shadow-lg shadow-indigo-600/40 shrink-0">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  AI Resume Mentor
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-mono font-semibold">
                  Target: {targetRole}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200/90 mt-0.5">
                Your resume has a few areas that could be stronger. I'll ask you a few questions and use your answers to improve it.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Exit Q&A
          </button>
        </div>

        {/* Step Question Nav Pill Bar */}
        <div className="mt-6 pt-4 border-t border-indigo-500/20 flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5">
            {questions.map((q, idx) => {
              const isAnswered = Boolean(answersMap[q.id]?.trim());
              const isSkipped = Boolean(skippedMap[q.id] && !isAnswered);
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30 scale-105'
                      : isAnswered
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                      : isSkipped
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      : 'bg-indigo-950/60 text-indigo-300/70 hover:bg-indigo-900/50'
                  }`}
                  title={`Question ${idx + 1}: ${q.purpose}`}
                >
                  <span>Q{idx + 1}</span>
                  {isAnswered && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </button>
              );
            })}
          </div>

          <span className="text-xs font-mono font-bold text-indigo-300 shrink-0">
            {totalAnswered} of {questions.length} answered
          </span>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* Progress & Category */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 capitalize">
              {getSectionIcon(currentQ.section)}
              <span>{currentQ.section}</span>
            </span>
          </div>

          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 px-3 py-1 rounded-lg border border-slate-200/60 dark:border-slate-800">
            Purpose: <strong className="text-slate-700 dark:text-slate-200">{currentQ.purpose}</strong>
          </span>
        </div>

        {/* Question Text */}
        <div className="space-y-2">
          {currentQ.context && (
            <div className="inline-block text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg">
              {currentQ.context}
            </div>
          )}
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
            {currentQ.question}
          </h3>
        </div>

        {/* Large Answer Text Box */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Your Answer</span>
            <span className="text-[11px] font-normal lowercase text-slate-400">
              Be specific & factual • Markdown supported
            </span>
          </label>

          <textarea
            rows={5}
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder={
              currentQ.placeholder ||
              'Type your answer with specific features, technologies used, responsibilities, or measurable outcomes...'
            }
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none leading-relaxed transition-all resize-y"
          />

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>
              If you do not know a metric or detail, simply describe what you built. CareerPilot will never fabricate false data.
            </span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <SkipForward className="w-3.5 h-3.5 text-slate-400" />
              <span>Skip</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center gap-2 group"
            >
              <span>{currentIndex === questions.length - 1 ? 'Review & Generate Resume' : 'Next Question'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
