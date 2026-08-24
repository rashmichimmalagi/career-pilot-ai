import React from 'react';
import {
  Award,
  Sparkles,
  FileText,
  Code2,
  Brain,
  BookOpen,
  Mic,
  Flame,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { CareerRoadmapAnalysis } from '../../types/roadmap';

interface RoadmapReadinessCardProps {
  analysis: CareerRoadmapAnalysis;
  onNavigateToModule: (route: string, params?: Record<string, any>) => void;
}

export const RoadmapReadinessCard: React.FC<RoadmapReadinessCardProps> = ({
  analysis,
  onNavigateToModule,
}) => {
  const { overallReadiness, readinessCategory, breakdown, aiAdvice } = analysis;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500';
    if (score >= 60) return 'text-indigo-600 dark:text-indigo-400 bg-indigo-500';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400 bg-amber-500';
    return 'text-rose-600 dark:text-rose-400 bg-rose-500';
  };

  const getStatusBadge = (category: string) => {
    switch (category) {
      case 'Highly Placement Ready':
      case 'Interview Ready':
        return {
          bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-500',
        };
      case 'Building Foundation':
        return {
          bg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
          dot: 'bg-indigo-500',
        };
      case 'Early Stage':
      default:
        return {
          bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
          dot: 'bg-amber-500',
        };
    }
  };

  const statusStyle = getStatusBadge(readinessCategory);

  const metrics = [
    {
      key: 'resume',
      title: 'Resume & ATS Score',
      icon: <FileText className="w-4 h-4 text-indigo-500" />,
      score: breakdown.resume.score,
      subtext: breakdown.resume.hasData
        ? `ATS ${breakdown.resume.score}/100 • ${breakdown.resume.missingSkillsCount} skill gaps`
        : 'No resume analyzed yet',
      route: 'resume-analyzer',
      actionText: 'Optimize Resume',
    },
    {
      key: 'coding',
      title: 'Coding & DSA Solved',
      icon: <Code2 className="w-4 h-4 text-indigo-500" />,
      score: breakdown.coding.score,
      subtext: breakdown.coding.hasData
        ? `${breakdown.coding.solvedCount} problems solved • ${breakdown.coding.accuracy}% accuracy`
        : 'No problems solved yet',
      route: 'coding',
      actionText: 'Solve Problem',
      params: { subject: 'DSA', topic: breakdown.coding.weakTopics[0] || 'Arrays', difficulty: 'Medium', auto: true },
    },
    {
      key: 'aptitude',
      title: 'Quantitative & Logic Aptitude',
      icon: <Brain className="w-4 h-4 text-indigo-500" />,
      score: breakdown.aptitude.score,
      subtext: breakdown.aptitude.hasData
        ? `${breakdown.aptitude.testsCompleted} questions • ${breakdown.aptitude.accuracy}% accuracy`
        : 'No tests attempted yet',
      route: 'placement',
      actionText: 'Practice Aptitude',
      params: { category: 'Aptitude' },
    },
    {
      key: 'technicalMcqs',
      title: 'Core CS Technical MCQs',
      icon: <BookOpen className="w-4 h-4 text-indigo-500" />,
      score: breakdown.technicalMcqs.score,
      subtext: breakdown.technicalMcqs.hasData
        ? `${breakdown.technicalMcqs.testsCompleted} questions • ${breakdown.technicalMcqs.accuracy}% accuracy`
        : 'No MCQs attempted yet',
      route: 'placement',
      actionText: 'Practice Core CS',
      params: { category: 'Technical' },
    },
    {
      key: 'interview',
      title: 'Mock Interview Performance',
      icon: <Mic className="w-4 h-4 text-indigo-500" />,
      score: breakdown.interview.score,
      subtext: breakdown.interview.hasData
        ? `${breakdown.interview.sessionsCompleted} mock sessions • Avg score: ${breakdown.interview.averageScore}/100`
        : 'No interview taken yet',
      route: 'interview',
      actionText: 'Start Mock Interview',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Overall Score Dial Card (5 cols) */}
      <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Overall Placement Readiness</span>
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusStyle.bg}`}>
              <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
              <span>{readinessCategory}</span>
            </span>
          </div>

          <div className="flex items-baseline gap-3 pt-4">
            <span className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {overallReadiness}%
            </span>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {overallReadiness >= 75 ? 'Placement Ready' : overallReadiness >= 50 ? 'Steady Progress' : 'Foundation Phase'}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Calculated across all 5 assessment pillars
              </p>
            </div>
          </div>

          {/* Progress gauge bar */}
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                overallReadiness >= 75
                  ? 'bg-emerald-500'
                  : overallReadiness >= 50
                  ? 'bg-indigo-500'
                  : overallReadiness >= 30
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.max(5, overallReadiness)}%` }}
            />
          </div>
        </div>

        {/* AI Key Strategy Callout */}
        {aiAdvice && (
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Immediate Next Step</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {aiAdvice.keyNextStep}
            </p>
          </div>
        )}

        {/* Streak / Consistency badge */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Daily Practice Streak:</span>
          </div>
          <span className="font-extrabold text-slate-900 dark:text-slate-100">
            {breakdown.consistency.currentStreak} {breakdown.consistency.currentStreak === 1 ? 'Day' : 'Days'} 🔥
          </span>
        </div>
      </div>

      {/* Module Breakdown Bars (7 cols) */}
      <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center justify-between">
            <span>Skill Readiness Breakdown</span>
            <span className="text-xs text-slate-400 lowercase font-normal">Deterministic metrics</span>
          </h3>

          <div className="space-y-3.5">
            {metrics.map((metric) => (
              <div
                key={metric.key}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      {metric.icon}
                      <span>{metric.title}</span>
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                      {metric.score}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        metric.score >= 75
                          ? 'bg-emerald-500'
                          : metric.score >= 50
                          ? 'bg-indigo-500'
                          : metric.score >= 25
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.max(4, metric.score)}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {metric.subtext}
                  </p>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => onNavigateToModule(metric.route, metric.params)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>{metric.actionText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
