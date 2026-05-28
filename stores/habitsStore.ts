import { create } from 'zustand'
import { habitsService } from '@/services/supabase/habits'
import type { Habit, HabitLog, HabitStreak } from '@/types'
import { format } from 'date-fns'

interface HabitsState {
  habits: Habit[]
  todayLogs: HabitLog[]
  streaks: Record<string, HabitStreak>
  isLoading: boolean
  error: string | null
  selectedDate: string

  loadHabits: (userId: string) => Promise<void>
  loadTodayLogs: (userId: string) => Promise<void>
  loadStreaks: (userId: string) => Promise<void>
  createHabit: (habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>) => Promise<Habit>
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>
  archiveHabit: (id: string) => Promise<void>
  completeHabit: (habitId: string, userId: string, options?: {
    tinyVersion?: boolean
    emotionalState?: HabitLog['emotional_state']
    notes?: string
  }) => Promise<void>
  isCompletedToday: (habitId: string) => boolean
  getStreakForHabit: (habitId: string) => HabitStreak | null
  setSelectedDate: (date: string) => void
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  todayLogs: [],
  streaks: {},
  isLoading: false,
  error: null,
  selectedDate: format(new Date(), 'yyyy-MM-dd'),

  loadHabits: async (userId) => {
    try {
      set({ isLoading: true, error: null })
      const habits = await habitsService.getHabits(userId)
      set({ habits, isLoading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load habits', isLoading: false })
    }
  },

  loadTodayLogs: async (userId) => {
    try {
      const logs = await habitsService.getTodayCompletions(userId)
      set({ todayLogs: logs })
    } catch {}
  },

  loadStreaks: async (userId) => {
    try {
      const streaks = await habitsService.getStreaks(userId)
      const streakMap: Record<string, HabitStreak> = {}
      streaks.forEach((s) => { streakMap[s.habit_id] = s })
      set({ streaks: streakMap })
    } catch {}
  },

  createHabit: async (habit) => {
    const created = await habitsService.createHabit(habit)
    set((state) => ({ habits: [created, ...state.habits] }))
    return created
  },

  updateHabit: async (id, updates) => {
    const updated = await habitsService.updateHabit(id, updates)
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? updated : h)),
    }))
  },

  archiveHabit: async (id) => {
    await habitsService.archiveHabit(id)
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    }))
  },

  completeHabit: async (habitId, userId, options = {}) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const log = await habitsService.logHabitCompletion({
      habit_id: habitId,
      user_id: userId,
      date: today,
      completed_at: new Date().toISOString(),
      emotional_state: options.emotionalState ?? null,
      notes: options.notes ?? null,
      tiny_version_used: options.tinyVersion ?? false,
      skipped: false,
      skip_reason: null,
    })
    set((state) => ({ todayLogs: [...state.todayLogs, log] }))
  },

  isCompletedToday: (habitId) => {
    const { todayLogs } = get()
    return todayLogs.some((log) => log.habit_id === habitId && !log.skipped)
  },

  getStreakForHabit: (habitId) => {
    const { streaks } = get()
    return streaks[habitId] ?? null
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
}))
