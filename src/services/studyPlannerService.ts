import {
  StudyPlanData,
  StudyTask,
  StudentStructuredContext,
  WeeklyGoal,
  TaskStatus,
} from '../types/studyPlanner';
import { getPreparationDashboardData } from './preparationDashboardService';
import { PreparationDashboardData } from '../types/preparationDashboard';
import { getStoredDailyTasks, getCompletedItemIds } from './roadmapStorage';
import { generatePersonalizedRoadmap } from './roadmapEngine';
import { codingService } from './codingService';
import { getPlacementHistory } from './placementStorage';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

/**
 * Key generators for persistent storage per student
 */
function getPlanStorageKey(studentId: string, dateStr: string): string {
  return `careerpilot_study_plan_${studentId || 'guest'}_${dateStr}`;
}

function getStudyTimeStorageKey(studentId: string): string {
  return `careerpilot_daily_study_time_${studentId || 'guest'}`;
}

function getManualCompletionsStorageKey(studentId: string, dateStr: string): string {
  return `careerpilot_planner_manual_completions_${studentId || 'guest'}_${dateStr}`;
}

/**
 * Get student's configured daily preparation time budget in minutes
 * Options: 30, 60 (1 hr), 90 (1.5 hr), 120 (2 hr), 180 (3+ hr)
 * Default: 60 minutes
 */
export function getDailyStudyTime(studentId: string = 'guest'): number {
  try {
    const val = localStorage.getItem(getStudyTimeStorageKey(studentId));
    if (val) {
      const parsed = parseInt(val, 10);
      if ([30, 60, 90, 120, 180].includes(parsed)) {
        return parsed;
      }
    }
  } catch (_) {}
  return 60; // Default 1 hour
}

/**
 * Save student's daily preparation time budget
 */
export function setDailyStudyTime(studentId: string = 'guest', minutes: number): void {
  try {
    localStorage.setItem(getStudyTimeStorageKey(studentId), String(minutes));
  } catch (_) {}
}

/**
 * Resolve the authenticated student's actual coding language
 * Priority: profile preferred_language -> coding submission history -> profile programming_languages -> localStorage -> default 'Python'
 */
export async function resolveStudentCodingLanguage(
  studentId: string = 'guest',
  profile?: any
): Promise<string> {
  // 1. Explicit preferred language on profile
  if (profile?.preferred_language && typeof profile.preferred_language === 'string' && profile.preferred_language.trim()) {
    return profile.preferred_language.trim();
  }

  // 2. Recent coding submission language from Coding Arena
  try {
    const submissions = await codingService.getSubmissions(studentId);
    if (submissions && submissions.length > 0) {
      const lastWithLang = submissions.find((s) => s && s.language && typeof s.language === 'string');
      if (lastWithLang && lastWithLang.language.trim()) {
        return lastWithLang.language.trim();
      }
    }
  } catch (_) {}

  // 3. First programming language in profile technical skills
  if (Array.isArray(profile?.programming_languages) && profile.programming_languages.length > 0) {
    const first = String(profile.programming_languages[0]).trim();
    if (first) return first;
  } else if (typeof profile?.programming_languages === 'string' && profile.programming_languages.trim()) {
    const first = profile.programming_languages.split(',')[0].trim();
    if (first) return first;
  }

  // 4. Stored Coding Arena preference
  try {
    const saved = localStorage.getItem(`careerpilot_coding_preferred_language_${studentId}`);
    if (saved && saved.trim()) return saved.trim();
  } catch (_) {}

  // 5. Default fallback (Python is standard and accessible, never randomly choosing Java)
  return 'Python';
}

/**
 * Inspect actual roadmap state for the student
 */
export async function resolveStudentRoadmapState(
  studentId: string = 'guest',
  targetRole?: string
): Promise<{
  isInitialized: boolean;
  totalTasks: number;
  completedTasks: number;
  nextTaskTitle?: string;
  nextTaskTopic?: string;
}> {
  const effectiveId = studentId || 'guest';
  const storedDaily = getStoredDailyTasks(effectiveId);
  const completedIds = getCompletedItemIds(effectiveId);
  const isExplicitInit = localStorage.getItem(`careerpilot_roadmap_initialized_${effectiveId}`) === 'true';

  let isInitialized = isExplicitInit || (storedDaily !== null && storedDaily.length > 0) || completedIds.length > 0;
  let totalTasks = storedDaily?.length || 0;
  let completedTasks = storedDaily?.filter((t) => t.completed).length || 0;
  let nextTaskTitle: string | undefined = undefined;
  let nextTaskTopic: string | undefined = undefined;

  try {
    const roadmapAnalysis = await generatePersonalizedRoadmap(effectiveId, targetRole);
    if (roadmapAnalysis && Array.isArray(roadmapAnalysis.phases) && roadmapAnalysis.phases.length > 0) {
      const allItems: any[] = [];
      roadmapAnalysis.phases.forEach((p) => {
        if (Array.isArray(p.items)) {
          allItems.push(...p.items);
        }
      });

      if (allItems.length > 0) {
        totalTasks = allItems.length;
        completedTasks = allItems.filter((i) => i.isCompleted).length;
        const nextIncomplete = allItems.find((i) => !i.isCompleted);
        if (nextIncomplete) {
          nextTaskTitle = `Complete: ${nextIncomplete.title}`;
          nextTaskTopic = nextIncomplete.title;
        } else if (roadmapAnalysis.dailyTasks && roadmapAnalysis.dailyTasks.length > 0) {
          const nextDaily = roadmapAnalysis.dailyTasks.find((d) => !d.completed);
          if (nextDaily) {
            nextTaskTitle = nextDaily.title;
            nextTaskTopic = nextDaily.category;
          }
        }
        isInitialized = isInitialized || completedTasks > 0 || isExplicitInit;
      }
    }
  } catch (err) {
    console.warn('[studyPlannerService] resolveStudentRoadmapState error:', err);
  }

  return {
    isInitialized,
    totalTasks,
    completedTasks,
    nextTaskTitle,
    nextTaskTopic,
  };
}

/**
 * Check if the student has measured historical records in specific subjects/topics
 */
export async function checkMeasuredSubjectRecords(studentId: string = 'guest'): Promise<{
  hasOsRecord: boolean;
  osScore?: number;
  hasArrayRecord: boolean;
  arrayScore?: number;
}> {
  let hasOsRecord = false;
  let osScore: number | undefined = undefined;
  let hasArrayRecord = false;
  let arrayScore: number | undefined = undefined;

  try {
    // 1. Check Placement MCQ history for OS
    const placementSessions = getPlacementHistory(studentId);
    let osCorrect = 0;
    let osTotal = 0;

    placementSessions.forEach((sess) => {
      if (!sess) return;
      const isOsSess =
        sess.subject?.toLowerCase().includes('operating') ||
        sess.topic?.toLowerCase().includes('operating') ||
        sess.topic?.toLowerCase() === 'os';

      if (isOsSess && sess.totalQuestions > 0) {
        osCorrect += sess.correctCount || 0;
        osTotal += sess.totalQuestions || 0;
      }

      if (sess.answers) {
        Object.values(sess.answers).forEach((ans: any) => {
          if (!ans) return;
          const top = (ans.topic || ans.subject || '').toLowerCase();
          if (top.includes('operating') || top === 'os') {
            osTotal++;
            if (ans.isCorrect) osCorrect++;
          }
        });
      }
    });

    if (osTotal >= 2) {
      hasOsRecord = true;
      osScore = Math.round((osCorrect / osTotal) * 100);
    }

    // 2. Check Coding Submissions for Arrays
    const submissions = await codingService.getSubmissions(studentId);
    let arrayPassed = 0;
    let arrayTotal = 0;

    submissions.forEach((sub) => {
      if (!sub) return;
      const subAny = sub as any;
      const top = (subAny.topic || subAny.problem_data?.topic || sub.problem_title || subAny.title || '').toLowerCase();
      if (top.includes('array')) {
        arrayTotal++;
        const isPassed = sub.status === 'accepted' || sub.status_text === 'Accepted' || (typeof sub.score === 'number' && sub.score >= 90);
        if (isPassed) arrayPassed++;
      }
    });

    if (arrayTotal >= 1) {
      hasArrayRecord = true;
      arrayScore = Math.round((arrayPassed / arrayTotal) * 100);
    }
  } catch (err) {
    console.warn('[studyPlannerService] checkMeasuredSubjectRecords error:', err);
  }

  return {
    hasOsRecord,
    osScore,
    hasArrayRecord,
    arrayScore,
  };
}

/**
 * Calculate accurate study streak strictly from authentic activity timestamps across all modules
 */
export function calculateAuthenticStreak(dashboardData: PreparationDashboardData): {
  streakDays: number;
  longestStreak: number;
  totalActivitiesCount: number;
} {
  const activities = dashboardData.recentActivities || [];
  if (activities.length === 0) {
    return {
      streakDays: 0,
      longestStreak: 0,
      totalActivitiesCount: 0,
    };
  }

  // Extract unique calendar days (YYYY-MM-DD) where student logged at least one real activity
  const dateSet = new Set<string>();
  activities.forEach((act) => {
    if (act.timestamp) {
      const d = new Date(act.timestamp);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateSet.add(`${year}-${month}-${day}`);
      }
    }
  });

  const sortedDates = Array.from(dateSet).sort().reverse();
  if (sortedDates.length === 0) {
    return { streakDays: 0, longestStreak: 0, totalActivitiesCount: activities.length };
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // Check if streak is active (activity on today or yesterday)
  const hasActivityToday = dateSet.has(todayStr);
  const hasActivityYesterday = dateSet.has(yesterdayStr);

  if (!hasActivityToday && !hasActivityYesterday) {
    return {
      streakDays: 0,
      longestStreak: sortedDates.length,
      totalActivitiesCount: activities.length,
    };
  }

  // Count consecutive days backward
  let currentStreak = 0;
  let checkDate = new Date(hasActivityToday ? today : yesterday);

  while (true) {
    const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (dateSet.has(checkStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    streakDays: currentStreak,
    longestStreak: Math.max(currentStreak, sortedDates.length),
    totalActivitiesCount: activities.length,
  };
}

/**
 * Build structured context from authentic student data to feed into Gemini / Planner Engine
 */
export async function buildStudentStructuredContext(
  studentId: string = 'guest',
  profile?: any,
  cachedDashboardData?: PreparationDashboardData
): Promise<{ context: StudentStructuredContext; dashboardData: PreparationDashboardData }> {
  const dashboardData = cachedDashboardData || (await getPreparationDashboardData(studentId, profile));
  const dailyStudyTimeMinutes = getDailyStudyTime(studentId);

  const codingModule = dashboardData.modules?.find((m) => m.category === 'coding');
  const aptitudeModule = dashboardData.modules?.find((m) => m.category === 'aptitude');
  const techInterviewModule = dashboardData.modules?.find((m) => m.category === 'technical-interview');
  const hrInterviewModule = dashboardData.modules?.find((m) => m.category === 'hr-interview');
  const resumeModule = dashboardData.modules?.find((m) => m.category === 'resume');

  const rawName = profile?.full_name || dashboardData.studentName || 'Student';
  const targetRole = profile?.target_role || dashboardData.targetRole || 'Software Engineer';
  const preferredDomain = profile?.preferred_domain || profile?.domain || 'Software Development';
  const targetCompanies = Array.isArray(profile?.target_companies) && profile.target_companies.length > 0
    ? profile.target_companies
    : [];

  const preparationLevel = profile?.preparation_level || profile?.prep_level || 'Beginner';
  const codingLanguage = await resolveStudentCodingLanguage(studentId, profile);
  const dsaProficiency = profile?.dsa_level || profile?.dsa_proficiency || 'Intermediate';
  const interviewExperience = profile?.interview_experience || 'Fresher';

  const roadmapInfo = await resolveStudentRoadmapState(studentId, targetRole);
  const subjectCheck = await checkMeasuredSubjectRecords(studentId);

  const weakAreas = (dashboardData.weakAreas || []).map((w) => ({
    topic: w.topic,
    category: w.category,
    score: w.score,
  }));

  const strongAreas = (dashboardData.strongAreas || []).map((s) => ({
    topic: s.topic,
    category: s.category,
    score: s.score,
  }));

  const recentActivitySummary = (dashboardData.recentActivities || []).slice(0, 8).map((a) => {
    return `${a.title} (${a.description}) - ${a.statusBadge?.text || a.scoreLabel || 'Done'}`;
  });

  const totalActivitiesCount = dashboardData.totalActivitiesCount || dashboardData.recentActivities?.length || 0;

  const context: StudentStructuredContext = {
    studentId,
    studentName: rawName,
    targetRole,
    preferredDomain,
    targetCompanies,
    preparationLevel,
    codingLanguage,
    dsaProficiency,
    interviewExperience,
    dailyStudyTimeMinutes,
    scores: {
      codingSolved: codingModule?.completedActivities || 0,
      codingAccuracy: codingModule?.score || 0,
      aptitudeSolved: aptitudeModule?.completedActivities || 0,
      aptitudeAccuracy: aptitudeModule?.score || 0,
      technicalInterviewAvg: techInterviewModule?.score || 0,
      hrInterviewAvg: hrInterviewModule?.score || 0,
      resumeAtsScore: resumeModule?.score || 0,
      overallReadiness: dashboardData.overallScore,
    },
    weakAreas,
    strongAreas,
    recentActivitySummary,
    roadmapProgress: {
      isInitialized: roadmapInfo.isInitialized,
      totalTasks: roadmapInfo.totalTasks,
      completedTasks: roadmapInfo.completedTasks,
      nextTaskTitle: roadmapInfo.nextTaskTitle,
      nextTaskTopic: roadmapInfo.nextTaskTopic,
    },
    hasMeasuredData: {
      hasOsRecord: subjectCheck.hasOsRecord,
      osScore: subjectCheck.osScore,
      hasArrayRecord: subjectCheck.hasArrayRecord,
      arrayScore: subjectCheck.arrayScore,
    },
    profileCompletionPct: dashboardData.profileCompletion?.percentage || 50,
    totalActivitiesCount,
  };

  return { context, dashboardData };
}

/**
 * Auto-sync completed tasks with real underlying activities completed today or manual completions
 */
function syncTasksWithRealActivities(
  tasks: StudyTask[],
  dashboardData: PreparationDashboardData,
  studentId: string = 'guest'
): StudyTask[] {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayActivities = (dashboardData.recentActivities || []).filter((a) => {
    if (!a.timestamp) return false;
    return a.timestamp.startsWith(todayStr);
  });

  let manualCompletions: Record<string, string> = {};
  try {
    const raw = localStorage.getItem(getManualCompletionsStorageKey(studentId, todayStr));
    if (raw) {
      manualCompletions = JSON.parse(raw) || {};
    }
  } catch (_) {}

  return tasks.map((task) => {
    // If manually marked completed today, preserve it
    if (manualCompletions[task.id]) {
      return {
        ...task,
        status: 'completed',
        completedAt: task.completedAt || manualCompletions[task.id],
      };
    }

    if (task.status === 'completed') return task;

    // Check if relevant activity was performed today
    let matchingActivity = false;

    if (task.category === 'coding') {
      matchingActivity = todayActivities.some((a) => a.type === 'coding');
    } else if (task.category === 'aptitude') {
      matchingActivity = todayActivities.some((a) => a.type === 'aptitude');
    } else if (task.category === 'interview') {
      matchingActivity = todayActivities.some((a) => a.type === 'interview');
    } else if (task.category === 'hr-interview') {
      matchingActivity = todayActivities.some((a) => a.type === 'hr-interview');
    } else if (task.category === 'resume') {
      matchingActivity = todayActivities.some((a) => a.type === 'resume');
    } else if (task.category === 'company-prep') {
      matchingActivity = todayActivities.some((a) => a.type === 'company-prep');
    } else if (task.category === 'roadmap') {
      matchingActivity = todayActivities.some((a) => a.type === 'roadmap');
    }

    if (matchingActivity) {
      return {
        ...task,
        status: 'completed',
        completedAt: task.completedAt || new Date().toISOString(),
      };
    }

    return task;
  });
}

/**
 * Retrieve cached study plan for today synchronously if available
 */
export function getStoredStudyPlan(studentId: string = 'guest'): StudyPlanData | null {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const key = getPlanStorageKey(studentId || 'guest', todayStr);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed: StudyPlanData = JSON.parse(stored);
      if (parsed && Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
        return parsed;
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Generate an instant deterministic fallback plan with zero network latency
 */
export function getImmediateDeterministicPlan(
  studentId: string = 'guest',
  profile?: any,
  timeBudget?: number
): StudyPlanData {
  const effectiveId = studentId || 'guest';
  const todayStr = new Date().toISOString().split('T')[0];
  const minutes = timeBudget || getDailyStudyTime(effectiveId);
  const rawName = profile?.full_name || 'Student';
  const targetRole = profile?.target_role || 'Software Engineer';
  const preferredDomain = profile?.preferred_domain || profile?.domain || 'Software Development';
  const targetCompanies = Array.isArray(profile?.target_companies) && profile.target_companies.length > 0
    ? profile.target_companies
    : [];
  const codingLanguage = profile?.preferred_language || 'Python';

  const context: StudentStructuredContext = {
    studentId: effectiveId,
    studentName: rawName,
    targetRole,
    preferredDomain,
    targetCompanies,
    preparationLevel: profile?.preparation_level || 'Beginner',
    codingLanguage,
    dsaProficiency: profile?.dsa_level || 'Intermediate',
    interviewExperience: profile?.interview_experience || 'Fresher',
    dailyStudyTimeMinutes: minutes,
    scores: {
      codingSolved: 0,
      codingAccuracy: 0,
      aptitudeSolved: 0,
      aptitudeAccuracy: 0,
      technicalInterviewAvg: 0,
      hrInterviewAvg: 0,
      resumeAtsScore: 0,
      overallReadiness: null,
    },
    weakAreas: [],
    strongAreas: [],
    recentActivitySummary: [],
    roadmapProgress: {
      isInitialized: false,
      totalTasks: 0,
      completedTasks: 0,
    },
    hasMeasuredData: {
      hasOsRecord: false,
      osScore: null,
      hasArrayRecord: false,
      arrayScore: null,
    },
    profileCompletionPct: 50,
    totalActivitiesCount: 0,
  };

  return buildLocalDeterministicPlan(context, effectiveId, todayStr);
}

/**
 * Update daily time budget instantly without requiring an external AI call
 */
export function updatePlanTimeBudget(
  studentId: string = 'guest',
  newMinutes: number,
  profile?: any
): StudyPlanData {
  const effectiveId = studentId || 'guest';
  const todayStr = new Date().toISOString().split('T')[0];
  const storageKey = getPlanStorageKey(effectiveId, todayStr);

  setDailyStudyTime(effectiveId, newMinutes);

  let plan = getStoredStudyPlan(effectiveId);
  if (!plan) {
    plan = getImmediateDeterministicPlan(effectiveId, profile, newMinutes);
  }

  plan.dailyStudyTimeMinutes = newMinutes;

  // Proportionally balance tasks to match new budget
  const tasksCount = plan.tasks.length;
  if (tasksCount > 0) {
    if (newMinutes <= 30) {
      // 30 min budget: Focus on top 2 tasks
      plan.tasks = plan.tasks.map((task, idx) => {
        if (idx === 0) return { ...task, estimatedMinutes: 20, isPriority: true };
        if (idx === 1) return { ...task, estimatedMinutes: 10 };
        return { ...task, estimatedMinutes: 10 };
      });
    } else if (newMinutes <= 60) {
      // 60 min budget: 25m, 20m, 15m distribution
      plan.tasks = plan.tasks.map((task, idx) => {
        if (idx === 0) return { ...task, estimatedMinutes: 25, isPriority: true };
        if (idx === 1) return { ...task, estimatedMinutes: 20 };
        if (idx === 2) return { ...task, estimatedMinutes: 15 };
        return { ...task, estimatedMinutes: 15 };
      });
    } else if (newMinutes <= 90) {
      // 90 min budget: 35m, 30m, 25m distribution
      plan.tasks = plan.tasks.map((task, idx) => {
        if (idx === 0) return { ...task, estimatedMinutes: 35, isPriority: true };
        if (idx === 1) return { ...task, estimatedMinutes: 30 };
        if (idx === 2) return { ...task, estimatedMinutes: 25 };
        return { ...task, estimatedMinutes: 20 };
      });
    } else if (newMinutes <= 120) {
      // 120 min budget: 45m, 40m, 35m distribution
      plan.tasks = plan.tasks.map((task, idx) => {
        if (idx === 0) return { ...task, estimatedMinutes: 45, isPriority: true };
        if (idx === 1) return { ...task, estimatedMinutes: 40 };
        if (idx === 2) return { ...task, estimatedMinutes: 35 };
        return { ...task, estimatedMinutes: 25 };
      });
    } else {
      // 180+ min budget
      plan.tasks = plan.tasks.map((task, idx) => {
        if (idx === 0) return { ...task, estimatedMinutes: 60, isPriority: true };
        if (idx === 1) return { ...task, estimatedMinutes: 50 };
        if (idx === 2) return { ...task, estimatedMinutes: 40 };
        return { ...task, estimatedMinutes: 30 };
      });
    }
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(plan));
  } catch (_) {}

  return plan;
}

// In-flight request deduplication map to prevent duplicate network calls
const inFlightRequests = new Map<string, Promise<{ plan: StudyPlanData; dashboardData: PreparationDashboardData }>>();

/**
 * Fetch or generate Today's Preparation Plan with timeout and duplicate protection
 */
export async function getTodayStudyPlan(
  studentId: string = 'guest',
  profile?: any,
  forceRefresh: boolean = false,
  options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<{ plan: StudyPlanData; dashboardData: PreparationDashboardData }> {
  const effectiveId = studentId || 'guest';
  const todayStr = new Date().toISOString().split('T')[0];
  const storageKey = getPlanStorageKey(effectiveId, todayStr);
  const requestKey = `${effectiveId}_${forceRefresh ? 'force' : 'cached'}`;

  // If duplicate request is already in-flight, return the existing promise
  if (inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey)!;
  }

  const executionPromise = (async () => {
    try {
      const { context, dashboardData } = await buildStudentStructuredContext(effectiveId, profile);
      const streakInfo = calculateAuthenticStreak(dashboardData);

      // Fast-path: If cached plan exists for today and no forceRefresh requested
      if (!forceRefresh) {
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const parsed: StudyPlanData = JSON.parse(stored);
            if (parsed && Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
              // Sync with today's real activities
              const syncedTasks = syncTasksWithRealActivities(parsed.tasks, dashboardData, effectiveId);
              const updatedPlan: StudyPlanData = {
                ...parsed,
                tasks: syncedTasks,
                streakDays: streakInfo.streakDays,
                totalActivitiesCount: streakInfo.totalActivitiesCount,
              };
              localStorage.setItem(storageKey, JSON.stringify(updatedPlan));
              return { plan: updatedPlan, dashboardData };
            }
          }
        } catch (_) {}
      }

      // Call Server-Side AI API with Timeout & Fallback
      let generatedPlan: StudyPlanData | null = null;
      const timeoutMs = options?.timeoutMs || 7000;

      try {
        const res = await fetchWithTimeout('/api/study-planner/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: options?.signal,
          timeoutMs,
          body: JSON.stringify({ context }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.plan) {
            generatedPlan = data.plan;
          }
        }
      } catch (apiErr: any) {
        if (apiErr?.name === 'AbortError' && options?.signal?.aborted) {
          throw apiErr;
        }
        console.warn('[studyPlannerService] API call failed or timed out, generating local fallback:', apiErr);
      }

      if (!generatedPlan) {
        generatedPlan = buildLocalDeterministicPlan(context, effectiveId, todayStr);
      }

      // Inject real computed streak & total activities
      generatedPlan.streakDays = streakInfo.streakDays;
      generatedPlan.totalActivitiesCount = streakInfo.totalActivitiesCount;
      generatedPlan.dailyStudyTimeMinutes = context.dailyStudyTimeMinutes;

      // Sync with today's real activities
      generatedPlan.tasks = syncTasksWithRealActivities(generatedPlan.tasks, dashboardData, effectiveId);

      // Save to persistent local storage for today
      try {
        localStorage.setItem(storageKey, JSON.stringify(generatedPlan));
      } catch (_) {}

      return { plan: generatedPlan, dashboardData };
    } finally {
      inFlightRequests.delete(requestKey);
    }
  })();

  inFlightRequests.set(requestKey, executionPromise);
  return executionPromise;
}

/**
 * Update task completion or progress status
 */
export function updateTaskStatus(
  studentId: string = 'guest',
  taskId: string,
  newStatus: TaskStatus
): StudyPlanData | null {
  const effectiveId = studentId || 'guest';
  const todayStr = new Date().toISOString().split('T')[0];
  const storageKey = getPlanStorageKey(effectiveId, todayStr);
  const manualKey = getManualCompletionsStorageKey(effectiveId, todayStr);

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;

    const plan: StudyPlanData = JSON.parse(stored);
    const taskIndex = plan.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return null;

    plan.tasks[taskIndex].status = newStatus;
    const nowIso = new Date().toISOString();

    // Update manual completions cache
    let manualMap: Record<string, string> = {};
    try {
      const raw = localStorage.getItem(manualKey);
      if (raw) manualMap = JSON.parse(raw) || {};
    } catch (_) {}

    if (newStatus === 'completed') {
      plan.tasks[taskIndex].completedAt = nowIso;
      manualMap[taskId] = nowIso;
    } else {
      delete plan.tasks[taskIndex].completedAt;
      delete manualMap[taskId];
    }

    try {
      localStorage.setItem(manualKey, JSON.stringify(manualMap));
    } catch (_) {}

    localStorage.setItem(storageKey, JSON.stringify(plan));
    return plan;
  } catch (err) {
    console.error('[studyPlannerService] updateTaskStatus error:', err);
    return null;
  }
}

/**
 * Helper to get user-facing module name for CareerPilot modules
 */
export function getRelatedModuleName(category: string, route?: string): string {
  if (route === 'coding' || category === 'coding') return 'Coding Arena';
  if (route === 'placement' || category === 'aptitude') return 'Placement Practice / Aptitude';
  if (route === 'interview' || category === 'interview') return 'Technical Interview';
  if (route === 'hr-interview' || category === 'hr-interview') return 'HR Interview';
  if (route === 'company-prep' || category === 'company-prep') return 'Company Prep';
  if (route === 'roadmap' || category === 'roadmap') return 'Roadmap';
  if (route === 'resume-analyzer' || category === 'resume') return 'Resume Analyzer';
  if (route === 'profile' || category === 'profile') return 'Student Profile';
  return 'CareerPilot Practice';
}

/**
 * Local deterministic plan generator strictly grounded in authenticated student data
 */
function buildLocalDeterministicPlan(
  context: StudentStructuredContext,
  studentId: string,
  todayStr: string
): StudyPlanData {
  const tasks: StudyTask[] = [];
  const timeBudget = context.dailyStudyTimeMinutes || 60;
  const targetRole = context.targetRole || 'Software Engineer';
  const codingLang = context.codingLanguage || 'Python';
  const targetCompany = context.targetCompanies?.[0];
  const weakAreas = context.weakAreas || [];
  const totalActivities = context.totalActivitiesCount || 0;
  const isNewStudent = totalActivities === 0 && weakAreas.length === 0;

  if (isNewStudent) {
    // 3 Starter diagnostic actions for brand new students - 100% neutral and factual
    tasks.push({
      id: `task-${todayStr}-start-coding`,
      title: `DSA Fundamentals in ${codingLang}`,
      topic: 'Arrays & Basic Algorithms',
      description: `Solve foundational problem to calibrate your algorithmic benchmark.`,
      reason: `Beginning your first coding practice starts your study streak and establishes your placement baseline.`,
      estimatedMinutes: 25,
      difficulty: 'Beginner',
      category: 'coding',
      relatedModuleName: 'Coding Arena',
      route: 'coding',
      actionLabel: 'Start Coding Practice',
      status: 'pending',
      priorityLevel: 'high',
      isPriority: true,
      targetTopic: 'Arrays',
      targetLanguage: codingLang,
    });

    tasks.push({
      id: `task-${todayStr}-start-aptitude`,
      title: `Aptitude Diagnostic Speed Test`,
      topic: 'Quantitative & Logical Reasoning',
      description: `Take a 10-question placement speed assessment.`,
      reason: `Aptitude rounds are the first elimination filter in campus placement drives; this establishes your baseline speed.`,
      estimatedMinutes: 20,
      difficulty: 'Beginner',
      category: 'aptitude',
      relatedModuleName: 'Placement Practice / Aptitude',
      route: 'placement',
      actionLabel: 'Practice Aptitude',
      status: 'pending',
      priorityLevel: 'medium',
      isPriority: false,
      targetTopic: 'Quantitative Aptitude',
    });

    tasks.push({
      id: `task-${todayStr}-start-interview`,
      title: `Technical Interview Warmup`,
      topic: `${targetRole} Fundamentals`,
      description: `Practice articulating technical concepts out loud in simulated interview rounds.`,
      reason: `Practicing verbal technical explanations early builds communication confidence for placement interviews.`,
      estimatedMinutes: 15,
      difficulty: 'Beginner',
      category: 'interview',
      relatedModuleName: 'Technical Interview',
      route: 'interview',
      actionLabel: 'Take Technical Interview',
      status: 'pending',
      priorityLevel: 'medium',
      isPriority: false,
    });

    // Roadmap task
    if (!context.roadmapProgress?.isInitialized) {
      tasks.push({
        id: `task-${todayStr}-roadmap-init`,
        title: `Initialize Career Roadmap`,
        topic: 'Career Roadmap Setup',
        description: `Set up your personalized career roadmap to plan your milestone-by-milestone placement preparation.`,
        reason: `Set up your personalized career roadmap to plan your milestone-by-milestone placement preparation.`,
        estimatedMinutes: 10,
        difficulty: 'Beginner',
        category: 'roadmap',
        relatedModuleName: 'Roadmap',
        route: 'roadmap',
        actionLabel: 'Initialize Roadmap',
        status: 'pending',
        priorityLevel: 'low',
        isPriority: false,
      });
    }
  } else {
    // 1. Priority 1: Verified Weak Area or Grounded Coding Practice
    const topWeak = weakAreas.length > 0 ? weakAreas[0] : null;
    const isDsaWeak =
      topWeak &&
      (topWeak.category === 'DSA' ||
        topWeak.topic.toLowerCase().includes('array') ||
        topWeak.topic.toLowerCase().includes('tree') ||
        topWeak.topic.toLowerCase().includes('list') ||
        topWeak.topic.toLowerCase().includes('graph') ||
        topWeak.topic.toLowerCase().includes('string') ||
        topWeak.topic.toLowerCase().includes('dp'));

    if (topWeak && isDsaWeak) {
      tasks.push({
        id: `task-${todayStr}-weak-dsa`,
        title: `DSA — ${topWeak.topic}`,
        topic: topWeak.topic,
        description: `Practice 2 Medium ${topWeak.topic} problems focusing on optimal time and space complexity.`,
        reason: `Your recent ${topWeak.topic} accuracy is ${topWeak.score}%, which is below your overall benchmark. Targeted practice will strengthen this foundation.`,
        estimatedMinutes: Math.min(45, Math.round(timeBudget * 0.45)),
        difficulty: 'Intermediate',
        category: 'coding',
        relatedModuleName: 'Coding Arena',
        route: 'coding',
        actionLabel: 'Start Practice',
        status: 'pending',
        priorityLevel: 'high',
        isPriority: true,
        targetTopic: topWeak.topic,
        targetLanguage: codingLang,
      });
    } else if (context.hasMeasuredData?.hasArrayRecord && context.hasMeasuredData?.arrayScore !== undefined) {
      const isArrayWeak = context.hasMeasuredData.arrayScore < 70;
      tasks.push({
        id: `task-${todayStr}-array-practice`,
        title: `DSA — Arrays in ${codingLang}`,
        topic: 'Arrays',
        description: `Solve 2 Intermediate Array problems focusing on two-pointer and sliding window techniques.`,
        reason: isArrayWeak
          ? `Your measured Array accuracy is ${context.hasMeasuredData.arrayScore}%. Practice intermediate problems in ${codingLang} to raise your success rate.`
          : `Your measured Array accuracy is ${context.hasMeasuredData.arrayScore}%. Continued practice in ${codingLang} maintains problem-solving velocity.`,
        estimatedMinutes: Math.min(40, Math.round(timeBudget * 0.4)),
        difficulty: 'Intermediate',
        category: 'coding',
        relatedModuleName: 'Coding Arena',
        route: 'coding',
        actionLabel: 'Start Practice',
        status: 'pending',
        priorityLevel: isArrayWeak ? 'high' : 'medium',
        isPriority: isArrayWeak,
        targetTopic: 'Arrays',
        targetLanguage: codingLang,
      });
    } else {
      // Neutral wording when no measured Array claim exists
      tasks.push({
        id: `task-${todayStr}-dsa-standard`,
        title: `DSA — Solve 2 Intermediate Array Problems`,
        topic: 'Arrays',
        description: `Solve 2 Intermediate Array problems in ${codingLang}.`,
        reason: `Practice intermediate Array problems to continue building your algorithmic problem-solving skills in ${codingLang}.`,
        estimatedMinutes: Math.min(40, Math.round(timeBudget * 0.4)),
        difficulty: 'Intermediate',
        category: 'coding',
        relatedModuleName: 'Coding Arena',
        route: 'coding',
        actionLabel: 'Start Practice',
        status: 'pending',
        priorityLevel: 'high',
        isPriority: true,
        targetTopic: 'Arrays',
        targetLanguage: codingLang,
      });
    }

    // 2. Priority 2: Aptitude / Technical Core / OS
    if (!tasks.some((t) => t.category === 'aptitude')) {
      const weakAptitude = weakAreas.find((w) => w.category === 'Aptitude' || w.category === 'Technical' || w.topic.toLowerCase().includes('operating') || w.topic.toLowerCase() === 'os');
      
      if (context.hasMeasuredData?.hasOsRecord && context.hasMeasuredData?.osScore !== undefined) {
        tasks.push({
          id: `task-${todayStr}-os-practice`,
          title: `Operating Systems Assessment`,
          topic: 'Operating Systems',
          description: `Complete an Operating Systems practice set focusing on process scheduling and memory management.`,
          reason: `Your recent performance in Operating Systems was ${context.hasMeasuredData.osScore}%. Practice advanced questions to build comprehensive exam mastery.`,
          estimatedMinutes: Math.min(25, Math.round(timeBudget * 0.25)),
          difficulty: 'Intermediate',
          category: 'aptitude',
          relatedModuleName: 'Placement Practice / Aptitude',
          route: 'placement',
          actionLabel: 'Start Practice',
          status: 'pending',
          priorityLevel: context.hasMeasuredData.osScore < 70 ? 'high' : 'medium',
          isPriority: context.hasMeasuredData.osScore < 70,
          targetTopic: 'Operating Systems',
        });
      } else if (weakAptitude) {
        tasks.push({
          id: `task-${todayStr}-weak-apt`,
          title: `Aptitude — ${weakAptitude.topic}`,
          topic: weakAptitude.topic,
          description: `Complete 15 ${weakAptitude.topic} questions under exam time limits.`,
          reason: `Your recent score in ${weakAptitude.topic} was ${weakAptitude.score}%. Targeted revision will raise your accuracy under exam conditions.`,
          estimatedMinutes: Math.min(25, Math.round(timeBudget * 0.25)),
          difficulty: 'Intermediate',
          category: 'aptitude',
          relatedModuleName: 'Placement Practice / Aptitude',
          route: 'placement',
          actionLabel: 'Start Practice',
          status: 'pending',
          priorityLevel: 'medium',
          isPriority: false,
          targetTopic: weakAptitude.topic,
        });
      } else {
        // Neutral wording without fake score claims
        tasks.push({
          id: `task-${todayStr}-os-neutral`,
          title: `Operating Systems Fundamentals`,
          topic: 'Operating Systems',
          description: `Review core process management, concurrency, and virtual memory questions.`,
          reason: `Practice Operating Systems fundamentals to strengthen your technical interview preparation.`,
          estimatedMinutes: Math.min(25, Math.round(timeBudget * 0.25)),
          difficulty: 'Intermediate',
          category: 'aptitude',
          relatedModuleName: 'Placement Practice / Aptitude',
          route: 'placement',
          actionLabel: 'Start Practice',
          status: 'pending',
          priorityLevel: 'medium',
          isPriority: false,
          targetTopic: 'Operating Systems',
        });
      }
    }

    // 3. Priority 3: Target Company Prep or Technical Interview
    if (targetCompany) {
      tasks.push({
        id: `task-${todayStr}-company-prep`,
        title: `Company Prep — ${targetCompany}`,
        topic: `${targetCompany} Hiring Patterns`,
        description: `Review past interview questions and assessment format for ${targetCompany}.`,
        reason: `${targetCompany} is designated as your active target company. Reviewing company patterns boosts conversion.`,
        estimatedMinutes: Math.min(25, Math.round(timeBudget * 0.25)),
        difficulty: 'Intermediate',
        category: 'company-prep',
        relatedModuleName: 'Company Prep',
        route: 'company-prep',
        actionLabel: 'Start Practice',
        status: 'pending',
        priorityLevel: 'medium',
        isPriority: false,
        targetCompany: targetCompany,
      });
    } else {
      tasks.push({
        id: `task-${todayStr}-tech-interview`,
        title: `Technical Interview — ${targetRole}`,
        topic: 'System Architecture & Problem Articulation',
        description: `Simulate a 15-minute live technical mock interview round.`,
        reason: `Verbalizing technical concepts clearly distinguishes candidates during technical interview rounds for ${targetRole}.`,
        estimatedMinutes: Math.min(25, Math.round(timeBudget * 0.25)),
        difficulty: 'Intermediate',
        category: 'interview',
        relatedModuleName: 'Technical Interview',
        route: 'interview',
        actionLabel: 'Start Practice',
        status: 'pending',
        priorityLevel: 'medium',
        isPriority: false,
      });
    }

    // 4. Priority 4: Roadmap or Resume
    if (context.roadmapProgress?.isInitialized) {
      const nextTitle = context.roadmapProgress.nextTaskTitle || 'Complete Next Milestone';
      const nextTopic = context.roadmapProgress.nextTaskTopic || 'Structured Learning Milestones';
      tasks.push({
        id: `task-${todayStr}-roadmap-continue`,
        title: `Roadmap — ${nextTitle}`,
        topic: nextTopic,
        description: `Progress through the next step on your customized ${targetRole} milestone roadmap.`,
        reason: `Continue your existing Career Roadmap and progress toward your target role.`,
        estimatedMinutes: 20,
        difficulty: 'Intermediate',
        category: 'roadmap',
        relatedModuleName: 'Roadmap',
        route: 'roadmap',
        actionLabel: 'Continue Roadmap',
        status: 'pending',
        priorityLevel: 'low',
        isPriority: false,
      });
    } else if (context.scores.resumeAtsScore && context.scores.resumeAtsScore < 75) {
      tasks.push({
        id: `task-${todayStr}-resume`,
        title: `Resume Analyzer — ATS Optimization`,
        topic: 'Resume Impact Bullets & ATS Keywords',
        description: `Optimize project descriptions and technical keywords for ${targetRole}.`,
        reason: `Your resume ATS score is currently ${context.scores.resumeAtsScore}/100. Optimizing keywords ensures automated screening clearance.`,
        estimatedMinutes: 20,
        difficulty: 'Beginner',
        category: 'resume',
        relatedModuleName: 'Resume Analyzer',
        route: 'resume-analyzer',
        actionLabel: 'Start Practice',
        status: 'pending',
        priorityLevel: 'low',
        isPriority: false,
      });
    } else {
      tasks.push({
        id: `task-${todayStr}-roadmap-init`,
        title: `Initialize Career Roadmap`,
        topic: 'Career Roadmap Setup',
        description: `Set up your personalized career roadmap to plan your milestone-by-milestone placement preparation.`,
        reason: `Set up your personalized career roadmap to plan your milestone-by-milestone placement preparation.`,
        estimatedMinutes: 15,
        difficulty: 'Beginner',
        category: 'roadmap',
        relatedModuleName: 'Roadmap',
        route: 'roadmap',
        actionLabel: 'Initialize Roadmap',
        status: 'pending',
        priorityLevel: 'low',
        isPriority: false,
      });
    }
  }

  const priorityTaskId = tasks.find((t) => t.isPriority)?.id || tasks[0].id;

  const weeklyGoals: WeeklyGoal[] = [
    {
      id: 'goal-dsa',
      category: 'coding',
      title: 'DSA Practice Sessions',
      targetCount: 5,
      completedCount: Math.min(5, Math.floor((context.scores.codingSolved || 0) / 2)),
      unit: 'sessions',
      route: 'coding',
    },
    {
      id: 'goal-aptitude',
      category: 'aptitude',
      title: 'Aptitude Speed Tests',
      targetCount: 3,
      completedCount: Math.min(3, Math.floor((context.scores.aptitudeSolved || 0) / 10)),
      unit: 'tests',
      route: 'placement',
    },
    {
      id: 'goal-interview',
      category: 'interview',
      title: 'Technical Mock Rounds',
      targetCount: 2,
      completedCount: 0,
      unit: 'sessions',
      route: 'interview',
    },
    {
      id: 'goal-company',
      category: 'company-prep',
      title: 'Company Tracks & Resume',
      targetCount: 2,
      completedCount: 0,
      unit: 'reviews',
      route: 'company-prep',
    },
  ];

  return {
    date: todayStr,
    studentId,
    dailyStudyTimeMinutes: timeBudget,
    tasks: tasks.slice(0, 5),
    weeklyGoals,
    priorityTaskId,
    aiSummary: isNewStudent
      ? `Welcome to your CareerPilot Study Planner! Complete these starter activities to calibrate your diagnostic scores and build your daily streak.`
      : `Today's plan is prioritized for ${targetRole} in ${codingLang}, focusing on closing key skill gaps and building placement momentum.`,
    recommendationNote: `Start with your highest-priority task first to maximize cognitive retention and preparation confidence.`,
    streakDays: 0,
    totalActivitiesCount: totalActivities,
    generatedAt: new Date().toISOString(),
    isAIGenerated: false,
  };
}
