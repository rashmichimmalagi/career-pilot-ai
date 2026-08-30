/**
 * Career Readiness Score Service
 * Deterministic calculation engine for overall student placement readiness across 5 dimensions:
 * 1. Resume ATS & Role Alignment (20%)
 * 2. Coding Problem Solving & Accuracy (25%)
 * 3. Placement / Aptitude Assessments (20%)
 * 4. Technical Mock Interview (20%)
 * 5. Career Roadmap Milestones (15%)
 * 
 * GUARANTEES:
 * - Deterministic, transparent mathematical formula.
 * - Never fabricates fake scores; renders "Not enough data yet" when activity is absent.
 * - Single source of truth across Dashboard, AI Mentor, and Reports.
 */

import {
  CareerReadinessScore,
  ReadinessDimensionKey,
  ReadinessDimensionScore,
  ReadinessStrengthGap,
  ReadinessNextStep,
} from '../types/intelligence';
import { CodingSubmission } from '../types/coding';
import { MockInterviewReport } from '../types/interview';
import { ResumeAnalysisResult, ResumeVersionItem } from '../types/resume';
import { PlacementTestSession, PlacementStudentStats } from '../types/placement';
import { DailyRoadmapTask } from '../types/roadmap';

export const READINESS_DIMENSION_WEIGHTS: Record<ReadinessDimensionKey, number> = {
  resume: 0.20,
  coding: 0.25,
  placement: 0.20,
  interview: 0.20,
  roadmap: 0.15,
};

export function calculateResumeDimension(
  resumes: ResumeVersionItem[] = [],
  latestAnalysis: { result: ResumeAnalysisResult; targetRole: string; analyzedAt: string } | null = null
): ReadinessDimensionScore {
  const safeResumes = resumes || [];
  const weight = READINESS_DIMENSION_WEIGHTS.resume;

  if (!latestAnalysis?.result && safeResumes.length === 0) {
    return {
      key: 'resume',
      label: 'Resume ATS Alignment',
      score: 0,
      weight,
      weightedContribution: 0,
      isAvailable: false,
      statusText: 'No resume analyzed yet',
      dataPointsCount: 0,
      metrics: {
        atsScore: 0,
        versionsCount: 0,
      },
    };
  }

  const rawScore = latestAnalysis?.result?.overall_score ?? (safeResumes[0]?.analysisResult?.ats_score || safeResumes[0]?.analysisResult?.overall_score || 0);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const versionsCount = Math.max(safeResumes.length, latestAnalysis ? 1 : 0);

  return {
    key: 'resume',
    label: 'Resume ATS Alignment',
    score,
    weight,
    weightedContribution: Math.round(score * weight * 10) / 10,
    isAvailable: true,
    statusText: `ATS Score: ${score}/100 • ${versionsCount} ${versionsCount === 1 ? 'version' : 'versions'}`,
    dataPointsCount: versionsCount,
    metrics: {
      atsScore: score,
      targetRole: latestAnalysis?.targetRole || 'Software Engineer',
      versionsCount,
      missingSkillsCount: latestAnalysis?.result?.missing_skills?.length || 0,
    },
  };
}

export function calculateCodingDimension(submissions: CodingSubmission[] = []): ReadinessDimensionScore {
  const safeSubmissions = submissions || [];
  const weight = READINESS_DIMENSION_WEIGHTS.coding;

  if (safeSubmissions.length === 0) {
    return {
      key: 'coding',
      label: 'Coding & DSA',
      score: 0,
      weight,
      weightedContribution: 0,
      isAvailable: false,
      statusText: 'No coding submissions yet',
      dataPointsCount: 0,
      metrics: {
        solved: 0,
        accuracy: 0,
        easy: 0,
        medium: 0,
        hard: 0,
      },
    };
  }

  const acceptedMap = new Map<string, CodingSubmission>();
  let easySolved = 0;
  let mediumSolved = 0;
  let hardSolved = 0;
  const topicsSet = new Set<string>();

  for (const sub of safeSubmissions) {
    if (!sub) continue;
    const isAccepted = sub.status === 'accepted';
    if (isAccepted && !acceptedMap.has(sub.problem_id)) {
      acceptedMap.set(sub.problem_id, sub);
      const diff = (sub.difficulty || sub.problem_data?.difficulty || 'easy').toLowerCase();
      if (diff === 'easy') easySolved++;
      else if (diff === 'medium') mediumSolved++;
      else if (diff === 'hard') hardSolved++;
      else easySolved++;

      const topic = sub.topic || sub.problem_data?.topic;
      if (topic) topicsSet.add(topic);
    }
  }

  const uniqueSolved = acceptedMap.size;
  const totalSubmissions = safeSubmissions.length;
  const accuracy = totalSubmissions > 0 ? Math.round((acceptedMap.size / totalSubmissions) * 100) : 0;

  // Calculation heuristic:
  // Easy: 4 pts (max 24)
  // Medium: 8 pts (max 48)
  // Hard: 14 pts (max 28)
  // Total max points = 100
  const points = Math.min(100, easySolved * 4 + mediumSolved * 8 + hardSolved * 14);
  const topicBonus = topicsSet.size >= 5 ? 1.15 : topicsSet.size >= 3 ? 1.08 : 1.0;
  const rawScore = Math.min(100, Math.round(points * topicBonus));
  const finalScore = uniqueSolved > 0 ? rawScore : 0;

  return {
    key: 'coding',
    label: 'Coding & DSA',
    score: finalScore,
    weight,
    weightedContribution: Math.round(finalScore * weight * 10) / 10,
    isAvailable: uniqueSolved > 0 || totalSubmissions > 0,
    statusText: `${uniqueSolved} solved (${easySolved}E / ${mediumSolved}M / ${hardSolved}H) • ${accuracy}% accuracy`,
    dataPointsCount: totalSubmissions,
    metrics: {
      solved: uniqueSolved,
      totalSubmissions,
      accuracy,
      easy: easySolved,
      medium: mediumSolved,
      hard: hardSolved,
      topicsCount: topicsSet.size,
    },
  };
}

export function calculatePlacementDimension(
  sessions: PlacementTestSession[] = [],
  stats?: PlacementStudentStats | null
): ReadinessDimensionScore {
  const safeSessions = sessions || [];
  const weight = READINESS_DIMENSION_WEIGHTS.placement;

  if (safeSessions.length === 0) {
    return {
      key: 'placement',
      label: 'Placement & Aptitude',
      score: 0,
      weight,
      weightedContribution: 0,
      isAvailable: false,
      statusText: 'No placement assessments completed',
      dataPointsCount: 0,
      metrics: {
        testsCompleted: 0,
        avgAccuracy: 0,
      },
    };
  }

  const scores = safeSessions.map((s) => (s && typeof s.score === 'number' ? s.score : s?.accuracy || 0));
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const totalQuestions = safeSessions.reduce((acc, s) => acc + (s?.totalQuestions || 0), 0);

  // Volume factor: 1 test = 80% weight, 3+ tests = 100% confidence
  const volumeMultiplier = safeSessions.length >= 3 ? 1.0 : safeSessions.length === 2 ? 0.9 : 0.85;
  const finalScore = Math.max(0, Math.min(100, Math.round(avgScore * volumeMultiplier)));

  return {
    key: 'placement',
    label: 'Placement & Aptitude',
    score: finalScore,
    weight,
    weightedContribution: Math.round(finalScore * weight * 10) / 10,
    isAvailable: true,
    statusText: `${safeSessions.length} tests taken • ${avgScore}% avg score`,
    dataPointsCount: safeSessions.length,
    metrics: {
      testsCompleted: safeSessions.length,
      avgScore,
      totalQuestions,
    },
  };
}

export function calculateInterviewDimension(reports: MockInterviewReport[] = []): ReadinessDimensionScore {
  const safeReports = (reports || []).filter(Boolean);
  const weight = READINESS_DIMENSION_WEIGHTS.interview;

  if (safeReports.length === 0) {
    return {
      key: 'interview',
      label: 'Technical Mock Interview',
      score: 0,
      weight,
      weightedContribution: 0,
      isAvailable: false,
      statusText: 'No mock interviews completed',
      dataPointsCount: 0,
      metrics: {
        completedRounds: 0,
        latestScore: 0,
      },
    };
  }

  // Sort descending by date
  const sorted = [...safeReports].sort((a, b) => {
    const tA = new Date(a.completedAt || a.completed_at || 0).getTime();
    const tB = new Date(b.completedAt || b.completed_at || 0).getTime();
    return tB - tA;
  });

  const latest: Partial<MockInterviewReport> = sorted[0] || {};
  const latestScore = latest.overall_score ?? latest.overallScore ?? 0;
  const sumScores = sorted.reduce((acc, r) => acc + (r.overall_score ?? r.overallScore ?? 0), 0);
  const avgScore = sorted.length > 0 ? Math.round(sumScores / sorted.length) : 0;

  // Weighted calculation: 70% latest, 30% historical average
  const calcScore = sorted.length === 1 ? latestScore : Math.round(latestScore * 0.7 + avgScore * 0.3);
  const finalScore = Math.max(0, Math.min(100, calcScore));

  return {
    key: 'interview',
    label: 'Technical Mock Interview',
    score: finalScore,
    weight,
    weightedContribution: Math.round(finalScore * weight * 10) / 10,
    isAvailable: true,
    statusText: `Latest: ${latestScore}/100 • ${sorted.length} ${sorted.length === 1 ? 'round' : 'rounds'} completed`,
    dataPointsCount: sorted.length,
    metrics: {
      completedRounds: sorted.length,
      latestScore,
      avgScore,
      technicalScore: latest.technical_score ?? latest.technicalKnowledgeScore ?? latestScore,
      communicationScore: latest.communication_score ?? latest.communicationScore ?? latestScore,
      problemSolvingScore: latest.problem_solving_score ?? latest.problemSolvingScore ?? latestScore,
    },
  };
}

export function calculateRoadmapDimension(
  tasks: DailyRoadmapTask[] = [],
  completedItemIds: string[] = []
): ReadinessDimensionScore {
  const safeTasks = tasks || [];
  const safeCompletedIds = completedItemIds || [];
  const weight = READINESS_DIMENSION_WEIGHTS.roadmap;

  if (safeTasks.length === 0) {
    return {
      key: 'roadmap',
      label: 'Career Roadmap Progress',
      score: 0,
      weight,
      weightedContribution: 0,
      isAvailable: false,
      statusText: 'Roadmap not initiated',
      dataPointsCount: 0,
      metrics: {
        completedTasks: 0,
        totalTasks: 0,
      },
    };
  }

  const completedCount = safeCompletedIds.length;
  const totalCount = safeTasks.length;
  const completionPercentage = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

  return {
    key: 'roadmap',
    label: 'Career Roadmap Progress',
    score: completionPercentage,
    weight,
    weightedContribution: Math.round(completionPercentage * weight * 10) / 10,
    isAvailable: totalCount > 0,
    statusText: `${completedCount} of ${totalCount} milestones completed (${completionPercentage}%)`,
    dataPointsCount: totalCount,
    metrics: {
      completedTasks: completedCount,
      totalTasks: totalCount,
      completionPercentage,
    },
  };
}

export function getReadinessTier(score: number | null): CareerReadinessScore['statusCategory'] {
  if (score === null) return 'Not Enough Data';
  if (score >= 85) return 'Highly Prepared';
  if (score >= 70) return 'Placement Ready';
  if (score >= 50) return 'Making Progress';
  if (score >= 25) return 'Building Foundations';
  return 'Getting Started';
}

export function determineBiggestStrengthAndGap(
  dimensions: CareerReadinessScore['dimensions']
): {
  biggestStrength: ReadinessStrengthGap | null;
  biggestGap: ReadinessStrengthGap | null;
  recommendedNextStep: ReadinessNextStep;
} {
  const dimList = [
    dimensions.resume,
    dimensions.coding,
    dimensions.placement,
    dimensions.interview,
    dimensions.roadmap,
  ];

  const availableDims = dimList.filter((d) => d.isAvailable);

  let biggestStrength: ReadinessStrengthGap | null = null;
  if (availableDims.length > 0) {
    const highest = [...availableDims].sort((a, b) => b.score - a.score)[0];
    if (highest.score > 30) {
      biggestStrength = {
        title: highest.label,
        dimensionKey: highest.key,
        reason: `Highest performing dimension scoring ${highest.score}/100 (${highest.statusText}).`,
        metricValue: `${highest.score}%`,
      };
    }
  }

  // Determine biggest gap: prioritize completely missing areas first, then lowest numerical score
  const gapCandidate = [...dimList].sort((a, b) => {
    if (!a.isAvailable && b.isAvailable) return -1;
    if (a.isAvailable && !b.isAvailable) return 1;
    return a.score - b.score;
  })[0];

  let biggestGap: ReadinessStrengthGap | null = null;
  let recommendedNextStep: ReadinessNextStep = {
    title: 'Start Coding Practice',
    description: 'Solve your first algorithmic challenge in the Coding Arena.',
    actionRoute: 'coding',
    actionText: 'Go to Coding Arena',
    priority: 'high',
  };

  if (gapCandidate) {
    biggestGap = {
      title: gapCandidate.label,
      dimensionKey: gapCandidate.key,
      reason: gapCandidate.isAvailable
        ? `Lowest scoring dimension at ${gapCandidate.score}/100. Improving this will yield the highest readiness boost.`
        : `No activity recorded yet for ${gapCandidate.label}. Completing your first attempt will immediately increase your readiness.`,
      metricValue: gapCandidate.isAvailable ? `${gapCandidate.score}%` : 'Not Started',
    };

    switch (gapCandidate.key) {
      case 'resume':
        recommendedNextStep = {
          title: 'Analyze Your Resume',
          description: 'Upload your resume to receive instant ATS scoring, keyword extraction, and targeted recommendations.',
          actionRoute: 'resume-analyzer',
          actionText: 'Analyze Resume',
          priority: 'high',
        };
        break;
      case 'coding':
        recommendedNextStep = {
          title: 'Practice Medium DSA Problems',
          description: 'Solve 2-3 algorithmic problems focusing on Arrays, Strings, or Trees to improve your problem-solving benchmark.',
          actionRoute: 'coding',
          actionText: 'Practice Coding',
          priority: 'high',
        };
        break;
      case 'placement':
        recommendedNextStep = {
          title: 'Take a Placement Assessment',
          description: 'Complete a 10-minute quantitative or technical aptitude test to establish your benchmark.',
          actionRoute: 'placement',
          actionText: 'Take Placement Test',
          priority: 'high',
        };
        break;
      case 'interview':
        recommendedNextStep = {
          title: 'Complete a Technical Mock Interview',
          description: 'Practice answering real technical questions verbally with AI feedback on communication and accuracy.',
          actionRoute: 'interview',
          actionText: 'Start Mock Interview',
          priority: 'high',
        };
        break;
      case 'roadmap':
        recommendedNextStep = {
          title: 'Complete Your Next Roadmap Milestone',
          description: 'Advance your structured career milestones to maintain steady preparation momentum.',
          actionRoute: 'roadmap',
          actionText: 'View Roadmap',
          priority: 'medium',
        };
        break;
    }
  }

  return { biggestStrength, biggestGap, recommendedNextStep };
}

export function calculateCareerReadinessScore(params: {
  resumes?: ResumeVersionItem[];
  latestResumeAnalysis?: { result: ResumeAnalysisResult; targetRole: string; analyzedAt: string } | null;
  codingSubmissions?: CodingSubmission[];
  placementSessions?: PlacementTestSession[];
  placementStats?: PlacementStudentStats | null;
  mockInterviews?: MockInterviewReport[];
  roadmapTasks?: DailyRoadmapTask[];
  completedRoadmapIds?: string[];
}): CareerReadinessScore {
  const resumeDim = calculateResumeDimension(params.resumes, params.latestResumeAnalysis);
  const codingDim = calculateCodingDimension(params.codingSubmissions);
  const placementDim = calculatePlacementDimension(params.placementSessions, params.placementStats);
  const interviewDim = calculateInterviewDimension(params.mockInterviews);
  const roadmapDim = calculateRoadmapDimension(params.roadmapTasks, params.completedRoadmapIds);

  const dimensions = {
    resume: resumeDim,
    coding: codingDim,
    placement: placementDim,
    interview: interviewDim,
    roadmap: roadmapDim,
  };

  const availableDims = Object.values(dimensions).filter((d) => d.isAvailable);
  const availableCount = availableDims.length;
  // Minimum Evidence Threshold: Requires at least 2 distinct assessed dimensions to calculate overall score
  const isDataSufficient = availableCount >= 2;

  let overallScore: number | null = null;
  if (isDataSufficient) {
    // Normalization across active dimensions using canonical weights
    const totalWeightedContribution =
      resumeDim.weightedContribution +
      codingDim.weightedContribution +
      placementDim.weightedContribution +
      interviewDim.weightedContribution +
      roadmapDim.weightedContribution;

    const activeWeightsSum = availableDims.reduce((acc, d) => acc + d.weight, 0);
    overallScore = activeWeightsSum > 0
      ? Math.max(0, Math.min(100, Math.round(totalWeightedContribution / activeWeightsSum)))
      : null;
  }

  const statusCategory = getReadinessTier(overallScore);
  const { biggestStrength, biggestGap, recommendedNextStep } = determineBiggestStrengthAndGap(dimensions);

  const formulaExplanation =
    'Readiness Score = (Resume ATS × 20%) + (Coding DSA × 25%) + (Placement Aptitude × 20%) + (Technical Interview × 20%) + (Roadmap Progress × 15%). Requires evidence in at least 2 dimensions.';

  return {
    overallScore,
    statusCategory,
    isDataSufficient,
    availableDimensionsCount: availableCount,
    totalDimensionsCount: 5,
    dimensions,
    biggestStrength,
    biggestGap,
    recommendedNextStep,
    formulaExplanation,
    calculatedAt: new Date().toISOString(),
  };
}
