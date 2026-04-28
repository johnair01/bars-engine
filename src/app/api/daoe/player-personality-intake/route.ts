/**
 * DAOE Phase 3 FR3.3: POST /api/daoe/player-personality-intake
 *
 * Captures the player personality intake at onboarding.
 * Maps answers to PlayerPersonalityProfile + NpcToneWeights, stores in Campaign.personalityProfile.
 *
 * Input:  POST { campaignId: string, answers: PersonalityIntakeAnswers }
 * Output: { personalityProfile: PlayerPersonalityProfile, npcToneWeights: NpcToneWeights }
 *
 * Player sovereignty: profile reflects player developmental stage, never brand CEO voice.
 * See DAOE spec.md FR3.1–FR3.4.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { Prisma } from '@prisma/client'
import { mapIntakeToProfile } from '@/lib/daoe/personality-mapper'
import type { PersonalityIntakeAnswers } from '@/lib/daoe/types'

// ─── Input validation ──────────────────────────────────────────────────────────

const intakeSchema = {
  currentStage: ['wakeUp', 'cleanUp', 'growUp', 'showUp'],
  primaryAllyshipDomain: ['gathering_resources', 'direct_action', 'raise_awareness', 'skillful_organizing'],
  preferredGMFace: ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage'],
} as const

function validateAnswers(body: unknown): PersonalityIntakeAnswers | null {
  if (!body || typeof body !== 'object') return null
  const o = body as Record<string, unknown>

  const stage = o.currentStage as string
  const domain = o.primaryAllyshipDomain as string
  const face = o.preferredGMFace as string
  const itch = o.developmentalItch

  if (!intakeSchema.currentStage.includes(stage as any)) return null
  if (!intakeSchema.primaryAllyshipDomain.includes(domain as any)) return null
  if (!intakeSchema.preferredGMFace.includes(face as any)) return null
  if (typeof itch !== 'string' || itch.trim().length < 3) return null
  if (itch.trim().length > 500) return null

  return {
    currentStage: stage as PersonalityIntakeAnswers['currentStage'],
    primaryAllyshipDomain: domain as PersonalityIntakeAnswers['primaryAllyshipDomain'],
    developmentalItch: itch.trim(),
    preferredGMFace: face as PersonalityIntakeAnswers['preferredGMFace'],
  }
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  if (!playerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let json: Record<string, unknown>
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const campaignId = typeof json.campaignId === 'string' ? json.campaignId.trim() : ''
  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
  }

  const answers = validateAnswers(json.answers)
  if (!answers) {
    return NextResponse.json(
      { error: 'Invalid answers — must include currentStage, primaryAllyshipDomain, developmentalItch (3–500 chars), preferredGMFace' },
      { status: 400 }
    )
  }

  // Verify player is a member of this campaign
  const membership = await db.campaignMembership.findFirst({
    where: { campaignId, playerId },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this campaign' }, { status: 403 })
  }

  // Check campaign is not suspended (Phase 4 guard — runs even before Phase 4 migration)
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { suspendedAt: true },
  })
  if (campaign?.suspendedAt) {
    return NextResponse.json({ error: 'Campaign is suspended' }, { status: 423 })
  }

  // Map + produce
  const { profile, weights } = mapIntakeToProfile(answers, campaignId)

  // Upsert into Campaign.personalityProfile
  try {
    await db.campaign.update({
      where: { id: campaignId },
      data: { personalityProfile: profile as unknown as Prisma.InputJsonValue },
    })
  } catch (e) {
    console.error('[daoe/player-personality-intake] update failed:', e)
    return NextResponse.json({ error: 'Failed to store personality profile' }, { status: 500 })
  }

  return NextResponse.json({ personalityProfile: profile, npcToneWeights: weights }, { status: 200 })
}
