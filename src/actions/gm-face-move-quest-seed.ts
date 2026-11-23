'use server'

/**
 * Phase B+: hub / landing — pick a GM face move → Kotter quest seed BAR in vault.
 * @see .specify/specs/kotter-quest-seed-grammar/spec.md
 */

import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import {
  clampCampaignAllyshipDomain,
  resolveCampaignInstanceForRef,
  resolvedCampaignRefFromRow,
} from '@/lib/campaign-instance-resolve'
import {
  parseGmFaceQuestAlchemyTag,
  parseGmFaceQuestReadingFace,
  persistGmFaceMoveQuestBar,
} from '@/lib/gm-face-move-quest-persist'

export type CreateGmFaceMoveQuestInput = {
  campaignRef: string
  gmFaceMoveId: string
  /** Hub default: 1. Landing should pass spoke hexagram. */
  hexagramId?: number
  portalTheme?: string | null
  emotionalAlchemyTag?: string | null
  readingFace?: string | null
}

export async function createGmFaceMoveQuestFromCampaign(
  input: CreateGmFaceMoveQuestInput,
): Promise<{ success: true; questId: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const inst = await resolveCampaignInstanceForRef(input.campaignRef)
  if (!inst) return { error: 'No campaign instance found' }

  const resolvedRef = resolvedCampaignRefFromRow(inst, input.campaignRef)
  const kotterStage = inst.kotterStage ?? 1
  // The domain is carried from the instance. If it has none, stop and ask rather than inventing Gather
  // (Wendell, 2026-11-20). persistGmFaceMoveQuestBar would refuse anyway; saying so here names the cause.
  const allyshipDomain = clampCampaignAllyshipDomain(inst.allyshipDomain)
  if (!allyshipDomain) {
    return {
      error:
        'This campaign instance has no domain set. Pick one (Gathering Resources, Direct Action, Raise ' +
        'Awareness, Skillful Organizing) before a quest can be created.',
    }
  }
  const hex =
    input.hexagramId != null
      ? Math.max(1, Math.min(64, Math.round(input.hexagramId)))
      : 1

  const result = await persistGmFaceMoveQuestBar({
    playerId: player.id,
    campaignRef: resolvedRef,
    kotterStage,
    allyshipDomain,
    hexagramId: hex,
    gmFaceMoveId: input.gmFaceMoveId,
    portalTheme: input.portalTheme ?? null,
    emotionalAlchemyTag: parseGmFaceQuestAlchemyTag(input.emotionalAlchemyTag ?? undefined),
    readingFace: parseGmFaceQuestReadingFace(input.readingFace ?? undefined),
    provenanceExtra: {
      source: 'gm-face-move-ui',
      createdAt: new Date().toISOString(),
    },
  })

  if ('error' in result && result.error) return result

  revalidatePath('/')
  revalidatePath('/vault')
  revalidatePath('/campaign/hub')
  revalidatePath('/campaign/landing')

  return result
}
