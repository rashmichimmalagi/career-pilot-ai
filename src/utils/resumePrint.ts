import {
  ResumeVersionItem,
  StructuredResumeData,
  StructuredResumeSkills,
  StructuredResumeProject,
  StructuredResumeExperience,
  StructuredResumeEducation,
} from '../types/resume';
import { resumeService } from '../services/resumeService';

/**
 * Parses raw extracted resume text into clean StructuredResumeData without any fake placeholder content
 */
export function parseRawResumeTextToStructured(
  text: string,
  targetRole: string = '',
  fileName: string = 'Resume'
): StructuredResumeData {
  const lines = (text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Extract candidate name from top lines if present
  let fullName = '';
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const candidate = lines[i].replace(/[^a-zA-Z\s.-]/g, '').trim();
    if (
      candidate &&
      candidate.length >= 2 &&
      candidate.length <= 40 &&
      !candidate.toLowerCase().includes('resume') &&
      !candidate.toLowerCase().includes('curriculum') &&
      !candidate.toLowerCase().includes('page') &&
      !candidate.includes('@')
    ) {
      fullName = candidate;
      break;
    }
  }

  // Extract contact info via regex
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = text.match(/github\.com\/[a-zA-Z0-9_-]+/i);

  // Extract sections by keywords
  let currentSection = 'summary';
  const sectionContent: Record<string, string[]> = {
    summary: [],
    skills: [],
    projects: [],
    experience: [],
    education: [],
    certifications: [],
  };

  const sectionKeywords: Record<string, string[]> = {
    skills: ['technical skills', 'skills', 'technologies', 'proficiencies', 'competencies'],
    projects: ['projects', 'academic projects', 'technical projects', 'key projects'],
    experience: ['experience', 'work experience', 'internship', 'internships', 'employment history'],
    education: ['education', 'academic background', 'qualifications', 'academics'],
    certifications: ['certifications', 'achievements', 'awards', 'honors', 'courses'],
    summary: ['summary', 'professional summary', 'career objective', 'profile', 'about me'],
  };

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    let isHeader = false;

    for (const [sec, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some((kw) => lowerLine === kw || lowerLine === `${kw}:` || (line.length < 35 && lowerLine.startsWith(kw)))) {
        currentSection = sec;
        isHeader = true;
        break;
      }
    }

    if (!isHeader && currentSection) {
      sectionContent[currentSection].push(line);
    }
  }

  // Build Skills list
  const skillItems: string[] = [];
  sectionContent.skills.forEach((l) => {
    l.split(/[,|•;•*]/).forEach((part) => {
      const trimmed = part.trim().replace(/^[-*•]\s*/, '');
      if (trimmed.length > 1 && trimmed.length < 35) {
        skillItems.push(trimmed);
      }
    });
  });

  // Build Projects
  const projectsList = [];
  let currentProject: { title: string; bulletPoints: string[] } | null = null;

  for (const pLine of sectionContent.projects) {
    const isBullet = pLine.startsWith('•') || pLine.startsWith('-') || pLine.startsWith('*');
    if (isBullet && currentProject) {
      currentProject.bulletPoints.push(pLine.replace(/^[-*•]\s*/, '').trim());
    } else if (pLine.length < 60 && !isBullet) {
      if (currentProject && currentProject.bulletPoints.length > 0) {
        projectsList.push(currentProject);
      }
      currentProject = {
        title: pLine.replace(/^[-*•]\s*/, '').trim(),
        bulletPoints: [],
      };
    } else if (currentProject) {
      currentProject.bulletPoints.push(pLine);
    }
  }
  if (currentProject && (currentProject.bulletPoints.length > 0 || currentProject.title)) {
    projectsList.push(currentProject);
  }

  // Build Education without fake defaults
  const educationList: StructuredResumeEducation[] = [];
  if (sectionContent.education.length > 0) {
    const eduText = sectionContent.education.slice(0, 4).join(' • ');
    educationList.push({
      institution: sectionContent.education[0] || '',
      degree: sectionContent.education[1] || '',
      durationOrYear: sectionContent.education[2] || '',
      details: eduText.length > 50 ? eduText : undefined,
    });
  }

  return {
    fullName,
    title: targetRole || '',
    contactInfo: {
      email: emailMatch ? emailMatch[0] : undefined,
      phone: phoneMatch ? phoneMatch[0] : undefined,
      linkedin: linkedinMatch ? linkedinMatch[0] : undefined,
      github: githubMatch ? githubMatch[0] : undefined,
    },
    summary: sectionContent.summary.slice(0, 3).join(' ') || '',
    skills:
      skillItems.length > 0
        ? [
            {
              category: 'Technical Skills',
              items: skillItems.slice(0, 20),
            },
          ]
        : [],
    projects:
      projectsList.length > 0
        ? projectsList.slice(0, 5).map((p) => ({
            title: p.title,
            roleOrSubtitle: targetRole,
            bulletPoints: p.bulletPoints.length > 0 ? p.bulletPoints : [],
          }))
        : [],
    education: educationList,
    certifications: sectionContent.certifications.slice(0, 5),
  };
}

/**
 * Extracts structured data from any ResumeVersionItem without fake placeholder strings
 */
export function getStructuredResumeData(resume: ResumeVersionItem): StructuredResumeData {
  if (resume.improvedData?.structured) {
    return resume.improvedData.structured;
  }
  if (resume.structuredData) {
    return resume.structuredData;
  }
  return parseRawResumeTextToStructured(resume.resumeText || '', resume.targetRole, resume.fileName);
}

/**
 * Directly prints a PDF Blob or URL via native browser print dialog
 */
export async function printPdfBlobOrUrl(pdfBlobOrUrl: Blob | string, title: string = 'Resume'): Promise<void> {
  let objectUrl = '';
  let url = '';

  if (typeof pdfBlobOrUrl === 'string') {
    url = pdfBlobOrUrl;
  } else if (pdfBlobOrUrl instanceof Blob) {
    objectUrl = URL.createObjectURL(pdfBlobOrUrl);
    url = objectUrl;
  }

  if (!url) {
    alert('No active resume available for printing.');
    return;
  }

  // Strategy A: Create hidden iframe to print PDF natively
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = url;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            try {
              document.body.removeChild(iframe);
            } catch (_) {}
            if (objectUrl) URL.revokeObjectURL(objectUrl);
          }, 60000);
        } catch (iframeErr) {
          console.warn('[resumePrint] Iframe print cross-origin fallback:', iframeErr);
          // Fallback: Open dedicated tab for native PDF print
          const win = window.open(url, '_blank');
          if (win) {
            win.onload = () => {
              win.focus();
              win.print();
            };
          }
        }
      }, 400);
    };
    return;
  } catch (err) {
    console.warn('[resumePrint] Iframe creation notice:', err);
  }

  // Strategy B: Open in new window/tab for native print
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }
}

/**
 * Main print function for resumes:
 * 1. For Original Uploaded Resumes: prints the EXACT uploaded PDF byte-for-byte.
 * 2. For AI-Improved / Live-Editor Resumes: exports and prints the exact vector PDF document.
 * 3. Never renders fake placeholder templates ("CANDIDATE NAME", "Engineering College", etc.).
 */
export async function printResumeDocument(resume: ResumeVersionItem | null | undefined): Promise<void> {
  if (!resume) {
    alert('No active resume available for printing.');
    return;
  }

  const docTitle = resume.fileName || resume.versionLabel || `Resume_v${resume.version || 1}.pdf`;

  // A. AI-generated / Improved Resume or Live Editor Resume: Generate vector PDF from actual structured data
  if (resume.isAiImproved || resume.resumeType === 'ai_generated') {
    try {
      let structured = resume.improvedData?.structured || resume.structuredData;
      if (!structured && resume.resumeText && resume.resumeText.trim()) {
        structured = resumeService.parseResumeTextToStructured(resume.resumeText, resume.targetRole);
      }
      if (structured) {
        const { generateResumePdfBlob } = await import('./pdfExport');
        const pdfBlob = await generateResumePdfBlob(structured);
        if (pdfBlob && pdfBlob.size > 0) {
          await printPdfBlobOrUrl(pdfBlob, docTitle);
          return;
        }
      }
    } catch (genErr) {
      console.warn('[resumePrint] AI Resume PDF generation notice:', genErr);
    }
  }

  // B. Original Uploaded Resume: Retrieve exact binary PDF blob or signed URL
  try {
    const blob = await resumeService.getResumeFileBlob(resume);
    if (blob && blob.size > 0) {
      await printPdfBlobOrUrl(blob, docTitle);
      return;
    }

    const url = await resumeService.getResumeFileBlobOrUrl(resume);
    if (url) {
      await printPdfBlobOrUrl(url, docTitle);
      return;
    }
  } catch (err) {
    console.error('[resumePrint] Error retrieving original PDF for print:', err);
  }

  alert('No active resume available for printing.');
}

/**
 * Prints the currently edited resume in Live Editor
 */
export async function printEditedResume(
  structuredData: StructuredResumeData,
  fileName: string = 'Edited_Resume.pdf'
): Promise<void> {
  if (!structuredData) {
    alert('No active resume available for printing.');
    return;
  }

  try {
    const { generateResumePdfBlob } = await import('./pdfExport');
    const pdfBlob = await generateResumePdfBlob(structuredData);
    if (pdfBlob && pdfBlob.size > 0) {
      await printPdfBlobOrUrl(pdfBlob, fileName);
      return;
    }
  } catch (err) {
    console.error('[resumePrint] Error generating edited resume PDF for print:', err);
  }

  alert('Unable to print edited resume.');
}

/**
 * Legacy openResumePrintPage adapter ensuring exact PDF printing or route handling
 */
export function openResumePrintPage(resumeOrId: ResumeVersionItem | string | null | undefined) {
  if (!resumeOrId) {
    alert('No active resume available for printing.');
    return;
  }

  if (typeof resumeOrId === 'object') {
    printResumeDocument(resumeOrId);
    return;
  }

  if (typeof resumeOrId === 'string') {
    const printUrl = `/resume/print/${encodeURIComponent(resumeOrId)}`;
    window.open(printUrl, '_blank');
  }
}

function escapeHtml(str?: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
