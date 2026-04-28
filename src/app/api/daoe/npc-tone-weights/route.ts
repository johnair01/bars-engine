/**
 * DAOE Phase 5 FR5.1: GET /api/daoe/npc-tone-weights
 *
 * Returns NPC tone weights for a campaign — either from the player's
 * completed personality intake (profile), or from default weights.
 *
 * Input:  GET /api/daoe/npc-tone-weights?campaignId={id}
 * Output: { npcToneWeights: NpcToneWeights, source: 'profile' | 'default' }
 *
 * Used by NPC dialogue generation to flavor NPC voice based on the player's
 * preferred GM face (player-sovereign, not brand-sovereign).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { NpcToneWeights } from '@/lib/daoe/types'

// --------------------------------------------------------------------------
// Default weights (used when no intake has been completed)
// --------------------------------------------------------------------------

/** Default weights when player hasn't completed intake yet. */
const DEFAULT_NPC_TONE_WEIGHTS: NpcToneWeights = {
  shaman: 0.4,
  challenger: 0.4,
  regent: 0.4,
  architect: 0.4,
  diplomat: 0.4,
  sage: 0.85, // sage boosted as universal default anchor
}

// --------------------------------------------------------------------------
// Route handler
// --------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get('campaignId')

  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
  }

  // Fetch campaign with personalityProfile
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { personalityProfile: true },
  })

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // Try to extract npcToneWeights from stored profile
  let npcToneWeights: NpcToneWeights = DEFAULT_NPC_TONE_WEIGHTS
  let source: 'profile' | 'default' = 'default'

  if (campaign.personalityProfile) {
    try {
      const profile = campaign.personalityProfile as {
        answers?: { preferredGMFace?: string }
      }
      // Personality profile exists — extract preferred face and derive weights
      // The profile itself is PlayerPersonalityProfile; we derive weights from the preferred face
      // For simplicity, reconstruct from the stored profile using the same mapping logic
      const preferredFace = profile?.answers?.preferredGMFace

      if (preferredFace) {
        npcToneWeights = deriveWeightsFromPreferredFace(preferredFace)
        source = 'profile'
      }
    } catch {
      // Fall through to defaults
      source = 'default'
    }
  }

  return NextResponse.json({ npcToneWeights, source }, { status: 200 })
}

// --------------------------------------------------------------------------
// Weight derivation
// --------------------------------------------------------------------------

/**
 * Derive NpcToneWeights from a preferred GM face.
 * Mirrors the mapping logic from personality-mapper.ts so the weights
 * are consistent whether computed at intake time or at NPC dialogue time.
 */
function deriveWeightsFromPreferredFace(preferredFace: string): NpcToneWeights {
  const base: NpcToneWeights = { ...DEFAULT_NPC_TONE_WEIGHTS }

  // Boost the preferred face to 1.0, normalize others proportionally
  const faceKey = preferredFace as keyof NpcToneWeights
  if (faceKey in base) {
    base[faceKey] = 1.0

    // Normalize others to sum meaningfully (preferred gets max, others stay at base 0.4)
    // This keeps the preferred face clearly dominant
    for (const k of Object.keys(base) as (keyof NpcToneWeights)[]) {
      if (k !== faceKey) {
        // leave others at 0.4 — preferred face is clearly dominant at 1.0
      }
    }
  }

  return base
}
