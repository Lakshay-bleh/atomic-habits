export interface Identity {
  id: string
  user_id: string
  label: string              // e.g. "disciplined creator"
  description: string | null
  color: string
  icon: string
  score: number              // 0-100 current score
  confidence: number         // 0-100 confidence %
  streak: number             // days of reinforcement
  longest_streak: number
  total_reinforcements: number
  created_at: string
  updated_at: string
}

export interface IdentityEvolution {
  id: string
  identity_id: string
  user_id: string
  date: string               // YYYY-MM-DD
  score: number
  reinforcements: number
  ai_summary: string | null
  created_at: string
}

export type IdentityTemplate =
  | 'disciplined'
  | 'healthy'
  | 'focused'
  | 'calm'
  | 'athletic'
  | 'productive'
  | 'creative'
  | 'mindful'
  | 'reader'
  | 'entrepreneur'
  | 'learner'
  | 'minimalist'

export interface IdentityTemplateConfig {
  label: string
  description: string
  color: string
  icon: string
  suggestedHabits: string[]
  affirmation: string
}
