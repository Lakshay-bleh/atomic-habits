import { supabase } from './client'
import type { JournalEntry, WeeklyReview } from '@/types'
import { format, startOfWeek, endOfWeek } from 'date-fns'

export const journalService = {
  async getEntryForDate(
    userId: string,
    date: string,
  ): Promise<JournalEntry | null> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async upsertEntry(
    entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .upsert(
        { ...entry, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,date' },
      )
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getRecentEntries(
    userId: string,
    limit = 7,
  ): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data ?? []
  },

  async getWeeklyReview(
    userId: string,
    weekStart: string,
  ): Promise<WeeklyReview | null> {
    const { data, error } = await supabase
      .from('weekly_reviews')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async saveWeeklyReview(
    review: Omit<WeeklyReview, 'id' | 'created_at'>,
  ): Promise<WeeklyReview> {
    const { data, error } = await supabase
      .from('weekly_reviews')
      .upsert(review, { onConflict: 'user_id,week_start' })
      .select()
      .single()
    if (error) throw error
    return data
  },
}
