import {
  PlacementReadinessReport,
  ReadinessStatusCategory,
  ReadinessComponentKey,
  ResumeReadinessDetails,
  CodingReadinessDetails,
  InterviewReadinessDetails,
  ConsistencyReadinessDetails,
  ReadinessRecommendation,
} from '../types/readiness';
import { CodingSubmission } from '../types/coding';
import { MockInterviewReport } from '../types/interview';
import { ResumeAnalysisResult } from '../types/resume';
import { codingService } from './codingService';
import { interviewStorage } from './interviewStorage';
import { resumeService } from './resumeService';
import { calculateStreaks, getLocalDayString } from './achievementService';
import { getPerformanceAnalyticsSummary, SCORE_WEIGHTS } from './analyticsEngine';

export const READINESS_WEIGHTS = {
  resume: 0.20,
  coding: 0.25,
  technicalInterview: 0.20,
  hrInterview: 0.10,
  aptitude: 0.15,
  consistency: 0.10,
};

/**
 * Determine status category based on deterministic score bounds (0-100)
 * 0–24: Getting Started
 * 25–49: Building Foundations
 * 50–69: Making Progress
 * 70–84: Placement Ready
 * 85–100: Highly Prepared
 */
export function getReadinessStatusCategory(score: number): ReadinessStatusCategory {
  if (score >= 85) return 'Highly Prepared';
  if (score >= 70) return 'Placement Ready';
  if (score >= 50) return 'Making Progress';
  if (score >= 25) return 'Building Foundations';
  return 'Getting Started';
}

/**
 * Get status color scheme for UI badges and cards
 */
export function getReadinessStatusBadgeColor(category: ReadinessStatusCategory) {
  switch (category) {
    case 'Highly Prepared':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-500/30',
        ring: 'ring-amber-500/40',
      };
    case 'Placement Ready':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-500/30',
        ring: 'ring-emerald-500/40',
      };
    case 'Making Progress':
      return {
        bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-500/30',
        ring: 'ring-indigo-500/40',
      };
    case 'Building Foundations':
      return {
        bg: 'bg-sky-500/10 dark:bg-sky-500/20',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-500/30',
        ring: 'ring-sky-500/40',
      };
    case 'Getting Started':
    default:
      return {
        bg: 'bg-slate-500/10 dark:bg-slate-500/20',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-500/30',
        ring: 'ring-slate-500/40',
      };
  }
}

/**
 * Get status description
 */
export function getReadinessStatusDescription(category: ReadinessStatusCategory): string {
  switch (category) {
    case 'Highly Prepared':
      return 'Exceptional multi-dimensional preparation across ATS resume alignment, problem solving, and mock interviews.';
    case 'Placement Ready':
      return 'Strong, well-rounded readiness across resume benchmarks, coding challenges, and mock technical evaluation.';
    case 'Making Progress':
      return 'Solid technical foundation. Focus on medium-to-hard coding problems and mock interview communication.';
    case 'Building Foundations':
      return 'Core competencies in development. Complete your mock interview and analyze your resume to boost readiness.';
    case 'Getting Started':
    default:
      return 'Start building your placement profile by solving coding problems, analyzing your resume, and taking mock interviews.';
  }
}

/**
 * 1. Calculate Resume Score (25% Weight)
 */
export function calculateResumeScore(
  analysisData: { result: ResumeAnalysisResult; targetRole: string; analyzedAt: string } | null
): ResumeReadinessDetails {
  const weight = READINESS_WEIGHTS.resume;

  if (!analysisData || !analysisData.result || typeof analysisData.result.overall_score !== 'number') {
    return {
      isAvailable: false,
      score: 0,
      weight,
      weightedContribution: 0,
      atsScore: 0,
      roleMatchScore: 0,
      overallResumeScore: 0,
      summary: 'Resume analysis not completed',
    };
  }

  const { result, targetRole, analyzedAt } = analysisData;
  const overallResumeScore = Math.max(0, Math.min(100, Math.round(result.overall_score)));
  const atsScore = Math.max(0, Math.min(100, Math.round(result.ats_score !== undefined ? result.ats_score : overallResumeScore)));
  const roleMatchScore = Math.max(0, Math.min(100, Math.round(result.role_match_score !== undefined ? result.role_match_score : overallResumeScore)));

  // The placement readiness resume score directly reflects the analyzed overall score of the current resume
  const finalScore = overallResumeScore;

  return {
    isAvailable: true,
    score: finalScore,
    weight,
    weightedContribution: Math.round(finalScore * weight * 10) / 10,
    atsScore,
    roleMatchScore,
    overallResumeScore,
    targetRole,
    analyzedAt,
    strengths: result.strengths?.slice(0, 3),
    missingSkills: result.missing_skills?.slice(0, 4),
    summary: `ATS: ${atsScore}/100 • Role Match: ${roleMatchScore}/100`,
  };
}

/**
 * 2. Calculate Coding Score (30% Weight)
 * - Evaluates Unique Accepted problems (not raw spam submissions)
 * - Easy / Medium / Hard distribution
 * - Success rate (accuracy)
 * - Topic coverage
 */
export function calculateCodingScore(submissions: CodingSubmission[]): CodingReadinessDetails {
  const weight = READINESS_WEIGHTS.coding;

  if (!submissions || submissions.length === 0) {
    return {
      isAvailable: false,
      score: 0,
      weight,
      weightedContribution: 0,
      uniqueAcceptedProblems: 0,
      totalSubmissions: 0,
      accuracyRate: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      topicsCovered: [],
      weakTopics: ['Arrays', 'Strings', 'Trees', 'Graphs', 'Dynamic Programming'],
      subjectBreakdown: {},
      summary: 'No coding activity yet',
    };
  }

  // Filter accepted submissions and deduplicate by problem_id
  const acceptedMap = new Map<string, CodingSubmission>();
  const totalSubmissions = submissions.length;
  let acceptedSubmissionsCount = 0;
  const topicsSet = new Set<string>();
  const subjectBreakdown: Record<string, number> = {};

  let easySolved = 0;
  let mediumSolved = 0;
  let hardSolved = 0;

  for (const s of submissions) {
    const totalTC = typeof s.total_test_cases === 'number' && s.total_test_cases > 0 ? s.total_test_cases : 5;
    const passedTC = typeof s.test_cases_passed === 'number' ? s.test_cases_passed : (s.status === 'accepted' ? totalTC : 0);
    const isAccepted = s.status === 'accepted' && passedTC === totalTC && totalTC > 0;

    if (isAccepted) {
      acceptedSubmissionsCount++;
      if (!acceptedMap.has(s.problem_id)) {
        acceptedMap.set(s.problem_id, s);

        const diff = (s.difficulty || s.problem_data?.difficulty || 'Easy').toLowerCase();
        if (diff === 'easy') easySolved++;
        else if (diff === 'medium') mediumSolved++;
        else if (diff === 'hard') hardSolved++;
        else easySolved++;

        const topic = s.topic || s.problem_data?.topic;
        if (topic) topicsSet.add(topic);

        const subject = s.subject || s.problem_data?.subject || 'DSA';
        subjectBreakdown[subject] = (subjectBreakdown[subject] || 0) + 1;
      }
    }
  }

  const uniqueAcceptedProblems = acceptedMap.size;
  const accuracyRate = totalSubmissions > 0
    ? Math.round((acceptedSubmissionsCount / totalSubmissions) * 100)
    : 0;

  // Points breakdown:
  // Easy: 4 pts each (max 24 pts for 6 problems)
  // Medium: 8 pts each (max 48 pts for 6 problems)
  // Hard: 14 pts each (max 28 pts for 2 problems)
  const problemPoints = Math.min(
    100,
    easySolved * 4 + mediumSolved * 8 + hardSolved * 14
  );

  // Topic breadth multiplier (up to 15% bonus for solving across 3+ topics)
  const topicCount = topicsSet.size;
  const topicMultiplier = topicCount >= 5 ? 1.15 : topicCount >= 3 ? 1.08 : 1.0;

  // Accuracy penalty if excessive spamming (e.g. < 20% accuracy)
  const accuracyMultiplier =
    totalSubmissions <= 3
      ? 1.0
      : accuracyRate >= 50
      ? 1.0
      : Math.max(0.65, 0.65 + (accuracyRate / 50) * 0.35);

  let rawScore = problemPoints * topicMultiplier * accuracyMultiplier;

  // Baseline minimum for students who solved problems
  if (uniqueAcceptedProblems > 0 && rawScore < 20) {
    rawScore = Math.max(20, uniqueAcceptedProblems * 10);
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Identify weak / recommended topics
  const standardTopics = ['Arrays', 'Strings', 'Trees', 'Graphs', 'Dynamic Programming', 'SQL', 'DBMS'];
  const weakTopics = standardTopics.filter((t) => !topicsSet.has(t)).slice(0, 3);

  return {
    isAvailable: true,
    score: finalScore,
    weight,
    weightedContribution: Math.round(finalScore * weight * 10) / 10,
    uniqueAcceptedProblems,
    totalSubmissions,
    accuracyRate,
    easySolved,
    mediumSolved,
    hardSolved,
    topicsCovered: Array.from(topicsSet),
    weakTopics,
    subjectBreakdown,
    summary: `${uniqueAcceptedProblems} Solved (${easySolved}E / ${mediumSolved}M / ${hardSolved}H) • ${accuracyRate}% Accuracy`,
  };
}

/**
 * 3. Calculate Technical Interview Score (30% Weight)
 * - Uses completed MockInterviewReport[]
 * - Evaluates latest + historical performance
 */
export function calculateTechnicalInterviewScore(reports: MockInterviewReport[]): InterviewReadinessDetails {
  const weight = READINESS_WEIGHTS.technicalInterview;

  if (!reports || reports.length === 0) {
    return {
      isAvailable: false,
      score: 0,
      weight,
      weightedContribution: 0,
      completedRounds: 0,
      latestScore: 0,
      averageScore: 0,
      technicalKnowledgeScore: 0,
      problemSolvingScore: 0,
      communicationScore: 0,
      summary: 'No technical interview completed yet',
    };
  }

  // Sort by date descending
  const sorted = [...reports].sort((a, b) => {
    const timeA = new Date(a.completedAt || a.completed_at || 0).getTime();
    const timeB = new Date(b.completedAt || b.completed_at || 0).getTime();
    return timeB - timeA;
  });

  const latest = sorted[0];
  const latestScore = latest.overall_score !== undefined ? latest.overall_score : (latest.overallScore || 0);
  const techScore = latest.technical_score !== undefined ? latest.technical_score : (latest.technicalKnowledgeScore || latestScore);
  const problemScore = latest.problem_solving_score !== undefined ? latest.problem_solving_score : (latest.problemSolvingScore || latestScore);
  const commScore = latest.communication_score !== undefined ? latest.communication_score : (latest.communicationScore || latestScore);

  // Calculate average across all reports
  const totalScoreSum = sorted.reduce((acc, r) => {
    const s = r.overall_score !== undefined ? r.overall_score : (r.overallScore || 0);
    return acc + s;
  }, 0);
  const averageScore = Math.round(totalScoreSum / sorted.length);

  // Weighted score: Latest (70%) + Historical Average (30%)
  const calculatedScore = sorted.length === 1
    ? latestScore
    : Math.round(latestScore * 0.7 + averageScore * 0.3);

  const finalScore = Math.max(0, Math.min(100, calculatedScore));

  const areasForImprovement = latest.areas_to_improve || latest.areasForImprovement || [];

  return {
    isAvailable: true,
    score: finalScore,
    weight,
    weightedContribution: Math.round(finalScore * weight * 10) / 10,
    completedRounds: sorted.length,
    latestScore,
    averageScore,
    technicalKnowledgeScore: Math.round(techScore),
    problemSolvingScore: Math.round(problemScore),
    communicationScore: Math.round(commScore),
    latestCompletedAt: latest.completedAt || latest.completed_at,
    latestSubject: latest.subject,
    latestTopic: latest.topic || latest.custom_topic,
    areasForImprovement: areasForImprovement.slice(0, 3),
    summary: `Latest: ${latestScore}/100 • ${sorted.length} ${sorted.length === 1 ? 'Round' : 'Rounds'} Completed`,
  };
}

/**
 * 4. Calculate Consistency Score (15% Weight)
 * - Current streak (consecutive practice days)
 * - Longest historical streak
 * - Recent practice activity (last 14 days)
 * - Multiple submissions on same day count as 1 practice day
 */
export function calculateConsistencyScore(
  submissions: CodingSubmission[],
  userId: string = 'guest'
): ConsistencyReadinessDetails {
  const weight = READINESS_WEIGHTS.consistency;

  if (!submissions || submissions.length === 0) {
    return {
      isAvailable: true,
      score: 0,
      weight,
      weightedContribution: 0,
      currentStreak: 0,
      longestStreak: 0,
      recentActiveDays14: 0,
      uniquePracticeDatesCount: 0,
      summary: '0 Day Active • 0 Day Peak • No practice activity yet',
    };
  }

  const { currentStreak, longestStreak, uniquePracticeDates } = calculateStreaks(submissions, userId);

  // Count active days in the last 14 calendar days
  const now = new Date();
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(now.getDate() - 14);

  const recentActiveDays14 = uniquePracticeDates.filter((dateStr) => {
    const d = new Date(dateStr);
    return d >= fourteenDaysAgo;
  }).length;

  // Formula:
  // - Current streak: 12 pts per day (up to 48 pts for 4-day streak)
  // - Longest streak: 6 pts per day (up to 30 pts for 5-day streak)
  // - Recent 14-day activity: 6 pts per active day (up to 30 pts for 5 days)
  // Base reward if user has any practice: at least 15 pts
  let rawScore = currentStreak * 12 + longestStreak * 6 + recentActiveDays14 * 6;
  if (uniquePracticeDates.length > 0 && rawScore < 15) {
    rawScore = 15;
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Latest practice date
  const lastPracticeDate = uniquePracticeDates.length > 0
    ? uniquePracticeDates[0]
    : undefined;

  return {
    isAvailable: true,
    score: finalScore,
    weight,
    weightedContribution: Math.round(finalScore * weight * 10) / 10,
    currentStreak,
    longestStreak,
    recentActiveDays14,
    uniquePracticeDatesCount: uniquePracticeDates.length,
    lastPracticeDate,
    summary: `${currentStreak} Day Active Streak • ${longestStreak} Day Peak`,
  };
}

/**
 * Generate actionable, data-driven improvement recommendation
 */
export function generateReadinessRecommendation(
  resume: ResumeReadinessDetails,
  coding: CodingReadinessDetails,
  interview: InterviewReadinessDetails,
  consistency: ConsistencyReadinessDetails
): ReadinessRecommendation {
  // Find component with lowest score (giving high priority to unattempted areas)
  const componentsList: {
    key: ReadinessComponentKey;
    title: string;
    score: number;
    isAvailable: boolean;
  }[] = [
    { key: 'coding', title: 'Coding Practice', score: coding.isAvailable ? coding.score : 0, isAvailable: coding.isAvailable },
    { key: 'technicalInterview', title: 'Technical Interview', score: interview.isAvailable ? interview.score : 0, isAvailable: interview.isAvailable },
    { key: 'resume', title: 'Resume ATS Alignment', score: resume.isAvailable ? resume.score : 0, isAvailable: resume.isAvailable },
    { key: 'consistency', title: 'Practice Consistency', score: consistency.score, isAvailable: true },
  ];

  // Prioritize unattempted components first, then lowest numeric score
  componentsList.sort((a, b) => {
    if (!a.isAvailable && b.isAvailable) return -1;
    if (a.isAvailable && !b.isAvailable) return 1;
    return a.score - b.score;
  });

  const weakest = componentsList[0];

  switch (weakest.key) {
    case 'coding': {
      let recText = 'Practice Medium DSA problems to build algorithmic depth and problem-solving speed.';
      if (coding.weakTopics.length > 0) {
        recText = `Practice Medium DSA problems, especially ${coding.weakTopics.join(' and ')}.`;
      } else if (coding.easySolved > 0 && coding.mediumSolved === 0) {
        recText = 'You have mastered basic Easy problems. Step up to Medium-level interview questions.';
      }
      return {
        componentKey: 'coding',
        componentTitle: 'Coding',
        currentScore: coding.score,
        headline: 'Your biggest improvement area is Coding.',
        recommendedAction: recText,
        actionButtonText: 'Improve Coding →',
        actionRoute: 'coding',
      };
    }

    case 'technicalInterview': {
      if (!interview.isAvailable) {
        return {
          componentKey: 'technicalInterview',
          componentTitle: 'Technical Interview',
          currentScore: 0,
          headline: 'Your biggest improvement area is Technical Interview.',
          recommendedAction: 'Take your first AI Technical Mock Interview to evaluate live problem solving and verbal explanations.',
          actionButtonText: 'Take Mock Interview →',
          actionRoute: 'interview',
        };
      }
      const weakestSub =
        interview.communicationScore < interview.technicalKnowledgeScore && interview.communicationScore < interview.problemSolvingScore
          ? 'technical communication and structured explanation'
          : interview.problemSolvingScore < interview.technicalKnowledgeScore
          ? 'algorithmic trade-off discussion and problem-solving approach'
          : 'core technical depth and framework fundamentals';

      return {
        componentKey: 'technicalInterview',
        componentTitle: 'Technical Interview',
        currentScore: interview.score,
        headline: 'Your biggest improvement area is Technical Interview.',
        recommendedAction: `Complete another mock round focusing on ${weakestSub}.`,
        actionButtonText: 'Take Mock Interview →',
        actionRoute: 'interview',
      };
    }

    case 'resume': {
      if (!resume.isAvailable) {
        return {
          componentKey: 'resume',
          componentTitle: 'Resume',
          currentScore: 0,
          headline: 'Your biggest improvement area is Resume.',
          recommendedAction: 'Upload and analyze your resume to benchmark your ATS match score against industry expectations.',
          actionButtonText: 'Analyze My Resume →',
          actionRoute: 'resume-analyzer',
        };
      }
      const rec = resume.missingSkills && resume.missingSkills.length > 0
        ? `Incorporate key missing skills: ${resume.missingSkills.slice(0, 3).join(', ')} into your project descriptions.`
        : 'Enhance your project bullets with quantifiable metrics and targeted keywords.';
      return {
        componentKey: 'resume',
        componentTitle: 'Resume',
        currentScore: resume.score,
        headline: 'Your biggest improvement area is Resume.',
        recommendedAction: rec,
        actionButtonText: 'Improve Resume →',
        actionRoute: 'resume-analyzer',
      };
    }

    case 'consistency':
    default: {
      return {
        componentKey: 'consistency',
        componentTitle: 'Consistency',
        currentScore: consistency.score,
        headline: 'Your biggest improvement area is Practice Consistency.',
        recommendedAction: 'Solve at least 1 coding problem daily to build an active streak and sharpen muscle memory.',
        actionButtonText: 'Practice Daily Problem →',
        actionRoute: 'coding',
      };
    }
  }
}

/**
 * 5. Primary Engine: Calculate Full Placement Readiness Report
 * Deterministic calculation from real student data, powered by the canonical Analytics Engine
 */
export async function calculatePlacementReadiness(
  studentId: string = 'guest'
): Promise<PlacementReadinessReport> {
  const summary = await getPerformanceAnalyticsSummary(studentId);

  // 1. Fetch component details
  const [submissions, interviewReports, resumeAnalysisData] = await Promise.all([
    codingService.getSubmissions(studentId),
    Promise.resolve(interviewStorage.getReports(studentId)),
    Promise.resolve(resumeService.getLatestAnalysis(studentId)),
  ]);

  const resumeDetails = calculateResumeScore(resumeAnalysisData);
  const codingDetails = calculateCodingScore(submissions);
  const interviewDetails = calculateTechnicalInterviewScore(interviewReports);
  const consistencyDetails = calculateConsistencyScore(submissions, studentId);

  let availableCount = 0;
  if (resumeDetails.isAvailable) availableCount++;
  if (codingDetails.isAvailable) availableCount++;
  if (interviewDetails.isAvailable) availableCount++;
  if (consistencyDetails.isAvailable && consistencyDetails.score > 0) availableCount++;

  const overallScore = summary.overallScore !== null ? summary.overallScore : 0;
  const statusCategory = summary.overallScoreCategory as ReadinessStatusCategory;
  const statusBadgeColor = getReadinessStatusBadgeColor(statusCategory);
  const statusDescription = summary.overallScoreDescription;

  const recommendation = generateReadinessRecommendation(
    resumeDetails,
    codingDetails,
    interviewDetails,
    consistencyDetails
  );

  const formulaExplanation =
    'Overall Score = Weighted synthesis across Resume (20%), Coding (25%), Technical Interview (20%), HR Interview (10%), Aptitude (15%), and Consistency (10%)';

  return {
    studentId,
    overallScore,
    statusCategory,
    statusDescription,
    statusBadgeColor,
    weights: READINESS_WEIGHTS,
    components: {
      resume: resumeDetails,
      coding: codingDetails,
      technicalInterview: interviewDetails,
      consistency: consistencyDetails,
    },
    recommendation,
    availableComponentsCount: availableCount,
    formulaExplanation,
    calculatedAt: summary.calculatedAt,
  };
}
