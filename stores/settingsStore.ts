import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

type ColorScheme = 'dark' | 'light' | 'system'

interface SettingsState {
  colorScheme: ColorScheme
  hapticEnabled: boolean
  soundEnabled: boolean
  focusModeEnabled: boolean
  grayscaleMode: boolean

  setColorScheme: (scheme: ColorScheme) => void
  setHapticEnabled: (enabled: boolean) => void
  setSoundEnabled: (enabled: boolean) => void
  setFocusModeEnabled: (enabled: boolean) => void
  setGrayscaleMode: (enabled: boolean) => void
  loadSettings: () => Promise<void>
}

const SETTINGS_KEY = '@atomic_habits_settings'

export const useSettingsStore = create<SettingsState>((set, get) => ({
  colorScheme: 'dark',
  hapticEnabled: true,
  soundEnabled: true,
  focusModeEnabled: false,
  grayscaleMode: false,

  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY)
      if (stored) {
        const settings = JSON.parse(stored)
        set(settings)
      }
    } catch {}
  },

  setColorScheme: (colorScheme) => {
    set({ colorScheme })
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...get(), colorScheme }))
  },

  setHapticEnabled: (hapticEnabled) => {
    set({ hapticEnabled })
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...get(), hapticEnabled }))
  },

  setSoundEnabled: (soundEnabled) => {
    set({ soundEnabled })
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...get(), soundEnabled }))
  },

  setFocusModeEnabled: (focusModeEnabled) => {
    set({ focusModeEnabled })
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...get(), focusModeEnabled }))
  },

  setGrayscaleMode: (grayscaleMode) => {
    set({ grayscaleMode })
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...get(), grayscaleMode }))
  },
}))
