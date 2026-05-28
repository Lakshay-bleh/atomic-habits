import React, { useEffect } from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useTheme } from '@/hooks/useTheme'
import { Radius } from '@/constants/themes'

interface ProgressBarProps {
  progress: number   // 0-1
  height?: number
  color?: string
  backgroundColor?: string
  animated?: boolean
  style?: ViewStyle
}

export function ProgressBar({
  progress,
  height = 6,
  color,
  backgroundColor,
  animated = true,
  style,
}: ProgressBarProps) {
  const theme = useTheme()
  const width = useSharedValue(0)
  const clamped = Math.min(1, Math.max(0, progress))

  useEffect(() => {
    if (animated) {
      width.value = withSpring(clamped * 100, { damping: 20, stiffness: 90 })
    } else {
      width.value = withTiming(clamped * 100, { duration: 0 })
    }
  }, [clamped])

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }))

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: backgroundColor ?? theme.surfaceHigh,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: color ?? theme.primary,
          },
          animatedStyle,
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  fill: {},
})
