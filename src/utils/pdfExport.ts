import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { StructuredResumeData } from '../types/resume';

/**
 * Exports structured resume data to a professional, ATS-compliant vector PDF file.
 * Preserves candidate name, contact details, summaries, skills, projects, experience,
 * education, and certifications with strict collision prevention and dynamic pagination.
 */
/**
 * Builds the jsPDF instance for structured resume data.
 */
export function buildResumeJsPdf(resume: StructuredResumeData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter', // 612 x 792 pt
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 40;
  const marginRight = 40;
  const marginTop = 40;
  const marginBottom = 44;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let cursorY = marginTop;

  const checkPageBreak = (neededHeight: number): boolean => {
    if (cursorY + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      cursorY = marginTop;
      return true;
    }
    return false;
  };

  const addDividerLine = () => {
    doc.setDrawColor(79, 70, 229); // Brand Indigo #4F46E5
    doc.setLineWidth(0.85);
    doc.line(marginLeft, cursorY, pageWidth - marginRight, cursorY);
    cursorY += 9;
  };

  const addSectionHeader = (title: string, minSpaceNeeded = 50) => {
    // Ensure section header and at least one line of content stay together
    checkPageBreak(minSpaceNeeded);
    cursorY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 27, 75); // Dark Indigo #1E1B4B
    doc.text(title.toUpperCase(), marginLeft, cursorY);
    cursorY += 4;
    addDividerLine();
  };

  // 1. Full Name Header (Centered)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  const nameText = (resume.fullName || 'Candidate Name').trim();
  doc.text(nameText, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 15;

  // 2. Title & Contact Info (Centered, auto-wrapping if long)
  const contactParts: string[] = [];
  if (resume.title && resume.title.trim()) contactParts.push(resume.title.trim());
  if (resume.contactInfo?.email && resume.contactInfo.email.trim()) contactParts.push(resume.contactInfo.email.trim());
  if (resume.contactInfo?.phone && resume.contactInfo.phone.trim()) contactParts.push(resume.contactInfo.phone.trim());
  if (resume.contactInfo?.location && resume.contactInfo.location.trim()) contactParts.push(resume.contactInfo.location.trim());
  if (resume.contactInfo?.linkedin && resume.contactInfo.linkedin.trim()) contactParts.push(resume.contactInfo.linkedin.trim());
  if (resume.contactInfo?.github && resume.contactInfo.github.trim()) contactParts.push(resume.contactInfo.github.trim());
  if (resume.contactInfo?.portfolio && resume.contactInfo.portfolio.trim()) contactParts.push(resume.contactInfo.portfolio.trim());

  if (contactParts.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // slate-600
    const contactLine = contactParts.join('  •  ');
    const contactLines = doc.splitTextToSize(contactLine, contentWidth);
    for (const line of contactLines) {
      checkPageBreak(12);
      doc.text(line, pageWidth / 2, cursorY, { align: 'center' });
      cursorY += 11.5;
    }
  }
  cursorY += 4;

  // 3. Professional Summary
  if (resume.summary && resume.summary.trim()) {
    addSectionHeader('Professional Summary', 45);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59); // slate-800
    const summaryLines = doc.splitTextToSize(resume.summary.trim(), contentWidth);
    for (const line of summaryLines) {
      checkPageBreak(12);
      doc.text(line, marginLeft, cursorY);
      cursorY += 12;
    }
  }

  // 4. Technical Skills
  if (resume.skills && resume.skills.length > 0) {
    const validSkills = resume.skills.filter((g) => g.items && g.items.length > 0);
    if (validSkills.length > 0) {
      addSectionHeader('Technical Skills', 40);
      for (const skillGroup of validSkills) {
        const categoryLabel = `${skillGroup.category}:`;
        const itemsString = skillGroup.items.join(', ');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        const labelWidth = doc.getTextWidth(categoryLabel) + 6;

        // If category label is moderately sized, put items on same line with wrap indent
        if (labelWidth < 150) {
          const itemsLines = doc.splitTextToSize(itemsString, contentWidth - labelWidth);
          checkPageBreak(itemsLines.length * 12 + 4);
          
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(categoryLabel, marginLeft, cursorY);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
          for (let i = 0; i < itemsLines.length; i++) {
            if (i > 0) checkPageBreak(12);
            doc.text(itemsLines[i], marginLeft + labelWidth, cursorY);
            cursorY += 12;
          }
          cursorY += 1.5;
        } else {
          // Category label is very long: print label on one line, items on next line
          checkPageBreak(24);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(categoryLabel, marginLeft, cursorY);
          cursorY += 11.5;

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
          const itemsLines = doc.splitTextToSize(itemsString, contentWidth - 10);
          for (const line of itemsLines) {
            checkPageBreak(12);
            doc.text(line, marginLeft + 10, cursorY);
            cursorY += 12;
          }
          cursorY += 1.5;
        }
      }
    }
  }

  // 5. Technical Projects
  if (resume.projects && resume.projects.length > 0) {
    addSectionHeader('Technical Projects', 50);
    for (const proj of resume.projects) {
      checkPageBreak(36);
      cursorY += 3;

      // Project Title & Subtitle
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      const titleStr = proj.title || 'Project';
      const roleStr = proj.roleOrSubtitle ? ` | ${proj.roleOrSubtitle}` : '';
      const techStr = proj.technologies && proj.technologies.length > 0 ? ` (${proj.technologies.join(', ')})` : '';

      // Check if project link exists
      const linkStr = proj.link ? proj.link.trim() : '';

      if (linkStr) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const linkWidth = doc.getTextWidth(linkStr);

        // If link fits on right side without overlapping title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        const titleWidth = doc.getTextWidth(titleStr + roleStr);

        if (titleWidth + linkWidth + 20 < contentWidth) {
          doc.text(titleStr, marginLeft, cursorY);
          if (roleStr) {
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(71, 85, 105);
            doc.text(roleStr, marginLeft + doc.getTextWidth(titleStr), cursorY);
          }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(79, 70, 229); // indigo
          doc.text(linkStr, pageWidth - marginRight, cursorY, { align: 'right' });
          cursorY += 12;

          if (techStr) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(100, 116, 139);
            const techLines = doc.splitTextToSize(techStr, contentWidth);
            for (const tLine of techLines) {
              checkPageBreak(11.5);
              doc.text(tLine, marginLeft, cursorY);
              cursorY += 11.5;
            }
          }
        } else {
          // Wrap title and put link on separate line
          const fullTitleLine = titleStr + roleStr + techStr;
          const fullTitleLines = doc.splitTextToSize(fullTitleLine, contentWidth);
          for (const tLine of fullTitleLines) {
            checkPageBreak(12);
            doc.text(tLine, marginLeft, cursorY);
            cursorY += 12;
          }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(79, 70, 229);
          const linkLines = doc.splitTextToSize(linkStr, contentWidth);
          for (const lLine of linkLines) {
            checkPageBreak(11.5);
            doc.text(lLine, marginLeft, cursorY);
            cursorY += 11.5;
          }
        }
      } else {
        // No link: format title, role, tech nicely
        const fullTitle = titleStr + roleStr + techStr;
        const titleLines = doc.splitTextToSize(fullTitle, contentWidth);
        for (const tLine of titleLines) {
          checkPageBreak(12);
          doc.text(tLine, marginLeft, cursorY);
          cursorY += 12;
        }
      }

      cursorY += 1;

      // Project Bullet Points
      if (Array.isArray(proj.bulletPoints) && proj.bulletPoints.length > 0) {
        for (const bullet of proj.bulletPoints) {
          if (!bullet || !bullet.trim()) continue;
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59);

          const bulletLines = doc.splitTextToSize(bullet.trim(), contentWidth - 16);
          checkPageBreak(bulletLines.length * 12 + 3);

          // Bullet dot
          doc.text('•', marginLeft + 4, cursorY);

          for (let i = 0; i < bulletLines.length; i++) {
            if (i > 0) checkPageBreak(12);
            doc.text(bulletLines[i], marginLeft + 14, cursorY);
            cursorY += 12;
          }
          cursorY += 2;
        }
      }
      cursorY += 3;
    }
  }

  // 6. Experience & Internships
  if (resume.experience && resume.experience.length > 0) {
    addSectionHeader('Experience & Internships', 50);
    for (const exp of resume.experience) {
      checkPageBreak(36);
      cursorY += 3;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      const roleCompany = `${exp.role || 'Role'} – ${exp.company || 'Company'}`;
      const meta = [exp.duration, exp.location].filter(Boolean).join(' | ');

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      const metaWidth = meta ? doc.getTextWidth(meta) : 0;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const roleWidth = doc.getTextWidth(roleCompany);

      if (meta && roleWidth + metaWidth + 20 < contentWidth) {
        doc.text(roleCompany, marginLeft, cursorY);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(meta, pageWidth - marginRight, cursorY, { align: 'right' });
        cursorY += 12.5;
      } else {
        const roleLines = doc.splitTextToSize(roleCompany, contentWidth);
        for (const rLine of roleLines) {
          checkPageBreak(12);
          doc.text(rLine, marginLeft, cursorY);
          cursorY += 12;
        }
        if (meta) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          doc.text(meta, marginLeft, cursorY);
          cursorY += 11.5;
        }
      }

      if (Array.isArray(exp.bulletPoints) && exp.bulletPoints.length > 0) {
        for (const bullet of exp.bulletPoints) {
          if (!bullet || !bullet.trim()) continue;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59);

          const bulletLines = doc.splitTextToSize(bullet.trim(), contentWidth - 16);
          checkPageBreak(bulletLines.length * 12 + 3);

          doc.text('•', marginLeft + 4, cursorY);

          for (let i = 0; i < bulletLines.length; i++) {
            if (i > 0) checkPageBreak(12);
            doc.text(bulletLines[i], marginLeft + 14, cursorY);
            cursorY += 12;
          }
          cursorY += 2;
        }
      }
      cursorY += 3;
    }
  }

  // 7. Education
  if (resume.education && resume.education.length > 0) {
    addSectionHeader('Education', 45);
    for (const edu of resume.education) {
      checkPageBreak(30);
      cursorY += 3;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      const eduTitle = `${edu.degree || 'Degree'}, ${edu.institution || 'Institution'}`;
      const meta = [edu.durationOrYear, edu.location].filter(Boolean).join(' | ');

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      const metaWidth = meta ? doc.getTextWidth(meta) : 0;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const titleWidth = doc.getTextWidth(eduTitle);

      if (meta && titleWidth + metaWidth + 20 < contentWidth) {
        doc.text(eduTitle, marginLeft, cursorY);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(meta, pageWidth - marginRight, cursorY, { align: 'right' });
        cursorY += 12.5;
      } else {
        const eduLines = doc.splitTextToSize(eduTitle, contentWidth);
        for (const eLine of eduLines) {
          checkPageBreak(12);
          doc.text(eLine, marginLeft, cursorY);
          cursorY += 12;
        }
        if (meta) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          doc.text(meta, marginLeft, cursorY);
          cursorY += 11.5;
        }
      }

      if (edu.gpaOrScore && edu.gpaOrScore.trim()) {
        checkPageBreak(12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text('Score / GPA: ', marginLeft + 4, cursorY);
        const prefixWidth = doc.getTextWidth('Score / GPA: ');
        doc.setFont('helvetica', 'normal');
        doc.text(edu.gpaOrScore.trim(), marginLeft + 4 + prefixWidth, cursorY);
        cursorY += 11.5;
      }

      if (edu.details && edu.details.trim()) {
        const detailLines = doc.splitTextToSize(edu.details.trim(), contentWidth - 16);
        checkPageBreak(detailLines.length * 11.5 + 2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text('•', marginLeft + 4, cursorY);
        for (let i = 0; i < detailLines.length; i++) {
          if (i > 0) checkPageBreak(11.5);
          doc.text(detailLines[i], marginLeft + 14, cursorY);
          cursorY += 11.5;
        }
        cursorY += 2;
      }
      cursorY += 2;
    }
  }

  // 8. Certifications & Achievements
  const hasCerts = resume.certifications && resume.certifications.length > 0;
  const hasAchs = resume.achievements && resume.achievements.length > 0;

  if (hasCerts || hasAchs) {
    addSectionHeader('Certifications & Achievements', 40);
    if (hasCerts && resume.certifications) {
      for (const certItem of resume.certifications) {
        if (!certItem) continue;
        let certText = '';
        if (typeof certItem === 'string') {
          certText = certItem.trim();
        } else if (certItem && typeof certItem === 'object') {
          const parts = [certItem.name];
          if (certItem.issuer) parts.push(certItem.issuer);
          if (certItem.date) parts.push(certItem.date);
          certText = parts.filter(Boolean).join(' – ');
        }

        if (!certText) continue;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        const certLines = doc.splitTextToSize(certText, contentWidth - 16);
        checkPageBreak(certLines.length * 12 + 3);

        doc.text('•', marginLeft + 4, cursorY);
        for (let i = 0; i < certLines.length; i++) {
          if (i > 0) checkPageBreak(12);
          doc.text(certLines[i], marginLeft + 14, cursorY);
          cursorY += 12;
        }
        cursorY += 2;
      }
    }

    if (hasAchs && resume.achievements) {
      for (const ach of resume.achievements) {
        if (!ach || !ach.trim()) continue;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        const achLines = doc.splitTextToSize(ach.trim(), contentWidth - 16);
        checkPageBreak(achLines.length * 12 + 3);

        doc.text('•', marginLeft + 4, cursorY);
        for (let i = 0; i < achLines.length; i++) {
          if (i > 0) checkPageBreak(12);
          doc.text(achLines[i], marginLeft + 14, cursorY);
          cursorY += 12;
        }
        cursorY += 2;
      }
    }
  }

  // 9. Add Multi-Page Numbering if more than 1 page
  const totalPages = doc.getNumberOfPages();
  if (totalPages > 1) {
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        `Page ${p} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 20,
        { align: 'center' }
      );
    }
  }

  return doc;
}

/**
 * Generates a Blob representing the PDF for direct viewing or canvas rendering.
 */
export async function generateResumePdfBlob(
  resume: StructuredResumeData
): Promise<Blob> {
  const doc = buildResumeJsPdf(resume);
  return doc.output('blob');
}

/**
 * Exports structured resume data to a professional, ATS-compliant vector PDF file and triggers a browser download.
 */
export async function exportResumeToPdf(
  resume: StructuredResumeData,
  filename = 'CareerPilot_Resume.pdf'
): Promise<void> {
  const doc = buildResumeJsPdf(resume);
  const pdfBlob = doc.output('blob');
  saveAs(pdfBlob, filename);
}

