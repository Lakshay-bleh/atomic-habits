import { calculateStreak, getConsistencyRate, isStreakBroken } from '@/utils/streak'

describe('streak utilities', () => {
  describe('calculateStreak', () => {
    it('returns 0 for empty dates', () => {
      expect(calculateStreak([])).toBe(0)
    })

    it('returns 1 for single today entry', () => {
      const today = new Date().toISOString().split('T')[0]
      expect(calculateStreak([today])).toBe(1)
    })

    it('calculates consecutive streak', () => {
      const dates = []
      for (let i = 0; i < 5; i++) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        dates.push(d.toISOString().split('T')[0])
      }
      expect(calculateStreak(dates)).toBe(5)
    })

    it('stops at gap', () => {
      const today = new Date().toISOString().split('T')[0]
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      expect(calculateStreak([today, twoDaysAgo])).toBe(1)
    })
  })

  describe('getConsistencyRate', () => {
    it('returns 0 for zero possible days', () => {
      expect(getConsistencyRate(0, 0)).toBe(0)
    })

    it('calculates correct percentage', () => {
      expect(getConsistencyRate(7, 10)).toBe(70)
    })

    it('caps at 100', () => {
      expect(getConsistencyRate(10, 5)).toBe(100)
    })
  })

  describe('isStreakBroken', () => {
    it('returns false when last completed today', () => {
      const today = new Date().toISOString().split('T')[0]
      expect(isStreakBroken(today)).toBe(false)
    })

    it('returns false when last completed yesterday', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      expect(isStreakBroken(yesterday)).toBe(false)
    })

    it('returns true when last completed 2+ days ago', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      expect(isStreakBroken(twoDaysAgo)).toBe(true)
    })

    it('returns true for null last date', () => {
      expect(isStreakBroken(null)).toBe(true)
    })
  })
})
