import React, { useState } from 'react';
import {
  FileText,
  Trash2,
  Download,
  Eye,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  AlertTriangle,
  UploadCloud,
  Check,
  Star,
  Layers,
  Loader2,
  Printer,
  Edit3,
} from 'lucide-react';
import { ResumeVersionItem } from '../../types/resume';
import { resumeService } from '../../services/resumeService';

interface MyResumesManagerProps {
  resumes: ResumeVersionItem[];
  currentResume: ResumeVersionItem | null;
  onSelectResumeToAnalyze: (resume: ResumeVersionItem) => void;
  onViewResume: (resume: ResumeVersionItem) => void;
  onMakeCurrent: (resume: ResumeVersionItem) => void;
  onDeleteResume: (resume: ResumeVersionItem) => Promise<void>;
  onPrintResume?: (resume: ResumeVersionItem) => void;
  onEditResume?: (resume: ResumeVersionItem) => void;
  onTriggerUpload: () => void;
  onTriggerCreateResume?: () => void;
  isLoading?: boolean;
}

export const MyResumesManager: React.FC<MyResumesManagerProps> = ({
  resumes,
  currentResume,
  onSelectResumeToAnalyze,
  onViewResume,
  onMakeCurrent,
  onDeleteResume,
  onPrintResume,
  onEditResume,
  onTriggerUpload,
  onTriggerCreateResume,
  isLoading = false,
}) => {
  const [showPreviousVersions, setShowPreviousVersions] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<ResumeVersionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Previous versions are all non-current resumes sorted by version descending
  const previousVersions = resumes
    .filter((r) => !r.isCurrent && r.id !== currentResume?.id)
    .sort((a, b) => b.version - a.version);

  const formatDate = (isoString?: string): string => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  const handleConfirmDelete = async () => {
    if (!resumeToDelete) return;
    try {
      setIsDeleting(true);
      await onDeleteResume(resumeToDelete);
      setResumeToDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickDownload = async (resume: ResumeVersionItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingId(resume.id);
    try {
      await resumeService.downloadResume(resume);
    } catch (err) {
      console.error('Error downloading resume:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Section Title */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>My Resumes</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {resumes.length} {resumes.length === 1 ? 'version' : 'versions'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your uploaded and AI-enhanced resume versions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onTriggerCreateResume && (
            <button
              onClick={onTriggerCreateResume}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Resume with AI</span>
            </button>
          )}
          <button
            onClick={onTriggerUpload}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-indigo-500" />
            <span>Upload Existing</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 1. CURRENT RESUME DISPLAY */}
      {/* ==================================================== */}
      {currentResume ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border-2 border-indigo-500/40 dark:border-indigo-500/30 p-5 sm:p-6 shadow-md transition-all">
          
          {/* Active Badge Header */}
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-xs">
              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>ACTIVE RESUME</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Updated: {formatDate(currentResume.updatedAt || currentResume.createdAt)}</span>
            </div>
          </div>

          {/* Main Card Content */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            
            {/* Resume Info */}
            <div className="md:col-span-7 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                    {currentResume.fileName || currentResume.versionLabel}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {currentResume.targetRole}
                    </span>
                    {currentResume.isAiImproved && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold">
                        <Sparkles className="w-3 h-3" /> AI Improved
                      </span>
                    )}
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-slate-500">v{currentResume.version}</span>
                  </div>
                </div>
              </div>

              {/* Analysis Scores pill if available */}
              {currentResume.analysisResult && (
                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>ATS Score: {currentResume.analysisResult.ats_score}/100</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    Role Match: {currentResume.analysisResult.role_match_score}%
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-2 flex-wrap pt-2 md:pt-0">
              
              {onEditResume && (
                <button
                  onClick={() => onEditResume(currentResume)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  title="Open and edit this resume directly in-place"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Resume</span>
                </button>
              )}

              <button
                onClick={() => onViewResume(currentResume)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition-all cursor-pointer"
                title="View and inspect this resume"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>View</span>
              </button>

              <button
                onClick={() => onSelectResumeToAnalyze(currentResume)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-xs transition-all cursor-pointer"
                title="Run AI Analysis on this resume"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyze</span>
              </button>

              {onPrintResume && (
                <button
                  onClick={() => onPrintResume(currentResume)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-xs transition-all cursor-pointer"
                  title={currentResume.isAiImproved || currentResume.resumeType === 'ai_generated' ? 'Print this resume' : 'Print the exact original uploaded PDF'}
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{currentResume.isAiImproved || currentResume.resumeType === 'ai_generated' ? 'Print' : 'Print Original Resume'}</span>
                </button>
              )}

              <button
                onClick={(e) => handleQuickDownload(currentResume, e)}
                disabled={downloadingId === currentResume.id}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition-all cursor-pointer disabled:opacity-60"
                title="Download formatted PDF resume"
              >
                {downloadingId === currentResume.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>Download</span>
              </button>

              <button
                onClick={() => setResumeToDelete(currentResume)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 shadow-xs transition-all cursor-pointer"
                title="Delete this active resume"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

            </div>

          </div>

        </div>
      ) : (
        /* Empty State: No active resume selected */
        <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              📄 No Active Resume
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              You don't currently have an active resume. Upload a new resume or choose a previous version to continue.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={onTriggerUpload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Resume</span>
            </button>
            {previousVersions.length > 0 && (
              <button
                onClick={() => setShowPreviousVersions(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Choose Previous Version ({previousVersions.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. RESUME HISTORY / PREVIOUS VERSIONS SECTION */}
      {/* ==================================================== */}
      {previousVersions.length > 0 && (
        <div className="space-y-3 pt-2">
          
          <button
            onClick={() => setShowPreviousVersions((prev) => !prev)}
            className="flex items-center justify-between w-full p-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Resume History</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-mono">
                {previousVersions.length} {previousVersions.length === 1 ? 'version' : 'versions'}
              </span>
            </div>

            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <span>{showPreviousVersions ? 'Hide' : 'Show'}</span>
              {showPreviousVersions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showPreviousVersions && (
            <div className="space-y-2.5 pt-1 animate-fade-in">
              {previousVersions.map((prevResume) => (
                <div
                  key={prevResume.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  
                  {/* Left: Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                          {prevResume.fileName || prevResume.versionLabel}
                        </span>
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          v{prevResume.version}
                        </span>
                        {prevResume.isAiImproved && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Sparkles className="w-2.5 h-2.5" /> AI
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                        <span>{prevResume.targetRole}</span>
                        <span>•</span>
                        <span>{formatDate(prevResume.updatedAt || prevResume.createdAt)}</span>
                        {prevResume.analysisResult && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              ATS {prevResume.analysisResult.ats_score}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    
                    {onEditResume && (
                      <button
                        onClick={() => onEditResume(prevResume)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300 transition-all cursor-pointer"
                        title="Edit this version directly in-place"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Edit Resume</span>
                      </button>
                    )}

                    <button
                      onClick={() => onMakeCurrent(prevResume)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                      title={`Use ${prevResume.fileName || prevResume.versionLabel} as your active resume`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Use this version</span>
                    </button>

                    <button
                      onClick={() => onViewResume(prevResume)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                      title="View resume"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View</span>
                    </button>

                    <button
                      onClick={() => onSelectResumeToAnalyze(prevResume)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                      title="Analyze this version"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Analyze</span>
                    </button>

                    {onPrintResume && (
                      <button
                        onClick={() => onPrintResume(prevResume)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                        title="Print this version"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Print</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => handleQuickDownload(prevResume, e)}
                      disabled={downloadingId === prevResume.id}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all cursor-pointer disabled:opacity-50"
                      title="Download PDF"
                    >
                      {downloadingId === prevResume.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => setResumeToDelete(prevResume)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 transition-all cursor-pointer"
                      title="Delete resume"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ==================================================== */}
      {/* 3. DELETE CONFIRMATION MODAL */}
      {/* ==================================================== */}
      {resumeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {resumeToDelete.isCurrent || resumeToDelete.id === currentResume?.id
                    ? 'Delete active resume?'
                    : 'Delete Resume?'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {resumeToDelete.fileName || resumeToDelete.versionLabel}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {resumeToDelete.isCurrent || resumeToDelete.id === currentResume?.id
                ? 'This is your current active resume. Deleting it will leave you without an active resume. Your older resume versions will not be automatically activated.'
                : 'Are you sure you want to delete this historical resume version? This action cannot be undone.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResumeToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Resume</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
