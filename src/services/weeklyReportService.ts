/**
 * Weekly Career Report Service
 * Aggregates 7-day rolling preparation activity across all modules.
 * Formulates executive takeaways: Biggest Improvement, Biggest Gap, Next Week's Focus.
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
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

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

  // Filter 7-day activity
  const recentSubmissions = submissions.filter((s) => {
    const d = new Date(s.created_at || 0);
    return d >= sevenDaysAgo;
  });

  const recentPlacements = placementSessions.filter((p) => {
    const d = new Date(p.completedAt || p.createdAt || 0);
    return d >= sevenDaysAgo;
  });

  const recentInterviews = mockInterviews.filter((i) => {
    const d = new Date(i.completedAt || i.completed_at || 0);
    return d >= sevenDaysAgo;
  });

  // Calculate Coding Metrics
  const codingAttempted = recentSubmissions.length;
  const codingSolved = recentSubmissions.filter((s) => s.status === 'accepted').length;
  const codingAccuracy = codingAttempted > 0 ? Math.round((codingSolved / codingAttempted) * 100) : 0;
  const topicsSet = new Set<string>();
  recentSubmissions.forEach((s) => {
    const t = s.topic || s.problem_data?.topic;
    if (t) topicsSet.add(t);
  });

  // Calculate Placement Metrics
  const placementAttempts = recentPlacements.length;
  const placementScores = recentPlacements.map((p) => p.score || p.accuracy || 0);
  const placementAvgScore = placementAttempts > 0 ? Math.round(placementScores.reduce((a, b) => a + b, 0) / placementAttempts) : 0;

  // Calculate Interview Metrics
  const interviewCount = recentInterviews.length;
  const interviewScores = recentInterviews.map((i) => i.overall_score ?? i.overallScore ?? 0);
  const interviewAvgScore = interviewCount > 0 ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewCount) : 0;

  // Roadmap & Planner Metrics
  const totalRoadmap = roadmapTasks.length;
  const roadmapProgress = totalRoadmap > 0 ? Math.round((completedRoadmapIds.length / totalRoadmap) * 100) : 0;

  let plannedCount = 0;
  let completedPlanCount = 0;
  for (const sp of studyPlans) {
    const tasks = sp.tasks || [];
    plannedCount += tasks.length;
    completedPlanCount += tasks.filter((t) => t.status === 'completed').length;
  }
  const plannerRate = plannedCount > 0 ? Math.round((completedPlanCount / plannedCount) * 100) : 0;

  const isSufficientData = codingAttempted > 0 || placementAttempts > 0 || interviewCount > 0 || resumes.length > 0;

  // Determine Biggest Improvement
  let biggestImprovement: WeeklyCareerReport['biggestImprovement'] = null;
  if (codingSolved >= 2) {
    biggestImprovement = {
      area: 'Coding Problem Solving',
      metric: `${codingSolved} Solved`,
      description: `Solved ${codingSolved} problems across ${topicsSet.size} topic areas with ${codingAccuracy}% accuracy.`,
    };
  } else if (interviewCount >= 1) {
    biggestImprovement = {
      area: 'Technical Mock Interview',
      metric: `${interviewAvgScore}/100 Score`,
      description: `Completed mock interview assessment evaluating technical explanation and accuracy.`,
    };
  } else if (resumes.length > 0) {
    biggestImprovement = {
      area: 'Resume Optimization',
      metric: `${latestResume?.overall_score || 75} ATS`,
      description: `Optimized resume structured content and targeted keyword alignment.`,
    };
  }

  // Determine Biggest Gap
  let biggestGap: WeeklyCareerReport['biggestGap'] = null;
  if (interviewCount === 0) {
    biggestGap = {
      area: 'Technical Mock Interviews',
      description: 'Zero mock interviews completed this week. Verbal technical communication requires weekly practice.',
      recommendedAction: 'Schedule and take one AI technical mock interview.',
      actionRoute: 'interview',
    };
  } else if (codingAttempted < 3) {
    biggestGap = {
      area: 'Coding Practice Frequency',
      description: 'Fewer than 3 coding problems attempted this week.',
      recommendedAction: 'Solve 1 Medium problem daily to build continuous problem-solving stamina.',
      actionRoute: 'coding',
    };
  } else if (placementAttempts === 0) {
    biggestGap = {
      area: 'Placement Aptitude Assessments',
      description: 'No aptitude speed tests taken this week.',
      recommendedAction: 'Complete a 10-minute quantitative reasoning practice round.',
      actionRoute: 'placement',
    };
  }

  // Next Week's Focus Items
  const nextWeeksFocus = [
    {
      title: 'Practice 4 Medium Algorithmic Problems',
      reason: 'Strengthen data structure implementation and edge-case testing.',
      priority: 'high' as const,
      actionRoute: 'coding',
    },
    {
      title: 'Complete 1 Live Technical Mock Interview',
      reason: 'Evaluate verbal STAR responses and time complexity trade-offs.',
      priority: 'high' as const,
      actionRoute: 'interview',
    },
    {
      title: 'Review Target Role Job Description Match',
      reason: 'Align resume project descriptions with target employer keywords.',
      priority: 'medium' as const,
      actionRoute: 'resume-analyzer',
    },
  ];

  const executiveSummary = isSufficientData
    ? `Over the past 7 days, you logged ${codingAttempted} coding submissions and completed ${interviewCount} interview rounds. Your overall readiness stands at ${params.currentReadinessScore ?? 0}%. Continue focusing on ${biggestGap?.area || 'coding breadth'} next week.`
    : 'Not enough activity recorded over the past 7 days to generate a full weekly trend report. Solve coding challenges and complete mock interviews to activate weekly analytics.';

  return {
    id: `weekly_report_${now.toISOString().split('T')[0]}`,
    startDate: startDateStr,
    endDate: endDateStr,
    isSufficientData,
    studentName: params.studentName || 'Student',
    targetRole: params.targetRole || 'Software Engineer',
    coding: {
      attemptedCount: codingAttempted,
      solvedCount: codingSolved,
      accuracyRate: codingAccuracy,
      topicsPracticed: Array.from(topicsSet),
    },
    placement: {
      attemptsCount: placementAttempts,
      averageScore: placementAvgScore,
      averageAccuracy: placementAvgScore,
    },
    interview: {
      completedCount: interviewCount,
      averageScore: interviewAvgScore,
      weakestDimension: interviewCount > 0 ? 'Communication' : null,
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
      newVersionsCreated: 0,
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
