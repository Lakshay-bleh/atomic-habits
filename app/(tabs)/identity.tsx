import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/authStore'
import { useIdentityStore } from '@/stores/identityStore'
import { useHabitsStore } from '@/stores/habitsStore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing, Radius } from '@/constants/themes'
import { IDENTITY_TEMPLATES } from '@/constants/identities'
import type { IdentityTemplate } from '@/types'

const TEMPLATES = Object.entries(IDENTITY_TEMPLATES) as [IdentityTemplate, typeof IDENTITY_TEMPLATES[IdentityTemplate]][]

export default function IdentityScreen() {
  const theme = useTheme()
  const { user } = useAuthStore()
  const {
    identities,
    primaryIdentity,
    primaryIdentityId,
    aiSummary,
    aiSummaryLoading,
    loadIdentities,
    createIdentity,
    deleteIdentity,
    setPrimaryIdentity,
    loadAISummary,
  } = useIdentityStore()
  const { habits } = useHabitsStore()

  const [refreshing, setRefreshing] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [addingTemplate, setAddingTemplate] = useState<IdentityTemplate | null>(null)

  const habitTitles = habits.slice(0, 8).map((h) => h.title)

  const load = useCallback(async () => {
    if (!user?.id) return
    await loadIdentities(user.id)
  }, [user?.id])

  useEffect(() => {
    load()
  }, [user?.id])

  useEffect(() => {
    if (primaryIdentity) {
      loadAISummary(habitTitles)
    }
  }, [primaryIdentity?.id, habits.length])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    await loadAISummary(habitTitles)
    setRefreshing(false)
  }

  const handleAddIdentity = async (templateKey: IdentityTemplate) => {
    if (!user?.id) return
    const template = IDENTITY_TEMPLATES[templateKey]
    const alreadyExists = identities.some((i) => i.label === template.label)
    if (alreadyExists) {
      Alert.alert('Already Added', `You already have "${template.label}" as an identity.`)
      return
    }
    setAddingTemplate(templateKey)
    try {
      await createIdentity({
        user_id: user.id,
        label: template.label,
        description: template.description,
        color: template.color,
        icon: template.icon,
        score: 0,
        confidence: 0,
        streak: 0,
        longest_streak: 0,
        total_reinforcements: 0,
      })
      setShowTemplates(false)
    } catch {
      Alert.alert('Error', 'Failed to add identity')
    } finally {
      setAddingTemplate(null)
    }
  }

  const handleDelete = (id: string, label: string) => {
    Alert.alert(
      'Remove Identity',
      `Remove "${label}" from your identities? Your habits linked to it won't be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteIdentity(id)
            } catch {
              Alert.alert('Error', 'Failed to remove identity')
            }
          },
        },
      ],
    )
  }

  const handleSetPrimary = (id: string) => {
    if (id === primaryIdentityId) return
    setPrimaryIdentity(id)
  }

  const linkedHabitsCount = (identityId: string) =>
    habits.filter((h) => h.identity_id === identityId).length

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Identity Engine</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Every habit is a vote for who you're becoming
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={() => setShowTemplates(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Primary identity featured */}
        {primaryIdentity ? (
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <LinearGradient
              colors={[`${primaryIdentity.color}35`, `${primaryIdentity.color}10`]}
              style={[styles.primaryCard, { borderColor: `${primaryIdentity.color}50` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.primaryHeader}>
                <View style={[styles.primaryBadge, { backgroundColor: primaryIdentity.color }]}>
                  <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                </View>
                <TouchableOpacity onPress={() => loadAISummary(habitTitles)}>
                  <Ionicons
                    name={aiSummaryLoading ? 'sync' : 'sparkles-outline'}
                    size={18}
                    color={primaryIdentity.color}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.primaryIdentityRow}>
                <Text style={styles.primaryIcon}>{primaryIdentity.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.primaryLabel, { color: theme.text }]}>
                    {primaryIdentity.label}
                  </Text>
                  {primaryIdentity.description && (
                    <Text style={[styles.primaryDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                      {primaryIdentity.description}
                    </Text>
                  )}
                </View>
                <View style={styles.scoreCircle}>
                  <Text style={[styles.scoreValue, { color: primaryIdentity.color }]}>
                    {primaryIdentity.score}
                  </Text>
                  <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>score</Text>
                </View>
              </View>

              <View style={styles.primaryStats}>
                {[
                  { label: 'Streak', value: `${primaryIdentity.streak}d`, color: '#F59E0B' },
                  { label: 'Votes', value: primaryIdentity.total_reinforcements, color: primaryIdentity.color },
                  { label: 'Confidence', value: `${primaryIdentity.confidence}%`, color: theme.accent },
                  { label: 'Habits', value: linkedHabitsCount(primaryIdentity.id), color: theme.primary },
                ].map((stat) => (
                  <View key={stat.label} style={styles.primaryStat}>
                    <Text style={[styles.primaryStatValue, { color: stat.color }]}>{stat.value}</Text>
                    <Text style={[styles.primaryStatLabel, { color: theme.textMuted }]}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.confidenceSection}>
                <Text style={[styles.confidenceLabel, { color: theme.textSecondary }]}>
                  Confidence Level
                </Text>
                <ProgressBar
                  progress={primaryIdentity.confidence / 100}
                  color={primaryIdentity.color}
                  height={6}
                  style={{ marginTop: 6 }}
                />
              </View>
            </LinearGradient>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <TouchableOpacity
              style={[styles.emptyPrimary, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setShowTemplates(true)}
            >
              <Ionicons name="add-circle-outline" size={32} color={theme.textMuted} />
              <Text style={[styles.emptyPrimaryTitle, { color: theme.text }]}>Add Your First Identity</Text>
              <Text style={[styles.emptyPrimaryDesc, { color: theme.textSecondary }]}>
                Choose who you want to become. Every habit you complete will be a vote for that person.
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* AI Insight */}
        {aiSummary && (
          <Animated.View entering={FadeInDown.delay(150).duration(600)}>
            <Card style={styles.summaryCard} variant="elevated">
              <View style={styles.summaryHeader}>
                <View style={[styles.summaryIconWrap, { backgroundColor: `${theme.primary}20` }]}>
                  <Ionicons name="sparkles" size={14} color={theme.primary} />
                </View>
                <Text style={[styles.summaryLabel, { color: theme.primary }]}>AI INSIGHT</Text>
              </View>
              <Text style={[styles.summaryText, { color: theme.text }]}>{aiSummary}</Text>
            </Card>
          </Animated.View>
        )}

        {/* All identities */}
        {identities.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>All Identities</Text>
            {identities.map((identity, idx) => {
              const isPrimary = identity.id === (primaryIdentityId ?? identities[0]?.id)
              const linkedCount = linkedHabitsCount(identity.id)
              return (
                <Animated.View
                  key={identity.id}
                  entering={FadeInDown.delay(200 + idx * 60).duration(500)}
                >
                  <LinearGradient
                    colors={[`${identity.color}20`, `${identity.color}06`]}
                    style={[
                      styles.identityRow,
                      {
                        borderColor: isPrimary ? `${identity.color}50` : theme.border,
                        borderWidth: isPrimary ? 1.5 : 1,
                      },
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.identityIcon}>{identity.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={styles.identityLabelRow}>
                        <Text style={[styles.identityLabel, { color: theme.text }]}>
                          {identity.label}
                        </Text>
                        {isPrimary && (
                          <View style={[styles.primaryPill, { backgroundColor: identity.color }]}>
                            <Text style={styles.primaryPillText}>PRIMARY</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.identityMeta, { color: theme.textMuted }]}>
                        {identity.total_reinforcements} votes · {linkedCount} habit{linkedCount !== 1 ? 's' : ''} · {identity.streak}d streak
                      </Text>
                      <ProgressBar
                        progress={identity.confidence / 100}
                        color={identity.color}
                        height={3}
                        style={{ marginTop: 6 }}
                      />
                    </View>
                    <View style={styles.identityActions}>
                      {!isPrimary && (
                        <TouchableOpacity
                          onPress={() => handleSetPrimary(identity.id)}
                          style={[styles.actionBtn, { backgroundColor: `${identity.color}15` }]}
                        >
                          <Ionicons name="star-outline" size={15} color={identity.color} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => handleDelete(identity.id, identity.label)}
                        style={[styles.actionBtn, { backgroundColor: `${theme.error}15` }]}
                      >
                        <Ionicons name="trash-outline" size={15} color={theme.error} />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </Animated.View>
              )
            })}
          </View>
        )}

        {/* Suggested habits for primary identity */}
        {primaryIdentity && (() => {
          const templateEntry = TEMPLATES.find(([, t]) => t.label === primaryIdentity.label)
          if (!templateEntry) return null
          const suggested = templateEntry[1].suggestedHabits
          return (
            <Animated.View entering={FadeInDown.delay(400).duration(600)}>
              <Card style={styles.suggestedCard} variant="elevated">
                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
                  Suggested Habits
                </Text>
                <Text style={[styles.suggestedDesc, { color: theme.textSecondary }]}>
                  Habits that reinforce your {primaryIdentity.label} identity
                </Text>
                {suggested.map((habit, idx) => (
                  <View key={idx} style={styles.suggestedRow}>
                    <View style={[styles.suggestedDot, { backgroundColor: primaryIdentity.color }]} />
                    <Text style={[styles.suggestedHabit, { color: theme.text }]}>{habit}</Text>
                  </View>
                ))}
              </Card>
            </Animated.View>
          )
        })()}

        {/* Affirmation */}
        {primaryIdentity && (
          <Animated.View entering={FadeInDown.delay(500).duration(600)}>
            <LinearGradient
              colors={[`${primaryIdentity.color}18`, `${primaryIdentity.color}05`]}
              style={[styles.affirmationCard, { borderColor: `${primaryIdentity.color}25` }]}
            >
              <Ionicons name="chatbubble-outline" size={20} color={`${primaryIdentity.color}80`} />
              <Text style={[styles.affirmationText, { color: theme.text }]}>
                You are becoming a{' '}
                <Text style={{ color: primaryIdentity.color, fontWeight: Typography.weights.bold }}>
                  {primaryIdentity.label.toLowerCase()}
                </Text>
                . Every habit you complete today is proof.
              </Text>
            </LinearGradient>
          </Animated.View>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>

      {/* Template picker modal */}
      <Modal
        visible={showTemplates}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTemplates(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTemplates(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: theme.surface }]} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Choose an Identity</Text>
              <TouchableOpacity onPress={() => setShowTemplates(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.templatesGrid} showsVerticalScrollIndicator={false}>
              {TEMPLATES.map(([key, template]) => {
                const alreadyAdded = identities.some((i) => i.label === template.label)
                const isAdding = addingTemplate === key
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.templateCard,
                      {
                        backgroundColor: alreadyAdded ? theme.surfaceHigh : `${template.color}15`,
                        borderColor: alreadyAdded ? theme.border : `${template.color}40`,
                        opacity: alreadyAdded ? 0.6 : 1,
                      },
                    ]}
                    onPress={() => !alreadyAdded && handleAddIdentity(key)}
                    disabled={alreadyAdded || isAdding}
                  >
                    <Text style={styles.templateIcon}>{template.icon}</Text>
                    <Text style={[styles.templateLabel, { color: theme.text }]}>{template.label}</Text>
                    <Text style={[styles.templateDesc, { color: theme.textMuted }]} numberOfLines={2}>
                      {template.description}
                    </Text>
                    {alreadyAdded && (
                      <View style={[styles.addedBadge, { backgroundColor: theme.border }]}>
                        <Ionicons name="checkmark" size={10} color={theme.textMuted} />
                      </View>
                    )}
                    {isAdding && (
                      <View style={[styles.addedBadge, { backgroundColor: template.color }]}>
                        <Ionicons name="sync" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  title: { fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.extrabold, marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.sizes.sm },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCard: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    borderRadius: Radius['2xl'],
    borderWidth: 1.5,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  primaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  primaryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  primaryBadgeText: { fontSize: 9, fontWeight: Typography.weights.bold, color: '#fff', letterSpacing: 1 },
  primaryIdentityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  primaryIcon: { fontSize: 40 },
  primaryLabel: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  primaryDesc: { fontSize: Typography.sizes.sm, marginTop: 2, lineHeight: 18 },
  scoreCircle: { alignItems: 'center' },
  scoreValue: { fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.extrabold },
  scoreLabel: { fontSize: Typography.sizes.xs, marginTop: -2 },
  primaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryStat: { alignItems: 'center', flex: 1 },
  primaryStatValue: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  primaryStatLabel: { fontSize: Typography.sizes.xs, marginTop: 2 },
  confidenceSection: { gap: 4 },
  confidenceLabel: { fontSize: Typography.sizes.xs },
  emptyPrimary: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyPrimaryTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  emptyPrimaryDesc: { fontSize: Typography.sizes.sm, textAlign: 'center', lineHeight: 20 },
  summaryCard: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  summaryIconWrap: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, letterSpacing: 1 },
  summaryText: { fontSize: Typography.sizes.base, lineHeight: 22, fontStyle: 'italic' },
  section: { paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.base },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.base,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.base,
    borderRadius: Radius.xl,
    marginBottom: Spacing.sm,
  },
  identityIcon: { fontSize: 28 },
  identityLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 2 },
  identityLabel: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  primaryPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  primaryPillText: { fontSize: 8, fontWeight: Typography.weights.bold, color: '#fff', letterSpacing: 0.8 },
  identityMeta: { fontSize: Typography.sizes.xs },
  identityActions: { flexDirection: 'row', gap: Spacing.xs },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedCard: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  suggestedDesc: { fontSize: Typography.sizes.xs, marginTop: -Spacing.xs },
  suggestedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  suggestedDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  suggestedHabit: { fontSize: Typography.sizes.sm },
  affirmationCard: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  affirmationText: {
    fontSize: Typography.sizes.base,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    maxHeight: '80%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.base,
    gap: Spacing.sm,
    paddingBottom: Spacing['4xl'],
  },
  templateCard: {
    width: '47%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.base,
    gap: 4,
    position: 'relative',
  },
  templateIcon: { fontSize: 24 },
  templateLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  templateDesc: { fontSize: Typography.sizes.xs, lineHeight: 16, color: '#999' },
  addedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
