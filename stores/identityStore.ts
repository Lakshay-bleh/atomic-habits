import { create } from 'zustand'
import { identityService } from '@/services/supabase/identity'
import { coachService } from '@/services/ai/coach'
import type { Identity } from '@/types'

interface IdentityState {
  identities: Identity[]
  primaryIdentity: Identity | null
  isLoading: boolean
  aiSummary: string | null

  loadIdentities: (userId: string) => Promise<void>
  createIdentity: (identity: Omit<Identity, 'id' | 'created_at' | 'updated_at'>) => Promise<Identity>
  reinforceIdentities: (habitIdentityIds: string[]) => Promise<void>
  loadAISummary: () => Promise<void>
}

export const useIdentityStore = create<IdentityState>((set, get) => ({
  identities: [],
  primaryIdentity: null,
  isLoading: false,
  aiSummary: null,

  loadIdentities: async (userId) => {
    try {
      set({ isLoading: true })
      const identities = await identityService.getIdentities(userId)
      set({
        identities,
        primaryIdentity: identities[0] ?? null,
        isLoading: false,
      })
    } catch {
      set({ isLoading: false })
    }
  },

  createIdentity: async (identity) => {
    const created = await identityService.createIdentity(identity)
    set((state) => ({
      identities: [created, ...state.identities],
      primaryIdentity: state.primaryIdentity ?? created,
    }))
    return created
  },

  reinforceIdentities: async (habitIdentityIds) => {
    const { identities } = get()
    const toReinforce = identities.filter((id) =>
      habitIdentityIds.includes(id.id),
    )

    const updated = await Promise.all(
      toReinforce.map((id) => identityService.reinforceIdentity(id.id)),
    )

    set((state) => ({
      identities: state.identities.map(
        (id) => updated.find((u) => u.id === id.id) ?? id,
      ),
    }))
  },

  loadAISummary: async () => {
    const { primaryIdentity } = get()
    if (!primaryIdentity) return

    try {
      const summary = await coachService.getIdentitySummary(
        primaryIdentity.label,
        primaryIdentity.score,
        [],
        primaryIdentity.streak,
      )
      set({ aiSummary: summary })
    } catch {}
  },
}))
