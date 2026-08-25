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
  Code2,
  ChevronDown,
  ChevronUp,
  FileCode,
} from 'lucide-react';
import { CareerPilotDiagnosticReport } from '../../services/diagnosticService';
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
      modules: report.modules,
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

  return (
    <div
      id="persistence-diagnostics-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="persistence-diagnostics-modal-content"
        className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
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
                  CareerPilot Read-Only Diagnostics
                </h3>
                {report && getStatusBadge(report.overallStatus)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live Supabase Persistence, RLS & Authentication State Inspector
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
              Querying Supabase and inspecting module persistence...
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
                <div className="text-slate-400 font-medium">Profile Record in DB</div>
                <div className="flex items-center gap-2">
                  {report.profileFound ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Record Found
                    </span>
                  ) : (
                    <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Not Found
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
                  <span>Student Activities Total</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {report.studentActivityLogCount} authentic log(s)
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

                {/* Instructions Steps */}
                <div className="pt-2 border-t border-amber-500/20 text-[11px] space-y-1 text-amber-800 dark:text-amber-300/80">
                  <span className="font-semibold block">How to apply:</span>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Click <strong>Copy SQL Script</strong> above.</li>
                    <li>Go to your <strong>Supabase Dashboard &rarr; SQL Editor</strong>.</li>
                    <li>Paste the script into the query editor and click <strong>Run</strong>.</li>
                    <li>Return here and click <strong>Re-test</strong> below to verify your cloud connection!</li>
                  </ol>
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
                    <span>Cloud Synchronization & Convergence</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Safely backfill local practice data to Supabase, or hydrate local cache from Supabase without data loss.
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

              {/* Local vs Cloud Comparison Pills */}
              {report.localCounts && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 space-y-0.5">
                    <span className="text-slate-400 block text-[10px]">Coding Submissions</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Local: <span className="text-indigo-600 dark:text-indigo-400">{report.localCounts.localCodingSubmissions}</span> | Cloud: <span className="text-emerald-600 dark:text-emerald-400">{report.codingSubmissionCount}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 space-y-0.5">
                    <span className="text-slate-400 block text-[10px]">Resume Versions</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Local: <span className="text-indigo-600 dark:text-indigo-400">{report.localCounts.localResumes}</span> | Cloud: <span className="text-emerald-600 dark:text-emerald-400">{report.resumeCount}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 space-y-0.5">
                    <span className="text-slate-400 block text-[10px]">Mock Interviews</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Local: <span className="text-indigo-600 dark:text-indigo-400">{report.localCounts.localMockInterviews}</span> | Cloud: <span className="text-emerald-600 dark:text-emerald-400">{report.mockInterviewTotalCount}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 space-y-0.5">
                    <span className="text-slate-400 block text-[10px]">Placement Tests</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Local: <span className="text-indigo-600 dark:text-indigo-400">{report.localCounts.localPlacementSessions}</span> | Cloud: <span className="text-emerald-600 dark:text-emerald-400">{report.placementAttemptCount}</span>
                    </div>
                  </div>
                </div>
              )}

              {syncStatusMsg && (
                <div className="p-2.5 rounded-xl bg-indigo-100/60 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 text-xs font-mono">
                  {syncStatusMsg}
                </div>
              )}
            </div>

            {/* Read-Only Summary Table of Required Data Counts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Detailed Module Record Counts & Read Status
                </h4>
                <span className="text-[11px] text-slate-400">Scoped to Authenticated User</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                {report.modules.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{m.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{m.tableOrSource}</div>
                      {m.errorDetails && (
                        <div className="text-[11px] font-mono text-rose-600 dark:text-rose-400">
                          {m.errorDetails}
                        </div>
                      )}
                      {m.notes && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{m.notes}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs">
                        {m.count} {m.count === 1 ? 'record' : 'records'}
                      </span>
                      {m.status === 'ok' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : m.status === 'empty' ? (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50">
                          Empty
                        </span>
                      ) : m.status === 'not_found' ? (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50">
                          Not Found
                        </span>
                      ) : m.status === 'missing_table' ? (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                          Table Missing (Run SQL)
                        </span>
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
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
                      <span>Copied JSON to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Diagnostics</span>
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
                  <span>Re-test</span>
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
