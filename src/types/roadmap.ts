import { CodingDifficulty, CodingLanguage, CodingSubject } from './coding';

export type PriorityLevel = 'High Priority' | 'Medium Priority' | 'Recommended' | 'Strong';
export type SkillStatus = 'Strong' | 'Maintain' | 'Needs Improvement';

export type RoadmapCategory = 'Coding' | 'Aptitude' | 'Technical MCQs' | 'Interview' | 'Resume' | 'Company Prep';

export interface RoadmapItem {
  id: string;
  area: RoadmapCategory;
  topic: string;
  subject?: string;
  currentPerformance: number; // 0 to 100
  targetPerformance: number; // e.g. 75 or 85
  priority: PriorityLevel;
  status: SkillStatus;
  recommendedAction: string;
  estimatedHours: number;
  difficulty?: CodingDifficulty;
  preferredLanguage?: CodingLanguage;

  // Evidence-based verification and progress tracking
  isEvidenceBased?: boolean;
  requiredCount?: number;
  currentCount?: number;
  unitLabel?: string; // e.g. 'Problems', 'Questions', 'Mock Rounds', 'Analysis', 'Target Locked'
  progressPercentage?: number;
  evidenceStatusText?: 'Not Started' | 'In Progress' | 'Completed';
  targetTopic?: string;
  targetSubject?: string;
  allowedDifficulties?: ('Easy' | 'Medium' | 'Hard')[];

  navigationTarget: {
    route: 'coding' | 'placement' | 'interview' | 'resume-analyzer' | 'company-prep';
    params?: {
      subject?: string;
      topic?: string;
      topics?: string[];
      category?: string;
      domain?: string;
      difficulty?: string;
      company?: string;
      role?: string;
      auto?: boolean;
      source?: string;
      roadmapItemId?: string;
      taskId?: string;
      questionCount?: number;
      count?: number;
      mode?: string;
    };
  };
  isCompleted?: boolean;
  completedAt?: string;
}

export interface RoadmapPhase {
  phaseNumber: number;
  title: string;
  subtitle: string;
  status: 'current' | 'upcoming' | 'completed';
  completionPercentage: number;
  items: RoadmapItem[];
}

export interface DailyRoadmapTask {
  id: string;
  title: string;
  category: RoadmapCategory;
  description: string;
  completed: boolean;
  completedAt?: string;
  estimatedMinutes: number;
  priority: 'High' | 'Medium' | 'Low';
  actionRoute: string;
  actionParams?: Record<string, any>;

  // Evidence-based verification and progress tracking
  isEvidenceBased?: boolean;
  requiredCount?: number;
  currentCount?: number;
  unitLabel?: string;
  progressPercentage?: number;
  evidenceStatusText?: 'Not Started' | 'In Progress' | 'Completed';
}

export interface PerformanceBreakdown {
  resume: {
    score: number;
    targetRole?: string;
    missingSkillsCount: number;
    status: SkillStatus;
    hasData: boolean;
  };
  coding: {
    score: number;
    solvedCount: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    accuracy: number;
    status: SkillStatus;
    hasData: boolean;
    weakTopics: string[];
    strongTopics: string[];
  };
  aptitude: {
    score: number;
    testsCompleted: number;
    accuracy: number;
    status: SkillStatus;
    hasData: boolean;
    weakTopics: string[];
    strongTopics: string[];
  };
  technicalMcqs: {
    score: number;
    testsCompleted: number;
    accuracy: number;
    status: SkillStatus;
    hasData: boolean;
    weakSubjects: string[];
    strongSubjects: string[];
  };
  interview: {
    score: number;
    sessionsCompleted: number;
    averageScore: number;
    status: SkillStatus;
    hasData: boolean;
    feedbackSummary?: string;
  };
  consistency: {
    currentStreak: number;
    totalActivityCount: number;
    consistencyScore: number;
  };
}

export interface CareerRoadmapAnalysis {
  studentId: string;
  targetRole: string;
  targetCompany?: string;
  overallReadiness: number; // 0 - 100
  readinessCategory: 'Not Ready' | 'Early Stage' | 'Building Foundation' | 'Interview Ready' | 'Highly Placement Ready';
  breakdown: PerformanceBreakdown;
  strengths: {
    title: string;
    category: RoadmapCategory;
    score: number;
    description: string;
  }[];
  weaknesses: {
    title: string;
    category: RoadmapCategory;
    score: number;
    description: string;
    urgency: 'Critical' | 'Moderate' | 'Minor';
  }[];
  phases: RoadmapPhase[];
  dailyTasks: DailyRoadmapTask[];
  aiAdvice?: {
    summary: string;
    keyNextStep: string;
    focusStrategy: string;
  };
  hasEnoughData: boolean;
  lastUpdated: string;
}
