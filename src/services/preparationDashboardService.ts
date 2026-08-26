import {
  PreparationDashboardData,
  ModuleProgressItem,
  TodayRecommendation,
  AIRecommendationRule,
} from '../types/preparationDashboard';
import { getPerformanceAnalyticsSummary } from './analyticsEngine';

/**
 * Service to aggregate, analyze, and compute real-time Placement Preparation Dashboard data
 * strictly from authentic student data via the canonical Analytics Engine.
 */
export async function getPreparationDashboardData(
  studentId: string = 'guest',
  profile?: any
): Promise<PreparationDashboardData> {
  const effectiveId = studentId || 'guest';
  const summary = await getPerformanceAnalyticsSummary(effectiveId, profile);

  // Student Profile preferences
  const targetRole = summary.targetRole;
  const codingLanguage = profile?.preferred_language || 'Python';
  const dsaProficiency = profile?.dsa_proficiency || 'Medium';

  // ----------------------------------------------------
  // 8 Canonical Modules
  // ----------------------------------------------------
  const modules: ModuleProgressItem[] = [
    // 1. Resume
    {
      id: 'mod-resume',
      name: 'Resume',
      category: 'resume',
      hasData: summary.resume.isAnalyzed,
      score: summary.resume.overallScore !== null ? summary.resume.overallScore : undefined,
      completedActivities: summary.resume.isAnalyzed ? 1 : 0,
      totalActivities: 1,
      unitLabel: 'versions',
      statusText: summary.resume.isAnalyzed
        ? `ATS: ${summary.resume.atsScore}/100 • Match: ${summary.resume.roleMatchScore}%`
        : 'Not enough data',
      statusType: summary.resume.isAnalyzed
        ? (summary.resume.atsScore || 0) >= 70
          ? 'success'
          : 'warning'
        : 'neutral',
      route: 'resume-analyzer',
      actionLabel: summary.resume.isAnalyzed ? 'Review ATS Score' : 'Analyze Resume',
      detailSummary: summary.resume.isAnalyzed
        ? `Targeting ${summary.resume.targetRole || targetRole}`
        : 'Upload PDF to evaluate keyword alignment & ATS compatibility',
    },

    // 2. Coding Arena
    {
      id: 'mod-coding',
      name: 'Coding',
      category: 'coding',
      hasData: summary.coding.hasData,
      score: summary.coding.accuracy,
      completedActivities: summary.coding.totalSolved,
      totalActivities: summary.coding.hasData ? summary.coding.totalAttempted : undefined,
      unitLabel: 'problems solved',
      statusText: summary.coding.hasData
        ? `${summary.coding.totalSolved} solved (${summary.coding.accuracy}% accuracy)`
        : 'Not enough data',
      statusType: summary.coding.hasData
        ? summary.coding.accuracy >= 70
          ? 'success'
          : summary.coding.accuracy >= 50
          ? 'info'
          : 'warning'
        : 'neutral',
      route: 'coding',
      actionLabel: 'Practice Coding',
      detailSummary: summary.coding.hasData
        ? `${summary.coding.totalAttempted} total submission attempts across DSA`
        : 'Solve problems in Arrays, Strings, Trees, and DP',
    },

    // 3. Aptitude & Placement MCQs
    {
      id: 'mod-aptitude',
      name: 'Aptitude',
      category: 'aptitude',
      hasData: summary.aptitude.hasData,
      score: summary.aptitude.accuracy,
      completedActivities: summary.aptitude.totalCorrect,
      totalActivities: summary.aptitude.hasData ? summary.aptitude.totalQuestionsSolved : undefined,
      unitLabel: 'questions solved',
      statusText: summary.aptitude.hasData
        ? `${summary.aptitude.totalCorrect} / ${summary.aptitude.totalQuestionsSolved} questions (${summary.aptitude.accuracy}%)`
        : 'Not enough data',
      statusType: summary.aptitude.hasData
        ? summary.aptitude.accuracy >= 70
          ? 'success'
          : summary.aptitude.accuracy >= 50
          ? 'info'
          : 'warning'
        : 'neutral',
      route: 'placement',
      actionLabel: 'Practice Aptitude',
      detailSummary: summary.aptitude.hasData
        ? `${summary.aptitude.totalTests} completed mock assessments`
        : 'Timed practice on Quantitative, Logical & Verbal reasoning',
    },

    // 4. Technical Interview
    {
      id: 'mod-tech-interview',
      name: 'Technical Interview',
      category: 'technical-interview',
      hasData: summary.technicalInterview.hasData,
      score: summary.technicalInterview.averageScore !== null ? summary.technicalInterview.averageScore : undefined,
      completedActivities: summary.technicalInterview.totalInterviews,
      unitLabel: 'interviews',
      statusText: summary.technicalInterview.hasData
        ? `${summary.technicalInterview.averageScore}% avg score (${summary.technicalInterview.totalInterviews} completed)`
        : 'Not enough data',
      statusType: summary.technicalInterview.hasData
        ? (summary.technicalInterview.averageScore || 0) >= 70
          ? 'success'
          : (summary.technicalInterview.averageScore || 0) >= 50
          ? 'info'
          : 'warning'
        : 'neutral',
      route: 'interview',
      actionLabel: 'Take Tech Interview',
      detailSummary: summary.technicalInterview.hasData
        ? `Latest: ${summary.technicalInterview.latestTopic || 'Technical Assessment'}`
        : 'Simulate full technical rounds with AI evaluator',
    },

    // 5. HR Interview
    {
      id: 'mod-hr-interview',
      name: 'HR Interview',
      category: 'hr-interview',
      hasData: summary.hrInterview.hasData,
      score: summary.hrInterview.averageScore !== null ? summary.hrInterview.averageScore : undefined,
      completedActivities: summary.hrInterview.totalInterviews,
      unitLabel: 'interviews',
      statusText: summary.hrInterview.hasData
        ? `${summary.hrInterview.averageScore}% avg score (${summary.hrInterview.totalInterviews} completed)`
        : 'Not enough data',
      statusType: summary.hrInterview.hasData
        ? (summary.hrInterview.averageScore || 0) >= 70
          ? 'success'
          : 'info'
        : 'neutral',
      route: 'interview',
      actionLabel: 'Take HR Interview',
      detailSummary: summary.hrInterview.hasData
        ? 'Behavioral, situational, and culture-fit assessments'
        : 'Practice behavioral, situational, and STAR method answers',
    },

    // 6. Company Preparation
    {
      id: 'mod-company-prep',
      name: 'Company Preparation',
      category: 'company-prep',
      hasData: summary.companyPrep.hasData,
      completedActivities: summary.companyPrep.totalTargets,
      unitLabel: 'target companies',
      statusText: summary.companyPrep.hasData
        ? `${summary.companyPrep.activeTargetCompany || summary.targetCompany} Target Active`
        : 'Not enough data',
      statusType: summary.companyPrep.hasData ? 'success' : 'neutral',
      route: 'company-prep',
      actionLabel: summary.companyPrep.hasData ? 'View Target Plan' : 'Select Target Company',
      detailSummary: summary.companyPrep.hasData
        ? `Target: ${summary.companyPrep.activeTargetCompany || summary.targetCompany}`
        : 'Benchmark yourself against Google, Amazon, TCS, Infosys hiring standards',
    },

    // 7. Career Roadmap
    {
      id: 'mod-roadmap',
      name: 'Roadmap',
      category: 'roadmap',
      hasData: summary.roadmap.hasData,
      score: summary.roadmap.progressPercentage !== null ? summary.roadmap.progressPercentage : undefined,
      completedActivities: summary.roadmap.completedTasksCount + summary.roadmap.completedMilestonesCount,
      totalActivities: summary.roadmap.totalTasksCount > 0 ? summary.roadmap.totalTasksCount : undefined,
      unitLabel: 'tasks completed',
      statusText: summary.roadmap.hasData
        ? `${summary.roadmap.completedTasksCount} / ${summary.roadmap.totalTasksCount || summary.roadmap.completedMilestonesCount} tasks`
        : 'Not enough data',
      statusType: summary.roadmap.hasData ? 'info' : 'neutral',
      route: 'roadmap?source=preparation-dashboard',
      actionLabel: 'View Roadmap',
      detailSummary: summary.roadmap.hasData
        ? `${summary.roadmap.completedTasksCount} daily goals accomplished`
        : 'Personalized step-by-step placement curriculum',
    },

    // 8. AI Mentor
    {
      id: 'mod-mentor',
      name: 'AI Mentor',
      category: 'mentor',
      hasData: summary.totalActivitiesCount > 0,
      completedActivities: summary.totalActivitiesCount,
      unitLabel: 'interactions',
      statusText: summary.totalActivitiesCount > 0 ? 'Active Guidance' : 'Not enough data',
      statusType: summary.totalActivitiesCount > 0 ? 'success' : 'neutral',
      route: 'career-mentor',
      actionLabel: 'Ask AI Mentor',
      detailSummary: '24/7 personalized placement strategy and career mentoring grounded in your analytics',
    },
  ];

  // ----------------------------------------------------
  // Today's Recommendations (Prioritized)
  // ----------------------------------------------------
  const todayRecommendations: TodayRecommendation[] = [];

  // Recommendation 1: Highest priority gap
  if (summary.weakAreas.length > 0) {
    const primaryWeak = summary.weakAreas[0];
    todayRecommendations.push({
      id: 'rec-weak-area',
      title: `Practice Weak Topic: ${primaryWeak.topic}`,
      description: `Your accuracy is ${primaryWeak.score}% across ${primaryWeak.totalAttempts} attempt(s). Closing this gap directly raises your readiness score.`,
      priority: 'high',
      category: primaryWeak.category,
      route: primaryWeak.actionRoute,
      actionLabel: primaryWeak.actionLabel,
      reason: `Accuracy is currently ${primaryWeak.score}%`,
      iconName: primaryWeak.category === 'DSA' ? 'Code2' : primaryWeak.category === 'Aptitude' ? 'Calculator' : 'Sparkles',
    });
  } else if (!summary.coding.hasData) {
    todayRecommendations.push({
      id: 'rec-start-coding',
      title: 'Complete First Coding Arena Challenge',
      description: `Solve 1-2 ${dsaProficiency} coding problems in ${codingLanguage} to establish your problem-solving benchmark.`,
      priority: 'high',
      category: 'DSA',
      route: 'coding',
      actionLabel: 'Start Coding',
      reason: 'No coding submissions recorded yet',
      iconName: 'Code2',
    });
  }

  // Recommendation 2: Resume
  if (!summary.resume.isAnalyzed) {
    todayRecommendations.push({
      id: 'rec-upload-resume',
      title: 'Analyze Resume ATS Compatibility',
      description: `Upload your resume to check keywords, formatting, and alignment for ${targetRole} positions.`,
      priority: 'high',
      category: 'Resume',
      route: 'resume-analyzer',
      actionLabel: 'Analyze Resume',
      reason: 'Resume accounts for 20% of your overall readiness score',
      iconName: 'FileText',
    });
  } else if ((summary.resume.atsScore || 0) < 70) {
    todayRecommendations.push({
      id: 'rec-optimize-resume',
      title: `Improve Resume ATS Score (${summary.resume.atsScore}/100)`,
      description: `Add suggested keywords and quantitative metrics to increase your shortlist rate for ${targetRole}.`,
      priority: 'medium',
      category: 'Resume',
      route: 'resume-analyzer',
      actionLabel: 'Review ATS Feedback',
      reason: `Current ATS score is ${summary.resume.atsScore}/100 (target: 75+)`,
      iconName: 'FileText',
    });
  }

  // Recommendation 3: Interview or Aptitude
  if (!summary.technicalInterview.hasData) {
    todayRecommendations.push({
      id: 'rec-mock-interview',
      title: `Take Mock Technical Interview for ${targetRole}`,
      description: `Simulate a full technical round in ${codingLanguage} to evaluate technical depth and verbal clarity.`,
      priority: 'medium',
      category: 'Interview',
      route: 'interview',
      actionLabel: 'Start Interview',
      reason: 'No technical mock interview reports recorded yet',
      iconName: 'Cpu',
    });
  } else if (!summary.aptitude.hasData) {
    todayRecommendations.push({
      id: 'rec-take-aptitude',
      title: 'Take Aptitude Practice Assessment',
      description: 'Test your quantitative aptitude, logical reasoning, and verbal ability speed.',
      priority: 'medium',
      category: 'Aptitude',
      route: 'placement',
      actionLabel: 'Start Test',
      reason: 'Aptitude tests are the first screening filter in 90% of campus placement drives',
      iconName: 'Calculator',
    });
  } else {
    todayRecommendations.push({
      id: 'rec-roadmap-step',
      title: 'Continue Daily Career Roadmap',
      description: `Complete today's scheduled curriculum tasks to maintain your ${summary.streakDays}-day streak.`,
      priority: 'low',
      category: 'Roadmap',
      route: 'roadmap?source=preparation-dashboard',
      actionLabel: 'View Schedule',
      reason: 'Consistent daily preparation builds long-term retention',
      iconName: 'Calendar',
    });
  }

  // ----------------------------------------------------
  // Dynamic AI Placement Recommendation
  // ----------------------------------------------------
  let aiRecommendation: AIRecommendationRule;

  if (!summary.hasEnoughDataForOverallScore) {
    aiRecommendation = {
      title: 'Start Your First Preparation Activity',
      priority: 'urgent',
      message: `Welcome to CareerPilot! Begin your placement preparation for ${targetRole} by completing your first baseline practice in ${codingLanguage}.`,
      actionRoute: 'coding',
      actionLabel: 'Start Preparing',
      bulletPoints: [
        `Solve 1-2 ${dsaProficiency} coding problems in ${codingLanguage} to establish your coding benchmark.`,
        'Upload your resume to get instant ATS scoring and keyword analysis.',
        'Take a 10-question aptitude assessment to measure quantitative speed.',
      ],
    };
  } else if (summary.weakAreas.length > 0 && summary.weakAreas[0].category === 'DSA') {
    const weakest = summary.weakAreas[0];
    aiRecommendation = {
      title: `Practice ${weakest.topic}`,
      priority: 'high',
      message: `Your accuracy in ${weakest.topic} is currently ${weakest.score}%. Solving targeted problems in ${codingLanguage} will strengthen your technical interview readiness for ${targetRole}.`,
      targetMetric: `${weakest.topic} (${weakest.score}%)`,
      actionRoute: 'coding',
      actionLabel: 'Practice Now',
      bulletPoints: [
        `Review core algorithmic patterns for ${weakest.topic} in ${codingLanguage}.`,
        'Solve 2 Easy and 1 Medium difficulty problem in the Coding Arena.',
        'Use the AI Coding Mentor panel for real-time complexity reviews and hint assistance.',
      ],
    };
  } else if (summary.weakAreas.length > 0 && summary.weakAreas[0].category === 'Aptitude') {
    const weakestApt = summary.weakAreas[0];
    aiRecommendation = {
      title: `Take an Aptitude Test — ${weakestApt.topic}`,
      priority: 'medium',
      message: `Your recent aptitude accuracy in ${weakestApt.topic} is ${weakestApt.score}%. Clearing placement screening cutoffs requires consistent speed and calculation accuracy.`,
      targetMetric: `${weakestApt.topic} (${weakestApt.score}%)`,
      actionRoute: 'placement',
      actionLabel: 'Start Test',
      bulletPoints: [
        `Attempt a 10-question practice set focused on ${weakestApt.topic}.`,
        'Focus on calculation shortcuts and time allocation per question.',
        'Aim for an accuracy rate above 75% to clear placement screening benchmarks.',
      ],
    };
  } else if (!summary.technicalInterview.hasData) {
    aiRecommendation = {
      title: `Practice Technical Interview for ${targetRole}`,
      priority: 'high',
      message: `You have active problem-solving practice, but have not yet completed a technical mock interview. Simulating a mock round in ${codingLanguage} evaluates verbalization depth.`,
      targetMetric: 'Technical Interview',
      actionRoute: 'interview',
      actionLabel: 'Start Interview',
      bulletPoints: [
        `Practice answering questions tailored to ${targetRole} and ${codingLanguage}.`,
        'Get evaluated on technical depth, problem-solving structure, and clarity.',
        'Receive concrete feedback on strengths and improvement areas.',
      ],
    };
  } else if (summary.technicalInterview.averageScore !== null && summary.technicalInterview.averageScore < 70) {
    aiRecommendation = {
      title: 'Practice Technical Interview',
      priority: 'high',
      message: `Your technical interview score is currently ${summary.technicalInterview.averageScore}/100. Practice explaining code step-by-step to improve communication ratings.`,
      targetMetric: `Interview: ${summary.technicalInterview.averageScore}%`,
      actionRoute: 'interview',
      actionLabel: 'Start Interview',
      bulletPoints: [
        'Review feedback on past mock interview sessions.',
        'Practice articulating your thought process before writing code.',
        'Retake a technical round to raise your evaluation score.',
      ],
    };
  } else if (!summary.resume.isAnalyzed) {
    aiRecommendation = {
      title: `Analyze Your Resume for ${targetRole}`,
      priority: 'high',
      message: `Your resume contributes 20% to your overall preparation readiness. Upload your resume to evaluate keyword match against ${targetRole} positions.`,
      targetMetric: 'Resume ATS',
      actionRoute: 'resume-analyzer',
      actionLabel: 'Analyze Resume',
      bulletPoints: [
        'Get evaluated against industry ATS parsing standards.',
        'Identify missing skills and crucial domain keywords.',
        'Receive actionable suggestions for bullet point formatting.',
      ],
    };
  } else if ((summary.resume.atsScore || 0) < 70) {
    aiRecommendation = {
      title: `Optimize Resume ATS Score (${summary.resume.atsScore}/100)`,
      priority: 'high',
      message: `Your ATS score is currently ${summary.resume.atsScore}/100. Updating your skills and project descriptions for ${targetRole} will raise your shortlist chances.`,
      targetMetric: `ATS: ${summary.resume.atsScore}/100`,
      actionRoute: 'resume-analyzer',
      actionLabel: 'Analyze Resume',
      bulletPoints: [
        `Incorporate recommended keywords for ${targetRole} roles.`,
        'Add quantitative impact metrics to your experience bullet points.',
        'Re-analyze your updated resume PDF to verify ATS score improvement.',
      ],
    };
  } else if (summary.overallScore && summary.overallScore >= 75) {
    aiRecommendation = {
      title: 'Target Company Benchmark Optimization',
      priority: 'info',
      message: `You have demonstrated strong readiness across coding, aptitude, and interview modules! Benchmark your preparation against ${summary.companyPrep.activeTargetCompany || 'Target Companies'}.`,
      targetMetric: `Readiness Score: ${summary.overallScore}/100`,
      actionRoute: 'company-prep',
      actionLabel: 'View Company Benchmark',
      bulletPoints: [
        `Benchmark your profile against ${summary.companyPrep.activeTargetCompany || 'Tier-1'} hiring patterns.`,
        'Practice company-specific interview question sets.',
        'Ask the AI Career Mentor for customized preparation strategies.',
      ],
    };
  } else {
    aiRecommendation = {
      title: 'Maintain Daily Preparation Consistency',
      priority: 'medium',
      message: `Consistent daily practice in ${codingLanguage} and aptitude will steadily raise your placement readiness score for ${targetRole}.`,
      actionRoute: 'coding',
      actionLabel: 'Practice Now',
      bulletPoints: [
        `Complete at least 1 coding problem in ${codingLanguage} daily.`,
        'Complete 5-10 aptitude questions to keep reasoning speed sharp.',
        'Track daily progress on your roadmap to stay on schedule.',
      ],
    };
  }

  const dashboardData: PreparationDashboardData = {
    studentName: summary.studentName,
    greeting: summary.greeting,
    targetRole: summary.targetRole,
    hasEnoughDataForOverallScore: summary.hasEnoughDataForOverallScore,
    overallScore: summary.overallScore,
    overallScoreCategory: summary.overallScoreCategory,
    overallScoreDescription: summary.overallScoreDescription,
    totalActivitiesCount: summary.totalActivitiesCount,
    streakDays: summary.streakDays,
    profileCompletion: summary.profileCompletion,
    modules,
    todayRecommendations,
    weakAreas: summary.weakAreas,
    strongAreas: summary.strongAreas,
    recentActivities: summary.recentActivities.slice(0, 15),
    aiRecommendation,
  };

  // Cache computed data for immediate, zero-latency subsequent loads
  try {
    const cacheKey = `careerpilot_dashboard_cache_${effectiveId}`;
    localStorage.setItem(cacheKey, JSON.stringify(dashboardData));
  } catch (_) {}

  return dashboardData;
}

/**
 * Retrieve cached Preparation Dashboard Data for instant, flicker-free rendering
 */
export function getCachedPreparationDashboardData(studentId: string = 'guest'): PreparationDashboardData | null {
  try {
    const effectiveId = studentId || 'guest';
    const cacheKey = `careerpilot_dashboard_cache_${effectiveId}`;
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_) {}
  return null;
}
