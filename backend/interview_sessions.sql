CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    resume_text TEXT,
    target_role TEXT NOT NULL,
    interview_type TEXT NOT NULL,
    max_questions INT NOT NULL DEFAULT 10,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    feedback JSONB,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    question_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON interview_sessions(status);

ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own sessions"
ON interview_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own sessions"
ON interview_sessions FOR SELECT
USING (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions"
ON interview_sessions FOR UPDATE
USING (auth.uid() = user_id);








