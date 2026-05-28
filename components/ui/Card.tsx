import React from 'react'
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native'
import { BlurView } from 'expo-blur'
import { useTheme } from '@/hooks/useTheme'
import { Radius, Spacing, Shadows } from '@/constants/themes'

interface CardProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  variant?: 'default' | 'glass' | 'elevated'
  padding?: number
}

export function Card({
  children,
  style,
  variant = 'default',
  padding = Spacing.base,
}: CardProps) {
  const theme = useTheme()

  if (variant === 'glass') {
    return (
      <BlurView
        intensity={20}
        tint="dark"
        style={[
          styles.card,
          {
            borderColor: theme.border,
            borderWidth: 1,
            padding,
          },
          style,
        ]}
      >
        {children}
      </BlurView>
    )
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: variant === 'elevated' ? theme.surfaceElevated : theme.card,
          borderColor: theme.border,
          padding,
          ...(variant === 'elevated' ? Shadows.md : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
})
