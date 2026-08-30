export type TaskCategory =
  | 'coding'
  | 'aptitude'
  | 'interview'
  | 'hr-interview'
  | 'resume'
  | 'company-prep'
  | 'roadmap'
  | 'profile';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type TaskPriorityLevel = 'high' | 'medium' | 'low';

export interface StudyTask {
  id: string;
  title: string;
  topic?: string;
  description: string;
  reason: string; // The "Why:" explanation grounded in student data
  estimatedMinutes: number;
  difficulty: TaskDifficulty;
  category: TaskCategory;
  relatedModuleName?: string;
  route: string;
  actionLabel: string;
  status: TaskStatus;
  completedAt?: string;
  priorityLevel?: TaskPriorityLevel;
  isPriority?: boolean;
  targetTopic?: string;
  targetCompany?: string;
  targetLanguage?: string;
  // Explicit Evidence-Based Completion Criteria
  requiredCount?: number; // e.g. 2 for 2 problems, 1 for mock interview
  completedCount?: number; // Actual verified count completed from underlying module
  targetDifficulty?: string; // 'Beginner' | 'Intermediate' | 'Advanced'
  completionCriteria?: string; // Human-readable evidence requirement
  isVerifiable?: boolean; // Defaults to true for coding, aptitude, interview, resume, roadmap
}

export interface WeeklyGoal {
  id: string;
  category: TaskCategory;
  title: string;
  targetCount: number;
  completedCount: number;
  unit: string; // 'sessions', 'tests', 'problems', 'reviews'
  route: string;
}

export interface StudyPlanData {
  date: string; // YYYY-MM-DD
  studentId: string;
  dailyStudyTimeMinutes: number; // e.g. 30, 60, 90, 120, 180
  tasks: StudyTask[];
  weeklyGoals: WeeklyGoal[];
  priorityTaskId: string;
  aiSummary: string;
  recommendationNote?: string;
  streakDays: number;
  totalActivitiesCount: number;
  generatedAt: string;
  isAIGenerated: boolean;
}

export interface StudentStructuredContext {
  studentId: string;
  studentName: string;
  targetRole: string;
  preferredDomain?: string;
  targetCompanies: string[];
  preparationLevel: string;
  codingLanguage: string;
  dsaProficiency: string;
  interviewExperience: string;
  dailyStudyTimeMinutes: number;
  scores: {
    codingSolved: number;
    codingAccuracy: number;
    aptitudeSolved: number;
    aptitudeAccuracy: number;
    technicalInterviewAvg: number;
    hrInterviewAvg: number;
    resumeAtsScore: number;
    overallReadiness: number | null;
  };
  weakAreas: {
    topic: string;
    category: string;
    score: number;
  }[];
  strongAreas: {
    topic: string;
    category: string;
    score: number;
  }[];
  recentActivitySummary: string[];
  roadmapProgress: {
    isInitialized?: boolean;
    totalTasks: number;
    completedTasks: number;
    nextTaskTitle?: string;
    nextTaskTopic?: string;
  };
  hasMeasuredData?: {
    hasOsRecord?: boolean;
    osScore?: number;
    hasArrayRecord?: boolean;
    arrayScore?: number;
  };
  profileCompletionPct: number;
  totalActivitiesCount: number;
}
