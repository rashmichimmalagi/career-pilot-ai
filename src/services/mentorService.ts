import {
  MentorMessage,
  MentorStudentContext,
  MentorApiResponse,
  MentorQuickAction,
  MentorActionLink,
} from '../types/mentor';
import { getPreparationDashboardData } from './preparationDashboardService';
import { resumeService } from './resumeService';
import { codingService } from './codingService';
import { getPlacementStats, getPlacementHistory } from './placementStorage';
import { interviewStorage } from './interviewStorage';
import { getStudentTargets, getActiveTargetId } from './companyPrepStorage';
import { getStoredDailyTasks, getCompletedItemIds } from './roadmapStorage';
import { calculateStreaks } from './achievementService';
import { resolveStudentCodingLanguage, getDailyStudyTime } from './studyPlannerService';
import { persistenceManager } from './persistenceManager';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

const CHAT_STORAGE_PREFIX = 'careerpilot_mentor_chat_';

export const MENTOR_QUICK_ACTIONS: MentorQuickAction[] = [
  {
    id: 'analyze_progress',
    title: 'Analyze My Progress',
    description: 'Comprehensive multi-dimensional evaluation of your placement readiness.',
    prompt: 'Can you analyze my overall placement progress, strengths, and areas needing attention across all modules?',
    icon: 'BarChart3',
    badge: 'Comprehensive',
    category: 'overview',
  },
  {
    id: 'today_practice',
    title: 'What Should I Practice Today?',
    description: 'Data-driven, prioritized daily action plan based on your weakest skills.',
    prompt: 'What specific topics and problems should I focus on practicing today to maximize my improvement?',
    icon: 'Sparkles',
    badge: 'Daily Focus',
    category: 'roadmap',
  },
  {
    id: 'weak_areas',
    title: 'Improve My Weak Areas',
    description: 'Targeted strategies and practice recommendations for your lowest-scoring topics.',
    prompt: 'Identify my biggest weak areas across coding, aptitude, and technical subjects, and give me a targeted, step-by-step strategy to improve them.',
    icon: 'Target',
    badge: 'Skill Gaps',
    category: 'overview',
  },
  {
    id: 'resume_advice',
    title: 'Review My Resume',
    description: 'Concrete suggestions based on your ATS score, matched keywords, and gaps.',
    prompt: 'Review my current resume analysis and give me concrete, actionable steps to boost my ATS score and role alignment.',
    icon: 'FileText',
    badge: 'Resume ATS',
    category: 'resume',
  },
  {
    id: 'company_readiness',
    title: 'Prepare for My Target Company',
    description: 'Compare your preparation metrics directly against company benchmarks.',
    prompt: 'Evaluate my readiness for my target company and target role. What critical gaps must I close before applying?',
    icon: 'Building2',
    badge: 'Company Fit',
    category: 'company',
  },
  {
    id: 'study_plan_7d',
    title: 'Create a Study Plan',
    description: 'Structured day-by-day roadmap targeting your authentic weak areas.',
    prompt: 'Generate a customized, high-impact 7-day placement preparation schedule customized to my weak topics and target role.',
    icon: 'Calendar',
    badge: 'Study Plan',
    category: 'roadmap',
  },
  {
    id: 'interview_boost',
    title: 'Improve My Interview Score',
    description: 'Actionable tips for technical problem explanation and interview performance.',
    prompt: 'Based on my mock technical interview history, what are my main communication and technical weak points, and how do I fix them?',
    icon: 'Cpu',
    badge: 'Mock Interview',
    category: 'interview',
  },
  {
    id: 'explain_readiness',
    title: 'Explain My Placement Readiness',
    description: 'Clear explanation of your 0-100 score, 4-pillar formula, and next milestone.',
    prompt: 'Explain how my placement readiness score is calculated, why I am at my current score, and what exact actions will move me to the next tier.',
    icon: 'Target',
    badge: 'Score Formula',
    category: 'overview',
  },
];

/**
 * Aggregates all real student data across CareerPilot modules for AI grounding.
 * Strictly uses ONE source of truth matching the Dashboard & Study Planner.
 */
export async function getAggregatedStudentContext(
  studentId: string = 'guest',
  profile?: any
): Promise<MentorStudentContext> {
  const effectiveId = studentId || 'guest';
  try {
    const [
      dashboardData,
      latestResumeAnalysis,
      codingSubmissions,
      placementStats,
      placementSessions,
      interviewReports,
      preferredLanguage,
    ] = await Promise.all([
      getPreparationDashboardData(effectiveId, profile),
      Promise.resolve(resumeService.getLatestAnalysis(effectiveId)),
      codingService.getSubmissions(effectiveId),
      Promise.resolve(getPlacementStats(effectiveId)),
      Promise.resolve(getPlacementHistory(effectiveId)),
      Promise.resolve(interviewStorage.getReports(effectiveId)),
      resolveStudentCodingLanguage(effectiveId, profile),
    ]);

    // Student Identity & Goals
    const studentName = profile?.full_name || dashboardData.studentName || 'Student';
    const targetRole = profile?.target_role || dashboardData.targetRole || latestResumeAnalysis?.targetRole || 'Software Developer';
    
    const companyTargets = getStudentTargets(effectiveId);
    const activeTargetId = getActiveTargetId(effectiveId);
    const activeTarget = companyTargets.find((t) => t.id === activeTargetId) || companyTargets[0];
    const targetCompany = activeTarget?.companyName || profile?.target_company || 'Top Tech Companies';

    // Academic Profile
    const academicProfile = {
      degree: profile?.degree || 'Bachelor of Technology',
      branch: profile?.branch || 'Computer Science & Engineering',
      graduationYear: profile?.graduation_year || '2025',
      cgpa: profile?.cgpa || undefined,
      college: profile?.college || undefined,
    };

    // Preparation Profile
    const preparationProfile = {
      preferredLanguage: preferredLanguage || 'Python',
      placementFocus: profile?.placement_focus || 'Campus Placements',
      dailyStudyTimeMinutes: getDailyStudyTime(effectiveId),
    };

    // Resume Data
    const isResumeAnalyzed = Boolean(latestResumeAnalysis && latestResumeAnalysis.result && typeof latestResumeAnalysis.result.overall_score === 'number');
    const resumeData = {
      isAnalyzed: isResumeAnalyzed,
      overallScore: isResumeAnalyzed ? latestResumeAnalysis?.result?.overall_score : undefined,
      atsScore: isResumeAnalyzed ? (latestResumeAnalysis?.result?.ats_score ?? latestResumeAnalysis?.result?.overall_score) : undefined,
      roleMatchScore: isResumeAnalyzed ? latestResumeAnalysis?.result?.role_match_score : undefined,
      detectedSkills: isResumeAnalyzed && Array.isArray(latestResumeAnalysis?.result?.keyword_analysis)
        ? latestResumeAnalysis!.result.keyword_analysis.filter((k: any) => k.matched).map((k: any) => k.keyword)
        : (Array.isArray(profile?.skills) ? profile.skills : []),
      strengths: isResumeAnalyzed ? (latestResumeAnalysis?.result?.strengths || []) : [],
      missingSkills: isResumeAnalyzed ? (latestResumeAnalysis?.result?.missing_skills || []) : [],
      improvementSuggestions: isResumeAnalyzed ? (latestResumeAnalysis?.result?.improvement_suggestions || []) : [],
      targetRole: latestResumeAnalysis?.targetRole || targetRole,
      experienceSummary: isResumeAnalyzed ? (latestResumeAnalysis?.result?.experience_summary || '') : '',
    };

    // Coding Breakdown
    const acceptedSubmissions = codingSubmissions.filter(
      (s) => s.status === 'accepted' || (s.test_cases_passed !== undefined && s.total_test_cases !== undefined && s.test_cases_passed === s.total_test_cases)
    );
    const uniqueSolvedProblemIds = new Set(acceptedSubmissions.map((s) => s.problem_id));
    const totalSolved = uniqueSolvedProblemIds.size;

    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;
    
    // Count difficulties of accepted unique problems
    const countedProblems = new Set<string>();
    acceptedSubmissions.forEach((sub) => {
      if (!countedProblems.has(sub.problem_id)) {
        countedProblems.add(sub.problem_id);
        const diff = (sub.difficulty || 'Medium').toLowerCase();
        if (diff.includes('easy')) easySolved++;
        else if (diff.includes('hard')) hardSolved++;
        else mediumSolved++;
      }
    });

    const totalAttempted = codingSubmissions.length;
    const overallAccuracy = totalAttempted > 0
      ? Math.round((acceptedSubmissions.length / totalAttempted) * 100)
      : 0;

    // Coding topics
    const codingTopicMap: Record<string, { attempted: number; passed: number }> = {};
    codingSubmissions.forEach((sub) => {
      const topic = sub.topic || sub.subject || 'General DSA';
      if (!codingTopicMap[topic]) codingTopicMap[topic] = { attempted: 0, passed: 0 };
      codingTopicMap[topic].attempted++;
      if (sub.status === 'accepted') codingTopicMap[topic].passed++;
    });

    const codingWeakTopics: string[] = [];
    const codingStrongTopics: string[] = [];
    const codingTopicsList = Object.entries(codingTopicMap).map(([topic, stats]) => {
      const acc = stats.attempted > 0 ? Math.round((stats.passed / stats.attempted) * 100) : 0;
      if (acc < 65 && stats.attempted >= 1) {
        codingWeakTopics.push(topic);
      } else if (acc >= 75 && stats.attempted >= 1) {
        codingStrongTopics.push(topic);
      }
      return {
        topic,
        solved: stats.passed,
        attempted: stats.attempted,
        accuracy: acc,
        category: 'DSA',
      };
    });

    const recentSubmissions = codingSubmissions.slice(0, 5).map((s) => ({
      problemTitle: s.problem_title || `Problem ${s.problem_id}`,
      difficulty: s.difficulty || 'Medium',
      status: s.status,
      language: s.language || 'Python',
      timestamp: s.created_at || new Date().toISOString(),
    }));

    // Placement MCQs
    const totalPlacementTests = placementStats.totalTests || 0;
    const totalPlacementQuestions = placementStats.totalQuestionsSolved || 0;
    const placementAccuracy = placementStats.overallAccuracy || 0;
    const aptitudeAccuracy = placementStats.aptitudeAccuracy || 0;
    const technicalAccuracy = placementStats.technicalAccuracy || 0;
    const perfectScoresCount = placementStats.perfectScoresCount || 0;

    const topicStrengths = dashboardData.strongAreas
      .filter((s) => s.category === 'Aptitude' || s.category === 'Technical')
      .map((s) => s.topic);
    const topicWeaknesses = dashboardData.weakAreas
      .filter((w) => w.category === 'Aptitude' || w.category === 'Technical')
      .map((w) => w.topic);

    // Interview data (all mock interviews in simulator)
    const technicalReports = interviewReports;
    const hrReports: typeof interviewReports = [];

    const totalInterviews = interviewReports.length;
    let avgInterviewScore = 0;
    let latestInterviewScore = 0;
    let latestRating = 'Not Attempted';
    let latestRole = targetRole;
    let interviewStrengths: string[] = [];
    let interviewImprovements: string[] = [];

    if (totalInterviews > 0) {
      const latest = interviewReports[0];
      latestInterviewScore = latest.overallScore || 0;
      latestRating = latest.verdict || 'Completed';
      latestRole = targetRole;
      interviewStrengths = latest.strengths || [];
      interviewImprovements = latest.areasForImprovement || [];

      const totalScore = interviewReports.reduce((acc, r) => acc + (r.overallScore || 0), 0);
      avgInterviewScore = Math.round(totalScore / totalInterviews);
    }

    // Roadmap data
    const dailyRoadmapTasks = getStoredDailyTasks(effectiveId) || [];
    const completedTasks = dailyRoadmapTasks.filter((t) => t.completed);
    const completedRoadmapItemIds = getCompletedItemIds(effectiveId) || [];
    const isRoadmapInitialized = dailyRoadmapTasks.length > 0 || completedRoadmapItemIds.length > 0;
    const totalRoadmapMilestones = 16;
    const completedMilestones = completedRoadmapItemIds.length;
    const roadmapProgressPercentage = isRoadmapInitialized
      ? Math.min(100, Math.round(((completedTasks.length + completedMilestones) / Math.max(1, dailyRoadmapTasks.length + totalRoadmapMilestones)) * 100))
      : 0;
    const pendingRoadmapTasks = dailyRoadmapTasks.filter((t) => !t.completed).map((t) => t.title).slice(0, 5);

    // Streaks
    const { currentStreak, longestStreak } = calculateStreaks(codingSubmissions, effectiveId);

    // Recent Activities
    const recentActivities = (dashboardData.recentActivities || []).slice(0, 8).map((act) => ({
      type: act.type,
      title: act.title,
      description: act.description,
      score: act.score,
      timestamp: act.timestamp,
    }));

    return {
      studentId: effectiveId,
      studentName,
      targetRole,
      targetCompany,
      academicProfile,
      preparationProfile,
      placementReadiness: {
        overallScore: dashboardData.overallScore,
        hasScore: dashboardData.hasEnoughDataForOverallScore,
        statusCategory: dashboardData.overallScoreCategory,
        statusDescription: dashboardData.overallScoreDescription,
        resumeScore: dashboardData.modules.find((m) => m.id === 'mod-resume')?.score,
        codingScore: dashboardData.modules.find((m) => m.id === 'mod-coding')?.score,
        interviewScore: dashboardData.modules.find((m) => m.id === 'mod-tech-interview')?.score,
        consistencyScore: Math.min(100, currentStreak * 20),
        weakestArea: dashboardData.aiRecommendation?.targetMetric || dashboardData.todayRecommendations?.[0]?.title || 'Getting Started',
        primaryRecommendation: dashboardData.aiRecommendation?.message || dashboardData.todayRecommendations?.[0]?.description || 'Complete more preparation activities across modules.',
        availableComponentsCount: dashboardData.modules.filter((m) => m.hasData).length,
      },
      resumeData,
      codingData: {
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        totalAttempted,
        overallAccuracy,
        weakTopics: codingWeakTopics.length > 0 ? codingWeakTopics : dashboardData.weakAreas.filter((w) => w.category === 'DSA').map((w) => w.topic),
        strongTopics: codingStrongTopics.length > 0 ? codingStrongTopics : dashboardData.strongAreas.filter((s) => s.category === 'DSA').map((s) => s.topic),
        topicsList: codingTopicsList,
        recentSubmissions,
      },
      placementData: {
        totalTests: totalPlacementTests,
        totalQuestionsSolved: totalPlacementQuestions,
        overallAccuracy: placementAccuracy,
        aptitudeAccuracy,
        technicalAccuracy,
        perfectScoresCount,
        topicStrengths,
        topicWeaknesses,
      },
      interviewData: {
        totalInterviews,
        totalTechnicalInterviews: technicalReports.length,
        totalHRInterviews: hrReports.length,
        averageScore: avgInterviewScore,
        latestScore: latestInterviewScore,
        latestRating,
        latestRole,
        strengths: interviewStrengths,
        areasForImprovement: interviewImprovements,
      },
      companyPrepData: {
        activeCompany: targetCompany,
        targetRole: activeTarget?.targetRole || targetRole,
        matchScore: dashboardData.overallScore ?? 0,
        totalCompletedItems: completedMilestones,
        checklistProgress: Math.min(100, Math.round((completedMilestones / 16) * 100)),
        isConfigured: Boolean(activeTarget),
      },
      roadmapData: {
        isInitialized: isRoadmapInitialized,
        currentPhase: completedMilestones > 8 ? 'Phase 3 — Placement Simulation' : (completedMilestones > 3 ? 'Phase 2 — Core Skills' : 'Phase 1 — Foundations'),
        completedTasks: completedTasks.length,
        totalTasks: dailyRoadmapTasks.length,
        completedMilestones,
        totalMilestones: totalRoadmapMilestones,
        progressPercentage: roadmapProgressPercentage,
        pendingTasks: pendingRoadmapTasks,
      },
      recentActivities,
      consistencyData: {
        currentStreak,
        longestStreak,
        activeDaysLast14: Math.min(14, currentStreak),
      },
    };
  } catch (err) {
    console.error('[MentorService] Error creating student context:', err);
    // Safe default context
    return {
      studentId: effectiveId,
      studentName: profile?.full_name || 'Student',
      targetRole: profile?.target_role || 'Software Developer',
      targetCompany: profile?.target_company || 'Top Tech Companies',
      academicProfile: {
        degree: profile?.degree || 'Bachelor of Technology',
        branch: profile?.branch || 'Computer Science & Engineering',
        graduationYear: profile?.graduation_year || '2025',
      },
      preparationProfile: {
        preferredLanguage: 'Python',
        placementFocus: 'Campus Placements',
        dailyStudyTimeMinutes: 60,
      },
      placementReadiness: {
        overallScore: null,
        hasScore: false,
        statusCategory: 'Getting Started',
        statusDescription: 'Begin your placement preparation across CareerPilot modules.',
        resumeScore: undefined,
        codingScore: undefined,
        interviewScore: undefined,
        consistencyScore: undefined,
        weakestArea: 'Getting Started',
        primaryRecommendation: 'Analyze your resume and solve your first coding problem.',
        availableComponentsCount: 0,
      },
      resumeData: { isAnalyzed: false, detectedSkills: [], strengths: [], missingSkills: [], improvementSuggestions: [] },
      codingData: { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, totalAttempted: 0, overallAccuracy: 0, weakTopics: [], strongTopics: [] },
      placementData: { totalTests: 0, totalQuestionsSolved: 0, overallAccuracy: 0, aptitudeAccuracy: 0, technicalAccuracy: 0, perfectScoresCount: 0, topicStrengths: [], topicWeaknesses: [] },
      interviewData: { totalInterviews: 0, totalTechnicalInterviews: 0, totalHRInterviews: 0, averageScore: 0, latestScore: 0, latestRating: 'Not Attempted', latestRole: 'Software Developer', strengths: [], areasForImprovement: [] },
      companyPrepData: { activeCompany: 'Target Company', targetRole: 'Software Developer', matchScore: 0, totalCompletedItems: 0, checklistProgress: 0, isConfigured: false },
      roadmapData: { isInitialized: false, currentPhase: 'Phase 1', completedTasks: 0, totalTasks: 0, completedMilestones: 0, totalMilestones: 16, progressPercentage: 0, pendingTasks: [] },
      recentActivities: [],
      consistencyData: { currentStreak: 0, longestStreak: 0, activeDaysLast14: 0 },
    };
  }
}


/**
 * Storage helpers for multi-student isolated chat histories
 */
export function getMentorChatHistory(studentId: string = 'guest'): MentorMessage[] {
  try {
    const raw = localStorage.getItem(`${CHAT_STORAGE_PREFIX}${studentId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[MentorService] Error reading chat history:', err);
    return [];
  }
}

export function saveMentorChatHistory(studentId: string = 'guest', messages: MentorMessage[]): void {
  try {
    const trimmed = messages.slice(-50); // Keep 50 recent messages
    localStorage.setItem(`${CHAT_STORAGE_PREFIX}${studentId}`, JSON.stringify(trimmed));
    if (studentId && studentId !== 'guest') {
      persistenceManager.saveMentorChatHistory(studentId, trimmed).catch(() => {});
    }
  } catch (err) {
    console.error('[MentorService] Error saving chat history:', err);
  }
}

export function clearMentorChatHistory(studentId: string = 'guest'): void {
  try {
    localStorage.removeItem(`${CHAT_STORAGE_PREFIX}${studentId}`);
    if (studentId && studentId !== 'guest') {
      persistenceManager.saveMentorChatHistory(studentId, []).catch(() => {});
    }
  } catch (err) {
    console.error('[MentorService] Error clearing chat history:', err);
  }
}

/**
 * Generates intelligent default action links based on user message and context
 */
export function deriveActionLinks(text: string, context: MentorStudentContext): MentorActionLink[] {
  const lower = text.toLowerCase();
  const links: MentorActionLink[] = [];

  if (lower.includes('resume') || lower.includes('ats') || lower.includes('bullet') || lower.includes('project')) {
    links.push({
      label: 'Improve Resume',
      route: 'resume-analyzer',
      icon: 'FileText',
      description: 'Upload or enhance resume with targeted ATS suggestions',
    });
  }

  if (lower.includes('coding') || lower.includes('dsa') || lower.includes('problem') || lower.includes('algorithm') || lower.includes('leetcode')) {
    links.push({
      label: 'Practice Coding',
      route: 'coding',
      icon: 'Code2',
      description: 'Solve Medium DSA problems in the Coding Arena',
    });
  }

  if (lower.includes('interview') || lower.includes('mock') || lower.includes('behavioral') || lower.includes('answer')) {
    links.push({
      label: 'Take Mock Interview',
      route: 'interview',
      icon: 'Cpu',
      description: 'Simulate full technical interviews with instant AI evaluation',
    });
  }

  if (lower.includes('mcq') || lower.includes('aptitude') || lower.includes('dbms') || lower.includes('os') || lower.includes('quant') || lower.includes('placement practice')) {
    links.push({
      label: 'Placement Practice',
      route: 'placement',
      icon: 'Brain',
      description: 'Sectional tests on Aptitude and Core CS MCQs',
    });
  }

  if (lower.includes('company') || lower.includes('target') || lower.includes('amazon') || lower.includes('google') || lower.includes('microsoft')) {
    links.push({
      label: 'Company Prep',
      route: 'company-prep',
      icon: 'Building2',
      description: `Track company-specific preparation for ${context.targetCompany || 'target companies'}`,
    });
  }

  if (lower.includes('roadmap') || lower.includes('study plan') || lower.includes('schedule') || lower.includes('milestone') || lower.includes('today')) {
    links.push({
      label: 'Career Roadmap',
      route: 'roadmap',
      icon: 'Map',
      description: 'View personalized 4-phase milestone journey',
    });
  }

  // Deduplicate by route
  const seenRoutes = new Set<string>();
  return links.filter((l) => {
    if (seenRoutes.has(l.route)) return false;
    seenRoutes.add(l.route);
    return true;
  }).slice(0, 3);
}

/**
 * Sends a message to the AI Career Mentor backend.
 */
export async function sendMentorMessage(
  studentContext: MentorStudentContext,
  messages: { sender: 'user' | 'mentor'; text: string }[],
  quickAction?: string
): Promise<{ reply: string; suggestedFollowUps: string[]; actionLinks: MentorActionLink[] }> {
  try {
    const response = await fetchWithTimeout('/api/career-mentor/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeoutMs: 12000,
      body: JSON.stringify({
        studentContext,
        messages,
        quickAction,
      }),
    });

    if (response.ok) {
      const data: MentorApiResponse = await response.json();
      if (data.success && data.data) {
        const reply = data.data.reply;
        const followUps = Array.isArray(data.data.suggestedFollowUps) && data.data.suggestedFollowUps.length > 0
          ? data.data.suggestedFollowUps
          : generateSmartFollowUps(reply, studentContext);
        const actionLinks = Array.isArray(data.data.actionLinks) && data.data.actionLinks.length > 0
          ? data.data.actionLinks
          : deriveActionLinks(reply, studentContext);

        return {
          reply,
          suggestedFollowUps: followUps,
          actionLinks,
        };
      }
    }
  } catch (err) {
    console.warn('[MentorService] Remote API error, generating local contextual response:', err);
  }

  // Deterministic local synthesis fallback
  const lastUserMsg = messages[messages.length - 1]?.text || '';
  const synthesized = synthesizeLocalMentorReply(lastUserMsg, studentContext, quickAction);
  const actionLinks = deriveActionLinks(synthesized.reply, studentContext);

  return {
    reply: synthesized.reply,
    suggestedFollowUps: synthesized.suggestedFollowUps,
    actionLinks,
  };
}

/**
 * Local Fallback Synthesis Engine when AI server is unreachable
 */
function synthesizeLocalMentorReply(
  userPrompt: string,
  ctx: MentorStudentContext,
  quickAction?: string
): { reply: string; suggestedFollowUps: string[] } {
  const name = ctx.studentName || 'there';
  const role = ctx.targetRole || 'Software Developer';
  const company = ctx.targetCompany || 'Top Tech Companies';
  const scoreText = ctx.placementReadiness.hasScore && ctx.placementReadiness.overallScore !== null
    ? `${ctx.placementReadiness.overallScore}/100 (${ctx.placementReadiness.statusCategory})`
    : 'Score not calculated yet (complete preparation activities across modules to generate your readiness score)';

  if (quickAction === 'analyze_progress' || userPrompt.toLowerCase().includes('progress')) {
    const resumeText = ctx.resumeData.isAnalyzed
      ? `ATS Score: ${ctx.resumeData.atsScore}/100 • Role Match: ${ctx.resumeData.roleMatchScore}/100`
      : 'Your resume has not been analyzed yet.';
    
    const codingText = ctx.codingData.totalSolved > 0
      ? `${ctx.codingData.totalSolved} problems solved (${ctx.codingData.easySolved} Easy, ${ctx.codingData.mediumSolved} Medium, ${ctx.codingData.hardSolved} Hard) with ${ctx.codingData.overallAccuracy}% accuracy across ${ctx.codingData.totalAttempted} attempts`
      : 'No coding problems solved yet.';

    const aptitudeText = ctx.placementData.totalTests > 0
      ? `${ctx.placementData.totalTests} tests completed (${ctx.placementData.totalQuestionsSolved} questions solved, ${ctx.placementData.overallAccuracy}% accuracy)`
      : 'No aptitude or technical tests completed yet.';

    const interviewText = ctx.interviewData.totalInterviews > 0
      ? `${ctx.interviewData.totalInterviews} interviews completed (${ctx.interviewData.totalTechnicalInterviews} Tech, ${ctx.interviewData.totalHRInterviews} HR) • Average Score: ${ctx.interviewData.averageScore}/100`
      : 'No mock interviews completed yet.';

    const roadmapText = ctx.roadmapData.isInitialized
      ? `${ctx.roadmapData.completedTasks} / ${ctx.roadmapData.totalTasks || 20} tasks completed (${ctx.roadmapData.progressPercentage}% progress)`
      : 'Your career roadmap has not been initialized yet.';

    return {
      reply: `### Authentic Placement Progress Analysis for ${name}

Targeting **${role}** at **${company}**:

* **Overall Preparation Score**: **${scoreText}**
* **Resume Status**: ${resumeText}
* **Coding Performance**: ${codingText}
* **Aptitude & Technical MCQs**: ${aptitudeText}
* **Mock Interviews**: ${interviewText}
* **Career Roadmap**: ${roadmapText}
* **Consistency Streak**: **${ctx.consistencyData.currentStreak} days**

#### Key Observations:
1. **Identified Strong Areas**: ${ctx.codingData.strongTopics.length > 0 ? ctx.codingData.strongTopics.join(', ') : (ctx.placementData.topicStrengths.length > 0 ? ctx.placementData.topicStrengths.join(', ') : 'Building initial activity data across modules')}
2. **Identified Focus Areas**: ${ctx.codingData.weakTopics.length > 0 ? ctx.codingData.weakTopics.join(', ') : (ctx.placementData.topicWeaknesses.length > 0 ? ctx.placementData.topicWeaknesses.join(', ') : 'Not enough activity data to evaluate weak topics yet')}
3. **Primary Action**: ${ctx.placementReadiness.primaryRecommendation}`,
      suggestedFollowUps: [
        'What should I practice today?',
        'How can I improve my resume?',
        'Am I ready for my target company?',
      ],
    };
  }

  if (quickAction === 'today_practice' || userPrompt.toLowerCase().includes('today')) {
    const dsaTopic = ctx.codingData.weakTopics[0] || (ctx.codingData.topicsList?.[0]?.topic) || 'Array & String manipulation';
    const mcqTopic = ctx.placementData.topicWeaknesses[0] || 'Core CS MCQs (DBMS / OS)';

    return {
      reply: `### Recommended Practice Plan for Today

Targeting **${role}** at **${company}** (Daily Budget: ${ctx.preparationProfile.dailyStudyTimeMinutes} mins in ${ctx.preparationProfile.preferredLanguage}):

1. **Coding Arena (${Math.round(ctx.preparationProfile.dailyStudyTimeMinutes * 0.5)} mins)**:
   - Practice problems in **${dsaTopic}** using ${ctx.preparationProfile.preferredLanguage}. Focus on explaining time and space complexity before coding.
2. **Placement Practice (${Math.round(ctx.preparationProfile.dailyStudyTimeMinutes * 0.3)} mins)**:
   - Complete 1 practice assessment in **${mcqTopic}** to solidify conceptual fundamentals.
3. **Target Alignment (${Math.round(ctx.preparationProfile.dailyStudyTimeMinutes * 0.2)} mins)**:
   - ${ctx.resumeData.isAnalyzed && ctx.resumeData.missingSkills.length > 0 ? `Review project bullets to ensure ${ctx.resumeData.missingSkills.slice(0, 2).join(' & ')} are clearly demonstrated.` : (ctx.resumeData.isAnalyzed ? 'Review your active roadmap milestone.' : 'Upload your resume to the Resume Analyzer to identify keyword gaps.')}

Maintaining this focus today will build upon your **${ctx.consistencyData.currentStreak}-day streak** and directly raise your preparation score.`,
      suggestedFollowUps: [
        'Create a 7-day study plan',
        'How do I improve my interview score?',
        'Explain my placement readiness',
      ],
    };
  }

  if (quickAction === 'resume_advice' || userPrompt.toLowerCase().includes('resume')) {
    if (!ctx.resumeData.isAnalyzed) {
      return {
        reply: `### Resume Review for ${role}

**Your resume has not been analyzed yet.**

To receive data-grounded ATS analysis and keyword gap suggestions:
1. Navigate to the **Resume Analyzer** in CareerPilot.
2. Upload your latest PDF resume targeting **${role}**.
3. CareerPilot will compute your exact ATS score, detected skills, and missing keyword suggestions without inventing data.`,
        suggestedFollowUps: [
          'What should I practice today?',
          'Analyze my overall progress',
          'Am I ready for my target company?',
        ],
      };
    }

    return {
      reply: `### Resume Analysis for ${role}

* **ATS Compatibility Score**: **${ctx.resumeData.atsScore}/100**
* **Role Match Score**: **${ctx.resumeData.roleMatchScore}/100**
* **Detected Skills**: ${ctx.resumeData.detectedSkills.length > 0 ? ctx.resumeData.detectedSkills.slice(0, 8).join(', ') : 'None extracted'}

#### Specific Gaps & Recommendations:
${ctx.resumeData.missingSkills.length > 0 ? `* **Missing Target Skills**: Add concrete project evidence for \`${ctx.resumeData.missingSkills.join('`, `')}\`.` : '* **ATS Formatting**: Maintain clean single-column hierarchy with standard headings.'}
${ctx.resumeData.improvementSuggestions.length > 0 ? ctx.resumeData.improvementSuggestions.map((s) => `* ${s}`).join('\n') : '* Use quantifiable metrics in every project bullet point (e.g. *Reduced latency by 35%*).' }`,
      suggestedFollowUps: [
        'How do I describe my projects better?',
        'What should I practice today?',
        'Am I ready for my target company?',
      ],
    };
  }

  return {
    reply: `### Career Mentor Guidance for ${name}

Regarding **${userPrompt.slice(0, 60)}**:

* **Authentic Profile Context**: Targeting **${role}** at **${company}**.
* **Overall Preparation Score**: **${scoreText}**.
* **Data-Grounded Recommendation**: ${ctx.placementReadiness.primaryRecommendation}

${!ctx.resumeData.isAnalyzed ? '\n*Note: Your resume has not been analyzed yet. Upload it to Resume Analyzer for precise ATS recommendations.*' : ''}
${!ctx.roadmapData.isInitialized ? '\n*Note: Your career roadmap has not been initialized yet.*' : ''}

Feel free to ask for specific advice on coding topics, interview strategies, or daily study plans!`,
    suggestedFollowUps: [
      'Analyze my overall progress',
      'What should I practice today?',
      'Create a 7-day study plan',
    ],
  };
}

function generateSmartFollowUps(reply: string, ctx: MentorStudentContext): string[] {
  const options = [
    'What should I practice today?',
    'How can I improve my resume?',
    'Am I ready for my target company?',
    'How do I improve my interview score?',
    'Generate a 7-day study plan',
    'Explain my placement readiness',
  ];
  return options.slice(0, 3);
}
