export type SyncErrorCategory =
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'RLS_ERROR'
  | 'SCHEMA_ERROR'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export type SyncState =
  | 'idle'
  | 'offline'
  | 'reconnecting'
  | 'syncing'
  | 'synced'
  | 'sync_partial'
  | 'sync_failed';

export interface StructuredSyncError {
  category: SyncErrorCategory;
  userMessage: string;
  technicalSummary?: string;
  table?: string;
  operation?: string;
  recordId?: string;
  timestamp: string;
}

export interface SyncAuditLog {
  operation: string;
  table: string;
  recordId?: string;
  userId: string;
  errorCategory: SyncErrorCategory;
  rawMessage: string;
  timestamp: string;
  retryCount: number;
}

export interface OfflineMutation {
  id: string;
  userId: string;
  type:
    | 'save_resume'
    | 'save_coding_submission'
    | 'save_saved_question'
    | 'remove_saved_question'
    | 'save_mock_interview'
    | 'save_placement_session'
    | 'save_career_readiness'
    | 'save_job_resume_match'
    | 'save_mentor_conversation'
    | 'save_mentor_message'
    | 'save_notification'
    | 'save_notification_preferences'
    | 'save_company_target'
    | 'delete_company_target'
    | 'save_roadmap_tasks'
    | 'save_completed_roadmap_items'
    | 'save_study_plan'
    | 'save_study_time'
    | 'save_mentor_messages'
    | 'save_badges'
    | 'save_streak'
    | 'save_profile_field';
  payload: any;
  timestamp: string;
  attempts: number;
  lastErrorCategory?: SyncErrorCategory;
  lastErrorMessage?: string;
}

export interface QueueProcessResult {
  totalProcessed: number;
  syncedCount: number;
  failedCount: number;
  remainingQueueCount: number;
  errors: StructuredSyncError[];
  logs: SyncAuditLog[];
}
