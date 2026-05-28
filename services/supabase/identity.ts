import { supabase } from './client'
import type { Identity, IdentityEvolution } from '@/types'

export const identityService = {
  async getIdentities(userId: string): Promise<Identity[]> {
    const { data, error } = await supabase
      .from('identities')
      .select('*')
      .eq('user_id', userId)
      .order('score', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async createIdentity(
    identity: Omit<Identity, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Identity> {
    const { data, error } = await supabase
      .from('identities')
      .insert(identity)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateIdentityScore(
    id: string,
    score: number,
    confidence: number,
  ): Promise<Identity> {
    const { data, error } = await supabase
      .from('identities')
      .update({ score, confidence, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async reinforceIdentity(id: string): Promise<Identity> {
    const { data: current } = await supabase
      .from('identities')
      .select('score, confidence, streak, total_reinforcements')
      .eq('id', id)
      .single()

    if (!current) throw new Error('Identity not found')

    const newScore = Math.min(100, current.score + 2)
    const newConfidence = Math.min(100, current.confidence + 1)
    const newStreak = current.streak + 1
    const newTotal = current.total_reinforcements + 1

    const { data, error } = await supabase
      .from('identities')
      .update({
        score: newScore,
        confidence: newConfidence,
        streak: newStreak,
        total_reinforcements: newTotal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getEvolution(
    identityId: string,
    days = 30,
  ): Promise<IdentityEvolution[]> {
    const startDate = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000,
    ).toISOString()
    const { data, error } = await supabase
      .from('identity_evolution')
      .select('*')
      .eq('identity_id', identityId)
      .gte('created_at', startDate)
      .order('date', { ascending: true })
    if (error) throw error
    return data ?? []
  },
}
