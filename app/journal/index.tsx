import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'
import { useJournalStore } from '@/stores/journalStore'
import { coachService } from '@/services/ai/coach'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing, Radius } from '@/constants/themes'

const MOOD_LABELS = ['😔', '😕', '😐', '😊', '🤩']

export default function JournalScreen() {
  const theme = useTheme()
  const { user } = useAuthStore()
  const { todayEntry, saveEntry, loadTodayEntry } = useJournalStore()
  const [whatWorked, setWhatWorked] = useState('')
  const [friction, setFriction] = useState('')
  const [identity, setIdentity] = useState('')
  const [freeText, setFreeText] = useState('')
  const [mood, setMood] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const today = format(new Date(), 'EEEE, MMMM d')

  useEffect(() => {
    if (user?.id) {
      loadTodayEntry(user.id)
    }
  }, [user?.id])

  useEffect(() => {
    if (todayEntry) {
      setWhatWorked(todayEntry.what_worked ?? '')
      setFriction(todayEntry.what_caused_friction ?? '')
      setIdentity(todayEntry.identity_reinforced ?? '')
      setFreeText(todayEntry.free_text ?? '')
      setMood(todayEntry.mood ?? 3)
      setEnergy(todayEntry.energy ?? 3)
      setAiInsight(todayEntry.ai_insights ?? null)
    }
  }, [todayEntry])

  const handleSave = async () => {
    if (!user?.id) return
    setIsSaving(true)
    try {
      await saveEntry(user.id, {
        what_worked: whatWorked || null,
        what_caused_friction: friction || null,
        identity_reinforced: identity || null,
        free_text: freeText || null,
        mood,
        energy,
        ai_insights: aiInsight,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const generateInsight = async () => {
    setIsGenerating(true)
    try {
      const context = [whatWorked, friction, identity, freeText]
        .filter(Boolean)
        .join(' | ')
      const insight = await coachService.analyzePatterns(
        { 'Overall today': mood * 20 },
        identity || 'a person building habits',
      )
      setAiInsight(insight)
    } catch {} finally {
      setIsGenerating(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Journal</Text>
        <Text style={[styles.date, { color: theme.textMuted }]}>{today}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mood & Energy */}
        <Card style={styles.moodCard} variant="elevated">
          <View style={styles.moodRow}>
            <View style={styles.moodGroup}>
              <Text style={[styles.moodLabel, { color: theme.textSecondary }]}>
                Mood
              </Text>
              <View style={styles.emojiRow}>
                {MOOD_LABELS.map((emoji, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setMood(idx + 1)}
                    style={[
                      styles.emojiBtn,
                      mood === idx + 1 && {
                        backgroundColor: `${theme.primary}30`,
                        borderRadius: Radius.sm,
                      },
                    ]}
                  >
                    <Text style={[styles.emoji, mood === idx + 1 && styles.emojiSelected]}>
                      {emoji}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.moodGroup}>
              <Text style={[styles.moodLabel, { color: theme.textSecondary }]}>
                Energy
              </Text>
              <View style={styles.emojiRow}>
                {['🪫', '😴', '⚡', '🔋', '🚀'].map((emoji, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setEnergy(idx + 1)}
                    style={[
                      styles.emojiBtn,
                      energy === idx + 1 && {
                        backgroundColor: `${theme.accent}30`,
                        borderRadius: Radius.sm,
                      },
                    ]}
                  >
                    <Text style={[styles.emoji, energy === idx + 1 && styles.emojiSelected]}>
                      {emoji}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Card>

        {/* Reflection prompts */}
        {[
          {
            question: 'What worked today?',
            value: whatWorked,
            onChange: setWhatWorked,
            placeholder: 'Habits completed, moments of clarity...',
            icon: '✅',
          },
          {
            question: 'What caused friction?',
            value: friction,
            onChange: setFriction,
            placeholder: 'Resistance, distractions, missed habits...',
            icon: '🔍',
          },
          {
            question: 'Which identity did you reinforce?',
            value: identity,
            onChange: setIdentity,
            placeholder: 'e.g. "I showed up as a disciplined creator"',
            icon: '🧬',
          },
        ].map((prompt) => (
          <View key={prompt.question} style={styles.promptSection}>
            <View style={styles.promptHeader}>
              <Text style={styles.promptIcon}>{prompt.icon}</Text>
              <Text style={[styles.promptQuestion, { color: theme.text }]}>
                {prompt.question}
              </Text>
            </View>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder={prompt.placeholder}
              placeholderTextColor={theme.textMuted}
              value={prompt.value}
              onChangeText={prompt.onChange}
              multiline
              numberOfLines={3}
            />
          </View>
        ))}

        {/* Free form */}
        <View style={styles.promptSection}>
          <Text style={[styles.promptQuestion, { color: theme.text }]}>
            Anything else on your mind?
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
                minHeight: 80,
              },
            ]}
            placeholder="Free write..."
            placeholderTextColor={theme.textMuted}
            value={freeText}
            onChangeText={setFreeText}
            multiline
            numberOfLines={5}
          />
        </View>

        {/* AI Insight */}
        {aiInsight ? (
          <Card style={styles.insightCard} variant="elevated">
            <View style={styles.insightHeader}>
              <Text style={styles.insightIcon}>🤖</Text>
              <Text style={[styles.insightLabel, { color: theme.primary }]}>
                AI Insight
              </Text>
            </View>
            <Text style={[styles.insightText, { color: theme.text }]}>
              {aiInsight}
            </Text>
          </Card>
        ) : (
          <Button
            title={isGenerating ? 'Analyzing...' : '✨ Get AI Insight'}
            variant="secondary"
            onPress={generateInsight}
            isLoading={isGenerating}
            fullWidth
          />
        )}

        <Button
          title="Save Reflection"
          onPress={handleSave}
          isLoading={isSaving}
          fullWidth
          style={styles.saveButton}
        />

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    flex: 1,
    textAlign: 'center',
  },
  date: { fontSize: Typography.sizes.sm },
  scroll: {
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.base,
    paddingBottom: Spacing['3xl'],
  },
  moodCard: { gap: Spacing.sm },
  moodRow: { gap: Spacing.base },
  moodGroup: { gap: Spacing.xs },
  moodLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },
  emojiRow: { flexDirection: 'row', gap: Spacing.xs },
  emojiBtn: { padding: 4 },
  emoji: { fontSize: 24, opacity: 0.5 },
  emojiSelected: { opacity: 1 },
  promptSection: { gap: Spacing.sm },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  promptIcon: { fontSize: 18 },
  promptQuestion: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  textArea: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    fontSize: Typography.sizes.base,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  insightCard: { gap: Spacing.sm },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  insightIcon: { fontSize: 16 },
  insightLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  insightText: { fontSize: Typography.sizes.base, lineHeight: 22 },
  saveButton: { marginTop: Spacing.xs },
})
