import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/authStore'
import { useIdentityStore } from '@/stores/identityStore'
import { IdentityCard } from '@/components/identity/IdentityCard'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing } from '@/constants/themes'

export default function IdentityScreen() {
  const theme = useTheme()
  const { user } = useAuthStore()
  const { identities, primaryIdentity, aiSummary, loadIdentities, loadAISummary } = useIdentityStore()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadIdentities(user.id).then(() => loadAISummary())
    }
  }, [user?.id])

  const onRefresh = async () => {
    setRefreshing(true)
    if (user?.id) await loadIdentities(user.id)
    await loadAISummary()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Identity Engine</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Every completed habit is a vote for who you're becoming
          </Text>
        </View>

        {/* AI Identity Summary */}
        {aiSummary && (
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <Card style={styles.summaryCard} variant="elevated">
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryIcon}>✨</Text>
                <Text style={[styles.summaryLabel, { color: theme.primary }]}>
                  AI Insight
                </Text>
              </View>
              <Text style={[styles.summaryText, { color: theme.text }]}>
                {aiSummary}
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Primary Identity Stats */}
        {primaryIdentity && (
          <Animated.View entering={FadeInDown.delay(150).duration(600)}>
            <View style={styles.statsRow}>
              <Card style={[styles.statCard, { flex: 1 }]} variant="elevated">
                <Text style={[styles.statValue, { color: theme.primary }]}>
                  {primaryIdentity.score}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Identity Score
                </Text>
              </Card>
              <Card style={[styles.statCard, { flex: 1 }]} variant="elevated">
                <Text style={[styles.statValue, { color: theme.accent }]}>
                  {primaryIdentity.streak}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Day Streak
                </Text>
              </Card>
              <Card style={[styles.statCard, { flex: 1 }]} variant="elevated">
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                  {primaryIdentity.confidence}%
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Confidence
                </Text>
              </Card>
            </View>
          </Animated.View>
        )}

        {/* Identity Cards */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Your Identities
          </Text>

          {identities.length === 0 ? (
            <Card style={styles.emptyCard} variant="elevated">
              <Text style={styles.emptyIcon}>🧬</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No identities yet
              </Text>
              <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                Complete onboarding to define who you want to become
              </Text>
            </Card>
          ) : (
            identities.map((identity, idx) => (
              <Animated.View
                key={identity.id}
                entering={FadeInDown.delay(200 + idx * 80).duration(500)}
              >
                <IdentityCard
                  identity={identity}
                  isPrimary={identity.id === primaryIdentity?.id}
                />
              </Animated.View>
            ))
          )}
        </View>

        {/* Affirmation */}
        {primaryIdentity && (
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <Card style={styles.affirmationCard} variant="glass">
              <Text style={[styles.affirmationText, { color: theme.text }]}>
                "You are becoming a{' '}
                <Text style={{ color: primaryIdentity.color, fontWeight: Typography.weights.bold }}>
                  {primaryIdentity.label.toLowerCase()}
                </Text>
                . Every habit you complete today is proof."
              </Text>
            </Card>
          </Animated.View>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.extrabold,
    marginBottom: Spacing.xs,
  },
  subtitle: { fontSize: Typography.sizes.base },
  summaryCard: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  summaryIcon: { fontSize: 16 },
  summaryLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  summaryText: {
    fontSize: Typography.sizes.base,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  statCard: { alignItems: 'center', padding: Spacing.base },
  statValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.extrabold,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    marginTop: 4,
    textAlign: 'center',
  },
  section: { paddingHorizontal: Spacing['2xl'] },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.base,
  },
  emptyCard: { alignItems: 'center', padding: Spacing['2xl'], gap: Spacing.sm },
  emptyIcon: { fontSize: 40 },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  emptyDesc: { fontSize: Typography.sizes.sm, textAlign: 'center' },
  affirmationCard: {
    marginHorizontal: Spacing['2xl'],
    marginTop: Spacing.base,
    marginBottom: Spacing.base,
  },
  affirmationText: {
    fontSize: Typography.sizes.base,
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
})
