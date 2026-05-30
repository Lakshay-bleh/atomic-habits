-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_evolution ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE environment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION auth_uid() RETURNS UUID AS $$
  SELECT auth.uid()
$$ LANGUAGE SQL STABLE;

-- ============================================================
-- PROFILES
-- ============================================================

-- Allow the auth trigger (handle_new_user) to insert new profiles.
-- The trigger runs as a SECURITY DEFINER function but still needs an
-- INSERT policy when RLS is enabled, because the auth.uid() context
-- is not yet established at the moment of user creation.
CREATE POLICY "Enable insert for auth trigger"
  ON profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (id = auth_uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (id = auth_uid()) WITH CHECK (id = auth_uid());

-- ============================================================
-- IDENTITIES
-- ============================================================
CREATE POLICY "Users can CRUD own identities"
  ON identities FOR ALL USING (user_id = auth_uid()) WITH CHECK (user_id = auth_uid());

-- ============================================================
-- IDENTITY EVOLUTION
-- ============================================================
CREATE POLICY "Users can CRUD own identity evolution"
  ON identity_evolution FOR ALL USING (user_id = auth_uid()) WITH CHECK (user_id = auth_uid());

-- ============================================================
-- HABITS
-- ============================================================
CREATE POLICY "Users can CRUD own habits"
  ON habits FOR ALL USING (user_id = auth_uid()) WITH CHECK (user_id = auth_uid());

-- ============================================================
-- HABIT LOGS
-- ============================================================
CREATE POLICY "Users can CRUD own habit logs"
  ON habit_logs FOR ALL USING (user_id = auth_uid()) WITH CHECK (user_id = auth_uid());

-- ============================================================
-- HABIT STREAKS
-- ============================================================
CREATE POLICY "Users can view own streaks"
  ON habit_streaks FOR SELECT USING (user_id = auth_uid());

CREATE POLICY "Users can update own streaks"
  ON habit_streaks FOR ALL USING (user_id = auth_uid()) WITH CHECK (user_id = auth_uid());

-- ============================================================
-- HABIT STACKS
-- ============================================================
CREATE POLICY "Users can CRUD own habit stacks"
  ON habit_stacks FOR ALL USING (user_id = auth_uid()) WITH CHECK (user_id = auth_uid());

-- ============================================================
-- JOURNAL ENTRIES
-- ============================================================
CREATE POLICY "Users can CRUD own journal entries"
  ON journal_entries FOR ALL USING (user_id = auth_uid()) WITH CHECK (user_id = auth_uid());

-- ============================================================
-- WEEKLY REVIEWS
-- ============================================================
CREATE POLICY "Users can CRUD own weekly reviews"
  ON weekly_reviews FOR ALL USING (user_id = auth_uid()) WITH CHECK (user_id = auth_uid());

-- ============================================================
-- AI INSIGHTS
-- ============================================================
CREATE POLICY "Users can view own AI insights"
  ON ai_insights FOR SELECT USING (user_id = auth_uid());

CREATE POLICY "Users can update own AI insights"
  ON ai_insights FOR UPDATE USING (user_id = auth_uid());

-- Service role can insert AI insights (from backend)
CREATE POLICY "Service can insert AI insights"
  ON ai_insights FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- ENVIRONMENT LOGS
-- ============================================================
CREATE POLICY "Users can CRUD own environment logs"
  ON environment_logs FOR ALL USING (user_id = auth_uid()) WITH CHECK (user_id = auth_uid());

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT USING (user_id = auth_uid());
