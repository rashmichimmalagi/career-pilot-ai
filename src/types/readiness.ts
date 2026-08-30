export type ReadinessStatusCategory =
  | 'Getting Started'
  | 'Building Foundations'
  | 'Making Progress'
  | 'Placement Ready'
  | 'Highly Prepared';

export interface ComponentReadinessStatus {
  isAvailable: boolean;
  score: number; // 0-100
  weight: number; // e.g. 0.25
  weightedContribution: number; // score * weight
  summary: string;
}

export interface ResumeReadinessDetails extends ComponentReadinessStatus {
  atsScore: number;
  roleMatchScore: number;
  overallResumeScore: number;
  targetRole?: string;
  analyzedAt?: string;
  strengths?: string[];
  missingSkills?: string[];
}

export interface CodingReadinessDetails extends ComponentReadinessStatus {
  uniqueAcceptedProblems: number;
  totalSubmissions: number;
  accuracyRate: number; // percentage 0-100
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  topicsCovered: string[];
  weakTopics: string[];
  subjectBreakdown: Record<string, number>;
}

export interface InterviewReadinessDetails extends ComponentReadinessStatus {
  completedRounds: number;
  latestScore: number;
  averageScore: number;
  technicalKnowledgeScore: number;
  problemSolvingScore: number;
  communicationScore: number;
  latestCompletedAt?: string;
  latestSubject?: string;
  latestTopic?: string;
  areasForImprovement?: string[];
}

export interface ConsistencyReadinessDetails extends ComponentReadinessStatus {
  currentStreak: number; // consecutive practice days
  longestStreak: number; // historical peak
  recentActiveDays14: number; // active days in last 14 days
  uniquePracticeDatesCount: number;
  lastPracticeDate?: string;
}

export type ReadinessComponentKey = 'resume' | 'coding' | 'technicalInterview' | 'consistency';

export interface ReadinessRecommendation {
  componentKey: ReadinessComponentKey;
  componentTitle: string;
  currentScore: number;
  headline: string;
  recommendedAction: string;
  actionButtonText: string;
  actionRoute: string; // e.g. 'coding' | 'interview' | 'resume-analyzer'
}

export interface PlacementReadinessReport {
  studentId: string;
  overallScore: number; // 0 - 100
  statusCategory: ReadinessStatusCategory;
  statusDescription: string;
  statusBadgeColor: {
    bg: string;
    text: string;
    border: string;
    ring: string;
  };
  weights: {
    resume: number;
    coding: number;
    technicalInterview: number;
    aptitude?: number;
    roadmap?: number;
    consistency?: number;
  };
  components: {
    resume: ResumeReadinessDetails;
    coding: CodingReadinessDetails;
    technicalInterview: InterviewReadinessDetails;
    consistency: ConsistencyReadinessDetails;
  };
  recommendation: ReadinessRecommendation;
  availableComponentsCount: number;
  formulaExplanation: string;
  calculatedAt: string;
}
