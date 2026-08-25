/**
 * CareerPilot AI - Supabase Database Schema & RLS Setup SQL
 * 
 * Execute this SQL script in your Supabase SQL Editor:
 * https://supabase.com/dashboard/project/liqaeoxwjhsalfdqdwcr/sql/new
 */

export const SUPABASE_SETUP_SQL = `-- ==========================================================
-- CareerPilot AI - Supabase Master Database Schema & RLS Setup
-- ==========================================================

-- 1. Profiles Table for CareerPilot AI
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  usn TEXT NOT NULL,
  college_name TEXT NOT NULL,
  department TEXT NOT NULL,
  semester TEXT NOT NULL,
  graduation_year TEXT NOT NULL,
  phone TEXT,
  degree TEXT,
  current_year TEXT,
  cgpa NUMERIC,
  career_goal TEXT,
  target_role TEXT,
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

-- Ensure all extended columns exist if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS career_goal TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_role TEXT;
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

-- Remove legacy column names if present from previous schemas
ALTER TABLE public.profiles DROP COLUMN IF EXISTS college;

-- Enable Row Level Security (RLS) for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 2. Resumes Table for Resume Analyzer & Versioning
CREATE TABLE IF NOT EXISTS public.resumes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  version_label TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  is_current BOOLEAN NOT NULL DEFAULT false,
  target_role TEXT NOT NULL DEFAULT 'Software Developer',
  resume_text TEXT NOT NULL,
  file_url TEXT,
  storage_path TEXT,
  resume_type TEXT DEFAULT 'uploaded',
  is_ai_improved BOOLEAN NOT NULL DEFAULT false,
  parent_resume_id TEXT,
  analysis_result JSONB,
  improved_data JSONB,
  comparison_data JSONB,
  student_answers JSONB,
  structured_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS resume_type TEXT DEFAULT 'uploaded';

-- Enable RLS for Resumes
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'resumes' AND policyname = 'Users can view own resumes') THEN
    CREATE POLICY "Users can view own resumes" ON public.resumes FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'resumes' AND policyname = 'Users can insert own resumes') THEN
    CREATE POLICY "Users can insert own resumes" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'resumes' AND policyname = 'Users can update own resumes') THEN
    CREATE POLICY "Users can update own resumes" ON public.resumes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'resumes' AND policyname = 'Users can delete own resumes') THEN
    CREATE POLICY "Users can delete own resumes" ON public.resumes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_is_current ON public.resumes(user_id, is_current);

-- 3. Mock Interviews Table for Technical & HR Interview Engines
CREATE TABLE IF NOT EXISTS public.mock_interviews (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  subject TEXT,
  topic TEXT,
  custom_topic TEXT,
  language TEXT,
  interview_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  overall_score INTEGER NOT NULL DEFAULT 0,
  technical_accuracy_score INTEGER NOT NULL DEFAULT 0,
  technical_score INTEGER DEFAULT 0,
  communication_score INTEGER NOT NULL DEFAULT 0,
  problem_solving_score INTEGER NOT NULL DEFAULT 0,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  verdict TEXT,
  strengths JSONB DEFAULT '[]'::jsonb,
  improvements JSONB DEFAULT '[]'::jsonb,
  areas_to_improve JSONB DEFAULT '[]'::jsonb,
  ai_recommendations JSONB DEFAULT '[]'::jsonb,
  detailed_feedback TEXT,
  answers_evaluated INTEGER DEFAULT 0,
  question_count INTEGER DEFAULT 0,
  answered_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  questions JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  question_evaluations JSONB DEFAULT '[]'::jsonb,
  full_report JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS custom_topic TEXT;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS technical_score INTEGER DEFAULT 0;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS areas_to_improve JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS ai_recommendations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 0;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS answered_count INTEGER DEFAULT 0;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS skipped_count INTEGER DEFAULT 0;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS question_evaluations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.mock_interviews ADD COLUMN IF NOT EXISTS full_report JSONB;

-- Enable RLS for Mock Interviews
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mock_interviews' AND policyname = 'Users can view own mock interviews') THEN
    CREATE POLICY "Users can view own mock interviews" ON public.mock_interviews FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mock_interviews' AND policyname = 'Users can insert own mock interviews') THEN
    CREATE POLICY "Users can insert own mock interviews" ON public.mock_interviews FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mock_interviews' AND policyname = 'Users can update own mock interviews') THEN
    CREATE POLICY "Users can update own mock interviews" ON public.mock_interviews FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mock_interviews' AND policyname = 'Users can delete own mock interviews') THEN
    CREATE POLICY "Users can delete own mock interviews" ON public.mock_interviews FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mock_interviews_user_id ON public.mock_interviews(user_id);

-- 4. Coding Submissions Table
CREATE TABLE IF NOT EXISTS public.coding_submissions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id TEXT NOT NULL,
  problem_title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  pass_rate NUMERIC DEFAULT 0,
  subject TEXT,
  topic TEXT,
  submitted_code TEXT,
  status_text TEXT,
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
  ai_feedback JSONB,
  problem_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS submitted_code TEXT;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS status_text TEXT;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS result TEXT;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS test_cases_passed INTEGER DEFAULT 0;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS test_cases_failed INTEGER DEFAULT 0;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS total_test_cases INTEGER DEFAULT 0;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS runtime_ms NUMERIC DEFAULT 0;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS memory_kb NUMERIC DEFAULT 0;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS ai_feedback JSONB;
ALTER TABLE public.coding_submissions ADD COLUMN IF NOT EXISTS problem_data JSONB;

-- Enable RLS for Coding Submissions
ALTER TABLE public.coding_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coding_submissions' AND policyname = 'Users can view own coding submissions') THEN
    CREATE POLICY "Users can view own coding submissions" ON public.coding_submissions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coding_submissions' AND policyname = 'Users can insert own coding submissions') THEN
    CREATE POLICY "Users can insert own coding submissions" ON public.coding_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coding_submissions' AND policyname = 'Users can update own coding submissions') THEN
    CREATE POLICY "Users can update own coding submissions" ON public.coding_submissions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coding_submissions' AND policyname = 'Users can delete own coding submissions') THEN
    CREATE POLICY "Users can delete own coding submissions" ON public.coding_submissions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_coding_subs_user_id ON public.coding_submissions(user_id);

-- 5. Placement Practice Sessions Table
CREATE TABLE IF NOT EXISTS public.placement_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for Placement Sessions
ALTER TABLE public.placement_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'placement_sessions' AND policyname = 'Users can view own placement sessions') THEN
    CREATE POLICY "Users can view own placement sessions" ON public.placement_sessions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'placement_sessions' AND policyname = 'Users can insert own placement sessions') THEN
    CREATE POLICY "Users can insert own placement sessions" ON public.placement_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'placement_sessions' AND policyname = 'Users can update own placement sessions') THEN
    CREATE POLICY "Users can update own placement sessions" ON public.placement_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'placement_sessions' AND policyname = 'Users can delete own placement sessions') THEN
    CREATE POLICY "Users can delete own placement sessions" ON public.placement_sessions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_placement_sessions_user_id ON public.placement_sessions(user_id);

-- 6. Storage Buckets & Storage RLS Policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  true,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
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

-- 7. Reload Supabase PostgREST schema cache
NOTIFY pgrst, 'reload schema';
`;
