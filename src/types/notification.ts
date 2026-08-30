/**
 * CareerPilot AI - Smart Notification System Types
 * Defines data-grounded, categorized notifications with cloud persistence and user isolation.
 */

export type NotificationCategory =
  | 'CAREER'
  | 'CODING'
  | 'PLACEMENT'
  | 'INTERVIEW'
  | 'RESUME'
  | 'STUDY'
  | 'COMPANY'
  | 'ACHIEVEMENT'
  | 'PROGRESS'
  | 'SYSTEM';

export type NotificationPriority = 'high' | 'medium' | 'low' | 'info';

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  is_read: boolean;
  action_url?: string;
  action_label?: string;
  created_at: string;
  read_at?: string | null;
  dedup_key?: string;
  metadata?: Record<string, any>;
  cloudSynced?: boolean;
}

export interface NotificationPreferences {
  user_id: string;
  enabled: boolean;
  career_updates: boolean;
  coding_reminders: boolean;
  study_reminders: boolean;
  interview_feedback: boolean;
  resume_updates: boolean;
  company_prep: boolean;
  achievement_notifications: boolean;
  progress_updates: boolean;
  updated_at: string;
}

export interface SmartNotificationTriggerContext {
  studentId: string;
  submissionsCount?: number;
  solvedCount?: number;
  lastSolvedAt?: string | null;
  currentStreak?: number;
  readinessScore?: number | null;
  previousReadinessScore?: number | null;
  hasResume?: boolean;
  resumeScore?: number | null;
  resumeMissingSkills?: string[];
  mockInterviewsCount?: number;
  latestInterviewScore?: number | null;
  interviewWeaknessArea?: string | null;
  placementAttemptsCount?: number;
  placementAccuracy?: number | null;
  targetCompaniesCount?: number;
  targetCompanyPrepGapsCount?: number;
  incompleteStudyTasksCount?: number;
  highPriorityStudyTasksCount?: number;
  unlockedAchievementsCount?: number;
  recentlyUnlockedBadgeTitle?: string | null;
}
