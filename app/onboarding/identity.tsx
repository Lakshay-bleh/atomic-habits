import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/hooks/useTheme'
import { useHaptics } from '@/hooks/useHaptics'
import { IDENTITY_TEMPLATES } from '@/constants/identities'
import { Typography, Spacing, Radius } from '@/constants/themes'
import type { IdentityTemplate } from '@/types'

export default function IdentitySelectionScreen() {
  const theme = useTheme()
  const haptics = useHaptics()
  const [selected, setSelected] = useState<IdentityTemplate[]>([])

  const templates = Object.entries(IDENTITY_TEMPLATES) as [
    IdentityTemplate,
    (typeof IDENTITY_TEMPLATES)[IdentityTemplate],
  ][]

  const toggle = (id: IdentityTemplate) => {
    haptics.light()
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  const proceed = () => {
    if (selected.length === 0) return
    router.push({
      pathname: '/onboarding/habits',
      params: { identities: selected.join(',') },
    })
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Who do you want to become?
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Choose 1-3 identities. Your habits will reinforce these every day.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {templates.map(([id, config], idx) => {
          const isSelected = selected.includes(id)
          return (
            <Animated.View
              key={id}
              entering={FadeInDown.delay(idx * 60).duration(500)}
              style={styles.gridItem}
            >
              <TouchableOpacity
                onPress={() => toggle(id)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    isSelected
                      ? [`${config.color}40`, `${config.color}20`]
                      : [theme.card, theme.card]
                  }
                  style={[
                    styles.identityCard,
                    {
                      borderColor: isSelected
                        ? config.color
                        : theme.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.checkmark,
                        { backgroundColor: config.color },
                      ]}
                    >
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                  <Text style={styles.identityIcon}>{config.icon}</Text>
                  <Text
                    style={[styles.identityLabel, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {config.label}
                  </Text>
                  <Text
                    style={[
                      styles.identityDesc,
                      { color: theme.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    {config.description}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )
        })}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Text style={[styles.footerHint, { color: theme.textMuted }]}>
          {selected.length} selected
        </Text>
        <Button
          title="Continue →"
          onPress={proceed}
          disabled={selected.length === 0}
          style={styles.continueButton}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.base,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.extrabold,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  gridItem: {
    width: '47%',
  },
  identityCard: {
    borderRadius: Radius.xl,
    padding: Spacing.base,
    minHeight: 120,
    gap: Spacing.xs,
  },
  checkmark: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: Typography.weights.bold,
  },
  identityIcon: { fontSize: 28 },
  identityLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
  identityDesc: {
    fontSize: Typography.sizes.xs,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    borderTopWidth: 1,
  },
  footerHint: {
    fontSize: Typography.sizes.sm,
  },
  continueButton: {
    minWidth: 140,
  },
})
