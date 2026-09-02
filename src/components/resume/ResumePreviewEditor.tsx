import React, { useState, useRef, useEffect } from 'react';
import {
  FileDown,
  FileText,
  Edit3,
  Eye,
  RefreshCw,
  Copy,
  Check,
  Plus,
  Trash2,
  Sparkles,
  HelpCircle,
  Loader2,
  Printer,
} from 'lucide-react';
import { StructuredResumeData, ImprovedResumeResponse, ResumeVersionItem } from '../../types/resume';
import { exportResumeToDocx } from '../../utils/docxExport';
import { exportResumeToPdf } from '../../utils/pdfExport';
import { useAuth } from '../../context/AuthContext';
import { openResumePrintPage, printEditedResume } from '../../utils/resumePrint';

interface ResumePreviewEditorProps {
  improvedData: ImprovedResumeResponse;
  onRegenerate: () => void;
  onEditAnswers: () => void;
  isRegenerating?: boolean;
}

export const ResumePreviewEditor: React.FC<ResumePreviewEditorProps> = ({
  improvedData,
  onRegenerate,
  onEditAnswers,
  isRegenerating = false,
}) => {
  const { showToast } = useAuth();
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [structured, setStructured] = useState<StructuredResumeData>(improvedData.structured);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const printContainerRef = useRef<HTMLDivElement>(null);

  // Sync state if improvedData changes (e.g. after regeneration)
  useEffect(() => {
    if (improvedData?.structured) {
      setStructured(improvedData.structured);
    }
  }, [improvedData]);

  const handleCopyText = () => {
    const textToCopy = improvedData.rawText || generateMarkdownFromStructured(structured);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadDocx = async () => {
    try {
      setIsExportingDocx(true);
      const safeName = (structured.fullName || 'Candidate')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      await exportResumeToDocx(structured, `${safeName}_ATS_Resume.docx`);
    } catch (err) {
      console.error('Failed to export DOCX:', err);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      const safeName = (structured.fullName || 'Candidate')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      await exportResumeToPdf(structured, `${safeName}_ATS_Resume.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      showToast('Download Error', 'Unable to generate PDF. Please try again.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Structured Editing Handlers
  const handleSummaryChange = (val: string) => {
    setStructured((prev) => ({ ...prev, summary: val }));
  };

  const handleSkillChange = (categoryIdx: number, itemIdx: number, val: string) => {
    setStructured((prev) => {
      const skills = [...prev.skills];
      if (skills[categoryIdx]) {
        const items = [...skills[categoryIdx].items];
        items[itemIdx] = val;
        skills[categoryIdx] = { ...skills[categoryIdx], items };
      }
      return { ...prev, skills };
    });
  };

  const handleAddSkillItem = (categoryIdx: number) => {
    setStructured((prev) => {
      const skills = [...prev.skills];
      if (skills[categoryIdx]) {
        skills[categoryIdx] = {
          ...skills[categoryIdx],
          items: [...skills[categoryIdx].items, 'New Skill'],
        };
      }
      return { ...prev, skills };
    });
  };

  const handleRemoveSkillItem = (categoryIdx: number, itemIdx: number) => {
    setStructured((prev) => {
      const skills = [...prev.skills];
      if (skills[categoryIdx]) {
        const items = skills[categoryIdx].items.filter((_, i) => i !== itemIdx);
        skills[categoryIdx] = { ...skills[categoryIdx], items };
      }
      return { ...prev, skills };
    });
  };

  const handleProjectBulletChange = (projIdx: number, bulletIdx: number, val: string) => {
    setStructured((prev) => {
      const projects = [...prev.projects];
      if (projects[projIdx]) {
        const bulletPoints = [...projects[projIdx].bulletPoints];
        bulletPoints[bulletIdx] = val;
        projects[projIdx] = { ...projects[projIdx], bulletPoints };
      }
      return { ...prev, projects };
    });
  };

  const handleAddProjectBullet = (projIdx: number) => {
    setStructured((prev) => {
      const projects = [...prev.projects];
      if (projects[projIdx]) {
        projects[projIdx] = {
          ...projects[projIdx],
          bulletPoints: [...projects[projIdx].bulletPoints, 'Implemented...'],
        };
      }
      return { ...prev, projects };
    });
  };

  const handleRemoveProjectBullet = (projIdx: number, bulletIdx: number) => {
    setStructured((prev) => {
      const projects = [...prev.projects];
      if (projects[projIdx]) {
        const bulletPoints = projects[projIdx].bulletPoints.filter((_, i) => i !== bulletIdx);
        projects[projIdx] = { ...projects[projIdx], bulletPoints };
      }
      return { ...prev, projects };
    });
  };

  function generateMarkdownFromStructured(data: StructuredResumeData): string {
    let md = `# ${data.fullName}\n`;
    const contactParts = [
      data.title,
      data.contactInfo?.email,
      data.contactInfo?.phone,
      data.contactInfo?.location,
      data.contactInfo?.linkedin,
      data.contactInfo?.github,
    ].filter(Boolean);

    md += `${contactParts.join(' | ')}\n\n`;

    if (data.summary) {
      md += `## PROFESSIONAL SUMMARY\n${data.summary}\n\n`;
    }

    if (data.skills?.length) {
      md += `## TECHNICAL SKILLS\n`;
      data.skills.forEach((s) => {
        md += `- **${s.category}:** ${s.items.join(', ')}\n`;
      });
      md += `\n`;
    }

    if (data.projects?.length) {
      md += `## TECHNICAL PROJECTS\n`;
      data.projects.forEach((p) => {
        md += `### ${p.title}${p.roleOrSubtitle ? ` | ${p.roleOrSubtitle}` : ''}${
          p.technologies?.length ? ` (${p.technologies.join(', ')})` : ''
        }\n`;
        p.bulletPoints.forEach((b) => {
          md += `- ${b}\n`;
        });
        md += `\n`;
      });
    }

    if (data.experience?.length) {
      md += `## EXPERIENCE\n`;
      data.experience.forEach((e) => {
        md += `### ${e.role} – ${e.company}${e.duration ? ` (${e.duration})` : ''}\n`;
        e.bulletPoints.forEach((b) => {
          md += `- ${b}\n`;
        });
        md += `\n`;
      });
    }

    if (data.education?.length) {
      md += `## EDUCATION\n`;
      data.education.forEach((ed) => {
        md += `### ${ed.degree}, ${ed.institution}${ed.durationOrYear ? ` (${ed.durationOrYear})` : ''}\n`;
        if (ed.details) md += `- ${ed.details}\n`;
      });
      md += `\n`;
    }

    return md;
  }

  return (
    <div className="space-y-6">
      
      {/* Action Toolbar Header */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Left: View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center">
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                !isEditMode
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>ATS Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isEditMode
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Live Edit Resume</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            {isEditMode ? 'Editing mode active' : 'ATS 100% Parsable Format'}
          </span>
        </div>

        {/* Right: Export & Regenerate Actions */}
        <div className="flex flex-wrap items-center gap-2 justify-end">
          
          <button
            type="button"
            onClick={onEditAnswers}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Modify the answers you provided"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Edit Answers</span>
          </button>

          <button
            type="button"
            disabled={isRegenerating}
            onClick={onRegenerate}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Regenerate resume with stored answers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Copy plain text to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              printEditedResume(
                structured,
                `${(structured.fullName || 'Resume').replace(/[^a-z0-9]/gi, '_')}.pdf`
              );
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Print this resume"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Print</span>
          </button>

          <button
            type="button"
            disabled={isExportingPdf}
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Download formatted PDF resume"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            )}
            <span>{isExportingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          <button
            type="button"
            disabled={isExportingDocx}
            onClick={handleDownloadDocx}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Download formatted Microsoft Word .docx"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isExportingDocx ? 'Exporting...' : 'Download DOCX'}</span>
          </button>

        </div>

      </div>

      {/* Editor Guide Banner if Edit Mode */}
      {isEditMode && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200 animate-fade-in">
          <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            You are in <strong>Live Edit Mode</strong>. You can manually adjust bullet points, skills, and summary. All changes are reflected immediately in your ATS preview and downloads.
          </span>
        </div>
      )}

      {/* Document Canvas Container */}
      <div className="bg-slate-200/80 dark:bg-slate-950 p-4 sm:p-8 rounded-3xl flex justify-center overflow-x-auto">
        
        {/* Printable ATS Resume Card */}
        <div
          ref={printContainerRef}
          id="careerpilot-resume-doc"
          className="w-full max-w-[850px] bg-white text-slate-900 shadow-2xl rounded-xl p-8 sm:p-12 font-serif text-[13.5px] leading-relaxed border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full"
        >
          
          {/* Header */}
          <div className="text-center space-y-1.5 pb-4 border-b border-slate-300">
            {isEditMode ? (
              <input
                type="text"
                value={structured.fullName}
                onChange={(e) => setStructured((prev) => ({ ...prev, fullName: e.target.value }))}
                className="text-2xl sm:text-3xl font-extrabold text-center font-sans tracking-tight text-slate-900 border-b border-dashed border-indigo-400 focus:outline-none w-full bg-indigo-50/20"
              />
            ) : (
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                {structured.fullName || ''}
              </h1>
            )}

            <div className="text-xs text-slate-600 font-sans flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-0.5">
              {structured.title && <span className="font-semibold text-slate-800">{structured.title}</span>}
              {structured.contactInfo?.email && (
                <>
                  <span>•</span>
                  <span>{structured.contactInfo.email}</span>
                </>
              )}
              {structured.contactInfo?.phone && (
                <>
                  <span>•</span>
                  <span>{structured.contactInfo.phone}</span>
                </>
              )}
              {structured.contactInfo?.location && (
                <>
                  <span>•</span>
                  <span>{structured.contactInfo.location}</span>
                </>
              )}
              {structured.contactInfo?.linkedin && (
                <>
                  <span>•</span>
                  <span className="text-indigo-700">{structured.contactInfo.linkedin}</span>
                </>
              )}
              {structured.contactInfo?.github && (
                <>
                  <span>•</span>
                  <span className="text-indigo-700">{structured.contactInfo.github}</span>
                </>
              )}
            </div>
          </div>

          {/* Section 1: Professional Summary */}
          {structured.summary && (
            <div className="mt-5 space-y-2">
              <h2 className="text-xs font-bold tracking-wider uppercase font-sans text-indigo-900 border-b border-indigo-900/30 pb-0.5">
                Professional Summary
              </h2>
              {isEditMode ? (
                <textarea
                  rows={3}
                  value={structured.summary}
                  onChange={(e) => handleSummaryChange(e.target.value)}
                  className="w-full p-2 text-xs text-slate-800 border border-indigo-300 rounded-lg focus:outline-none font-serif leading-relaxed bg-indigo-50/20"
                />
              ) : (
                <p className="text-slate-800 leading-normal text-xs sm:text-[13px]">
                  {structured.summary}
                </p>
              )}
            </div>
          )}

          {/* Section 2: Technical Skills */}
          {structured.skills && structured.skills.length > 0 && (
            <div className="mt-5 space-y-2">
              <h2 className="text-xs font-bold tracking-wider uppercase font-sans text-indigo-900 border-b border-indigo-900/30 pb-0.5">
                Technical Skills
              </h2>
              <div className="space-y-1.5 text-xs sm:text-[13px]">
                {structured.skills.map((group, catIdx) => (
                  <div key={catIdx} className="flex flex-col sm:flex-row sm:items-baseline gap-1">
                    <span className="font-bold text-slate-900 font-sans min-w-[140px] shrink-0">
                      {group.category}:
                    </span>
                    {isEditMode ? (
                      <div className="flex-1 flex flex-wrap items-center gap-1.5">
                        {group.items.map((item, itmIdx) => (
                          <div key={itmIdx} className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => handleSkillChange(catIdx, itmIdx, e.target.value)}
                              className="text-xs text-slate-800 bg-transparent focus:outline-none w-24"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSkillItem(catIdx, itmIdx)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddSkillItem(catIdx)}
                          className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-800">{group.items.join(', ')}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Technical Projects */}
          {structured.projects && structured.projects.length > 0 && (
            <div className="mt-5 space-y-3">
              <h2 className="text-xs font-bold tracking-wider uppercase font-sans text-indigo-900 border-b border-indigo-900/30 pb-0.5">
                Technical Projects
              </h2>
              <div className="space-y-3">
                {structured.projects.map((proj, pIdx) => (
                  <div key={pIdx} className="space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 font-sans">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {proj.title}
                        </span>
                        {proj.roleOrSubtitle && (
                          <span className="text-xs text-slate-600 italic">
                            | {proj.roleOrSubtitle}
                          </span>
                        )}
                        {proj.technologies && proj.technologies.length > 0 && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            ({proj.technologies.join(', ')})
                          </span>
                        )}
                      </div>
                      {proj.link && (
                        <span className="text-xs text-indigo-700 underline font-mono">
                          {proj.link}
                        </span>
                      )}
                    </div>

                    <ul className="list-disc list-outside ml-4 space-y-1 text-xs sm:text-[13px] text-slate-800">
                      {proj.bulletPoints.map((bullet, bIdx) => (
                        <li key={bIdx} className="leading-snug">
                          {isEditMode ? (
                            <div className="flex items-start gap-1">
                              <textarea
                                rows={2}
                                value={bullet}
                                onChange={(e) => handleProjectBulletChange(pIdx, bIdx, e.target.value)}
                                className="w-full p-1 text-xs text-slate-800 border border-indigo-200 rounded focus:outline-none bg-indigo-50/10 leading-snug"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveProjectBullet(pIdx, bIdx)}
                                className="p-1 text-rose-500 hover:text-rose-700 shrink-0"
                                title="Remove bullet point"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span>{bullet}</span>
                          )}
                        </li>
                      ))}
                    </ul>

                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() => handleAddProjectBullet(pIdx)}
                        className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 font-sans mt-1"
                      >
                        <Plus className="w-3 h-3" /> Add bullet point
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Experience (if any) */}
          {structured.experience && structured.experience.length > 0 && (
            <div className="mt-5 space-y-3">
              <h2 className="text-xs font-bold tracking-wider uppercase font-sans text-indigo-900 border-b border-indigo-900/30 pb-0.5">
                Experience & Internships
              </h2>
              <div className="space-y-3">
                {structured.experience.map((exp, eIdx) => (
                  <div key={eIdx} className="space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 font-sans">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {exp.role}
                        </span>
                        <span className="text-xs text-slate-700 font-semibold">
                          – {exp.company}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 italic">
                        {exp.duration} {exp.location ? `| ${exp.location}` : ''}
                      </div>
                    </div>

                    <ul className="list-disc list-outside ml-4 space-y-1 text-xs sm:text-[13px] text-slate-800">
                      {exp.bulletPoints.map((bullet, bIdx) => (
                        <li key={bIdx} className="leading-snug">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Education */}
          {structured.education && structured.education.length > 0 && (
            <div className="mt-5 space-y-2">
              <h2 className="text-xs font-bold tracking-wider uppercase font-sans text-indigo-900 border-b border-indigo-900/30 pb-0.5">
                Education
              </h2>
              <div className="space-y-2">
                {structured.education.map((edu, edIdx) => (
                  <div key={edIdx} className="space-y-0.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 font-sans">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {edu.degree}, {edu.institution}
                      </span>
                      <span className="text-xs text-slate-500 italic">
                        {edu.durationOrYear || edu.location || ''}
                      </span>
                    </div>
                    {edu.gpaOrScore && (
                      <p className="text-xs text-slate-700 font-sans">
                        <strong>Score / GPA:</strong> {edu.gpaOrScore}
                      </p>
                    )}
                    {edu.details && (
                      <p className="text-xs text-slate-600 italic">
                        {edu.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 6: Certifications & Achievements */}
          {((structured.certifications && structured.certifications.length > 0) ||
            (structured.achievements && structured.achievements.length > 0)) && (
            <div className="mt-5 space-y-2">
              <h2 className="text-xs font-bold tracking-wider uppercase font-sans text-indigo-900 border-b border-indigo-900/30 pb-0.5">
                Certifications & Achievements
              </h2>
              <ul className="list-disc list-outside ml-4 space-y-1 text-xs sm:text-[13px] text-slate-800">
                {structured.certifications?.map((c, idx) => {
                  const certName = typeof c === 'string' ? c : c?.name || '';
                  const certIssuer = typeof c !== 'string' && c?.issuer ? ` (${c.issuer})` : '';
                  return (
                    <li key={`cert-${idx}`}>
                      <span className="font-bold font-sans">Certification:</span> {certName}{certIssuer}
                    </li>
                  );
                })}
                {structured.achievements?.map((a, idx) => (
                  <li key={`ach-${idx}`}>
                    <span className="font-bold font-sans">Achievement:</span> {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
