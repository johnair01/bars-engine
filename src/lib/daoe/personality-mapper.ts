/**
 * DAOE Phase 3 — Personality mapper
 * Maps player personality intake answers to NPC tone weights.
 *
 * The player fills a 4-question intake at onboarding.
 * Their preferred GM face becomes the primary voice for NPC mentors.
 * This replaces the Brand Ego Profile proposal — player-sovereign, not brand-sovereign.
 *
 * Design: simple weighted override.
 * If preferredFace = 'challenger', challenger weight → 0.8, others → 0.4 baseline.
 * The 6 GM faces serve as NPC archetypes; the preferred face biases dialogue flavoring.
 */

import type { GameMasterFace, PersonalityIntakeAnswers } from './types'

export interface NpcToneWeights {
  shaman: number
  challenger: number
  regent: number
  architect: number
  diplomat: number
  sage: number
}

export interface PlayerPersonalityProfile {
  campaignId: string
  intakeCompletedAt: string
  derivedAltitude: string
  answers: PersonalityIntakeAnswers
}

/**
 * Map a player's intake answers to NPC tone weights.
 *
 * @param answers - The 4-field intake form
 * @param campaignId - Campaign this profile belongs to
 * @returns NpcToneWeights + PlayerPersonalityProfile (for DB storage)
 */
export function mapIntakeToProfile(
  answers: PersonalityIntakeAnswers,
  campaignId: string,
): { profile: PlayerPersonalityProfile; weights: NpcToneWeights } {
  const base: NpcToneWeights = {
    shaman: 0.4,
    challenger: 0.4,
    regent: 0.4,
    architect: 0.4,
    diplomat: 0.4,
    sage: 0.4,
  }

  // Boost the preferred face
  base[answers.preferredGMFace] = 0.85

  // Stage-based secondary boost
  const stageBoost: Record<PersonalityIntakeAnswers['currentStage'], Partial<NpcToneWeights>> = {
    wakeUp: { shaman: 0.6 },    // Seeing more → Shaman
    cleanUp: { challenger: 0.6 }, // Breaking open → Challenger
    growUp: { architect: 0.6 },  // Building capacity → Architect
    showUp: { diplomat: 0.6 },    // Connecting → Diplomat
  }

  const boost = stageBoost[answers.currentStage]
  for (const [face, weight] of Object.entries(boost)) {
    // Take the higher of base or stage-boost
    const current = base[face as GameMasterFace] ?? 0
    base[face as GameMasterFace] = Math.max(current, weight as number)
  }

  // Normalize so max is 1.0 (only the preferred face hits 1.0)
  const max = Math.max(...Object.values(base))
  if (max > 1.0) {
    for (const face of Object.keys(base)) {
      base[face as GameMasterFace] = Number((base[face as GameMasterFace] / max).toFixed(2))
    }
  }

  // Altitude from preferred GM face
  const altitudeMap: Record<GameMasterFace, string> = {
    shaman: 'survival/instinct',
    challenger: 'socialized_power',
    regent: 'mythic_order',
    architect: 'strategic_design',
    diplomat: 'pluralistic_relating',
    sage: 'integral_synthesis',
  }

  const profile: PlayerPersonalityProfile = {
    campaignId,
    intakeCompletedAt: new Date().toISOString(),
    derivedAltitude: altitudeMap[answers.preferredGMFace],
    answers,
  }

  return { profile, weights: base }
}