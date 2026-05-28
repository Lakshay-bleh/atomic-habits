import { create } from 'zustand'
import { journalService } from '@/services/supabase/journal'
import type { JournalEntry, WeeklyReview } from '@/types'
import { format } from 'date-fns'

interface JournalState {
  todayEntry: JournalEntry | null
  recentEntries: JournalEntry[]
  weeklyReview: WeeklyReview | null
  isLoading: boolean

  loadTodayEntry: (userId: string) => Promise<void>
  loadRecentEntries: (userId: string) => Promise<void>
  saveEntry: (
    userId: string,
    updates: Partial<JournalEntry>,
  ) => Promise<void>
  loadWeeklyReview: (userId: string) => Promise<void>
}

export const useJournalStore = create<JournalState>((set, get) => ({
  todayEntry: null,
  recentEntries: [],
  weeklyReview: null,
  isLoading: false,

  loadTodayEntry: async (userId) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const entry = await journalService.getEntryForDate(userId, today)
    set({ todayEntry: entry })
  },

  loadRecentEntries: async (userId) => {
    const entries = await journalService.getRecentEntries(userId)
    set({ recentEntries: entries })
  },

  saveEntry: async (userId, updates) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const entry = await journalService.upsertEntry({
      user_id: userId,
      date: today,
      what_worked: null,
      what_caused_friction: null,
      identity_reinforced: null,
      mood: 3,
      energy: 3,
      free_text: null,
      ai_summary: null,
      ai_insights: null,
      ...updates,
    })
    set({ todayEntry: entry })
  },

  loadWeeklyReview: async (userId) => {
    const monday = format(
      new Date(
        Date.now() - (new Date().getDay() - 1) * 24 * 60 * 60 * 1000,
      ),
      'yyyy-MM-dd',
    )
    const review = await journalService.getWeeklyReview(userId, monday)
    set({ weeklyReview: review })
  },
}))
