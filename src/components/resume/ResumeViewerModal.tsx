import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  X,
  Download,
  ExternalLink,
  Sparkles,
  Check,
  Star,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Eye,
  Loader2,
  Printer,
} from 'lucide-react';
import { ResumeVersionItem } from '../../types/resume';
import { resumeService } from '../../services/resumeService';
import { PdfCanvasViewer } from './PdfCanvasViewer';
import { openResumePrintPage } from '../../utils/resumePrint';

interface ResumeViewerModalProps {
  resume: ResumeVersionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onMakeCurrent: (resume: ResumeVersionItem) => Promise<void>;
  onAnalyze?: (resume: ResumeVersionItem) => void;
  onReAnalyze?: (resume: ResumeVersionItem) => void;
  onImprove?: (resume: ResumeVersionItem) => void;
  onImproveResume?: (resume: ResumeVersionItem) => void;
  onPrint?: (resume: ResumeVersionItem) => void;
  onEdit?: (resume: ResumeVersionItem) => void;
}

export const ResumeViewerModal: React.FC<ResumeViewerModalProps> = ({
  resume,
  isOpen,
  onClose,
  onMakeCurrent,
  onAnalyze,
  onReAnalyze,
  onImprove,
  onImproveResume,
  onPrint,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'text' | 'analysis'>('preview');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isSettingCurrent, setIsSettingCurrent] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const fetchResumePdfData = useCallback(async (targetResume: ResumeVersionItem) => {
    console.log('[ResumeViewerModal] Fetching resume data for:', {
      id: targetResume.id,
      fileName: targetResume.fileName || targetResume.versionLabel,
      isAiImproved: targetResume.isAiImproved,
      storagePath: targetResume.storagePath,
    });

    setIsLoadingPreview(true);
    setPreviewError(null);
    try {
      // 1. If it's an AI-improved / generated resume, generate PDF blob from this exact version's structured data
      if (targetResume.isAiImproved || targetResume.resumeType === 'ai_generated' || targetResume.structuredData) {
        try {
          const { generateResumePdfBlob } = await import('../../utils/pdfExport');
          const structured = targetResume.improvedData?.structured || targetResume.structuredData;
          if (structured) {
            const generatedBlob = await generateResumePdfBlob(structured);
            if (generatedBlob && generatedBlob.size > 0) {
              setPdfBlob(generatedBlob);
              const url = URL.createObjectURL(generatedBlob);
              setPdfPreviewUrl(url);
              return;
            }
          }
        } catch (genErr) {
          console.warn('[ResumeViewerModal] AI PDF blob generation notice:', genErr);
        }
      }

      // 2. For uploaded original resumes, retrieve the exact binary PDF byte-for-byte from IndexedDB/Supabase
      const blob = await resumeService.getResumeFileBlob(targetResume);
      if (blob && blob.size > 0) {
        setPdfBlob(blob);
        const url = URL.createObjectURL(blob);
        setPdfPreviewUrl(url);
      } else {
        console.error('[ResumeViewerModal] No binary blob found for resume record:', targetResume.id);
        setPreviewError('Unable to open this resume. Please try again.');
      }
    } catch (err: any) {
      console.error('[ResumeViewerModal] Failed to fetch PDF blob technical error:', err);
      setPreviewError('Unable to open this resume. Please try again.');
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  // Load preview URL and Blob when modal opens or resume changes
  useEffect(() => {
    if (isOpen && resume) {
      setPdfBlob(null);
      setPdfPreviewUrl(null);
      setPreviewError(null);
      setDownloadError(null);

      fetchResumePdfData(resume);
    } else {
      setPdfBlob(null);
      setPdfPreviewUrl(null);
      setPreviewError(null);
      setDownloadError(null);
    }

    return () => {
      if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [isOpen, resume?.id, fetchResumePdfData]);

  if (!isOpen || !resume) return null;

  const handleAIImprove = async (targetResume: ResumeVersionItem) => {
    if (isImproving || isDownloading) return;
    try {
      setIsImproving(true);
      setDownloadError(null);
      const improveFn = onImprove || onImproveResume;
      if (typeof improveFn === 'function') {
        await improveFn(targetResume);
        onClose();
      } else {
        throw new Error('Improvement handler is not configured.');
      }
    } catch (err: any) {
      console.error('AI Improvement technical error:', err);
      setDownloadError('Unable to start resume improvement. Please try again.');
    } finally {
      setIsImproving(false);
    }
  };

  const handleAnalyzeAction = () => {
    onClose();
    if (typeof onAnalyze === 'function') {
      onAnalyze(resume!);
    } else if (typeof onReAnalyze === 'function') {
      onReAnalyze(resume!);
    }
  };

  const handleDownloadOriginal = async (targetResume: ResumeVersionItem) => {
    if (isDownloading || isImproving) return;
    try {
      setIsDownloading(true);
      setDownloadError(null);
      await resumeService.downloadResume(targetResume);
    } catch (err: any) {
      console.error('Failed to download resume technical error:', err);
      if (err?.message === 'Original resume file is unavailable.') {
        setDownloadError('Original resume file is unavailable.');
      } else {
        setDownloadError('Unable to download the original resume. Please try again.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenInTab = async () => {
    try {
      if (pdfBlob) {
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
        return;
      }
      if (pdfPreviewUrl) {
        window.open(pdfPreviewUrl, '_blank');
        return;
      }

      // AI Generated resume fallback
      if (resume.isAiImproved || resume.resumeType === 'ai_generated' || resume.structuredData) {
        const { generateResumePdfBlob } = await import('../../utils/pdfExport');
        const structured = resume.improvedData?.structured || resume.structuredData;
        if (structured) {
          const generatedBlob = await generateResumePdfBlob(structured);
          const url = URL.createObjectURL(generatedBlob);
          window.open(url, '_blank');
          return;
        }
      }

      // Uploaded resume fallback
      const url = await resumeService.getResumeFileBlobOrUrl(resume);
      if (url) {
        window.open(url, '_blank');
      } else {
        console.error('[ResumeViewerModal] Open in tab failed: url or blob not resolvable for resume id:', resume.id);
        setDownloadError('Unable to open this resume. Please try again.');
      }
    } catch (e) {
      console.error('[ResumeViewerModal] Open in tab technical error:', e);
      setDownloadError('Unable to open this resume. Please try again.');
    }
  };

  const handleSetCurrent = async (targetResume: ResumeVersionItem) => {
    try {
      setIsSettingCurrent(true);
      await onMakeCurrent(targetResume);
    } finally {
      setIsSettingCurrent(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/50 flex-wrap gap-3">
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shrink-0 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                  {resume.fileName || resume.versionLabel}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold">
                  v{resume.version}
                </span>
                {resume.isCurrent && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold shadow-xs">
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                    <span>Current</span>
                  </span>
                )}
                {resume.isAiImproved && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold">
                    <Sparkles className="w-3 h-3" /> AI Improved
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                Target Role: <span className="text-slate-700 dark:text-slate-300 font-semibold">{resume.targetRole || 'Not specified'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 flex-wrap text-xs">
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Original PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'text'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Parsed Text</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analysis')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'analysis'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ATS Analysis</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(resume)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors cursor-pointer shadow-xs"
                title="Open in Live Resume Editor"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Edit in Live Editor</span>
              </button>
            )}

            {!resume.isCurrent && (
              <button
                type="button"
                onClick={() => handleSetCurrent(resume)}
                disabled={isSettingCurrent || isImproving || isDownloading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSettingCurrent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5 text-amber-400" />}
                <span>Make Current</span>
              </button>
            )}

            <button
              type="button"
              id="viewer-print-resume-btn"
              onClick={() => {
                if (onPrint) {
                  onPrint(resume);
                } else {
                  openResumePrintPage(resume);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold transition-colors cursor-pointer"
              title="Print this resume version in a new tab"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadOriginal(resume)}
              disabled={isDownloading || isImproving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Download className="w-3.5 h-3.5 text-slate-500" />}
              <span>Download Original PDF</span>
            </button>

            <button
              type="button"
              onClick={handleOpenInTab}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Open in Tab</span>
            </button>

            <button
              type="button"
              onClick={() => handleAIImprove(resume)}
              disabled={isImproving || isDownloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isImproving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Improving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Improve</span>
                </>
              )}
            </button>

          </div>

        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/40 dark:bg-slate-950/20">
          
          {downloadError && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{downloadError}</span>
              </div>
              <button
                type="button"
                onClick={() => setDownloadError(null)}
                className="p-1 rounded-md hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: VISUAL ORIGINAL PDF PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Original Uploaded File Document</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {resume.fileName || resume.versionLabel}
                </span>
              </div>

              <PdfCanvasViewer
                blob={pdfBlob}
                fileName={resume.fileName || resume.versionLabel || 'Resume.pdf'}
                isLoading={isLoadingPreview}
                error={previewError}
                onDownloadOriginal={() => handleDownloadOriginal(resume)}
                onOpenInTab={handleOpenInTab}
                onRetry={() => fetchResumePdfData(resume)}
                isDownloading={isDownloading}
              />
            </div>
          )}

          {/* TAB 2: TEXT CONTENT */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Parsed Resume Document Text</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {resume.resumeText ? `${resume.resumeText.length} characters` : 'No text'}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-h-[480px] overflow-y-auto">
                {resume.resumeText || 'No text extracted for this resume version.'}
              </div>
            </div>
          )}

          {/* TAB 3: ANALYSIS & SCORES */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {resume.analysisResult ? (
                <>
                  {/* Scores */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                      <div className="text-[11px] font-bold uppercase text-slate-400">Overall Score</div>
                      <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                        {resume.analysisResult.overall_score}/100
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                      <div className="text-[11px] font-bold uppercase text-emerald-600">ATS Score</div>
                      <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {resume.analysisResult.ats_score}/100
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                      <div className="text-[11px] font-bold uppercase text-indigo-600">Role Match</div>
                      <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                        {resume.analysisResult.role_match_score}%
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Missing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Strengths</span>
                      </div>
                      <ul className="space-y-1.5">
                        {resume.analysisResult.strengths?.map((s: any, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{typeof s === 'string' ? s : s?.strength || s?.name || JSON.stringify(s)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span>Missing Skills</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {resume.analysisResult.missing_skills?.map((ms: any, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-medium"
                          >
                            {typeof ms === 'string' ? ms : ms?.name || ms?.skill || JSON.stringify(ms)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No AI analysis saved for this version yet.
                  </p>
                  <button
                    type="button"
                    onClick={handleAnalyzeAction}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Run AI Analysis Now</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
