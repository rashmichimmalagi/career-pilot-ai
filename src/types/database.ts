export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string; // References auth.users(id)
  full_name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  usn: string;
  college_name: string;
  department: string;
  semester: string;
  graduation_year: string;
  career_goal?: string;
  target_role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileFormData {
  full_name: string;
  email: string;
  avatar_url?: string;
  usn: string;
  college_name: string;
  department: string;
  semester: string;
  graduation_year: string;
  career_goal: string;
  target_role: string;
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
