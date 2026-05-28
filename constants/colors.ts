export const Colors = {
  // Primary palette
  primary: '#4F46E5',      // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',

  // Accent
  accent: '#10B981',       // Emerald
  accentLight: '#34D399',
  accentDark: '#059669',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Dark theme (default)
  dark: {
    background: '#0A0A0F',
    surface: '#12121A',
    surfaceElevated: '#1A1A26',
    surfaceHigh: '#22223A',
    border: '#2A2A40',
    borderLight: '#363660',
    text: '#F8F8FF',
    textSecondary: '#9999BB',
    textMuted: '#555578',
    card: '#16162A',
  },

  // Light theme
  light: {
    background: '#F8F8FF',
    surface: '#FFFFFF',
    surfaceElevated: '#F0F0FF',
    surfaceHigh: '#E8E8FF',
    border: '#E0E0F0',
    borderLight: '#EBEBFF',
    text: '#0A0A1A',
    textSecondary: '#44447A',
    textMuted: '#9999BB',
    card: '#FFFFFF',
  },

  // Identity colors
  identities: {
    disciplined: '#4F46E5',
    healthy: '#10B981',
    focused: '#F59E0B',
    calm: '#06B6D4',
    athletic: '#EF4444',
    productive: '#8B5CF6',
    creative: '#EC4899',
    mindful: '#14B8A6',
  },

  // Gradients
  gradients: {
    primary: ['#4F46E5', '#7C3AED'],
    success: ['#10B981', '#059669'],
    energy: ['#F59E0B', '#EF4444'],
    calm: ['#06B6D4', '#3B82F6'],
    premium: ['#4F46E5', '#EC4899'],
    dark: ['#12121A', '#0A0A0F'],
    glass: ['rgba(79,70,229,0.15)', 'rgba(124,58,237,0.05)'],
  },
}

export type IdentityColor = keyof typeof Colors.identities
