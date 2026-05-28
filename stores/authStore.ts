import { create } from 'zustand'
import { authService } from '@/services/supabase/auth'
import { userService } from '@/services/supabase/user'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null

  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  loadUser: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  loadUser: async () => {
    try {
      set({ isLoading: true })
      const session = await authService.getSession()
      if (session?.user) {
        const profile = await userService.getProfile(session.user.id)
        set({
          user: profile,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false })
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  signIn: async (email, password) => {
    try {
      set({ isLoading: true, error: null })
      const { user } = await authService.signIn(email, password)
      if (user) {
        const profile = await userService.getProfile(user.id)
        set({ user: profile, isAuthenticated: true, isLoading: false })
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Sign in failed',
        isLoading: false,
      })
      throw err
    }
  },

  signUp: async (email, password, fullName) => {
    try {
      set({ isLoading: true, error: null })
      await authService.signUp(email, password, fullName)
      set({ isLoading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Sign up failed',
        isLoading: false,
      })
      throw err
    }
  },

  signOut: async () => {
    try {
      await authService.signOut()
      set({ user: null, isAuthenticated: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Sign out failed' })
    }
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return
    try {
      const updated = await userService.updateProfile(user.id, updates)
      set({ user: updated })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Update failed' })
      throw err
    }
  },

  clearError: () => set({ error: null }),
}))
