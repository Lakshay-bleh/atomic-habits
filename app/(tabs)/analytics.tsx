import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useAuthStore } from '@/stores/authStore'
import { useHabitsStore } from '@/stores/habitsStore'
import { useIdentityStore } from '@/stores/identityStore'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing, Radius } from '@/constants/themes'
import { habitsService } from '@/services/supabase/habits'
import { format, subDays } from 'date-fns'

const SCREEN_WIDTH = Dimensions.get('window').width

export default function AnalyticsScreen() {
  const theme = useTheme()
  const { user } = useAuthStore()
  const { habits, streaks, loadHabits, loadStreaks, getStreakForHabit } = useHabitsStore()
  const { identities } = useIdentityStore()
  const [heatmapData, setHeatmapData] = useState<Record<string, boolean>>({})
  const [weeklyCompletions, setWeeklyCompletions] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])

  useEffect(() => {
    if (user?.id) {
      loadHabits(user.id)
      loadStreaks(user.id)
      loadAnalytics(user.id)
    }
  }, [user?.id])

  const loadAnalytics = async (userId: string) => {
    try {
      const last30 = await habitsService.getLogsForDate(userId, format(new Date(), 'yyyy-MM-dd'))
      const heatmap: Record<string, boolean> = {}
      for (let i = 0; i < 30; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
        heatmap[date] = false
      }
      last30.forEach((log) => { heatmap[log.date] = true })
      setHeatmapData(heatmap)

      const weekly = [0, 0, 0, 0, 0, 0, 0]
      for (let day = 0; day < 7; day++) {
        const date = format(subDays(new Date(), day), 'yyyy-MM-dd')
        const logs = await habitsService.getLogsForDate(userId, date)
        weekly[6 - day] = logs.filter((l) => !l.skipped).length
      }
      setWeeklyCompletions(weekly)
    } catch {}
  }

  const avgConsistency = habits.length > 0
    ? habits.reduce((sum, h) => sum + (getStreakForHabit(h.id)?.consistency_rate ?? 0), 0) / habits.length
    : 0

  const totalCompletions = habits.reduce(
    (sum, h) => sum + (getStreakForHabit(h.id)?.total_completions ?? 0), 0,
  )

  const longestStreak = habits.reduce(
    (max, h) => Math.max(max, getStreakForHabit(h.id)?.longest_streak ?? 0), 0,
  )

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const maxCompletions = Math.max(...weeklyCompletions, 1)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your habit data tells the truth
          </Text>
        </View>

        {/* Overview stats */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <View style={styles.statsGrid}>
            {[
              { label: 'Total Completions', value: totalCompletions, color: theme.primary },
              { label: 'Avg Consistency', value: `${Math.round(avgConsistency)}%`, color: theme.accent },
              { label: 'Longest Streak', value: `${longestStreak}d`, color: '#F59E0B' },
              { label: 'Active Habits', value: habits.length, color: '#EC4899' },
            ].map((stat, idx) => (
              <Card key={idx} style={styles.statCard} variant="elevated">
                <Text style={[styles.statValue, { color: stat.color }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  {stat.label}
                </Text>
              </Card>
            ))}
          </View>
        </Animated.View>

        {/* Weekly bar chart */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Card style={styles.chartCard} variant="elevated">
            <Text style={[styles.chartTitle, { color: theme.text }]}>
              Weekly Completions
            </Text>
            <View style={styles.barChart}>
              {weeklyCompletions.map((count, idx) => (
                <View key={idx} style={styles.barWrapper}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: (count / maxCompletions) * 80,
                          backgroundColor: count > 0 ? theme.primary : theme.surfaceHigh,
                          borderRadius: Radius.sm,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: theme.textMuted }]}>
                    {DAYS[idx]}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* Habit consistency list */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Card style={styles.habitList} variant="elevated">
            <Text style={[styles.chartTitle, { color: theme.text }]}>
              Habit Consistency
            </Text>
            <View style={styles.habitRows}>
              {habits.slice(0, 8).map((habit) => {
                const streak = getStreakForHabit(habit.id)
                const consistency = streak?.consistency_rate ?? 0
                return (
                  <View key={habit.id} style={styles.habitRow}>
                    <Text style={styles.habitIcon}>{habit.icon ?? '✦'}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={styles.habitRowHeader}>
                        <Text
                          style={[styles.habitTitle, { color: theme.text }]}
                          numberOfLines={1}
                        >
                          {habit.title}
                        </Text>
                        <Text
                          style={[styles.habitPct, { color: theme.primary }]}
                        >
                          {Math.round(consistency)}%
                        </Text>
                      </View>
                      <ProgressBar progress={consistency / 100} height={4} />
                    </View>
                  </View>
                )
              })}
            </View>
          </Card>
        </Animated.View>

        {/* Compounding projection */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Card style={styles.compoundCard} variant="elevated">
            <Text style={[styles.chartTitle, { color: theme.text }]}>
              Compounding Power
            </Text>
            <Text style={[styles.compoundDesc, { color: theme.textSecondary }]}>
              Based on your current habits, in 365 days:
            </Text>
            {[
              { icon: '📚', text: 'Read 5 pages/day = 12 books/year' },
              { icon: '🏃', text: 'Walk 20 min/day = 2 marathon distances' },
              { icon: '🧠', text: 'Learn 15 min/day = 91 hours of growth' },
              { icon: '✍️', text: 'Write 200 words/day = 73,000 words' },
            ].map((item, idx) => (
              <View key={idx} style={styles.compoundRow}>
                <Text style={styles.compoundIcon}>{item.icon}</Text>
                <Text style={[styles.compoundText, { color: theme.text }]}>
                  {item.text}
                </Text>
              </View>
            ))}
          </Card>
        </Animated.View>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.extrabold,
    marginBottom: Spacing.xs,
  },
  subtitle: { fontSize: Typography.sizes.base },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  statCard: {
    width: (SCREEN_WIDTH - Spacing['2xl'] * 2 - Spacing.sm) / 2,
    alignItems: 'center',
    padding: Spacing.base,
  },
  statValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.extrabold,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    marginTop: 4,
    textAlign: 'center',
  },
  chartCard: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    gap: Spacing.base,
  },
  chartTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '70%',
  },
  bar: { width: '100%' },
  barLabel: { fontSize: Typography.sizes.xs },
  habitList: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    gap: Spacing.base,
  },
  habitRows: { gap: Spacing.md },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  habitIcon: { fontSize: 20, width: 28 },
  habitRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  habitTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    flex: 1,
  },
  habitPct: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  compoundCard: {
    marginHorizontal: Spacing['2xl'],
    gap: Spacing.sm,
  },
  compoundDesc: { fontSize: Typography.sizes.sm },
  compoundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  compoundIcon: { fontSize: 18 },
  compoundText: { fontSize: Typography.sizes.sm, flex: 1 },
})
