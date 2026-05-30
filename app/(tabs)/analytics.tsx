import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/authStore'
import { useHabitsStore } from '@/stores/habitsStore'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing, Radius } from '@/constants/themes'
import { habitsService } from '@/services/supabase/habits'
import { format, subDays } from 'date-fns'
import type { HabitLog } from '@/types'

const SCREEN_WIDTH = Dimensions.get('window').width
const DAYS_BACK = 30

interface HabitStats {
  habitId: string
  title: string
  icon: string | null
  completions: number
  consistencyRate: number
  currentStreak: number
}

interface AnalyticsData {
  weeklyCompletions: number[]           // last 7 days oldest→newest
  weeklyLabels: string[]
  totalCompletions: number
  activeDays: number
  avgPerDay: number
  habitStats: HabitStats[]
  longestStreak: number
  currentStreak: number
}

export default function AnalyticsScreen() {
  const theme = useTheme()
  const { user } = useAuthStore()
  const { habits, todayLogs, loadHabits, loadStreaks, getStreakForHabit } = useHabitsStore()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  const computeAnalytics = useCallback(async (userId: string) => {
    if (habits.length === 0) {
      setData(null)
      setLoading(false)
      return
    }

    try {
      const endDate = format(new Date(), 'yyyy-MM-dd')
      const startDate = format(subDays(new Date(), DAYS_BACK - 1), 'yyyy-MM-dd')

      const allLogs: HabitLog[] = await habitsService.getLogsForDateRange(userId, startDate, endDate)

      // Build date -> logs map
      const logsByDate: Record<string, HabitLog[]> = {}
      const logsByHabit: Record<string, HabitLog[]> = {}

      for (const log of allLogs) {
        if (!logsByDate[log.date]) logsByDate[log.date] = []
        logsByDate[log.date].push(log)

        if (!logsByHabit[log.habit_id]) logsByHabit[log.habit_id] = []
        logsByHabit[log.habit_id].push(log)
      }

      // Weekly (last 7 days): index 0 = oldest (6 days ago), index 6 = today
      const weeklyCompletions: number[] = []
      const weeklyLabels: string[] = []
      for (let i = 6; i >= 0; i--) {
        const d = subDays(new Date(), i)
        const dateStr = format(d, 'yyyy-MM-dd')
        weeklyCompletions.push(logsByDate[dateStr]?.length ?? 0)
        weeklyLabels.push(format(d, 'EEE'))
      }

      // Total completions and active days
      const totalCompletions = allLogs.length
      const activeDays = Object.values(logsByDate).filter((logs) => logs.length > 0).length
      const avgPerDay = activeDays > 0 ? totalCompletions / DAYS_BACK : 0

      // Per-habit stats
      const habitStatsFixed: HabitStats[] = habits.map((habit) => {
        const logs = logsByHabit[habit.id] ?? []
        const completions = logs.length
        const consistencyRate = Math.round((completions / DAYS_BACK) * 100)
        const streakData = getStreakForHabit(habit.id)
        return {
          habitId: habit.id,
          title: habit.title,
          icon: habit.icon,
          completions,
          consistencyRate,
          currentStreak: streakData?.current_streak ?? 0,
        }
      }).sort((a, b) => b.consistencyRate - a.consistencyRate)

      const longestStreak = Math.max(0, ...habits.map((h) => getStreakForHabit(h.id)?.longest_streak ?? 0))
      const currentStreak = Math.max(0, ...habits.map((h) => getStreakForHabit(h.id)?.current_streak ?? 0))

      setData({
        weeklyCompletions,
        weeklyLabels,
        totalCompletions,
        activeDays,
        avgPerDay,
        habitStats: habitStatsFixed.sort((a, b) => b.consistencyRate - a.consistencyRate),
        longestStreak,
        currentStreak,
      })
    } catch {
      // silently ignore fetch errors
    } finally {
      setLoading(false)
    }
  }, [habits, getStreakForHabit])

  const load = useCallback(async () => {
    if (!user?.id) return
    await Promise.all([loadHabits(user.id), loadStreaks(user.id)])
  }, [user?.id])

  useEffect(() => {
    load()
  }, [user?.id])

  useEffect(() => {
    if (user?.id && habits.length > 0) {
      computeAnalytics(user.id)
    } else if (habits.length === 0) {
      setData(null)
      setLoading(false)
    }
  }, [user?.id, habits.length, todayLogs.length])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const maxWeekly = data ? Math.max(...data.weeklyCompletions, 1) : 1

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Last {DAYS_BACK} days
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading your data...</Text>
          </View>
        ) : !data || habits.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="bar-chart-outline" size={40} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No data yet</Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              Add habits and complete them to see your analytics here.
            </Text>
          </View>
        ) : (
          <>
            {/* Overview stats */}
            <Animated.View entering={FadeInDown.delay(100).duration(600)}>
              <View style={styles.statsGrid}>
                {[
                  { label: 'Total', value: data.totalCompletions, icon: 'checkmark-circle', color: theme.primary },
                  { label: 'Active Days', value: data.activeDays, icon: 'calendar', color: theme.accent },
                  { label: 'Best Streak', value: `${data.longestStreak}d`, icon: 'flame', color: '#F59E0B' },
                  { label: 'Avg / Day', value: data.avgPerDay.toFixed(1), icon: 'trending-up', color: '#EC4899' },
                ].map((stat, idx) => (
                  <Card key={idx} style={styles.statCard} variant="elevated">
                    <Ionicons name={stat.icon as any} size={18} color={stat.color} />
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
                  Last 7 Days
                </Text>
                <View style={styles.barChart}>
                  {data.weeklyCompletions.map((count, idx) => (
                    <View key={idx} style={styles.barWrapper}>
                      <Text style={[styles.barCount, { color: count > 0 ? theme.primary : theme.textMuted }]}>
                        {count > 0 ? count : ''}
                      </Text>
                      <View style={styles.barContainer}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: Math.max(4, (count / maxWeekly) * 80),
                              backgroundColor: count > 0 ? theme.primary : theme.surfaceHigh,
                              borderRadius: Radius.sm,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barLabel, { color: theme.textMuted }]}>
                        {data.weeklyLabels[idx]}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            </Animated.View>

            {/* Per-habit consistency */}
            <Animated.View entering={FadeInDown.delay(350).duration(600)}>
              <Card style={styles.habitList} variant="elevated">
                <Text style={[styles.chartTitle, { color: theme.text }]}>
                  Habit Performance
                </Text>
                <View style={styles.habitRows}>
                  {data.habitStats.slice(0, 10).map((stat) => (
                    <View key={stat.habitId} style={styles.habitRow}>
                      <Text style={styles.habitIcon}>{stat.icon ?? '·'}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={styles.habitRowHeader}>
                          <Text
                            style={[styles.habitTitle, { color: theme.text }]}
                            numberOfLines={1}
                          >
                            {stat.title}
                          </Text>
                          <Text style={[styles.habitPct, { color: stat.consistencyRate >= 70 ? theme.primary : stat.consistencyRate >= 40 ? '#F59E0B' : '#EF4444' }]}>
                            {stat.consistencyRate}%
                          </Text>
                        </View>
                        <ProgressBar progress={stat.consistencyRate / 100} height={4} />
                        <Text style={[styles.habitMeta, { color: theme.textMuted }]}>
                          {stat.completions} completions · streak {stat.currentStreak}d
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Card>
            </Animated.View>

            {/* Best and needs work */}
            {data.habitStats.length >= 2 && (
              <Animated.View entering={FadeInDown.delay(400).duration(600)}>
                <View style={styles.insightRow}>
                  <Card style={[styles.insightCard, { flex: 1 }]} variant="elevated">
                    <View style={styles.insightIcon}>
                      <Ionicons name="trophy" size={16} color="#F59E0B" />
                    </View>
                    <Text style={[styles.insightCardTitle, { color: theme.textSecondary }]}>
                      Strongest
                    </Text>
                    <Text style={[styles.insightCardValue, { color: theme.text }]} numberOfLines={2}>
                      {data.habitStats[0].title}
                    </Text>
                    <Text style={[styles.insightCardStat, { color: theme.primary }]}>
                      {data.habitStats[0].consistencyRate}% consistent
                    </Text>
                  </Card>
                  <Card style={[styles.insightCard, { flex: 1 }]} variant="elevated">
                    <View style={styles.insightIcon}>
                      <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    </View>
                    <Text style={[styles.insightCardTitle, { color: theme.textSecondary }]}>
                      Needs Work
                    </Text>
                    <Text style={[styles.insightCardValue, { color: theme.text }]} numberOfLines={2}>
                      {data.habitStats[data.habitStats.length - 1].title}
                    </Text>
                    <Text style={[styles.insightCardStat, { color: '#EF4444' }]}>
                      {data.habitStats[data.habitStats.length - 1].consistencyRate}% consistent
                    </Text>
                  </Card>
                </View>
              </Animated.View>
            )}
          </>
        )}

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
  subtitle: { fontSize: Typography.sizes.sm },
  loadingWrap: { padding: Spacing['2xl'], alignItems: 'center' },
  loadingText: { fontSize: Typography.sizes.sm },
  emptyWrap: {
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.base,
    marginTop: Spacing['2xl'],
  },
  emptyTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  emptyDesc: { fontSize: Typography.sizes.sm, textAlign: 'center', lineHeight: 20 },
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
    gap: 4,
  },
  statValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.extrabold,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
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
    height: 110,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  barCount: {
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    height: 12,
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
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  habitIcon: { fontSize: 18, width: 26, paddingTop: 2 },
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
  habitMeta: {
    fontSize: Typography.sizes.xs,
    marginTop: 3,
  },
  insightRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  insightCard: {
    gap: Spacing.xs,
    padding: Spacing.base,
  },
  insightIcon: { marginBottom: 2 },
  insightCardTitle: { fontSize: Typography.sizes.xs },
  insightCardValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    lineHeight: 18,
  },
  insightCardStat: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
})
