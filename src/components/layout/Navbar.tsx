import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Home,
  Sparkles,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Code2,
  Cpu,
  FileText,
  Brain,
  Building2,
  Map,
  Bot,
  ChevronDown,
  Info,
  HelpCircle,
  Calendar,
  Activity,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onOpenSetupGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close "More" dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
    if (currentPage !== 'home') {
      onNavigate('home');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
    try {
      await signOut();
      onNavigate('home');
    } catch (err) {
      console.error('Sign out error in Navbar:', err);
    }
  };

  const meta = user?.user_metadata || {};
  const rawName =
    profile?.full_name ||
    meta.full_name ||
    meta.name ||
    meta.user_name ||
    meta.preferred_username ||
    (user?.email ? user.email.split('@')[0] : 'Student');

  const displayName = typeof rawName === 'string' && rawName.trim() ? rawName.trim() : 'Student';
  const avatarUrl = profile?.avatar_url || meta.avatar_url || meta.picture || '';

  // Active state flags
  const isHomeActive = currentPage === 'home';
  const isDashboardActive = currentPage === 'dashboard';
  const isStudyPlannerActive =
    currentPage === 'study-planner' ||
    currentPage === 'planner' ||
    currentPage === 'ai-study-planner';
  const isMentorActive =
    currentPage === 'career-mentor' ||
    currentPage === 'mentor' ||
    currentPage === 'ai-mentor';
  const isResumeActive = currentPage === 'resume' || currentPage === 'resume-analyzer';
  const isCodingActive = currentPage === 'coding';
  const isInterviewActive =
    currentPage === 'interview' || currentPage === 'technical-interview';
  const isPlacementActive =
    currentPage === 'placement' ||
    currentPage === 'placement-practice' ||
    currentPage === 'placement-arena' ||
    currentPage === 'aptitude';
  const isCompanyPrepActive =
    currentPage === 'company-prep' ||
    currentPage === 'company' ||
    currentPage === 'company-preparation';
  const isRoadmapActive = currentPage === 'roadmap' || currentPage === 'career-roadmap';

  return (
    <header
      id="main-navbar-header"
      className={`sticky top-0 z-50 transition-all duration-200 w-full ${
        isScrolled
          ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200/90 dark:border-indigo-500/20 py-2 shadow-sm dark:shadow-md dark:shadow-indigo-950/30'
          : 'bg-white/90 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/80 py-2.5'
      }`}
    >
      <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-4 lg:px-5 xl:px-6">
        
        {/* ========================================================= */}
        {/* ================= DESKTOP VIEW (lg and up) ============= */}
        {/* ========================================================= */}
        <div className="hidden lg:flex items-center justify-between gap-4 xl:gap-6 w-full">
          
          {/* ================= 1. BRAND SECTION (LEFT) ================= */}
          <div
            id="navbar-brand"
            onClick={() => {
              onNavigate('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-400 p-[1px] shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-all duration-300 shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[11px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors" />
                <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:rotate-45 transition-transform duration-500" />
              </div>
            </div>
            <div className="flex flex-col justify-center shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors leading-tight">
                  CareerPilot
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-xs leading-none">
                  AI
                </span>
              </div>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase leading-none mt-0.5">
                Placement Copilot
              </span>
            </div>
          </div>

          {/* ================= 2. NAVIGATION AREA (MIDDLE) ================= */}
          {user ? (
            /* AUTHENTICATED TWO-ROW NAVIGATION */
            <div id="mainNavigation" className="flex flex-col justify-center gap-1.5 flex-1 min-w-0">
              
              {/* ROW 1: PRIMARY NAVIGATION ITEMS */}
              <div id="nav-row-1" className="flex items-center gap-1 xl:gap-1.5 flex-wrap">
                {/* 1. Home */}
                <button
                  id="nav-btn-home"
                  type="button"
                  onClick={() => {
                    onNavigate('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  title="CareerPilot Home"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isHomeActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/25 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <Home className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Home</span>
                </button>

                {/* 2. Prep Dashboard */}
                <button
                  id="nav-btn-dashboard"
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  title="Placement Preparation Dashboard"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isDashboardActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/25 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Prep Dashboard</span>
                </button>

                {/* 3. Study Planner */}
                <button
                  id="nav-btn-study-planner"
                  type="button"
                  onClick={() => onNavigate('study-planner')}
                  title="AI Study Planner"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isStudyPlannerActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/25 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Study Planner</span>
                </button>

                {/* 4. AI Mentor */}
                <button
                  id="nav-btn-ai-mentor"
                  type="button"
                  onClick={() => onNavigate('career-mentor')}
                  title="AI Career Mentor"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isMentorActive
                      ? 'bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-cyan-500/15 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-500/30 shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/50 border border-transparent'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>AI Mentor</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                </button>

                {/* 5. Resume Analyzer */}
                <button
                  id="nav-btn-resume"
                  type="button"
                  onClick={() => onNavigate('resume-analyzer')}
                  title="AI Resume Analyzer"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isResumeActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/25 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Resume Analyzer</span>
                </button>

                {/* 6. Coding Arena */}
                <button
                  id="nav-btn-coding"
                  type="button"
                  onClick={() => onNavigate('coding')}
                  title="Coding Practice Arena"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isCodingActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/25 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Coding Arena</span>
                </button>

                {/* 7. Technical Interview */}
                <button
                  id="nav-btn-interview"
                  type="button"
                  onClick={() => onNavigate('interview')}
                  title="Technical Interview Simulator"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isInterviewActive
                      ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/25 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>Technical Interview</span>
                </button>
              </div>

              {/* ROW 2: SECONDARY NAVIGATION ITEMS */}
              <div id="nav-row-2" className="flex items-center gap-1 xl:gap-1.5 flex-wrap">
                {/* 1. Placement Practice */}
                <button
                  id="nav-btn-placement"
                  type="button"
                  onClick={() => onNavigate('placement')}
                  title="Placement Practice (MCQs & Tests)"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isPlacementActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/25 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Placement Practice</span>
                </button>

                {/* 2. Company Prep */}
                <button
                  id="nav-btn-company"
                  type="button"
                  onClick={() => onNavigate('company-prep')}
                  title="Company Preparation Tracks"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isCompanyPrepActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/25 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Company Prep</span>
                </button>

                {/* 3. Roadmap */}
                <button
                  id="nav-btn-roadmap"
                  type="button"
                  onClick={() => onNavigate('roadmap')}
                  title="Career Roadmap"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isRoadmapActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/25 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <Map className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Roadmap</span>
                </button>

                {/* 4. More Button (Standalone dropdown) */}
                <div className="relative shrink-0" ref={moreMenuRef}>
                  <button
                    id="nav-btn-more"
                    type="button"
                    onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                    title="More navigation options & info"
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      moreMenuOpen
                        ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-500/30'
                        : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-transparent'
                    }`}
                    aria-expanded={moreMenuOpen}
                    aria-haspopup="true"
                  >
                    <span>More</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                        moreMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu Card */}
                  {moreMenuOpen && (
                    <div
                      id="more-dropdown-card"
                      className="absolute left-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl dark:shadow-indigo-950/60 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                    >
                      {/* Section: Modules */}
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Practice & Tools
                      </div>

                      <div className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigate('dashboard');
                            setMoreMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>Preparation Dashboard</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onNavigate('study-planner');
                            setMoreMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                        >
                          <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>AI Study Planner</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onNavigate('career-mentor');
                            setMoreMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                        >
                          <Bot className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>AI Career Mentor</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onNavigate('resume-analyzer');
                            setMoreMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>AI Resume Analyzer</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onNavigate('coding');
                            setMoreMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-300 font-medium transition-colors cursor-pointer"
                        >
                          <Code2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Coding Arena</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onNavigate('interview');
                            setMoreMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-300 font-medium transition-colors cursor-pointer"
                        >
                          <Cpu className="w-4 h-4 text-purple-500 shrink-0" />
                          <span>Technical Interview</span>
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

                      {/* Section: Overview & Info */}
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Platform Overview
                      </div>

                      <div className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => scrollToSection('features')}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Features</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => scrollToSection('how-it-works')}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                        >
                          <HelpCircle className="w-4 h-4 text-cyan-500 shrink-0" />
                          <span>How It Works</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => scrollToSection('about')}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                        >
                          <Info className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>About Platform</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            /* LOGGED-OUT NAVIGATION */
            <div id="mainNavigation" className="flex items-center gap-4 xl:gap-6 flex-1 min-w-0 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => {
                  onNavigate('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  currentPage === 'home' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''
                }`}
              >
                <Home className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Home</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                How It Works
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('about')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                About
              </button>
            </div>
          )}

          {/* ================= 3. ACCOUNT CONTROLS (RIGHT) ================= */}
          <div
            id="accountControls"
            className="ml-auto shrink-0 flex items-center gap-2 xl:gap-2.5 self-center"
          >
            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer focus:outline-none shrink-0 shadow-xs"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-600 transition-transform hover:-rotate-12" />
              )}
            </button>

            {/* Authenticated Controls: Student Profile & Sign Out */}
            {loading ? (
              <div className="w-32 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800/60 animate-pulse shrink-0" />
            ) : user ? (
              <div className="flex items-center gap-2 xl:gap-2.5 shrink-0">
                {/* Student Profile Pill */}
                <button
                  id="user-profile-btn"
                  type="button"
                  onClick={() => onNavigate('profile')}
                  title={`Logged in as ${displayName} - View Profile`}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 ${
                    currentPage === 'profile'
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500/50 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-4 h-4 rounded-full object-cover border border-indigo-500 shrink-0"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <UserIcon className="w-3 h-3" />
                    </div>
                  )}
                  <span className="max-w-[130px] xl:max-w-[160px] truncate">{displayName}</span>
                </button>

                {/* Sign Out Button (Always clearly visible with separate spacing) */}
                <button
                  id="sign-out-btn"
                  type="button"
                  onClick={handleSignOut}
                  title="Sign out of your account"
                  className="px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/20 hover:border-rose-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              /* Logged Out Actions */
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate('auth?mode=signin')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('auth?mode=signup')}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>Get Started</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* ========================================================= */}
        {/* ================= MOBILE / TABLET HEADER (< lg) ======== */}
        {/* ========================================================= */}
        <div className="lg:hidden flex items-center justify-between h-11 w-full">
          
          {/* Mobile Brand */}
          <div
            onClick={() => {
              onNavigate('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 cursor-pointer group select-none shrink-0"
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-400 p-[1px] shadow-sm shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[11px] flex items-center justify-center relative overflow-hidden">
                <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="flex flex-col justify-center shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
                  CareerPilot
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-indigo-500 to-cyan-500 text-white leading-none">
                  AI
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle (Mobile) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
              )}
            </button>

            {/* Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-xs"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* ================= MOBILE MENU DRAWER (< lg) ============ */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          
          {/* Main Links */}
          <div className="flex flex-col space-y-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <button
              type="button"
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Home</span>
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
            >
              About
            </button>
          </div>

          {/* Authenticated Links in Drawer */}
          {user && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  onNavigate('profile');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-3 rounded-lg flex items-center gap-2 font-bold cursor-pointer ${
                  currentPage === 'profile'
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <UserIcon className="w-4 h-4 text-indigo-500" />
                <span>Student Profile & Skills</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-3 rounded-lg flex items-center gap-2 font-bold cursor-pointer ${
                  isDashboardActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                <span>Preparation Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('study-planner');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-3 rounded-lg flex items-center justify-between font-bold cursor-pointer ${
                  isStudyPlannerActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>AI Study Planner</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                  Daily
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('career-mentor');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-3 rounded-lg flex items-center justify-between font-bold cursor-pointer ${
                  isMentorActive
                    ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-500" />
                  <span>AI Career Mentor</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                  AI
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('resume-analyzer');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-3 rounded-lg flex items-center gap-2 font-bold cursor-pointer ${
                  isResumeActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>AI Resume Analyzer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('coding');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-3 rounded-lg flex items-center gap-2 font-bold cursor-pointer ${
                  isCodingActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Code2 className="w-4 h-4 text-emerald-500" />
                <span>Coding Practice Arena</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('interview');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-3 rounded-lg flex items-center gap-2 font-bold cursor-pointer ${
                  isInterviewActive
                    ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Cpu className="w-4 h-4 text-purple-500" />
                <span>Technical Interview</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('placement');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-3 rounded-lg flex items-center gap-2 font-bold cursor-pointer ${
                  isPlacementActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Brain className="w-4 h-4 text-indigo-500" />
                <span>Placement Practice (MCQs)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('company-prep');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-3 rounded-lg flex items-center gap-2 font-bold cursor-pointer ${
                  isCompanyPrepActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4 text-indigo-500" />
                <span>Company Preparation</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('roadmap');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-3 rounded-lg flex items-center gap-2 font-bold cursor-pointer ${
                  isRoadmapActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Map className="w-4 h-4 text-indigo-500" />
                <span>Career Roadmap</span>
              </button>
            </div>
          )}

          {/* User Account Actions in Mobile Drawer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            {loading ? (
              <div className="w-full h-9 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
            ) : user ? (
              <>
                <div className="px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Logged in as {displayName}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/20 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('auth?mode=signin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs text-center cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('auth?mode=signup');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold text-xs text-center shadow-sm cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

        </div>
      )}
    </header>
  );
};
