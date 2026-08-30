/**
 * CareerPilot AI - Central Configuration & Social/Repository Links
 * 
 * Central source of truth for developer attribution, project repository,
 * social links, and product technology metadata.
 */

export const DEVELOPER_CONFIG = {
  name: 'Rashmi Chimmalagi',
  role: 'Student Developer / Full Stack Developer',
  projectName: 'CareerPilot AI',
  tagline: 'AI-Powered Career & Placement Copilot for Engineering Students',
  description:
    'Built as a learning-driven full-stack AI project focused on helping students prepare for careers through personalized guidance, practice, and progress tracking.',
  status: 'Actively Developing',
  projectYear: '2026',
};

// Configurable External URLs
// Uses environment variables if configured, with clean fallbacks
export const DEVELOPER_GITHUB_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEVELOPER_GITHUB_URL) ||
  'https://github.com/rashmichimmalagi';

export const PROJECT_GITHUB_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PROJECT_GITHUB_URL) ||
  'https://github.com/rashmichimmalagi/career-pilot-ai.git';

export const LINKEDIN_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LINKEDIN_URL) ||
  'https://www.linkedin.com/in/rashmi-chimmalagi/';

// Configurable Feedback / Suggestions URL (e.g. GitHub Issues or contact form)
export const FEEDBACK_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FEEDBACK_URL) ||
  `${PROJECT_GITHUB_URL}/issues`;

export interface TechStackItem {
  name: string;
  category: 'Frontend' | 'Backend' | 'Database & Auth' | 'AI & LLM' | 'Styling & UI' | 'Build & Tooling';
  description: string;
  badgeColor: string;
}

export const TECH_STACK: TechStackItem[] = [
  {
    name: 'React',
    category: 'Frontend',
    description: 'Component-driven UI architecture with modern hooks & reactive state',
    badgeColor: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
  },
  {
    name: 'TypeScript',
    category: 'Frontend',
    description: 'Strict type safety across domain models, APIs, and state layers',
    badgeColor: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
  },
  {
    name: 'Tailwind CSS',
    category: 'Styling & UI',
    description: 'Utility-first modern styling with full light/dark theme support',
    badgeColor: 'from-teal-500/20 to-cyan-500/20 text-teal-400 border-teal-500/30',
  },
  {
    name: 'Supabase',
    category: 'Database & Auth',
    description: 'PostgreSQL database, Row Level Security, and user authentication',
    badgeColor: 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30',
  },
  {
    name: 'Gemini / Google AI',
    category: 'AI & LLM',
    description: 'Intelligent resume analysis, mock interview feedback & coding mentors',
    badgeColor: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30',
  },
  {
    name: 'Express & Node.js',
    category: 'Backend',
    description: 'Server runtime with secure API proxying and execution sandbox',
    badgeColor: 'from-slate-500/20 to-slate-700/20 text-slate-300 border-slate-500/30',
  },
  {
    name: 'Vite',
    category: 'Build & Tooling',
    description: 'Next-generation lightning fast frontend build system',
    badgeColor: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
  },
];
