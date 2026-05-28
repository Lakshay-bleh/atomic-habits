import React, { useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/authStore'
import { useHabitsStore } from '@/stores/habitsStore'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing, Radius } from '@/constants/themes'

export default function HabitDetailScreen() {
  const theme = useTheme()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const { habits, streaks, loadHabits, loadStreaks, isCompletedToday, completeHabit, getStreakForHabit } = useHabitsStore()

  const habit = habits.find((h) => h.id === id)
  const streak = id ? getStreakForHabit(id) : null
  const isCompleted = id ? isCompletedToday(id) : false

  useEffect(() => {
    if (user?.id) {
      loadHabits(user.id)
      loadStreaks(user.id)
    }
  }, [user?.id])

  if (!habit) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: theme.textSecondary }]}>
            Habit not found
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {habit.title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <Card style={styles.heroCard} variant="elevated">
          <Text style={styles.habitIcon}>{habit.icon ?? '✦'}</Text>
          <Text style={[styles.habitTitle, { color: theme.text }]}>{habit.title}</Text>
          {habit.tiny_version && (
            <Text style={[styles.tinyVersion, { color: theme.textSecondary }]}>
              Tiny: {habit.tiny_version}
            </Text>
          )}

          {/* Streak stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {streak?.current_streak ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Current Streak</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.accent }]}>
                {streak?.longest_streak ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Best Streak</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                {Math.round((streak?.consistency_rate ?? 0) * 100)}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Consistency</Text>
            </View>
          </View>

          <ProgressBar
            progress={streak?.consistency_rate ?? 0}
            height={6}
            color={habit.color ?? theme.primary}
            style={{ marginTop: Spacing.sm }}
          />
        </Card>

        {/* Complete button */}
        {!isCompleted && (
          <TouchableOpacity
            style={[styles.completeBtn, { backgroundColor: habit.color ?? theme.primary }]}
            onPress={() => user?.id && completeHabit(habit.id, user.id)}
          >
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.completeBtnText}>Mark Complete Today</Text>
          </TouchableOpacity>
        )}

        {isCompleted && (
          <View style={[styles.completedBanner, { backgroundColor: `${habit.color ?? theme.primary}20`, borderColor: `${habit.color ?? theme.primary}40` }]}>
            <Ionicons name="checkmark-circle" size={22} color={habit.color ?? theme.primary} />
            <Text style={[styles.completedText, { color: habit.color ?? theme.primary }]}>
              Completed today!
            </Text>
          </View>
        )}

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
  headerTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.base,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: { fontSize: Typography.sizes.base },
  heroCard: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  habitIcon: { fontSize: 48 },
  habitTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.extrabold,
    textAlign: 'center',
  },
  tinyVersion: {
    fontSize: Typography.sizes.sm,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    width: '100%',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.extrabold,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  completeBtn: {
    marginHorizontal: Spacing['2xl'],
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  completeBtnText: {
    color: '#fff',
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  completedBanner: {
    marginHorizontal: Spacing['2xl'],
    borderRadius: Radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  completedText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
})
