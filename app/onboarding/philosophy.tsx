import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing } from '@/constants/themes'

const PRINCIPLES = [
  {
    icon: '🧬',
    title: 'Identity First',
    desc: 'Every habit vote shapes who you are. You don\'t just do habits — you become them.',
  },
  {
    icon: '⚛️',
    title: 'Tiny Changes',
    desc: '1% better every day = 37x better in a year. Small consistent actions compound into transformation.',
  },
  {
    icon: '⚙️',
    title: 'Systems > Goals',
    desc: 'You don\'t rise to your goals. You fall to your systems. Build the system, trust the process.',
  },
  {
    icon: '🌍',
    title: 'Environment Design',
    desc: 'Make good habits obvious and easy. Make bad habits invisible and hard.',
  },
  {
    icon: '🔁',
    title: 'Never Miss Twice',
    desc: 'Missing once is an accident. Missing twice is the start of a new habit. Recover fast.',
  },
]

export default function PhilosophyScreen() {
  const theme = useTheme()

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Text style={[styles.title, { color: theme.text }]}>
            The Atomic Habits Philosophy
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Before we build your habits, understand the principles that make them work.
          </Text>
        </Animated.View>

        <View style={styles.principles}>
          {PRINCIPLES.map((p, idx) => (
            <Animated.View
              key={idx}
              entering={FadeInDown.delay(200 + idx * 100).duration(600)}
            >
              <Card style={styles.principleCard} variant="elevated">
                <Text style={styles.principleIcon}>{p.icon}</Text>
                <View style={styles.principleText}>
                  <Text style={[styles.principleTitle, { color: theme.text }]}>
                    {p.title}
                  </Text>
                  <Text style={[styles.principleDesc, { color: theme.textSecondary }]}>
                    {p.desc}
                  </Text>
                </View>
              </Card>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(800).duration(600)}>
          <Button
            title="I'm Ready →"
            onPress={() => router.push('/onboarding/identity')}
            fullWidth
            style={styles.button}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.extrabold,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    lineHeight: 24,
  },
  principles: { gap: Spacing.sm },
  principleCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  principleIcon: { fontSize: 28, marginTop: 2 },
  principleText: { flex: 1 },
  principleTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  principleDesc: {
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
  },
  button: {},
})
