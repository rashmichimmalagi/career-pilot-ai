export const SUPABASE_SETUP_SQL = `-- ==============================================================================
-- CareerPilot - Complete Supabase Database Schema & RLS Setup Script
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- 1. Open Supabase Dashboard (https://app.supabase.com)
-- 2. Select your Project -> Click "SQL Editor" in the left sidebar
-- 3. Click "New Query", paste this entire script, and click "Run"
-- ==============================================================================

-- 1. PROFILES TABLE & EXTENDED COLUMNS
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  avatar_url text DEFAULT '',
  phone text,
  usn text DEFAULT '',
  college_name text DEFAULT '',
  degree text DEFAULT '',
  department text DEFAULT '',
  current_year text DEFAULT '',
  semester text DEFAULT '',
  graduation_year text DEFAULT '',
  cgpa numeric,
  career_goal text DEFAULT '',
  target_role text DEFAULT '',
  target_companies jsonb DEFAULT '[]'::jsonb,
  preferred_domain text DEFAULT '',
  preferred_location text DEFAULT '',
  programming_languages jsonb DEFAULT '[]'::jsonb,
  technical_skills jsonb DEFAULT '[]'::jsonb,
  tools_technologies jsonb DEFAULT '[]'::jsonb,
  skills jsonb DEFAULT '[]'::jsonb,
  certifications jsonb DEFAULT '[]'::jsonb,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  bio text,
  preferences jsonb DEFAULT '{}'::jsonb,
  profile_data jsonb DEFAULT '{}'::jsonb,
  preparation_level text,
  preferred_language text,
  dsa_level text,
  interview_experience text,
  role text DEFAULT 'student',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure all columns exist on existing profiles table if table was created earlier
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_data jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS career_goal text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_role text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_companies jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- 2. RESUMES TABLE
CREATE TABLE IF NOT EXISTS public.resumes (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL DEFAULT 'resume.pdf',
  target_role text DEFAULT '',
  resume_text text DEFAULT '',
  analysis_result jsonb DEFAULT '{}'::jsonb,
  is_current boolean DEFAULT true,
  version numeric DEFAULT 1,
  version_label text DEFAULT 'Version 1.0',
  storage_path text DEFAULT '',
  ats_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own resumes" ON public.resumes;
CREATE POLICY "Users can view own resumes" ON public.resumes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own resumes" ON public.resumes;
CREATE POLICY "Users can insert own resumes" ON public.resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own resumes" ON public.resumes;
CREATE POLICY "Users can update own resumes" ON public.resumes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own resumes" ON public.resumes;
CREATE POLICY "Users can delete own resumes" ON public.resumes
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);

-- 3. CODING SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.coding_submissions (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id text NOT NULL DEFAULT '',
  problem_title text DEFAULT '',
  language text DEFAULT 'javascript',
  code text DEFAULT '',
  status text DEFAULT 'submitted',
  status_text text DEFAULT '',
  test_cases_passed integer DEFAULT 0,
  total_test_cases integer DEFAULT 0,
  runtime_ms integer DEFAULT 0,
  execution_time_ms integer DEFAULT 0,
  memory_kb numeric DEFAULT 0,
  memory_used_kb numeric DEFAULT 0,
  time_complexity text DEFAULT '',
  space_complexity text DEFAULT '',
  topic text DEFAULT 'General',
  difficulty text DEFAULT 'Medium',
  ai_feedback jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  submitted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.coding_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own coding submissions" ON public.coding_submissions;
CREATE POLICY "Users can view own coding submissions" ON public.coding_submissions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own coding submissions" ON public.coding_submissions;
CREATE POLICY "Users can insert own coding submissions" ON public.coding_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own coding submissions" ON public.coding_submissions;
CREATE POLICY "Users can update own coding submissions" ON public.coding_submissions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own coding submissions" ON public.coding_submissions;
CREATE POLICY "Users can delete own coding submissions" ON public.coding_submissions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coding_submissions_user_id ON public.coding_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_coding_submissions_problem ON public.coding_submissions(problem_id);

-- 4. SAVED CODING QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.saved_coding_questions (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id text NOT NULL DEFAULT '',
  problem_title text DEFAULT '',
  difficulty text DEFAULT 'Medium',
  topic text DEFAULT 'General',
  notes text DEFAULT '',
  saved_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.saved_coding_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saved questions" ON public.saved_coding_questions;
CREATE POLICY "Users can view own saved questions" ON public.saved_coding_questions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved questions" ON public.saved_coding_questions;
CREATE POLICY "Users can insert own saved questions" ON public.saved_coding_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saved questions" ON public.saved_coding_questions;
CREATE POLICY "Users can update own saved questions" ON public.saved_coding_questions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved questions" ON public.saved_coding_questions;
CREATE POLICY "Users can delete own saved questions" ON public.saved_coding_questions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_questions_user_id ON public.saved_coding_questions(user_id);

-- 5. PLACEMENT SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.placement_sessions (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text DEFAULT 'Technical',
  subject text DEFAULT 'General',
  topic text DEFAULT 'General',
  difficulty text DEFAULT 'Medium',
  mode text DEFAULT 'practice',
  score numeric DEFAULT 0,
  accuracy numeric DEFAULT 0,
  total_questions integer DEFAULT 0,
  correct_count integer DEFAULT 0,
  incorrect_count integer DEFAULT 0,
  skipped_count integer DEFAULT 0,
  time_spent_seconds integer DEFAULT 0,
  questions jsonb DEFAULT '[]'::jsonb,
  answers jsonb DEFAULT '{}'::jsonb,
  session_data jsonb DEFAULT '{}'::jsonb,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.placement_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own placement sessions" ON public.placement_sessions;
CREATE POLICY "Users can view own placement sessions" ON public.placement_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own placement sessions" ON public.placement_sessions;
CREATE POLICY "Users can insert own placement sessions" ON public.placement_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own placement sessions" ON public.placement_sessions;
CREATE POLICY "Users can update own placement sessions" ON public.placement_sessions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own placement sessions" ON public.placement_sessions;
CREATE POLICY "Users can delete own placement sessions" ON public.placement_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_placement_sessions_user_id ON public.placement_sessions(user_id);

-- 6. MOCK INTERVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.mock_interviews (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role text DEFAULT 'Software Engineer',
  interview_type text DEFAULT 'technical',
  difficulty text DEFAULT 'Medium',
  topic text DEFAULT 'General',
  subject text DEFAULT 'Technical Interview',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz DEFAULT now(),
  duration_seconds integer DEFAULT 0,
  overall_score numeric DEFAULT 0,
  technical_score numeric DEFAULT 0,
  technical_accuracy_score numeric DEFAULT 0,
  communication_score numeric DEFAULT 0,
  problem_solving_score numeric DEFAULT 0,
  confidence_score numeric DEFAULT 0,
  verdict text DEFAULT '',
  strengths jsonb DEFAULT '[]'::jsonb,
  improvements jsonb DEFAULT '[]'::jsonb,
  areas_to_improve jsonb DEFAULT '[]'::jsonb,
  ai_recommendations jsonb DEFAULT '[]'::jsonb,
  detailed_feedback text DEFAULT '',
  answers_evaluated integer DEFAULT 0,
  question_count integer DEFAULT 0,
  answered_count integer DEFAULT 0,
  skipped_count integer DEFAULT 0,
  questions jsonb DEFAULT '[]'::jsonb,
  answers jsonb DEFAULT '[]'::jsonb,
  question_evaluations jsonb DEFAULT '[]'::jsonb,
  full_report jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS target_role text DEFAULT 'Software Engineer';
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'Medium';
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT now();
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS duration_seconds integer DEFAULT 0;

ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own mock interviews" ON public.mock_interviews;
CREATE POLICY "Users can view own mock interviews" ON public.mock_interviews
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mock interviews" ON public.mock_interviews;
CREATE POLICY "Users can insert own mock interviews" ON public.mock_interviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own mock interviews" ON public.mock_interviews;
CREATE POLICY "Users can update own mock interviews" ON public.mock_interviews
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own mock interviews" ON public.mock_interviews;
CREATE POLICY "Users can delete own mock interviews" ON public.mock_interviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mock_interviews_user_id ON public.mock_interviews(user_id);

-- 7. JOB RESUME MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.job_resume_matches (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id text,
  target_job_title text DEFAULT '',
  company_name text DEFAULT '',
  job_description text DEFAULT '',
  match_score numeric DEFAULT 0,
  matching_skills jsonb DEFAULT '[]'::jsonb,
  missing_skills jsonb DEFAULT '[]'::jsonb,
  keyword_gaps jsonb DEFAULT '[]'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  full_analysis jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.job_resume_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own job resume matches" ON public.job_resume_matches;
CREATE POLICY "Users can view own job resume matches" ON public.job_resume_matches
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own job resume matches" ON public.job_resume_matches;
CREATE POLICY "Users can insert own job resume matches" ON public.job_resume_matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own job resume matches" ON public.job_resume_matches;
CREATE POLICY "Users can update own job resume matches" ON public.job_resume_matches
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own job resume matches" ON public.job_resume_matches;
CREATE POLICY "Users can delete own job resume matches" ON public.job_resume_matches
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_job_resume_matches_user_id ON public.job_resume_matches(user_id);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'SYSTEM',
  category text DEFAULT 'SYSTEM',
  priority text DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  action_url text,
  action_label text,
  dedup_key text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);

-- 9. NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean DEFAULT true,
  career_updates boolean DEFAULT true,
  coding_reminders boolean DEFAULT true,
  study_reminders boolean DEFAULT true,
  interview_feedback boolean DEFAULT true,
  resume_updates boolean DEFAULT true,
  company_prep boolean DEFAULT true,
  achievement_notifications boolean DEFAULT true,
  progress_updates boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can delete own notification preferences" ON public.notification_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- 10. MENTOR CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.mentor_conversations (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Career Guidance Chat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.mentor_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own mentor conversations" ON public.mentor_conversations;
CREATE POLICY "Users can view own mentor conversations" ON public.mentor_conversations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mentor conversations" ON public.mentor_conversations;
CREATE POLICY "Users can insert own mentor conversations" ON public.mentor_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own mentor conversations" ON public.mentor_conversations;
CREATE POLICY "Users can update own mentor conversations" ON public.mentor_conversations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own mentor conversations" ON public.mentor_conversations;
CREATE POLICY "Users can delete own mentor conversations" ON public.mentor_conversations
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mentor_conversations_user_id ON public.mentor_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_conversations_updated ON public.mentor_conversations(user_id, updated_at DESC);

-- 11. MENTOR MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.mentor_messages (
  id text PRIMARY KEY,
  conversation_id text NOT NULL REFERENCES public.mentor_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'mentor', 'system')),
  content text NOT NULL DEFAULT '',
  suggested_follow_ups jsonb DEFAULT '[]'::jsonb,
  action_links jsonb DEFAULT '[]'::jsonb,
  quick_action text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own mentor messages" ON public.mentor_messages;
CREATE POLICY "Users can view own mentor messages" ON public.mentor_messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mentor messages" ON public.mentor_messages;
CREATE POLICY "Users can insert own mentor messages" ON public.mentor_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own mentor messages" ON public.mentor_messages;
CREATE POLICY "Users can update own mentor messages" ON public.mentor_messages
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own mentor messages" ON public.mentor_messages;
CREATE POLICY "Users can delete own mentor messages" ON public.mentor_messages
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mentor_messages_conversation_id ON public.mentor_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_mentor_messages_user_id ON public.mentor_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_messages_conv_created ON public.mentor_messages(conversation_id, created_at ASC);
`;
