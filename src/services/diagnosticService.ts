import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getStoredDailyTasks } from './roadmapStorage';
import { getStudentTargets } from './companyPrepStorage';
import { cloudSyncService } from './cloudSyncService';
import { SUPABASE_SETUP_SQL } from '../data/supabaseSqlScript';

export interface ModuleDiagnosticDetail {
  name: string;
  tableOrSource: string;
  count: number;
  status: 'ok' | 'empty' | 'error' | 'not_found' | 'missing_table';
  errorDetails?: string;
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

  // Detailed breakdown
  modules: ModuleDiagnosticDetail[];
  
  // Errors & Warnings
  rlsErrors: string[];
  warnings: string[];
  overallStatus: 'healthy' | 'degraded' | 'error' | 'unauthenticated' | 'unconfigured';
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
  const modules: ModuleDiagnosticDetail[] = [];
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

  // Helper to query table count and errors safely
  const queryTable = async (
    moduleName: string,
    tableName: string,
    filterColumn: string = 'user_id',
    additionalFilter?: (query: any) => any
  ): Promise<{ count: number; error: any; sample?: any }> => {
    try {
      let q = supabase.from(tableName).select('id', { count: 'exact' });
      if (effectiveUserId && effectiveUserId !== 'guest') {
        q = q.eq(filterColumn, effectiveUserId);
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
      return { count: resolvedCount, error: null, sample: dataArray.length > 0 ? dataArray[0] : null };
    } catch (err: any) {
      return { count: 0, error: err };
    }
  };

  // 2. Query Profile
  let profileFound = false;
  let profileId: string | null = null;
  let profileRole: string | null = null;
  let hasProfileDataJson = false;
  let profileError: string | null = null;
  let remoteRoadmapCount = 0;
  let remoteCompanyTargetCount = 0;

  try {
    const initialProf = await supabase
      .from('profiles')
      .select('id, full_name, role, target_role, profile_data, career_goal')
      .eq('id', effectiveUserId)
      .maybeSingle();

    let profData: any = initialProf.data;
    let profErr = initialProf.error;

    // Check for missing profile_data column (Postgres error 42703)
    if (profErr && (profErr.code === '42703' || profErr.message?.includes('profile_data'))) {
      missingColumns.push('profiles.profile_data');
      const fallbackProf = await supabase
        .from('profiles')
        .select('id, full_name, role, target_role, career_goal')
        .eq('id', effectiveUserId)
        .maybeSingle();

      if (!fallbackProf.error) {
        profData = fallbackProf.data;
        profErr = null;
      }
    }

    if (profErr) {
      profileError = `${profErr.code || ''} ${profErr.message}`.trim();
      rlsErrors.push(`profiles: ${profileError}`);
      modules.push({
        name: 'Student Profile',
        tableOrSource: 'profiles',
        count: 0,
        status: 'error',
        errorDetails: profileError,
      });
    } else if (profData) {
      profileFound = true;
      profileId = profData.id;
      profileRole = profData.role || 'student';
      hasProfileDataJson = !!profData.profile_data;

      // Check roadmap and targets in profile_data
      if (profData.profile_data?.roadmap_tasks && Array.isArray(profData.profile_data.roadmap_tasks)) {
        remoteRoadmapCount = profData.profile_data.roadmap_tasks.length;
      }
      if (profData.profile_data?.company_targets && Array.isArray(profData.profile_data.company_targets)) {
        remoteCompanyTargetCount = profData.profile_data.company_targets.length;
      }

      // If stored in career_goal envelope
      if (typeof profData.career_goal === 'string' && profData.career_goal.startsWith('__CP_DATA__')) {
        try {
          const parsed = JSON.parse(profData.career_goal.replace(/^__CP_DATA__/, ''));
          if (parsed.roadmap_tasks && Array.isArray(parsed.roadmap_tasks) && remoteRoadmapCount === 0) {
            remoteRoadmapCount = parsed.roadmap_tasks.length;
          }
          if (parsed.company_targets && Array.isArray(parsed.company_targets) && remoteCompanyTargetCount === 0) {
            remoteCompanyTargetCount = parsed.company_targets.length;
          }
        } catch (_) {}
      }

      const notes = hasProfileDataJson
        ? `Profile ID: ${profData.id} | Target Role: ${profData.target_role || 'Not set'}`
        : `Profile ID: ${profData.id} (Legacy schema - run SQL script to add profile_data column)`;

      modules.push({
        name: 'Student Profile',
        tableOrSource: 'profiles',
        count: 1,
        status: 'ok',
        notes,
      });
    } else {
      modules.push({
        name: 'Student Profile',
        tableOrSource: 'profiles',
        count: 0,
        status: 'not_found',
        notes: 'No profile record found matching authenticated user ID',
      });
    }
  } catch (err: any) {
    profileError = err?.message || 'Profile query error';
    modules.push({
      name: 'Student Profile',
      tableOrSource: 'profiles',
      count: 0,
      status: 'error',
      errorDetails: profileError || undefined,
    });
  }

  // 3. Query all other core Supabase tables concurrently
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

  // Helper to add module result
  const recordModule = (name: string, table: string, res: { count: number; error: any }) => {
    if (res.error) {
      const errCode = res.error.code || '';
      const errMsg = res.error.message || res.error.toString();
      const errStr = `${errCode} ${errMsg}`.trim();
      const isMissingTable = errCode === 'PGRST205' || errCode === '42P01' || errMsg.includes('schema cache') || errMsg.includes('does not exist');

      if (isMissingTable) {
        const cleanTableName = table.split(' ')[0];
        if (!missingTables.includes(cleanTableName)) {
          missingTables.push(cleanTableName);
        }
        modules.push({
          name,
          tableOrSource: table,
          count: 0,
          status: 'missing_table',
          errorDetails: `Table '${cleanTableName}' not found in Supabase schema. Run supabase-schema.sql to create it.`,
          notes: 'Local Storage fallback active & protecting practice records.',
        });
      } else {
        rlsErrors.push(`${table} (${name}): ${errStr}`);
        modules.push({
          name,
          tableOrSource: table,
          count: 0,
          status: 'error',
          errorDetails: errStr,
        });
      }
    } else {
      modules.push({
        name,
        tableOrSource: table,
        count: res.count,
        status: res.count > 0 ? 'ok' : 'empty',
      });
    }
  };

  recordModule('Resume Versions', 'resumes', resumeRes);
  recordModule('Coding Submissions', 'coding_submissions', codingRes);
  recordModule('Saved Coding Questions', 'saved_coding_questions', savedQuestionsRes);
  recordModule('Placement Test Attempts', 'placement_sessions', placementRes);
  recordModule('Total Mock Interviews', 'mock_interviews', mockInterviewTotalRes);
  recordModule('Technical Mock Interviews', 'mock_interviews [technical]', technicalInterviewRes);
  recordModule('HR Mock Interviews', 'mock_interviews [hr/behavioral]', hrInterviewRes);

  // 4. Check Roadmap & Company Prep record counts
  const localRoadmap = getStoredDailyTasks(effectiveUserId);
  const localRoadmapCount = Array.isArray(localRoadmap) ? localRoadmap.length : 0;
  const finalRoadmapCount = Math.max(remoteRoadmapCount, localRoadmapCount);

  modules.push({
    name: 'Roadmap Tasks',
    tableOrSource: 'profiles.profile_data.roadmap_tasks',
    count: finalRoadmapCount,
    status: finalRoadmapCount > 0 ? 'ok' : 'empty',
    notes: `Remote: ${remoteRoadmapCount} | Local Cache: ${localRoadmapCount}`,
  });

  const localTargets = getStudentTargets(effectiveUserId);
  const localTargetCount = Array.isArray(localTargets) ? localTargets.length : 0;
  const finalCompanyPrepCount = Math.max(remoteCompanyTargetCount, localTargetCount);

  modules.push({
    name: 'Company Targets',
    tableOrSource: 'profiles.profile_data.company_targets',
    count: finalCompanyPrepCount,
    status: finalCompanyPrepCount > 0 ? 'ok' : 'empty',
    notes: `Remote: ${remoteCompanyTargetCount} | Local Cache: ${localTargetCount}`,
  });

  // 5. Check Study Planner records
  let studyPlannerCount = 0;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`careerpilot_study_plan_${effectiveUserId}`)) {
          studyPlannerCount++;
        }
      }
    }
  } catch (_) {}

  modules.push({
    name: 'Study Planner Records',
    tableOrSource: 'localStorage / StudyPlanState',
    count: studyPlannerCount,
    status: studyPlannerCount > 0 ? 'ok' : 'empty',
  });

  // 6. Compute Authentic Student Activity Logs
  const authenticActivityTotal =
    (profileFound ? 1 : 0) +
    resumeRes.count +
    codingRes.count +
    placementRes.count +
    mockInterviewTotalRes.count +
    finalCompanyPrepCount;

  modules.push({
    name: 'Authentic Student Activities',
    tableOrSource: 'Aggregated Cross-Module Logs',
    count: authenticActivityTotal,
    status: authenticActivityTotal > 0 ? 'ok' : 'empty',
  });

  // 5b. Local Storage Harvest Statistics (to detect AI Studio vs Vercel divergence)
  const localHarvest = cloudSyncService.harvestAllLocalData(effectiveUserId);
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

  // Determine overall status
  let overallStatus: CareerPilotDiagnosticReport['overallStatus'] = 'healthy';
  let connectionStatus: CareerPilotDiagnosticReport['supabaseConnectionStatus'] = 'Connected';

  if (!authUserId) {
    overallStatus = 'unauthenticated';
    warnings.push('No active Supabase user session detected. User is operating in guest / unauthenticated mode.');
  } else if (hasSchemaFixRequired) {
    overallStatus = 'degraded';
    connectionStatus = 'Degraded';
    warnings.push(`Supabase schema setup required: ${missingTables.length} table(s) and ${missingColumns.length} column(s) are missing.`);
  } else if (rlsErrors.length > 0) {
    overallStatus = 'degraded';
    connectionStatus = 'Degraded';
    warnings.push(`${rlsErrors.length} database or RLS permission error(s) encountered during module inspection.`);
  } else if (!profileFound) {
    overallStatus = 'degraded';
    warnings.push(`No student profile record found in Supabase 'profiles' table for user ID: ${authUserId}`);
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
    studentActivityLogCount: authenticActivityTotal,
    roadmapRecordCount: finalRoadmapCount,
    companyPrepRecordCount: finalCompanyPrepCount,
    studyPlannerRecordCount: studyPlannerCount,
    modules,
    rlsErrors,
    warnings,
    overallStatus,
  };

  // Structured console log
  console.groupCollapsed(`[CareerPilot Read-Only Diagnostics] ${environment} (${overallStatus.toUpperCase()})`);
  console.log('Timestamp:', timestamp);
  console.log('Supabase Sanitized URL:', sanitizedUrl);
  console.log('Auth User ID:', authUserId || 'NONE (Unauthenticated)');
  console.log('Auth Email:', authEmail || 'N/A');
  console.log('Profile Found:', profileFound ? `YES (ID: ${profileId})` : 'NO');
  console.log('Schema Fix Required:', hasSchemaFixRequired ? `YES (Missing: ${[...missingTables, ...missingColumns].join(', ')})` : 'NO');
  console.table(
    modules.map((m) => ({
      Module: m.name,
      'Table / Source': m.tableOrSource,
      'Count / Records': m.count,
      Status: m.status.toUpperCase(),
      'Error / Notes': m.errorDetails || m.notes || '-',
    }))
  );
  if (rlsErrors.length > 0) {
    console.error('RLS / Table Errors:', rlsErrors);
  }
  if (warnings.length > 0) {
    console.warn('Diagnostic Warnings:', warnings);
  }
  console.groupEnd();

  return report;
}
