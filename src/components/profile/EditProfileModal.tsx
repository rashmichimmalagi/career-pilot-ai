import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  GraduationCap,
  Calendar,
  Hash,
  BookOpen,
  Target,
  Briefcase,
  AlertCircle,
  Loader2,
  CheckCircle2,
  User,
  Mail,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Award,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { Profile } from '../../types/database';
import { supabase } from '../../lib/supabase';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, setProfileState, refreshProfile, refreshUser, setUserState, showToast } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    usn: '',
    college_name: '',
    degree: '',
    department: '',
    current_year: '',
    semester: '',
    cgpa: '',
    graduation_year: '',
    career_goal: '',
    target_role: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAddingPassword, setIsAddingPassword] = useState(false);
  const [passwordAddedSuccess, setPasswordAddedSuccess] = useState(false);

  // Determine login provider status from real Supabase user authentication metadata
  const providers = user?.app_metadata?.providers || [];
  const identities = user?.identities || [];
  const userMetadata = user?.user_metadata || {};

  const isGitHubConnected = Boolean(
    user?.app_metadata?.provider === 'github' ||
    providers.includes('github') ||
    identities.some((i: any) => i.provider === 'github')
  );

  const hasEmailPassword = Boolean(
    passwordAddedSuccess ||
    user?.app_metadata?.provider === 'email' ||
    providers.includes('email') ||
    identities.some((i: any) => i.provider === 'email') ||
    userMetadata.has_password === true ||
    userMetadata.email_login_enabled === true ||
    userMetadata.password_configured === true ||
    Boolean(userMetadata.password_updated_at)
  );

  // Debug logging for authentication methods
  useEffect(() => {
    if (isOpen && user) {
      console.log('[Auth Methods] Current user ID:', user.id);
      console.log('[Auth Methods] Current email:', user.email);
      console.log('[Auth Methods] GitHub provider connected:', isGitHubConnected);
      console.log('[Auth Methods] Email/Password connected:', hasEmailPassword);
    }
  }, [isOpen, user, isGitHubConnected, hasEmailPassword]);

  const handleToggleEmailPasswordCard = () => {
    if (hasEmailPassword) {
      setShowChangePassword((prev) => {
        const next = !prev;
        if (next) console.log('[Auth Methods] Password form opened');
        return next;
      });
      setShowAddPassword(false);
    } else {
      console.log('[Auth Methods] Add Password clicked');
      setShowAddPassword((prev) => {
        const next = !prev;
        if (next) console.log('[Auth Methods] Password form opened');
        return next;
      });
      setShowChangePassword(false);
    }
  };

  const handleCancelPasswordForm = () => {
    setShowAddPassword(false);
    setShowChangePassword(false);
    setNewPassword('');
    setConfirmNewPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSavePassword = async (isUpdatingExisting = false) => {
    if (isAddingPassword) return;

    if (!newPassword) {
      showToast('Password required', 'Please enter a password.', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password too short', 'Password must be at least 6 characters long.', 'warning');
      return;
    }

    if (!confirmNewPassword) {
      showToast('Confirm password required', 'Please confirm your password.', 'warning');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast('Passwords do not match', 'Please ensure both password fields match exactly.', 'warning');
      return;
    }

    setIsAddingPassword(true);
    console.log('[Auth Methods] Password save started');

    try {
      // Verify active authenticated session first
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !currentUser) {
        console.log('[Auth Methods] Password save failed:', userError?.message || 'No active session');
        showToast('Session Expired', 'Your session has expired. Please sign in again.', 'warning');
        return;
      }

      // Update password for the current authenticated user with persistent metadata flags
      const { data: updateData, error } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          has_password: true,
          email_login_enabled: true,
          password_configured: true,
          password_updated_at: new Date().toISOString(),
        }
      });

      if (error) {
        console.log('[Auth Methods] Password save failed:', error.message);
        
        // If the error indicates that the password is the same as the old password,
        // it confirms that password authentication is already active on this exact account!
        if (
          error.message?.toLowerCase().includes('same as') ||
          error.message?.toLowerCase().includes('different from the old password') ||
          error.message?.toLowerCase().includes('should be different')
        ) {
          // Synchronize metadata to reflect password exists
          const { data: metaData } = await supabase.auth.updateUser({
            data: {
              has_password: true,
              email_login_enabled: true,
              password_configured: true,
              password_updated_at: new Date().toISOString(),
            }
          });

          if (metaData?.user && setUserState) {
            setUserState(metaData.user);
          }

          setPasswordAddedSuccess(true);
          handleCancelPasswordForm();

          showToast(
            'Email & Password Configured',
            'Email & Password login is already enabled.',
            'info'
          );

          if (refreshUser) {
            await refreshUser();
          }
          if (refreshProfile) {
            await refreshProfile();
          }
          return;
        }

        showToast(
          'Unable to save password',
          error.message || 'Unable to configure Email & Password login. Please try again.',
          'error'
        );
        return;
      }

      console.log('[Auth Methods] Password save succeeded');

      if (updateData?.user && setUserState) {
        setUserState(updateData.user);
      }

      setPasswordAddedSuccess(true);
      handleCancelPasswordForm();

      showToast(
        isUpdatingExisting ? 'Password Updated' : 'Email & Password Added',
        isUpdatingExisting
          ? 'Password updated successfully.'
          : 'Email & Password login enabled successfully.',
        'success'
      );

      if (refreshUser) {
        await refreshUser();
      }
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (err: any) {
      console.log('[Auth Methods] Password save failed:', err.message || 'Exception');
      showToast(
        'Unable to configure password',
        err.message || 'Unable to update Email & Password login. Please try again.',
        'error'
      );
    } finally {
      setIsAddingPassword(false);
    }
  };

  // Pre-fill existing profile data and reset password forms when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowAddPassword(false);
      setShowChangePassword(false);
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      if (refreshUser) {
        refreshUser();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        full_name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: profile?.email || user.email || '',
        usn: profile?.usn || '',
        college_name: profile?.college_name || '',
        degree: profile?.degree || 'Bachelor of Technology (B.Tech)',
        department: profile?.department || '',
        current_year: profile?.current_year || 'Final Year (4th Year)',
        semester: profile?.semester || '',
        cgpa: profile?.cgpa ? String(profile.cgpa) : '',
        graduation_year: profile?.graduation_year ? String(profile.graduation_year) : '',
        career_goal: profile?.career_goal || '',
        target_role: profile?.target_role || '',
      });
      setFormError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, profile, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!user) {
      setFormError('Authentication required to save profile.');
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
    if (!formData.college_name.trim()) {
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

    // Validation for CGPA (Cumulative GPA)
    let formattedCgpa = '';
    if (formData.cgpa && formData.cgpa.trim()) {
      const cleanVal = formData.cgpa.trim();
      const num = parseFloat(cleanVal);

      if (isNaN(num) || !/^-?\d+(\.\d+)?$/.test(cleanVal)) {
        setFormError('Please enter a valid numeric CGPA (e.g. 8.42).');
        return;
      }

      if (num < 0 || num > 10.0) {
        setFormError('CGPA must be a value between 0.0 and 10.0 (e.g. 8.42).');
        return;
      }

      formattedCgpa = cleanVal;
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

    setIsSubmitting(true);

    try {
      const updates: Partial<Profile> = {
        full_name: formData.full_name.trim(),
        usn: formData.usn.trim().toUpperCase(),
        college_name: formData.college_name.trim(),
        degree: formData.degree,
        department: formData.department,
        current_year: formData.current_year,
        semester: formData.semester,
        graduation_year: formData.graduation_year,
        cgpa: formattedCgpa,
        career_goal: formData.career_goal,
        target_role: formData.target_role.trim(),
      };

      const { profile: updatedProfile, error: dbError } = await profileService.updateProfile(
        user.id,
        updates
      );

      if (dbError) {
        setFormError(dbError.message || 'Failed to update academic profile in database.');
      } else {
        setSuccessMessage('Profile updated successfully!');
        if (updatedProfile) {
          setProfileState(updatedProfile);
        }
        await refreshProfile();
        setTimeout(() => {
          onClose();
        }, 400);
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while updating your profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <User className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                Update Academic Profile
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Keep your academic details and career target roles updated for tailored recommendations.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Status Messages */}
          {formError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-800 dark:text-rose-200">Update Failed</p>
                <p>{formError}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>College / Institution Name <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={formData.college_name}
                  onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                  required
                  placeholder="Enter your college or institution name"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Degree Program */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Degree Program <span className="text-rose-500">*</span></span>
                </label>
                <select
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                >
                  <option value="" disabled>Select degree program</option>
                  <option value="Bachelor of Engineering (B.E. / B.Tech)">Bachelor of Engineering (B.E. / B.Tech)</option>
                  <option value="Bachelor of Technology (B.Tech)">Bachelor of Technology (B.Tech)</option>
                  <option value="Bachelor of Computer Applications (BCA)">Bachelor of Computer Applications (BCA)</option>
                  <option value="Bachelor of Science (B.Sc)">Bachelor of Science (B.Sc)</option>
                  <option value="Master of Technology (M.Tech)">Master of Technology (M.Tech)</option>
                  <option value="Master of Computer Applications (MCA)">Master of Computer Applications (MCA)</option>
                  <option value="Master of Science (M.Sc)">Master of Science (M.Sc)</option>
                  <option value="Other">Other Degree</option>
                </select>
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
                  <option value="" disabled>Select department / branch</option>
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

              {/* Current Academic Year */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Academic Year</span>
                </label>
                <select
                  value={formData.current_year}
                  onChange={(e) => setFormData({ ...formData, current_year: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="Final Year (4th Year)">Final Year (4th Year)</option>
                  <option value="Graduated / Alumni">Graduated / Alumni</option>
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

              {/* Cumulative GPA (CGPA) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Cumulative GPA (CGPA)</span>
                </label>
                <input
                  type="text"
                  value={formData.cgpa}
                  onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                  placeholder="e.g. 8.42"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Enter your current cumulative GPA on a 10-point scale.
                </p>
              </div>

              {/* Graduation Year */}
              <div className="space-y-1.5 sm:col-span-2">
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
                  <option value="" disabled>Select career goal</option>
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
                  placeholder="Enter your target role (e.g., Software Developer, Data Analyst)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Login Methods Section */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Login Methods</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Authentication methods connected to your single CareerPilot account.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* GitHub Method */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">GitHub</p>
                      <p className="text-[10px] text-slate-500">OAuth Login</p>
                    </div>
                  </div>
                  {isGitHubConnected ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Connected</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Not Linked</span>
                  )}
                </div>

                {/* Email & Password Method (Fully interactive card) */}
                <div
                  id="email-password-auth-card"
                  role="button"
                  tabIndex={0}
                  onClick={handleToggleEmailPasswordCard}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleEmailPasswordCard();
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between group ${
                    showAddPassword || showChangePassword
                      ? 'bg-indigo-500/10 border-indigo-500/40 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 hover:bg-slate-100/70 dark:hover:bg-slate-900/70'
                  }`}
                  title={hasEmailPassword ? 'Click to change password' : 'Click to add email & password login'}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Email & Password
                      </p>
                      <p className="text-[10px] text-slate-500">Password Login</p>
                    </div>
                  </div>
                  {hasEmailPassword ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Connected</span>
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      id="add-password-card-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleEmailPasswordCard();
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                    >
                      {showAddPassword ? 'Cancel' : 'Add Password'}
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Add Password Form (When password not configured yet) */}
              {showAddPassword && !hasEmailPassword && (
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Add Email & Password Login
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Set a password for <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{user?.email}</span> to enable logging in via Email & Password while preserving your existing user ID and profile data.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="New Password (min 6 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm New Password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleCancelPasswordForm}
                      className="px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSavePassword(false)}
                      disabled={isAddingPassword}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isAddingPassword ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save Password</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Expandable Change Password Form (When password is already configured) */}
              {showChangePassword && hasEmailPassword && (
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Change Password
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Update the password for your account (<span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{user?.email}</span>).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="New Password (min 6 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm New Password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleCancelPasswordForm}
                      className="px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSavePassword(true)}
                      disabled={isAddingPassword}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isAddingPassword ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <span>Update Password</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-profile-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
