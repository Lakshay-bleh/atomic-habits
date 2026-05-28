export interface AIInsight {
  id: string
  user_id: string
  type: AIInsightType
  content: string
  habit_id: string | null
  identity_id: string | null
  created_at: string
  is_read: boolean
  priority: 'low' | 'medium' | 'high'
}

export type AIInsightType =
  | 'daily_coaching'
  | 'habit_suggestion'
  | 'recovery_coaching'
  | 'behavioral_pattern'
  | 'friction_reduction'
  | 'environment_analysis'
  | 'identity_summary'
  | 'burnout_warning'
  | 'milestone_celebration'
  | 'weekly_review'

export interface AICoachMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface AICoachSession {
  id: string
  user_id: string
  messages: AICoachMessage[]
  context: AICoachContext
  created_at: string
  updated_at: string
}

export interface AICoachContext {
  user_identity: string
  recent_habits: string[]
  streak_data: Record<string, number>
  emotional_trend: string
  focus_areas: string[]
  last_missed_habits: string[]
}

export interface EnvironmentAnalysis {
  focus_score: number
  distraction_score: number
  quality_score: number
  suggestions: string[]
  friction_reducers: string[]
  photo_url: string | null
  created_at: string
}
