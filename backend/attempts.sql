CREATE TABLE IF NOT EXISTS attempts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topics TEXT[] NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    total_questions INT NOT NULL,
    correct_answers INT NOT NULL DEFAULT 0,
    topic_scores JSONB DEFAULT '{}',
    questions JSONB NOT NULL,
    user_answers JSONB DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON attempts(status);
CREATE INDEX IF NOT EXISTS idx_attempts_topics ON attempts USING GIN(topics);

ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own attempts"
ON attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own attempts"
ON attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts"
ON attempts FOR UPDATE
USING (auth.uid() = user_id);
