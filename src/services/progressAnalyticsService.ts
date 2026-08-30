/**
 * Progress Analytics Service
 * Production-grade computational engine for CareerPilot AI.
 * 
 * CORE PRINCIPLES:
 * 1. Supabase is the source of truth for all user progress data.
 * 2. Zero-fabrication: Never invent fake scores, streaks, or percentages.
 * 3. Transparent mathematical calculations across all dimensions.
 * 4. Multi-range filtering: 7 Days, 30 Days, 90 Days, All Time.
 */

import {
  ProgressAnalyticsData,
  AnalyticsTimeRange,
  CareerReadinessTrendPoint,
  CodingProgressAnalytics,
  CodingTopicAnalyticsItem,
  PlacementProgressAnalytics,
  PlacementSessionTrendPoint,
  MockInterviewProgressAnalytics,
  ResumeProgressAnalytics,
  RoadmapProgressAnalytics,
  StudyPlannerProgressAnalytics,
  WeeklyProgressSummary,
  WeeklyComparisonItem,
  ProvenStrengthItem,
  ImprovementAreaItem,
  MetricTrendIndicator,
} from '../types/intelligence';
import { CodingSubmission } from '../types/coding';
import { MockInterviewReport } from '../types/interview';
import { ResumeVersionItem, ResumeAnalysisResult } from '../types/resume';
import { PlacementTestSession } from '../types/placement';
import { DailyRoadmapTask } from '../types/roadmap';
import { StudyPlanData } from '../types/studyPlanner';
import { calculateStreaks } from './achievementService';
import { careerReadinessHistoryService } from './careerReadinessHistoryService';

export const CANONICAL_CODING_TOPICS = [
  'Arrays',
  'Strings',
  'Two Pointers',
  'Sliding Window',
  'Binary Search',
  'Sorting',
  'Linked Lists',
  'Stack',
  'Queue',
  'Recursion',
  'Trees',
  'Graphs',
  'Dynamic Programming',
  'Bit Manipulation',
  'Hashing',
  'Greedy',
  'Matrix',
];

function formatDisplayDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (_) {
    return '';
  }
}

function filterByTimeRange<T>(
  items: T[],
  getDateFn: (item: T) => string | undefined | null,
  timeRange: AnalyticsTimeRange
): T[] {
  if (!items || items.length === 0 || timeRange === 'all') {
    return items || [];
  }

  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

  return items.filter((item) => {
    const dateStr = getDateFn(item);
    if (!dateStr) return false;
    const time = new Date(dateStr).getTime();
    return !isNaN(time) && time >= cutoffTime;
  });
}

// ============================================================================
// 1. CODING PROGRESS ANALYTICS
// ============================================================================

export function computeCodingProgressAnalytics(
  submissions: CodingSubmission[] = [],
  timeRange: AnalyticsTimeRange = 'all',
  userId: string = 'guest'
): CodingProgressAnalytics {
  const allSafe = Array.isArray(submissions) ? submissions.filter(Boolean) : [];
  const filteredSubmissions = filterByTimeRange(
    allSafe,
    (s) => s.created_at,
    timeRange
  );

  // Streaks are computed across all-time submissions for authenticity
  const { currentStreak, longestStreak } = calculateStreaks(allSafe, userId);

  if (filteredSubmissions.length === 0) {
    // Topic breakdown with clean "not enough data" placeholders
    const emptyTopicBreakdown: Record<string, CodingTopicAnalyticsItem> = {};
    for (const t of CANONICAL_CODING_TOPICS) {
      emptyTopicBreakdown[t] = {
        topic: t,
        attempted: 0,
        solved: 0,
        accuracy: 0,
        hasEnoughData: false,
      };
    }

    return {
      attemptedCount: 0,
      solvedCount: 0,
      uniqueAcceptedCount: 0,
      totalSubmissions: 0,
      successfulSubmissions: 0,
      accuracyRate: 0,
      successRate: 0,
      currentStreakDays: currentStreak,
      longestStreakDays: longestStreak,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      strongestTopics: [],
      weakestTopics: [],
      topicBreakdown: emptyTopicBreakdown,
      recentSubmissions: [],
      historicalWeeklyActivity: [],
    };
  }

  const uniqueAttemptedProblems = new Set<string>();
  const acceptedUniqueMap = new Map<string, CodingSubmission>();
  const topicStats: Record<string, { attempted: number; solved: number }> = {};
  let easySolved = 0;
  let mediumSolved = 0;
  let hardSolved = 0;
  let totalAcceptedSubmissions = 0;

  for (const s of filteredSubmissions) {
    if (!s) continue;
    uniqueAttemptedProblems.add(s.problem_id);
    const isAccepted = s.status === 'accepted';
    if (isAccepted) totalAcceptedSubmissions++;

    const rawTopic = s.topic || s.problem_data?.topic || 'General';
    // Match canonical topic or capitalize
    const matchedCanonical = CANONICAL_CODING_TOPICS.find(
      (ct) => ct.toLowerCase() === rawTopic.toLowerCase()
    );
    const topic = matchedCanonical || rawTopic;

    if (!topicStats[topic]) {
      topicStats[topic] = { attempted: 0, solved: 0 };
    }
    topicStats[topic].attempted++;

    if (isAccepted && !acceptedUniqueMap.has(s.problem_id)) {
      acceptedUniqueMap.set(s.problem_id, s);
      topicStats[topic].solved++;

      const diff = (s.difficulty || s.problem_data?.difficulty || 'easy').toLowerCase();
      if (diff === 'easy') easySolved++;
      else if (diff === 'medium') mediumSolved++;
      else if (diff === 'hard') hardSolved++;
      else easySolved++;
    }
  }

  const totalSubmissions = filteredSubmissions.length;
  const attemptedCount = uniqueAttemptedProblems.size;
  const uniqueAcceptedCount = acceptedUniqueMap.size;
  const accuracyRate = totalSubmissions > 0 ? Math.round((totalAcceptedSubmissions / totalSubmissions) * 100) : 0;
  const successRate = attemptedCount > 0 ? Math.round((uniqueAcceptedCount / attemptedCount) * 100) : 0;

  // Build topic breakdown
  const topicBreakdown: Record<string, CodingTopicAnalyticsItem> = {};
  const topicList: Array<{ topic: string; attempted: number; solved: number; accuracy: number }> = [];

  // Seed canonical topics first
  for (const t of CANONICAL_CODING_TOPICS) {
    const stats = topicStats[t];
    if (stats && stats.attempted > 0) {
      const acc = Math.round((stats.solved / stats.attempted) * 100);
      topicBreakdown[t] = {
        topic: t,
        attempted: stats.attempted,
        solved: stats.solved,
        accuracy: acc,
        hasEnoughData: true,
      };
      topicList.push({ topic: t, attempted: stats.attempted, solved: stats.solved, accuracy: acc });
    } else {
      topicBreakdown[t] = {
        topic: t,
        attempted: 0,
        solved: 0,
        accuracy: 0,
        hasEnoughData: false,
      };
    }
  }

  // Add any custom topics not in canonical list
  for (const [t, stats] of Object.entries(topicStats)) {
    if (!topicBreakdown[t] && stats.attempted > 0) {
      const acc = Math.round((stats.solved / stats.attempted) * 100);
      topicBreakdown[t] = {
        topic: t,
        attempted: stats.attempted,
        solved: stats.solved,
        accuracy: acc,
        hasEnoughData: true,
      };
      topicList.push({ topic: t, attempted: stats.attempted, solved: stats.solved, accuracy: acc });
    }
  }

  const strongestTopics = [...topicList]
    .filter((t) => t.solved > 0)
    .sort((a, b) => b.accuracy - a.accuracy || b.solved - a.solved)
    .slice(0, 4)
    .map((t) => ({ topic: t.topic, solved: t.solved, accuracy: t.accuracy }));

  const weakestTopics = [...topicList]
    .filter((t) => t.attempted > 0)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 4)
    .map((t) => ({ topic: t.topic, attempted: t.attempted, accuracy: t.accuracy }));

  // Historical activity by day
  const dayMap = new Map<string, { submissions: number; accepted: number }>();
  for (const s of filteredSubmissions) {
    const dStr = s.created_at || new Date().toISOString();
    const dayKey = dStr.split('T')[0];
    const cur = dayMap.get(dayKey) || { submissions: 0, accepted: 0 };
    cur.submissions++;
    if (s.status === 'accepted') cur.accepted++;
    dayMap.set(dayKey, cur);
  }

  const historicalWeeklyActivity = Array.from(dayMap.entries())
    .map(([date, counts]) => ({
      date,
      submissionsCount: counts.submissions,
      acceptedCount: counts.accepted,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  return {
    attemptedCount,
    solvedCount: uniqueAcceptedCount,
    uniqueAcceptedCount,
    totalSubmissions,
    successfulSubmissions: totalAcceptedSubmissions,
    accuracyRate,
    successRate,
    currentStreakDays: currentStreak,
    longestStreakDays: longestStreak,
    easySolved,
    mediumSolved,
    hardSolved,
    strongestTopics,
    weakestTopics,
    topicBreakdown,
    recentSubmissions: filteredSubmissions.slice(0, 10),
    historicalWeeklyActivity,
  };
}

// ============================================================================
// 2. PLACEMENT / APTITUDE PROGRESS ANALYTICS
// ============================================================================

export function computePlacementProgressAnalytics(
  sessions: PlacementTestSession[] = [],
  timeRange: AnalyticsTimeRange = 'all'
): PlacementProgressAnalytics {
  const allSafe = Array.isArray(sessions) ? sessions.filter(Boolean) : [];
  const filteredSessions = filterByTimeRange(
    allSafe,
    (s) => s.completedAt || s.createdAt,
    timeRange
  );

  if (filteredSessions.length === 0) {
    return {
      totalAttempts: 0,
      totalQuestionsAnswered: 0,
      totalCorrect: 0,
      averageScore: 0,
      averageAccuracy: 0,
      bestScore: 0,
      recentSessions: [],
      recentPerformanceTrend: [],
      categoryPerformance: {},
      subjectPerformance: {},
      improvementTrend: 0,
    };
  }

  // Sort chronological for trends
  const chronological = [...filteredSessions].sort((a, b) => {
    const tA = new Date(a.completedAt || a.createdAt || 0).getTime();
    const tB = new Date(b.completedAt || b.createdAt || 0).getTime();
    return tA - tB;
  });

  const categoryMap: Record<string, { sumScore: number; count: number; totalQ: number; correctQ: number }> = {};
  const subjectMap: Record<string, { sumScore: number; count: number; totalQ: number; correctQ: number }> = {};
  let totalScoreSum = 0;
  let totalAccSum = 0;
  let totalQuestions = 0;
  let totalCorrect = 0;
  let bestScore = 0;

  const recentPerformanceTrend: PlacementSessionTrendPoint[] = [];

  for (const s of chronological) {
    const sc = typeof s.score === 'number' ? s.score : s.accuracy || 0;
    const acc = typeof s.accuracy === 'number' ? s.accuracy : sc;
    const qCount = s.totalQuestions || 0;
    const cCount = s.correctCount || Math.round((acc / 100) * qCount);

    if (sc > bestScore) bestScore = sc;

    totalScoreSum += sc;
    totalAccSum += acc;
    totalQuestions += qCount;
    totalCorrect += cCount;

    const dateStr = s.completedAt || s.createdAt || new Date().toISOString();
    recentPerformanceTrend.push({
      id: s.id,
      date: dateStr.split('T')[0],
      displayDate: formatDisplayDate(dateStr),
      title: s.subject || s.topic || 'Aptitude Test',
      score: sc,
      accuracy: acc,
      totalQuestions: qCount,
      correctAnswers: cCount,
    });

    const cat = s.category || 'Quantitative';
    if (!categoryMap[cat]) categoryMap[cat] = { sumScore: 0, count: 0, totalQ: 0, correctQ: 0 };
    categoryMap[cat].sumScore += sc;
    categoryMap[cat].count++;
    categoryMap[cat].totalQ += qCount;
    categoryMap[cat].correctQ += cCount;

    const subj = s.subject || s.topic || 'General Aptitude';
    if (!subjectMap[subj]) subjectMap[subj] = { sumScore: 0, count: 0, totalQ: 0, correctQ: 0 };
    subjectMap[subj].sumScore += sc;
    subjectMap[subj].count++;
    subjectMap[subj].totalQ += qCount;
    subjectMap[subj].correctQ += cCount;
  }

  const totalAttempts = filteredSessions.length;
  const averageScore = Math.round(totalScoreSum / totalAttempts);
  const averageAccuracy = Math.round(totalAccSum / totalAttempts);

  const categoryPerformance: Record<string, { attempts: number; avgScore: number; accuracy: number; totalQuestions: number }> = {};
  for (const [cat, data] of Object.entries(categoryMap)) {
    categoryPerformance[cat] = {
      attempts: data.count,
      avgScore: Math.round(data.sumScore / data.count),
      accuracy: data.totalQ > 0 ? Math.round((data.correctQ / data.totalQ) * 100) : Math.round(data.sumScore / data.count),
      totalQuestions: data.totalQ,
    };
  }

  const subjectPerformance: Record<string, { attempts: number; avgScore: number; accuracy: number; totalQuestions: number }> = {};
  for (const [subj, data] of Object.entries(subjectMap)) {
    subjectPerformance[subj] = {
      attempts: data.count,
      avgScore: Math.round(data.sumScore / data.count),
      accuracy: data.totalQ > 0 ? Math.round((data.correctQ / data.totalQ) * 100) : Math.round(data.sumScore / data.count),
      totalQuestions: data.totalQ,
    };
  }

  // Trend calculation: delta between first half and second half
  let improvementTrend = 0;
  if (chronological.length >= 2) {
    const mid = Math.floor(chronological.length / 2);
    const older = chronological.slice(0, mid);
    const newer = chronological.slice(mid);
    const avgOlder = older.length > 0 ? older.reduce((a, s) => a + (s.score || 0), 0) / older.length : 0;
    const avgNewer = newer.length > 0 ? newer.reduce((a, s) => a + (s.score || 0), 0) / newer.length : 0;
    improvementTrend = Math.round(avgNewer - avgOlder);
  }

  return {
    totalAttempts,
    averageScore,
    averageAccuracy,
    bestScore,
    totalQuestionsAnswered: totalQuestions,
    totalCorrect,
    categoryPerformance,
    subjectPerformance,
    recentSessions: [...chronological].reverse().slice(0, 10),
    recentPerformanceTrend: recentPerformanceTrend.slice(-10),
    improvementTrend,
  };
}

// ============================================================================
// 3. MOCK INTERVIEW PROGRESS ANALYTICS (TECHNICAL & HR)
// ============================================================================

export function computeInterviewProgressAnalytics(
  reports: MockInterviewReport[] = [],
  timeRange: AnalyticsTimeRange = 'all'
): MockInterviewProgressAnalytics {
  const allSafe = Array.isArray(reports) ? reports.filter(Boolean) : [];
  const filteredReports = filterByTimeRange(
    allSafe,
    (r) => r.completedAt || (r as any).completed_at,
    timeRange
  );

  if (filteredReports.length === 0) {
    return {
      totalInterviews: 0,
      averageOverallScore: 0,
      averageTechnicalScore: 0,
      averageCommunicationScore: 0,
      averageProblemSolvingScore: 0,
      averageConfidenceScore: 0,
      latestScore: 0,
      previousScore: null,
      scoreDelta: null,
      historicalReports: [],
      subjectAverages: {},
      identifiedStrengths: [],
      identifiedWeaknesses: [],
      technicalInterviewsCount: 0,
      technicalAverageScore: 0,
      technicalLatestScore: 0,
      hrInterviewsCount: 0,
      hrAverageScore: null,
      hrLatestScore: null,
      hrCommunicationScore: null,
      isHrAssessed: false,
    };
  }

  const sorted = [...filteredReports].sort((a, b) => {
    const tA = new Date(a.completedAt || (a as any).completed_at || 0).getTime();
    const tB = new Date(b.completedAt || (b as any).completed_at || 0).getTime();
    return tB - tA;
  });

  const latest: Partial<MockInterviewReport> = sorted[0] || {};
  const latestScore = (latest as any).overall_score ?? latest.overallScore ?? 0;
  const previous = sorted.length > 1 ? sorted[1] : null;
  const previousScore = previous ? ((previous as any).overall_score ?? previous.overallScore ?? null) : null;
  const scoreDelta = previousScore !== null ? latestScore - previousScore : null;

  let sumOverall = 0;
  let sumTech = 0;
  let sumComm = 0;
  let sumProblem = 0;
  let sumConf = 0;
  const subjectMap: Record<string, { count: number; sumScore: number }> = {};
  const strengthsSet = new Set<string>();
  const weaknessesSet = new Set<string>();

  // Technical vs HR split
  const technicalReports: MockInterviewReport[] = [];
  const hrReports: MockInterviewReport[] = [];

  for (const r of sorted) {
    const sc = (r as any).overall_score ?? r.overallScore ?? 0;
    const tech = (r as any).technical_score ?? r.technicalKnowledgeScore ?? sc;
    const comm = (r as any).communication_score ?? r.communicationScore ?? sc;
    const prob = (r as any).problem_solving_score ?? r.problemSolvingScore ?? sc;
    const conf = sc;

    sumOverall += sc;
    sumTech += tech;
    sumComm += comm;
    sumProblem += prob;
    sumConf += conf;

    const subj = r.subject || 'Technical';
    const isHr =
      subj.toLowerCase().includes('hr') ||
      subj.toLowerCase().includes('behavioral') ||
      (r as any).interview_type === 'hr' ||
      (r as any).interviewType === 'hr';

    if (isHr) {
      hrReports.push(r);
    } else {
      technicalReports.push(r);
    }

    if (!subjectMap[subj]) subjectMap[subj] = { count: 0, sumScore: 0 };
    subjectMap[subj].count++;
    subjectMap[subj].sumScore += sc;

    const areas = (r as any).areas_to_improve || r.areasForImprovement || [];
    areas.forEach((a: string) => {
      if (a && typeof a === 'string') weaknessesSet.add(a);
    });

    const strList = (r as any).strengths || (r as any).strongPoints || [];
    strList.forEach((s: string) => {
      if (s && typeof s === 'string') strengthsSet.add(s);
    });
  }

  const count = sorted.length;
  const subjectAverages: Record<string, { count: number; avgScore: number }> = {};
  for (const [subj, data] of Object.entries(subjectMap)) {
    subjectAverages[subj] = {
      count: data.count,
      avgScore: Math.round(data.sumScore / data.count),
    };
  }

  // Technical metrics
  const techCount = technicalReports.length;
  const techAvg =
    techCount > 0
      ? Math.round(
          technicalReports.reduce(
            (acc, r) => acc + ((r as any).overall_score ?? r.overallScore ?? 0),
            0
          ) / techCount
        )
      : 0;
  const techLatest = techCount > 0 ? (technicalReports[0] as any).overall_score ?? technicalReports[0].overallScore ?? 0 : 0;

  // HR metrics (strictly unassessed if 0 HR interviews)
  const hrCount = hrReports.length;
  const isHrAssessed = hrCount > 0;
  const hrAvg =
    hrCount > 0
      ? Math.round(
          hrReports.reduce(
            (acc, r) => acc + ((r as any).overall_score ?? r.overallScore ?? 0),
            0
          ) / hrCount
        )
      : null;
  const hrLatest = hrCount > 0 ? (hrReports[0] as any).overall_score ?? hrReports[0].overallScore ?? null : null;
  const hrComm =
    hrCount > 0
      ? Math.round(
          hrReports.reduce(
            (acc, r) => acc + ((r as any).communication_score ?? r.communicationScore ?? 0),
            0
          ) / hrCount
        )
      : null;

  return {
    totalInterviews: count,
    averageOverallScore: Math.round(sumOverall / count),
    averageTechnicalScore: Math.round(sumTech / count),
    averageCommunicationScore: Math.round(sumComm / count),
    averageProblemSolvingScore: Math.round(sumProblem / count),
    averageConfidenceScore: Math.round(sumConf / count),
    latestScore,
    previousScore,
    scoreDelta,
    historicalReports: sorted,
    subjectAverages,
    identifiedStrengths: Array.from(strengthsSet).slice(0, 5),
    identifiedWeaknesses: Array.from(weaknessesSet).slice(0, 5),
    technicalInterviewsCount: techCount,
    technicalAverageScore: techAvg,
    technicalLatestScore: techLatest,
    hrInterviewsCount: hrCount,
    hrAverageScore: hrAvg,
    hrLatestScore: hrLatest,
    hrCommunicationScore: hrComm,
    isHrAssessed,
  };
}

// ============================================================================
// 4. RESUME PROGRESS ANALYTICS
// ============================================================================

export function computeResumeProgressAnalytics(
  resumes: ResumeVersionItem[] = [],
  latestAnalysis: { result: ResumeAnalysisResult; targetRole: string; analyzedAt: string } | null = null
): ResumeProgressAnalytics {
  const safeResumes = Array.isArray(resumes) ? resumes.filter(Boolean) : [];
  const versionsCount = Math.max(safeResumes.length, latestAnalysis ? 1 : 0);
  const isAssessed = versionsCount > 0 || !!latestAnalysis?.result;

  if (!isAssessed) {
    return {
      totalVersions: 0,
      latestAtsScore: 0,
      previousAtsScore: null,
      highestAtsScore: 0,
      versionsList: [],
      scoreImprovementDelta: null,
      latestAnalysisDate: null,
      targetRole: null,
      latestMissingSkills: [],
      latestStrengths: [],
      isAssessed: false,
    };
  }

  // Sort chronological for delta calculation
  const chronological = [...safeResumes].sort((a, b) => {
    const tA = new Date(a.createdAt || (a as any).uploadedAt || 0).getTime();
    const tB = new Date(b.createdAt || (b as any).uploadedAt || 0).getTime();
    return tA - tB;
  });

  const latestScore =
    latestAnalysis?.result?.overall_score ??
    latestAnalysis?.result?.ats_score ??
    safeResumes[0]?.analysisResult?.ats_score ??
    safeResumes[0]?.analysisResult?.overall_score ??
    0;

  const previousResume = chronological.length > 1 ? chronological[chronological.length - 2] : null;
  const previousAtsScore = previousResume
    ? previousResume.analysisResult?.ats_score || previousResume.analysisResult?.overall_score || null
    : null;

  const allScores = safeResumes
    .map((r) => r?.analysisResult?.ats_score || r?.analysisResult?.overall_score || 0)
    .filter((s) => s > 0);
  if (latestAnalysis?.result?.overall_score) allScores.push(latestAnalysis.result.overall_score);

  const highestAtsScore = allScores.length > 0 ? Math.max(...allScores) : latestScore;
  const scoreImprovementDelta =
    previousAtsScore !== null ? Math.round(latestScore - previousAtsScore) : null;

  const latestAnalysisDate = latestAnalysis?.analyzedAt
    ? formatDisplayDate(latestAnalysis.analyzedAt)
    : safeResumes[0]?.createdAt || (safeResumes[0] as any)?.uploadedAt
    ? formatDisplayDate(safeResumes[0].createdAt || (safeResumes[0] as any)?.uploadedAt)
    : null;

  return {
    totalVersions: versionsCount,
    latestAtsScore: Math.round(latestScore),
    previousAtsScore: previousAtsScore !== null ? Math.round(previousAtsScore) : null,
    highestAtsScore: Math.round(highestAtsScore),
    versionsList: safeResumes,
    scoreImprovementDelta,
    latestAnalysisDate,
    targetRole: latestAnalysis?.targetRole || 'Software Engineer',
    latestMissingSkills: latestAnalysis?.result?.missing_skills || [],
    latestStrengths: latestAnalysis?.result?.strengths || [],
    isAssessed: true,
  };
}

// ============================================================================
// 5. ROADMAP PROGRESS ANALYTICS
// ============================================================================

export function computeRoadmapProgressAnalytics(
  tasks: DailyRoadmapTask[] = [],
  completedItemIds: string[] = []
): RoadmapProgressAnalytics {
  const safeTasks = Array.isArray(tasks) ? tasks.filter(Boolean) : [];
  const safeCompletedIds = new Set(Array.isArray(completedItemIds) ? completedItemIds : []);
  const totalTasks = safeTasks.length;
  const completedTasks = safeTasks.filter((t) => safeCompletedIds.has(t.id) || t.completed || (t as any).isCompleted).length;
  const remainingTasks = Math.max(0, totalTasks - completedTasks);
  const completionPercentage = totalTasks > 0 ? Math.min(100, Math.round((completedTasks / totalTasks) * 100)) : 0;

  let activePhaseTitle = 'Phase 1: Foundations';
  if (completionPercentage >= 75) activePhaseTitle = 'Phase 4: Advanced Mastery & Mock Interviews';
  else if (completionPercentage >= 50) activePhaseTitle = 'Phase 3: Deep Technical Practice & Systems';
  else if (completionPercentage >= 25) activePhaseTitle = 'Phase 2: Core Data Structures & Algorithms';

  // Extract skills from roadmap tasks
  const skillsMap = new Map<string, boolean>();
  for (const t of safeTasks) {
    const isDone = safeCompletedIds.has(t.id) || t.completed || (t as any).isCompleted;
    if (t.title) {
      skillsMap.set(t.title, isDone);
    }
  }

  const skillsList = Array.from(skillsMap.entries()).map(([name, isCompleted]) => ({
    name,
    isCompleted,
  }));

  const completedSkillsCount = skillsList.filter((s) => s.isCompleted).length;
  const remainingSkillsCount = skillsList.length - completedSkillsCount;

  return {
    totalTasks,
    completedTasks,
    remainingTasks,
    completionPercentage,
    activePhaseTitle,
    lastCompletedDate: completedTasks > 0 ? new Date().toISOString() : null,
    completedSkillsCount,
    remainingSkillsCount,
    skillsList: skillsList.slice(0, 12),
  };
}

// ============================================================================
// 6. STUDY PLANNER PROGRESS ANALYTICS
// ============================================================================

export function computeStudyPlannerProgressAnalytics(
  studyPlans: StudyPlanData[] = [],
  dailyStudyTime: number = 60
): StudyPlannerProgressAnalytics {
  if (!studyPlans || studyPlans.length === 0) {
    return {
      totalGeneratedPlans: 0,
      totalPlannedTasks: 0,
      completedPlannedTasks: 0,
      consistencyRate: 0,
      totalStudyMinutesLogged: 0,
    };
  }

  let totalTasks = 0;
  let completedTasks = 0;

  for (const plan of studyPlans) {
    const tasks = plan.tasks || [];
    totalTasks += tasks.length;
    completedTasks += tasks.filter((t) => t.status === 'completed').length;
  }

  const consistencyRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalGeneratedPlans: studyPlans.length,
    totalPlannedTasks: totalTasks,
    completedPlannedTasks: completedTasks,
    consistencyRate,
    totalStudyMinutesLogged: completedTasks * Math.round(dailyStudyTime / 3),
  };
}

// ============================================================================
// 7. WEEKLY PROGRESS & PREVIOUS-WEEK COMPARISON ("THIS WEEK")
// ============================================================================

export function computeWeeklyProgressSummary(params: {
  submissions?: CodingSubmission[];
  placementSessions?: PlacementTestSession[];
  mockInterviews?: MockInterviewReport[];
  studyPlans?: StudyPlanData[];
  resumes?: ResumeVersionItem[];
  completedRoadmapIds?: string[];
  historicalReadiness?: CareerReadinessTrendPoint[];
}): WeeklyProgressSummary {
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

  const subs = params.submissions || [];
  const placement = params.placementSessions || [];
  const interviews = params.mockInterviews || [];
  const study = params.studyPlans || [];
  const resumes = params.resumes || [];
  const roadmapIds = params.completedRoadmapIds || [];

  // Helper to count in time window
  const countInWindow = <T>(
    items: T[],
    getDate: (i: T) => string | undefined | null,
    start: number,
    end: number
  ) => {
    return items.filter((i) => {
      const d = getDate(i);
      if (!d) return false;
      const t = new Date(d).getTime();
      return !isNaN(t) && t >= start && t < end;
    }).length;
  };

  const currentCoding = countInWindow(subs, (s) => s.created_at, oneWeekAgo, now);
  const prevCoding = countInWindow(subs, (s) => s.created_at, twoWeeksAgo, oneWeekAgo);

  const currentPlacement = countInWindow(
    placement,
    (p) => p.completedAt || p.createdAt,
    oneWeekAgo,
    now
  );
  const prevPlacement = countInWindow(
    placement,
    (p) => p.completedAt || p.createdAt,
    twoWeeksAgo,
    oneWeekAgo
  );

  const currentInterview = countInWindow(
    interviews,
    (m) => m.completedAt || (m as any).completed_at,
    oneWeekAgo,
    now
  );
  const prevInterview = countInWindow(
    interviews,
    (m) => m.completedAt || (m as any).completed_at,
    twoWeeksAgo,
    oneWeekAgo
  );

  const currentResume = countInWindow(
    resumes,
    (r) => r.createdAt || (r as any).uploadedAt,
    oneWeekAgo,
    now
  );
  const prevResume = countInWindow(
    resumes,
    (r) => r.createdAt || (r as any).uploadedAt,
    twoWeeksAgo,
    oneWeekAgo
  );

  const buildComparisonItem = (current: number, prev: number, label: string): WeeklyComparisonItem => {
    const delta = current - prev;
    let trend: 'up' | 'down' | 'stable' | 'none' = 'none';
    if (prev > 0 || current > 0) {
      if (delta > 0) trend = 'up';
      else if (delta < 0) trend = 'down';
      else trend = 'stable';
    }
    const sign = delta > 0 ? '+' : '';
    const displayText =
      prev > 0 || current > 0
        ? `${sign}${delta} vs prev week`
        : 'No previous-week data';

    return {
      currentValue: current,
      previousValue: prev,
      delta,
      trend,
      displayText,
    };
  };

  const hasAnyActivityThisOrLastWeek =
    currentCoding > 0 ||
    prevCoding > 0 ||
    currentPlacement > 0 ||
    prevPlacement > 0 ||
    currentInterview > 0 ||
    prevInterview > 0;

  const hasPreviousWeekData =
    prevCoding > 0 || prevPlacement > 0 || prevInterview > 0 || prevResume > 0;

  // Readiness delta
  let overallReadinessDelta: number | null = null;
  const history = params.historicalReadiness || [];
  if (history.length >= 2) {
    const latestScore = history[history.length - 1]?.score;
    const weekAgoScore = history.find((h) => {
      const t = new Date(h.date).getTime();
      return !isNaN(t) && t <= oneWeekAgo;
    })?.score;

    if (latestScore !== undefined && weekAgoScore !== undefined) {
      overallReadinessDelta = latestScore - weekAgoScore;
    }
  }

  return {
    hasSufficientData: hasAnyActivityThisOrLastWeek,
    codingProblems: buildComparisonItem(currentCoding, prevCoding, 'coding problems'),
    placementQuestions: buildComparisonItem(currentPlacement, prevPlacement, 'placement tests'),
    interviewsCompleted: buildComparisonItem(currentInterview, prevInterview, 'mock interviews'),
    studyTasksCompleted: buildComparisonItem(0, 0, 'study tasks'),
    resumeActivity: buildComparisonItem(currentResume, prevResume, 'resume updates'),
    roadmapMilestones: buildComparisonItem(0, 0, 'roadmap milestones'),
    overallReadinessDelta,
    comparisonNote: hasPreviousWeekData
      ? 'Compared to the previous 7-day period.'
      : 'No previous-week comparison available.',
  };
}

// ============================================================================
// 8. PROVEN STRENGTHS & AREAS TO IMPROVE
// ============================================================================

export function computeStrengthsAndWeaknesses(params: {
  coding: CodingProgressAnalytics;
  placement: PlacementProgressAnalytics;
  interview: MockInterviewProgressAnalytics;
  resume: ResumeProgressAnalytics;
  roadmap: RoadmapProgressAnalytics;
}): { provenStrengths: ProvenStrengthItem[]; areasToImprove: ImprovementAreaItem[] } {
  const { coding, placement, interview, resume, roadmap } = params;
  const strengths: ProvenStrengthItem[] = [];
  const weaknesses: ImprovementAreaItem[] = [];

  // Coding Topic Strengths (>= 80% accuracy with >= 2 submissions)
  for (const [topicName, item] of Object.entries(coding.topicBreakdown)) {
    if (item.hasEnoughData && item.attempted >= 2 && item.accuracy >= 80) {
      strengths.push({
        title: `${topicName} (Coding)`,
        category: 'coding',
        score: `${item.accuracy}%`,
        evidence: `${item.solved} solved out of ${item.attempted} attempts (${item.accuracy}% accuracy).`,
        badgeLevel: item.accuracy >= 90 ? 'Mastered' : 'Strong',
      });
    } else if (item.hasEnoughData && item.attempted >= 2 && item.accuracy < 70) {
      weaknesses.push({
        title: `${topicName} Problems`,
        category: 'coding',
        score: `${item.accuracy}%`,
        evidence: `${item.accuracy}% accuracy across ${item.attempted} submissions.`,
        actionRoute: 'coding',
        actionText: `Practice ${topicName}`,
        severity: item.accuracy < 50 ? 'high' : 'medium',
      });
    }
  }

  // Placement Strengths & Weaknesses
  for (const [catName, data] of Object.entries(placement.categoryPerformance)) {
    if (data.attempts >= 1 && data.accuracy >= 80) {
      strengths.push({
        title: `${catName} Aptitude`,
        category: 'aptitude',
        score: `${data.accuracy}%`,
        evidence: `Scored ${data.avgScore}% average across ${data.attempts} test session${data.attempts > 1 ? 's' : ''}.`,
        badgeLevel: data.accuracy >= 90 ? 'Mastered' : 'Strong',
      });
    } else if (data.attempts >= 1 && data.accuracy < 70) {
      weaknesses.push({
        title: `${catName} Aptitude`,
        category: 'aptitude',
        score: `${data.accuracy}%`,
        evidence: `Scoring ${data.accuracy}% accuracy in ${catName}. Recommended focus area for company tests.`,
        actionRoute: 'placement',
        actionText: `Take ${catName} Test`,
        severity: data.accuracy < 50 ? 'high' : 'medium',
      });
    }
  }

  // Interview Strengths & Weaknesses
  if (interview.totalInterviews >= 1) {
    if (interview.averageTechnicalScore >= 80) {
      strengths.push({
        title: 'Technical Interview Articulation',
        category: 'interview',
        score: `${interview.averageTechnicalScore}/100`,
        evidence: `Technical interview benchmark evaluated at ${interview.averageTechnicalScore}/100 across completed rounds.`,
        badgeLevel: 'Strong',
      });
    }
    if (interview.averageCommunicationScore >= 80) {
      strengths.push({
        title: 'Interview Communication & Clarity',
        category: 'interview',
        score: `${interview.averageCommunicationScore}/100`,
        evidence: `Clear verbal communication and structured problem explanation during interviews.`,
        badgeLevel: 'Proficient',
      });
    }
    // Gaps from interview reports
    for (const weakPoint of interview.identifiedWeaknesses.slice(0, 2)) {
      weaknesses.push({
        title: weakPoint,
        category: 'interview',
        evidence: `Flagged in recent technical mock interview feedback.`,
        actionRoute: 'interview',
        actionText: 'Practice Mock Interview',
        severity: 'medium',
      });
    }
  }

  // Resume Strengths & Weaknesses
  if (resume.isAssessed) {
    if (resume.latestAtsScore >= 80) {
      strengths.push({
        title: 'Resume ATS Alignment',
        category: 'resume',
        score: `${resume.latestAtsScore}/100`,
        evidence: `High keyword match and role alignment for target role: ${resume.targetRole}.`,
        badgeLevel: resume.latestAtsScore >= 90 ? 'Mastered' : 'Strong',
      });
    } else if (resume.latestAtsScore < 75 && resume.latestAtsScore > 0) {
      weaknesses.push({
        title: 'Resume ATS Optimization',
        category: 'resume',
        score: `${resume.latestAtsScore}/100`,
        evidence: `Current ATS score is ${resume.latestAtsScore}/100. Target role requires missing keywords or formatting enhancements.`,
        actionRoute: 'resume-analyzer',
        actionText: 'Optimize Resume',
        severity: 'high',
      });
    }
  }

  return {
    provenStrengths: strengths.slice(0, 6),
    areasToImprove: weaknesses.slice(0, 6),
  };
}

// ============================================================================
// 9. TREND INDICATORS
// ============================================================================

export function computeTrendIndicators(params: {
  coding: CodingProgressAnalytics;
  placement: PlacementProgressAnalytics;
  interview: MockInterviewProgressAnalytics;
  resume: ResumeProgressAnalytics;
  weekly: WeeklyProgressSummary;
}): Record<string, MetricTrendIndicator> {
  const { coding, placement, interview, resume, weekly } = params;

  const getCodingTrend = (): MetricTrendIndicator => {
    if (coding.accuracyRate > 0) {
      return {
        key: 'coding',
        direction: coding.accuracyRate >= 70 ? 'up' : 'stable',
        label: 'Coding Accuracy',
        changeText: `${coding.accuracyRate}% overall accuracy`,
      };
    }
    return { key: 'coding', direction: 'none', label: 'Coding Accuracy', changeText: 'No trend available' };
  };

  const getPlacementTrend = (): MetricTrendIndicator => {
    if (placement.improvementTrend !== 0) {
      return {
        key: 'placement',
        direction: placement.improvementTrend > 0 ? 'up' : 'down',
        label: 'Aptitude Trend',
        changeText: `${placement.improvementTrend > 0 ? '+' : ''}${placement.improvementTrend}% recent delta`,
      };
    }
    if (placement.totalAttempts > 0) {
      return {
        key: 'placement',
        direction: 'stable',
        label: 'Aptitude Trend',
        changeText: `${placement.averageAccuracy}% average score`,
      };
    }
    return { key: 'placement', direction: 'none', label: 'Aptitude Trend', changeText: 'No trend available' };
  };

  const getInterviewTrend = (): MetricTrendIndicator => {
    if (interview.scoreDelta !== null) {
      return {
        key: 'interview',
        direction: interview.scoreDelta > 0 ? 'up' : interview.scoreDelta < 0 ? 'down' : 'stable',
        label: 'Interview Score',
        changeText: `${interview.scoreDelta > 0 ? '+' : ''}${interview.scoreDelta} pts vs previous`,
      };
    }
    if (interview.totalInterviews > 0) {
      return {
        key: 'interview',
        direction: 'stable',
        label: 'Interview Score',
        changeText: `${interview.averageOverallScore}/100 avg`,
      };
    }
    return { key: 'interview', direction: 'none', label: 'Interview Score', changeText: 'No trend available' };
  };

  const getResumeTrend = (): MetricTrendIndicator => {
    if (resume.scoreImprovementDelta !== null && resume.scoreImprovementDelta !== 0) {
      return {
        key: 'resume',
        direction: resume.scoreImprovementDelta > 0 ? 'up' : 'down',
        label: 'Resume ATS',
        changeText: `${resume.scoreImprovementDelta > 0 ? '+' : ''}${resume.scoreImprovementDelta} pts improvement`,
      };
    }
    if (resume.isAssessed) {
      return {
        key: 'resume',
        direction: 'stable',
        label: 'Resume ATS',
        changeText: `${resume.latestAtsScore}/100 ATS`,
      };
    }
    return { key: 'resume', direction: 'none', label: 'Resume ATS', changeText: 'No trend available' };
  };

  return {
    coding: getCodingTrend(),
    placement: getPlacementTrend(),
    interview: getInterviewTrend(),
    resume: getResumeTrend(),
  };
}

// ============================================================================
// 10. UNIFIED CALCULATION ENTRY POINT
// ============================================================================

export function calculateProgressAnalytics(params: {
  studentId?: string;
  timeRange?: AnalyticsTimeRange;
  submissions?: CodingSubmission[];
  placementSessions?: PlacementTestSession[];
  mockInterviews?: MockInterviewReport[];
  resumes?: ResumeVersionItem[];
  latestResumeAnalysis?: { result: ResumeAnalysisResult; targetRole: string; analyzedAt: string } | null;
  roadmapTasks?: DailyRoadmapTask[];
  completedRoadmapIds?: string[];
  studyPlans?: StudyPlanData[];
  dailyStudyTime?: number;
  persistedReadinessHistory?: CareerReadinessTrendPoint[];
}): ProgressAnalyticsData {
  const studentId = params.studentId || 'guest';
  const timeRange = params.timeRange || 'all';

  const coding = computeCodingProgressAnalytics(params.submissions, timeRange, studentId);
  const placement = computePlacementProgressAnalytics(params.placementSessions, timeRange);
  const interview = computeInterviewProgressAnalytics(params.mockInterviews, timeRange);
  const resume = computeResumeProgressAnalytics(params.resumes, params.latestResumeAnalysis);
  const roadmap = computeRoadmapProgressAnalytics(params.roadmapTasks, params.completedRoadmapIds);
  const studyPlanner = computeStudyPlannerProgressAnalytics(params.studyPlans, params.dailyStudyTime);

  // Reconstruct authentic historical readiness timeline points
  const readinessTrend = careerReadinessHistoryService.reconstructHistoricalTrend({
    submissions: params.submissions || [],
    placementSessions: params.placementSessions || [],
    mockInterviews: params.mockInterviews || [],
    resumes: params.resumes || [],
    roadmapTasks: params.roadmapTasks || [],
    completedRoadmapIds: params.completedRoadmapIds || [],
    persistedHistory: params.persistedReadinessHistory || [],
  });

  const weeklyProgress = computeWeeklyProgressSummary({
    submissions: params.submissions,
    placementSessions: params.placementSessions,
    mockInterviews: params.mockInterviews,
    studyPlans: params.studyPlans,
    resumes: params.resumes,
    completedRoadmapIds: params.completedRoadmapIds,
    historicalReadiness: readinessTrend,
  });

  const { provenStrengths, areasToImprove } = computeStrengthsAndWeaknesses({
    coding,
    placement,
    interview,
    resume,
    roadmap,
  });

  const trendIndicators = computeTrendIndicators({
    coding,
    placement,
    interview,
    resume,
    weekly: weeklyProgress,
  });

  const hasEnoughDataForCharts =
    coding.totalSubmissions >= 2 ||
    placement.totalAttempts >= 1 ||
    interview.totalInterviews >= 1 ||
    resume.totalVersions >= 1 ||
    readinessTrend.length >= 1;

  return {
    studentId,
    selectedTimeRange: timeRange,
    hasEnoughDataForCharts,
    readinessTrend,
    coding,
    placement,
    interview,
    resume,
    roadmap,
    studyPlanner,
    weeklyProgress,
    provenStrengths,
    areasToImprove,
    trendIndicators,
    calculatedAt: new Date().toISOString(),
  };
}
