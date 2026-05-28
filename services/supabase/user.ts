import { supabase } from './client'
import type { User } from '@/types'

export const userService = {
  async getProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async completeOnboarding(
    userId: string,
    identityPhrase: string,
  ): Promise<User> {
    return this.updateProfile(userId, {
      onboarding_completed: true,
      identity_phrase: identityPhrase,
    })
  },

  async updateNotificationPreferences(
    userId: string,
    preferences: User['notification_preferences'],
  ): Promise<User> {
    return this.updateProfile(userId, {
      notification_preferences: preferences,
    })
  },
}
