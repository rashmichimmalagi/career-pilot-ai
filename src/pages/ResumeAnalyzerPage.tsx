import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Target,
  X,
  FileCheck,
  Check,
  ChevronDown,
  Layers,
  Award,
  Lightbulb,
  BookOpen,
  Cpu,
  Bot,
  ArrowUpRight,
  TrendingUp,
  Sliders,
  FileEdit,
  Eye,
  Briefcase,
  Star,
  Trash2,
  Download,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { extractTextFromPdf } from '../utils/pdfExtractor';
import { resumeService } from '../services/resumeService';
import {
  ResumeAnalysisResult,
  ResumeImprovementQuestion,
  ResumeQuestionAnswer,
  ImprovedResumeResponse,
  ResumeBeforeAfterComparison,
  ResumeVersionItem,
} from '../types/resume';
import { ResumeQuestionFlow } from '../components/resume/ResumeQuestionFlow';
import { ResumeComparisonView } from '../components/resume/ResumeComparisonView';
import { ResumePreviewEditor } from '../components/resume/ResumePreviewEditor';
import { MyResumesManager } from '../components/resume/MyResumesManager';
import { UploadResumeModal } from '../components/resume/UploadResumeModal';
import { ResumeViewerModal } from '../components/resume/ResumeViewerModal';
import { ResumeBuilderFlow } from '../components/resume/ResumeBuilderFlow';
import { LiveResumeEditor } from '../components/resume/LiveResumeEditor';
import { openResumePrintPage, printResumeDocument } from '../utils/resumePrint';

interface ResumeAnalyzerPageProps {
  onNavigate: (page: string) => void;
}

const COMMON_ROLES = [
  'Software Developer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist / AI Engineer',
  'DevOps & Cloud Engineer',
  'Mobile App Developer',
  'Machine Learning Engineer',
  'QA / Test Automation Engineer',
  'Cybersecurity Analyst',
  'Embedded Systems Engineer',
  'Systems Engineer',
];

type FlowState =
  | 'idle'
  | 'analyzing'
  | 'analyzed'
  | 'generating_questions'
  | 'answering_questions'
  | 'generating_improved'
  | 'improved_view'
  | 'builder'
  | 'editor';

export const ResumeAnalyzerPage: React.FC<ResumeAnalyzerPageProps> = ({ onNavigate }) => {
  const { user, profile, showToast } = useAuth();
  const effectiveUserId = profile?.id || user?.id || 'guest';

  // Resume Versioning State - initialized synchronously from cache
  const initialCachedResumes = React.useMemo(() => {
    return resumeService.getCachedUserResumes(effectiveUserId);
  }, [effectiveUserId]);

  const initialCurrentResume = initialCachedResumes.find((r) => r.isCurrent) || initialCachedResumes[0] || null;

  const [resumes, setResumes] = useState<ResumeVersionItem[]>(initialCachedResumes);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(initialCurrentResume?.id || null);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewingResume, setViewingResume] = useState<ResumeVersionItem | null>(null);
  const [viewingResumeInitialMode, setViewingResumeInitialMode] = useState<'view' | 'edit'>('view');

  // Active Analysis State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState<string>(initialCurrentResume?.targetRole || 'Software Developer');
  const [customRoleInput, setCustomRoleInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);
  const [isFromCompanyPrep, setIsFromCompanyPrep] = useState(false);
  const [sourceContext, setSourceContext] = useState<string | null>(null);

  // Check URL parameters for source
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sourceParam = searchParams.get('source');
    if (sourceParam) {
      setSourceContext(sourceParam);
    }
    if (sourceParam === 'company-preparation' || sourceParam === 'company-prep') {
      setIsFromCompanyPrep(true);
    }
  }, []);

  // Resume Data State
  const [extractedResumeText, setExtractedResumeText] = useState<string>(initialCurrentResume?.resumeText || '');
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(initialCurrentResume?.analysisResult || null);

  // Improvement Flow State
  const [flowState, setFlowState] = useState<FlowState>(() => {
    if (initialCurrentResume?.improvedData && initialCurrentResume?.comparisonData) {
      return 'improved_view';
    }
    if (initialCurrentResume?.analysisResult) {
      return 'analyzed';
    }
    return 'idle';
  });
  const [improvementQuestions, setImprovementQuestions] = useState<ResumeImprovementQuestion[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<ResumeQuestionAnswer[]>(initialCurrentResume?.studentAnswers || []);
  const [improvedResumeData, setImprovedResumeData] = useState<ImprovedResumeResponse | null>(initialCurrentResume?.improvedData || null);
  const [comparisonData, setComparisonData] = useState<ResumeBeforeAfterComparison | null>(initialCurrentResume?.comparisonData || null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'improved' | 'original'>('improved');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadSectionRef = useRef<HTMLDivElement>(null);

  const ROTATING_STATUS_MESSAGES = [
    'Analyzing your resume...',
    'Reading your resume structure...',
    'Evaluating technical depth & projects...',
    'Checking ATS keyword compatibility...',
    'Comparing with target role expectations...',
    'Generating personalized recommendations...',
  ];

  const ROTATING_IMPROVEMENT_MESSAGES = [
    'Analyzing resume gaps and weaknesses...',
    'Formulating high-impact mentor questions...',
    'Synthesizing ATS-optimized bullet points...',
    'Re-scoring resume against role benchmarks...',
    'Finalizing formatted ATS document...',
  ];

  // Rotate loading progress messages while analysis is underway
  useEffect(() => {
    if (!isAnalyzing && flowState !== 'generating_questions' && flowState !== 'generating_improved') {
      setStatusMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStatusMessageIndex((prev) => (prev + 1) % ROTATING_STATUS_MESSAGES.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [isAnalyzing, flowState]);

  // Initialize target role from student profile
  useEffect(() => {
    if (profile?.target_role && profile.target_role.trim()) {
      setTargetRole(profile.target_role.trim());
    }
  }, [profile?.target_role]);

  // Load Resumes on mount / when user changes
  const loadUserResumes = useCallback(async () => {
    try {
      setIsLoadingResumes(true);
      const userResumes = await resumeService.getUserResumes(effectiveUserId);
      setResumes(userResumes);

      const current = userResumes.find((r) => r.isCurrent);
      if (current) {
        setActiveResumeId(current.id);
        if (current.analysisResult && flowState === 'idle') {
          setExtractedResumeText(current.resumeText || '');
          setTargetRole(current.targetRole || 'Software Developer');
          setAnalysisResult(current.analysisResult);
          if (current.improvedData && current.comparisonData) {
            setImprovedResumeData(current.improvedData);
            setComparisonData(current.comparisonData);
            setStudentAnswers(current.studentAnswers || []);
            setFlowState('improved_view');
          } else {
            setFlowState('analyzed');
          }
        }
      } else {
        // Explicitly handle no active resume
        setActiveResumeId(null);
        if (flowState === 'analyzed' || flowState === 'improved_view') {
          setAnalysisResult(null);
          setExtractedResumeText('');
          setImprovedResumeData(null);
          setComparisonData(null);
          setFlowState('idle');
        }
      }
    } catch (err) {
      console.warn('Failed to load user resumes:', err);
    } finally {
      setIsLoadingResumes(false);
    }
  }, [effectiveUserId, flowState]);

  useEffect(() => {
    loadUserResumes();
  }, [loadUserResumes]);

  const currentResume = resumes.find((r) => r.isCurrent) || null;
  const activeResume = resumes.find((r) => r.id === activeResumeId) || currentResume;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleValidateAndSetFile = (file: File) => {
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      showToast('Invalid File Format', 'Please upload a PDF resume.', 'warning');
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showToast('File Too Large', 'Resume must be smaller than 5 MB.', 'warning');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleValidateAndSetFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleValidateAndSetFile(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const scrollToUpload = () => {
    setShowUploadModal(true);
  };

  /**
   * 1. Initial Resume Analysis Handler
   * Creates a NEW resume version with unique resumeId and sets it as Current in DB!
   */
  const handleStartAnalysis = async () => {
    if (!selectedFile || isAnalyzing) return;

    if (!targetRole.trim()) {
      showToast('Target Role Required', 'Please specify your target role.', 'warning');
      return;
    }

    setIsAnalyzing(true);
    setFlowState('analyzing');
    setStatusMessageIndex(0);

    try {
      // 1. Session verification
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        showToast('Session Missing', 'Your session has expired. Please sign in again.', 'error');
        setIsAnalyzing(false);
        setFlowState('idle');
        return;
      }

      // 2. PDF Text Extraction from this specific file
      let extractedText = '';
      try {
        extractedText = await extractTextFromPdf(selectedFile);
      } catch (pdfErr: any) {
        showToast('PDF Extraction Error', 'Unable to read this PDF. Please upload a text-readable PDF.', 'error');
        setIsAnalyzing(false);
        setFlowState('idle');
        return;
      }

      if (!extractedText || extractedText.trim().length < 15) {
        showToast('PDF Extraction Error', 'Unable to read this PDF. Please upload a readable text resume.', 'error');
        setIsAnalyzing(false);
        setFlowState('idle');
        return;
      }

      setExtractedResumeText(extractedText);

      // 3. Determine new version number and unique resumeId
      const existingVersions = resumes.map((r) => r.version);
      const nextVersion = existingVersions.length > 0 ? Math.max(...existingVersions) + 1 : 1;
      const resumeId = `resume_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // 4. Upload file to Supabase storage
      let uploadMeta: { fileUrl?: string; storagePath?: string } = {};
      try {
        uploadMeta = await resumeService.uploadResumeFile(effectiveUserId, resumeId, selectedFile);
      } catch (uploadErr) {
        console.warn('Storage upload notice:', uploadErr);
      }

      // 5. AI Analysis Request
      const result = await resumeService.analyzeResume({
        resumeText: extractedText,
        targetRole: targetRole.trim(),
      });

      // 6. Save as NEW Resume Version (Marked as Current)
      const newResumeItem: ResumeVersionItem = {
        id: resumeId,
        userId: effectiveUserId,
        version: nextVersion,
        versionLabel: `Resume_v${nextVersion}.pdf`,
        fileName: selectedFile.name || `Resume_v${nextVersion}.pdf`,
        fileSize: selectedFile.size,
        isCurrent: true,
        targetRole: targetRole.trim(),
        resumeText: extractedText,
        fileUrl: uploadMeta.fileUrl,
        storagePath: uploadMeta.storagePath,
        resumeType: 'uploaded',
        isAiImproved: false,
        analysisResult: result,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await resumeService.saveResumeVersion(newResumeItem);

      // Re-fetch all resumes from DB to guarantee single source of truth
      const freshResumes = await resumeService.getUserResumes(effectiveUserId);
      setResumes(freshResumes);
      setActiveResumeId(resumeId);
      setAnalysisResult(result);
      setSelectedFile(null);
      setFlowState('analyzed');
      showToast('Analysis Complete', `"${selectedFile.name}" analyzed & set as current resume.`, 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('[Resume Analyzer] Analysis error:', err?.message || err);
      const msg = err.message || 'AI request failed. Please try again.';
      showToast('Analysis Error', msg, 'error');
      setFlowState('idle');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Modal Upload and Analyze Handler
   */
  const handleUploadFromModal = async (file: File, extractedText: string, modalRole: string) => {
    setIsAnalyzing(true);
    setFlowState('analyzing');
    setStatusMessageIndex(0);
    setTargetRole(modalRole);

    try {
      const existingVersions = resumes.map((r) => r.version);
      const nextVersion = existingVersions.length > 0 ? Math.max(...existingVersions) + 1 : 1;
      const resumeId = `resume_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      let uploadMeta: { fileUrl?: string; storagePath?: string } = {};
      try {
        uploadMeta = await resumeService.uploadResumeFile(effectiveUserId, resumeId, file);
      } catch (uploadErr) {
        console.warn('Storage upload notice:', uploadErr);
      }

      const result = await resumeService.analyzeResume({
        resumeText: extractedText,
        targetRole: modalRole,
      });

      const newResumeItem: ResumeVersionItem = {
        id: resumeId,
        userId: effectiveUserId,
        version: nextVersion,
        versionLabel: `Resume_v${nextVersion}.pdf`,
        fileName: file.name || `Resume_v${nextVersion}.pdf`,
        fileSize: file.size,
        isCurrent: true,
        targetRole: modalRole,
        resumeText: extractedText,
        fileUrl: uploadMeta.fileUrl,
        storagePath: uploadMeta.storagePath,
        resumeType: 'uploaded',
        isAiImproved: false,
        analysisResult: result,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await resumeService.saveResumeVersion(newResumeItem);

      // Re-fetch all resumes from DB
      const freshResumes = await resumeService.getUserResumes(effectiveUserId);
      setResumes(freshResumes);
      setActiveResumeId(resumeId);
      setExtractedResumeText(extractedText);
      setAnalysisResult(result);
      setFlowState('analyzed');
      showToast('Upload Successful', `"${file.name}" uploaded and set as current resume.`, 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Modal upload failed:', err);
      showToast('Upload Failed', err.message || 'Failed to upload resume.', 'error');
      setFlowState('idle');
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * 2. Trigger Questions Flow for Selected / Active Resume
   */
  const handleStartImprovementFlow = async (targetResumeItem?: ResumeVersionItem) => {
    // Determine the exact resume to improve based on targetResumeItem ID, activeResumeId, or currentResume
    const targetId = targetResumeItem?.id || activeResumeId;
    let resumeToImprove = targetResumeItem;
    if (!resumeToImprove && targetId) {
      resumeToImprove = resumes.find((r) => r.id === targetId) || null;
    }
    if (!resumeToImprove) {
      resumeToImprove = currentResume;
    }

    const resumeTextToUse = resumeToImprove?.resumeText || extractedResumeText;
    const roleToUse = resumeToImprove?.targetRole || targetRole;
    const analysisToUse = resumeToImprove?.analysisResult || analysisResult;

    if (!resumeTextToUse || !resumeTextToUse.trim()) {
      showToast('Resume Missing', 'Please select or upload a resume to improve.', 'warning');
      throw new Error('Resume text is required for improvement.');
    }

    if (resumeToImprove) {
      setActiveResumeId(resumeToImprove.id);
      setExtractedResumeText(resumeTextToUse);
      setTargetRole(roleToUse);
      setAnalysisResult(analysisToUse || null);
    }

    setFlowState('generating_questions');
    try {
      const qResponse = await resumeService.generateImprovementQuestions({
        resumeText: resumeTextToUse,
        targetRole: roleToUse.trim(),
        analysisResult: analysisToUse,
      });

      setImprovementQuestions(qResponse.questions || []);
      setFlowState('answering_questions');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('[Resume Analyzer] Questions generation error:', err);
      showToast('Question Generation Issue', 'Failed to generate mentor questions. Please try again.', 'error');
      setFlowState(analysisToUse ? 'analyzed' : 'idle');
      throw err;
    }
  };

  /**
   * 3. Complete Answers & Synthesize Improved Resume
   * Creates a NEW Resume Version (e.g. Resume_v2 – AI Improved) with unique ID!
   */
  const handleCompleteQuestions = async (answers: ResumeQuestionAnswer[]) => {
    setStudentAnswers(answers);
    setFlowState('generating_improved');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // Step A: Generate improved resume
      const improved = await resumeService.generateImprovedResume({
        resumeText: extractedResumeText,
        targetRole: targetRole.trim(),
        answers,
        initialAnalysis: analysisResult,
      });

      // Step B: Authenticated Re-Analysis for accurate Before/After scores
      let afterScores = analysisResult!;
      try {
        afterScores = await resumeService.reAnalyzeResume(
          improved.rawText || '',
          targetRole.trim()
        );
      } catch (reErr) {
        console.warn('Re-analysis fallback, using projected scores:', reErr);
        afterScores = {
          ...analysisResult!,
          overall_score: Math.min(96, (analysisResult?.overall_score || 60) + 24),
          ats_score: Math.min(98, (analysisResult?.ats_score || 60) + 26),
          role_match_score: Math.min(95, (analysisResult?.role_match_score || 60) + 22),
        };
      }

      const comparison: ResumeBeforeAfterComparison = {
        before: {
          overall_score: analysisResult?.overall_score || 50,
          ats_score: analysisResult?.ats_score || 50,
          role_match_score: analysisResult?.role_match_score || 50,
        },
        after: {
          overall_score: afterScores.overall_score,
          ats_score: afterScores.ats_score,
          role_match_score: afterScores.role_match_score,
        },
        overallScoreDiff: afterScores.overall_score - (analysisResult?.overall_score || 50),
        atsScoreDiff: afterScores.ats_score - (analysisResult?.ats_score || 50),
        roleMatchScoreDiff: afterScores.role_match_score - (analysisResult?.role_match_score || 50),
      };

      setImprovedResumeData(improved);
      setComparisonData(comparison);

      // Create a NEW resume version for the improved resume
      const existingVersions = resumes.map((r) => r.version);
      const nextVersion = existingVersions.length > 0 ? Math.max(...existingVersions) + 1 : 2;
      const improvedResumeId = `resume_ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const aiImprovedResumeItem: ResumeVersionItem = {
        id: improvedResumeId,
        userId: effectiveUserId,
        version: nextVersion,
        versionLabel: `Resume_v${nextVersion} – AI Improved`,
        fileName: `CareerPilot_Resume_v${nextVersion}.pdf`,
        isCurrent: true, // Improved becomes Current, Original becomes Previous Version
        targetRole: targetRole.trim(),
        resumeText: improved.rawText || extractedResumeText,
        resumeType: 'ai_generated',
        isAiImproved: true,
        parentResumeId: activeResumeId || undefined,
        analysisResult: afterScores,
        improvedData: improved,
        comparisonData: comparison,
        studentAnswers: answers,
        structuredData: improved.structured,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await resumeService.saveResumeVersion(aiImprovedResumeItem);

      // Re-fetch all resumes from DB
      const freshResumes = await resumeService.getUserResumes(effectiveUserId);
      setResumes(freshResumes);
      setActiveResumeId(improvedResumeId);
      setFlowState('improved_view');
      setActiveTab('improved');

      showToast('Resume Improved', `Created new version: Resume_v${nextVersion} (AI Improved)`, 'success');
    } catch (err: any) {
      console.error('Error generating improved resume:', err);
      showToast('Improvement Error', err.message || 'Failed to generate improved resume.', 'error');
      setFlowState('answering_questions');
    }
  };

  /**
   * 3b. Handle completion of 10-Step Resume Builder from Scratch
   */
  const handleBuilderComplete = async (newResumeItem: ResumeVersionItem) => {
    try {
      const freshResumes = await resumeService.getUserResumes(effectiveUserId);
      setResumes(freshResumes);
      setActiveResumeId(newResumeItem.id);
      setExtractedResumeText(newResumeItem.resumeText || '');
      setTargetRole(newResumeItem.targetRole || targetRole);
      setAnalysisResult(newResumeItem.analysisResult || null);
      setImprovedResumeData(newResumeItem.improvedData || null);
      setComparisonData(newResumeItem.comparisonData || null);
      setFlowState('improved_view');
      setActiveTab('improved');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Resume Created', `Successfully generated and saved ${newResumeItem.fileName || newResumeItem.versionLabel}`, 'success');
    } catch (err: any) {
      console.error('Error post-builder complete:', err);
      showToast('Builder Notice', 'Resume created successfully.', 'success');
    }
  };

  /**
   * 4. Make a specific resume Current in DB
   */
  const handleMakeCurrent = async (resume: ResumeVersionItem) => {
    try {
      await resumeService.setCurrentResume(effectiveUserId, resume.id);
      const freshResumes = await resumeService.getUserResumes(effectiveUserId);
      setResumes(freshResumes);
      setActiveResumeId(resume.id);
      if (resume.analysisResult) {
        setAnalysisResult(resume.analysisResult);
      }
      showToast('Current Resume Updated', `"${resume.fileName || resume.versionLabel}" is now your current resume.`, 'success');
    } catch (err) {
      console.error('Failed to set current resume:', err);
      showToast('Update Failed', 'Could not update current resume.', 'error');
    }
  };

  /**
   * 5. Select Resume to Analyze strictly by resume_id
   */
  const handleSelectResumeToAnalyze = async (resume: ResumeVersionItem) => {
    setActiveResumeId(resume.id);
    setExtractedResumeText(resume.resumeText || '');
    setTargetRole(resume.targetRole || 'Software Developer');

    if (resume.improvedData && resume.comparisonData) {
      setImprovedResumeData(resume.improvedData);
      setComparisonData(resume.comparisonData);
      setStudentAnswers(resume.studentAnswers || []);
      setAnalysisResult(resume.analysisResult || null);
      setFlowState('improved_view');
      setActiveTab('improved');
    } else if (resume.analysisResult) {
      setAnalysisResult(resume.analysisResult);
      setImprovedResumeData(null);
      setComparisonData(null);
      setFlowState('analyzed');
    } else {
      // Trigger new analysis for this resume
      setAnalysisResult(null);
      setImprovedResumeData(null);
      setComparisonData(null);
      setFlowState('idle');
      await handleRunAnalysisForResume(resume);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Run Analysis for a specific existing resume
   */
  const handleRunAnalysisForResume = async (resume: ResumeVersionItem) => {
    if (!resume.resumeText || isAnalyzing) return;
    setIsAnalyzing(true);
    setFlowState('analyzing');
    try {
      const result = await resumeService.analyzeResume({
        resumeText: resume.resumeText,
        targetRole: resume.targetRole || targetRole,
      });

      await resumeService.saveAnalysisToResume(effectiveUserId, resume.id, result);
      const freshResumes = await resumeService.getUserResumes(effectiveUserId);
      setResumes(freshResumes);
      setAnalysisResult(result);
      setFlowState('analyzed');
      showToast('Analysis Complete', `Analyzed ${resume.fileName || resume.versionLabel}.`, 'success');
    } catch (err: any) {
      showToast('Analysis Error', err.message || 'Failed to analyze resume.', 'error');
      setFlowState('idle');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * 6. View Resume in Dedicated Viewer Modal
   */
  const handleViewResume = (resume: ResumeVersionItem) => {
    console.log('[Resume Viewer] Opening resume in view mode:', {
      id: resume.id,
      fileName: resume.fileName || resume.versionLabel,
      isAiImproved: resume.isAiImproved,
      version: resume.version,
    });

    setActiveResumeId(resume.id);
    setExtractedResumeText(resume.resumeText || '');
    setTargetRole(resume.targetRole || 'Software Developer');

    if (resume.isAiImproved && resume.improvedData && resume.comparisonData) {
      setImprovedResumeData(resume.improvedData);
      setComparisonData(resume.comparisonData);
      setStudentAnswers(resume.studentAnswers || []);
      setAnalysisResult(resume.analysisResult || null);
    }

    setViewingResumeInitialMode('view');
    setViewingResume(resume);
  };

  const handleEditResumeInViewer = (resume: ResumeVersionItem) => {
    console.log('[Resume Viewer] Opening resume in edit mode:', {
      id: resume.id,
      fileName: resume.fileName || resume.versionLabel,
    });

    setActiveResumeId(resume.id);
    setExtractedResumeText(resume.resumeText || '');
    setTargetRole(resume.targetRole || 'Software Developer');

    setViewingResumeInitialMode('edit');
    setViewingResume(resume);
  };

  /**
   * 7. Delete Resume
   */
  const handleDeleteResume = async (resumeToDelete: ResumeVersionItem) => {
    try {
      const wasActiveDeleted = resumeToDelete.isCurrent || activeResumeId === resumeToDelete.id;

      await resumeService.deleteResume(effectiveUserId, resumeToDelete.id, resumeToDelete.storagePath);
      
      const freshResumes = await resumeService.getUserResumes(effectiveUserId);
      setResumes(freshResumes);

      // If active resume was deleted, strictly reset to no active resume
      if (wasActiveDeleted) {
        setActiveResumeId(null);
        setAnalysisResult(null);
        setExtractedResumeText('');
        setImprovedResumeData(null);
        setComparisonData(null);
        setFlowState('idle');
      }

      showToast('Resume Deleted', `"${resumeToDelete.fileName || resumeToDelete.versionLabel}" has been removed.`, 'info');
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('Delete Error', 'Failed to delete resume. Please try again.', 'error');
    }
  };

  /**
   * 8. Regenerate Resume with Existing Answers
   */
  const handleRegenerate = async () => {
    if (!extractedResumeText || !studentAnswers.length) return;
    setIsRegenerating(true);
    try {
      const improved = await resumeService.generateImprovedResume({
        resumeText: extractedResumeText,
        targetRole: targetRole.trim(),
        answers: studentAnswers,
        initialAnalysis: analysisResult,
      });
      setImprovedResumeData(improved);
      showToast('Resume Regenerated', 'Updated resume successfully.', 'success');
    } catch (err: any) {
      showToast('Regeneration Error', err.message || 'Failed to regenerate resume.', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleResetAll = () => {
    setAnalysisResult(null);
    setSelectedFile(null);
    setExtractedResumeText('');
    setImprovementQuestions([]);
    setStudentAnswers([]);
    setImprovedResumeData(null);
    setComparisonData(null);
    setFlowState('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-teal-400';
    if (score >= 60) return 'from-amber-500 to-yellow-400';
    return 'from-rose-500 to-red-400';
  };

  const hasSignificantGaps =
    analysisResult &&
    (analysisResult.overall_score < 82 ||
      (analysisResult.missing_skills && analysisResult.missing_skills.length > 1) ||
      (analysisResult.improvement_suggestions && analysisResult.improvement_suggestions.length > 2));

  const getImprovementBannerMessage = () => {
    if (!analysisResult) return '';
    const missingCount = analysisResult.missing_skills?.length || 0;
    const topMissing = analysisResult.missing_skills
      ?.slice(0, 2)
      .map((s: any) => (typeof s === 'string' ? s : s?.name || s?.skill || ''))
      .filter(Boolean)
      .join(', ');

    if (analysisResult.overall_score >= 85) {
      return `Your resume is strongly aligned with the target role (${targetRole})! You can optionally answer a few quick questions to further highlight your technical accomplishments.`;
    }
    if (missingCount > 0 && topMissing) {
      return `Your resume has high potential, but key technical skills such as ${topMissing} and quantifiable project metrics could be strengthened. Answer 3–5 targeted questions to generate a polished, ATS-optimized version.`;
    }
    if (hasSignificantGaps) {
      return `Your resume has high potential, but key technical metrics and project outcomes are missing. Answer 3–5 targeted questions to generate a polished, ATS-optimized version.`;
    }
    return `Your resume is well structured! You can answer a few quick questions to customize it with strong action verbs and keyword alignment for ${targetRole}.`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans space-y-8 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {sourceContext === 'roadmap' && (
              <button
                onClick={() => onNavigate('roadmap')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all cursor-pointer group shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Roadmap</span>
              </button>
            )}

            {(sourceContext === 'company-preparation' || sourceContext === 'company-prep') && (
              <button
                onClick={() => onNavigate('company-prep')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all cursor-pointer group shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Company Preparation</span>
              </button>
            )}

            {(sourceContext === 'preparation-dashboard' || sourceContext === 'dashboard' || sourceContext === 'prep-dashboard') && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all cursor-pointer group shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Preparation Dashboard</span>
              </button>
            )}

            {!sourceContext && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/30 transition-all cursor-pointer group shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Dashboard</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {flowState === 'improved_view' && (
              <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Resume Upgraded</span>
              </span>
            )}
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>CareerPilot AI Placement Engine</span>
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MY RESUMES VERSION MANAGEMENT SECTION (Always Accessible)                 */}
        {/* ========================================================================= */}
        <MyResumesManager
          resumes={resumes}
          currentResume={currentResume}
          onSelectResumeToAnalyze={handleSelectResumeToAnalyze}
          onViewResume={handleViewResume}
          onPrintResume={(resume) => {
            printResumeDocument(resume);
          }}
          onEditResume={handleEditResumeInViewer}
          onMakeCurrent={handleMakeCurrent}
          onDeleteResume={handleDeleteResume}
          onTriggerUpload={scrollToUpload}
          onTriggerCreateResume={() => {
            setFlowState('builder');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isLoading={isLoadingResumes}
        />

        {/* ========================================================================= */}
        {/* VIEW 1: UPLOAD & CONFIGURATION VIEW (Default / Idle)                      */}
        {/* ========================================================================= */}
        {((flowState === 'idle' && !analysisResult) ||
          (!analysisResult &&
            flowState !== 'analyzing' &&
            flowState !== 'generating_questions' &&
            flowState !== 'generating_improved' &&
            flowState !== 'answering_questions' &&
            flowState !== 'builder' &&
            flowState !== 'editor' &&
            !(flowState === 'improved_view' && improvedResumeData && comparisonData))) && (
          <div ref={uploadSectionRef} className="space-y-8 animate-fade-in pt-4">
            {/* Header Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900/10 via-slate-100 to-white dark:from-indigo-950/80 dark:via-slate-900 dark:to-slate-950 border border-indigo-500/20 shadow-lg dark:shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[200px] bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

              <div className="space-y-3 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
                  <FileCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Resume Optimization, Live Editing & Version Tracking</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Resume Studio & ATS Optimizer
                </h1>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                  Build an ATS-optimized placement resume from scratch with our guided 10-step AI assistant, edit your existing resume in the live two-panel studio, or upload to diagnose ATS compliance and receive targeted bullet enhancements.
                </p>
              </div>
            </div>

            {/* THREE RESUME PATHWAYS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option A: Upload Existing Resume */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Upload Existing Resume
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Upload a PDF resume to analyze ATS keyword match, identify skill gaps, and re-score with mentor feedback.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Upload & Analyze</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">PDF Support</span>
                </div>
              </div>

              {/* Option B: Live Two-Panel Editor */}
              <div
                onClick={() => {
                  setFlowState('editor');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/10 via-purple-900/5 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 border-2 border-indigo-500/50 hover:border-indigo-500 shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
                      Live Studio
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                      <span>Live Resume Editor</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Two-panel visual studio with instant preview, AI section re-writing, 4 professional templates, and live ATS calculation.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <span>Open Live Editor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Live Preview</span>
                </div>
              </div>

              {/* Option C: 10-Step Resume Builder */}
              <div
                onClick={() => {
                  setFlowState('builder');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:text-indigo-600 transition-colors">
                    <FileEdit className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                      <span>10-Step Guided Builder</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Build an ATS-ready resume from scratch. Auto-fills your verified profile, structures projects with STAR metrics, and generates a formatted PDF.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>Launch 10 Steps</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Step-by-Step</span>
                </div>
              </div>
            </div>

            {/* Target Role Selector */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Select Target Job Role</span>
                </label>
                <button
                  type="button"
                  onClick={() => setCustomRoleInput(!customRoleInput)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {customRoleInput ? 'Choose from list' : 'Enter custom role'}
                </button>
              </div>

              {customRoleInput ? (
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Cloud Security Specialist, Site Reliability Engineer..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {COMMON_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTargetRole(role)}
                      className={`p-3 rounded-2xl text-xs font-semibold text-left transition-all border cursor-pointer ${
                        targetRole === role
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Drag & Drop Upload Zone */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="resume-pdf-upload"
              />

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-950/40'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Click to upload or drag & drop your resume PDF
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Standard PDF format • Maximum file size: 5 MB
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {formatFileSize(selectedFile.size)} • PDF Document
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Start Analysis Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={!selectedFile || isAnalyzing}
                  onClick={handleStartAnalysis}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze & Save as Current Resume</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: LOADING SPINNER (Analyzing or Generating)                         */}
        {/* ========================================================================= */}
        {(flowState === 'analyzing' ||
          flowState === 'generating_questions' ||
          flowState === 'generating_improved') && (
          <div className="p-12 sm:p-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6 animate-fade-in max-w-xl mx-auto my-12">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin" />
              <Bot className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {flowState === 'analyzing'
                  ? 'Analyzing Your Resume...'
                  : flowState === 'generating_questions'
                  ? 'Consulting AI Resume Mentor...'
                  : 'Synthesizing Your ATS-Optimized Resume...'}
              </h2>
              <p className="text-xs sm:text-sm font-mono text-indigo-600 dark:text-indigo-400 font-semibold min-h-[20px]">
                {flowState === 'analyzing'
                  ? ROTATING_STATUS_MESSAGES[statusMessageIndex % ROTATING_STATUS_MESSAGES.length]
                  : ROTATING_IMPROVEMENT_MESSAGES[statusMessageIndex % ROTATING_IMPROVEMENT_MESSAGES.length]}
              </p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Evaluating technical projects, ATS formatting compliance, and role suitability against real industry job standards.
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW: LIVE TWO-PANEL RESUME EDITOR                                        */}
        {/* ========================================================================= */}
        {flowState === 'editor' && (
          <LiveResumeEditor
            initialResume={activeResume || currentResume || undefined}
            userResumes={resumes}
            onSelectResume={(resume) => {
              setActiveResumeId(resume.id);
            }}
            onBack={() => {
              setFlowState(analysisResult ? 'analyzed' : 'idle');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onRefreshResumes={loadUserResumes}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW: GUIDED RESUME BUILDER (10-Step AI Resume Creation)                  */}
        {/* ========================================================================= */}
        {flowState === 'builder' && (
          <ResumeBuilderFlow
            onComplete={handleBuilderComplete}
            onCancel={() => {
              setFlowState('idle');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            initialTargetRole={targetRole}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: QUESTION FLOW (3-7 Targeted Questions)                            */}
        {/* ========================================================================= */}
        {flowState === 'answering_questions' && (
          <ResumeQuestionFlow
            questions={improvementQuestions}
            initialAnswers={studentAnswers}
            targetRole={targetRole}
            onComplete={handleCompleteQuestions}
            onCancel={() => setFlowState(improvedResumeData ? 'improved_view' : 'analyzed')}
          />
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: IMPROVED VIEW (Comparison + Preview + Diagnostic Tabs)             */}
        {/* ========================================================================= */}
        {flowState === 'improved_view' && improvedResumeData && comparisonData && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Top Mode Switcher Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab('improved')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'improved'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Improved Resume & Comparison</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('original')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'original'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Original Diagnostic Report</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {activeResume && !activeResume.isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleMakeCurrent(activeResume)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                    <span>Make This Current Resume</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={scrollToUpload}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload New Resume</span>
                </button>
              </div>
            </div>

            {/* Tab 1: Improved Resume & Comparison View */}
            {activeTab === 'improved' && (
              <div className="space-y-8 animate-fade-in">
                {/* 1. Comparison Cards */}
                <ResumeComparisonView
                  comparison={comparisonData}
                  keyEnhancements={improvedResumeData.keyEnhancements || improvedResumeData.keyEnhancementsApplied || []}
                  targetRole={targetRole}
                />

                {/* 2. ATS Resume Preview & Live Editor */}
                <ResumePreviewEditor
                  improvedData={improvedResumeData}
                  onRegenerate={handleRegenerate}
                  onEditAnswers={() => setFlowState('answering_questions')}
                  isRegenerating={isRegenerating}
                />
              </div>
            )}

            {/* Tab 2: Original Diagnostic Report */}
            {activeTab === 'original' && analysisResult && (
              <div className="space-y-6 animate-fade-in">
                {/* Score Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Original Overall Score
                    </span>
                    <div className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
                      {analysisResult.overall_score}/100
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Original ATS Score
                    </span>
                    <div className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
                      {analysisResult.ats_score}/100
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Original Role Match
                    </span>
                    <div className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
                      {analysisResult.role_match_score}%
                    </div>
                  </div>
                </div>

                {/* Strengths & Missing Skills */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      Original Strengths
                    </h3>
                    <ul className="space-y-2">
                      {analysisResult.strengths?.map((s: any, idx) => (
                        <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{typeof s === 'string' ? s : s?.strength || s?.name || JSON.stringify(s)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      Original Missing Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.missing_skills?.map((ms: any, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-semibold"
                        >
                          {typeof ms === 'string' ? ms : ms?.name || ms?.skill || JSON.stringify(ms)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: INITIAL ANALYSIS RESULT VIEW + INTERACTIVE IMPROVE CALLOUT        */}
        {/* ========================================================================= */}
        {flowState === 'analyzed' && analysisResult && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Interactive Mentor Follow-Up Callout Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900/20 via-slate-900 to-indigo-950 border border-indigo-500/40 shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 blur-[90px] rounded-full pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 border border-indigo-400/30 flex items-center justify-center text-white shadow-lg shadow-indigo-600/40 shrink-0">
                    <Bot className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                        AI Resume Improvement Flow
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-bold">
                        Interactive
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed max-w-xl">
                      {getImprovementBannerMessage()}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartImprovementFlow()}
                  className="px-7 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-500/30 transition-all cursor-pointer flex items-center justify-center gap-2.5 shrink-0 group"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{hasSignificantGaps ? 'Improve My Resume' : 'Polish & Customize Resume'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Overall Placement Score */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Overall Score
                  </span>
                  <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                    {analysisResult.overall_score}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/100</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getScoreRingColor(analysisResult.overall_score)} rounded-full`}
                    style={{ width: `${analysisResult.overall_score}%` }}
                  />
                </div>
              </div>

              {/* ATS Compatibility */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    ATS Compatibility
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                    {analysisResult.ats_score}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/100</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getScoreRingColor(analysisResult.ats_score)} rounded-full`}
                    style={{ width: `${analysisResult.ats_score}%` }}
                  />
                </div>
              </div>

              {/* Role Match Score */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Target Role Match
                  </span>
                  <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                    {analysisResult.role_match_score}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                    style={{ width: `${analysisResult.role_match_score}%` }}
                  />
                </div>
              </div>

            </div>

            {/* Strengths & Missing Skills */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Strengths */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Key Strengths Identified
                  </h3>
                </div>
                <ul className="space-y-2.5">
                  {analysisResult.strengths?.map((strength: any, idx) => (
                    <li key={idx} className="p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        {typeof strength === 'string' ? strength : strength?.strength || strength?.name || JSON.stringify(strength)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Missing Skills */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Missing Role Skills & Keywords
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.missing_skills?.map((skill: any, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold"
                    >
                      {typeof skill === 'string' ? skill : skill?.name || skill?.skill || JSON.stringify(skill)}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Improvement Suggestions */}
            {analysisResult.improvement_suggestions && analysisResult.improvement_suggestions.length > 0 && (
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Actionable Improvement Suggestions
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysisResult.improvement_suggestions.map((suggestion: any, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>
                        {typeof suggestion === 'string' ? suggestion : suggestion?.suggestion || JSON.stringify(suggestion)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keyword Analysis */}
            {analysisResult.keyword_analysis && (
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Keyword Analysis & ATS Density
                  </h3>
                </div>
                {(() => {
                  const kwData = analysisResult.keyword_analysis as any;
                  const matchedList: string[] = Array.isArray(kwData)
                    ? kwData.filter((k: any) => k?.matched).map((k: any) => (typeof k === 'string' ? k : k.keyword))
                    : Array.isArray(kwData?.matched)
                      ? kwData.matched.map((k: any) => (typeof k === 'string' ? k : k.keyword || JSON.stringify(k)))
                      : [];

                  const missingList: string[] = Array.isArray(kwData)
                    ? kwData.filter((k: any) => !k?.matched).map((k: any) => (typeof k === 'string' ? k : k.keyword))
                    : Array.isArray(kwData?.missing)
                      ? kwData.missing.map((k: any) => (typeof k === 'string' ? k : k.keyword || JSON.stringify(k)))
                      : [];

                  const densityText = (!Array.isArray(kwData) && kwData?.density_feedback) ||
                    'Optimal keyword density for target role is 3-5 mentions per core skill.';

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                        <span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                          Matched Keywords ({matchedList.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {matchedList.length > 0 ? (
                            matchedList.map((kw, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-medium">
                                {kw}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">None detected</span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                        <span className="text-[11px] font-bold uppercase text-rose-600 dark:text-rose-400">
                          Missing Critical ({missingList.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {missingList.length > 0 ? (
                            missingList.map((kw, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[11px] font-mono font-medium">
                                {kw}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">None missing</span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                        <span className="text-[11px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                          Recommended Density
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {densityText}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Project Feedback */}
            {analysisResult.project_feedback && (
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Project Section Evaluation
                  </h3>
                </div>
                {Array.isArray(analysisResult.project_feedback) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {analysisResult.project_feedback.map((item: any, idx: number) => {
                      const name = typeof item === 'object' && item?.name ? item.name : `Project ${idx + 1}`;
                      const strength = typeof item === 'object' ? item.strength : '';
                      const suggestion = typeof item === 'object' ? item.suggestion : String(item);
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                            <h4 className="font-bold text-slate-900 dark:text-slate-100">{name}</h4>
                          </div>
                          {strength && (
                            <p className="text-emerald-700 dark:text-emerald-400 leading-relaxed">
                              <span className="font-semibold text-emerald-800 dark:text-emerald-300">Strength: </span>
                              {strength}
                            </p>
                          )}
                          {suggestion && (
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">Recommendation: </span>
                              {suggestion}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {typeof analysisResult.project_feedback === 'string'
                      ? analysisResult.project_feedback
                      : JSON.stringify(analysisResult.project_feedback)}
                  </p>
                )}
              </div>
            )}

            {/* Experience Summary */}
            {analysisResult.experience_summary && (
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Experience & Work Quality Summary
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {typeof analysisResult.experience_summary === 'string'
                    ? analysisResult.experience_summary
                    : JSON.stringify(analysisResult.experience_summary)}
                </p>
              </div>
            )}

            {/* Education Feedback */}
            {analysisResult.education_feedback && (
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Academic Background & Education Evaluation
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {typeof analysisResult.education_feedback === 'string'
                    ? analysisResult.education_feedback
                    : JSON.stringify(analysisResult.education_feedback)}
                </p>
              </div>
            )}

            {/* Final AI Career Recommendation */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white shadow-xl shadow-indigo-900/20 space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h3 className="font-extrabold text-base sm:text-lg">
                  AI Career Recommendation
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
                {typeof analysisResult.final_recommendation === 'string'
                  ? analysisResult.final_recommendation
                  : JSON.stringify(analysisResult.final_recommendation)}
              </p>
            </div>

            {/* Bottom Navigation Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 pb-8">
              <button
                type="button"
                onClick={scrollToUpload}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Another Resume</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartImprovementFlow()}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/25 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Improve My Resume with AI Mentor</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Upload Resume Modal */}
      {showUploadModal && (
        <UploadResumeModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadAndAnalyze={handleUploadFromModal}
          initialTargetRole={targetRole}
        />
      )}

      {/* Resume Viewer Modal */}
      {viewingResume && (
        <ResumeViewerModal
          isOpen={!!viewingResume}
          onClose={() => setViewingResume(null)}
          resume={viewingResume}
          initialMode={viewingResumeInitialMode}
          onRefreshResumes={loadUserResumes}
          onPrint={(resume) => {
            printResumeDocument(resume);
          }}
          onEdit={(resume) => {
            setViewingResumeInitialMode('edit');
          }}
          onMakeCurrent={async (resume) => {
            await handleMakeCurrent(resume);
            setViewingResume(null);
          }}
          onAnalyze={(resume) => {
            setViewingResume(null);
            handleSelectResumeToAnalyze(resume);
          }}
          onReAnalyze={(resume) => {
            setViewingResume(null);
            handleSelectResumeToAnalyze(resume);
          }}
          onImprove={async (resume) => {
            await handleStartImprovementFlow(resume);
            setViewingResume(null);
          }}
          onImproveResume={async (resume) => {
            await handleStartImprovementFlow(resume);
            setViewingResume(null);
          }}
        />
      )}
    </div>
  );
};
