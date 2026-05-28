import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/hooks/useTheme'
import { useHaptics } from '@/hooks/useHaptics'
import { useAuthStore } from '@/stores/authStore'
import { useHabitsStore } from '@/stores/habitsStore'
import { useIdentityStore } from '@/stores/identityStore'
import { IDENTITY_TEMPLATES } from '@/constants/identities'
import { Typography, Spacing, Radius } from '@/constants/themes'
import type { IdentityTemplate } from '@/types'

export default function OnboardingHabitsScreen() {
  const theme = useTheme()
  const haptics = useHaptics()
  const { identities: identitiesParam } = useLocalSearchParams<{ identities: string }>()
  const { user } = useAuthStore()
  const { createHabit } = useHabitsStore()
  const { createIdentity } = useIdentityStore()
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const selectedTemplates = (identitiesParam?.split(',') ?? []) as IdentityTemplate[]
  const primaryTemplate = selectedTemplates[0]
  const config = primaryTemplate ? IDENTITY_TEMPLATES[primaryTemplate] : null

  useEffect(() => {
    loadSuggestions()
  }, [])

  const loadSuggestions = async () => {
    setLoading(true)
    try {
      const allSuggestions: string[] = []
      for (const templateId of selectedTemplates) {
        const tpl = IDENTITY_TEMPLATES[templateId]
        if (tpl) allSuggestions.push(...tpl.suggestedHabits)
      }
      setSuggestions([...new Set(allSuggestions)].slice(0, 8))
    } finally {
      setLoading(false)
    }
  }

  const toggle = (habit: string) => {
    haptics.light()
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(habit)) next.delete(habit)
      else next.add(habit)
      return next
    })
  }

  const finish = async () => {
    if (!user?.id || selected.size === 0) return
    setSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      // Create identities
      for (const templateId of selectedTemplates) {
        const tpl = IDENTITY_TEMPLATES[templateId]
        await createIdentity({
          user_id: user.id,
          label: tpl.label,
          description: tpl.description,
          color: tpl.color,
          icon: tpl.icon,
          score: 0,
          confidence: 0,
          streak: 0,
          longest_streak: 0,
          total_reinforcements: 0,
        })
      }
      // Create selected habits
      for (const title of Array.from(selected)) {
        await createHabit({
          user_id: user.id,
          title,
          description: null,
          identity_id: null,
          cue: null,
          craving: null,
          response: null,
          reward: null,
          tiny_version: null,
          normal_version: null,
          frequency: 'daily',
          scheduled_days: [0, 1, 2, 3, 4, 5, 6],
          reminder_time: null,
          start_date: today,
          friction_score: 3,
          difficulty: 'tiny',
          environment_setup: null,
          category: 'other',
          color: null,
          icon: null,
          is_archived: false,
          is_bad_habit: false,
          stack_after_habit_id: null,
        })
      }
      router.replace('/' as never)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Your starter habits
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Pick habits that resonate. You can always add more later.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.primary} size="large" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Finding habits for you...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {suggestions.map((habit, idx) => {
            const isSelected = selected.has(habit)
            return (
              <Animated.View
                key={habit}
                entering={FadeInDown.delay(idx * 60).duration(400)}
              >
                <TouchableOpacity onPress={() => toggle(habit)} activeOpacity={0.8}>
                  <Card
                    style={[
                      styles.habitItem,
                      isSelected && { borderColor: config?.color ?? theme.primary },
                    ]}
                    variant={isSelected ? 'elevated' : 'default'}
                  >
                    <View style={styles.habitRow}>
                      <View
                        style={[
                          styles.check,
                          {
                            backgroundColor: isSelected ? (config?.color ?? theme.primary) : 'transparent',
                            borderColor: isSelected ? (config?.color ?? theme.primary) : theme.border,
                          },
                        ]}
                      >
                        {isSelected && (
                          <Text style={styles.checkMark}>✓</Text>
                        )}
                      </View>
                      <Text style={[styles.habitText, { color: theme.text }]}>
                        {habit}
                      </Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              </Animated.View>
            )
          })}
          <View style={{ height: Spacing['3xl'] }} />
        </ScrollView>
      )}

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Text style={[styles.footerHint, { color: theme.textMuted }]}>
          {selected.size} selected
        </Text>
        <Button
          title={saving ? 'Saving...' : 'Start Journey →'}
          onPress={finish}
          disabled={selected.size === 0 || saving}
          style={styles.continueButton}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.base,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.extrabold,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
  },
  loadingText: { fontSize: Typography.sizes.base },
  list: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  habitItem: {
    padding: Spacing.base,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: Typography.weights.bold,
  },
  habitText: {
    fontSize: Typography.sizes.base,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    borderTopWidth: 1,
  },
  footerHint: { fontSize: Typography.sizes.sm },
  continueButton: { minWidth: 160 },
})
