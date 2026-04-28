/**
 * DAOE Phase 5 FR5.2 / FR5.3: Personality Weigher — reads tone weights + applies them
 *
 * Reads NpcToneWeights from Campaign.personalityProfile (Phase 3 output).
 * Applies tone weights to NPC dialogue via template-based flavoring (no LLM).
 *
 * Design: template-based flavoring (18 variants, per spec Design Decisions).
 * Upgrade path to LLM preserved for DAOE-1.
 */

import { db } from '@/lib/db'
import type { NpcToneWeights } from '@/lib/daoe/types'

// --------------------------------------------------------------------------
// Tone weight flavoring — template-based (MVP, no LLM)
// --------------------------------------------------------------------------

/**
 * Face-specific tone prefixes. These prepend to NPC dialogue to establish
 * the GM face tone without naming the face directly.
 *
 * Each prefix is 1 sentence, warm, 2nd-person-capable. Matches the
 * FACE_SENTENCES style but scoped for NPC mentor voice.
 */
const TONE_PREFIXES: Record<keyof NpcToneWeights, string> = {
  shaman: 'Through the mythic lens:',
  challenger: 'From the edge:',
  regent: 'In proper order:',
  architect: 'Looking at the blueprint:',
  diplomat: 'From the relational field:',
  sage: 'Seen from the whole:',
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

/**
 * Get NpcToneWeights for a campaign.
 * Reads from Campaign.personalityProfile (set by Phase 3 intake).
 * Returns default weights if no profile has been completed yet.
 */
export async function getNpcToneWeights(campaignId: string): Promise<{
  weights: NpcToneWeights
  source: 'profile' | 'default'
}> {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { personalityProfile: true },
  })

  if (!campaign?.personalityProfile) {
    return { weights: DEFAULT_WEIGHTS, source: 'default' }
  }

  try {
    const profile = campaign.personalityProfile as {
      answers?: { preferredGMFace?: string }
    }
    const preferredFace = profile?.answers?.preferredGMFace
    if (!preferredFace) {
      return { weights: DEFAULT_WEIGHTS, source: 'default' }
    }

    const weights = deriveWeightsFromPreferredFace(preferredFace)
    return { weights, source: 'profile' }
  } catch {
    return { weights: DEFAULT_WEIGHTS, source: 'default' }
  }
}

/**
 * Apply tone weights to a base NPC text.
 *
 * MVP behavior (template-based):
 *   - Find the highest-weight face
 *   - Prepend the tone prefix for that face
 *   - Scale the prefix based on weight (1.0 = full prefix, 0.5 = half-weight)
 *
 * Upgrade path: replace with LLM-based blending for DAOE-1.
 *
 * @param baseText — the raw NPC dialogue text (2–4 sentences)
 * @param weights — the player's NpcToneWeights
 * @returns flavor-adjusted text with tone prefix prepended
 */
export function applyToneWeights(baseText: string, weights: NpcToneWeights): string {
  if (!baseText || baseText.trim().length === 0) {
    return baseText
  }

  const dominantFace = getDominantFace(weights)
  if (!dominantFace) {
    return baseText
  }

  const prefix = TONE_PREFIXES[dominantFace]
  if (!prefix) {
    return baseText
  }

  const weight = weights[dominantFace]
  // Below 0.5 weight, skip the prefix (too ambiguous)
  if (weight < 0.5) {
    return baseText
  }

  // Scale the prefix: full weight (1.0) → full prefix, half weight (0.5) → soft prefix
  // For now, we use the full prefix always (MVP). Future: vary intensity.
  const flavored = `${prefix} ${baseText.trim()}`
  return flavored
}

// --------------------------------------------------------------------------
// Internal helpers
// --------------------------------------------------------------------------

/** Default weights when no profile completed — sage anchored at 0.85. */
const DEFAULT_WEIGHTS: NpcToneWeights = {
  shaman: 0.4,
  challenger: 0.4,
  regent: 0.4,
  architect: 0.4,
  diplomat: 0.4,
  sage: 0.85,
}

type FaceKey = keyof NpcToneWeights

/** Find the face with the highest weight. Ties broken by face ordering. */
function getDominantFace(weights: NpcToneWeights): FaceKey | null {
  let maxWeight = 0
  let dominant: FaceKey | null = null

  for (const face of Object.keys(weights) as FaceKey[]) {
    if (weights[face] > maxWeight) {
      maxWeight = weights[face]
      dominant = face
    }
  }

  return dominant
}

/**
 * Derive NpcToneWeights from a preferred GM face.
 * Matches the mapping logic in personality-mapper.ts for consistency:
 *   - Preferred face → 1.0 (dominant)
 *   - Other faces → base 0.4
 *   - Stage secondary boost already applied at intake time (stored in profile)
 */
function deriveWeightsFromPreferredFace(preferredFace: string): NpcToneWeights {
  const base: NpcToneWeights = { ...DEFAULT_WEIGHTS }
  const faceKey = preferredFace as FaceKey

  if (faceKey in base) {
    base[faceKey] = 1.0
  }

  return base
}
