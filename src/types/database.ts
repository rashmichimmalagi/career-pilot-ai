export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string; // References auth.users(id)
  full_name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  usn: string;
  college: string;
  department: string;
  semester: string;
  graduation_year: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileFormData {
  full_name: string;
  email: string;
  avatar_url?: string;
  usn: string;
  college: string;
  department: string;
  semester: string;
  graduation_year: string;
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
