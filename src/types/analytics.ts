import { ProfileCompletionStatus } from '../services/profileService';
import { TopicInsightItem, RecentActivityItem } from './preparationDashboard';

export type PerformanceScoreCategory =
  | 'Highly Prepared'
  | 'Placement Ready'
  | 'Making Progress'
  | 'Building Foundations'
  | 'Getting Started';

export interface ImprovementTrendItem {
  topic: string;
  category: 'DSA' | 'Aptitude' | 'Technical' | 'HR' | 'Resume' | 'Consistency';
  trend: 'improving' | 'declining' | 'stable';
  changeDescription: string;
  currentScore: number;
  previousScore?: number;
}

export interface CodingPerformanceDetails {
  hasData: boolean;
  score: number | null; // 0-100 composite score or null
  accuracy: number; // 0-100%
  totalAttempted: number;
  totalSolved: number; // unique accepted problems
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  topicsCovered: string[];
  weakTopics: string[];
  strongTopics: string[];
  topicBreakdown: Record<string, { total: number; passed: number; accuracy: number; uniqueSolved?: number }>;
}

export interface AptitudePerformanceDetails {
  hasData: boolean;
  score: number | null; // 0-100 overall accuracy or null
  totalTests: number;
  totalQuestionsSolved: number;
  totalCorrect: number;
  accuracy: number;
  topicBreakdown: Record<string, { total: number; correct: number; accuracy: number }>;
  weakTopics: string[];
  strongTopics: string[];
}

export interface InterviewPerformanceDetails {
  hasData: boolean;
  score: number | null; // 0-100 or null
  totalInterviews: number;
  latestScore: number | null;
  averageScore: number | null;
  technicalKnowledgeScore: number | null;
  problemSolvingScore: number | null;
  communicationScore: number | null;
  weakAreas: string[];
  strongAreas: string[];
  latestCompletedAt?: string;
  latestSubject?: string;
  latestTopic?: string;
}

export interface HRInterviewPerformanceDetails {
  hasData: boolean;
  score: number | null; // 0-100 or null
  totalInterviews: number;
  latestScore: number | null;
  averageScore: number | null;
  behavioralScore: number | null;
  communicationScore: number | null;
  weakAreas: string[];
  strongAreas: string[];
  latestCompletedAt?: string;
}

export interface ResumePerformanceDetails {
  isAnalyzed: boolean;
  overallScore: number | null;
  atsScore: number | null;
  roleMatchScore: number | null;
  targetRole?: string;
  analyzedAt?: string;
  strengths: string[];
  missingSkills: string[];
  improvementSuggestions: string[];
}

export interface CompanyPrepPerformanceDetails {
  hasData: boolean;
  totalTargets: number;
  activeTargetCompany?: string;
  targetRole?: string;
  progressPercentage: number | null;
  matchScore: number | null;
}

export interface RoadmapPerformanceDetails {
  hasData: boolean;
  completedTasksCount: number;
  totalTasksCount: number;
  completedMilestonesCount: number;
  progressPercentage: number | null;
}

export interface PerformanceAnalyticsSummary {
  studentId: string;
  studentName: string;
  greeting: string;
  targetRole: string;
  targetCompany: string;
  calculatedAt: string;

  // Single canonical Overall Score
  overallScore: number | null;
  overallScoreCategory: PerformanceScoreCategory;
  overallScoreDescription: string;
  hasEnoughDataForOverallScore: boolean;

  // High-level aggregates
  totalActivitiesCount: number;
  streakDays: number;
  currentStreak: number;
  longestStreak: number;
  profileCompletion?: ProfileCompletionStatus;

  // Module breakdowns
  coding: CodingPerformanceDetails;
  aptitude: AptitudePerformanceDetails;
  technicalMcq: AptitudePerformanceDetails;
  technicalInterview: InterviewPerformanceDetails;
  hrInterview: HRInterviewPerformanceDetails;
  resume: ResumePerformanceDetails;
  companyPrep: CompanyPrepPerformanceDetails;
  roadmap: RoadmapPerformanceDetails;

  // Insights
  weakAreas: TopicInsightItem[];
  strongAreas: TopicInsightItem[];
  improvementTrends: ImprovementTrendItem[];
  recentActivities: RecentActivityItem[];
}
