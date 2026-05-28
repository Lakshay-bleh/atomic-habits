import { groqClient } from './groq'
import type { AICoachContext, AICoachMessage } from '@/types'

const COACH_SYSTEM_PROMPT = `You are an AI habit coach specializing in identity-based behavior change, inspired by Atomic Habits principles.

Your coaching style:
- Always reinforce IDENTITY first ("you are becoming someone who...")
- Be supportive, warm, and non-judgmental
- Use behavioral psychology insights (habit loop, two-minute rule, environment design)
- Keep responses concise — 2-4 sentences max unless a deeper dive is requested
- Never use generic motivational platitudes
- Focus on the SYSTEM, not the goal
- Celebrate consistency over intensity
- Help with recovery after missed habits (never miss twice principle)

You speak as a trusted friend who understands behavior change science.`

export const coachService = {
  async getDailyCoaching(context: AICoachContext): Promise<string> {
    const userContext = `
Identity: ${context.user_identity}
Recent completed habits: ${context.recent_habits.join(', ')}
Current streaks: ${Object.entries(context.streak_data)
  .map(([h, s]) => `${h}: ${s} days`)
  .join(', ')}
Emotional trend: ${context.emotional_trend}
Last missed habits: ${context.last_missed_habits.join(', ')}
`
    const messages = [
      { role: 'system' as const, content: COACH_SYSTEM_PROMPT },
      {
        role: 'user' as const,
        content: `Give me a personalized daily coaching message based on my context:\n${userContext}\n\nFocus on identity reinforcement and one actionable insight.`,
      },
    ]
    return groqClient.callGroq(messages, { temperature: 0.8, maxTokens: 256 })
  },

  async getRecoveryCoaching(
    habitTitle: string,
    daysMissed: number,
    identityLabel: string,
  ): Promise<string> {
    const messages = [
      { role: 'system' as const, content: COACH_SYSTEM_PROMPT },
      {
        role: 'user' as const,
        content: `I missed "${habitTitle}" for ${daysMissed} day(s). My identity is "${identityLabel}". Give me a compassionate recovery message that focuses on the "never miss twice" principle and reconnects me with my identity. Keep it under 3 sentences.`,
      },
    ]
    return groqClient.callGroq(messages, { temperature: 0.7, maxTokens: 200 })
  },

  async analyzePatterns(
    completionData: Record<string, number>,
    identityLabel: string,
  ): Promise<string> {
    const patterns = Object.entries(completionData)
      .map(([habit, rate]) => `${habit}: ${rate}% completion`)
      .join('\n')

    const messages = [
      { role: 'system' as const, content: COACH_SYSTEM_PROMPT },
      {
        role: 'user' as const,
        content: `Analyze these habit completion patterns for someone who identifies as "${identityLabel}":\n${patterns}\n\nProvide 2-3 behavioral insights and one concrete suggestion.`,
      },
    ]
    return groqClient.callGroq(messages, { temperature: 0.6, maxTokens: 350 })
  },

  async chat(
    messages: AICoachMessage[],
    context: AICoachContext,
  ): Promise<string> {
    const systemWithContext = `${COACH_SYSTEM_PROMPT}

Current user context:
- Identity: ${context.user_identity}
- Active habits: ${context.recent_habits.join(', ')}
- Emotional trend: ${context.emotional_trend}`

    const groqMessages = [
      { role: 'system' as const, content: systemWithContext },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]
    return groqClient.callGroq(groqMessages, { temperature: 0.8, maxTokens: 512 })
  },

  async generateSmartNotification(
    habitTitle: string,
    identityLabel: string,
    timeOfDay: 'morning' | 'afternoon' | 'evening',
  ): Promise<string> {
    const messages = [
      { role: 'system' as const, content: COACH_SYSTEM_PROMPT },
      {
        role: 'user' as const,
        content: `Generate an identity-based push notification for the habit "${habitTitle}" for someone who identifies as "${identityLabel}". Time: ${timeOfDay}. Make it feel like a reminder of who they are, not a task. Max 12 words.`,
      },
    ]
    return groqClient.callGroq(messages, { temperature: 0.9, maxTokens: 50 })
  },

  async getWeeklyReview(
    completionRates: Record<string, number>,
    identityLabel: string,
    journalEntries: string[],
  ): Promise<{
    summary: string
    patterns: string[]
    wins: string[]
    improvements: string[]
    nextWeekFocus: string
  }> {
    const habitSummary = Object.entries(completionRates)
      .map(([h, r]) => `${h}: ${r}%`)
      .join(', ')
    const journalSummary = journalEntries.slice(-5).join(' | ')

    const messages = [
      { role: 'system' as const, content: COACH_SYSTEM_PROMPT },
      {
        role: 'user' as const,
        content: `Generate a weekly review for "${identityLabel}". Habits: ${habitSummary}. Journal: ${journalSummary}. Return a JSON object with keys: summary (string), patterns (string[]), wins (string[]), improvements (string[]), nextWeekFocus (string).`,
      },
    ]

    const response = await groqClient.callGroq(messages, {
      temperature: 0.6,
      maxTokens: 600,
    })

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) return JSON.parse(jsonMatch[0])
    } catch {}

    return {
      summary: response,
      patterns: [],
      wins: [],
      improvements: [],
      nextWeekFocus: '',
    }
  },

  async getIdentitySummary(
    identityLabel: string,
    score: number,
    recentHabits: string[],
    streak: number,
  ): Promise<string> {
    const messages = [
      { role: 'system' as const, content: COACH_SYSTEM_PROMPT },
      {
        role: 'user' as const,
        content: `Write a 2-sentence identity affirmation for someone who is ${score}% toward becoming a "${identityLabel}". They're on a ${streak}-day streak and have been doing: ${recentHabits.join(', ')}. Make it deeply personal and reinforcing.`,
      },
    ]
    return groqClient.callGroq(messages, { temperature: 0.85, maxTokens: 150 })
  },

  async suggestTinyHabit(habitTitle: string, context: string): Promise<string> {
    const messages = [
      { role: 'system' as const, content: COACH_SYSTEM_PROMPT },
      {
        role: 'user' as const,
        content: `Apply the two-minute rule to this habit: "${habitTitle}". Context: ${context}. Suggest the smallest possible version that still counts as doing the habit. One sentence only.`,
      },
    ]
    return groqClient.callGroq(messages, { temperature: 0.7, maxTokens: 80 })
  },

  async analyzeEnvironment(description: string): Promise<{
    focusScore: number
    distractionScore: number
    qualityScore: number
    suggestions: string[]
    frictionReducers: string[]
  }> {
    const messages = [
      { role: 'system' as const, content: COACH_SYSTEM_PROMPT },
      {
        role: 'user' as const,
        content: `Analyze this environment for habit formation: "${description}". Return a JSON object with: focusScore (0-100), distractionScore (0-100), qualityScore (0-100), suggestions (string[], max 4), frictionReducers (string[], max 3).`,
      },
    ]

    const response = await groqClient.callGroq(messages, {
      temperature: 0.5,
      maxTokens: 400,
    })

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) return JSON.parse(jsonMatch[0])
    } catch {}

    return {
      focusScore: 50,
      distractionScore: 50,
      qualityScore: 50,
      suggestions: [response],
      frictionReducers: [],
    }
  },
}
