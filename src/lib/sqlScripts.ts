/**
 * CareerPilot AI - Supabase Database Schema & RLS Setup SQL
 * 
 * Execute this SQL script in your Supabase SQL Editor:
 * https://supabase.com/dashboard/project/liqaeoxwjhsalfdqdwcr/sql/new
 */

export const SUPABASE_SETUP_SQL = `-- 1. Create the profiles table for CareerPilot AI
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
  career_goal TEXT,
  target_role TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS career_goal TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';

-- Remove legacy column names if present from previous schemas
ALTER TABLE public.profiles DROP COLUMN IF EXISTS college;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for Profiles
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Optional Index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 6. Create Resumes Table for Resume Analyzer & Versioning
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

-- Enable RLS for Resumes
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Resumes Policies (Authenticated user can only view, insert, update, delete their own resumes)
CREATE POLICY "Users can view own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_is_current ON public.resumes(user_id, is_current);

-- 7. Create Mock Interviews Table for Technical Interview Engine
CREATE TABLE IF NOT EXISTS public.mock_interviews (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  interview_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  overall_score INTEGER NOT NULL DEFAULT 0,
  technical_accuracy_score INTEGER NOT NULL DEFAULT 0,
  communication_score INTEGER NOT NULL DEFAULT 0,
  problem_solving_score INTEGER NOT NULL DEFAULT 0,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  strengths JSONB DEFAULT '[]'::jsonb,
  improvements JSONB DEFAULT '[]'::jsonb,
  detailed_feedback TEXT,
  answers_evaluated INTEGER DEFAULT 0,
  questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for Mock Interviews
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mock interviews"
  ON public.mock_interviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mock interviews"
  ON public.mock_interviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mock interviews"
  ON public.mock_interviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mock interviews"
  ON public.mock_interviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mock_interviews_user_id ON public.mock_interviews(user_id);

-- 8. Create Coding Submissions Table
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
  time_complexity TEXT,
  space_complexity TEXT,
  execution_time_ms NUMERIC DEFAULT 0,
  memory_used_kb NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for Coding Submissions
ALTER TABLE public.coding_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coding submissions"
  ON public.coding_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coding submissions"
  ON public.coding_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coding submissions"
  ON public.coding_submissions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own coding submissions"
  ON public.coding_submissions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coding_subs_user_id ON public.coding_submissions(user_id);

-- 9. Reload Supabase PostgREST schema cache
NOTIFY pgrst, 'reload schema';
`;
