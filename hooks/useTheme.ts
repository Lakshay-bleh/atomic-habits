import { useColorScheme } from 'react-native'
import { useSettingsStore } from '@/stores/settingsStore'
import { DarkTheme, LightTheme, type AppTheme } from '@/constants/themes'

export function useTheme(): AppTheme {
  const systemScheme = useColorScheme()
  const { colorScheme } = useSettingsStore()

  const effectiveScheme =
    colorScheme === 'system' ? systemScheme : colorScheme

  return effectiveScheme === 'light' ? LightTheme : DarkTheme
}
