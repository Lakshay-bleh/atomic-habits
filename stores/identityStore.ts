import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { identityService } from '@/services/supabase/identity'
import { coachService } from '@/services/ai/coach'
import type { Identity } from '@/types'

const PRIMARY_KEY = '@atomic_habits_primary_identity'

interface IdentityState {
  identities: Identity[]
  primaryIdentity: Identity | null
  primaryIdentityId: string | null
  isLoading: boolean
  aiSummary: string | null
  aiSummaryLoading: boolean

  loadIdentities: (userId: string) => Promise<void>
  createIdentity: (identity: Omit<Identity, 'id' | 'created_at' | 'updated_at'>) => Promise<Identity>
  deleteIdentity: (id: string) => Promise<void>
  setPrimaryIdentity: (id: string) => Promise<void>
  reinforceIdentities: (habitIdentityIds: string[]) => Promise<void>
  loadAISummary: (habitTitles?: string[]) => Promise<void>
}

function resolvePrimary(identities: Identity[], preferredId: string | null): Identity | null {
  if (!identities.length) return null
  if (preferredId) {
    const found = identities.find((i) => i.id === preferredId)
    if (found) return found
  }
  return identities[0]
}

export const useIdentityStore = create<IdentityState>((set, get) => ({
  identities: [],
  primaryIdentity: null,
  primaryIdentityId: null,
  isLoading: false,
  aiSummary: null,
  aiSummaryLoading: false,

  loadIdentities: async (userId) => {
    try {
      set({ isLoading: true })
      const [identities, storedPrimary] = await Promise.all([
        identityService.getIdentities(userId),
        AsyncStorage.getItem(PRIMARY_KEY),
      ])
      const primaryIdentityId = storedPrimary ?? null
      set({
        identities,
        primaryIdentityId,
        primaryIdentity: resolvePrimary(identities, primaryIdentityId),
        isLoading: false,
      })
    } catch {
      set({ isLoading: false })
    }
  },

  createIdentity: async (identity) => {
    const created = await identityService.createIdentity(identity)
    set((state) => {
      const identities = [created, ...state.identities]
      const primaryIdentity = state.primaryIdentity ?? created
      const primaryIdentityId = state.primaryIdentityId ?? created.id
      if (!state.primaryIdentity) {
        AsyncStorage.setItem(PRIMARY_KEY, created.id)
      }
      return { identities, primaryIdentity, primaryIdentityId }
    })
    return created
  },

  deleteIdentity: async (id) => {
    await identityService.deleteIdentity(id)
    set((state) => {
      const identities = state.identities.filter((i) => i.id !== id)
      const primaryIdentityId = state.primaryIdentityId === id ? null : state.primaryIdentityId
      if (state.primaryIdentityId === id) AsyncStorage.removeItem(PRIMARY_KEY)
      return {
        identities,
        primaryIdentityId,
        primaryIdentity: resolvePrimary(identities, primaryIdentityId),
      }
    })
  },

  setPrimaryIdentity: async (id) => {
    await AsyncStorage.setItem(PRIMARY_KEY, id)
    set((state) => ({
      primaryIdentityId: id,
      primaryIdentity: resolvePrimary(state.identities, id),
    }))
  },

  reinforceIdentities: async (habitIdentityIds) => {
    const { identities } = get()
    const toReinforce = identities.filter((id) => habitIdentityIds.includes(id.id))
    const updated = await Promise.all(
      toReinforce.map((id) => identityService.reinforceIdentity(id.id)),
    )
    set((state) => {
      const identities = state.identities.map(
        (id) => updated.find((u) => u.id === id.id) ?? id,
      )
      return {
        identities,
        primaryIdentity: resolvePrimary(identities, state.primaryIdentityId),
      }
    })
  },

  loadAISummary: async (habitTitles = []) => {
    const { primaryIdentity } = get()
    if (!primaryIdentity) return
    set({ aiSummaryLoading: true })
    try {
      const summary = await coachService.getIdentitySummary(
        primaryIdentity.label,
        primaryIdentity.score,
        habitTitles,
        primaryIdentity.streak,
      )
      set({ aiSummary: summary, aiSummaryLoading: false })
    } catch {
      set({ aiSummaryLoading: false })
    }
  },
}))
