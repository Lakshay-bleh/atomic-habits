export type HabitFrequency = 'daily' | 'weekly' | 'custom'
export type HabitDifficulty = 'tiny' | 'easy' | 'medium' | 'hard'
export type HabitCategory =
  | 'health'
  | 'fitness'
  | 'mindfulness'
  | 'learning'
  | 'creativity'
  | 'relationships'
  | 'finances'
  | 'productivity'
  | 'spirituality'
  | 'other'

export interface Habit {
  id: string
  user_id: string
  title: string
  description: string | null
  identity_id: string | null

  // Habit loop (Atomic Habits framework)
  cue: string | null
  craving: string | null
  response: string | null
  reward: string | null

  // Two-minute rule
  tiny_version: string | null
  normal_version: string | null

  // Scheduling
  frequency: HabitFrequency
  scheduled_days: number[]  // 0=Sun..6=Sat
  reminder_time: string | null
  start_date: string

  // Scoring
  friction_score: number      // 1-10, lower is better
  difficulty: HabitDifficulty
  environment_setup: string | null

  // Metadata
  category: HabitCategory
  color: string | null
  icon: string | null
  is_archived: boolean
  is_bad_habit: boolean       // Bad habit to break
  stack_after_habit_id: string | null  // Habit stacking

  created_at: string
  updated_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  completed_at: string
  date: string  // YYYY-MM-DD
  emotional_state: EmotionalState | null
  notes: string | null
  tiny_version_used: boolean
  skipped: boolean
  skip_reason: string | null
}

export type EmotionalState = 'excellent' | 'good' | 'neutral' | 'tired' | 'stressed' | 'sad'

export interface HabitStreak {
  habit_id: string
  current_streak: number
  longest_streak: number
  last_completed_date: string | null
  total_completions: number
  consistency_rate: number  // 0-100
  recovery_speed: number    // avg days to recover after miss
}

export interface HabitStack {
  id: string
  user_id: string
  name: string
  habit_ids: string[]
  trigger: string
  created_at: string
}
