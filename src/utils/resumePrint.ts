import {
  ResumeVersionItem,
  StructuredResumeData,
  StructuredResumeSkills,
  StructuredResumeProject,
  StructuredResumeExperience,
  StructuredResumeEducation,
} from '../types/resume';

/**
 * Parses raw extracted resume text into clean StructuredResumeData if structured data is missing
 */
export function parseRawResumeTextToStructured(
  text: string,
  targetRole: string = 'Software Developer',
  fileName: string = 'Resume'
): StructuredResumeData {
  const lines = (text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Extract candidate name from top lines
  let fullName = 'Candidate Name';
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

  // Build Education
  const educationList = [];
  if (sectionContent.education.length > 0) {
    const eduText = sectionContent.education.slice(0, 4).join(' • ');
    educationList.push({
      institution: sectionContent.education[0] || 'University / Institution',
      degree: sectionContent.education[1] || 'Degree & Major',
      durationOrYear: sectionContent.education[2] || '',
      details: eduText.length > 50 ? eduText : undefined,
    });
  } else {
    educationList.push({
      institution: 'Engineering College / University',
      degree: `Bachelor of Engineering / Technology (${targetRole})`,
      durationOrYear: 'Graduated',
    });
  }

  return {
    fullName,
    title: targetRole,
    contactInfo: {
      email: emailMatch ? emailMatch[0] : undefined,
      phone: phoneMatch ? phoneMatch[0] : undefined,
      linkedin: linkedinMatch ? linkedinMatch[0] : undefined,
      github: githubMatch ? githubMatch[0] : undefined,
    },
    summary:
      sectionContent.summary.slice(0, 3).join(' ') ||
      `Results-oriented ${targetRole} with a strong foundation in computer science principles and software engineering practices. Dedicated to building reliable, high-performance applications.`,
    skills:
      skillItems.length > 0
        ? [
            {
              category: 'Core Competencies & Tools',
              items: skillItems.slice(0, 15),
            },
          ]
        : [
            {
              category: 'Technical Skills',
              items: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Git', 'SQL', 'REST APIs'],
            },
          ],
    projects:
      projectsList.length > 0
        ? projectsList.slice(0, 3).map((p) => ({
            title: p.title,
            roleOrSubtitle: targetRole,
            bulletPoints: p.bulletPoints.length > 0 ? p.bulletPoints : ['Implemented features using modern engineering best practices.'],
          }))
        : [
            {
              title: `${targetRole} Featured Project`,
              roleOrSubtitle: 'Lead Developer',
              bulletPoints: [
                'Designed and developed full-stack application with modular architecture.',
                'Integrated REST APIs and implemented responsive, high-performance UI components.',
              ],
            },
          ],
    education: educationList,
    certifications: sectionContent.certifications.slice(0, 3),
  };
}

/**
 * Extracts structured data from any ResumeVersionItem
 */
export function getStructuredResumeData(resume: ResumeVersionItem): StructuredResumeData {
  if (resume.improvedData?.structured) {
    return resume.improvedData.structured;
  }
  if (resume.structuredData) {
    return resume.structuredData;
  }
  return parseRawResumeTextToStructured(resume.resumeText, resume.targetRole, resume.fileName);
}

/**
 * Generates the clean, standalone HTML document string for native printing
 */
export function generateResumePrintHtml(resume: ResumeVersionItem): string {
  const structured = getStructuredResumeData(resume);
  const {
    fullName = 'Candidate Name',
    title = resume.targetRole || 'Software Developer',
    contactInfo = {},
    summary,
    skills = [],
    projects = [],
    experience = [],
    education = [],
    certifications = [],
    achievements = [],
  } = structured;

  // Build Contact Info List
  const contactParts: string[] = [];
  if (title) contactParts.push(`<strong>${escapeHtml(title)}</strong>`);
  if (contactInfo.email) contactParts.push(escapeHtml(contactInfo.email));
  if (contactInfo.phone) contactParts.push(escapeHtml(contactInfo.phone));
  if (contactInfo.location) contactParts.push(escapeHtml(contactInfo.location));
  if (contactInfo.linkedin) contactParts.push(escapeHtml(contactInfo.linkedin));
  if (contactInfo.github) contactParts.push(escapeHtml(contactInfo.github));
  if (contactInfo.portfolio) contactParts.push(escapeHtml(contactInfo.portfolio));

  const contactHtml = contactParts.join(' <span class="sep">•</span> ');

  // Professional Summary
  let summaryHtml = '';
  if (summary) {
    summaryHtml = `
      <section class="section">
        <h2 class="section-title">Professional Summary</h2>
        <p class="summary-text">${escapeHtml(summary)}</p>
      </section>
    `;
  }

  // Technical Skills
  let skillsHtml = '';
  if (skills && skills.length > 0) {
    const skillRows = skills
      .map((cat) => {
        const itemsStr = Array.isArray(cat.items) ? cat.items.join(', ') : cat.items;
        return `
          <div class="skill-row">
            <span class="skill-category">${escapeHtml(cat.category)}:</span>
            <span>${escapeHtml(itemsStr)}</span>
          </div>
        `;
      })
      .join('');

    skillsHtml = `
      <section class="section">
        <h2 class="section-title">Technical Skills</h2>
        <div class="skills-grid">
          ${skillRows}
        </div>
      </section>
    `;
  }

  // Projects
  let projectsHtml = '';
  if (projects && projects.length > 0) {
    const projectItems = projects
      .map((proj) => {
        const subtitleStr = proj.roleOrSubtitle ? ` | ${escapeHtml(proj.roleOrSubtitle)}` : '';
        const linkStr = proj.link ? `<span class="item-meta">${escapeHtml(proj.link)}</span>` : '';
        const techStr =
          proj.technologies && proj.technologies.length > 0
            ? `<div class="item-tech">Technologies: ${escapeHtml(
                Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies
              )}</div>`
            : '';

        const bulletsStr =
          proj.bulletPoints && proj.bulletPoints.length > 0
            ? `<ul class="bullets">${proj.bulletPoints
                .map((b) => `<li>${escapeHtml(b)}</li>`)
                .join('')}</ul>`
            : '';

        return `
          <div class="item-block">
            <div class="item-header">
              <div class="item-title">${escapeHtml(proj.title)}${subtitleStr}</div>
              ${linkStr}
            </div>
            ${techStr}
            ${bulletsStr}
          </div>
        `;
      })
      .join('');

    projectsHtml = `
      <section class="section">
        <h2 class="section-title">Projects</h2>
        <div class="items-container">
          ${projectItems}
        </div>
      </section>
    `;
  }

  // Experience & Internships
  let experienceHtml = '';
  if (experience && experience.length > 0) {
    const expItems = experience
      .map((exp) => {
        const metaParts = [exp.duration, exp.location].filter(Boolean).map(escapeHtml).join(' | ');
        const bulletsStr =
          exp.bulletPoints && exp.bulletPoints.length > 0
            ? `<ul class="bullets">${exp.bulletPoints
                .map((b) => `<li>${escapeHtml(b)}</li>`)
                .join('')}</ul>`
            : '';

        return `
          <div class="item-block">
            <div class="item-header">
              <div class="item-title">${escapeHtml(exp.role)} <span class="item-subtitle">– ${escapeHtml(exp.company)}</span></div>
              <div class="item-meta">${metaParts}</div>
            </div>
            ${bulletsStr}
          </div>
        `;
      })
      .join('');

    experienceHtml = `
      <section class="section">
        <h2 class="section-title">Experience & Internships</h2>
        <div class="items-container">
          ${expItems}
        </div>
      </section>
    `;
  }

  // Education
  let educationHtml = '';
  if (education && education.length > 0) {
    const eduItems = education
      .map((edu) => {
        const metaParts = [edu.durationOrYear, edu.location].filter(Boolean).map(escapeHtml).join(' | ');
        const scoreStr = edu.gpaOrScore ? ` • ${escapeHtml(edu.gpaOrScore)}` : '';
        return `
          <div class="item-block">
            <div class="item-header">
              <div class="item-title">${escapeHtml(edu.institution)}</div>
              <div class="item-meta">${metaParts}</div>
            </div>
            <div class="item-subtitle">${escapeHtml(edu.degree)}${scoreStr}</div>
          </div>
        `;
      })
      .join('');

    educationHtml = `
      <section class="section">
        <h2 class="section-title">Education</h2>
        <div class="items-container">
          ${eduItems}
        </div>
      </section>
    `;
  }

  // Certifications & Achievements
  let certsHtml = '';
  const allCerts = [...(certifications || []), ...(achievements || [])];
  if (allCerts.length > 0) {
    certsHtml = `
      <section class="section">
        <h2 class="section-title">Certifications & Achievements</h2>
        <ul class="bullets">
          ${allCerts.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
        </ul>
      </section>
    `;
  }

  const versionLabel = resume.versionLabel || `Resume_v${resume.version || 1}.pdf`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(fullName)} – Resume</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background-color: #f3f4f6;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      padding: 24px 16px;
    }

    .screen-action-bar {
      max-width: 800px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      padding: 10px 16px;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .screen-action-bar .title-text {
      font-weight: 700;
      font-size: 14px;
      color: #1f2937;
    }

    .screen-action-bar .badge {
      display: inline-block;
      margin-left: 8px;
      padding: 2px 8px;
      background: #eef2ff;
      color: #4338ca;
      font-size: 11px;
      font-weight: 600;
      border-radius: 9999px;
      border: 1px solid #c7d2fe;
    }

    .btn-group {
      display: flex;
      gap: 8px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      text-decoration: none;
    }

    .btn-primary {
      background-color: #4f46e5;
      color: #ffffff;
    }
    .btn-primary:hover {
      background-color: #4338ca;
    }

    .btn-secondary {
      background-color: #ffffff;
      color: #374151;
      border: 1px solid #d1d5db;
    }
    .btn-secondary:hover {
      background-color: #f9fafb;
    }

    .resume-document {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 36px 44px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-radius: 4px;
    }

    .resume-header {
      text-align: center;
      margin-bottom: 18px;
      padding-bottom: 12px;
      border-bottom: 2px solid #000000;
    }

    .candidate-name {
      font-size: 24px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #000000;
      margin-bottom: 4px;
    }

    .contact-line {
      font-size: 12px;
      color: #1f2937;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 4px 8px;
      font-weight: 500;
    }

    .contact-line .sep {
      color: #6b7280;
    }

    .section {
      margin-bottom: 16px;
      page-break-inside: auto;
    }

    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #000000;
      border-bottom: 1.5px solid #000000;
      padding-bottom: 2px;
      margin-bottom: 8px;
      break-after: avoid;
      page-break-after: avoid;
    }

    .summary-text {
      font-size: 11.5px;
      line-height: 1.55;
      color: #111827;
      text-align: justify;
    }

    .skills-grid {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 11.5px;
    }

    .skill-row {
      line-height: 1.45;
      color: #111827;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .skill-category {
      font-weight: 700;
      color: #000000;
    }

    .item-block {
      margin-bottom: 10px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .item-block:last-child {
      margin-bottom: 0;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 2px;
    }

    .item-title {
      font-size: 12px;
      font-weight: 700;
      color: #000000;
    }

    .item-subtitle {
      font-weight: 500;
      color: #374151;
      font-size: 11.5px;
    }

    .item-meta {
      font-size: 11px;
      font-weight: 600;
      color: #4b5563;
    }

    .item-tech {
      font-size: 11px;
      font-style: italic;
      color: #374151;
      margin-bottom: 3px;
    }

    .bullets {
      list-style-type: disc;
      margin-left: 18px;
      font-size: 11px;
      line-height: 1.5;
      color: #111827;
    }

    .bullets li {
      margin-bottom: 2px;
    }

    @media print {
      @page {
        size: auto;
        margin: 12mm 15mm 12mm 15mm;
      }

      html, body {
        background: #ffffff !important;
        color: #000000 !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .no-print, .screen-action-bar {
        display: none !important;
      }

      .resume-document {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }

      .item-block, .skill-row, .section-title, .resume-header {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <header class="screen-action-bar no-print">
    <div>
      <span class="title-text">${escapeHtml(fullName)}</span>
      <span class="badge">${escapeHtml(versionLabel)}</span>
    </div>
    <div class="btn-group">
      <button class="btn btn-primary" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Print Document
      </button>
      <button class="btn btn-secondary" onclick="window.close()">Close</button>
    </div>
  </header>

  <main class="resume-document">
    <header class="resume-header">
      <h1 class="candidate-name">${escapeHtml(fullName)}</h1>
      <div class="contact-line">
        ${contactHtml}
      </div>
    </header>

    ${summaryHtml}
    ${skillsHtml}
    ${projectsHtml}
    ${experienceHtml}
    ${educationHtml}
    ${certsHtml}
  </main>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 250);
    });
  </script>
</body>
</html>`;
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

/**
 * Opens the dedicated print page in a new browser tab for the specific resume
 * Replicating the Smart Attendance Hub report printing workflow
 */
export function openResumePrintPage(resumeOrId: ResumeVersionItem | string) {
  if (!resumeOrId) return;

  let resumeObj: ResumeVersionItem | null = null;
  let resumeId = '';

  if (typeof resumeOrId === 'string') {
    resumeId = resumeOrId;
  } else if (resumeOrId && typeof resumeOrId === 'object') {
    resumeObj = resumeOrId;
    resumeId = resumeOrId.id;
  }

  // 1. Cache the resume payload in sessionStorage and localStorage
  if (resumeObj && resumeId) {
    try {
      const payloadStr = JSON.stringify(resumeObj);
      sessionStorage.setItem('careerpilot_active_print_resume', payloadStr);
      sessionStorage.setItem(`careerpilot_print_resume_${resumeId}`, payloadStr);
      localStorage.setItem(`careerpilot_print_resume_${resumeId}`, payloadStr);
    } catch (e) {
      console.warn('[resumePrint] Storage caching notice:', e);
    }
  }

  // 2. Open dedicated print document
  // Method A: Direct HTML write for immediate, zero-lag Smart Attendance Hub behavior
  if (resumeObj) {
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const html = generateResumePrintHtml(resumeObj);
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        return;
      }
    } catch (popupErr) {
      console.warn('[resumePrint] Direct window write fallback:', popupErr);
    }
  }

  // Method B: URL Route fallback
  if (resumeId) {
    const printUrl = `/resume/print/${encodeURIComponent(resumeId)}`;
    window.open(printUrl, '_blank');
  }
}
