import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/authStore'
import { useHabitsStore } from '@/stores/habitsStore'
import { useIdentityStore } from '@/stores/identityStore'
import type { HabitCategory, HabitDifficulty } from '@/types'
import { coachService } from '@/services/ai/coach'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing, Radius } from '@/constants/themes'
import { HABIT_CATEGORIES } from '@/constants/identities'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  tiny_version: z.string().optional(),
  cue: z.string().optional(),
  reward: z.string().optional(),
  category: z.string(),
})
type FormData = z.infer<typeof schema>

export default function CreateHabitScreen() {
  const theme = useTheme()
  const { id: editId } = useLocalSearchParams<{ id?: string }>()
  const { user } = useAuthStore()
  const { createHabit, updateHabit, habits } = useHabitsStore()
  const { identities } = useIdentityStore()
  const [category, setCategory] = useState<HabitCategory>('health')
  const [difficulty, setDifficulty] = useState<HabitDifficulty>('easy')
  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [aiTiny, setAiTiny] = useState<string | null>(null)

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'health' },
  })

  const titleValue = watch('title')

  useEffect(() => {
    if (!editId) return
    const existing = habits.find((h) => h.id === editId)
    if (!existing) return
    setValue('title', existing.title)
    if (existing.cue) setValue('cue', existing.cue)
    if (existing.reward) setValue('reward', existing.reward)
    if (existing.tiny_version) setValue('tiny_version', existing.tiny_version)
    if (existing.category) setCategory(existing.category as HabitCategory)
    if (existing.difficulty) setDifficulty(existing.difficulty as HabitDifficulty)
    if (existing.identity_id) setSelectedIdentity(existing.identity_id)
  }, [editId])

  const suggestTinyHabit = async () => {
    if (!titleValue) return
    setAiSuggesting(true)
    try {
      const tiny = await coachService.suggestTinyHabit(titleValue, '')
      setAiTiny(tiny)
      setValue('tiny_version', tiny)
    } catch {} finally {
      setAiSuggesting(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!user?.id) {
      Alert.alert('Error', 'Not signed in')
      return
    }
    setIsLoading(true)
    try {
      if (editId) {
        await updateHabit(editId, {
          title: data.title,
          cue: data.cue ?? null,
          reward: data.reward ?? null,
          tiny_version: data.tiny_version ?? null,
          category,
          difficulty,
          identity_id: selectedIdentity,
          icon: HABIT_CATEGORIES.find((c) => c.id === category)?.emoji ?? null,
        })
      } else {
        await createHabit({
          user_id: user.id,
          title: data.title,
          description: null,
          identity_id: selectedIdentity,
          cue: data.cue ?? null,
          craving: null,
          response: data.title,
          reward: data.reward ?? null,
          tiny_version: data.tiny_version ?? null,
          normal_version: data.title,
          frequency: 'daily',
          scheduled_days: [0, 1, 2, 3, 4, 5, 6],
          reminder_time: null,
          start_date: new Date().toISOString().split('T')[0],
          friction_score: difficulty === 'tiny' ? 1 : difficulty === 'easy' ? 3 : difficulty === 'medium' ? 6 : 9,
          difficulty,
          environment_setup: null,
          category,
          color: null,
          icon: HABIT_CATEGORIES.find((c) => c.id === category)?.emoji ?? null,
          is_archived: false,
          is_bad_habit: false,
          stack_after_habit_id: null,
        })
      }
      router.back()
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const DIFFICULTIES: { id: HabitDifficulty; label: string }[] = [
    { id: 'tiny', label: 'Tiny' },
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
  ]

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>{editId ? 'Edit Habit' : 'New Habit'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Habit Title"
              placeholder="e.g. Read every morning"
              onChangeText={onChange}
              value={value}
              error={errors.title?.message}
            />
          )}
        />

        {/* Two-minute rule */}
        <View style={styles.tinySection}>
          <View style={styles.tinyHeader}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Two-Minute Version
            </Text>
            <Button
              title={aiSuggesting ? '...' : 'AI Suggest'}
              variant="ghost"
              size="sm"
              onPress={suggestTinyHabit}
              disabled={!titleValue || aiSuggesting}
            />
          </View>
          <Controller
            control={control}
            name="tiny_version"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder="e.g. Read 1 page"
                onChangeText={onChange}
                value={value}
                hint="The smallest version that still counts"
              />
            )}
          />
        </View>

        {/* Category */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Category
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {HABIT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setCategory(cat.id as HabitCategory)}
            >
              <Badge
                label={cat.label}
                emoji={cat.emoji}
                color={category === cat.id ? cat.color : undefined}
                size="md"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Difficulty */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Difficulty
        </Text>
        <View style={styles.difficultyRow}>
          {DIFFICULTIES.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[
                styles.diffBtn,
                {
                  backgroundColor:
                    difficulty === d.id ? theme.primary : theme.surfaceHigh,
                  borderColor:
                    difficulty === d.id ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setDifficulty(d.id)}
            >
              <Text
                style={[
                  styles.diffLabel,
                  { color: difficulty === d.id ? '#fff' : theme.textSecondary },
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Habit Loop */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Habit Loop (optional)
        </Text>
        <Controller
          control={control}
          name="cue"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Cue"
              placeholder="After I brush my teeth..."
              onChangeText={onChange}
              value={value}
              hint="What triggers this habit?"
            />
          )}
        />
        <Controller
          control={control}
          name="reward"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Reward"
              placeholder="I'll feel proud and energized"
              onChangeText={onChange}
              value={value}
              hint="How will you reward yourself?"
            />
          )}
        />

        {/* Identity link */}
        {identities.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Link to Identity
            </Text>
            <View style={styles.identityRow}>
              {identities.map((identity) => (
                <TouchableOpacity
                  key={identity.id}
                  style={[
                    styles.identityChip,
                    {
                      backgroundColor:
                        selectedIdentity === identity.id
                          ? `${identity.color}30`
                          : theme.surfaceHigh,
                      borderColor:
                        selectedIdentity === identity.id
                          ? identity.color
                          : theme.border,
                    },
                  ]}
                  onPress={() =>
                    setSelectedIdentity(
                      selectedIdentity === identity.id ? null : identity.id,
                    )
                  }
                >
                  <Text style={{ fontSize: 16 }}>{identity.icon}</Text>
                  <Text
                    style={[
                      styles.identityChipText,
                      { color: selectedIdentity === identity.id ? identity.color : theme.textSecondary },
                    ]}
                  >
                    {identity.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Button
          title={editId ? 'Save Changes' : 'Create Habit'}
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
          fullWidth
          style={styles.submitButton}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  scroll: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.xl,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs,
    letterSpacing: 0.3,
  },
  tinySection: { marginBottom: Spacing.sm },
  tinyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.base,
    paddingBottom: Spacing.xs,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.base,
  },
  diffBtn: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 4,
  },
  diffEmoji: { fontSize: 18 },
  diffLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.medium },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  identityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.base,
  },
  identityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  identityChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  submitButton: { marginTop: Spacing.lg },
})
