export interface ProjectFeedbackItem {
  name: string;
  strength: string;
  suggestion: string;
}

export interface KeywordAnalysisItem {
  keyword: string;
  matched: boolean;
  category?: string;
}

export interface ResumeAnalysisResult {
  overall_score: number;
  ats_score: number;
  role_match_score: number;
  strengths: string[];
  missing_skills: string[];
  improvement_suggestions: string[];
  keyword_analysis: KeywordAnalysisItem[];
  experience_summary: string;
  project_feedback: ProjectFeedbackItem[];
  education_feedback: string;
  final_recommendation: string;
}

export interface ResumeAnalysisPayload {
  resumeText: string;
  targetRole: string;
  pdfBase64?: string;
}

export type ResumeSectionType =
  | 'summary'
  | 'skills'
  | 'projects'
  | 'experience'
  | 'education'
  | 'certifications'
  | 'achievements';

export interface ResumeImprovementQuestion {
  id: string;
  question: string;
  section: ResumeSectionType;
  purpose: string;
  context?: string;
  placeholder?: string;
}

export interface ResumeQuestionAnswer {
  questionId: string;
  question: string;
  answer: string;
  section: ResumeSectionType;
  purpose: string;
  isSkipped?: boolean;
}

export interface StructuredResumeProject {
  title: string;
  roleOrSubtitle?: string;
  technologies?: string[];
  bulletPoints: string[];
  link?: string;
}

export interface StructuredResumeExperience {
  company: string;
  role: string;
  location?: string;
  duration?: string;
  bulletPoints: string[];
}

export interface StructuredResumeEducation {
  institution: string;
  degree: string;
  location?: string;
  durationOrYear?: string;
  gpaOrScore?: string;
  details?: string;
}

export interface StructuredResumeSkills {
  category: string;
  items: string[];
}

export interface StructuredResumeData {
  fullName: string;
  title: string;
  contactInfo: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary: string;
  skills: StructuredResumeSkills[];
  projects: StructuredResumeProject[];
  experience?: StructuredResumeExperience[];
  education: StructuredResumeEducation[];
  certifications?: string[];
  achievements?: string[];
}

export interface ImprovedResumeResponse {
  rawText: string;
  structured: StructuredResumeData;
  targetRole: string;
  keyEnhancements?: string[];
  keyEnhancementsApplied?: string[];
}

export interface ScoreComparisonMetrics {
  overall_score: number;
  ats_score: number;
  role_match_score: number;
}

export interface ResumeBeforeAfterComparison {
  before: ScoreComparisonMetrics | ResumeAnalysisResult;
  after: ScoreComparisonMetrics | ResumeAnalysisResult;
  overallScoreDiff: number;
  atsScoreDiff: number;
  roleMatchScoreDiff: number;
}

export interface ResumeVersionItem {
  id: string;
  userId: string;
  version: number;
  versionLabel: string;
  fileName: string;
  fileSize?: number;
  isCurrent: boolean;
  targetRole: string;
  createdAt: string;
  updatedAt: string;
  resumeText: string;
  fileUrl?: string;
  storagePath?: string;
  resumeType?: 'uploaded' | 'ai_generated';
  isAiImproved?: boolean;
  parentResumeId?: string;
  analysisResult?: ResumeAnalysisResult | null;
  improvedData?: ImprovedResumeResponse | null;
  comparisonData?: ResumeBeforeAfterComparison | null;
  studentAnswers?: ResumeQuestionAnswer[];
  structuredData?: StructuredResumeData | null;
}

// -------------------------------------------------------------
// CareerPilot Guided Resume Builder Types
// -------------------------------------------------------------

export interface ResumeBuilderPersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
}

export interface ResumeBuilderCareerGoal {
  targetRole: string;
  careerObjective: string;
  experienceLevel: 'fresher' | 'intern' | 'entry_level' | 'experienced';
  summary: string;
}

export type EducationLevel = 'college' | 'puc_12th' | 'sslc_10th' | 'other';

export interface ResumeBuilderEducationItem {
  id: string;
  level?: EducationLevel;
  institution: string;
  degree: string;
  department: string;
  location: string;
  durationOrYear: string;
  gpaOrScore: string;
  details: string;
  isCurrent?: boolean;
}

export interface ResumeBuilderSkillCategory {
  category: string;
  items: string[];
}

export interface ResumeBuilderProjectItem {
  id: string;
  title: string;
  roleOrSubtitle: string;
  technologies: string[];
  link: string;
  githubUrl: string;
  bulletPoints: string[];
  keyOutcomes?: string;
}

export interface ResumeBuilderExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  duration: string;
  isCurrent?: boolean;
  bulletPoints: string[];
  techStack?: string[];
}

export interface ResumeBuilderCertItem {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string;
}

export interface ResumeBuilderAchievementItem {
  id: string;
  title: string;
  description?: string;
  category?: 'coding' | 'academic' | 'hackathon' | 'leadership' | 'other';
}

export interface ResumeBuilderActivityItem {
  id: string;
  title: string;
  organizationOrEvent: string;
  role?: string;
  date?: string;
  description?: string;
}

export interface ResumeBuilderFormData {
  personalInfo: ResumeBuilderPersonalInfo;
  careerGoal: ResumeBuilderCareerGoal;
  education: ResumeBuilderEducationItem[];
  skills: ResumeBuilderSkillCategory[];
  projects: ResumeBuilderProjectItem[];
  experience: ResumeBuilderExperienceItem[];
  isFresherNoExp?: boolean;
  certifications: ResumeBuilderCertItem[];
  achievements: ResumeBuilderAchievementItem[];
  activities: ResumeBuilderActivityItem[];
}



