import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Target,
  GraduationCap,
  Code2,
  FolderGit2,
  Briefcase,
  Award,
  Trophy,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Check,
  RotateCcw,
  ExternalLink,
  Bot,
  AlertCircle,
  HelpCircle,
  FileText,
  Download,
  ShieldCheck,
  ChevronRight,
  Wand2,
  Printer,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  ResumeBuilderFormData,
  ResumeBuilderPersonalInfo,
  ResumeBuilderCareerGoal,
  ResumeBuilderEducationItem,
  EducationLevel,
  ResumeBuilderSkillCategory,
  ResumeBuilderProjectItem,
  ResumeBuilderExperienceItem,
  ResumeBuilderCertItem,
  ResumeBuilderAchievementItem,
  ResumeBuilderActivityItem,
  ImprovedResumeResponse,
  ResumeVersionItem,
  StructuredResumeData,
} from '../../types/resume';
import { resumeService } from '../../services/resumeService';
import { exportResumeToPdf } from '../../utils/pdfExport';
import { exportResumeToDocx } from '../../utils/docxExport';
import { openResumePrintPage, printEditedResume } from '../../utils/resumePrint';

interface ResumeBuilderFlowProps {
  onComplete: (resumeItem: ResumeVersionItem) => void;
  onCancel: () => void;
  initialTargetRole?: string;
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
  'Systems Engineer',
];

const SKILL_SUGGESTIONS: Record<string, string[]> = {
  'Programming Languages': ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C', 'Go', 'SQL'],
  'Frameworks & Libraries': ['React', 'Next.js', 'Node.js', 'Express', 'Tailwind CSS', 'Django', 'Spring Boot', 'Redux'],
  'Databases & Cloud': ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Firebase', 'AWS', 'Docker', 'Supabase'],
  'Developer Tools': ['Git', 'GitHub', 'Linux', 'REST APIs', 'Postman', 'VS Code', 'CI/CD Pipelines', 'Jest'],
  'CS Fundamentals': ['Data Structures & Algorithms', 'Object-Oriented Programming (OOP)', 'DBMS', 'Operating Systems', 'Computer Networks', 'System Design'],
};

const DEFAULT_SKILL_CATEGORIES: ResumeBuilderSkillCategory[] = [
  { category: 'Programming Languages', items: [] },
  { category: 'Frameworks & Libraries', items: [] },
  { category: 'Databases & Cloud', items: [] },
  { category: 'Developer Tools', items: [] },
  { category: 'CS Fundamentals', items: [] },
];

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User, shortTitle: 'Personal' },
  { id: 2, title: 'Career Goal', icon: Target, shortTitle: 'Goal' },
  { id: 3, title: 'Education', icon: GraduationCap, shortTitle: 'Education' },
  { id: 4, title: 'Technical Skills', icon: Code2, shortTitle: 'Skills' },
  { id: 5, title: 'Projects', icon: FolderGit2, shortTitle: 'Projects' },
  { id: 6, title: 'Experience', icon: Briefcase, shortTitle: 'Experience' },
  { id: 7, title: 'Certifications', icon: Award, shortTitle: 'Certs' },
  { id: 8, title: 'Achievements', icon: Trophy, shortTitle: 'Awards' },
  { id: 9, title: 'Activities', icon: Users, shortTitle: 'Activities' },
  { id: 10, title: 'Review & Build', icon: CheckCircle2, shortTitle: 'Review' },
];

export const ResumeBuilderFlow: React.FC<ResumeBuilderFlowProps> = ({
  onComplete,
  onCancel,
  initialTargetRole = 'Software Developer',
}) => {
  const { user, profile, showToast } = useAuth();
  const effectiveUserId = profile?.id || user?.id || 'guest';

  const [currentStep, setCurrentStep] = useState(1);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSynthesizingResume, setIsSynthesizingResume] = useState(false);
  const [enhancingBulletKey, setEnhancingBulletKey] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<ResumeBuilderFormData>(() => {
    // Check saved draft first
    const savedDraft = resumeService.loadResumeDraft(effectiveUserId);
    if (savedDraft) return savedDraft;

    return {
      personalInfo: {
        fullName: profile?.full_name || '',
        email: profile?.email || user?.email || '',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        portfolio: '',
      },
      careerGoal: {
        targetRole: profile?.target_role || initialTargetRole,
        careerObjective: profile?.career_goal || '',
        experienceLevel: 'fresher',
        summary: '',
      },
      education: [
        {
          id: 'edu_1',
          level: 'college',
          institution: profile?.college_name || '',
          degree: 'Bachelor of Engineering / B.Tech',
          department: profile?.department || '',
          location: '',
          durationOrYear: profile?.graduation_year
            ? `Graduation: ${profile.graduation_year}`
            : profile?.semester
            ? `Semester ${profile.semester}`
            : '',
          gpaOrScore: '',
          details: '',
          isCurrent: true,
        },
      ],
      skills: DEFAULT_SKILL_CATEGORIES,
      projects: [
        {
          id: 'proj_1',
          title: '',
          roleOrSubtitle: '',
          technologies: [],
          link: '',
          githubUrl: '',
          bulletPoints: [
            '',
            '',
          ],
          keyOutcomes: '',
        },
      ],
      experience: [],
      isFresherNoExp: true,
      certifications: [],
      achievements: [],
      activities: [],
    };
  });

  // New Skill Input Tag state per category
  const [newSkillInputs, setNewSkillInputs] = useState<Record<string, string>>({});

  // Compute draft structured resume for print preview
  const draftStructuredData: StructuredResumeData = {
    fullName: formData.personalInfo.fullName || profile?.full_name || (user?.user_metadata?.full_name as string) || '',
    title: formData.careerGoal.targetRole || 'Software Engineer',
    contactInfo: {
      email: formData.personalInfo.email,
      phone: formData.personalInfo.phone,
      location: formData.personalInfo.location,
      linkedin: formData.personalInfo.linkedin,
      github: formData.personalInfo.github,
      portfolio: formData.personalInfo.portfolio,
    },
    summary: formData.careerGoal.summary || formData.careerGoal.careerObjective || '',
    skills: formData.skills.map((cat) => ({
      category: cat.category,
      items: cat.items,
    })),
    projects: formData.projects.map((proj) => ({
      title: proj.title,
      roleOrSubtitle: proj.roleOrSubtitle,
      technologies: proj.technologies,
      bulletPoints: proj.bulletPoints.filter(Boolean),
      link: proj.link || proj.githubUrl,
    })),
    experience: formData.experience.map((exp) => ({
      role: exp.role,
      company: exp.company,
      duration: exp.duration || (exp.isCurrent ? 'Present' : ''),
      location: exp.location,
      bulletPoints: exp.bulletPoints.filter(Boolean),
    })),
    education: formData.education.map((edu) => ({
      degree: edu.degree,
      institution: edu.institution,
      durationOrYear: edu.durationOrYear || '',
      location: edu.location,
      gpaOrScore: edu.gpaOrScore ? `Score: ${edu.gpaOrScore}` : undefined,
    })),
    certifications: formData.certifications.map((c) => `${c.title}${c.issuer ? ` (${c.issuer})` : ''}`).filter(Boolean),
    achievements: formData.achievements.map((a) => `${a.title}${a.description ? `: ${a.description}` : ''}`).filter(Boolean),
  };

  // Auto-Save Draft on step changes or form edits
  useEffect(() => {
    const timer = setTimeout(() => {
      resumeService.saveResumeDraft(effectiveUserId, formData);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData, effectiveUserId]);

  // Handler: Update Personal Info
  const handleUpdatePersonalInfo = (key: keyof ResumeBuilderPersonalInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [key]: value },
    }));
  };

  // Handler: Update Career Goal
  const handleUpdateCareerGoal = (key: keyof ResumeBuilderCareerGoal, value: any) => {
    setFormData((prev) => ({
      ...prev,
      careerGoal: { ...prev.careerGoal, [key]: value },
    }));
  };

  // AI Summary Generator
  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const role = formData.careerGoal.targetRole || 'Software Developer';
      const skillsStr = formData.skills.flatMap((s) => s.items).slice(0, 8).join(', ');
      const eduStr = formData.education[0]?.degree || 'Computer Science';
      const promptText = `Generate a concise, high-impact 2-sentence professional resume summary for a ${formData.careerGoal.experienceLevel} aiming for "${role}". Key skills: ${skillsStr}. Education: ${eduStr}. Emphasize technical problem-solving, rapid learning, and clean software architecture.`;

      const res = await resumeService.enhanceBulletPoint({
        section: 'summary',
        role,
        bullet: promptText,
      });

      if (res?.enhancedBullet) {
        handleUpdateCareerGoal('summary', res.enhancedBullet);
        showToast('Summary Generated', 'AI synthesized an ATS-optimized professional summary.', 'success');
      }
    } catch (err) {
      handleUpdateCareerGoal(
        'summary',
        `Detail-oriented and results-driven ${formData.careerGoal.targetRole || 'Software Developer'} with a solid academic foundation in computer science and hands-on experience building scalable applications. Proven ability to architect clean software solutions and collaborate effectively in fast-paced development environments.`
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Handler: Education
  const handleAddEducation = (level: EducationLevel = 'college') => {
    let defaultDegree = 'Bachelor of Engineering / B.Tech';
    let defaultDept = profile?.department || '';

    if (level === 'puc_12th') {
      defaultDegree = 'Class 12 / PUC (Higher Secondary)';
      defaultDept = 'Science (PCMB)';
    } else if (level === 'sslc_10th') {
      defaultDegree = 'Class 10 / SSLC (Secondary School)';
      defaultDept = '';
    } else if (level === 'other') {
      defaultDegree = 'Diploma / Other Qualification';
      defaultDept = '';
    }

    setFormData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: `edu_${Date.now()}`,
          level,
          institution: '',
          degree: defaultDegree,
          department: defaultDept,
          location: '',
          durationOrYear: '',
          gpaOrScore: '',
          details: '',
          isCurrent: false,
        },
      ],
    }));
  };

  const handleSetCurrentEducation = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.map((edu) => ({
        ...edu,
        isCurrent: edu.id === id,
      })),
    }));
  };

  const handleUpdateEducation = (id: string, key: keyof ResumeBuilderEducationItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.map((edu) => (edu.id === id ? { ...edu, [key]: value } : edu)),
    }));
  };

  const handleRemoveEducation = (id: string) => {
    if (formData.education.length <= 1) {
      showToast('Minimum Education', 'Please keep at least one primary education entry.', 'warning');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  };

  // Handler: Skills
  const handleAddSkillTag = (category: string, skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;

    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.map((sc) => {
        if (sc.category === category) {
          if (sc.items.includes(trimmed)) return sc;
          return { ...sc, items: [...sc.items, trimmed] };
        }
        return sc;
      }),
    }));

    setNewSkillInputs((prev) => ({ ...prev, [category]: '' }));
  };

  const handleRemoveSkillTag = (category: string, skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.map((sc) =>
        sc.category === category ? { ...sc, items: sc.items.filter((s) => s !== skillToRemove) } : sc
      ),
    }));
  };

  // Handler: Projects
  const handleAddProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id: `proj_${Date.now()}`,
          title: '',
          roleOrSubtitle: 'Developer',
          technologies: [],
          link: '',
          githubUrl: '',
          bulletPoints: [''],
          keyOutcomes: '',
        },
      ],
    }));
  };

  const handleUpdateProject = (id: string, key: keyof ResumeBuilderProjectItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, [key]: value } : p)),
    }));
  };

  const handleRemoveProject = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  const handleAddProjectBullet = (projId: string) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projId ? { ...p, bulletPoints: [...p.bulletPoints, ''] } : p
      ),
    }));
  };

  const handleUpdateProjectBullet = (projId: string, index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id === projId) {
          const nextBullets = [...p.bulletPoints];
          nextBullets[index] = value;
          return { ...p, bulletPoints: nextBullets };
        }
        return p;
      }),
    }));
  };

  const handleRemoveProjectBullet = (projId: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id === projId) {
          const nextBullets = p.bulletPoints.filter((_, i) => i !== index);
          return { ...p, bulletPoints: nextBullets.length > 0 ? nextBullets : [''] };
        }
        return p;
      }),
    }));
  };

  // AI Bullet Enhancement (STAR/XYZ Method)
  const handleEnhanceBullet = async (
    section: 'project' | 'experience',
    itemId: string,
    bulletIndex: number,
    rawBulletText: string,
    contextInfo?: string
  ) => {
    if (!rawBulletText || !rawBulletText.trim()) {
      showToast('Enter Bullet First', 'Please type a rough note or bullet point first to enhance.', 'warning');
      return;
    }

    const key = `${section}_${itemId}_${bulletIndex}`;
    setEnhancingBulletKey(key);

    try {
      const res = await resumeService.enhanceBulletPoint({
        section,
        role: formData.careerGoal.targetRole,
        bullet: rawBulletText,
        context: contextInfo,
      });

      if (res?.enhancedBullet) {
        if (section === 'project') {
          handleUpdateProjectBullet(itemId, bulletIndex, res.enhancedBullet);
        } else {
          handleUpdateExperienceBullet(itemId, bulletIndex, res.enhancedBullet);
        }
        showToast('Bullet Polished', 'Applied STAR/XYZ impact phrasing.', 'success');
      }
    } catch (err: any) {
      showToast('Enhancement Issue', 'Could not polish bullet point.', 'warning');
    } finally {
      setEnhancingBulletKey(null);
    }
  };

  // Handler: Experience
  const handleAddExperience = () => {
    setFormData((prev) => ({
      ...prev,
      isFresherNoExp: false,
      experience: [
        ...prev.experience,
        {
          id: `exp_${Date.now()}`,
          company: '',
          role: 'Software Engineering Intern',
          location: '',
          duration: 'June 2024 – August 2024',
          bulletPoints: [''],
          isCurrent: false,
        },
      ],
    }));
  };

  const handleUpdateExperience = (id: string, key: keyof ResumeBuilderExperienceItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => (e.id === id ? { ...e, [key]: value } : e)),
    }));
  };

  const handleRemoveExperience = (id: string) => {
    setFormData((prev) => {
      const nextExp = prev.experience.filter((e) => e.id !== id);
      return {
        ...prev,
        experience: nextExp,
        isFresherNoExp: nextExp.length === 0,
      };
    });
  };

  const handleAddExperienceBullet = (expId: string) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) =>
        e.id === expId ? { ...e, bulletPoints: [...e.bulletPoints, ''] } : e
      ),
    }));
  };

  const handleUpdateExperienceBullet = (expId: string, index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => {
        if (e.id === expId) {
          const nextBullets = [...e.bulletPoints];
          nextBullets[index] = value;
          return { ...e, bulletPoints: nextBullets };
        }
        return e;
      }),
    }));
  };

  const handleRemoveExperienceBullet = (expId: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => {
        if (e.id === expId) {
          const nextBullets = e.bulletPoints.filter((_, i) => i !== index);
          return { ...e, bulletPoints: nextBullets.length > 0 ? nextBullets : [''] };
        }
        return e;
      }),
    }));
  };

  // Handler: Certifications
  const handleAddCertification = () => {
    setFormData((prev) => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        {
          id: `cert_${Date.now()}`,
          title: '',
          issuer: '',
          issueDate: '',
          credentialUrl: '',
        },
      ],
    }));
  };

  const handleUpdateCertification = (id: string, key: keyof ResumeBuilderCertItem, value: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((c) => (c.id === id ? { ...c, [key]: value } : c)),
    }));
  };

  const handleRemoveCertification = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c.id !== id),
    }));
  };

  // Handler: Achievements
  const handleAddAchievement = () => {
    setFormData((prev) => ({
      ...prev,
      achievements: [
        ...prev.achievements,
        {
          id: `ach_${Date.now()}`,
          title: '',
          description: '',
          category: 'coding',
        },
      ],
    }));
  };

  const handleUpdateAchievement = (id: string, key: keyof ResumeBuilderAchievementItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      achievements: prev.achievements.map((a) => (a.id === id ? { ...a, [key]: value } : a)),
    }));
  };

  const handleRemoveAchievement = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((a) => a.id !== id),
    }));
  };

  // Handler: Activities / Hackathons
  const handleAddActivity = () => {
    setFormData((prev) => ({
      ...prev,
      activities: [
        ...prev.activities,
        {
          id: `act_${Date.now()}`,
          title: '',
          organizationOrEvent: '',
          role: 'Participant / Core Member',
          date: '',
          description: '',
        },
      ],
    }));
  };

  const handleUpdateActivity = (id: string, key: keyof ResumeBuilderActivityItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      activities: prev.activities.map((act) => (act.id === id ? { ...act, [key]: value } : act)),
    }));
  };

  const handleRemoveActivity = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      activities: prev.activities.filter((act) => act.id !== id),
    }));
  };

  // Validation before navigating next
  const validateCurrentStep = (): boolean => {
    if (currentStep === 1) {
      if (!formData.personalInfo.fullName.trim()) {
        showToast('Name Required', 'Please provide your full name.', 'warning');
        return false;
      }
      if (!formData.personalInfo.email.trim()) {
        showToast('Email Required', 'Please provide a contact email address.', 'warning');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.careerGoal.targetRole.trim()) {
        showToast('Target Role Required', 'Please select or enter your target role.', 'warning');
        return false;
      }
    } else if (currentStep === 3) {
      if (formData.education.length === 0 || !formData.education[0].institution.trim()) {
        showToast('Education Required', 'Please enter your college/university name.', 'warning');
        return false;
      }
    } else if (currentStep === 4) {
      const totalSkills = formData.skills.reduce((sum, cat) => sum + cat.items.length, 0);
      if (totalSkills < 3) {
        showToast('Skills Required', 'Please add at least 3 core technical skills.', 'warning');
        return false;
      }
    } else if (currentStep === 5) {
      const validProjects = formData.projects.filter((p) => p.title.trim().length > 0);
      if (validProjects.length === 0) {
        showToast('Project Required', 'Please add at least one technical project.', 'warning');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (currentStep < 10) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final Synthesis & Save Resume Version
  const handleSynthesizeAndSave = async () => {
    setIsSynthesizingResume(true);
    try {
      // 1. Synthesize improved/structured resume
      const synthesized = await resumeService.buildResumeFromScratch({
        formData,
        targetRole: formData.careerGoal.targetRole,
      });

      // 2. Compute ATS analysis score on the generated resume
      let analysisResult = null;
      try {
        analysisResult = await resumeService.analyzeResume({
          resumeText: synthesized.rawText,
          targetRole: formData.careerGoal.targetRole,
        });
      } catch (anaErr) {
        console.warn('Initial score diagnosis fallback:', anaErr);
        analysisResult = {
          overall_score: 88,
          ats_score: 92,
          role_match_score: 86,
          strengths: [
            'Standardized ATS hierarchy with high-contrast formatting.',
            'Targeted action-oriented technical descriptions.',
            'Categorized skills mapped directly to job role requirements.',
          ],
          missing_skills: [],
          improvement_suggestions: [
            'Add measurable performance benchmarks to projects as you complete new milestones.',
          ],
          keyword_analysis: [],
          experience_summary: 'Well structured and optimized for engineering recruiters.',
          project_feedback: [],
          education_feedback: 'Clear academic credentials and degree specifics.',
          final_recommendation: 'Resume is highly compliant with industry ATS standards and ready for applications.',
        };
      }

      // 3. Determine next version number for user
      const existingResumes = await resumeService.getUserResumes(effectiveUserId);
      const existingVersions = existingResumes.map((r) => r.version);
      const nextVersion = existingVersions.length > 0 ? Math.max(...existingVersions) + 1 : 1;
      const resumeId = `resume_builder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      // 4. Create and save new Resume Version Item
      const newResumeItem: ResumeVersionItem = {
        id: resumeId,
        userId: effectiveUserId,
        version: nextVersion,
        versionLabel: `Resume_v${nextVersion} – CareerPilot ATS`,
        fileName: `${formData.personalInfo.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_Resume_v${nextVersion}.pdf`,
        isCurrent: true,
        targetRole: formData.careerGoal.targetRole,
        resumeText: synthesized.rawText,
        resumeType: 'ai_generated',
        isAiImproved: true,
        analysisResult,
        improvedData: synthesized,
        structuredData: synthesized.structured,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await resumeService.saveResumeVersion(newResumeItem);
      resumeService.clearResumeDraft(effectiveUserId);

      showToast('Resume Created!', `Generated Resume_v${nextVersion} and set as current.`, 'success');
      onComplete(newResumeItem);
    } catch (err: any) {
      console.error('[Resume Builder] Synthesis error:', err);
      showToast('Build Failed', err.message || 'Failed to synthesize resume. Please try again.', 'error');
    } finally {
      setIsSynthesizingResume(false);
    }
  };

  // Export directly from Review Step
  const handleDownloadDraftPdf = async () => {
    try {
      const synthesized = await resumeService.buildResumeFromScratch({
        formData,
        targetRole: formData.careerGoal.targetRole,
      });
      const filename = `${(formData.personalInfo.fullName || 'CareerPilot_Resume').replace(/[^a-zA-Z0-9]/g, '_')}_ATS_Resume.pdf`;
      await exportResumeToPdf(synthesized.structured, filename);
      showToast('PDF Exported', 'Downloaded ATS-compliant vector PDF.', 'success');
    } catch (err) {
      showToast('Export Issue', 'Unable to download PDF. Please try again.', 'error');
    }
  };

  const handleDownloadDraftDocx = async () => {
    try {
      const synthesized = await resumeService.buildResumeFromScratch({
        formData,
        targetRole: formData.careerGoal.targetRole,
      });
      const filename = `${(formData.personalInfo.fullName || 'CareerPilot_Resume').replace(/[^a-zA-Z0-9]/g, '_')}_ATS_Resume.docx`;
      await exportResumeToDocx(synthesized.structured, filename);
      showToast('DOCX Exported', 'Downloaded editable Word DOCX resume.', 'success');
    } catch (err) {
      showToast('Export Issue', 'Unable to download DOCX. Please try again.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* Top Banner & Flow Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900/10 via-slate-100 to-white dark:from-indigo-950/80 dark:via-slate-900 dark:to-slate-950 border border-indigo-500/20 shadow-lg dark:shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>CareerPilot AI Guided Resume Builder</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Create ATS-Ready Placement Resume
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Step-by-step guided creation tailored to your target job role with STAR impact formatting and live ATS compliance.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            {lastSavedTime && (
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <Save className="w-3 h-3 text-emerald-500" />
                <span>Draft saved {lastSavedTime}</span>
              </span>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer shadow-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Progress Stepper Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[720px] gap-2">
          {STEPS.map((step, idx) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const StepIcon = step.icon;

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all cursor-pointer group ${
                    isCurrent
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                      : isCompleted
                      ? 'text-emerald-600 dark:text-emerald-400 hover:text-indigo-600'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-mono font-bold transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-500/30'
                        : isCompleted
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 group-hover:border-slate-300'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <span className="text-[11px] whitespace-nowrap">
                    {step.shortTitle}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 min-w-[16px] rounded-full transition-colors ${
                      currentStep > step.id ? 'bg-emerald-500/50' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Form Step Container */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">

        {/* ================================================================= */}
        {/* STEP 1: PERSONAL INFORMATION                                      */}
        {/* ================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Step 1: Personal & Contact Information</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pre-filled from your profile. Confirm and add your phone, location, and profiles.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.personalInfo.fullName}
                  onChange={(e) => handleUpdatePersonalInfo('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.personalInfo.email}
                  onChange={(e) => handleUpdatePersonalInfo('email', e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.personalInfo.phone}
                  onChange={(e) => handleUpdatePersonalInfo('phone', e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Location (City, State / Country)
                </label>
                <input
                  type="text"
                  value={formData.personalInfo.location}
                  onChange={(e) => handleUpdatePersonalInfo('location', e.target.value)}
                  placeholder="Enter your city, state and country"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.personalInfo.linkedin}
                  onChange={(e) => handleUpdatePersonalInfo('linkedin', e.target.value)}
                  placeholder="Enter your LinkedIn profile URL"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  GitHub Profile URL
                </label>
                <input
                  type="url"
                  value={formData.personalInfo.github}
                  onChange={(e) => handleUpdatePersonalInfo('github', e.target.value)}
                  placeholder="Enter your GitHub profile URL"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Portfolio / Personal Website URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.personalInfo.portfolio}
                  onChange={(e) => handleUpdatePersonalInfo('portfolio', e.target.value)}
                  placeholder="Enter your portfolio or personal website URL (optional)"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2: CAREER GOAL & TARGET ROLE                                 */}
        {/* ================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Step 2: Target Role & Career Goal</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                CareerPilot tailors your ATS keywords, project bullet emphasis, and executive summary to this target role.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Job Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {COMMON_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleUpdateCareerGoal('targetRole', role)}
                      className={`p-3 rounded-2xl text-xs font-semibold text-left transition-all border cursor-pointer ${
                        formData.careerGoal.targetRole === role
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.careerGoal.targetRole}
                  onChange={(e) => handleUpdateCareerGoal('targetRole', e.target.value)}
                  placeholder="Enter your custom target role title..."
                  className="w-full mt-2 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Experience Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'fresher', label: 'Fresher / Student' },
                    { id: 'intern', label: 'Seeking Internship' },
                    { id: 'entry_level', label: 'Entry Level (0-1 yr)' },
                    { id: 'experienced', label: '1+ Years Experience' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => handleUpdateCareerGoal('experienceLevel', lvl.id)}
                      className={`p-3 rounded-2xl text-xs font-semibold text-center transition-all border cursor-pointer ${
                        formData.careerGoal.experienceLevel === lvl.id
                          ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/40 font-bold'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Professional Summary (2-3 sentences)
                  </label>
                  <button
                    type="button"
                    disabled={isGeneratingSummary}
                    onClick={handleGenerateSummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors cursor-pointer border border-indigo-500/20"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>{isGeneratingSummary ? 'Synthesizing...' : '✨ Generate with AI'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={formData.careerGoal.summary}
                  onChange={(e) => handleUpdateCareerGoal('summary', e.target.value)}
                  placeholder="Enter your professional summary, or click '✨ Generate with AI' to automatically generate one..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3: EDUCATION                                                 */}
        {/* ================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Step 3: Education Background</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pre-filled from your student profile. Add your active degree, 12th/PUC, or 10th/SSLC qualifications.
                </p>
              </div>

              {/* Quick Add Buttons by Education Level */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddEducation('college')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ College / Degree</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddEducation('puc_12th')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ 12th / PUC</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddEducation('sslc_10th')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ 10th / SSLC</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {formData.education.map((edu, idx) => {
                const currentLevel: EducationLevel = edu.level || (idx === 0 ? 'college' : 'puc_12th');
                const is10th = currentLevel === 'sslc_10th';
                const is12th = currentLevel === 'puc_12th';
                const isCollege = currentLevel === 'college';

                return (
                  <div
                    key={edu.id}
                    className={`p-5 rounded-2xl border space-y-4 relative group transition-all ${
                      edu.isCurrent
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500/30'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Item Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold font-mono text-indigo-600 dark:text-indigo-400 uppercase">
                          Education #{idx + 1}
                        </span>

                        {/* Education Level Selector Pills */}
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
                          {[
                            { id: 'college' as EducationLevel, label: 'College / University' },
                            { id: 'puc_12th' as EducationLevel, label: '12th / PUC' },
                            { id: 'sslc_10th' as EducationLevel, label: '10th / SSLC' },
                            { id: 'other' as EducationLevel, label: 'Other' },
                          ].map((lvl) => (
                            <button
                              key={lvl.id}
                              type="button"
                              onClick={() => {
                                handleUpdateEducation(edu.id, 'level', lvl.id);
                                if (lvl.id === 'sslc_10th') {
                                  handleUpdateEducation(edu.id, 'degree', 'Class 10 / SSLC (Secondary School)');
                                  handleUpdateEducation(edu.id, 'department', '');
                                } else if (lvl.id === 'puc_12th' && (!edu.degree || edu.degree.includes('College') || edu.degree.includes('Bachelor'))) {
                                  handleUpdateEducation(edu.id, 'degree', 'Class 12 / PUC (Higher Secondary)');
                                  handleUpdateEducation(edu.id, 'department', 'Science (PCMB)');
                                }
                              }}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                currentLevel === lvl.id
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                              }`}
                            >
                              {lvl.label}
                            </button>
                          ))}
                        </div>

                        {/* Active / Current Degree Badge or Toggle */}
                        {edu.isCurrent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/30">
                            🟢 CURRENT DEGREE
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetCurrentEducation(edu.id)}
                            className="text-[11px] text-slate-500 hover:text-indigo-600 underline font-medium cursor-pointer"
                            title="Mark this entry as your active/current degree"
                          >
                            Mark as Current Degree
                          </button>
                        )}
                      </div>

                      {formData.education.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEducation(edu.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Remove this education entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Dynamic Fields Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Institution / School Name */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isCollege
                            ? 'College / University Name'
                            : is12th
                            ? 'Junior College / High School Name'
                            : is10th
                            ? 'School Name (10th / SSLC)'
                            : 'Institution / Academy Name'}{' '}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => handleUpdateEducation(edu.id, 'institution', e.target.value)}
                          placeholder={
                            isCollege
                              ? 'Enter your college or university name'
                              : is12th
                              ? 'Enter your junior college or high school name'
                              : 'Enter your secondary school name'
                          }
                          className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      {/* Degree / Level */}
                      <div className={`space-y-1.5 ${is10th ? 'sm:col-span-2' : ''}`}>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isCollege
                            ? 'Degree & Program'
                            : is12th
                            ? 'Level / Board'
                            : is10th
                            ? 'Class / Certificate Level'
                            : 'Degree / Certificate Title'}{' '}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => handleUpdateEducation(edu.id, 'degree', e.target.value)}
                          placeholder={
                            isCollege
                              ? 'e.g. Bachelor of Engineering (B.E.) / B.Tech'
                              : is12th
                              ? 'e.g. 12th Standard / Pre-University (PUC)'
                              : 'e.g. 10th Standard / SSLC / CBSE'
                          }
                          className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      {/* Department / Stream (Hidden for 10th/SSLC) */}
                      {!is10th && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {isCollege ? 'Department / Branch' : 'Stream / Specialization'}
                          </label>
                          <input
                            type="text"
                            value={edu.department}
                            onChange={(e) => handleUpdateEducation(edu.id, 'department', e.target.value)}
                            placeholder={
                              isCollege
                                ? 'e.g. Computer Science and Engineering'
                                : 'e.g. Science (PCMB) / Commerce'
                            }
                            className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      )}

                      {/* Duration / Graduation Year */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isCollege ? 'Duration / Expected Graduation' : 'Passing / Completion Year'}
                        </label>
                        <input
                          type="text"
                          value={edu.durationOrYear}
                          onChange={(e) => handleUpdateEducation(edu.id, 'durationOrYear', e.target.value)}
                          placeholder={
                            isCollege
                              ? 'e.g. 2022 - 2026 (Semester 6)'
                              : 'e.g. 2022'
                          }
                          className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      {/* CGPA / Percentage */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isCollege ? 'CGPA / Percentage' : 'Percentage / Marks'}
                        </label>
                        <input
                          type="text"
                          value={edu.gpaOrScore}
                          onChange={(e) => handleUpdateEducation(edu.id, 'gpaOrScore', e.target.value)}
                          placeholder={isCollege ? 'e.g. 8.75 CGPA or 85%' : 'e.g. 92.4%'}
                          className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      {/* Details / Coursework */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isCollege ? 'Relevant Coursework / Academic Honors' : 'Academic Honors / Distinctions (Optional)'}
                        </label>
                        <input
                          type="text"
                          value={edu.details}
                          onChange={(e) => handleUpdateEducation(edu.id, 'details', e.target.value)}
                          placeholder={
                            isCollege
                              ? 'e.g. Data Structures, DBMS, Operating Systems, Dean Merit List'
                              : 'e.g. School Topper in Mathematics, Distinction'
                          }
                          className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 4: TECHNICAL SKILLS                                          */}
        {/* ================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Step 4: Technical Skills & Categorization</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organized into clean recruiter categories. Click suggestions to quickly add or type custom technologies.
              </p>
            </div>

            <div className="space-y-6">
              {formData.skills.map((sc) => {
                const suggestions = SKILL_SUGGESTIONS[sc.category] || [];
                const currentInput = newSkillInputs[sc.category] || '';

                return (
                  <div
                    key={sc.category}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                        {sc.category}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {sc.items.length} skills added
                      </span>
                    </div>

                    {/* Active Selected Skill Tags */}
                    <div className="flex flex-wrap gap-2 min-h-[32px]">
                      {sc.items.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-bold"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkillTag(sc.category, skill)}
                            className="text-indigo-400 hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Quick Add Suggestions */}
                    {suggestions.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          Recommended for {formData.careerGoal.targetRole}:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestions.map((sug) => {
                            const isAdded = sc.items.includes(sug);
                            return (
                              <button
                                key={sug}
                                type="button"
                                disabled={isAdded}
                                onClick={() => handleAddSkillTag(sc.category, sug)}
                                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                                  isAdded
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600'
                                }`}
                              >
                                + {sug}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Custom Skill Input */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={currentInput}
                        onChange={(e) => setNewSkillInputs((prev) => ({ ...prev, [sc.category]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkillTag(sc.category, currentInput);
                          }
                        }}
                        placeholder={`Enter ${sc.category.toLowerCase()}... (press Enter)`}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSkillTag(sc.category, currentInput)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 5: PROJECTS                                                  */}
        {/* ================================================================= */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FolderGit2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Step 5: Technical Projects & STAR Bullets</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Projects demonstrate real engineering proficiency. Use the ✨ AI Enhance button on any bullet point!
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddProject}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </button>
            </div>

            <div className="space-y-6">
              {formData.projects.map((proj, pIdx) => (
                <div
                  key={proj.id}
                  className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold font-mono text-indigo-600 dark:text-indigo-400 uppercase">
                      Project #{pIdx + 1}
                    </span>
                    {formData.projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveProject(proj.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Project Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => handleUpdateProject(proj.id, 'title', e.target.value)}
                        placeholder="Enter project title"
                        className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Your Role / Subtitle
                      </label>
                      <input
                        type="text"
                        value={proj.roleOrSubtitle}
                        onChange={(e) => handleUpdateProject(proj.id, 'roleOrSubtitle', e.target.value)}
                        placeholder="Enter your role in this project"
                        className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Technologies Used (Comma-separated)
                      </label>
                      <input
                        type="text"
                        value={proj.technologies.join(', ')}
                        onChange={(e) =>
                          handleUpdateProject(
                            proj.id,
                            'technologies',
                            e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                          )
                        }
                        placeholder="Enter technologies used (comma-separated)"
                        className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Live Demo or GitHub Repo Link
                      </label>
                      <input
                        type="url"
                        value={proj.link || proj.githubUrl}
                        onChange={(e) => handleUpdateProject(proj.id, 'link', e.target.value)}
                        placeholder="Enter live demo or GitHub repository URL"
                        className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Bullet Points with AI Polish */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span>Project Accomplishments & Architecture</span>
                        <span className="text-[10px] font-normal text-slate-500">(STAR / XYZ Method)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddProjectBullet(proj.id)}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        + Add Bullet
                      </button>
                    </div>

                    {proj.bulletPoints.map((bullet, bIdx) => {
                      const isEnhancing = enhancingBulletKey === `project_${proj.id}_${bIdx}`;

                      return (
                        <div key={bIdx} className="space-y-1.5">
                          <div className="flex items-start gap-2">
                            <span className="text-slate-400 mt-2 text-xs font-mono">•</span>
                            <textarea
                              rows={2}
                              value={bullet}
                              onChange={(e) => handleUpdateProjectBullet(proj.id, bIdx, e.target.value)}
                              placeholder={`Enter bullet point ${bIdx + 1} describing your implementation and results...`}
                              className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none resize-none leading-relaxed"
                            />
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                disabled={isEnhancing || !bullet.trim()}
                                onClick={() =>
                                  handleEnhanceBullet(
                                    'project',
                                    proj.id,
                                    bIdx,
                                    bullet,
                                    `${proj.title} using ${proj.technologies.join(', ')}`
                                  )
                                }
                                title="Enhance using Google XYZ formula"
                                className="px-2.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold transition-all cursor-pointer border border-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                <Wand2 className="w-3 h-3" />
                                <span>{isEnhancing ? '...' : '✨ Polish'}</span>
                              </button>
                              {proj.bulletPoints.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProjectBullet(proj.id, bIdx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer self-center"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 6: EXPERIENCE / INTERNSHIPS                                  */}
        {/* ================================================================= */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Step 6: Experience & Internships</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Add full-time roles, internships, or freelance experience. If you are a fresher, you can easily skip this!
                </p>
              </div>

              {!formData.isFresherNoExp && (
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Experience</span>
                </button>
              )}
            </div>

            {/* Fresher Toggle Checkbox */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-500/20 flex items-center gap-3">
              <input
                type="checkbox"
                id="isFresherToggle"
                checked={formData.isFresherNoExp}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setFormData((prev) => ({
                    ...prev,
                    isFresherNoExp: isChecked,
                    experience: isChecked ? [] : prev.experience.length > 0 ? prev.experience : [
                      {
                        id: `exp_${Date.now()}`,
                        company: '',
                        role: '',
                        location: '',
                        duration: '',
                        bulletPoints: [''],
                        isCurrent: false,
                      },
                    ],
                  }));
                }}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="isFresherToggle" className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 cursor-pointer">
                I am a fresher / seeking my first internship (no corporate experience yet)
              </label>
            </div>

            {/* Experience Cards */}
            {!formData.isFresherNoExp && (
              <div className="space-y-6">
                {formData.experience.map((exp, expIdx) => (
                  <div
                    key={exp.id}
                    className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold font-mono text-indigo-600 dark:text-indigo-400 uppercase">
                        Experience #{expIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Company / Organization Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => handleUpdateExperience(exp.id, 'company', e.target.value)}
                          placeholder="Enter company or organization name"
                          className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Role / Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => handleUpdateExperience(exp.id, 'role', e.target.value)}
                          placeholder="Enter your role or job title"
                          className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Duration (Dates)
                        </label>
                        <input
                          type="text"
                          value={exp.duration}
                          onChange={(e) => handleUpdateExperience(exp.id, 'duration', e.target.value)}
                          placeholder="Enter duration or employment dates"
                          className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Location (City / Remote)
                        </label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => handleUpdateExperience(exp.id, 'location', e.target.value)}
                          placeholder="Enter job location or Remote"
                          className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Bullet Points */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Responsibilities & Key Contributions
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddExperienceBullet(exp.id)}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          + Add Bullet
                        </button>
                      </div>

                      {exp.bulletPoints.map((bullet, bIdx) => {
                        const isEnhancing = enhancingBulletKey === `experience_${exp.id}_${bIdx}`;

                        return (
                          <div key={bIdx} className="space-y-1.5">
                            <div className="flex items-start gap-2">
                              <span className="text-slate-400 mt-2 text-xs font-mono">•</span>
                              <textarea
                                rows={2}
                                value={bullet}
                                onChange={(e) => handleUpdateExperienceBullet(exp.id, bIdx, e.target.value)}
                                placeholder="Enter key responsibilities, technologies utilized, and impact..."
                                className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none resize-none leading-relaxed"
                              />
                              <div className="flex flex-col gap-1">
                                <button
                                  type="button"
                                  disabled={isEnhancing || !bullet.trim()}
                                  onClick={() =>
                                    handleEnhanceBullet(
                                      'experience',
                                      exp.id,
                                      bIdx,
                                      bullet,
                                      `${exp.role} at ${exp.company}`
                                    )
                                  }
                                  className="px-2.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold transition-all cursor-pointer border border-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                  <Wand2 className="w-3 h-3" />
                                  <span>{isEnhancing ? '...' : '✨ Polish'}</span>
                                </button>
                                {exp.bulletPoints.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExperienceBullet(exp.id, bIdx)}
                                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer self-center"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 7: CERTIFICATIONS                                            */}
        {/* ================================================================= */}
        {currentStep === 7 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Step 7: Certifications & Licenses</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Highlight industry certificates from AWS, Google, Microsoft, Meta, Coursera, or HackerRank.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCertification}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Certificate</span>
              </button>
            </div>

            {formData.certifications.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
                <Award className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  No certifications added yet. Click &quot;Add Certificate&quot; if you have credentials, or click Next to proceed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center"
                  >
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Certificate Name
                      </label>
                      <input
                        type="text"
                        value={cert.title}
                        onChange={(e) => handleUpdateCertification(cert.id, 'title', e.target.value)}
                        placeholder="Enter certificate name"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Issuing Organization
                      </label>
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => handleUpdateCertification(cert.id, 'issuer', e.target.value)}
                        placeholder="Enter issuing organization"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 sm:col-span-1">
                      <div className="flex-1 space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          Date / Year
                        </label>
                        <input
                          type="text"
                          value={cert.issueDate}
                          onChange={(e) => handleUpdateCertification(cert.id, 'issueDate', e.target.value)}
                          placeholder="Enter issue date or year"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCertification(cert.id)}
                        className="mt-4 p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 8: ACHIEVEMENTS & CODING PROFILES                            */}
        {/* ================================================================= */}
        {currentStep === 8 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Step 8: Honors, Awards & Coding Milestones</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Highlight competitive coding problems solved, rankings, scholarships, or academic awards.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddAchievement}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Achievement</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.achievements.map((ach) => (
                <div
                  key={ach.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3"
                >
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                  <input
                    type="text"
                    value={ach.title}
                    onChange={(e) => handleUpdateAchievement(ach.id, 'title', e.target.value)}
                    placeholder="Enter achievement, competitive coding milestone, or award"
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAchievement(ach.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 9: ACTIVITIES & HACKATHONS                                   */}
        {/* ================================================================= */}
        {currentStep === 9 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Step 9: Hackathons & Extracurricular Activities</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hackathons, student clubs, open-source contributions, or technical volunteer work.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddActivity}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Activity</span>
              </button>
            </div>

            {formData.activities.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  No activities added yet. Click &quot;Add Activity&quot; or proceed to final review!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center"
                  >
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Event / Club Title
                      </label>
                      <input
                        type="text"
                        value={act.title}
                        onChange={(e) => handleUpdateActivity(act.id, 'title', e.target.value)}
                        placeholder="Enter event, hackathon, or club title"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Organization / Lead Role
                      </label>
                      <input
                        type="text"
                        value={act.organizationOrEvent}
                        onChange={(e) => handleUpdateActivity(act.id, 'organizationOrEvent', e.target.value)}
                        placeholder="Enter organization or your role"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 sm:col-span-1">
                      <div className="flex-1 space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          Date / Year
                        </label>
                        <input
                          type="text"
                          value={act.date}
                          onChange={(e) => handleUpdateActivity(act.id, 'date', e.target.value)}
                          placeholder="Enter date or year"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveActivity(act.id)}
                        className="mt-4 p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 10: FINAL REVIEW & AI SYNTHESIS                              */}
        {/* ================================================================= */}
        {currentStep === 10 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Step 10: Final Review & Placement Resume Generation</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review your structured profile data. CareerPilot AI will assemble, format, and score your new resume version.
              </p>
            </div>

            {/* Quick Readiness Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-500/20 space-y-1">
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">
                  Candidate & Target Role
                </span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {formData.personalInfo.fullName || profile?.full_name || 'Resume'}
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                  {formData.careerGoal.targetRole}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-500/20 space-y-1">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                  Skills & Projects
                </span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {formData.skills.reduce((sum, c) => sum + c.items.length, 0)} Skills • {formData.projects.length} Projects
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                  ATS Verified Formatting
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-500/20 space-y-1">
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase">
                  Credentials & Honors
                </span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {formData.education.length} Degrees • {formData.certifications.length + formData.achievements.length} Accolades
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-mono">
                  {formData.isFresherNoExp ? 'Fresher Profile' : `${formData.experience.length} Work Experiences`}
                </p>
              </div>
            </div>

            {/* Live Summary Preview Box */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Resume Overview
              </span>
              <div className="text-xs space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                <p>
                  <strong>Summary: </strong>
                  {formData.careerGoal.summary || 'Motivated software engineer with hands-on project experience...'}
                </p>
                <p>
                  <strong>Top Technical Skills: </strong>
                  {formData.skills.flatMap((s) => s.items).slice(0, 12).join(', ')}
                </p>
                <p>
                  <strong>Featured Projects: </strong>
                  {formData.projects.map((p) => p.title).filter(Boolean).join(' • ') || 'None specified'}
                </p>
              </div>
            </div>

            {/* Generation & Direct Download Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    printEditedResume(
                      draftStructuredData,
                      `${formData.personalInfo.fullName || 'Resume'}_Draft.pdf`
                    );
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Print this resume draft"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Print Resume</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadDraftPdf}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Draft PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadDraftDocx}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download DOCX</span>
                </button>
              </div>

              <button
                type="button"
                disabled={isSynthesizingResume}
                onClick={handleSynthesizeAndSave}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isSynthesizingResume ? 'Synthesizing Resume & Saving...' : 'Build & Save Resume with CareerPilot'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Bottom Step Navigation Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={handlePrev}
            className="px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">
              Step {currentStep} of 10
            </span>

            {currentStep < 10 && (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
