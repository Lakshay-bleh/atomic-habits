import { supabase } from './client'
import type { Habit, HabitLog, HabitStreak } from '@/types'
import { format } from 'date-fns'

export const habitsService = {
  async getHabits(userId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async getHabitById(id: string): Promise<Habit | null> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async createHabit(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>): Promise<Habit> {
    const { data, error } = await supabase
      .from('habits')
      .insert(habit)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    const { data, error } = await supabase
      .from('habits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async archiveHabit(id: string): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .update({ is_archived: true })
      .eq('id', id)
    if (error) throw error
  },

  async deleteHabit(id: string): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async logHabitCompletion(log: Omit<HabitLog, 'id'>): Promise<HabitLog> {
    const { data, error } = await supabase
      .from('habit_logs')
      .insert(log)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteHabitLog(habitId: string, userId: string, date: string): Promise<void> {
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .eq('date', date)
    if (error) throw error
  },

  async getLogsForDateRange(userId: string, startDate: string, endDate: string): Promise<HabitLog[]> {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('skipped', false)
      .order('date', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async getLogsForDate(userId: string, date: string): Promise<HabitLog[]> {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
    if (error) throw error
    return data ?? []
  },

  async getLogsForHabit(habitId: string, days = 30): Promise<HabitLog[]> {
    const startDate = format(
      new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      'yyyy-MM-dd',
    )
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .gte('date', startDate)
      .order('date', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async getStreaks(userId: string): Promise<HabitStreak[]> {
    const { data, error } = await supabase
      .from('habit_streaks')
      .select('*')
      .eq('user_id', userId)
    if (error) throw error
    return data ?? []
  },

  async getTodayCompletions(userId: string): Promise<HabitLog[]> {
    const today = format(new Date(), 'yyyy-MM-dd')
    return this.getLogsForDate(userId, today)
  },
}
