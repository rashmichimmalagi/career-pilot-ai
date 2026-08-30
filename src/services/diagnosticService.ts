import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getStoredDailyTasks, getCompletedItemIds } from './roadmapStorage';
import { getStudentTargets } from './companyPrepStorage';
import { cloudSyncService } from './cloudSyncService';
import { persistenceManager } from './persistenceManager';
import { SUPABASE_SETUP_SQL } from '../data/supabaseSqlScript';

export type PersistenceSyncStatus =
  | 'Cloud Synced'
  | 'Pending Sync'
  | 'Cloud Error'
  | 'Local Only'
  | 'Not Applicable';

export interface ModulePersistenceAuditRow {
  name: string;
  module: string;
  tableOrSource: string;
  localCache: number;
  cloudRecords: number;
  syncStatus: PersistenceSyncStatus;
  lastCloudSync: string;
  pendingItems: number;
  errors?: string;
  notes?: string;
}

export interface LocalHarvestCounts {
  localResumes: number;
  localCodingSubmissions: number;
  localSavedQuestions: number;
  localPlacementSessions: number;
  localMockInterviews: number;
  localCompanyTargets: number;
  localRoadmapTasks: number;
  localTotalItems: number;
}

export interface CareerPilotDiagnosticReport {
  timestamp: string;
  environment: string;
  supabaseUrl: string;
  supabaseConfigured: boolean;
  supabaseConnectionStatus: 'Connected' | 'Degraded' | 'Unreachable' | 'Misconfigured';
  authenticatedUserId: string | null;
  authenticatedEmail: string | null;
  authProvider: string | null;
  sessionValid: boolean;
  sessionExpiry?: string | null;

  // Schema & Migration Health
  hasSchemaFixRequired: boolean;
  missingTables: string[];
  missingColumns: string[];
  schemaFixSql: string;

  // Local vs Cloud Comparison
  localCounts: LocalHarvestCounts;

  // Profile specific
  profileFound: boolean;
  profileId: string | null;
  profileRole: string | null;
  hasProfileDataJson: boolean;
  profileError?: string | null;

  // Counts
  resumeCount: number;
  codingSubmissionCount: number;
  savedQuestionCount: number;
  placementAttemptCount: number;
  mockInterviewTotalCount: number;
  technicalInterviewCount: number;
  hrInterviewCount: number;
  studentActivityLogCount: number;
  roadmapRecordCount: number;
  companyPrepRecordCount: number;
  studyPlannerRecordCount: number;

  // Detailed persistence audit rows
  modules: ModulePersistenceAuditRow[];

  // Errors & Warnings
  rlsErrors: string[];
  warnings: string[];
  overallStatus: 'healthy' | 'degraded' | 'error' | 'unauthenticated' | 'unconfigured';
}

function formatSyncTime(timestamp?: string | null): string {
  if (!timestamp) return 'Never';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'Never';
    const now = Date.now();
    const diffSec = Math.floor((now - d.getTime()) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Never';
  }
}

/**
 * CareerPilot Persistence & Sync Diagnostic Engine
 * Performs comprehensive read-only inspections of Supabase authentication, table connectivity,
 * RLS policies, and record counts across all CareerPilot modules without exposing sensitive keys or tokens.
 */
export async function runPersistenceDiagnostics(): Promise<CareerPilotDiagnosticReport> {
  const timestamp = new Date().toISOString();
  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
  const environment = isVercel ? 'Vercel Production' : 'AI Studio / Preview Environment';
  const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const isConfigured = isSupabaseConfigured();

  // Sanitize Supabase URL to hide any path or sensitive fragments
  const sanitizedUrl = rawSupabaseUrl
    ? rawSupabaseUrl.replace(/^(https:\/\/[^/]+).*$/, '$1')
    : 'Not Configured';

  const warnings: string[] = [];
  const rlsErrors: string[] = [];
  const modules: ModulePersistenceAuditRow[] = [];
  const missingTables: string[] = [];
  const missingColumns: string[] = [];

  if (!isConfigured) {
    warnings.push('Supabase configuration missing (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY).');
    return {
      timestamp,
      environment,
      supabaseUrl: sanitizedUrl,
      supabaseConfigured: false,
      supabaseConnectionStatus: 'Misconfigured',
      authenticatedUserId: null,
      authenticatedEmail: null,
      authProvider: null,
      sessionValid: false,
      hasSchemaFixRequired: false,
      missingTables: [],
      missingColumns: [],
      schemaFixSql: SUPABASE_SETUP_SQL,
      localCounts: {
        localResumes: 0,
        localCodingSubmissions: 0,
        localSavedQuestions: 0,
        localPlacementSessions: 0,
        localMockInterviews: 0,
        localCompanyTargets: 0,
        localRoadmapTasks: 0,
        localTotalItems: 0,
      },
      profileFound: false,
      profileId: null,
      profileRole: null,
      hasProfileDataJson: false,
      resumeCount: 0,
      codingSubmissionCount: 0,
      savedQuestionCount: 0,
      placementAttemptCount: 0,
      mockInterviewTotalCount: 0,
      technicalInterviewCount: 0,
      hrInterviewCount: 0,
      studentActivityLogCount: 0,
      roadmapRecordCount: 0,
      companyPrepRecordCount: 0,
      studyPlannerRecordCount: 0,
      modules: [],
      rlsErrors: [],
      warnings,
      overallStatus: 'unconfigured',
    };
  }

  // 1. Check Auth User & Session
  let authUserId: string | null = null;
  let authEmail: string | null = null;
  let authProvider: string | null = null;
  let sessionValid = false;
  let sessionExpiry: string | null = null;

  try {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) {
      warnings.push(`Auth session retrieval error: ${sessionErr.message}`);
    } else if (sessionData?.session) {
      sessionValid = true;
      authUserId = sessionData.session.user.id;
      authEmail = sessionData.session.user.email || null;
      authProvider = sessionData.session.user.app_metadata?.provider || 'email';
      if (sessionData.session.expires_at) {
        sessionExpiry = new Date(sessionData.session.expires_at * 1000).toISOString();
      }
    }
  } catch (err: any) {
    warnings.push(`Auth check exception: ${err?.message || 'Unknown auth error'}`);
  }

  const effectiveUserId = authUserId || 'guest';
  const isAuthed = Boolean(authUserId && authUserId !== 'guest');
  const offlineQueue = isAuthed ? persistenceManager.getOfflineQueue(authUserId!) : [];
  const localHarvest = cloudSyncService.harvestAllLocalData(effectiveUserId);

  // Helper to query table count and errors safely
  const queryTable = async (
    moduleName: string,
    tableName: string,
    filterColumn: string = 'user_id',
    additionalFilter?: (query: any) => any
  ): Promise<{ count: number; error: any; sample?: any; latestUpdatedAt?: string }> => {
    try {
      let q = supabase.from(tableName).select('id, created_at, updated_at', { count: 'exact' });
      if (isAuthed && effectiveUserId) {
        q = q.eq(filterColumn, effectiveUserId);
      } else {
        return { count: 0, error: null };
      }
      if (additionalFilter) {
        q = additionalFilter(q);
      }

      const { data, count, error } = await q;
      if (error) {
        return { count: 0, error };
      }
      const dataArray = Array.isArray(data) ? (data as any[]) : [];
      const resolvedCount = typeof count === 'number' ? count : dataArray.length;
      let latestUpdated: string | undefined = undefined;
      if (dataArray.length > 0) {
        const sorted = [...dataArray].sort((a, b) => {
          const tA = new Date(a.updated_at || a.created_at || 0).getTime();
          const tB = new Date(b.updated_at || b.created_at || 0).getTime();
          return tB - tA;
        });
        latestUpdated = sorted[0]?.updated_at || sorted[0]?.created_at;
      }
      return { count: resolvedCount, error: null, sample: dataArray[0], latestUpdatedAt: latestUpdated };
    } catch (err: any) {
      return { count: 0, error: err };
    }
  };

  // 2. Query Student Profile
  let profileFound = false;
  let profileId: string | null = null;
  let profileRole: string | null = null;
  let hasProfileDataJson = false;
  let profileError: string | null = null;
  let profileUpdatedAt: string | null = null;

  let remoteRoadmapCount = 0;
  let remoteCompanyTargetCount = 0;
  let remoteStudyPlanCount = 0;
  let remoteMentorChatCount = 0;
  let remoteBadgesCount = 0;
  let remoteLongestStreak = 0;

  if (isAuthed) {
    try {
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', effectiveUserId)
        .maybeSingle();

      if (profErr) {
        profileError = profErr.message || 'Error fetching profile';
        rlsErrors.push(`profiles (Student Profile): ${profErr.code || ''} ${profErr.message}`.trim());
      } else if (profData) {
        profileFound = true;
        profileId = profData.id;
        profileRole = profData.role || 'student';
        hasProfileDataJson = !!profData.profile_data;
        profileUpdatedAt = profData.updated_at || profData.created_at || null;

        // Check embedded data
        let metaObj = (profData.profile_data as Record<string, any>) || {};
        if (typeof profData.career_goal === 'string' && profData.career_goal.startsWith('__CP_DATA__')) {
          try {
            const parsed = JSON.parse(profData.career_goal.replace(/^__CP_DATA__/, ''));
            metaObj = { ...metaObj, ...parsed };
          } catch (_) {}
        }

        if (metaObj.roadmap_tasks && Array.isArray(metaObj.roadmap_tasks)) {
          remoteRoadmapCount = metaObj.roadmap_tasks.length;
        }
        if (metaObj.company_targets && Array.isArray(metaObj.company_targets)) {
          remoteCompanyTargetCount = metaObj.company_targets.length;
        }
        if (metaObj.study_plans && typeof metaObj.study_plans === 'object') {
          remoteStudyPlanCount = Object.keys(metaObj.study_plans).length;
        }
        if (metaObj.mentor_chat_history && Array.isArray(metaObj.mentor_chat_history)) {
          remoteMentorChatCount = metaObj.mentor_chat_history.length;
        }
        if (metaObj.unlocked_badges && typeof metaObj.unlocked_badges === 'object') {
          remoteBadgesCount = Object.keys(metaObj.unlocked_badges).length;
        }
        if (typeof metaObj.longest_streak === 'number') {
          remoteLongestStreak = metaObj.longest_streak;
        }
      }
    } catch (err: any) {
      profileError = err?.message || 'Profile query error';
    }
  }

  // 3. Query tables concurrently
  const [
    resumeRes,
    codingRes,
    savedQuestionsRes,
    placementRes,
    mockInterviewTotalRes,
    technicalInterviewRes,
    hrInterviewRes,
  ] = await Promise.all([
    queryTable('Resume Versions', 'resumes', 'user_id'),
    queryTable('Coding Submissions', 'coding_submissions', 'user_id'),
    queryTable('Saved Questions', 'saved_coding_questions', 'user_id'),
    queryTable('Placement Sessions', 'placement_sessions', 'user_id'),
    queryTable('Mock Interviews Total', 'mock_interviews', 'user_id'),
    queryTable('Technical Interviews', 'mock_interviews', 'user_id', (q) => q.ilike('interview_type', '%technical%')),
    queryTable('HR Interviews', 'mock_interviews', 'user_id', (q) => q.or('interview_type.ilike.%hr%,interview_type.ilike.%behavioral%')),
  ]);

  // Helper to add audit row
  const addAuditRow = (
    moduleName: string,
    tableOrSource: string,
    localCache: number,
    cloudRes: { count: number; error: any; latestUpdatedAt?: string },
    options: {
      pendingOverride?: number;
      notes?: string;
      customSyncStatus?: PersistenceSyncStatus;
    } = {}
  ) => {
    let syncStatus: PersistenceSyncStatus = 'Cloud Synced';
    let errorMessage: string | undefined = undefined;
    const pendingCount = options.pendingOverride !== undefined
      ? options.pendingOverride
      : (isAuthed ? Math.max(0, localCache - cloudRes.count) : 0);

    if (!isAuthed) {
      syncStatus = 'Local Only';
    } else if (cloudRes.error) {
      const errCode = cloudRes.error.code || '';
      const errMsg = cloudRes.error.message || cloudRes.error.toString();
      errorMessage = `${errCode} ${errMsg}`.trim();
      const isMissingTable = errCode === 'PGRST205' || errCode === '42P01' || errMsg.includes('schema cache') || errMsg.includes('does not exist');
      if (isMissingTable) {
        const cleanName = tableOrSource.split('.')[0].split(' ')[0];
        if (!missingTables.includes(cleanName)) missingTables.push(cleanName);
      }
      rlsErrors.push(`${tableOrSource} (${moduleName}): ${errorMessage}`);
      syncStatus = 'Cloud Error';
    } else if (options.customSyncStatus) {
      syncStatus = options.customSyncStatus;
    } else if (pendingCount > 0) {
      syncStatus = 'Pending Sync';
    } else if (cloudRes.count > 0 || (localCache === 0 && cloudRes.count === 0)) {
      syncStatus = 'Cloud Synced';
    } else {
      syncStatus = 'Cloud Synced';
    }

    const lastCloudSync = formatSyncTime(cloudRes.latestUpdatedAt || (cloudRes.count > 0 ? timestamp : null));

    modules.push({
      name: moduleName,
      module: moduleName,
      tableOrSource,
      localCache,
      cloudRecords: cloudRes.count,
      syncStatus,
      lastCloudSync,
      pendingItems: pendingCount,
      errors: errorMessage,
      notes: options.notes,
    });
  };

  // 1. Student Profile
  const profilePending = (isAuthed && !profileFound) ? 1 : 0;
  const profileSyncStatus: PersistenceSyncStatus = !isAuthed
    ? 'Local Only'
    : profileError
    ? 'Cloud Error'
    : profileFound
    ? 'Cloud Synced'
    : 'Pending Sync';

  modules.push({
    name: 'Student Profile',
    module: 'Student Profile',
    tableOrSource: 'profiles',
    localCache: 1,
    cloudRecords: profileFound ? 1 : 0,
    syncStatus: profileSyncStatus,
    lastCloudSync: formatSyncTime(profileUpdatedAt),
    pendingItems: profilePending,
    errors: profileError || undefined,
    notes: profileFound ? `User: ${effectiveUserId}` : 'No Supabase profile record',
  });

  // 2. Resume Versions
  addAuditRow('Resume Versions', 'resumes', localHarvest.resumes.length, resumeRes);

  // 3. Resume Analysis / ATS Results
  const localAnalysisCount = (localHarvest.resumes.some(r => r.analysisResult)) ? 1 : 0;
  addAuditRow('Resume Analysis / ATS', 'resumes [analysis_result]', localAnalysisCount, {
    count: resumeRes.count > 0 ? resumeRes.count : 0,
    error: resumeRes.error,
    latestUpdatedAt: resumeRes.latestUpdatedAt,
  });

  // 4. Coding Submissions & Source Code
  const unsyncedSubs = localHarvest.codingSubmissions.filter((s: any) => !s.cloudSynced).length;
  addAuditRow('Coding Submissions & Code', 'coding_submissions', localHarvest.codingSubmissions.length, codingRes, {
    pendingOverride: unsyncedSubs,
  });

  // 5. Saved Coding Questions
  addAuditRow('Saved Coding Questions', 'saved_coding_questions', localHarvest.savedQuestions.length, savedQuestionsRes);

  // 6. Placement Practice Sessions
  addAuditRow('Placement Test Sessions', 'placement_sessions', localHarvest.placementSessions.length, placementRes);

  // 7. Mock Technical Interviews
  const localTechInterviews = localHarvest.mockInterviews.filter((i: any) => {
    const s = String(i.subject || i.interview_type || '').toLowerCase();
    return !s.includes('hr') && !s.includes('behavioral');
  }).length;
  addAuditRow('Technical Mock Interviews', 'mock_interviews [technical]', localTechInterviews, technicalInterviewRes);

  // 8. Mock HR / Behavioral Interviews
  const localHrInterviews = localHarvest.mockInterviews.filter((i: any) => {
    const s = String(i.subject || i.interview_type || '').toLowerCase();
    return s.includes('hr') || s.includes('behavioral');
  }).length;
  addAuditRow('HR & Behavioral Interviews', 'mock_interviews [hr/behavioral]', localHrInterviews, hrInterviewRes);

  // 9. Company Targets
  const localTargetCount = localHarvest.companyTargets.length;
  const companyPending = (isAuthed && localTargetCount > remoteCompanyTargetCount) ? (localTargetCount - remoteCompanyTargetCount) : 0;
  addAuditRow('Company Prep Targets', 'profiles.profile_data.company_targets', localTargetCount, {
    count: remoteCompanyTargetCount,
    error: profileError ? { message: profileError } : null,
    latestUpdatedAt: profileUpdatedAt || undefined,
  }, {
    pendingOverride: companyPending,
  });

  // 10. Roadmap & Tasks
  const localRoadmapCount = localHarvest.roadmapTasks.length;
  const roadmapPending = (isAuthed && localRoadmapCount > remoteRoadmapCount) ? (localRoadmapCount - remoteRoadmapCount) : 0;
  addAuditRow('Career Roadmap & Tasks', 'profiles.profile_data.roadmap_tasks', localRoadmapCount, {
    count: remoteRoadmapCount,
    error: profileError ? { message: profileError } : null,
    latestUpdatedAt: profileUpdatedAt || undefined,
  }, {
    pendingOverride: roadmapPending,
  });

  // 11. Study Planner & Schedule
  let localStudyPlanCount = 0;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`careerpilot_study_plan_${effectiveUserId}`)) {
          localStudyPlanCount++;
        }
      }
    }
  } catch (_) {}
  const studyPending = (isAuthed && localStudyPlanCount > remoteStudyPlanCount) ? (localStudyPlanCount - remoteStudyPlanCount) : 0;
  addAuditRow('Study Planner & Schedule', 'profiles.profile_data.study_plans', localStudyPlanCount, {
    count: remoteStudyPlanCount,
    error: profileError ? { message: profileError } : null,
    latestUpdatedAt: profileUpdatedAt || undefined,
  }, {
    pendingOverride: studyPending,
  });

  // 12. AI Mentor Chat History
  const localMentorCount = localHarvest.mentorChatCount;
  const mentorPending = (isAuthed && localMentorCount > remoteMentorChatCount) ? (localMentorCount - remoteMentorChatCount) : 0;
  addAuditRow('AI Mentor Chat History', 'profiles.profile_data.mentor_chat_history', localMentorCount, {
    count: remoteMentorChatCount,
    error: profileError ? { message: profileError } : null,
    latestUpdatedAt: profileUpdatedAt || undefined,
  }, {
    pendingOverride: mentorPending,
  });

  // 13. Achievements & Badges
  const localBadgesCount = localHarvest.badges.length;
  const badgesPending = (isAuthed && localBadgesCount > remoteBadgesCount) ? (localBadgesCount - remoteBadgesCount) : 0;
  addAuditRow('Achievements & Badges', 'profiles.profile_data.unlocked_badges', localBadgesCount, {
    count: remoteBadgesCount,
    error: profileError ? { message: profileError } : null,
    latestUpdatedAt: profileUpdatedAt || undefined,
  }, {
    pendingOverride: badgesPending,
  });

  // 14. Coding Streaks
  let localStreak = 0;
  try {
    const rawS = localStorage.getItem(`careerpilot_longest_streak_${effectiveUserId}`);
    if (rawS) localStreak = parseInt(rawS, 10) || 0;
  } catch (_) {}
  addAuditRow('Coding Practice Streaks', 'profiles.profile_data.longest_streak', localStreak, {
    count: remoteLongestStreak,
    error: profileError ? { message: profileError } : null,
    latestUpdatedAt: profileUpdatedAt || undefined,
  }, {
    pendingOverride: 0,
    notes: `Longest streak: ${Math.max(localStreak, remoteLongestStreak)} day(s)`,
  });

  const localCounts: LocalHarvestCounts = {
    localResumes: localHarvest.resumes.length,
    localCodingSubmissions: localHarvest.codingSubmissions.length,
    localSavedQuestions: localHarvest.savedQuestions.length,
    localPlacementSessions: localHarvest.placementSessions.length,
    localMockInterviews: localHarvest.mockInterviews.length,
    localCompanyTargets: localHarvest.companyTargets.length,
    localRoadmapTasks: localHarvest.roadmapTasks.length,
    localTotalItems: localHarvest.totalItems,
  };

  const hasSchemaFixRequired = missingTables.length > 0 || missingColumns.length > 0;
  const hasPendingOffline = offlineQueue.length > 0;
  const anyCloudErrors = modules.some((m) => m.syncStatus === 'Cloud Error');
  const anyPendingSync = modules.some((m) => m.syncStatus === 'Pending Sync');

  // Overall status determination:
  // "Healthy" strictly requires authentication, active connection, no missing tables, profile found, and no sync errors.
  let overallStatus: CareerPilotDiagnosticReport['overallStatus'] = 'healthy';
  let connectionStatus: CareerPilotDiagnosticReport['supabaseConnectionStatus'] = 'Connected';

  if (!authUserId) {
    overallStatus = 'unauthenticated';
    warnings.push('No active Supabase user session detected. User is operating in local/guest mode.');
  } else if (hasSchemaFixRequired) {
    overallStatus = 'degraded';
    connectionStatus = 'Degraded';
    warnings.push(`Supabase schema setup required: missing table(s) ${missingTables.join(', ')}.`);
  } else if (rlsErrors.length > 0 || anyCloudErrors) {
    overallStatus = 'degraded';
    connectionStatus = 'Degraded';
    warnings.push(`${rlsErrors.length} database or RLS permission error(s) encountered.`);
  } else if (!profileFound) {
    overallStatus = 'degraded';
    warnings.push(`No student profile record found in Supabase 'profiles' table for user ID: ${authUserId}`);
  } else if (hasPendingOffline || anyPendingSync) {
    overallStatus = 'degraded';
    warnings.push(`There are pending items awaiting cloud synchronization.`);
  }

  const report: CareerPilotDiagnosticReport = {
    timestamp,
    environment,
    supabaseUrl: sanitizedUrl,
    supabaseConfigured: isConfigured,
    supabaseConnectionStatus: connectionStatus,
    authenticatedUserId: authUserId,
    authenticatedEmail: authEmail,
    authProvider,
    sessionValid,
    sessionExpiry,
    hasSchemaFixRequired,
    missingTables,
    missingColumns,
    schemaFixSql: SUPABASE_SETUP_SQL,
    localCounts,
    profileFound,
    profileId,
    profileRole,
    hasProfileDataJson,
    profileError,
    resumeCount: resumeRes.count,
    codingSubmissionCount: codingRes.count,
    savedQuestionCount: savedQuestionsRes.count,
    placementAttemptCount: placementRes.count,
    mockInterviewTotalCount: mockInterviewTotalRes.count,
    technicalInterviewCount: technicalInterviewRes.count,
    hrInterviewCount: hrInterviewRes.count,
    studentActivityLogCount: (profileFound ? 1 : 0) + resumeRes.count + codingRes.count + placementRes.count + mockInterviewTotalRes.count,
    roadmapRecordCount: Math.max(remoteRoadmapCount, localRoadmapCount),
    companyPrepRecordCount: Math.max(remoteCompanyTargetCount, localTargetCount),
    studyPlannerRecordCount: Math.max(remoteStudyPlanCount, localStudyPlanCount),
    modules,
    rlsErrors,
    warnings,
    overallStatus,
  };

  // Structured console log
  console.groupCollapsed(`[CareerPilot Persistence Audit] ${environment} (${overallStatus.toUpperCase()})`);
  console.log('Timestamp:', timestamp);
  console.log('Supabase URL:', sanitizedUrl);
  console.log('Auth User ID:', authUserId || 'NONE (Guest)');
  console.log('Profile In Cloud:', profileFound ? `YES (ID: ${profileId})` : 'NO');
  console.table(
    modules.map((m) => ({
      Module: m.module,
      'Local Cache': m.localCache,
      'Cloud Records': m.cloudRecords,
      'Sync Status': m.syncStatus,
      'Last Cloud Sync': m.lastCloudSync,
      'Pending Items': m.pendingItems,
      Errors: m.errors || '-',
    }))
  );
  if (rlsErrors.length > 0) console.error('RLS Errors:', rlsErrors);
  if (warnings.length > 0) console.warn('Audit Warnings:', warnings);
  console.groupEnd();

  return report;
}
