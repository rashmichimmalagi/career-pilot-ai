import {
  PerformanceAnalyticsSummary,
  PerformanceScoreCategory,
  CodingPerformanceDetails,
  AptitudePerformanceDetails,
  InterviewPerformanceDetails,
  HRInterviewPerformanceDetails,
  ResumePerformanceDetails,
  CompanyPrepPerformanceDetails,
  RoadmapPerformanceDetails,
  ImprovementTrendItem,
} from '../types/analytics';
import { TopicInsightItem, RecentActivityItem } from '../types/preparationDashboard';
import { resumeService } from './resumeService';
import { codingService } from './codingService';
import { getPlacementStats, getPlacementHistory, fetchPlacementHistory } from './placementStorage';
import { interviewStorage } from './interviewStorage';
import { getStudentTargets, getActiveStudentTarget, fetchRemoteStudentTargets } from './companyPrepStorage';
import { getStoredDailyTasks, getCompletedItemIds, fetchRemoteRoadmapData } from './roadmapStorage';
import { calculateStreaks } from './achievementService';
import { calculateProfileCompletion } from './profileService';

export const SCORE_WEIGHTS = {
  resume: 0.20,
  coding: 0.25,
  technicalInterview: 0.20,
  hrInterview: 0.10,
  aptitude: 0.10,
  technicalMcq: 0.10,
  companyPrep: 0.025,
  roadmap: 0.025,
};

export function getScoreCategory(score: number): PerformanceScoreCategory {
  if (score >= 85) return 'Highly Prepared';
  if (score >= 70) return 'Placement Ready';
  if (score >= 50) return 'Making Progress';
  if (score >= 25) return 'Building Foundations';
  return 'Getting Started';
}

export function getScoreDescription(category: PerformanceScoreCategory): string {
  switch (category) {
    case 'Highly Prepared':
      return 'Exceptional multi-dimensional preparation across coding, mock interviews, aptitude, and resume alignment.';
    case 'Placement Ready':
      return 'Strong, well-rounded readiness across core benchmarks. You are well-positioned for placement rounds.';
    case 'Making Progress':
      return 'Solid technical foundation. Focus on medium DSA problems and technical interview communication.';
    case 'Building Foundations':
      return 'Core competencies in development. Complete your mock interview and analyze your resume to boost readiness.';
    case 'Getting Started':
    default:
      return 'Complete more practice activities across modules to calculate your full preparation score.';
  }
}

/**
 * CareerPilot Performance Analytics Engine
 * Single Source of Truth for all student performance and readiness metrics.
 */
export async function getPerformanceAnalyticsSummary(
  studentId: string = 'guest',
  profile?: any
): Promise<PerformanceAnalyticsSummary> {
  const effectiveId = studentId || 'guest';

  // 1. Fetch data in parallel across all modules with independent error isolation
  const [
    latestResumeAnalysisRes,
    resumesListRes,
    codingSubmissionsRes,
    placementStatsRes,
    placementSessionsRes,
    interviewReportsRes,
    companyTargetsRes,
    roadmapDataRes,
  ] = await Promise.allSettled([
    Promise.resolve(resumeService.getLatestAnalysis(effectiveId)),
    Promise.resolve(resumeService.getUserResumes(effectiveId)),
    codingService.getSubmissions(effectiveId),
    Promise.resolve(getPlacementStats(effectiveId)),
    fetchPlacementHistory(effectiveId),
    interviewStorage.fetchReports(effectiveId),
    fetchRemoteStudentTargets(effectiveId),
    fetchRemoteRoadmapData(effectiveId),
  ]);

  // Safely extract results
  const latestResumeAnalysis =
    latestResumeAnalysisRes.status === 'fulfilled' ? latestResumeAnalysisRes.value : null;
  const resumesList =
    resumesListRes.status === 'fulfilled' && Array.isArray(resumesListRes.value)
      ? resumesListRes.value
      : [];
  const codingSubmissions =
    codingSubmissionsRes.status === 'fulfilled' && Array.isArray(codingSubmissionsRes.value)
      ? codingSubmissionsRes.value
      : [];
  const placementStats =
    placementStatsRes.status === 'fulfilled' && placementStatsRes.value
      ? placementStatsRes.value
      : {
          totalQuestionsSolved: 0,
          totalCorrect: 0,
          overallAccuracy: 0,
          aptitudeSolved: 0,
          aptitudeAccuracy: 0,
          technicalSolved: 0,
          technicalAccuracy: 0,
          totalTestsTaken: 0,
        };
  const placementSessions =
    placementSessionsRes.status === 'fulfilled' && Array.isArray(placementSessionsRes.value)
      ? placementSessionsRes.value
      : [];
  const interviewReports =
    interviewReportsRes.status === 'fulfilled' && Array.isArray(interviewReportsRes.value)
      ? interviewReportsRes.value
      : [];
  const companyTargets =
    companyTargetsRes.status === 'fulfilled' && Array.isArray(companyTargetsRes.value)
      ? companyTargetsRes.value
      : getStudentTargets(effectiveId);
  const activeTarget =
    companyTargets.length > 0 ? getActiveStudentTarget(effectiveId) || companyTargets[0] : null;
  
  const roadmapData =
    roadmapDataRes.status === 'fulfilled' && roadmapDataRes.value
      ? roadmapDataRes.value
      : { tasks: getStoredDailyTasks(effectiveId), completedItemIds: getCompletedItemIds(effectiveId) };
  
  const dailyRoadmapTasks = Array.isArray(roadmapData.tasks) ? roadmapData.tasks : [];
  const completedRoadmapItemIds = Array.isArray(roadmapData.completedItemIds) ? roadmapData.completedItemIds : [];

  // Mentor interactions count from localStorage
  let mentorInteractionsCount = 0;
  try {
    const rawChat = localStorage.getItem(`careerpilot_mentor_chat_${effectiveId}`);
    if (rawChat) {
      const parsed = JSON.parse(rawChat);
      if (Array.isArray(parsed)) {
        mentorInteractionsCount = parsed.filter((m: any) => m && m.sender === 'user').length;
      }
    }
  } catch (_) {}

  // Student Identity & Greeting
  const rawName = profile?.full_name || (profile as any)?.name || '';
  const studentName = String(rawName || '').trim() || 'Student';
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 17
      ? 'Good afternoon'
      : 'Good evening';
  const targetRole =
    profile?.target_role ||
    latestResumeAnalysis?.targetRole ||
    'Software Developer';
  const targetCompany =
    activeTarget?.companyName ||
    (companyTargets.length > 0 ? companyTargets[0]?.companyName : undefined) ||
    profile?.target_company ||
    'Top Tech Companies';

  // ----------------------------------------------------
  // Module 1: Coding Arena
  // ----------------------------------------------------
  const totalSubmissions = codingSubmissions.length;
  const acceptedSubmissions = codingSubmissions.filter(
    (sub) =>
      sub &&
      (sub.status?.toLowerCase() === 'accepted' ||
        sub.status_text === 'Accepted' ||
        (sub.test_cases_passed !== undefined &&
          sub.total_test_cases !== undefined &&
          sub.test_cases_passed > 0 &&
          sub.test_cases_passed === sub.total_test_cases))
  );

  const uniqueSolvedProblemMap = new Map<string, any>();
  const codingTopicStats: Record<string, { total: number; passed: number; accuracy: number; uniqueSolved: number }> = {};
  let easySolved = 0;
  let mediumSolved = 0;
  let hardSolved = 0;
  const topicsCoveredSet = new Set<string>();

  codingSubmissions.forEach((sub) => {
    if (!sub) return;
    const isPass =
      sub.status?.toLowerCase() === 'accepted' ||
      sub.status_text === 'Accepted' ||
      (sub.test_cases_passed !== undefined &&
        sub.total_test_cases !== undefined &&
        sub.test_cases_passed > 0 &&
        sub.test_cases_passed === sub.total_test_cases);

    const problemKey = sub.problem_id || sub.problem_title || sub.id;
    const topic = sub.topic || sub.subject || sub.problem_data?.topic || 'DSA';
    if (topic) topicsCoveredSet.add(topic);

    if (!codingTopicStats[topic]) {
      codingTopicStats[topic] = { total: 0, passed: 0, accuracy: 0, uniqueSolved: 0 };
    }
    codingTopicStats[topic].total++;
    if (isPass) {
      codingTopicStats[topic].passed++;
    }

    if (isPass && problemKey && !uniqueSolvedProblemMap.has(problemKey)) {
      uniqueSolvedProblemMap.set(problemKey, sub);
      codingTopicStats[topic].uniqueSolved++;
      const diff = (sub.difficulty || sub.problem_data?.difficulty || 'Medium').toLowerCase();
      if (diff === 'easy') easySolved++;
      else if (diff === 'hard') hardSolved++;
      else mediumSolved++;
    }
  });

  Object.keys(codingTopicStats).forEach((topic) => {
    const st = codingTopicStats[topic];
    st.accuracy = st.total > 0 ? Math.round((st.passed / st.total) * 100) : 0;
  });

  const totalCodingSolved = uniqueSolvedProblemMap.size;
  const codingAccuracy =
    totalSubmissions > 0
      ? Math.round((acceptedSubmissions.length / totalSubmissions) * 100)
      : 0;

  const codingWeakTopics: string[] = [];
  const codingStrongTopics: string[] = [];
  Object.entries(codingTopicStats).forEach(([topic, st]) => {
    if (st.accuracy < 65 && st.total >= 1) {
      codingWeakTopics.push(topic);
    } else if (st.accuracy >= 75 && st.total >= 1) {
      codingStrongTopics.push(topic);
    }
  });

  // Calculate composite coding score (0-100)
  let codingScore: number | null = null;
  if (totalSubmissions > 0) {
    const solvedVolumeFactor = Math.min(100, totalCodingSolved * 10);
    codingScore = Math.max(0, Math.min(100, Math.round(codingAccuracy * 0.6 + solvedVolumeFactor * 0.4)));
  }

  const codingPerformance: CodingPerformanceDetails = {
    hasData: totalSubmissions > 0,
    score: codingScore,
    accuracy: codingAccuracy,
    totalAttempted: totalSubmissions,
    totalSolved: totalCodingSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    topicsCovered: Array.from(topicsCoveredSet),
    weakTopics: codingWeakTopics,
    strongTopics: codingStrongTopics,
    topicBreakdown: codingTopicStats,
  };

  // ----------------------------------------------------
  // Module 2: Aptitude Practice (Quantitative / Logical / Verbal)
  // ----------------------------------------------------
  const isAptitudeSession = (sess: any) => {
    if (!sess) return false;
    const cat = (sess.category || '').toLowerCase();
    const subj = (sess.subject || '').toLowerCase();
    return cat === 'aptitude' || subj.includes('aptitude') || subj.includes('reasoning') || subj.includes('quantitative') || subj.includes('verbal');
  };

  const isTechnicalMcqSession = (sess: any) => {
    if (!sess) return false;
    const cat = (sess.category || '').toLowerCase();
    const subj = (sess.subject || '').toLowerCase();
    return cat === 'technical' || cat === 'core-cs' || subj.includes('dbms') || subj.includes('os') || subj.includes('operating') || subj.includes('network') || subj.includes('oops') || subj.includes('technical');
  };

  const aptitudeSessions = placementSessions.filter(isAptitudeSession);
  const technicalSessions = placementSessions.filter(isTechnicalMcqSession);

  // Aptitude stats aggregation
  const aptitudeTopicStats: Record<string, { total: number; correct: number; accuracy: number }> = {};
  let aptTotalQ = 0;
  let aptCorrectQ = 0;

  aptitudeSessions.forEach((sess) => {
    if (!sess) return;
    const answersList = sess.answers ? Object.values(sess.answers) : [];
    answersList.forEach((ans: any) => {
      if (!ans) return;
      aptTotalQ++;
      if (ans.isCorrect) aptCorrectQ++;
      const topic = ans.topic || ans.subject || sess.subject || 'General Aptitude';
      if (!aptitudeTopicStats[topic]) {
        aptitudeTopicStats[topic] = { total: 0, correct: 0, accuracy: 0 };
      }
      aptitudeTopicStats[topic].total++;
      if (ans.isCorrect) aptitudeTopicStats[topic].correct++;
    });
  });

  Object.keys(aptitudeTopicStats).forEach((topic) => {
    const st = aptitudeTopicStats[topic];
    st.accuracy = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
  });

  const aptAccuracy = aptTotalQ > 0 ? Math.round((aptCorrectQ / aptTotalQ) * 100) : placementStats.aptitudeAccuracy || 0;
  const aptFinalSolved = aptTotalQ > 0 ? aptTotalQ : placementStats.aptitudeSolved;
  const aptFinalCorrect = aptCorrectQ > 0 ? aptCorrectQ : (placementStats.aptitudeSolved > 0 ? Math.round((placementStats.aptitudeSolved * placementStats.aptitudeAccuracy) / 100) : 0);

  const aptitudeWeakTopics: string[] = [];
  const aptitudeStrongTopics: string[] = [];
  Object.entries(aptitudeTopicStats).forEach(([topic, st]) => {
    if (st.accuracy < 65 && st.total >= 2) aptitudeWeakTopics.push(topic);
    else if (st.accuracy >= 75 && st.total >= 2) aptitudeStrongTopics.push(topic);
  });

  const aptitudeHasData = aptFinalSolved > 0 || aptitudeSessions.length > 0;
  const aptitudePerformance: AptitudePerformanceDetails = {
    hasData: aptitudeHasData,
    score: aptitudeHasData ? aptAccuracy : null,
    totalTests: aptitudeSessions.length,
    totalQuestionsSolved: aptFinalSolved,
    totalCorrect: aptFinalCorrect,
    accuracy: aptAccuracy,
    topicBreakdown: aptitudeTopicStats,
    weakTopics: aptitudeWeakTopics,
    strongTopics: aptitudeStrongTopics,
  };

  // ----------------------------------------------------
  // Module 2b: Technical MCQ Practice (Core CS / DBMS / OS)
  // ----------------------------------------------------
  const techMcqTopicStats: Record<string, { total: number; correct: number; accuracy: number }> = {};
  let techTotalQ = 0;
  let techCorrectQ = 0;

  technicalSessions.forEach((sess) => {
    if (!sess) return;
    const answersList = sess.answers ? Object.values(sess.answers) : [];
    answersList.forEach((ans: any) => {
      if (!ans) return;
      techTotalQ++;
      if (ans.isCorrect) techCorrectQ++;
      const topic = ans.topic || ans.subject || sess.subject || 'Core CS';
      if (!techMcqTopicStats[topic]) {
        techMcqTopicStats[topic] = { total: 0, correct: 0, accuracy: 0 };
      }
      techMcqTopicStats[topic].total++;
      if (ans.isCorrect) techMcqTopicStats[topic].correct++;
    });
  });

  Object.keys(techMcqTopicStats).forEach((topic) => {
    const st = techMcqTopicStats[topic];
    st.accuracy = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
  });

  const techAccuracy = techTotalQ > 0 ? Math.round((techCorrectQ / techTotalQ) * 100) : placementStats.technicalAccuracy || 0;
  const techFinalSolved = techTotalQ > 0 ? techTotalQ : placementStats.technicalSolved;
  const techFinalCorrect = techCorrectQ > 0 ? techCorrectQ : (placementStats.technicalSolved > 0 ? Math.round((placementStats.technicalSolved * placementStats.technicalAccuracy) / 100) : 0);

  const techWeakTopics: string[] = [];
  const techStrongTopics: string[] = [];
  Object.entries(techMcqTopicStats).forEach(([topic, st]) => {
    if (st.accuracy < 65 && st.total >= 2) techWeakTopics.push(topic);
    else if (st.accuracy >= 75 && st.total >= 2) techStrongTopics.push(topic);
  });

  const techMcqHasData = techFinalSolved > 0 || technicalSessions.length > 0;
  const technicalMcqPerformance: AptitudePerformanceDetails = {
    hasData: techMcqHasData,
    score: techMcqHasData ? techAccuracy : null,
    totalTests: technicalSessions.length,
    totalQuestionsSolved: techFinalSolved,
    totalCorrect: techFinalCorrect,
    accuracy: techAccuracy,
    topicBreakdown: techMcqTopicStats,
    weakTopics: techWeakTopics,
    strongTopics: techStrongTopics,
  };

  // ----------------------------------------------------
  // Module 3: Technical Interview
  // ----------------------------------------------------
  const technicalReports = interviewReports.filter(
    (r) =>
      r &&
      !r.subject?.toLowerCase().includes('hr') &&
      !r.topic?.toLowerCase().includes('hr') &&
      !r.topic?.toLowerCase().includes('behavioral')
  );

  let techLatestScore: number | null = null;
  let techAvgScore: number | null = null;
  let techKnowledgeScore: number | null = null;
  let techProblemSolvingScore: number | null = null;
  let techCommScore: number | null = null;
  const techWeakAreas: string[] = [];
  const techStrongAreas: string[] = [];

  if (technicalReports.length > 0) {
    const sortedTech = [...technicalReports].sort((a, b) => {
      const timeA = new Date(a.completedAt || a.completed_at || 0).getTime();
      const timeB = new Date(b.completedAt || b.completed_at || 0).getTime();
      return timeB - timeA;
    });
    const latest = sortedTech[0];
    techLatestScore = latest.overall_score !== undefined ? latest.overall_score : (latest.overallScore || 0);
    techKnowledgeScore = latest.technical_score !== undefined ? latest.technical_score : (latest.technicalKnowledgeScore || techLatestScore);
    techProblemSolvingScore = latest.problem_solving_score !== undefined ? latest.problem_solving_score : (latest.problemSolvingScore || techLatestScore);
    techCommScore = latest.communication_score !== undefined ? latest.communication_score : (latest.communicationScore || techLatestScore);

    const totalSum = sortedTech.reduce(
      (acc, cur) => acc + (cur.overall_score !== undefined ? cur.overall_score : (cur.overallScore || 0)),
      0
    );
    techAvgScore = Math.round(totalSum / sortedTech.length);

    sortedTech.forEach((rep) => {
      const areas = rep.areas_to_improve || rep.areasForImprovement || [];
      areas.forEach((a: string) => {
        if (a && !techWeakAreas.includes(a)) techWeakAreas.push(a);
      });
      const str = rep.strengths || [];
      str.forEach((s: string) => {
        if (s && !techStrongAreas.includes(s)) techStrongAreas.push(s);
      });
    });
  }

  const technicalInterviewPerformance: InterviewPerformanceDetails = {
    hasData: technicalReports.length > 0,
    score: techAvgScore,
    totalInterviews: technicalReports.length,
    latestScore: techLatestScore,
    averageScore: techAvgScore,
    technicalKnowledgeScore: techKnowledgeScore,
    problemSolvingScore: techProblemSolvingScore,
    communicationScore: techCommScore,
    weakAreas: techWeakAreas,
    strongAreas: techStrongAreas,
    latestCompletedAt: technicalReports[0]?.completedAt || technicalReports[0]?.completed_at,
    latestSubject: technicalReports[0]?.subject,
    latestTopic: technicalReports[0]?.topic,
  };

  // ----------------------------------------------------
  // Module 4: HR Interview
  // ----------------------------------------------------
  const hrReports = interviewReports.filter(
    (r) =>
      r &&
      (r.subject?.toLowerCase().includes('hr') ||
        r.topic?.toLowerCase().includes('hr') ||
        r.topic?.toLowerCase().includes('behavioral'))
  );

  let hrLatestScore: number | null = null;
  let hrAvgScore: number | null = null;
  let hrBehavioralScore: number | null = null;
  let hrCommScore: number | null = null;
  const hrWeakAreas: string[] = [];
  const hrStrongAreas: string[] = [];

  if (hrReports.length > 0) {
    const sortedHR = [...hrReports].sort((a, b) => {
      const timeA = new Date(a.completedAt || a.completed_at || 0).getTime();
      const timeB = new Date(b.completedAt || b.completed_at || 0).getTime();
      return timeB - timeA;
    });
    const latest = sortedHR[0];
    hrLatestScore = latest.overall_score !== undefined ? latest.overall_score : (latest.overallScore || 0);
    hrBehavioralScore = (latest as any).behavioral_score !== undefined ? (latest as any).behavioral_score : (latest.technicalKnowledgeScore || hrLatestScore);
    hrCommScore = latest.communication_score !== undefined ? latest.communication_score : (latest.communicationScore || hrLatestScore);

    const totalSum = sortedHR.reduce(
      (acc, cur) => acc + (cur.overall_score !== undefined ? cur.overall_score : (cur.overallScore || 0)),
      0
    );
    hrAvgScore = Math.round(totalSum / sortedHR.length);

    sortedHR.forEach((rep) => {
      const areas = rep.areas_to_improve || rep.areasForImprovement || [];
      areas.forEach((a: string) => {
        if (a && !hrWeakAreas.includes(a)) hrWeakAreas.push(a);
      });
      const str = rep.strengths || [];
      str.forEach((s: string) => {
        if (s && !hrStrongAreas.includes(s)) hrStrongAreas.push(s);
      });
    });
  }

  const hrInterviewPerformance: HRInterviewPerformanceDetails = {
    hasData: hrReports.length > 0,
    score: hrAvgScore,
    totalInterviews: hrReports.length,
    latestScore: hrLatestScore,
    averageScore: hrAvgScore,
    behavioralScore: hrBehavioralScore,
    communicationScore: hrCommScore,
    weakAreas: hrWeakAreas,
    strongAreas: hrStrongAreas,
    latestCompletedAt: hrReports[0]?.completedAt || hrReports[0]?.completed_at,
  };

  // ----------------------------------------------------
  // Module 5: Resume Analyzer
  // ----------------------------------------------------
  const hasResumeAnalysis =
    !!latestResumeAnalysis &&
    !!latestResumeAnalysis.result &&
    typeof latestResumeAnalysis.result.overall_score === 'number';

  const resumeScore = hasResumeAnalysis
    ? Math.max(0, Math.min(100, Math.round(latestResumeAnalysis.result.overall_score)))
    : null;
  const resumeAtsScore = hasResumeAnalysis
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            latestResumeAnalysis.result.ats_score !== undefined
              ? latestResumeAnalysis.result.ats_score
              : (resumeScore || 0)
          )
        )
      )
    : null;
  const resumeRoleMatchScore = hasResumeAnalysis
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            latestResumeAnalysis.result.role_match_score !== undefined
              ? latestResumeAnalysis.result.role_match_score
              : (resumeScore || 0)
          )
        )
      )
    : null;

  const resumePerformance: ResumePerformanceDetails = {
    isAnalyzed: hasResumeAnalysis,
    overallScore: resumeScore,
    atsScore: resumeAtsScore,
    roleMatchScore: resumeRoleMatchScore,
    targetRole: latestResumeAnalysis?.targetRole || targetRole,
    analyzedAt: latestResumeAnalysis?.analyzedAt,
    strengths: hasResumeAnalysis ? (latestResumeAnalysis?.result?.strengths || []) : [],
    missingSkills: hasResumeAnalysis ? (latestResumeAnalysis?.result?.missing_skills || []) : [],
    improvementSuggestions: hasResumeAnalysis ? (latestResumeAnalysis?.result?.improvement_suggestions || []) : [],
  };

  // ----------------------------------------------------
  // Module 6: Company Preparation
  // ----------------------------------------------------
  const totalCompanyTargets = companyTargets.length;
  const hasCompanyData = totalCompanyTargets > 0;
  const activeCompanyTarget = activeTarget || (companyTargets.length > 0 ? companyTargets[0] : null);

  const companyPrepPerformance: CompanyPrepPerformanceDetails = {
    hasData: hasCompanyData,
    totalTargets: totalCompanyTargets,
    activeTargetCompany: activeCompanyTarget?.companyName,
    targetRole: activeCompanyTarget?.targetRole || targetRole,
    progressPercentage: hasCompanyData
      ? (activeCompanyTarget as any)?.preparationProgress || (activeCompanyTarget as any)?.match_score || 50
      : null,
    matchScore: hasCompanyData ? (activeCompanyTarget as any)?.match_score || 70 : null,
  };

  // ----------------------------------------------------
  // Module 7: Roadmap Progress
  // ----------------------------------------------------
  const roadmapTasks = dailyRoadmapTasks || [];
  const completedTasksCount = roadmapTasks.filter((t) => t.completed).length;
  const completedMilestoneCount = (completedRoadmapItemIds || []).length;
  const totalRoadmapActivities = roadmapTasks.length + completedMilestoneCount;
  const hasRoadmapData = totalRoadmapActivities > 0;
  const roadmapProgressPercent =
    roadmapTasks.length > 0
      ? Math.round((completedTasksCount / roadmapTasks.length) * 100)
      : completedMilestoneCount > 0
      ? Math.min(100, completedMilestoneCount * 20)
      : null;

  const roadmapPerformance: RoadmapPerformanceDetails = {
    hasData: hasRoadmapData,
    completedTasksCount,
    totalTasksCount: roadmapTasks.length,
    completedMilestonesCount: completedMilestoneCount,
    progressPercentage: roadmapProgressPercent,
  };

  // ----------------------------------------------------
  // Streaks and Profile Completion
  // ----------------------------------------------------
  let currentStreak = 0;
  let longestStreak = 0;
  try {
    const streaks = calculateStreaks(codingSubmissions, effectiveId);
    currentStreak = streaks.currentStreak || 0;
    longestStreak = streaks.longestStreak || 0;
  } catch (_) {}
  const streakDays = Math.max(currentStreak, longestStreak);
  const profileCompletion = calculateProfileCompletion(profile);

  // Total Activities
  const totalActivitiesCount =
    (hasResumeAnalysis ? (resumesList.length || 1) : 0) +
    totalSubmissions +
    placementStats.totalQuestionsSolved +
    interviewReports.length +
    totalCompanyTargets +
    completedTasksCount +
    completedMilestoneCount +
    mentorInteractionsCount;

  // ----------------------------------------------------
  // CANONICAL OVERALL PREPARATION SCORE (0-100)
  // Single deterministic value across the entire application.
  // ----------------------------------------------------
  const hasAnyActivity =
    hasResumeAnalysis ||
    totalSubmissions > 0 ||
    aptitudeHasData ||
    techMcqHasData ||
    interviewReports.length > 0 ||
    hasCompanyData ||
    hasRoadmapData;

  let overallScore: number | null = null;
  let overallScoreCategory: PerformanceScoreCategory = 'Getting Started';
  let overallScoreDescription = 'Complete more practice activities across modules to calculate your preparation score.';

  if (hasAnyActivity) {
    let weightedScoreSum = 0;
    let activeWeightSum = 0;

    // 1. Resume (20%)
    if (hasResumeAnalysis && resumeScore !== null) {
      weightedScoreSum += resumeScore * SCORE_WEIGHTS.resume;
      activeWeightSum += SCORE_WEIGHTS.resume;
    }

    // 2. Coding Arena (25%)
    if (totalSubmissions > 0 && codingScore !== null) {
      weightedScoreSum += codingScore * SCORE_WEIGHTS.coding;
      activeWeightSum += SCORE_WEIGHTS.coding;
    }

    // 3. Technical Interview (20%)
    if (technicalReports.length > 0 && techAvgScore !== null) {
      weightedScoreSum += techAvgScore * SCORE_WEIGHTS.technicalInterview;
      activeWeightSum += SCORE_WEIGHTS.technicalInterview;
    }

    // 4. HR Interview (10%)
    if (hrReports.length > 0 && hrAvgScore !== null) {
      weightedScoreSum += hrAvgScore * SCORE_WEIGHTS.hrInterview;
      activeWeightSum += SCORE_WEIGHTS.hrInterview;
    }

    // 5. Aptitude (10%)
    if (aptitudeHasData && aptitudePerformance.score !== null) {
      weightedScoreSum += aptitudePerformance.score * SCORE_WEIGHTS.aptitude;
      activeWeightSum += SCORE_WEIGHTS.aptitude;
    }

    // 5b. Technical MCQs (10%)
    if (techMcqHasData && technicalMcqPerformance.score !== null) {
      weightedScoreSum += technicalMcqPerformance.score * SCORE_WEIGHTS.technicalMcq;
      activeWeightSum += SCORE_WEIGHTS.technicalMcq;
    }

    // 6. Company Preparation (2.5%)
    if (hasCompanyData && companyPrepPerformance.progressPercentage !== null) {
      weightedScoreSum += companyPrepPerformance.progressPercentage * SCORE_WEIGHTS.companyPrep;
      activeWeightSum += SCORE_WEIGHTS.companyPrep;
    }

    // 7. Roadmap (2.5%)
    if (hasRoadmapData && roadmapProgressPercent !== null) {
      weightedScoreSum += roadmapProgressPercent * SCORE_WEIGHTS.roadmap;
      activeWeightSum += SCORE_WEIGHTS.roadmap;
    }

    if (activeWeightSum > 0) {
      overallScore = Math.max(0, Math.min(100, Math.round(weightedScoreSum / activeWeightSum)));
      overallScoreCategory = getScoreCategory(overallScore);
      overallScoreDescription = getScoreDescription(overallScoreCategory);
    }
  }

  // ----------------------------------------------------
  // Weak and Strong Areas Aggregator
  // ----------------------------------------------------
  const weakAreas: TopicInsightItem[] = [];
  const strongAreas: TopicInsightItem[] = [];

  // Coding Weak/Strong
  Object.entries(codingTopicStats).forEach(([topic, st]) => {
    const formattedTopic = topic.startsWith('DSA —') || topic.startsWith('DBMS —') ? topic : `DSA — ${topic}`;
    if (st.accuracy < 65 && st.total >= 1) {
      weakAreas.push({
        topic: formattedTopic,
        category: 'DSA',
        score: st.accuracy,
        totalAttempts: st.total,
        actionRoute: 'coding',
        actionLabel: 'Practice Topic',
      });
    } else if (st.accuracy >= 75 && st.total >= 1) {
      strongAreas.push({
        topic: formattedTopic,
        category: 'DSA',
        score: st.accuracy,
        totalAttempts: st.total,
        actionRoute: 'coding',
        actionLabel: 'Solve Advanced',
      });
    }
  });

  // Aptitude Weak/Strong
  Object.entries(aptitudeTopicStats).forEach(([topic, st]) => {
    const formattedTopic = topic.startsWith('Aptitude —') ? topic : `Aptitude — ${topic}`;
    if (st.accuracy < 65 && st.total >= 2) {
      if (!weakAreas.some((w) => w.topic.toLowerCase() === formattedTopic.toLowerCase())) {
        weakAreas.push({
          topic: formattedTopic,
          category: 'Aptitude',
          score: st.accuracy,
          totalAttempts: st.total,
          actionRoute: 'placement',
          actionLabel: 'Attempt Set',
        });
      }
    } else if (st.accuracy >= 75 && st.total >= 2) {
      if (!strongAreas.some((s) => s.topic.toLowerCase() === formattedTopic.toLowerCase())) {
        strongAreas.push({
          topic: formattedTopic,
          category: 'Aptitude',
          score: st.accuracy,
          totalAttempts: st.total,
          actionRoute: 'placement',
          actionLabel: 'Maintain Streak',
        });
      }
    }
  });

  // Technical MCQ Weak/Strong
  Object.entries(techMcqTopicStats).forEach(([topic, st]) => {
    const formattedTopic = topic.startsWith('Technical —') || topic.startsWith('DBMS —') || topic.startsWith('Core CS —') ? topic : `Technical — ${topic}`;
    if (st.accuracy < 65 && st.total >= 2) {
      if (!weakAreas.some((w) => w.topic.toLowerCase() === formattedTopic.toLowerCase())) {
        weakAreas.push({
          topic: formattedTopic,
          category: 'Technical',
          score: st.accuracy,
          totalAttempts: st.total,
          actionRoute: 'placement',
          actionLabel: 'Practice MCQs',
        });
      }
    } else if (st.accuracy >= 75 && st.total >= 2) {
      if (!strongAreas.some((s) => s.topic.toLowerCase() === formattedTopic.toLowerCase())) {
        strongAreas.push({
          topic: formattedTopic,
          category: 'Technical',
          score: st.accuracy,
          totalAttempts: st.total,
          actionRoute: 'placement',
          actionLabel: 'Maintain Mastery',
        });
      }
    }
  });

  // Interview Weak/Strong
  interviewReports.forEach((rep) => {
    const areas = rep.areas_to_improve || rep.areasForImprovement || [];
    areas.slice(0, 2).forEach((areaText: string) => {
      if (areaText && areaText.length < 50 && !weakAreas.some((w) => w.topic.toLowerCase().includes(areaText.toLowerCase()))) {
        weakAreas.push({
          topic: `Interview — ${areaText}`,
          category: 'Interview',
          score: rep.overall_score || rep.overallScore || 50,
          totalAttempts: 1,
          actionRoute: 'interview',
          actionLabel: 'Retake Interview',
        });
      }
    });

    const score = rep.overall_score || rep.overallScore || 0;
    if (score >= 75 && rep.topic) {
      const formattedTopic = `Interview — ${rep.topic}`;
      if (!strongAreas.some((s) => s.topic.toLowerCase() === formattedTopic.toLowerCase())) {
        strongAreas.push({
          topic: formattedTopic,
          category: 'Interview',
          score,
          totalAttempts: 1,
          actionRoute: 'interview',
          actionLabel: 'Mock Review',
        });
      }
    }
  });

  // Resume ATS Strong/Weak
  if (hasResumeAnalysis && resumeAtsScore !== null) {
    if (resumeAtsScore >= 75) {
      strongAreas.push({
        topic: 'Resume — ATS Alignment',
        category: 'Resume',
        score: resumeAtsScore,
        totalAttempts: 1,
        actionRoute: 'resume-analyzer',
        actionLabel: 'View ATS',
      });
    } else if (resumeAtsScore < 65) {
      weakAreas.push({
        topic: 'Resume — ATS Keywords & Formatting',
        category: 'Resume',
        score: resumeAtsScore,
        totalAttempts: 1,
        actionRoute: 'resume-analyzer',
        actionLabel: 'Optimize Resume',
      });
    }
  }

  weakAreas.sort((a, b) => a.score - b.score);
  strongAreas.sort((a, b) => b.score - a.score);

  // ----------------------------------------------------
  // Improvement Trends
  // ----------------------------------------------------
  const improvementTrends: ImprovementTrendItem[] = [];

  // Coding Trend
  if (codingSubmissions.length >= 3) {
    const recentSubmissions = codingSubmissions.slice(0, 5);
    const olderSubmissions = codingSubmissions.slice(5);

    const recentPassed = recentSubmissions.filter((s) => s.status === 'accepted').length;
    const recentAcc = Math.round((recentPassed / recentSubmissions.length) * 100);

    if (olderSubmissions.length >= 2) {
      const olderPassed = olderSubmissions.filter((s) => s.status === 'accepted').length;
      const olderAcc = Math.round((olderPassed / olderSubmissions.length) * 100);
      const diff = recentAcc - olderAcc;

      improvementTrends.push({
        topic: 'Algorithmic Problem Solving',
        category: 'DSA',
        trend: diff >= 10 ? 'improving' : diff <= -10 ? 'declining' : 'stable',
        changeDescription:
          diff >= 10
            ? `Accuracy increased by +${diff}% over recent submissions.`
            : diff <= -10
            ? `Accuracy dipped by ${diff}% on recent harder problems.`
            : `Consistent ${recentAcc}% accuracy across recent problems.`,
        currentScore: recentAcc,
        previousScore: olderAcc,
      });
    } else {
      improvementTrends.push({
        topic: 'Algorithmic Problem Solving',
        category: 'DSA',
        trend: recentAcc >= 70 ? 'improving' : 'stable',
        changeDescription: `${recentAcc}% accuracy across first ${recentSubmissions.length} submissions.`,
        currentScore: recentAcc,
      });
    }
  }

  // Aptitude Trend
  if (placementSessions.length >= 2) {
    const latestTest = placementSessions[0];
    const prevTests = placementSessions.slice(1);
    const prevAvg = Math.round(
      prevTests.reduce((acc, cur) => acc + (cur.score || 0), 0) / prevTests.length
    );
    const diff = (latestTest.score || 0) - prevAvg;

    improvementTrends.push({
      topic: 'Timed Aptitude Assessments',
      category: 'Aptitude',
      trend: diff >= 10 ? 'improving' : diff <= -10 ? 'declining' : 'stable',
      changeDescription:
        diff >= 10
          ? `Latest test score improved by +${diff}% against previous sessions.`
          : diff <= -10
          ? `Latest test was ${Math.abs(diff)}% below average.`
          : `Stable performance across ${placementSessions.length} assessments.`,
      currentScore: latestTest.score || 0,
      previousScore: prevAvg,
    });
  }

  // Consistency Trend
  if (currentStreak >= 3) {
    improvementTrends.push({
      topic: 'Practice Consistency',
      category: 'Consistency',
      trend: 'improving',
      changeDescription: `Active daily practice streak: ${currentStreak} consecutive days.`,
      currentScore: Math.min(100, currentStreak * 20),
    });
  }

  // ----------------------------------------------------
  // Recent Activities
  // ----------------------------------------------------
  const recentActivities: RecentActivityItem[] = [];

  codingSubmissions.forEach((sub) => {
    const isPass =
      sub.status?.toLowerCase() === 'accepted' ||
      sub.status_text === 'Accepted' ||
      (sub.test_cases_passed !== undefined &&
        sub.total_test_cases !== undefined &&
        sub.test_cases_passed > 0 &&
        sub.test_cases_passed === sub.total_test_cases);

    recentActivities.push({
      id: `act-code-${sub.id}`,
      type: 'coding',
      title: `Coding: ${sub.problem_title || 'DSA Problem'}`,
      description: `${sub.difficulty || 'Medium'} • ${sub.language || 'Code'} • ${
        isPass
          ? 'All test cases passed'
          : `${sub.test_cases_passed || 0}/${sub.total_test_cases || 0} test cases`
      }`,
      timestamp: sub.created_at || new Date().toISOString(),
      score: isPass ? 100 : (sub.score || 0),
      scoreLabel: isPass ? 'Accepted' : 'Failed',
      statusBadge: {
        text: isPass ? 'Accepted' : 'Wrong Answer',
        type: isPass ? 'success' : 'danger',
      },
      route: 'coding',
    });
  });

  placementSessions.forEach((sess) => {
    recentActivities.push({
      id: `act-place-${sess.id}`,
      type: 'aptitude',
      title: `${sess.category || 'Aptitude'} Test: ${sess.subject || sess.topic || 'Assessment'}`,
      description: `${sess.correctCount}/${sess.totalQuestions} questions correct (${sess.score}% score)`,
      timestamp: sess.completedAt || new Date().toISOString(),
      score: sess.score,
      scoreLabel: `${sess.score}%`,
      statusBadge: {
        text: sess.score >= 70 ? 'Passed' : 'Completed',
        type: sess.score >= 70 ? 'success' : 'warning',
      },
      route: 'placement',
    });
  });

  interviewReports.forEach((rep) => {
    const isHr =
      rep.subject?.toLowerCase().includes('hr') ||
      rep.topic?.toLowerCase().includes('hr') ||
      rep.topic?.toLowerCase().includes('behavioral');
    const score = rep.overall_score || rep.overallScore || 0;

    recentActivities.push({
      id: `act-interview-${rep.id}`,
      type: isHr ? 'hr-interview' : 'interview',
      title: `${isHr ? 'HR' : 'Technical'} Interview: ${rep.topic || 'Mock Round'}`,
      description: `Evaluated ${rep.answered_count || rep.questionsAnswered || rep.question_count || 0} questions answered`,
      timestamp: rep.completed_at || rep.completedAt || new Date().toISOString(),
      score,
      scoreLabel: `${score}/100`,
      statusBadge: {
        text: score >= 70 ? 'Strong' : 'Reviewed',
        type: score >= 70 ? 'success' : 'info',
      },
      route: 'interview',
    });
  });

  if (latestResumeAnalysis && latestResumeAnalysis.analyzedAt) {
    recentActivities.push({
      id: 'act-resume-latest',
      type: 'resume',
      title: 'Resume ATS Analysis',
      description: `Targeting ${latestResumeAnalysis.targetRole || 'Software Role'} • ATS Score ${resumeAtsScore}/100`,
      timestamp: latestResumeAnalysis.analyzedAt,
      score: resumeScore || undefined,
      scoreLabel: `${resumeScore}%`,
      statusBadge: {
        text: (resumeAtsScore || 0) >= 70 ? 'ATS Ready' : 'Needs Optimization',
        type: (resumeAtsScore || 0) >= 70 ? 'success' : 'warning',
      },
      route: 'resume-analyzer',
    });
  }

  recentActivities.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });

  return {
    studentId: effectiveId,
    studentName,
    greeting,
    targetRole,
    targetCompany,
    calculatedAt: new Date().toISOString(),

    overallScore,
    overallScoreCategory,
    overallScoreDescription,
    hasEnoughDataForOverallScore: overallScore !== null,

    totalActivitiesCount,
    streakDays,
    currentStreak,
    longestStreak,
    profileCompletion,

    coding: codingPerformance,
    aptitude: aptitudePerformance,
    technicalMcq: technicalMcqPerformance,
    technicalInterview: technicalInterviewPerformance,
    hrInterview: hrInterviewPerformance,
    resume: resumePerformance,
    companyPrep: companyPrepPerformance,
    roadmap: roadmapPerformance,

    weakAreas,
    strongAreas,
    improvementTrends,
    recentActivities,
  };
}
