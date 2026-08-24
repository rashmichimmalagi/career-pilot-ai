import { ProfileCompletionStatus } from '../services/profileService';

export interface ModuleProgressItem {
  id: string;
  name: string;
  category: 'resume' | 'coding' | 'aptitude' | 'technical-interview' | 'hr-interview' | 'company-prep' | 'roadmap' | 'mentor';
  hasData: boolean;
  score?: number; // 0-100 percentage or score
  completedActivities: number;
  totalActivities?: number;
  unitLabel?: string; // 'activities', 'questions', 'problems', 'sessions', 'tasks'
  statusText: string;
  statusType: 'success' | 'warning' | 'info' | 'neutral';
  route: string;
  actionLabel: string;
  detailSummary?: string;
}

export interface TodayRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  route: string;
  actionLabel: string;
  reason: string;
  iconName: string;
}

export interface TopicInsightItem {
  topic: string;
  category: string; // 'DSA' | 'Aptitude' | 'Technical' | 'Interview' | 'Resume'
  score: number; // percentage accuracy or score
  totalAttempts: number;
  trend?: 'improving' | 'declining' | 'stable';
  actionRoute: string;
  actionLabel: string;
}

export interface RecentActivityItem {
  id: string;
  type: 'coding' | 'aptitude' | 'interview' | 'hr-interview' | 'company-prep' | 'resume' | 'roadmap' | 'mentor';
  title: string;
  description: string;
  timestamp: string; // ISO string
  score?: number;
  scoreLabel?: string;
  statusBadge?: {
    text: string;
    type: 'success' | 'danger' | 'warning' | 'info';
  };
  route: string;
}

export interface AIRecommendationRule {
  title: string;
  priority: 'urgent' | 'high' | 'medium' | 'info';
  message: string;
  targetMetric?: string;
  actionRoute: string;
  actionLabel: string;
  bulletPoints: string[];
}

export interface PreparationDashboardData {
  studentName: string;
  greeting: string;
  targetRole: string;
  hasEnoughDataForOverallScore: boolean;
  overallScore: number | null;
  overallScoreCategory: string;
  overallScoreDescription: string;
  totalActivitiesCount: number;
  streakDays: number;
  profileCompletion?: ProfileCompletionStatus;
  modules: ModuleProgressItem[];
  todayRecommendations: TodayRecommendation[];
  weakAreas: TopicInsightItem[];
  strongAreas: TopicInsightItem[];
  recentActivities: RecentActivityItem[];
  aiRecommendation: AIRecommendationRule;
}
