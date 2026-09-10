import { MentorStudentContext } from '../types/mentor';

export type AssistantContextCategory =
  | 'profile_skills'
  | 'readiness_metrics'
  | 'coding_performance'
  | 'resume_analysis'
  | 'placement_mcq'
  | 'interview_performance'
  | 'roadmap_tasks'
  | 'consistency';

export interface QueryIntentResult {
  intentType: 'GENERAL' | 'PERSONALIZED';
  requiresPersonalContext: boolean;
  requiredCategories: AssistantContextCategory[];
  reason: string;
}

export interface ScopedStudentContext {
  studentName?: string;
  targetRole?: string;
  targetCompany?: string;
  academicProfile?: {
    degree?: string;
    branch?: string;
    graduationYear?: string;
    cgpa?: number | string;
    college?: string;
  };
  declaredSkills?: string[];
  placementReadiness?: {
    overallScore: number | null;
    statusCategory: string;
    statusDescription?: string;
    weakestArea?: string;
    resumeScore?: number;
    codingScore?: number;
    interviewScore?: number;
    consistencyScore?: number;
    primaryRecommendation?: string;
  };
  resumeData?: {
    isAnalyzed: boolean;
    overallScore?: number;
    atsScore?: number;
    roleMatchScore?: number;
    detectedSkills?: string[];
    missingSkills?: string[];
    strengths?: string[];
    improvementSuggestions?: string[];
    experienceSummary?: string;
  };
  codingData?: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    totalAttempted: number;
    overallAccuracy: number;
    weakTopics: string[];
    strongTopics: string[];
    recentSubmissions?: Array<{
      problemTitle: string;
      difficulty: string;
      status: string;
      language: string;
    }>;
  };
  placementData?: {
    totalTests: number;
    totalQuestionsSolved: number;
    overallAccuracy: number;
    aptitudeAccuracy: number;
    technicalAccuracy: number;
    topicWeaknesses: string[];
    topicStrengths: string[];
  };
  interviewData?: {
    totalInterviews: number;
    averageScore: number;
    latestScore: number;
    latestRating: string;
    strengths: string[];
    areasForImprovement: string[];
  };
  roadmapData?: {
    isInitialized: boolean;
    currentPhase: string;
    completedMilestones: number;
    totalMilestones: number;
    pendingTasks: string[];
  };
  consistencyData?: {
    currentStreak: number;
    longestStreak: number;
    activeDaysLast14: number;
  };
}

/**
 * Intelligent, intent-aware query analyzer.
 * Evaluates semantic intent, reference grammar, and conversational context
 * WITHOUT any hardcoded question-specific keywords (e.g. no "linux", "react", "mini project" checks).
 */
export function analyzeAssistantQueryIntent(
  userQuery: string,
  history: Array<{ sender: 'user' | 'assistant' | 'mentor'; text: string }> = []
): QueryIntentResult {
  const query = (userQuery || '').trim();
  const lower = query.toLowerCase();

  // 1. Detect conversational context for short follow-ups (e.g. "What about hooks?", "Why?", "Explain more")
  const isShortFollowUp =
    query.split(/\s+/).length <= 4 &&
    !/\b(my|mine|i|me|am i|should i|my profile)\b/i.test(lower);

  if (isShortFollowUp && history.length > 0) {
    // Find the latest preceding substantive user message
    const previousUserMsgs = history
      .filter((m) => m.sender === 'user' && m.text.trim() !== query)
      .reverse();
    const lastUserQuery = previousUserMsgs[0]?.text?.trim() || '';

    if (lastUserQuery) {
      const parentIntent = analyzeAssistantQueryIntent(lastUserQuery, []);
      if (parentIntent.intentType === 'GENERAL') {
        return {
          intentType: 'GENERAL',
          requiresPersonalContext: false,
          requiredCategories: [],
          reason: `Conversational follow-up extending general discussion topic: "${lastUserQuery.slice(0, 40)}"`,
        };
      }
    }
  }

  // 2. Identify first-person / personal self-evaluation markers
  // Grammatical markers indicating the user is asking about THEMSELVES, THEIR performance, THEIR data, or asking for personalized advice.
  const hasFirstPersonPossessive = /\b(my|mine|our)\b/i.test(lower);
  const hasFirstPersonSelfQuery =
    /\b(am i|should i|can i|do i|how am i|where do i|what am i)\b/i.test(lower);
  const hasFirstPersonTargeting =
    /\b(for me|suggest to me|recommend to me|give me feedback on my|tell me my|evaluate me|assess me|analyze me|audit me|test me)\b/i.test(
      lower
    );
  const hasExplicitProfileReference =
    /\b(based on my profile|based on my skills|based on my resume|according to my|in my profile|from my profile|my preparation|my readiness|my weak areas|my weaknesses|my strengths|my score|my scores|my accuracy|my streak|my progress|my roadmap)\b/i.test(
      lower
    );

  // 3. Identify objective definitional, tutorial, conceptual or list question structures
  // e.g. "What is...", "Explain...", "How does ... work", "Difference between...", "Give me ideas for...", "What makes a..."
  const isObjectiveQuestionStructure =
    /^(what is|what are|explain|how does|how do|why is|why does|difference between|compare|pros and cons of|overview of|tutorial on|guide to|give me|list|suggest some|examples of|what makes a|how to implement|how to write|how to build|write a|create a)\b/i.test(
      lower
    );

  // If query is an objective conceptual question without personal possessives/profile references:
  // e.g. "What is a process in Linux?", "Explain normalization in DBMS", "What is React?",
  // "Give me Full Stack Development mini project ideas", "What is REST API", "How does JWT work",
  // "What skills are needed for a Full Stack Developer?", "What makes a resume ATS friendly?",
  // "How should I prepare for a technical interview?"
  const isPersonalizedRequest =
    hasExplicitProfileReference ||
    (hasFirstPersonPossessive && !/\b(in my opinion|my question is|my understanding is)\b/i.test(lower)) ||
    (hasFirstPersonSelfQuery && /\b(ready|improve|weak|strength|missing|score|progress|performing|practice|study|stand)\b/i.test(lower)) ||
    hasFirstPersonTargeting;

  if (!isPersonalizedRequest) {
    return {
      intentType: 'GENERAL',
      requiresPersonalContext: false,
      requiredCategories: [],
      reason: 'General inquiry that can be completely and accurately answered with authoritative general knowledge without personal metrics.',
    };
  }

  // 4. Query IS PERSONALIZED: Select ONLY the minimal relevant context categories
  const categories = new Set<AssistantContextCategory>();

  // A. Resume questions: "How can I improve my resume?", "What is my ATS score?", "Missing skills in my resume"
  if (/\b(resume|ats|cv|bullet points?|keyword match|resume score|ats score)\b/i.test(lower)) {
    categories.add('resume_analysis');
    categories.add('profile_skills'); // Target role context helps anchor resume advice
  }

  // B. Coding / DSA performance: "How am I performing in DSA?", "What are my weak areas in coding?", "Which coding topics should I practice?"
  if (/\b(dsa|coding|code|problem|problems|algorithm|algorithms|leetcode|data structures?|submissions?|runtime|accuracy in coding)\b/i.test(lower)) {
    categories.add('coding_performance');
  }

  // C. Placement tests / Aptitude / Technical MCQs: "How is my aptitude?", "My test scores", "Aptitude accuracy"
  if (/\b(aptitude|mcqs?|quiz|test scores?|placement test|technical test|quant|logical|verbal)\b/i.test(lower)) {
    categories.add('placement_mcq');
  }

  // D. Mock interviews: "How did I do in mock interviews?", "How can I improve my interview performance?", "My interview weak points"
  if (/\b(interview|mock interview|technical interview|hr interview|interviews)\b/i.test(lower)) {
    categories.add('interview_performance');
  }

  // E. Profile & Skills-tailored suggestions: "Based on my profile, suggest Full Stack projects", "What skills am I missing for my target role?"
  if (
    /\b(profile|skills|projects?|target role|target company|dream company|tech stack|techstack|experience|missing skills)\b/i.test(lower) ||
    hasExplicitProfileReference
  ) {
    categories.add('profile_skills');
  }

  // F. Roadmap & Today's Study Focus: "Which topic should I practice today?", "What should I study today?", "What is on my roadmap?"
  if (/\b(today|roadmap|schedule|daily tasks?|study plan|milestone|milestones|priority task)\b/i.test(lower)) {
    categories.add('roadmap_tasks');
    categories.add('coding_performance'); // Weak topics inform what to practice today
    categories.add('placement_mcq');
  }

  // G. Comprehensive Preparation & Overall Placement Readiness: "Analyze my preparation", "How can I improve my placement readiness?", "What are my weak areas?"
  if (
    /\b(preparation|readiness|placement readiness|overall progress|weak areas?|weaknesses|strengths|overall score|where do i stand|how ready am i|analyze my|audit my)\b/i.test(lower)
  ) {
    categories.add('readiness_metrics');
    categories.add('coding_performance');
    categories.add('placement_mcq');
    categories.add('resume_analysis');
    categories.add('interview_performance');
  }

  // H. Consistency / Streak: "What is my streak?", "How consistent have I been?"
  if (/\b(streak|consistency|active days?|daily streak)\b/i.test(lower)) {
    categories.add('consistency');
  }

  // Default fallback if personalized but no subcategory matched (e.g. "What should I do?"):
  // Provide profile and high-level readiness
  if (categories.size === 0) {
    categories.add('profile_skills');
    categories.add('readiness_metrics');
  }

  return {
    intentType: 'PERSONALIZED',
    requiresPersonalContext: true,
    requiredCategories: Array.from(categories),
    reason: `Personalized inquiry requiring scoped context: [${Array.from(categories).join(', ')}]`,
  };
}

/**
 * Extracts ONLY the requested context categories from the authoritative student context.
 * Irrelevant categories are strictly pruned so they are never provided to the model.
 */
export function buildScopedStudentContext(
  fullContext: MentorStudentContext | null | undefined,
  requiredCategories: AssistantContextCategory[]
): ScopedStudentContext {
  if (!fullContext || requiredCategories.length === 0) {
    return {};
  }

  const categorySet = new Set(requiredCategories);
  const scoped: ScopedStudentContext = {};

  // 1. Always include basic identity / goals if any personalization is active
  scoped.studentName = fullContext.studentName || 'Student';
  scoped.targetRole = fullContext.targetRole || 'Software Engineer';
  scoped.targetCompany = fullContext.targetCompany || 'Top Tech Companies';

  // 2. Profile & Skills
  if (categorySet.has('profile_skills')) {
    scoped.academicProfile = fullContext.academicProfile;
    scoped.declaredSkills = Array.isArray(fullContext.resumeData?.detectedSkills)
      ? fullContext.resumeData.detectedSkills
      : [];
  }

  // 3. Placement Readiness
  if (categorySet.has('readiness_metrics') && fullContext.placementReadiness) {
    scoped.placementReadiness = {
      overallScore: fullContext.placementReadiness.overallScore,
      statusCategory: fullContext.placementReadiness.statusCategory || 'In Progress',
      statusDescription: fullContext.placementReadiness.statusDescription,
      weakestArea: fullContext.placementReadiness.weakestArea,
      resumeScore: fullContext.placementReadiness.resumeScore,
      codingScore: fullContext.placementReadiness.codingScore,
      interviewScore: fullContext.placementReadiness.interviewScore,
      consistencyScore: fullContext.placementReadiness.consistencyScore,
      primaryRecommendation: fullContext.placementReadiness.primaryRecommendation,
    };
  }

  // 4. Resume Data
  if (categorySet.has('resume_analysis') && fullContext.resumeData) {
    scoped.resumeData = {
      isAnalyzed: Boolean(fullContext.resumeData.isAnalyzed),
      overallScore: fullContext.resumeData.overallScore,
      atsScore: fullContext.resumeData.atsScore,
      roleMatchScore: fullContext.resumeData.roleMatchScore,
      detectedSkills: fullContext.resumeData.detectedSkills || [],
      missingSkills: fullContext.resumeData.missingSkills || [],
      strengths: fullContext.resumeData.strengths || [],
      improvementSuggestions: fullContext.resumeData.improvementSuggestions || [],
      experienceSummary: fullContext.resumeData.experienceSummary,
    };
  }

  // 5. Coding Data
  if (categorySet.has('coding_performance') && fullContext.codingData) {
    scoped.codingData = {
      totalSolved: fullContext.codingData.totalSolved,
      easySolved: fullContext.codingData.easySolved,
      mediumSolved: fullContext.codingData.mediumSolved,
      hardSolved: fullContext.codingData.hardSolved,
      totalAttempted: fullContext.codingData.totalAttempted,
      overallAccuracy: fullContext.codingData.overallAccuracy,
      weakTopics: fullContext.codingData.weakTopics || [],
      strongTopics: fullContext.codingData.strongTopics || [],
      recentSubmissions: (fullContext.codingData.recentSubmissions || []).slice(0, 3).map((s) => ({
        problemTitle: s.problemTitle,
        difficulty: s.difficulty,
        status: s.status,
        language: s.language,
      })),
    };
  }

  // 6. Placement MCQ Data
  if (categorySet.has('placement_mcq') && fullContext.placementData) {
    scoped.placementData = {
      totalTests: fullContext.placementData.totalTests,
      totalQuestionsSolved: fullContext.placementData.totalQuestionsSolved,
      overallAccuracy: fullContext.placementData.overallAccuracy,
      aptitudeAccuracy: fullContext.placementData.aptitudeAccuracy,
      technicalAccuracy: fullContext.placementData.technicalAccuracy,
      topicWeaknesses: fullContext.placementData.topicWeaknesses || [],
      topicStrengths: fullContext.placementData.topicStrengths || [],
    };
  }

  // 7. Interview Data
  if (categorySet.has('interview_performance') && fullContext.interviewData) {
    scoped.interviewData = {
      totalInterviews: fullContext.interviewData.totalInterviews,
      averageScore: fullContext.interviewData.averageScore,
      latestScore: fullContext.interviewData.latestScore,
      latestRating: fullContext.interviewData.latestRating,
      strengths: fullContext.interviewData.strengths || [],
      areasForImprovement: fullContext.interviewData.areasForImprovement || [],
    };
  }

  // 8. Roadmap Data
  if (categorySet.has('roadmap_tasks') && fullContext.roadmapData) {
    scoped.roadmapData = {
      isInitialized: Boolean(fullContext.roadmapData.isInitialized),
      currentPhase: fullContext.roadmapData.currentPhase || 'Phase 1 — Foundations',
      completedMilestones: fullContext.roadmapData.completedMilestones || 0,
      totalMilestones: fullContext.roadmapData.totalMilestones || 16,
      pendingTasks: fullContext.roadmapData.pendingTasks || [],
    };
  }

  // 9. Consistency Data
  if (categorySet.has('consistency') && fullContext.consistencyData) {
    scoped.consistencyData = {
      currentStreak: fullContext.consistencyData.currentStreak || 0,
      longestStreak: fullContext.consistencyData.longestStreak || 0,
      activeDaysLast14: fullContext.consistencyData.activeDaysLast14 || 0,
    };
  }

  return scoped;
}
