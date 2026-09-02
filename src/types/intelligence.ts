/**
 * CareerPilot AI - Career Intelligence Suite Type Definitions
 * Unified domain models for the 10 integrated career intelligence capabilities.
 */

import { CodingSubmission } from './coding';
import { MockInterviewReport } from './interview';
import { ResumeAnalysisResult, ResumeVersionItem } from './resume';
import { PlacementTestSession } from './placement';
import { StudentTargetCompany } from './companyPrep';
import { DailyRoadmapTask } from './roadmap';
import { StudyPlanData } from './studyPlanner';

// ==========================================
// 1. CAREER READINESS SCORE
// ==========================================
export type ReadinessDimensionKey = 'resume' | 'coding' | 'placement' | 'interview' | 'roadmap';

export interface ReadinessDimensionScore {
  key: ReadinessDimensionKey;
  label: string;
  score: number; // 0-100
  weight: number; // 0-1
  weightedContribution: number;
  isAvailable: boolean;
  statusText: string;
  dataPointsCount: number;
  metrics: Record<string, string | number>;
}

export interface ReadinessStrengthGap {
  title: string;
  dimensionKey: ReadinessDimensionKey;
  reason: string;
  metricValue?: string | number;
  badgeColor?: string;
}

export interface ReadinessNextStep {
  title: string;
  description: string;
  actionRoute: string;
  actionText: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CareerReadinessScore {
  overallScore: number | null; // null if insufficient data
  statusCategory: 'Getting Started' | 'Building Foundations' | 'Making Progress' | 'Placement Ready' | 'Highly Prepared' | 'Not Enough Data';
  isDataSufficient: boolean;
  availableDimensionsCount: number;
  totalDimensionsCount: number;
  dimensions: {
    resume: ReadinessDimensionScore;
    coding: ReadinessDimensionScore;
    placement: ReadinessDimensionScore;
    interview: ReadinessDimensionScore;
    roadmap: ReadinessDimensionScore;
  };
  biggestStrength: ReadinessStrengthGap | null;
  biggestGap: ReadinessStrengthGap | null;
  recommendedNextStep: ReadinessNextStep;
  formulaExplanation: string;
  calculatedAt: string;
}

// ==========================================
// 2. PROGRESS ANALYTICS
// ==========================================
export type AnalyticsTimeRange = '7d' | '30d' | '90d' | 'all';

export interface CareerReadinessTrendPoint {
  date: string; // YYYY-MM-DD
  displayDate: string; // e.g. "Aug 20"
  score: number; // 0-100
  codingScore: number;
  resumeScore: number;
  aptitudeScore: number;
  interviewScore: number;
  roadmapScore: number;
  statusCategory: string;
}

export interface CodingTopicAnalyticsItem {
  topic: string;
  attempted: number;
  solved: number;
  accuracy: number; // 0-100
  hasEnoughData: boolean;
}

export interface CodingProgressAnalytics {
  attemptedCount: number;
  solvedCount: number; // unique accepted problems
  uniqueAcceptedCount: number;
  totalSubmissions: number;
  successfulSubmissions: number;
  accuracyRate: number; // 0-100
  successRate: number; // 0-100
  currentStreakDays: number;
  longestStreakDays: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  strongestTopics: Array<{ topic: string; solved: number; accuracy: number }>;
  weakestTopics: Array<{ topic: string; attempted: number; accuracy: number }>;
  topicBreakdown: Record<string, CodingTopicAnalyticsItem>;
  recentSubmissions: CodingSubmission[];
  historicalWeeklyActivity: Array<{ date: string; submissionsCount: number; acceptedCount: number }>;
}

export interface PlacementSessionTrendPoint {
  id: string;
  date: string;
  displayDate: string;
  title: string;
  score: number;
  accuracy: number;
  totalQuestions: number;
  correctAnswers: number;
}

export interface PlacementProgressAnalytics {
  totalAttempts: number; // tests completed
  totalQuestionsAnswered: number;
  totalCorrect: number;
  averageScore: number;
  averageAccuracy: number;
  bestScore: number;
  recentSessions: PlacementTestSession[];
  recentPerformanceTrend: PlacementSessionTrendPoint[];
  categoryPerformance: Record<string, { attempts: number; avgScore: number; accuracy: number; totalQuestions: number }>;
  subjectPerformance: Record<string, { attempts: number; avgScore: number; accuracy: number; totalQuestions: number }>;
  improvementTrend: number; // percentage points delta from first half to second half
}

export interface MockInterviewProgressAnalytics {
  totalInterviews: number;
  averageOverallScore: number;
  averageTechnicalScore: number;
  averageCommunicationScore: number;
  averageProblemSolvingScore: number;
  averageConfidenceScore: number;
  latestScore: number;
  previousScore: number | null;
  scoreDelta: number | null;
  historicalReports: MockInterviewReport[];
  subjectAverages: Record<string, { count: number; avgScore: number }>;
  identifiedStrengths: string[];
  identifiedWeaknesses: string[];
  technicalInterviewsCount: number;
  technicalAverageScore: number;
  technicalLatestScore: number;
  hrInterviewsCount: number;
  hrAverageScore: number | null;
  hrLatestScore: number | null;
  hrCommunicationScore: number | null;
  isHrAssessed: boolean;
}

export interface ResumeProgressAnalytics {
  totalVersions: number;
  latestAtsScore: number;
  previousAtsScore: number | null;
  highestAtsScore: number;
  versionsList: ResumeVersionItem[];
  scoreImprovementDelta: number | null; // delta from previous/oldest to latest version
  latestAnalysisDate: string | null;
  targetRole: string | null;
  latestMissingSkills: string[];
  latestStrengths: string[];
  isAssessed: boolean;
  jobMatchesCount: number;
  jobMatches: JobMatchAnalysis[];
  mostCommonMissingSkills: string[];
  mostCommonKeywordGaps: string[];
}

export interface CareerActivityItem {
  id: string;
  type: 'coding' | 'resume' | 'interview' | 'placement' | 'roadmap' | 'mentor';
  title: string;
  description: string;
  timestamp: string;
  displayDate: string;
  score?: number | string;
  statusBadge?: string;
  badgeColor?: string;
  actionRoute?: string;
  actionText?: string;
}

export interface RoadmapProgressAnalytics {
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  completionPercentage: number;
  activePhaseTitle: string;
  lastCompletedDate: string | null;
  completedSkillsCount: number;
  remainingSkillsCount: number;
  skillsList: Array<{ name: string; isCompleted: boolean }>;
}

export interface StudyPlannerProgressAnalytics {
  totalGeneratedPlans: number;
  totalPlannedTasks: number;
  completedPlannedTasks: number;
  consistencyRate: number; // 0-100
  totalStudyMinutesLogged: number;
}

export interface WeeklyComparisonItem<T = number> {
  currentValue: T;
  previousValue: T;
  delta: number;
  trend: 'up' | 'down' | 'stable' | 'none';
  displayText: string;
}

export interface WeeklyProgressSummary {
  hasSufficientData: boolean;
  codingProblems: WeeklyComparisonItem;
  placementQuestions: WeeklyComparisonItem;
  interviewsCompleted: WeeklyComparisonItem;
  studyTasksCompleted: WeeklyComparisonItem;
  resumeActivity: WeeklyComparisonItem;
  roadmapMilestones: WeeklyComparisonItem;
  overallReadinessDelta: number | null;
  comparisonNote: string;
}

export interface ProvenStrengthItem {
  title: string;
  category: 'coding' | 'aptitude' | 'interview' | 'resume' | 'roadmap';
  score: number | string;
  evidence: string;
  badgeLevel: 'Mastered' | 'Strong' | 'Proficient';
}

export interface ImprovementAreaItem {
  title: string;
  category: 'coding' | 'aptitude' | 'interview' | 'resume' | 'roadmap';
  score?: number | string;
  evidence: string;
  actionRoute: string;
  actionText: string;
  severity: 'high' | 'medium';
}

export interface MetricTrendIndicator {
  key: string;
  direction: 'up' | 'down' | 'stable' | 'none';
  label: string;
  changeText: string;
}

export interface ProgressAnalyticsData {
  studentId: string;
  selectedTimeRange: AnalyticsTimeRange;
  hasEnoughDataForCharts: boolean;
  readinessTrend: CareerReadinessTrendPoint[];
  coding: CodingProgressAnalytics;
  placement: PlacementProgressAnalytics;
  interview: MockInterviewProgressAnalytics;
  resume: ResumeProgressAnalytics;
  roadmap: RoadmapProgressAnalytics;
  studyPlanner: StudyPlannerProgressAnalytics;
  weeklyProgress: WeeklyProgressSummary;
  provenStrengths: ProvenStrengthItem[];
  areasToImprove: ImprovementAreaItem[];
  trendIndicators: Record<string, MetricTrendIndicator>;
  activityTimeline: CareerActivityItem[];
  calculatedAt: string;
}

// ==========================================
// 3. PERSONALIZED TODAY'S FOCUS
// ==========================================
export type FocusTaskCategory =
  | 'coding'
  | 'interview'
  | 'roadmap'
  | 'resume'
  | 'placement'
  | 'study_plan'
  | 'company'
  | 'manual';

export type FocusTaskType =
  | 'coding'
  | 'interview'
  | 'resume'
  | 'placement'
  | 'study'
  | 'company'
  | 'roadmap'
  | 'manual';

export interface TodaysFocusTask {
  id: string;
  title: string;
  category: FocusTaskCategory;
  taskType?: FocusTaskType;
  estimatedMinutes: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  actionRoute: string;
  actionText: string;
  actionParams?: Record<string, any>;
  isCompleted: boolean;
  isVerifiable?: boolean;
  requiredCount?: number;
  completedCount?: number;
  progressText?: string;
  completionCriteria?: string;
  linkedPlannerId?: string;
  targetMetric?: string;
  targetTopic?: string;
}

export interface TodaysFocus {
  tasks: TodaysFocusTask[];
  totalEstimatedMinutes: number;
  totalTasksCount: number;
  completedTasksCount: number;
  progressPercentage: number;
  generatedAt: string;
  dataGroundingSummary: string;
}

// ==========================================
// 4. ADAPTIVE LEARNING
// ==========================================
export interface AdaptiveTopicInsight {
  topic: string;
  module: 'coding' | 'placement' | 'interview';
  confidence: 'high' | 'medium' | 'low';
  evidence: string;
  failureCount?: number;
  successCount?: number;
  accuracyRate?: number;
  recommendation: string;
  actionRoute: string;
}

export interface AdaptiveMistakePattern {
  id: string;
  title: string;
  module: 'coding' | 'placement' | 'interview';
  occurrencesCount: number;
  evidence: string;
  actionableSuggestion: string;
}

export interface AdaptiveLearningInsights {
  weakTopics: AdaptiveTopicInsight[];
  strongTopics: AdaptiveTopicInsight[];
  neglectedAreas: Array<{
    area: string;
    module: string;
    lastPracticedDaysAgo: number;
    reason: string;
    actionRoute: string;
  }>;
  repeatedMistakes: AdaptiveMistakePattern[];
  improvementTrends: Array<{
    area: string;
    metric: string;
    deltaValue: string;
    isPositive: boolean;
    description: string;
  }>;
  adaptiveRecommendations: Array<{
    id: string;
    title: string;
    description: string;
    type: 'practice' | 'review' | 'mock' | 'resume';
    actionRoute: string;
  }>;
  updatedAt: string;
}

// ==========================================
// 5. JOB DESCRIPTION ↔ RESUME MATCH
// ==========================================
export interface JobMatchRequest {
  jobDescriptionText: string;
  jobTitle?: string;
  companyName?: string;
  resumeId?: string;
  customResumeText?: string;
}

export interface JobMatchSkillItem {
  skill: string;
  category?: 'Language' | 'Framework' | 'Database' | 'Cloud/Tool' | 'Core CS' | 'Soft Skill';
  importance: 'critical' | 'preferred' | 'bonus';
  matchedInResume: boolean;
  contextSnippet?: string;
}

export interface JobMatchAnalysis {
  id: string;
  jobTitle: string;
  companyName?: string;
  resumeName: string;
  resumeId?: string;
  matchScore: number; // 0-100
  matchingSkills: string[];
  missingSkills: string[];
  allExtractedSkills: JobMatchSkillItem[];
  relevantExperience: {
    alignmentScore: number;
    matchingPoints: string[];
    gapPoints: string[];
  };
  missingKeywords: string[];
  projectAlignment: {
    score: number;
    analysisText: string;
    suggestedProjectIdeas: string[];
  };
  potentialAtsIssues: string[];
  recommendedImprovements: string[];
  analyzedAt: string;
}

// ==========================================
// 6. INTERVIEW WEAKNESS TRACKER
// ==========================================
export interface InterviewDimensionScore {
  score: number;
  label: string;
  rating: 'exceptional' | 'good' | 'average' | 'needs_improvement';
}

export interface InterviewWeaknessData {
  totalInterviews: number;
  hasEnoughDataForTrend: boolean;
  currentPerformance: {
    overall: number;
    technical: number;
    communication: number;
    problemSolving: number;
    confidence: number;
    technicalAccuracy: number;
  };
  previousPerformance: {
    overall: number;
    technical: number;
    communication: number;
    problemSolving: number;
    confidence: number;
    technicalAccuracy: number;
  } | null;
  deltas: {
    overall: number;
    technical: number;
    communication: number;
    problemSolving: number;
    confidence: number;
  } | null;
  weakAreas: Array<{
    area: string;
    score: number;
    evidence: string;
    actionableAdvice: string;
  }>;
  strongAreas: Array<{
    area: string;
    score: number;
    evidence: string;
  }>;
  recommendedNextInterview: {
    recommendedSubject: string;
    recommendedTopic: string;
    focusDimension: 'communication' | 'technical' | 'problem_solving' | 'confidence';
    rationale: string;
  };
}

// ==========================================
// 7. BETTER COMPANY PREPARATION
// ==========================================
export interface CompanyPreparationGapItem {
  areaKey: 'resume' | 'coding' | 'aptitude' | 'technicalInterview' | 'hrInterview' | 'requiredSkills';
  title: string;
  currentScore: number;
  targetBenchmark: number;
  status: 'ready' | 'on_track' | 'needs_improvement' | 'not_evaluated';
  details: string;
  actionRoute: string;
  actionText: string;
}

export interface IntegratedCompanyPreparationData {
  targetCompany: string;
  targetRole: string;
  isCustomCompany: boolean;
  companyTier?: string;
  overallPreparationProgress: number; // 0-100
  dimensions: {
    resume: { score: number; benchmark: number; status: string; isAvailable: boolean };
    coding: { score: number; benchmark: number; status: string; isAvailable: boolean };
    aptitude: { score: number; benchmark: number; status: string; isAvailable: boolean };
    technicalInterview: { score: number; benchmark: number; status: string; isAvailable: boolean };
    hrInterview: { score: number; benchmark: number; status: string; isAvailable: boolean };
    requiredSkills: { score: number; benchmark: number; status: string; isAvailable: boolean; matchedSkills: string[]; missingSkills: string[] };
  };
  gaps: CompanyPreparationGapItem[];
  companyRequirementsNote: string;
  hasSpecificCompanyData: boolean;
}

// ==========================================
// 8. CROSS-PLATFORM ACHIEVEMENTS
// ==========================================
export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: 'coding' | 'interview' | 'resume' | 'streak' | 'placement' | 'roadmap' | 'readiness';
  targetValue: number;
  unit: string;
  badgeLevel: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  color: string;
}

export interface AchievementItem extends AchievementDefinition {
  isUnlocked: boolean;
  unlockedAt?: string;
  currentValue: number;
  progressPercentage: number;
}

export interface AchievementsState {
  unlockedCount: number;
  totalCount: number;
  items: AchievementItem[];
  recentlyUnlocked: AchievementItem[];
  lastCalculatedAt: string;
}

// ==========================================
// 9. SMART ALERTS
// ==========================================
export type SmartAlertType = 'action_needed' | 'improvement_opportunity' | 'milestone' | 'recommendation';

export interface SmartAlertItem {
  id: string;
  type: SmartAlertType;
  severity: 'high' | 'medium' | 'low' | 'info';
  title: string;
  message: string;
  actionRoute: string;
  actionText: string;
  sourceModule: 'coding' | 'interview' | 'resume' | 'roadmap' | 'placement' | 'general';
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

// ==========================================
// 10. WEEKLY CAREER REPORT
// ==========================================
export interface WeeklyCareerReport {
  id: string;
  startDate: string; // ISO date string e.g. 7 days ago
  endDate: string; // ISO date string e.g. today
  isSufficientData: boolean;
  studentName?: string;
  targetRole?: string;
  coding: {
    totalSubmissions: number;
    uniqueQuestionsAttempted: number;
    uniqueQuestionsSolved: number;
    attemptedCount: number; // alias to uniqueQuestionsAttempted
    solvedCount: number; // alias to uniqueQuestionsSolved
    totalAcceptedSubmissions?: number;
    accuracyRate: number; // submission pass rate (accepted / total submissions)
    successRate?: number; // question solve rate (solved / attempted)
    topicsPracticed: string[];
  };
  placement: {
    attemptsCount: number;
    averageScore: number;
    averageAccuracy: number;
  };
  interview: {
    completedCount: number;
    averageScore: number;
    weakestDimension: string | null;
  };
  roadmap: {
    tasksCompletedThisWeek: number;
    overallProgressPercentage: number;
  };
  studyPlanner: {
    plannedTasksCount: number;
    completedPlannedCount: number;
    completionRate: number;
    studyMinutesLogged: number;
  };
  resume: {
    latestScore: number;
    scoreDeltaThisWeek: number;
    newVersionsCreated: number;
  };
  achievementsUnlockedThisWeek: Array<{
    id: string;
    title: string;
    unlockedAt: string;
    badgeLevel: string;
  }>;
  readinessDeltaThisWeek: number;
  currentReadinessScore: number | null;
  comparisonWithPreviousWeek?: {
    hasComparisonData: boolean;
    message: string;
    submissionsDelta?: number;
    solvedDelta?: number;
    interviewDelta?: number;
    readinessDelta?: number;
  };
  mentor?: {
    sessionsCount: number;
    messagesCount: number;
  };
  topicBreakdown?: {
    strongestTopic: string | null;
    weakestTopic: string | null;
    allTopics: Array<{ topic: string; attempted: number; solved: number }>;
  };
  interviewWeaknesses?: string[];
  resumeInsights?: {
    missingSkills: string[];
    targetRoleMatched: boolean;
  };
  biggestImprovement: {
    area: string;
    metric: string;
    description: string;
  } | null;
  biggestGap: {
    area: string;
    description: string;
    recommendedAction: string;
    actionRoute: string;
  } | null;
  nextWeeksFocus: Array<{
    title: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    actionRoute: string;
  }>;
  executiveSummary: string;
  generatedAt: string;
}

// ==========================================
// 11. UNIFIED CAREER INTELLIGENCE STATE
// ==========================================
export interface UnifiedCareerIntelligence {
  studentId: string;
  readiness: CareerReadinessScore;
  analytics: ProgressAnalyticsData;
  todaysFocus: TodaysFocus;
  adaptive: AdaptiveLearningInsights;
  interviewWeakness: InterviewWeaknessData;
  achievements: AchievementsState;
  smartAlerts: SmartAlertItem[];
  weeklyReport: WeeklyCareerReport;
  lastUpdated: string;
}
