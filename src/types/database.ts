export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string; // References auth.users(id)
  full_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  usn: string;
  college_name: string;
  degree?: string;
  department: string;
  current_year?: string;
  semester: string;
  graduation_year: string;
  cgpa?: string;
  career_goal?: string;
  target_role?: string;
  target_companies?: string[];
  preferred_domain?: string;
  preferred_location?: string;
  programming_languages?: string[];
  technical_skills?: string[];
  tools_technologies?: string[];
  preparation_level?: string;
  preferred_language?: string;
  dsa_level?: string;
  interview_experience?: string;
  role?: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileFormData {
  full_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  usn: string;
  college_name: string;
  degree?: string;
  department: string;
  current_year?: string;
  semester: string;
  graduation_year: string;
  cgpa?: string;
  career_goal?: string;
  target_role?: string;
  target_companies?: string[];
  preferred_domain?: string;
  preferred_location?: string;
  programming_languages?: string[];
  technical_skills?: string[];
  tools_technologies?: string[];
  preparation_level?: string;
  preferred_language?: string;
  dsa_level?: string;
  interview_experience?: string;
}

export interface FeaturePreviewItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  badge: string;
  gradient: string;
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
  iconName: string;
}
