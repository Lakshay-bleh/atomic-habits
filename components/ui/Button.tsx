import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { useTheme } from '@/hooks/useTheme'
import { useHaptics } from '@/hooks/useHaptics'
import { Typography, Radius, Spacing } from '@/constants/themes'

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: Variant
  size?: Size
  isLoading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  style?: ViewStyle
  textStyle?: TextStyle
  fullWidth?: boolean
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const theme = useTheme()
  const haptics = useHaptics()
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePress = () => {
    if (disabled || isLoading) return
    haptics.light()
    scale.value = withSpring(0.96, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 })
    })
    onPress()
  }

  const variantStyles = {
    primary: { bg: theme.primary, text: '#FFFFFF' },
    secondary: { bg: theme.surfaceHigh, text: theme.text },
    ghost: { bg: 'transparent', text: theme.primary },
    danger: { bg: theme.error, text: '#FFFFFF' },
    success: { bg: theme.success, text: '#FFFFFF' },
  }

  const sizeStyles = {
    sm: { padding: Spacing.sm, fontSize: Typography.sizes.sm, height: 36 },
    md: { padding: Spacing.base, fontSize: Typography.sizes.base, height: 48 },
    lg: { padding: Spacing.lg, fontSize: Typography.sizes.md, height: 56 },
  }

  const v = variantStyles[variant]
  const s = sizeStyles[size]
  const isDisabled = disabled || isLoading

  return (
    <AnimatedTouchable
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          height: s.height,
          paddingHorizontal: s.padding,
          borderRadius: Radius.lg,
          opacity: isDisabled ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: variant === 'ghost' ? theme.primary : undefined,
        },
        animatedStyle,
        style,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.9}
    >
      {isLoading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              {
                color: v.text,
                fontSize: s.fontSize,
                marginLeft: icon ? Spacing.xs : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </AnimatedTouchable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: Typography.weights.semibold,
    letterSpacing: 0.2,
  },
})
