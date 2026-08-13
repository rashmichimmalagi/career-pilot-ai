import React from 'react';
import {
  Sparkles,
  ArrowRight,
  FileCheck,
  Code2,
  Bot,
  Compass,
  CheckCircle2,
  Shield,
  Layers,
  ChevronRight,
  UserCheck,
  LayoutDashboard
} from 'lucide-react';
import { BackgroundBubbles } from '../components/common/BackgroundBubbles';
import { useAuth } from '../context/AuthContext';

interface WelcomePageProps {
  onNavigate: (page: string) => void;
  onOpenSetupGuide?: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onNavigate }) => {
  const { user, profile } = useAuth();

  const handleGetStarted = () => {
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

  const handleSignIn = () => {
    if (user) {
      if (profile) {
        onNavigate('dashboard');
      } else {
        onNavigate('onboarding');
      }
    } else {
      onNavigate('auth?mode=signin');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300 overflow-hidden">
      {/* Background Floating Bubbles & Glow */}
      <BackgroundBubbles />

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/10 to-cyan-400/15 blur-[140px] rounded-full pointer-events-none" />

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-10 pb-16 md:pt-20 md:pb-24 overflow-hidden my-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          
          {/* Main Hero Header */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Brand Pill & Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-md shadow-sm">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 p-[1px] flex items-center justify-center">
                <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[7px] flex items-center justify-center">
                  <Compass className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <span>CareerPilot AI • Placement Copilot</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Your Career Journey <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 dark:from-indigo-400 dark:via-purple-300 dark:to-cyan-400 bg-clip-text text-transparent">
                Starts Here
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-slate-200 max-w-3xl mx-auto leading-relaxed">
              AI-powered preparation for resumes, coding, interviews, and your future career.
            </p>

            {/* Supporting Text */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Prepare smarter. Practice better. Build the confidence to succeed in placements and beyond.
            </p>

            {/* Primary Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              {user ? (
                /* Already Authenticated Student Controls */
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 group cursor-pointer"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Go to Dashboard →</span>
                </button>
              ) : (
                /* Unauthenticated Controls */
                <>
                  <button
                    onClick={handleGetStarted}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 group cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={handleSignIn}
                    className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-base transition-all backdrop-blur-md text-center cursor-pointer shadow-sm"
                  >
                    Already have an account? Sign In
                  </button>
                </>
              )}
            </div>

            {/* Secondary Explore Platform Link */}
            <div className="pt-2">
              <button
                onClick={() => onNavigate('home')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer group"
              >
                <span>Explore the full platform capabilities →</span>
              </button>
            </div>

          </div>

          {/* ================= 4 CORE PILLARS VISUAL REPRESENTATION ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-6">
            
            {/* Pillar 1: Resume */}
            <div
              onClick={() => onNavigate('home')}
              className="glass-card p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-500/40 transition-all duration-300 group cursor-pointer space-y-4 hover:-translate-y-1 shadow-lg dark:shadow-indigo-950/20"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    Resume
                  </h3>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    ATS Optimizer
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Analyze your resume against real job specifications, fix skill gaps, and quantify bullet points.
                </p>
              </div>
            </div>

            {/* Pillar 2: Coding */}
            <div
              onClick={() => onNavigate('home')}
              className="glass-card p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 hover:border-cyan-500/40 transition-all duration-300 group cursor-pointer space-y-4 hover:-translate-y-1 shadow-lg dark:shadow-indigo-950/20"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                <Code2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                    Coding
                  </h3>
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    Practice Arena
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Master role-specific technical problem solving with multi-language code execution and AI debugging.
                </p>
              </div>
            </div>

            {/* Pillar 3: Interview */}
            <div
              onClick={() => onNavigate('home')}
              className="glass-card p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 hover:border-purple-500/40 transition-all duration-300 group cursor-pointer space-y-4 hover:-translate-y-1 shadow-lg dark:shadow-indigo-950/20"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                    Interview
                  </h3>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                    AI Mock Coach
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Simulate technical & HR interview rounds with real-time feedback on confidence and knowledge.
                </p>
              </div>
            </div>

            {/* Pillar 4: Career Guidance */}
            <div
              onClick={() => onNavigate('home')}
              className="glass-card p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 hover:border-emerald-500/40 transition-all duration-300 group cursor-pointer space-y-4 hover:-translate-y-1 shadow-lg dark:shadow-indigo-950/20"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                    Career Guidance
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Smart Mentorship
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Receive personalized roadmap plans, skill benchmarks, and company-specific recruitment archives.
                </p>
              </div>
            </div>

          </div>

          {/* ================= TRUST STRIP ================= */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Role-Adaptive Intelligence</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Real Supabase Security</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>GitHub OAuth & Email Auth</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>End-to-End Placement Preparation</span>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
