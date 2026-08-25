import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface ModuleDiagnosticResult {
  module: string;
  table: string;
  count: number;
  status: 'ok' | 'empty' | 'error' | 'unconfigured';
  errorDetails?: string;
  sampleId?: string;
}

export interface CareerPilotDiagnosticReport {
  timestamp: string;
  environment: string;
  supabaseUrl: string;
  isConfigured: boolean;
  authenticatedUserId: string | null;
  authenticatedEmail: string | null;
  authProvider: string | null;
  sessionValid: boolean;
  modules: ModuleDiagnosticResult[];
  overallStatus: 'healthy' | 'degraded' | 'error' | 'unauthenticated' | 'unconfigured';
  warnings: string[];
}

/**
 * CareerPilot Persistence & Sync Diagnostic Engine
 * Provides comprehensive inspection of Supabase authentication, table connectivity,
 * RLS policies, and record counts across all CareerPilot modules.
 */
export async function runPersistenceDiagnostics(): Promise<CareerPilotDiagnosticReport> {
  const timestamp = new Date().toISOString();
  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
  const environment = isVercel ? 'Vercel Production' : 'AI Studio / Local Environment';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'Not Defined';
  const isConfigured = isSupabaseConfigured();

  const warnings: string[] = [];
  const modules: ModuleDiagnosticResult[] = [];

  if (!isConfigured) {
    warnings.push('Supabase credentials (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY) are missing.');
    return {
      timestamp,
      environment,
      supabaseUrl,
      isConfigured: false,
      authenticatedUserId: null,
      authenticatedEmail: null,
      authProvider: null,
      sessionValid: false,
      modules: [],
      overallStatus: 'unconfigured',
      warnings,
    };
  }

  // 1. Check Auth User & Session
  let authUserId: string | null = null;
  let authEmail: string | null = null;
  let authProvider: string | null = null;
  let sessionValid = false;

  try {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) {
      warnings.push(`Session retrieval error: ${sessionErr.message}`);
    } else if (sessionData?.session) {
      sessionValid = true;
      authUserId = sessionData.session.user.id;
      authEmail = sessionData.session.user.email || null;
      authProvider = sessionData.session.user.app_metadata?.provider || 'email';
    }
  } catch (err: any) {
    warnings.push(`Auth check exception: ${err?.message || 'Unknown auth error'}`);
  }

  const effectiveUserId = authUserId || 'guest';

  // Helper to test a table with specific column or count
  const checkTable = async (
    moduleName: string,
    tableName: string,
    userColumnName: string = 'user_id'
  ): Promise<ModuleDiagnosticResult> => {
    try {
      let query = supabase
        .from(tableName)
        .select('id', { count: 'exact' });

      if (effectiveUserId && effectiveUserId !== 'guest') {
        query = query.eq(userColumnName, effectiveUserId);
      }

      const { data, count, error } = await query;

      if (error) {
        return {
          module: moduleName,
          table: tableName,
          count: 0,
          status: 'error',
          errorDetails: `${error.code || ''} ${error.message}`.trim(),
        };
      }

      const dataArray = Array.isArray(data) ? (data as any[]) : [];
      const resolvedCount = typeof count === 'number' ? count : dataArray.length;
      const sampleId = dataArray.length > 0 ? (dataArray[0]?.id || 'exists') : undefined;

      return {
        module: moduleName,
        table: tableName,
        count: resolvedCount,
        status: resolvedCount > 0 ? 'ok' : 'empty',
        sampleId,
      };
    } catch (err: any) {
      return {
        module: moduleName,
        table: tableName,
        count: 0,
        status: 'error',
        errorDetails: err?.message || 'Query exception',
      };
    }
  };

  // Check all core tables
  const [
    profileCheck,
    resumeCheck,
    codingCheck,
    placementCheck,
    interviewCheck,
  ] = await Promise.all([
    checkTable('Student Profile', 'profiles', 'id'),
    checkTable('Resume Versions', 'resumes', 'user_id'),
    checkTable('Coding Submissions', 'coding_submissions', 'user_id'),
    checkTable('Placement Sessions', 'placement_sessions', 'user_id'),
    checkTable('Mock Interviews', 'mock_interviews', 'user_id'),
  ]);

  modules.push(profileCheck, resumeCheck, codingCheck, placementCheck, interviewCheck);

  // Check overall health
  const hasErrors = modules.some((m) => m.status === 'error');
  const totalRecords = modules.reduce((acc, m) => acc + m.count, 0);

  let overallStatus: CareerPilotDiagnosticReport['overallStatus'] = 'healthy';
  if (!authUserId) {
    overallStatus = 'unauthenticated';
  } else if (hasErrors) {
    overallStatus = 'degraded';
    warnings.push('One or more Supabase table queries encountered database or RLS errors.');
  } else if (totalRecords === 0) {
    warnings.push('Zero cloud records found for the current authenticated student ID in Supabase.');
  }

  const report: CareerPilotDiagnosticReport = {
    timestamp,
    environment,
    supabaseUrl: supabaseUrl.replace(/^(https:\/\/[^/]+).*$/, '$1'),
    isConfigured,
    authenticatedUserId: authUserId,
    authenticatedEmail: authEmail,
    authProvider,
    sessionValid,
    modules,
    overallStatus,
    warnings,
  };

  // Structured Developer Console Logging for instant cross-environment verification
  console.groupCollapsed(`[CareerPilot Diagnostics] ${environment} (${overallStatus.toUpperCase()})`);
  console.log('Timestamp:', timestamp);
  console.log('Supabase URL:', report.supabaseUrl);
  console.log('Authenticated User ID:', authUserId || 'NONE (Unauthenticated / Guest)');
  console.log('Authenticated Email:', authEmail || 'N/A');
  console.log('Auth Provider:', authProvider || 'N/A');
  console.table(
    modules.map((m) => ({
      Module: m.module,
      Table: m.table,
      'Records Found': m.count,
      Status: m.status.toUpperCase(),
      'Error Details': m.errorDetails || 'None',
    }))
  );
  if (warnings.length > 0) {
    console.warn('Diagnostic Warnings:', warnings);
  }
  console.groupEnd();

  return report;
}
