import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
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
  const {
    habits,
    loadHabits,
    loadStreaks,
    isCompletedToday,
    completeHabit,
    uncompleteHabit,
    deleteHabit,
    getStreakForHabit,
  } = useHabitsStore()

  const habit = habits.find((h) => h.id === id)
  const streak = id ? getStreakForHabit(id) : null
  const isCompleted = id ? isCompletedToday(id) : false

  useEffect(() => {
    if (user?.id) {
      loadHabits(user.id)
      loadStreaks(user.id)
    }
  }, [user?.id])

  const handleDelete = () => {
    Alert.alert(
      'Delete habit?',
      `"${habit?.title}" and all its history will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await deleteHabit(id)
              router.back()
            }
          },
        },
      ]
    )
  }

  const handleUncomplete = () => {
    if (!id || !user?.id) return
    Alert.alert(
      'Undo completion?',
      "Remove today's check-in for this habit?",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo',
          style: 'destructive',
          onPress: () => uncompleteHabit(id, user.id!),
        },
      ]
    )
  }

  if (!habit) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: theme.textSecondary }]}>Habit not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {habit.title}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push(`/habit/create?id=${id}` as never)}
            style={styles.headerBtn}
          >
            <Ionicons name="pencil-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
            <Ionicons name="trash-outline" size={20} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Card style={styles.heroCard} variant="elevated">
          <Text style={styles.habitIcon}>{habit.icon ?? '●'}</Text>
          <Text style={[styles.habitTitle, { color: theme.text }]}>{habit.title}</Text>
          {habit.tiny_version && (
            <Text style={[styles.tinyVersion, { color: theme.textSecondary }]}>
              Two-minute: {habit.tiny_version}
            </Text>
          )}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {streak?.current_streak ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Streak</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.accent }]}>
                {streak?.longest_streak ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Best</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                {Math.round(streak?.consistency_rate ?? 0)}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Consistency</Text>
            </View>
          </View>

          <ProgressBar
            progress={(streak?.consistency_rate ?? 0) / 100}
            height={6}
            color={habit.color ?? theme.primary}
            style={{ marginTop: Spacing.sm }}
          />
        </Card>

        {!isCompleted ? (
          <TouchableOpacity
            style={[styles.completeBtn, { backgroundColor: habit.color ?? theme.primary }]}
            onPress={() => user?.id && completeHabit(habit.id, user.id)}
          >
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.completeBtnText}>Mark Complete Today</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.completedRow, { borderColor: theme.border }]}>
            <View style={[styles.completedBanner, { backgroundColor: `${habit.color ?? theme.primary}20` }]}>
              <Ionicons name="checkmark-circle" size={20} color={habit.color ?? theme.primary} />
              <Text style={[styles.completedText, { color: habit.color ?? theme.primary }]}>
                Done today
              </Text>
            </View>
            <TouchableOpacity onPress={handleUncomplete} style={styles.undoBtn}>
              <Text style={[styles.undoText, { color: theme.textMuted }]}>Undo</Text>
            </TouchableOpacity>
          </View>
        )}

        {habit.cue && (
          <Card style={styles.loopCard}>
            <Text style={[styles.loopLabel, { color: theme.textMuted }]}>CUE</Text>
            <Text style={[styles.loopValue, { color: theme.text }]}>{habit.cue}</Text>
          </Card>
        )}

        {habit.reward && (
          <Card style={styles.loopCard}>
            <Text style={[styles.loopLabel, { color: theme.textMuted }]}>REWARD</Text>
            <Text style={[styles.loopValue, { color: theme.text }]}>{habit.reward}</Text>
          </Card>
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
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  headerBtn: { padding: 4 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: Typography.sizes.base },
  heroCard: {
    marginHorizontal: Spacing['2xl'],
    marginTop: Spacing.base,
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
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.extrabold,
  },
  statLabel: { fontSize: Typography.sizes.xs, textAlign: 'center' },
  statDivider: { width: 1, height: 36 },
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
  completedRow: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  completedBanner: {
    flex: 1,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  completedText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  undoBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  undoText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    textDecorationLine: 'underline',
  },
  loopCard: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.sm,
    gap: 4,
  },
  loopLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, letterSpacing: 1 },
  loopValue: { fontSize: Typography.sizes.base },
})
