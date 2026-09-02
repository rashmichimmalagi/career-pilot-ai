import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Edit3,
  Save,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  ResumeVersionItem,
  StructuredResumeData,
  ResumeTemplateType,
  ResumeAnalysisResult,
} from '../../types/resume';
import { resumeService } from '../../services/resumeService';
import { PdfCanvasViewer } from './PdfCanvasViewer';
import { printResumeDocument, printEditedResume } from '../../utils/resumePrint';
import { exportResumeToPdf } from '../../utils/pdfExport';
import { LiveDocumentCanvas } from './LiveDocumentCanvas';
import { PdfInteractiveEditor } from './PdfInteractiveEditor';
import { extractTextFromPdfUrl } from '../../utils/pdfExtractor';
import { useAuth } from '../../context/AuthContext';

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
  onRefreshResumes?: () => Promise<void>;
  initialMode?: 'view' | 'edit';
}

type ModalMode = 'view' | 'edit';

function isPlaceholderResume(data?: StructuredResumeData | null): boolean {
  if (!data) return true;
  const name = (data.fullName || '').trim().toUpperCase();
  const isGenericPlaceholderName =
    name === 'CANDIDATE NAME' ||
    name === 'CANDIDATE' ||
    name === 'YOUR NAME' ||
    name === 'JOHN DOE';

  const hasRealContent =
    (Array.isArray(data.skills) && data.skills.length > 0) ||
    (Array.isArray(data.experience) && data.experience.length > 0) ||
    (Array.isArray(data.projects) && data.projects.length > 0) ||
    (typeof data.summary === 'string' && data.summary.trim().length > 10);

  if (isGenericPlaceholderName && !hasRealContent) {
    return true;
  }

  if (!name && !hasRealContent) {
    return true;
  }

  return false;
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
  onRefreshResumes,
  initialMode = 'view',
}) => {
  const { user, profile, showToast } = useAuth();
  const effectiveUserId = profile?.id || user?.id || 'guest';

  // -------------------------------------------------------------
  // Mode & Tabs State
  // -------------------------------------------------------------
  const [modalMode, setModalMode] = useState<ModalMode>(initialMode);
  const [activeTab, setActiveTab] = useState<'preview' | 'text' | 'analysis'>('preview');

  // Preview & PDF States
  const [isDownloading, setIsDownloading] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isSettingCurrent, setIsSettingCurrent] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Active Resume Document State
  const [activeResumeState, setActiveResumeState] = useState<ResumeVersionItem | null>(resume);

  // Derive Structured Data from actual resume content (never placeholder)
  const deriveStructuredData = useCallback(
    (targetResume: ResumeVersionItem): StructuredResumeData => {
      if (targetResume.structuredData && !isPlaceholderResume(targetResume.structuredData)) {
        return targetResume.structuredData;
      }
      const studentFullName =
        profile?.full_name || (user?.user_metadata?.full_name as string) || '';
      return resumeService.parseResumeTextToStructured(
        targetResume.resumeText || '',
        targetResume.targetRole || 'Software Developer',
        studentFullName,
        targetResume.fileName || targetResume.versionLabel
      );
    },
    [profile, user]
  );

  const [structuredData, setStructuredData] = useState<StructuredResumeData>(() =>
    resume ? deriveStructuredData(resume) : ({} as StructuredResumeData)
  );
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplateType>(
    structuredData.templateId || 'modern'
  );

  // Edit History & Undo / Redo
  const [history, setHistory] = useState<StructuredResumeData[]>([structuredData]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatusText, setSaveStatusText] = useState<'Saved' | 'Saving...' | 'Unsaved changes'>('Saved');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // "Save as New Version" modal
  const [isSaveNewVersionModalOpen, setIsSaveNewVersionModalOpen] = useState<boolean>(false);
  const [newVersionLabelInput, setNewVersionLabelInput] = useState<string>('');
  const [newVersionTargetRoleInput, setNewVersionTargetRoleInput] = useState<string>('');

  // AI Polish Modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTarget, setAiTarget] = useState<{
    sectionType: string;
    itemTitle?: string;
    context?: string;
    currentContent: string;
    onApply: (improvedText: string) => void;
  } | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiKeyChanges, setAiKeyChanges] = useState<string[]>([]);
  const [aiReasoning, setAiReasoning] = useState('');

  // -------------------------------------------------------------
  // Load & Hydrate Selected Resume
  // -------------------------------------------------------------
  const loadResumeData = useCallback(
    async (targetResume: ResumeVersionItem) => {
      setActiveResumeState(targetResume);
      let parsed = deriveStructuredData(targetResume);

      // If resumeText is empty or short, asynchronously extract actual PDF text via storage or IndexedDB blob
      if (!targetResume.resumeText || targetResume.resumeText.trim().length < 50) {
        try {
          const directUrl = await resumeService.getResumeFileBlobOrUrl(targetResume);
          if (directUrl) {
            const extracted = await extractTextFromPdfUrl(directUrl);
            if (extracted && extracted.trim().length > 50) {
              targetResume.resumeText = extracted;
              const studentFullName =
                profile?.full_name || (user?.user_metadata?.full_name as string) || '';
              parsed = resumeService.parseResumeTextToStructured(
                extracted,
                targetResume.targetRole || 'Software Developer',
                studentFullName,
                targetResume.fileName || targetResume.versionLabel
              );
            }
          }
        } catch (err) {
          console.warn('[ResumeViewerModal] Notice on dynamic PDF extraction:', err);
        }
      }

      setStructuredData(parsed);
      setSelectedTemplate(parsed.templateId || 'modern');
      setHistory([parsed]);
      setHistoryIndex(0);
      setHasUnsavedChanges(false);
      setSaveStatusText('Saved');
    },
    [deriveStructuredData, profile, user]
  );

  const fetchResumePdfData = useCallback(async (targetResume: ResumeVersionItem) => {
    setIsLoadingPreview(true);
    setPreviewError(null);
    try {
      if (targetResume.isAiImproved || targetResume.resumeType === 'ai_generated') {
        let structured = targetResume.improvedData?.structured || targetResume.structuredData;
        if (!structured && targetResume.resumeText && targetResume.resumeText.trim()) {
          try {
            structured = resumeService.parseResumeTextToStructured(
              targetResume.resumeText,
              targetResume.targetRole
            );
          } catch (_) {}
        }

        if (structured) {
          try {
            const { generateResumePdfBlob } = await import('../../utils/pdfExport');
            const generatedBlob = await generateResumePdfBlob(structured);
            if (generatedBlob && generatedBlob.size > 0) {
              setPdfBlob(generatedBlob);
              const url = URL.createObjectURL(generatedBlob);
              setPdfPreviewUrl(url);
              return;
            }
          } catch (genErr) {
            console.warn('[ResumeViewerModal] AI resume PDF blob generation notice:', genErr);
          }
        }
      }

      const blob = await resumeService.getResumeFileBlob(targetResume);
      if (blob && blob.size > 0) {
        setPdfBlob(blob);
        const url = URL.createObjectURL(blob);
        setPdfPreviewUrl(url);
      } else {
        setPreviewError(
          'Unable to generate PDF preview. You can switch to "Edit Resume" or "Parsed Text" to view this resume.'
        );
      }
    } catch (err: any) {
      console.error('[ResumeViewerModal] Failed to fetch PDF blob technical error:', err);
      setPreviewError('Unable to open this resume preview. Please try again.');
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && resume) {
      setModalMode(initialMode);
      setPdfBlob(null);
      setPdfPreviewUrl(null);
      setPreviewError(null);
      setDownloadError(null);

      loadResumeData(resume);
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
  }, [isOpen, resume?.id, initialMode, loadResumeData, fetchResumePdfData]);

  // -------------------------------------------------------------
  // Data Change Handler with History
  // -------------------------------------------------------------
  const handleDataChange = useCallback(
    (updater: (prev: StructuredResumeData) => StructuredResumeData) => {
      setStructuredData((prev) => {
        const next = updater(prev);
        setHistory((currHist) => {
          const newHist = currHist.slice(0, historyIndex + 1);
          return [...newHist, next];
        });
        setHistoryIndex((prevIdx) => prevIdx + 1);
        setHasUnsavedChanges(true);
        setSaveStatusText('Unsaved changes');
        return next;
      });
    },
    [historyIndex]
  );

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setStructuredData(history[prevIdx]);
      setHasUnsavedChanges(true);
      setSaveStatusText('Unsaved changes');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setStructuredData(history[nextIdx]);
      setHasUnsavedChanges(true);
      setSaveStatusText('Unsaved changes');
    }
  };

  // -------------------------------------------------------------
  // Save Changes to Current Resume (Creates new version, leaves original untouched)
  // -------------------------------------------------------------
  const handleSaveChanges = async () => {
    const currentActive = activeResumeState || resume;
    if (!currentActive) return;

    try {
      setIsSaving(true);
      setSaveStatusText('Saving...');

      const payloadWithTemplate: StructuredResumeData = {
        ...structuredData,
        templateId: selectedTemplate,
      };

      // Create new version with parentResumeId = currentActive.id, preserving original resume intact
      const newVersionItem = await resumeService.createNewResumeVersion(
        currentActive,
        payloadWithTemplate
      );

      setActiveResumeState(newVersionItem);
      setHasUnsavedChanges(false);
      setSaveStatusText('Saved');
      showToast(
        'New Version Saved',
        `Created ${newVersionItem.versionLabel || `Resume_v${newVersionItem.version}`} (Original preserved)`,
        'success'
      );

      if (onRefreshResumes) {
        await onRefreshResumes();
      }
    } catch (err: any) {
      console.error('Failed to save resume edits:', err);
      showToast('Save Failed', 'Could not save resume edits. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------
  // Save from PDF Visual Editor (Preserves original PDF layout + generates high-res edited PDF)
  // -------------------------------------------------------------
  const handleSavePdfEditor = async (
    updatedData: StructuredResumeData,
    editedBlob: Blob,
    customLabel?: string
  ) => {
    const currentActive = activeResumeState || resume;
    if (!currentActive) return;

    try {
      setIsSaving(true);
      setSaveStatusText('Saving...');

      const newVersionItem = await resumeService.createNewResumeVersion(
        currentActive,
        updatedData,
        customLabel,
        editedBlob
      );

      setActiveResumeState(newVersionItem);
      setStructuredData(updatedData);
      setPdfBlob(editedBlob);
      const url = URL.createObjectURL(editedBlob);
      setPdfPreviewUrl(url);
      setHasUnsavedChanges(false);
      setSaveStatusText('Saved');
      setModalMode('view');
      showToast(
        'New Version Saved',
        `Created ${newVersionItem.versionLabel || `Resume_v${newVersionItem.version}`} (Original PDF layout preserved)`,
        'success'
      );

      if (onRefreshResumes) {
        await onRefreshResumes();
      }
    } catch (err: any) {
      console.error('Failed to save edited PDF version:', err);
      showToast('Save Failed', 'Could not save resume edits. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------
  // Save as New Version
  // -------------------------------------------------------------
  const handleOpenSaveNewVersion = () => {
    const currentActive = activeResumeState || resume;
    const nextVerNum = (currentActive?.version || 1) + 1;
    setNewVersionLabelInput(`Resume v${nextVerNum}`);
    setNewVersionTargetRoleInput(structuredData.title || currentActive?.targetRole || 'Software Developer');
    setIsSaveNewVersionModalOpen(true);
  };

  const handleConfirmSaveNewVersion = async () => {
    const currentActive = activeResumeState || resume;
    if (!currentActive) return;

    try {
      setIsSaving(true);
      const payloadWithTemplate: StructuredResumeData = {
        ...structuredData,
        title: newVersionTargetRoleInput.trim() || structuredData.title,
        templateId: selectedTemplate,
      };

      const newVersionItem = await resumeService.createNewResumeVersion(
        currentActive,
        payloadWithTemplate,
        newVersionLabelInput.trim() || undefined
      );

      setActiveResumeState(newVersionItem);
      setIsSaveNewVersionModalOpen(false);
      setHasUnsavedChanges(false);
      setSaveStatusText('Saved');
      showToast('New Version Created', `Created ${newVersionItem.versionLabel} as your active resume`, 'success');

      if (onRefreshResumes) {
        await onRefreshResumes();
      }
    } catch (err) {
      console.error('Failed to create new resume version:', err);
      showToast('Version Creation Failed', 'Unable to create new version.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------
  // AI Polish Trigger
  // -------------------------------------------------------------
  const handleTriggerAi = async (
    sectionType: string,
    currentContent: string,
    onApply: (improvedText: string) => void,
    itemTitle?: string,
    context?: string
  ) => {
    setAiTarget({ sectionType, currentContent, onApply, itemTitle, context });
    setAiSuggestion('');
    setAiKeyChanges([]);
    setAiReasoning('');
    setAiModalOpen(true);
    setAiLoading(true);

    try {
      const res = await resumeService.improveSectionWithAi({
        sectionType,
        currentContent,
        targetRole: structuredData.title || activeResumeState?.targetRole || 'Software Developer',
        context,
        itemTitle,
      });
      setAiSuggestion(res.suggestion);
      setAiKeyChanges(res.keyChanges || []);
      setAiReasoning(res.reasoning || '');
    } catch (err) {
      console.error('AI improvement failed:', err);
      setAiSuggestion(currentContent);
    } finally {
      setAiLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Export & Print Actions
  // -------------------------------------------------------------
  const handleDownloadOriginal = async () => {
    const targetResume = activeResumeState || resume;
    if (!targetResume || isDownloading) return;
    try {
      setIsDownloading(true);
      setDownloadError(null);
      await resumeService.downloadResume(targetResume);
    } catch (err: any) {
      console.error('Failed to download resume technical error:', err);
      setDownloadError('Unable to download the original resume. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadEditedPdf = async () => {
    try {
      setIsDownloading(true);
      const name = structuredData.fullName ? `${structuredData.fullName.replace(/\s+/g, '_')}_Resume.pdf` : 'Edited_Resume.pdf';
      await exportResumeToPdf(structuredData, name);
      showToast('Download Started', 'Your edited PDF resume is downloading.', 'success');
    } catch (err) {
      console.error('Error generating edited PDF:', err);
      showToast('Export Failed', 'Could not generate edited PDF.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintOriginal = () => {
    const targetResume = activeResumeState || resume;
    if (!targetResume) return;
    if (onPrint) {
      onPrint(targetResume);
    } else {
      printResumeDocument(targetResume);
    }
  };

  const handlePrintEdited = () => {
    printEditedResume(structuredData);
  };

  const handleOpenInTab = async () => {
    const targetResume = activeResumeState || resume;
    if (!targetResume) return;
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
      const blob = await resumeService.getResumeFileBlob(targetResume);
      if (blob && blob.size > 0) {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        return;
      }
      const url = await resumeService.getResumeFileBlobOrUrl(targetResume);
      if (url) {
        window.open(url, '_blank');
      } else {
        setDownloadError('Unable to open this resume in a new tab.');
      }
    } catch (e) {
      console.error('[ResumeViewerModal] Open in tab technical error:', e);
      setDownloadError('Unable to open this resume. Please try again.');
    }
  };

  if (!isOpen || (!resume && !activeResumeState)) return null;

  const currentActiveResume = activeResumeState || resume!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[94vh]">
        
        {/* ========================================================================= */}
        {/* TOP HEADER: Resume Identity & Mode Switcher                               */}
        {/* ========================================================================= */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60 flex-wrap gap-3">
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-2xl bg-indigo-600 text-white shrink-0 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  {currentActiveResume.fileName || currentActiveResume.versionLabel}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold">
                  v{currentActiveResume.version}
                </span>
                {currentActiveResume.isCurrent && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold shadow-xs">
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                    <span>Current</span>
                  </span>
                )}
                {currentActiveResume.isAiImproved && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold">
                    <Sparkles className="w-3 h-3" /> AI Improved
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                Target Role: <span className="text-slate-700 dark:text-slate-300 font-semibold">{currentActiveResume.targetRole || 'Not specified'}</span>
              </p>
            </div>
          </div>

          {/* Mode Switcher: View Mode vs Edit Mode */}
          <div className="flex items-center gap-2 flex-wrap">
            
            <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl border border-slate-300/40 dark:border-slate-700/50">
              <button
                type="button"
                onClick={() => setModalMode('view')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalMode === 'view'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setModalMode('edit')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalMode === 'edit'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Resume</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* SECONDARY TOOLBAR: Contextual controls based on View or Edit mode          */}
        {/* ========================================================================= */}
        <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 flex-wrap text-xs">
          
          {modalMode === 'view' ? (
            /* VIEW MODE CONTROLS */
            <>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'preview'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ATS Analysis</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setModalMode('edit')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Resume</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintOriginal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Print Original Resume</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadOriginal}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-slate-500" />}
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
              </div>
            </>
          ) : (
            /* EDIT MODE CONTROLS */
            <>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Undo / Redo */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={historyIndex === 0}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Undo edit (Ctrl+Z)"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Redo edit (Ctrl+Y)"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Save status indicator */}
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 px-2">
                  {hasUnsavedChanges ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                  <span>{saveStatusText}</span>
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setModalMode('view')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Done</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenSaveNewVersion}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold transition-colors cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Save as New Version</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintEdited}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print Edited Resume</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadEditedPdf}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-slate-500" />}
                  <span>Download Edited PDF</span>
                </button>
              </div>
            </>
          )}

        </div>

        {/* ========================================================================= */}
        {/* MAIN BODY: VIEW CANVAS VS IN-PLACE EDIT CANVAS                            */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto bg-slate-100/70 dark:bg-slate-950/40 p-4 sm:p-6">
          
          {downloadError && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
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

          {/* MODE 1: EDIT MODE (Interactive In-Place Canvas) */}
          {modalMode === 'edit' ? (
            <div className="max-w-5xl mx-auto">
              {Boolean(
                pdfBlob &&
                (currentActiveResume.resumeType === 'uploaded' ||
                  (!currentActiveResume.isAiImproved && currentActiveResume.resumeType !== 'ai_generated'))
              ) ? (
                <PdfInteractiveEditor
                  blob={pdfBlob}
                  resume={currentActiveResume}
                  initialStructuredData={structuredData}
                  onDataChange={(updated) => {
                    setStructuredData(updated);
                    setHasUnsavedChanges(true);
                    setSaveStatusText('Unsaved changes');
                  }}
                  onTriggerAi={handleTriggerAi}
                  onSave={handleSavePdfEditor}
                  onCancel={() => setModalMode('view')}
                  isSaving={isSaving}
                />
              ) : (
                <div className="max-w-4xl mx-auto">
                  <div className="mb-3 px-3 py-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-between gap-2 text-xs text-indigo-900 dark:text-indigo-200">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>
                        <strong>In-Place Editing Mode:</strong> Click directly on your name, summary, skills, or projects to edit them right here on your resume.
                      </span>
                    </div>
                  </div>

                  <LiveDocumentCanvas
                    data={structuredData}
                    templateId={selectedTemplate}
                    onChange={handleDataChange}
                    onTriggerAi={handleTriggerAi}
                    zoom={zoomLevel}
                  />
                </div>
              )}
            </div>
          ) : (
            /* MODE 2: VIEW MODE (Original PDF / Text / ATS Tabs) */
            <div className="max-w-4xl mx-auto space-y-4">
              
              {activeTab === 'preview' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Original Uploaded File Document</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {currentActiveResume.fileName || currentActiveResume.versionLabel}
                    </span>
                  </div>

                  <PdfCanvasViewer
                    blob={pdfBlob}
                    fileName={currentActiveResume.fileName || currentActiveResume.versionLabel || 'Resume.pdf'}
                    isLoading={isLoadingPreview}
                    error={previewError}
                    onDownloadOriginal={handleDownloadOriginal}
                    onOpenInTab={handleOpenInTab}
                    onRetry={() => fetchResumePdfData(currentActiveResume)}
                    isDownloading={isDownloading}
                  />
                </div>
              )}

              {activeTab === 'text' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Parsed Resume Document Text</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {currentActiveResume.resumeText ? `${currentActiveResume.resumeText.length} characters` : 'No text'}
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-h-[520px] overflow-y-auto">
                    {currentActiveResume.resumeText || 'No text extracted for this resume version.'}
                  </div>
                </div>
              )}

              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  {currentActiveResume.analysisResult ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                          <div className="text-[11px] font-bold uppercase text-slate-400">Overall Score</div>
                          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                            {currentActiveResume.analysisResult.overall_score}/100
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                          <div className="text-[11px] font-bold uppercase text-emerald-600">ATS Score</div>
                          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                            {currentActiveResume.analysisResult.ats_score}/100
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                          <div className="text-[11px] font-bold uppercase text-indigo-600">Role Match</div>
                          <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                            {currentActiveResume.analysisResult.role_match_score}%
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Strengths</span>
                          </div>
                          <ul className="space-y-1.5">
                            {currentActiveResume.analysisResult.strengths?.map((s: any, i) => (
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
                            {currentActiveResume.analysisResult.missing_skills?.map((ms: any, i) => (
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
                      {onAnalyze && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onAnalyze(currentActiveResume);
                          }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Run AI Analysis Now</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL: AI IMPROVE SECTION POPUP                                           */}
      {/* ========================================================================= */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    AI Polish: {aiTarget?.itemTitle || aiTarget?.sectionType}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ATS-tailored enhancement for your active resume.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiLoading ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Synthesizing high-impact ATS content...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Original Text
                  </label>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    {aiTarget?.currentContent || '(Empty)'}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Suggested Improvement</span>
                  </label>
                  <textarea
                    rows={4}
                    value={aiSuggestion}
                    onChange={(e) => setAiSuggestion(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-indigo-500 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white outline-none leading-relaxed resize-y font-sans"
                  />
                </div>

                {aiKeyChanges.length > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      Key Enhancements:
                    </span>
                    <ul className="text-xs text-emerald-800 dark:text-emerald-200 list-disc list-inside space-y-0.5">
                      {aiKeyChanges.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAiModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (aiTarget && aiSuggestion.trim()) {
                        aiTarget.onApply(aiSuggestion.trim());
                        setAiModalOpen(false);
                        showToast('Improvement Applied', 'Updated resume section with AI suggestion.', 'success');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept Suggestion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SAVE AS NEW VERSION POPUP                                          */}
      {/* ========================================================================= */}
      {isSaveNewVersionModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Save as New Resume Version
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Creates an incremental version branch in your resume history.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveNewVersionModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Version Label
                </label>
                <input
                  type="text"
                  value={newVersionLabelInput}
                  onChange={(e) => setNewVersionLabelInput(e.target.value)}
                  placeholder="e.g. Resume v5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Role
                </label>
                <input
                  type="text"
                  value={newVersionTargetRoleInput}
                  onChange={(e) => setNewVersionTargetRoleInput(e.target.value)}
                  placeholder="e.g. Full Stack Developer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveNewVersionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSaveNewVersion}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save New Version</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
