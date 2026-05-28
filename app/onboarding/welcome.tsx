import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing } from '@/constants/themes'

export default function WelcomeScreen() {
  const theme = useTheme()

  return (
    <LinearGradient
      colors={[theme.background, '#0D0D1F']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(200).duration(800)}>
            <Text style={styles.bigEmoji}>⚡</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(800)}
            style={styles.textGroup}
          >
            <Text style={[styles.title, { color: theme.text }]}>
              Atomic Habits
            </Text>
            <Text style={[styles.subtitle, { color: theme.primary }]}>
              Identity Transformation
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(600).duration(800)}
            style={styles.descGroup}
          >
            <Text style={[styles.desc, { color: theme.textSecondary }]}>
              You don't rise to the level of your goals.
            </Text>
            <Text style={[styles.desc, { color: theme.textSecondary }]}>
              You fall to the level of your systems.
            </Text>
            <Text
              style={[
                styles.author,
                { color: theme.textMuted, marginTop: Spacing.sm },
              ]}
            >
              — James Clear
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(800).duration(800)}
            style={styles.buttonGroup}
          >
            <Button
              title="Begin Your Transformation"
              onPress={() => router.push('/onboarding/philosophy')}
              fullWidth
            />
            <Button
              title="I already have an account"
              variant="ghost"
              onPress={() => router.replace('/(auth)/login')}
              fullWidth
              style={{ marginTop: Spacing.sm }}
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing['2xl'],
    justifyContent: 'center',
    gap: Spacing['2xl'],
  },
  bigEmoji: {
    fontSize: 64,
    textAlign: 'center',
  },
  textGroup: { alignItems: 'center' },
  title: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.weights.extrabold,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    marginTop: Spacing.xs,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  descGroup: { alignItems: 'center' },
  desc: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
    lineHeight: 28,
    fontStyle: 'italic',
  },
  author: {
    fontSize: Typography.sizes.sm,
  },
  buttonGroup: {},
})
