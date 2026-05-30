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
import { useHabitsStore } from '@/stores/habitsStore'
import { useIdentityStore } from '@/stores/identityStore'
import { coachService } from '@/services/ai/coach'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing, Radius } from '@/constants/themes'

const MOOD_ICONS: { icon: string; label: string }[] = [
  { icon: 'sad-outline', label: 'Low' },
  { icon: 'sad-outline', label: 'Meh' },
  { icon: 'remove-outline', label: 'Okay' },
  { icon: 'happy-outline', label: 'Good' },
  { icon: 'happy-outline', label: 'Great' },
]

const ENERGY_ICONS: { icon: string; label: string }[] = [
  { icon: 'battery-dead-outline', label: 'Drained' },
  { icon: 'battery-half-outline', label: 'Low' },
  { icon: 'battery-half-outline', label: 'Okay' },
  { icon: 'battery-full-outline', label: 'High' },
  { icon: 'flash-outline', label: 'Peak' },
]

const PROMPT_CONFIGS: { key: 'whatWorked' | 'friction' | 'identity'; question: string; placeholder: string; icon: string }[] = [
  {
    key: 'whatWorked',
    question: 'What worked today?',
    placeholder: 'Habits completed, moments of clarity, small wins...',
    icon: 'checkmark-circle-outline',
  },
  {
    key: 'friction',
    question: 'What caused friction?',
    placeholder: 'Resistance, distractions, missed habits...',
    icon: 'alert-circle-outline',
  },
  {
    key: 'identity',
    question: 'Which identity did you reinforce?',
    placeholder: 'e.g. "I showed up as a disciplined creator"',
    icon: 'person-outline',
  },
]

export default function JournalScreen() {
  const theme = useTheme()
  const { user } = useAuthStore()
  const { todayEntry, saveEntry, loadTodayEntry } = useJournalStore()
  const { habits, getStreakForHabit } = useHabitsStore()
  const { primaryIdentity } = useIdentityStore()

  const [whatWorked, setWhatWorked] = useState('')
  const [friction, setFriction] = useState('')
  const [identity, setIdentity] = useState('')
  const [freeText, setFreeText] = useState('')
  const [mood, setMood] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [saved, setSaved] = useState(false)

  const today = format(new Date(), 'EEEE, MMMM d')

  useEffect(() => {
    if (user?.id) loadTodayEntry(user.id)
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
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setIsSaving(false)
    }
  }

  const generateInsight = async () => {
    setIsGenerating(true)
    try {
      const completionData: Record<string, number> = {}
      habits.forEach((h) => {
        const streak = getStreakForHabit(h.id)
        completionData[h.title] = streak?.total_completions
          ? Math.min(100, Math.round((streak.total_completions / 30) * 100))
          : 0
      })

      const identityLabel = (primaryIdentity?.label ?? identity) || 'someone building better habits'
      const insight = await coachService.analyzePatterns(completionData, identityLabel)
      setAiInsight(insight)
    } catch {} finally {
      setIsGenerating(false)
    }
  }

  const textAreaValues: Record<string, string> = { whatWorked, friction, identity }
  const promptSetters: Record<string, (v: string) => void> = { whatWorked: setWhatWorked, friction: setFriction, identity: setIdentity }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Evening Reflection</Text>
          <Text style={[styles.date, { color: theme.textMuted }]}>{today}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Mood & Energy */}
        <Card style={styles.moodCard} variant="elevated">
          <View style={styles.moodSection}>
            <Text style={[styles.moodSectionLabel, { color: theme.textSecondary }]}>Mood</Text>
            <View style={styles.ratingRow}>
              {MOOD_ICONS.map((item, idx) => {
                const selected = mood === idx + 1
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setMood(idx + 1)}
                    style={[
                      styles.ratingBtn,
                      {
                        backgroundColor: selected ? `${theme.primary}20` : theme.surfaceHigh,
                        borderColor: selected ? theme.primary : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color={selected ? theme.primary : theme.textMuted}
                    />
                    <Text style={[styles.ratingLabel, { color: selected ? theme.primary : theme.textMuted }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          <View style={[styles.moodDivider, { backgroundColor: theme.border }]} />

          <View style={styles.moodSection}>
            <Text style={[styles.moodSectionLabel, { color: theme.textSecondary }]}>Energy</Text>
            <View style={styles.ratingRow}>
              {ENERGY_ICONS.map((item, idx) => {
                const selected = energy === idx + 1
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setEnergy(idx + 1)}
                    style={[
                      styles.ratingBtn,
                      {
                        backgroundColor: selected ? `${theme.accent}20` : theme.surfaceHigh,
                        borderColor: selected ? theme.accent : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color={selected ? theme.accent : theme.textMuted}
                    />
                    <Text style={[styles.ratingLabel, { color: selected ? theme.accent : theme.textMuted }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </Card>

        {/* Reflection prompts */}
        {PROMPT_CONFIGS.map((prompt) => (
          <View key={prompt.key} style={styles.promptSection}>
            <View style={styles.promptHeader}>
              <Ionicons name={prompt.icon as any} size={18} color={theme.primary} />
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
              value={textAreaValues[prompt.key]}
              onChangeText={promptSetters[prompt.key]}
              multiline
              numberOfLines={3}
            />
          </View>
        ))}

        {/* Free form */}
        <View style={styles.promptSection}>
          <View style={styles.promptHeader}>
            <Ionicons name="create-outline" size={18} color={theme.primary} />
            <Text style={[styles.promptQuestion, { color: theme.text }]}>
              Anything else on your mind?
            </Text>
          </View>
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
              <View style={[styles.insightIconWrap, { backgroundColor: `${theme.primary}20` }]}>
                <Ionicons name="sparkles" size={14} color={theme.primary} />
              </View>
              <Text style={[styles.insightLabel, { color: theme.primary }]}>AI INSIGHT</Text>
              <TouchableOpacity onPress={generateInsight} disabled={isGenerating} style={{ marginLeft: 'auto' }}>
                {isGenerating
                  ? <ActivityIndicator size="small" color={theme.primary} />
                  : <Ionicons name="refresh" size={16} color={theme.textMuted} />
                }
              </TouchableOpacity>
            </View>
            <Text style={[styles.insightText, { color: theme.text }]}>{aiInsight}</Text>
          </Card>
        ) : (
          <TouchableOpacity
            style={[styles.insightPrompt, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={generateInsight}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons name="sparkles-outline" size={18} color={theme.primary} />
            )}
            <Text style={[styles.insightPromptText, { color: theme.primary }]}>
              {isGenerating ? 'Analyzing your patterns...' : 'Get AI Insight'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: saved ? '#10B981' : theme.primary },
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name={saved ? 'checkmark' : 'save-outline'} size={18} color="#fff" />
          )}
          <Text style={styles.saveButtonText}>
            {saved ? 'Saved!' : isSaving ? 'Saving...' : 'Save Reflection'}
          </Text>
        </TouchableOpacity>

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
    borderBottomWidth: 1,
  },
  backBtn: { width: 40 },
  title: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, textAlign: 'center' },
  date: { fontSize: Typography.sizes.xs, textAlign: 'center', marginTop: 2 },
  scroll: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.base,
    gap: Spacing.base,
    paddingBottom: Spacing['3xl'],
  },
  moodCard: { gap: Spacing.sm },
  moodSection: { gap: Spacing.xs },
  moodSectionLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },
  moodDivider: { height: StyleSheet.hairlineWidth },
  ratingRow: { flexDirection: 'row', gap: Spacing.xs },
  ratingBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 2,
  },
  ratingLabel: { fontSize: 9, fontWeight: Typography.weights.medium },
  promptSection: { gap: Spacing.sm },
  promptHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  promptQuestion: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  textArea: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    fontSize: Typography.sizes.base,
    textAlignVertical: 'top',
    minHeight: 64,
    lineHeight: 22,
  },
  insightCard: { gap: Spacing.sm },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  insightIconWrap: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  insightLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, letterSpacing: 1 },
  insightText: { fontSize: Typography.sizes.base, lineHeight: 22 },
  insightPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.base,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  insightPromptText: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.base,
    borderRadius: Radius.xl,
    marginTop: Spacing.xs,
  },
  saveButtonText: { color: '#fff', fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
})
