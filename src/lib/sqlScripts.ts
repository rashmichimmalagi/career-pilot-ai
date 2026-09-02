/**
 * CareerPilot AI - Supabase Database Schema & RLS Setup SQL
 * 
 * Execute this SQL script in your Supabase SQL Editor:
 * https://supabase.com/dashboard/project/liqaeoxwjhsalfdqdwcr/sql/new
 */

export const SUPABASE_SETUP_SQL = `-- ==============================================================================
-- CareerPilot AI - Master Multi-User Database Schema & Strict RLS Setup Script
-- ==============================================================================
-- SECURITY DIRECTIVE: STRICT MULTI-USER DATA ISOLATION & ROW LEVEL SECURITY
-- One authenticated user can NEVER view, edit, update, or delete another user's data.
-- Enforced cryptographically at the database and storage level via auth.uid().
--
-- Instructions:
-- 1. Open your Supabase Project Dashboard (https://app.supabase.com)
-- 2. Navigate to SQL Editor -> "New Query"
-- 3. Paste this complete SQL script and click "Run"
-- ==============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT '',
  usn TEXT DEFAULT '',
  college_name TEXT DEFAULT '',
  department TEXT DEFAULT '',
  semester TEXT DEFAULT '',
  graduation_year TEXT DEFAULT '',
  phone TEXT,
  degree TEXT,
  current_year TEXT,
  cgpa NUMERIC,
  career_goal TEXT DEFAULT '',
  target_role TEXT DEFAULT '',
  target_companies JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  technical_skills JSONB DEFAULT '[]'::jsonb,
  tools_technologies JSONB DEFAULT '[]'::jsonb,
  programming_languages JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  bio TEXT,
  preparation_level TEXT,
  preferred_language TEXT,
  preferred_domain TEXT,
  preferred_location TEXT,
  dsa_level TEXT,
  interview_experience TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  profile_data JSONB DEFAULT '{}'::jsonb,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all extended profile columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college_name TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS career_goal TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS degree TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_year TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cgpa NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_companies JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS technical_skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tools_technologies JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS programming_languages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preparation_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_domain TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dsa_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interview_experience TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles DROP COLUMN IF EXISTS college;

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. RESUMES TABLE
CREATE TABLE IF NOT EXISTS public.resumes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  version_label TEXT NOT NULL DEFAULT 'Version 1.0',
  file_name TEXT NOT NULL DEFAULT 'resume.pdf',
  file_size BIGINT DEFAULT 0,
  is_current BOOLEAN NOT NULL DEFAULT false,
  target_role TEXT NOT NULL DEFAULT 'Software Developer',
  resume_text TEXT NOT NULL DEFAULT '',
  file_url TEXT,
  storage_path TEXT DEFAULT '',
  resume_type TEXT DEFAULT 'uploaded',
  is_ai_improved BOOLEAN NOT NULL DEFAULT false,
  parent_resume_id TEXT,
  ats_score NUMERIC DEFAULT 0,
  analysis_result JSONB DEFAULT '{}'::jsonb,
  improved_data JSONB DEFAULT '{}'::jsonb,
  comparison_data JSONB DEFAULT '{}'::jsonb,
  student_answers JSONB DEFAULT '{}'::jsonb,
  structured_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS resume_type TEXT DEFAULT 'uploaded';
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS ats_score NUMERIC DEFAULT 0;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS storage_path TEXT DEFAULT '';

-- RLS for resumes
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own resumes" ON public.resumes;
CREATE POLICY "Users can view own resumes" ON public.resumes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own resumes" ON public.resumes;
CREATE POLICY "Users can insert own resumes" ON public.resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own resumes" ON public.resumes;
CREATE POLICY "Users can update own resumes" ON public.resumes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own resumes" ON public.resumes;
CREATE POLICY "Users can delete own resumes" ON public.resumes
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_is_current ON public.resumes(user_id, is_current);

-- 3. MOCK INTERVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.mock_interviews (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT DEFAULT 'Software Engineer',
  subject TEXT DEFAULT 'Technical Interview',
  topic TEXT DEFAULT 'General',
  custom_topic TEXT,
  language TEXT DEFAULT 'General',
  interview_type TEXT DEFAULT 'technical',
  difficulty TEXT DEFAULT 'Medium',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INTEGER DEFAULT 0,
  overall_score INTEGER NOT NULL DEFAULT 0,
  technical_accuracy_score INTEGER NOT NULL DEFAULT 0,
  technical_score INTEGER DEFAULT 0,
  communication_score INTEGER NOT NULL DEFAULT 0,
  problem_solving_score INTEGER NOT NULL DEFAULT 0,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  verdict TEXT DEFAULT '',
  strengths JSONB DEFAULT '[]'::jsonb,
  improvements JSONB DEFAULT '[]'::jsonb,
  areas_to_improve JSONB DEFAULT '[]'::jsonb,
  ai_recommendations JSONB DEFAULT '[]'::jsonb,
  detailed_feedback TEXT DEFAULT '',
  answers_evaluated INTEGER DEFAULT 0,
  question_count INTEGER DEFAULT 0,
  answered_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  questions JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  question_evaluations JSONB DEFAULT '[]'::jsonb,
  full_report JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT 'Software Engineer';
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'Technical Interview';
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS topic TEXT DEFAULT 'General';
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS custom_topic TEXT;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'General';
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Medium';
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS technical_score INTEGER DEFAULT 0;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS areas_to_improve JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS ai_recommendations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS full_report JSONB DEFAULT '{}'::jsonb;

-- RLS for mock_interviews
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

-- 4. CODING SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.coding_submissions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id TEXT NOT NULL DEFAULT '',
  problem_title TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'Medium',
  language TEXT NOT NULL DEFAULT 'javascript',
  code TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'submitted',
  score INTEGER NOT NULL DEFAULT 0,
  pass_rate NUMERIC DEFAULT 0,
  subject TEXT,
  topic TEXT DEFAULT 'General',
  submitted_code TEXT,
  status_text TEXT DEFAULT '',
  result TEXT,
  test_cases_passed INTEGER DEFAULT 0,
  test_cases_failed INTEGER DEFAULT 0,
  total_test_cases INTEGER DEFAULT 0,
  time_complexity TEXT,
  space_complexity TEXT,
  execution_time_ms NUMERIC DEFAULT 0,
  runtime_ms NUMERIC DEFAULT 0,
  memory_used_kb NUMERIC DEFAULT 0,
  memory_kb NUMERIC DEFAULT 0,
  ai_feedback JSONB DEFAULT '{}'::jsonb,
  problem_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS topic TEXT DEFAULT 'General';
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS submitted_code TEXT;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS status_text TEXT;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS result TEXT;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS test_cases_passed INTEGER DEFAULT 0;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS test_cases_failed INTEGER DEFAULT 0;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS total_test_cases INTEGER DEFAULT 0;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS runtime_ms NUMERIC DEFAULT 0;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS memory_kb NUMERIC DEFAULT 0;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS ai_feedback JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS problem_data JSONB DEFAULT '{}'::jsonb;

-- RLS for coding_submissions
ALTER TABLE public.coding_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own coding submissions" ON public.coding_submissions;
CREATE POLICY "Users can view own coding submissions" ON public.coding_submissions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own coding submissions" ON public.coding_submissions;
CREATE POLICY "Users can insert own coding submissions" ON public.coding_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own coding submissions" ON public.coding_submissions;
CREATE POLICY "Users can update own coding submissions" ON public.coding_submissions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own coding submissions" ON public.coding_submissions;
CREATE POLICY "Users can delete own coding submissions" ON public.coding_submissions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coding_subs_user_id ON public.coding_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_coding_subs_problem ON public.coding_submissions(problem_id);

-- 5. SAVED CODING QUESTIONS TABLE (Bookmarks & Practice Queue)
CREATE TABLE IF NOT EXISTS public.saved_coding_questions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id TEXT NOT NULL DEFAULT '',
  problem_title TEXT NOT NULL DEFAULT '',
  difficulty TEXT DEFAULT 'Medium',
  topic TEXT DEFAULT 'General',
  notes TEXT DEFAULT '',
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for saved_coding_questions
ALTER TABLE public.saved_coding_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own saved questions" ON public.saved_coding_questions;
CREATE POLICY "Users can view own saved questions" ON public.saved_coding_questions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved questions" ON public.saved_coding_questions;
CREATE POLICY "Users can insert own saved questions" ON public.saved_coding_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saved questions" ON public.saved_coding_questions;
CREATE POLICY "Users can update own saved questions" ON public.saved_coding_questions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved questions" ON public.saved_coding_questions;
CREATE POLICY "Users can delete own saved questions" ON public.saved_coding_questions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_questions_user_id ON public.saved_coding_questions(user_id);

-- 6. PLACEMENT PRACTICE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.placement_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'Technical',
  subject TEXT NOT NULL DEFAULT 'General',
  topic TEXT DEFAULT 'General',
  difficulty TEXT DEFAULT 'Medium',
  mode TEXT DEFAULT 'practice',
  score NUMERIC NOT NULL DEFAULT 0,
  accuracy NUMERIC DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  questions JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '{}'::jsonb,
  session_data JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.placement_sessions ADD COLUMN IF NOT EXISTS accuracy NUMERIC DEFAULT 0;
ALTER TABLE public.placement_sessions ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;
ALTER TABLE public.placement_sessions ADD COLUMN IF NOT EXISTS session_data JSONB DEFAULT '{}'::jsonb;

-- RLS for placement_sessions
ALTER TABLE public.placement_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own placement sessions" ON public.placement_sessions;
CREATE POLICY "Users can view own placement sessions" ON public.placement_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own placement sessions" ON public.placement_sessions;
CREATE POLICY "Users can insert own placement sessions" ON public.placement_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own placement sessions" ON public.placement_sessions;
CREATE POLICY "Users can update own placement sessions" ON public.placement_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own placement sessions" ON public.placement_sessions;
CREATE POLICY "Users can delete own placement sessions" ON public.placement_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_placement_sessions_user_id ON public.placement_sessions(user_id);

-- 7. CAREER READINESS SCORE HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.career_readiness_history (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  coding_score INTEGER NOT NULL DEFAULT 0,
  resume_score INTEGER NOT NULL DEFAULT 0,
  aptitude_score INTEGER NOT NULL DEFAULT 0,
  technical_interview_score INTEGER NOT NULL DEFAULT 0,
  roadmap_score INTEGER NOT NULL DEFAULT 0,
  status_category TEXT,
  breakdown JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for career_readiness_history
ALTER TABLE public.career_readiness_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own readiness history" ON public.career_readiness_history;
CREATE POLICY "Users can view own readiness history" ON public.career_readiness_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own readiness history" ON public.career_readiness_history;
CREATE POLICY "Users can insert own readiness history" ON public.career_readiness_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own readiness history" ON public.career_readiness_history;
CREATE POLICY "Users can update own readiness history" ON public.career_readiness_history
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own readiness history" ON public.career_readiness_history;
CREATE POLICY "Users can delete own readiness history" ON public.career_readiness_history
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_readiness_history_user_created ON public.career_readiness_history(user_id, created_at DESC);

-- 8. JOB RESUME MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.job_resume_matches (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id TEXT REFERENCES public.resumes(id) ON DELETE SET NULL,
  target_job_title TEXT NOT NULL DEFAULT '',
  company_name TEXT DEFAULT '',
  job_description TEXT NOT NULL DEFAULT '',
  match_score INTEGER NOT NULL DEFAULT 0,
  matching_skills JSONB DEFAULT '[]'::jsonb,
  missing_skills JSONB DEFAULT '[]'::jsonb,
  keyword_gaps JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  full_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for job_resume_matches
ALTER TABLE public.job_resume_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own job matches" ON public.job_resume_matches;
CREATE POLICY "Users can view own job matches" ON public.job_resume_matches
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own job matches" ON public.job_resume_matches;
CREATE POLICY "Users can insert own job matches" ON public.job_resume_matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own job matches" ON public.job_resume_matches;
CREATE POLICY "Users can update own job matches" ON public.job_resume_matches
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own job matches" ON public.job_resume_matches;
CREATE POLICY "Users can delete own job matches" ON public.job_resume_matches
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_job_matches_user_created ON public.job_resume_matches(user_id, created_at DESC);

-- 9. MENTOR CONVERSATIONS & MESSAGES (Parent & Child Multi-Tenant RLS)
CREATE TABLE IF NOT EXISTS public.mentor_conversations (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Career Guidance Chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own mentor conversations" ON public.mentor_conversations;
CREATE POLICY "Users can delete own mentor conversations" ON public.mentor_conversations
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mentor_convs_user_updated ON public.mentor_conversations(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.mentor_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES public.mentor_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'model', 'assistant', 'mentor', 'system')),
  content TEXT NOT NULL DEFAULT '',
  context_snapshot JSONB,
  recommended_actions JSONB,
  suggested_prompts JSONB,
  suggested_follow_ups JSONB DEFAULT '[]'::jsonb,
  action_links JSONB DEFAULT '[]'::jsonb,
  quick_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mentor_messages ADD COLUMN IF NOT EXISTS suggested_follow_ups JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.mentor_messages ADD COLUMN IF NOT EXISTS action_links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.mentor_messages ADD COLUMN IF NOT EXISTS quick_action TEXT;

-- Strict Parent-Verified RLS for mentor_messages
ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own mentor messages" ON public.mentor_messages;
CREATE POLICY "Users can view own mentor messages" ON public.mentor_messages
  FOR SELECT USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.mentor_conversations c
      WHERE c.id = mentor_messages.conversation_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own mentor messages" ON public.mentor_messages;
CREATE POLICY "Users can insert own mentor messages" ON public.mentor_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.mentor_conversations c
      WHERE c.id = mentor_messages.conversation_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own mentor messages" ON public.mentor_messages;
CREATE POLICY "Users can update own mentor messages" ON public.mentor_messages
  FOR UPDATE
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.mentor_conversations c
      WHERE c.id = mentor_messages.conversation_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.mentor_conversations c
      WHERE c.id = mentor_messages.conversation_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own mentor messages" ON public.mentor_messages;
CREATE POLICY "Users can delete own mentor messages" ON public.mentor_messages
  FOR DELETE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.mentor_conversations c
      WHERE c.id = mentor_messages.conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_mentor_messages_conversation_id ON public.mentor_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_mentor_messages_user_id ON public.mentor_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_msgs_conv_created ON public.mentor_messages(conversation_id, created_at ASC);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'SYSTEM',
  category TEXT DEFAULT 'SYSTEM',
  priority TEXT DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  action_label TEXT,
  dedup_key TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
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
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_user_dedup ON public.notifications(user_id, dedup_key) WHERE dedup_key IS NOT NULL;

-- 11. NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  career_updates BOOLEAN DEFAULT true,
  coding_reminders BOOLEAN DEFAULT true,
  study_reminders BOOLEAN DEFAULT true,
  interview_feedback BOOLEAN DEFAULT true,
  resume_updates BOOLEAN DEFAULT true,
  company_prep BOOLEAN DEFAULT true,
  achievement_notifications BOOLEAN DEFAULT true,
  progress_updates BOOLEAN DEFAULT true,
  weekly_career_report_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS weekly_career_report_enabled BOOLEAN DEFAULT true;

-- RLS for notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can delete own notification preferences" ON public.notification_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- 12. WEEKLY CAREER REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.weekly_career_reports (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  coding_summary JSONB DEFAULT '{}'::jsonb,
  aptitude_summary JSONB DEFAULT '{}'::jsonb,
  interview_summary JSONB DEFAULT '{}'::jsonb,
  roadmap_summary JSONB DEFAULT '{}'::jsonb,
  resume_summary JSONB DEFAULT '{}'::jsonb,
  readiness_score NUMERIC DEFAULT 0,
  readiness_delta NUMERIC DEFAULT 0,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  recommended_focus JSONB DEFAULT '[]'::jsonb,
  report_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'generated' CHECK (status IN ('sent', 'generated', 'failed', 'skipped')),
  sent_to_email TEXT DEFAULT '',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  resend_email_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for weekly_career_reports
ALTER TABLE public.weekly_career_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own weekly career reports" ON public.weekly_career_reports;
CREATE POLICY "Users can view own weekly career reports" ON public.weekly_career_reports
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own weekly career reports" ON public.weekly_career_reports;
CREATE POLICY "Users can insert own weekly career reports" ON public.weekly_career_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own weekly career reports" ON public.weekly_career_reports;
CREATE POLICY "Users can update own weekly career reports" ON public.weekly_career_reports
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own weekly career reports" ON public.weekly_career_reports;
CREATE POLICY "Users can delete own weekly career reports" ON public.weekly_career_reports
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_id ON public.weekly_career_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_period ON public.weekly_career_reports(user_id, period_start, period_end);

-- 13. STORAGE BUCKET & STORAGE RLS POLICIES (Resume Storage Isolation)
-- Guarantees resumes are stored in folders matching the auth.uid() and can ONLY be accessed by their owner.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf']::text[];

DROP POLICY IF EXISTS "Authenticated users can upload own resumes" ON storage.objects;
CREATE POLICY "Authenticated users can upload own resumes" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Authenticated users can view own resumes" ON storage.objects;
CREATE POLICY "Authenticated users can view own resumes" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Authenticated users can update own resumes" ON storage.objects;
CREATE POLICY "Authenticated users can update own resumes" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Authenticated users can delete own resumes" ON storage.objects;
CREATE POLICY "Authenticated users can delete own resumes" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 14. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
`;

