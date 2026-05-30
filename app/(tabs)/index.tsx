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
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing, Radius } from '@/constants/themes'
import { coachService } from '@/services/ai/coach'

export default function DashboardScreen() {
  const theme = useTheme()
  const { user } = useAuthStore()
  const { habits, loadHabits, loadTodayLogs, loadStreaks, completeHabit, uncompleteHabit, isCompletedToday, getStreakForHabit } = useHabitsStore()
  const { primaryIdentity, identities, loadIdentities, reinforceIdentities } = useIdentityStore()
  const { todayEntry, loadTodayEntry } = useJournalStore()
  const [coaching, setCoaching] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const userId = user?.id ?? ''
  const today = format(new Date(), 'EEEE, MMMM d')
  const completedCount = habits.filter((h) => isCompletedToday(h.id)).length
  const completionRate = habits.length > 0 ? completedCount / habits.length : 0
  const bestStreak = Math.max(0, ...habits.map((h) => getStreakForHabit(h.id)?.current_streak ?? 0))
  const firstName = user?.full_name?.split(' ')[0] ?? ''

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
    if (!primaryIdentity || habits.length === 0) return
    try {
      const completionRate = habits.length > 0 ? completedCount / habits.length : 0
      const emotional_trend = completionRate >= 0.8 ? 'excellent' : completionRate >= 0.5 ? 'good' : completionRate > 0 ? 'neutral' : 'low'
      const msg = await coachService.getDailyCoaching({
        user_identity: primaryIdentity.label,
        recent_habits: habits.slice(0, 5).map((h) => h.title),
        streak_data: Object.fromEntries(
          habits.map((h) => [h.title, getStreakForHabit(h.id)?.current_streak ?? 0]),
        ),
        emotional_trend,
        focus_areas: identities.map((i) => i.label),
        last_missed_habits: habits
          .filter((h) => (getStreakForHabit(h.id)?.current_streak ?? 0) === 0)
          .slice(0, 3)
          .map((h) => h.title),
      })
      setCoaching(msg)
    } catch {}
  }

  useEffect(() => { load() }, [userId])
  useEffect(() => {
    if (habits.length > 0 && primaryIdentity) loadCoaching()
  }, [habits.length, primaryIdentity?.id])

  const handleComplete = async (habitId: string) => {
    if (!userId) return
    await completeHabit(habitId, userId)
    const habit = habits.find((h) => h.id === habitId)
    if (habit?.identity_id) reinforceIdentities([habit.identity_id])
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              {getGreeting()}{firstName ? `, ${firstName}` : ''}
            </Text>
            <Text style={[styles.identityPhrase, { color: theme.text }]} numberOfLines={2}>
              {primaryIdentity
                ? `You are becoming a ${primaryIdentity.label.toLowerCase()}`
                : 'Build your identity, one habit at a time'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings' as never)}
            style={[styles.avatar, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.avatarText}>
              {(user?.full_name ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.delay(50).duration(500)}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {completedCount}/{habits.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Today</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{bestStreak}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Best streak</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.statValue, { color: theme.accent }]}>
                {Math.round(completionRate * 100)}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Rate</Text>
            </View>
          </View>
        </Animated.View>

        {/* Progress bar */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <LinearGradient
            colors={[`${theme.primary}18`, `${theme.primary}06`]}
            style={[styles.progressCard, { borderColor: `${theme.primary}25` }]}
          >
            <View style={styles.progressRow}>
              <Text style={[styles.progressTitle, { color: theme.text }]}>Today's Progress</Text>
              <Text style={[styles.progressPct, { color: theme.primary }]}>
                {Math.round(completionRate * 100)}%
              </Text>
            </View>
            <ProgressBar progress={completionRate} height={6} style={{ marginTop: Spacing.sm }} />
            {completionRate === 1 && habits.length > 0 && (
              <Text style={[styles.allDoneText, { color: theme.primary }]}>
                All habits complete — great work today.
              </Text>
            )}
          </LinearGradient>
        </Animated.View>

        {/* AI Insight */}
        {coaching && (
          <Animated.View entering={FadeInDown.delay(150).duration(500)}>
            <View style={[styles.insightCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.insightHeader}>
                <View style={[styles.insightIconWrap, { backgroundColor: `${theme.primary}20` }]}>
                  <Ionicons name="sparkles" size={14} color={theme.primary} />
                </View>
                <Text style={[styles.insightLabel, { color: theme.primary }]}>TODAY'S INSIGHT</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/coach' as never)}>
                  <Text style={[styles.insightLink, { color: theme.textMuted }]}>Chat →</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.insightMsg, { color: theme.text }]}>{coaching}</Text>
            </View>
          </Animated.View>
        )}

        {/* Today's habits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Habits</Text>
            <TouchableOpacity
              onPress={() => router.push('/habit/create')}
              style={[styles.addBtn, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}30` }]}
            >
              <Ionicons name="add" size={16} color={theme.primary} />
              <Text style={[styles.addBtnText, { color: theme.primary }]}>Add</Text>
            </TouchableOpacity>
          </View>

          {habits.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No habits yet</Text>
              <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                Add your first habit to start building your identity
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/habit/create')}
              >
                <Text style={styles.emptyBtnText}>Add First Habit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            habits.map((habit, idx) => (
              <Animated.View key={habit.id} entering={FadeInDown.delay(200 + idx * 40).duration(400)}>
                <HabitCard
                  habit={habit}
                  isCompleted={isCompletedToday(habit.id)}
                  streak={getStreakForHabit(habit.id)}
                  onComplete={() => handleComplete(habit.id)}
                  onUncomplete={() => userId && uncompleteHabit(habit.id, userId)}
                  onPress={() => router.push(`/habit/${habit.id}` as never)}
                />
              </Animated.View>
            ))
          )}
        </View>

        {/* Journal prompt */}
        {!todayEntry?.what_worked && habits.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <TouchableOpacity
              onPress={() => router.push('/journal')}
              style={[styles.journalRow, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={[styles.journalIcon, { backgroundColor: `${theme.accent}20` }]}>
                <Ionicons name="journal-outline" size={18} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.journalTitle, { color: theme.text }]}>Evening Reflection</Text>
                <Text style={[styles.journalSub, { color: theme.textMuted }]}>Log what worked today</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </Animated.View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
    gap: Spacing.base,
  },
  greeting: { fontSize: Typography.sizes.sm, marginBottom: 4 },
  identityPhrase: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    lineHeight: 24,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: '#fff' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.extrabold },
  statLabel: { fontSize: Typography.sizes.xs, textAlign: 'center' },
  progressCard: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.base,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  progressPct: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.extrabold },
  allDoneText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    marginTop: Spacing.xs,
  },
  insightCard: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  insightIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.8,
    flex: 1,
  },
  insightLink: { fontSize: Typography.sizes.xs },
  insightMsg: { fontSize: Typography.sizes.sm, lineHeight: 20 },
  section: { paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.base },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  addBtnText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },
  emptyCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  emptyDesc: { fontSize: Typography.sizes.sm, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    marginTop: Spacing.xs,
  },
  emptyBtnText: { color: '#fff', fontWeight: Typography.weights.semibold },
  journalRow: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  journalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  journalSub: { fontSize: Typography.sizes.xs, marginTop: 2 },
})
