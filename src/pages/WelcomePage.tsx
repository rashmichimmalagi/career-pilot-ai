import React from 'react';
import {
  Compass,
  ArrowRight,
  FileCheck,
  Target,
  Code2,
  Trophy,
  Sparkles,
  LayoutDashboard,
  CheckCircle2,
  ChevronRight
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
    onNavigate('home');
  };

  const handleSignIn = () => {
    onNavigate('auth?mode=signin');
  };

  const STAGES = [
    {
      num: '01',
      title: 'Discover',
      subtitle: 'Resume & Career Goals',
      desc: 'Assess your target role requirements, evaluate current skills, and analyze resume alignment.',
      icon: FileCheck,
      badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    },
    {
      num: '02',
      title: 'Prepare',
      subtitle: 'Skills & Knowledge',
      desc: 'Close critical knowledge gaps with tailored roadmap milestones and company recruitment intel.',
      icon: Target,
      badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    {
      num: '03',
      title: 'Practice',
      subtitle: 'Coding & Interviews',
      desc: 'Solve interactive coding challenges and simulate live technical and HR interviews with AI feedback.',
      icon: Code2,
      badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    },
    {
      num: '04',
      title: 'Succeed',
      subtitle: 'Placement Readiness',
      desc: 'Track placement readiness metrics, refine response strategies, and land your ideal career role.',
      icon: Trophy,
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300 overflow-hidden">
      {/* Background Floating Bubbles & Ambient Glow */}
      <BackgroundBubbles />

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/15 to-cyan-400/15 blur-[160px] rounded-full pointer-events-none" />

      {/* ================= CENTERED HERO SECTION ================= */}
      <section className="relative pt-12 pb-10 md:pt-20 md:pb-14 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          
          {/* Welcome Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-md shadow-sm">
            <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin-slow" />
            <span>WELCOME TO CAREERPILOT AI</span>
          </div>

          {/* Main Centered Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
            Your Career Journey <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 dark:from-indigo-400 dark:via-purple-300 dark:to-cyan-400 bg-clip-text text-transparent">
              Starts Here
            </span>
          </h1>

          {/* Subheadings */}
          <div className="space-y-3 max-w-3xl mx-auto">
            <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
              AI-powered preparation for resumes, coding, interviews, and your future career.
            </p>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Prepare smarter. Practice better. Build the confidence to succeed in placements and beyond.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            {user ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer group"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Go to Student Dashboard →</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleGetStarted}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer group"
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

        </div>
      </section>

      {/* ================= CAREER PREPARATION JOURNEY (PROGRESSIVE ROADMAP) ================= */}
      <section className="relative py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              CAREER PREPARATION JOURNEY
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
              Discover → Prepare → Practice → Succeed
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Four progressive milestones guiding you from initial assessment to placement success.
            </p>
          </div>

          {/* Progressive Stages Grid with Glowing Connecting Path */}
          <div className="relative">
            
            {/* Horizontal Glowing Path Line (Desktop) */}
            <div className="hidden lg:block absolute top-1/2 left-[8%] right-[8%] -translate-y-8 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 via-cyan-500 to-emerald-500 rounded-full blur-[1px] opacity-70 z-0" />
            <div className="hidden lg:block absolute top-1/2 left-[8%] right-[8%] -translate-y-8 h-0.5 bg-gradient-to-r from-indigo-400 via-purple-400 via-cyan-400 to-emerald-400 rounded-full z-0" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {STAGES.map((stage) => {
                const IconComp = stage.icon;
                return (
                  <div
                    key={stage.num}
                    onClick={() => onNavigate('home')}
                    className="glass-card p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-500/50 transition-all duration-300 group cursor-pointer space-y-4 hover:-translate-y-1.5 shadow-lg dark:shadow-indigo-950/20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black font-mono text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {stage.num}
                        </span>
                        <div className={`w-10 h-10 rounded-2xl ${stage.badgeClass} flex items-center justify-center border group-hover:scale-110 transition-transform shadow-sm`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Stage Name & Focus */}
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                          {stage.title}
                        </h3>
                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 pt-0.5">
                          {stage.subtitle}
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {stage.desc}
                      </p>
                    </div>

                    {/* Bottom Link */}
                    <div className="pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                      <span>View Capabilities</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </section>

      {/* ================= REASSURANCE STRIP ================= */}
      <section className="py-8 border-t border-slate-200/80 dark:border-slate-800/80 mt-auto bg-slate-100/40 dark:bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-600 dark:text-slate-400">
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
            <span>End-to-End Placement Readiness</span>
          </div>
        </div>
      </section>
    </div>
  );
};
