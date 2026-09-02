import { SyncErrorCategory, StructuredSyncError, SyncAuditLog } from '../types/sync';

const SYNC_AUDIT_LOG_KEY = 'careerpilot_sync_audit_logs';
const MAX_LOG_ENTRIES = 50;

/**
 * Classify raw Supabase, PostgREST, fetch, or runtime errors into authoritative categories
 * with user-friendly descriptions and internal debugging summaries.
 */
export function classifySyncError(
  err: any,
  context?: { table?: string; operation?: string; recordId?: string }
): StructuredSyncError {
  const timestamp = new Date().toISOString();

  if (!err) {
    return {
      category: 'UNKNOWN_ERROR',
      userMessage: 'Sync could not be completed at this time. Your changes remain safely queued on this device.',
      technicalSummary: 'No error details provided',
      table: context?.table,
      operation: context?.operation,
      recordId: context?.recordId,
      timestamp,
    };
  }

  const raw = typeof err === 'string' ? err : err.message || JSON.stringify(err);
  const code = (err && typeof err === 'object' ? err.code : '') || '';
  const lower = `${raw} ${code}`.toLowerCase();

  // 1. Authentication & Session Errors
  if (
    code === 'PGRST301' ||
    code === '401' ||
    lower.includes('jwt') ||
    lower.includes('auth') ||
    lower.includes('unauthenticated') ||
    lower.includes('session expired') ||
    lower.includes('not logged in') ||
    lower.includes('active supabase authentication session required') ||
    lower.includes('user not found') ||
    lower.includes('invalid claim')
  ) {
    return {
      category: 'AUTH_ERROR',
      userMessage: 'Your session has expired. Please sign in again to sync your changes.',
      technicalSummary: `[AUTH] ${code ? `Code: ${code} - ` : ''}${raw.slice(0, 150)}`,
      table: context?.table,
      operation: context?.operation,
      recordId: context?.recordId,
      timestamp,
    };
  }

  // 2. Row Level Security (RLS) & Authorization Errors
  if (
    code === '42501' ||
    code === '403' ||
    lower.includes('row-level security') ||
    lower.includes('violates row-level') ||
    lower.includes('permission denied') ||
    lower.includes('insufficient_privilege')
  ) {
    return {
      category: 'RLS_ERROR',
      userMessage: 'Permission check failed for your account. Your changes are safely preserved in the local queue for retry.',
      technicalSummary: `[RLS] ${code ? `Code: ${code} - ` : ''}${raw.slice(0, 150)}`,
      table: context?.table,
      operation: context?.operation,
      recordId: context?.recordId,
      timestamp,
    };
  }

  // 3. Network & Connection Interruption Errors
  if (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('econnrefused') ||
    lower.includes('timeout') ||
    lower.includes('abort') ||
    lower.includes('offline') ||
    lower.includes('connection lost') ||
    lower.includes('err_internet_disconnected') ||
    lower.includes('networkerror')
  ) {
    return {
      category: 'NETWORK_ERROR',
      userMessage: 'Network connection was interrupted during sync. Your changes remain safely queued on this device.',
      technicalSummary: `[NETWORK] ${raw.slice(0, 150)}`,
      table: context?.table,
      operation: context?.operation,
      recordId: context?.recordId,
      timestamp,
    };
  }

  // 4. Schema & Column Mismatch Errors (PostgREST cache / column not found)
  if (
    code === 'PGRST205' ||
    code === '42703' ||
    code === '42P01' ||
    code === 'PGRST116' ||
    lower.includes('schema cache') ||
    lower.includes('column') ||
    lower.includes('relation') ||
    lower.includes('does not exist')
  ) {
    return {
      category: 'SCHEMA_ERROR',
      userMessage: 'Database schema adjustment detected for one or more fields. Your data is preserved locally and will retry.',
      technicalSummary: `[SCHEMA] ${code ? `Code: ${code} - ` : ''}${raw.slice(0, 150)}`,
      table: context?.table,
      operation: context?.operation,
      recordId: context?.recordId,
      timestamp,
    };
  }

  // 5. Validation & Constraint Errors
  if (
    code === '23502' ||
    code === '23514' ||
    code === '23505' ||
    code === '400' ||
    lower.includes('check constraint') ||
    lower.includes('not-null') ||
    lower.includes('invalid input') ||
    lower.includes('bad request') ||
    lower.includes('validation')
  ) {
    return {
      category: 'VALIDATION_ERROR',
      userMessage: 'One or more fields require validation before cloud sync. Your data is safely held in the queue.',
      technicalSummary: `[VALIDATION] ${code ? `Code: ${code} - ` : ''}${raw.slice(0, 150)}`,
      table: context?.table,
      operation: context?.operation,
      recordId: context?.recordId,
      timestamp,
    };
  }

  // 6. Server & Infrastructure Errors
  if (
    code === '500' ||
    code === '502' ||
    code === '503' ||
    code === '504' ||
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('504') ||
    lower.includes('internal server error') ||
    lower.includes('service unavailable')
  ) {
    return {
      category: 'SERVER_ERROR',
      userMessage: 'The cloud database server returned a temporary error. Your data is queued and ready to retry.',
      technicalSummary: `[SERVER] ${code ? `Code: ${code} - ` : ''}${raw.slice(0, 150)}`,
      table: context?.table,
      operation: context?.operation,
      recordId: context?.recordId,
      timestamp,
    };
  }

  return {
    category: 'UNKNOWN_ERROR',
    userMessage: 'Some changes could not be synchronized immediately. They remain safely queued on this device.',
    technicalSummary: `[UNKNOWN] ${raw.slice(0, 150)}`,
    table: context?.table,
    operation: context?.operation,
    recordId: context?.recordId,
    timestamp,
  };
}

/**
 * Record a structured sync audit log entry in the safe ring buffer.
 * Strip out sensitive fields (passwords, tokens, API keys, private emails).
 */
export function recordSyncAuditLog(entry: SyncAuditLog): void {
  try {
    // Sanitize rawMessage to prevent accidental leakage of sensitive tokens
    const sanitizedRaw = (entry.rawMessage || '')
      .replace(/bearer\s+[A-Za-z0-9-_.]+/gi, 'bearer [REDACTED]')
      .replace(/apikey=[A-Za-z0-9-_.]+/gi, 'apikey=[REDACTED]')
      .replace(/password[:=]\s*["']?[^"',\s]+["']?/gi, 'password=[REDACTED]');

    const safeLog: SyncAuditLog = {
      operation: entry.operation,
      table: entry.table,
      recordId: entry.recordId,
      userId: entry.userId,
      errorCategory: entry.errorCategory,
      rawMessage: sanitizedRaw.slice(0, 250),
      timestamp: entry.timestamp || new Date().toISOString(),
      retryCount: entry.retryCount || 0,
    };

    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[SyncAuditLogger]', {
        operation: safeLog.operation,
        table: safeLog.table,
        category: safeLog.errorCategory,
        userId: safeLog.userId,
        timestamp: safeLog.timestamp,
        retryCount: safeLog.retryCount,
      });
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(SYNC_AUDIT_LOG_KEY);
      const list: SyncAuditLog[] = raw ? JSON.parse(raw) : [];
      list.unshift(safeLog);
      const trimmed = list.slice(0, MAX_LOG_ENTRIES);
      localStorage.setItem(SYNC_AUDIT_LOG_KEY, JSON.stringify(trimmed));
    }
  } catch (_) {}
}

/**
 * Retrieve recent structured sync audit logs
 */
export function getSyncAuditLogs(userId?: string): SyncAuditLog[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = localStorage.getItem(SYNC_AUDIT_LOG_KEY);
    if (!raw) return [];
    const list: SyncAuditLog[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    if (userId && userId !== 'guest') {
      return list.filter((l) => l.userId === userId);
    }
    return list;
  } catch (_) {
    return [];
  }
}

/**
 * Clear sync audit logs
 */
export function clearSyncAuditLogs(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(SYNC_AUDIT_LOG_KEY);
    }
  } catch (_) {}
}
