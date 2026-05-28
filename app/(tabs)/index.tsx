import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'
import { useHabitsStore } from '@/stores/habitsStore'
import { useIdentityStore } from '@/stores/identityStore'
import { useJournalStore } from '@/stores/journalStore'
import { HabitCard } from '@/components/habits/HabitCard'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing, Radius } from '@/constants/themes'
import { coachService } from '@/services/ai/coach'

export default function DashboardScreen() {
  const theme = useTheme()
  const { user } = useAuthStore()
  const { habits, todayLogs, streaks, loadHabits, loadTodayLogs, loadStreaks, completeHabit, isCompletedToday, getStreakForHabit } = useHabitsStore()
  const { primaryIdentity, loadIdentities, reinforceIdentities } = useIdentityStore()
  const { todayEntry, loadTodayEntry } = useJournalStore()
  const [coaching, setCoaching] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const userId = user?.id ?? ''
  const today = format(new Date(), 'EEEE, MMMM d')
  const completedCount = habits.filter((h) => isCompletedToday(h.id)).length
  const completionRate = habits.length > 0 ? completedCount / habits.length : 0

  const load = async () => {
    if (!userId) return
    await Promise.all([
      loadHabits(userId),
      loadTodayLogs(userId),
      loadStreaks(userId),
      loadIdentities(userId),
      loadTodayEntry(userId),
    ])
  }

  const loadCoaching = async () => {
    if (!primaryIdentity) return
    try {
      const completionData: Record<string, number> = {}
      habits.forEach((h) => {
        completionData[h.title] = getStreakForHabit(h.id)?.consistency_rate ?? 0
      })
      const msg = await coachService.getDailyCoaching({
        user_identity: primaryIdentity.label,
        recent_habits: habits.slice(0, 5).map((h) => h.title),
        streak_data: Object.fromEntries(
          habits.map((h) => [h.title, getStreakForHabit(h.id)?.current_streak ?? 0]),
        ),
        emotional_trend: 'neutral',
        focus_areas: [primaryIdentity.label],
        last_missed_habits: [],
      })
      setCoaching(msg)
    } catch {}
  }

  useEffect(() => {
    load()
  }, [userId])

  useEffect(() => {
    if (habits.length > 0 && primaryIdentity) loadCoaching()
  }, [habits.length, primaryIdentity?.id])

  const handleComplete = async (habitId: string) => {
    if (!userId) return
    await completeHabit(habitId, userId)
    const habit = habits.find((h) => h.id === habitId)
    if (habit?.identity_id) {
      await reinforceIdentities([habit.identity_id])
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              {today}
            </Text>
            <Text style={[styles.identityPhrase, { color: theme.text }]}>
              {primaryIdentity
                ? `You are becoming a ${primaryIdentity.label.toLowerCase()}`
                : `Good morning${user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings' as never)}
            style={[styles.avatarBtn, { backgroundColor: theme.surfaceHigh }]}
          >
            <Text style={styles.avatarText}>
              {(user?.full_name ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress ring */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <LinearGradient
            colors={[`${theme.primary}20`, `${theme.primary}05`]}
            style={[styles.progressCard, { borderColor: `${theme.primary}30` }]}
          >
            <View style={styles.progressRow}>
              <View>
                <Text style={[styles.progressTitle, { color: theme.text }]}>
                  Today's Progress
                </Text>
                <Text style={[styles.progressSub, { color: theme.textSecondary }]}>
                  {completedCount} of {habits.length} habits
                </Text>
              </View>
              <Text style={[styles.progressPct, { color: theme.primary }]}>
                {Math.round(completionRate * 100)}%
              </Text>
            </View>
            <ProgressBar
              progress={completionRate}
              height={8}
              style={{ marginTop: Spacing.sm }}
            />
          </LinearGradient>
        </Animated.View>

        {/* AI Coaching */}
        {coaching && (
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Card style={styles.coachCard} variant="elevated">
              <View style={styles.coachHeader}>
                <Text style={styles.coachIcon}>🤖</Text>
                <Text style={[styles.coachLabel, { color: theme.primary }]}>
                  AI Coach
                </Text>
              </View>
              <Text style={[styles.coachMsg, { color: theme.text }]}>
                {coaching}
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Habits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Today's Habits
            </Text>
            <TouchableOpacity onPress={() => router.push('/habit/create')}>
              <Ionicons name="add-circle" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {habits.length === 0 ? (
            <Card style={styles.emptyCard} variant="elevated">
              <Text style={styles.emptyIcon}>🌱</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No habits yet
              </Text>
              <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                Add your first tiny habit to start your transformation
              </Text>
              <TouchableOpacity
                style={[styles.addHabitBtn, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/habit/create')}
              >
                <Text style={styles.addHabitText}>Add Habit</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                isCompleted={isCompletedToday(habit.id)}
                streak={getStreakForHabit(habit.id)}
                onComplete={() => handleComplete(habit.id)}
                onPress={() => router.push(`/habit/${habit.id}` as never)}
              />
            ))
          )}
        </View>

        {/* Journal quick prompt */}
        {!todayEntry?.what_worked && (
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <TouchableOpacity
              onPress={() => router.push('/journal')}
              style={[styles.journalPrompt, { borderColor: theme.border, backgroundColor: theme.card }]}
            >
              <Text style={styles.journalIcon}>📝</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.journalTitle, { color: theme.text }]}>
                  Evening Reflection
                </Text>
                <Text style={[styles.journalSub, { color: theme.textMuted }]}>
                  Tap to reflect on today
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: Spacing['2xl'] }} />
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
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  greeting: { fontSize: Typography.sizes.sm, marginBottom: 4 },
  identityPhrase: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    maxWidth: 260,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: '#fff',
  },
  progressCard: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.base,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  progressSub: { fontSize: Typography.sizes.sm, marginTop: 2 },
  progressPct: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.extrabold,
  },
  coachCard: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  coachIcon: { fontSize: 18 },
  coachLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  coachMsg: {
    fontSize: Typography.sizes.base,
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  emptyCard: { alignItems: 'center', padding: Spacing['2xl'], gap: Spacing.sm },
  emptyIcon: { fontSize: 40 },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  emptyDesc: { fontSize: Typography.sizes.sm, textAlign: 'center' },
  addHabitBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
  },
  addHabitText: {
    color: '#fff',
    fontWeight: Typography.weights.semibold,
  },
  journalPrompt: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  journalIcon: { fontSize: 24 },
  journalTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  journalSub: { fontSize: Typography.sizes.sm, marginTop: 2 },
})
