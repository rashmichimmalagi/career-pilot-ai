import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  GraduationCap,
  BookOpen,
  Hash,
  Layers,
  Award,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';

interface EditAcademicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLLEGE_OPTIONS = [
  'RV College of Engineering (RVCE)',
  'PES University',
  'BMS College of Engineering (BMSCE)',
  'M.S. Ramaiah Institute of Technology (MSRIT)',
  'Bangalore Institute of Technology (BIT)',
  'Dayananda Sagar College of Engineering (DSCE)',
  'Sir M. Visvesvaraya Institute of Technology (SMVIT)',
  'National Institute of Engineering (NIE)',
  'Siddaganga Institute of Technology (SIT)',
  'JSS Science and Technology University (SJCE)',
  'Indian Institute of Science (IISc)',
  'IIT Dharwad',
  'IIIT Bangalore',
  'NIT Karnataka, Surathkal',
  'Manipal Institute of Technology (MIT)',
  'Vellore Institute of Technology (VIT)',
  'Other University / Autonomous College',
];

const DEGREE_OPTIONS = [
  'Bachelor of Engineering (B.E. / B.Tech)',
  'Bachelor of Technology (B.Tech)',
  'Master of Technology (M.Tech)',
  'Master of Computer Applications (MCA)',
  'Bachelor of Computer Applications (BCA)',
  'Bachelor of Science in Computer Science (B.Sc CS)',
  'Master of Science (M.Sc)',
  'Dual Degree (B.Tech + M.Tech)',
  'Other Degree Program',
];

const DEPARTMENT_OPTIONS = [
  'Computer Science & Engineering',
  'Information Science & Engineering',
  'Artificial Intelligence & Machine Learning',
  'Data Science',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Robotics & Automation',
  'Cybersecurity',
  'Biotechnology',
  'Other Branch / Department',
];

export const EditAcademicModal: React.FC<EditAcademicModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, setProfileState, refreshProfile, showToast } = useAuth();

  const [formData, setFormData] = useState({
    college_name: '',
    degree: '',
    department: '',
    usn: '',
    semester: '7',
    graduation_year: '2026',
    cgpa: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load existing values for the authenticated student
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        college_name: profile?.college_name || '',
        degree: profile?.degree || 'Bachelor of Engineering (B.E. / B.Tech)',
        department: profile?.department || 'Computer Science & Engineering',
        usn: profile?.usn || '',
        semester: profile?.semester || '7',
        graduation_year: profile?.graduation_year || '2026',
        cgpa: profile?.cgpa ? String(profile.cgpa) : '',
      });
      setFormError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, user, profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setFormError('You must be logged in to update your academic information.');
      return;
    }

    setFormError(null);

    // Validation for College
    if (!formData.college_name.trim()) {
      setFormError('Please provide your College / University name.');
      return;
    }

    // Validation for Degree
    if (!formData.degree.trim()) {
      setFormError('Please provide your Degree Program.');
      return;
    }

    // Validation for Department
    if (!formData.department.trim()) {
      setFormError('Please provide your Branch / Department.');
      return;
    }

    // Validation for USN
    if (!formData.usn.trim()) {
      setFormError('Please enter your University Seat Number (USN).');
      return;
    }

    // Validation for Semester
    if (!formData.semester) {
      setFormError('Please select your Current Semester.');
      return;
    }

    // Validation for Graduation Year
    if (!formData.graduation_year) {
      setFormError('Please select your Graduation Year.');
      return;
    }

    // Validation for CGPA (0.0 to 10.0 scale, allowing decimals e.g. 8.2, 8.42, 9.05)
    let validatedCgpa = '';
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

      validatedCgpa = cleanVal;
    }

    setIsSubmitting(true);

    try {
      const academicPayload = {
        college_name: formData.college_name.trim(),
        degree: formData.degree.trim(),
        department: formData.department.trim(),
        usn: formData.usn.trim().toUpperCase(),
        semester: formData.semester,
        graduation_year: formData.graduation_year,
        cgpa: validatedCgpa,
      };

      const { profile: updatedProfile, error } = await profileService.updateProfile(
        user.id,
        academicPayload
      );

      if (error) {
        setFormError(error.message || 'Failed to save academic details.');
      } else {
        setSuccessMessage('Academic details saved successfully!');
        if (updatedProfile) {
          setProfileState(updatedProfile);
        }
        await refreshProfile();
        showToast('Academic Info Updated', 'Your academic credentials have been saved.', 'success');

        setTimeout(() => {
          onClose();
        }, 400);
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="academic-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 id="academic-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Academic Information
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update your university credentials, department, and academic records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 flex items-start gap-3 text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. College / University */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>College / University</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={formData.college_name}
                  onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                  placeholder="e.g. RV College of Engineering, PES University"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                  required
                />
                <select
                  aria-label="Select college suggestion"
                  onChange={(e) => {
                    if (e.target.value && e.target.value !== 'Other University / Autonomous College') {
                      setFormData({ ...formData, college_name: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>Or pick from popular institutions...</option>
                  {COLLEGE_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Degree Program */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Degree Program</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                placeholder="e.g. Bachelor of Engineering (B.E. / B.Tech)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                required
              />
              <select
                aria-label="Select degree suggestion"
                onChange={(e) => {
                  if (e.target.value) {
                    setFormData({ ...formData, degree: e.target.value });
                  }
                }}
                className="w-full px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled>Suggestions...</option>
                {DEGREE_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Branch / Department */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Branch / Department</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                required
              />
              <select
                aria-label="Select department suggestion"
                onChange={(e) => {
                  if (e.target.value) {
                    setFormData({ ...formData, department: e.target.value });
                  }
                }}
                className="w-full px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled>Suggestions...</option>
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. University Seat Number (USN) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>University Seat Number (USN)</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.usn}
                onChange={(e) => setFormData({ ...formData, usn: e.target.value.toUpperCase() })}
                placeholder="e.g. 1RV21CS001"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-mono focus:border-indigo-500 focus:outline-none transition-colors uppercase"
                required
              />
            </div>

            {/* 5. Current Semester */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Current Semester</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num.toString()}>
                    Semester {num}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Graduation Year */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Graduation Year</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.graduation_year}
                onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                required
              >
                {['2024', '2025', '2026', '2027', '2028', '2029', '2030'].map((yr) => (
                  <option key={yr} value={yr}>
                    Class of {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* 7. Cumulative GPA (CGPA) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Cumulative GPA (CGPA)</span>
              </label>
              <input
                type="text"
                value={formData.cgpa}
                onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                placeholder="Enter your CGPA (e.g. 8.42)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Numeric scale from 0.0 to 10.0 (e.g. 8.2, 8.42, 9.05). Leave empty if not yet available.
              </p>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
