import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/authStore'
import { useHabitsStore } from '@/stores/habitsStore'
import { HabitCard } from '@/components/habits/HabitCard'
import { Badge } from '@/components/ui/Badge'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing, Radius } from '@/constants/themes'
import { HABIT_CATEGORIES } from '@/constants/identities'
import type { HabitCategory } from '@/types'

export default function HabitsScreen() {
  const theme = useTheme()
  const { user } = useAuthStore()
  const { habits, loadHabits, loadTodayLogs, loadStreaks, completeHabit, uncompleteHabit, isCompletedToday, getStreakForHabit } = useHabitsStore()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'all'>('all')

  useEffect(() => {
    if (user?.id) {
      loadHabits(user.id)
      loadTodayLogs(user.id)
      loadStreaks(user.id)
    }
  }, [user?.id])

  const filtered = habits.filter((h) => {
    const matchesSearch = h.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || h.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>All Habits</Text>
        <TouchableOpacity onPress={() => router.push('/habit/create')}>
          <View style={[styles.addButton, { backgroundColor: theme.primary }]}>
            <Ionicons name="add" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Ionicons name="search" size={16} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search habits..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        <TouchableOpacity onPress={() => setSelectedCategory('all')}>
          <Badge
            label="All"
            color={selectedCategory === 'all' ? theme.primary : undefined}
            size="md"
          />
        </TouchableOpacity>
        {HABIT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => setSelectedCategory(cat.id as HabitCategory)}
          >
            <Badge
              label={cat.label}
              emoji={cat.emoji}
              color={
                selectedCategory === cat.id ? cat.color : undefined
              }
              size="md"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Habits list */}
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name={habits.length === 0 ? 'leaf-outline' : 'search-outline'}
              size={40}
              color={theme.textMuted}
            />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {habits.length === 0 ? 'No habits yet' : 'No matches'}
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              {habits.length === 0
                ? 'Create your first tiny habit'
                : 'Try a different search or category'}
            </Text>
          </View>
        ) : (
          filtered.map((habit, idx) => (
            <Animated.View
              key={habit.id}
              entering={FadeInDown.delay(idx * 50).duration(400)}
            >
              <HabitCard
                habit={habit}
                isCompleted={isCompletedToday(habit.id)}
                streak={getStreakForHabit(habit.id)}
                onComplete={() => completeHabit(habit.id, user?.id ?? '')}
                onPress={() => router.push(`/habit/${habit.id}` as never)}
                onUncomplete={() => user?.id && uncompleteHabit(habit.id, user.id)}
              />
            </Animated.View>
          ))
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.extrabold,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing['2xl'],
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    height: 44,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: Typography.sizes.base },
  categories: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.base,
    gap: Spacing.xs,
  },
  list: {
    paddingHorizontal: Spacing['2xl'],
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing['4xl'],
    gap: Spacing.sm,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  emptyDesc: { fontSize: Typography.sizes.sm },
})
