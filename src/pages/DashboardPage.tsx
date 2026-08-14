import React, { useState } from 'react';
import {
  Compass,
  UserCheck,
  Building,
  GraduationCap,
  Calendar,
  Hash,
  BookOpen,
  FileCheck,
  Code2,
  Cpu,
  Users2,
  Building2,
  Bot,
  BarChart3,
  Sparkles,
  Lock,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Target,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EditProfileModal } from '../components/profile/EditProfileModal';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
  onOpenSetupGuide?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, profile } = useAuth();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const meta = user?.user_metadata || {};
  const rawName =
    profile?.full_name ||
    meta.full_name ||
    meta.name ||
    meta.user_name ||
    meta.preferred_username ||
    '';

  const firstName = rawName.trim() ? rawName.trim().split(' ')[0] : 'Student';
  const providerName = user?.app_metadata?.provider ? `${user.app_metadata.provider.toUpperCase()} Authenticated` : 'Authenticated Session';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans space-y-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900/10 via-slate-100 to-white dark:from-indigo-950/80 dark:via-slate-900 dark:to-slate-950 border border-indigo-500/20 shadow-lg dark:shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-[300px] h-[200px] bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{providerName}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] uppercase font-mono">
                Target Role: {profile?.target_role || 'Not Set'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Welcome back, <span className="text-indigo-600 dark:text-indigo-400">{firstName}</span>! 👋
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
              {profile?.college_name ? `${profile.college_name} • ${profile.department}` : 'Engineering Student Placement Portal'}
            </p>
          </div>

        </div>

        {/* Readiness Overview Cards with Honest Empty States */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Placement Readiness Metrics</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Stat 1: Placement Readiness */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Placement Readiness</span>
                <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="space-y-1">
                <span className="text-xl font-bold text-slate-700 dark:text-slate-300 font-mono">-- / 100</span>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>No assessment taken yet</span>
                </p>
              </div>
            </div>

            {/* Stat 2: Coding Progress */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Coding Practice</span>
                <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-1">
                <span className="text-xl font-bold text-slate-700 dark:text-slate-300 font-mono">0 Problems</span>
                <p className="text-xs text-slate-500 italic">
                  No coding activity yet
                </p>
              </div>
            </div>

            {/* Stat 3: Interview Sessions */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Interview Sessions</span>
                <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="space-y-1">
                <span className="text-xl font-bold text-slate-700 dark:text-slate-300 font-mono">0 Sessions</span>
                <p className="text-xs text-slate-500 italic">
                  No interview sessions yet
                </p>
              </div>
            </div>

            {/* Stat 4: Resume Score */}
            <div
              onClick={() => onNavigate('resume-analyzer')}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 shadow-sm dark:shadow-none space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Resume Score</span>
                <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-1">
                <span className="text-xl font-bold text-slate-700 dark:text-slate-300 font-mono group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Analyze Now →
                </span>
                <p className="text-xs text-slate-500 italic">
                  Launch Stage 2 AI ATS Analyzer
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Student Profile Card & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Card */}
          <div className="lg:col-span-1 p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                <img
                  src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                  alt={profile?.full_name || 'Profile'}
                  className="w-14 h-14 rounded-full border-2 border-indigo-500/40 object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-lg">
                  {(profile?.full_name || user?.email || 'S').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                  {profile?.full_name || user?.user_metadata?.full_name || 'Student'}
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Target Role: {profile?.target_role || 'Not Set'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider text-[10px]">Academic Details</h4>
              
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>USN</span>
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{profile?.usn || 'Not Set'}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>College</span>
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px] text-right">{profile?.college_name || 'Not Set'}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Department</span>
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px] text-right">{profile?.department || 'Not Set'}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Semester</span>
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{profile?.semester || 'Not Set'}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Graduation</span>
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{profile?.graduation_year || 'Not Set'}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Career Goal</span>
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px] text-right">{profile?.career_goal || 'Not Set'}</span>
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Target Role</span>
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px] text-right">{profile?.target_role || 'Not Set'}</span>
              </div>
            </div>

            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Update Academic Profile
            </button>
          </div>

          {/* Module Roadmap & Previews */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Placement Preparation Modules</span>
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">Stage 1 Foundation Built</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div
                onClick={() => onNavigate('resume-analyzer')}
                className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-white to-purple-500/5 dark:from-indigo-950/40 dark:via-slate-900/80 dark:to-slate-900 border border-indigo-500/30 hover:border-indigo-500 shadow-sm hover:shadow-md dark:hover:shadow-indigo-950/40 transition-all duration-200 space-y-3 cursor-pointer group relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1 font-mono">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span>Stage 2 Live</span>
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                    <span>AI Resume Analyzer</span>
                    <span className="text-xs text-indigo-500 group-hover:translate-x-0.5 transition-transform">→</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Upload resume for instant ATS match against engineering job descriptions.</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1 font-mono">
                    <Lock className="w-3 h-3" />
                    <span>Coming in Stage 2</span>
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">Coding Practice Arena</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Curated algorithmic problems with AI debugging hints and test suites.</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1 font-mono">
                    <Lock className="w-3 h-3" />
                    <span>Coming in Stage 2</span>
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">Technical Interview Mock</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Simulate live technical interview rounds with instant feedback.</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                    <Users2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1 font-mono">
                    <Lock className="w-3 h-3" />
                    <span>Coming in Stage 2</span>
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">HR Interview Simulator</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Practice STAR framework responses for behavioral placement questions.</p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </div>
  );
};
