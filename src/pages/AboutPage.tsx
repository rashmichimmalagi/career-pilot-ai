import React from 'react';
import {
  Compass,
  ArrowRight,
  Sparkles,
  Code2,
  Cpu,
  Layers,
  ShieldCheck,
  Target,
  FileCheck,
  Trophy,
  CheckCircle2,
  Github,
  Linkedin,
  ExternalLink,
  MessageSquare,
  Activity,
  Heart,
  BookOpen,
  HelpCircle,
  BrainCircuit,
  Terminal,
  Database,
  Cloud,
  FileText,
  Brain,
  Building2,
  Map,
  Calendar,
  Award,
  Lock,
  GitBranch,
  Clock,
  Sparkle,
} from 'lucide-react';
import { BackgroundBubbles } from '../components/common/BackgroundBubbles';
import {
  DEVELOPER_CONFIG,
  DEVELOPER_GITHUB_URL,
  PROJECT_GITHUB_URL,
  LINKEDIN_URL,
  FEEDBACK_URL,
  TECH_STACK,
} from '../config/links';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  // Key Features
  const KEY_FEATURES = [
    {
      title: 'AI Career Guidance',
      desc: 'Context-aware AI mentor offering personalized strategies, instant guidance, and placement tips.',
      icon: Sparkles,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
    },
    {
      title: 'Resume Analyzer',
      desc: 'Instant ATS scoring, role keyword alignment, section analysis, and targeted improvement suggestions.',
      icon: FileText,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800',
    },
    {
      title: 'Coding Practice Arena',
      desc: 'Algorithm challenge playground across multiple languages with instant test case evaluation.',
      icon: Code2,
      color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800',
    },
    {
      title: 'Placement Practice',
      desc: 'Quantitative, logical reasoning, verbal ability, and core CS technical MCQ timed assessments.',
      icon: Brain,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
    },
    {
      title: 'Technical Mock Interviews',
      desc: 'Real-time AI voice/text technical interview rounds evaluating accuracy, depth, and communication.',
      icon: Cpu,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    },
    {
      title: 'HR / Behavioral Interviews',
      desc: 'Structured behavioral rounds with STAR methodology analysis and actionable communication rubrics.',
      icon: MessageSquare,
      color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/50 border-pink-200 dark:border-pink-800',
    },
    {
      title: 'Company Preparation',
      desc: 'Targeted hiring patterns, assessment breakdowns, and archives for Tier-1 product & service firms.',
      icon: Building2,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
    },
    {
      title: 'Career Roadmap',
      desc: 'Structured day-by-day and phase-based milestones guiding your semester preparation journey.',
      icon: Map,
      color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800',
    },
    {
      title: 'AI Study Planner',
      desc: 'Personalized daily study schedules adapted to your target placement timeline and daily bandwidth.',
      icon: Calendar,
      color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800',
    },
    {
      title: 'Progress Analytics',
      desc: 'Real-time accuracy curves, historical activity tracking, and multi-domain performance dashboards.',
      icon: Activity,
      color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800',
    },
    {
      title: 'Career Readiness Score',
      desc: 'Deterministic multi-dimensional readiness benchmark synthesizing coding, ATS, tests, and interviews.',
      icon: Trophy,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
    },
    {
      title: 'Achievements & Milestones',
      desc: 'Gamified streak counters, badges, and unlockable achievements celebrating daily practice momentum.',
      icon: Award,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    },
    {
      title: 'Supabase Authentication',
      desc: 'Secure email/password and OAuth sign-in with automated session validation and account safety.',
      icon: Lock,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
    },
    {
      title: 'Persistent User Data',
      desc: 'Cloud-synced PostgreSQL database with zero cross-account leakage and offline-aware caching.',
      icon: Database,
      color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800',
    },
  ];

  // Journey Steps
  const JOURNEY_STEPS = [
    {
      step: '01',
      title: 'Discover',
      tagline: 'Resume & Career Goals',
      description:
        'Evaluate your current profile with instant ATS resume scoring, identify skill gaps, and select your target software engineering roles.',
      icon: FileCheck,
      accent: 'from-indigo-500/20 to-indigo-600/10 text-indigo-500 border-indigo-500/30',
      badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    },
    {
      step: '02',
      title: 'Prepare',
      tagline: 'Skills, Knowledge & Roadmap',
      description:
        'Follow structured milestone roadmaps, review core CS subjects, and customize study plans aligned with target company patterns.',
      icon: Target,
      accent: 'from-purple-500/20 to-purple-600/10 text-purple-500 border-purple-500/30',
      badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    {
      step: '03',
      title: 'Practice',
      tagline: 'Coding, Placement & Interviews',
      description:
        'Solve algorithmic challenges in the Coding Arena, take timed placement aptitude tests, and rehearse technical and HR interviews with AI feedback.',
      icon: Code2,
      accent: 'from-cyan-500/20 to-cyan-600/10 text-cyan-500 border-cyan-500/30',
      badgeBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    },
    {
      step: '04',
      title: 'Succeed',
      tagline: 'Career Readiness & Confidence',
      description:
        'Benchmark your placement readiness score, track evidence-based daily practice, and step into campus hiring drives fully prepared.',
      icon: Trophy,
      accent: 'from-emerald-500/20 to-emerald-600/10 text-emerald-500 border-emerald-500/30',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
  ];

  return (
    <div className="relative min-h-screen text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300 overflow-hidden pb-16">
      {/* Dynamic Background Atmosphere */}
      <BackgroundBubbles />

      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[720px] h-[450px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/15 to-cyan-400/15 blur-[160px] rounded-full pointer-events-none" />

      {/* ================= 1. HEADER / HERO ================= */}
      <section className="relative z-10 pt-10 sm:pt-16 pb-12 sm:pb-16 text-center">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-md shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">CareerPilot AI</span>
            <span className="text-slate-400 dark:text-slate-500">•</span>
            <span className="text-indigo-600 dark:text-indigo-400">Version 1.0 (2026)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400">CareerPilot AI</span>
          </h1>

          <p className="text-base sm:text-xl font-medium text-slate-700 dark:text-slate-200 max-w-3xl mx-auto">
            Discover the vision, technology, features, and development journey behind CareerPilot AI.
          </p>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            CareerPilot AI is an AI-powered career preparation platform designed to help students prepare for placements and build career readiness through personalized guidance, resume improvement, coding practice, placement preparation, interview practice, roadmap planning, and progress tracking.
          </p>

          {/* Quick Action Navigation Buttons */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <a
              href={PROJECT_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View CareerPilot AI on GitHub"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Github className="w-4 h-4" />
              <span>View CareerPilot AI on GitHub →</span>
            </a>

            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Connect with me on LinkedIn"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
            >
              <Linkedin className="w-4 h-4" />
              <span>Connect with me on LinkedIn →</span>
            </a>

            <button
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20 relative z-10">

        {/* ================= 2 & 3. CARDS: CAREERPILOT AI & DEVELOPED BY ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 2. CareerPilot AI Card */}
          <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
                    <Compass className="w-6 h-6 animate-spin-slow" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      CareerPilot AI
                    </h2>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Placement Readiness Platform
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                    VERSION 1.0
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Est. 2026</span>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                An AI-powered career preparation platform that brings together personalized career guidance, resume analysis, coding practice, placement preparation, interview practice, roadmap planning, and progress tracking.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <span className="block font-bold text-slate-900 dark:text-white">14+</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Core Features</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <span className="block font-bold text-indigo-600 dark:text-indigo-400">100%</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Evidence Driven</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <span className="block font-bold text-emerald-600 dark:text-emerald-400">Active</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Development</span>
              </div>
            </div>
          </div>

          {/* 3. Developed By Card */}
          <div className="lg:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-cyan-500/5 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900/60 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Developed By</span>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Full Stack
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {DEVELOPER_CONFIG.name}
                </h3>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {DEVELOPER_CONFIG.role}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {DEVELOPER_CONFIG.description}
              </p>
            </div>

            {/* Developer Links */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Developer Links
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold">
                <a
                  href={DEVELOPER_GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub Profile"
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-all text-[11px]"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Profile</span>
                </a>
                <a
                  href={PROJECT_GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="CareerPilot AI Repository"
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 transition-all text-[11px]"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>CareerPilot AI Repository</span>
                </a>
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 transition-all text-[11px]"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>

        </section>

        {/* ================= 4. TECHNOLOGY STACK ================= */}
        <section className="space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" />
              <span>Technology Stack</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Modern Full-Stack Architecture
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Built on production-proven frameworks, type-safe primitives, and intelligent cloud services.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* FRONTEND */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Code2 className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    FRONTEND
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    React & TypeScript
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Modern component architecture with TypeScript, Tailwind CSS, Vite, and Lucide icons for responsive, accessible UI.
              </p>
            </div>

            {/* BACKEND & DATABASE */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Database className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    BACKEND & DATABASE
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Supabase & PostgreSQL
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Relational PostgreSQL database with Row Level Security (RLS), real-time sync, and token-scoped persistence.
              </p>
            </div>

            {/* ARTIFICIAL INTELLIGENCE */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <BrainCircuit className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    AI & INTELLIGENCE
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Gemini / Google AI
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Advanced AI integration powering mock technical & HR interviews, ATS resume analysis, and algorithmic evaluation.
              </p>
            </div>

            {/* DEPLOYMENT */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                  <Cloud className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    DEPLOYMENT
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Cloud Run / Vercel
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Continuous integration and automated container deployment delivering sub-second edge response times.
              </p>
            </div>
          </div>
        </section>

        {/* ================= 5. KEY FEATURES ================= */}
        <section className="space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Comprehensive Feature Suite</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              14+ Core Placement Preparation Features
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Everything an engineering candidate needs to prepare, practice, and succeed in campus hiring drives.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {KEY_FEATURES.map((feature) => {
              const IconComp = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md space-y-2.5 hover:border-indigo-500/40 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${feature.color}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= 6. CAREER JOURNEY ================= */}
        <section className="space-y-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>Placement Framework</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              The 4-Stage Career Journey
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Discover → Prepare → Practice → Succeed
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {JOURNEY_STEPS.map((step) => {
              const IconComponent = step.icon;
              return (
                <div
                  key={step.step}
                  className="glass-panel p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.accent} p-[1px] flex items-center justify-center`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${step.badgeBg}`}>
                        STAGE {step.step}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {step.tagline}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Structured Milestone</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= 7. PROJECT DETAILS ================= */}
        <section className="space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Project Specifications</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Project Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Current Version */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md space-y-2 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                CURRENT VERSION
              </span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                Version 1.0
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Initial stable public release with full intelligence suite.
              </p>
            </div>

            {/* Release Year */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md space-y-2 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                RELEASE YEAR
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                2026
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Crafted for modern 2026 technical campus hiring standards.
              </p>
            </div>

            {/* Development Status */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md space-y-2 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                DEVELOPMENT STATUS
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center sm:justify-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Actively Developing</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Continuous enhancements, interview models, and problem sets.
              </p>
            </div>
          </div>
        </section>

        {/* ================= 8. VERSION HISTORY & CHANGELOG ================= */}
        <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>Changelog & Milestones</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Version History
            </h2>
          </div>

          <div className="relative pl-6 border-l-2 border-indigo-500/30 space-y-6">
            <div className="relative space-y-2">
              {/* Dot */}
              <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900" />
              
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900 dark:text-white">
                  Version 1.0
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                  Initial Development Release
                </span>
                <span className="text-xs text-slate-400">2026</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Initial release of CareerPilot AI with its core career preparation, AI-powered guidance, practice, and progress-tracking capabilities.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Multi-dimensional Career Readiness Score engine</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Real-time ATS resume keyword extraction</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Live technical & HR mock interview evaluator</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Supabase token-scoped cloud persistence & RLS</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 9. PROJECT LINKS ================= */}
        <section className="glass-panel p-6 sm:p-10 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-cyan-500/5 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900/60 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <Github className="w-4 h-4" />
              <span>Open Source & Documentation</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Explore the Project on GitHub
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg">
              Explore the source code, architecture blueprints, and project documentation on GitHub.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <a
              href={PROJECT_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View CareerPilot AI on GitHub"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Github className="w-4 h-4" />
              <span>View CareerPilot AI on GitHub →</span>
            </a>

            <a
              href={DEVELOPER_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Profile"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Connect with me on LinkedIn"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
            >
              <Linkedin className="w-3.5 h-3.5" />
              <span>Connect with me on LinkedIn →</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>

        {/* ================= 10. FOOTER ================= */}
        <footer className="pt-8 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>© 2026 CareerPilot AI</span>
            <span>•</span>
            <span>Developed by Rashmi Chimmalagi</span>
            <span>•</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">About CareerPilot AI</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={PROJECT_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              GitHub
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              LinkedIn
            </a>
            <button
              onClick={() => onNavigate('dashboard')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Dashboard
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};
