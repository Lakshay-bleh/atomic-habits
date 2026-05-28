export interface DailyStats {
  date: string
  total_habits: number
  completed_habits: number
  completion_rate: number
  average_emotional_state: number
  identity_reinforcements: number
}

export interface WeeklyStats {
  week_start: string
  week_end: string
  average_completion_rate: number
  best_day: string
  worst_day: string
  total_completions: number
  streak_maintained: boolean
}

export interface IdentityAnalytics {
  identity_id: string
  identity_label: string
  weekly_scores: number[]
  trend: 'rising' | 'stable' | 'falling'
  reinforcement_count_30d: number
  strongest_habits: string[]
}

export interface HabitAnalytics {
  habit_id: string
  habit_title: string
  completion_heatmap: Record<string, boolean>   // "YYYY-MM-DD" -> completed
  best_streak: number
  consistency_30d: number
  emotional_correlation: Record<string, number>  // emotional state -> completion rate
  optimal_time: string | null
  friction_trend: number[]
}

export interface CompoundingProjection {
  habit_id: string
  habit_title: string
  metric: string             // e.g. "pages read"
  daily_value: number
  projections: {
    days: number
    total: string
    equivalent: string     // "12 books/year"
  }[]
}
