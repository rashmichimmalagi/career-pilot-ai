-- ============================================================================
-- CAREERPILOT AI: 6 MISSING TABLES MIGRATION
-- ============================================================================

BEGIN;

-- 1. Table: career_readiness_history
CREATE TABLE IF NOT EXISTS public.career_readiness_history (
    id text PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score numeric NOT NULL DEFAULT 0,
    coding_score numeric DEFAULT 0,
    resume_score numeric DEFAULT 0,
    aptitude_score numeric DEFAULT 0,
    technical_interview_score numeric DEFAULT 0,
    roadmap_score numeric DEFAULT 0,
    status_category text DEFAULT 'Making Progress',
    breakdown jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.career_readiness_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own readiness history" ON public.career_readiness_history;
CREATE POLICY "Users can view own readiness history" ON public.career_readiness_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own readiness history" ON public.career_readiness_history;
CREATE POLICY "Users can insert own readiness history" ON public.career_readiness_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own readiness history" ON public.career_readiness_history;
CREATE POLICY "Users can update own readiness history" ON public.career_readiness_history
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own readiness history" ON public.career_readiness_history;
CREATE POLICY "Users can delete own readiness history" ON public.career_readiness_history
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_readiness_history_user_created ON public.career_readiness_history(user_id, created_at);


-- 2. Table: job_resume_matches
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


-- 3. Table: notifications
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


-- 4. Table: notification_preferences
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


-- 5. Table: mentor_conversations
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


-- 6. Table: mentor_messages
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

COMMIT;
