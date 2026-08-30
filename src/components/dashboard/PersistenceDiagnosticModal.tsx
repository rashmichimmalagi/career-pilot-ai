import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  X,
  Database,
  User,
  ShieldAlert,
  Server,
  Layers,
  UploadCloud,
  DownloadCloud,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  FileCode,
  CloudCheck,
  HardDrive,
} from 'lucide-react';
import {
  CareerPilotDiagnosticReport,
  PersistenceSyncStatus,
  ModulePersistenceAuditRow,
} from '../../services/diagnosticService';
import { cloudSyncService, CloudSyncResult } from '../../services/cloudSyncService';
import { SUPABASE_SETUP_SQL } from '../../data/supabaseSqlScript';

interface PersistenceDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: CareerPilotDiagnosticReport | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const PersistenceDiagnosticModal: React.FC<PersistenceDiagnosticModalProps> = ({
  isOpen,
  onClose,
  report,
  isLoading,
  onRefresh,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlViewer, setShowSqlViewer] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!report) return;
    const sanitizedReport = {
      timestamp: report.timestamp,
      environment: report.environment,
      supabaseUrl: report.supabaseUrl,
      supabaseConnectionStatus: report.supabaseConnectionStatus,
      supabaseConfigured: report.supabaseConfigured,
      authenticatedUserId: report.authenticatedUserId,
      authenticatedEmail: report.authenticatedEmail,
      authProvider: report.authProvider,
      sessionValid: report.sessionValid,
      hasSchemaFixRequired: report.hasSchemaFixRequired,
      missingTables: report.missingTables,
      missingColumns: report.missingColumns,
      localCounts: report.localCounts,
      profile: {
        found: report.profileFound,
        id: report.profileId,
        role: report.profileRole,
        hasProfileDataJson: report.hasProfileDataJson,
        error: report.profileError || null,
      },
      counts: {
        resumeCount: report.resumeCount,
        codingSubmissionCount: report.codingSubmissionCount,
        savedQuestionCount: report.savedQuestionCount,
        placementAttemptCount: report.placementAttemptCount,
        mockInterviewTotalCount: report.mockInterviewTotalCount,
        technicalInterviewCount: report.technicalInterviewCount,
        hrInterviewCount: report.hrInterviewCount,
        studentActivityLogCount: report.studentActivityLogCount,
        roadmapRecordCount: report.roadmapRecordCount,
        companyPrepRecordCount: report.companyPrepRecordCount,
        studyPlannerRecordCount: report.studyPlannerRecordCount,
      },
      auditRows: report.modules,
      rlsErrors: report.rlsErrors,
      warnings: report.warnings,
      overallStatus: report.overallStatus,
    };

    navigator.clipboard.writeText(JSON.stringify(sanitizedReport, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handlePushToCloud = async () => {
    if (!report?.authenticatedUserId) {
      setSyncStatusMsg('Error: You must be logged in to sync data to Supabase.');
      return;
    }
    setIsSyncing(true);
    setSyncStatusMsg('Scanning local storage and uploading records to Supabase...');
    try {
      const res: CloudSyncResult = await cloudSyncService.syncLocalDataToCloud(report.authenticatedUserId);
      if (res.success) {
        setSyncStatusMsg(`Successfully uploaded: ${res.uploadedCounts.codingSubmissions} submissions, ${res.uploadedCounts.resumes} resumes, ${res.uploadedCounts.mockInterviews} interviews, ${res.uploadedCounts.placementSessions} tests.`);
        onRefresh();
      } else {
        setSyncStatusMsg(`Sync warning: ${res.errors.join(', ')}`);
      }
    } catch (e: any) {
      setSyncStatusMsg(`Upload failed: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    if (!report?.authenticatedUserId) {
      setSyncStatusMsg('Error: You must be logged in to pull data from Supabase.');
      return;
    }
    setIsSyncing(true);
    setSyncStatusMsg('Fetching authoritative records from Supabase and hydrating local cache...');
    try {
      const ok = await cloudSyncService.hydrateCloudDataToLocal(report.authenticatedUserId);
      if (ok) {
        setSyncStatusMsg('Local cache hydrated from Supabase successfully.');
        onRefresh();
      } else {
        setSyncStatusMsg('Failed to hydrate local cache from Supabase.');
      }
    } catch (e: any) {
      setSyncStatusMsg(`Pull failed: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status: CareerPilotDiagnosticReport['overallStatus']) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
          </span>
        );
      case 'degraded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Degraded
          </span>
        );
      case 'unauthenticated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <User className="w-3.5 h-3.5" /> Unauthenticated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Error / Misconfigured
          </span>
        );
    }
  };

  const getSyncStatusBadge = (syncStatus: PersistenceSyncStatus) => {
    switch (syncStatus) {
      case 'Cloud Synced':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3" /> Cloud Synced
          </span>
        );
      case 'Pending Sync':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
            <UploadCloud className="w-3 h-3" /> Pending Sync
          </span>
        );
      case 'Cloud Error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap">
            <XCircle className="w-3 h-3" /> Cloud Error
          </span>
        );
      case 'Local Only':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 whitespace-nowrap">
            <HardDrive className="w-3 h-3" /> Local Only
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            N/A
          </span>
        );
    }
  };

  return (
    <div
      id="persistence-diagnostics-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="persistence-diagnostics-modal-content"
        className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  CareerPilot Persistence Audit
                </h3>
                {report && getStatusBadge(report.overallStatus)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authoritative Supabase Single Source of Truth & Synchronization Diagnostic
              </p>
            </div>
          </div>
          <button
            id="close-diagnostics-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading || !report ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Auditing Supabase persistence tables and inspecting local cache sync states...
            </p>
          </div>
        ) : (
          <div className="space-y-6 text-xs">
            {/* Top Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Environment */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <Server className="w-3.5 h-3.5" />
                  <span>Deployment Environment</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100">{report.environment}</div>
              </div>

              {/* Supabase Connection Status */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <Database className="w-3.5 h-3.5" />
                  <span>Supabase Connection</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      report.supabaseConfigured ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span>{report.supabaseConnectionStatus}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate" title={report.supabaseUrl}>
                  {report.supabaseUrl}
                </div>
              </div>

              {/* Auth User ID */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <User className="w-3.5 h-3.5" />
                  <span>Authenticated User ID</span>
                </div>
                <div
                  className="font-mono font-bold text-[11px] text-slate-900 dark:text-slate-100 truncate"
                  title={report.authenticatedUserId || 'Unauthenticated'}
                >
                  {report.authenticatedUserId || 'None (Guest / Logged Out)'}
                </div>
                {report.authenticatedEmail && (
                  <div className="text-[10px] text-slate-400 truncate">{report.authenticatedEmail}</div>
                )}
              </div>

              {/* Profile Record Status */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                <div className="text-slate-400 font-medium">Profile in Supabase DB</div>
                <div className="flex items-center gap-2">
                  {report.profileFound ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Profile Row Found
                    </span>
                  ) : (
                    <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> No Profile Row
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {report.profileId ? `ID: ${report.profileId}` : 'No profile row returned'}
                </div>
              </div>

              {/* Session Validity */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                <div className="text-slate-400 font-medium">Supabase Auth Session</div>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {report.sessionValid ? 'Active Valid Session' : 'No Active Session'}
                </div>
                {report.authProvider && (
                  <div className="text-[10px] text-slate-400">Provider: {report.authProvider}</div>
                )}
              </div>

              {/* Authentic Activity Log Count */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Student Cloud Activities Total</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {report.studentActivityLogCount} verified log(s)
                </div>
              </div>
            </div>

            {/* Missing Schema Alert Banner & Quick Copy Action */}
            {report.hasSchemaFixRequired && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-amber-900 dark:text-amber-100 flex items-center gap-2">
                        <span>Supabase Database Schema Setup Required</span>
                      </div>
                      <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                        Your Supabase project is active, but requires the CareerPilot tables ({report.missingTables.join(', ') || 'tables'}) and columns ({report.missingColumns.join(', ') || 'columns'}) to be created.
                        Run the SQL script once in your Supabase SQL Editor to enable full multi-device synchronization.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <button
                      id="copy-sql-migration-btn"
                      onClick={handleCopySql}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                    >
                      {copiedSql ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Copied SQL Script!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy SQL Script</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowSqlViewer(!showSqlViewer)}
                      className="p-2 rounded-xl text-amber-800 dark:text-amber-200 hover:bg-amber-500/20 transition-colors cursor-pointer"
                      title={showSqlViewer ? 'Hide SQL Code' : 'View SQL Code'}
                    >
                      {showSqlViewer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible SQL Viewer */}
                {showSqlViewer && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[10px] max-h-48 overflow-y-auto space-y-1">
                    <div className="flex justify-between items-center text-slate-400 pb-1 border-b border-slate-800 mb-2">
                      <span>SQL Schema DDL (Idempotent: Safe to rerun)</span>
                      <button
                        onClick={handleCopySql}
                        className="text-indigo-400 hover:text-indigo-300 cursor-pointer text-[10px] flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                    <pre className="whitespace-pre overflow-x-auto text-emerald-400">{SUPABASE_SETUP_SQL}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Cloud Convergence & Sync Action Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200 text-sm">
                    <ArrowRightLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Cloud Synchronization Actions</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Supabase is the single source of truth. Backfill local cache to cloud or pull cloud data to local cache.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    id="modal-push-to-cloud-btn"
                    onClick={handlePushToCloud}
                    disabled={isSyncing || !report?.authenticatedUserId}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                    title="Upload local practice history into Supabase cloud"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Local to Cloud</span>
                  </button>

                  <button
                    id="modal-pull-from-cloud-btn"
                    onClick={handlePullFromCloud}
                    disabled={isSyncing || !report?.authenticatedUserId}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                    title="Pull remote Supabase records into local browser cache"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span>Hydrate from Cloud</span>
                  </button>
                </div>
              </div>

              {syncStatusMsg && (
                <div className="p-2.5 rounded-xl bg-indigo-100/60 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 text-xs font-mono">
                  {syncStatusMsg}
                </div>
              )}
            </div>

            {/* Persistence Audit Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Module Persistence Audit (Single Source of Truth)
                </h4>
                <span className="text-[11px] text-slate-400">
                  {report.authenticatedUserId ? `User ID: ${report.authenticatedUserId.substring(0, 8)}...` : 'Guest Mode'}
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3.5">Module</th>
                      <th className="py-3 px-3 text-center">Local Cache</th>
                      <th className="py-3 px-3 text-center">Cloud Records</th>
                      <th className="py-3 px-3 text-center">Sync Status</th>
                      <th className="py-3 px-3 text-center">Last Cloud Sync</th>
                      <th className="py-3 px-3 text-center">Pending</th>
                      <th className="py-3 px-3">Errors / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 text-xs">
                    {report.modules.map((row: ModulePersistenceAuditRow, idx: number) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{row.module}</div>
                          <div className="text-[10px] font-mono text-slate-400">{row.tableOrSource}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                          {row.localCache}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                          {row.cloudRecords}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {getSyncStatusBadge(row.syncStatus)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {row.lastCloudSync}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {row.pendingItems > 0 ? (
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                              {row.pendingItems}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">0</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[11px]">
                          {row.errors ? (
                            <span className="font-mono text-rose-600 dark:text-rose-400 block truncate max-w-xs" title={row.errors}>
                              {row.errors}
                            </span>
                          ) : row.notes ? (
                            <span className="text-slate-500 dark:text-slate-400 truncate block max-w-xs" title={row.notes}>
                              {row.notes}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RLS & Read Errors Section (If Any) */}
            {report.rlsErrors && report.rlsErrors.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>RLS / Database Read Errors Detected ({report.rlsErrors.length})</span>
                </div>
                <ul className="text-[11px] font-mono text-rose-700 dark:text-rose-300 space-y-1 list-disc list-inside">
                  {report.rlsErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings Section (If Any) */}
            {report.warnings && report.warnings.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Diagnostic Warnings</span>
                </div>
                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                  {report.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  id="copy-diagnostics-btn"
                  onClick={handleCopy}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                      <span>Copied Audit to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Audit Report</span>
                    </>
                  )}
                </button>

                <button
                  id="refresh-diagnostics-btn"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Re-test Audit</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
