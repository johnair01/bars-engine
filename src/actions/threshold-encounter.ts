'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { extractArtifactsFromProse } from '@/lib/threshold-encounter/parse-storydata'

async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

export async function completeThresholdEncounter(encounterId: string) {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  const encounter = await db.thresholdEncounter.findUnique({
    where: { id: encounterId },
  })
  if (!encounter || encounter.playerId !== playerId) return { error: 'Not found' }

  // Extract declared artifacts from twee source
  const declared = extractArtifactsFromProse(encounter.tweeSource)

  await db.thresholdEncounter.update({
    where: { id: encounterId },
    data: { status: 'archived', completedAt: new Date() },
  })

  return { success: true, declaredArtifacts: declared }
}

export async function submitBarCandidate(encounterId: string, summary: string) {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  const encounter = await db.thresholdEncounter.findUnique({
    where: { id: encounterId },
  })
  if (!encounter || encounter.playerId !== playerId) return { error: 'Not found' }

  const artifact = await db.thresholdEncounterArtifact.create({
    data: {
      encounterId,
      type: 'bar_candidate',
      payload: JSON.stringify({ summary, submittedBy: playerId, encounterId }),
    },
  })

  return { success: true, artifactId: artifact.id }
}

export async function promoteBarCandidate(artifactId: string, promotedType: 'BAR' | 'quest_hook') {
  // Admin/GM only — caller must verify role
  await db.thresholdEncounterArtifact.update({
    where: { id: artifactId },
    data: { promoted: true, promotedAt: new Date(), type: promotedType },
  })
  return { success: true }
}

export async function linkCheckInToEncounter(encounterId: string) {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }
  const date = new Date().toISOString().slice(0, 10)
  await db.alchemyCheckIn.updateMany({
    where: { playerId, date },
    data: { thresholdEncounterId: encounterId },
  })
  return { success: true }
}
