import React from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  ExternalLink,
  Award,
  BookOpen,
  Briefcase,
  Layers,
  Sparkles,
} from 'lucide-react';
import { StructuredResumeData, ResumeTemplateType } from '../../types/resume';

interface ResumeTemplateProps {
  data: StructuredResumeData;
  templateId?: ResumeTemplateType;
  zoom?: number;
}

export const ResumeTemplateViewer: React.FC<ResumeTemplateProps> = ({
  data,
  templateId = 'modern',
  zoom = 1,
}) => {
  const currentTemplate = data.templateId || templateId || 'modern';

  switch (currentTemplate) {
    case 'classic':
      return <ClassicTemplate data={data} zoom={zoom} />;
    case 'minimal':
      return <MinimalTemplate data={data} zoom={zoom} />;
    case 'executive':
      return <ExecutiveTemplate data={data} zoom={zoom} />;
    case 'modern':
    default:
      return <ModernTemplate data={data} zoom={zoom} />;
  }
};

/**
 * Modern Template
 * High-impact contemporary layout, refined typography, indigo accents, clean hierarchy
 */
const ModernTemplate: React.FC<{ data: StructuredResumeData; zoom: number }> = ({ data, zoom }) => {
  return (
    <div
      className="bg-white text-slate-900 shadow-xl rounded-xl p-8 sm:p-12 mx-auto max-w-[850px] min-h-[1050px] font-sans border border-slate-200 transition-transform origin-top"
      style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
    >
      {/* Header */}
      <header className="border-b-2 border-indigo-600 pb-5 mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
          {data.fullName || 'Candidate Name'}
        </h1>
        {data.title && (
          <p className="text-sm font-semibold text-indigo-600 mt-1 uppercase tracking-wider">
            {data.title}
          </p>
        )}

        {/* Contact Info */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-600">
          {data.contactInfo?.email && (
            <span className="inline-flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              <span>{data.contactInfo.email}</span>
            </span>
          )}
          {data.contactInfo?.phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-indigo-500" />
              <span>{data.contactInfo.phone}</span>
            </span>
          )}
          {data.contactInfo?.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              <span>{data.contactInfo.location}</span>
            </span>
          )}
          {data.contactInfo?.linkedin && (
            <span className="inline-flex items-center gap-1">
              <Linkedin className="w-3.5 h-3.5 text-indigo-500" />
              <span>{data.contactInfo.linkedin}</span>
            </span>
          )}
          {data.contactInfo?.github && (
            <span className="inline-flex items-center gap-1">
              <Github className="w-3.5 h-3.5 text-indigo-500" />
              <span>{data.contactInfo.github}</span>
            </span>
          )}
          {data.contactInfo?.portfolio && (
            <span className="inline-flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>{data.contactInfo.portfolio}</span>
            </span>
          )}
        </div>
      </header>

      <div className="space-y-6">
        {/* Professional Summary */}
        {data.summary && data.summary.trim() && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-200 pb-1 mb-2">
              Professional Summary
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
              {data.summary}
            </p>
          </section>
        )}

        {/* Technical Skills */}
        {data.skills && data.skills.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-200 pb-1 mb-2.5">
              Technical Skills
            </h2>
            <div className="space-y-1.5 text-xs sm:text-sm">
              {data.skills.map((skillGroup, idx) => (
                <div key={skillGroup.id || idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1">
                  <span className="font-bold text-slate-800 min-w-[140px] shrink-0">
                    {skillGroup.category}:
                  </span>
                  <span className="text-slate-600">
                    {skillGroup.items.join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Professional Experience */}
        {data.experience && data.experience.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-200 pb-1 mb-3">
              Work Experience
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp, idx) => (
                <div key={exp.id || idx} className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <div className="font-bold text-xs sm:text-sm text-slate-900">
                      {exp.role} <span className="font-semibold text-indigo-600">| {exp.company}</span>
                      {exp.location && <span className="text-slate-500 font-normal text-xs"> ({exp.location})</span>}
                    </div>
                    <span className="text-xs font-medium text-slate-500 shrink-0">
                      {exp.duration || (exp.startDate && exp.endDate ? `${exp.startDate} – ${exp.endDate}` : exp.startDate)}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="text-xs text-slate-600 italic">{exp.description}</p>
                  )}
                  {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                    <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700 leading-relaxed">
                      {exp.bulletPoints.map((bp, bIdx) => (
                        <li key={bIdx}>{bp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Technical Projects */}
        {data.projects && data.projects.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-200 pb-1 mb-3">
              Key Projects
            </h2>
            <div className="space-y-4">
              {data.projects.map((proj, idx) => (
                <div key={proj.id || idx} className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <div className="font-bold text-xs sm:text-sm text-slate-900">
                      {proj.title}
                      {proj.roleOrSubtitle && (
                        <span className="text-slate-600 font-medium"> | {proj.roleOrSubtitle}</span>
                      )}
                      {proj.technologies && proj.technologies.length > 0 && (
                        <span className="text-indigo-600 font-normal text-xs"> ({proj.technologies.join(', ')})</span>
                      )}
                    </div>
                    {(proj.link || proj.githubUrl) && (
                      <div className="flex items-center gap-2 text-xs text-indigo-600">
                        {proj.link && (
                          <span className="inline-flex items-center gap-0.5">
                            <ExternalLink className="w-3 h-3" />
                            <span>Link</span>
                          </span>
                        )}
                        {proj.githubUrl && (
                          <span className="inline-flex items-center gap-0.5">
                            <Github className="w-3 h-3" />
                            <span>Code</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {proj.description && (
                    <p className="text-xs text-slate-600 italic">{proj.description}</p>
                  )}
                  {proj.bulletPoints && proj.bulletPoints.length > 0 && (
                    <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700 leading-relaxed">
                      {proj.bulletPoints.map((bp, bIdx) => (
                        <li key={bIdx}>{bp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-200 pb-1 mb-2.5">
              Education
            </h2>
            <div className="space-y-3">
              {data.education.map((edu, idx) => (
                <div key={edu.id || idx} className="space-y-0.5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <div className="font-bold text-xs sm:text-sm text-slate-900">
                      {edu.degree}
                      {edu.field && <span className="font-medium text-slate-700"> in {edu.field}</span>}
                      <span className="text-indigo-700 font-semibold">, {edu.institution}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-500 shrink-0">
                      {edu.durationOrYear || (edu.startDate && edu.endDate ? `${edu.startDate} – ${edu.endDate}` : edu.startDate)}
                    </span>
                  </div>
                  {edu.gpaOrScore && (
                    <p className="text-xs text-slate-600 font-medium">GPA / Score: {edu.gpaOrScore}</p>
                  )}
                  {edu.details && (
                    <p className="text-xs text-slate-600 leading-relaxed">{edu.details}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-200 pb-1 mb-2">
              Certifications & Credentials
            </h2>
            <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700">
              {data.certifications.map((cert, idx) => {
                if (typeof cert === 'string') {
                  return <li key={idx}>{cert}</li>;
                }
                return (
                  <li key={cert.id || idx}>
                    <span className="font-semibold text-slate-800">{cert.name}</span>
                    {cert.issuer && <span className="text-slate-600"> – {cert.issuer}</span>}
                    {cert.date && <span className="text-slate-500"> ({cert.date})</span>}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

/**
 * Classic Template
 * Timeless formal serif layout, centered elegance, crisp horizontal lines
 */
const ClassicTemplate: React.FC<{ data: StructuredResumeData; zoom: number }> = ({ data, zoom }) => {
  return (
    <div
      className="bg-white text-slate-900 shadow-xl rounded-xl p-8 sm:p-12 mx-auto max-w-[850px] min-h-[1050px] font-serif border border-slate-200 transition-transform origin-top"
      style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
    >
      {/* Header */}
      <header className="border-b border-slate-800 pb-4 mb-5 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-slate-900">
          {data.fullName || 'Candidate Name'}
        </h1>
        {data.title && (
          <p className="text-sm font-medium text-slate-700 italic mt-0.5 font-sans">
            {data.title}
          </p>
        )}

        {/* Contact Info */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-600 font-sans">
          {data.contactInfo?.email && <span>{data.contactInfo.email}</span>}
          {data.contactInfo?.phone && <span>• {data.contactInfo.phone}</span>}
          {data.contactInfo?.location && <span>• {data.contactInfo.location}</span>}
          {data.contactInfo?.linkedin && <span>• {data.contactInfo.linkedin}</span>}
          {data.contactInfo?.github && <span>• {data.contactInfo.github}</span>}
        </div>
      </header>

      <div className="space-y-5">
        {/* Professional Summary */}
        {data.summary && data.summary.trim() && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5 mb-2 font-sans">
              Summary
            </h2>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed text-justify">
              {data.summary}
            </p>
          </section>
        )}

        {/* Technical Skills */}
        {data.skills && data.skills.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5 mb-2 font-sans">
              Areas of Expertise
            </h2>
            <div className="space-y-1 text-xs sm:text-sm font-sans">
              {data.skills.map((s, idx) => (
                <div key={s.id || idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1">
                  <span className="font-bold text-slate-900 min-w-[130px] shrink-0">
                    {s.category}:
                  </span>
                  <span className="text-slate-700">{s.items.join(', ')}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Work Experience */}
        {data.experience && data.experience.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5 mb-2.5 font-sans">
              Professional Experience
            </h2>
            <div className="space-y-3.5">
              {data.experience.map((exp, idx) => (
                <div key={exp.id || idx} className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs sm:text-sm font-sans">
                    <span className="font-bold text-slate-900">
                      {exp.role}, <span className="italic font-serif">{exp.company}</span>
                    </span>
                    <span className="text-xs text-slate-600 font-sans">
                      {exp.duration || (exp.startDate && exp.endDate ? `${exp.startDate} – ${exp.endDate}` : exp.startDate)}
                    </span>
                  </div>
                  {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                    <ul className="list-disc list-outside pl-4 space-y-0.5 text-xs text-slate-800 leading-relaxed font-sans">
                      {exp.bulletPoints.map((bp, bIdx) => (
                        <li key={bIdx}>{bp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Key Projects */}
        {data.projects && data.projects.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5 mb-2.5 font-sans">
              Selected Projects
            </h2>
            <div className="space-y-3.5">
              {data.projects.map((proj, idx) => (
                <div key={proj.id || idx} className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs sm:text-sm font-sans">
                    <span className="font-bold text-slate-900">
                      {proj.title} {proj.roleOrSubtitle && <span className="font-normal italic">({proj.roleOrSubtitle})</span>}
                    </span>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <span className="text-xs text-slate-600">{proj.technologies.join(', ')}</span>
                    )}
                  </div>
                  {proj.bulletPoints && proj.bulletPoints.length > 0 && (
                    <ul className="list-disc list-outside pl-4 space-y-0.5 text-xs text-slate-800 leading-relaxed font-sans">
                      {proj.bulletPoints.map((bp, bIdx) => (
                        <li key={bIdx}>{bp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5 mb-2 font-sans">
              Education
            </h2>
            <div className="space-y-2 font-sans">
              {data.education.map((edu, idx) => (
                <div key={edu.id || idx} className="flex justify-between items-baseline text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-slate-900">{edu.degree}</span>
                    {edu.field && <span> in {edu.field}</span>}
                    <span>, {edu.institution}</span>
                  </div>
                  <span className="text-xs text-slate-600">
                    {edu.durationOrYear || (edu.startDate && edu.endDate ? `${edu.startDate} – ${edu.endDate}` : edu.startDate)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5 mb-2 font-sans">
              Certifications
            </h2>
            <ul className="list-disc list-outside pl-4 space-y-0.5 text-xs text-slate-800 font-sans">
              {data.certifications.map((c, idx) => (
                <li key={idx}>{typeof c === 'string' ? c : `${c.name}${c.issuer ? ` – ${c.issuer}` : ''}`}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

/**
 * Minimal Template
 * High-contrast monochrome, ultra-clean single column with ample whitespace
 */
const MinimalTemplate: React.FC<{ data: StructuredResumeData; zoom: number }> = ({ data, zoom }) => {
  return (
    <div
      className="bg-white text-slate-900 shadow-xl rounded-xl p-8 sm:p-12 mx-auto max-w-[850px] min-h-[1050px] font-sans border border-slate-200 transition-transform origin-top"
      style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
    >
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-light text-slate-900 tracking-tight">
          <span className="font-bold">{data.fullName?.split(' ')[0] || 'Candidate'}</span>{' '}
          {data.fullName?.split(' ').slice(1).join(' ') || ''}
        </h1>
        {data.title && (
          <p className="text-xs font-mono uppercase tracking-widest text-slate-500 mt-1">
            {data.title}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-600 font-mono">
          {data.contactInfo?.email && <span>{data.contactInfo.email}</span>}
          {data.contactInfo?.phone && <span>{data.contactInfo.phone}</span>}
          {data.contactInfo?.location && <span>{data.contactInfo.location}</span>}
          {data.contactInfo?.linkedin && <span>{data.contactInfo.linkedin}</span>}
        </div>
      </header>

      <div className="space-y-6">
        {data.summary && data.summary.trim() && (
          <section>
            <h2 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2 font-mono">
              // 01 SUMMARY
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {data.summary}
            </p>
          </section>
        )}

        {data.skills && data.skills.length > 0 && (
          <section>
            <h2 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2 font-mono">
              // 02 SKILLS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              {data.skills.map((s, idx) => (
                <div key={s.id || idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-900 block text-xs mb-0.5">{s.category}</span>
                  <span className="text-slate-600 text-xs">{s.items.join(', ')}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.experience && data.experience.length > 0 && (
          <section>
            <h2 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3 font-mono">
              // 03 EXPERIENCE
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp, idx) => (
                <div key={exp.id || idx} className="space-y-1 border-l-2 border-slate-200 pl-3.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-xs sm:text-sm text-slate-900">{exp.role}</span>
                    <span className="text-xs font-mono text-slate-400">{exp.duration}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600">{exp.company}</p>
                  {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                    <ul className="space-y-1 text-xs text-slate-700 pt-1">
                      {exp.bulletPoints.map((bp, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-1.5">
                          <span className="text-slate-400 select-none">→</span>
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.projects && data.projects.length > 0 && (
          <section>
            <h2 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3 font-mono">
              // 04 PROJECTS
            </h2>
            <div className="space-y-4">
              {data.projects.map((proj, idx) => (
                <div key={proj.id || idx} className="space-y-1 border-l-2 border-slate-200 pl-3.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-xs sm:text-sm text-slate-900">{proj.title}</span>
                    {proj.technologies && (
                      <span className="text-[11px] font-mono text-slate-500">
                        {proj.technologies.slice(0, 3).join(', ')}
                      </span>
                    )}
                  </div>
                  {proj.bulletPoints && proj.bulletPoints.length > 0 && (
                    <ul className="space-y-1 text-xs text-slate-700 pt-1">
                      {proj.bulletPoints.map((bp, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-1.5">
                          <span className="text-slate-400 select-none">→</span>
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.education && data.education.length > 0 && (
          <section>
            <h2 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2 font-mono">
              // 05 EDUCATION
            </h2>
            <div className="space-y-2">
              {data.education.map((edu, idx) => (
                <div key={edu.id || idx} className="flex justify-between items-baseline text-xs sm:text-sm">
                  <span className="font-semibold text-slate-800">{edu.degree} in {edu.field || 'CS'}, {edu.institution}</span>
                  <span className="text-xs font-mono text-slate-400">{edu.durationOrYear}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

/**
 * Executive Template
 * High-profile leadership style, top banner header, competencies matrix
 */
const ExecutiveTemplate: React.FC<{ data: StructuredResumeData; zoom: number }> = ({ data, zoom }) => {
  return (
    <div
      className="bg-white text-slate-900 shadow-xl rounded-xl p-8 sm:p-12 mx-auto max-w-[850px] min-h-[1050px] font-sans border border-slate-200 transition-transform origin-top"
      style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
    >
      {/* Executive Header Banner */}
      <header className="bg-slate-900 text-white p-6 rounded-xl mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {data.fullName || 'Candidate Name'}
        </h1>
        {data.title && (
          <p className="text-sm font-semibold text-indigo-400 uppercase tracking-widest mt-1">
            {data.title}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-300">
          {data.contactInfo?.email && <span>{data.contactInfo.email}</span>}
          {data.contactInfo?.phone && <span>• {data.contactInfo.phone}</span>}
          {data.contactInfo?.location && <span>• {data.contactInfo.location}</span>}
          {data.contactInfo?.linkedin && <span>• {data.contactInfo.linkedin}</span>}
        </div>
      </header>

      <div className="space-y-5">
        {data.summary && data.summary.trim() && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">
              Executive Profile
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
              {data.summary}
            </p>
          </section>
        )}

        {data.skills && data.skills.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2.5">
              Core Competencies & Stack
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {data.skills.map((s, idx) => (
                <div key={s.id || idx} className="border-l-2 border-indigo-600 pl-2.5">
                  <span className="font-bold text-slate-900 block">{s.category}</span>
                  <span className="text-slate-600">{s.items.join(', ')}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.experience && data.experience.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-3">
              Leadership & Experience
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp, idx) => (
                <div key={exp.id || idx} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      {exp.role} <span className="text-indigo-700 font-semibold">@ {exp.company}</span>
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{exp.duration}</span>
                  </div>
                  {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                    <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700 leading-relaxed">
                      {exp.bulletPoints.map((bp, bIdx) => (
                        <li key={bIdx}>{bp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.projects && data.projects.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-3">
              Strategic Technical Initiatives
            </h2>
            <div className="space-y-4">
              {data.projects.map((proj, idx) => (
                <div key={proj.id || idx} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-xs sm:text-sm text-slate-900">{proj.title}</span>
                    {proj.technologies && (
                      <span className="text-xs text-indigo-600">{proj.technologies.join(', ')}</span>
                    )}
                  </div>
                  {proj.bulletPoints && proj.bulletPoints.length > 0 && (
                    <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700 leading-relaxed">
                      {proj.bulletPoints.map((bp, bIdx) => (
                        <li key={bIdx}>{bp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data.education && data.education.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">
              Education
            </h2>
            <div className="space-y-1 text-xs sm:text-sm">
              {data.education.map((edu, idx) => (
                <div key={edu.id || idx} className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">{edu.degree} in {edu.field || 'CS'}, {edu.institution}</span>
                  <span className="text-xs text-slate-500">{edu.durationOrYear}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
