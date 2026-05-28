import { differenceInDays, parseISO, isToday, isYesterday } from 'date-fns'

export function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0

  const sorted = [...completedDates]
    .map((d) => parseISO(d))
    .sort((a, b) => b.getTime() - a.getTime())

  let streak = 0
  let expected = new Date()
  expected.setHours(0, 0, 0, 0)

  for (const date of sorted) {
    const diff = differenceInDays(expected, date)
    if (diff === 0) {
      streak++
      expected = new Date(date.getTime() - 24 * 60 * 60 * 1000)
      expected.setHours(0, 0, 0, 0)
    } else if (diff === 1 && streak === 0) {
      // Yesterday is fine to start a streak
      streak++
      expected = new Date(date.getTime() - 24 * 60 * 60 * 1000)
      expected.setHours(0, 0, 0, 0)
    } else {
      break
    }
  }

  return streak
}

export function getConsistencyRate(completions: number, possibleDays: number): number {
  if (possibleDays <= 0) return 0
  return Math.min(100, Math.round((completions / possibleDays) * 100))
}

export function isStreakBroken(lastCompletedDate: string | null): boolean {
  if (!lastCompletedDate) return true
  const last = parseISO(lastCompletedDate)
  return !isToday(last) && !isYesterday(last)
}

export function getStreakMessage(streak: number): string {
  if (streak === 0) return 'Start your streak today'
  if (streak === 1) return '1 day streak — great start!'
  if (streak < 7) return `${streak} day streak 🔥`
  if (streak < 30) return `${streak} day streak 🚀`
  if (streak < 100) return `${streak} days — you're unstoppable! 💎`
  return `${streak} days — legendary! 🏆`
}

export function getRecoveryMessage(daysMissed: number): string {
  if (daysMissed === 1) return "Never miss twice. Today is your comeback."
  if (daysMissed <= 3) return "Short breaks don't erase your progress. Come back stronger."
  return "Every expert was once a beginner who kept restarting. Today counts."
}
