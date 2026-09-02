import { CodingSubmission, Achievement, AchievementCategory, UserAchievementsSummary } from '../types/coding';
import { AppNotification } from '../types/notification';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getPlacementStats, getPlacementHistory } from './placementStorage';
import { persistenceManager } from './persistenceManager';
import { notificationService } from './notificationService';
import { interviewStorage } from './interviewStorage';
import { resumeService } from './resumeService';
import { mentorStorageService } from './mentorStorageService';
import { getCompletedItemIds } from './roadmapStorage';
import { getStudentTargets } from './companyPrepStorage';

export type AchievementStatus = 'LOCKED' | 'IN_PROGRESS' | 'UNLOCKED';

export interface EvaluatedAchievement {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  currentValue: number;
  targetValue: number;
  requirement: number;
  progress: number;
  maxProgress: number;
  progressLabel: string;
  percentage: number;
  status: AchievementStatus;
  unlocked: boolean;
  unlockedAt?: string;
  unlockMessage: string;
  criteria: string;
}

export interface MultiPillarAchievementContext {
  placementSessions?: any[];
  placementStats?: {
    totalTests: number;
    totalQuestions?: number;
    totalQuestionsSolved?: number;
    totalCorrect: number;
    accuracy?: number;
    overallAccuracy?: number;
    aptitudeSolved: number;
    technicalSolved: number;
    perfectScoresCount: number;
    aptitudeAccuracy?: number;
    technicalAccuracy?: number;
  };
  mockInterviews?: any[];
  resumes?: any[];
  latestResumeAnalysis?: any;
  jobMatches?: any[];
  mentorConversations?: any[];
  mentorMessagesCount?: number;
  readinessScore?: number | null;
  targetCompanies?: string[];
  completedRoadmapIds?: string[];
}

/**
 * Synchronously gather multi-pillar student context across all preparation pillars.
 * Ensures identical context calculation between Practice, Achievements, Intelligence, and Notifications.
 */
export function getStudentMultiPillarContext(userId: string = 'guest'): MultiPillarAchievementContext {
  try {
    const placementSessions = getPlacementHistory(userId);
    const placementStats = getPlacementStats(userId);
    const mockInterviews = interviewStorage.getReports(userId);
    const resumes = resumeService.getCachedUserResumes(userId);
    const latestResume = resumes.find((r) => r.isCurrent) || resumes[0] || null;
    const mentorConversations = mentorStorageService.getCachedConversations(userId);
    const mentorMessagesCount = mentorConversations.reduce(
      (acc: number, c: any) => acc + (Array.isArray(c.messages) ? c.messages.length : 0),
      0
    );
    const targetCompanies = getStudentTargets(userId).map((t) => t.companyName || t.id);
    const completedRoadmapIds = getCompletedItemIds(userId);

    return {
      placementSessions,
      placementStats,
      mockInterviews,
      resumes,
      latestResumeAnalysis: latestResume?.analysisResult,
      mentorConversations,
      mentorMessagesCount,
      targetCompanies,
      completedRoadmapIds,
    };
  } catch (err) {
    console.warn('[AchievementService] Error reading student multi-pillar context:', err);
    return {};
  }
}

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
    name: 'All-Rounder Prep',
    description: 'Solve at least 1 Easy, 1 Medium, and 1 Hard problem across all 3 tiers',
    icon: '🌟',
    category: 'difficulty',
    requirement: 3,
    unlockMessage: 'Versatile engineer! Solved problems in Easy, Medium, and Hard across all 3 tiers.',
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

  // 5. Technical Mock Interview Badges (4)
  {
    id: 'interview_first',
    name: 'Interview Debut',
    description: 'Completed your first AI-evaluated Mock Interview',
    icon: '🎤',
    category: 'interview',
    requirement: 1,
    unlockMessage: 'Great job! Stepped into the technical arena and completed your first mock interview.',
  },
  {
    id: 'interview_5',
    name: 'Interview Veteran',
    description: 'Completed 5 technical mock interview sessions',
    icon: '🎙️',
    category: 'interview',
    requirement: 5,
    unlockMessage: 'Incredible dedication! Completed 5 full mock interview sessions.',
  },
  {
    id: 'interview_improver',
    name: 'Interview Improver',
    description: 'Completed 2+ interviews with avg score >= 70',
    icon: '📈',
    category: 'interview',
    requirement: 2,
    unlockMessage: 'Demonstrated real interview performance improvement!',
  },
  {
    id: 'interview_high_scorer',
    name: 'Top Candidate',
    description: 'Scored 85+ on an AI-evaluated mock interview',
    icon: '⭐',
    category: 'interview',
    requirement: 85,
    unlockMessage: 'Elite performance! Scored 85+ on a technical mock interview.',
  },

  // 6. Resume & ATS Badges (3)
  {
    id: 'resume_analyzed',
    name: 'Resume Benchmarked',
    description: 'Uploaded & analyzed resume for ATS compliance',
    icon: '📄',
    category: 'resume',
    requirement: 1,
    unlockMessage: 'Resume scanned! Generated your baseline ATS and keyword match analysis.',
  },
  {
    id: 'ats_optimized_75',
    name: 'ATS Ready',
    description: 'Achieved an ATS score of 75+ on your resume',
    icon: '✨',
    category: 'resume',
    requirement: 75,
    unlockMessage: 'ATS Optimized! Your resume scored 75+ against industry hiring standards.',
  },
  {
    id: 'job_matcher',
    name: 'Job Target Aligned',
    description: 'Analyzed resume match against a specific job role',
    icon: '🎯',
    category: 'resume',
    requirement: 1,
    unlockMessage: 'Role targeted! Tailored your profile to a specific employer job description.',
  },

  // 7. AI Career Mentor Badges (2)
  {
    id: 'mentor_first_chat',
    name: 'Mentor Guidance',
    description: 'Consulted with the AI Career Mentor',
    icon: '🤖',
    category: 'mentor',
    requirement: 1,
    unlockMessage: 'Strategic thinking! Started personalized consultation with AI Career Mentor.',
  },
  {
    id: 'mentor_deep_dive',
    name: 'Strategic Direction',
    description: '5+ mentorship exchanges for career roadmap advice',
    icon: '🧭',
    category: 'mentor',
    requirement: 5,
    unlockMessage: 'Deep career clarity! Actively refining your trajectory with AI Mentor advice.',
  },

  // 8. Career Readiness Milestones (3)
  {
    id: 'readiness_tier_50',
    name: 'On the Radar',
    description: 'Reached 50% overall Career Readiness',
    icon: '🌱',
    category: 'career',
    requirement: 50,
    unlockMessage: 'Halfway there! Passed 50% overall career readiness.',
  },
  {
    id: 'readiness_tier_70',
    name: 'Placement Ready',
    description: 'Reached 70% overall Career Readiness',
    icon: '🚀',
    category: 'career',
    requirement: 70,
    unlockMessage: 'Interview Ready! Passed 70% overall career readiness.',
  },
  {
    id: 'readiness_tier_85',
    name: 'Elite Benchmark',
    description: 'Reached 85% overall Career Readiness',
    icon: '👑',
    category: 'career',
    requirement: 85,
    unlockMessage: 'Top 5% Candidate! Reached 85%+ overall career readiness.',
  },

  // 9. Company Preparation Badges (2)
  {
    id: 'company_target_set',
    name: 'Target Locked',
    description: 'Targeted a specific dream company for preparation',
    icon: '🏢',
    category: 'company',
    requirement: 1,
    unlockMessage: 'Laser focus! Added target company to your personalized prep roadmap.',
  },
  {
    id: 'company_prep_champion',
    name: 'Company Prep Pro',
    description: 'Completed customized prep for target companies',
    icon: '💼',
    category: 'company',
    requirement: 2,
    unlockMessage: 'Tailored mastery! Prepped specifically for company hiring benchmarks.',
  },

  // 10. Multi-Pillar & Precision Badges (2)
  {
    id: 'multi_pillar_builder',
    name: 'Multi-Pillar Builder',
    description: 'Active across 3 or more preparation pillars',
    icon: '🌐',
    category: 'improvement',
    requirement: 3,
    unlockMessage: 'Holistic growth! Active in coding, interviews, tests, and resume building.',
  },
  {
    id: 'accuracy_ace',
    name: 'High Precision',
    description: 'Maintained 80%+ test-case pass rate (min 5 submissions)',
    icon: '🎯',
    category: 'improvement',
    requirement: 80,
    unlockMessage: 'Precision engineer! Maintained 80%+ test case pass rate on coding challenges.',
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

export interface AchievementEvaluationMetrics {
  currentStreak: number;
  longestStreak: number;
  maxStreakAchieved: number;
  totalUniqueSolved: number;
  easyCount: number;
  medCount: number;
  hardCount: number;
  allRounderProgress: number;
  placementStats: any;
  interviewCount: number;
  interviewScores: number[];
  maxInterviewScore: number;
  avgInterviewScore: number;
  mockInterviews: any[];
  resumes: any[];
  latestResumeScore: number;
  hasResume: boolean;
  jobMatchesCount: number;
  mentorMessagesCount: number;
  readinessScore: number;
  targetCompaniesCount: number;
  activePillarsCount: number;
  totalSubmissionsCount: number;
  totalAcceptedSubmissionsCount: number;
  accuracyRate: number;
  isPermanentlyUnlocked: boolean;
  unlockedAt?: string;
}

/**
 * Single source of truth for individual achievement evaluation.
 * Returns consistent status ('LOCKED' | 'IN_PROGRESS' | 'UNLOCKED'), percentage, and values.
 */
export function evaluateAchievement(
  def: (typeof ACHIEVEMENT_DEFINITIONS)[0],
  metrics: AchievementEvaluationMetrics
): EvaluatedAchievement {
  const {
    currentStreak,
    maxStreakAchieved,
    totalUniqueSolved,
    easyCount,
    medCount,
    hardCount,
    allRounderProgress,
    placementStats,
    interviewCount,
    maxInterviewScore,
    avgInterviewScore,
    latestResumeScore,
    hasResume,
    jobMatchesCount,
    mentorMessagesCount,
    readinessScore,
    targetCompaniesCount,
    activePillarsCount,
    totalSubmissionsCount,
    accuracyRate,
    isPermanentlyUnlocked,
  } = metrics;

  let unlockedAt = metrics.unlockedAt;
  let progress = 0;
  let maxProgress = def.requirement;
  let currentValue = 0;
  let targetValue = def.requirement;
  let progressLabel = '';
  let qualifiesNow = false;
  let criteria = def.description;

  if (def.category === 'streak') {
    qualifiesNow = maxStreakAchieved >= def.requirement;
    targetValue = def.requirement;
    currentValue = Math.min(maxStreakAchieved, def.requirement);
    progress = qualifiesNow ? def.requirement : Math.min(currentStreak, def.requirement);
    progressLabel = qualifiesNow ? `${def.requirement} / ${def.requirement} days` : `${progress} / ${def.requirement} days`;
    criteria = `Practice for ${def.requirement} consecutive days`;
  } else if (def.category === 'problem_solving') {
    qualifiesNow = totalUniqueSolved >= def.requirement;
    targetValue = def.requirement;
    currentValue = Math.min(totalUniqueSolved, def.requirement);
    progress = qualifiesNow ? def.requirement : Math.min(totalUniqueSolved, def.requirement);
    progressLabel = `${progress} / ${def.requirement} problems`;
    criteria = `Solve ${def.requirement} distinct coding problems`;
  } else if (def.category === 'difficulty') {
    if (def.id === 'easy_10') {
      qualifiesNow = easyCount >= 10;
      targetValue = 10;
      currentValue = Math.min(easyCount, 10);
      progress = qualifiesNow ? 10 : Math.min(easyCount, 10);
      progressLabel = `${progress} / 10 Easy`;
      criteria = 'Solve 10 Easy-level coding challenges';
    } else if (def.id === 'medium_10') {
      qualifiesNow = medCount >= 10;
      targetValue = 10;
      currentValue = Math.min(medCount, 10);
      progress = qualifiesNow ? 10 : Math.min(medCount, 10);
      progressLabel = `${progress} / 10 Medium`;
      criteria = 'Solve 10 Medium-level coding challenges';
    } else if (def.id === 'hard_10') {
      qualifiesNow = hardCount >= 10;
      targetValue = 10;
      currentValue = Math.min(hardCount, 10);
      progress = qualifiesNow ? 10 : Math.min(hardCount, 10);
      progressLabel = `${progress} / 10 Hard`;
      criteria = 'Solve 10 Hard-level coding challenges';
    } else if (def.id === 'all_rounder') {
      // All-Rounder Prep requires completing all 3 difficulty tiers (Easy, Med, Hard)
      qualifiesNow = allRounderProgress === 3;
      targetValue = 3;
      currentValue = allRounderProgress;
      progress = qualifiesNow ? 3 : allRounderProgress;
      progressLabel = qualifiesNow ? 'Easy + Med + Hard' : `${allRounderProgress} / 3 tiers`;
      criteria = 'Solve at least 1 Easy, 1 Medium, and 1 Hard problem across all 3 tiers';
    }
  } else if (def.category === 'placement') {
    if (def.id === 'mcq_first_test') {
      qualifiesNow = placementStats.totalTests >= 1;
      targetValue = 1;
      currentValue = Math.min(placementStats.totalTests, 1);
      progress = qualifiesNow ? 1 : currentValue;
      progressLabel = `${progress} / 1 Test`;
      criteria = 'Complete your first placement practice assessment';
    } else if (def.id === 'mcq_solved_10') {
      qualifiesNow = placementStats.totalCorrect >= 10;
      targetValue = 10;
      currentValue = Math.min(placementStats.totalCorrect, 10);
      progress = qualifiesNow ? 10 : currentValue;
      progressLabel = `${progress} / 10 Solved`;
      criteria = 'Solve 10 placement questions correctly';
    } else if (def.id === 'mcq_solved_50') {
      qualifiesNow = placementStats.totalCorrect >= 50;
      targetValue = 50;
      currentValue = Math.min(placementStats.totalCorrect, 50);
      progress = qualifiesNow ? 50 : currentValue;
      progressLabel = `${progress} / 50 Solved`;
      criteria = 'Solve 50 placement questions correctly';
    } else if (def.id === 'mcq_solved_100') {
      qualifiesNow = placementStats.totalCorrect >= 100;
      targetValue = 100;
      currentValue = Math.min(placementStats.totalCorrect, 100);
      progress = qualifiesNow ? 100 : currentValue;
      progressLabel = `${progress} / 100 Solved`;
      criteria = 'Solve 100 placement questions correctly';
    } else if (def.id === 'mcq_perfect_score') {
      qualifiesNow = placementStats.perfectScoresCount >= 1;
      targetValue = 1;
      currentValue = placementStats.perfectScoresCount >= 1 ? 1 : 0;
      progress = qualifiesNow ? 1 : 0;
      progressLabel = qualifiesNow ? '100% Score' : '0 / 1 Perfect Test';
      criteria = 'Score 100% accuracy on a complete placement test';
    } else if (def.id === 'mcq_aptitude_master') {
      qualifiesNow = placementStats.aptitudeSolved >= 30 && (placementStats.aptitudeAccuracy ?? 0) >= 80;
      targetValue = 30;
      currentValue = Math.min(placementStats.aptitudeSolved, 30);
      progress = qualifiesNow ? 30 : currentValue;
      progressLabel = `${progress} / 30 Aptitude (${placementStats.aptitudeAccuracy ?? 0}% acc)`;
      criteria = 'Solve 30 Aptitude questions with 80%+ accuracy';
    } else if (def.id === 'mcq_technical_master') {
      qualifiesNow = placementStats.technicalSolved >= 30 && (placementStats.technicalAccuracy ?? 0) >= 80;
      targetValue = 30;
      currentValue = Math.min(placementStats.technicalSolved, 30);
      progress = qualifiesNow ? 30 : currentValue;
      progressLabel = `${progress} / 30 Tech (${placementStats.technicalAccuracy ?? 0}% acc)`;
      criteria = 'Solve 30 Technical MCQs with 80%+ accuracy';
    }
  } else if (def.category === 'interview') {
    if (def.id === 'interview_first') {
      qualifiesNow = interviewCount >= 1;
      targetValue = 1;
      currentValue = Math.min(interviewCount, 1);
      progress = qualifiesNow ? 1 : currentValue;
      progressLabel = `${progress} / 1 Interview`;
      criteria = 'Complete your first AI mock interview session';
    } else if (def.id === 'interview_5') {
      qualifiesNow = interviewCount >= 5;
      targetValue = 5;
      currentValue = Math.min(interviewCount, 5);
      progress = qualifiesNow ? 5 : currentValue;
      progressLabel = `${progress} / 5 Interviews`;
      criteria = 'Complete 5 AI mock interview sessions';
    } else if (def.id === 'interview_improver') {
      qualifiesNow = interviewCount >= 2 && avgInterviewScore >= 70;
      targetValue = 2;
      currentValue = Math.min(interviewCount, 2);
      progress = qualifiesNow ? 2 : currentValue;
      progressLabel = qualifiesNow ? 'Avg 70+ (2+ rounds)' : `${interviewCount} / 2 rounds (${avgInterviewScore} avg)`;
      criteria = 'Complete 2+ interviews with an average score of 70%+';
    } else if (def.id === 'interview_high_scorer') {
      qualifiesNow = maxInterviewScore >= 85;
      targetValue = 85;
      currentValue = Math.min(maxInterviewScore, 85);
      progress = qualifiesNow ? 85 : currentValue;
      progressLabel = `${currentValue} / 85 Score`;
      criteria = 'Score 85%+ overall in an AI mock interview';
    }
  } else if (def.category === 'resume') {
    if (def.id === 'resume_analyzed') {
      qualifiesNow = hasResume;
      targetValue = 1;
      currentValue = hasResume ? 1 : 0;
      progress = qualifiesNow ? 1 : 0;
      progressLabel = qualifiesNow ? 'Resume Analyzed' : '0 / 1 Uploaded';
      criteria = 'Upload and evaluate a resume in Resume Analyzer';
    } else if (def.id === 'ats_optimized_75') {
      qualifiesNow = latestResumeScore >= 75;
      targetValue = 75;
      currentValue = Math.min(latestResumeScore, 75);
      progress = qualifiesNow ? 75 : currentValue;
      progressLabel = `${currentValue} / 75 ATS`;
      criteria = 'Achieve an ATS compatibility score of 75%+';
    } else if (def.id === 'job_matcher') {
      qualifiesNow = jobMatchesCount >= 1;
      targetValue = 1;
      currentValue = Math.min(jobMatchesCount, 1);
      progress = qualifiesNow ? 1 : 0;
      progressLabel = qualifiesNow ? 'Target Aligned' : '0 / 1 Matched';
      criteria = 'Match your resume against a target job description';
    }
  } else if (def.category === 'mentor') {
    if (def.id === 'mentor_first_chat') {
      qualifiesNow = mentorMessagesCount >= 1;
      targetValue = 1;
      currentValue = Math.min(mentorMessagesCount, 1);
      progress = qualifiesNow ? 1 : 0;
      progressLabel = qualifiesNow ? 'Consulted' : '0 / 1 Session';
      criteria = 'Ask your first guidance question to AI Career Mentor';
    } else if (def.id === 'mentor_deep_dive') {
      qualifiesNow = mentorMessagesCount >= 5;
      targetValue = 5;
      currentValue = Math.min(mentorMessagesCount, 5);
      progress = qualifiesNow ? 5 : currentValue;
      progressLabel = `${progress} / 5 Exchanges`;
      criteria = 'Engage in 5 or more career mentor discussions';
    }
  } else if (def.category === 'career') {
    if (def.id === 'readiness_tier_50') {
      qualifiesNow = readinessScore >= 50;
      targetValue = 50;
      currentValue = Math.min(readinessScore, 50);
      progress = qualifiesNow ? 50 : currentValue;
      progressLabel = `${currentValue}% / 50% Readiness`;
      criteria = 'Reach 50%+ overall Career Readiness score';
    } else if (def.id === 'readiness_tier_70') {
      qualifiesNow = readinessScore >= 70;
      targetValue = 70;
      currentValue = Math.min(readinessScore, 70);
      progress = qualifiesNow ? 70 : currentValue;
      progressLabel = `${currentValue}% / 70% Readiness`;
      criteria = 'Reach 70%+ overall Career Readiness score';
    } else if (def.id === 'readiness_tier_85') {
      qualifiesNow = readinessScore >= 85;
      targetValue = 85;
      currentValue = Math.min(readinessScore, 85);
      progress = qualifiesNow ? 85 : currentValue;
      progressLabel = `${currentValue}% / 85% Readiness`;
      criteria = 'Reach 85%+ overall Career Readiness score';
    }
  } else if (def.category === 'company') {
    if (def.id === 'company_target_set') {
      qualifiesNow = targetCompaniesCount >= 1;
      targetValue = 1;
      currentValue = Math.min(targetCompaniesCount, 1);
      progress = qualifiesNow ? 1 : 0;
      progressLabel = qualifiesNow ? `${targetCompaniesCount} Target Companies` : '0 / 1 Target Set';
      criteria = 'Add at least 1 target company to your prep plan';
    } else if (def.id === 'company_prep_champion') {
      qualifiesNow = targetCompaniesCount >= 2 || (targetCompaniesCount >= 1 && (interviewCount >= 1 || totalUniqueSolved >= 5));
      targetValue = 2;
      currentValue = Math.min(targetCompaniesCount, 2);
      progress = qualifiesNow ? 2 : currentValue;
      progressLabel = qualifiesNow ? 'Company Prep Mastered' : `${progress} / 2 Targets`;
      criteria = 'Add 2+ target companies or complete company-aligned prep';
    }
  } else if (def.category === 'improvement') {
    if (def.id === 'multi_pillar_builder') {
      qualifiesNow = activePillarsCount >= 3;
      targetValue = 3;
      currentValue = Math.min(activePillarsCount, 3);
      progress = qualifiesNow ? 3 : currentValue;
      progressLabel = `${activePillarsCount} / 3 Active Pillars`;
      criteria = 'Be active across 3 or more preparation pillars (Coding, Tests, Interviews, Resume, Mentor, Target Companies)';
    } else if (def.id === 'accuracy_ace') {
      qualifiesNow = totalSubmissionsCount >= 5 && accuracyRate >= 80;
      targetValue = 80;
      currentValue = totalSubmissionsCount >= 5 ? Math.min(accuracyRate, 80) : 0;
      progress = qualifiesNow ? 80 : currentValue;
      progressLabel = totalSubmissionsCount >= 5 ? `${accuracyRate}% Acc (min 5)` : `${totalSubmissionsCount} / 5 submissions`;
      criteria = 'Achieve 80%+ submission accuracy with at least 5 submissions';
    }
  }

  // Authoritative Completion Rule:
  // An achievement is strictly UNLOCKED if and only if qualifiesNow is true.
  // Partial progress (e.g. 1/3 tiers, 33%, 50%, in progress) is NEVER unlocked.
  const isUnlocked = Boolean(qualifiesNow);
  if (isUnlocked && !unlockedAt) {
    unlockedAt = new Date().toISOString();
  }

  const percentage = targetValue > 0 ? Math.min(100, Math.round((progress / targetValue) * 100)) : (isUnlocked ? 100 : 0);
  const status: AchievementStatus = isUnlocked ? 'UNLOCKED' : (progress > 0 ? 'IN_PROGRESS' : 'LOCKED');

  return {
    id: def.id,
    name: def.name,
    title: def.name,
    description: def.description,
    icon: def.icon,
    category: def.category,
    requirement: def.requirement,
    currentValue,
    targetValue,
    progress,
    maxProgress: targetValue,
    progressLabel,
    percentage,
    status,
    unlocked: isUnlocked,
    unlockedAt: isUnlocked ? unlockedAt : undefined,
    unlockMessage: def.unlockMessage,
    criteria,
  };
}

/**
 * Calculate all achievements dynamically and merge with permanently unlocked badges
 * Single Source of Truth + Permanent Badge Retention
 */
export function calculateAchievements(
  submissions: CodingSubmission[],
  userId: string = 'guest',
  context?: MultiPillarAchievementContext
): UserAchievementsSummary {
  const { currentStreak, longestStreak } = calculateStreaks(submissions, userId);
  const permanentBadges = getPermanentUnlockedBadges(userId);

  // Synchronously resolve full student context so practice views, intelligence, and notifications evaluate identically
  const resolvedContext: MultiPillarAchievementContext = {
    ...getStudentMultiPillarContext(userId),
    ...context,
  };

  // 1. Gather unique solved problems (status === 'accepted')
  const uniqueSolvedProblemIds = new Set<string>();
  const uniqueEasySolvedIds = new Set<string>();
  const uniqueMedSolvedIds = new Set<string>();
  const uniqueHardSolvedIds = new Set<string>();
  let totalSubmissionsCount = 0;
  let totalAcceptedSubmissionsCount = 0;

  if (Array.isArray(submissions)) {
    totalSubmissionsCount = submissions.length;
    for (const sub of submissions) {
      const totalTC = typeof sub.total_test_cases === 'number' && sub.total_test_cases > 0 ? sub.total_test_cases : 5;
      const passedTC = typeof sub.test_cases_passed === 'number' ? sub.test_cases_passed : (sub.status === 'accepted' ? totalTC : 0);
      const isAccepted = sub.status?.toLowerCase() === 'accepted' && passedTC === totalTC && totalTC > 0;

      if (isAccepted) {
        totalAcceptedSubmissionsCount++;
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

  // Maximum streak achieved
  const maxStreakAchieved = Math.max(longestStreak, currentStreak);

  // Placement stats
  const placementStats = resolvedContext.placementStats || getPlacementStats(userId);

  // Interview metrics
  const mockInterviews = resolvedContext.mockInterviews || [];
  const interviewCount = mockInterviews.length;
  const interviewScores = mockInterviews
    .map((i: any) => i.overall_score ?? i.overallScore ?? 0)
    .filter((s: number) => typeof s === 'number' && s > 0);
  const maxInterviewScore = interviewScores.length > 0 ? Math.max(...interviewScores) : 0;
  const avgInterviewScore = interviewScores.length > 0
    ? Math.round(interviewScores.reduce((a: number, b: number) => a + b, 0) / interviewScores.length)
    : 0;

  // Resume metrics
  const resumes = resolvedContext.resumes || [];
  const latestResumeScore = resolvedContext.latestResumeAnalysis?.result?.overall_score ?? (resumes[0] as any)?.atsScore ?? (resumes[0] as any)?.score ?? 0;
  const hasResume = resumes.length > 0 || Boolean(resolvedContext.latestResumeAnalysis);
  const jobMatchesCount = resolvedContext.jobMatches?.length || 0;

  // Mentor metrics
  const mentorMessagesCount = (resolvedContext.mentorMessagesCount || 0) + (resolvedContext.mentorConversations?.length || 0);

  // Career Readiness
  const readinessScore = typeof resolvedContext.readinessScore === 'number' ? resolvedContext.readinessScore : 0;

  // Company prep
  const targetCompanies = resolvedContext.targetCompanies || [];
  const targetCompaniesCount = targetCompanies.length;

  // Active pillars count (holistic growth)
  let activePillarsCount = 0;
  if (totalSubmissionsCount > 0) activePillarsCount++;
  if (placementStats.totalTests > 0) activePillarsCount++;
  if (interviewCount > 0) activePillarsCount++;
  if (hasResume) activePillarsCount++;
  if (mentorMessagesCount > 0) activePillarsCount++;
  if (targetCompaniesCount > 0) activePillarsCount++;

  // Accuracy calculation
  const accuracyRate = totalSubmissionsCount > 0
    ? Math.round((totalAcceptedSubmissionsCount / totalSubmissionsCount) * 100)
    : 0;

  const evaluationMetrics: AchievementEvaluationMetrics = {
    currentStreak,
    longestStreak,
    maxStreakAchieved,
    totalUniqueSolved,
    easyCount,
    medCount,
    hardCount,
    allRounderProgress,
    placementStats,
    interviewCount,
    interviewScores,
    maxInterviewScore,
    avgInterviewScore,
    mockInterviews,
    resumes,
    latestResumeScore,
    hasResume,
    jobMatchesCount,
    mentorMessagesCount,
    readinessScore,
    targetCompaniesCount,
    activePillarsCount,
    totalSubmissionsCount,
    totalAcceptedSubmissionsCount,
    accuracyRate,
    isPermanentlyUnlocked: false,
  };

  // 2. Evaluate each achievement through centralized evaluateAchievement
  const achievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const isPermanentlyUnlocked = Boolean(permanentBadges[def.id]);
    const unlockedAt = permanentBadges[def.id]?.unlockedAt;

    const evaluated = evaluateAchievement(def, {
      ...evaluationMetrics,
      isPermanentlyUnlocked,
      unlockedAt,
    });

    return {
      id: evaluated.id,
      name: evaluated.name,
      description: evaluated.description,
      icon: evaluated.icon,
      category: evaluated.category,
      requirement: evaluated.requirement,
      unlocked: evaluated.unlocked,
      progress: evaluated.progress,
      maxProgress: evaluated.maxProgress,
      progressLabel: evaluated.progressLabel,
      unlockedAt: evaluated.unlocked ? (unlockedAt || evaluated.unlockedAt) : undefined,
      unlockMessage: evaluated.unlockMessage,
      status: evaluated.status,
      percentage: evaluated.percentage,
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
 * Helper to check for newly unlocked achievements after an activity (submission, test, interview, etc.)
 * Strictly verifies state transition: previous state != UNLOCKED AND current state == UNLOCKED.
 * Persists permanent unlocked badge state and creates deduplicated notification.
 */
export function checkNewlyUnlockedAchievements(
  submissions: CodingSubmission[],
  userId: string = 'guest',
  context?: MultiPillarAchievementContext
): Achievement[] {
  const permanentBadges = getPermanentUnlockedBadges(userId);
  const summary = calculateAchievements(submissions, userId, context);
  const nowIso = new Date().toISOString();

  const newlyUnlocked: Achievement[] = [];
  for (const ach of summary.achievements) {
    const wasPermanentlyUnlocked = Boolean(permanentBadges[ach.id]);

    // 1. Authoritative Unlock Check (UNIVERSAL FOR ALL ACHIEVEMENTS):
    // - Must be marked unlocked by calculateAchievements (ach.unlocked === true)
    // - Status must be 'UNLOCKED'
    // - Progress must be at or above maxProgress (ach.progress >= ach.maxProgress)
    const isStrictlyUnlocked = Boolean(
      ach.unlocked &&
      ach.status === 'UNLOCKED' &&
      ach.progress >= ach.maxProgress
    );

    // If it's NOT authoritatively completed, it must NEVER generate an unlock notification
    if (!isStrictlyUnlocked) {
      continue;
    }

    // 2. Transition Check: Only newly unlocked if it was NOT unlocked before and is NOW strictly UNLOCKED
    if (isStrictlyUnlocked && !wasPermanentlyUnlocked) {
      // 3. Deterministic Idempotency Key: userId + achievementId + achievement unlock event
      const dedupKey = `achievement_unlock_${userId}_${ach.id}`;
      const dedupStorageKey = `careerpilot_notif_dedup_${userId}_${dedupKey}`;

      // Check if this deterministic event was already recorded
      if (localStorage.getItem(dedupStorageKey)) {
        savePermanentUnlockedBadge(userId, ach.id, nowIso);
        continue;
      }

      savePermanentUnlockedBadge(userId, ach.id, nowIso);
      try {
        localStorage.setItem(dedupStorageKey, nowIso);
      } catch (_) {}

      newlyUnlocked.push({
        ...ach,
        unlockedAt: nowIso,
      });

      if (userId && userId !== 'guest') {
        notificationService
          .createNotification(userId, {
            type: 'achievement',
            category: 'ACHIEVEMENT',
            priority: 'high',
            title: '🏆 Achievement Unlocked!',
            message: `Congratulations! You unlocked the "${ach.name}" achievement badge.`,
            action_url: '/coding?tab=achievements',
            action_label: 'View Achievements',
            dedup_key: dedupKey,
            metadata: {
              achievement_id: ach.id,
              achievement_name: ach.name,
              category: ach.category,
            },
          })
          .catch(() => {});
      }
    }
  }

  return newlyUnlocked;
}

/**
 * Sanitizes and cleans up any invalid or duplicate achievement notifications.
 * - Ensures invalid "unlocked" notifications for incomplete achievements are removed.
 * - Ensures existing valid notifications remain intact.
 * - Deduplicates notifications to guarantee at most one notification per completed achievement.
 * - Cleans up corrupted permanent badge storage if an achievement is incomplete.
 */
export async function sanitizeAndCleanAchievementNotifications(
  notifications: AppNotification[],
  userId: string,
  submissions?: CodingSubmission[]
): Promise<AppNotification[]> {
  if (!userId || userId === 'guest' || !Array.isArray(notifications) || notifications.length === 0) {
    return notifications;
  }

  try {
    // 1. Resolve submissions to evaluate authoritative state
    let effectiveSubmissions = submissions;
    if (!effectiveSubmissions || effectiveSubmissions.length === 0) {
      try {
        const localKey = `careerpilot_subs_${userId}`;
        const raw = localStorage.getItem(localKey);
        if (raw) {
          effectiveSubmissions = JSON.parse(raw);
        }
      } catch (_) {}
    }

    const summary = calculateAchievements(effectiveSubmissions || [], userId);
    const achMap = new Map<string, Achievement>();
    for (const a of summary.achievements) {
      achMap.set(a.id, a);
    }

    // 2. Clean up corrupted permanentBadges in localStorage if incomplete
    const permanentBadges = getPermanentUnlockedBadges(userId);
    let badgesCleaned = false;
    for (const [badgeId] of Object.entries(permanentBadges)) {
      const ach = achMap.get(badgeId);
      if (ach) {
        const isActuallyComplete = Boolean(
          ach.unlocked &&
          ach.status === 'UNLOCKED' &&
          ach.progress >= ach.maxProgress
        );
        if (!isActuallyComplete) {
          delete permanentBadges[badgeId];
          badgesCleaned = true;
          try {
            localStorage.removeItem(`careerpilot_notif_dedup_${userId}_achievement_unlock_${userId}_${badgeId}`);
            localStorage.removeItem(`careerpilot_notif_dedup_${userId}_achievement_${badgeId}`);
          } catch (_) {}
        }
      }
    }
    if (badgesCleaned) {
      try {
        localStorage.setItem(`careerpilot_unlocked_badges_${userId}`, JSON.stringify(permanentBadges));
      } catch (_) {}
    }

    // 3. Process notifications
    const seenAchKeys = new Set<string>();
    const seenDedupKeys = new Set<string>();
    const seenIds = new Set<string>();
    const cleanedList: AppNotification[] = [];
    const invalidNotificationIds: string[] = [];

    for (const notif of notifications) {
      // Non-achievement notifications: deduplicate by id and preserve
      if (notif.category !== 'ACHIEVEMENT' && notif.type !== 'achievement') {
        if (!seenIds.has(notif.id)) {
          seenIds.add(notif.id);
          cleanedList.push(notif);
        }
        continue;
      }

      // Achievement notification: resolve target achievement
      let achId = notif.metadata?.achievement_id;
      if (!achId && notif.dedup_key) {
        const m = notif.dedup_key.match(/achievement(?:_unlock_[^_]+)?_([a-zA-Z0-9_]+)/);
        if (m) achId = m[1];
      }
      if (!achId && notif.message) {
        const lower = notif.message.toLowerCase();
        for (const a of summary.achievements) {
          if (lower.includes(a.name.toLowerCase())) {
            achId = a.id;
            break;
          }
        }
      }

      const ach = achId ? achMap.get(achId) : null;

      // Authoritative check (Universal across all achievements)
      const isActuallyComplete = Boolean(
        ach &&
        ach.unlocked &&
        ach.status === 'UNLOCKED' &&
        ach.progress >= ach.maxProgress
      );

      // Incomplete achievement: MUST NOT have an unlock notification
      if (ach && !isActuallyComplete) {
        invalidNotificationIds.push(notif.id);
        try {
          localStorage.removeItem(`careerpilot_notif_dedup_${userId}_achievement_unlock_${userId}_${ach.id}`);
          localStorage.removeItem(`careerpilot_notif_dedup_${userId}_achievement_${ach.id}`);
        } catch (_) {}
        continue;
      }

      // Deduplicate: Guarantee at most ONE notification per completed achievement
      const achKey = achId || `${notif.title}_${notif.message}`;
      if (
        seenAchKeys.has(achKey) ||
        (notif.dedup_key && seenDedupKeys.has(notif.dedup_key)) ||
        seenIds.has(notif.id)
      ) {
        invalidNotificationIds.push(notif.id);
        continue;
      }

      seenAchKeys.add(achKey);
      if (notif.dedup_key) seenDedupKeys.add(notif.dedup_key);
      seenIds.add(notif.id);
      cleanedList.push(notif);
    }

    // 4. Asynchronously purge invalid / duplicate notifications from Supabase
    if (invalidNotificationIds.length > 0 && isSupabaseConfigured()) {
      (async () => {
        try {
          await supabase
            .from('notifications')
            .delete()
            .in('id', invalidNotificationIds);
        } catch (_) {}
      })();
    }

    // 5. Update local cache
    try {
      localStorage.setItem(`careerpilot_notifications_${userId}`, JSON.stringify(cleanedList));
    } catch (_) {}

    return cleanedList;
  } catch (err) {
    console.warn('[AchievementService] Error in sanitizeAndCleanAchievementNotifications:', err);
    return notifications;
  }
}

// Register achievement cleaner with notificationService
notificationService.registerAchievementCleaner(sanitizeAndCleanAchievementNotifications);

/**
 * Get formatted user achievements summary with recently unlocked items
 */
export function getUserAchievementsSummary(
  submissions: CodingSubmission[],
  userId: string = 'guest',
  context?: MultiPillarAchievementContext
): UserAchievementsSummary & { recentlyUnlocked: Achievement[] } {
  const summary = calculateAchievements(submissions, userId, context);
  const recentlyUnlocked = summary.achievements
    .filter((a) => a.unlocked)
    .sort((a, b) => (b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0) - (a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0))
    .slice(0, 3);

  return {
    ...summary,
    recentlyUnlocked,
  };
}
