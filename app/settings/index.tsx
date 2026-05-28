import React from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing, Radius } from '@/constants/themes'

export default function SettingsScreen() {
  const theme = useTheme()
  const { user, signOut } = useAuthStore()

  const handleSignOut = async () => {
    await signOut()
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>
                {(user?.full_name ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: theme.text }]}>
                {user?.full_name ?? 'User'}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>
                {user?.email ?? ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={[styles.dangerRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={[styles.dangerText]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing['3xl'] }} />
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
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  section: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.base,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  profileName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  profileEmail: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  dangerRow: {
    marginHorizontal: Spacing['2xl'],
    borderRadius: Radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  dangerText: {
    color: '#EF4444',
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
})
