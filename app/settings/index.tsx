import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing, Radius } from '@/constants/themes'

type ColorScheme = 'dark' | 'light' | 'system'

const THEME_OPTIONS: { id: ColorScheme; label: string; icon: string }[] = [
  { id: 'dark', label: 'Dark', icon: 'moon' },
  { id: 'light', label: 'Light', icon: 'sunny' },
  { id: 'system', label: 'System', icon: 'phone-portrait-outline' },
]

export default function SettingsScreen() {
  const theme = useTheme()
  const { user, signOut, updateProfile } = useAuthStore()
  const {
    colorScheme,
    hapticEnabled,
    soundEnabled,
    focusModeEnabled,
    setColorScheme,
    setHapticEnabled,
    setSoundEnabled,
    setFocusModeEnabled,
  } = useSettingsStore()

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(user?.full_name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleSaveName = async () => {
    if (!nameInput.trim()) return
    setSavingName(true)
    try {
      await updateProfile({ full_name: nameInput.trim() })
      setEditingName(false)
    } catch {
      Alert.alert('Error', 'Failed to update name')
    } finally {
      setSavingName(false)
    }
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true)
          await signOut()
          router.replace('/(auth)/login' as never)
        },
      },
    ])
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PROFILE</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.profileRow}>
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarText}>
                  {((editingName ? nameInput : user?.full_name) ?? 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                {editingName ? (
                  <View style={styles.nameEditRow}>
                    <TextInput
                      style={[styles.nameInput, { color: theme.text, borderColor: theme.primary }]}
                      value={nameInput}
                      onChangeText={setNameInput}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleSaveName}
                    />
                    <TouchableOpacity onPress={handleSaveName} disabled={savingName}>
                      {savingName
                        ? <ActivityIndicator size="small" color={theme.primary} />
                        : <Ionicons name="checkmark" size={22} color={theme.primary} />
                      }
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setEditingName(false); setNameInput(user?.full_name ?? '') }}>
                      <Ionicons name="close" size={22} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.nameRow}>
                    <Text style={[styles.profileName, { color: theme.text }]}>
                      {user?.full_name ?? 'User'}
                    </Text>
                    <TouchableOpacity onPress={() => setEditingName(true)} style={{ padding: 4 }}>
                      <Ionicons name="pencil-outline" size={15} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}
                <Text style={[styles.profileEmail, { color: theme.textMuted }]}>
                  {user?.email ?? ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>APPEARANCE</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardInner}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Theme</Text>
              <View style={styles.themeRow}>
                {THEME_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.themeBtn,
                      {
                        backgroundColor: colorScheme === opt.id ? `${theme.primary}20` : theme.surfaceHigh,
                        borderColor: colorScheme === opt.id ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setColorScheme(opt.id as ColorScheme)}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={15}
                      color={colorScheme === opt.id ? theme.primary : theme.textMuted}
                    />
                    <Text style={[
                      styles.themeBtnLabel,
                      { color: colorScheme === opt.id ? theme.primary : theme.textMuted },
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PREFERENCES</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {[
              {
                label: 'Haptic Feedback',
                desc: undefined as string | undefined,
                icon: 'phone-portrait-outline',
                value: hapticEnabled,
                onChange: setHapticEnabled,
              },
              {
                label: 'Sound Effects',
                desc: undefined,
                icon: 'volume-medium-outline',
                value: soundEnabled,
                onChange: setSoundEnabled,
              },
              {
                label: 'Focus Mode',
                desc: 'Hides scores and streaks to reduce pressure',
                icon: 'eye-off-outline',
                value: focusModeEnabled,
                onChange: setFocusModeEnabled,
              },
            ].map((row, idx, arr) => (
              <View key={row.label}>
                <View style={styles.switchRow}>
                  <View style={[styles.iconWrap, { backgroundColor: `${theme.primary}15` }]}>
                    <Ionicons name={row.icon as any} size={16} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowLabel, { color: theme.text }]}>{row.label}</Text>
                    {row.desc && (
                      <Text style={[styles.rowDesc, { color: theme.textMuted }]}>{row.desc}</Text>
                    )}
                  </View>
                  <Switch
                    value={row.value}
                    onValueChange={row.onChange}
                    trackColor={{ true: theme.primary, false: theme.surfaceHigh }}
                    thumbColor="#fff"
                  />
                </View>
                {idx < arr.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>ABOUT</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {[
              { label: 'Version', value: '1.0.0' },
              { label: 'Built on', value: 'Atomic Habits framework' },
            ].map((row, idx, arr) => (
              <View key={row.label}>
                <View style={styles.infoRow}>
                  <Text style={[styles.rowLabel, { color: theme.text }]}>{row.label}</Text>
                  <Text style={[styles.infoValue, { color: theme.textMuted }]}>{row.value}</Text>
                </View>
                {idx < arr.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity
              style={styles.dangerRow}
              onPress={handleSignOut}
              disabled={signingOut}
            >
              <Ionicons name="log-out-outline" size={18} color={theme.error} />
              <Text style={[styles.dangerLabel, { color: theme.error }]}>
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: Spacing['4xl'] }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, padding: Spacing.xs },
  title: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  section: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.xl },
  sectionLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  card: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden' },
  cardInner: { padding: Spacing.base },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: '#fff' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  nameInput: { flex: 1, fontSize: Typography.sizes.base, borderBottomWidth: 1.5, paddingVertical: 2 },
  profileName: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  profileEmail: { fontSize: Typography.sizes.sm },
  rowLabel: { fontSize: Typography.sizes.base },
  rowDesc: { fontSize: Typography.sizes.xs, marginTop: 2, lineHeight: 16 },
  themeRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  themeBtnLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: Spacing['2xl'] + Spacing.md + 32 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
  },
  infoValue: { fontSize: Typography.sizes.sm },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
  },
  dangerLabel: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.medium },
})
