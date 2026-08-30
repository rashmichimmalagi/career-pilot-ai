import React from 'react';
import { X, Award, Code2, Brain, Cpu, FileText, Map, CheckCircle2, ArrowRight } from 'lucide-react';
import { CareerReadinessScore } from '../../types/intelligence';
import { PlacementReadinessReport } from '../../types/readiness';

export interface ReadinessDetailedModalProps {
  readiness?: CareerReadinessScore;
  report?: PlacementReadinessReport | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const ReadinessDetailedModal: React.FC<ReadinessDetailedModalProps> = ({
  readiness,
  report,
  isOpen,
  onClose,
  onNavigate,
}) => {
  if (!isOpen) return null;

  // Resolve scores from readiness or legacy report
  const overallScore =
    readiness?.overallScore ??
    (report ? report.overallScore : null);

  const codingScore =
    readiness?.dimensions.coding.score ??
    (report?.components.coding.isAvailable ? report.components.coding.score : null);

  const resumeScore =
    readiness?.dimensions.resume.score ??
    (report?.components.resume.isAvailable ? report.components.resume.score : null);

  const interviewScore =
    readiness?.dimensions.interview.score ??
    (report?.components.technicalInterview.isAvailable ? report.components.technicalInterview.score : null);

  const aptitudeScore =
    readiness?.dimensions.placement.score ??
    (report?.components.consistency.isAvailable ? report.components.consistency.score : null);

  const roadmapScore =
    readiness?.dimensions.roadmap.score ?? null;

  const formulaRows = [
    {
      name: 'Coding & DSA Practice',
      weight: '25%',
      weightMultiplier: 0.25,
      score: codingScore,
      maxPossible: 25,
      actualContributed: Math.round((codingScore || 0) * 0.25),
      icon: Code2,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60',
      route: 'coding',
      explanation: 'Evaluates unique problems solved, submission accuracy rate, and topic breadth.',
    },
    {
      name: 'Resume ATS & Keyword Match',
      weight: '20%',
      weightMultiplier: 0.2,
      score: resumeScore,
      maxPossible: 20,
      actualContributed: Math.round((resumeScore || 0) * 0.2),
      icon: FileText,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60',
      route: 'resume-analyzer',
      explanation: 'Evaluates automated ATS parse rate, keyword match to target role, and structure.',
    },
    {
      name: 'Technical Mock Interviews',
      weight: '20%',
      weightMultiplier: 0.2,
      score: interviewScore,
      maxPossible: 20,
      actualContributed: Math.round((interviewScore || 0) * 0.2),
      icon: Cpu,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60',
      route: 'interview',
      explanation: 'Evaluates technical depth, problem articulation, and communication feedback scores.',
    },
    {
      name: 'Placement Aptitude Tests',
      weight: '20%',
      weightMultiplier: 0.2,
      score: aptitudeScore,
      maxPossible: 20,
      actualContributed: Math.round((aptitudeScore || 0) * 0.2),
      icon: Brain,
      color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/60',
      route: 'placement',
      explanation: 'Evaluates test accuracy in Quantitative Reasoning, Logical Ability, and Verbal tests.',
    },
    {
      name: 'Career Roadmap Progress',
      weight: '15%',
      weightMultiplier: 0.15,
      score: roadmapScore,
      maxPossible: 15,
      actualContributed: Math.round((roadmapScore || 0) * 0.15),
      icon: Map,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60',
      route: 'roadmap',
      explanation: 'Evaluates completed curriculum tasks, daily milestones, and skill acquisitions.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Award className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Career Readiness Formula Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Transparent mathematical weights across all 5 career preparation pillars.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Formula summary pill */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-indigo-900 dark:text-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="font-semibold text-center sm:text-left">
              Readiness Score = (Coding × 25%) + (Resume × 20%) + (Interview × 20%) + (Aptitude × 20%) + (Roadmap × 15%)
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-sm font-black text-indigo-600 dark:text-indigo-400 shrink-0">
              {overallScore !== null ? `${overallScore} / 100` : 'Not computed'}
            </div>
          </div>

          {/* Dimension Rows */}
          <div className="space-y-3">
            {formulaRows.map((row, idx) => {
              const Icon = row.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`p-2 rounded-xl ${row.color}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {row.name}
                        </h4>
                        <span className="text-[10px] text-slate-400">Weight: {row.weight}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                        {row.score !== null ? (
                          <>
                            <span className="text-indigo-600 dark:text-indigo-400">
                              {row.actualContributed}
                            </span>{' '}
                            <span className="text-slate-400">/ {row.maxPossible} pts</span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Not assessed</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {row.score !== null ? `Raw score: ${row.score}/100` : '0 contribution'}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 pl-9">{row.explanation}</p>

                  <div className="pl-9 pt-1 flex justify-end">
                    <button
                      onClick={() => {
                        onClose();
                        onNavigate(row.route);
                      }}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Boost {row.name}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
