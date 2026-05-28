import { useEffect } from 'react'
import { Redirect } from 'expo-router'
import { useAuthStore } from '@/stores/authStore'
import { View, ActivityIndicator } from 'react-native'
import { useTheme } from '@/hooks/useTheme'

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const theme = useTheme()

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    )
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />
  }

  if (isAuthenticated && !user?.onboarding_completed) {
    return <Redirect href="/onboarding/welcome" />
  }

  return <Redirect href="/(tabs)" />
}
