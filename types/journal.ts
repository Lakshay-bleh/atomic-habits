export interface JournalEntry {
  id: string
  user_id: string
  date: string               // YYYY-MM-DD
  what_worked: string | null
  what_caused_friction: string | null
  identity_reinforced: string | null
  mood: number               // 1-5
  energy: number             // 1-5
  free_text: string | null
  ai_summary: string | null
  ai_insights: string | null
  created_at: string
  updated_at: string
}

export interface JournalPrompt {
  id: string
  text: string
  category: 'reflection' | 'growth' | 'identity' | 'gratitude' | 'planning'
  is_ai_generated: boolean
}

export interface WeeklyReview {
  id: string
  user_id: string
  week_start: string
  week_end: string
  ai_summary: string
  patterns_detected: string[]
  wins: string[]
  areas_for_improvement: string[]
  next_week_focus: string
  created_at: string
}
