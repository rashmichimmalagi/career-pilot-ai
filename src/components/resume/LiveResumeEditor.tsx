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
} from 'lucide-react';
import {
  StructuredResumeData,
  StructuredResumeExperience,
  StructuredResumeProject,
  StructuredResumeEducation,
  StructuredResumeSkills,
  StructuredResumeCertItem,
  ResumeVersionItem,
  ResumeTemplateType,
  ResumeAnalysisResult,
} from '../../types/resume';
import { resumeService } from '../../services/resumeService';
import { exportResumeToPdf } from '../../utils/pdfExport';
import { openResumePrintPage } from '../../utils/resumePrint';
import { ResumeTemplateViewer } from './ResumeTemplates';
import { useAuth } from '../../context/AuthContext';

interface LiveResumeEditorProps {
  initialResume: ResumeVersionItem;
  userResumes: ResumeVersionItem[];
  onSelectResume: (resume: ResumeVersionItem) => void;
  onBack: () => void;
  onRefreshResumes?: () => Promise<void>;
}

type EditorSection =
  | 'personal'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certifications';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline_pending';

export const LiveResumeEditor: React.FC<LiveResumeEditorProps> = ({
  initialResume,
  userResumes,
  onSelectResume,
  onBack,
  onRefreshResumes,
}) => {
  const { user, profile, showToast } = useAuth();
  const effectiveUserId = profile?.id || user?.id || 'guest';

  // -------------------------------------------------------------
  // 1. Core Resume State (Single Source of Truth in memory)
  // -------------------------------------------------------------
  const [activeResume, setActiveResume] = useState<ResumeVersionItem>(initialResume);

  // Initialize structured data from resume record, or parse from text
  const initialStructured = useMemo<StructuredResumeData>(() => {
    if (initialResume.structuredData) {
      return initialResume.structuredData;
    }
    if (initialResume.improvedData?.structured) {
      return initialResume.improvedData.structured;
    }
    return resumeService.parseResumeTextToStructured(
      initialResume.resumeText || '',
      initialResume.targetRole || 'Software Developer'
    );
  }, [initialResume]);

  const [structuredData, setStructuredData] = useState<StructuredResumeData>(initialStructured);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplateType>(
    initialStructured.templateId || 'modern'
  );

  // Active editor tab & responsive view
  const [activeSection, setActiveSection] = useState<EditorSection>('personal');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [previewMode, setPreviewMode] = useState<'formatted' | 'markdown'>('formatted');
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
    initialResume.analysisResult || null
  );

  // "Save as New Version" modal
  const [newVersionModalOpen, setNewVersionModalOpen] = useState<boolean>(false);
  const [newVersionLabel, setNewVersionLabel] = useState<string>('');
  const [isCreatingVersion, setIsCreatingVersion] = useState<boolean>(false);

  // Exporting state
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState<boolean>(false);

  // Sync state if active resume changes from outside
  useEffect(() => {
    setActiveResume(initialResume);
    const parsed =
      initialResume.structuredData ||
      initialResume.improvedData?.structured ||
      resumeService.parseResumeTextToStructured(
        initialResume.resumeText || '',
        initialResume.targetRole || 'Software Developer'
      );
    setStructuredData(parsed);
    setSelectedTemplate(parsed.templateId || 'modern');
    setLatestAtsResult(initialResume.analysisResult || null);
    setSaveStatus('saved');
    setHasUnsavedChanges(false);
  }, [initialResume]);

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

  // Trigger debounced auto-save on state change
  const handleDataChange = useCallback(
    (updater: (prev: StructuredResumeData) => StructuredResumeData) => {
      setStructuredData((prev) => {
        const next = updater(prev);
        setHasUnsavedChanges(true);
        setSaveStatus('saving');

        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
          performSave(next, selectedTemplate);
        }, 1200);

        return next;
      });
    },
    [performSave, selectedTemplate]
  );

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
    } catch (err: any) {
      console.error('Job optimization error:', err);
      showToast('Optimization Error', err?.message || 'Failed to analyze job description.', 'error');
    } finally {
      setJobOptimizationLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 6. Save as New Version Action
  // -------------------------------------------------------------
  const handleCreateNewVersion = async () => {
    setIsCreatingVersion(true);
    try {
      const next = await resumeService.createNewResumeVersion(
        activeResume,
        { ...structuredData, templateId: selectedTemplate },
        newVersionLabel.trim() || undefined
      );

      if (onRefreshResumes) {
        await onRefreshResumes();
      }

      onSelectResume(next);
      setNewVersionModalOpen(false);
      setNewVersionLabel('');
      showToast('Version Created', `Saved as ${next.versionLabel}`, 'success');
    } catch (err: any) {
      console.error('Failed to create new version:', err);
      showToast('Version Error', 'Could not create new resume version.', 'error');
    } finally {
      setIsCreatingVersion(false);
    }
  };

  // -------------------------------------------------------------
  // 7. PDF Export & Print
  // -------------------------------------------------------------
  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const safeName = (structuredData.fullName || 'Candidate')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      await exportResumeToPdf(
        { ...structuredData, templateId: selectedTemplate },
        `${safeName}_ATS_Resume.pdf`
      );
      showToast('Download Ready', 'Resume PDF downloaded successfully.', 'success');
    } catch (err) {
      console.error('PDF export failed:', err);
      showToast('Export Issue', 'Unable to generate vector PDF.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    openResumePrintPage({
      ...activeResume,
      structuredData: { ...structuredData, templateId: selectedTemplate },
    });
  };

  const handleCopyMarkdown = () => {
    const md = resumeService.generateMarkdownFromStructured(structuredData);
    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
    showToast('Copied', 'ATS plain text copied to clipboard.', 'info');
  };

  // -------------------------------------------------------------
  // 8. Individual Section Modification Handlers
  // -------------------------------------------------------------

  // Personal Info
  const updatePersonalInfo = (field: string, value: string) => {
    handleDataChange((prev) => {
      if (field === 'fullName') return { ...prev, fullName: value };
      if (field === 'title') return { ...prev, title: value };
      return {
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value,
        },
      };
    });
  };

  // Summary
  const updateSummary = (value: string) => {
    handleDataChange((prev) => ({ ...prev, summary: value }));
  };

  // Skills
  const addSkillCategory = () => {
    handleDataChange((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        { id: `sk-${Date.now()}`, category: 'New Category', items: ['Skill 1', 'Skill 2'] },
      ],
    }));
  };

  const removeSkillCategory = (catIdx: number) => {
    handleDataChange((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== catIdx),
    }));
  };

  const updateSkillCategoryName = (catIdx: number, newName: string) => {
    handleDataChange((prev) => {
      const skills = [...prev.skills];
      if (skills[catIdx]) {
        skills[catIdx] = { ...skills[catIdx], category: newName };
      }
      return { ...prev, skills };
    });
  };

  const updateSkillItemsString = (catIdx: number, itemsStr: string) => {
    const items = itemsStr.split(',').map((s) => s.trim()).filter(Boolean);
    handleDataChange((prev) => {
      const skills = [...prev.skills];
      if (skills[catIdx]) {
        skills[catIdx] = { ...skills[catIdx], items };
      }
      return { ...prev, skills };
    });
  };

  // Experience
  const addExperienceItem = () => {
    handleDataChange((prev) => ({
      ...prev,
      experience: [
        {
          id: `exp-${Date.now()}`,
          company: 'Company Name',
          role: structuredData.title || 'Software Engineer',
          location: 'City, State / Remote',
          duration: '2023 – Present',
          startDate: '2023',
          endDate: 'Present',
          description: '',
          bulletPoints: [
            'Architected and implemented high-performance features using modern web technologies.',
            'Collaborated with cross-functional teams to streamline release velocity and code quality.',
          ],
        },
        ...(prev.experience || []),
      ],
    }));
  };

  const removeExperienceItem = (idx: number) => {
    handleDataChange((prev) => ({
      ...prev,
      experience: (prev.experience || []).filter((_, i) => i !== idx),
    }));
  };

  const moveExperienceItem = (idx: number, direction: 'up' | 'down') => {
    handleDataChange((prev) => {
      const list = [...(prev.experience || [])];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= list.length) return prev;
      const temp = list[idx];
      list[idx] = list[targetIdx];
      list[targetIdx] = temp;
      return { ...prev, experience: list };
    });
  };

  const updateExperienceField = (idx: number, field: keyof StructuredResumeExperience, value: any) => {
    handleDataChange((prev) => {
      const list = [...(prev.experience || [])];
      if (list[idx]) {
        list[idx] = { ...list[idx], [field]: value };
      }
      return { ...prev, experience: list };
    });
  };

  const updateExperienceBullet = (expIdx: number, bulletIdx: number, value: string) => {
    handleDataChange((prev) => {
      const list = [...(prev.experience || [])];
      if (list[expIdx]) {
        const bulletPoints = [...list[expIdx].bulletPoints];
        bulletPoints[bulletIdx] = value;
        list[expIdx] = { ...list[expIdx], bulletPoints };
      }
      return { ...prev, experience: list };
    });
  };

  const addExperienceBullet = (expIdx: number) => {
    handleDataChange((prev) => {
      const list = [...(prev.experience || [])];
      if (list[expIdx]) {
        list[expIdx] = {
          ...list[expIdx],
          bulletPoints: [
            ...list[expIdx].bulletPoints,
            'Engineered scalable module improving system latency by 20%.',
          ],
        };
      }
      return { ...prev, experience: list };
    });
  };

  const removeExperienceBullet = (expIdx: number, bulletIdx: number) => {
    handleDataChange((prev) => {
      const list = [...(prev.experience || [])];
      if (list[expIdx]) {
        const bulletPoints = list[expIdx].bulletPoints.filter((_, i) => i !== bulletIdx);
        list[expIdx] = { ...list[expIdx], bulletPoints };
      }
      return { ...prev, experience: list };
    });
  };

  // Projects
  const addProjectItem = () => {
    handleDataChange((prev) => ({
      ...prev,
      projects: [
        {
          id: `proj-${Date.now()}`,
          title: 'Project Title',
          roleOrSubtitle: 'Lead Developer',
          technologies: ['React', 'TypeScript', 'Node.js'],
          link: '',
          githubUrl: '',
          description: '',
          bulletPoints: [
            'Built responsive user interfaces and real-time state management.',
            'Optimized data queries and asset caching for fast load speeds.',
          ],
        },
        ...prev.projects,
      ],
    }));
  };

  const removeProjectItem = (idx: number) => {
    handleDataChange((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx),
    }));
  };

  const moveProjectItem = (idx: number, direction: 'up' | 'down') => {
    handleDataChange((prev) => {
      const list = [...prev.projects];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= list.length) return prev;
      const temp = list[idx];
      list[idx] = list[targetIdx];
      list[targetIdx] = temp;
      return { ...prev, projects: list };
    });
  };

  const updateProjectField = (idx: number, field: keyof StructuredResumeProject, value: any) => {
    handleDataChange((prev) => {
      const list = [...prev.projects];
      if (list[idx]) {
        list[idx] = { ...list[idx], [field]: value };
      }
      return { ...prev, projects: list };
    });
  };

  const updateProjectBullet = (projIdx: number, bulletIdx: number, value: string) => {
    handleDataChange((prev) => {
      const list = [...prev.projects];
      if (list[projIdx]) {
        const bulletPoints = [...list[projIdx].bulletPoints];
        bulletPoints[bulletIdx] = value;
        list[projIdx] = { ...list[projIdx], bulletPoints };
      }
      return { ...prev, projects: list };
    });
  };

  const addProjectBullet = (projIdx: number) => {
    handleDataChange((prev) => {
      const list = [...prev.projects];
      if (list[projIdx]) {
        list[projIdx] = {
          ...list[projIdx],
          bulletPoints: [
            ...list[projIdx].bulletPoints,
            'Implemented automated testing suite achieving high test coverage.',
          ],
        };
      }
      return { ...prev, projects: list };
    });
  };

  const removeProjectBullet = (projIdx: number, bulletIdx: number) => {
    handleDataChange((prev) => {
      const list = [...prev.projects];
      if (list[projIdx]) {
        const bulletPoints = list[projIdx].bulletPoints.filter((_, i) => i !== bulletIdx);
        list[projIdx] = { ...list[projIdx], bulletPoints };
      }
      return { ...prev, projects: list };
    });
  };

  // Education
  const addEducationItem = () => {
    handleDataChange((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: `edu-${Date.now()}`,
          institution: 'University Name',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          durationOrYear: '2020 – 2024',
          gpaOrScore: '',
          details: 'Relevant Coursework: Data Structures, Algorithms, Databases.',
        },
      ],
    }));
  };

  const removeEducationItem = (idx: number) => {
    handleDataChange((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx),
    }));
  };

  const updateEducationField = (idx: number, field: keyof StructuredResumeEducation, value: any) => {
    handleDataChange((prev) => {
      const list = [...prev.education];
      if (list[idx]) {
        list[idx] = { ...list[idx], [field]: value };
      }
      return { ...prev, education: list };
    });
  };

  // Certifications
  const addCertificationItem = () => {
    handleDataChange((prev) => ({
      ...prev,
      certifications: [
        ...(prev.certifications || []),
        {
          id: `cert-${Date.now()}`,
          name: 'AWS Certified Solutions Architect',
          issuer: 'Amazon Web Services',
          date: '2024',
        },
      ],
    }));
  };

  const removeCertificationItem = (idx: number) => {
    handleDataChange((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).filter((_, i) => i !== idx),
    }));
  };

  const updateCertificationItem = (idx: number, field: string, value: string) => {
    handleDataChange((prev) => {
      const certs = [...(prev.certifications || [])];
      const target = certs[idx];
      if (typeof target === 'string') {
        certs[idx] = { name: value, issuer: '', date: '' };
      } else if (target && typeof target === 'object') {
        certs[idx] = { ...target, [field]: value };
      }
      return { ...prev, certifications: certs };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & TOOLBAR                                                  */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Back + Resume Selector + Status */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                if (hasUnsavedChanges) {
                  const confirmLeave = window.confirm('You have unsaved changes being synced. Are you sure you want to leave?');
                  if (!confirmLeave) return;
                }
                onBack();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              <span>← Back</span>
            </button>

            {/* Resume Version Dropdown */}
            <div className="relative inline-block">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200 text-xs font-bold">
                <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="max-w-[140px] sm:max-w-[200px] truncate">
                  {activeResume.versionLabel || activeResume.fileName}
                </span>
                {userResumes.length > 1 && (
                  <select
                    value={activeResume.id}
                    onChange={(e) => {
                      const found = userResumes.find((r) => r.id === e.target.value);
                      if (found) onSelectResume(found);
                    }}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    title="Switch Resume Version"
                  >
                    {userResumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.versionLabel || r.fileName} (v{r.version})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Auto-Save Indicator */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium">
              {saveStatus === 'saving' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>Saved ✓</span>
                </span>
              )}
              {saveStatus === 'offline_pending' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  <span>Offline — Changes pending sync</span>
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  <AlertCircle className="w-3 h-3 text-rose-500" />
                  <span>Unable to save</span>
                  <button
                    onClick={() => performSave(structuredData, selectedTemplate)}
                    className="underline font-bold hover:text-rose-700 cursor-pointer"
                  >
                    Retry
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions (ATS Re-Check, Optimize for Job, Save as Version, Export PDF, Mobile Switcher) */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Mobile / Small Screen View Switcher */}
            <div className="flex lg:hidden bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setMobileView('editor')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  mobileView === 'editor'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => setMobileView('preview')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  mobileView === 'preview'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Preview
              </button>
            </div>

            {/* Re-Check ATS Button */}
            <button
              onClick={handleRecheckAts}
              disabled={isCheckingAts}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              title="Re-run ATS scoring and keywords check on your edited resume"
            >
              {isCheckingAts ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>Re-check ATS</span>
              {latestAtsResult && (
                <span className="ml-1 px-1.5 py-0.2 rounded-md bg-emerald-600 text-white text-[10px]">
                  {latestAtsResult.overall_score}%
                </span>
              )}
            </button>

            {/* Optimize for Target Job */}
            <button
              onClick={() => {
                setJobModalOpen(true);
                setJobOptimizationResult(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
              title="Compare your resume against a specific Job Description"
            >
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Optimize for Job</span>
            </button>

            {/* Save as New Version */}
            <button
              onClick={() => setNewVersionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              title="Fork current edits into a new version (e.g. Resume_v3)"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">New Version</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Download ATS-compliant vector PDF"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. TWO-PANEL MAIN CONTENT (Left: Editor Controls, Right: Live Preview)   */}
      {/* ========================================================================= */}
      <div className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ===================================================================== */}
        {/* LEFT PANEL: RESUME EDITING CONTROLS (6 COLS ON DESKTOP)               */}
        {/* ===================================================================== */}
        <div
          className={`lg:col-span-6 flex flex-col space-y-4 ${
            mobileView === 'preview' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Section Navigation Tabs */}
          <div className="p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'personal', label: 'Personal Info', icon: User },
              { id: 'summary', label: 'Summary', icon: Sparkles },
              { id: 'skills', label: 'Skills', icon: Layers },
              { id: 'experience', label: 'Experience', icon: Briefcase },
              { id: 'projects', label: 'Projects', icon: Zap },
              { id: 'education', label: 'Education', icon: BookOpen },
              { id: 'certifications', label: 'Certs', icon: Award },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as EditorSection)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* SECTION EDITORS */}
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-6 overflow-y-auto max-h-[calc(100vh-170px)]">
            
            {/* ------------------------------------------------------------- */}
            {/* 1. PERSONAL INFORMATION SECTION                               */}
            {/* ------------------------------------------------------------- */}
            {activeSection === 'personal' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-600" />
                      <span>Personal Information & Contact</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Standard contact headers parsed by all Applicant Tracking Systems.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={structuredData.fullName || ''}
                      onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Job Title / Target Role <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={structuredData.title || ''}
                      onChange={(e) => updatePersonalInfo('title', e.target.value)}
                      placeholder="e.g. Full Stack Developer"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={structuredData.contactInfo?.email || ''}
                      onChange={(e) => updatePersonalInfo('email', e.target.value)}
                      placeholder="alex.morgan@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={structuredData.contactInfo?.phone || ''}
                      onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Location (City, State / Remote)
                    </label>
                    <input
                      type="text"
                      value={structuredData.contactInfo?.location || ''}
                      onChange={(e) => updatePersonalInfo('location', e.target.value)}
                      placeholder="San Francisco, CA (or Remote)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      LinkedIn URL / Profile
                    </label>
                    <input
                      type="text"
                      value={structuredData.contactInfo?.linkedin || ''}
                      onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                      placeholder="linkedin.com/in/alexmorgan"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      GitHub URL
                    </label>
                    <input
                      type="text"
                      value={structuredData.contactInfo?.github || ''}
                      onChange={(e) => updatePersonalInfo('github', e.target.value)}
                      placeholder="github.com/alexmorgan"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Portfolio / Website
                    </label>
                    <input
                      type="text"
                      value={structuredData.contactInfo?.portfolio || ''}
                      onChange={(e) => updatePersonalInfo('portfolio', e.target.value)}
                      placeholder="alexmorgan.dev"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 2. PROFESSIONAL SUMMARY SECTION                               */}
            {/* ------------------------------------------------------------- */}
            {activeSection === 'summary' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Professional Summary</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      A 3-4 sentence elevator pitch highlighting your engineering background and domain strengths.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleTriggerAiImprovement(
                        'summary',
                        structuredData.summary,
                        (improved) => updateSummary(improved),
                        'Professional Summary'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Improve Summary with AI</span>
                  </button>
                </div>

                <div>
                  <textarea
                    rows={6}
                    value={structuredData.summary || ''}
                    onChange={(e) => updateSummary(e.target.value)}
                    placeholder="Write a concise 3-4 sentence summary of your career, top technical strengths, and measurable impact..."
                    className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5">
                    <span>Target: 40-75 words</span>
                    <span>{(structuredData.summary || '').split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 3. TECHNICAL SKILLS SECTION                                   */}
            {/* ------------------------------------------------------------- */}
            {activeSection === 'skills' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>Technical Skills & Tools</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Organize your skills by categories for optimal ATS parser indexing.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addSkillCategory}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Category</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {structuredData.skills.map((skillGroup, catIdx) => (
                    <div
                      key={skillGroup.id || catIdx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={skillGroup.category}
                          onChange={(e) => updateSkillCategoryName(catIdx, e.target.value)}
                          placeholder="Category Name (e.g. Languages & Frameworks)"
                          className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 outline-none px-1 py-0.5"
                        />
                        <button
                          type="button"
                          onClick={() => removeSkillCategory(catIdx)}
                          className="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                          title="Remove Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Skills (Comma-separated)
                        </label>
                        <input
                          type="text"
                          value={skillGroup.items.join(', ')}
                          onChange={(e) => updateSkillItemsString(catIdx, e.target.value)}
                          placeholder="TypeScript, React, Node.js, Express, PostgreSQL"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 4. PROFESSIONAL EXPERIENCE SECTION                            */}
            {/* ------------------------------------------------------------- */}
            {activeSection === 'experience' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      <span>Professional Experience</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Detail work history using STAR/XYZ format ("Accomplished [X] as measured by [Y] by doing [Z]").
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addExperienceItem}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Position</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {(structuredData.experience || []).map((exp, expIdx) => (
                    <div
                      key={exp.id || expIdx}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4"
                    >
                      {/* Top Bar with Reordering & Delete */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/80 pb-3">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          Position #{expIdx + 1}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={expIdx === 0}
                            onClick={() => moveExperienceItem(expIdx, 'up')}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={expIdx === (structuredData.experience?.length || 1) - 1}
                            onClick={() => moveExperienceItem(expIdx, 'down')}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeExperienceItem(expIdx)}
                            className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 cursor-pointer ml-1"
                            title="Delete Position"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Role & Company Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Job Title / Role
                          </label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => updateExperienceField(expIdx, 'role', e.target.value)}
                            placeholder="e.g. Senior Software Engineer"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Company
                          </label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateExperienceField(expIdx, 'company', e.target.value)}
                            placeholder="e.g. Acme Corp"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            value={exp.location || ''}
                            onChange={(e) => updateExperienceField(expIdx, 'location', e.target.value)}
                            placeholder="e.g. Seattle, WA (Remote)"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Duration / Dates
                          </label>
                          <input
                            type="text"
                            value={exp.duration || ''}
                            onChange={(e) => updateExperienceField(expIdx, 'duration', e.target.value)}
                            placeholder="e.g. Jan 2023 – Present"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Bullet Points with AI Enhancement */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Key Achievements & Responsibilities
                          </label>
                          <button
                            type="button"
                            onClick={() => addExperienceBullet(expIdx)}
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Bullet</span>
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          {exp.bulletPoints.map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-2">
                              <textarea
                                rows={2}
                                value={bullet}
                                onChange={(e) => updateExperienceBullet(expIdx, bIdx, e.target.value)}
                                placeholder="Describe quantifiable achievements (e.g. Architected microservice reducing latency by 30%)..."
                                className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                              />

                              <div className="flex flex-col gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleTriggerAiImprovement(
                                      'experience_bullet',
                                      bullet,
                                      (improved) => updateExperienceBullet(expIdx, bIdx, improved),
                                      exp.role || 'Experience Bullet',
                                      exp.company
                                    )
                                  }
                                  className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                                  title="Enhance this bullet with AI (Google XYZ / STAR formula)"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeExperienceBullet(expIdx, bIdx)}
                                  className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                  title="Remove Bullet"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 5. TECHNICAL PROJECTS SECTION                                 */}
            {/* ------------------------------------------------------------- */}
            {activeSection === 'projects' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-600" />
                      <span>Technical & Key Projects</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Showcase hands-on applications, stack architecture, and live links.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addProjectItem}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {structuredData.projects.map((proj, projIdx) => (
                    <div
                      key={proj.id || projIdx}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/80 pb-3">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          Project #{projIdx + 1}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={projIdx === 0}
                            onClick={() => moveProjectItem(projIdx, 'up')}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={projIdx === structuredData.projects.length - 1}
                            onClick={() => moveProjectItem(projIdx, 'down')}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeProjectItem(projIdx)}
                            className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 cursor-pointer ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Project Title
                          </label>
                          <input
                            type="text"
                            value={proj.title}
                            onChange={(e) => updateProjectField(projIdx, 'title', e.target.value)}
                            placeholder="e.g. Real-Time Chat Platform"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Role / Subtitle
                          </label>
                          <input
                            type="text"
                            value={proj.roleOrSubtitle || ''}
                            onChange={(e) => updateProjectField(projIdx, 'roleOrSubtitle', e.target.value)}
                            placeholder="e.g. Lead Full-Stack Developer"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Technologies (Comma-separated)
                          </label>
                          <input
                            type="text"
                            value={(proj.technologies || []).join(', ')}
                            onChange={(e) =>
                              updateProjectField(
                                projIdx,
                                'technologies',
                                e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                              )
                            }
                            placeholder="React, TypeScript, WebSocket, PostgreSQL"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Live Demo URL (optional)
                          </label>
                          <input
                            type="text"
                            value={proj.link || ''}
                            onChange={(e) => updateProjectField(projIdx, 'link', e.target.value)}
                            placeholder="https://myproject.app"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            GitHub Repository URL (optional)
                          </label>
                          <input
                            type="text"
                            value={proj.githubUrl || ''}
                            onChange={(e) => updateProjectField(projIdx, 'githubUrl', e.target.value)}
                            placeholder="https://github.com/user/repo"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Bullets */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Key Project Highlights
                          </label>
                          <button
                            type="button"
                            onClick={() => addProjectBullet(projIdx)}
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Bullet</span>
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          {proj.bulletPoints.map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-2">
                              <textarea
                                rows={2}
                                value={bullet}
                                onChange={(e) => updateProjectBullet(projIdx, bIdx, e.target.value)}
                                placeholder="Describe implementation, architecture, and impact..."
                                className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                              />

                              <div className="flex flex-col gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleTriggerAiImprovement(
                                      'project_bullet',
                                      bullet,
                                      (improved) => updateProjectBullet(projIdx, bIdx, improved),
                                      proj.title,
                                      (proj.technologies || []).join(', ')
                                    )
                                  }
                                  className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                                  title="Enhance bullet with AI"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeProjectBullet(projIdx, bIdx)}
                                  className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 6. EDUCATION SECTION                                          */}
            {/* ------------------------------------------------------------- */}
            {activeSection === 'education' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span>Education & Academic Background</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Degrees, institutions, GPA, and relevant academic coursework.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addEducationItem}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Degree</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {structuredData.education.map((edu, eduIdx) => (
                    <div
                      key={edu.id || eduIdx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          Degree #{eduIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeEducationItem(eduIdx)}
                          className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Degree (e.g. Bachelor of Science)
                          </label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducationField(eduIdx, 'degree', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Field of Study / Major
                          </label>
                          <input
                            type="text"
                            value={edu.field || ''}
                            onChange={(e) => updateEducationField(eduIdx, 'field', e.target.value)}
                            placeholder="e.g. Computer Science"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Institution / University
                          </label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => updateEducationField(eduIdx, 'institution', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Graduation Year / Duration
                          </label>
                          <input
                            type="text"
                            value={edu.durationOrYear || ''}
                            onChange={(e) => updateEducationField(eduIdx, 'durationOrYear', e.target.value)}
                            placeholder="2020 – 2024"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            GPA / Score (optional)
                          </label>
                          <input
                            type="text"
                            value={edu.gpaOrScore || ''}
                            onChange={(e) => updateEducationField(eduIdx, 'gpaOrScore', e.target.value)}
                            placeholder="3.8 / 4.0"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Coursework / Honors
                          </label>
                          <input
                            type="text"
                            value={edu.details || ''}
                            onChange={(e) => updateEducationField(eduIdx, 'details', e.target.value)}
                            placeholder="Data Structures, Distributed Systems, Dean's List"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 7. CERTIFICATIONS SECTION                                     */}
            {/* ------------------------------------------------------------- */}
            {activeSection === 'certifications' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-600" />
                      <span>Certifications & Credentials</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Industry certifications, AWS/GCP badges, and specialized licenses.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addCertificationItem}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Certification</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {(structuredData.certifications || []).map((cert, certIdx) => {
                    const certObj: StructuredResumeCertItem =
                      typeof cert === 'string'
                        ? { name: cert, issuer: '', date: '' }
                        : cert || { name: '', issuer: '', date: '' };

                    return (
                      <div
                        key={certObj.id || certIdx}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            Certification #{certIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCertificationItem(certIdx)}
                            className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Certification Name
                            </label>
                            <input
                              type="text"
                              value={certObj.name}
                              onChange={(e) => updateCertificationItem(certIdx, 'name', e.target.value)}
                              placeholder="AWS Certified Solutions Architect"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Issuing Org / Year
                            </label>
                            <input
                              type="text"
                              value={certObj.issuer || certObj.date || ''}
                              onChange={(e) => updateCertificationItem(certIdx, 'issuer', e.target.value)}
                              placeholder="AWS (2024)"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* RIGHT PANEL: LIVE RESUME PREVIEW (6 COLS ON DESKTOP)                  */}
        {/* ===================================================================== */}
        <div
          className={`lg:col-span-6 flex flex-col space-y-4 ${
            mobileView === 'editor' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Top Preview Controls Bar: Template Selector + Zoom + Mode */}
          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 flex-wrap">
            {/* Template Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">
                Template:
              </span>
              <div className="p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-0.5">
                {(['modern', 'classic', 'minimal', 'executive'] as ResumeTemplateType[]).map((tmpl) => (
                  <button
                    key={tmpl}
                    onClick={() => handleTemplateChange(tmpl)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      selectedTemplate === tmpl
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode & Zoom Actions */}
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                  className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold px-1.5 text-slate-600 dark:text-slate-400">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(1.3, z + 0.1))}
                  className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* View Mode Toggle: Formatted vs Raw ATS Text */}
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
                <button
                  onClick={() => setPreviewMode('formatted')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    previewMode === 'formatted'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Formatted Visual Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewMode('markdown')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    previewMode === 'markdown'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Raw ATS Markdown / Text"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Print Preview"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>

              {/* Copy Markdown */}
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Copy plain ATS text"
              >
                {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Live Preview Container */}
          <div className="flex-1 bg-slate-200/70 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-170px)] shadow-inner">
            {previewMode === 'formatted' ? (
              <ResumeTemplateViewer
                data={structuredData}
                templateId={selectedTemplate}
                zoom={zoomLevel}
              />
            ) : (
              <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-6 rounded-2xl shadow-xl overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {resumeService.generateMarkdownFromStructured(structuredData)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. AI SECTION IMPROVEMENT MODAL (Current vs Suggested Side-by-Side)       */}
      {/* ========================================================================= */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    AI Content Enhancement
                  </h3>
                  <p className="text-xs text-slate-500">
                    Optimized for {structuredData.title || 'Software Developer'} using STAR/XYZ method.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAiModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiLoading ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                  Synthesizing ATS-optimized phrasing...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Current vs Suggested */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Current
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {aiTarget?.currentContent}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1.5">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Suggested (ATS Enhanced)</span>
                    </span>
                    <p className="text-xs text-slate-900 dark:text-white font-medium leading-relaxed">
                      {aiSuggestion}
                    </p>
                  </div>
                </div>

                {/* Key Changes / Reasoning */}
                {aiKeyChanges.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Key Enhancements:</span>
                    <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11px]">
                      {aiKeyChanges.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAiModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyAiSuggestion}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Apply to Resume</span>
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Optimize for Target Job
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paste a job description to identify keyword gaps and tailor your resume.
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
                  Job Description (Paste from LinkedIn, Indeed, or Careers page)
                </label>
                <textarea
                  rows={5}
                  value={jobDescriptionInput}
                  onChange={(e) => setJobDescriptionInput(e.target.value)}
                  placeholder="Paste the full job requirements, required technologies, and responsibilities..."
                  className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={jobOptimizationLoading || !jobDescriptionInput.trim()}
                  onClick={handleRunJobOptimization}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {jobOptimizationLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>{jobOptimizationLoading ? 'Analyzing Alignment...' : 'Analyze Match'}</span>
                </button>
              </div>

              {/* Optimization Results */}
              {jobOptimizationResult && (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Job Alignment Score
                    </span>
                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                      {jobOptimizationResult.matchScore}% Match
                    </span>
                  </div>

                  {/* Matching vs Missing Keywords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                        Matching Keywords ({jobOptimizationResult.matchingKeywords.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {jobOptimizationResult.matchingKeywords.map((kw, i) => (
                          <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block mb-1">
                        Missing Keywords ({jobOptimizationResult.missingKeywords.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {jobOptimizationResult.missingKeywords.map((kw, i) => (
                          <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tailored Suggestions */}
                  {jobOptimizationResult.tailoredSuggestions.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Tailoring Recommendations:
                      </span>
                      <ul className="list-disc list-outside pl-4 space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                        {jobOptimizationResult.tailoredSuggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Optimized Summary Suggestion */}
                  {jobOptimizationResult.optimizedSummary && (
                    <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                          Tailored Summary for this Role:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            updateSummary(jobOptimizationResult.optimizedSummary);
                            setJobModalOpen(false);
                            showToast('Summary Updated', 'Tailored summary applied to your resume.', 'success');
                          }}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          Apply to Summary
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
      {/* 5. ATS RE-CHECK RESULTS MODAL / DRAWER                                    */}
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
                    Live parser score evaluated against {structuredData.title || 'Software Developer'}.
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
                  Parsing resume structure and keyword density...
                </p>
              </div>
            ) : latestAtsResult ? (
              <div className="space-y-4">
                {/* Score Cards */}
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

                {/* Key Strengths */}
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

                {/* Missing Skills / Keywords */}
                {((latestAtsResult.missing_skills && latestAtsResult.missing_skills.length > 0) ||
                  ((latestAtsResult as any).missing_keywords && (latestAtsResult as any).missing_keywords.length > 0)) && (
                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1.5">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                      Suggested Keywords / Skills to Include:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(latestAtsResult.missing_skills || (latestAtsResult as any).missing_keywords || []).map((kw: any, i: number) => (
                        <span
                          key={i}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200"
                        >
                          + {typeof kw === 'string' ? kw : kw?.name || kw?.skill || ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {((latestAtsResult.improvement_suggestions && latestAtsResult.improvement_suggestions.length > 0) ||
                  ((latestAtsResult as any).suggestions && (latestAtsResult as any).suggestions.length > 0)) && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Actionable Improvements:
                    </span>
                    <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {(latestAtsResult.improvement_suggestions || (latestAtsResult as any).suggestions || []).map((s: any, i: number) => (
                        <li key={i}>{typeof s === 'string' ? s : s?.text || s?.suggestion || JSON.stringify(s)}</li>
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
                {isCreatingVersion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Create Version</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
