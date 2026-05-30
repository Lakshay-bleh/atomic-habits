import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
// edges={['top']} prevents double bottom padding on top of the tab bar
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/authStore'
import { useHabitsStore } from '@/stores/habitsStore'
import { useIdentityStore } from '@/stores/identityStore'
import { coachService } from '@/services/ai/coach'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing, Radius } from '@/constants/themes'
import type { AICoachMessage } from '@/types'

const QUICK_PROMPTS = [
  "Why am I struggling to stay consistent?",
  "Help me design a morning routine",
  "I missed 3 days — how do I recover?",
  "What habit should I focus on first?",
  "How do I reduce friction for my hardest habit?",
]

export default function CoachScreen() {
  const theme = useTheme()
  const { user } = useAuthStore()
  const { habits, getStreakForHabit } = useHabitsStore()
  const { primaryIdentity, identities } = useIdentityStore()
  const [messages, setMessages] = useState<AICoachMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const buildContext = () => ({
    user_identity: primaryIdentity?.label ?? 'someone building better habits',
    recent_habits: habits.slice(0, 8).map((h) => h.title),
    streak_data: Object.fromEntries(
      habits.map((h) => [h.title, getStreakForHabit(h.id)?.current_streak ?? 0])
    ),
    emotional_trend: 'neutral',
    focus_areas: identities.map((i) => i.label),
    last_missed_habits: habits
      .filter((h) => (getStreakForHabit(h.id)?.current_streak ?? 0) === 0)
      .slice(0, 3)
      .map((h) => h.title),
  })

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: AICoachMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const allMsgs = [...messages, userMsg]
      const response = await coachService.chat(allMsgs, buildContext())
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response, timestamp: new Date().toISOString() },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Having trouble connecting. Check your internet and try again.",
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  const startNewChat = () => {
    setMessages([])
    setInput('')
  }

  useEffect(() => {
    if (!primaryIdentity || messages.length > 0) return
    setIsLoading(true)
    coachService
      .getDailyCoaching(buildContext())
      .then((greeting) => {
        setMessages([{ role: 'assistant', content: greeting, timestamp: new Date().toISOString() }])
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [primaryIdentity?.id])

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>AI Coach</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {habits.length} habits · {identities.length} identities
          </Text>
        </View>
        <TouchableOpacity onPress={startNewChat} style={styles.newChatBtn}>
          <Ionicons name="create-outline" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={88}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Your AI habit coach
              </Text>
              <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                Ask anything about building habits, overcoming resistance, or designing your system.
              </Text>
              <View style={styles.quickPrompts}>
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.quickPrompt, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => sendMessage(prompt)}
                  >
                    <Text style={[styles.quickPromptText, { color: theme.textSecondary }]}>
                      {prompt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {messages.map((msg, idx) => (
            <Animated.View
              key={idx}
              entering={msg.role === 'user' ? FadeInRight.duration(300) : FadeInLeft.duration(300)}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              {msg.role === 'assistant' && (
                <View style={[styles.avatar, { backgroundColor: `${theme.primary}25` }]}>
                  <Ionicons name="sparkles" size={14} color={theme.primary} />
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: msg.role === 'user' ? theme.primary : theme.surfaceElevated,
                    borderColor: msg.role === 'user' ? 'transparent' : theme.border,
                    maxWidth: msg.role === 'user' ? '78%' : '85%',
                  },
                ]}
              >
                <Text style={[styles.messageText, { color: msg.role === 'user' ? '#fff' : theme.text }]}>
                  {msg.content}
                </Text>
              </View>
            </Animated.View>
          ))}

          {isLoading && (
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <View style={[styles.avatar, { backgroundColor: `${theme.primary}25` }]}>
                <Ionicons name="sparkles" size={14} color={theme.primary} />
              </View>
              <View style={[styles.bubble, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputRow, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.surfaceHigh, color: theme.text, borderColor: theme.border }]}
            placeholder="Ask your coach..."
            placeholderTextColor={theme.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: input.trim() ? theme.primary : theme.surfaceHigh }]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            <Ionicons name="send" size={18} color={input.trim() ? '#fff' : theme.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
  },
  title: { fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.extrabold },
  subtitle: { fontSize: Typography.sizes.xs, marginTop: 2 },
  newChatBtn: { padding: Spacing.xs },
  messages: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, gap: Spacing.sm },
  emptyState: { padding: Spacing['2xl'], gap: Spacing.base },
  emptyTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  emptyDesc: { fontSize: Typography.sizes.base, lineHeight: 22 },
  quickPrompts: { gap: Spacing.xs, marginTop: Spacing.sm },
  quickPrompt: { padding: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1 },
  quickPromptText: { fontSize: Typography.sizes.sm },
  messageBubble: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.xs },
  userBubble: { justifyContent: 'flex-end' },
  assistantBubble: { justifyContent: 'flex-start' },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { padding: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1 },
  messageText: { fontSize: Typography.sizes.base, lineHeight: 22 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.base,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.base,
    maxHeight: 100,
  },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
})
