/**
 * CareerPilot AI - Static Offline Career & Developer Quotes Library
 * 
 * 100% static, local, and offline-capable. No network or AI API required.
 * Covers all required domains: Motivation, Learning, Coding, DSA, AI,
 * Web Development, React, TypeScript, Git & GitHub, Database, Supabase,
 * Software Development, Career, Interview Preparation, Consistency,
 * Problem Solving, and Projects.
 */

export interface OfflineQuote {
  id: string;
  category: OfflineQuoteCategory;
  categoryLabel: string;
  iconType: 'motivation' | 'learning' | 'coding' | 'dsa' | 'ai' | 'web' | 'react' | 'typescript' | 'git' | 'database' | 'career' | 'interview' | 'consistency' | 'problemsolving' | 'projects';
  quote: string;
  author?: string;
}

export type OfflineQuoteCategory =
  | 'Motivation'
  | 'Learning'
  | 'Coding'
  | 'DSA'
  | 'AI'
  | 'Web Development'
  | 'React'
  | 'TypeScript'
  | 'Git & GitHub'
  | 'Database'
  | 'Supabase'
  | 'Software Development'
  | 'Career'
  | 'Interview Preparation'
  | 'Consistency'
  | 'Problem Solving'
  | 'Projects';

export const OFFLINE_QUOTES: OfflineQuote[] = [
  // Motivation
  {
    id: 'mot-1',
    category: 'Motivation',
    categoryLabel: '🔥 MOTIVATION TIP',
    iconType: 'motivation',
    quote: 'Consistency beats intensity when you are building long-term engineering skills.',
    author: 'CareerPilot AI',
  },
  {
    id: 'mot-2',
    category: 'Motivation',
    categoryLabel: '🔥 MOTIVATION TIP',
    iconType: 'motivation',
    quote: 'Your career is built through small daily improvements repeated consistently.',
    author: 'CareerPilot AI',
  },
  {
    id: 'mot-3',
    category: 'Motivation',
    categoryLabel: '🔥 MOTIVATION TIP',
    iconType: 'motivation',
    quote: 'Don’t fear errors. Treat every stack trace as personalized feedback.',
    author: 'CareerPilot AI',
  },

  // Coding
  {
    id: 'cod-1',
    category: 'Coding',
    categoryLabel: '💻 CODING TIP',
    iconType: 'coding',
    quote: 'Every bug you fix is another step toward becoming a more resilient developer.',
    author: 'CareerPilot AI',
  },
  {
    id: 'cod-2',
    category: 'Coding',
    categoryLabel: '💻 CODING TIP',
    iconType: 'coding',
    quote: 'Good developers write code. Great developers understand why it works.',
    author: 'CareerPilot AI',
  },
  {
    id: 'cod-3',
    category: 'Coding',
    categoryLabel: '💻 CODING TIP',
    iconType: 'coding',
    quote: 'Strong developers aren’t those who never get stuck—they’re those who keep debugging.',
    author: 'CareerPilot AI',
  },

  // Learning
  {
    id: 'lrn-1',
    category: 'Learning',
    categoryLabel: '🧠 LEARNING TIP',
    iconType: 'learning',
    quote: 'Learn the concept. Build the feature. Debug the failure. Repeat.',
    author: 'CareerPilot AI',
  },
  {
    id: 'lrn-2',
    category: 'Learning',
    categoryLabel: '🧠 LEARNING TIP',
    iconType: 'learning',
    quote: 'Learning to debug is learning how to think systematically.',
    author: 'CareerPilot AI',
  },
  {
    id: 'lrn-3',
    category: 'Learning',
    categoryLabel: '🧠 LEARNING TIP',
    iconType: 'learning',
    quote: 'Progress comes from solving problems you could not solve yesterday.',
    author: 'CareerPilot AI',
  },

  // AI & Modern Tech
  {
    id: 'ai-1',
    category: 'AI',
    categoryLabel: '💡 AI DEVELOPMENT TIP',
    iconType: 'ai',
    quote: 'Don’t just use AI. Learn how to build with it and architect around it.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ai-2',
    category: 'AI',
    categoryLabel: '💡 AI DEVELOPMENT TIP',
    iconType: 'ai',
    quote: 'AI can accelerate learning, but foundational understanding creates lasting skill.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ai-3',
    category: 'AI',
    categoryLabel: '💡 AI DEVELOPMENT TIP',
    iconType: 'ai',
    quote: 'Pair AI assistance with strict type checking and manual code reviews.',
    author: 'CareerPilot AI',
  },

  // DSA
  {
    id: 'dsa-1',
    category: 'DSA',
    categoryLabel: '⚡ DATA STRUCTURES & ALGORITHMS',
    iconType: 'dsa',
    quote: 'Always clarify constraints and edge cases before writing your first loop.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dsa-2',
    category: 'DSA',
    categoryLabel: '⚡ DATA STRUCTURES & ALGORITHMS',
    iconType: 'dsa',
    quote: 'Master patterns over memorizing solutions: Two Pointers, Sliding Window, and BFS/DFS.',
    author: 'CareerPilot AI',
  },
  {
    id: 'dsa-3',
    category: 'DSA',
    categoryLabel: '⚡ DATA STRUCTURES & ALGORITHMS',
    iconType: 'dsa',
    quote: 'Analyze time and space complexity at each iteration. Optimize the bottleneck first.',
    author: 'CareerPilot AI',
  },

  // Git & GitHub
  {
    id: 'git-1',
    category: 'Git & GitHub',
    categoryLabel: '🐙 GIT & GITHUB TIP',
    iconType: 'git',
    quote: 'Git remembers your journey. Keep committing small, clean, descriptive changes.',
    author: 'CareerPilot AI',
  },
  {
    id: 'git-2',
    category: 'Git & GitHub',
    categoryLabel: '🐙 GIT & GITHUB TIP',
    iconType: 'git',
    quote: 'Write commit messages that explain why a change was made, not just what changed.',
    author: 'CareerPilot AI',
  },

  // Web Development
  {
    id: 'web-1',
    category: 'Web Development',
    categoryLabel: '🌐 WEB DEVELOPMENT TIP',
    iconType: 'web',
    quote: 'Build, test, break, fix, and learn. The browser console is your best teacher.',
    author: 'CareerPilot AI',
  },
  {
    id: 'web-2',
    category: 'Web Development',
    categoryLabel: '🌐 WEB DEVELOPMENT TIP',
    iconType: 'web',
    quote: 'Prioritize web accessibility and responsive layouts on every viewport from day one.',
    author: 'CareerPilot AI',
  },

  // React
  {
    id: 'rea-1',
    category: 'React',
    categoryLabel: '⚛️ REACT TIP',
    iconType: 'react',
    quote: 'Keep state close to where it is used. Lift it only when multiple components share it.',
    author: 'CareerPilot AI',
  },
  {
    id: 'rea-2',
    category: 'React',
    categoryLabel: '⚛️ REACT TIP',
    iconType: 'react',
    quote: 'Make components pure where possible and use memoization selectively, not blindly.',
    author: 'CareerPilot AI',
  },

  // TypeScript
  {
    id: 'ts-1',
    category: 'TypeScript',
    categoryLabel: '🔷 TYPESCRIPT TIP',
    iconType: 'typescript',
    quote: 'Avoid "any". Model your domain with discriminated unions and strict interfaces.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ts-2',
    category: 'TypeScript',
    categoryLabel: '🔷 TYPESCRIPT TIP',
    iconType: 'typescript',
    quote: 'Let TypeScript catch your assumptions at compile time so production stays rock solid.',
    author: 'CareerPilot AI',
  },

  // Database & Supabase
  {
    id: 'db-1',
    category: 'Database',
    categoryLabel: '🗄️ DATABASE & PERSISTENCE',
    iconType: 'database',
    quote: 'Design database schemas with clear foreign keys and strict Row Level Security (RLS).',
    author: 'CareerPilot AI',
  },
  {
    id: 'sup-1',
    category: 'Supabase',
    categoryLabel: '⚡ SUPABASE TIP',
    iconType: 'database',
    quote: 'Leverage Postgres Row Level Security to protect student records at the database engine level.',
    author: 'CareerPilot AI',
  },

  // Career
  {
    id: 'car-1',
    category: 'Career',
    categoryLabel: '🚀 CAREER TIP',
    iconType: 'career',
    quote: 'Your next skill could be the one that opens your next breakthrough opportunity.',
    author: 'CareerPilot AI',
  },
  {
    id: 'car-2',
    category: 'Career',
    categoryLabel: '🚀 CAREER TIP',
    iconType: 'career',
    quote: 'Showcase evidence of what you built. Recruiters value working demos over resume buzzwords.',
    author: 'CareerPilot AI',
  },

  // Interview Preparation
  {
    id: 'int-1',
    category: 'Interview Preparation',
    categoryLabel: '🎯 INTERVIEW TIP',
    iconType: 'interview',
    quote: 'Think out loud during technical interviews. Interviewers care about your thought process.',
    author: 'CareerPilot AI',
  },
  {
    id: 'int-2',
    category: 'Interview Preparation',
    categoryLabel: '🎯 INTERVIEW TIP',
    iconType: 'interview',
    quote: 'Structure behavioral answers using the STAR method: Situation, Task, Action, and Result.',
    author: 'CareerPilot AI',
  },

  // Consistency & Problem Solving
  {
    id: 'con-1',
    category: 'Consistency',
    categoryLabel: '⏱️ CONSISTENCY TIP',
    iconType: 'consistency',
    quote: 'Thirty minutes of focused daily coding outlasts weekend cramming sessions every time.',
    author: 'CareerPilot AI',
  },
  {
    id: 'ps-1',
    category: 'Problem Solving',
    categoryLabel: '🧩 PROBLEM SOLVING TIP',
    iconType: 'problemsolving',
    quote: 'Break down complex problems into the smallest testable units before writing code.',
    author: 'CareerPilot AI',
  },

  // Projects
  {
    id: 'prj-1',
    category: 'Projects',
    categoryLabel: '📦 PROJECTS TIP',
    iconType: 'projects',
    quote: 'Small projects build experience. Complete, deployed projects build confidence.',
    author: 'CareerPilot AI',
  },
  {
    id: 'prj-2',
    category: 'Projects',
    categoryLabel: '📦 PROJECTS TIP',
    iconType: 'projects',
    quote: 'Every project teaches something the tutorial couldn’t. Build something of your own.',
    author: 'CareerPilot AI',
  },
];

/**
 * Get a random offline quote from the library, optionally excluding a previous id
 */
export function getRandomOfflineQuote(excludeId?: string): OfflineQuote {
  const pool = excludeId
    ? OFFLINE_QUOTES.filter((q) => q.id !== excludeId)
    : OFFLINE_QUOTES;
  const list = pool.length > 0 ? pool : OFFLINE_QUOTES;
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}
