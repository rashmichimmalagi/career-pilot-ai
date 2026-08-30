import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  AlertCircle,
  Sparkles,
  ArrowRight,
  HelpCircle,
  FileText,
  Code2,
  Brain,
  Cpu,
  Map,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CareerReadinessScore, ReadinessDimensionKey } from '../../types/intelligence';

interface CareerReadinessWidgetProps {
  readiness: CareerReadinessScore;
  onNavigate: (route: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const DIMENSION_ICONS: Record<ReadinessDimensionKey, React.ComponentType<{ className?: string }>> = {
  resume: FileText,
  coding: Code2,
  placement: Brain,
  interview: Cpu,
  roadmap: Map,
};

export const CareerReadinessWidget: React.FC<CareerReadinessWidgetProps> = ({
  readiness,
  onNavigate,
  onRefresh,
  isLoading = false,
}) => {
  const [showFormula, setShowFormula] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    overallScore,
    statusCategory,
    isDataSufficient,
    dimensions,
    biggestStrength,
    biggestGap,
    recommendedNextStep,
    formulaExplanation,
  } = readiness;

  // Determine score colors
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-400 dark:text-slate-500';
    if (score >= 85) return 'text-amber-500 dark:text-amber-400';
    if (score >= 70) return 'text-emerald-500 dark:text-emerald-400';
    if (score >= 50) return 'text-indigo-500 dark:text-indigo-400';
    if (score >= 25) return 'text-sky-500 dark:text-sky-400';
    return 'text-rose-500 dark:text-rose-400';
  };

  const getProgressColor = (score: number) => {
    if (score >= 85) return 'bg-amber-500';
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 50) return 'bg-indigo-500';
    if (score >= 25) return 'bg-sky-500';
    return 'bg-slate-400';
  };

  const getBadgeStyle = (category: string) => {
    switch (category) {
      case 'Highly Prepared':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30';
      case 'Placement Ready':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30';
      case 'Making Progress':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/30';
      case 'Building Foundations':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/30';
      case 'Getting Started':
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  const dimensionKeys: ReadinessDimensionKey[] = ['resume', 'coding', 'placement', 'interview', 'roadmap'];

  return (
    <div
      id="career-readiness-card"
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm transition-all relative overflow-hidden"
    >
      {/* Background Accent Mesh */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Career Readiness Score
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deterministic evaluation synthesized across your 5 core placement dimensions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="readiness-formula-toggle"
            onClick={() => setShowFormula(!showFormula)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Calculation Formula</span>
          </button>
        </div>
      </div>

      {/* Formula Explanation Drawer */}
      {showFormula && (
        <div className="mt-4 p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-slate-600 dark:text-slate-300 space-y-3 animate-fadeIn relative z-10">
          <div className="flex items-center justify-between">
            <div className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Transparent Mathematical Score Breakdown</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">5 Canonical Dimensions = 100%</span>
          </div>

          <p className="text-slate-600 dark:text-slate-300">
            {formulaExplanation}
          </p>

          {/* Mathematical Step-by-Step Breakdown */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 font-mono text-[11px]">
            <div className="font-sans font-semibold text-slate-900 dark:text-white text-xs border-b border-slate-100 dark:border-slate-800 pb-1">
              Active Verified Contributions:
            </div>
            {dimensionKeys.map((key) => {
              const dim = dimensions[key];
              const scoreVal = dim.isAvailable ? dim.score : 0;
              const contribVal = (scoreVal * dim.weight).toFixed(1);
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300">{dim.label} ({Math.round(dim.weight * 100)}%):</span>
                  <span className="text-slate-900 dark:text-white">
                    {dim.isAvailable ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {scoreVal} × {Math.round(dim.weight * 100)}% = {contribVal} pts
                      </span>
                    ) : (
                      <span className="text-slate-400">Not assessed (0 × {Math.round(dim.weight * 100)}% = 0.0)</span>
                    )}
                  </span>
                </div>
              );
            })}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5 flex items-center justify-between font-bold text-xs text-indigo-600 dark:text-indigo-400">
              <span>Overall Score:</span>
              <span>{overallScore !== null ? `${overallScore} / 100` : 'Not enough verified activity yet'}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Note: Company Preparation and HR Interview are tracked separately and do not contribute to the 100-point composite score.</span>
          </div>
        </div>
      )}

      {/* Main Score Hero Section */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        {/* Score Ring / Number */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Overall Placement Readiness
          </span>
          <div className="mt-2 flex items-baseline justify-center gap-1">
            <span className={`text-5xl sm:text-6xl font-extrabold tracking-tight ${getScoreColor(overallScore)}`}>
              {overallScore !== null ? overallScore : '—'}
            </span>
            {overallScore !== null && <span className="text-2xl font-bold text-slate-400">%</span>}
          </div>

          <div className="mt-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(
                statusCategory
              )}`}
            >
              {statusCategory}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
            {overallScore !== null
              ? 'Computed from authentic code submissions, interview rounds, and ATS scores.'
              : 'Complete your first practice activity to calculate your overall readiness score.'}
          </p>
        </div>

        {/* 5-Dimension Progress Breakdown */}
        <div className="lg:col-span-8 space-y-3">
          {dimensionKeys.map((key) => {
            const dim = dimensions[key];
            const IconComponent = DIMENSION_ICONS[key];
            return (
              <div
                key={key}
                className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800/80 transition-all hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                    <IconComponent className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{dim.label}</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      ({Math.round(dim.weight * 100)}% weight)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {dim.isAvailable ? (
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {dim.score}/100
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 italic">
                        Not enough data yet
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2 w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dim.isAvailable ? getProgressColor(dim.score) : 'bg-transparent'
                    }`}
                    style={{ width: `${dim.isAvailable ? Math.max(5, dim.score) : 0}%` }}
                  />
                </div>

                {/* Status Subtitle */}
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{dim.statusText}</span>
                  {dim.isAvailable && (
                    <span className="font-mono text-slate-400">
                      Contrib: +{dim.weightedContribution} pts
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strength & Gap Callout Footer */}
      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {/* Biggest Strength */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Biggest Strength
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {biggestStrength ? biggestStrength.title : 'Establishing Baseline'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {biggestStrength
                ? biggestStrength.reason
                : 'Complete more challenges to identify your strongest placement pillar.'}
            </p>
          </div>
        </div>

        {/* Biggest Gap & Action */}
        <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300 shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Biggest Improvement Gap
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {biggestGap ? biggestGap.title : 'Action Required'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {biggestGap ? biggestGap.reason : 'Complete your first practice activity.'}
            </p>
          </div>
        </div>
      </div>

      {/* High-Leverage Recommended Next Step Button */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 text-white shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
              Recommended Next Step
            </div>
            <div className="font-bold text-sm sm:text-base text-white">
              {recommendedNextStep.title}
            </div>
            <div className="text-xs text-indigo-100 line-clamp-1">
              {recommendedNextStep.description}
            </div>
          </div>
        </div>

        <button
          id="readiness-recommended-action-btn"
          onClick={() => onNavigate(recommendedNextStep?.actionRoute || 'coding')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-indigo-600 font-bold text-xs sm:text-sm hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
        >
          <span>{recommendedNextStep?.actionText || 'Start Practice'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
