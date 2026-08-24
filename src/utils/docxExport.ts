import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import { StructuredResumeData } from '../types/resume';

export async function exportResumeToDocx(
  resume: StructuredResumeData,
  filename = 'CareerPilot_ATS_Resume.docx'
): Promise<void> {
  const children: Paragraph[] = [];

  // 1. Full Name Header
  children.push(
    new Paragraph({
      text: resume.fullName || 'Candidate Name',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  // 2. Title & Contact Info
  const contactParts: string[] = [];
  if (resume.title) contactParts.push(resume.title);
  if (resume.contactInfo?.email) contactParts.push(resume.contactInfo.email);
  if (resume.contactInfo?.phone) contactParts.push(resume.contactInfo.phone);
  if (resume.contactInfo?.location) contactParts.push(resume.contactInfo.location);
  if (resume.contactInfo?.linkedin) contactParts.push(resume.contactInfo.linkedin);
  if (resume.contactInfo?.github) contactParts.push(resume.contactInfo.github);
  if (resume.contactInfo?.portfolio) contactParts.push(resume.contactInfo.portfolio);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        text: contactParts.join('  •  '),
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  const addSectionHeader = (title: string) => {
    children.push(
      new Paragraph({
        text: title.toUpperCase(),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 100 },
        border: {
          bottom: {
            color: '4F46E5',
            space: 4,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
      })
    );
  };

  // 3. Professional Summary
  if (resume.summary) {
    addSectionHeader('Professional Summary');
    children.push(
      new Paragraph({
        text: resume.summary,
        spacing: { after: 150 },
      })
    );
  }

  // 4. Technical Skills
  if (resume.skills && resume.skills.length > 0) {
    addSectionHeader('Technical Skills');
    for (const skillGroup of resume.skills) {
      if (skillGroup.items && skillGroup.items.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${skillGroup.category}: `,
                bold: true,
              }),
              new TextRun({
                text: skillGroup.items.join(', '),
              }),
            ],
            spacing: { after: 80 },
          })
        );
      }
    }
  }

  // 5. Featured Projects
  if (resume.projects && resume.projects.length > 0) {
    addSectionHeader('Technical Projects');
    for (const proj of resume.projects) {
      const projHeaderRuns = [
        new TextRun({ text: proj.title, bold: true }),
      ];
      if (proj.roleOrSubtitle) {
        projHeaderRuns.push(new TextRun({ text: ` | ${proj.roleOrSubtitle}`, italics: true }));
      }
      if (proj.technologies && proj.technologies.length > 0) {
        projHeaderRuns.push(new TextRun({ text: ` (${proj.technologies.join(', ')})`, color: '4B5563' }));
      }
      if (proj.link) {
        projHeaderRuns.push(new TextRun({ text: ` [${proj.link}]`, color: '4F46E5' }));
      }

      children.push(
        new Paragraph({
          children: projHeaderRuns,
          spacing: { before: 100, after: 60 },
        })
      );

      if (Array.isArray(proj.bulletPoints)) {
        for (const bullet of proj.bulletPoints) {
          children.push(
            new Paragraph({
              text: bullet,
              bullet: { level: 0 },
              spacing: { after: 40 },
            })
          );
        }
      }
    }
  }

  // 6. Experience (if present)
  if (resume.experience && resume.experience.length > 0) {
    addSectionHeader('Experience & Internships');
    for (const exp of resume.experience) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.role} – ${exp.company}`, bold: true }),
            new TextRun({
              text: exp.duration ? `   (${exp.duration}${exp.location ? `, ${exp.location}` : ''})` : '',
              italics: true,
            }),
          ],
          spacing: { before: 100, after: 60 },
        })
      );

      if (Array.isArray(exp.bulletPoints)) {
        for (const bullet of exp.bulletPoints) {
          children.push(
            new Paragraph({
              text: bullet,
              bullet: { level: 0 },
              spacing: { after: 40 },
            })
          );
        }
      }
    }
  }

  // 7. Education
  if (resume.education && resume.education.length > 0) {
    addSectionHeader('Education');
    for (const edu of resume.education) {
      const eduHeaderRuns = [
        new TextRun({ text: `${edu.degree}, ${edu.institution}`, bold: true }),
      ];
      if (edu.durationOrYear) {
        eduHeaderRuns.push(new TextRun({ text: ` (${edu.durationOrYear})`, italics: true }));
      }
      if (edu.gpaOrScore) {
        eduHeaderRuns.push(new TextRun({ text: ` | GPA / Score: ${edu.gpaOrScore}` }));
      }

      children.push(
        new Paragraph({
          children: eduHeaderRuns,
          spacing: { before: 80, after: 40 },
        })
      );

      if (edu.details) {
        children.push(
          new Paragraph({
            text: edu.details,
            bullet: { level: 0 },
            spacing: { after: 40 },
          })
        );
      }
    }
  }

  // 8. Certifications & Achievements
  if (
    (resume.certifications && resume.certifications.length > 0) ||
    (resume.achievements && resume.achievements.length > 0)
  ) {
    addSectionHeader('Certifications & Achievements');
    if (resume.certifications) {
      for (const cert of resume.certifications) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Certification: ', bold: true }),
              new TextRun({ text: cert }),
            ],
            bullet: { level: 0 },
            spacing: { after: 40 },
          })
        );
      }
    }
    if (resume.achievements) {
      for (const ach of resume.achievements) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Achievement: ', bold: true }),
              new TextRun({ text: ach }),
            ],
            bullet: { level: 0 },
            spacing: { after: 40 },
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}
