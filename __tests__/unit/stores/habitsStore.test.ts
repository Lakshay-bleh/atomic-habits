import { act, renderHook } from '@testing-library/react-native'
import { useHabitsStore } from '@/stores/habitsStore'
import { habitsService } from '@/services/supabase/habits'
import type { Habit, HabitLog } from '@/types'

jest.mock('@/services/supabase/habits')

const mockHabitsService = habitsService as jest.Mocked<typeof habitsService>

const mockHabit: Habit = {
  id: 'habit-1',
  user_id: 'user-1',
  title: 'Read 10 pages',
  description: null,
  identity_id: 'identity-1',
  cue: 'After coffee',
  craving: null,
  response: 'Read',
  reward: 'Knowledge',
  tiny_version: 'Read 1 page',
  normal_version: 'Read 10 pages',
  frequency: 'daily',
  scheduled_days: [0,1,2,3,4,5,6],
  reminder_time: '08:00',
  start_date: '2024-01-01',
  friction_score: 3,
  difficulty: 'easy',
  environment_setup: null,
  category: 'learning',
  color: '#6366F1',
  icon: '📚',
  is_archived: false,
  is_bad_habit: false,
  stack_after_habit_id: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockLog: HabitLog = {
  id: 'log-1',
  habit_id: 'habit-1',
  user_id: 'user-1',
  date: '2024-01-15',
  completed_at: '2024-01-15T09:00:00Z',
  emotional_state: 'good',
  notes: null,
  tiny_version_used: false,
  skipped: false,
  skip_reason: null,
}

describe('useHabitsStore', () => {
  beforeEach(() => {
    // Reset store state
    useHabitsStore.setState({
      habits: [],
      todayLogs: [],
      streaks: {},
      isLoading: false,
      error: null,
    })
    jest.clearAllMocks()
  })

  describe('loadHabits', () => {
    it('loads and stores habits', async () => {
      mockHabitsService.getHabits.mockResolvedValueOnce([mockHabit])

      const { result } = renderHook(() => useHabitsStore())
      await act(async () => {
        await result.current.loadHabits('user-1')
      })

      expect(result.current.habits).toHaveLength(1)
      expect(result.current.habits[0].title).toBe('Read 10 pages')
      expect(result.current.isLoading).toBe(false)
    })

    it('sets error on failure', async () => {
      mockHabitsService.getHabits.mockRejectedValueOnce(new Error('DB error'))

      const { result } = renderHook(() => useHabitsStore())
      await act(async () => {
        await result.current.loadHabits('user-1')
      })

      expect(result.current.error).toBe('DB error')
      expect(result.current.habits).toHaveLength(0)
    })
  })

  describe('createHabit', () => {
    it('creates and adds habit to store', async () => {
      mockHabitsService.createHabit.mockResolvedValueOnce(mockHabit)

      const { result } = renderHook(() => useHabitsStore())
      let created: Habit | undefined
      await act(async () => {
        created = await result.current.createHabit({
          ...mockHabit,
          id: undefined as never,
          created_at: undefined as never,
          updated_at: undefined as never,
        })
      })

      expect(created).toEqual(mockHabit)
      expect(result.current.habits).toHaveLength(1)
    })
  })

  describe('completeHabit', () => {
    it('adds log to todayLogs', async () => {
      mockHabitsService.logHabitCompletion.mockResolvedValueOnce(mockLog)

      const { result } = renderHook(() => useHabitsStore())
      await act(async () => {
        await result.current.completeHabit('habit-1', 'user-1')
      })

      expect(result.current.todayLogs).toHaveLength(1)
      expect(result.current.todayLogs[0].habit_id).toBe('habit-1')
    })
  })

  describe('isCompletedToday', () => {
    it('returns true for completed habit', () => {
      useHabitsStore.setState({ todayLogs: [mockLog] })
      const { result } = renderHook(() => useHabitsStore())

      expect(result.current.isCompletedToday('habit-1')).toBe(true)
    })

    it('returns false for uncompleted habit', () => {
      useHabitsStore.setState({ todayLogs: [] })
      const { result } = renderHook(() => useHabitsStore())

      expect(result.current.isCompletedToday('habit-1')).toBe(false)
    })

    it('returns false for skipped habit', () => {
      useHabitsStore.setState({
        todayLogs: [{ ...mockLog, skipped: true }],
      })
      const { result } = renderHook(() => useHabitsStore())

      expect(result.current.isCompletedToday('habit-1')).toBe(false)
    })
  })

  describe('archiveHabit', () => {
    it('removes habit from store', async () => {
      mockHabitsService.archiveHabit.mockResolvedValueOnce(undefined)
      useHabitsStore.setState({ habits: [mockHabit] })

      const { result } = renderHook(() => useHabitsStore())
      await act(async () => {
        await result.current.archiveHabit('habit-1')
      })

      expect(result.current.habits).toHaveLength(0)
    })
  })
})
