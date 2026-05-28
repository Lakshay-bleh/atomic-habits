import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import type { Habit } from '@/types'
import { coachService } from '@/services/ai/coach'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') return false

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('habits', {
        name: 'Habit Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
      })
    }

    return true
  },

  async scheduleHabitReminder(
    habit: Habit,
    identityLabel: string,
  ): Promise<string | null> {
    if (!habit.reminder_time) return null

    const [hours, minutes] = habit.reminder_time.split(':').map(Number)
    const hour = hours ?? 9
    const minute = minutes ?? 0

    const timeOfDay =
      hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

    let body: string
    try {
      body = await coachService.generateSmartNotification(
        habit.title,
        identityLabel,
        timeOfDay,
      )
    } catch {
      body = `Time for: ${habit.title}`
    }

    const trigger: Notifications.NotificationTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${identityLabel} →`,
        body,
        data: { habitId: habit.id },
        sound: true,
      },
      trigger,
    })

    return id
  },

  async cancelHabitReminder(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId)
  },

  async cancelAllReminders(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync()
  },

  async sendImmediateNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: null,
    })
  },

  async scheduleMorningReview(
    identityLabel: string,
    hour = 8,
    minute = 0,
  ): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: 'Good morning',
        body: `${identityLabel} — what are you doing today to become that person?`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    })
  },

  async scheduleEveningReview(hour = 21, minute = 0): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: 'Evening reflection',
        body: 'Take 2 minutes to reflect on who you became today.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    })
  },
}
