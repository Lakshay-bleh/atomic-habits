import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '@/hooks/useTheme'
import { useHaptics } from '@/hooks/useHaptics'
import { Badge } from '@/components/ui/Badge'
import { Typography, Spacing, Radius } from '@/constants/themes'
import { HABIT_CATEGORIES } from '@/constants/identities'
import type { Habit, HabitStreak } from '@/types'

interface HabitCardProps {
  habit: Habit
  isCompleted: boolean
  streak: HabitStreak | null
  onComplete: () => void
  onPress: () => void
}

export function HabitCard({
  habit,
  isCompleted,
  streak,
  onComplete,
  onPress,
}: HabitCardProps) {
  const theme = useTheme()
  const haptics = useHaptics()
  const checkScale = useSharedValue(1)
  const cardScale = useSharedValue(1)

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }))

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }))

  const handleComplete = () => {
    if (isCompleted) return
    haptics.success()
    checkScale.value = withSequence(
      withSpring(1.4, { damping: 8 }),
      withSpring(1, { damping: 12 }),
    )
    cardScale.value = withSequence(
      withSpring(0.97, { damping: 15 }),
      withSpring(1, { damping: 12 }),
    )
    onComplete()
  }

  const category = HABIT_CATEGORIES.find((c) => c.id === habit.category)
  const color = habit.color ?? category?.color ?? theme.primary
  const currentStreak = streak?.current_streak ?? 0

  return (
    <Animated.View style={[styles.wrapper, cardStyle]}>
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: isCompleted
              ? `${color}18`
              : theme.card,
            borderColor: isCompleted ? `${color}40` : theme.border,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Left accent bar */}
        <View
          style={[styles.accent, { backgroundColor: color }]}
        />

        <View style={styles.content}>
          {/* Header row */}
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <Text style={[styles.icon]}>{habit.icon ?? category?.icon ?? '✦'}</Text>
              <View>
                <Text
                  style={[
                    styles.title,
                    {
                      color: isCompleted ? theme.textSecondary : theme.text,
                      textDecorationLine: isCompleted ? 'line-through' : 'none',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {habit.title}
                </Text>
                {habit.tiny_version && (
                  <Text
                    style={[styles.tiny, { color: theme.textMuted }]}
                    numberOfLines={1}
                  >
                    Tiny: {habit.tiny_version}
                  </Text>
                )}
              </View>
            </View>

            {/* Complete button */}
            <Animated.View style={checkStyle}>
              <TouchableOpacity
                onPress={handleComplete}
                style={[
                  styles.checkButton,
                  {
                    backgroundColor: isCompleted ? color : theme.surfaceHigh,
                    borderColor: isCompleted ? color : theme.border,
                  },
                ]}
              >
                <Ionicons
                  name={isCompleted ? 'checkmark' : 'checkmark'}
                  size={18}
                  color={isCompleted ? '#fff' : theme.textMuted}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Footer row */}
          <View style={styles.footerRow}>
            {currentStreak > 0 && (
              <Badge
                label={`${currentStreak}d streak`}
                color={color}
                emoji="🔥"
                size="sm"
              />
            )}
            {habit.friction_score <= 3 && (
              <Badge label="Low friction" color="#10B981" size="sm" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.sm,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accent: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    marginRight: Spacing.sm,
  },
  icon: {
    fontSize: 22,
  },
  title: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  tiny: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
})
