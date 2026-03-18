/**
 * Deck Templates — registry and types for starter deck composition.
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-5)
 *
 * Templates are TypeScript constants, not DB rows.
 * Import a starter file to register it: import '@/lib/deck-templates/starters/onboarding'
 */

import type { FaceKey, FaceMoveType } from '@/lib/move-grammar'

export type AllyshipDomain =
  | 'GATHERING_RESOURCES'
  | 'DIRECT_ACTION'
  | 'RAISE_AWARENESS'
  | 'SKILLFUL_ORGANIZING'

export type MoveType = 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'

export type DeckTemplateCategory = 'domain' | 'archetype' | 'nation' | 'onboarding'

export interface CardPlayEffect {
  type: 'charge_generate' | 'quest_unlock' | 'bar_create' | 'domain_shift' | 'face_activate'
  magnitude: number  // 1–5 intensity
  target: 'self' | 'community' | 'instance'
  questId?: string
  faceKey?: string
}

export interface CardSeedEntry {
  title: string
  bodyText: string
  faceKey: FaceKey | null
  /** Archetype key matching ArchetypeInfluenceProfile.archetype_id */
  archetypeKey: string | null
  /** Nation key matching NationFlavorProfile.nationKey */
  nationKey: string | null
  moveType: MoveType
  playCost: number
  playEffect: CardPlayEffect
  allyshipDomain: AllyshipDomain | null
  /** Optional face move type for grammar resolver */
  faceMoveType?: FaceMoveType | null
}

export interface DeckTemplate {
  key: string
  label: string
  category: DeckTemplateCategory
  cardSeed: CardSeedEntry[]
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const TEMPLATE_REGISTRY: DeckTemplate[] = []

export function registerTemplate(template: DeckTemplate): void {
  if (TEMPLATE_REGISTRY.some((t) => t.key === template.key)) return // idempotent
  TEMPLATE_REGISTRY.push(template)
}

export function getAllTemplates(): DeckTemplate[] {
  return [...TEMPLATE_REGISTRY]
}

export function getTemplateByKey(key: string): DeckTemplate | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.key === key)
}

export function getTemplatesByCategory(category: DeckTemplateCategory): DeckTemplate[] {
  return TEMPLATE_REGISTRY.filter((t) => t.category === category)
}
