-- Migration: Add pomodoro_sessions table and make end_time nullable
-- Run this migration in your Supabase SQL Editor

-- 1. Make end_time nullable in time_entries
ALTER TABLE time_entries 
ALTER COLUMN end_time DROP NOT NULL;

-- 2. Make duration have a default value (for ongoing tasks)
ALTER TABLE time_entries 
ALTER COLUMN duration SET DEFAULT 0;

-- 3. Create pomodoro_sessions table
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  comments TEXT,
  is_full_pomodoro BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_time_entry_id 
ON pomodoro_sessions(time_entry_id);

CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id 
ON pomodoro_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_created_at 
ON pomodoro_sessions(created_at DESC);

-- 5. Enable Row Level Security
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
CREATE POLICY "Users can view own pomodoro_sessions" 
ON pomodoro_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pomodoro_sessions" 
ON pomodoro_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pomodoro_sessions" 
ON pomodoro_sessions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pomodoro_sessions" 
ON pomodoro_sessions FOR DELETE 
USING (auth.uid() = user_id);

-- 7. Grant access to authenticated users
GRANT ALL ON pomodoro_sessions TO authenticated;
