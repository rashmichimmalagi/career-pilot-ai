import {
  CareerRoadmapAnalysis,
  RoadmapCategory,
  RoadmapItem,
  RoadmapPhase,
  DailyRoadmapTask,
  PerformanceBreakdown,
  PriorityLevel,
  SkillStatus,
} from '../types/roadmap';
import { resumeService } from './resumeService';
import { codingService } from './codingService';
import { getPlacementStats, getPlacementHistory } from './placementStorage';
import { interviewStorage } from './interviewStorage';
import { calculateStreaks } from './achievementService';
import { getActiveStudentTarget } from './companyPrepStorage';
import { getCompanyProfile } from '../data/companyProfiles';
import { getCompletedItemIds, getStoredDailyTasks, getCustomTargetRole } from './roadmapStorage';
import { DEFAULT_CODING_QUESTION_BANK } from '../data/codingQuestionBank';

/**
 * Robust topic resolution for coding submissions
 */
export function getSubmissionTopic(s: any): string {
  if (s.topic && typeof s.topic === 'string' && s.topic.trim()) return s.topic.trim();
  if (s.problem_data?.topic && typeof s.problem_data.topic === 'string' && s.problem_data.topic.trim()) {
    return s.problem_data.topic.trim();
  }
  if (s.problem_id) {
    const fromBank = DEFAULT_CODING_QUESTION_BANK.find((p) => p.id === s.problem_id);
    if (fromBank?.topic) return fromBank.topic;
  }
  if (s.problem_title) {
    const fromBank = DEFAULT_CODING_QUESTION_BANK.find(
      (p) => p.title.toLowerCase() === s.problem_title?.toLowerCase()
    );
    if (fromBank?.topic) return fromBank.topic;
  }
  return 'Arrays';
}

/**
 * Robust difficulty resolution for coding submissions
 */
export function getSubmissionDifficulty(s: any): string {
  if (s.difficulty) return s.difficulty;
  if (s.problem_data?.difficulty) return s.problem_data.difficulty;
  if (s.problem_id) {
    const fromBank = DEFAULT_CODING_QUESTION_BANK.find((p) => p.id === s.problem_id);
    if (fromBank?.difficulty) return fromBank.difficulty;
  }
  return 'Medium';
}

/**
 * Count unique, accepted problems solved for a specific topic and optional allowed difficulties
 * Strictly scoped to authenticated student submissions
 */
export function countUniqueSolvedCodingProblems(
  submissions: any[],
  targetTopic: string,
  allowedDifficulties?: ('Easy' | 'Medium' | 'Hard')[]
): number {
  if (!Array.isArray(submissions) || !targetTopic) return 0;

  const normalizedTarget = targetTopic.toLowerCase().trim();
  const solvedProblemIds = new Set<string>();

  submissions.forEach((s) => {
    if (!s) return;
    const isAccepted =
      s.status === 'accepted' ||
      s.status_text === 'Accepted' ||
      (typeof s.score === 'number' && s.score >= 90);

    if (!isAccepted) return;

    const topic = getSubmissionTopic(s).toLowerCase().trim();
    // Case-insensitive, resilient topic matching
    const topicMatches =
      topic === normalizedTarget ||
      topic.includes(normalizedTarget) ||
      normalizedTarget.includes(topic);

    if (!topicMatches) return;

    if (allowedDifficulties && allowedDifficulties.length > 0) {
      const diff = getSubmissionDifficulty(s).toLowerCase();
      const diffAllowed = allowedDifficulties.some(
        (d) => d.toLowerCase() === diff
      );
      if (!diffAllowed) return;
    }

    const pId = s.problem_id || s.problem_title || s.id;
    if (pId) {
      solvedProblemIds.add(pId);
    }
  });

  return solvedProblemIds.size;
}

/**
 * Count completed questions in placement practice test sessions
 */
export function countPlacementQuestions(
  sessions: any[],
  category?: 'Aptitude' | 'Technical',
  subjectOrTopic?: string
): number {
  if (!Array.isArray(sessions)) return 0;
  let count = 0;
  const normalizedMatch = subjectOrTopic ? subjectOrTopic.toLowerCase().trim() : '';

  sessions.forEach((s) => {
    if (!s) return;
    if (category && s.category !== category) return;

    if (normalizedMatch) {
      const subj = (s.subject || '').toLowerCase();
      const top = (s.topic || '').toLowerCase();
      const matches =
        subj.includes(normalizedMatch) ||
        top.includes(normalizedMatch) ||
        normalizedMatch.includes(subj) ||
        normalizedMatch.includes(top);

      if (!matches) {
        if (Array.isArray(s.questions)) {
          const qMatches = s.questions.filter((q: any) => {
            const qTop = (q.topic || '').toLowerCase();
            const qSub = (q.subject || '').toLowerCase();
            return (
              qTop.includes(normalizedMatch) ||
              qSub.includes(normalizedMatch) ||
              normalizedMatch.includes(qTop) ||
              normalizedMatch.includes(qSub)
            );
          }).length;
          count += qMatches;
          return;
        }
        return;
      }
    }

    const sessionTotal =
      typeof s.totalQuestions === 'number'
        ? s.totalQuestions
        : (s.correctCount || 0) + (s.incorrectCount || 0) + (s.skippedCount || 0);

    count += sessionTotal;
  });

  return count;
}

export async function generatePersonalizedRoadmap(
  studentId: string,
  targetRoleOverride?: string,
  targetCompanyOverride?: string
): Promise<CareerRoadmapAnalysis> {
  const effectiveId = studentId || 'guest';

  // 1. Gather Target Role & Company
  const activeCompanyTarget = getActiveStudentTarget(effectiveId);
  const customRole = getCustomTargetRole(effectiveId);
  const targetRole =
    targetRoleOverride ||
    activeCompanyTarget?.targetRole ||
    customRole ||
    'Software Developer';

  const targetCompany = targetCompanyOverride || activeCompanyTarget?.companyName || undefined;
  const companyProfile = targetCompany ? getCompanyProfile(targetCompany) : null;

  // 2. Fetch Real Student Records
  // (a) Resume Data
  const resumeData = await resumeService.getLatestAnalysis(effectiveId);
  const resumeScore = resumeData?.result?.overall_score || 0;
  const missingSkills = resumeData?.result?.missing_skills || [];
  const resumeHasData = !!resumeData?.result;

  // (b) Coding Practice Data
  const submissions = await codingService.getSubmissions(effectiveId);
  const acceptedSubmissions = submissions.filter(
    (s) => s.status === 'accepted' || s.status_text === 'Accepted' || (typeof s.score === 'number' && s.score >= 90)
  );
  const uniqueAcceptedProblems = new Set(acceptedSubmissions.map((s) => s.problem_id || s.id)).size;
  
  let easySolved = 0;
  let mediumSolved = 0;
  let hardSolved = 0;

  acceptedSubmissions.forEach((s) => {
    const diff = (s.difficulty || s.problem_data?.difficulty || 'Easy').toLowerCase();
    if (diff === 'easy') easySolved++;
    else if (diff === 'medium') mediumSolved++;
    else if (diff === 'hard') hardSolved++;
    else easySolved++;
  });

  const codingAccuracy = submissions.length > 0 ? Math.round((acceptedSubmissions.length / submissions.length) * 100) : 0;
  
  // Calculate topic-level coding metrics
  const codingTopicMap: Record<string, { total: number; accepted: number }> = {};
  submissions.forEach((s) => {
    const topic = s.topic || s.problem_data?.topic || 'Arrays';
    if (!codingTopicMap[topic]) codingTopicMap[topic] = { total: 0, accepted: 0 };
    codingTopicMap[topic].total++;
    const isAcc = s.status === 'accepted' || s.status_text === 'Accepted' || (typeof s.score === 'number' && s.score >= 90);
    if (isAcc) codingTopicMap[topic].accepted++;
  });

  const codingWeakTopics: string[] = [];
  const codingStrongTopics: string[] = [];

  Object.entries(codingTopicMap).forEach(([topic, stats]) => {
    const acc = Math.round((stats.accepted / stats.total) * 100);
    if (acc >= 75 && stats.accepted >= 2) codingStrongTopics.push(topic);
    else if (acc < 60) codingWeakTopics.push(topic);
  });

  // Standard core DSA topics check
  const coreDSATopics = ['Arrays', 'Strings', 'Dynamic Programming', 'Trees', 'Graphs', 'Binary Search', 'Linked Lists', 'Stack'];
  coreDSATopics.forEach((t) => {
    if (!codingTopicMap[t] && !codingWeakTopics.includes(t)) {
      codingWeakTopics.push(t);
    }
  });

  // Coding Score based on solved count & accuracy
  let calculatedCodingScore = 0;
  if (submissions.length > 0) {
    const volumeScore = Math.min(60, uniqueAcceptedProblems * 6);
    const accScore = Math.min(40, (codingAccuracy / 100) * 40);
    calculatedCodingScore = Math.min(100, Math.round(volumeScore + accScore));
  }

  // (c) Placement Practice (Aptitude & Technical MCQs)
  const placementStats = getPlacementStats(effectiveId);
  const aptTotalQ = placementStats.aptitudeSolved;
  const aptitudeAccuracy = placementStats.aptitudeAccuracy;
  const aptCorrectQ = Math.round((aptTotalQ * aptitudeAccuracy) / 100);

  const mcqTotalQ = placementStats.technicalSolved;
  const mcqAccuracy = placementStats.technicalAccuracy;
  const mcqCorrectQ = Math.round((mcqTotalQ * mcqAccuracy) / 100);

  const aptitudeScore = aptTotalQ > 0 ? Math.min(100, Math.round((aptitudeAccuracy * 0.7) + Math.min(30, aptTotalQ * 1.5))) : 0;
  const mcqScore = mcqTotalQ > 0 ? Math.min(100, Math.round((mcqAccuracy * 0.7) + Math.min(30, mcqTotalQ * 1.5))) : 0;

  // (d) Technical Mock Interview
  const interviewReports = interviewStorage.getReports(effectiveId);
  const interviewCount = interviewReports.length;
  let interviewAvgScore = 0;
  if (interviewCount > 0) {
    const totalScore = interviewReports.reduce((sum, r) => sum + (r.overall_score || 0), 0);
    interviewAvgScore = Math.round(totalScore / interviewCount);
  }

  // (e) Consistency & Streak
  const streakInfo = calculateStreaks(submissions, effectiveId);
  const totalActivities = submissions.length + placementStats.totalTests + interviewCount + (resumeHasData ? 1 : 0);
  const consistencyScore = Math.min(100, (streakInfo.currentStreak * 15) + Math.min(50, totalActivities * 4));

  // Determine skill statuses (Strong >= 75, Maintain 55-74, Needs Improvement < 55)
  const getStatus = (score: number, hasData: boolean): SkillStatus => {
    if (!hasData || score < 55) return 'Needs Improvement';
    if (score >= 75) return 'Strong';
    return 'Maintain';
  };

  const aptWeak = aptitudeAccuracy < 60 ? ['Quantitative Aptitude', 'Logical Reasoning'] : [];
  const aptStrong = aptitudeAccuracy >= 75 ? ['Quantitative Aptitude', 'Logical Reasoning'] : [];

  const mcqWeak = mcqAccuracy < 60 ? ['Operating Systems', 'DBMS & SQL', 'Computer Networks'] : [];
  const mcqStrong = mcqAccuracy >= 75 ? ['Operating Systems', 'DBMS & SQL'] : [];

  const breakdown: PerformanceBreakdown = {
    resume: {
      score: resumeScore,
      targetRole: resumeData?.targetRole || targetRole,
      missingSkillsCount: missingSkills.length,
      status: getStatus(resumeScore, resumeHasData),
      hasData: resumeHasData,
    },
    coding: {
      score: calculatedCodingScore,
      solvedCount: uniqueAcceptedProblems,
      easySolved,
      mediumSolved,
      hardSolved,
      accuracy: codingAccuracy,
      status: getStatus(calculatedCodingScore, submissions.length > 0),
      hasData: submissions.length > 0,
      weakTopics: codingWeakTopics.slice(0, 4),
      strongTopics: codingStrongTopics,
    },
    aptitude: {
      score: aptitudeScore,
      testsCompleted: aptTotalQ > 0 ? Math.ceil(aptTotalQ / 5) : 0,
      accuracy: aptitudeAccuracy,
      status: getStatus(aptitudeScore, aptTotalQ > 0),
      hasData: aptTotalQ > 0,
      weakTopics: aptWeak,
      strongTopics: aptStrong,
    },
    technicalMcqs: {
      score: mcqScore,
      testsCompleted: mcqTotalQ > 0 ? Math.ceil(mcqTotalQ / 5) : 0,
      accuracy: mcqAccuracy,
      status: getStatus(mcqScore, mcqTotalQ > 0),
      hasData: mcqTotalQ > 0,
      weakSubjects: mcqWeak,
      strongSubjects: mcqStrong,
    },
    interview: {
      score: interviewAvgScore,
      sessionsCompleted: interviewCount,
      averageScore: interviewAvgScore,
      status: getStatus(interviewAvgScore, interviewCount > 0),
      hasData: interviewCount > 0,
      feedbackSummary: interviewReports[0]?.recommendation || undefined,
    },
    consistency: {
      currentStreak: streakInfo.currentStreak,
      totalActivityCount: totalActivities,
      consistencyScore,
    },
  };

  // 3. Calculate Overall Placement Readiness Score
  // Weighted based on Company Archetype or Standard Tech Role weights
  let weights = { resume: 0.20, coding: 0.35, aptitude: 0.15, mcqs: 0.15, interview: 0.15 };
  if (companyProfile?.tier === 'Tier 1 Product' || companyProfile?.tier === 'Enterprise / Tech Giant' || companyProfile?.tier === 'FinTech / High Frequency') {
    weights = { resume: 0.15, coding: 0.45, aptitude: 0.10, mcqs: 0.10, interview: 0.20 };
  } else if (companyProfile?.tier === 'Service / IT Consulting') {
    weights = { resume: 0.20, coding: 0.25, aptitude: 0.25, mcqs: 0.20, interview: 0.10 };
  }

  const overallReadiness = Math.round(
    breakdown.resume.score * weights.resume +
    breakdown.coding.score * weights.coding +
    breakdown.aptitude.score * weights.aptitude +
    breakdown.technicalMcqs.score * weights.mcqs +
    breakdown.interview.score * weights.interview
  );

  let readinessCategory: CareerRoadmapAnalysis['readinessCategory'] = 'Early Stage';
  if (overallReadiness >= 80) readinessCategory = 'Highly Placement Ready';
  else if (overallReadiness >= 65) readinessCategory = 'Interview Ready';
  else if (overallReadiness >= 45) readinessCategory = 'Building Foundation';
  else if (overallReadiness >= 20) readinessCategory = 'Early Stage';
  else readinessCategory = 'Not Ready';

  const hasEnoughData = totalActivities >= 1;

  // 4. Identify Strengths & Weaknesses
  const strengths: CareerRoadmapAnalysis['strengths'] = [];
  const weaknesses: CareerRoadmapAnalysis['weaknesses'] = [];

  // Resume check
  if (breakdown.resume.hasData && breakdown.resume.score >= 75) {
    strengths.push({
      title: 'ATS Resume Optimization',
      category: 'Resume',
      score: breakdown.resume.score,
      description: `Resume matches ${breakdown.resume.targetRole} requirements with strong keyword alignment.`,
    });
  } else {
    weaknesses.push({
      title: breakdown.resume.hasData ? 'ATS Resume Role Gap' : 'Resume Not Analyzed',
      category: 'Resume',
      score: breakdown.resume.score,
      description: breakdown.resume.hasData
        ? `Missing ${breakdown.resume.missingSkillsCount} critical skills for ${targetRole}.`
        : `Upload and evaluate your resume to benchmark against ${targetRole} job descriptions.`,
      urgency: breakdown.resume.hasData ? 'Moderate' : 'Critical',
    });
  }

  // Coding check
  if (breakdown.coding.hasData && breakdown.coding.score >= 70) {
    strengths.push({
      title: 'Problem Solving Consistency',
      category: 'Coding',
      score: breakdown.coding.score,
      description: `Solved ${uniqueAcceptedProblems} problems with ${codingAccuracy}% accuracy.`,
    });
  } else {
    const primaryWeakDSA = breakdown.coding.weakTopics[0] || 'Dynamic Programming';
    weaknesses.push({
      title: `DSA & Coding: ${primaryWeakDSA}`,
      category: 'Coding',
      score: breakdown.coding.score,
      description: `Need to solve more medium-difficulty problems in ${primaryWeakDSA} for technical rounds.`,
      urgency: 'Critical',
    });
  }

  // Aptitude check
  if (breakdown.aptitude.hasData && breakdown.aptitude.score >= 70) {
    strengths.push({
      title: 'Aptitude & Logical Reasoning',
      category: 'Aptitude',
      score: breakdown.aptitude.score,
      description: `Scoring ${aptitudeAccuracy}% accuracy across placement aptitude rounds.`,
    });
  } else {
    weaknesses.push({
      title: 'Aptitude Assessment Readiness',
      category: 'Aptitude',
      score: breakdown.aptitude.score,
      description: `Online assessment clearance requires at least 70% accuracy in speed aptitude.`,
      urgency: companyProfile?.tier === 'Service / IT Consulting' ? 'Critical' : 'Moderate',
    });
  }

  // Technical MCQs check
  if (breakdown.technicalMcqs.hasData && breakdown.technicalMcqs.score >= 70) {
    strengths.push({
      title: 'Core Computer Science Fundamentals',
      category: 'Technical MCQs',
      score: breakdown.technicalMcqs.score,
      description: `Solid grasp of DBMS, Operating Systems, Computer Networks & OOP.`,
    });
  } else {
    const weakMcqSubject = breakdown.technicalMcqs.weakSubjects[0] || 'DBMS & SQL';
    weaknesses.push({
      title: `Core CS: ${weakMcqSubject}`,
      category: 'Technical MCQs',
      score: breakdown.technicalMcqs.score,
      description: `Strengthen fundamental concepts in ${weakMcqSubject} for technical screening.`,
      urgency: 'Moderate',
    });
  }

  // Technical Mock Interview check
  if (breakdown.interview.hasData && breakdown.interview.score >= 70) {
    strengths.push({
      title: 'Technical Communication & Live Articulation',
      category: 'Interview',
      score: breakdown.interview.score,
      description: `Strong live interview delivery with an average score of ${interviewAvgScore}/100.`,
    });
  } else {
    weaknesses.push({
      title: 'Live Technical Mock Rounds',
      category: 'Interview',
      score: breakdown.interview.score,
      description: interviewCount === 0
        ? 'Complete at least 1 mock interview simulation to test live problem explanation under pressure.'
        : `Improve interview score from ${interviewAvgScore}/100 to target 75+.`,
      urgency: 'Moderate',
    });
  }

  // 5. Build Dynamic Roadmap Items & Phases
  const completedIds = getCompletedItemIds(effectiveId);
  const placementSessions = getPlacementHistory(effectiveId);

  // Helper to construct roadmap items with real evidence verification
  const makeItem = (
    id: string,
    area: RoadmapCategory,
    topic: string,
    current: number,
    target: number,
    priority: PriorityLevel,
    status: SkillStatus,
    action: string,
    hours: number,
    navTarget: RoadmapItem['navigationTarget'],
    options?: {
      isEvidenceBased?: boolean;
      requiredCount?: number;
      currentCount?: number;
      unitLabel?: string;
      targetTopic?: string;
      targetSubject?: string;
      allowedDifficulties?: ('Easy' | 'Medium' | 'Hard')[];
    }
  ): RoadmapItem => {
    const isEvidenceBased = options?.isEvidenceBased ?? true;
    const requiredCount = options?.requiredCount ?? 1;
    const currentCount = options?.currentCount ?? 0;
    const isCompleted = isEvidenceBased
      ? currentCount >= requiredCount
      : completedIds.includes(id);
    const progressPercentage = Math.min(100, Math.round((currentCount / requiredCount) * 100));
    const evidenceStatusText =
      currentCount === 0 ? 'Not Started' : (isCompleted ? 'Completed' : 'In Progress');

    return {
      id,
      area,
      topic,
      currentPerformance: current,
      targetPerformance: target,
      priority,
      status,
      recommendedAction: action,
      estimatedHours: hours,
      navigationTarget: navTarget,
      isEvidenceBased,
      requiredCount,
      currentCount,
      unitLabel: options?.unitLabel || 'Completed',
      progressPercentage,
      evidenceStatusText,
      targetTopic: options?.targetTopic,
      targetSubject: options?.targetSubject,
      allowedDifficulties: options?.allowedDifficulties,
      isCompleted,
    };
  };

  // Items for Phase 1 (Immediate Improvement - Top Critical Weaknesses)
  const topWeakCodingTopic = breakdown.coding.weakTopics[0] || 'Dynamic Programming';
  const secondWeakCodingTopic = breakdown.coding.weakTopics[1] || 'Graphs';
  const topWeakMcqSubject = breakdown.technicalMcqs.weakSubjects[0] || 'DBMS';
  const topWeakAptTopic = breakdown.aptitude.weakTopics[0] || 'Quantitative Aptitude';

  const p1CodingCount = countUniqueSolvedCodingProblems(submissions, topWeakCodingTopic, ['Easy', 'Medium']);
  const p1AptCount = countPlacementQuestions(placementSessions, 'Aptitude', topWeakAptTopic);

  const phase1Items: RoadmapItem[] = [
    makeItem(
      'p1_coding_1',
      'Coding',
      `DSA — ${topWeakCodingTopic}`,
      breakdown.coding.score,
      75,
      'High Priority',
      breakdown.coding.status,
      `Solve 8 ${topWeakCodingTopic} problems (Easy to Medium) with optimal time complexity.`,
      4,
      {
        route: 'coding',
        params: {
          subject: 'DSA',
          topic: topWeakCodingTopic,
          difficulty: 'Medium',
          company: targetCompany,
          role: targetRole,
          auto: true,
        },
      },
      {
        isEvidenceBased: true,
        requiredCount: 8,
        currentCount: p1CodingCount,
        unitLabel: 'Problems',
        targetTopic: topWeakCodingTopic,
        allowedDifficulties: ['Easy', 'Medium'],
      }
    ),
    makeItem(
      'p1_resume_1',
      'Resume',
      'ATS Resume Optimization',
      breakdown.resume.score,
      85,
      breakdown.resume.score < 70 ? 'High Priority' : 'Recommended',
      breakdown.resume.status,
      `Align resume project descriptions with ${targetRole} keywords and quantify achievements.`,
      2,
      {
        route: 'resume-analyzer',
        params: { role: targetRole },
      },
      {
        isEvidenceBased: true,
        requiredCount: 1,
        currentCount: resumeHasData ? 1 : 0,
        unitLabel: 'Resume Analyzed',
      }
    ),
    makeItem(
      'p1_apt_1',
      'Aptitude',
      topWeakAptTopic,
      breakdown.aptitude.score,
      75,
      'High Priority',
      breakdown.aptitude.status,
      `Practice 15 time-bound speed questions in ${topWeakAptTopic}.`,
      2,
      {
        route: 'placement',
        params: {
          category: 'Aptitude',
          domain: 'Aptitude & Reasoning',
          subject: topWeakAptTopic,
          topic: topWeakAptTopic === 'Quantitative Aptitude' ? 'Percentages' : 'Critical Reasoning',
          difficulty: 'Medium',
          questionCount: 10,
          company: targetCompany,
          role: targetRole,
          auto: true,
          source: 'roadmap',
          roadmapItemId: 'p1_apt_1',
        },
      },
      {
        isEvidenceBased: true,
        requiredCount: 15,
        currentCount: p1AptCount,
        unitLabel: 'Questions',
      }
    ),
  ];

  // Items for Phase 2 (Skill Building - Core Mastery)
  const p2CodingCount = countUniqueSolvedCodingProblems(submissions, secondWeakCodingTopic, ['Easy', 'Medium', 'Hard']);
  const p2Mcq1Count = countPlacementQuestions(placementSessions, 'Technical', topWeakMcqSubject);
  const p2Mcq2Count =
    countPlacementQuestions(placementSessions, 'Technical', 'Operating Systems') +
    countPlacementQuestions(placementSessions, 'Technical', 'Computer Networks');

  const phase2Items: RoadmapItem[] = [
    makeItem(
      'p2_coding_1',
      'Coding',
      `DSA — ${secondWeakCodingTopic}`,
      Math.max(20, breakdown.coding.score - 10),
      80,
      'Medium Priority',
      'Needs Improvement',
      `Master traversal & patterns in ${secondWeakCodingTopic}. Practice 5 interview-level problems.`,
      4,
      {
        route: 'coding',
        params: {
          subject: 'DSA',
          topic: secondWeakCodingTopic,
          difficulty: 'Medium',
          company: targetCompany,
          role: targetRole,
          auto: true,
          source: 'roadmap',
          roadmapItemId: 'p2_coding_1',
        },
      },
      {
        isEvidenceBased: true,
        requiredCount: 5,
        currentCount: p2CodingCount,
        unitLabel: 'Problems',
        targetTopic: secondWeakCodingTopic,
        allowedDifficulties: ['Easy', 'Medium', 'Hard'],
      }
    ),
    makeItem(
      'p2_mcq_1',
      'Technical MCQs',
      topWeakMcqSubject,
      breakdown.technicalMcqs.score,
      80,
      'Medium Priority',
      breakdown.technicalMcqs.status,
      `Take 2 sectional tests on ${topWeakMcqSubject} (Transactions, Normalization, Queries).`,
      2,
      {
        route: 'placement',
        params: {
          category: 'Technical',
          domain: 'Technical MCQs',
          subject: topWeakMcqSubject,
          topic: topWeakMcqSubject === 'DBMS' ? 'Transactions, Normalization, Queries' : 'Core Fundamentals',
          topics: topWeakMcqSubject === 'DBMS' ? ['Transactions', 'Normalization', 'Queries'] : undefined,
          difficulty: 'Medium',
          questionCount: 10,
          company: targetCompany,
          role: targetRole,
          auto: true,
          source: 'roadmap',
          roadmapItemId: 'p2_mcq_1',
        },
      },
      {
        isEvidenceBased: true,
        requiredCount: 10,
        currentCount: p2Mcq1Count,
        unitLabel: 'Questions',
      }
    ),
    makeItem(
      'p2_mcq_2',
      'Technical MCQs',
      'Operating Systems & Computer Networks',
      Math.max(30, breakdown.technicalMcqs.score - 5),
      75,
      'Recommended',
      'Maintain',
      'Review Process Scheduling, Paging, TCP/IP, and OSI 7-Layer models.',
      3,
      {
        route: 'placement',
        params: {
          category: 'Technical',
          domain: 'Technical MCQs',
          subject: 'Operating Systems',
          topic: 'Process Scheduling, Paging, TCP/IP',
          topics: ['Process Management & State Transitions', 'Memory Management & Paging', 'TCP/IP Protocol Suite'],
          difficulty: 'Medium',
          questionCount: 10,
          company: targetCompany,
          role: targetRole,
          auto: true,
          source: 'roadmap',
          roadmapItemId: 'p2_mcq_2',
        },
      },
      {
        isEvidenceBased: true,
        requiredCount: 10,
        currentCount: p2Mcq2Count,
        unitLabel: 'Questions',
      }
    ),
  ];

  // Items for Phase 3 (Interview Preparation - Live Simulation)
  const p3SysDesignCount =
    countUniqueSolvedCodingProblems(submissions, 'System Design') +
    countUniqueSolvedCodingProblems(submissions, 'Rate Limiting');

  const phase3Items: RoadmapItem[] = [
    makeItem(
      'p3_interview_1',
      'Interview',
      `${targetRole} Technical Mock Round`,
      breakdown.interview.score,
      80,
      'High Priority',
      breakdown.interview.status,
      `Complete a full 15-minute live technical mock simulation for ${targetRole}.`,
      3,
      {
        route: 'interview',
        params: {
          role: targetRole,
          company: targetCompany,
        },
      },
      {
        isEvidenceBased: true,
        requiredCount: 1,
        currentCount: interviewCount,
        unitLabel: 'Mock Rounds',
      }
    ),
    makeItem(
      'p3_coding_adv',
      'Coding',
      'System Design & Algorithmic Scalability',
      Math.min(50, breakdown.coding.score),
      75,
      'Medium Priority',
      'Needs Improvement',
      'Understand time-space tradeoffs, caching, and rate limiting fundamentals.',
      4,
      {
        route: 'coding',
        params: {
          subject: 'System Design',
          topic: 'Rate Limiting',
          difficulty: 'Medium',
          company: targetCompany,
          role: targetRole,
          auto: true,
        },
      },
      {
        isEvidenceBased: true,
        requiredCount: 2,
        currentCount: p3SysDesignCount,
        unitLabel: 'Problems',
      }
    ),
  ];

  // Items for Phase 4 (Placement Readiness & Target Company Lock)
  const p4MockExamCount = placementSessions.filter((s) => (s.totalQuestions || 0) >= 15).length;

  const phase4Items: RoadmapItem[] = [
    makeItem(
      'p4_company_1',
      'Company Prep',
      targetCompany ? `${targetCompany} Hiring Rounds Simulation` : 'Comprehensive Placement Simulation',
      overallReadiness,
      85,
      'Recommended',
      overallReadiness >= 75 ? 'Strong' : 'Maintain',
      targetCompany
        ? `Review ${targetCompany}'s hiring rounds breakdown and solve target company practice sets.`
        : `Select a target company in Company Prep to focus specific question patterns.`,
      3,
      {
        route: 'company-prep',
        params: {
          company: targetCompany,
          role: targetRole,
        },
      },
      {
        isEvidenceBased: true,
        requiredCount: 1,
        currentCount: activeCompanyTarget ? 1 : 0,
        unitLabel: 'Target Locked',
      }
    ),
    makeItem(
      'p4_mock_exam',
      'Aptitude',
      'Full-Length Placement Mock Exam',
      breakdown.aptitude.score,
      85,
      'Recommended',
      'Maintain',
      'Take a full-length 30-question mixed assessment covering Quant, Reasoning, Verbal & CS.',
      2,
      {
        route: 'placement',
        params: {
          category: 'Aptitude',
          domain: 'Aptitude & Reasoning',
          subject: 'Quantitative Aptitude',
          topic: 'Speed Calculations & Core Problem Solving',
          difficulty: 'Medium',
          questionCount: 15,
          company: targetCompany,
          role: targetRole,
          auto: true,
          source: 'roadmap',
          roadmapItemId: 'p4_mock_exam',
        },
      },
      {
        isEvidenceBased: true,
        requiredCount: 1,
        currentCount: p4MockExamCount,
        unitLabel: 'Full Exams',
      }
    ),
  ];

  const calcPhaseCompletion = (items: RoadmapItem[]) => {
    if (items.length === 0) return 0;
    const done = items.filter((i) => i.isCompleted).length;
    return Math.round((done / items.length) * 100);
  };

  const phases: RoadmapPhase[] = [
    {
      phaseNumber: 1,
      title: 'Phase 1 — Immediate Improvement',
      subtitle: 'Target immediate critical skill gaps and benchmark baseline ATS score',
      status: calcPhaseCompletion(phase1Items) === 100 ? 'completed' : 'current',
      completionPercentage: calcPhaseCompletion(phase1Items),
      items: phase1Items,
    },
    {
      phaseNumber: 2,
      title: 'Phase 2 — Core Skill Building',
      subtitle: 'Deepen core Data Structures, Algorithms, and Operating Systems concepts',
      status: calcPhaseCompletion(phase1Items) === 100 ? (calcPhaseCompletion(phase2Items) === 100 ? 'completed' : 'current') : 'upcoming',
      completionPercentage: calcPhaseCompletion(phase2Items),
      items: phase2Items,
    },
    {
      phaseNumber: 3,
      title: 'Phase 3 — Interview Preparation',
      subtitle: 'Master live articulation, technical mock rounds, and problem explanation',
      status: 'upcoming',
      completionPercentage: calcPhaseCompletion(phase3Items),
      items: phase3Items,
    },
    {
      phaseNumber: 4,
      title: 'Phase 4 — Placement Readiness',
      subtitle: 'Company-specific interview sets, final ATS tuning, and timed assessments',
      status: 'upcoming',
      completionPercentage: calcPhaseCompletion(phase4Items),
      items: phase4Items,
    },
  ];

  // 6. Generate Actionable Daily Tasks
  const d1Count = countUniqueSolvedCodingProblems(submissions, topWeakCodingTopic, ['Easy', 'Medium']);
  const d2Count = countPlacementQuestions(placementSessions, 'Technical', topWeakMcqSubject);
  const d3Count = countPlacementQuestions(placementSessions, 'Aptitude', topWeakAptTopic);
  const d4Count = interviewCount;

  const dailyTasks: DailyRoadmapTask[] = [
    {
      id: `task_daily_coding_${effectiveId}`,
      title: `Solve 2 ${topWeakCodingTopic} Problems`,
      category: 'Coding',
      description: `Practice medium level problems on ${topWeakCodingTopic} in Coding Arena.`,
      isEvidenceBased: true,
      requiredCount: 2,
      currentCount: d1Count,
      unitLabel: 'Problems',
      progressPercentage: Math.min(100, Math.round((d1Count / 2) * 100)),
      evidenceStatusText: d1Count === 0 ? 'Not Started' : (d1Count >= 2 ? 'Completed' : 'In Progress'),
      completed: d1Count >= 2,
      estimatedMinutes: 40,
      priority: 'High',
      actionRoute: 'coding',
      actionParams: {
        subject: 'DSA',
        topic: topWeakCodingTopic,
        difficulty: 'Medium',
        company: targetCompany,
        role: targetRole,
        auto: true,
      },
    },
    {
      id: `task_daily_mcq_${effectiveId}`,
      title: `Complete 10 ${topWeakMcqSubject} MCQs`,
      category: 'Technical MCQs',
      description: `Practice core concept multiple choice questions in Placement Practice.`,
      isEvidenceBased: true,
      requiredCount: 10,
      currentCount: d2Count,
      unitLabel: 'Questions',
      progressPercentage: Math.min(100, Math.round((d2Count / 10) * 100)),
      evidenceStatusText: d2Count === 0 ? 'Not Started' : (d2Count >= 10 ? 'Completed' : 'In Progress'),
      completed: d2Count >= 10,
      estimatedMinutes: 15,
      priority: 'High',
      actionRoute: 'placement',
      actionParams: {
        category: 'Technical',
        domain: 'Technical MCQs',
        subject: topWeakMcqSubject,
        topic: topWeakMcqSubject === 'DBMS' ? 'Transactions, Normalization, Queries' : 'Core Fundamentals',
        topics: topWeakMcqSubject === 'DBMS' ? ['Transactions', 'Normalization', 'Queries'] : undefined,
        difficulty: 'Medium',
        questionCount: 10,
        company: targetCompany,
        role: targetRole,
        auto: true,
        source: 'roadmap',
      },
    },
    {
      id: `task_daily_apt_${effectiveId}`,
      title: 'Review 15 Speed Aptitude Questions',
      category: 'Aptitude',
      description: `Practice quantitative and logical reasoning problem sets.`,
      isEvidenceBased: true,
      requiredCount: 15,
      currentCount: d3Count,
      unitLabel: 'Questions',
      progressPercentage: Math.min(100, Math.round((d3Count / 15) * 100)),
      evidenceStatusText: d3Count === 0 ? 'Not Started' : (d3Count >= 15 ? 'Completed' : 'In Progress'),
      completed: d3Count >= 15,
      estimatedMinutes: 20,
      priority: 'Medium',
      actionRoute: 'placement',
      actionParams: {
        category: 'Aptitude',
        domain: 'Aptitude & Reasoning',
        subject: 'Quantitative Aptitude',
        topic: 'Percentages & Arithmetic Reasoning',
        difficulty: 'Medium',
        questionCount: 15,
        company: targetCompany,
        role: targetRole,
        auto: true,
        source: 'roadmap',
      },
    },
    {
      id: `task_daily_interview_${effectiveId}`,
      title: `Simulate 1 Technical Mock Interview Round`,
      category: 'Interview',
      description: `Practice live verbal explanation and problem solving for ${targetRole}.`,
      isEvidenceBased: true,
      requiredCount: 1,
      currentCount: d4Count,
      unitLabel: 'Mock Rounds',
      progressPercentage: Math.min(100, Math.round((d4Count / 1) * 100)),
      evidenceStatusText: d4Count === 0 ? 'Not Started' : (d4Count >= 1 ? 'Completed' : 'In Progress'),
      completed: d4Count >= 1,
      estimatedMinutes: 25,
      priority: 'Medium',
      actionRoute: 'interview',
      actionParams: {
        role: targetRole,
        company: targetCompany,
      },
    },
  ];

  // 7. Generate Strategic AI Advice
  const aiAdvice = {
    summary: targetCompany
      ? `Your preparation is calibrated for ${targetCompany} (${targetRole}). Priority is to raise coding volume in ${topWeakCodingTopic} and solidify ${topWeakMcqSubject} fundamentals.`
      : `Your roadmap is optimized for a ${targetRole} position. Focus on transitioning your coding readiness from ${breakdown.coding.score}% to 75%+ while maintaining consistent weekly streaks.`,
    keyNextStep: `Start with Phase 1: Solve 2 problems in ${topWeakCodingTopic} and complete the ${topWeakMcqSubject} MCQ drill today.`,
    focusStrategy: companyProfile
      ? `${targetCompany} emphasizes ${companyProfile.hiringProcess[0]?.title || 'Online Assessment'} and ${companyProfile.hiringProcess[1]?.title || 'Coding Rounds'}. Prioritize speed in initial filtering rounds.`
      : `High-performing candidates focus 60% of their daily time on hands-on coding and 40% on core CS & aptitude drills.`,
  };

  return {
    studentId: effectiveId,
    targetRole,
    targetCompany,
    overallReadiness,
    readinessCategory,
    breakdown,
    strengths,
    weaknesses,
    phases,
    dailyTasks,
    aiAdvice,
    hasEnoughData,
    lastUpdated: new Date().toISOString(),
  };
}
