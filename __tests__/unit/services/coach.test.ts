import { coachService } from '@/services/ai/coach'
import { groqClient } from '@/services/ai/groq'

jest.mock('@/services/ai/groq', () => ({
  groqClient: {
    callGroq: jest.fn(),
  },
}))

const mockGroq = groqClient.callGroq as jest.MockedFunction<typeof groqClient.callGroq>

const baseContext = {
  user_identity: 'Disciplined Creator',
  recent_habits: ['Write 5 minutes', 'Read 10 pages'],
  streak_data: { 'Write 5 minutes': 7, 'Read 10 pages': 3 },
  emotional_trend: 'neutral',
  focus_areas: ['discipline'],
  last_missed_habits: [],
}

describe('coachService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getDailyCoaching', () => {
    it('returns coaching message from Groq', async () => {
      const expected = 'You are becoming a disciplined creator — keep showing up.'
      mockGroq.mockResolvedValueOnce(expected)

      const result = await coachService.getDailyCoaching(baseContext)

      expect(result).toBe(expected)
      expect(mockGroq).toHaveBeenCalledOnce()
    })

    it('includes identity in prompt', async () => {
      mockGroq.mockResolvedValueOnce('test')
      await coachService.getDailyCoaching(baseContext)

      const call = mockGroq.mock.calls[0]
      const messages = call[0]
      const userMsg = messages.find((m) => m.role === 'user')
      expect(userMsg?.content).toContain('Disciplined Creator')
    })
  })

  describe('getRecoveryCoaching', () => {
    it('returns recovery message', async () => {
      const expected = "Missing once is an accident. Don't miss twice."
      mockGroq.mockResolvedValueOnce(expected)

      const result = await coachService.getRecoveryCoaching(
        'Write 5 minutes',
        2,
        'Disciplined Creator',
      )

      expect(result).toBe(expected)
    })

    it('includes missed days in prompt', async () => {
      mockGroq.mockResolvedValueOnce('test')
      await coachService.getRecoveryCoaching('Write', 3, 'Disciplined Creator')

      const userMsg = mockGroq.mock.calls[0][0].find((m) => m.role === 'user')
      expect(userMsg?.content).toContain('3 day(s)')
    })
  })

  describe('getIdentitySummary', () => {
    it('returns identity affirmation', async () => {
      const expected = 'You are 75% of the way to becoming your best self.'
      mockGroq.mockResolvedValueOnce(expected)

      const result = await coachService.getIdentitySummary(
        'Disciplined Creator',
        75,
        ['Read', 'Write'],
        14,
      )

      expect(result).toBe(expected)
    })
  })

  describe('suggestTinyHabit', () => {
    it('returns tiny habit suggestion', async () => {
      const expected = 'Put on your running shoes.'
      mockGroq.mockResolvedValueOnce(expected)

      const result = await coachService.suggestTinyHabit('Run 5km', 'athletic')
      expect(result).toBe(expected)
    })
  })

  describe('analyzeEnvironment', () => {
    it('parses valid JSON response', async () => {
      const jsonResponse = JSON.stringify({
        focusScore: 70,
        distractionScore: 30,
        qualityScore: 75,
        suggestions: ['Remove phone from desk'],
        frictionReducers: ['Prepare equipment the night before'],
      })
      mockGroq.mockResolvedValueOnce(jsonResponse)

      const result = await coachService.analyzeEnvironment('My home office desk')

      expect(result.focusScore).toBe(70)
      expect(result.suggestions).toContain('Remove phone from desk')
    })

    it('returns fallback on JSON parse failure', async () => {
      mockGroq.mockResolvedValueOnce('Non-JSON response text')

      const result = await coachService.analyzeEnvironment('Some place')

      expect(result.focusScore).toBe(50)
      expect(result.suggestions).toHaveLength(1)
    })
  })

  describe('getWeeklyReview', () => {
    it('parses valid JSON weekly review', async () => {
      const review = {
        summary: 'Good week overall',
        patterns: ['Better in mornings'],
        wins: ['7-day streak'],
        improvements: ['Evening habits'],
        nextWeekFocus: 'Consistency',
      }
      mockGroq.mockResolvedValueOnce(JSON.stringify(review))

      const result = await coachService.getWeeklyReview(
        { 'Write': 80, 'Read': 70 },
        'Disciplined Creator',
        ['What worked: writing'],
      )

      expect(result.summary).toBe('Good week overall')
      expect(result.wins).toContain('7-day streak')
    })
  })
})
