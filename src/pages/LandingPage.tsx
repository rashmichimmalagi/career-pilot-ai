import React from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  Code2,
  Cpu,
  Users2,
  Building2,
  Bot,
  BarChart3,
  CheckCircle2,
  UserPlus,
  Target,
  BrainCircuit,
  TrendingUp,
  Compass,
  Zap,
  Shield,
  Layers,
  ChevronRight,
  Sparkle,
  Lock
} from 'lucide-react';
import { BackgroundBubbles } from '../components/common/BackgroundBubbles';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  onOpenSetupGuide?: () => void;
}

const FEATURE_CARDS = [
  {
    id: 'resume',
    sectionId: 'section-resume-analyzer',
    title: 'AI Resume Analyzer',
    description: 'Analyze your resume, identify skill gaps, and get AI-powered improvement suggestions tailored to your target role.',
    icon: FileCheck,
    color: 'from-indigo-500/20 to-blue-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  },
  {
    id: 'coding',
    sectionId: 'section-coding-practice',
    title: 'Coding & Technical Practice',
    description: 'Build the technical and problem-solving skills required for your target role with personalized practice, code execution, and AI-powered feedback.',
    icon: Code2,
    color: 'from-cyan-500/20 to-teal-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  },
  {
    id: 'technical',
    sectionId: 'section-technical-interview',
    title: 'Technical Interview',
    description: 'Practice realistic technical interviews tailored to your academic background, target role, and career goals.',
    icon: Cpu,
    color: 'from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
  {
    id: 'hr',
    sectionId: 'section-hr-interview',
    title: 'HR Interview',
    description: 'Practice behavioral and HR questions while improving your interview responses.',
    icon: Users2,
    color: 'from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  },
  {
    id: 'company',
    sectionId: 'section-company-preparation',
    title: 'Company Preparation',
    description: 'Prepare specifically for the companies, roles, and recruitment rounds you are targeting.',
    icon: Building2,
    color: 'from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  {
    id: 'mentor',
    sectionId: 'section-ai-career-mentor',
    title: 'AI Career Mentor',
    description: 'Get personalized guidance on skills, projects, learning paths, and career decisions for your target field.',
    icon: Bot,
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'analytics',
    sectionId: 'section-progress-analytics',
    title: 'Progress Analytics',
    description: 'Track your preparation journey across placement pillars and understand where you need to improve.',
    icon: BarChart3,
    color: 'from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Build Your Profile',
    description: 'Tell CareerPilot about your education, skills, interests, and career goals.',
    icon: UserPlus,
  },
  {
    step: '02',
    title: 'Discover Your Gaps',
    description: 'Understand the skills and areas you need to improve.',
    icon: Target,
  },
  {
    step: '03',
    title: 'Practice With AI',
    description: 'Practice coding, technical interviews, HR interviews, and company preparation.',
    icon: BrainCircuit,
  },
  {
    step: '04',
    title: 'Track Your Growth',
    description: 'Measure your progress and continuously improve your placement readiness.',
    icon: TrendingUp,
  },
];

const READINESS_DIMENSIONS = [
  { label: 'Technical & Domain Skills', tag: 'Core Role' },
  { label: 'Problem-Solving & Aptitude', tag: 'Foundational' },
  { label: 'Communication & Soft Skills', tag: 'Behavioral' },
  { label: 'Resume & ATS Alignment', tag: 'Profile' },
  { label: 'Interview Performance', tag: 'Live Practice' },
  { label: 'Company & Role Prep', tag: 'Targeted Archives' },
];

const CAREER_CATEGORIES = [
  { name: 'Software & IT', desc: 'Software Engineering, Web, Cloud & Systems' },
  { name: 'AI & Data', desc: 'Data Science, Machine Learning & Analytics' },
  { name: 'Cybersecurity', desc: 'Security Engineering, Networks & Compliance' },
  { name: 'Electronics & Embedded', desc: 'VLSI, Embedded Systems, IoT & Robotics' },
  { name: 'Core Engineering', desc: 'Mechanical, Mechatronics & Automation' },
  { name: 'Civil & Infrastructure', desc: 'Structural Engineering, CAD & Management' },
  { name: 'Electrical & Power', desc: 'Power Electronics, Smart Grids & Control' },
  { name: 'Business & Management', desc: 'Product Management, Consulting & Analyst' },
  { name: 'Other Disciplines', desc: 'Chemical, Biotech, Aerospace & Specialized Roles' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user, profile } = useAuth();

  const handlePrimaryCTA = () => {
    if (user) {
      if (profile) {
        onNavigate('dashboard');
      } else {
        onNavigate('onboarding');
      }
    } else {
      onNavigate('auth?mode=signup');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      {/* Background Floating Bubbles */}
      <BackgroundBubbles />

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-6 sm:pt-7 md:pt-8 pb-16 md:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Top Back Navigation Button */}
          <div className="mb-6 sm:mb-8 flex items-center justify-start">
            <button
              onClick={() => onNavigate('welcome')}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm hover:border-indigo-500/30 cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                <span>AI-POWERED PLACEMENT PREPARATION</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                Your AI-Powered <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 dark:from-indigo-400 dark:via-purple-300 dark:to-cyan-400 bg-clip-text text-transparent">
                  Placement Copilot
                </span>
              </h1>

              {/* Supporting Description */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Prepare smarter for placements with AI-powered resume analysis, coding practice, mock interviews, company preparation, and personalized career guidance.
              </p>

              {/* CTA Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={handlePrimaryCTA}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-base shadow-xl shadow-indigo-600/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>{user ? 'Go to Student Dashboard' : 'Start Your Placement Journey'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => scrollToSection('features')}
                  className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white/90 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 font-semibold text-base transition-all backdrop-blur-md text-center cursor-pointer shadow-sm"
                >
                  Explore Features
                </button>
              </div>

            </div>

            {/* Hero Visual Product Preview */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="w-full max-w-lg relative animate-float-slow">
                
                {/* Glow ring */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-3xl blur-xl opacity-20 dark:opacity-30 transition duration-1000" />

                {/* Futuristic AI Product Capabilities Preview Container */}
                <div className="relative rounded-2xl bg-white/90 dark:bg-slate-950/85 border border-slate-200 dark:border-slate-800/90 p-5 sm:p-6 shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-3.5 transition-colors duration-300">
                  
                  {/* Window / Header Bar */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Platform Capabilities Preview
                    </span>
                  </div>

                  {/* 1. AI Resume Analyzer */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-indigo-500/25 hover:border-indigo-500/40 transition-colors space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-wide">1. AI Resume Analyzer</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Smart Resume Optimization & Skill Gap Analysis</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                        <CheckCircle2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Analyze your resume</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                        <CheckCircle2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Identify skill gaps</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                        <CheckCircle2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Get improvement suggestions</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Coding Practice */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-cyan-500/25 hover:border-cyan-500/40 transition-colors space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-wide">2. Coding Practice</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Interactive Coding Environment & AI Guidance</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                        <CheckCircle2 className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span>Practice interview-style problems</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                        <CheckCircle2 className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span>Write and test code</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                        <CheckCircle2 className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span>Receive AI feedback</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. AI Interview Coach */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-purple-500/25 hover:border-purple-500/40 transition-colors space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-wide">3. AI Interview Coach</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Simulated Technical & HR Mock Interviews</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                        <CheckCircle2 className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>Technical + HR interviews</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                        <CheckCircle2 className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>Practice realistic questions</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                        <CheckCircle2 className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>Improve with personalized feedback</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= COMPACT CAPABILITY CARDS SECTION ================= */}
      <section className="relative z-10 py-12 bg-slate-100/60 dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              PLATFORM CAPABILITIES
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Everything you need for placement preparation
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* 01 AI Resume Analyzer */}
            <div
              onClick={() => scrollToSection('section-resume-analyzer')}
              className="p-5 rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-500/50 transition-all cursor-pointer group space-y-3 shadow-sm hover:shadow-md backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">01</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform shadow-sm">
                  <FileCheck className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                  AI Resume Analyzer
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
                  ATS optimization and skill-gap analysis
                </p>
              </div>
            </div>

            {/* 02 Coding Practice */}
            <div
              onClick={() => scrollToSection('section-coding-practice')}
              className="p-5 rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800/90 hover:border-cyan-500/50 transition-all cursor-pointer group space-y-3 shadow-sm hover:shadow-md backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black text-slate-400 dark:text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">02</span>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:scale-105 transition-transform shadow-sm">
                  <Code2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                  Coding Practice
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
                  Role-based coding practice and AI feedback
                </p>
              </div>
            </div>

            {/* 03 Interview Coach */}
            <div
              onClick={() => scrollToSection('section-technical-interview')}
              className="p-5 rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800/90 hover:border-purple-500/50 transition-all cursor-pointer group space-y-3 shadow-sm hover:shadow-md backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">03</span>
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-105 transition-transform shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                  Interview Coach
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
                  Technical and HR interview preparation
                </p>
              </div>
            </div>

            {/* 04 AI Career Mentor */}
            <div
              onClick={() => scrollToSection('section-ai-career-mentor')}
              className="p-5 rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800/90 hover:border-emerald-500/50 transition-all cursor-pointer group space-y-3 shadow-sm hover:shadow-md backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">04</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform shadow-sm">
                  <Compass className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                  AI Career Mentor
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
                  Personalized preparation and career guidance
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ================= TRUST / VALUE STRIP ================= */}
      <section className="relative z-10 py-6 border-y border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 md:gap-12 text-center text-xs sm:text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>Resume Analysis</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span>Technical Practice</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span>Role Interviews</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Company Prep</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Career Guidance</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CAREER GOAL PERSONALIZATION BANNER ================= */}
      <section className="relative z-10 py-16 bg-slate-100/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center">
          
          <div className="space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-bold uppercase tracking-widest">
              <Target className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Role-Aware Personalization</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Your preparation, personalized to your career goal.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              CareerPilot adapts practice problems, interview questions, and roadmap recommendations according to your academic branch, target role, and career goals.
            </p>
          </div>

          {/* Conceptual Career Category Chips Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-2">
            {CAREER_CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                className="glass-card p-4 rounded-xl text-left border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {cat.name}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500/80" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {cat.desc}
                </p>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            Note: Career options above represent supported path categories. Personalized preparation tracks configure automatically upon setting your target role.
          </p>

        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section id="features" className="relative z-10 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest">
              <span>Comprehensive Ecosystem</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Everything You Need to Become Placement-Ready
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
              One platform to build your skills, improve your resume, practice interviews, and plan your career.
            </p>
          </div>

          {/* 7 Feature Glass Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_CARDS.map((card, idx) => {
              const IconComp = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() => scrollToSection(card.sectionId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      scrollToSection(card.sectionId);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${card.title}`}
                  className={`glass-card p-6 sm:p-7 rounded-2xl flex flex-col justify-between space-y-5 relative group cursor-pointer hover:border-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    idx === 6 ? 'md:col-span-2 lg:col-span-1' : ''
                  }`}
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} border flex items-center justify-center shadow-md`}>
                      <IconComp className="w-6 h-6" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors">
                      {card.title}
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToSection(card.sectionId);
                      }}
                      aria-label={`Learn more about ${card.title}`}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-all duration-300 group/btn cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
                    >
                      <span>Learn more</span>
                      <ChevronRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover/btn:translate-x-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ================= DETAILED FEATURE BREAKDOWN SECTIONS ================= */}
          <div className="space-y-20 pt-10">
            
            {/* Section 1: AI Resume Analyzer */}
            <section id="section-resume-analyzer" className="scroll-mt-24 pt-10 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-6 space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Available after sign-in</span>
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    AI Resume Analyzer
                  </h3>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Upload your resume to benchmark it against real job descriptions for your target role. CareerPilot evaluates resume quality, role alignment, missing skills, projects, and ATS parsing readiness.
                  </p>

                  <div className="space-y-3 pt-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">Key Capabilities</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Resume Quality & ATS Parsing Check</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Target Role & Skill Gap Analysis</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Impact Metric & Action Verb Bullet Rewriter</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Experience & Project Profile Strength</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 shadow-xl dark:shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Resume Analysis Engine (Product Preview)
                      </span>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-semibold">
                        UI MOCKUP
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">Target Role: Selected Career Goal</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Scanned against role criteria</p>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Role Alignment</span>
                          <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">High Match</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Skill Gap Detection</span>
                          <p className="text-slate-700 dark:text-slate-300">Identifies missing role-specific skills & industry keywords</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">Bullet Point Rewriter</span>
                          <p className="text-slate-700 dark:text-slate-300">Transforms static text into quantified achievements</p>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-500 italic text-center pt-1">
                        Conceptual product preview • Connect your account to run live AI resume scans.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Coding Practice */}
            <section id="section-coding-practice" className="scroll-mt-24 pt-10 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-6 order-2 lg:order-1">
                  <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 shadow-xl dark:shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-mono">
                        <Code2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        Code Execution & Practice Arena (Product Preview)
                      </span>
                      <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-semibold">
                        UI MOCKUP
                      </span>
                    </div>

                    <div className="space-y-3 text-xs font-mono">
                      <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 space-y-2">
                        <div className="flex justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5 font-sans">
                          <span>Problem: Role-Based Technical Challenge</span>
                          <span className="text-amber-400 font-bold">Adaptive</span>
                        </div>
                        <pre className="text-[11px] text-cyan-300 leading-relaxed font-mono overflow-x-auto">
{`// Customized for your target role & language
function processTargetLogic(dataInput) {
  // AI Hint: Evaluate edge cases and optimal approach
  return solveChallenge(dataInput);
}`}
                        </pre>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between font-sans">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-slate-800 dark:text-slate-200 text-xs font-semibold">Multi-Language Code Runner & Evaluator</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">AI Feedback Active</span>
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-500 italic text-center pt-1 font-sans">
                        Conceptual product preview • Interactive practice sandbox unlocks after sign-in.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-5 order-1 lg:order-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>Available after sign-in</span>
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    Coding & Technical Practice Arena
                  </h3>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Build the technical and problem-solving skills required for your target role with personalized practice, code execution, and AI-powered feedback.
                  </p>

                  <div className="space-y-3 pt-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">Key Capabilities</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span>Role-Based Practice Tracks</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span>Multi-Language Code Execution</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span>AI-Powered Feedback & Debugging</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span>Skill-Based Difficulty Progression</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Technical Interview */}
            <section id="section-technical-interview" className="scroll-mt-24 pt-10 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-6 space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Available after sign-in</span>
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    Technical Interview Simulator
                  </h3>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Practice realistic technical interviews tailored to your academic background, target role, and career goals.
                  </p>

                  <div className="space-y-3 pt-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">Key Capabilities</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>Role-Based Interview Questions</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>Adaptive Difficulty Engine</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>Technical Knowledge Evaluation</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>Personalized Feedback & Improvement</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 shadow-xl dark:shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        Technical Interview Chamber (Product Preview)
                      </span>
                      <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-semibold">
                        UI MOCKUP
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">AI Interviewer Prompt</span>
                          <span className="text-[10px] text-slate-500 font-mono">Domain Round</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300">
                          "Explain the core technical principles behind your target domain role and how you evaluate engineering tradeoffs in real-world projects."
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Live Evaluation Matrix</span>
                        <p className="text-slate-700 dark:text-slate-300">Assesses conceptual clarity, depth of explanation, domain vocabulary, and logical reasoning.</p>
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-500 italic text-center pt-1">
                        Conceptual product preview • AI interviewer sessions unlock after signing in.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: HR Interview */}
            <section id="section-hr-interview" className="scroll-mt-24 pt-10 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-6 order-2 lg:order-1">
                  <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 shadow-xl dark:shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Users2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Behavioral & HR Round (Product Preview)
                      </span>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-semibold">
                        UI MOCKUP
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Behavioral Question Prompt</span>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">"Tell me about a project failure or conflict you experienced and how you resolved it."</p>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                          <span className="block font-bold text-indigo-600 dark:text-indigo-400">S</span>
                          <span className="text-[9px] text-slate-500">Situation</span>
                        </div>
                        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                          <span className="block font-bold text-indigo-600 dark:text-indigo-400">T</span>
                          <span className="text-[9px] text-slate-500">Task</span>
                        </div>
                        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                          <span className="block font-bold text-indigo-600 dark:text-indigo-400">A</span>
                          <span className="text-[9px] text-slate-500">Action</span>
                        </div>
                        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                          <span className="block font-bold text-indigo-600 dark:text-indigo-400">R</span>
                          <span className="text-[9px] text-slate-500">Result</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-500 italic text-center pt-1">
                        Conceptual product preview • STAR method response coach unlocks after sign-in.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-5 order-1 lg:order-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Users2 className="w-5 h-5" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Available after sign-in</span>
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    HR Interview Simulator
                  </h3>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Practice behavioral and HR questions using the structured STAR framework. Master situational responses, salary expectation dialogues, and leadership questions with AI guidance.
                  </p>

                  <div className="space-y-3 pt-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">Key Capabilities</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>STAR Method Answer Structuring</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Behavioral & Leadership Question Bank</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Response Clarity & Confidence Analysis</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Weakness Transformation Guidance</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Company Preparation */}
            <section id="section-company-preparation" className="scroll-mt-24 pt-10 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-6 space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Available after sign-in</span>
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    Company Preparation Archives
                  </h3>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Target specific companies with tailored recruitment blueprints, past interview questions, aptitude patterns, and CGPA cutoff requirements for top tier-1 product and service companies.
                  </p>

                  <div className="space-y-3 pt-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">Key Capabilities</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>Company Recruitment Pattern Archives</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>Round-by-Round Syllabus & Cutoffs</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>Frequently Asked Interview Questions</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>Salary Expectations & Role Blueprints</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 shadow-xl dark:shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Company Intelligence Cards (Product Preview)
                      </span>
                      <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-semibold">
                        UI MOCKUP
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                        <p className="font-bold text-slate-900 dark:text-white">Tier 1 Product & Core Companies</p>
                        <p className="text-[11px] text-slate-500">Focus: Technical Skills, System Design, Problem Solving</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                        <p className="font-bold text-slate-900 dark:text-white">IT & Global Consulting</p>
                        <p className="text-[11px] text-slate-500">Focus: Aptitude, Role Practice, HR</p>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-500 italic text-center pt-1">
                      Conceptual product preview • Full company guides and archives unlock after signing in.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: AI Career Mentor */}
            <section id="section-ai-career-mentor" className="scroll-mt-24 pt-10 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-6 order-2 lg:order-1">
                  <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 shadow-xl dark:shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        24/7 AI Career Mentor (Product Preview)
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                        UI MOCKUP
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                          Personalized Weekly Roadmap
                        </p>
                        <p className="text-slate-700 dark:text-slate-300">
                          Target 4 key goals this week: Strengthen your weakest skill area, complete your recommended practice, improve your resume/project profile, and prepare for your target role interview.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">Project Recommender: Role-Aligned Engineering Project</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">High Impact</span>
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-500 italic text-center pt-1">
                        Conceptual product preview • Connect your account to chat with your personal AI mentor.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-5 order-1 lg:order-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Available after sign-in</span>
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    AI Career Mentor
                  </h3>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Get round-the-clock guidance on skill learning paths, project portfolio building, resume tweaks, and placement drive preparation strategies tailored to your target career.
                  </p>

                  <div className="space-y-3 pt-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">Key Capabilities</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Personalized Weekly Skill Roadmaps</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Project Stack & Portfolio Recommendations</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Real-Time Placement Preparation Q&A</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Tailored Career Decision Guidance</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7: Progress Analytics */}
            <section id="section-progress-analytics" className="scroll-mt-24 pt-10 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-6 space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-xs font-mono font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                      <span>Available after sign-in</span>
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    Progress Analytics Dashboard
                  </h3>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    Monitor your preparation journey across all placement dimensions. Track your skill development, interview performance, resume strength, and target role readiness.
                  </p>

                  <div className="space-y-3 pt-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">Key Capabilities</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                        <span>Overall Placement Readiness Score</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                        <span>Skill Development Progress Tracking</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                        <span>Interview Performance Trend Breakdown</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                        <span>Areas for Improvement & Focus Alerts</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 shadow-xl dark:shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        Readiness Analytics Engine (Product Preview)
                      </span>
                      <span className="text-[10px] font-mono text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 font-semibold">
                        UI MOCKUP
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase">Readiness Metric</span>
                          <p className="font-bold text-slate-900 dark:text-white">Overall Placement Score</p>
                        </div>
                        <span className="font-mono text-xs font-extrabold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-lg">
                          Evaluated On Sign-In
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Tracked Placement Pillars</span>
                        <p className="text-slate-700 dark:text-slate-300">Target Role Skills • Domain Knowledge • Interview Performance • Resume Strength • Company Prep</p>
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-500 italic text-center pt-1">
                        Conceptual product preview • Live progress tracking activates after account setup.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>

        </div>
      </section>

      {/* ================= HOW IT WORKS SECTION ================= */}
      <section id="how-it-works" className="relative z-10 py-24 sm:py-32 bg-slate-100/60 dark:bg-slate-950/40 border-y border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-300 text-xs font-bold uppercase tracking-widest">
              <span>Step-by-step Methodology</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Your Journey to Placement Starts Here
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
              Follow a streamlined roadmap designed to take you from foundational preparation to final campus offer letters.
            </p>
          </div>

          {/* Connected Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.step}
                  className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between relative group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-extrabold px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                        {step.step}
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        <StepIcon className="w-4 h-4" />
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white pt-1">
                      {step.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {idx < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-slate-400 dark:text-slate-700 pointer-events-none">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ================= AI CAREER MENTOR SECTION ================= */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel p-8 sm:p-12 md:p-16 rounded-3xl border border-indigo-500/20 relative overflow-hidden">
            
            {/* Ambient inner glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[100px] pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Copy */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest">
                  <Bot className="w-3.5 h-3.5" />
                  <span>24/7 Guidance Engine</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Your Personal <br />
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 dark:from-indigo-400 dark:via-purple-300 dark:to-cyan-400 bg-clip-text text-transparent">
                    AI Career Mentor
                  </span>
                </h2>

                <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
                  CareerPilot analyzes your goals, skills, and preparation progress to help you understand what to learn next.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Personalized domain skill and career roadmaps</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Targeted skill-gap identification and project suggestions</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Real-time feedback on interview and resume improvements</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handlePrimaryCTA}
                    className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>{user ? 'Go to Dashboard' : 'Connect with Mentor'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right Interface Preview Mockup */}
              <div className="lg:col-span-6">
                <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 shadow-xl dark:shadow-2xl space-y-4">
                  
                  {/* Mock Interface Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">AI Mentor Assistant</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-semibold">
                      UI PREVIEW MOCKUP
                    </span>
                  </div>

                  {/* Mock Assistant Content */}
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <p className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-[10px]">
                        Recommended Next Steps
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        Based on your current preparation metrics, focus on these priorities this week:
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-cyan-500" />
                          <span className="text-slate-800 dark:text-slate-200 font-medium">Strengthen core domain technical skills</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">15 mins</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="text-slate-800 dark:text-slate-200 font-medium">Complete recommended role-specific practice</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">45 mins</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-slate-800 dark:text-slate-200 font-medium">Practice one target technical interview round</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">30 mins</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-500 italic text-center pt-1">
                      Note: Above items illustrate simulated AI mentor recommendations in preview mode.
                    </p>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ================= PLACEMENT READINESS SECTION ================= */}
      <section className="relative z-10 py-24 sm:py-32 bg-slate-100/60 dark:bg-slate-950/40 border-y border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-bold uppercase tracking-widest">
              <span>Readiness Framework</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Know Where You Stand
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
              A holistic evaluation framework that analyzes your progress across every pillar of campus hiring.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Conceptual Circular Readiness Indicator */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center text-center">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-cyan-500/20 border border-indigo-500/30 shadow-2xl">
                <div className="w-full h-full rounded-full bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
                  
                  <Compass className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-2" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Placement Readiness
                  </span>
                  
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-200 mt-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-center">
                    Your readiness score will appear here
                  </p>
                  
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                    Evaluated upon profile completion
                  </span>
                </div>
              </div>
            </div>

            {/* Evaluated Areas List */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                What CareerPilot Evaluates
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {READINESS_DIMENSIONS.map((dim) => (
                  <div
                    key={dim.label}
                    className="glass-card p-4 rounded-xl flex items-center justify-between border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{dim.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 font-medium">
                      {dim.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ================= ABOUT SECTION ================= */}
      <section id="about" className="relative z-10 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest">
            <span>Our Mission</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Built for Undergraduates Across All Engineering Branches & Career Paths
          </h2>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
            CareerPilot AI bridges the gap between college curriculum and real-world placement demands. By integrating role-aware technical practice, AI mock interviews, ATS resume optimization, and targeted company preparation archives, we empower students from every engineering branch to step into campus hiring drives with total confidence.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Tailored for All Engineering Branches & Career Goals</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>End-to-End Placement Pipeline</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('about')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
            >
              <span>Read Full About & Developer Story</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ================= CTA SECTION ================= */}
      <section className="relative z-10 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel p-10 sm:p-16 rounded-3xl border border-indigo-500/30 text-center space-y-6 relative overflow-hidden shadow-2xl">
            
            {/* Glowing animated background orb */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/15 via-purple-600/15 to-cyan-500/15 blur-2xl pointer-events-none animate-pulse-glow" />

            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                Ready to Become Placement-Ready?
              </h2>

              <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                Start building the skills, confidence, and preparation you need for your placement journey.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handlePrimaryCTA}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-base shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-cyan-200" />
                  <span>{user ? 'Go to Student Dashboard' : 'Start Your Placement Journey'}</span>
                </button>

                <button
                  onClick={() => scrollToSection('features')}
                  className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-base transition-all text-center cursor-pointer shadow-sm"
                >
                  Explore CareerPilot
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};
