import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing, Radius } from '@/constants/themes'

interface BadgeProps {
  label: string
  color?: string
  size?: 'sm' | 'md'
  emoji?: string
}

export function Badge({ label, color, size = 'md', emoji }: BadgeProps) {
  const theme = useTheme()
  const bg = color ? `${color}22` : `${theme.primary}22`
  const textColor = color ?? theme.primary

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingHorizontal: size === 'sm' ? Spacing.xs : Spacing.sm,
          paddingVertical: size === 'sm' ? 2 : 4,
          borderColor: `${textColor}40`,
        },
      ]}
    >
      {emoji && (
        <Text style={[styles.emoji, { fontSize: size === 'sm' ? 10 : 12 }]}>
          {emoji}
        </Text>
      )}
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: size === 'sm' ? Typography.sizes.xs : Typography.sizes.sm,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 4,
  },
  emoji: {},
  text: {
    fontWeight: Typography.weights.semibold,
    letterSpacing: 0.2,
  },
})
