export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  onboarding_completed: boolean
  subscription_tier: 'free' | 'premium'
  subscription_expires_at: string | null
  timezone: string
  notification_preferences: NotificationPreferences
  identity_phrase: string | null
}

export interface NotificationPreferences {
  enabled: boolean
  morning_reminder: boolean
  morning_time: string
  evening_review: boolean
  evening_time: string
  habit_reminders: boolean
  motivational_quotes: boolean
  weekly_review: boolean
}

export interface UserSession {
  user: User
  access_token: string
  refresh_token: string
}
