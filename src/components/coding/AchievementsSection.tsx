import React, { useState } from 'react';
import {
  Award,
  Flame,
  CheckCircle2,
  Lock,
  Sparkles,
  Trophy,
  Layers,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Brain,
} from 'lucide-react';
import { Achievement, AchievementCategory, UserAchievementsSummary } from '../../types/coding';
import { formatEarnedDate, sortAchievements } from '../../services/achievementService';

interface AchievementsSectionProps {
  summary: UserAchievementsSummary;
  onScrollToAchievements?: () => void;
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  summary,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'in_progress' | 'unlocked' | 'locked'>('all');

  // Filter achievements by category first
  const categoryAchievements = summary.achievements.filter((ach) => {
    return selectedCategory === 'all' || ach.category === selectedCategory;
  });

  // Sort them dynamically according to priority rules:
  // Priority 1: In Progress (highest % first, then closest remaining)
  // Priority 2: Unlocked (most recent earned date first)
  // Priority 3: Locked / Not Started (lower requirement first)
  const sortedFiltered = sortAchievements(categoryAchievements);

  const inProgressList = sortedFiltered.filter((a) => !a.unlocked && a.progress > 0);
  const unlockedList = sortedFiltered.filter((a) => a.unlocked);
  const lockedList = sortedFiltered.filter((a) => !a.unlocked && a.progress === 0);

  // Filter mode determination
  const showInProgress = filterMode === 'all' || filterMode === 'in_progress';
  const showUnlocked = filterMode === 'all' || filterMode === 'unlocked';
  const showLocked = filterMode === 'all' || filterMode === 'locked';

  const totalInCategory = categoryAchievements.length;
  const inProgressCount = categoryAchievements.filter((a) => !a.unlocked && a.progress > 0).length;
  const unlockedCount = categoryAchievements.filter((a) => a.unlocked).length;
  const lockedCount = categoryAchievements.filter((a) => !a.unlocked && a.progress === 0).length;

  const unlockPercentage = summary.totalCount > 0
    ? Math.round((summary.unlockedCount / summary.totalCount) * 100)
    : 0;

  const renderAchievementCard = (ach: Achievement) => {
    const isUnlocked = ach.unlocked;
    const isInProgress = !isUnlocked && ach.progress > 0;
    const progressPercent = ach.maxProgress > 0
      ? Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100))
      : 0;

    let cardBorder = 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-80 hover:opacity-100';
    if (isUnlocked) {
      cardBorder = 'bg-gradient-to-b from-white to-amber-50/25 dark:from-slate-900 dark:to-amber-950/20 border-amber-300/80 dark:border-amber-700/60 shadow-xs hover:border-amber-400 dark:hover:border-amber-500';
    } else if (isInProgress) {
      cardBorder = 'bg-gradient-to-b from-white via-indigo-50/20 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 border-indigo-300/90 dark:border-indigo-600/70 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-400';
    }

    return (
      <div
        key={ach.id}
        id={`achievement-card-${ach.id}`}
        className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 relative overflow-hidden ${cardBorder}`}
      >
        {/* Card Top Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner shrink-0 ${
                isUnlocked
                  ? 'bg-amber-500/10 border border-amber-500/30'
                  : isInProgress
                  ? 'bg-indigo-500/10 border border-indigo-500/30'
                  : 'bg-slate-200/70 dark:bg-slate-800 border border-slate-300/50 dark:border-slate-700 grayscale'
              }`}
            >
              <span>{ach.icon}</span>
            </div>
            <div className="min-w-0">
              <h3
                className={`text-xs font-bold leading-tight truncate ${
                  isUnlocked
                    ? 'text-slate-900 dark:text-slate-100 flex items-center gap-1'
                    : isInProgress
                    ? 'text-indigo-950 dark:text-indigo-200 font-extrabold'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{ach.name}</span>
              </h3>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mt-0.5 line-clamp-2">
                {ach.description}
              </span>
            </div>
          </div>

          {/* Status Pill */}
          {isUnlocked ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>✓ Unlocked</span>
            </span>
          ) : isInProgress ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1 shrink-0 animate-pulse">
              <Flame className="w-3 h-3 text-amber-500" />
              <span>In Progress</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300/60 dark:border-slate-700 flex items-center gap-1 shrink-0">
              <Lock className="w-2.5 h-2.5" />
              <span>Locked</span>
            </span>
          )}
        </div>

        {/* Progress Bar, Label & Earned Date */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            {isUnlocked ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                <Calendar className="w-3 h-3" />
                <span>Earned: {formatEarnedDate(ach.unlockedAt)}</span>
              </span>
            ) : (
              <span
                className={`font-semibold ${
                  isInProgress
                    ? 'text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {ach.progressLabel}
              </span>
            )}
            <span
              className={`text-[10px] font-semibold ${
                isInProgress
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-400'
              }`}
            >
              {progressPercent}%
            </span>
          </div>

          <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isUnlocked
                  ? 'bg-emerald-500'
                  : isInProgress
                  ? 'bg-gradient-to-r from-indigo-500 to-amber-500'
                  : 'bg-slate-400 dark:bg-slate-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      id="coding-achievements-section"
      className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
    >
      {/* Header & Overall Progress */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                🏆 My Achievements
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-mono">
                Earned: {summary.unlockedCount} / {summary.totalCount}
              </span>
              {inProgressCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-mono flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-500" />
                  <span>{inProgressCount} in progress</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Permanent badge collection dynamically organized by your active progress and accomplishments.
            </p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="flex items-center gap-3 min-w-[220px]">
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>Collection Progress</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{unlockPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 via-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${unlockPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Categories</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px]">
              {summary.achievements.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('streak')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'streak'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Streaks</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px]">
              {summary.achievements.filter((a) => a.category === 'streak').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('problem_solving')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'problem_solving'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Problem Solving</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px]">
              {summary.achievements.filter((a) => a.category === 'problem_solving').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('difficulty')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'difficulty'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Difficulty Mastery</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px]">
              {summary.achievements.filter((a) => a.category === 'difficulty').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('placement')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'placement'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Placement & MCQs</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px]">
              {summary.achievements.filter((a) => a.category === 'placement').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('interview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'interview'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>🎤</span>
            <span>Interviews</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px]">
              {summary.achievements.filter((a) => a.category === 'interview').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('resume')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'resume'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>📄</span>
            <span>Resume & ATS</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px]">
              {summary.achievements.filter((a) => a.category === 'resume').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('career')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'career'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>🚀</span>
            <span>Readiness</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px]">
              {summary.achievements.filter((a) => a.category === 'career').length}
            </span>
          </button>
        </div>

        {/* Status Sub-filter */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All ({totalInCategory})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('in_progress')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              filterMode === 'in_progress'
                ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-500" />
            <span>In Progress ({inProgressCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('unlocked')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              filterMode === 'unlocked'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Unlocked ({unlockedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('locked')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              filterMode === 'locked'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Locked ({lockedCount})</span>
          </button>
        </div>
      </div>

      {/* Grouped Content Display */}
      <div className="space-y-7">
        {/* GROUP 1: 🔥 IN PROGRESS */}
        {showInProgress && inProgressList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Flame className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>🔥 In Progress</span>
                    <span className="px-2 py-0.2 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-mono">
                      {inProgressList.length}
                    </span>
                  </h3>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                Sorted by highest percentage & closest to completion
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {inProgressList.map(renderAchievementCard)}
            </div>
          </div>
        )}

        {/* GROUP 2: 🏆 UNLOCKED */}
        {showUnlocked && unlockedList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>🏆 Unlocked Badges</span>
                    <span className="px-2 py-0.2 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono">
                      {unlockedList.length}
                    </span>
                  </h3>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                Permanently unlocked • Sorted by most recently earned
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {unlockedList.map(renderAchievementCard)}
            </div>
          </div>
        )}

        {/* GROUP 3: 🔒 LOCKED / NOT STARTED */}
        {showLocked && lockedList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span>🔒 Locked / Next Milestones</span>
                    <span className="px-2 py-0.2 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                      {lockedList.length}
                    </span>
                  </h3>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                Milestones ready to begin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {lockedList.map(renderAchievementCard)}
            </div>
          </div>
        )}

        {/* Empty state when filter has no matches */}
        {((filterMode === 'in_progress' && inProgressList.length === 0) ||
          (filterMode === 'unlocked' && unlockedList.length === 0) ||
          (filterMode === 'locked' && lockedList.length === 0) ||
          (totalInCategory === 0)) && (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            No achievements found in this section.
          </div>
        )}
      </div>
    </div>
  );
};

