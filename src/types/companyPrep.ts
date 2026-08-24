export type CompanyTier =
  | 'Tier 1 Product'
  | 'Enterprise / Tech Giant'
  | 'Service / IT Consulting'
  | 'FinTech / High Frequency'
  | 'Startup / Unicorn'
  | 'Custom';

export interface HiringProcessRound {
  roundNumber: number;
  title: string;
  roundType: 'Online Assessment' | 'Technical Round 1' | 'Technical Round 2' | 'System Design' | 'Techno-Managerial' | 'HR / Behavioral';
  description: string;
  focusAreas: string[];
  duration?: string;
}

export interface CompanyWeights {
  resume: number; // e.g. 0.15
  coding: number; // e.g. 0.30
  aptitude: number; // e.g. 0.15
  technicalMcq: number; // e.g. 0.20
  interview: number; // e.g. 0.20
}

export interface CompanyProfile {
  id: string;
  name: string;
  tier: CompanyTier;
  logoText?: string;
  tagline: string;
  overview: string;
  headquarters?: string;
  hiringProcess: HiringProcessRound[];
  relevantSkills: string[];
  preparationWeights: CompanyWeights;
  recommendedTopics: {
    coding: string[];
    technicalMcqs: string[];
    aptitude: string[];
  };
  typicalDifficulty: 'Easy' | 'Medium' | 'Hard';
  isVerified: boolean;
  isCustom?: boolean;
  disclaimer?: string;
}

export type TargetRoleOption =
  | 'Software Developer'
  | 'Frontend Developer'
  | 'Backend Developer'
  | 'Full Stack Developer'
  | 'Data Analyst'
  | 'Data Scientist'
  | 'QA Engineer'
  | 'DevOps Engineer'
  | 'Cloud Engineer'
  | 'Custom';

export interface StudentTargetCompany {
  id: string;
  studentId: string;
  companyName: string;
  isCustomCompany: boolean;
  targetRole: string;
  isCustomRole: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryMetric {
  key: 'resume' | 'coding' | 'aptitude' | 'technicalMcq' | 'interview';
  title: string;
  score: number; // 0-100
  weight: number; // e.g. 0.25
  isAvailable: boolean;
  statusText: string;
  detailSummary: string;
  iconName: string;
  actionText: string;
  actionRoute: string;
}

export interface StrongAreaItem {
  id: string;
  title: string;
  category: string;
  scoreText: string;
  description: string;
  evidence?: string[];
  actionRoute?: string;
  actionParams?: Record<string, any>;
  actionText?: string;
  moduleName?: string;
}

export interface ImprovingAreaItem {
  id: string;
  title: string;
  category: string;
  scoreText: string;
  description: string;
  actionText?: string;
  actionRoute?: string;
  actionParams?: Record<string, any>;
}

export interface WeakAreaItem {
  id: string;
  title: string;
  category: 'coding' | 'aptitude' | 'technicalMcq' | 'interview' | 'hr-interview' | 'resume' | 'roadmap';
  subject: string;
  topic: string;
  reason: string;
  severity: 'high' | 'medium';
  actionText: string;
  actionRoute: string;
  actionParams?: Record<string, any>;
}

export type PriorityLevel = 'high' | 'medium' | 'recommended' | 'strong';
export type GapLifecycleStatus = 'OPEN' | 'IN PROGRESS' | 'IMPROVING' | 'RESOLVED';

export interface PreparationPriorityItem {
  id: string;
  priority: PriorityLevel;
  status?: GapLifecycleStatus;
  badgeLabel: string;
  title: string;
  area: string; // e.g. "DSA", "DBMS", "Aptitude", "Technical Interview", "HR Behavioral", "Resume"
  currentPerformance: string; // e.g. "58%", "65% (4 Solved)", "Not Started"
  currentScore?: number;
  reason: string; // e.g. "Your recent coding performance indicates that DSA needs additional practice for Google."
  recommendedAction: string; // e.g. "Practice Medium Array and Linked List problems."
  category: 'coding' | 'aptitude' | 'technicalMcq' | 'interview' | 'hr-interview' | 'resume' | 'roadmap';
  subject: string;
  topic: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  description: string;
  actionText: string;
  actionRoute: string;
  actionParams?: Record<string, any>;
  hasData?: boolean;
}

export interface CompanyReadinessAnalysis {
  studentId: string;
  company: CompanyProfile;
  targetRole: string;
  overallScore: number; // 0 - 100
  statusCategory: 'Getting Started' | 'Building Foundations' | 'Making Progress' | 'Placement Ready' | 'Highly Prepared';
  statusDescription: string;
  categories: {
    resume: CategoryMetric;
    coding: CategoryMetric;
    aptitude: CategoryMetric;
    technicalMcq: CategoryMetric;
    interview: CategoryMetric;
  };
  hasSufficientData: boolean;
  totalActivitiesCount: number;
  strongAreas: StrongAreaItem[];
  improvingAreas: ImprovingAreaItem[];
  weakAreas: WeakAreaItem[];
  priorities: PreparationPriorityItem[];
  formulaExplanation: string;
  analyzedAt: string;
}
