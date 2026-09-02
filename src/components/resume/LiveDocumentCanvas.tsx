import React, { useState, useRef, useEffect } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
  Check,
  X,
  Edit3,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Award,
  BookOpen,
  Briefcase,
  Layers,
  Code2,
} from 'lucide-react';
import {
  StructuredResumeData,
  ResumeTemplateType,
  StructuredResumeExperience,
  StructuredResumeProject,
  StructuredResumeEducation,
  StructuredResumeSkills,
  StructuredResumeCertItem,
} from '../../types/resume';

interface LiveDocumentCanvasProps {
  data: StructuredResumeData;
  templateId: ResumeTemplateType;
  zoom: number;
  onChange: (updater: (prev: StructuredResumeData) => StructuredResumeData) => void;
  onTriggerAi: (
    sectionType: string,
    currentContent: string,
    onApply: (improved: string) => void,
    itemTitle?: string,
    context?: string
  ) => void;
}

export const LiveDocumentCanvas: React.FC<LiveDocumentCanvasProps> = ({
  data,
  templateId,
  zoom,
  onChange,
  onTriggerAi,
}) => {
  // Currently active inline editing field ID
  const [editingId, setEditingId] = useState<string | null>(null);

  // Quick skill add input state for category
  const [newSkillInput, setNewSkillInput] = useState<{ [catId: string]: string }>({});

  // -------------------------------------------------------------
  // Helpers for Field Updates
  // -------------------------------------------------------------
  const updatePersonalInfo = (field: string, value: string) => {
    onChange((prev) => {
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

  const updateSummary = (value: string) => {
    onChange((prev) => ({ ...prev, summary: value }));
  };

  // Skill updates
  const updateSkillCategory = (catIdx: number, newCat: string) => {
    onChange((prev) => {
      const skills = [...prev.skills];
      skills[catIdx] = { ...skills[catIdx], category: newCat };
      return { ...prev, skills };
    });
  };

  const updateSkillItem = (catIdx: number, itemIdx: number, newItem: string) => {
    onChange((prev) => {
      const skills = [...prev.skills];
      const items = [...skills[catIdx].items];
      if (newItem.trim()) {
        items[itemIdx] = newItem.trim();
      } else {
        items.splice(itemIdx, 1);
      }
      skills[catIdx] = { ...skills[catIdx], items };
      return { ...prev, skills };
    });
  };

  const addSkillToCategory = (catIdx: number, skillText: string) => {
    if (!skillText.trim()) return;
    onChange((prev) => {
      const skills = [...prev.skills];
      const items = [...skills[catIdx].items, skillText.trim()];
      skills[catIdx] = { ...skills[catIdx], items };
      return { ...prev, skills };
    });
  };

  const removeSkillFromCategory = (catIdx: number, itemIdx: number) => {
    onChange((prev) => {
      const skills = [...prev.skills];
      const items = skills[catIdx].items.filter((_, i) => i !== itemIdx);
      skills[catIdx] = { ...skills[catIdx], items };
      return { ...prev, skills };
    });
  };

  const addSkillCategory = () => {
    onChange((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        {
          id: `sk-${Date.now()}`,
          category: 'New Skill Category',
          items: [],
        },
      ],
    }));
  };

  const removeSkillCategory = (catIdx: number) => {
    onChange((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== catIdx),
    }));
  };

  // Experience updates
  const updateExperienceField = (expIdx: number, field: keyof StructuredResumeExperience, val: any) => {
    onChange((prev) => {
      const exp = [...prev.experience];
      exp[expIdx] = { ...exp[expIdx], [field]: val };
      return { ...prev, experience: exp };
    });
  };

  const updateExperienceBullet = (expIdx: number, bIdx: number, val: string) => {
    onChange((prev) => {
      const exp = [...prev.experience];
      const bullets = [...exp[expIdx].bulletPoints];
      bullets[bIdx] = val;
      exp[expIdx] = { ...exp[expIdx], bulletPoints: bullets };
      return { ...prev, experience: exp };
    });
  };

  const addExperienceBullet = (expIdx: number) => {
    onChange((prev) => {
      const exp = [...prev.experience];
      const bullets = [...exp[expIdx].bulletPoints, ''];
      exp[expIdx] = { ...exp[expIdx], bulletPoints: bullets };
      return { ...prev, experience: exp };
    });
  };

  const removeExperienceBullet = (expIdx: number, bIdx: number) => {
    onChange((prev) => {
      const exp = [...prev.experience];
      const bullets = exp[expIdx].bulletPoints.filter((_, i) => i !== bIdx);
      exp[expIdx] = { ...exp[expIdx], bulletPoints: bullets };
      return { ...prev, experience: exp };
    });
  };

  const addExperienceItem = () => {
    onChange((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: `exp-${Date.now()}`,
          company: '',
          role: '',
          location: '',
          duration: '',
          bulletPoints: [''],
        },
      ],
    }));
  };

  const removeExperienceItem = (expIdx: number) => {
    if (window.confirm('Delete this work experience entry?')) {
      onChange((prev) => ({
        ...prev,
        experience: prev.experience.filter((_, i) => i !== expIdx),
      }));
    }
  };

  // Project updates
  const updateProjectField = (projIdx: number, field: keyof StructuredResumeProject, val: any) => {
    onChange((prev) => {
      const projects = [...prev.projects];
      projects[projIdx] = { ...projects[projIdx], [field]: val };
      return { ...prev, projects };
    });
  };

  const updateProjectBullet = (projIdx: number, bIdx: number, val: string) => {
    onChange((prev) => {
      const projects = [...prev.projects];
      const bullets = [...projects[projIdx].bulletPoints];
      bullets[bIdx] = val;
      projects[projIdx] = { ...projects[projIdx], bulletPoints: bullets };
      return { ...prev, projects };
    });
  };

  const addProjectBullet = (projIdx: number) => {
    onChange((prev) => {
      const projects = [...prev.projects];
      const bullets = [...projects[projIdx].bulletPoints, ''];
      projects[projIdx] = { ...projects[projIdx], bulletPoints: bullets };
      return { ...prev, projects };
    });
  };

  const removeProjectBullet = (projIdx: number, bIdx: number) => {
    onChange((prev) => {
      const projects = [...prev.projects];
      const bullets = projects[projIdx].bulletPoints.filter((_, i) => i !== bIdx);
      projects[projIdx] = { ...projects[projIdx], bulletPoints: bullets };
      return { ...prev, projects };
    });
  };

  const addProjectItem = () => {
    onChange((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id: `proj-${Date.now()}`,
          title: '',
          roleOrSubtitle: '',
          technologies: [],
          bulletPoints: [''],
        },
      ],
    }));
  };

  const removeProjectItem = (projIdx: number) => {
    if (window.confirm('Delete this project entry?')) {
      onChange((prev) => ({
        ...prev,
        projects: prev.projects.filter((_, i) => i !== projIdx),
      }));
    }
  };

  // Education updates
  const updateEducationField = (eduIdx: number, field: keyof StructuredResumeEducation, val: any) => {
    onChange((prev) => {
      const edu = [...prev.education];
      edu[eduIdx] = { ...edu[eduIdx], [field]: val };
      return { ...prev, education: edu };
    });
  };

  const addEducationItem = () => {
    onChange((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: `edu-${Date.now()}`,
          institution: '',
          degree: '',
          field: '',
          durationOrYear: '',
          details: '',
        },
      ],
    }));
  };

  const removeEducationItem = (eduIdx: number) => {
    if (window.confirm('Delete this education entry?')) {
      onChange((prev) => ({
        ...prev,
        education: prev.education.filter((_, i) => i !== eduIdx),
      }));
    }
  };

  // Helper to normalize cert items safely
  const getCertObj = (cert: string | StructuredResumeCertItem, idx: number) => {
    if (typeof cert === 'string') {
      return { id: `cert-${idx}`, name: cert, issuer: '', year: '' };
    }
    return {
      id: cert.id || `cert-${idx}`,
      name: cert.name || '',
      issuer: cert.issuer || '',
      year: cert.date || (cert as any).year || '',
    };
  };

  // Certifications updates
  const updateCertField = (certIdx: number, field: 'name' | 'issuer' | 'year', val: string) => {
    onChange((prev) => {
      const rawCerts = prev.certifications || [];
      const certs = rawCerts.map((c, i) => {
        const obj = getCertObj(c, i);
        if (i === certIdx) {
          return {
            id: obj.id,
            name: field === 'name' ? val : obj.name,
            issuer: field === 'issuer' ? val : obj.issuer,
            date: field === 'year' ? val : obj.year,
          };
        }
        return {
          id: obj.id,
          name: obj.name,
          issuer: obj.issuer,
          date: obj.year,
        };
      });
      return { ...prev, certifications: certs };
    });
  };

  const addCertItem = () => {
    onChange((prev) => ({
      ...prev,
      certifications: [
        ...(prev.certifications || []),
        {
          id: `cert-${Date.now()}`,
          name: '',
          issuer: '',
          date: '',
        },
      ],
    }));
  };

  const removeCertItem = (certIdx: number) => {
    onChange((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).filter((_, i) => i !== certIdx),
    }));
  };

  // -------------------------------------------------------------
  // Dynamic Styling based on templateId
  // -------------------------------------------------------------
  const isClassic = templateId === 'classic';
  const isMinimal = templateId === 'minimal';
  const isExecutive = templateId === 'executive';

  // Section Header Class
  const getSectionHeaderClass = () => {
    if (isClassic) return 'text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-700 pb-1 mb-2 font-serif';
    if (isMinimal) return 'text-xs font-mono font-bold tracking-widest text-slate-700 uppercase mb-2 border-b border-slate-300 pb-1';
    if (isExecutive) return 'text-xs font-extrabold uppercase tracking-wider text-indigo-950 border-b-2 border-indigo-900 pb-1 mb-2.5';
    return 'text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-200 pb-1 mb-2.5';
  };

  const fontClass = isClassic ? 'font-serif' : isMinimal ? 'font-mono' : 'font-sans';

  return (
    <div className="w-full flex justify-center py-4 px-2 sm:px-4">
      {/* Resume Document Paper Sheet */}
      <div
        className={`bg-white text-slate-900 shadow-2xl rounded-2xl p-6 sm:p-12 w-full max-w-[850px] min-h-[1100px] border border-slate-300/80 transition-all origin-top ${fontClass} relative select-text`}
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
      >
        {/* Subtle Canvas Watermark/Guide */}
        <div className="absolute top-2 right-4 text-[10px] font-sans font-medium text-slate-400 select-none pointer-events-none flex items-center gap-1">
          <Edit3 className="w-3 h-3 text-indigo-500" />
          <span>Click any text to edit directly</span>
        </div>

        {/* ========================================================================= */}
        {/* 1. HEADER SECTION (Name, Target Role, Contact Links)                      */}
        {/* ========================================================================= */}
        <header
          className={`pb-5 mb-6 group relative rounded-xl transition-all ${
            isExecutive
              ? 'bg-slate-900 text-white p-6 rounded-2xl mb-6 shadow-md'
              : isClassic
              ? 'border-b border-slate-800 text-center'
              : 'border-b-2 border-indigo-600 text-center'
          }`}
        >
          {/* Candidate Full Name */}
          <div className="relative">
            {editingId === 'fullName' ? (
              <input
                type="text"
                autoFocus
                value={data.fullName || ''}
                onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                onBlur={() => setEditingId(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                placeholder="Your Full Name"
                className={`w-full bg-indigo-50/80 dark:bg-slate-800 text-center font-extrabold tracking-tight px-3 py-1 rounded-lg border-2 border-indigo-500 outline-none ${
                  isExecutive
                    ? 'text-2xl sm:text-3xl text-white'
                    : 'text-2xl sm:text-3xl text-slate-900 uppercase'
                }`}
              />
            ) : (
              <h1
                onClick={() => setEditingId('fullName')}
                title="Click to edit name"
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight cursor-pointer hover:ring-2 hover:ring-indigo-400/50 hover:bg-indigo-50/40 rounded-lg px-2 py-0.5 transition-all inline-block ${
                  isExecutive ? 'text-white' : 'text-slate-900 uppercase'
                }`}
              >
                {data.fullName || (
                  <span className="text-slate-400 italic text-xl font-normal">
                    Click to add Name
                  </span>
                )}
              </h1>
            )}
          </div>

          {/* Job Title / Target Role */}
          <div className="mt-1">
            {editingId === 'title' ? (
              <input
                type="text"
                autoFocus
                value={data.title || ''}
                onChange={(e) => updatePersonalInfo('title', e.target.value)}
                onBlur={() => setEditingId(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                placeholder="Job Title / Role e.g. Full Stack Engineer"
                className={`text-center font-semibold text-sm px-3 py-1 rounded-lg border-2 border-indigo-500 bg-indigo-50/80 dark:bg-slate-800 outline-none ${
                  isExecutive ? 'text-indigo-300' : 'text-indigo-600'
                }`}
              />
            ) : (
              <p
                onClick={() => setEditingId('title')}
                title="Click to edit job title"
                className={`text-sm font-semibold tracking-wider cursor-pointer hover:ring-2 hover:ring-indigo-400/50 hover:bg-indigo-50/40 rounded-md px-2 py-0.5 transition-all inline-block ${
                  isExecutive ? 'text-indigo-300' : 'text-indigo-600 uppercase'
                }`}
              >
                {data.title || (
                  <span className="text-slate-400 italic text-xs font-normal">
                    + Add Target Role / Title
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Contact Items Bar (Email, Phone, Location, LinkedIn, GitHub, Portfolio) */}
          <div
            className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-3 text-xs ${
              isExecutive ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {/* Email */}
            <div className="inline-flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              {editingId === 'email' ? (
                <input
                  type="email"
                  autoFocus
                  value={data.contactInfo?.email || ''}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                  placeholder="email@domain.com"
                  className="px-2 py-0.5 rounded border border-indigo-500 bg-indigo-50 text-slate-900 text-xs outline-none"
                />
              ) : (
                <span
                  onClick={() => setEditingId('email')}
                  title="Click to edit email"
                  className="cursor-pointer hover:underline hover:text-indigo-600 px-1 rounded transition-colors"
                >
                  {data.contactInfo?.email || (
                    <span className="text-slate-400 italic">+ Email</span>
                  )}
                </span>
              )}
            </div>

            {/* Phone */}
            <div className="inline-flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              {editingId === 'phone' ? (
                <input
                  type="tel"
                  autoFocus
                  value={data.contactInfo?.phone || ''}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                  placeholder="+1 (555) 000-0000"
                  className="px-2 py-0.5 rounded border border-indigo-500 bg-indigo-50 text-slate-900 text-xs outline-none"
                />
              ) : (
                <span
                  onClick={() => setEditingId('phone')}
                  title="Click to edit phone"
                  className="cursor-pointer hover:underline hover:text-indigo-600 px-1 rounded transition-colors"
                >
                  {data.contactInfo?.phone || (
                    <span className="text-slate-400 italic">+ Phone</span>
                  )}
                </span>
              )}
            </div>

            {/* Location */}
            <div className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              {editingId === 'location' ? (
                <input
                  type="text"
                  autoFocus
                  value={data.contactInfo?.location || ''}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                  placeholder="City, State"
                  className="px-2 py-0.5 rounded border border-indigo-500 bg-indigo-50 text-slate-900 text-xs outline-none"
                />
              ) : (
                <span
                  onClick={() => setEditingId('location')}
                  title="Click to edit location"
                  className="cursor-pointer hover:underline hover:text-indigo-600 px-1 rounded transition-colors"
                >
                  {data.contactInfo?.location || (
                    <span className="text-slate-400 italic">+ Location</span>
                  )}
                </span>
              )}
            </div>

            {/* LinkedIn */}
            <div className="inline-flex items-center gap-1">
              <Linkedin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              {editingId === 'linkedin' ? (
                <input
                  type="text"
                  autoFocus
                  value={data.contactInfo?.linkedin || ''}
                  onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                  placeholder="linkedin.com/in/username"
                  className="px-2 py-0.5 rounded border border-indigo-500 bg-indigo-50 text-slate-900 text-xs outline-none"
                />
              ) : (
                <span
                  onClick={() => setEditingId('linkedin')}
                  title="Click to edit LinkedIn"
                  className="cursor-pointer hover:underline hover:text-indigo-600 px-1 rounded transition-colors truncate max-w-[160px]"
                >
                  {data.contactInfo?.linkedin || (
                    <span className="text-slate-400 italic">+ LinkedIn</span>
                  )}
                </span>
              )}
            </div>

            {/* GitHub */}
            <div className="inline-flex items-center gap-1">
              <Github className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              {editingId === 'github' ? (
                <input
                  type="text"
                  autoFocus
                  value={data.contactInfo?.github || ''}
                  onChange={(e) => updatePersonalInfo('github', e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                  placeholder="github.com/username"
                  className="px-2 py-0.5 rounded border border-indigo-500 bg-indigo-50 text-slate-900 text-xs outline-none"
                />
              ) : (
                <span
                  onClick={() => setEditingId('github')}
                  title="Click to edit GitHub"
                  className="cursor-pointer hover:underline hover:text-indigo-600 px-1 rounded transition-colors truncate max-w-[140px]"
                >
                  {data.contactInfo?.github || (
                    <span className="text-slate-400 italic">+ GitHub</span>
                  )}
                </span>
              )}
            </div>

            {/* Portfolio */}
            <div className="inline-flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              {editingId === 'portfolio' ? (
                <input
                  type="text"
                  autoFocus
                  value={data.contactInfo?.portfolio || ''}
                  onChange={(e) => updatePersonalInfo('portfolio', e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                  placeholder="portfolio.dev"
                  className="px-2 py-0.5 rounded border border-indigo-500 bg-indigo-50 text-slate-900 text-xs outline-none"
                />
              ) : (
                <span
                  onClick={() => setEditingId('portfolio')}
                  title="Click to edit portfolio website"
                  className="cursor-pointer hover:underline hover:text-indigo-600 px-1 rounded transition-colors truncate max-w-[140px]"
                >
                  {data.contactInfo?.portfolio || (
                    <span className="text-slate-400 italic">+ Portfolio</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* RESUME BODY SECTIONS                                                      */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          {/* ------------------------------------------------------------- */}
          {/* 2. PROFESSIONAL SUMMARY                                       */}
          {/* ------------------------------------------------------------- */}
          <section className="relative group rounded-xl p-2 -m-2 hover:bg-slate-50/70 transition-all">
            <div className="flex items-center justify-between">
              <h2 className={getSectionHeaderClass()}>Professional Summary</h2>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mb-2">
                <button
                  type="button"
                  onClick={() =>
                    onTriggerAi(
                      'summary',
                      data.summary || '',
                      (improved) => updateSummary(improved),
                      'Professional Summary'
                    )
                  }
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-[10px] cursor-pointer shadow-2xs"
                  title="Enhance summary with AI"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>AI Polish</span>
                </button>
              </div>
            </div>

            {editingId === 'summary' ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  rows={4}
                  value={data.summary || ''}
                  onChange={(e) => updateSummary(e.target.value)}
                  placeholder="Enter a compelling 3-4 sentence professional summary..."
                  className="w-full p-3 rounded-xl border-2 border-indigo-500 bg-white text-xs sm:text-sm text-slate-800 leading-relaxed outline-none shadow-sm resize-y font-sans"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setEditingId('summary')}
                title="Click to edit summary"
                className="cursor-pointer hover:ring-2 hover:ring-indigo-400/40 rounded-lg p-1 transition-all"
              >
                {data.summary && data.summary.trim() ? (
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                    {data.summary}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic py-1">
                    + Click here to add your Professional Summary...
                  </p>
                )}
              </div>
            )}
          </section>

          {/* ------------------------------------------------------------- */}
          {/* 3. TECHNICAL SKILLS                                           */}
          {/* ------------------------------------------------------------- */}
          <section className="relative group rounded-xl p-2 -m-2 hover:bg-slate-50/70 transition-all">
            <div className="flex items-center justify-between">
              <h2 className={getSectionHeaderClass()}>Technical Skills</h2>
              <button
                type="button"
                onClick={addSkillCategory}
                className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-[10px] cursor-pointer shadow-2xs mb-2"
              >
                <Plus className="w-3 h-3" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              {data.skills && data.skills.length > 0 ? (
                data.skills.map((skillGroup, catIdx) => (
                  <div
                    key={skillGroup.id || catIdx}
                    className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 group/cat py-0.5 hover:bg-indigo-50/30 rounded-lg px-1 transition-colors"
                  >
                    {/* Category Title */}
                    <div className="flex items-center gap-1 min-w-[150px] shrink-0">
                      {editingId === `cat-${catIdx}` ? (
                        <input
                          type="text"
                          autoFocus
                          value={skillGroup.category}
                          onChange={(e) => updateSkillCategory(catIdx, e.target.value)}
                          onBlur={() => setEditingId(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                          className="font-bold text-slate-800 text-xs px-2 py-0.5 rounded border border-indigo-500 bg-white outline-none w-full"
                        />
                      ) : (
                        <span
                          onClick={() => setEditingId(`cat-${catIdx}`)}
                          title="Click to edit category name"
                          className="font-bold text-slate-800 cursor-pointer hover:text-indigo-600 transition-colors"
                        >
                          {skillGroup.category}:
                        </span>
                      )}
                    </div>

                    {/* Skill Chips / Comma Items */}
                    <div className="flex flex-wrap items-center gap-1.5 flex-1">
                      {skillGroup.items.map((item, itemIdx) => (
                        <span
                          key={itemIdx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-200 text-slate-800 text-xs group/item hover:bg-indigo-100 transition-all"
                        >
                          {editingId === `skill-${catIdx}-${itemIdx}` ? (
                            <input
                              type="text"
                              autoFocus
                              value={item}
                              onChange={(e) => updateSkillItem(catIdx, itemIdx, e.target.value)}
                              onBlur={() => setEditingId(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                              className="w-20 px-1 bg-white rounded border border-indigo-500 outline-none text-xs"
                            />
                          ) : (
                            <span
                              onClick={() => setEditingId(`skill-${catIdx}-${itemIdx}`)}
                              title="Click to edit skill"
                              className="cursor-pointer"
                            >
                              {item}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => removeSkillFromCategory(catIdx, itemIdx)}
                            className="opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer"
                            title="Remove skill"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}

                      {/* Add Skill Quick Inline Input */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const val = newSkillInput[skillGroup.id || catIdx] || '';
                          if (val.trim()) {
                            addSkillToCategory(catIdx, val);
                            setNewSkillInput({ ...newSkillInput, [skillGroup.id || catIdx]: '' });
                          }
                        }}
                        className="inline-flex items-center"
                      >
                        <input
                          type="text"
                          value={newSkillInput[skillGroup.id || catIdx] || ''}
                          onChange={(e) =>
                            setNewSkillInput({
                              ...newSkillInput,
                              [skillGroup.id || catIdx]: e.target.value,
                            })
                          }
                          placeholder="+ Add skill"
                          className="w-20 text-[11px] px-1.5 py-0.5 rounded-md border border-dashed border-slate-300 hover:border-indigo-400 focus:border-indigo-600 outline-none bg-transparent"
                        />
                      </form>

                      {/* Remove Category */}
                      <button
                        type="button"
                        onClick={() => removeSkillCategory(catIdx)}
                        className="opacity-0 group-hover/cat:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity ml-auto cursor-pointer p-0.5"
                        title="Delete category"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  onClick={addSkillCategory}
                  className="cursor-pointer text-xs text-slate-400 italic py-1 hover:text-indigo-600"
                >
                  + Click to add Skills section
                </div>
              )}
            </div>
          </section>

          {/* ------------------------------------------------------------- */}
          {/* 4. WORK EXPERIENCE                                            */}
          {/* ------------------------------------------------------------- */}
          <section className="relative group rounded-xl p-2 -m-2 hover:bg-slate-50/70 transition-all">
            <div className="flex items-center justify-between">
              <h2 className={getSectionHeaderClass()}>Work Experience</h2>
              <button
                type="button"
                onClick={addExperienceItem}
                className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-[10px] cursor-pointer shadow-2xs mb-2"
              >
                <Plus className="w-3 h-3" />
                <span>Add Experience</span>
              </button>
            </div>

            <div className="space-y-4">
              {data.experience && data.experience.length > 0 ? (
                data.experience.map((exp, expIdx) => (
                  <div
                    key={exp.id || expIdx}
                    className="space-y-1.5 group/exp p-2 rounded-xl hover:bg-white hover:shadow-xs transition-all border border-transparent hover:border-slate-200"
                  >
                    {/* Role, Company, Location, Duration */}
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <div className="flex items-baseline gap-1.5 flex-wrap font-bold text-xs sm:text-sm text-slate-900">
                        {editingId === `exp-role-${expIdx}` ? (
                          <input
                            type="text"
                            autoFocus
                            value={exp.role}
                            onChange={(e) => updateExperienceField(expIdx, 'role', e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                            placeholder="Job Role"
                            className="font-bold text-xs px-2 py-0.5 rounded border border-indigo-500 bg-white outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => setEditingId(`exp-role-${expIdx}`)}
                            title="Click to edit role"
                            className="cursor-pointer hover:text-indigo-600 transition-colors"
                          >
                            {exp.role || 'Role'}
                          </span>
                        )}

                        <span className="text-slate-400 font-normal">|</span>

                        {editingId === `exp-comp-${expIdx}` ? (
                          <input
                            type="text"
                            autoFocus
                            value={exp.company}
                            onChange={(e) => updateExperienceField(expIdx, 'company', e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                            placeholder="Company Name"
                            className="font-semibold text-xs text-indigo-600 px-2 py-0.5 rounded border border-indigo-500 bg-white outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => setEditingId(`exp-comp-${expIdx}`)}
                            title="Click to edit company"
                            className="font-semibold text-indigo-600 cursor-pointer hover:underline"
                          >
                            {exp.company || 'Company'}
                          </span>
                        )}

                        {editingId === `exp-loc-${expIdx}` ? (
                          <input
                            type="text"
                            autoFocus
                            value={exp.location || ''}
                            onChange={(e) => updateExperienceField(expIdx, 'location', e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                            placeholder="Location (City, State)"
                            className="text-xs text-slate-500 px-2 py-0.5 rounded border border-indigo-500 bg-white outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => setEditingId(`exp-loc-${expIdx}`)}
                            title="Click to edit location"
                            className="text-slate-500 font-normal text-xs cursor-pointer hover:text-slate-800"
                          >
                            {exp.location ? `(${exp.location})` : '(+ Location)'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {editingId === `exp-dur-${expIdx}` ? (
                          <input
                            type="text"
                            autoFocus
                            value={exp.duration || ''}
                            onChange={(e) => updateExperienceField(expIdx, 'duration', e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                            placeholder="Duration e.g. 2022 – Present"
                            className="text-xs text-slate-500 px-2 py-0.5 rounded border border-indigo-500 bg-white outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => setEditingId(`exp-dur-${expIdx}`)}
                            title="Click to edit date range"
                            className="text-xs font-medium text-slate-500 shrink-0 cursor-pointer hover:text-indigo-600"
                          >
                            {exp.duration || '+ Duration'}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => removeExperienceItem(expIdx)}
                          className="opacity-0 group-hover/exp:opacity-100 text-slate-300 hover:text-rose-600 transition-opacity p-0.5 cursor-pointer"
                          title="Delete experience entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bullet points */}
                    <ul className="list-disc list-outside ml-4 space-y-1 text-xs text-slate-700">
                      {exp.bulletPoints.map((bullet, bIdx) => (
                        <li key={bIdx} className="group/bullet pl-1">
                          {editingId === `exp-bullet-${expIdx}-${bIdx}` ? (
                            <div className="space-y-1 my-1">
                              <textarea
                                autoFocus
                                rows={2}
                                value={bullet}
                                onChange={(e) => updateExperienceBullet(expIdx, bIdx, e.target.value)}
                                className="w-full p-2 rounded-lg border-2 border-indigo-500 bg-white text-xs text-slate-900 outline-none leading-relaxed resize-none"
                              />
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onTriggerAi(
                                      'experience_bullet',
                                      bullet,
                                      (improved) => updateExperienceBullet(expIdx, bIdx, improved),
                                      exp.role,
                                      exp.company
                                    )
                                  }
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                                  <span>Polish bullet with AI</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-2.5 py-0.5 rounded bg-indigo-600 text-white text-[11px] font-bold cursor-pointer"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <span
                                onClick={() => setEditingId(`exp-bullet-${expIdx}-${bIdx}`)}
                                title="Click to edit bullet"
                                className="cursor-pointer hover:bg-indigo-50/60 rounded px-1 -mx-1 transition-colors leading-relaxed flex-1"
                              >
                                {bullet || <span className="text-slate-400 italic">Click to enter bullet point details...</span>}
                              </span>
                              <div className="opacity-0 group-hover/bullet:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onTriggerAi(
                                      'experience_bullet',
                                      bullet,
                                      (improved) => updateExperienceBullet(expIdx, bIdx, improved),
                                      exp.role,
                                      exp.company
                                    )
                                  }
                                  className="p-1 rounded text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                                  title="Enhance with AI"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeExperienceBullet(expIdx, bIdx)}
                                  className="p-1 rounded text-slate-300 hover:text-rose-500 cursor-pointer"
                                  title="Remove bullet"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>

                    {/* Add Bullet Button */}
                    <button
                      type="button"
                      onClick={() => addExperienceBullet(expIdx)}
                      className="opacity-0 group-hover/exp:opacity-100 transition-opacity inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer pt-0.5 ml-4"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add bullet point</span>
                    </button>
                  </div>
                ))
              ) : (
                <div
                  onClick={addExperienceItem}
                  className="cursor-pointer text-xs text-slate-400 italic py-1 hover:text-indigo-600"
                >
                  + Click to add Work Experience section
                </div>
              )}
            </div>
          </section>

          {/* ------------------------------------------------------------- */}
          {/* 5. PROJECTS                                                   */}
          {/* ------------------------------------------------------------- */}
          <section className="relative group rounded-xl p-2 -m-2 hover:bg-slate-50/70 transition-all">
            <div className="flex items-center justify-between">
              <h2 className={getSectionHeaderClass()}>Key Projects</h2>
              <button
                type="button"
                onClick={addProjectItem}
                className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-[10px] cursor-pointer shadow-2xs mb-2"
              >
                <Plus className="w-3 h-3" />
                <span>Add Project</span>
              </button>
            </div>

            <div className="space-y-4">
              {data.projects && data.projects.length > 0 ? (
                data.projects.map((proj, projIdx) => (
                  <div
                    key={proj.id || projIdx}
                    className="space-y-1.5 group/proj p-2 rounded-xl hover:bg-white hover:shadow-xs transition-all border border-transparent hover:border-slate-200"
                  >
                    {/* Project Header */}
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <div className="flex items-baseline gap-1.5 flex-wrap font-bold text-xs sm:text-sm text-slate-900">
                        {editingId === `proj-title-${projIdx}` ? (
                          <input
                            type="text"
                            autoFocus
                            value={proj.title}
                            onChange={(e) => updateProjectField(projIdx, 'title', e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                            placeholder="Project Title"
                            className="font-bold text-xs px-2 py-0.5 rounded border border-indigo-500 bg-white outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => setEditingId(`proj-title-${projIdx}`)}
                            title="Click to edit project title"
                            className="cursor-pointer hover:text-indigo-600 transition-colors"
                          >
                            {proj.title || 'Project Title'}
                          </span>
                        )}

                        {editingId === `proj-role-${projIdx}` ? (
                          <input
                            type="text"
                            autoFocus
                            value={proj.roleOrSubtitle || ''}
                            onChange={(e) => updateProjectField(projIdx, 'roleOrSubtitle', e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                            placeholder="Role / Subtitle"
                            className="font-normal text-xs text-slate-600 px-2 py-0.5 rounded border border-indigo-500 bg-white outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => setEditingId(`proj-role-${projIdx}`)}
                            title="Click to edit role/subtitle"
                            className="font-normal text-slate-500 text-xs cursor-pointer hover:text-slate-800"
                          >
                            {proj.roleOrSubtitle ? `| ${proj.roleOrSubtitle}` : '(+ Subtitle)'}
                          </span>
                        )}

                        {/* Tech stack badges */}
                        {editingId === `proj-tech-${projIdx}` ? (
                          <input
                            type="text"
                            autoFocus
                            value={(proj.technologies || []).join(', ')}
                            onChange={(e) =>
                              updateProjectField(
                                projIdx,
                                'technologies',
                                e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                              )
                            }
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                            placeholder="React, Python, AWS"
                            className="text-xs text-indigo-700 px-2 py-0.5 rounded border border-indigo-500 bg-white outline-none w-48"
                          />
                        ) : (
                          <span
                            onClick={() => setEditingId(`proj-tech-${projIdx}`)}
                            title="Click to edit technologies"
                            className="text-xs font-mono text-indigo-700 cursor-pointer hover:underline"
                          >
                            {proj.technologies && proj.technologies.length > 0
                              ? `(${proj.technologies.join(', ')})`
                              : '(+ Add Tech)'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Project Link */}
                        {editingId === `proj-link-${projIdx}` ? (
                          <input
                            type="text"
                            autoFocus
                            value={proj.link || ''}
                            onChange={(e) => updateProjectField(projIdx, 'link', e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                            placeholder="https://demo.app"
                            className="text-xs text-slate-500 px-2 py-0.5 rounded border border-indigo-500 bg-white outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => setEditingId(`proj-link-${projIdx}`)}
                            title="Click to edit link"
                            className="text-xs text-slate-400 hover:text-indigo-600 cursor-pointer"
                          >
                            {proj.link ? 'Live Demo ↗' : '+ Link'}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => removeProjectItem(projIdx)}
                          className="opacity-0 group-hover/proj:opacity-100 text-slate-300 hover:text-rose-600 transition-opacity p-0.5 cursor-pointer"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bullet Points */}
                    <ul className="list-disc list-outside ml-4 space-y-1 text-xs text-slate-700">
                      {proj.bulletPoints.map((bullet, bIdx) => (
                        <li key={bIdx} className="group/bullet pl-1">
                          {editingId === `proj-bullet-${projIdx}-${bIdx}` ? (
                            <div className="space-y-1 my-1">
                              <textarea
                                autoFocus
                                rows={2}
                                value={bullet}
                                onChange={(e) => updateProjectBullet(projIdx, bIdx, e.target.value)}
                                className="w-full p-2 rounded-lg border-2 border-indigo-500 bg-white text-xs text-slate-900 outline-none leading-relaxed resize-none"
                              />
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onTriggerAi(
                                      'project_bullet',
                                      bullet,
                                      (improved) => updateProjectBullet(projIdx, bIdx, improved),
                                      proj.title,
                                      (proj.technologies || []).join(', ')
                                    )
                                  }
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                                  <span>Polish bullet with AI</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-2.5 py-0.5 rounded bg-indigo-600 text-white text-[11px] font-bold cursor-pointer"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <span
                                onClick={() => setEditingId(`proj-bullet-${projIdx}-${bIdx}`)}
                                title="Click to edit bullet"
                                className="cursor-pointer hover:bg-indigo-50/60 rounded px-1 -mx-1 transition-colors leading-relaxed flex-1"
                              >
                                {bullet || <span className="text-slate-400 italic">Click to enter bullet point details...</span>}
                              </span>
                              <div className="opacity-0 group-hover/bullet:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onTriggerAi(
                                      'project_bullet',
                                      bullet,
                                      (improved) => updateProjectBullet(projIdx, bIdx, improved),
                                      proj.title,
                                      (proj.technologies || []).join(', ')
                                    )
                                  }
                                  className="p-1 rounded text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                                  title="Enhance with AI"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeProjectBullet(projIdx, bIdx)}
                                  className="p-1 rounded text-slate-300 hover:text-rose-500 cursor-pointer"
                                  title="Remove bullet"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>

                    {/* Add Bullet Button */}
                    <button
                      type="button"
                      onClick={() => addProjectBullet(projIdx)}
                      className="opacity-0 group-hover/proj:opacity-100 transition-opacity inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer pt-0.5 ml-4"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add bullet point</span>
                    </button>
                  </div>
                ))
              ) : (
                <div
                  onClick={addProjectItem}
                  className="cursor-pointer text-xs text-slate-400 italic py-1 hover:text-indigo-600"
                >
                  + Click to add Projects section
                </div>
              )}
            </div>
          </section>

          {/* ------------------------------------------------------------- */}
          {/* 6. EDUCATION                                                  */}
          {/* ------------------------------------------------------------- */}
          <section className="relative group rounded-xl p-2 -m-2 hover:bg-slate-50/70 transition-all">
            <div className="flex items-center justify-between">
              <h2 className={getSectionHeaderClass()}>Education</h2>
              <button
                type="button"
                onClick={addEducationItem}
                className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-[10px] cursor-pointer shadow-2xs mb-2"
              >
                <Plus className="w-3 h-3" />
                <span>Add Education</span>
              </button>
            </div>

            <div className="space-y-3">
              {data.education && data.education.length > 0 ? (
                data.education.map((edu, eduIdx) => (
                  <div
                    key={edu.id || eduIdx}
                    className="group/edu p-2 rounded-xl hover:bg-white hover:shadow-xs transition-all border border-transparent hover:border-slate-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs sm:text-sm">
                      <div className="font-bold text-slate-900 flex items-baseline gap-1.5 flex-wrap">
                        {editingId === `edu-inst-${eduIdx}` ? (
                          <input
                            type="text"
                            autoFocus
                            value={edu.institution}
                            onChange={(e) => updateEducationField(eduIdx, 'institution', e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                            placeholder="College / University"
                            className="font-bold text-xs px-2 py-0.5 rounded border border-indigo-500 bg-white outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => setEditingId(`edu-inst-${eduIdx}`)}
                            title="Click to edit institution"
                            className="cursor-pointer hover:text-indigo-600 transition-colors"
                          >
                            {edu.institution || 'University Name'}
                          </span>
                        )}

                        <span className="text-slate-400 font-normal">|</span>

                        {editingId === `edu-deg-${eduIdx}` ? (
                          <input
                            type="text"
                            autoFocus
                            value={edu.degree}
                            onChange={(e) => updateEducationField(eduIdx, 'degree', e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                            placeholder="Degree & Major"
                            className="font-semibold text-xs text-indigo-700 px-2 py-0.5 rounded border border-indigo-500 bg-white outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => setEditingId(`edu-deg-${eduIdx}`)}
                            title="Click to edit degree"
                            className="font-semibold text-indigo-700 cursor-pointer hover:underline"
                          >
                            {edu.degree || 'Degree'}
                          </span>
                        )}

                        {editingId === `edu-det-${eduIdx}` ? (
                          <input
                            type="text"
                            autoFocus
                            value={edu.details || ''}
                            onChange={(e) => updateEducationField(eduIdx, 'details', e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                            placeholder="GPA / Honors"
                            className="text-xs text-slate-500 px-2 py-0.5 rounded border border-indigo-500 bg-white outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => setEditingId(`edu-det-${eduIdx}`)}
                            title="Click to edit GPA / details"
                            className="text-slate-500 font-normal text-xs cursor-pointer hover:text-slate-800"
                          >
                            {edu.details ? `(${edu.details})` : '(+ GPA)'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {editingId === `edu-dur-${eduIdx}` ? (
                          <input
                            type="text"
                            autoFocus
                            value={edu.durationOrYear || ''}
                            onChange={(e) => updateEducationField(eduIdx, 'durationOrYear', e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                            placeholder="Year e.g. 2020 – 2024"
                            className="text-xs text-slate-500 px-2 py-0.5 rounded border border-indigo-500 bg-white outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => setEditingId(`edu-dur-${eduIdx}`)}
                            title="Click to edit year"
                            className="text-xs font-medium text-slate-500 shrink-0 cursor-pointer hover:text-indigo-600"
                          >
                            {edu.durationOrYear || '+ Year'}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => removeEducationItem(eduIdx)}
                          className="opacity-0 group-hover/edu:opacity-100 text-slate-300 hover:text-rose-600 transition-opacity p-0.5 cursor-pointer"
                          title="Delete education entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  onClick={addEducationItem}
                  className="cursor-pointer text-xs text-slate-400 italic py-1 hover:text-indigo-600"
                >
                  + Click to add Education section
                </div>
              )}
            </div>
          </section>

          {/* ------------------------------------------------------------- */}
          {/* 7. CERTIFICATIONS & ACHIEVEMENTS                              */}
          {/* ------------------------------------------------------------- */}
          {(data.certifications && data.certifications.length > 0) || editingId === 'add-cert' ? (
            <section className="relative group rounded-xl p-2 -m-2 hover:bg-slate-50/70 transition-all">
              <div className="flex items-center justify-between">
                <h2 className={getSectionHeaderClass()}>Certifications & Achievements</h2>
                <button
                  type="button"
                  onClick={addCertItem}
                  className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-[10px] cursor-pointer shadow-2xs mb-2"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Cert</span>
                </button>
              </div>

              <ul className="list-disc list-outside ml-4 space-y-1.5 text-xs text-slate-700">
                {(data.certifications || []).map((rawCert, certIdx) => {
                  const cert = getCertObj(rawCert, certIdx);
                  return (
                    <li key={cert.id || certIdx} className="group/cert pl-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          {editingId === `cert-name-${certIdx}` ? (
                            <input
                              type="text"
                              autoFocus
                              value={cert.name}
                              onChange={(e) => updateCertField(certIdx, 'name', e.target.value)}
                              onBlur={() => setEditingId(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                              placeholder="Certificate Title"
                              className="font-bold text-xs px-2 py-0.5 rounded border border-indigo-500 bg-white outline-none"
                            />
                          ) : (
                            <span
                              onClick={() => setEditingId(`cert-name-${certIdx}`)}
                              title="Click to edit certification"
                              className="font-bold text-slate-900 cursor-pointer hover:text-indigo-600"
                            >
                              {cert.name || '+ Certification / Award Name'}
                            </span>
                          )}

                          {editingId === `cert-iss-${certIdx}` ? (
                            <input
                              type="text"
                              autoFocus
                              value={cert.issuer || ''}
                              onChange={(e) => updateCertField(certIdx, 'issuer', e.target.value)}
                              onBlur={() => setEditingId(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                              placeholder="Issuing Organization"
                              className="text-xs text-indigo-600 px-2 py-0.5 rounded border border-indigo-500 bg-white outline-none"
                            />
                          ) : (
                            <span
                              onClick={() => setEditingId(`cert-iss-${certIdx}`)}
                              title="Click to edit issuer"
                              className="text-indigo-600 cursor-pointer hover:underline"
                            >
                              {cert.issuer ? `– ${cert.issuer}` : '(+ Issuer)'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {editingId === `cert-yr-${certIdx}` ? (
                            <input
                              type="text"
                              autoFocus
                              value={cert.year || ''}
                              onChange={(e) => updateCertField(certIdx, 'year', e.target.value)}
                              onBlur={() => setEditingId(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                              placeholder="Year"
                              className="text-xs text-slate-500 px-2 py-0.5 rounded border border-indigo-500 bg-white outline-none w-16"
                            />
                          ) : (
                            <span
                              onClick={() => setEditingId(`cert-yr-${certIdx}`)}
                              title="Click to edit year"
                              className="text-xs text-slate-500 cursor-pointer hover:text-slate-800"
                            >
                              {cert.year || ''}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => removeCertItem(certIdx)}
                            className="opacity-0 group-hover/cert:opacity-100 text-slate-300 hover:text-rose-600 transition-opacity p-0.5 cursor-pointer"
                            title="Delete certification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : (
            <section className="text-center py-2">
              <button
                type="button"
                onClick={addCertItem}
                className="text-xs text-slate-400 hover:text-indigo-600 italic cursor-pointer"
              >
                + Add Certifications / Achievements section
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
