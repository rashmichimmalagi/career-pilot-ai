import React from 'react';
import { Cpu, ArrowRight, UserCheck, ShieldAlert, Sparkles, CheckCircle2, TrendingUp } from 'lucide-react';
import { MockInterviewProgressAnalytics } from '../../types/intelligence';

interface InterviewAnalyticsSectionProps {
  interview: MockInterviewProgressAnalytics;
  onNavigate: (route: string) => void;
}

export const InterviewAnalyticsSection: React.FC<InterviewAnalyticsSectionProps> = ({
  interview,
  onNavigate,
}) => {
  const hasData = interview.totalInterviews > 0;
  const subjects = Object.entries(interview.subjectAverages || {});

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Cpu className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Mock Interview Performance Analytics
            </h3>
            <p className="text-xs text-slate-500">
              Technical round depth, communication metrics, problem solving, and behavioral readiness.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('interview')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer transition-colors self-start sm:self-auto"
        >
          <span>Practice Interview</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Technical vs HR Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Technical Mock Interview Card */}
        <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                <Cpu className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Technical Interview
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
              {interview.technicalInterviewsCount} round{interview.technicalInterviewsCount === 1 ? '' : 's'}
            </span>
          </div>

          {interview.technicalInterviewsCount > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 font-semibold">Latest Score</div>
                  <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                    {interview.technicalLatestScore}/100
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 font-semibold">Average Score</div>
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                    {interview.technicalAverageScore}/100
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 font-semibold">Improvement</div>
                  <div className="text-xl font-black mt-0.5">
                    {interview.scoreDelta !== null ? (
                      <span className={interview.scoreDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {interview.scoreDelta >= 0 ? `+${interview.scoreDelta}` : interview.scoreDelta}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm">Baseline</span>
                    )}
                  </div>
                </div>
              </div>

              {interview.identifiedWeaknesses.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                    Flagged Weaknesses from Recent Feedback
                  </span>
                  <ul className="text-xs text-rose-800 dark:text-rose-200 list-disc list-inside space-y-0.5">
                    {interview.identifiedWeaknesses.slice(0, 2).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center space-y-1.5">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Not assessed yet
              </p>
              <p className="text-[11px] text-slate-400">
                Complete a technical interview session to benchmark coding articulation and system concepts.
              </p>
            </div>
          )}
        </div>

        {/* HR & Behavioral Interview Card */}
        <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400">
                <UserCheck className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                HR & Behavioral Interview
              </h4>
            </div>
            {interview.isHrAssessed ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
                {interview.hrInterviewsCount} round{interview.hrInterviewsCount === 1 ? '' : 's'}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                Not assessed
              </span>
            )}
          </div>

          {interview.isHrAssessed ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 font-semibold">Latest Score</div>
                <div className="text-xl font-black text-teal-600 dark:text-teal-400 mt-0.5">
                  {interview.hrLatestScore}/100
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 font-semibold">Average Score</div>
                <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {interview.hrAverageScore}/100
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 font-semibold">Communication</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {interview.hrCommunicationScore}/100
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                HR Interview: Not assessed
              </p>
              <p className="text-[11px] text-slate-400">
                Practice behavioral STAR scenarios, leadership questions, and cultural fit rounds.
              </p>
              <button
                onClick={() => onNavigate('interview')}
                className="mt-1 px-3 py-1.5 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 cursor-pointer transition-colors"
              >
                Start HR Interview
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dimension Breakdown if data exists */}
      {hasData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500">Technical Depth</div>
            <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
              {interview.averageTechnicalScore}/100
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500">Communication</div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {interview.averageCommunicationScore}/100
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500">Problem Solving</div>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {interview.averageProblemSolvingScore}/100
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500">Overall Benchmark</div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {interview.averageOverallScore}/100
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
