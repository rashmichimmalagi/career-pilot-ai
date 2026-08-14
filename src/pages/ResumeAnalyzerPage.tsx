import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
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
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { extractTextFromPdf } from '../utils/pdfExtractor';
import { resumeService } from '../services/resumeService';
import { ResumeAnalysisResult } from '../types/resume';

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

export const ResumeAnalyzerPage: React.FC<ResumeAnalyzerPageProps> = ({ onNavigate }) => {
  const { profile, showToast } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState<string>('Software Developer');
  const [customRoleInput, setCustomRoleInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize target role from student profile
  useEffect(() => {
    if (profile?.target_role && profile.target_role.trim()) {
      setTargetRole(profile.target_role.trim());
    }
  }, [profile?.target_role]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleValidateAndSetFile = (file: File) => {
    // 1. Validate MIME type or extension
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      showToast('Invalid File Format', 'Please upload a PDF resume.', 'warning');
      return;
    }

    // 2. Validate maximum file size (5MB = 5 * 1024 * 1024 bytes)
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

  const handleStartAnalysis = async () => {
    if (!selectedFile || isAnalyzing) return;

    if (!targetRole.trim()) {
      showToast('Target Role Required', 'Please specify your target role.', 'warning');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Step 1: Authentication verification
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !sessionData?.session) {
        showToast('Session Missing', 'Your session has expired. Please sign in again.', 'error');
        setIsAnalyzing(false);
        return;
      }

      // Step 2: PDF Text Extraction
      let extractedText = '';
      try {
        extractedText = await extractTextFromPdf(selectedFile);
        if (!extractedText || extractedText.trim().length < 20) {
          console.error('[PDF extraction] Failure stage: Extracted text is empty or under 20 characters.');
          showToast('PDF Extraction Error', 'Unable to read this PDF. Please upload a text-readable PDF.', 'error');
          setIsAnalyzing(false);
          return;
        }
        // Log length only as required
        console.log('[PDF extraction] PDF text extracted successfully. Length:', extractedText.length);
      } catch (pdfErr) {
        console.error('[PDF extraction] Failure stage: Text extraction from PDF failed:', pdfErr);
        showToast('PDF Extraction Error', 'Unable to read this PDF. Please upload a text-readable PDF.', 'error');
        setIsAnalyzing(false);
        return;
      }

      // Step 3: Secure AI Request
      console.log('[AI request] Initiating resume analysis request for role:', targetRole.trim());
      const result = await resumeService.analyzeResume({
        resumeText: extractedText,
        targetRole: targetRole.trim(),
      });

      console.log('[AI response] AI Analysis result received and parsed successfully.');
      setAnalysisResult(result);
      showToast('Analysis Complete', 'Your resume has been analyzed successfully!', 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Resume analysis failed:', err);
      const msg = err.message || 'AI analysis is temporarily unavailable. Please try again.';
      showToast('Analysis Error', msg, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setSelectedFile(null);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans space-y-8 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group"
          >
            <LayoutDashboard className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>← Back to Dashboard</span>
          </button>

          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Stage 2 Intelligence Active</span>
          </span>
        </div>

        {/* View Mode: Upload & Config OR Result Presentation */}
        {!analysisResult ? (
          /* ========================================================================= */
          /* UPLOAD & CONFIGURATION VIEW                                              */
          /* ========================================================================= */
          <div className="space-y-8">
            {/* Header Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900/10 via-slate-100 to-white dark:from-indigo-950/80 dark:via-slate-900 dark:to-slate-950 border border-indigo-500/20 shadow-lg dark:shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[200px] bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

              <div className="space-y-3 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
                  <FileCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Resume Optimization</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  AI Resume Analyzer
                </h1>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                  Analyze your resume against your target role and discover exactly how to improve it.
                </p>
              </div>
            </div>

            {/* Main Interactive Form Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
              
              {/* Step 1: File Upload Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Upload your resume</span>
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    PDF only • Maximum 5 MB
                  </span>
                </div>

                {!selectedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]'
                        : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500/60 bg-slate-50/50 dark:bg-slate-950/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                      <UploadCloud className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Drag and drop your PDF resume here, or <span className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2">browse files</span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Accepts standard PDF format up to 5 MB
                      </p>
                    </div>
                  </div>
                ) : (
                  /* File Selected State */
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {formatFileSize(selectedFile.size)} • PDF Ready
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Replace file
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Target Role Selection */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Target Role</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomRoleInput(!customRoleInput)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {customRoleInput ? 'Choose from list' : '+ Enter custom role'}
                  </button>
                </div>

                {customRoleInput ? (
                  <input
                    type="text"
                    placeholder="e.g. Cloud Solutions Architect, iOS Engineer..."
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                ) : (
                  <div className="relative">
                    <select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer"
                    >
                      {COMMON_ROLES.map((role) => (
                        <option key={role} value={role} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                          {role}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pre-populated from your academic profile. Changing it will benchmark your resume against specific competencies for this role.
                </p>
              </div>

              {/* Step 3: Analyze Action */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!selectedFile || isAnalyzing}
                  onClick={handleStartAnalysis}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analyzing Resume...</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze My Resume</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* DETAILED RESUME ANALYSIS RESULTS VIEW                                     */
          /* ========================================================================= */
          <div className="space-y-8">
            
            {/* Header Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900/10 via-slate-100 to-white dark:from-indigo-950/80 dark:via-slate-900 dark:to-slate-950 border border-indigo-500/20 shadow-lg dark:shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Analysis Complete</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase font-mono">
                    Target Role: {targetRole}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  Resume Analysis
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                  {analysisResult.experience_summary || 'Your resume has been benchmarked against industry ATS standards and technical placement parameters.'}
                </p>
              </div>

              {/* Action Buttons Top */}
              <div className="flex items-center gap-3 relative z-10 shrink-0">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Analyze Another Resume</span>
                </button>
              </div>
            </div>

            {/* Score Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              
              {/* Score 1: Overall Resume Score */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Overall Resume Score
                  </span>
                  <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 font-mono">
                    {analysisResult.overall_score}
                  </span>
                  <span className="text-slate-400 font-mono text-sm">/ 100</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getScoreRingColor(analysisResult.overall_score)} transition-all duration-1000`}
                    style={{ width: `${analysisResult.overall_score}%` }}
                  />
                </div>
              </div>

              {/* Score 2: ATS Compatibility */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    ATS Compatibility
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 font-mono">
                    {analysisResult.ats_score}
                  </span>
                  <span className="text-slate-400 font-mono text-sm">/ 100</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getScoreRingColor(analysisResult.ats_score)} transition-all duration-1000`}
                    style={{ width: `${analysisResult.ats_score}%` }}
                  />
                </div>
              </div>

              {/* Score 3: Role Match */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Role Match
                  </span>
                  <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 font-mono">
                    {analysisResult.role_match_score}%
                  </span>
                  <span className="text-slate-400 font-mono text-xs">Alignment</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getScoreRingColor(analysisResult.role_match_score)} transition-all duration-1000`}
                    style={{ width: `${analysisResult.role_match_score}%` }}
                  />
                </div>
              </div>

            </div>

            {/* Strengths & Missing Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: Your Strengths */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Your Strengths
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {analysisResult.strengths && analysisResult.strengths.length > 0 ? (
                    analysisResult.strengths.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-start gap-2.5"
                      >
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No specific strengths parsed.</p>
                  )}
                </div>
              </div>

              {/* Card 2: Skills You Should Add */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Skills You Should Add
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {analysisResult.missing_skills && analysisResult.missing_skills.length > 0 ? (
                    analysisResult.missing_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>{skill}</span>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No key missing skills identified.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Improvement Suggestions */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  How to Improve Your Resume
                </h3>
              </div>

              <div className="space-y-3">
                {analysisResult.improvement_suggestions && analysisResult.improvement_suggestions.length > 0 ? (
                  analysisResult.improvement_suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5"
                    >
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs shrink-0 shadow-sm shadow-indigo-600/30">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 pt-0.5 leading-relaxed">
                        {suggestion}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No specific suggestions found.</p>
                )}
              </div>
            </div>

            {/* Role Keywords Analysis */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  Role Keywords
                </h3>
              </div>

              <div className="space-y-4">
                {/* Matched Keywords */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Matched Keywords</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.keyword_analysis
                      ?.filter((k) => k.matched)
                      .map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium text-xs flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{item.keyword}</span>
                        </span>
                      ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Missing Keywords</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.keyword_analysis
                      ?.filter((k) => !k.matched)
                      .map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1"
                        >
                          <span className="text-rose-500 font-bold">+</span>
                          <span>{item.keyword}</span>
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Project Feedback */}
            {analysisResult.project_feedback && analysisResult.project_feedback.length > 0 && (
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Project Feedback
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResult.project_feedback.map((proj, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span>{proj.name}</span>
                      </h4>

                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                          <span className="font-bold block mb-0.5">Strength:</span>
                          {proj.strength}
                        </div>
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-800 dark:text-indigo-300">
                          <span className="font-bold block mb-0.5">Suggestion:</span>
                          {proj.suggestion}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education Feedback (if present) */}
            {analysisResult.education_feedback && (
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Academic Background & Education Evaluation
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {analysisResult.education_feedback}
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
                {analysisResult.final_recommendation}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 pb-8">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Analyze Another Resume</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/25 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Back to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
