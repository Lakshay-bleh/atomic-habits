import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing, Radius } from '@/constants/themes'
import type { Identity } from '@/types'

interface IdentityCardProps {
  identity: Identity
  isPrimary?: boolean
  onPress?: () => void
}

export function IdentityCard({
  identity,
  isPrimary = false,
  onPress,
}: IdentityCardProps) {
  const theme = useTheme()

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.wrapper}
    >
      <LinearGradient
        colors={[`${identity.color}30`, `${identity.color}08`]}
        style={[
          styles.card,
          {
            borderColor: isPrimary
              ? `${identity.color}60`
              : theme.border,
            borderWidth: isPrimary ? 1.5 : 1,
          },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {isPrimary && (
          <View
            style={[
              styles.primaryBadge,
              { backgroundColor: identity.color },
            ]}
          >
            <Text style={styles.primaryText}>PRIMARY</Text>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.icon}>{identity.icon}</Text>
          <View style={styles.headerText}>
            <Text
              style={[styles.label, { color: theme.text }]}
              numberOfLines={1}
            >
              {identity.label}
            </Text>
            <View style={styles.streakRow}>
              {identity.streak > 0 && (
                <Ionicons name="flame" size={12} color="#F59E0B" />
              )}
              <Text style={[styles.streak, { color: theme.textSecondary }]}>
                {identity.streak > 0
                  ? `${identity.streak} day streak`
                  : 'Start your streak today'}
              </Text>
            </View>
          </View>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreValue, { color: identity.color }]}>
              {identity.score}
            </Text>
            <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>
              score
            </Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Confidence
            </Text>
            <Text style={[styles.statValue, { color: identity.color }]}>
              {identity.confidence}%
            </Text>
          </View>
          <ProgressBar
            progress={identity.confidence / 100}
            color={identity.color}
            height={4}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.reinforcements, { color: theme.textMuted }]}>
            {identity.total_reinforcements} total reinforcements
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.sm,
  },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  primaryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  primaryText: {
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    color: '#fff',
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 32,
  },
  headerText: {
    flex: 1,
  },
  label: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  streak: {
    fontSize: Typography.sizes.sm,
  },
  scoreCircle: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
  },
  scoreLabel: {
    fontSize: Typography.sizes.xs,
    marginTop: -2,
  },
  stats: {
    gap: Spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: Typography.sizes.sm,
  },
  statValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  footer: {},
  reinforcements: {
    fontSize: Typography.sizes.xs,
  },
})
