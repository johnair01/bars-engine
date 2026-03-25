/**
 * Stamp quest-wizard-created BARs with Kotter grammar metadata when player picks a GM face move.
 * @see .specify/specs/kotter-quest-seed-grammar/spec.md
 */

import { composeKotterQuestSeedBar } from '@/lib/kotter-quest-seed-grammar'
import { resolveGmFaceStageMoveForComposition } from '@/lib/gm-face-stage-moves'
import type { AllyshipDomain } from '@/lib/kotter'

const VALID_DOMAINS: readonly AllyshipDomain[] = [
  'GATHERING_RESOURCES',
  'SKILLFUL_ORGANIZING',
  'RAISE_AWARENESS',
  'DIRECT_ACTION',
]

export type KotterWizardStampOk = {
  kotterStage: number
  gameMasterFace: string | null
  campaignGoalFromKotter: string
  hexagramId: number
  kotterCompletionEffects: Record<string, unknown>
}

export type KotterWizardStampResult = { error: string } | KotterWizardStampOk

/**
 * Validates move vs instance Kotter stage and returns composer fields to merge into the wizard BAR.
 * Wizard title/description are not replaced — only metadata + nested completion JSON.
 */
export function buildKotterStampForWizardQuest(input: {
  resolvedCampaignRef: string
  instanceKotterStage: number
  instanceAllyshipDomain: AllyshipDomain
  gmFaceMoveId: string
  /** Wizard-selected domain when set and valid; else instance domain. */
  wizardAllyshipDomain: string | null | undefined
  hexagramId: number
}): KotterWizardStampResult {
  const moveId = input.gmFaceMoveId.trim()
  if (!moveId) return { error: 'gmFaceMoveId required' }

  const stage = Math.max(1, Math.min(8, Math.round(input.instanceKotterStage)))
  if (!resolveGmFaceStageMoveForComposition(stage, moveId)) {
    return { error: 'Face move does not match this campaign’s current Kotter stage' }
  }

  const wiz = input.wizardAllyshipDomain as AllyshipDomain | undefined
  const domain =
    wiz && VALID_DOMAINS.includes(wiz) ? wiz : input.instanceAllyshipDomain

  const payload = composeKotterQuestSeedBar({
    campaignRef: input.resolvedCampaignRef,
    kotterStage: stage,
    allyshipDomain: domain,
    hexagramId: input.hexagramId,
    gmFaceMoveId: moveId,
    emotionalAlchemyTag: null,
    readingFace: null,
    portalTheme: null,
  })

  let kotterCompletionEffects: Record<string, unknown>
  try {
    kotterCompletionEffects = JSON.parse(payload.completionEffects) as Record<string, unknown>
  } catch {
    return { error: 'Invalid Kotter composer output' }
  }

  return {
    kotterStage: payload.kotterStage,
    gameMasterFace: payload.gameMasterFace,
    campaignGoalFromKotter: payload.campaignGoal,
    hexagramId: input.hexagramId,
    kotterCompletionEffects,
  }
}
