/**
 * Move Grammar — resolveMoveSentence() and resolveCardBody()
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-4)
 *
 * Composes Nation × Face × Archetype grammar at render time.
 * No DB queries. Never throws — always returns a string.
 */

import { getBaseMove } from './base-moves'
import { getNationProfile } from './nation-profiles'
import { getArchetypeInfluenceProfile } from '@/lib/archetype-influence-overlay'
import type { FaceKey, FaceMoveType } from './index'

const FALLBACK_SENTENCE = 'A move from your inner work.'
const FALLBACK_BODY =
  'This card carries energy from your practice. Play it when the moment asks for the quality it holds.'

/**
 * Resolves a single move sentence by composing Nation × Face × Archetype layers.
 * Returns a fallback string when keys are null or unknown.
 */
export function resolveMoveSentence(
  faceKey: FaceKey | null,
  moveTypeKey: FaceMoveType | null,
  nationKey: string | null,
  archetypeKey: string | null
): string {
  if (!faceKey || !moveTypeKey) return FALLBACK_SENTENCE

  const base = getBaseMove(faceKey, moveTypeKey)
  if (!base) return FALLBACK_SENTENCE

  let sentence = base.templateSentence

  // Layer 1: Nation flavor — substitute NATION_REGISTER slot
  const nationInflection = (() => {
    if (!nationKey) return null
    const profile = getNationProfile(nationKey)
    if (!profile) return null
    // Use move-type-specific inflection if available, else use register
    return profile.moveTypeInflections[moveTypeKey] ?? profile.register
  })()

  sentence = sentence.replace(
    /\{NATION_REGISTER\}/g,
    nationInflection ?? 'the shared field'
  )

  // Fill remaining slots with neutral text so the sentence is always readable
  sentence = sentence
    .replace(/\{PLAYER\}/g, 'you')
    .replace(/\{ACTION\}/g, 'this move')
    .replace(/\{OUTCOME\}/g, 'what comes next')

  // Layer 2: Archetype flavor — append action_style as a brief suffix
  if (archetypeKey) {
    const profile = getArchetypeInfluenceProfile(archetypeKey)
    if (profile?.action_style[0]) {
      sentence = `${sentence} ${profile.action_style[0]}.`
    }
  }

  return sentence.trim()
}

/**
 * Resolves full card body text by composing Nation × Face × Archetype layers.
 * Uses the base move's defaultBody as the foundation.
 * Returns a fallback string when keys are null or unknown.
 */
export function resolveCardBody(
  faceKey: FaceKey | null,
  moveTypeKey: FaceMoveType | null,
  nationKey: string | null,
  archetypeKey: string | null
): string {
  if (!faceKey || !moveTypeKey) return FALLBACK_BODY

  const base = getBaseMove(faceKey, moveTypeKey)
  if (!base) return FALLBACK_BODY

  let body = base.defaultBody

  // Nation metaphor — append to body
  if (nationKey) {
    const profile = getNationProfile(nationKey)
    if (profile?.metaphorField) {
      body = `${body}\n\n${profile.metaphorField.charAt(0).toUpperCase() + profile.metaphorField.slice(1)}.`
    }
  }

  // Archetype reflection style — append as a closing line
  if (archetypeKey) {
    const profile = getArchetypeInfluenceProfile(archetypeKey)
    if (profile?.reflection_style[0]) {
      body = `${body} ${profile.reflection_style[0]}.`
    }
  }

  return body.trim()
}
