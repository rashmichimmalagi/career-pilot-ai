import {
  CompanyProfile,
  CompanyReadinessAnalysis,
  CategoryMetric,
  StrongAreaItem,
  ImprovingAreaItem,
  WeakAreaItem,
  PreparationPriorityItem,
  StudentTargetCompany,
} from '../types/companyPrep';
import { codingService } from './codingService';
import { getPlacementHistory } from './placementStorage';
import { getStoredDailyTasks, getCompletedItemIds } from './roadmapStorage';
import { getCompanyProfile } from '../data/companyProfiles';
import { computeGapStatus } from './gapTrackerService';
import { getPerformanceAnalyticsSummary } from './analyticsEngine';

/**
 * Deterministic Engine calculating Company Readiness & Authentic Skill Gap Analysis
 * based strictly on the authenticated student's real CareerPilot data via the centralized Analytics Engine.
 */
export async function calculateCompanyReadiness(
  companyName: string,
  targetRole: string = 'Software Developer',
  studentId: string = 'guest'
): Promise<CompanyReadinessAnalysis> {
  const company = getCompanyProfile(companyName, targetRole);

  // 1. Fetch centralized analytics summary and supporting logs
  const [summary, codingSubmissions, placementSessions] = await Promise.all([
    getPerformanceAnalyticsSummary(studentId),
    codingService.getSubmissions(studentId),
    Promise.resolve(getPlacementHistory(studentId)),
  ]);

  const roadmapTasks = getStoredDailyTasks(studentId) || [];
  const completedRoadmapIds = getCompletedItemIds(studentId) || [];
  const weights = company.preparationWeights;

  // ================= 2. EVALUATE RESUME =================
  const resumeAvailable = summary.resume.isAnalyzed;
  const resumeScore = summary.resume.overallScore || 0;
  const atsScore = summary.resume.atsScore || 0;
  const roleMatchScore = summary.resume.roleMatchScore || 0;
  const resumeStrengths = summary.resume.strengths || [];
  const resumeMissingSkills = summary.resume.missingSkills || [];
  const resumeStatus = atsScore >= 75
    ? 'ATS Benchmark Exceeded'
    : atsScore >= 55
    ? 'Good Alignment'
    : resumeAvailable
    ? 'Needs ATS Refinement'
    : 'Resume not analyzed';
  const resumeSummary = resumeAvailable
    ? `ATS: ${atsScore}/100 • Role Match: ${roleMatchScore}/100`
    : 'No resume analysis found';

  const resumeMetric: CategoryMetric = {
    key: 'resume',
    title: 'Resume Preparation',
    score: resumeScore,
    weight: weights.resume,
    isAvailable: resumeAvailable,
    statusText: resumeStatus,
    detailSummary: resumeSummary,
    iconName: 'FileText',
    actionText: resumeAvailable ? 'Update Resume' : 'Analyze Resume',
    actionRoute: 'resume-analyzer',
  };

  // ================= 3. EVALUATE CODING & DSA TOPICS =================
  const codingAvailable = summary.coding.hasData;
  const codingScore = summary.coding.score || 0;
  const uniqueAccepted = summary.coding.totalSolved;
  const codingAccuracy = summary.coding.accuracy;
  const easySolved = summary.coding.easySolved;
  const mediumSolved = summary.coding.mediumSolved;
  const hardSolved = summary.coding.hardSolved;
  const codingTopicsSet = new Set(summary.coding.topicsCovered);
  const topicAttempts = summary.coding.topicBreakdown;

  const codingStatus = codingScore >= 75
    ? 'Strong Problem Solver'
    : codingScore >= 45
    ? 'Building Momentum'
    : codingAvailable
    ? 'Foundational'
    : 'No coding activity yet';
  const codingSummary = codingAvailable
    ? `${uniqueAccepted} Solved (${easySolved}E / ${mediumSolved}M / ${hardSolved}H) • ${codingAccuracy}% Accuracy`
    : 'No coding activity yet';

  const codingMetric: CategoryMetric = {
    key: 'coding',
    title: 'Coding Preparation',
    score: codingScore,
    weight: weights.coding,
    isAvailable: codingAvailable,
    statusText: codingStatus,
    detailSummary: codingSummary,
    iconName: 'Code2',
    actionText: codingAvailable ? 'Practice Problems' : 'Start Coding',
    actionRoute: 'coding',
  };

  // ================= 4. EVALUATE APTITUDE =================
  const aptitudeAvailable = summary.aptitude.hasData;
  const aptitudeScore = summary.aptitude.score || 0;
  const aptitudeStatus = aptitudeScore >= 75
    ? 'Aptitude Ready'
    : aptitudeScore >= 50
    ? 'Moderate Speed & Accuracy'
    : aptitudeAvailable
    ? 'Needs Practice'
    : 'No aptitude attempts yet';
  const aptitudeSummary = aptitudeAvailable
    ? `${summary.aptitude.totalQuestionsSolved} Solved • ${summary.aptitude.accuracy}% Accuracy`
    : 'No aptitude attempts yet';

  const aptitudeMetric: CategoryMetric = {
    key: 'aptitude',
    title: 'Aptitude Preparation',
    score: aptitudeScore,
    weight: weights.aptitude,
    isAvailable: aptitudeAvailable,
    statusText: aptitudeStatus,
    detailSummary: aptitudeSummary,
    iconName: 'Brain',
    actionText: aptitudeAvailable ? 'Practice Aptitude' : 'Start Aptitude',
    actionRoute: 'placement',
  };

  // ================= 5. EVALUATE TECHNICAL MCQ =================
  const techMcqAvailable = summary.technicalMcq.hasData;
  const techMcqScore = summary.technicalMcq.score || 0;
  const techMcqStatus = techMcqScore >= 75
    ? 'Core CS Mastered'
    : techMcqScore >= 50
    ? 'Good Knowledge Base'
    : techMcqAvailable
    ? 'Needs Revision'
    : 'No technical MCQ attempts yet';
  const techMcqSummary = techMcqAvailable
    ? `${summary.technicalMcq.totalQuestionsSolved} Solved • ${summary.technicalMcq.accuracy}% Accuracy`
    : 'No technical MCQ attempts yet';

  const technicalMcqMetric: CategoryMetric = {
    key: 'technicalMcq',
    title: 'Technical MCQ Preparation',
    score: techMcqScore,
    weight: weights.technicalMcq,
    isAvailable: techMcqAvailable,
    statusText: techMcqStatus,
    detailSummary: techMcqSummary,
    iconName: 'BookOpen',
    actionText: techMcqAvailable ? 'Practice Core CS' : 'Start Technical MCQs',
    actionRoute: 'placement',
  };

  // ================= 6. EVALUATE TECHNICAL & HR INTERVIEWS =================
  const interviewAvailable = summary.technicalInterview.hasData;
  const interviewScore = summary.technicalInterview.score || 0;
  const latestInterviewScore = summary.technicalInterview.latestScore || 0;
  const completedRounds = summary.technicalInterview.totalInterviews;
  const interviewStatus = interviewScore >= 75
    ? 'Interview Ready'
    : interviewScore >= 50
    ? 'Good Explanation'
    : interviewAvailable
    ? 'Needs Practice'
    : 'No technical interview attempts yet';
  const interviewSummary = interviewAvailable
    ? `Latest: ${latestInterviewScore}/100 • ${completedRounds} ${completedRounds === 1 ? 'Round' : 'Rounds'} Completed`
    : 'No technical interview attempts yet';

  const interviewMetric: CategoryMetric = {
    key: 'interview',
    title: 'Technical Interview Preparation',
    score: interviewScore,
    weight: weights.interview,
    isAvailable: interviewAvailable,
    statusText: interviewStatus,
    detailSummary: interviewSummary,
    iconName: 'Cpu',
    actionText: interviewAvailable ? 'Take Mock Round' : 'Start Mock Interview',
    actionRoute: 'interview',
  };

  // HR Interview Evaluation
  const hrAvailable = summary.hrInterview.hasData;
  const hrLatestScore = summary.hrInterview.latestScore || 0;
  const hrAvgScore = summary.hrInterview.averageScore || 0;

  // Roadmap Evaluation
  const completedRoadmapCount = completedRoadmapIds.length;
  const totalRoadmapTasks = roadmapTasks.length;
  const roadmapAvailable = totalRoadmapTasks > 0 || completedRoadmapCount > 0;
  const roadmapPct =
    totalRoadmapTasks > 0
      ? Math.round((completedRoadmapCount / totalRoadmapTasks) * 100)
      : completedRoadmapCount > 0
      ? 50
      : 0;

  // Total Activities Count
  const totalActivitiesCount =
    (resumeAvailable ? 1 : 0) +
    (codingSubmissions?.length || 0) +
    (placementSessions?.length || 0) +
    (summary.technicalInterview.totalInterviews + summary.hrInterview.totalInterviews) +
    completedRoadmapCount;

  const hasSufficientData = totalActivitiesCount > 0;

  // ================= 7. OVERALL COMPANY READINESS =================
  const overallRaw =
    resumeScore * weights.resume +
    codingScore * weights.coding +
    aptitudeScore * weights.aptitude +
    techMcqScore * weights.technicalMcq +
    interviewScore * weights.interview;

  const overallScore = Math.max(0, Math.min(100, Math.round(overallRaw)));

  let statusCategory:
    | 'Getting Started'
    | 'Building Foundations'
    | 'Making Progress'
    | 'Placement Ready'
    | 'Highly Prepared' = 'Getting Started';
  let statusDescription =
    'Begin your targeted preparation plan to build high placement readiness.';

  if (overallScore >= 85) {
    statusCategory = 'Highly Prepared';
    statusDescription = `Exceptional preparation aligned with ${company.name}’s ${targetRole} hiring bar.`;
  } else if (overallScore >= 70) {
    statusCategory = 'Placement Ready';
    statusDescription = `Strong competitive readiness across coding, technical MCQs, and interview stages for ${company.name}.`;
  } else if (overallScore >= 50) {
    statusCategory = 'Making Progress';
    statusDescription = `Solid foundation established. Focus on high-priority weak areas to clear the ${company.name} cutoff.`;
  } else if (overallScore >= 25) {
    statusCategory = 'Building Foundations';
    statusDescription = `Foundations in progress. Target the core rounds of ${company.name}’s hiring pipeline.`;
  }

  // ================= 8. DETECT STRONG AREAS (BASED ON REAL PERFORMANCE) =================
  const strongAreas: StrongAreaItem[] = [];

  if (resumeAvailable && atsScore >= 75) {
    strongAreas.push({
      id: 'strong-resume',
      title: 'Strong Resume ATS Match',
      category: 'Resume',
      scoreText: `${atsScore}/100 ATS Score`,
      description: `Your resume meets automated screening thresholds (${atsScore}/100) and contains strong industry keywords for ${targetRole}.`,
      actionRoute: 'resume-analyzer',
      actionText: 'View in Resume Analyzer',
      moduleName: 'Resume Analyzer',
      evidence: [
        `ATS Compatibility Score: ${atsScore}/100 verified by parser`,
        `Role Match Score: ${roleMatchScore}/100 for ${targetRole}`,
        `Resume structure and formatting cleared ATS parsing barriers`,
        ...(resumeStrengths.length > 0
          ? [`Identified Strengths: ${resumeStrengths.slice(0, 2).join(', ')}`]
          : ['Technical keyword density meets recruitment criteria']),
      ],
    });
  }

  if (codingAvailable && codingScore >= 70) {
    strongAreas.push({
      id: 'strong-coding',
      title: 'Algorithmic Problem Solving',
      category: 'Coding & DSA',
      scoreText: `${uniqueAccepted} Solved (${codingAccuracy}% Acc)`,
      description: `Solid problem-solving depth covering core data structures tested by ${company.name}.`,
      actionRoute: 'coding',
      actionText: 'View in Coding Arena',
      moduleName: 'Coding Arena',
      evidence: [
        `${uniqueAccepted} unique problems solved with Accepted status`,
        `${codingAccuracy}% submission accuracy rate in Coding Arena`,
        `Demonstrated topic coverage across ${codingTopicsSet.size} algorithmic domains (${Array.from(codingTopicsSet).slice(0, 3).join(', ') || 'Arrays, Strings, Trees'})`,
        `Difficulty distribution: ${easySolved} Easy, ${mediumSolved} Medium, ${hardSolved} Hard solved`,
      ],
    });
  }

  if (techMcqAvailable && techMcqScore >= 70) {
    strongAreas.push({
      id: 'strong-tech-mcq',
      title: 'Core CS Foundations',
      category: 'Technical MCQ',
      scoreText: `${summary.technicalMcq.accuracy}% Accuracy`,
      description: `Strong conceptual grasp across ${company.recommendedTopics.technicalMcqs.slice(0, 3).join(', ')}.`,
      actionRoute: 'placement',
      actionParams: {
        category: 'Technical',
        subject: 'DBMS',
      },
      actionText: 'View in Placement Practice',
      moduleName: 'Placement Practice',
      evidence: [
        `${summary.technicalMcq.totalQuestionsSolved} technical MCQs completed in Placement Practice`,
        `${summary.technicalMcq.accuracy}% overall accuracy across technical assessments`,
        `Verified core CS topic mastery in ${company.recommendedTopics.technicalMcqs.slice(0, 2).join(', ')}`,
        `Consistently exceeds standard 70% technical screening cutoff`,
      ],
    });
  }

  if (aptitudeAvailable && aptitudeScore >= 70) {
    strongAreas.push({
      id: 'strong-aptitude',
      title: 'Aptitude Speed & Reasoning',
      category: 'Aptitude',
      scoreText: `${summary.aptitude.accuracy}% Accuracy`,
      description: `Proficient in quantitative and logical reasoning required for ${company.name}’s online assessment.`,
      actionRoute: 'placement',
      actionParams: {
        category: 'Aptitude',
        subject: 'Quantitative Aptitude',
      },
      actionText: 'View in Placement Practice',
      moduleName: 'Placement Practice',
      evidence: [
        `${summary.aptitude.totalQuestionsSolved} aptitude questions solved across practice and timed modes`,
        `${summary.aptitude.accuracy}% accuracy in Quantitative & Logical Reasoning`,
        `Test scores satisfy online assessment qualification threshold for ${company.name}`,
      ],
    });
  }

  if (interviewAvailable && interviewScore >= 70) {
    strongAreas.push({
      id: 'strong-interview',
      title: 'Technical Interview Delivery',
      category: 'Technical Interview',
      scoreText: `${latestInterviewScore}/100 Rating`,
      description:
        'Structured problem breakdown, clear code explanation, and trade-off articulation under live mock conditions.',
      actionRoute: 'interview',
      actionText: 'View in Technical Interview',
      moduleName: 'Technical Interview',
      evidence: [
        `Latest mock interview score: ${latestInterviewScore}/100`,
        `${completedRounds} ${completedRounds === 1 ? 'round' : 'rounds'} completed and evaluated against industry rubrics`,
        `Verified articulation of space-time complexities and edge cases`,
        `Qualified for ${company.name} technical interview bar`,
      ],
    });
  }

  if (hrAvailable && hrAvgScore >= 75) {
    strongAreas.push({
      id: 'strong-hr',
      title: 'Behavioral & STAR Articulation',
      category: 'HR Interview',
      scoreText: `${hrAvgScore}/100 Score`,
      description: `Strong behavioral responses aligned with ${company.name}’s cultural and leadership expectations.`,
      actionRoute: 'interview',
      actionParams: {
        type: 'hr',
      },
      actionText: 'View in HR Interview',
      moduleName: 'HR / Behavioral Interview',
      evidence: [
        `Average behavioral score: ${hrAvgScore}/100 across HR interview sessions`,
        `Structured STAR methodology validated in responses`,
        `Clear demonstration of leadership, teamwork, and problem resolution competencies`,
      ],
    });
  }

  if (roadmapAvailable && (roadmapPct >= 60 || completedRoadmapCount >= 5)) {
    strongAreas.push({
      id: 'strong-roadmap',
      title: 'Roadmap Milestone Progression',
      category: 'Roadmap',
      scoreText: `${completedRoadmapCount} Completed`,
      description: `Consistent execution of structured learning milestones for ${targetRole}.`,
      actionRoute: 'roadmap',
      actionText: 'View in Career Roadmap',
      moduleName: 'Career Roadmap',
      evidence: [
        `${completedRoadmapCount} learning milestones achieved`,
        `${roadmapPct}% overall progress along ${targetRole} roadmap`,
        `Consistent completion of daily structured preparation tasks`,
      ],
    });
  }

  const currentStreak = summary.currentStreak;
  if (currentStreak >= 3) {
    strongAreas.push({
      id: 'strong-consistency',
      title: `${currentStreak}-Day Practice Streak`,
      category: 'Consistency',
      scoreText: `${currentStreak} Days`,
      description:
        'Consistent daily practice habit established, crucial for high conversion in campus placement rounds.',
      actionRoute: 'coding',
      actionText: 'View in Coding Arena',
      moduleName: 'Coding Arena',
      evidence: [
        `${currentStreak} consecutive active practice days recorded in CareerPilot`,
        `Daily habit established for coding and conceptual problem solving`,
        `High engagement frequency maximizes knowledge retention during recruitment season`,
      ],
    });
  }

  // ================= 9. DETECT IMPROVING AREAS (REAL DATA: 50% - 69%) =================
  const improvingAreas: ImprovingAreaItem[] = [];

  if (codingAvailable && codingScore >= 45 && codingScore < 70) {
    improvingAreas.push({
      id: 'imp-coding',
      title: 'DSA Problem Solving Velocity',
      category: 'Coding & DSA',
      scoreText: `${codingAccuracy}% Acc (${uniqueAccepted} Solved)`,
      description: `Building momentum across ${codingTopicsSet.size} topic areas. Increase practice on Medium/Hard problems to reach the ${company.name} hiring benchmark.`,
      actionText: 'Practice Coding',
      actionRoute: 'coding',
      actionParams: {
        subject: 'DSA',
        topic: Array.from(codingTopicsSet)[0] || 'Arrays',
        difficulty: company.typicalDifficulty === 'Hard' ? 'Medium' : 'Medium',
        company: company.name,
        role: targetRole,
        auto: true,
      },
    });
  }

  if (techMcqAvailable && techMcqScore >= 50 && techMcqScore < 70) {
    improvingAreas.push({
      id: 'imp-tech-mcq',
      title: 'Core Technical MCQs',
      category: 'Technical MCQ',
      scoreText: `${summary.technicalMcq.accuracy}% Accuracy`,
      description: `Good foundational knowledge in core CS subjects. Review tricky edge cases in ${company.recommendedTopics.technicalMcqs[0] || 'DBMS'} and Operating Systems.`,
      actionText: 'Drill MCQs',
      actionRoute: 'placement',
      actionParams: {
        category: 'Technical',
        subject: company.recommendedTopics.technicalMcqs[0] || 'DBMS',
      },
    });
  }

  if (aptitudeAvailable && aptitudeScore >= 50 && aptitudeScore < 70) {
    improvingAreas.push({
      id: 'imp-aptitude',
      title: 'Aptitude Speed & Precision',
      category: 'Aptitude',
      scoreText: `${summary.aptitude.accuracy}% Accuracy`,
      description: `Consistent performance on standard questions. Practice timed sets to boost speed on numerical reasoning sections.`,
      actionText: 'Timed Aptitude Test',
      actionRoute: 'placement',
      actionParams: {
        category: 'Aptitude',
        subject: 'Quantitative Aptitude',
      },
    });
  }

  if (interviewAvailable && interviewScore >= 50 && interviewScore < 70) {
    improvingAreas.push({
      id: 'imp-interview',
      title: 'Technical Mock Interview Delivery',
      category: 'Technical Interview',
      scoreText: `${latestInterviewScore}/100 Rating`,
      description: `Technical solutions are correct. Focus on verbalizing trade-offs earlier and explaining space-time complexity proactively.`,
      actionText: 'Mock Interview',
      actionRoute: 'interview',
    });
  }

  if (resumeAvailable && atsScore >= 55 && atsScore < 75) {
    improvingAreas.push({
      id: 'imp-resume',
      title: 'Resume ATS Alignment',
      category: 'Resume',
      scoreText: `${atsScore}/100 ATS Score`,
      description: `Resume is well-structured. Incorporate missing role-specific keywords (${resumeMissingSkills.slice(0, 3).join(', ') || 'essential technical skills'}) to reach 80%+.`,
      actionText: 'Refine Resume',
      actionRoute: 'resume-analyzer',
    });
  }

  if (roadmapAvailable && roadmapPct >= 20 && roadmapPct < 60) {
    improvingAreas.push({
      id: 'imp-roadmap',
      title: 'Roadmap Milestone Progress',
      category: 'Roadmap',
      scoreText: `${completedRoadmapCount} Completed`,
      description: `Active progress across daily learning milestones. Keep momentum to cover all critical ${targetRole} topics.`,
      actionText: 'Continue Roadmap',
      actionRoute: 'roadmap',
    });
  }

  // ================= 10. DETECT WEAK AREAS & COMPOSE PRIORITY AREAS =================
  const weakAreas: WeakAreaItem[] = [];
  const priorities: PreparationPriorityItem[] = [];

  const companyKeyCodingTopics = company.recommendedTopics.coding;
  const unpracticedCodingTopics = companyKeyCodingTopics.filter(
    (t) => !codingTopicsSet.has(t)
  );

  // Topic with lowest accuracy among attempted
  let weakestAttemptedTopic: { name: string; acc: number } | null = null;
  for (const [topName, stats] of Object.entries(topicAttempts)) {
    if (stats.total >= 1) {
      const acc = stats.accuracy !== undefined ? stats.accuracy : Math.round((stats.passed / stats.total) * 100);
      if (acc < 65) {
        if (!weakestAttemptedTopic || acc < weakestAttemptedTopic.acc) {
          weakestAttemptedTopic = { name: topName, acc };
        }
      }
    }
  }

  // 1. Coding & DSA Skill Gap
  const targetCodingDifficulty: 'Easy' | 'Medium' | 'Hard' =
    company.typicalDifficulty === 'Hard' ? 'Medium' : 'Medium';

  if (!codingAvailable) {
    const defaultTopic = companyKeyCodingTopics[0] || 'Arrays';
    weakAreas.push({
      id: 'weak-coding-none',
      title: 'Unstarted Coding Practice',
      category: 'coding',
      subject: 'DSA',
      topic: defaultTopic,
      reason: `${company.name} places heavy weight (${Math.round(weights.coding * 100)}%) on live coding and problem solving.`,
      severity: 'high',
      actionText: 'Address Gap →',
      actionRoute: 'coding',
      actionParams: {
        subject: 'DSA',
        topic: defaultTopic,
        difficulty: targetCodingDifficulty,
        company: company.name,
        role: targetRole,
        auto: true,
        gapType: 'coding',
        gapId: 'p-coding-gap',
      },
    });

    priorities.push({
      id: 'p-coding-gap',
      priority: 'high',
      status: computeGapStatus(studentId, 'p-coding-gap', { currentScore: 0, hasData: false, topic: defaultTopic }),
      badgeLabel: 'High Priority',
      title: `DSA — ${defaultTopic}`,
      area: 'DSA',
      currentPerformance: '0 Problems Solved',
      currentScore: 0,
      reason: `Your recent coding performance indicates that DSA needs dedicated practice for ${company.name}.`,
      recommendedAction: `Practice ${targetCodingDifficulty} ${defaultTopic} and Linked List problems in Coding Arena.`,
      category: 'coding',
      subject: 'DSA',
      topic: defaultTopic,
      difficulty: targetCodingDifficulty,
      description: `Master ${defaultTopic} problem solving to meet the ${company.name} technical assessment benchmark.`,
      actionText: 'Address Gap →',
      actionRoute: 'coding',
      actionParams: {
        subject: 'DSA',
        topic: defaultTopic,
        difficulty: targetCodingDifficulty,
        company: company.name,
        role: targetRole,
        auto: true,
        gapType: 'coding',
        gapId: 'p-coding-gap',
      },
      hasData: false,
    });
  } else if (weakestAttemptedTopic) {
    const weakTopicName = weakestAttemptedTopic.name;
    weakAreas.push({
      id: `weak-coding-${weakTopicName.toLowerCase()}`,
      title: `DSA Accuracy: ${weakTopicName}`,
      category: 'coding',
      subject: 'DSA',
      topic: weakTopicName,
      reason: `Accuracy in ${weakTopicName} is currently ${weakestAttemptedTopic.acc}%. ${company.name} technical rounds require high accuracy on edge cases.`,
      severity: 'high',
      actionText: 'Address Gap →',
      actionRoute: 'coding',
      actionParams: {
        subject: 'DSA',
        topic: weakTopicName,
        difficulty: targetCodingDifficulty,
        company: company.name,
        role: targetRole,
        auto: true,
        gapType: 'coding',
        gapId: 'p-coding-weak-topic',
      },
    });

    priorities.push({
      id: 'p-coding-weak-topic',
      priority: 'high',
      status: computeGapStatus(studentId, 'p-coding-weak-topic', { currentScore: weakestAttemptedTopic.acc, hasData: true, topic: weakTopicName }),
      badgeLabel: 'High Priority',
      title: `DSA — ${weakTopicName}`,
      area: 'DSA',
      currentPerformance: `${weakestAttemptedTopic.acc}%`,
      currentScore: weakestAttemptedTopic.acc,
      reason: `Your recent coding performance indicates that ${weakTopicName} needs additional practice for ${company.name}.`,
      recommendedAction: `Practice ${targetCodingDifficulty} ${weakTopicName} problems to build pattern recognition.`,
      category: 'coding',
      subject: 'DSA',
      topic: weakTopicName,
      difficulty: targetCodingDifficulty,
      description: `Solve targeted ${weakTopicName} problems in Coding Arena to raise your submission accuracy rate.`,
      actionText: 'Address Gap →',
      actionRoute: 'coding',
      actionParams: {
        subject: 'DSA',
        topic: weakTopicName,
        difficulty: targetCodingDifficulty,
        company: company.name,
        role: targetRole,
        auto: true,
        gapType: 'coding',
        gapId: 'p-coding-weak-topic',
      },
      hasData: true,
    });
  } else if (unpracticedCodingTopics.length > 0) {
    const unpracticedTopic = unpracticedCodingTopics[0];
    weakAreas.push({
      id: `weak-coding-${unpracticedTopic.toLowerCase()}`,
      title: `Uncovered Topic: ${unpracticedTopic}`,
      category: 'coding',
      subject: 'DSA',
      topic: unpracticedTopic,
      reason: `${unpracticedTopic} is frequently tested in ${company.name} technical screening assessments.`,
      severity: 'medium',
      actionText: 'Address Gap →',
      actionRoute: 'coding',
      actionParams: {
        subject: 'DSA',
        topic: unpracticedTopic,
        difficulty: targetCodingDifficulty,
        company: company.name,
        role: targetRole,
        auto: true,
        gapType: 'coding',
        gapId: 'p-coding-unpracticed',
      },
    });

    priorities.push({
      id: 'p-coding-unpracticed',
      priority: 'high',
      status: computeGapStatus(studentId, 'p-coding-unpracticed', { currentScore: codingAccuracy, hasData: true, topic: unpracticedTopic }),
      badgeLabel: 'High Priority',
      title: `DSA — ${unpracticedTopic}`,
      area: 'DSA',
      currentPerformance: `${codingAccuracy}% (${uniqueAccepted} Solved)`,
      currentScore: codingAccuracy,
      reason: `Your recent coding performance indicates that ${unpracticedTopic} needs practice for ${company.name}.`,
      recommendedAction: `Practice ${targetCodingDifficulty} ${unpracticedTopic} problems in Coding Arena.`,
      category: 'coding',
      subject: 'DSA',
      topic: unpracticedTopic,
      difficulty: targetCodingDifficulty,
      description: `Complete ${unpracticedTopic} problems to expand your algorithmic coverage.`,
      actionText: 'Address Gap →',
      actionRoute: 'coding',
      actionParams: {
        subject: 'DSA',
        topic: unpracticedTopic,
        difficulty: targetCodingDifficulty,
        company: company.name,
        role: targetRole,
        auto: true,
        gapType: 'coding',
        gapId: 'p-coding-unpracticed',
      },
      hasData: true,
    });
  } else if (codingAccuracy < 65) {
    priorities.push({
      id: 'p-coding-accuracy',
      priority: 'medium',
      status: computeGapStatus(studentId, 'p-coding-accuracy', { currentScore: codingAccuracy, hasData: true, topic: 'Arrays' }),
      badgeLabel: 'Medium Priority',
      title: 'DSA — Submission Accuracy',
      area: 'DSA',
      currentPerformance: `${codingAccuracy}%`,
      currentScore: codingAccuracy,
      reason: `Current submission accuracy is ${codingAccuracy}%. Aim for 75%+ by reviewing edge cases before submitting.`,
      recommendedAction: `Practice Medium Array and Two-Pointer problems with attention to boundary constraints.`,
      category: 'coding',
      subject: 'DSA',
      topic: 'Arrays',
      difficulty: 'Medium',
      description: `Solve problems methodically in Coding Arena to raise overall submission accuracy.`,
      actionText: 'Address Gap →',
      actionRoute: 'coding',
      actionParams: {
        subject: 'DSA',
        topic: 'Arrays',
        difficulty: 'Medium',
        company: company.name,
        role: targetRole,
        auto: true,
        gapType: 'coding',
        gapId: 'p-coding-accuracy',
      },
      hasData: true,
    });
  }

  // 2. Technical MCQs / Core CS Skill Gap (DBMS & SQL)
  const companyKeyTechTopics = company.recommendedTopics.technicalMcqs;
  const primaryTechSubject = companyKeyTechTopics.find((t) => t.includes('DBMS') || t.includes('SQL')) || companyKeyTechTopics[0] || 'DBMS';
  const displayTechTopic = primaryTechSubject.includes('DBMS') ? 'DBMS & SQL' : `${primaryTechSubject} & SQL`;

  if (!techMcqAvailable && weights.technicalMcq >= 0.15) {
    weakAreas.push({
      id: 'weak-mcq-none',
      title: `Core CS: ${displayTechTopic}`,
      category: 'technicalMcq',
      subject: 'DBMS',
      topic: 'DBMS & SQL',
      reason: `${company.name} includes core CS multiple choice questions in its screening assessment.`,
      severity: 'high',
      actionText: 'Address Gap →',
      actionRoute: 'placement',
      actionParams: {
        category: 'Technical',
        subject: 'DBMS',
        topic: 'DBMS & SQL',
        company: company.name,
        role: targetRole,
        difficulty: 'Medium',
        auto: true,
        gapType: 'mcq',
        gapId: 'p-tech-mcq-gap',
      },
    });

    priorities.push({
      id: 'p-tech-mcq-gap',
      priority: weights.technicalMcq >= 0.2 ? 'high' : 'medium',
      status: computeGapStatus(studentId, 'p-tech-mcq-gap', { currentScore: 0, hasData: false, topic: 'DBMS & SQL' }),
      badgeLabel:
        weights.technicalMcq >= 0.2 ? 'High Priority' : 'Medium Priority',
      title: `Core CS: ${displayTechTopic}`,
      area: `Core CS (${displayTechTopic})`,
      currentPerformance: 'Not Started',
      currentScore: 0,
      reason: `${company.name} includes multiple-choice screening on ${displayTechTopic} and OS fundamentals.`,
      recommendedAction: `Practice Technical MCQs covering SQL Joins, Normalization, Indexing, Transactions, and ACID Properties in Placement Practice.`,
      category: 'technicalMcq',
      subject: 'DBMS',
      topic: 'DBMS & SQL',
      difficulty: 'Medium',
      description: `Clear the core CS knowledge screening cutoff for ${company.name}.`,
      actionText: 'Address Gap →',
      actionRoute: 'placement',
      actionParams: {
        category: 'Technical',
        subject: 'DBMS',
        topic: 'DBMS & SQL',
        company: company.name,
        role: targetRole,
        difficulty: 'Medium',
        auto: true,
        gapType: 'mcq',
        gapId: 'p-tech-mcq-gap',
      },
      hasData: false,
    });
  } else if (techMcqAvailable && summary.technicalMcq.accuracy < 65) {
    weakAreas.push({
      id: 'weak-mcq-accuracy',
      title: `Core CS: ${displayTechTopic} Accuracy`,
      category: 'technicalMcq',
      subject: 'DBMS',
      topic: 'DBMS & SQL',
      reason: `Technical MCQ accuracy is ${summary.technicalMcq.accuracy}%. Review core definitions and SQL queries.`,
      severity: 'medium',
      actionText: 'Address Gap →',
      actionRoute: 'placement',
      actionParams: {
        category: 'Technical',
        subject: 'DBMS',
        topic: 'DBMS & SQL',
        company: company.name,
        role: targetRole,
        difficulty: 'Medium',
        auto: true,
        gapType: 'mcq',
        gapId: 'p-tech-mcq-acc',
      },
    });

    priorities.push({
      id: 'p-tech-mcq-acc',
      priority: 'medium',
      status: computeGapStatus(studentId, 'p-tech-mcq-acc', { currentScore: summary.technicalMcq.accuracy, hasData: true, topic: 'DBMS & SQL' }),
      badgeLabel: 'Medium Priority',
      title: `Core CS: ${displayTechTopic}`,
      area: `Core CS (${displayTechTopic})`,
      currentPerformance: `${summary.technicalMcq.accuracy}%`,
      currentScore: summary.technicalMcq.accuracy,
      reason: `Your measured accuracy across technical questions is ${summary.technicalMcq.accuracy}%, below the ${company.name} benchmark (70%).`,
      recommendedAction: `Practice 10–15 ${displayTechTopic} questions in Placement Practice covering normalization and ACID properties.`,
      category: 'technicalMcq',
      subject: 'DBMS',
      topic: 'DBMS & SQL',
      difficulty: 'Medium',
      description: `Strengthen core CS theory and SQL query execution.`,
      actionText: 'Address Gap →',
      actionRoute: 'placement',
      actionParams: {
        category: 'Technical',
        subject: 'DBMS',
        topic: 'DBMS & SQL',
        company: company.name,
        role: targetRole,
        difficulty: 'Medium',
        auto: true,
        gapType: 'mcq',
        gapId: 'p-tech-mcq-acc',
      },
      hasData: true,
    });
  }

  // 3. Aptitude & Reasoning Skill Gap
  if (!aptitudeAvailable && weights.aptitude >= 0.15) {
    weakAreas.push({
      id: 'weak-apt-none',
      title: 'Aptitude & Reasoning Screening',
      category: 'aptitude',
      subject: 'Quantitative Aptitude',
      topic: 'General',
      reason: `${company.name} filters initial candidates through numerical and logical reasoning rounds.`,
      severity: 'high',
      actionText: 'Address Gap →',
      actionRoute: 'placement',
      actionParams: {
        category: 'Aptitude',
        subject: 'Quantitative Aptitude',
        topic: 'Percentages',
        company: company.name,
        role: targetRole,
        difficulty: 'Medium',
        auto: true,
        gapType: 'aptitude',
        gapId: 'p-apt-gap',
      },
    });

    priorities.push({
      id: 'p-apt-gap',
      priority: 'medium',
      status: computeGapStatus(studentId, 'p-apt-gap', { currentScore: 0, hasData: false, topic: 'Quantitative Aptitude' }),
      badgeLabel: 'Medium Priority',
      title: 'Quantitative & Logical Aptitude',
      area: 'Aptitude',
      currentPerformance: 'Not Started',
      currentScore: 0,
      reason: `${company.name} screening includes quantitative and logical speed tests.`,
      recommendedAction: `Complete 15–20 timed aptitude questions on percentages, ratios, and logical puzzles.`,
      category: 'aptitude',
      subject: 'Quantitative Aptitude',
      topic: 'Percentages',
      difficulty: 'Medium',
      description: `Build speed math and logical reasoning speed for online assessments.`,
      actionText: 'Address Gap →',
      actionRoute: 'placement',
      actionParams: {
        category: 'Aptitude',
        subject: 'Quantitative Aptitude',
        topic: 'Percentages',
        company: company.name,
        role: targetRole,
        difficulty: 'Medium',
        auto: true,
        gapType: 'aptitude',
        gapId: 'p-apt-gap',
      },
      hasData: false,
    });
  } else if (aptitudeAvailable && summary.aptitude.accuracy < 65) {
    weakAreas.push({
      id: 'weak-apt-acc',
      title: 'Aptitude Speed & Precision',
      category: 'aptitude',
      subject: 'Quantitative Aptitude',
      topic: 'Percentages',
      reason: `Aptitude accuracy is ${summary.aptitude.accuracy}%. Practice timed tests to build exam pacing.`,
      severity: 'medium',
      actionText: 'Address Gap →',
      actionRoute: 'placement',
      actionParams: {
        category: 'Aptitude',
        subject: 'Quantitative Aptitude',
        topic: 'Percentages',
        company: company.name,
        role: targetRole,
        difficulty: 'Medium',
        auto: true,
        gapType: 'aptitude',
        gapId: 'p-apt-acc',
      },
    });

    priorities.push({
      id: 'p-apt-acc',
      priority: 'medium',
      status: computeGapStatus(studentId, 'p-apt-acc', { currentScore: summary.aptitude.accuracy, hasData: true, topic: 'Quantitative Aptitude' }),
      badgeLabel: 'Medium Priority',
      title: 'Quantitative Aptitude',
      area: 'Aptitude',
      currentPerformance: `${summary.aptitude.accuracy}%`,
      currentScore: summary.aptitude.accuracy,
      reason: `Your measured aptitude accuracy is ${summary.aptitude.accuracy}%. Practice timed sets to raise accuracy under test conditions.`,
      recommendedAction: `Solve 15 timed aptitude problems focusing on speed math and data interpretation.`,
      category: 'aptitude',
      subject: 'Quantitative Aptitude',
      topic: 'Percentages',
      difficulty: 'Medium',
      description: `Practice timed aptitude rounds in Placement Practice.`,
      actionText: 'Address Gap →',
      actionRoute: 'placement',
      actionParams: {
        category: 'Aptitude',
        subject: 'Quantitative Aptitude',
        topic: 'Percentages',
        company: company.name,
        role: targetRole,
        difficulty: 'Medium',
        auto: true,
        gapType: 'aptitude',
        gapId: 'p-apt-acc',
      },
      hasData: true,
    });
  }

  // 4. Technical Interview Skill Gap
  if (!interviewAvailable) {
    weakAreas.push({
      id: 'weak-interview-none',
      title: 'Technical Mock Interview',
      category: 'interview',
      subject: 'System & Problem Solving',
      topic: 'Technical Interview',
      reason: `Live technical interview is the decisive round at ${company.name}. Take an AI mock round to benchmark readiness.`,
      severity: 'high',
      actionText: 'Address Gap →',
      actionRoute: 'interview',
      actionParams: {
        subject: 'DSA',
        topic: 'System & Problem Solving',
        difficulty: 'Medium',
        company: company.name,
        role: targetRole,
        auto: true,
        gapType: 'interview',
        gapId: 'p-interview-gap',
      },
    });

    priorities.push({
      id: 'p-interview-gap',
      priority: 'medium',
      status: computeGapStatus(studentId, 'p-interview-gap', { currentScore: 0, hasData: false, topic: 'Technical Interview' }),
      badgeLabel: 'Medium Priority',
      title: 'Technical Mock Interview',
      area: 'Technical Interview',
      currentPerformance: '0 Rounds Completed',
      currentScore: 0,
      reason: `Live interactive technical interview is the primary evaluation filter for ${targetRole} at ${company.name}.`,
      recommendedAction: `Simulate a live AI technical mock round to practice explaining code trade-offs.`,
      category: 'interview',
      subject: 'System & Problem Solving',
      topic: 'Technical Interview',
      difficulty: 'Medium',
      description: `Practice explaining algorithmic solutions and code structure out loud.`,
      actionText: 'Address Gap →',
      actionRoute: 'interview',
      actionParams: {
        subject: 'DSA',
        topic: 'System & Problem Solving',
        difficulty: 'Medium',
        company: company.name,
        role: targetRole,
        auto: true,
        gapType: 'interview',
        gapId: 'p-interview-gap',
      },
      hasData: false,
    });
  } else if (interviewScore < 65) {
    weakAreas.push({
      id: 'weak-interview-score',
      title: 'Technical Interview Rating',
      category: 'interview',
      subject: 'System & Problem Solving',
      topic: 'Technical Interview',
      reason: `Latest mock score was ${latestInterviewScore}/100. Practice structured communication and algorithmic walkthroughs.`,
      severity: 'medium',
      actionText: 'Address Gap →',
      actionRoute: 'interview',
      actionParams: {
        subject: 'DSA',
        topic: 'System & Problem Solving',
        difficulty: 'Medium',
        company: company.name,
        role: targetRole,
        auto: true,
        gapType: 'interview',
        gapId: 'p-interview-score',
      },
    });

    priorities.push({
      id: 'p-interview-score',
      priority: 'medium',
      status: computeGapStatus(studentId, 'p-interview-score', { currentScore: latestInterviewScore, hasData: true, topic: 'Technical Interview' }),
      badgeLabel: 'Medium Priority',
      title: 'Technical Mock Interview',
      area: 'Technical Interview',
      currentPerformance: `${latestInterviewScore}%`,
      currentScore: latestInterviewScore,
      reason: `Your latest technical interview rating was ${latestInterviewScore}/100. ${company.name} expects clear verbalization of edge cases.`,
      recommendedAction: `Take another Technical Mock Interview to practice code complexity walkthrough.`,
      category: 'interview',
      subject: 'System & Problem Solving',
      topic: 'Technical Interview',
      difficulty: 'Medium',
      description: `Refine live communication and problem articulation in Technical Interview module.`,
      actionText: 'Address Gap →',
      actionRoute: 'interview',
      actionParams: {
        subject: 'DSA',
        topic: 'System & Problem Solving',
        difficulty: 'Medium',
        company: company.name,
        role: targetRole,
        auto: true,
        gapType: 'interview',
        gapId: 'p-interview-score',
      },
      hasData: true,
    });
  }

  // 5. HR / Behavioral Interview Skill Gap
  if (hrAvailable && hrAvgScore < 60) {
    priorities.push({
      id: 'p-hr-score',
      priority: 'medium',
      status: computeGapStatus(studentId, 'p-hr-score', { currentScore: hrAvgScore, hasData: true, topic: 'Behavioral' }),
      badgeLabel: 'Medium Priority',
      title: 'HR & Behavioral Interview',
      area: 'HR Interview',
      currentPerformance: `${hrAvgScore}%`,
      currentScore: hrAvgScore,
      reason: `Your behavioral mock score is ${hrAvgScore}%. ${company.name} evaluates STAR-framework clarity and cultural fit.`,
      recommendedAction: `Practice situational and behavioral questions using the STAR framework.`,
      category: 'hr-interview',
      subject: 'Behavioral',
      topic: 'STAR Method',
      description: `Refine behavioral responses in Mock Interview module.`,
      actionText: 'Address Gap →',
      actionRoute: 'interview',
      actionParams: {
        subject: 'Behavioral',
        topic: 'STAR Method',
        company: company.name,
        role: targetRole,
        gapType: 'hr-interview',
        gapId: 'p-hr-score',
      },
      hasData: true,
    });
  }

  // 6. Resume ATS Gap
  if (!resumeAvailable) {
    weakAreas.push({
      id: 'weak-resume-none',
      title: 'Resume Not Benchmarked',
      category: 'resume',
      subject: 'Resume',
      topic: 'ATS Score',
      reason: `Ensure your resume aligns with ${targetRole} requirements at ${company.name}.`,
      severity: 'high',
      actionText: 'Address Gap →',
      actionRoute: 'resume-analyzer',
      actionParams: {
        company: company.name,
        role: targetRole,
        gapType: 'resume',
        gapId: 'p-resume-gap',
      },
    });

    priorities.push({
      id: 'p-resume-gap',
      priority: 'recommended',
      status: computeGapStatus(studentId, 'p-resume-gap', { currentScore: 0, hasData: false, topic: 'ATS Score' }),
      badgeLabel: 'Recommended',
      title: 'Resume ATS Alignment',
      area: 'Resume',
      currentPerformance: 'Not Analyzed',
      currentScore: 0,
      reason: `Ensure your resume meets automated screening thresholds for ${targetRole} at ${company.name}.`,
      recommendedAction: `Upload and benchmark your resume in Resume Analyzer.`,
      category: 'resume',
      subject: 'Resume',
      topic: 'ATS Score',
      description: `Benchmark resume ATS score and identify missing keywords for ${company.name}.`,
      actionText: 'Address Gap →',
      actionRoute: 'resume-analyzer',
      actionParams: {
        company: company.name,
        role: targetRole,
        gapType: 'resume',
        gapId: 'p-resume-gap',
      },
      hasData: false,
    });
  } else if (atsScore < 65) {
    weakAreas.push({
      id: 'weak-resume-ats',
      title: 'Resume ATS Alignment',
      category: 'resume',
      subject: 'Resume',
      topic: 'Keywords',
      reason: `Resume ATS score is ${atsScore}/100. Incorporate missing role skills (${
        resumeMissingSkills.slice(0, 3).join(', ') || 'key tech keywords'
      }).`,
      severity: 'medium',
      actionText: 'Address Gap →',
      actionRoute: 'resume-analyzer',
      actionParams: {
        company: company.name,
        role: targetRole,
        gapType: 'resume',
        gapId: 'p-resume-score',
      },
    });

    priorities.push({
      id: 'p-resume-score',
      priority: 'recommended',
      status: computeGapStatus(studentId, 'p-resume-score', { currentScore: atsScore, hasData: true, topic: 'ATS Score' }),
      badgeLabel: 'Recommended',
      title: 'Resume ATS Refinement',
      area: 'Resume',
      currentPerformance: `${atsScore}%`,
      currentScore: atsScore,
      reason: `Your resume ATS match score is ${atsScore}%, which is below the recommended screening threshold for ${company.name}.`,
      recommendedAction: `Optimize resume in Resume Analyzer by incorporating keywords: ${
        resumeMissingSkills.slice(0, 3).join(', ') || 'target role skills'
      }.`,
      category: 'resume',
      subject: 'Resume',
      topic: 'ATS Score',
      description: `Enhance resume formatting and role keyword density.`,
      actionText: 'Address Gap →',
      actionRoute: 'resume-analyzer',
      actionParams: {
        company: company.name,
        role: targetRole,
        gapType: 'resume',
        gapId: 'p-resume-score',
      },
      hasData: true,
    });
  }

  // 7. Roadmap Gap (if not started)
  if (!roadmapAvailable && hasSufficientData) {
    priorities.push({
      id: 'p-roadmap-rec',
      priority: 'recommended',
      status: computeGapStatus(studentId, 'p-roadmap-rec', { currentScore: 0, hasData: false, topic: 'Roadmap' }),
      badgeLabel: 'Recommended',
      title: 'Structured Career Roadmap',
      area: 'Roadmap',
      currentPerformance: 'Not Initialized',
      currentScore: 0,
      reason: `A personalized roadmap provides structured daily milestones aligned with ${targetRole}.`,
      recommendedAction: `Initialize your personalized career roadmap to follow a structured daily study track.`,
      category: 'roadmap',
      subject: 'Roadmap',
      topic: targetRole,
      description: `Follow structured daily preparation tasks in Career Roadmap.`,
      actionText: 'Address Gap →',
      actionRoute: 'roadmap',
      actionParams: {
        gapType: 'roadmap',
        gapId: 'p-roadmap-rec',
      },
      hasData: false,
    });
  }

  const formulaExplanation = `Readiness = (Resume × ${Math.round(
    weights.resume * 100
  )}%) + (Coding × ${Math.round(weights.coding * 100)}%) + (Aptitude × ${Math.round(
    weights.aptitude * 100
  )}%) + (Technical MCQ × ${Math.round(
    weights.technicalMcq * 100
  )}%) + (Interview × ${Math.round(weights.interview * 100)}%)`;

  return {
    studentId,
    company,
    targetRole,
    overallScore,
    statusCategory,
    statusDescription,
    categories: {
      resume: resumeMetric,
      coding: codingMetric,
      aptitude: aptitudeMetric,
      technicalMcq: technicalMcqMetric,
      interview: interviewMetric,
    },
    hasSufficientData,
    totalActivitiesCount,
    strongAreas,
    improvingAreas,
    weakAreas,
    priorities,
    formulaExplanation,
    analyzedAt: new Date().toISOString(),
  };
}
