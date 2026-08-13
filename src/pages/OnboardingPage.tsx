import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, UserCheck, Building, GraduationCap, Calendar, Hash, BookOpen, AlertCircle, Loader2, Target, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import { ProfileFormData } from '../types/database';

interface OnboardingPageProps {
  onNavigate: (page: string) => void;
}

const getAuthFullName = (u: any): string => {
  if (!u) return '';
  const meta = u.user_metadata || {};
  const identityData = u.identities?.[0]?.identity_data || {};

  const name =
    meta.full_name ||
    meta.name ||
    meta.preferred_username ||
    meta.user_name ||
    identityData.full_name ||
    identityData.name ||
    identityData.preferred_username ||
    identityData.user_name ||
    '';

  return typeof name === 'string' ? name.trim() : '';
};

const getAuthAvatarUrl = (u: any): string => {
  if (!u) return '';
  const meta = u.user_metadata || {};
  const identityData = u.identities?.[0]?.identity_data || {};

  const avatar =
    meta.avatar_url ||
    meta.picture ||
    identityData.avatar_url ||
    identityData.picture ||
    '';

  return typeof avatar === 'string' ? avatar.trim() : '';
};

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigate }) => {
  const { user, profile, loading, setProfileState } = useAuth();

  const authFullName = getAuthFullName(user);
  const authEmail = user?.email || '';
  const authAvatar = getAuthAvatarUrl(user);

  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: authFullName,
    email: authEmail,
    avatar_url: authAvatar,
    usn: '',
    college: '',
    department: '',
    semester: '',
    graduation_year: '',
    career_goal: '',
    target_role: '',
  });

  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Synchronize authenticated user metadata when user state finishes loading or updates
  useEffect(() => {
    if (user) {
      const currentAuthName = getAuthFullName(user);
      const currentAuthEmail = user.email || '';
      const currentAuthAvatar = getAuthAvatarUrl(user);

      setFormData((prev) => ({
        ...prev,
        email: currentAuthEmail,
        avatar_url: prev.avatar_url || currentAuthAvatar,
        full_name: isNameManuallyEdited ? prev.full_name : (prev.full_name || currentAuthName),
      }));
    }
  }, [user, isNameManuallyEdited]);

  // If profile already exists, redirect directly to dashboard
  useEffect(() => {
    if (!loading && profile) {
      onNavigate('dashboard');
    }
  }, [loading, profile, onNavigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
      setFormError('Authentication required. Please sign in with Google or GitHub first.');
      return;
    }

    if (!formData.full_name.trim()) {
      setFormError('Please enter your Full Name.');
      return;
    }

    if (!formData.usn.trim()) {
      setFormError('Please enter your USN / Roll Number.');
      return;
    }

    if (!formData.college.trim()) {
      setFormError('Please enter your College Name.');
      return;
    }

    if (!formData.department) {
      setFormError('Please select your Department / Branch.');
      return;
    }

    if (!formData.semester) {
      setFormError('Please select your Current Semester.');
      return;
    }

    if (!formData.graduation_year) {
      setFormError('Please select your Graduation Year.');
      return;
    }

    if (!formData.career_goal) {
      setFormError('Please select your Career Goal.');
      return;
    }

    if (!formData.target_role.trim()) {
      setFormError('Please enter your Target Role.');
      return;
    }

    try {
      setIsSubmitting(true);
      const { profile: newProfile, error: dbError } = await profileService.createProfile(user.id, formData);

      if (dbError) {
        setFormError(dbError.message || 'Failed to save student profile in database. Please verify SQL setup.');
        setIsSubmitting(false);
        return;
      }

      if (newProfile) {
        setProfileState(newProfile);
        onNavigate('dashboard');
      }
    } catch (err: any) {
      console.error('Onboarding Submission Error:', err);
      setFormError(err.message || 'An error occurred while creating your profile.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-600 dark:text-slate-300 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400" />
        <span>Loading onboarding session...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans transition-colors duration-300">
      <div className="max-w-2xl w-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Authentication Verified</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Welcome to CareerPilot AI 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Let's personalize your career journey with your academic and role preferences.
          </p>
        </div>

        {/* Authenticated Provider Populated Profile Summary */}
        <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          {authAvatar ? (
            <img
              src={authAvatar}
              alt={formData.full_name || authEmail || 'User Avatar'}
              className="w-12 h-12 rounded-full border-2 border-indigo-500/40 object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-base">
              {(formData.full_name || authEmail || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Authenticated Account</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{formData.full_name || authEmail || 'Authenticated Account'}</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono truncate">{formData.email}</p>
          </div>

          <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Verified
          </span>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-800 dark:text-rose-200">Onboarding Error</p>
              <p>{formError}</p>
            </div>
          </div>
        )}

        {/* Onboarding Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => {
                  setIsNameManuallyEdited(true);
                  setFormData({ ...formData, full_name: e.target.value });
                }}
                required
                placeholder="Enter your full name"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Email (Read-Only) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Authenticated Email (Read-Only)</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Provided by Auth Provider</span>
              </label>
              <input
                type="email"
                value={formData.email}
                readOnly
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-mono cursor-not-allowed"
              />
            </div>

            {/* USN */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>USN / Roll Number <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                value={formData.usn}
                onChange={(e) => setFormData({ ...formData, usn: e.target.value.toUpperCase() })}
                required
                placeholder="Enter your USN / Roll Number"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-mono focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            {/* College Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>College Name <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                required
                placeholder="Enter your college name"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Department / Branch <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
              >
                <option value="" disabled>Select your department / branch</option>
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Information Science / Information Technology">Information Science / Information Technology</option>
                <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning</option>
                <option value="Data Science">Data Science</option>
                <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Chemical Engineering">Chemical Engineering</option>
                <option value="Aerospace Engineering">Aerospace Engineering</option>
                <option value="Biotechnology">Biotechnology</option>
                <option value="Industrial Engineering">Industrial Engineering</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Semester */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Current Semester <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
              >
                <option value="" disabled>Select current semester</option>
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="3rd Semester">3rd Semester</option>
                <option value="4th Semester">4th Semester</option>
                <option value="5th Semester">5th Semester</option>
                <option value="6th Semester">6th Semester</option>
                <option value="7th Semester">7th Semester</option>
                <option value="8th Semester">8th Semester</option>
                <option value="Graduated / Alumni">Graduated / Alumni</option>
              </select>
            </div>

            {/* Graduation Year */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Graduation Year <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={formData.graduation_year}
                onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
              >
                <option value="" disabled>Select graduation year</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2029">2029</option>
                <option value="2030">2030</option>
              </select>
            </div>

            {/* Career Goal */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Career Goal <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={formData.career_goal}
                onChange={(e) => setFormData({ ...formData, career_goal: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
              >
                <option value="" disabled>Select your career goal</option>
                <option value="Software / IT">Software / IT</option>
                <option value="AI / Data">AI / Data</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Electronics / Embedded">Electronics / Embedded</option>
                <option value="Core Engineering">Core Engineering</option>
                <option value="Research">Research</option>
                <option value="Business / Management">Business / Management</option>
                <option value="Government / Public Sector">Government / Public Sector</option>
                <option value="Higher Studies">Higher Studies</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Target Role */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Target Role <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                value={formData.target_role}
                onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                required
                placeholder="Enter your target role"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>

          </div>

          {/* Role Security Note */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-800 dark:text-slate-300">Security Note:</span> Your profile role will default to <code className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">student</code>. Admin permissions are protected and restricted at database level.
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Student Profile in Database...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Continue to CareerPilot Dashboard</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
};
