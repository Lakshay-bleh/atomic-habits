import * as Haptics from 'expo-haptics'
import { useSettingsStore } from '@/stores/settingsStore'

export function useHaptics() {
  const { hapticEnabled } = useSettingsStore()

  return {
    light: () => {
      if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    },
    medium: () => {
      if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    },
    heavy: () => {
      if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    },
    success: () => {
      if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    },
    error: () => {
      if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    },
  }
}
