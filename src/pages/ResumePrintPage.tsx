import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Printer, X, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ResumeVersionItem, StructuredResumeData } from '../types/resume';
import { resumeService } from '../services/resumeService';
import { getStructuredResumeData } from '../utils/resumePrint';

interface ResumePrintPageProps {
  resumeId?: string | null;
  onNavigate?: (route: string) => void;
}

export const ResumePrintPage: React.FC<ResumePrintPageProps> = ({
  resumeId,
}) => {
  const { user, loading: authLoading } = useAuth();
  const [resume, setResume] = useState<ResumeVersionItem | null>(() => {
    // Synchronously check storage cache for instantaneous loading
    if (!resumeId) return null;
    try {
      const activeStr = sessionStorage.getItem(`careerpilot_print_resume_${resumeId}`) ||
        sessionStorage.getItem('careerpilot_active_print_resume') ||
        localStorage.getItem(`careerpilot_print_resume_${resumeId}`);
      if (activeStr) {
        const parsed = JSON.parse(activeStr);
        if (parsed && (parsed.id === resumeId || !parsed.id)) {
          return parsed;
        }
      }
    } catch (_) {}
    return null;
  });

  const [isLoadingResume, setIsLoadingResume] = useState<boolean>(!resume);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4');
  const printTriggeredRef = useRef<boolean>(false);

  // 1. Fetch and authenticate ownership of the exact requested resume
  useEffect(() => {
    // If resume was already loaded synchronously from storage cache, skip network spinner
    if (resume) {
      setIsLoadingResume(false);
      return;
    }

    if (authLoading) return;

    if (!resumeId) {
      setIsLoadingResume(false);
      setErrorMessage('Resume not found.');
      return;
    }

    let isMounted = true;

    async function loadResumeData() {
      setIsLoadingResume(true);
      setErrorMessage(null);

      // Attempt 1: Check session/local storage for cached print payload
      try {
        const cachedStr =
          sessionStorage.getItem(`careerpilot_print_resume_${resumeId}`) ||
          sessionStorage.getItem('careerpilot_active_print_resume') ||
          localStorage.getItem(`careerpilot_print_resume_${resumeId}`);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached) {
            if (isMounted) {
              setResume(cached);
              setIsLoadingResume(false);
              return;
            }
          }
        }
      } catch (_) {}

      // Attempt 2: Load via resumeService using authenticated user or guest
      const effectiveUserId = user?.id || 'guest';
      try {
        const item = await resumeService.getResumeById(effectiveUserId, resumeId);
        if (!isMounted) return;

        if (item) {
          setResume(item);
          setIsLoadingResume(false);
          return;
        }
      } catch (err) {
        console.warn('[ResumePrintPage] Direct lookup notice:', err);
      }

      // Attempt 3: Scan all local storage keys for resume matches
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('careerpilot_resumes_')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                const found = list.find((r: ResumeVersionItem) => r.id === resumeId);
                if (found && isMounted) {
                  setResume(found);
                  setIsLoadingResume(false);
                  return;
                }
              }
            }
          }
        }
      } catch (_) {}

      if (isMounted) {
        setErrorMessage('Resume not found.');
        setResume(null);
        setIsLoadingResume(false);
      }
    }

    loadResumeData();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, resumeId, resume]);

  // 2. Extract structured resume data for clean ATS presentation
  const structured: StructuredResumeData | null = useMemo(() => {
    if (!resume) return null;
    return getStructuredResumeData(resume);
  }, [resume]);

  // 3. Update tab title dynamically to candidate's name or resume filename
  useEffect(() => {
    if (resume) {
      const candidateName = structured?.fullName || resume.fileName || resume.versionLabel || 'Resume';
      document.title = `${candidateName} – Resume`;
    }
  }, [resume, structured]);

  // 4. Native Print Trigger
  const handlePrintResume = () => {
    try {
      const styleId = 'careerpilot-print-page-style';
      let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }
      styleTag.innerHTML = `
        @media print {
          @page {
            size: ${pageSize === 'a4' ? 'A4' : 'letter'} portrait !important;
            margin: 12mm 15mm 12mm 15mm !important;
          }
        }
      `;

      window.print();
    } catch (err) {
      console.error('[ResumePrintPage] Error calling window.print():', err);
    }
  };

  // 5. Automatically trigger native browser print dialog once document is ready
  useEffect(() => {
    if (isLoadingResume || authLoading || !resume || !structured || printTriggeredRef.current) {
      return;
    }

    printTriggeredRef.current = true;

    const triggerWhenReady = async () => {
      try {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
      } catch {
        // Fallback if fonts API is unavailable
      }

      // Allow reflow and rendering to complete before triggering print dialog
      setTimeout(() => {
        handlePrintResume();
      }, 150);
    };

    triggerWhenReady();
  }, [isLoadingResume, authLoading, resume, structured]);

  // Loading state
  if (authLoading || isLoadingResume) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-slate-800 font-sans">
        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Preparing print document...</p>
        </div>
      </div>
    );
  }

  // Error state: Clean, secure fallback without leaking database IDs
  if (errorMessage || !resume || !structured) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800 font-sans">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl border border-slate-200 shadow-lg text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-slate-900">Resume not found.</h1>
            <p className="text-xs text-slate-500">
              The requested resume version could not be loaded. Please ensure the resume exists in your CareerPilot dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.close()}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  const {
    fullName = 'Candidate Name',
    title,
    contactInfo = {},
    summary,
    skills = [],
    projects = [],
    experience = [],
    education = [],
    certifications = [],
    achievements = [],
  } = structured;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      
      {/* Screen-Only Minimal Action Bar (Hidden completely in Native Print Preview) */}
      <header className="no-print sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
            {fullName}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold">
            {resume.versionLabel || `v${resume.version}`} {resume.isCurrent ? '• Current' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Format Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setPageSize('a4')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                pageSize === 'a4'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              A4
            </button>
            <button
              type="button"
              onClick={() => setPageSize('letter')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                pageSize === 'letter'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              US Letter
            </button>
          </div>

          <button
            type="button"
            id="print-resume-action-btn"
            onClick={handlePrintResume}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
            title="Open browser print dialog"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Document</span>
          </button>

          <button
            type="button"
            onClick={() => window.close()}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close this tab"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Screen Canvas & Print Document */}
      <main className="flex-1 flex flex-col items-center p-4 sm:p-8 overflow-y-auto">
        
        {/* The Print-Ready Resume Document Container (Natural Flow, No fixed 100vh truncation) */}
        <article
          id="resume-printable-document"
          className={`careerpilot-print-doc w-full bg-white text-black shadow-xl print:shadow-none p-[12mm] sm:p-[16mm] font-serif text-[11pt] leading-relaxed border border-slate-300 print:border-none relative box-border ${
            pageSize === 'a4' ? 'max-w-[210mm]' : 'max-w-[8.5in]'
          }`}
        >
          {/* 1. RESUME HEADER */}
          <header className="text-center pb-3 mb-4 border-b-2 border-black print-avoid-break">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-black">
              {fullName}
            </h1>
            <div className="text-xs sm:text-[13px] font-sans flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-1 text-black">
              {title && <span className="font-semibold text-black">{title}</span>}
              {contactInfo.email && (
                <>
                  <span className="text-black">•</span>
                  <span className="text-black">{contactInfo.email}</span>
                </>
              )}
              {contactInfo.phone && (
                <>
                  <span className="text-black">•</span>
                  <span className="text-black">{contactInfo.phone}</span>
                </>
              )}
              {contactInfo.location && (
                <>
                  <span className="text-black">•</span>
                  <span className="text-black">{contactInfo.location}</span>
                </>
              )}
              {contactInfo.linkedin && (
                <>
                  <span className="text-black">•</span>
                  <span className="text-black">{contactInfo.linkedin}</span>
                </>
              )}
              {contactInfo.github && (
                <>
                  <span className="text-black">•</span>
                  <span className="text-black">{contactInfo.github}</span>
                </>
              )}
              {contactInfo.portfolio && (
                <>
                  <span className="text-black">•</span>
                  <span className="text-black">{contactInfo.portfolio}</span>
                </>
              )}
            </div>
          </header>

          <div className="space-y-4">
            {/* 2. PROFESSIONAL SUMMARY */}
            {summary && (
              <section className="print-section print-avoid-break">
                <h2 className="print-section-header text-[12px] font-extrabold uppercase tracking-wider font-sans text-black border-b border-black pb-0.5 mb-1.5">
                  Professional Summary
                </h2>
                <p className="text-[11.5px] leading-relaxed text-black font-serif text-justify">
                  {summary}
                </p>
              </section>
            )}

            {/* 3. TECHNICAL SKILLS */}
            {skills && skills.length > 0 && (
              <section className="print-section print-avoid-break">
                <h2 className="print-section-header text-[12px] font-extrabold uppercase tracking-wider font-sans text-black border-b border-black pb-0.5 mb-1.5">
                  Technical Skills
                </h2>
                <div className="space-y-1 text-[11.5px]">
                  {skills.map((cat, idx) => (
                    <p key={`skill-cat-${idx}`} className="leading-snug text-black">
                      <strong className="font-sans font-bold text-black">{cat.category}: </strong>
                      <span className="font-serif">{Array.isArray(cat.items) ? cat.items.join(', ') : cat.items}</span>
                    </p>
                  ))}
                </div>
              </section>
            )}

            {/* 4. KEY TECHNICAL PROJECTS */}
            {projects && projects.length > 0 && (
              <section className="print-section">
                <h2 className="print-section-header text-[12px] font-extrabold uppercase tracking-wider font-sans text-black border-b border-black pb-0.5 mb-2 print-avoid-break">
                  Projects
                </h2>
                <div className="space-y-3">
                  {projects.map((proj, idx) => (
                    <div key={`proj-${idx}`} className="space-y-1 print-avoid-break">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <h3 className="font-sans font-bold text-[12.5px] text-black">
                          {proj.title}
                          {proj.roleOrSubtitle && (
                            <span className="font-normal text-black text-[11.5px]"> | {proj.roleOrSubtitle}</span>
                          )}
                        </h3>
                        {proj.link && (
                          <span className="text-[10.5px] font-mono text-black">
                            {proj.link}
                          </span>
                        )}
                      </div>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <p className="text-[10.5px] font-sans font-semibold text-black italic">
                          Technologies: {Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies}
                        </p>
                      )}
                      {proj.bulletPoints && proj.bulletPoints.length > 0 && (
                        <ul className="list-disc list-outside ml-4 space-y-0.5 text-[11px] text-black font-serif leading-relaxed">
                          {proj.bulletPoints.map((b, bIdx) => (
                            <li key={`proj-b-${bIdx}`}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 5. WORK & INTERNSHIP EXPERIENCE */}
            {experience && experience.length > 0 && (
              <section className="print-section">
                <h2 className="print-section-header text-[12px] font-extrabold uppercase tracking-wider font-sans text-black border-b border-black pb-0.5 mb-2 print-avoid-break">
                  Experience & Internships
                </h2>
                <div className="space-y-3">
                  {experience.map((exp, idx) => (
                    <div key={`exp-${idx}`} className="space-y-1 print-avoid-break">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <h3 className="font-sans font-bold text-[12.5px] text-black">
                          {exp.role} – <span className="font-semibold">{exp.company}</span>
                        </h3>
                        <span className="text-[11px] font-sans font-semibold text-black">
                          {exp.duration} {exp.location ? `| ${exp.location}` : ''}
                        </span>
                      </div>
                      {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                        <ul className="list-disc list-outside ml-4 space-y-0.5 text-[11px] text-black font-serif leading-relaxed">
                          {exp.bulletPoints.map((b, bIdx) => (
                            <li key={`exp-b-${bIdx}`}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 6. EDUCATION */}
            {education && education.length > 0 && (
              <section className="print-section print-avoid-break">
                <h2 className="print-section-header text-[12px] font-extrabold uppercase tracking-wider font-sans text-black border-b border-black pb-0.5 mb-1.5">
                  Education
                </h2>
                <div className="space-y-2">
                  {education.map((edu, idx) => (
                    <div key={`edu-${idx}`} className="flex items-baseline justify-between gap-2 flex-wrap text-[11.5px] print-avoid-break">
                      <div>
                        <strong className="font-sans font-bold text-black">{edu.institution}</strong>
                        <div className="text-black font-serif">
                          {edu.degree} {edu.gpaOrScore ? `• ${edu.gpaOrScore}` : ''}
                        </div>
                      </div>
                      <span className="text-[11px] font-sans font-semibold text-black">
                        {edu.durationOrYear} {edu.location ? `| ${edu.location}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 7. CERTIFICATIONS & ACHIEVEMENTS */}
            {((certifications && certifications.length > 0) ||
              (achievements && achievements.length > 0)) && (
              <section className="print-section print-avoid-break">
                <h2 className="print-section-header text-[12px] font-extrabold uppercase tracking-wider font-sans text-black border-b border-black pb-0.5 mb-1.5">
                  Certifications & Achievements
                </h2>
                <ul className="list-disc list-outside ml-4 space-y-0.5 text-[11px] text-black font-serif">
                  {certifications?.map((c, idx) => (
                    <li key={`cert-${idx}`}>{c}</li>
                  ))}
                  {achievements?.map((a, idx) => (
                    <li key={`ach-${idx}`}>{a}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </article>

      </main>

    </div>
  );
};
