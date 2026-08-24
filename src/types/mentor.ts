export interface MentorActionLink {
  label: string;
  route: string;
  icon?: string;
  description?: string;
}

export interface MentorMessage {
  id: string;
  sender: 'user' | 'mentor';
  text: string;
  timestamp: string;
  suggestedFollowUps?: string[];
  actionLinks?: MentorActionLink[];
  quickActionUsed?: string;
}

export interface MentorQuickAction {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: string;
  badge?: string;
  category: 'overview' | 'resume' | 'coding' | 'interview' | 'company' | 'roadmap';
}

export interface MentorTopicItem {
  topic: string;
  solved?: number;
  attempted: number;
  accuracy: number;
  category?: string;
}

export interface MentorStudentContext {
  studentId: string;
  studentName: string;
  targetRole: string;
  targetCompany: string;
  
  academicProfile: {
    degree?: string;
    branch?: string;
    graduationYear?: string;
    cgpa?: string | number;
    college?: string;
  };

  preparationProfile: {
    preferredLanguage: string;
    placementFocus: string;
    dailyStudyTimeMinutes: number;
  };

  placementReadiness: {
    overallScore: number | null;
    hasScore: boolean;
    statusCategory: string;
    statusDescription: string;
    resumeScore?: number;
    codingScore?: number;
    interviewScore?: number;
    consistencyScore?: number;
    weakestArea: string;
    primaryRecommendation: string;
    availableComponentsCount: number;
  };

  resumeData: {
    isAnalyzed: boolean;
    overallScore?: number;
    atsScore?: number;
    roleMatchScore?: number;
    detectedSkills: string[];
    strengths: string[];
    missingSkills: string[];
    improvementSuggestions: string[];
    targetRole?: string;
    experienceSummary?: string;
  };

  codingData: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    totalAttempted: number;
    overallAccuracy: number;
    weakTopics: string[];
    strongTopics: string[];
    topicsList?: MentorTopicItem[];
    recentSubmissions?: Array<{
      problemTitle: string;
      difficulty: string;
      status: string;
      language: string;
      timestamp: string;
    }>;
  };

  placementData: {
    totalTests: number;
    totalQuestionsSolved: number;
    overallAccuracy: number;
    aptitudeAccuracy: number;
    technicalAccuracy: number;
    perfectScoresCount: number;
    topicStrengths: string[];
    topicWeaknesses: string[];
  };

  interviewData: {
    totalInterviews: number;
    totalTechnicalInterviews: number;
    totalHRInterviews: number;
    averageScore: number;
    latestScore: number;
    latestRating: string;
    latestRole: string;
    strengths: string[];
    areasForImprovement: string[];
  };

  companyPrepData: {
    activeCompany: string;
    targetRole: string;
    matchScore: number;
    totalCompletedItems: number;
    checklistProgress: number;
    isConfigured: boolean;
  };

  roadmapData: {
    isInitialized: boolean;
    currentPhase: string;
    completedTasks: number;
    totalTasks: number;
    completedMilestones: number;
    totalMilestones: number;
    progressPercentage: number;
    pendingTasks: string[];
  };

  recentActivities: Array<{
    type: string;
    title: string;
    description: string;
    score?: number;
    timestamp: string;
  }>;

  consistencyData: {
    currentStreak: number;
    longestStreak: number;
    activeDaysLast14: number;
  };
}

export interface MentorApiResponse {
  success: boolean;
  message?: string;
  data?: {
    reply: string;
    suggestedFollowUps?: string[];
    actionLinks?: MentorActionLink[];
  };
  error?: string;
}

