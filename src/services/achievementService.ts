import { CodingSubmission, Achievement, AchievementCategory, UserAchievementsSummary } from '../types/coding';
import { getPlacementStats } from './placementStorage';
import { persistenceManager } from './persistenceManager';

/**
 * Format a Date to local calendar string YYYY-MM-DD
 */
export function getLocalDayString(dateInput?: string | Date): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format an ISO date or timestamp into a friendly date e.g. "Aug 16, 2026"
 */
export function formatEarnedDate(dateInput?: string | Date): string {
  if (!dateInput) return 'Recently';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return 'Recently';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Helper to get/set persisted longest streak
 */
export function getPersistedLongestStreak(userId: string = 'guest'): number {
  try {
    const val = localStorage.getItem(`careerpilot_longest_streak_${userId}`);
    return val ? Math.max(0, parseInt(val, 10) || 0) : 0;
  } catch (_) {
    return 0;
  }
}

export function savePersistedLongestStreak(userId: string = 'guest', streak: number): void {
  try {
    const current = getPersistedLongestStreak(userId);
    if (streak > current) {
      localStorage.setItem(`careerpilot_longest_streak_${userId}`, streak.toString());
      if (userId && userId !== 'guest') {
        persistenceManager.saveAchievements(userId, undefined, streak).catch(() => {});
      }
    }
  } catch (_) {}
}

/**
 * Interface for permanently unlocked badge storage
 */
export interface StoredUnlockedBadge {
  id: string;
  unlockedAt: string;
}

/**
 * Helper to get/set permanently unlocked badges
 */
export function getPermanentUnlockedBadges(userId: string = 'guest'): Record<string, StoredUnlockedBadge> {
  try {
    const raw = localStorage.getItem(`careerpilot_unlocked_badges_${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

export function savePermanentUnlockedBadge(
  userId: string = 'guest',
  badgeId: string,
  unlockedAt: string = new Date().toISOString()
): void {
  try {
    const current = getPermanentUnlockedBadges(userId);
    if (!current[badgeId]) {
      current[badgeId] = { id: badgeId, unlockedAt };
      localStorage.setItem(`careerpilot_unlocked_badges_${userId}`, JSON.stringify(current));
      if (userId && userId !== 'guest') {
        persistenceManager.saveAchievements(userId, current).catch(() => {});
      }
    }
  } catch (_) {}
}

/**
 * Compute current streak and longest streak from actual submission attempts
 * - Practice day counted when at least one genuine Coding Practice submission attempt exists
 * - Multiple submissions on the same calendar day count as ONE practice day
 * - If today or yesterday has a practice day, the streak is currently active
 * - Missed day breaks consecutive streak and resets current streak
 * - Preserves historical longest streak even after a streak break (never decreases)
 */
export function calculateStreaks(
  submissions: CodingSubmission[],
  userId: string = 'guest'
): {
  currentStreak: number;
  longestStreak: number;
  uniquePracticeDates: string[];
} {
  const persistedLongest = getPersistedLongestStreak(userId);

  if (!Array.isArray(submissions) || submissions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: persistedLongest,
      uniquePracticeDates: [],
    };
  }

  // 1. Extract unique local calendar dates
  const datesSet = new Set<string>();
  for (const s of submissions) {
    if (s.created_at) {
      const dayStr = getLocalDayString(s.created_at);
      if (dayStr) datesSet.add(dayStr);
    }
  }

  const uniquePracticeDates = Array.from(datesSet).sort();
  if (uniquePracticeDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: persistedLongest,
      uniquePracticeDates: [],
    };
  }

  // 2. Calculate Longest Streak across all unique practice dates in history
  let computedLongestStreak = 0;
  let runningStreak = 0;
  let prevDateObj: Date | null = null;

  for (const dateStr of uniquePracticeDates) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const currentDateObj = new Date(y, m - 1, d);

    if (!prevDateObj) {
      runningStreak = 1;
    } else {
      // Calculate difference in calendar days
      const diffMs = currentDateObj.getTime() - prevDateObj.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        runningStreak += 1;
      } else {
        runningStreak = 1;
      }
    }

    if (runningStreak > computedLongestStreak) {
      computedLongestStreak = runningStreak;
    }
    prevDateObj = currentDateObj;
  }

  // 3. Calculate Current Streak
  const now = new Date();
  const todayStr = getLocalDayString(now);
  const yesterdayObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayStr = getLocalDayString(yesterdayObj);

  let currentStreak = 0;

  if (datesSet.has(todayStr)) {
    // Active practice today: count consecutive days backwards starting from today
    let checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    while (datesSet.has(getLocalDayString(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  } else if (datesSet.has(yesterdayStr)) {
    // Practiced yesterday, streak is still active pending today's practice
    let checkDate = new Date(yesterdayObj.getFullYear(), yesterdayObj.getMonth(), yesterdayObj.getDate());
    while (datesSet.has(getLocalDayString(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  } else {
    // Streak broken (missed yesterday and today) -> resets to 0
    currentStreak = 0;
  }

  // Longest streak never decreases
  const finalLongestStreak = Math.max(persistedLongest, computedLongestStreak, currentStreak);
  savePersistedLongestStreak(userId, finalLongestStreak);

  return {
    currentStreak,
    longestStreak: finalLongestStreak,
    uniquePracticeDates,
  };
}

/**
 * Base definitions of all 16 CareerPilot Achievements
 */
interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: number;
  unlockMessage: string;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // 1. Streak Badges (6)
  {
    id: 'streak_3_day',
    name: '3-Day Starter',
    description: '3 consecutive practice days',
    icon: '🔥',
    category: 'streak',
    requirement: 3,
    unlockMessage: 'Great job! You practiced for 3 consecutive days.',
  },
  {
    id: 'streak_7_day',
    name: '7-Day Consistent',
    description: '7 consecutive practice days',
    icon: '🔥',
    category: 'streak',
    requirement: 7,
    unlockMessage: 'Great job! You practiced for 7 consecutive days.',
  },
  {
    id: 'streak_14_day',
    name: '14-Day Dedicated',
    description: '14 consecutive practice days',
    icon: '🔥',
    category: 'streak',
    requirement: 14,
    unlockMessage: 'Great job! You practiced for 14 consecutive days.',
  },
  {
    id: 'streak_30_day',
    name: '30-Day Unstoppable',
    description: '30 consecutive practice days',
    icon: '🔥',
    category: 'streak',
    requirement: 30,
    unlockMessage: 'Incredible dedication! You practiced for 30 consecutive days.',
  },
  {
    id: 'streak_60_day',
    name: '60-Day Master',
    description: '60 consecutive practice days',
    icon: '🔥',
    category: 'streak',
    requirement: 60,
    unlockMessage: 'Phenomenal! You reached a 60-day practice streak.',
  },
  {
    id: 'streak_100_day',
    name: '100-Day Legend',
    description: '100 consecutive practice days',
    icon: '🔥',
    category: 'streak',
    requirement: 100,
    unlockMessage: 'Legendary milestone! 100 consecutive days of coding practice.',
  },

  // 2. Problem Solving Badges (6) - UNIQUE ACCEPTED PROBLEMS
  {
    id: 'solved_1',
    name: 'First Step',
    description: '1 unique problem solved',
    icon: '🥉',
    category: 'problem_solving',
    requirement: 1,
    unlockMessage: 'Awesome! You solved your first unique coding challenge.',
  },
  {
    id: 'solved_10',
    name: 'Problem Solver',
    description: '10 unique problems solved',
    icon: '🥉',
    category: 'problem_solving',
    requirement: 10,
    unlockMessage: 'Great work! You solved 10 unique coding problems.',
  },
  {
    id: 'solved_25',
    name: 'Rising Coder',
    description: '25 unique problems solved',
    icon: '🥈',
    category: 'problem_solving',
    requirement: 25,
    unlockMessage: 'Milestone achieved! 25 unique problems solved.',
  },
  {
    id: 'solved_50',
    name: 'Coding Enthusiast',
    description: '50 unique problems solved',
    icon: '🥇',
    category: 'problem_solving',
    requirement: 50,
    unlockMessage: 'Outstanding! 50 unique problems solved.',
  },
  {
    id: 'solved_100',
    name: 'Coding Champion',
    description: '100 unique problems solved',
    icon: '🏆',
    category: 'problem_solving',
    requirement: 100,
    unlockMessage: 'Incredible achievement! 100 unique problems solved.',
  },
  {
    id: 'solved_250',
    name: 'Problem Master',
    description: '250 unique problems solved',
    icon: '💎',
    category: 'problem_solving',
    requirement: 250,
    unlockMessage: 'Grandmaster level! 250 unique problems solved.',
  },

  // 3. Difficulty Badges (4) - UNIQUE ACCEPTED PROBLEMS
  {
    id: 'easy_10',
    name: 'Easy Explorer',
    description: '10 unique Easy problems solved',
    icon: '🎯',
    category: 'difficulty',
    requirement: 10,
    unlockMessage: 'Well done! 10 unique Easy problems solved.',
  },
  {
    id: 'medium_10',
    name: 'Medium Challenger',
    description: '10 unique Medium problems solved',
    icon: '🎯',
    category: 'difficulty',
    requirement: 10,
    unlockMessage: 'Impressive! 10 unique Medium problems solved.',
  },
  {
    id: 'hard_10',
    name: 'Hard Crusher',
    description: '10 unique Hard problems solved',
    icon: '🎯',
    category: 'difficulty',
    requirement: 10,
    unlockMessage: 'Superb problem solving! 10 unique Hard problems solved.',
  },
  {
    id: 'all_rounder',
    name: 'All-Rounder',
    description: 'At least one unique Accepted problem in: Easy + Medium + Hard',
    icon: '🌟',
    category: 'difficulty',
    requirement: 3,
    unlockMessage: 'Versatile engineer! Solved problems in Easy, Medium, and Hard.',
  },

  // 4. Placement Practice Badges (7)
  {
    id: 'mcq_first_test',
    name: 'First MCQ Test',
    description: 'Completed your first Placement Practice session',
    icon: '📝',
    category: 'placement',
    requirement: 1,
    unlockMessage: 'Great start! Completed your first Placement Practice test.',
  },
  {
    id: 'mcq_solved_10',
    name: '10 MCQs Solved',
    description: '10 total MCQs solved correctly',
    icon: '🎯',
    category: 'placement',
    requirement: 10,
    unlockMessage: 'Stepping up! Solved 10 placement MCQs correctly.',
  },
  {
    id: 'mcq_solved_50',
    name: '50 MCQs Solved',
    description: '50 total MCQs solved correctly',
    icon: '⚡',
    category: 'placement',
    requirement: 50,
    unlockMessage: 'Mastering concepts! Solved 50 placement MCQs correctly.',
  },
  {
    id: 'mcq_solved_100',
    name: '100 MCQs Solved',
    description: '100 total MCQs solved correctly',
    icon: '🏆',
    category: 'placement',
    requirement: 100,
    unlockMessage: 'Aptitude powerhouse! Solved 100 placement MCQs correctly.',
  },
  {
    id: 'mcq_perfect_score',
    name: 'Perfect Score',
    description: 'Scored 100% on a placement test with at least 5 questions',
    icon: '💯',
    category: 'placement',
    requirement: 1,
    unlockMessage: 'Flawless accuracy! 100% score on a full placement test.',
  },
  {
    id: 'mcq_aptitude_master',
    name: 'Aptitude Master',
    description: '30+ Aptitude MCQs solved with >= 80% accuracy',
    icon: '🧠',
    category: 'placement',
    requirement: 30,
    unlockMessage: 'Quantitative & Logical brilliance! Solved 30+ Aptitude questions with 80%+ accuracy.',
  },
  {
    id: 'mcq_technical_master',
    name: 'Technical MCQ Master',
    description: '30+ Technical MCQs solved with >= 80% accuracy',
    icon: '💻',
    category: 'placement',
    requirement: 30,
    unlockMessage: 'CS Core Master! Solved 30+ Technical questions with 80%+ accuracy.',
  },
];

/**
 * Dynamic Achievement Sorter:
 * Priority 1: IN PROGRESS (progress > 0, !unlocked)
 *   - Sorted by highest percentage progress first (e.g. 9/10 = 90% before 4/10 = 40% before 4/25 = 16%)
 *   - If percentages are equal, sorted by remaining needed ascending (e.g. 1 remaining before 6 remaining)
 * Priority 2: RECENTLY UNLOCKED / COMPLETED (unlocked)
 *   - Sorted by earned date desc (most recently unlocked first)
 * Priority 3: NOT STARTED / LOCKED (progress === 0, !unlocked)
 *   - Sorted by requirement ascending, then name
 */
export function sortAchievements(achievements: Achievement[]): Achievement[] {
  const inProgress: Achievement[] = [];
  const unlocked: Achievement[] = [];
  const locked: Achievement[] = [];

  for (const ach of achievements) {
    if (ach.unlocked) {
      unlocked.push(ach);
    } else if (ach.progress > 0) {
      inProgress.push(ach);
    } else {
      locked.push(ach);
    }
  }

  // Priority 1: IN PROGRESS
  inProgress.sort((a, b) => {
    const pctA = a.maxProgress > 0 ? a.progress / a.maxProgress : 0;
    const pctB = b.maxProgress > 0 ? b.progress / b.maxProgress : 0;
    if (Math.abs(pctA - pctB) > 0.0001) {
      return pctB - pctA; // Highest percentage first
    }
    const remainingA = Math.max(0, a.maxProgress - a.progress);
    const remainingB = Math.max(0, b.maxProgress - b.progress);
    if (remainingA !== remainingB) {
      return remainingA - remainingB; // Closest to completion first
    }
    return b.progress - a.progress;
  });

  // Priority 2: RECENTLY UNLOCKED / COMPLETED
  unlocked.sort((a, b) => {
    const timeA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
    const timeB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
    if (timeA !== timeB) {
      return timeB - timeA; // Most recently earned first
    }
    return a.name.localeCompare(b.name);
  });

  // Priority 3: NOT STARTED / LOCKED
  locked.sort((a, b) => {
    if (a.requirement !== b.requirement) {
      return a.requirement - b.requirement; // Lower requirement first
    }
    return a.name.localeCompare(b.name);
  });

  return [...inProgress, ...unlocked, ...locked];
}

export function groupAchievements(achievements: Achievement[]): {
  inProgress: Achievement[];
  unlocked: Achievement[];
  locked: Achievement[];
} {
  const sorted = sortAchievements(achievements);
  return {
    inProgress: sorted.filter((a) => !a.unlocked && a.progress > 0),
    unlocked: sorted.filter((a) => a.unlocked),
    locked: sorted.filter((a) => !a.unlocked && a.progress === 0),
  };
}

/**
 * Calculate all achievements dynamically and merge with permanently unlocked badges
 * Single Source of Truth + Permanent Badge Retention
 */
export function calculateAchievements(
  submissions: CodingSubmission[],
  userId: string = 'guest'
): UserAchievementsSummary {
  const { currentStreak, longestStreak } = calculateStreaks(submissions, userId);
  const permanentBadges = getPermanentUnlockedBadges(userId);

  // 1. Gather unique solved problems (status === 'accepted')
  const uniqueSolvedProblemIds = new Set<string>();
  const uniqueEasySolvedIds = new Set<string>();
  const uniqueMedSolvedIds = new Set<string>();
  const uniqueHardSolvedIds = new Set<string>();

  if (Array.isArray(submissions)) {
    for (const sub of submissions) {
      const totalTC = typeof sub.total_test_cases === 'number' && sub.total_test_cases > 0 ? sub.total_test_cases : 5;
      const passedTC = typeof sub.test_cases_passed === 'number' ? sub.test_cases_passed : (sub.status === 'accepted' ? totalTC : 0);
      const isAccepted = sub.status?.toLowerCase() === 'accepted' && passedTC === totalTC && totalTC > 0;

      if (isAccepted) {
        const pId = sub.problem_id || sub.problem_title || sub.id;
        if (pId && !uniqueSolvedProblemIds.has(pId)) {
          uniqueSolvedProblemIds.add(pId);
          const diff = (sub.difficulty || 'Medium').toLowerCase();
          if (diff === 'easy') {
            uniqueEasySolvedIds.add(pId);
          } else if (diff === 'hard') {
            uniqueHardSolvedIds.add(pId);
          } else {
            uniqueMedSolvedIds.add(pId);
          }
        }
      }
    }
  }

  const totalUniqueSolved = uniqueSolvedProblemIds.size;
  const easyCount = uniqueEasySolvedIds.size;
  const medCount = uniqueMedSolvedIds.size;
  const hardCount = uniqueHardSolvedIds.size;

  const hasEasy = easyCount >= 1 ? 1 : 0;
  const hasMed = medCount >= 1 ? 1 : 0;
  const hasHard = hardCount >= 1 ? 1 : 0;
  const allRounderProgress = hasEasy + hasMed + hasHard;

  // Maximum streak achieved (to unlock badges when current or longest reaches requirement)
  const maxStreakAchieved = Math.max(longestStreak, currentStreak);

  // Placement stats for real student activity evaluation
  const placementStats = getPlacementStats(userId);

  // 2. Evaluate each achievement and ensure permanent unlock state is never revoked
  const achievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const isPermanentlyUnlocked = Boolean(permanentBadges[def.id]);
    let unlockedAt = permanentBadges[def.id]?.unlockedAt;

    let progress = 0;
    let maxProgress = def.requirement;
    let progressLabel = '';
    let qualifiesNow = false;

    if (def.category === 'streak') {
      qualifiesNow = maxStreakAchieved >= def.requirement;
      if (isPermanentlyUnlocked || qualifiesNow) {
        progress = def.requirement;
        progressLabel = `${def.requirement} / ${def.requirement} days`;
      } else {
        // Locked badge progress reflects current metric
        progress = Math.min(currentStreak, def.requirement);
        progressLabel = `${progress} / ${def.requirement} days`;
      }
    } else if (def.category === 'problem_solving') {
      qualifiesNow = totalUniqueSolved >= def.requirement;
      if (isPermanentlyUnlocked || qualifiesNow) {
        progress = def.requirement;
        progressLabel = `${def.requirement} / ${def.requirement} problems`;
      } else {
        progress = Math.min(totalUniqueSolved, def.requirement);
        progressLabel = `${progress} / ${def.requirement} problems`;
      }
    } else if (def.category === 'difficulty') {
      if (def.id === 'easy_10') {
        qualifiesNow = easyCount >= 10;
        if (isPermanentlyUnlocked || qualifiesNow) {
          progress = 10;
          progressLabel = '10 / 10 Easy';
        } else {
          progress = Math.min(easyCount, 10);
          progressLabel = `${easyCount} / 10 Easy`;
        }
      } else if (def.id === 'medium_10') {
        qualifiesNow = medCount >= 10;
        if (isPermanentlyUnlocked || qualifiesNow) {
          progress = 10;
          progressLabel = '10 / 10 Medium';
        } else {
          progress = Math.min(medCount, 10);
          progressLabel = `${medCount} / 10 Medium`;
        }
      } else if (def.id === 'hard_10') {
        qualifiesNow = hardCount >= 10;
        if (isPermanentlyUnlocked || qualifiesNow) {
          progress = 10;
          progressLabel = '10 / 10 Hard';
        } else {
          progress = Math.min(hardCount, 10);
          progressLabel = `${hardCount} / 10 Hard`;
        }
      } else if (def.id === 'all_rounder') {
        qualifiesNow = allRounderProgress === 3;
        if (isPermanentlyUnlocked || qualifiesNow) {
          progress = 3;
          progressLabel = 'Easy + Med + Hard';
        } else {
          progress = allRounderProgress;
          progressLabel = `${allRounderProgress} / 3 tiers`;
        }
      }
    } else if (def.category === 'placement') {
      if (def.id === 'mcq_first_test') {
        qualifiesNow = placementStats.totalTests >= 1;
        if (isPermanentlyUnlocked || qualifiesNow) {
          progress = 1;
          progressLabel = '1 / 1 Test';
        } else {
          progress = Math.min(placementStats.totalTests, 1);
          progressLabel = `${progress} / 1 Test`;
        }
      } else if (def.id === 'mcq_solved_10') {
        qualifiesNow = placementStats.totalCorrect >= 10;
        if (isPermanentlyUnlocked || qualifiesNow) {
          progress = 10;
          progressLabel = '10 / 10 Solved';
        } else {
          progress = Math.min(placementStats.totalCorrect, 10);
          progressLabel = `${progress} / 10 Solved`;
        }
      } else if (def.id === 'mcq_solved_50') {
        qualifiesNow = placementStats.totalCorrect >= 50;
        if (isPermanentlyUnlocked || qualifiesNow) {
          progress = 50;
          progressLabel = '50 / 50 Solved';
        } else {
          progress = Math.min(placementStats.totalCorrect, 50);
          progressLabel = `${progress} / 50 Solved`;
        }
      } else if (def.id === 'mcq_solved_100') {
        qualifiesNow = placementStats.totalCorrect >= 100;
        if (isPermanentlyUnlocked || qualifiesNow) {
          progress = 100;
          progressLabel = '100 / 100 Solved';
        } else {
          progress = Math.min(placementStats.totalCorrect, 100);
          progressLabel = `${progress} / 100 Solved`;
        }
      } else if (def.id === 'mcq_perfect_score') {
        qualifiesNow = placementStats.perfectScoresCount >= 1;
        if (isPermanentlyUnlocked || qualifiesNow) {
          progress = 1;
          progressLabel = '100% Score';
        } else {
          progress = 0;
          progressLabel = '0 / 1 Perfect Test';
        }
      } else if (def.id === 'mcq_aptitude_master') {
        qualifiesNow = placementStats.aptitudeSolved >= 30 && placementStats.aptitudeAccuracy >= 80;
        if (isPermanentlyUnlocked || qualifiesNow) {
          progress = 30;
          progressLabel = '30 / 30 Aptitude (80%+ Acc)';
        } else {
          progress = Math.min(placementStats.aptitudeSolved, 30);
          progressLabel = `${progress} / 30 Aptitude (${placementStats.aptitudeAccuracy}% acc)`;
        }
      } else if (def.id === 'mcq_technical_master') {
        qualifiesNow = placementStats.technicalSolved >= 30 && placementStats.technicalAccuracy >= 80;
        if (isPermanentlyUnlocked || qualifiesNow) {
          progress = 30;
          progressLabel = '30 / 30 Tech (80%+ Acc)';
        } else {
          progress = Math.min(placementStats.technicalSolved, 30);
          progressLabel = `${progress} / 30 Tech (${placementStats.technicalAccuracy}% acc)`;
        }
      }
    }

    const isUnlocked = isPermanentlyUnlocked || qualifiesNow;

    // If newly qualified, persist to permanent storage immediately
    if (qualifiesNow && !isPermanentlyUnlocked) {
      unlockedAt = new Date().toISOString();
      savePermanentUnlockedBadge(userId, def.id, unlockedAt);
    }

    return {
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      category: def.category,
      requirement: def.requirement,
      unlocked: isUnlocked,
      progress,
      maxProgress,
      progressLabel,
      unlockedAt,
      unlockMessage: def.unlockMessage,
    };
  });

  const unlockedBadges = achievements.filter((a) => a.unlocked);
  const unlockedCount = unlockedBadges.length;

  // 3. Find latest unlocked achievement (sorted by unlockedAt desc)
  let latestUnlocked: Achievement | null = null;
  if (unlockedBadges.length > 0) {
    const sortedUnlocked = [...unlockedBadges].sort((a, b) => {
      const timeA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
      const timeB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
      return timeB - timeA;
    });
    latestUnlocked = sortedUnlocked[0];
  }

  // 4. Determine current and next streak milestone
  const streakAchievements = achievements.filter((a) => a.category === 'streak');
  const unlockedStreakAchievements = streakAchievements.filter((a) => a.unlocked);
  const currentStreakMilestone =
    unlockedStreakAchievements.length > 0
      ? unlockedStreakAchievements[unlockedStreakAchievements.length - 1]
      : null;

  const nextStreakMilestone = streakAchievements.find((a) => !a.unlocked) || null;

  // 5. Find next milestone across all locked badges (highest % in-progress first, then closest remaining)
  const lockedBadges = achievements.filter((a) => !a.unlocked);
  const nextMilestone =
    [...lockedBadges].sort((a, b) => {
      const hasProgA = a.progress > 0 ? 1 : 0;
      const hasProgB = b.progress > 0 ? 1 : 0;
      if (hasProgA !== hasProgB) {
        return hasProgB - hasProgA;
      }
      const pctA = a.maxProgress > 0 ? a.progress / a.maxProgress : 0;
      const pctB = b.maxProgress > 0 ? b.progress / b.maxProgress : 0;
      if (Math.abs(pctA - pctB) > 0.0001) {
        return pctB - pctA;
      }
      const remainingA = Math.max(0, a.maxProgress - a.progress);
      const remainingB = Math.max(0, b.maxProgress - b.progress);
      return remainingA - remainingB;
    })[0] || null;

  // 6. Motivational streak progress message
  let streakMotivationalMessage = 'Start your first practice day today!';
  if (currentStreak === 0 && maxStreakAchieved === 0) {
    streakMotivationalMessage = 'Complete your first coding challenge to earn your first badge.';
  } else if (currentStreak === 0 && maxStreakAchieved > 0) {
    streakMotivationalMessage = 'Submit a solution today to restart your practice streak!';
  } else if (nextStreakMilestone) {
    const daysNeeded = Math.max(1, nextStreakMilestone.requirement - currentStreak);
    streakMotivationalMessage = `${daysNeeded} more ${daysNeeded === 1 ? 'day' : 'days'} to reach ${nextStreakMilestone.name}`;
  } else {
    streakMotivationalMessage = 'You are a 100-Day Legend! Keep the momentum going!';
  }

  const sortedAchievements = sortAchievements(achievements);

  return {
    unlockedCount,
    totalCount: achievements.length,
    achievements: sortedAchievements,
    currentStreak,
    longestStreak,
    latestUnlocked,
    currentStreakMilestone,
    nextStreakMilestone,
    nextMilestone,
    streakMotivationalMessage,
  };
}

/**
 * Helper to check for newly unlocked achievements after a submission
 * Uses a dedicated notified list so toasts are only shown once per unlock
 */
export function checkNewlyUnlockedAchievements(
  submissions: CodingSubmission[],
  userId: string = 'guest'
): Achievement[] {
  const summary = calculateAchievements(submissions, userId);
  const currentlyUnlocked = summary.achievements.filter((a) => a.unlocked);

  const notifiedKey = `careerpilot_notified_achievements_${userId}`;
  let notifiedIds: string[] = [];
  try {
    notifiedIds = JSON.parse(localStorage.getItem(notifiedKey) || '[]');
  } catch (_) {
    notifiedIds = [];
  }

  const newlyUnlocked: Achievement[] = [];
  for (const ach of currentlyUnlocked) {
    if (!notifiedIds.includes(ach.id)) {
      newlyUnlocked.push(ach);
      notifiedIds.push(ach.id);
    }
  }

  // Update notified in persistent storage
  if (newlyUnlocked.length > 0) {
    try {
      localStorage.setItem(notifiedKey, JSON.stringify(notifiedIds));
    } catch (_) {}
  }

  return newlyUnlocked;
}

/**
 * Get formatted user achievements summary with recently unlocked items
 */
export function getUserAchievementsSummary(
  submissions: CodingSubmission[],
  userId: string = 'guest'
): UserAchievementsSummary & { recentlyUnlocked: Achievement[] } {
  const summary = calculateAchievements(submissions, userId);
  const recentlyUnlocked = summary.achievements
    .filter((a) => a.unlocked)
    .sort((a, b) => (b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0) - (a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0))
    .slice(0, 3);

  return {
    ...summary,
    recentlyUnlocked,
  };
}
