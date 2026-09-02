import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Eye,
  Edit3,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileDown,
  Printer,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
  BookOpen,
  Briefcase,
  User,
  ShieldCheck,
  Zap,
  Target,
  ExternalLink,
  Github,
  Globe,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Copy,
  Check,
  Loader2,
  X,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  TrendingUp,
  Star,
  Undo2,
  Redo2,
  Download,
  ListFilter,
} from 'lucide-react';
import {
  StructuredResumeData,
  ResumeVersionItem,
  ResumeTemplateType,
  ResumeAnalysisResult,
} from '../../types/resume';
import { resumeService } from '../../services/resumeService';
import { exportResumeToPdf } from '../../utils/pdfExport';
import { openResumePrintPage, printEditedResume } from '../../utils/resumePrint';
import { extractTextFromPdfUrl } from '../../utils/pdfExtractor';
import { LiveDocumentCanvas } from './LiveDocumentCanvas';
import { useAuth } from '../../context/AuthContext';

interface LiveResumeEditorProps {
  initialResume?: ResumeVersionItem;
  userResumes: ResumeVersionItem[];
  onSelectResume: (resume: ResumeVersionItem) => void;
  onBack: () => void;
  onRefreshResumes?: () => Promise<void>;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline_pending';

/**
 * Checks if structured resume data contains generic template placeholder values
 */
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

export const LiveResumeEditor: React.FC<LiveResumeEditorProps> = ({
  initialResume,
  userResumes,
  onSelectResume,
  onBack,
  onRefreshResumes,
}) => {
  const { user, profile, showToast } = useAuth();
  const effectiveUserId = profile?.id || user?.id || 'guest';

  const defaultResume = useMemo<ResumeVersionItem>(() => {
    if (initialResume) return initialResume;
    const studentFullName = profile?.full_name || (user?.user_metadata?.full_name as string) || '';
    return {
      id: `res-${Date.now()}`,
      userId: effectiveUserId,
      fileName: `${studentFullName ? studentFullName.replace(/\s+/g, '_') : 'My'}_Resume.pdf`,
      versionLabel: 'Resume v1',
      version: 1,
      isCurrent: true,
      resumeText: '',
      targetRole: 'Software Developer',
      structuredData: {
        fullName: studentFullName,
        title: 'Software Developer',
        contactInfo: {
          email: user?.email || '',
          phone: '',
          location: '',
          linkedin: '',
          github: '',
          portfolio: '',
        },
        summary: '',
        skills: [],
        experience: [],
        projects: [],
        education: [],
        certifications: [],
        templateId: 'modern',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [initialResume, profile, user, effectiveUserId]);

  // -------------------------------------------------------------
  // 1. Core Resume State
  // -------------------------------------------------------------
  const [activeResume, setActiveResume] = useState<ResumeVersionItem>(defaultResume);

  // Helper to construct structured data from real resume data
  const deriveStructuredData = useCallback(
    (resumeItem: ResumeVersionItem): StructuredResumeData => {
      // 1. If valid user-saved structuredData exists and is not a placeholder, use it
      if (resumeItem.structuredData && !isPlaceholderResume(resumeItem.structuredData)) {
        return resumeItem.structuredData;
      }
      // 2. Parse actual resume text
      const studentFullName = profile?.full_name || (user?.user_metadata?.full_name as string) || '';
      return resumeService.parseResumeTextToStructured(
        resumeItem.resumeText || '',
        resumeItem.targetRole || 'Software Developer',
        studentFullName,
        resumeItem.fileName || resumeItem.versionLabel
      );
    },
    [profile, user]
  );

  const [structuredData, setStructuredData] = useState<StructuredResumeData>(() =>
    deriveStructuredData(defaultResume)
  );
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplateType>(
    structuredData.templateId || 'modern'
  );

  // Undo / Redo history stacks
  const [history, setHistory] = useState<StructuredResumeData[]>([structuredData]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Document zoom state
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Auto-Save engine state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date>(new Date());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // AI Improvement Modal state
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiTarget, setAiTarget] = useState<{
    sectionType: string;
    itemTitle?: string;
    context?: string;
    currentContent: string;
    onApply: (improvedText: string) => void;
  } | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [aiKeyChanges, setAiKeyChanges] = useState<string[]>([]);
  const [aiReasoning, setAiReasoning] = useState<string>('');

  // Target Job Optimization Modal state
  const [jobModalOpen, setJobModalOpen] = useState<boolean>(false);
  const [jobDescriptionInput, setJobDescriptionInput] = useState<string>('');
  const [jobOptimizationLoading, setJobOptimizationLoading] = useState<boolean>(false);
  const [jobOptimizationResult, setJobOptimizationResult] = useState<{
    matchScore: number;
    matchingKeywords: string[];
    missingKeywords: string[];
    tailoredSuggestions: string[];
    optimizedSummary: string;
  } | null>(null);

  // ATS Re-Check Drawer / Modal state
  const [atsModalOpen, setAtsModalOpen] = useState<boolean>(false);
  const [isCheckingAts, setIsCheckingAts] = useState<boolean>(false);
  const [latestAtsResult, setLatestAtsResult] = useState<ResumeAnalysisResult | null>(
    defaultResume.analysisResult || null
  );

  // "Save as New Version" modal
  const [newVersionModalOpen, setNewVersionModalOpen] = useState<boolean>(false);
  const [newVersionLabel, setNewVersionLabel] = useState<string>('');
  const [isCreatingVersion, setIsCreatingVersion] = useState<boolean>(false);

  // Exporting state
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [printMenuOpen, setPrintMenuOpen] = useState<boolean>(false);

  // Centralized resume loader
  const loadResume = useCallback(
    (targetResume: ResumeVersionItem) => {
      setActiveResume(targetResume);
      const parsed = deriveStructuredData(targetResume);
      setStructuredData(parsed);
      setSelectedTemplate(parsed.templateId || 'modern');
      setLatestAtsResult(targetResume.analysisResult || null);
      setHistory([parsed]);
      setHistoryIndex(0);
      setSaveStatus('saved');
      setHasUnsavedChanges(false);

      // If resumeText is missing or too short, resolve file URL or Blob from storage/IndexedDB and extract
      if (!targetResume.resumeText || targetResume.resumeText.length < 20) {
        const studentFullName = profile?.full_name || (user?.user_metadata?.full_name as string) || '';
        resumeService.getResumeFileBlobOrUrl(targetResume).then((url) => {
          if (url) {
            extractTextFromPdfUrl(url).then((extractedText) => {
              if (extractedText && extractedText.length > 20) {
                const reParsed = resumeService.parseResumeTextToStructured(
                  extractedText,
                  targetResume.targetRole || 'Software Developer',
                  studentFullName,
                  targetResume.fileName || targetResume.versionLabel
                );
                setStructuredData((prev) => {
                  if (isPlaceholderResume(prev) || (!prev.projects.length && reParsed.projects.length)) {
                    return reParsed;
                  }
                  return prev;
                });
                resumeService
                  .saveResumeVersion({
                    ...targetResume,
                    resumeText: extractedText,
                    structuredData: reParsed,
                  })
                  .catch((e) => console.warn('[Live Editor] Background text sync notice:', e));
              }
            });
          }
        });
      }
    },
    [deriveStructuredData, profile, user]
  );

  // Sync state if initialResume changes
  useEffect(() => {
    loadResume(defaultResume);
  }, [defaultResume.id, defaultResume.version, loadResume]);

  // -------------------------------------------------------------
  // 2. Debounced Auto-Save to Supabase
  // -------------------------------------------------------------
  const performSave = useCallback(
    async (dataToSave: StructuredResumeData, template: ResumeTemplateType) => {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (!isOnline) {
        setSaveStatus('offline_pending');
        return;
      }

      setSaveStatus('saving');
      try {
        const payloadWithTemplate: StructuredResumeData = {
          ...dataToSave,
          templateId: template,
        };

        const updatedMarkdown = resumeService.generateMarkdownFromStructured(payloadWithTemplate);

        const updatedItem: ResumeVersionItem = {
          ...activeResume,
          userId: effectiveUserId,
          targetRole: payloadWithTemplate.title || activeResume.targetRole || 'Software Developer',
          resumeText: updatedMarkdown,
          structuredData: payloadWithTemplate,
          analysisResult: latestAtsResult || activeResume.analysisResult || null,
          updatedAt: new Date().toISOString(),
        };

        const saved = await resumeService.saveResumeVersion(updatedItem);
        setActiveResume(saved);
        setSaveStatus('saved');
        setLastSavedAt(new Date());
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error('[Live Resume Editor] Save failed:', err);
        setSaveStatus('error');
      }
    },
    [activeResume, effectiveUserId, latestAtsResult]
  );

  // Trigger data changes with Undo/Redo history tracking
  const handleDataChange = useCallback(
    (updater: (prev: StructuredResumeData) => StructuredResumeData) => {
      setStructuredData((prev) => {
        const next = updater(prev);
        setHasUnsavedChanges(true);
        setSaveStatus('saving');

        // Update history stack
        setHistory((currHist) => {
          const updatedHist = currHist.slice(0, historyIndex + 1);
          return [...updatedHist, next];
        });
        setHistoryIndex((prevIdx) => prevIdx + 1);

        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
          performSave(next, selectedTemplate);
        }, 1200);

        return next;
      });
    },
    [performSave, selectedTemplate, historyIndex]
  );

  // Undo action
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevData = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setStructuredData(prevData);
      performSave(prevData, selectedTemplate);
    }
  };

  // Redo action
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextData = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setStructuredData(nextData);
      performSave(nextData, selectedTemplate);
    }
  };

  // Keyboard shortcut listener for Undo / Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, selectedTemplate]);

  // Template switch handler
  const handleTemplateChange = (template: ResumeTemplateType) => {
    setSelectedTemplate(template);
    handleDataChange((prev) => ({ ...prev, templateId: template }));
  };

  // Reconnection listener
  useEffect(() => {
    const handleOnline = () => {
      if (hasUnsavedChanges || saveStatus === 'offline_pending' || saveStatus === 'error') {
        performSave(structuredData, selectedTemplate);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [hasUnsavedChanges, saveStatus, performSave, structuredData, selectedTemplate]);

  // Unsaved changes beforeunload protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges || saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, saveStatus]);

  // -------------------------------------------------------------
  // 3. AI Section Improvement Trigger
  // -------------------------------------------------------------
  const handleTriggerAiImprovement = async (
    sectionType: string,
    currentContent: string,
    onApply: (improved: string) => void,
    itemTitle?: string,
    context?: string
  ) => {
    if (!currentContent || !currentContent.trim()) {
      showToast('Empty Field', 'Please enter some text first before improving with AI.', 'warning');
      return;
    }

    setAiTarget({
      sectionType,
      itemTitle,
      context,
      currentContent,
      onApply,
    });
    setAiSuggestion('');
    setAiKeyChanges([]);
    setAiReasoning('');
    setAiModalOpen(true);
    setAiLoading(true);

    try {
      const res = await resumeService.improveSectionWithAi({
        sectionType,
        currentContent,
        targetRole: structuredData.title || activeResume.targetRole || 'Software Developer',
        itemTitle,
        context,
      });

      setAiSuggestion(res.suggestion);
      setAiKeyChanges(res.keyChanges || []);
      setAiReasoning(res.reasoning || '');
    } catch (err) {
      console.error('AI improvement failed:', err);
      showToast('AI Issue', 'Could not generate suggestion. Please try again.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    if (aiTarget && aiSuggestion) {
      aiTarget.onApply(aiSuggestion);
      setAiModalOpen(false);
      showToast('Changes Applied', 'Section updated with AI enhancement.', 'success');
    }
  };

  // -------------------------------------------------------------
  // 4. ATS Re-Check Action
  // -------------------------------------------------------------
  const handleRecheckAts = async () => {
    setIsCheckingAts(true);
    setAtsModalOpen(true);

    try {
      const rawText = resumeService.generateMarkdownFromStructured(structuredData);
      const role = structuredData.title || activeResume.targetRole || 'Software Developer';

      const result = await resumeService.analyzeResume({
        resumeText: rawText,
        targetRole: role,
      });

      setLatestAtsResult(result);

      // Save updated ATS score to DB
      const updatedItem: ResumeVersionItem = {
        ...activeResume,
        analysisResult: result,
        structuredData: {
          ...structuredData,
          templateId: selectedTemplate,
        },
        resumeText: rawText,
        updatedAt: new Date().toISOString(),
      };
      await resumeService.saveResumeVersion(updatedItem);
      setActiveResume(updatedItem);

      showToast('ATS Re-check Complete', `Overall Score: ${result.overall_score}% | ATS Score: ${result.ats_score}%`, 'success');
    } catch (err: any) {
      console.error('ATS check failed:', err);
      showToast('ATS Check Error', err?.message || 'Failed to re-analyze resume ATS compatibility.', 'error');
    } finally {
      setIsCheckingAts(false);
    }
  };

  // -------------------------------------------------------------
  // 5. Target Job Optimization
  // -------------------------------------------------------------
  const handleRunJobOptimization = async () => {
    if (!jobDescriptionInput.trim()) {
      showToast('Missing Job Description', 'Please paste a job description to analyze.', 'warning');
      return;
    }

    setJobOptimizationLoading(true);
    try {
      const res = await resumeService.optimizeForJobWithAi({
        resumeData: structuredData,
        jobDescription: jobDescriptionInput,
        targetRole: structuredData.title || activeResume.targetRole || 'Software Developer',
      });

      setJobOptimizationResult(res);
      showToast('Job Match Analyzed', `Relevance Score: ${res.matchScore}%`, 'success');
    } catch (err: any) {
      console.error('Job optimization error:', err);
      showToast('Optimization Failed', err?.message || 'Failed to analyze job description.', 'error');
    } finally {
      setJobOptimizationLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 6. Save as New Version Modal Action
  // -------------------------------------------------------------
  const handleCreateNewVersion = async () => {
    setIsCreatingVersion(true);
    try {
      const allResumes = await resumeService.getUserResumes(effectiveUserId);
      const nextVersionNumber = allResumes.length + 1;
      const label =
        newVersionLabel.trim() ||
        `Resume_v${nextVersionNumber} – ${structuredData.title || 'Software Developer'}`;

      const payloadWithTemplate: StructuredResumeData = {
        ...structuredData,
        templateId: selectedTemplate,
      };
      const rawMarkdown = resumeService.generateMarkdownFromStructured(payloadWithTemplate);

      const newItem = await resumeService.createNewResumeVersion(
        activeResume,
        payloadWithTemplate,
        label
      );

      setActiveResume(newItem);
      setNewVersionModalOpen(false);
      setNewVersionLabel('');
      showToast('New Version Created', `Saved as v${newItem.version}: "${label}"`, 'success');

      if (onRefreshResumes) {
        await onRefreshResumes();
      }
    } catch (err: any) {
      console.error('Create version failed:', err);
      showToast('Version Error', err?.message || 'Failed to create new version.', 'error');
    } finally {
      setIsCreatingVersion(false);
    }
  };

  // -------------------------------------------------------------
  // 7. PDF Export & Print Actions
  // -------------------------------------------------------------
  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await performSave(structuredData, selectedTemplate);
      const filename = `${(structuredData.fullName || 'Resume').replace(/\s+/g, '_')}_v${activeResume.version || 1}.pdf`;
      await exportResumeToPdf(structuredData, filename);
      showToast('PDF Exported', 'Clean vector PDF generated and downloaded.', 'success');
    } catch (err: any) {
      console.error('PDF export failed:', err);
      showToast('Export Issue', 'Falling back to browser print dialog...', 'info');
      printEditedResume(structuredData, selectedTemplate);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintEdited = () => {
    setPrintMenuOpen(false);
    printEditedResume(structuredData, selectedTemplate);
  };

  const handlePrintOriginal = () => {
    setPrintMenuOpen(false);
    openResumePrintPage(activeResume);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. TOP DOCUMENT TOOLBAR                                                   */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        {/* Left Side: Back & Resume Info */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <span>←</span>
            <span>Studio</span>
          </button>

          {/* Active Resume Switcher Dropdown */}
          <div className="relative group">
            <select
              value={activeResume.id}
              onChange={(e) => {
                const found = userResumes.find((r) => r.id === e.target.value);
                if (found) {
                  onSelectResume(found);
                  loadResume(found);
                }
              }}
              className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-1.5 pr-8 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[200px] sm:max-w-[280px] truncate"
            >
              {userResumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fileName || r.versionLabel || `Resume_v${r.version || 1}`} (v{r.version || 1}
                  {r.isCurrent ? ' ⭐ Current' : ''})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {activeResume.isCurrent && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold tracking-wide">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
              <span>CURRENT</span>
            </span>
          )}
        </div>

        {/* Center: Template Switcher & Undo/Redo & Zoom */}
        <div className="flex items-center gap-2">
          {/* Template Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['modern', 'classic', 'minimal', 'executive'] as ResumeTemplateType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTemplateChange(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  selectedTemplate === t
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Undo / Redo */}
          <div className="hidden md:flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
            <button
              type="button"
              disabled={historyIndex <= 0}
              onClick={handleUndo}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              title="Undo (Cmd+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={historyIndex >= history.length - 1}
              onClick={handleRedo}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              title="Redo (Cmd+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="hidden lg:flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.75, Number((z - 0.1).toFixed(2))))}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 min-w-[40px] text-center font-bold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.3, Number((z + 0.1).toFixed(2))))}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Right Side: Action Controls & Save Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* ATS Score pill */}
          <button
            type="button"
            onClick={handleRecheckAts}
            disabled={isCheckingAts}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer"
            title="Check ATS score"
          >
            {isCheckingAts ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            <span>
              {latestAtsResult
                ? `ATS: ${latestAtsResult.overall_score || latestAtsResult.ats_score}%`
                : 'Check ATS'}
            </span>
          </button>

          {/* Job Optimization Button */}
          <button
            type="button"
            onClick={() => setJobModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/50 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-bold transition-all cursor-pointer"
            title="Optimize for Job Description"
          >
            <Target className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Optimize for Job</span>
          </button>

          {/* Save Status Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Saved</span>
              </span>
            )}
            {saveStatus === 'offline_pending' && (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="w-3 h-3" />
                <span>Offline</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <button
                type="button"
                onClick={() => performSave(structuredData, selectedTemplate)}
                className="flex items-center gap-1 text-rose-600 underline cursor-pointer"
              >
                <AlertCircle className="w-3 h-3" />
                <span>Retry Save</span>
              </button>
            )}
          </div>

          {/* Save as New Version */}
          <button
            type="button"
            onClick={() => setNewVersionModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            title="Save as a new version branch"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden md:inline">Save as v{(activeResume.version || 1) + 1}</span>
          </button>

          {/* Print Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPrintMenuOpen(!printMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {printMenuOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50 animate-fade-in">
                <button
                  type="button"
                  onClick={handlePrintEdited}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Print Edited Resume</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintOriginal}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-600" />
                  <span>Print Original PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* Download PDF Button */}
          <button
            type="button"
            disabled={isExportingPdf}
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            title="Download crisp PDF"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Download PDF</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN TRUE LIVE RESUME CANVAS VIEWPORT                                  */}
      {/* ========================================================================= */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 flex justify-center items-start">
        <LiveDocumentCanvas
          data={structuredData}
          templateId={selectedTemplate}
          zoom={zoomLevel}
          onChange={handleDataChange}
          onTriggerAi={handleTriggerAiImprovement}
        />
      </main>

      {/* ========================================================================= */}
      {/* 3. AI SECTION IMPROVEMENT COMPARISON MODAL                                */}
      {/* ========================================================================= */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-600">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    AI Content Enhancement
                  </h3>
                  <p className="text-xs text-slate-500">
                    High-impact ATS formulation for{' '}
                    <span className="font-semibold text-indigo-600">
                      {aiTarget?.itemTitle || aiTarget?.sectionType}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAiModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiLoading ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                  Crafting high-impact verbs, quantifiable metrics, and keyword density...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Side by side comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Current */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Current Draft
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {aiTarget?.currentContent}
                    </p>
                  </div>

                  {/* AI Suggestion */}
                  <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Recommended Enhancement</span>
                    </span>
                    <p className="text-xs font-medium text-slate-900 dark:text-white leading-relaxed">
                      {aiSuggestion}
                    </p>
                  </div>
                </div>

                {/* Key Changes */}
                {aiKeyChanges.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Key Enhancements Applied:
                    </span>
                    <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {aiKeyChanges.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAiModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Keep Original
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyAiSuggestion}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Enhancement</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TARGET JOB OPTIMIZATION MODAL                                          */}
      {/* ========================================================================= */}
      {jobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-600/10 text-violet-600">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Optimize for Job Description
                  </h3>
                  <p className="text-xs text-slate-500">
                    Compare resume keywords directly against the target employer requirements.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setJobModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Paste Job Description:
                </label>
                <textarea
                  rows={4}
                  value={jobDescriptionInput}
                  onChange={(e) => setJobDescriptionInput(e.target.value)}
                  placeholder="Paste job posting duties, qualifications, and tech stack requirements..."
                  className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white leading-relaxed outline-none focus:ring-2 focus:ring-violet-500 resize-none font-sans"
                />
              </div>

              <button
                type="button"
                disabled={jobOptimizationLoading || !jobDescriptionInput.trim()}
                onClick={handleRunJobOptimization}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md shadow-violet-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {jobOptimizationLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                <span>Run Tailoring Analysis</span>
              </button>

              {/* Optimization Results */}
              {jobOptimizationResult && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        Job Relevance Match
                      </span>
                      <p className="text-xl font-extrabold text-violet-600 dark:text-violet-400 font-mono">
                        {jobOptimizationResult.matchScore}%
                      </p>
                    </div>
                  </div>

                  {/* Matching vs Missing */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
                        Matching Keywords:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {jobOptimizationResult.matchingKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-[10px] font-semibold text-emerald-800 dark:text-emerald-200"
                          >
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1">
                      <span className="font-bold text-amber-800 dark:text-amber-300 text-[11px]">
                        Missing Keywords:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {jobOptimizationResult.missingKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-[10px] font-semibold text-amber-800 dark:text-amber-200"
                          >
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tailored Summary Suggestion */}
                  {jobOptimizationResult.optimizedSummary && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                          Suggested Tailored Summary:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            handleDataChange((prev) => ({
                              ...prev,
                              summary: jobOptimizationResult.optimizedSummary,
                            }));
                            setJobModalOpen(false);
                            showToast('Summary Applied', 'Tailored summary applied to your resume canvas.', 'success');
                          }}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          Apply to Resume
                        </button>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                        {jobOptimizationResult.optimizedSummary}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ATS RE-CHECK RESULTS MODAL                                             */}
      {/* ========================================================================= */}
      {atsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    ATS Compatibility Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live parser score evaluated against{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {structuredData.title || 'Software Developer'}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAtsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isCheckingAts ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                  Evaluating ATS keyword density and structure...
                </p>
              </div>
            ) : latestAtsResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Overall</span>
                    <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                      {latestAtsResult.overall_score}%
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">ATS Parsable</span>
                    <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {latestAtsResult.ats_score}%
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Role Match</span>
                    <p className="text-xl font-extrabold text-violet-600 dark:text-violet-400 font-mono">
                      {latestAtsResult.role_match_score}%
                    </p>
                  </div>
                </div>

                {latestAtsResult.strengths && latestAtsResult.strengths.length > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Key Strengths:
                    </span>
                    <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11px] text-emerald-900 dark:text-emerald-200">
                      {latestAtsResult.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setAtsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Close Report
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SAVE AS NEW VERSION MODAL                                              */}
      {/* ========================================================================= */}
      {newVersionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Save as New Version</span>
              </h3>
              <button
                onClick={() => setNewVersionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Create an independent copy in Supabase without overwriting your current version.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Version Label (optional)
              </label>
              <input
                type="text"
                value={newVersionLabel}
                onChange={(e) => setNewVersionLabel(e.target.value)}
                placeholder={`Resume_v${(activeResume.version || 1) + 1} – Tailored for Big Tech`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewVersionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCreatingVersion}
                onClick={handleCreateNewVersion}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isCreatingVersion ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Create Version</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
