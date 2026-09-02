/**
 * Weekly Career Report Service
 * Aggregates 7-day rolling preparation activity across all modules.
 * Formulates executive takeaways: Biggest Improvement, Biggest Gap, Next Week's Focus.
 * 
 * Source of Truth: Supabase tables (coding_submissions, mock_interviews, placement_sessions, resumes)
 */

import { WeeklyCareerReport } from '../types/intelligence';
import { CodingSubmission } from '../types/coding';
import { MockInterviewReport } from '../types/interview';
import { ResumeAnalysisResult, ResumeVersionItem } from '../types/resume';
import { PlacementTestSession } from '../types/placement';
import { DailyRoadmapTask } from '../types/roadmap';
import { StudyPlanData } from '../types/studyPlanner';

export function generateWeeklyCareerReport(params: {
  studentId?: string;
  studentName?: string;
  targetRole?: string;
  currentReadinessScore?: number | null;
  submissions?: CodingSubmission[];
  placementSessions?: PlacementTestSession[];
  mockInterviews?: MockInterviewReport[];
  resumes?: ResumeVersionItem[];
  latestResumeAnalysis?: { result: ResumeAnalysisResult; targetRole: string; analyzedAt: string } | null;
  roadmapTasks?: DailyRoadmapTask[];
  completedRoadmapIds?: string[];
  studyPlans?: StudyPlanData[];
}): WeeklyCareerReport {
  const now = new Date();
  const nowMs = now.getTime();
  // Exact 7-day rolling window in milliseconds
  const sevenDaysAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  const sevenDaysAgo = new Date(sevenDaysAgoMs);

  const startDateStr = sevenDaysAgo.toISOString();
  const endDateStr = now.toISOString();

  const submissions = params.submissions || [];
  const placementSessions = params.placementSessions || [];
  const mockInterviews = params.mockInterviews || [];
  const resumes = params.resumes || [];
  const latestResume = params.latestResumeAnalysis?.result;
  const roadmapTasks = params.roadmapTasks || [];
  const completedRoadmapIds = params.completedRoadmapIds || [];
  const studyPlans = params.studyPlans || [];

  const effectiveUserId = params.studentId || 'guest';
  const isAuthUser = effectiveUserId !== 'guest';

  // Helper to verify user ownership
  const isOwnedByUser = (recordUserId?: string | null) => {
    if (!isAuthUser) return true; // Guest mode includes guest / unassigned records
    if (!recordUserId) return true;
    return recordUserId === effectiveUserId;
  };

  // 1. Filter Coding Submissions (Source: Supabase coding_submissions) in the 7-day window
  const recentSubmissions = submissions.filter((s) => {
    if (!s) return false;
    if (!isOwnedByUser(s.user_id)) return false;
    const dStr = s.created_at || (s as any).createdAt;
    if (!dStr) return false;
    const t = new Date(dStr).getTime();
    return !isNaN(t) && t >= sevenDaysAgoMs && t <= nowMs;
  });

  // 2. Filter Placement Sessions (Source: Supabase placement_history / placement_sessions) in the 7-day window
  const recentPlacements = placementSessions.filter((p) => {
    if (!p) return false;
    if (!isOwnedByUser((p as any).userId || (p as any).user_id)) return false;
    const dStr = p.completedAt || p.createdAt;
    if (!dStr) return false;
    const t = new Date(dStr).getTime();
    return !isNaN(t) && t >= sevenDaysAgoMs && t <= nowMs;
  });

  // 3. Filter Mock Interviews (Source: Supabase mock_interviews) in the 7-day window
  const recentInterviews = mockInterviews.filter((i) => {
    if (!i) return false;
    if (!isOwnedByUser((i as any).user_id || (i as any).userId)) return false;
    const dStr = i.completedAt || (i as any).completed_at || (i as any).createdAt;
    if (!dStr) return false;
    const t = new Date(dStr).getTime();
    return !isNaN(t) && t >= sevenDaysAgoMs && t <= nowMs;
  });

  // 4. Filter Resumes created / updated in the 7-day window
  const recentResumes = resumes.filter((r) => {
    if (!r) return false;
    if (!isOwnedByUser((r as any).userId || (r as any).user_id)) return false;
    const dStr = r.createdAt || (r as any).uploadedAt || (r as any).created_at;
    if (!dStr) return false;
    const t = new Date(dStr).getTime();
    return !isNaN(t) && t >= sevenDaysAgoMs && t <= nowMs;
  });

  // ==========================================================================
  // CODING METRICS CALCULATION (Strict separation of submissions vs questions)
  // ==========================================================================
  const totalSubmissions = recentSubmissions.length;
  const uniqueAttemptedQuestionsSet = new Set<string>();
  const uniqueSolvedQuestionsSet = new Set<string>();
  let totalAcceptedSubmissions = 0;
  const topicsSet = new Set<string>();

  for (const s of recentSubmissions) {
    // Canonical Question Identifier: problem_id -> problem_title -> id
    const qId = (s.problem_id || s.problem_title || s.id || '').trim();
    if (qId) {
      uniqueAttemptedQuestionsSet.add(qId);
    }

    // Determine Accepted / Solved status
    const rawStatus = (s.status || (s as any).result || '').toLowerCase().trim();
    const totalTC = typeof s.total_test_cases === 'number' && s.total_test_cases > 0
      ? s.total_test_cases
      : (typeof (s as any).totalTestCases === 'number' && (s as any).totalTestCases > 0 ? (s as any).totalTestCases : 0);
    const passedTC = typeof s.test_cases_passed === 'number'
      ? s.test_cases_passed
      : (typeof (s as any).passedTestCases === 'number' ? (s as any).passedTestCases : 0);

    // Only accepted status with all test cases passed (or totalTC 0) counts as accepted
    const isAccepted = rawStatus === 'accepted' && (totalTC === 0 || passedTC >= totalTC);

    if (isAccepted) {
      totalAcceptedSubmissions++;
      if (qId) {
        // Solved question set guarantees repeated successful submissions count as 1 unique question solved
        uniqueSolvedQuestionsSet.add(qId);
      }
    }

    const t = s.topic || (s as any).problem_data?.topic;
    if (t) topicsSet.add(t);
  }

  const uniqueQuestionsAttempted = uniqueAttemptedQuestionsSet.size;
  const uniqueQuestionsSolved = uniqueSolvedQuestionsSet.size;
  const submissionPassRate = totalSubmissions > 0
    ? Math.round((totalAcceptedSubmissions / totalSubmissions) * 100)
    : 0;
  const questionSuccessRate = uniqueQuestionsAttempted > 0
    ? Math.round((uniqueQuestionsSolved / uniqueQuestionsAttempted) * 100)
    : 0;

  // ==========================================================================
  // PLACEMENT METRICS CALCULATION (Source: Supabase placement_history)
  // ==========================================================================
  const placementAttempts = recentPlacements.length;
  const placementScores = recentPlacements
    .map((p) => p.score || (p as any).accuracy || 0)
    .filter((score) => typeof score === 'number' && score > 0);
  const placementAvgScore = placementScores.length > 0
    ? Math.round(placementScores.reduce((a, b) => a + b, 0) / placementScores.length)
    : 0;

  // ==========================================================================
  // INTERVIEW METRICS CALCULATION (Source: Supabase mock_interviews)
  // ==========================================================================
  const interviewRoundsCompleted = recentInterviews.length;
  const interviewScores = recentInterviews
    .map((i) => i.overall_score ?? (i as any).overallScore ?? 0)
    .filter((score) => typeof score === 'number' && score > 0);
  const interviewAvgScore = interviewScores.length > 0
    ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length)
    : 0;

  // ==========================================================================
  // ROADMAP & STUDY PLANNER METRICS
  // ==========================================================================
  const totalRoadmap = roadmapTasks.length;
  const roadmapProgress = totalRoadmap > 0
    ? Math.round((completedRoadmapIds.length / totalRoadmap) * 100)
    : 0;

  let plannedCount = 0;
  let completedPlanCount = 0;
  for (const sp of studyPlans) {
    const tasks = sp.tasks || [];
    plannedCount += tasks.length;
    completedPlanCount += tasks.filter((t) => t.status === 'completed').length;
  }
  const plannerRate = plannedCount > 0
    ? Math.round((completedPlanCount / plannedCount) * 100)
    : 0;

  // ==========================================================================
  // SUFFICIENT DATA VERIFICATION
  // ==========================================================================
  const isSufficientData =
    totalSubmissions > 0 ||
    placementAttempts > 0 ||
    interviewRoundsCompleted > 0 ||
    recentResumes.length > 0;

  // ==========================================================================
  // BIGGEST IMPROVEMENT CALCULATION
  // ==========================================================================
  let biggestImprovement: WeeklyCareerReport['biggestImprovement'] = null;
  if (uniqueQuestionsSolved >= 1) {
    biggestImprovement = {
      area: 'Coding Problem Solving',
      metric: `${uniqueQuestionsSolved} ${uniqueQuestionsSolved === 1 ? 'Question' : 'Questions'} Solved`,
      description: `Solved ${uniqueQuestionsSolved} unique coding ${uniqueQuestionsSolved === 1 ? 'question' : 'questions'} across ${totalSubmissions} ${totalSubmissions === 1 ? 'submission' : 'submissions'}${topicsSet.size > 0 ? ` across ${topicsSet.size} topic ${topicsSet.size === 1 ? 'area' : 'areas'}` : ''} (${submissionPassRate}% submission pass rate).`,
    };
  } else if (interviewRoundsCompleted >= 1) {
    biggestImprovement = {
      area: 'Technical Mock Interview',
      metric: `${interviewAvgScore}/100 Score`,
      description: `Completed ${interviewRoundsCompleted} mock interview ${interviewRoundsCompleted === 1 ? 'round' : 'rounds'} with an average evaluation of ${interviewAvgScore}/100.`,
    };
  } else if (placementAttempts >= 1) {
    biggestImprovement = {
      area: 'Placement Screening Assessments',
      metric: `${placementAvgScore}% Avg Score`,
      description: `Completed ${placementAttempts} placement screening ${placementAttempts === 1 ? 'round' : 'rounds'} averaging ${placementAvgScore}%.`,
    };
  } else if (resumes.length > 0 && (latestResume?.overall_score || 0) > 0) {
    biggestImprovement = {
      area: 'Resume Optimization',
      metric: `${latestResume?.overall_score || 75}/100 ATS`,
      description: `Optimized resume content structure and target role keyword alignment.`,
    };
  }

  // ==========================================================================
  // BIGGEST GAP CALCULATION
  // ==========================================================================
  let biggestGap: WeeklyCareerReport['biggestGap'] = null;
  if (interviewRoundsCompleted === 0) {
    biggestGap = {
      area: 'Technical Mock Interviews',
      description: 'Zero mock interview rounds completed in the last 7 days. Verbal technical communication and live problem walkthroughs require weekly practice.',
      recommendedAction: 'Schedule and complete at least 1 AI-evaluated technical mock interview round.',
      actionRoute: 'interview',
    };
  } else if (uniqueQuestionsAttempted < 3) {
    biggestGap = {
      area: 'Coding Practice Frequency',
      description: `Attempted ${uniqueQuestionsAttempted} unique coding ${uniqueQuestionsAttempted === 1 ? 'question' : 'questions'} (${totalSubmissions} ${totalSubmissions === 1 ? 'submission' : 'submissions'}) in the last 7 days. Consistent weekly problem solving builds algorithmic mastery.`,
      recommendedAction: 'Solve 1 Medium algorithmic problem daily in the Coding Arena.',
      actionRoute: 'coding',
    };
  } else if (placementAttempts === 0) {
    biggestGap = {
      area: 'Placement Aptitude Assessments',
      description: 'No aptitude speed tests taken this week.',
      recommendedAction: 'Complete a 15-minute quantitative reasoning or core CS screening test.',
      actionRoute: 'placement',
    };
  }

  // ==========================================================================
  // NEXT WEEK'S STRATEGIC FOCUS ITEMS
  // ==========================================================================
  const nextWeeksFocus = [
    {
      title: 'Practice 4 Medium Algorithmic Problems',
      reason: 'Strengthen data structure implementation and optimal time-space trade-offs.',
      priority: 'high' as const,
      actionRoute: 'coding',
    },
    {
      title: 'Complete 1 Live Technical Mock Interview',
      reason: 'Evaluate verbal STAR responses and algorithmic communication under pressure.',
      priority: 'high' as const,
      actionRoute: 'interview',
    },
    {
      title: 'Review Target Role Job Description Match',
      reason: 'Align project portfolio descriptions with target employer skill criteria.',
      priority: 'medium' as const,
      actionRoute: 'company-prep',
    },
  ];

  // ==========================================================================
  // 7-DAY EXECUTIVE TAKEAWAYS SUMMARY
  // Formulates truthful, mathematically sound narrative without confusing
  // submissions with questions solved.
  // ==========================================================================
  let executiveSummary = '';

  if (!isSufficientData) {
    executiveSummary =
      'No preparation activity recorded over the past 7 days. Solve coding challenges, complete mock interviews, or practice placement assessments to generate your weekly executive takeaways.';
  } else {
    const summarySentences: string[] = [];

    // Coding performance statement
    if (totalSubmissions > 0) {
      if (uniqueQuestionsAttempted > 0) {
        if (uniqueQuestionsSolved > 0) {
          summarySentences.push(
            `Over the past 7 days, you made ${totalSubmissions} coding ${totalSubmissions === 1 ? 'submission' : 'submissions'} across ${uniqueQuestionsAttempted} ${uniqueQuestionsAttempted === 1 ? 'question' : 'questions'} and solved ${uniqueQuestionsSolved}.`
          );
        } else {
          summarySentences.push(
            `Over the past 7 days, you made ${totalSubmissions} coding ${totalSubmissions === 1 ? 'submission' : 'submissions'} across ${uniqueQuestionsAttempted} ${uniqueQuestionsAttempted === 1 ? 'question' : 'questions'} (none yet solved).`
          );
        }
      } else {
        summarySentences.push(
          `Over the past 7 days, you made ${totalSubmissions} coding ${totalSubmissions === 1 ? 'submission' : 'submissions'}.`
        );
      }
    } else {
      summarySentences.push('Over the past 7 days, you logged 0 coding submissions.');
    }

    // Interview performance statement
    if (interviewRoundsCompleted > 0) {
      summarySentences.push(
        `You completed ${interviewRoundsCompleted} mock interview ${interviewRoundsCompleted === 1 ? 'round' : 'rounds'}${interviewAvgScore > 0 ? ` with an average score of ${interviewAvgScore}/100` : ''}.`
      );
    }

    // Placement assessment statement
    if (placementAttempts > 0) {
      summarySentences.push(
        `You completed ${placementAttempts} placement assessment ${placementAttempts === 1 ? 'session' : 'sessions'}${placementAvgScore > 0 ? ` (average score: ${placementAvgScore}%)` : ''}.`
      );
    }

    // Overall readiness score statement
    if (params.currentReadinessScore !== null && params.currentReadinessScore !== undefined) {
      summarySentences.push(
        `Your overall career readiness stands at ${params.currentReadinessScore}%.`
      );
    }

    executiveSummary = summarySentences.join(' ');
  }

  return {
    id: `weekly_report_${now.toISOString().split('T')[0]}`,
    startDate: startDateStr,
    endDate: endDateStr,
    isSufficientData,
    studentName: params.studentName || 'Student',
    targetRole: params.targetRole || 'Software Engineer',
    coding: {
      totalSubmissions,
      uniqueQuestionsAttempted,
      uniqueQuestionsSolved,
      attemptedCount: uniqueQuestionsAttempted,
      solvedCount: uniqueQuestionsSolved,
      totalAcceptedSubmissions,
      accuracyRate: submissionPassRate,
      successRate: questionSuccessRate,
      topicsPracticed: Array.from(topicsSet),
    },
    placement: {
      attemptsCount: placementAttempts,
      averageScore: placementAvgScore,
      averageAccuracy: placementAvgScore,
    },
    interview: {
      completedCount: interviewRoundsCompleted,
      averageScore: interviewAvgScore,
      weakestDimension: interviewRoundsCompleted > 0 ? 'Communication & Structure' : null,
    },
    roadmap: {
      tasksCompletedThisWeek: 0,
      overallProgressPercentage: roadmapProgress,
    },
    studyPlanner: {
      plannedTasksCount: plannedCount,
      completedPlannedCount: completedPlanCount,
      completionRate: plannerRate,
      studyMinutesLogged: completedPlanCount * 25,
    },
    resume: {
      latestScore: latestResume?.overall_score || 0,
      scoreDeltaThisWeek: 0,
      newVersionsCreated: recentResumes.length,
    },
    achievementsUnlockedThisWeek: [],
    readinessDeltaThisWeek: 0,
    currentReadinessScore: params.currentReadinessScore ?? null,
    biggestImprovement,
    biggestGap,
    nextWeeksFocus,
    executiveSummary,
    generatedAt: new Date().toISOString(),
  };
}
