/**
 * BAR System v1 — Type definitions
 *
 * Spec: docs/architecture/bar-system-v1.md
 * API: docs/architecture/bar-system-api.md
 */

import type { AllyshipDomainKey } from '@/lib/allyship-domains'

export type BarDeckSuit = AllyshipDomainKey

export interface BarDeckCard {
  id: string
  deckId: string
  suit: BarDeckSuit
  rank: number
  promptTitle: string
  promptText: string
  shufflePower: boolean
  metadata: Record<string, unknown>
}

export interface BarBindingBar {
  id: string
  title: string
  description: string
  inputs?: string
  type?: string
  createdAt?: Date
  status?: string
  creator?: { name: string } | null
}

export interface BarBinding {
  id: string
  cardId: string
  barId: string
  authorActorId: string
  instanceId: string | null
  status: 'active' | 'removed' | 'archived'
  bar?: BarBindingBar
}

export interface BoundCard {
  card: BarDeckCard
  binding: BarBinding | null
  bar?: BarBindingBar
}

export interface ActorDeckState {
  actorId: string
  instanceId: string
  deckCardIds: string[]
  handCardIds: string[]
  discardCardIds: string[]
  lastDrawAt: Date | null
}

export interface CreatePersonalBarInput {
  authorActorId: string
  title: string
  summaryText: string
  barType: 'charge_capture' | 'insight' | 'vibe'
  campaignId?: string
  emotionChannel?: string
  chargeIntensity?: number
  visibility?: 'private' | 'campaign_visible' | 'public'
}
