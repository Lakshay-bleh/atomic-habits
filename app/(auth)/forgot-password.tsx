import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { authService } from '@/services/supabase/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing } from '@/constants/themes'

const schema = z.object({
  email: z.string().email('Invalid email address'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordScreen() {
  const theme = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      await authService.resetPassword(data.email)
      setSent(true)
    } catch {} finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Button
          title="Back"
          variant="ghost"
          onPress={() => router.back()}
          style={styles.backButton}
          icon={<Ionicons name="arrow-back" size={18} color={theme.primary} />}
        />

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Reset password
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            We'll send you a link to reset your password
          </Text>
        </View>

        {sent ? (
          <View style={styles.successBox}>
            <Text style={styles.successIcon}>✉️</Text>
            <Text style={[styles.successTitle, { color: theme.text }]}>
              Check your inbox
            </Text>
            <Text style={[styles.successText, { color: theme.textSecondary }]}>
              We sent a reset link to your email. Check your spam folder if you
              don't see it.
            </Text>
            <Button
              title="Back to Sign In"
              onPress={() => router.replace('/(auth)/login')}
              fullWidth
              style={{ marginTop: Spacing.xl }}
            />
          </View>
        ) : (
          <>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  placeholder="your@email.com"
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail-outline"
                  error={errors.email?.message}
                />
              )}
            />
            <Button
              title="Send Reset Link"
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
              fullWidth
              style={{ marginTop: Spacing.base }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.base,
  },
  backButton: { alignSelf: 'flex-start', marginBottom: Spacing.xl },
  header: { marginBottom: Spacing['2xl'] },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.extrabold,
    marginBottom: Spacing.xs,
  },
  subtitle: { fontSize: Typography.sizes.base },
  successBox: { alignItems: 'center', marginTop: Spacing['3xl'] },
  successIcon: { fontSize: 48, marginBottom: Spacing.base },
  successTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
  },
  successText: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    lineHeight: 24,
  },
})
