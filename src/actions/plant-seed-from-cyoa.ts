'use server'

/**
 * Campaign Hub/Spoke — Seed Planting
 *
 * plantSeedFromCyoa(playbookId)
 *   Reads a completed PlayerPlaybook and emits a new CustomBar with
 *   status='seed'.  The BAR is private to the player and carries full
 *   provenance back to the spoke CYOA session.
 *
 * The returned barId is the stable handle used by the water-mechanic
 * growth loop (see: campaign-seed-growth.ts, SeedGrowthCard.tsx).
 */

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export type PlantSeedResult =
  | { success: true; barId: string }
  | { error: string }

/**
 * Plant a seed BAR from a completed spoke CYOA PlayerPlaybook.
 *
 * Guards:
 *  - Player must be authenticated.
 *  - PlayerPlaybook must belong to the current player.
 *  - PlayerPlaybook must be marked completed (completedAt != null).
 *  - Idempotent: if this playbook already has a linked seed BAR it is
 *    returned without creating a duplicate.
 */
export async function plantSeedFromCyoa(
  playbookId: string,
): Promise<PlantSeedResult> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  // ── 1. Load the completed PlayerPlaybook ──────────────────────────────────
  const playbook = await db.playerPlaybook.findUnique({
    where: { id: playbookId },
    select: {
      id: true,
      playerId: true,
      adventureId: true,
      playbookName: true,
      playerAnswers: true,
      playbookMoves: true,
      playbookRole: true,
      spokeSessionId: true,
      completedAt: true,
      adventure: {
        select: {
          id: true,
          title: true,
          campaignRef: true,
          adventureType: true,
        },
      },
    },
  })

  if (!playbook) return { error: 'Playbook not found' }
  if (playbook.playerId !== player.id) return { error: 'Not your playbook' }
  if (!playbook.completedAt) return { error: 'Playbook is not yet complete' }

  // ── 2. Idempotency guard ───────────────────────────────────────────────────
  // If this spoke session already emitted a seed BAR, return it unchanged.
  if (playbook.spokeSessionId) {
    const existing = await db.customBar.findFirst({
      where: {
        spokeSessionId: playbook.spokeSessionId,
        creatorId: player.id,
        status: 'seed',
      },
      select: { id: true },
    })
    if (existing) return { success: true, barId: existing.id }
  }

  // ── 3. Resolve campaign context ───────────────────────────────────────────
  let campaignRef: string | null =
    playbook.adventure?.campaignRef?.trim() || null

  let allyshipDomain: string | null = null
  if (campaignRef) {
    const instance = await db.instance.findFirst({
      where: { OR: [{ campaignRef }, { slug: campaignRef }] },
      select: { allyshipDomain: true, primaryCampaignDomain: true },
    })
    allyshipDomain =
      instance?.allyshipDomain ?? instance?.primaryCampaignDomain ?? null
  }

  // ── 4. Derive title + description from playbook content ───────────────────
  const adventureTitle =
    playbook.adventure?.title?.trim() ||
    playbook.playbookName?.trim() ||
    'Spoke CYOA'

  const title = `Seed: ${adventureTitle}`

  // Pull the first discovery answer as the seed description if available
  let description = ''
  if (playbook.playerAnswers) {
    try {
      const parsed = JSON.parse(playbook.playerAnswers) as {
        discovery?: Array<{ qId: string; answer: string }>
        archetype?: Array<{ qId: string; answer: string }>
      }
      const firstAnswer =
        parsed.discovery?.[0]?.answer ?? parsed.archetype?.[0]?.answer
      if (firstAnswer) {
        description = String(firstAnswer).trim().slice(0, 500)
      }
    } catch {
      // ignore malformed JSON — description stays empty
    }
  }

  // ── 5. Create the seed BAR ─────────────────────────────────────────────────
  const agentMetadata = JSON.stringify({
    sourceType: 'spoke_cyoa_seed',
    playbookId: playbook.id,
    adventureId: playbook.adventureId ?? null,
    spokeSessionId: playbook.spokeSessionId ?? null,
    campaignRef,
    playbookRole: playbook.playbookRole ?? null,
    plantedAt: new Date().toISOString(),
  })

  let barId: string
  try {
    const bar = await db.customBar.create({
      data: {
        creatorId: player.id,
        claimedById: player.id,
        title,
        description,
        type: 'vibe',
        reward: 1,
        visibility: 'private',
        // KEY: status=seed marks this BAR as a planted seed awaiting watering
        status: 'seed',
        inputs: JSON.stringify([]),
        campaignRef,
        allyshipDomain,
        spokeSessionId: playbook.spokeSessionId ?? null,
        agentMetadata,
      },
      select: { id: true },
    })
    barId = bar.id
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create seed BAR'
    return { error: msg }
  }

  // ── 6. Append barId to SpokeSession.barSeedIds (best-effort) ─────────────
  if (playbook.spokeSessionId) {
    try {
      const session = await db.spokeSession.findUnique({
        where: { id: playbook.spokeSessionId },
        select: { barSeedIds: true },
      })
      if (session) {
        let ids: string[] = []
        try {
          ids = JSON.parse(session.barSeedIds) as string[]
        } catch {
          ids = []
        }
        if (!ids.includes(barId)) {
          ids.push(barId)
          await db.spokeSession.update({
            where: { id: playbook.spokeSessionId },
            data: { barSeedIds: JSON.stringify(ids) },
          })
        }
      }
    } catch {
      // Non-fatal: BAR is already created; session update is bookkeeping only
    }
  }

  // ── 7. Revalidate relevant paths ──────────────────────────────────────────
  revalidatePath('/', 'layout')
  revalidatePath('/bars')
  revalidatePath('/hand')
  revalidatePath('/campaign/hub')
  revalidatePath('/campaign/landing')

  return { success: true, barId }
}
