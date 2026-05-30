-- ============================================================
-- AtomicHabits – Complete PostgreSQL Schema (Supabase)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  subscription_expires_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',
  identity_phrase TEXT,
  notification_preferences JSONB DEFAULT '{
    "enabled": true,
    "morning_reminder": true,
    "morning_time": "08:00",
    "evening_review": true,
    "evening_time": "21:00",
    "habit_reminders": true,
    "motivational_quotes": true,
    "weekly_review": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- IDENTITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS identities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#4F46E5',
  icon TEXT NOT NULL DEFAULT '⚡',
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  confidence INTEGER DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_reinforcements INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_identities_user_id ON identities(user_id);
CREATE INDEX idx_identities_score ON identities(score DESC);

-- ============================================================
-- IDENTITY EVOLUTION (daily score tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS identity_evolution (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  score INTEGER NOT NULL,
  reinforcements INTEGER DEFAULT 0,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(identity_id, date)
);

CREATE INDEX idx_identity_evolution_identity_date ON identity_evolution(identity_id, date DESC);

-- ============================================================
-- HABITS
-- ============================================================
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  identity_id UUID REFERENCES identities(id) ON DELETE SET NULL,

  -- Habit loop
  cue TEXT,
  craving TEXT,
  response TEXT,
  reward TEXT,

  -- Two-minute rule
  tiny_version TEXT,
  normal_version TEXT,

  -- Scheduling
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'custom')),
  scheduled_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
  reminder_time TIME,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Scoring
  friction_score INTEGER DEFAULT 5 CHECK (friction_score >= 1 AND friction_score <= 10),
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('tiny', 'easy', 'medium', 'hard')),
  environment_setup TEXT,

  -- Metadata
  category TEXT DEFAULT 'other',
  color TEXT,
  icon TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  is_bad_habit BOOLEAN DEFAULT FALSE,
  stack_after_habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_user_archived ON habits(user_id, is_archived);
CREATE INDEX idx_habits_identity ON habits(identity_id);

-- ============================================================
-- HABIT LOGS (completion records)
-- ============================================================
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  emotional_state TEXT CHECK (emotional_state IN ('excellent', 'good', 'neutral', 'tired', 'stressed', 'sad')),
  notes TEXT,
  tiny_version_used BOOLEAN DEFAULT FALSE,
  skipped BOOLEAN DEFAULT FALSE,
  skip_reason TEXT,
  UNIQUE(habit_id, user_id, date)
);

CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, date DESC);
CREATE INDEX idx_habit_logs_habit_date ON habit_logs(habit_id, date DESC);

-- ============================================================
-- HABIT STREAKS (materialized view updated by triggers)
-- ============================================================
CREATE TABLE IF NOT EXISTS habit_streaks (
  habit_id UUID PRIMARY KEY REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  total_completions INTEGER DEFAULT 0,
  consistency_rate DECIMAL(5,2) DEFAULT 0,
  recovery_speed DECIMAL(5,2) DEFAULT 1
);

CREATE INDEX idx_habit_streaks_user ON habit_streaks(user_id);

-- ============================================================
-- HABIT STACKS (chained routines)
-- ============================================================
CREATE TABLE IF NOT EXISTS habit_stacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  habit_ids UUID[] NOT NULL,
  trigger TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- JOURNAL ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  what_worked TEXT,
  what_caused_friction TEXT,
  identity_reinforced TEXT,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  energy INTEGER CHECK (energy >= 1 AND energy <= 5),
  free_text TEXT,
  ai_summary TEXT,
  ai_insights TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, date)
);

CREATE INDEX idx_journal_user_date ON journal_entries(user_id, date DESC);

-- ============================================================
-- WEEKLY REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  ai_summary TEXT NOT NULL,
  patterns_detected TEXT[],
  wins TEXT[],
  areas_for_improvement TEXT[],
  next_week_focus TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, week_start)
);

-- ============================================================
-- AI INSIGHTS
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  identity_id UUID REFERENCES identities(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_ai_insights_user ON ai_insights(user_id, created_at DESC);
CREATE INDEX idx_ai_insights_unread ON ai_insights(user_id, is_read) WHERE NOT is_read;

-- ============================================================
-- ENVIRONMENT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS environment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT,
  photo_url TEXT,
  focus_score INTEGER CHECK (focus_score >= 0 AND focus_score <= 100),
  distraction_score INTEGER CHECK (distraction_score >= 0 AND distraction_score <= 100),
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  suggestions TEXT[],
  friction_reducers TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free',
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on user signup
-- NOTE: Must use public. prefix + SET search_path = '' for SECURITY DEFINER
-- functions that fire from auth schema triggers, otherwise Supabase RLS blocks the insert.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update habit streak on log insert
CREATE OR REPLACE FUNCTION update_habit_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INT;
  v_longest_streak INT;
  v_total INT;
BEGIN
  SELECT last_completed_date, current_streak, longest_streak, total_completions
  INTO v_last_date, v_current_streak, v_longest_streak, v_total
  FROM habit_streaks WHERE habit_id = NEW.habit_id;

  IF NOT FOUND THEN
    INSERT INTO habit_streaks (habit_id, user_id, current_streak, longest_streak, last_completed_date, total_completions)
    VALUES (NEW.habit_id, NEW.user_id, 1, 1, NEW.date, 1);
    RETURN NEW;
  END IF;

  v_total := v_total + 1;

  IF v_last_date = NEW.date - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
  ELSIF v_last_date = NEW.date THEN
    -- Same day duplicate, do nothing
    RETURN NEW;
  ELSE
    v_current_streak := 1;
  END IF;

  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  UPDATE habit_streaks SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_completed_date = NEW.date,
    total_completions = v_total
  WHERE habit_id = NEW.habit_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_habit_log_insert
  AFTER INSERT ON habit_logs
  FOR EACH ROW
  WHEN (NOT NEW.skipped)
  EXECUTE FUNCTION update_habit_streak();

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_identities_updated_at
  BEFORE UPDATE ON identities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_journal_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
